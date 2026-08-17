import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';
import { Game, GameCatalog, ManagedUnityGame } from '../../types';
import { getGamesMetaUrl } from '../../apiRoutes';
import GamePlayer, { GamePlayerHandle } from '../GamePlayer';
import Overlay from '../Overlay/Overlay';
import AgeGate from '../AgeGate';
import CatalogPanel from '../CatalogPanel';
import { getPrefetchPlan, getUnityBuildFiles, prefetchUnityAssets } from '../../gamePrefetch';

const AGE_KEY = 'scroll-games-age';
const CATALOG_KEY = 'scroll-games-catalog-v1';
const HIDDEN_KEY = 'scroll-games-hidden';

const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or managed browser contexts.
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private or managed browser contexts.
  }
};

const readNumber = (key: string) => {
  const value = Number(safeGet(key));
  return Number.isFinite(value) && value >= 4 && value <= 18 ? value : null;
};

const readHidden = () => {
  try {
    const value = JSON.parse(safeGet(HIDDEN_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const isManagedUnityGame = (game: Game): game is ManagedUnityGame => game.source.type === 'managed-unity';

const isCatalog = (value: unknown): value is GameCatalog => {
  if (!value || typeof value !== 'object') return false;
  const catalog = value as Partial<GameCatalog>;
  return catalog.schemaVersion === 1 && Array.isArray(catalog.games) && catalog.games.every(game => (
    game && typeof game === 'object' && typeof game.id === 'string' && typeof game.name === 'string' &&
    typeof game.description === 'string' && typeof game.minimumAge === 'number' &&
    Array.isArray(game.genres) && typeof game.developer?.name === 'string' &&
    typeof game.destination?.url === 'string' &&
    typeof game.destination?.label === 'string' &&
    ['wishlist', 'download', 'buy', 'follow'].includes(game.destination.label) &&
    typeof game.destination?.platform === 'string' &&
    ['active', 'hidden'].includes(game.status) && (
      (game.source?.type === 'hosted-page' && game.source.url.startsWith('https://')) ||
      (game.source?.type === 'managed-unity' && typeof game.source.gameId === 'string')
    )
  ));
};

const normalizeCatalog = (value: unknown): GameCatalog | null => {
  if (isCatalog(value)) return value;
  if (!Array.isArray(value) || !value.every(game => (
    game && typeof game === 'object' && typeof game.id === 'string' && typeof game.name === 'string'
  ))) return null;

  return {
    schemaVersion: 1,
    games: value.map((legacy: { id: string; name: string }) => ({
      id: `legacy-${legacy.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: legacy.name,
      description: 'Scroll Games managed Unity WebGL trial.',
      version: '1.0.0',
      developer: { name: 'Scroll Games', url: 'https://github.com/meharajM/scroll-games' },
      destination: { url: 'https://github.com/meharajM/scroll-games', label: 'follow', platform: 'GitHub' },
      genres: ['arcade'],
      orientation: 'portrait',
      minimumAge: 13,
      estimatedDownloadMb: 50,
      status: 'active',
      source: { type: 'managed-unity', gameId: legacy.id },
    })),
  };
};

const GameContainer = () => {
  const [gamesMeta, setGamesMeta] = useState<Game[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [declaredAge, setDeclaredAge] = useState<number | null>(() => readNumber(AGE_KEY));
  const [hiddenIds, setHiddenIds] = useState<string[]>(readHidden);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [prefetchDirection, setPrefetchDirection] = useState<1 | -1>(1);
  const [readyGameIds, setReadyGameIds] = useState<Set<string>>(() => new Set());
  const playerRefs = useRef(new Map<string, GamePlayerHandle>());
  const visibleGames = gamesMeta.filter(game => (
    declaredAge !== null && game.minimumAge <= declaredAge && !hiddenIds.includes(game.id)
  ));
  const ageEligibleGames = gamesMeta.filter(game => declaredAge !== null && game.minimumAge <= declaredAge);
  const selectedIndex = visibleGames.findIndex(game => game.id === currentGameId);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const currentGame = visibleGames[currentIndex] ?? null;
  const prefetchGame = visibleGames.length > 1
    ? visibleGames[(currentIndex + prefetchDirection + visibleGames.length) % visibleGames.length]
    : null;
  const prefetchPlan = prefetchGame ? getPrefetchPlan(prefetchGame) : null;
  const currentGameReady = currentGame ? readyGameIds.has(currentGame.id) : false;
  const mountedGames = useMemo(() => {
    if (!currentGame) return [];
    if (
      currentGameReady && prefetchGame?.source.type === 'hosted-page' &&
      prefetchPlan?.warmHostedGame
    ) return [currentGame, prefetchGame];
    return [currentGame];
  }, [currentGame, currentGameReady, prefetchGame, prefetchPlan?.warmHostedGame]);

  const handleReadyChange = useCallback((gameId: string, ready: boolean) => {
    setReadyGameIds(current => {
      const alreadyReady = current.has(gameId);
      if (alreadyReady === ready) return current;
      const next = new Set(current);
      if (ready) next.add(gameId);
      else next.delete(gameId);
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch(getGamesMetaUrl(), { cache: 'no-store' });
        if (!response.ok) throw new Error(`Catalog returned HTTP ${response.status}`);
        const data = normalizeCatalog(await response.json() as unknown);
        if (!data) throw new Error('Unsupported catalog format');

        const games = data.games.filter(game => game.status === 'active');
        if (active) {
          setGamesMeta(games);
          safeSet(CATALOG_KEY, JSON.stringify(data));
          const linkedGame = new URLSearchParams(window.location.search).get('game');
          setCurrentGameId(current => games.some(game => game.id === current) ? current : linkedGame);
          setCatalogError(null);
          setCatalogNotice(null);
          setLoading(false);
        }
      } catch (error) {
        if (active) {
          try {
            const cached = JSON.parse(safeGet(CATALOG_KEY) ?? 'null') as unknown;
            if (!isCatalog(cached)) throw new Error('No saved catalog');
            setGamesMeta(cached.games.filter(game => game.status === 'active'));
            setCatalogNotice('Offline: showing the most recently saved catalog.');
            setCatalogError(null);
          } catch {
            setCatalogError(error instanceof Error ? error.message : 'Could not load games');
          }
          setLoading(false);
        }
      }
    };

    const refreshOnResume = () => {
      if (document.visibilityState === 'visible') loadCatalog();
    };

    loadCatalog();
    document.addEventListener('visibilitychange', refreshOnResume);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', refreshOnResume);
    };
  }, []);

  useEffect(() => {
    if (visibleGames.length && selectedIndex < 0) setCurrentGameId(visibleGames[0].id);
  }, [selectedIndex, visibleGames]);

  useEffect(() => {
    if (!currentGameId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('game', currentGameId);
    window.history.replaceState(null, '', url);
  }, [currentGameId]);

  useEffect(() => {
    if (!prefetchGame || !prefetchPlan?.manifest || !isManagedUnityGame(prefetchGame)) return;
    void getUnityBuildFiles(prefetchGame.source.gameId).catch(() => undefined);
  }, [prefetchGame, prefetchPlan?.manifest]);

  useEffect(() => {
    if (
      !currentGameReady || !prefetchGame || !prefetchPlan?.downloadUnityAssets ||
      !isManagedUnityGame(prefetchGame)
    ) return;

    const managedGame = prefetchGame;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const startPrefetch = () => void prefetchUnityAssets(managedGame).catch(() => undefined);
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(startPrefetch, { timeout: 2_000 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(startPrefetch, 250);
    return () => window.clearTimeout(handle);
  }, [currentGameReady, prefetchGame, prefetchPlan?.downloadUnityAssets]);

  const changeGame = async (offset: number) => {
    if (!visibleGames.length || switching) return;
    setPrefetchDirection(offset >= 0 ? 1 : -1);
    setSwitching(true);
    try {
      if (currentGame) await playerRefs.current.get(currentGame.id)?.unload();
    } catch (error) {
      console.error('Could not unload game cleanly', error);
    }
    const nextIndex = (currentIndex + offset + visibleGames.length) % visibleGames.length;
    setCurrentGameId(visibleGames[nextIndex].id);
    setSwitching(false);
  };

  const selectGame = async (gameId: string) => {
    if (gameId === currentGameId) {
      setCatalogOpen(false);
      return;
    }
    const targetIndex = visibleGames.findIndex(game => game.id === gameId);
    if (targetIndex >= 0) setPrefetchDirection(targetIndex >= currentIndex ? 1 : -1);
    setSwitching(true);
    if (currentGame) await playerRefs.current.get(currentGame.id)?.unload().catch(() => undefined);
    setCurrentGameId(gameId);
    setCatalogOpen(false);
    setSwitching(false);
  };

  const toggleHidden = async (gameId: string) => {
    const isHidden = hiddenIds.includes(gameId);
    if (!isHidden && gameId === currentGameId) await playerRefs.current.get(gameId)?.unload().catch(() => undefined);
    const next = isHidden ? hiddenIds.filter(id => id !== gameId) : [...hiddenIds, gameId];
    setHiddenIds(next);
    safeSet(HIDDEN_KEY, JSON.stringify(next));
  };

  if (declaredAge === null) {
    return <AgeGate onSelect={age => {
      safeSet(AGE_KEY, String(age));
      setDeclaredAge(age);
    }} />;
  }

  return (
    <section className="game-container" aria-label="Game feed">
      <Overlay
        currentGame={currentGame}
        disabled={switching}
        loadNext={() => changeGame(1)}
        loadPrev={() => changeGame(-1)}
        onBrowse={() => setCatalogOpen(true)}
        position={currentGame ? currentIndex + 1 : 0}
        total={visibleGames.length}
      >
        {loading && <div className="catalog-state" role="status">Loading games…</div>}
        {catalogNotice && <div className="catalog-notice" role="status">{catalogNotice}</div>}
        {catalogError && (
          <div className="catalog-state" role="alert">
            <div>
              <p>Could not load games: {catalogError}</p>
              <button className="secondary-button" type="button" onClick={() => window.location.reload()}>Try again</button>
            </div>
          </div>
        )}
        {!loading && !catalogError && !currentGame && (
          <div className="catalog-state">
            <div>
              <p>No games are available for the current filters.</p>
              <button className="secondary-button" type="button" onClick={() => setCatalogOpen(true)}>Browse games</button>
            </div>
          </div>
        )}
        {mountedGames.map(game => {
          const active = game.id === currentGame?.id;
          return (
            <div
              aria-hidden={!active}
              className={`game-player-slot ${active ? 'active' : 'prefetched'}`}
              data-game-id={game.id}
              data-ready={readyGameIds.has(game.id)}
              key={game.id}
            >
              <GamePlayer
                active={active}
                currentGame={game}
                onReadyChange={handleReadyChange}
                ref={handle => {
                  if (handle) playerRefs.current.set(game.id, handle);
                  else playerRefs.current.delete(game.id);
                }}
              />
            </div>
          );
        })}
      </Overlay>
      {catalogOpen && (
        <CatalogPanel
          currentGameId={currentGameId}
          games={ageEligibleGames}
          hiddenIds={hiddenIds}
          onClose={() => setCatalogOpen(false)}
          onResetAge={() => {
            safeRemove(AGE_KEY);
            setDeclaredAge(null);
            setCatalogOpen(false);
          }}
          onSelect={selectGame}
          onToggleHidden={toggleHidden}
        />
      )}
    </section>
  );
};

export default GameContainer;
