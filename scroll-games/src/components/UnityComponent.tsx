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
    unityContext.on("progress", function (progression) {
      setProgression(progression);
    });
  }, []);

  return (
    <div>
        
            <p>Loading Application... {Math.round(progression * 100)}%</p>
       
            <Unity unityContext={unityContext} style={{
                width: '100%', height: '100%'
            }}/>
    </div>
   
       
  )
}

export default UnityComponent;
