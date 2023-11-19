import { useSwipeable } from 'react-swipeable';
import { FiShare2, FiThumbsUp, FiThumbsDown, FiSend, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import './Overlay.css';
import { ReactNode, useState } from 'react';

interface OverlayProps {
  children: ReactNode;
  sendMessage: () => void;
  loadNext: () => void;
  loadPrev: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ children, sendMessage, loadPrev, loadNext }) => {
  const [bgColorClass, setBgColor] = useState('transparent');
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.dir === 'Up' || eventData.dir === 'Down') {
        setBgColor(eventData.dir)
      }
    },
    onSwipedUp: () => {
      loadNext();
      setBgColor('')
    },
    onSwipedDown: () => {
      loadPrev();
      setBgColor('')
    }, 
    trackMouse: true
})
  return (
    <div className="overlay" >
      <div className="content">{children}</div>
      <div className={`actions ${bgColorClass}`} {...handlers} >
        <button title='share' className="action-button">
          <FiShare2 size={24} />
        </button>
        <button title='like' className="action-button">
          <FiThumbsUp size={24}/>
        </button>
        <button title='dislike' className="action-button">
          <FiThumbsDown size={24}/>
        </button>
         <button title="send" onClick={sendMessage} className='action-button'>
          <FiSend size={24}/>
        </button>
        <button title="last" className='action-button' onClick={loadPrev}>
          <FiArrowUp size={24}/>
        </button>
        <button title="next" className='action-button' onClick={loadNext}>
          <FiArrowDown size={24}/>
        </button>


      </div>
    </div>
  );
};

export default Overlay;
