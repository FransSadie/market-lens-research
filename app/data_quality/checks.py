from datetime import datetime, timedelta

from sqlalchemy import func, select, text

from app.db.models import AnalyticsSnapshot, IngestionRun, MarketPrice
from app.db.session import get_db_session


def data_status_snapshot() -> dict:
    session = get_db_session()
    try:
        market_total = session.execute(select(func.count(MarketPrice.id))).scalar_one()
        analytics_total = session.execute(select(func.count(AnalyticsSnapshot.id))).scalar_one()

        market_ranges = session.execute(
            select(
                MarketPrice.ticker,
                func.count(MarketPrice.id),
                func.min(MarketPrice.timestamp),
                func.max(MarketPrice.timestamp),
            )
            .where(MarketPrice.interval == "1d")
            .group_by(MarketPrice.ticker)
            .order_by(MarketPrice.ticker)
        ).all()

        return {
            "totals": {
                "market_prices": market_total,
                "analytics_snapshots": analytics_total,
            },
            "market_ranges": [
                {
                    "ticker": ticker,
                    "rows": int(rows),
                    "min_timestamp": min_ts.isoformat() if min_ts else None,
                    "max_timestamp": max_ts.isoformat() if max_ts else None,
                }
                for ticker, rows, min_ts, max_ts in market_ranges
            ],
        }
    finally:
        session.close()


def run_data_quality_checks() -> dict:
    session = get_db_session()
    try:
        duplicate_market = session.execute(
            text(
                """
                SELECT COUNT(*) FROM (
                    SELECT ticker, timestamp, COUNT(*) c
                    FROM market_prices
                    GROUP BY ticker, timestamp
                    HAVING COUNT(*) > 1
                ) t
                """
            )
        ).scalar_one()

        latest_run = session.execute(select(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(1)).scalar_one_or_none()
        latest_market = session.execute(select(func.max(MarketPrice.timestamp))).scalar_one()
        latest_analytics = session.execute(select(func.max(AnalyticsSnapshot.window_end))).scalar_one()

        now = datetime.utcnow()
        stale_market = bool(latest_market and latest_market < now - timedelta(days=5))
        stale_analytics = bool(latest_analytics and latest_analytics < now - timedelta(days=5))

        snapshot_nulls = session.execute(
            select(func.count(AnalyticsSnapshot.id)).where(AnalyticsSnapshot.price_close.is_(None))
        ).scalar_one()
        total_snapshots = session.execute(select(func.count(AnalyticsSnapshot.id))).scalar_one()

        return {
            "duplicate_keys": {
                "market_ticker_timestamp_duplicates": int(duplicate_market),
            },
            "null_checks": {
                "analytics_price_close_nulls": int(snapshot_nulls),
                "analytics_price_close_null_ratio": float(snapshot_nulls / total_snapshots) if total_snapshots else 0.0,
            },
            "freshness": {
                "latest_ingestion_run": latest_run.started_at.isoformat() if latest_run else None,
                "latest_market_timestamp": latest_market.isoformat() if latest_market else None,
                "latest_analytics_timestamp": latest_analytics.isoformat() if latest_analytics else None,
                "market_stale": stale_market,
                "analytics_stale": stale_analytics,
            },
        }
    finally:
        session.close()
