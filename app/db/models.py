from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketPrice(Base):
    __tablename__ = "market_prices"
    __table_args__ = (UniqueConstraint("ticker", "timestamp", name="uq_market_ticker_timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True)
    interval: Mapped[str] = mapped_column(String(16), nullable=False, default="1d")
    open: Mapped[float | None] = mapped_column(Float, nullable=True)
    high: Mapped[float | None] = mapped_column(Float, nullable=True)
    low: Mapped[float | None] = mapped_column(Float, nullable=True)
    close: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    rows_inserted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    message: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"
    __table_args__ = (UniqueConstraint("ticker", "window_end", "window_hours", name="uq_analytics_window"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    window_end: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, index=True)
    window_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    price_close: Mapped[float | None] = mapped_column(Float, nullable=True)
    return_1d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_return_2d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_return_3d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_return_5d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_return_10d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_return_15d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_return_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    ma_gap_5d: Mapped[float | None] = mapped_column(Float, nullable=True)
    ma_gap_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    ma_crossover_5_20: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_gap_12d: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_gap_26d: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_crossover_12_26: Mapped[float | None] = mapped_column(Float, nullable=True)
    range_pct_1d: Mapped[float | None] = mapped_column(Float, nullable=True)
    atr_14_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    rolling_volatility_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    downside_volatility_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    volatility_regime_60d: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_zscore_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_change_5d: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_ratio_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    rsi_5: Mapped[float | None] = mapped_column(Float, nullable=True)
    rsi_14: Mapped[float | None] = mapped_column(Float, nullable=True)
    bollinger_z_20: Mapped[float | None] = mapped_column(Float, nullable=True)
    breakout_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    drawdown_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    trend_slope_10d: Mapped[float | None] = mapped_column(Float, nullable=True)
    trend_slope_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    up_day_ratio_10d: Mapped[float | None] = mapped_column(Float, nullable=True)
    rel_to_spy_return_5d: Mapped[float | None] = mapped_column(Float, nullable=True)
    rel_to_spy_return_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    rel_to_qqq_return_5d: Mapped[float | None] = mapped_column(Float, nullable=True)
    rel_to_sector_return_5d: Mapped[float | None] = mapped_column(Float, nullable=True)
    rel_to_sector_return_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    market_beta_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    market_corr_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    sector_corr_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_vs_spy_ratio_20d: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
