import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

const STORAGE_KEYS = {
  activeView: "market_lens_research_view",
  autoRefresh: "market_lens_research_auto_refresh",
  refreshMs: "market_lens_research_refresh_ms",
  watchlist: "market_lens_research_watchlist",
  style: "market_lens_research_style"
};

const defaultDocs = { readme_markdown: "", project_overview_text: "" };
const defaultRankings = { leaders: [], laggards: [], style_profile: null };
const defaultScans = { breakout_candidates: [], pullback_candidates: [], volatility_expansion: [], style_profile: null };
const defaultSummary = { headline: "", bullets: [], style_profile: null, priority_names: [] };

export function useResearchDesk() {
  const [activeView, setActiveView] = useState(localStorage.getItem(STORAGE_KEYS.activeView) || "home");
  const [autoRefresh, setAutoRefresh] = useState((localStorage.getItem(STORAGE_KEYS.autoRefresh) || "true") === "true");
  const [refreshMs, setRefreshMs] = useState(Number(localStorage.getItem(STORAGE_KEYS.refreshMs) || 15000));
  const [style, setStyle] = useState(localStorage.getItem(STORAGE_KEYS.style) || "breakout");
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.watchlist);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [busy, setBusy] = useState({});
  const [toasts, setToasts] = useState([]);
  const [lastError, setLastError] = useState("");
  const [lastUpdated, setLastUpdated] = useState({});
  const [loading, setLoading] = useState(true);

  const [health, setHealth] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [dataStatus, setDataStatus] = useState(null);
  const [quality, setQuality] = useState(null);
  const [ingestStatus, setIngestStatus] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [overview, setOverview] = useState(null);
  const [rankings, setRankings] = useState(defaultRankings);
  const [scans, setScans] = useState(defaultScans);
  const [summary, setSummary] = useState(defaultSummary);
  const [docs, setDocs] = useState(null);
  const [adminLoaded, setAdminLoaded] = useState(false);
  const toastTimerRef = useRef();

  const pushToast = (text, tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, tone }].slice(-4));
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  };

  const refreshHome = async () => {
    const now = new Date().toISOString();
    const styleParam = `style=${encodeURIComponent(style)}`;
    const payload = await api(`/research/home?${styleParam}`);
    setHealth(payload.health || { status: "ok" });
    setOverview(payload.overview || null);
    setSummary(payload.summary || defaultSummary);
    setRankings(payload.rankings || defaultRankings);
    setScans(payload.scans || defaultScans);
    setTotalRows(Number(payload?.totals?.combined_rows || 0));
    setLastUpdated((prev) => ({
      ...prev,
      health: now,
      overview: now,
      summary: now,
      rankings: now,
      scans: now,
      totals: now,
    }));
    setLoading(false);
  };

  const refreshAdmin = async ({ includeDocs = false } = {}) => {
    const now = new Date().toISOString();
    const requests = [
      api("/data/status").then((d) => { setDataStatus(d); setLastUpdated((prev) => ({ ...prev, dataStatus: now })); }),
      api("/data/quality").then((d) => { setQuality(d); setLastUpdated((prev) => ({ ...prev, quality: now })); }),
      api("/ingest/status").then((d) => { setIngestStatus(d); setLastUpdated((prev) => ({ ...prev, ingestStatus: now })); }),
      api("/pipeline/status").then((d) => { setPipelineStatus(d); setLastUpdated((prev) => ({ ...prev, pipelineStatus: now })); }),
    ];
    if (includeDocs || !docs) {
      requests.push(
        api("/docs/text").then((d) => {
          setDocs(d || defaultDocs);
          setLastUpdated((prev) => ({ ...prev, docs: now }));
        })
      );
    }
    await Promise.all(requests);
    setAdminLoaded(true);
  };

  const refreshAll = async ({ includeAdmin = false, includeDocs = false } = {}) => {
    await refreshHome();
    if (includeAdmin) {
      await refreshAdmin({ includeDocs });
    }
  };

  const runAction = async (key, fn, successText) => {
    setBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await fn();
      setLastError("");
      pushToast(successText || `${key} completed`, "ok");
      return result;
    } catch (error) {
      setLastError(`${key}: ${error.message}`);
      pushToast(`${key} failed: ${error.message}`, "err");
      throw error;
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    refreshHome().catch((error) => {
      setLastError(`Initial load: ${error.message}`);
      pushToast(`Initial load failed: ${error.message}`, "err");
      setLoading(false);
    });

    return () => {
      window.clearTimeout(toastTimerRef.current);
    };
  }, [style]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(() => {
      refreshHome().catch((error) => {
        setLastError(`refresh: ${error.message}`);
        pushToast(`refresh failed: ${error.message}`, "err");
      });
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [autoRefresh, refreshMs, style]);

  useEffect(() => {
    if (activeView !== "admin") return;
    refreshAdmin({ includeDocs: !docs }).catch((error) => {
      setLastError(`admin load: ${error.message}`);
      pushToast(`admin load failed: ${error.message}`, "err");
    });
  }, [activeView]);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.activeView, activeView), [activeView]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.autoRefresh, String(autoRefresh)), [autoRefresh]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.refreshMs, String(refreshMs)), [refreshMs]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(watchlist)), [watchlist]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.style, style), [style]);

  const homePreview = useMemo(() => ({
    leaders: rankings?.leaders?.slice(0, 5) || [],
    laggards: rankings?.laggards?.slice(0, 5) || [],
    breakout: scans?.breakout_candidates?.slice(0, 4) || [],
    pullback: scans?.pullback_candidates?.slice(0, 4) || [],
    volatility: scans?.volatility_expansion?.slice(0, 4) || [],
    priority: summary?.priority_names?.slice(0, 3) || []
  }), [rankings, scans, summary]);

  const watchlistMap = useMemo(() => {
    const sources = [
      ...(rankings?.leaders || []),
      ...(rankings?.laggards || []),
      ...(scans?.breakout_candidates || []),
      ...(scans?.pullback_candidates || []),
      ...(scans?.volatility_expansion || []),
      ...(summary?.priority_names || [])
    ];
    return sources.reduce((acc, row) => {
      if (row?.ticker && !acc[row.ticker]) acc[row.ticker] = row;
      return acc;
    }, {});
  }, [rankings, scans, summary]);

  const watchlistRows = useMemo(() => watchlist.map((ticker) => watchlistMap[ticker]).filter(Boolean), [watchlist, watchlistMap]);

  const toggleWatchlist = (ticker) => {
    setWatchlist((prev) => prev.includes(ticker) ? prev.filter((item) => item !== ticker) : [...prev, ticker]);
  };

  const isWatchlisted = (ticker) => watchlist.includes(ticker);

  return {
    activeView,
    setActiveView,
    autoRefresh,
    setAutoRefresh,
    refreshMs,
    setRefreshMs,
    style,
    setStyle,
    watchlist,    homePreview,
    toggleWatchlist,
    isWatchlisted,
    busy,
    toasts,
    lastError,
    lastUpdated,
    loading,
    health,
    totalRows,
    dataStatus,
    quality,
    ingestStatus,
    pipelineStatus,
    overview,
    rankings,
    scans,
    summary,
    docs,
    adminLoaded,
    refreshHome,
    refreshAdmin,
    refreshAll,
    runAction
  };
}

