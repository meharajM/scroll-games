import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import './styles.css';
import { Game } from '../../types';
import { getGamesMetaUrl } from '../../apiRoutes';
import UnityComponent from '../UnityComponent';

const GameContainer = () => {
  const [gamesMeta, setGamesMeta] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
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
    setCurrentGame(gamesMeta[currentIndex]);
  }, [currentIndex, gamesMeta]);

  
  return (
    
      <div className={isMobileDevice ? "mobile-view" : "desktop-view"}>
        {!gamesMeta.length && !currentGame && <div>Loading info....</div>}
        {currentGame && 
        <>
        
            <UnityComponent currentGame={currentGame} key={currentGame.id} loadNext={loadNext} loadPrev={loadPrev}/>

        </>
        
        }
      </div>
   
  );
};

export default GameContainer;
