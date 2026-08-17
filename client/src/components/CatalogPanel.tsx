import { useState } from 'react';
import { Game } from '../types';
import ReportForm from './ReportForm';

type CatalogPanelProps = {
  currentGameId: string | null;
  games: Game[];
  hiddenIds: string[];
  onClose: () => void;
  onResetAge: () => void;
  onSelect: (gameId: string) => void;
  onToggleHidden: (gameId: string) => void;
};

const gameLink = (gameId: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set('game', gameId);
  return `${url.pathname}${url.search}`;
};

const destinationLabels: Record<Game['destination']['label'], string> = {
  wishlist: 'Wishlist',
  download: 'Get game',
  buy: 'Buy game',
  follow: 'Follow game',
};

const CatalogPanel = ({ currentGameId, games, hiddenIds, onClose, onResetAge, onSelect, onToggleHidden }: CatalogPanelProps) => {
  const [query, setQuery] = useState('');
  const [reporting, setReporting] = useState<Game | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGames = games.filter(game => !normalizedQuery || [
    game.name,
    game.description,
    game.developer.name,
    ...game.genres,
  ].some(value => value.toLowerCase().includes(normalizedQuery)));

  if (reporting) return (
    <aside className="catalog-panel" aria-label="Report game" aria-modal="true" role="dialog">
      <ReportForm
        game={reporting}
        onCancel={() => setReporting(null)}
        onReported={hideGame => {
          if (hideGame && !hiddenIds.includes(reporting.id)) onToggleHidden(reporting.id);
        }}
      />
    </aside>
  );

  return (
  <aside className="catalog-panel" aria-label="Game catalog" aria-modal="true" role="dialog">
    <header className="catalog-panel-header">
      <div>
        <p className="eyebrow">Discover</p>
        <h2>All available games</h2>
      </div>
      <button className="secondary-button" type="button" onClick={onClose}>Close</button>
    </header>

    <label className="catalog-search">
      <span>Search games</span>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, developer, or genre" type="search" />
    </label>

    <div className="catalog-list">
      {!filteredGames.length && <p>No games match this age group and search.</p>}
      {filteredGames.map(game => (
        <article className={`${game.id === currentGameId ? 'catalog-card current' : 'catalog-card'}${hiddenIds.includes(game.id) ? ' hidden' : ''}`} key={game.id}>
          <button className="catalog-card-main" disabled={hiddenIds.includes(game.id)} type="button" onClick={() => onSelect(game.id)}>
            <span className="catalog-card-title">{game.name}</span>
            <span>{game.description}</span>
            <span className="catalog-card-meta">
              {game.developer.name} · {game.genres.join(', ')} · {game.minimumAge}+
            </span>
          </button>
          <div className="catalog-card-links">
            <a href={gameLink(game.id)}>Game link</a>
            <a href={game.destination.url} rel="noopener" target="_blank">{destinationLabels[game.destination.label]} on {game.destination.platform}</a>
            <a href={game.developer.url} rel="noopener" target="_blank">Developer</a>
            <button type="button" onClick={() => setReporting(game)}>Report</button>
            <button type="button" onClick={() => onToggleHidden(game.id)}>
              {hiddenIds.includes(game.id) ? 'Show' : 'Hide'}
            </button>
          </div>
        </article>
      ))}
    </div>

    <footer className="catalog-panel-footer">
      <button type="button" onClick={onResetAge}>Change age group</button>
      <a href="/privacy.html">Privacy</a>
      <a href="/support.html">Support</a>
    </footer>
  </aside>
  );
};

export default CatalogPanel;
