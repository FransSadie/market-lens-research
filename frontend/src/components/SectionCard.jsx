export function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`relative overflow-hidden rounded-[1.7rem] border border-line/90 bg-panel/90 p-5 shadow-pane-edge backdrop-blur ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
      {(title || subtitle || actions) && (
        <div className="mb-5 flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-mute/80">Workspace panel</div>
            {title && <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-mute">{subtitle}</p>}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
