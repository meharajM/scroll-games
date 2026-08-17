import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import Unity, { UnityContext } from 'react-unity-webgl';
import { ManagedUnityGame, UnityBuildFiles } from '../types';
import { getUnityBuildFiles } from '../gamePrefetch';
import GameLoader from './GameLoader/GameLoader';
import type { GamePlayerHandle } from './GamePlayer';

type Props = {
  currentGame: ManagedUnityGame;
  onReadyChange?: (gameId: string, ready: boolean) => void;
};

const UnityComponent = forwardRef<GamePlayerHandle, Props>(function UnityComponent({ currentGame, onReadyChange }, ref) {
  const [progression, setProgression] = useState(0);
  const [buildFiles, setBuildFiles] = useState<UnityBuildFiles | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setBuildFiles(null);
    setProgression(0);
    setError(null);

    getUnityBuildFiles(currentGame.source.gameId)
      .then(data => {
        if (active) setBuildFiles(data);
      })
      .catch((loadError: Error) => {
        if (active) setError(loadError.message);
      });

    return () => { active = false; };
  }, [currentGame.source.gameId]);

  const config = useMemo(() => ({
    loaderUrl: buildFiles?.unityLoaderJsPath ?? '',
    dataUrl: buildFiles?.dataUrl ?? '',
    frameworkUrl: buildFiles?.frameworkUrl ?? '',
    codeUrl: buildFiles?.codeUrl ?? '',
  }), [buildFiles]);

  const unityContext = useMemo(() => buildFiles ? new UnityContext(config) : null, [buildFiles, config]);

  useImperativeHandle(ref, () => ({
    unload: async () => {
      unityContext?.removeAllEventListeners();
      await unityContext?.quitUnityInstance();
    },
  }), [unityContext]);

  useEffect(() => {
    if (!unityContext) return;
    let canvas: HTMLCanvasElement | null = null;
    const handleContextLost = () => setError('Graphics support was lost. Try a newer browser or device.');
    const handleUnityError = (message: string) => {
      if (/^warning:/i.test(message.trim())) {
        console.warn(`Unity: ${message}`);
        return;
      }
      setError(message);
    };
    const handleCanvas = (nextCanvas: HTMLCanvasElement) => {
      canvas = nextCanvas;
      canvas.addEventListener('webglcontextlost', handleContextLost);
    };

    unityContext.on('progress', setProgression);
    unityContext.on('error', handleUnityError);
    unityContext.on('canvas', handleCanvas);

    return () => {
      canvas?.removeEventListener('webglcontextlost', handleContextLost);
      unityContext.removeAllEventListeners();
    };
  }, [unityContext]);

  useEffect(() => {
    onReadyChange?.(currentGame.id, progression >= 1 && !error);
  }, [currentGame.id, error, onReadyChange, progression]);

  return (
    <div className="unity-player">
      {unityContext && <Unity unityContext={unityContext} style={{ width: '100%', height: '100%' }} />}
      {!error && progression < 1 && <GameLoader progression={progression} />}
      {error && <div className="game-error" role="alert">Could not load game: {error}</div>}
    </div>
  );
});

const MemoizedUnityComponent = React.memo(UnityComponent);

export default MemoizedUnityComponent;
