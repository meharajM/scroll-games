import express from 'express';
import cors from 'cors';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.set('trust proxy', 1);
const localCatalogPath = path.join(__dirname, './Games/gamesMeta.json');
const defaultCatalogUrl = 'https://raw.githubusercontent.com/meharajM/scroll-games/main/api/Games/gamesMeta.json';
const localCatalog = JSON.parse(readFileSync(localCatalogPath, 'utf8'));

const isHttpsUrl = (value) => {
  try {
    return typeof value === 'string' && new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const isRuntimeCatalog = (catalog) => {
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.games) || catalog.games.length > 500) return false;
  const ids = new Set();
  for (const game of catalog.games) {
    if (
      !game || typeof game !== 'object' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id) || ids.has(game.id) ||
      typeof game.name !== 'string' || typeof game.description !== 'string' || !/^\d+\.\d+\.\d+$/.test(game.version) ||
      !game.developer || typeof game.developer.name !== 'string' || !isHttpsUrl(game.developer.url) ||
      !game.destination || !isHttpsUrl(game.destination.url) ||
      !['wishlist', 'download', 'buy', 'follow'].includes(game.destination.label) ||
      typeof game.destination.platform !== 'string' || !game.destination.platform.trim() || game.destination.platform.length > 40 ||
      !Array.isArray(game.genres) || !game.genres.length || !['portrait', 'landscape', 'any'].includes(game.orientation) ||
      !Number.isInteger(game.minimumAge) || game.minimumAge < 4 || game.minimumAge > 18 ||
      typeof game.estimatedDownloadMb !== 'number' || game.estimatedDownloadMb <= 0 || game.estimatedDownloadMb > 50 ||
      !['active', 'hidden'].includes(game.status)
    ) return false;
    ids.add(game.id);
    if (game.source?.type === 'hosted-page' && !isHttpsUrl(game.source.url)) return false;
    if (game.source?.type === 'managed-unity' && !/^[A-Za-z0-9_-]+$/.test(game.source.gameId || '')) return false;
    if (!['hosted-page', 'managed-unity'].includes(game.source?.type)) return false;
  }
  return true;
};

let catalogCache = null;
const resolveRuntimeCatalog = async () => {
  const catalogUrl = process.env.GAMES_CATALOG_URL || (process.env.VERCEL ? defaultCatalogUrl : null);
  if (!catalogUrl) return { catalog: localCatalog, remote: false };
  if (catalogCache && catalogCache.expiresAt > Date.now()) return { catalog: catalogCache.catalog, remote: true };
  try {
    const response = await fetch(catalogUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Catalog returned HTTP ${response.status}`);
    const catalog = await response.json();
    if (!isRuntimeCatalog(catalog)) throw new Error('Catalog has an unsupported format');
    catalogCache = { catalog, expiresAt: Date.now() + 60_000 };
    return { catalog, remote: true };
  } catch (error) {
    console.error('Remote catalog unavailable, using deployed fallback', error);
    return { catalog: localCatalog, remote: false };
  }
};

dotenv.config();
const allowedOrigins = new Set([
  'https://scroll-games.vercel.app',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:5173',
  ...(process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  }
}));
app.use(express.json({ limit: '16kb' }));

const reportAttempts = new Map();
const reportReasons = new Set([
  'Unsafe or inappropriate content', 'Incorrect age rating', 'Privacy or data collection',
  'Copyright or impersonation', 'Security or deceptive behavior', 'Broken game', 'Other'
]);

app.post('/api/reports', async (req, res) => {
  const gameId = req.body?.gameId;
  const reason = req.body?.reason;
  const details = req.body?.details;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameId || '') || !reportReasons.has(reason) || typeof details !== 'string' || details.trim().length < 10 || details.length > 2000) {
    return res.status(400).json({ error: 'Game, concern, and 10–2000 character details are required' });
  }

  const { catalog } = await resolveRuntimeCatalog();
  if (!catalog.games.some(game => game.id === gameId && game.status === 'active')) {
    return res.status(400).json({ error: 'Game is not in the active catalog' });
  }

  const clientKey = crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex');
  const now = Date.now();
  for (const [key, attempts] of reportAttempts) {
    if (!attempts.some(time => now - time < 10 * 60 * 1000)) reportAttempts.delete(key);
  }
  if (!reportAttempts.has(clientKey) && reportAttempts.size >= 1000) {
    reportAttempts.delete(reportAttempts.keys().next().value);
  }
  const recent = (reportAttempts.get(clientKey) || []).filter(time => now - time < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Too many reports; try again later' });
  reportAttempts.set(clientKey, [...recent, now]);

  let reportWebhookUrl;
  try {
    reportWebhookUrl = new URL(process.env.REPORT_WEBHOOK_URL);
  } catch {
    reportWebhookUrl = null;
  }
  const testLoopback = process.env.NODE_ENV === 'test' && reportWebhookUrl?.protocol === 'http:' && ['127.0.0.1', '::1'].includes(reportWebhookUrl.hostname);
  if (!reportWebhookUrl || (!testLoopback && reportWebhookUrl.protocol !== 'https:') || !process.env.REPORT_WEBHOOK_TOKEN) {
    return res.status(503).json({ error: 'Private reporting is not configured yet; use the email fallback' });
  }

  const reportId = crypto.randomUUID();
  try {
    const response = await fetch(reportWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REPORT_WEBHOOK_TOKEN}`
      },
      body: JSON.stringify({ reportId, gameId, reason, details: details.trim(), receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
    return res.status(202).json({ reportId });
  } catch (error) {
    console.error('Could not deliver game report', error);
    return res.status(502).json({ error: 'Could not deliver report; use the email fallback' });
  }
});
// Configure AWS SDK
const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

app.get('/api/gamesMeta', async (req, res) => {
  const { catalog, remote } = await resolveRuntimeCatalog();
  if (remote) {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  return res.json(catalog);
});

app.get('/api/getSignedUrls/:gameName', async (req, res) => {
  const gameName = req.params.gameName;
  if (!/^[A-Za-z0-9_-]+$/.test(gameName)) {
    return res.status(400).json({ error: 'Invalid game name' });
  }
  const { catalog } = await resolveRuntimeCatalog();
  const isManaged = catalog.games.some(game => (
    game.status === 'active' && game.source?.type === 'managed-unity' && game.source.gameId === gameName
  ));
  if (!isManaged) {
    return res.status(404).json({ error: 'Game build is not in the managed catalog' });
  }
  
  const listParams = {
    Bucket: 'scroll-gmaes',
    Prefix: `games-builds/Games/${gameName}/`
  };

  try {
    const data = await s3.send(new ListObjectsV2Command(listParams));
    const files = (data.Contents || []).map(file => file.Key);
    if (!files.length) return res.status(404).json({ error: 'Game build not found' });

    const response = {
      unityLoaderJsPath: '',
      dataUrl: '',
      frameworkUrl: '',
      codeUrl: ''
    };

    for (const file of files) {
      const getParams = {
        Bucket: 'scroll-gmaes',
        Key: file,
        Expires: 15 * 60,
        ResponseCacheControl: 'public, max-age=900, immutable',
      };

      const command = new GetObjectCommand(getParams);
      const url = await getSignedUrl(s3, command, { expiresIn: getParams.Expires });

      
      if (file.endsWith('.data')) {
        response.dataUrl = url;
      } else if (file.endsWith('.framework.js')) {
        response.frameworkUrl = url;
      } else if (file.endsWith('.loader.js')) {
        response.unityLoaderJsPath = url;
      } else if (file.endsWith('.wasm')) {
        response.codeUrl = url;
      }
    }

    if (Object.values(response).some(url => !url)) {
      return res.status(404).json({ error: 'Game build is incomplete' });
    }

    res.json({ gameName, ...response });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Could not load game build' });
  }
});

// Check if the code is running on Vercel
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export your app
export default app;
