import { useMemo } from "react";
import { HomeSection } from "./sections/HomeSection";
import { RankingsSection } from "./sections/RankingsSection";
import { ScansSection } from "./sections/ScansSection";
import { AdminSection } from "./sections/AdminSection";
import { PageHeader } from "./components/PageHeader";
import { StatusPill } from "./components/StatusPill";
import { ToastStack } from "./components/ToastStack";
import { useResearchDesk } from "./hooks/useResearchDesk";
import { formatPercent } from "./lib/formatters";

const views = [
  { id: "home", label: "Home", hint: "Daily research workflow" },
  { id: "rankings", label: "Rankings", hint: "Leaders and laggards" },
  { id: "scans", label: "Scans", hint: "Signal boards" },
  { id: "admin", label: "Admin", hint: "Operations and diagnostics" }
];

const styleOptions = [
  { id: "breakout", label: "Breakout" },
  { id: "swing", label: "Swing" },
  { id: "momentum", label: "Momentum" },
  { id: "mean_reversion", label: "Mean Reversion" },
  { id: "macro_etf", label: "Macro ETF" }
];

export default function App() {
  const desk = useResearchDesk();

  const currentView = useMemo(
    () => views.find((item) => item.id === desk.activeView) || views[0],
    [desk.activeView]
  );

  const marketBarItems = useMemo(() => {
    const macro = (desk.overview?.macro_etfs || []).slice(0, 4).map((item) => ({
      ticker: item.ticker,
      label: "Macro",
      move: item.return_5d
    }));
    const sectors = (desk.overview?.sector_etfs || []).slice(0, 4).map((item) => ({
      ticker: item.ticker,
      label: "Sector",
      move: item.return_5d
    }));
    return [...macro, ...sectors].slice(0, 8);
  }, [desk.overview]);

  const marketBar = (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {marketBarItems.map((item) => {
        const tone = Number(item.move) > 0 ? "text-good" : Number(item.move) < 0 ? "text-bad" : "text-ink";
        return (
          <div key={`${item.label}-${item.ticker}`} className="rounded-2xl border border-line/85 bg-bg/46 px-3 py-3 shadow-inner-glow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-base text-ink">{item.ticker}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-mute">{item.label}</div>
              </div>
              <div className={`text-sm font-semibold ${tone}`}>{formatPercent(item.move)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const styleControl = (
    <label className="w-full rounded-2xl border border-line/85 bg-bg/50 px-4 py-3 shadow-pane-edge">
      <div className="text-[10px] uppercase tracking-[0.18em] text-mute">Trader style</div>
      <select className="mt-2 w-full rounded-xl border border-line/80 bg-plate/75 px-3 py-2 text-sm text-ink outline-none" value={desk.style} onChange={(e) => desk.setStyle(e.target.value)}>
        {styleOptions.map((option) => (
          <option key={option.id} value={option.id} className="bg-panel">{option.label}</option>
        ))}
      </select>
    </label>
  );

  const nav = (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {views.map((view) => (
        <button
          key={view.id}
          className={`group rounded-2xl border px-4 py-3 text-left shadow-inner-glow transition-all duration-200 ${desk.activeView === view.id ? "border-accent/75 bg-accent/20 text-ink shadow-pane-edge" : "border-line/85 bg-plate/74 text-mute hover:border-accent/50 hover:bg-plate/95 hover:text-ink"}`}
          onClick={() => desk.setActiveView(view.id)}
        >
          <div className="font-medium">{view.label}</div>
          <div className="mt-1 text-xs text-mute transition-colors group-hover:text-mute">{view.hint}</div>
        </button>
      ))}
    </div>
  );

  const autoRefreshControl = (
    <div className="flex flex-wrap items-center gap-3 text-xs text-mute">
      <label className="inline-flex items-center gap-2 rounded-full border border-line/85 bg-plate/74 px-3 py-2 shadow-inner-glow">
        <input type="checkbox" checked={desk.autoRefresh} onChange={(e) => desk.setAutoRefresh(e.target.checked)} />
        Auto refresh
      </label>
      <label className="inline-flex items-center gap-2 rounded-full border border-line/85 bg-plate/74 px-3 py-2 shadow-inner-glow">
        <span>Interval</span>
        <select className="rounded-full bg-transparent text-ink outline-none" value={desk.refreshMs} onChange={(e) => desk.setRefreshMs(Number(e.target.value))}>
          <option className="bg-panel" value={5000}>5s</option>
          <option className="bg-panel" value={15000}>15s</option>
          <option className="bg-panel" value={30000}>30s</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-app-shell font-body text-ink">
      <ToastStack items={desk.toasts} />
      <div className="mx-auto max-w-[1560px] px-4 py-5 md:px-8 md:py-8">
        <PageHeader
          regime={desk.overview?.market_regime}
          lastUpdated={desk.lastUpdated.health}
          onRefresh={() => desk.runAction("refresh", desk.refreshAll, "Market desk refreshed")}
          isRefreshing={desk.busy.refresh}
          autoRefreshControl={autoRefreshControl}
          nav={nav}
          marketBar={marketBar}
          styleControl={styleControl}
          styleProfile={desk.summary?.style_profile}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 overflow-hidden rounded-[1.8rem] border border-line/90 bg-panel/94 p-4 shadow-pane-edge backdrop-blur">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
              <div className="text-[11px] uppercase tracking-[0.22em] text-mute">Research workspace</div>
              <div className="mt-4 space-y-2">
                {views.map((view) => (
                  <button
                    key={view.id}
                    className={`w-full rounded-2xl border px-4 py-3 text-left shadow-inner-glow transition-all ${desk.activeView === view.id ? "border-accent/75 bg-accent/20 text-ink shadow-pane-edge" : "border-line/85 bg-plate/72 text-mute hover:border-accent/50 hover:bg-plate/92 hover:text-ink"}`}
                    onClick={() => desk.setActiveView(view.id)}
                  >
                    <div className="font-medium">{view.label}</div>
                    <div className="mt-1 text-xs text-mute">{view.hint}</div>
                  </button>
                ))}
              </div>
              <div className="mt-6 border-t border-line/80 pt-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-mute">Current panel</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={currentView.id === "admin" ? "neutral" : "accent"}>{currentView.label}</StatusPill>
                  {desk.summary?.style_profile?.label ? <StatusPill tone="accent">{desk.summary.style_profile.label}</StatusPill> : null}
                </div>
                <div className="mt-4 rounded-2xl border border-line/85 bg-plate/76 px-3 py-3 shadow-inner-glow">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Workflow note</div>
                  <p className="mt-2 text-xs leading-5 text-mute">
                    Start on Home for the broad read, use Rankings like a watchlist, then move to Scans for names worth opening charts on.
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-line/85 bg-plate/76 px-3 py-3 shadow-inner-glow">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Saved names</div>
                  <div className="mt-2 font-display text-2xl text-ink">{desk.watchlist.length}</div>
                  <div className="mt-1 text-xs text-mute">Local watchlist entries on this device.</div>
                </div>
                {desk.lastError ? <div className="mt-4 rounded-2xl border border-bad/50 bg-bad/10 px-3 py-3 text-xs text-bad">{desk.lastError}</div> : null}
              </div>
            </div>
          </aside>

          <main className="min-w-0 animate-fade-rise">
            {desk.activeView === "home" && (
              <HomeSection
                loading={desk.loading}
                summary={desk.summary}
                overview={desk.overview}
                lastUpdated={desk.lastUpdated}
                totalRows={desk.totalRows}
                homePreview={desk.homePreview}
                health={desk.health}
                watchlistRows={desk.watchlistRows}
                onNavigate={desk.setActiveView}
                toggleWatchlist={desk.toggleWatchlist}
                isWatchlisted={desk.isWatchlisted}
              />
            )}
            {desk.activeView === "rankings" && <RankingsSection rankings={desk.rankings} lastUpdated={desk.lastUpdated} toggleWatchlist={desk.toggleWatchlist} isWatchlisted={desk.isWatchlisted} styleProfile={desk.summary?.style_profile} />}
            {desk.activeView === "scans" && <ScansSection scans={desk.scans} lastUpdated={desk.lastUpdated} toggleWatchlist={desk.toggleWatchlist} isWatchlisted={desk.isWatchlisted} styleProfile={desk.summary?.style_profile} />}
            {desk.activeView === "admin" && (
              <AdminSection
                busy={desk.busy}
                ingestStatus={desk.ingestStatus}
                pipelineStatus={desk.pipelineStatus}
                quality={desk.quality}
                dataStatus={desk.dataStatus}
                docs={desk.docs}
                adminLoaded={desk.adminLoaded}
                lastUpdated={desk.lastUpdated}
                runAction={desk.runAction}
                refreshAll={desk.refreshAll}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

