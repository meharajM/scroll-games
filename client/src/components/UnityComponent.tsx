import React, { useEffect, useMemo, useState } from 'react';
import Unity, {  UnityContext } from 'react-unity-webgl';
import { Game, Message } from '../types';
import { formatUrl } from '../apiRoutes';

type PropTypes = {
    currentGame: Game;
    message: Message | null;
}
const UnityComponent = ({currentGame, message}: PropTypes) => {
  const [progression, setProgression] = useState(0);
  const config = {
    loaderUrl: formatUrl(currentGame?.unityLoaderJsPath?? ""),
    dataUrl: formatUrl(currentGame?.dataUrl?? ""),
    frameworkUrl: formatUrl(currentGame?.frameworkUrl?? ""), 
    codeUrl: formatUrl(currentGame?.codeUrl?? ""),
  }
  
  const unityContext = useMemo(() => new UnityContext(config), [currentGame.id]);

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
    <div>
          <Unity unityContext={unityContext} style={{
              width: '100vw', height: '100vh'
          }}/>
           {progression < 1 && <p>Loading Game {currentGame.id}... {Math.round(progression * 100)}%</p>}
    </div>
   
       
  )
}

export default React.memo(UnityComponent);