export function StatusPill({ tone = "neutral", children }) {
  const classes = {
    good: "border-good/40 bg-good/10 text-good",
    warn: "border-warn/40 bg-warn/10 text-warn",
    bad: "border-bad/40 bg-bad/10 text-bad",
    accent: "border-accent/40 bg-accent/10 text-accent",
    neutral: "border-line bg-plate/70 text-mute"
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${classes[tone] || classes.neutral}`}>
      {children}
    </span>
  );
}
