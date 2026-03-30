export function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-bg/40 px-4 py-8 text-center">
      <div className="font-display text-lg text-ink">{title}</div>
      <div className="mt-2 text-sm text-mute">{message}</div>
    </div>
  );
}
