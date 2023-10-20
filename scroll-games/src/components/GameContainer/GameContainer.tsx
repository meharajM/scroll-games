
import React, { useState, useEffect, useMemo } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { useMediaQuery } from 'react-responsive';
import './styles.css';
import { Game } from '../../types';
import { UnityContextHook } from 'react-unity-webgl/distribution/types/unity-context-hook';
const GameContainer = () => {
  const [gamesMeta, setGamesMeta] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const isMobileDevice = useMediaQuery({ maxDeviceWidth: 480 });
  useEffect(() => {
    fetch('path_to_your_gamesMeta.json')
      .then(response => response.json())
      .then((data: Game[]) => {
        setGamesMeta(data);
        setCurrentGame(data[0]);
      })
      .catch((error: Error) => console.error(error));
  }, []);

  const unityContext  = useMemo(() => {
  if (currentGame?.buildJsonPath) {
    return useUnityContext({
      loaderUrl: currentGame?.unityLoaderJsPath,
      dataUrl: currentGame?.dataUrl,
      frameworkUrl: currentGame?.frameworkUrl,
      codeUrl: currentGame?.codeUrl,
    })
  }
  return null;
}, [currentGame])
  
  return (
    <div className={isMobileDevice ? "mobile-view" : "desktop-view"}>
       {gamesMeta.length === 0 && <div>Loading....</div>}
       {currentGame && unityContext &&(
        <Unity unityProvider={unityContext.unityProvider} />
        )
      }
    </div>
  );
};
export default GameContainer;
