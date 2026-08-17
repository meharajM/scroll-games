import './gameLoader.css';

type Props = {
  progression: number;
};

const GameLoader = ({ progression }: Props) => (
  <div className="game-loader" role="status">
    <p>Loading game… {Math.round(progression * 100)}%</p>
  </div>
);

export default GameLoader;
