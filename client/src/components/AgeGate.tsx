const AGE_OPTIONS = [
  { label: '13–15', value: 13 },
  { label: '16–17', value: 16 },
  { label: '18+', value: 18 },
];

type AgeGateProps = {
  onSelect: (age: number) => void;
};

const AgeGate = ({ onSelect }: AgeGateProps) => (
  <section className="age-gate" aria-labelledby="age-gate-title">
    <div className="age-gate-card">
      <a className="age-gate-brand" href="/about.html" aria-label="About Scroll Games">
        <img src="/icons/scroll-games.svg" width="52" height="52" alt="" />
        <span>Scroll Games</span>
      </a>
      <p className="eyebrow">Play first. Decide second.</p>
      <h1 id="age-gate-title">Choose your age lane.</h1>
      <p>Play human-curated indie demos before you download. Scroll Games is for people 13 or older; your choice stays on this device and hides games rated above it.</p>
      <div className="age-options">
        {AGE_OPTIONS.map(option => (
          <button key={option.value} type="button" onClick={() => onSelect(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="age-gate-links">
        <a href="/privacy.html">Privacy</a>
        <a href="/developers.html">Publish a game</a>
        <a href="https://github.com/meharajM/scroll-games">Open source</a>
      </div>
    </div>
  </section>
);

export default AgeGate;
