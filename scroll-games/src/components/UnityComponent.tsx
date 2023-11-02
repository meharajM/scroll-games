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
  
  const unityContext = useMemo(() => new UnityContext(config), [currentGame]);

  useEffect(function () {
    unityContext.on("progress", function (progression) {
      setProgression(progression);
    });
    unityContext.on("myMethod", (message: string) => {
      console.log("Message from Unity: " + message);
      alert(message)
    });
    unityContext.on("myMethodInt", (message: number) => {
      console.log("Message myMethodInt: " + message);
      alert(message)
    });
    
  }, [unityContext]);

  useEffect(function () {
    if(progression >= 1) {
      console.log("loaded")

      unityContext.on("myMethod", (message: string) => {
        console.log("Message from Unity: " + message);
        alert(message)
      });
      unityContext.on("myMethodInt", (message: number) => {
        console.log("Message myMethodInt: " + message);
        alert(message)
      });
    }
  }, [progression]);


   useEffect(() => {
    console.log("sending message")
    if(message) {
      unityContext.send(message.controller, message.method, message.value)//unityContext.send('GameController', "SpawnEnemies", 10)
    }
  }, [message])

  return (
    <div>
       
            {progression < 1 && <p>Loading Game {currentGame.id}... {Math.round(progression * 100)}%</p>}
          
          <Unity unityContext={unityContext} style={{
              width: '100vw', height: '100vh'
          }}/>
        
        {/* <div className='overlay'>
             
            </div> */}
           
            
    </div>
   
       
  )
}

export default React.memo(UnityComponent);
