import React, { useEffect, useMemo, useState } from 'react';
import Unity, {  UnityContext,  } from 'react-unity-webgl';
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
    unityContext.on("GameOver", function (userName, score) {
      alert("GameOver in web"+ userName)
      alert("GameOver in web" + score)
      // setIsGameOver(true);
      // setUserName(userName);
      // setScore(score);
    });
    console.log("unityContext",unityContext )
  }, [unityContext]);

  useEffect(() => {
    addEventListener("GameOver", () => {
      alert("game over in")
    })
  }, [addEventListener])


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
        
        {/* <div className='overlay'>
             
            </div> */}
           
            
    </div>
   
       
  )
}

export default React.memo(UnityComponent);
