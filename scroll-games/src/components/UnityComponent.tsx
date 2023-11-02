import React, { useEffect, useMemo, useState } from 'react';
import Unity, {  UnityContext,  } from 'react-unity-webgl';
import { Game } from '../types';
import { formatUrl } from '../apiRoutes';
import Overlay from './Overlay/Overlay';
type PropTypes = {
    currentGame: Game;
    loadNext: () => void;
    loadPrev: () => void;
}
const UnityComponent = ({currentGame, loadNext, loadPrev}: PropTypes) => {
  const [progression, setProgression] = useState(0);
  const config = {
    loaderUrl: formatUrl(currentGame?.unityLoaderJsPath?? ""),
    dataUrl: formatUrl(currentGame?.dataUrl?? ""),
    frameworkUrl: formatUrl(currentGame?.frameworkUrl?? ""), 
    codeUrl: formatUrl(currentGame?.codeUrl?? ""),
  }
  
  const unityContext = useMemo(() => new UnityContext(config), [currentGame]);

  useEffect(function () {
    console.log("new game", window.myMethod)
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


  const sendMessage = () => {
    console.log("sending message")
    unityContext.send('GameController', "SpawnEnemies", 10)
  }

  return (
    <div>
        <Overlay sendMessage={sendMessage} loadNext={loadNext} loadPrev={loadPrev}>
            {progression < 1 && <p>Loading Game {currentGame.id}... {Math.round(progression * 100)}%</p>}
          
          <Unity unityContext={unityContext} style={{
              width: '100vw', height: '100vh'
          }}/>
        </Overlay>
        {/* <div className='overlay'>
             
            </div> */}
           
            
    </div>
   
       
  )
}

export default React.memo(UnityComponent);
