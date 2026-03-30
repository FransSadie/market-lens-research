export function ToastStack({ items }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {items.map((item) => {
        const toneClass = item.tone === "err"
          ? "border-bad/60 bg-bad/12 text-bad"
          : item.tone === "ok"
            ? "border-good/60 bg-good/12 text-good"
            : "border-line bg-panel/95 text-ink";
        return (
          <div key={item.id} className={`rounded-2xl border px-4 py-3 text-sm shadow-panel backdrop-blur animate-fade-rise ${toneClass}`}>
            {item.text}
          </div>
        );
      })}
    </div>
  );
}
