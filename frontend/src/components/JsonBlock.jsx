export function JsonBlock({ data, label = "data" }) {
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <div className="rounded-2xl border border-line/80 bg-bg/50 p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-mute">
        <span className="uppercase tracking-[0.16em]">{label}</span>
        <button className="rounded-lg border border-line px-2 py-1 text-ink transition-colors hover:border-accent/70 hover:text-accent" onClick={copyJson}>
          Copy
        </button>
      </div>
      <pre className="max-h-[22rem] overflow-auto whitespace-pre-wrap rounded-xl border border-line/70 bg-panel/70 p-3 text-xs text-mute">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
