import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const catalogPath = process.argv[2] ?? 'api/Games/gamesMeta.json';
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const fail = (message) => assert.fail(`${catalogPath}: ${message}`);
const isHttps = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
};
const onlyKeys = (value, allowed, at) => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${at}.${key} is not supported`);
  }
};

onlyKeys(catalog, ['schemaVersion', 'games'], 'catalog');
assert.equal(catalog.schemaVersion, 1, `${catalogPath}: schemaVersion must be 1`);
assert.ok(Array.isArray(catalog.games), `${catalogPath}: games must be an array`);
assert.ok(catalog.games.length <= 500, `${catalogPath}: games must contain no more than 500 entries`);

const ids = new Set();
for (const [index, game] of catalog.games.entries()) {
  const at = `games[${index}]`;
  if (!game || typeof game !== 'object') fail(`${at} must be an object`);
  onlyKeys(game, [
    'id', 'name', 'description', 'version', 'developer', 'destination', 'genres', 'orientation',
    'minimumAge', 'estimatedDownloadMb', 'status', 'source'
  ], at);

  for (const field of ['id', 'name', 'description', 'version', 'orientation', 'status']) {
    if (typeof game[field] !== 'string' || !game[field].trim()) fail(`${at}.${field} is required`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id)) fail(`${at}.id must be a lowercase slug`);
  if (game.id.length < 3 || game.id.length > 80) fail(`${at}.id must contain 3 to 80 characters`);
  if (ids.has(game.id)) fail(`${at}.id duplicates ${game.id}`);
  ids.add(game.id);

  if (!/^\d+\.\d+\.\d+$/.test(game.version)) fail(`${at}.version must use x.y.z`);
  if (game.name.length > 80) fail(`${at}.name must be 80 characters or fewer`);
  if (game.description.length < 10 || game.description.length > 240) {
    fail(`${at}.description must contain 10 to 240 characters`);
  }
  if (!['portrait', 'landscape', 'any'].includes(game.orientation)) fail(`${at}.orientation is invalid`);
  if (!['active', 'hidden'].includes(game.status)) fail(`${at}.status is invalid`);
  if (!Number.isInteger(game.minimumAge) || game.minimumAge < 4 || game.minimumAge > 18) {
    fail(`${at}.minimumAge must be an integer from 4 to 18`);
  }
  if (typeof game.estimatedDownloadMb !== 'number' || game.estimatedDownloadMb <= 0 || game.estimatedDownloadMb > 50) {
    fail(`${at}.estimatedDownloadMb must be greater than 0 and no more than 50`);
  }
  if (!Array.isArray(game.genres) || game.genres.length < 1 || game.genres.length > 5) {
    fail(`${at}.genres must contain 1 to 5 values`);
  }
  if (new Set(game.genres).size !== game.genres.length || game.genres.some(genre => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(genre))) {
    fail(`${at}.genres must be unique lowercase slugs`);
  }
  if (!game.developer || typeof game.developer !== 'object') fail(`${at}.developer is required`);
  onlyKeys(game.developer, ['name', 'url'], `${at}.developer`);
  if (typeof game.developer.name !== 'string' || !game.developer.name.trim() || game.developer.name.length > 80 || !isHttps(game.developer.url)) {
    fail(`${at}.developer requires name and HTTPS url`);
  }
  if (!game.destination || typeof game.destination !== 'object') fail(`${at}.destination is required`);
  onlyKeys(game.destination, ['url', 'label', 'platform'], `${at}.destination`);
  if (!isHttps(game.destination.url) || !['wishlist', 'download', 'buy', 'follow'].includes(game.destination.label)) {
    fail(`${at}.destination requires an HTTPS url and a supported label`);
  }
  if (typeof game.destination.platform !== 'string' || !game.destination.platform.trim() || game.destination.platform.length > 40) {
    fail(`${at}.destination.platform must contain 1 to 40 characters`);
  }

  if (game.source?.type === 'hosted-page') {
    onlyKeys(game.source, ['type', 'url'], `${at}.source`);
    if (!isHttps(game.source.url)) fail(`${at}.source.url must use HTTPS`);
  } else if (game.source?.type === 'managed-unity') {
    onlyKeys(game.source, ['type', 'gameId'], `${at}.source`);
    if (!/^[A-Za-z0-9_-]+$/.test(game.source.gameId ?? '')) fail(`${at}.source.gameId is invalid`);
  } else {
    fail(`${at}.source.type must be hosted-page or managed-unity`);
  }
}

console.log(`Valid catalog: ${catalog.games.length} games`);
