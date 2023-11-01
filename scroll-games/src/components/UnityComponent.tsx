import React, { useEffect, useState } from 'react';
import Unity, {  UnityContext,  } from 'react-unity-webgl';
import { Game } from '../types';
import { formatUrl } from '../apiRoutes';
type PropTypes = {
    currentGame: Game
}
const UnityComponent = ({currentGame}: PropTypes) => {
  const [progression, setProgression] = useState(0);
  const config = {
    loaderUrl: formatUrl(currentGame?.unityLoaderJsPath?? ""),
    dataUrl: formatUrl(currentGame?.dataUrl?? ""),
    frameworkUrl: formatUrl(currentGame?.frameworkUrl?? ""), 
    codeUrl: formatUrl(currentGame?.codeUrl?? ""),
  }
  
  const unityContext= new UnityContext(config)

  useEffect(function () {
    console.log("new game")
    unityContext.on("progress", function (progression) {
      setProgression(progression);
    });
   
    
  }, []);

  const sendMessage = () => {
    console.log("sending message")
    unityContext.send('Canvas/Panel', "Send_Message", "rajkumar")
  }

  return (
    <div>
        <div className='overlay'>
              <button onClick={sendMessage}>Click</button>
            </div>
           {progression < 1 && <p>Loading Game {currentGame.id}... {Math.round(progression * 100)}%</p>}
       
            <Unity unityContext={unityContext} style={{
                width: '100vw', height: '100vh'
            }}/>
            
    </div>
   
       
  )
}

export default React.memo(UnityComponent);
