from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = Field(default="Market Lens Research", alias="APP_NAME")
    app_env: str = Field(default="dev", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    database_url: str = Field(default="sqlite:///./market_lens.db", alias="DATABASE_URL")

    market_tickers: str = Field(
        default="AAPL,MSFT,NVDA,AMZN,GOOGL,META,TSLA,AMD,AVGO,CRM,ORCL,ADBE,NFLX,CSCO,QCOM,JPM,GS,MS,V,MA,UNH,LLY,COST,WMT,KO,PEP,XOM,CVX,CAT,BA,GE,SPY,QQQ,IWM,DIA,XLF,XLK,XLV,XLY,XLI,XLE,XLB,XLU,XLP,TLT,GLD",
        alias="MARKET_TICKERS",
    )
    market_history_period: str = Field(default="5y", alias="MARKET_HISTORY_PERIOD")
    market_history_interval: str = Field(default="1d", alias="MARKET_HISTORY_INTERVAL")
    ingest_interval_minutes: int = Field(default=15, alias="INGEST_INTERVAL_MINUTES")

    @property
    def market_ticker_list(self) -> List[str]:
        return [ticker.strip().upper() for ticker in self.market_tickers.split(",") if ticker.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
