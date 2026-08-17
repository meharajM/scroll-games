import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

test('serves the catalog, applies the origin allowlist, and rejects unsafe game IDs', async (t) => {
  process.env.NODE_ENV = 'test';
  delete process.env.VERCEL;
  const { default: app } = await import('./index.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const catalog = await fetch(`${base}/api/gamesMeta`, {
    headers: { Origin: 'capacitor://localhost' }
  });
  assert.equal(catalog.status, 200);
  assert.equal(catalog.headers.get('access-control-allow-origin'), 'capacitor://localhost');
  assert.equal((await catalog.json()).schemaVersion, 1);

  const untrustedOrigin = await fetch(`${base}/api/gamesMeta`, {
    headers: { Origin: 'https://attacker.example' }
  });
  assert.equal(untrustedOrigin.status, 200);
  assert.equal(untrustedOrigin.headers.get('access-control-allow-origin'), null);

  const invalidGame = await fetch(`${base}/api/getSignedUrls/not%20safe`);
  assert.equal(invalidGame.status, 400);
  const unknownGame = await fetch(`${base}/api/getSignedUrls/not-listed`);
  assert.equal(unknownGame.status, 404);

  const invalidReport = await fetch(`${base}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId: 'game-12', reason: 'Other', details: 'short' })
  });
  assert.equal(invalidReport.status, 400);

  const unconfiguredReport = await fetch(`${base}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId: 'game-12', reason: 'Broken game', details: 'The game remains blank after retrying.' })
  });
  assert.equal(unconfiguredReport.status, 503);

  let acceptDelivery;
  const delivered = new Promise(resolve => { acceptDelivery = resolve; });
  const webhook = createServer((request, response) => {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      acceptDelivery({ authorization: request.headers.authorization, body: JSON.parse(body) });
      response.writeHead(204).end();
    });
  });
  webhook.listen(0, '127.0.0.1');
  await new Promise(resolve => webhook.once('listening', resolve));
  t.after(() => webhook.close());
  process.env.REPORT_WEBHOOK_URL = `http://127.0.0.1:${webhook.address().port}`;
  process.env.REPORT_WEBHOOK_TOKEN = 'test-token';
  t.after(() => {
    delete process.env.REPORT_WEBHOOK_URL;
    delete process.env.REPORT_WEBHOOK_TOKEN;
  });

  const acceptedReport = await fetch(`${base}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId: 'game-12', reason: 'Broken game', details: 'The game remains blank after retrying.' })
  });
  assert.equal(acceptedReport.status, 202);
  assert.match((await acceptedReport.json()).reportId, /^[0-9a-f-]{36}$/);
  const delivery = await delivered;
  assert.equal(delivery.authorization, 'Bearer test-token');
  assert.equal(delivery.body.gameId, 'game-12');
});
