import json
from pathlib import Path

from fastapi import APIRouter
from sqlalchemy import func, select

from app.analytics.market import daily_summary, market_overview, relative_strength_rankings, setup_scans
from app.analytics.pipeline import run_analytics_refresh
from app.data_quality.checks import data_status_snapshot, run_data_quality_checks
from app.db.models import AnalyticsSnapshot, IngestionRun, MarketPrice
from app.db.session import get_db_session
from app.ingestion.pipeline import run_active_ingestion

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.post("/ingest/run")
def ingest_run() -> dict:
    return run_active_ingestion()


@router.get("/ingest/status")
def ingest_status() -> dict:
    session = get_db_session()
    try:
        latest_run = session.execute(
            select(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(1)
        ).scalar_one_or_none()
        price_count = session.execute(select(func.count(MarketPrice.id))).scalar_one()
        analytics_count = session.execute(select(func.count(AnalyticsSnapshot.id))).scalar_one()
        return {
            "latest_run": {
                "job_name": latest_run.job_name if latest_run else None,
                "status": latest_run.status if latest_run else None,
                "rows_inserted": latest_run.rows_inserted if latest_run else None,
                "started_at": latest_run.started_at.isoformat() if latest_run else None,
            },
            "totals": {"market_prices": price_count, "analytics_snapshots": analytics_count},
        }
    finally:
        session.close()


@router.post("/pipeline/run")
def pipeline_run() -> dict:
    count = run_analytics_refresh(window_hours=24)
    return {"analytics_snapshots_updated": count}


@router.post("/run/full")
def run_full() -> dict:
    ingestion = run_active_ingestion()
    analytics = {"analytics_snapshots_updated": run_analytics_refresh(window_hours=24)}
    return {"ingestion": ingestion, "analytics": analytics}


@router.get("/pipeline/status")
def pipeline_status() -> dict:
    session = get_db_session()
    try:
        analytics_count = session.execute(select(func.count(AnalyticsSnapshot.id))).scalar_one()
        latest_run = session.execute(
            select(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(1)
        ).scalar_one_or_none()
        return {
            "latest_run": {
                "job_name": latest_run.job_name if latest_run else None,
                "status": latest_run.status if latest_run else None,
                "rows_inserted": latest_run.rows_inserted if latest_run else None,
                "started_at": latest_run.started_at.isoformat() if latest_run else None,
            },
            "totals": {"analytics_snapshots": analytics_count},
        }
    finally:
        session.close()


@router.get("/research/home")
def research_home(style: str = "breakout") -> dict:
    overview = market_overview(style=style)
    summary = daily_summary(style=style)
    rankings = relative_strength_rankings(limit=12, style=style)
    scans = setup_scans(style=style)

    session = get_db_session()
    try:
        price_count = session.execute(select(func.count(MarketPrice.id))).scalar_one()
        analytics_count = session.execute(select(func.count(AnalyticsSnapshot.id))).scalar_one()
    finally:
        session.close()

    return {
        "health": {"status": "ok"},
        "overview": overview,
        "summary": summary,
        "rankings": rankings,
        "scans": scans,
        "totals": {
            "market_prices": price_count,
            "analytics_snapshots": analytics_count,
            "combined_rows": price_count + analytics_count,
        },
    }


@router.get("/research/overview")
def research_overview(style: str = "breakout") -> dict:
    return market_overview(style=style)


@router.get("/research/rankings")
def research_rankings(limit: int = 25, style: str = "breakout") -> dict:
    return relative_strength_rankings(limit=limit, style=style)


@router.get("/research/scans")
def research_scans(style: str = "breakout") -> dict:
    return setup_scans(style=style)


@router.get("/research/summary")
def research_summary(style: str = "breakout") -> dict:
    return daily_summary(style=style)


@router.get("/data/status")
def data_status() -> dict:
    return data_status_snapshot()


@router.get("/data/quality")
def data_quality() -> dict:
    return run_data_quality_checks()


@router.get("/docs/text")
def docs_text() -> dict:
    root = Path(__file__).resolve().parents[2]
    readme = (root / "README.md").read_text(encoding="utf-8")
    overview = (root / "PROJECT_OVERVIEW.txt").read_text(encoding="utf-8")
    return {"readme_markdown": readme, "project_overview_text": overview}
