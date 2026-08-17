import { formatUrl, getSignedUrls } from './apiRoutes';
import { Game, ManagedUnityGame, UnityBuildFiles } from './types';

const BUILD_CACHE_TTL_MS = 8 * 60 * 1000;
const MAX_CACHED_BUILDS = 3;

type CachedBuild = {
  createdAt: number;
  promise: Promise<UnityBuildFiles>;
};

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

type PrefetchNavigator = Navigator & {
  connection?: NetworkInformation;
  deviceMemory?: number;
};

export type PrefetchPlan = {
  manifest: boolean;
  warmHostedGame: boolean;
  downloadUnityAssets: boolean;
};

const buildCache = new Map<string, CachedBuild>();
const assetPrefetches = new Map<string, Promise<void>>();

const isUnityBuildFiles = (value: unknown): value is UnityBuildFiles => {
  if (!value || typeof value !== 'object') return false;
  const files = value as Record<string, unknown>;
  return ['unityLoaderJsPath', 'dataUrl', 'frameworkUrl', 'codeUrl']
    .every(key => {
      const file = files[key];
      return typeof file === 'string' && file.length > 0;
    });
};

const normalizeBuildFiles = (files: UnityBuildFiles): UnityBuildFiles => ({
  unityLoaderJsPath: formatUrl(files.unityLoaderJsPath),
  dataUrl: formatUrl(files.dataUrl),
  frameworkUrl: formatUrl(files.frameworkUrl),
  codeUrl: formatUrl(files.codeUrl),
});

const pruneBuildCache = () => {
  while (buildCache.size >= MAX_CACHED_BUILDS) {
    const oldestKey = buildCache.keys().next().value as string | undefined;
    if (!oldestKey) return;
    buildCache.delete(oldestKey);
    assetPrefetches.delete(oldestKey);
  }
};

export const getUnityBuildFiles = (gameId: string): Promise<UnityBuildFiles> => {
  const cached = buildCache.get(gameId);
  if (cached && Date.now() - cached.createdAt < BUILD_CACHE_TTL_MS) return cached.promise;

  if (cached) {
    buildCache.delete(gameId);
    assetPrefetches.delete(gameId);
  }
  pruneBuildCache();

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  const promise = fetch(getSignedUrls(gameId), { cache: 'no-store', signal: controller.signal })
    .then(async response => {
      if (!response.ok) throw new Error(`Game build returned HTTP ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then(data => {
      if (!isUnityBuildFiles(data)) throw new Error('Game build response is incomplete');
      return normalizeBuildFiles(data);
    })
    .catch(error => {
      buildCache.delete(gameId);
      throw error;
    })
    .finally(() => window.clearTimeout(timeout));

  buildCache.set(gameId, { createdAt: Date.now(), promise });
  return promise;
};

export const getPrefetchPlan = (game: Game): PrefetchPlan => {
  const device = navigator as PrefetchNavigator;
  const connection = device.connection;
  const constrainedConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';

  if (!device.onLine || connection?.saveData || constrainedConnection) {
    return { manifest: false, warmHostedGame: false, downloadUnityAssets: false };
  }

  const limitedDevice = typeof device.deviceMemory === 'number' && device.deviceMemory < 4;
  const moderateConnection = connection?.effectiveType === '3g';
  const maxSpeculativeDownloadMb = limitedDevice || moderateConnection
    ? 15
    : connection?.effectiveType === '4g' ? 50 : 40;
  const withinDownloadBudget = game.estimatedDownloadMb <= maxSpeculativeDownloadMb;

  return {
    manifest: game.source.type === 'managed-unity',
    warmHostedGame: game.source.type === 'hosted-page' && withinDownloadBudget,
    downloadUnityAssets: game.source.type === 'managed-unity' && withinDownloadBudget,
  };
};

const consumeResponse = async (response: Response) => {
  if (!response.ok) throw new Error(`Prefetch returned HTTP ${response.status}`);
  if (!response.body) {
    await response.blob();
    return;
  }

  const reader = response.body.getReader();
  while (!(await reader.read()).done) {
    // Drain the stream without retaining an entire Unity build file in memory.
  }
};

const prefetchAsset = async (url: string) => {
  const response = await fetch(url, { cache: 'force-cache', credentials: 'omit' });
  await consumeResponse(response);
};

export const prefetchUnityAssets = (game: ManagedUnityGame): Promise<void> => {
  const existing = assetPrefetches.get(game.source.gameId);
  if (existing) return existing;

  const promise = getUnityBuildFiles(game.source.gameId)
    .then(async files => {
      const urls = [files.unityLoaderJsPath, files.frameworkUrl, files.codeUrl, files.dataUrl];
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < urls.length) {
          const url = urls[nextIndex++];
          await prefetchAsset(url).catch(() => undefined);
        }
      };
      await Promise.all([worker(), worker()]);
    })
    .catch(error => {
      assetPrefetches.delete(game.source.gameId);
      throw error;
    });

  assetPrefetches.set(game.source.gameId, promise);
  return promise;
};
