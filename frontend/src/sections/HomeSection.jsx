import { LoadingBlock } from "../components/LoadingBlock";
import { SectionCard } from "../components/SectionCard";
import { Sparkline } from "../components/Sparkline";
import { StatCard } from "../components/StatCard";
import { StatusPill } from "../components/StatusPill";
import { TimestampLabel } from "../components/TimestampLabel";
import { formatDecimal, formatInteger, formatPercent } from "../lib/formatters";

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
      {reasons.slice(0, 2).map((reason) => (
        <span key={reason} className="rounded-full border border-line/75 bg-panel/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-mute">
          {reason}
        </span>
      ))}
    </div>
  );
}

function TapeRow({ label, value, helper, tone = "neutral" }) {
  const toneClass = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "accent" ? "text-accent" : "text-ink";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-bg/34 px-4 py-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-mute">{label}</div>
        <div className="mt-1 text-xs text-mute">{helper}</div>
      </div>
      <div className={`font-display text-xl ${toneClass}`}>{value}</div>
    </div>
  );
}

function NameRow({ row, tone = "good", toggleWatchlist, isWatchlisted }) {
  const saved = isWatchlisted?.(row.ticker);
  return (
    <div className="rounded-2xl border border-line/80 bg-bg/34 px-4 py-3 transition-colors hover:bg-plate/60">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3">
        <div>
          <div className="font-display text-lg text-ink">{row.ticker}</div>
          <div className="text-xs text-mute">vs SPY {formatPercent(row.rel_to_spy_20d)} � vs Sector {formatPercent(row.rel_to_sector_20d)}</div>
        </div>
        <Sparkline values={buildSparkValues(row)} positive={tone === "good"} className="hidden sm:block h-10 w-24" />
        <div className="text-right">
          <div className={`text-sm font-semibold ${tone === "good" ? "text-good" : "text-bad"}`}>{formatPercent(row.return_20d)}</div>
          <div className="text-xs text-mute">20D</div>
        </div>
        <WatchButton active={saved} onClick={() => toggleWatchlist?.(row.ticker)} />
      </div>
      <ReasonChips reasons={row?.reasons} />
    </div>
  );
}

function ScanPreviewCard({ title, description, rows, onNavigate, meta, toggleWatchlist, isWatchlisted, tone = "accent", marker = "Focus" }) {
  const shellTone = tone === "good"
    ? "from-good/18 via-good/6 to-plate/82"
    : tone === "warn"
      ? "from-warn/18 via-warn/6 to-plate/82"
      : "from-accent/22 via-accent/8 to-plate/82";
  const badgeTone = tone === "good"
    ? "border-good/35 bg-good/10 text-good"
    : tone === "warn"
      ? "border-warn/35 bg-warn/10 text-warn"
      : "border-accent/35 bg-accent/10 text-accent";
  const dotTone = tone === "good" ? "bg-good" : tone === "warn" ? "bg-warn" : "bg-accent";

  return (
    <div className={`relative overflow-hidden rounded-[1.4rem] border border-line/85 bg-gradient-to-br ${shellTone} p-4 shadow-pane-edge`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${badgeTone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotTone}`} />
              {marker}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-mute">{rows.length} names</span>
          </div>
          <div className="mt-3 font-display text-lg text-ink">{title}</div>
          <div className="mt-1 text-sm leading-6 text-mute">{description}</div>
        </div>
        <button className="text-xs uppercase tracking-[0.16em] text-accent transition-colors hover:text-ink" onClick={() => onNavigate("scans")}>View all</button>
      </div>
      <div className="mt-4 space-y-2.5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/80 bg-bg/30 px-4 py-6 text-sm text-mute">No current candidates.</div>
        ) : rows.map((row, index) => (
          <div key={row.ticker} className="rounded-2xl border border-line/80 bg-bg/42 px-4 py-3 shadow-inner-glow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-ink">{row.ticker}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-mute">#{index + 1}</span>
                </div>
                <div className="mt-1 text-xs text-mute">{meta(row)}</div>
              </div>
              <WatchButton active={isWatchlisted?.(row.ticker)} onClick={() => toggleWatchlist?.(row.ticker)} />
            </div>
            <ReasonChips reasons={row?.reasons} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeSection({ loading, summary, overview, lastUpdated, totalRows, homePreview, health, watchlistRows, onNavigate, toggleWatchlist, isWatchlisted }) {
  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <LoadingBlock lines={4} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingBlock compact lines={2} />
          <LoadingBlock compact lines={2} />
          <LoadingBlock compact lines={2} />
          <LoadingBlock compact lines={2} />
        </div>
      </div>
    );
  }

  const strongestSector = overview?.strongest_sector?.ticker || "--";
  const weakestSector = overview?.weakest_sector?.ticker || "--";
  const regime = overview?.market_regime || "mixed";
  const regimeTone = regime === "risk_on" ? "good" : regime === "risk_off" ? "warn" : "accent";
  const sectorSpread = overview?.strongest_sector?.return_20d != null && overview?.weakest_sector?.return_20d != null
    ? overview.strongest_sector.return_20d - overview.weakest_sector.return_20d
    : null;

  return (
    <div className="space-y-6">
      <SectionCard title="Opening Read" subtitle="A clearer first screen: broad regime, leadership, and the few things worth paying attention to first.">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-line/85 bg-bg/38 p-5 shadow-inner-glow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Today뭩 read</div>
                <div className="mt-2 font-display text-2xl text-ink">{summary?.headline || "Daily market research summary"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={regimeTone}>{regime}</StatusPill>
                {summary?.style_profile?.label ? <StatusPill tone="accent">{summary.style_profile.label}</StatusPill> : null}
              </div>
            </div>
            <TimestampLabel className="mt-3" value={lastUpdated.summary} />
            <div className="mt-5 space-y-3 text-sm leading-6 text-mute">
              {(Array.isArray(summary?.bullets) ? summary.bullets : []).map((bullet) => (
                <div key={bullet} className="flex gap-3 rounded-2xl border border-line/70 bg-panel/55 px-4 py-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <TapeRow label="Regime" value={regime} helper="Broad tape read" tone={regimeTone} />
            <TapeRow label="Strongest sector" value={strongestSector} helper={`Weakest: ${weakestSector}`} tone="accent" />
            <TapeRow label="Sector spread" value={formatPercent(sectorSpread)} helper="20D leadership gap" tone={sectorSpread > 0 ? "good" : "neutral"} />
            <TapeRow label="Desk health" value={health?.status || "unknown"} helper={`${formatInteger(totalRows)} tracked rows`} tone={health?.status === "ok" ? "good" : "warn"} />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Strongest sector" value={strongestSector} tone="accent" helper="Current sector leader" />
        <StatCard label="Weakest sector" value={weakestSector} tone="warn" helper="Current sector laggard" />
        <StatCard label="Macro trend" value={formatDecimal(overview?.macro_etfs?.[0]?.trend_slope_20d)} helper={`${overview?.macro_etfs?.[0]?.ticker || "Macro"} trend slope`} />
        <StatCard label="Style lens" value={summary?.style_profile?.label || "Breakout"} helper="Current personalization mode" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="Tape and Sector Context" subtitle="Use this as the broad market backdrop before drilling into names.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.4rem] border border-line/80 bg-bg/34 p-4 shadow-inner-glow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Macro ETFs</div>
                  <div className="mt-1 text-sm text-ink">Risk and tape context</div>
                </div>
                <TimestampLabel value={lastUpdated.overview} />
              </div>
              <div className="space-y-2">
                {(Array.isArray(overview?.macro_etfs) ? overview.macro_etfs : []).map((row) => (
                  <div key={row.ticker} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl border border-line/75 bg-panel/55 px-4 py-3">
                    <div className="font-display text-lg text-ink">{row.ticker}</div>
                    <div className="text-xs text-mute">Trend {formatDecimal(row.trend_slope_20d)} � 20D {formatPercent(row.return_20d)}</div>
                    <div className={`text-sm font-semibold ${Number(row.return_5d) > 0 ? "text-good" : Number(row.return_5d) < 0 ? "text-bad" : "text-ink"}`}>{formatPercent(row.return_5d)}</div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-mute">5D</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-line/80 bg-bg/34 p-4 shadow-inner-glow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Sector ladder</div>
                  <div className="mt-1 text-sm text-ink">Leadership and weakness</div>
                </div>
                <div className="text-xs text-mute">{strongestSector} leading � {weakestSector} lagging</div>
              </div>
              <div className="space-y-2">
                {(Array.isArray(overview?.sector_etfs) ? overview.sector_etfs : []).map((row) => (
                  <div key={row.ticker} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl border border-line/75 bg-panel/55 px-4 py-3">
                    <div className="font-display text-lg text-ink">{row.ticker}</div>
                    <div className="text-xs text-mute">20D {formatPercent(row.return_20d)} � Vol {formatDecimal(row.volatility_regime_60d)}</div>
                    <div className={`text-sm font-semibold ${Number(row.return_5d) > 0 ? "text-good" : Number(row.return_5d) < 0 ? "text-bad" : "text-ink"}`}>{formatPercent(row.return_5d)}</div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-mute">5D</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Style Priority Names" subtitle="This list is curated from the style lens you selected, so it reduces noise instead of showing everything at once.">
          <div className="mb-4 text-sm text-mute">
            {summary?.style_profile?.description || "Current style profile is shaping which names get promoted here first."}
          </div>
          <div className="space-y-2">
            {(Array.isArray(homePreview?.priority) ? homePreview.priority : []).length ? (Array.isArray(homePreview?.priority) ? homePreview.priority : []).map((row) => (
              <NameRow key={row.ticker} row={row} tone={(row?.return_20d ?? 0) >= 0 ? "good" : "bad"} toggleWatchlist={toggleWatchlist} isWatchlisted={isWatchlisted} />
            )) : (
              <div className="rounded-2xl border border-dashed border-line/80 bg-panel/45 px-4 py-8 text-sm text-mute">No priority names available for this style yet.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <SectionCard title="Scan Board" subtitle="Three boards that should feel closer to a screener than a report.">
          <div className="grid gap-4 xl:grid-cols-3">
            <ScanPreviewCard
              title="Breakouts"
              description="Names pressing highs with relative strength and broad participation."
              rows={homePreview?.breakout || []}
              onNavigate={onNavigate}
              meta={(row) => `vs SPY ${formatPercent(row.rel_to_spy_20d)} � Vol ${formatDecimal(row.volume_ratio_20d)}`}
              toggleWatchlist={toggleWatchlist}
              isWatchlisted={isWatchlisted}
              tone="good"
              marker="Breakout"
            />
            <ScanPreviewCard
              title="Pullback setups"
              description="Strong names pulling back into cleaner structure."
              rows={homePreview?.pullback || []}
              onNavigate={onNavigate}
              meta={(row) => `Drawdown ${formatPercent(row.drawdown_20d)} � RSI ${formatDecimal(row.rsi_14)}`}
              toggleWatchlist={toggleWatchlist}
              isWatchlisted={isWatchlisted}
              tone="warn"
              marker="Pullback"
            />
            <ScanPreviewCard
              title="Volatility expansion"
              description="Names expanding enough to deserve chart time."
              rows={homePreview?.volatility || []}
              onNavigate={onNavigate}
              meta={(row) => `Regime ${formatDecimal(row.volatility_regime_60d)} � Range ${formatPercent(row.range_pct_1d)}`}
              toggleWatchlist={toggleWatchlist}
              isWatchlisted={isWatchlisted}
              tone="accent"
              marker="Expansion"
            />
          </div>
        </SectionCard>

        <SectionCard title="Saved Watchlist" subtitle="A lightweight local watchlist so you can keep a personal shortlist without adding account complexity yet.">
          <div className="space-y-2">
            {(Array.isArray(watchlistRows) && watchlistRows.length) ? watchlistRows.map((row) => (
              <NameRow key={row.ticker} row={row} tone={(row?.return_20d ?? 0) >= 0 ? "good" : "bad"} toggleWatchlist={toggleWatchlist} isWatchlisted={isWatchlisted} />
            )) : (
              <div className="rounded-2xl border border-dashed border-line/80 bg-panel/45 px-4 py-8 text-sm text-mute">
                Save names from Rankings or Scans and they will appear here on this device.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}





