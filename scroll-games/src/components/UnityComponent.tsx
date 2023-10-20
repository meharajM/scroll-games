import React, { useEffect, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { Game } from '../types';
import { formatUrl } from '../apiRoutes';
type PropTypes = {
    currentGame: Game
}
const UnityComponent = ({currentGame}: PropTypes) => {
  const config = {
    loaderUrl: formatUrl(currentGame?.unityLoaderJsPath?? ""),
    dataUrl: formatUrl(currentGame?.dataUrl?? ""),
    frameworkUrl: formatUrl(currentGame?.frameworkUrl?? ""), 
    codeUrl: formatUrl(currentGame?.codeUrl?? ""),
  }
  const {loadingProgression, isLoaded, unityProvider} = useUnityContext(config)
  console.log("progress", Math.round(loadingProgression * 100))
  return (
    <div>
        {!isLoaded &&  (
            <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>)
        }
        {isLoaded && (
            <Unity unityProvider={unityProvider} style={{ visibility: isLoaded ? "visible" : "hidden" }}/>
        ) }
    </div>
   
       
  )
}

export default UnityComponent;
