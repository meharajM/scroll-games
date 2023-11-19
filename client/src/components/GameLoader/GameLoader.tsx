import { Game } from '../../types';
import './gameLoader.css'; // Importing the CSS file
type GameLoaderPropType = {
  progression: number;
  currentGame: Game;
}
const GameLoader = ({progression, currentGame}: GameLoaderPropType ) => {
  return (
    <div className="mobile-view">
      <div style={{
          position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <p style={{color: 'white'}}>Loading Game {currentGame.id}... {Math.round(progression * 100)}%</p>
        </div>
    </div>
  );
};

export default GameLoader;