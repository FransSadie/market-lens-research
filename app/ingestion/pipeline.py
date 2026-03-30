from datetime import datetime
from typing import Iterable

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import IngestionRun, MarketPrice
from app.db.session import get_db_session
from app.ingestion.market_data import fetch_latest_prices, to_datetime


def _start_run(job_name: str) -> IngestionRun:
    session = get_db_session()
    try:
        run = IngestionRun(job_name=job_name, status="running", rows_inserted=0, started_at=datetime.utcnow())
        session.add(run)
        session.commit()
        session.refresh(run)
        return run
    finally:
        session.close()


def _finish_run(run_id: int, status: str, rows_inserted: int, message: str | None = None) -> None:
    session = get_db_session()
    try:
        run = session.get(IngestionRun, run_id)
        if not run:
            return
        run.status = status
        run.rows_inserted = rows_inserted
        run.message = message[:1000] if message else None
        run.completed_at = datetime.utcnow()
        session.commit()
    finally:
        session.close()


def _iter_price_rows(data: dict) -> Iterable[tuple[str, dict]]:
    for ticker, frame in data.items():
        for _, row in frame.iterrows():
            yield ticker, row.to_dict()


def run_market_ingestion() -> int:
    settings = get_settings()
    run = _start_run("market_ingestion")
    inserted = 0
    try:
        frames = fetch_latest_prices(
            settings.market_ticker_list,
            period=settings.market_history_period,
            interval=settings.market_history_interval,
        )

        session = get_db_session()
        try:
            for ticker, row in _iter_price_rows(frames):
                timestamp = to_datetime(row.get("Timestamp"))
                if not timestamp:
                    continue

                exists = session.execute(
                    select(MarketPrice.id).where(MarketPrice.ticker == ticker, MarketPrice.timestamp == timestamp)
                ).scalar_one_or_none()
                if exists:
                    continue

                model = MarketPrice(
                    ticker=ticker,
                    timestamp=timestamp,
                    interval=settings.market_history_interval,
                    open=_to_float(row.get("Open")),
                    high=_to_float(row.get("High")),
                    low=_to_float(row.get("Low")),
                    close=_to_float(row.get("Close")),
                    volume=_to_float(row.get("Volume")),
                )
                session.add(model)
                inserted += 1
            session.commit()
        finally:
            session.close()

        _finish_run(run.id, "success", inserted, f"Inserted {inserted} market rows")
        return inserted
    except Exception as exc:
        _finish_run(run.id, "failed", inserted, str(exc))
        return inserted


def run_active_ingestion() -> dict[str, int]:
    return {"market_inserted": run_market_ingestion()}


def run_all_ingestion() -> dict[str, int]:
    return run_active_ingestion()


def _to_float(value: object) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None
