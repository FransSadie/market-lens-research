from app.core.logging import setup_logging
from app.db.schema import ensure_schema
from app.analytics.pipeline import run_analytics_refresh


def main() -> None:
    setup_logging()
    ensure_schema()
    result = {"analytics_snapshots_updated": run_analytics_refresh(window_hours=24)}
    print(result)


if __name__ == "__main__":
    main()
