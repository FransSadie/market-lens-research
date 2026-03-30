export function LoadingBlock({ lines = 3, compact = false }) {
  return (
    <div className={`rounded-2xl border border-line/70 bg-plate/60 ${compact ? 'p-4' : 'p-5'} animate-fade-rise`}>
      <div className="h-4 w-32 rounded bg-line/80" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, idx) => (
          <div key={idx} className="h-3 rounded bg-line/60" style={{ width: `${92 - idx * 11}%` }} />
        ))}
      </div>
    </div>
  );
}
