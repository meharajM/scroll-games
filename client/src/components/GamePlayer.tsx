import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Game, HostedPageGame, ManagedUnityGame } from '../types';
import UnityComponent from './UnityComponent';

type GamePlayerProps = {
  active: boolean;
  currentGame: Game;
  onReadyChange?: (gameId: string, ready: boolean) => void;
};

export type GamePlayerHandle = {
  unload: () => Promise<void>;
};

const isManagedUnityGame = (game: Game): game is ManagedUnityGame => game.source.type === 'managed-unity';

const HostedPagePlayer = ({ active, game, onReadyChange }: {
  active: boolean;
  game: HostedPageGame;
  onReadyChange?: (gameId: string, ready: boolean) => void;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setReady(false);
    setSlow(false);
  }, [attempt, game.source.url]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setSlow(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [attempt, game.source.url, ready]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === 'null' && event.source === iframeRef.current?.contentWindow &&
        event.data?.type === 'scroll-games:ready' && event.data?.version === 1
      ) setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [game.source.url]);

  useEffect(() => {
    onReadyChange?.(game.id, ready);
  }, [game.id, onReadyChange, ready]);

  return (
    <div className="hosted-player">
      <iframe
        allow="fullscreen; gamepad"
        allowFullScreen
        key={attempt}
        loading="eager"
        onLoad={() => setLoaded(true)}
        ref={iframeRef}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-pointer-lock"
        src={game.source.url}
        tabIndex={active ? 0 : -1}
        title={`${game.name} trial`}
      />
      {active && !ready && !slow && <div className="hosted-status" role="status">{loaded ? `Starting ${game.name}…` : `Loading ${game.name}…`}</div>}
      {active && !ready && slow && (
        <div className="hosted-status" role="alert">
          <p>This trial did not confirm that it started.</p>
          <div className="hosted-status-actions">
            <button className="secondary-button" type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
            <button type="button" onClick={() => setReady(true)}>Play anyway</button>
          </div>
        </div>
      )}
    </div>
  );
};

const GamePlayer = forwardRef<GamePlayerHandle, GamePlayerProps>(({ active, currentGame, onReadyChange }, ref) => {
  const unityRef = useRef<GamePlayerHandle>(null);

  useImperativeHandle(ref, () => ({
    unload: async () => {
      if (unityRef.current) await unityRef.current.unload();
    },
  }), []);

  useEffect(() => {
    onReadyChange?.(currentGame.id, false);
    return () => onReadyChange?.(currentGame.id, false);
  }, [currentGame.id, onReadyChange]);

  if (isManagedUnityGame(currentGame)) {
    return <UnityComponent ref={unityRef} currentGame={currentGame} onReadyChange={onReadyChange} />;
  }

  return <HostedPagePlayer active={active} game={currentGame} onReadyChange={onReadyChange} />;
});

GamePlayer.displayName = 'GamePlayer';

export default GamePlayer;
