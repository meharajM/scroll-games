import { readFile } from 'node:fs/promises';
import { lookup as dnsLookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_REDIRECTS = 3;
export const DEFAULT_FRAME_ORIGIN = 'https://scroll-games.vercel.app';

const cleanIp = (value) => value.replace(/^\[|\]$/g, '').toLowerCase();
const ipv4Bytes = (value) => value.split('.').map(Number);

function ipv6Parts(value) {
  const address = cleanIp(value);
  const v4At = address.lastIndexOf(':');
  const withV4Parts = address.includes('.')
    ? `${address.slice(0, v4At + 1)}${ipv4Bytes(address.slice(v4At + 1)).map((byte, index) =>
      index % 2 ? '' : ((byte << 8) + ipv4Bytes(address.slice(v4At + 1))[index + 1]).toString(16)
    ).filter(Boolean).join(':')}`
    : address;
  const [left = '', right = ''] = withV4Parts.split('::');
  const leftParts = left ? left.split(':') : [];
  const rightParts = right ? right.split(':') : [];
  return [...leftParts, ...Array(8 - leftParts.length - rightParts.length).fill('0'), ...rightParts]
    .map((part) => Number.parseInt(part || '0', 16));
}

export function unsafeIpReason(value) {
  const address = cleanIp(value);
  if (isIP(address) === 4) {
    const [a, b] = ipv4Bytes(address);
    if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19))) {
      return 'loopback, private, link-local, multicast, or reserved IPv4 address';
    }
    return null;
  }
  if (isIP(address) !== 6) return 'not an IP address';

  const parts = ipv6Parts(address);
  const allZero = parts.every((part) => part === 0);
  if (allZero || (parts.slice(0, 7).every((part) => part === 0) && parts[7] === 1)) return 'unspecified or loopback IPv6 address';
  if ((parts[0] & 0xfe00) === 0xfc00) return 'private IPv6 address';
  if ((parts[0] & 0xffc0) === 0xfe80) return 'link-local IPv6 address';
  if ((parts[0] & 0xff00) === 0xff00) return 'multicast or reserved IPv6 address';

  const embeddedV4 = parts.slice(0, 6).every((part, index) => index === 5 ? part === 0xffff : part === 0);
  const compatibleV4 = parts.slice(0, 6).every((part) => part === 0);
  if (embeddedV4 || compatibleV4) {
    const v4 = `${parts[6] >> 8}.${parts[6] & 255}.${parts[7] >> 8}.${parts[7] & 255}`;
    return unsafeIpReason(v4);
  }
  return null;
}

export function parseSubmissionUrl(value, { allowUnsafeTestUrls = false } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('invalid URL syntax');
  }
  if (!allowUnsafeTestUrls && url.protocol !== 'https:') throw new Error('URL must use HTTPS');
  if (allowUnsafeTestUrls && !['http:', 'https:'].includes(url.protocol)) throw new Error('URL must use HTTP or HTTPS');
  if (url.username || url.password) throw new Error('URL must not include credentials');
  if (!url.hostname) throw new Error('URL must include a hostname');
  return url;
}

export async function resolvePublicAddresses(url, { allowUnsafeTestUrls = false, lookup = dnsLookup } = {}) {
  if (allowUnsafeTestUrls) return [];
  const host = cleanIp(url.hostname);
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('DNS returned no addresses');
  for (const { address } of addresses) {
    const reason = unsafeIpReason(address);
    if (reason) throw new Error(`DNS resolved ${host} to blocked ${address} (${reason})`);
  }
  return addresses;
}

export function responseError(response, { frameOrigin = DEFAULT_FRAME_ORIGIN } = {}) {
  if (response.statusCode < 200 || response.statusCode >= 300) return `HTTP ${response.statusCode}`;
  const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
  if (!/(^|,)\s*(text\/html|application\/xhtml\+xml)(?:\s*;|,|$)/.test(contentType)) {
    return `expected HTML Content-Type, received ${contentType || 'none'}`;
  }
  const xFrameOptions = String(response.headers['x-frame-options'] ?? '').toLowerCase();
  if (/(^|,)\s*(deny|sameorigin)\s*(,|$)/.test(xFrameOptions)) return `X-Frame-Options blocks embedding (${xFrameOptions})`;
  const csp = Array.isArray(response.headers['content-security-policy'])
    ? response.headers['content-security-policy'].join(',')
    : String(response.headers['content-security-policy'] ?? '');
  const frameAncestors = csp.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1];
  if (frameAncestors && !frameAncestors.split(/\s+/).some((source) => source === '*' || source.replace(/\/$/, '') === frameOrigin)) {
    return `Content-Security-Policy frame-ancestors does not allow ${frameOrigin}`;
  }
  return null;
}

async function requestOnce(url, addresses, { timeoutMs }) {
  const address = addresses[0];
  const transport = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: 'GET',
      agent: false,
      headers: { Accept: 'text/html,application/xhtml+xml' },
      lookup: address ? (_host, _options, callback) => callback(null, address.address, address.family) : undefined
    }, (response) => {
      resolve(response);
      response.destroy();
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`timed out after ${timeoutMs}ms`)));
    request.on('error', reject);
    request.end();
  });
}

export async function checkUrl(value, options = {}) {
  const { maxRedirects = DEFAULT_MAX_REDIRECTS, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  let url = parseSubmissionUrl(value, options);
  for (let redirects = 0; ; redirects += 1) {
    const addresses = await resolvePublicAddresses(url, options);
    const response = await requestOnce(url, addresses, { timeoutMs });
    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
      if (redirects >= maxRedirects) throw new Error(`too many redirects (maximum ${maxRedirects})`);
      url = parseSubmissionUrl(new URL(response.headers.location, url).href, options);
      continue;
    }
    const error = responseError(response, options);
    if (error) throw new Error(error);
    return { url: url.href, redirects };
  }
}

export async function checkCatalog(catalogPath = 'api/Games/gamesMeta.json', options = {}) {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const entries = catalog.games.filter((game) => game.status === 'active' && game.source?.type === 'hosted-page');
  if (!entries.length) return { checked: 0 };
  const failures = [];
  for (const game of entries) {
    try {
      const result = await checkUrl(game.source.url, options);
      console.log(`OK ${game.id}: ${result.url}`);
    } catch (error) {
      failures.push(`${game.id} (${game.source.url}): ${error.message}`);
    }
  }
  if (failures.length) throw new Error(`Game URL preflight failed:\n- ${failures.join('\n- ')}`);
  return { checked: entries.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await checkCatalog(process.argv[2]);
    console.log(`Checked ${result.checked} active hosted-page URL${result.checked === 1 ? '' : 's'}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
