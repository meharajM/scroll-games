import { ReactNode, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { FiArrowDown, FiArrowUp, FiExternalLink, FiList } from 'react-icons/fi';
import { Game } from '../../types';
import './Overlay.css';

interface OverlayProps {
  children: ReactNode;
  currentGame: Game | null;
  disabled: boolean;
  loadNext: () => void | Promise<void>;
  loadPrev: () => void | Promise<void>;
  onBrowse: () => void;
  position: number;
  total: number;
}

const destinationLabels: Record<Game['destination']['label'], string> = {
  wishlist: 'Wishlist',
  download: 'Get game',
  buy: 'Buy game',
  follow: 'Follow game',
};

const Overlay = ({ children, currentGame, disabled, loadPrev, loadNext, onBrowse, position, total }: OverlayProps) => {
  const [swipeDirection, setSwipeDirection] = useState('');
  const handlers = useSwipeable({
    onSwiping: event => {
      if (event.dir === 'Up' || event.dir === 'Down') setSwipeDirection(event.dir);
    },
    onSwipedUp: () => {
      if (!disabled) loadNext();
      setSwipeDirection('');
    },
    onSwipedDown: () => {
      if (!disabled) loadPrev();
      setSwipeDirection('');
    },
    trackMouse: true,
  });

  return (
    <div className="overlay">
      <div className="content">{children}</div>
      {currentGame && (
        <div className="game-summary">
          <div className="game-summary-copy">
            <strong>{currentGame.name}</strong>
            <span>{currentGame.developer.name} · {currentGame.genres[0]} · {currentGame.minimumAge}+</span>
          </div>
          <a className="destination-button" href={currentGame.destination.url} rel="noopener" target="_blank">
            <span>{destinationLabels[currentGame.destination.label]}</span>
            <FiExternalLink aria-hidden="true" size={16} />
          </a>
          <button aria-label="Browse all games" className="browse-button" type="button" onClick={onBrowse}>
            <FiList size={20} />
            <span>{position}/{total}</span>
          </button>
        </div>
      )}
      <nav aria-label="Game navigation" className={`actions ${swipeDirection}`} {...handlers}>
        <button aria-label="Previous game" disabled={disabled} className="action-button" onClick={loadPrev}>
          <FiArrowUp size={24} />
        </button>
        <button aria-label="Next game" disabled={disabled} className="action-button" onClick={loadNext}>
          <FiArrowDown size={24} />
        </button>
      </nav>
    </div>
  );
};

export default Overlay;
