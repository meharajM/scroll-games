import { FormEvent, useState } from 'react';
import { Game } from '../types';
import { getReportsUrl } from '../apiRoutes';

const REASONS = [
  'Unsafe or inappropriate content',
  'Incorrect age rating',
  'Privacy or data collection',
  'Copyright or impersonation',
  'Security or deceptive behavior',
  'Broken game',
  'Other',
];

type ReportFormProps = {
  game: Game;
  onCancel: () => void;
  onReported: (hideGame: boolean) => void;
};

const ReportForm = ({ game, onCancel, onReported }: ReportFormProps) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [hideGame, setHideGame] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFailed(false);
    try {
      const response = await fetch(getReportsUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, reason, details }),
      });
      const data = await response.json() as { error?: string; reportId?: string };
      if (!response.ok || !data.reportId) throw new Error(data.error || `Report returned HTTP ${response.status}`);
      setResult(`Report received: ${data.reportId}`);
      onReported(hideGame);
    } catch (error) {
      setFailed(true);
      setResult(error instanceof Error ? error.message : 'Could not send report');
    } finally {
      setSubmitting(false);
    }
  };

  const fallback = new URLSearchParams({
    subject: `[Scroll Games report] ${game.name} (${game.id})`,
    body: `Game: ${game.name}\nGame ID: ${game.id}\nReason: ${reason}\n\n${details}`,
  });

  return (
    <form className="report-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">Private report</p>
        <h2>{game.name}</h2>
        <p>Reports go to the platform maintainer. Do not include passwords or personal information.</p>
      </div>
      <label>
        <span>Concern</span>
        <select value={reason} onChange={event => setReason(event.target.value)}>
          {REASONS.map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        <span>What happened?</span>
        <textarea minLength={10} maxLength={2000} required value={details} onChange={event => setDetails(event.target.value)} />
      </label>
      <label className="report-check">
        <input checked={hideGame} type="checkbox" onChange={event => setHideGame(event.target.checked)} />
        <span>Hide this game on this device</span>
      </label>
      {result && <p className={failed ? 'report-result error' : 'report-result'} role={failed ? 'alert' : 'status'}>{result}</p>}
      <div className="report-actions">
        <button className="secondary-button" disabled={submitting} type="submit">{submitting ? 'Sending…' : 'Send report'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
        {failed && <a href={`mailto:meharaj137@gmail.com?${fallback}`}>Email instead</a>}
      </div>
    </form>
  );
};

export default ReportForm;
