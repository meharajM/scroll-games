import React, {Fragment, useState, useEffect} from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

function Home() {
  const [unityAssets, setUnityAssets] = useState({
    loaderUrl: "/Build/WebTest4.loader.js",
    dataUrl: "/Build/WebTest4.data",
    frameworkUrl: " /Build/WebTest4.framework.js",
    codeUrl: "/Build/WebTest4.wasm",
  })
  const { unityProvider, loadingProgression, isLoaded } = useUnityContext(unityAssets);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <Fragment>
      {!isLoaded && (
        <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{ visibility: isLoaded ? "visible" : "hidden", height: windowHeight, width: windowWidth }}
      />
    </Fragment>
  );
}
export default Home;