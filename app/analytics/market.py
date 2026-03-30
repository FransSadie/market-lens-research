from __future__ import annotations

import time
from copy import deepcopy

from sqlalchemy import select

from app.db.models import AnalyticsSnapshot
from app.db.session import get_db_session

SECTOR_ETFS = ["XLF", "XLK", "XLV", "XLY", "XLI", "XLE", "XLB", "XLU", "XLP"]
MACRO_ETFS = ["SPY", "QQQ", "IWM", "DIA", "TLT", "GLD"]
EXCLUDED_FROM_STOCK_RANKS = set(SECTOR_ETFS + MACRO_ETFS)
RESEARCH_HOME_CACHE_TTL_SECONDS = 10
_RESEARCH_HOME_CACHE: dict[str, tuple[float, dict]] = {}

STYLE_PROFILES = {
    "breakout": {
        "label": "Breakout",
        "description": "Favors names near highs with relative strength and confirming volume.",
        "priority_board": "breakout_candidates",
        "universe": "stocks",
    },
    "swing": {
        "label": "Swing",
        "description": "Favors trend names with enough pullback or structure for a cleaner multi-day entry.",
        "priority_board": "pullback_candidates",
        "universe": "stocks",
    },
    "momentum": {
        "label": "Momentum",
        "description": "Favors persistent outperformance, trend persistence, and strong participation.",
        "priority_board": "leaders",
        "universe": "stocks",
    },
    "mean_reversion": {
        "label": "Mean Reversion",
        "description": "Favors stretched names that may be due for a bounce or reset rather than trend continuation.",
        "priority_board": "pullback_candidates",
        "universe": "stocks",
    },
    "macro_etf": {
        "label": "Macro ETF",
        "description": "Favors macro and sector ETFs to read broad market leadership and rotation.",
        "priority_board": "macro",
        "universe": "macro",
    },
}


def _style_profile(style: str | None) -> dict:
    return STYLE_PROFILES.get((style or "breakout").lower(), STYLE_PROFILES["breakout"])


def _latest_analytics_snapshots() -> list[AnalyticsSnapshot]:
    session = get_db_session()
    try:
        rows = session.execute(
            select(AnalyticsSnapshot)
            .where(AnalyticsSnapshot.window_hours == 24)
            .order_by(AnalyticsSnapshot.ticker.asc(), AnalyticsSnapshot.window_end.desc())
        ).scalars().all()
    finally:
        session.close()

    latest = {}
    for row in rows:
        latest.setdefault(row.ticker, row)
    return list(latest.values())


def _snapshot_payload(row: AnalyticsSnapshot) -> dict:
    return {
        "ticker": row.ticker,
        "price_close": row.price_close,
        "return_1d": row.return_1d,
        "return_5d": row.price_return_5d,
        "return_20d": row.price_return_20d,
        "rel_to_spy_20d": row.rel_to_spy_return_20d,
        "rel_to_sector_20d": row.rel_to_sector_return_20d,
        "trend_slope_20d": row.trend_slope_20d,
        "volume_ratio_20d": row.volume_ratio_20d,
        "rsi_14": row.rsi_14,
        "breakout_20d": row.breakout_20d,
        "drawdown_20d": row.drawdown_20d,
        "volatility_regime_60d": row.volatility_regime_60d,
        "range_pct_1d": row.range_pct_1d,
        "market_corr_20d": row.market_corr_20d,
        "market_beta_20d": row.market_beta_20d,
    }


def _reason_list(payload: dict, style: str) -> list[str]:
    reasons: list[str] = []
    if (payload.get("rel_to_spy_20d") or 0) > 0.03:
        reasons.append("Outperforming SPY over the last month")
    if (payload.get("rel_to_sector_20d") or 0) > 0.02:
        reasons.append("Beating its sector peer group")
    if (payload.get("trend_slope_20d") or 0) > 0:
        reasons.append("Trend slope is positive")
    if (payload.get("volume_ratio_20d") or 0) > 1.1:
        reasons.append("Volume is running above normal")
    if (payload.get("breakout_20d") or -1) >= -0.01:
        reasons.append("Trading near a 20-day breakout level")
    if (payload.get("drawdown_20d") or 0) < -0.04:
        reasons.append("Meaningful pullback from recent highs")
    if (payload.get("rsi_14") or 50) < 40:
        reasons.append("RSI is leaning oversold")
    if (payload.get("volatility_regime_60d") or 0) > 1.0:
        reasons.append("Volatility regime is elevated")
    if style == "macro_etf" and (payload.get("market_corr_20d") or 0) > 0.6:
        reasons.append("Highly aligned with broad market direction")
    if style == "momentum" and (payload.get("return_20d") or 0) > 0.08:
        reasons.append("Strong 20-day momentum")
    if style == "mean_reversion" and (payload.get("drawdown_20d") or 0) < -0.05:
        reasons.append("Deep pullback may suit bounce setups")
    return reasons[:4]


def _style_score(payload: dict, style: str) -> float:
    rel_spy = payload.get("rel_to_spy_20d") or 0.0
    rel_sector = payload.get("rel_to_sector_20d") or 0.0
    trend = payload.get("trend_slope_20d") or 0.0
    volume_boost = (payload.get("volume_ratio_20d") or 1.0) - 1.0
    breakout = payload.get("breakout_20d") or 0.0
    drawdown = payload.get("drawdown_20d") or 0.0
    rsi = payload.get("rsi_14") or 50.0
    volatility = payload.get("volatility_regime_60d") or 0.0
    ret20 = payload.get("return_20d") or 0.0
    market_corr = payload.get("market_corr_20d") or 0.0

    if style == "breakout":
        return rel_spy + rel_sector + trend + volume_boost + max(breakout, -0.02)
    if style == "swing":
        return rel_spy + rel_sector + (trend * 0.8) + max(-drawdown, 0) - abs((rsi - 50) / 100)
    if style == "momentum":
        return rel_spy * 1.3 + rel_sector + ret20 + trend + volume_boost
    if style == "mean_reversion":
        return max(-drawdown, 0) + max(0, (45 - rsi) / 100) + rel_spy * 0.4 - volatility * 0.15
    if style == "macro_etf":
        return ret20 + (payload.get("return_5d") or 0.0) + trend + market_corr * 0.1
    return rel_spy + rel_sector + trend + volume_boost


def _build_market_overview_from_snapshots(snapshots: list[AnalyticsSnapshot], style: str | None = None) -> dict:
    profile = _style_profile(style)
    by_ticker = {row.ticker: row for row in snapshots}
    sector_rows = []
    broad_rows = []

    for ticker in SECTOR_ETFS:
        row = by_ticker.get(ticker)
        if not row:
            continue
        sector_rows.append(
            {
                "ticker": ticker,
                "price_close": row.price_close,
                "return_1d": row.return_1d,
                "return_5d": row.price_return_5d,
                "return_20d": row.price_return_20d,
                "trend_slope_20d": row.trend_slope_20d,
                "volatility_regime_60d": row.volatility_regime_60d,
            }
        )

    for ticker in MACRO_ETFS:
        row = by_ticker.get(ticker)
        if not row:
            continue
        broad_rows.append(
            {
                "ticker": ticker,
                "price_close": row.price_close,
                "return_1d": row.return_1d,
                "return_5d": row.price_return_5d,
                "return_20d": row.price_return_20d,
                "trend_slope_20d": row.trend_slope_20d,
                "volatility_regime_60d": row.volatility_regime_60d,
            }
        )

    strongest_sector = max(sector_rows, key=lambda row: row.get("return_20d") or -999.0, default=None)
    weakest_sector = min(sector_rows, key=lambda row: row.get("return_20d") or 999.0, default=None)
    market_regime = "mixed"
    spy = by_ticker.get("SPY")
    qqq = by_ticker.get("QQQ")
    if spy and qqq:
        if (spy.price_return_20d or 0) > 0 and (qqq.price_return_20d or 0) > 0:
            market_regime = "risk_on"
        elif (spy.price_return_20d or 0) < 0 and (qqq.price_return_20d or 0) < 0:
            market_regime = "risk_off"

    return {
        "market_regime": market_regime,
        "macro_etfs": broad_rows,
        "sector_etfs": sector_rows,
        "strongest_sector": strongest_sector,
        "weakest_sector": weakest_sector,
        "style_profile": {"id": style or "breakout", **profile},
    }


def _build_relative_strength_rankings_from_snapshots(snapshots: list[AnalyticsSnapshot], limit: int = 25, style: str | None = None) -> dict:
    style_id = (style or "breakout").lower()
    profile = _style_profile(style_id)
    rows = []
    for row in snapshots:
        if profile["universe"] == "stocks" and row.ticker in EXCLUDED_FROM_STOCK_RANKS:
            continue
        if profile["universe"] == "macro" and row.ticker not in (set(SECTOR_ETFS) | set(MACRO_ETFS)):
            continue
        payload = _snapshot_payload(row)
        payload["score"] = float(_style_score(payload, style_id))
        payload["reasons"] = _reason_list(payload, style_id)
        rows.append(payload)
    rows.sort(key=lambda item: item["score"], reverse=True)
    return {
        "leaders": rows[:limit],
        "laggards": list(reversed(rows[-limit:])),
        "style_profile": {"id": style_id, **profile},
    }


def _build_setup_scans_from_snapshots(snapshots: list[AnalyticsSnapshot], style: str | None = None) -> dict:
    style_id = (style or "breakout").lower()
    profile = _style_profile(style_id)
    breakout_candidates = []
    pullback_candidates = []
    volatility_candidates = []

    for row in snapshots:
        if profile["universe"] == "stocks" and row.ticker in EXCLUDED_FROM_STOCK_RANKS:
            continue
        if profile["universe"] == "macro" and row.ticker not in (set(SECTOR_ETFS) | set(MACRO_ETFS)):
            continue

        payload = _snapshot_payload(row)
        if (row.breakout_20d or -1) >= -0.01 and (row.rel_to_spy_return_20d or -1) > 0.03 and (row.volume_ratio_20d or 0) > 1.1:
            breakout_candidates.append({
                **payload,
                "reasons": _reason_list(payload, style_id),
                "fit": "High" if style_id in {"breakout", "momentum"} else "Medium",
            })
        if (row.drawdown_20d or 0) < -0.03 and (row.rel_to_spy_return_20d or 0) > 0.02 and (row.rsi_14 or 100) < 50:
            pullback_candidates.append({
                **payload,
                "reasons": _reason_list(payload, style_id),
                "fit": "High" if style_id in {"swing", "mean_reversion"} else "Medium",
            })
        if (row.volatility_regime_60d or 0) > 1.0 and (row.range_pct_1d or 0) > 0.03:
            volatility_candidates.append({
                **payload,
                "reasons": _reason_list(payload, style_id),
                "fit": "High" if style_id == "momentum" else "Medium",
            })

    breakout_candidates.sort(key=lambda item: (_style_score(item, style_id), (item["volume_ratio_20d"] or 0)), reverse=True)
    pullback_candidates.sort(key=lambda item: (_style_score(item, style_id), -abs(item["drawdown_20d"] or 0)), reverse=True)
    volatility_candidates.sort(key=lambda item: (_style_score(item, style_id), (item["range_pct_1d"] or 0)), reverse=True)

    return {
        "breakout_candidates": breakout_candidates[:15],
        "pullback_candidates": pullback_candidates[:15],
        "volatility_expansion": volatility_candidates[:15],
        "style_profile": {"id": style_id, **profile},
    }


def _build_daily_summary_from_components(overview: dict, rankings: dict, scans: dict, style: str | None = None) -> dict:
    style_id = (style or "breakout").lower()
    profile = _style_profile(style_id)
    strongest = overview.get("strongest_sector")
    weakest = overview.get("weakest_sector")
    leaders = ", ".join(item["ticker"] for item in rankings.get("leaders", [])[:3]) or "none"
    breakouts = ", ".join(item["ticker"] for item in scans.get("breakout_candidates", [])[:3]) or "none"
    pullbacks = ", ".join(item["ticker"] for item in scans.get("pullback_candidates", [])[:3]) or "none"

    if profile["priority_board"] == "leaders":
        priority_names = rankings.get("leaders", [])[:3]
    elif profile["priority_board"] == "pullback_candidates":
        priority_names = scans.get("pullback_candidates", [])[:3]
    elif profile["priority_board"] == "macro":
        priority_names = (overview.get("macro_etfs") or [])[:3]
    else:
        priority_names = scans.get("breakout_candidates", [])[:3]

    bullets = [f"Style focus: {profile['label']}. {profile['description']}"]
    if strongest:
        bullets.append(f"Strongest sector ETF: {strongest['ticker']} ({(strongest.get('return_20d') or 0) * 100:.1f}% over 20d).")
    if weakest:
        bullets.append(f"Weakest sector ETF: {weakest['ticker']} ({(weakest.get('return_20d') or 0) * 100:.1f}% over 20d).")
    bullets.append(f"Top relative-strength names: {leaders}.")
    if style_id in {"swing", "mean_reversion"}:
        bullets.append(f"Pullback candidates for this style: {pullbacks}.")
    else:
        bullets.append(f"Breakout scan leaders: {breakouts}.")
    bullets.append(f"Current broad-market regime reads as {overview.get('market_regime', 'mixed')}.")

    return {
        "headline": f"{profile['label']} pre-market brief",
        "bullets": bullets,
        "overview": overview,
        "style_profile": {"id": style_id, **profile},
        "priority_names": priority_names,
    }


def build_research_home(style: str | None = None) -> dict:
    style_id = (style or "breakout").lower()
    cached = _RESEARCH_HOME_CACHE.get(style_id)
    now = time.time()
    if cached and now - cached[0] < RESEARCH_HOME_CACHE_TTL_SECONDS:
        return deepcopy(cached[1])

    snapshots = _latest_analytics_snapshots()
    overview = _build_market_overview_from_snapshots(snapshots, style_id)
    rankings = _build_relative_strength_rankings_from_snapshots(snapshots, limit=12, style=style_id)
    scans = _build_setup_scans_from_snapshots(snapshots, style=style_id)
    summary = _build_daily_summary_from_components(overview, rankings, scans, style_id)

    payload = {
        "overview": overview,
        "rankings": rankings,
        "scans": scans,
        "summary": summary,
    }
    _RESEARCH_HOME_CACHE[style_id] = (now, payload)
    return deepcopy(payload)


def market_overview(style: str | None = None) -> dict:
    return build_research_home(style)["overview"]


def relative_strength_rankings(limit: int = 25, style: str | None = None) -> dict:
    if limit == 12:
        return build_research_home(style)["rankings"]
    snapshots = _latest_analytics_snapshots()
    return _build_relative_strength_rankings_from_snapshots(snapshots, limit=limit, style=style)


def setup_scans(style: str | None = None) -> dict:
    return build_research_home(style)["scans"]


def daily_summary(style: str | None = None) -> dict:
    return build_research_home(style)["summary"]
