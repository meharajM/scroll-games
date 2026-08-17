import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = Number(process.argv[process.argv.indexOf('--port') + 1]) || 3010;
const gamePort = port + 1;
const hostedGame = (name) => `<!doctype html>
<html lang="en"><body>
  <h1>${name}</h1>
  <button id="play" type="button">Tap to play</button>
  <output id="count">Pointer count: 0</output>
  <script>
    let count = 0;
    document.querySelector('#play').addEventListener('click', () => {
      count += 1;
      document.querySelector('#count').textContent = 'Pointer count: ' + count;
      fetch('/interactions?game=' + encodeURIComponent('${name}'), { method: 'POST' }).catch(() => {});
    });
    window.setTimeout(() => {
      window.parent.postMessage({ type: 'scroll-games:ready', version: 1 }, '*');
    }, 25);
  </script>
</body></html>`;

const catalog = {
  schemaVersion: 1,
  games: [
    {
      id: 'stone-skipper', name: 'Stone Skipper', description: 'Fixture game one', version: '1.0.0',
      developer: { name: 'Scroll Games', url: 'https://example.test' }, genres: ['puzzle'], orientation: 'any',
      destination: { url: 'https://example.test/stone-skipper', label: 'wishlist', platform: 'Example Store' },
      minimumAge: 4, estimatedDownloadMb: 1, status: 'active',
      source: { type: 'hosted-page', url: `https://127.0.0.1:${gamePort}/games/stone-skipper.html` },
    },
    {
      id: 'hidden-game', name: 'Hidden Fixture', description: 'Must not render', version: '1.0.0',
      developer: { name: 'Scroll Games', url: 'https://example.test' }, genres: ['puzzle'], orientation: 'any',
      destination: { url: 'https://example.test/hidden-game', label: 'follow', platform: 'Example Store' },
      minimumAge: 4, estimatedDownloadMb: 1, status: 'hidden',
      source: { type: 'hosted-page', url: `https://127.0.0.1:${gamePort}/games/hidden.html` },
    },
    {
      id: 'orbit-drift', name: 'Orbit Drift', description: 'Fixture game two', version: '1.0.0',
      developer: { name: 'Scroll Games', url: 'https://example.test' }, genres: ['arcade'], orientation: 'any',
      destination: { url: 'https://example.test/orbit-drift', label: 'download', platform: 'Example Store' },
      minimumAge: 4, estimatedDownloadMb: 1, status: 'active',
      source: { type: 'hosted-page', url: `https://127.0.0.1:${gamePort}/games/orbit-drift.html` },
    },
  ],
};

const respond = (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200).end('ok');
  } else if (request.url === '/api/gamesMeta') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(catalog));
  } else if (request.url === '/games/stone-skipper.html') {
    response.writeHead(200, { 'content-type': 'text/html' }).end(hostedGame('Stone Skipper'));
  } else if (request.url === '/games/orbit-drift.html') {
    response.writeHead(200, { 'content-type': 'text/html' }).end(hostedGame('Orbit Drift'));
  } else if (request.url === '/api/reports' && request.method === 'POST') {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try {
        const report = JSON.parse(body);
        if (report.gameId !== 'stone-skipper' || typeof report.reason !== 'string' || typeof report.details !== 'string') throw new Error();
        response.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify({ reportId: 'fixture-report-1' }));
      } catch {
        response.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Invalid fixture report' }));
      }
    });
  } else if (request.url?.startsWith('/interactions?')) {
    response.writeHead(204, { 'access-control-allow-origin': '*' }).end();
  } else {
    response.writeHead(404).end();
  }
};

const certificateDirectory = mkdtempSync(join(tmpdir(), 'scroll-games-e2e-'));
const keyPath = join(certificateDirectory, 'localhost-key.pem');
const certificatePath = join(certificateDirectory, 'localhost-cert.pem');
execFileSync('openssl', [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
  '-keyout', keyPath, '-out', certificatePath, '-subj', '/CN=127.0.0.1',
  '-addext', 'subjectAltName=IP:127.0.0.1',
], { stdio: 'ignore' });
process.on('exit', () => rmSync(certificateDirectory, { recursive: true, force: true }));

createServer(respond).listen(port, '127.0.0.1');
createSecureServer({
  key: readFileSync(keyPath),
  cert: readFileSync(certificatePath),
}, respond).listen(gamePort, '127.0.0.1');
