import React, { ReactNode } from 'react';
import './Overlay.css';
import { useSwipeable } from 'react-swipeable';

interface OverlayProps {
  children: ReactNode;
  sendMessage: () => void;
  loadNext: () => void;
  loadPrev: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ children, sendMessage, loadPrev, loadNext }) => {
  const handlers = useSwipeable({
    onSwipedUp: () => {
      console.log("swipe up")
      loadNext();
    },
    onSwipedDown: () => {
      console.log("swipe down")
      loadPrev();
    }, 
})
  return (
    <div className="overlay"  {...handlers} >
      <div className="content">{children}</div>
      <div className="actions">
        <button className="action-button">Share</button>
        <button className="action-button">Like</button>
        <button className="action-button">Dislike</button>
        <button onClick={sendMessage} className='action-button'>send message</button>
        <button className='action-button' onClick={loadPrev}>Last game</button>
        <button className='action-button' onClick={loadNext}>Next Game</button>

      </div>
    </div>
  );
};

export default Overlay;
