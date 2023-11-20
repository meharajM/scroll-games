import React, { useEffect, useMemo, useState } from 'react';
import Unity, { UnityContext } from 'react-unity-webgl';
import { Game, Message } from '../types';
import { formatUrl, getSignedUrls } from '../apiRoutes';
import GameLoader from './GameLoader/GameLoader';

type PropTypes = {
    currentGame: Game;
    message: Message | null;
}

const UnityComponent = ({currentGame, message}: PropTypes) => {
  const [progression, setProgression] = useState(0);
  const [buildFiles, setBuildFiles] = useState<Game | null>(null);
  useEffect(() => {
    const gameId = currentGame.id;
    const getSignedUrlForGame = getSignedUrls(gameId)
    fetch(getSignedUrlForGame)
      .then(response => {
        return response.json();
      })
      .then((data: Game) => {
        console.log(data)
        setBuildFiles(data)
      })
      .catch((error: Error) => console.error(error));
  }, [currentGame.id])

  const config = useMemo(() => ({
    loaderUrl: formatUrl(buildFiles?.unityLoaderJsPath?? ""),
    dataUrl: formatUrl(buildFiles?.dataUrl?? ""),
    frameworkUrl: formatUrl(buildFiles?.frameworkUrl?? ""), 
    codeUrl: formatUrl(buildFiles?.codeUrl?? ""),
  }), [buildFiles])
  
  const unityContext = useMemo(() => new UnityContext(config), [config]);

  useEffect(function () {
    unityContext.on("progress", function (progression) {
      setProgression(progression);
    });
    unityContext.on("ScoreUpdate", function ( score) { //ScoreUpdate ,OnGameOver,OnGameWin
      console.log("ScoreUpdate"+ score)
    });
    unityContext.on("OnGameWin", function ( message) { //ScoreUpdate ,OnGameOver,OnGameWin
      alert("OnGameWin"+ message)
    });
    unityContext.on("OnGameOver", function (message) {
      alert("GameOver in web"+ message)
      
    });
    console.log("unityContext",unityContext )
  }, [unityContext]);

  useEffect(() => {
    addEventListener("GameOver", () => {
      alert("game over in")
    })
  }, [addEventListener])

  console.log("message", message)
   useEffect(() => {
    console.log("sending message")
    if(message) {
      unityContext.send(message.controller, message.method, message.value)//unityContext.send('GameController', "SpawnEnemies", 10)
    }
  }, [message])

  return (
    <div style={{position: 'relative'}}>
      {buildFiles && <Unity unityContext={unityContext} style={{
          width: '100vw', height: '100vh'
      }}/>}
      {progression < 1 && 
        <GameLoader progression={progression} currentGame={currentGame} />
      }
    </div>
  )
}

export default React.memo(UnityComponent);
