import { SectionCard } from "../components/SectionCard";
import { Sparkline } from "../components/Sparkline";
import { StatusPill } from "../components/StatusPill";
import { TimestampLabel } from "../components/TimestampLabel";
import { formatDecimal, formatPercent } from "../lib/formatters";

function buildSparkValues(row) {
  return [row?.return_1d, row?.range_pct_1d, row?.rel_to_spy_20d, row?.return_20d];
}

function WatchButton({ active, onClick }) {
  return (
    <button
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${active ? "border-warn/60 bg-warn/12 text-warn" : "border-line/80 bg-panel/55 text-mute hover:text-ink"}`}
      onClick={onClick}
      type="button"
    >
      {active ? "Saved" : "Save"}
    </button>
  );
}

function ReasonChips({ reasons = [] }) {
  if (!reasons.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {reasons.slice(0, 3).map((reason) => (
        <span key={reason} className="rounded-full border border-line/75 bg-panel/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-mute">
          {reason}
        </span>
      ))}
    </div>
  );
}

function ScanRow({ row, signal, secondary, toggleWatchlist, isWatchlisted }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-bg/34 px-4 py-3 transition-colors hover:bg-plate/62">
      <div className="grid grid-cols-[auto_96px_minmax(0,1fr)_auto_auto] items-center gap-4">
        <div className="font-display text-xl text-ink">{row.ticker}</div>
        <Sparkline values={buildSparkValues(row)} positive={(row?.return_20d ?? row?.return_1d ?? 0) >= 0} className="h-10 w-24" />
        <div className="min-w-0 text-xs text-mute">{secondary(row)}</div>
        <div className="text-right text-xs text-mute">
          <div>{signal(row)}</div>
          {row?.fit ? <StatusPill tone="accent">{row.fit} fit</StatusPill> : null}
        </div>
        <WatchButton active={isWatchlisted?.(row.ticker)} onClick={() => toggleWatchlist?.(row.ticker)} />
      </div>
      <ReasonChips reasons={row?.reasons} />
    </div>
  );
}

function ScanCard({ title, description, rows, signal, secondary, toggleWatchlist, isWatchlisted }) {
  return (
    <div className="rounded-[1.4rem] border border-line/85 bg-plate/78 p-4 shadow-pane-edge">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg text-ink">{title}</div>
          <div className="mt-1 text-sm leading-6 text-mute">{description}</div>
        </div>
        <div className="rounded-full border border-line/80 bg-bg/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-mute">{rows.length}</div>
      </div>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/80 bg-bg/30 px-4 py-6 text-sm text-mute">No current {title.toLowerCase()} candidates.</div>
        ) : rows.map((row) => (
          <ScanRow key={row.ticker} row={row} signal={signal} secondary={secondary} toggleWatchlist={toggleWatchlist} isWatchlisted={isWatchlisted} />
        ))}
      </div>
    </div>
  );
}

export function ScansSection({ scans, lastUpdated, toggleWatchlist, isWatchlisted, styleProfile }) {
  const breakout = Array.isArray(scans?.breakout_candidates) ? scans.breakout_candidates : [];
  const pullback = Array.isArray(scans?.pullback_candidates) ? scans.pullback_candidates : [];
  const volatility = Array.isArray(scans?.volatility_expansion) ? scans.volatility_expansion : [];

  return (
    <div className="space-y-6">
      <SectionCard title="Signal Boards" subtitle="Three cleaner boards that behave more like a screener: count, signal reason, and quick supporting context.">
        <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-[1.4rem] border border-line/80 bg-bg/34 p-4 shadow-inner-glow">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Board status</div>
                  <div className="mt-1 text-sm text-ink">Current scan inventory</div>
                </div>
                {styleProfile?.label ? <StatusPill tone="accent">{styleProfile.label}</StatusPill> : null}
              </div>
              <TimestampLabel value={lastUpdated.scans} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-line/80 bg-panel/58 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Breakouts</div>
                <div className="mt-2 font-display text-2xl text-ink">{breakout.length}</div>
              </div>
              <div className="rounded-2xl border border-line/80 bg-panel/58 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Pullbacks</div>
                <div className="mt-2 font-display text-2xl text-ink">{pullback.length}</div>
              </div>
              <div className="rounded-2xl border border-line/80 bg-panel/58 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Vol expansion</div>
                <div className="mt-2 font-display text-2xl text-ink">{volatility.length}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-line/80 bg-panel/58 px-4 py-3 text-sm leading-6 text-mute">
              {styleProfile?.description || "Use these boards as a shortlist generator, not a decision engine. The goal is to surface names worth opening on a chart."}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ScanCard
              title="Breakouts"
              description="Pressing highs with enough participation and relative strength."
              rows={breakout}
              signal={(row) => `vs SPY ${formatPercent(row.rel_to_spy_20d)}`}
              secondary={(row) => `Breakout ${formatPercent(row.breakout_20d)} · Volume ${formatDecimal(row.volume_ratio_20d)}`}
              toggleWatchlist={toggleWatchlist}
              isWatchlisted={isWatchlisted}
            />
            <ScanCard
              title="Pullbacks"
              description="Strong names pulling back into potentially cleaner entries."
              rows={pullback}
              signal={(row) => `Drawdown ${formatPercent(row.drawdown_20d)}`}
              secondary={(row) => `vs SPY ${formatPercent(row.rel_to_spy_20d)} · RSI ${formatDecimal(row.rsi_14)}`}
              toggleWatchlist={toggleWatchlist}
              isWatchlisted={isWatchlisted}
            />
            <ScanCard
              title="Volatility Expansion"
              description="Names expanding enough to justify closer attention."
              rows={volatility}
              signal={(row) => `Regime ${formatDecimal(row.volatility_regime_60d)}`}
              secondary={(row) => `Range ${formatPercent(row.range_pct_1d)} · 1D ${formatPercent(row.return_1d)}`}
              toggleWatchlist={toggleWatchlist}
              isWatchlisted={isWatchlisted}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

