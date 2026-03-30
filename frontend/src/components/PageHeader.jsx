import { StatusPill } from "./StatusPill";
import { TimestampLabel } from "./TimestampLabel";

export function PageHeader({ regime, lastUpdated, onRefresh, isRefreshing, autoRefreshControl, nav, marketBar, styleControl, styleProfile }) {
  const regimeTone = regime === "risk_on" ? "good" : regime === "risk_off" ? "warn" : "accent";

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-line/90 bg-panel/94 px-5 py-6 shadow-pane-edge backdrop-blur md:px-7 md:py-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <StatusPill tone={regimeTone}>{regime || "mixed"}</StatusPill>
            {styleProfile?.label ? <StatusPill tone="accent">{styleProfile.label}</StatusPill> : null}
            <TimestampLabel label="Desk updated" value={lastUpdated} />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">Market Lens Research Desk</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mute md:text-base">
            One place to read the market fast: regime, sector leadership, relative strength, and chart-worthy setups.
          </p>
          {styleProfile?.description ? <p className="mt-2 text-sm text-mute">Current style lens: {styleProfile.description}</p> : null}
        </div>
        <div className="flex w-full max-w-sm flex-col items-start gap-3 lg:items-end">
          {styleControl}
          <button
            className="rounded-2xl border border-accent/80 bg-accent/22 px-5 py-3 text-sm font-semibold text-ink shadow-pane-edge transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/30"
            onClick={onRefresh}
          >
            {isRefreshing ? "Refreshing market desk..." : "Refresh Market Desk"}
          </button>
          <div className="text-xs text-mute">Pulls current market data and refreshes the research panels.</div>
          {autoRefreshControl}
        </div>
      </div>
      {marketBar ? <div className="mt-6 border-t border-line/80 pt-5">{marketBar}</div> : null}
      <div className="mt-6 border-t border-line/80 pt-5">{nav}</div>
    </header>
  );
}
