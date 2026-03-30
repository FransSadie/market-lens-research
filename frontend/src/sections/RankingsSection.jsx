import { useMemo, useState } from "react";
import { SectionCard } from "../components/SectionCard";
import { Sparkline } from "../components/Sparkline";
import { StatusPill } from "../components/StatusPill";
import { TimestampLabel } from "../components/TimestampLabel";
import { formatDecimal, formatPercent } from "../lib/formatters";

function buildSparkValues(row) {
  return [row?.return_1d, row?.return_5d, row?.rel_to_spy_20d, row?.return_20d];
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

function RankingRow({ row, mode, toggleWatchlist, isWatchlisted }) {
  const positive = (row?.return_20d ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-line/80 bg-bg/34 px-4 py-3 transition-colors hover:bg-plate/62">
      <div className="grid grid-cols-[auto_96px_minmax(0,1fr)_auto_auto] items-center gap-4">
        <div className="font-display text-xl text-ink">{row.ticker}</div>
        <Sparkline values={buildSparkValues(row)} positive={positive} className="h-10 w-24" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
            <span>20D {formatPercent(row.return_20d)}</span>
            <span>vs SPY {formatPercent(row.rel_to_spy_20d)}</span>
            <span>vs Sector {formatPercent(row.rel_to_sector_20d)}</span>
            <span>Trend {formatDecimal(row.trend_slope_20d)}</span>
            <span>Vol {formatDecimal(row.volume_ratio_20d)}</span>
            <span>RSI {formatDecimal(row.rsi_14)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${mode === "leaders" ? "text-good" : "text-bad"}`}>{formatDecimal(row.score, 3)}</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-mute">Score</div>
        </div>
        <WatchButton active={isWatchlisted?.(row.ticker)} onClick={() => toggleWatchlist?.(row.ticker)} />
      </div>
      <ReasonChips reasons={row?.reasons} />
    </div>
  );
}

export function RankingsSection({ rankings, lastUpdated, toggleWatchlist, isWatchlisted, styleProfile }) {
  const [mode, setMode] = useState("leaders");
  const rows = Array.isArray(mode === "leaders" ? rankings?.leaders : rankings?.laggards) ? (mode === "leaders" ? rankings.leaders : rankings.laggards) : [];
  const tone = mode === "leaders" ? "good" : "bad";
  const summary = useMemo(() => mode === "leaders"
    ? "Higher score means stronger relative behavior versus the market and sector, with trend and volume helping confirm it."
    : "Lower score means relative weakness versus the market and sector, with weak trend and poor confirmation dragging it down.", [mode]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Relative Strength Watchlist"
        subtitle="A cleaner watchlist-style ranking view so it feels closer to reading a platform screener than a report table."
        actions={(
          <div className="flex items-center gap-2 rounded-full border border-line/80 bg-bg/45 p-1 shadow-inner-glow">
            {[
              { id: "leaders", label: "Leaders" },
              { id: "laggards", label: "Laggards" }
            ].map((item) => (
              <button
                key={item.id}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${mode === item.id ? "bg-accent/18 text-ink" : "text-mute hover:text-ink"}`}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      >
        <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[1.4rem] border border-line/80 bg-bg/34 p-4 shadow-inner-glow">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={tone}>{mode}</StatusPill>
                {styleProfile?.label ? <StatusPill tone="accent">{styleProfile.label}</StatusPill> : null}
              </div>
              <TimestampLabel value={lastUpdated.rankings} />
            </div>
            <div className="mt-4 text-sm leading-6 text-mute">{summary}</div>
            {styleProfile?.description ? <div className="mt-3 rounded-2xl border border-line/80 bg-panel/58 px-4 py-3 text-sm text-mute">{styleProfile.description}</div> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-line/80 bg-panel/58 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Names shown</div>
                <div className="mt-2 font-display text-2xl text-ink">{rows.length}</div>
              </div>
              <div className="rounded-2xl border border-line/80 bg-panel/58 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Sorting</div>
                <div className="mt-2 text-sm text-ink">Style score, then relative context</div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-line/80 bg-bg/34 p-4 shadow-inner-glow">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Watchlist feed</div>
                <div className="mt-1 text-sm text-ink">Top names in current {mode} mode</div>
              </div>
              <div className="text-xs text-mute">Each row now explains why it qualified.</div>
            </div>
            <div className="space-y-2">
              {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line/80 bg-panel/45 px-4 py-8 text-sm text-mute">Run an analytics refresh to populate rankings.</div>
              ) : rows.map((row) => <RankingRow key={row.ticker} row={row} mode={mode} toggleWatchlist={toggleWatchlist} isWatchlisted={isWatchlisted} />)}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

