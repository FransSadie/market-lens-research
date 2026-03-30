import ReactMarkdown from "react-markdown";
import { JsonBlock } from "../components/JsonBlock";
import { LoadingBlock } from "../components/LoadingBlock";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { TimestampLabel } from "../components/TimestampLabel";
import { formatInteger } from "../lib/formatters";

function Disclosure({ title, children, defaultOpen = false }) {
  return (
    <details className="rounded-2xl border border-line/70 bg-bg/35 p-4" open={defaultOpen}>
      <summary className="cursor-pointer list-none font-display text-lg text-ink">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function AdminSection({
  busy,
  ingestStatus,
  pipelineStatus,
  quality,
  dataStatus,
  docs,
  adminLoaded,
  lastUpdated,
  runAction,
  refreshAll
}) {
  const statusCards = [
    { label: "Last ingest job", value: ingestStatus?.latest_run?.job_name || "--", helper: ingestStatus?.latest_run?.status || "No run yet" },
    { label: "Market rows", value: formatInteger(ingestStatus?.totals?.market_prices), helper: "Tracked raw price rows" },
    { label: "Analytics rows", value: formatInteger(pipelineStatus?.totals?.analytics_snapshots), helper: "Current research snapshots" }
  ];

  if (!adminLoaded && !ingestStatus && !pipelineStatus && !quality && !dataStatus) {
    return (
      <div className="space-y-6">
        <SectionCard title="Admin Loading" subtitle="Pulling operational status and documentation only now, so the main research screen stays fast.">
          <LoadingBlock lines={4} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Operations" subtitle="These controls refresh market data and research analytics. They are maintenance controls, not model-training controls.">
        <div className="grid gap-3 md:grid-cols-3">
          <button className="rounded-2xl border border-line bg-plate/70 px-4 py-4 text-left transition-colors hover:border-accent/70" onClick={() => runAction("ingest_run", async () => { const out = await fetchJson("/ingest/run", "POST"); await refreshAll({ includeAdmin: true }); return out; }, "Market data refresh completed") }>
            <div className="font-medium text-ink">Refresh Market Data</div>
            <div className="mt-1 text-sm text-mute">Pull the latest raw market prices.</div>
            <div className="mt-3 text-xs text-accent">{busy.ingest_run ? "Running..." : "Ready"}</div>
          </button>
          <button className="rounded-2xl border border-line bg-plate/70 px-4 py-4 text-left transition-colors hover:border-accent/70" onClick={() => runAction("pipeline_run", async () => { const out = await fetchJson("/pipeline/run", "POST"); await refreshAll({ includeAdmin: true }); return out; }, "Research panels refreshed") }>
            <div className="font-medium text-ink">Refresh Research Panels</div>
            <div className="mt-1 text-sm text-mute">Rebuild the research snapshots and boards.</div>
            <div className="mt-3 text-xs text-accent">{busy.pipeline_run ? "Running..." : "Ready"}</div>
          </button>
          <button className="rounded-2xl border border-accent/60 bg-accent/14 px-4 py-4 text-left transition-colors hover:bg-accent/20" onClick={() => runAction("run_full", async () => { const out = await fetchJson("/run/full", "POST"); await refreshAll({ includeAdmin: true, includeDocs: true }); return out; }, "Full market desk refresh completed") }>
            <div className="font-medium text-ink">Refresh Everything</div>
            <div className="mt-1 text-sm text-mute">Pull market data, then rebuild the research views.</div>
            <div className="mt-3 text-xs text-accent">{busy.run_full ? "Running..." : "Ready"}</div>
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Status" subtitle="Operational status summarized before the raw diagnostics.">
        <div className="grid gap-4 md:grid-cols-3">
          {statusCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line/70 bg-bg/35 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium text-ink">Ingest status</div>
              <TimestampLabel value={lastUpdated.ingestStatus} />
            </div>
            <JsonBlock data={ingestStatus || {}} label="ingest status" />
          </div>
          <div className="rounded-2xl border border-line/70 bg-bg/35 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium text-ink">Analytics status</div>
              <TimestampLabel value={lastUpdated.pipelineStatus} />
            </div>
            <JsonBlock data={pipelineStatus || {}} label="analytics status" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Data Quality" subtitle="Readable freshness first, raw diagnostic payloads second.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Market stale" value={quality?.freshness?.market_stale ? "Yes" : "No"} tone={quality?.freshness?.market_stale ? "warn" : "good"} />
          <StatCard label="Analytics stale" value={quality?.freshness?.analytics_stale ? "Yes" : "No"} tone={quality?.freshness?.analytics_stale ? "warn" : "good"} />
          <StatCard label="Duplicate rows" value={formatInteger(quality?.duplicate_keys?.market_ticker_timestamp_duplicates)} />
          <StatCard label="Null ratio" value={quality?.null_checks?.analytics_price_close_null_ratio == null ? "--" : `${(quality.null_checks.analytics_price_close_null_ratio * 100).toFixed(2)}%`} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <JsonBlock data={quality || {}} label="data quality" />
          <JsonBlock data={dataStatus || {}} label="data status" />
        </div>
      </SectionCard>

      <SectionCard title="Docs" subtitle="Reference material stays available without crowding the research views.">
        {!docs ? (
          <LoadingBlock lines={3} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Disclosure title="README" defaultOpen>
              <div className="prose prose-invert max-w-none text-sm prose-headings:font-display">
                <ReactMarkdown>{docs.readme_markdown || "_No README loaded._"}</ReactMarkdown>
              </div>
            </Disclosure>
            <Disclosure title="Project Overview">
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-line/70 bg-panel/70 p-3 text-xs text-mute">{docs.project_overview_text || "No overview loaded."}</pre>
            </Disclosure>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

async function fetchJson(path, method = "GET") {
  const res = await fetch(path, { method });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}
