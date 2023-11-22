import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import './styles.css';
import { Game, Message } from '../../types';
import { getGamesMetaUrl } from '../../apiRoutes';
import UnityComponent from '../UnityComponent';
import Overlay from '../Overlay/Overlay';
type GamrContainerProps = {
  onShowLogin: () => void;
}
const GameContainer = ({onShowLogin}: GamrContainerProps) => {
  const [gamesMeta, setGamesMeta] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [message, setMessage] = useState<Message | null>(null)
  const isMobileDevice = useMediaQuery({ maxDeviceWidth: 480 });
  
  useEffect(() => {
    const gamesMetaUrl = getGamesMetaUrl();
    fetch(gamesMetaUrl)
      .then(response => {
        return response.json();
      })
      .then((data: Game[]) => {
        console.log(data)
        setGamesMeta(data);
        setCurrentGame(data[0]);
      })
      .catch((error: Error) => console.error(error));
  }, []);

  

  const loadNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % gamesMeta.length)
  }
  const loadPrev = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + gamesMeta.length) % gamesMeta.length)
  }
  useEffect(() => {
    if(currentIndex === 2) {
      onShowLogin();
    }
    setCurrentGame(gamesMeta[currentIndex]);
  }, [currentIndex, gamesMeta]);

  const sendMessage = () => {
    console.log("setMessage", setMessage)
    setMessage({controller: 'GameController', method: "OnTapButtonClick"})
  }

  const renderGame = useCallback(() => {
    return currentGame && 
      <>
          <UnityComponent currentGame={currentGame} key={currentGame.id} message={message} />
      </>       
  }, [currentGame && currentGame.id, message])
  return (
    
      <div className={isMobileDevice ? "mobile-view" : "desktop-view"}>
         <Overlay sendMessage={sendMessage} loadNext={loadNext} loadPrev={loadPrev}>
        {!gamesMeta.length && !currentGame && <div>Loading info....</div>}
        {renderGame()}
        </Overlay>
      </div>
   
  );
};

export default GameContainer;
