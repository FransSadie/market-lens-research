export function StatCard({ label, value, tone = "neutral", helper }) {
  const toneClass = {
    neutral: "text-ink",
    good: "text-good",
    warn: "text-warn",
    bad: "text-bad",
    accent: "text-accent"
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/85 bg-plate/88 p-4 shadow-pane-edge transition-transform duration-200 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="text-[11px] uppercase tracking-[0.2em] text-mute">{label}</div>
      <div className={`mt-2 font-display text-2xl font-semibold ${toneClass[tone] || toneClass.neutral}`}>{value}</div>
      {helper ? <div className="mt-2 text-xs leading-5 text-mute">{helper}</div> : null}
    </div>
  );
}
