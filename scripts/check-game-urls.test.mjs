import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  checkUrl,
  parseSubmissionUrl,
  responseError,
  resolvePublicAddresses,
  unsafeIpReason
} from './check-game-urls.mjs';

test('blocks private, loopback, link-local, metadata, and mapped private addresses', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1']) {
    assert.ok(unsafeIpReason(address), address);
  }
  assert.equal(unsafeIpReason('8.8.8.8'), null);
  assert.equal(unsafeIpReason('2606:4700:4700::1111'), null);
});

test('requires HTTPS unless an explicit local-test override is passed', async () => {
  assert.throws(() => parseSubmissionUrl('http://127.0.0.1:8080'), /HTTPS/);
  assert.equal(parseSubmissionUrl('http://127.0.0.1:8080', { allowUnsafeTestUrls: true }).protocol, 'http:');
  await assert.rejects(
    resolvePublicAddresses(new URL('https://example.test'), { lookup: async () => [{ address: '127.0.0.1', family: 4 }] }),
    /blocked/
  );
});

test('rejects non-HTML and embedding-blocking headers', () => {
  assert.equal(responseError({ statusCode: 200, headers: { 'content-type': 'text/html' } }), null);
  assert.match(responseError({ statusCode: 200, headers: { 'content-type': 'application/json' } }), /HTML/);
  assert.match(responseError({ statusCode: 200, headers: { 'content-type': 'text/html', 'x-frame-options': 'DENY' } }), /X-Frame-Options/);
  assert.match(responseError({ statusCode: 200, headers: { 'content-type': 'text/html', 'content-security-policy': "frame-ancestors 'self'" } }), /frame-ancestors/);
  assert.equal(responseError({ statusCode: 200, headers: { 'content-type': 'text/html', 'content-security-policy': 'frame-ancestors *' } }), null);
});

test('checks a local fixture only with the explicit unsafe test override', async (t) => {
  const server = createServer((request, response) => {
    if (request.url === '/first') {
      response.writeHead(302, { location: '/second' });
      response.end();
      return;
    }
    if (request.url === '/second') {
      response.writeHead(302, { location: '/third' });
      response.end();
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': 'frame-ancestors *' });
    response.end('<!doctype html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const result = await checkUrl(`http://127.0.0.1:${port}/`, { allowUnsafeTestUrls: true });
  assert.equal(result.redirects, 0);
  await assert.rejects(
    checkUrl(`http://127.0.0.1:${port}/first`, { allowUnsafeTestUrls: true, maxRedirects: 1 }),
    /too many redirects/
  );
});
