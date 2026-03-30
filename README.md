# Market Lens Research

Market Lens Research is a market research and signal-discovery tool.

The active system now focuses on:
- ingesting market prices from Yahoo Finance
- building analytics snapshots from price action
- surfacing market regime, sector leadership, and relative strength
- scanning for setups like breakouts, pullbacks, and volatility expansion
- serving a dashboard for daily market research

This repo is no longer centered on prediction accuracy or model experimentation as the main product story. The old model and news stack has been removed from the active codebase so the project can stay focused on research workflow.

## 1) Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Recommended `.env` settings:
- `APP_NAME=Market Lens Research`
- `MARKET_TICKERS=AAPL,MSFT,NVDA,AMZN,GOOGL,META,TSLA,AMD,AVGO,CRM,ORCL,ADBE,NFLX,CSCO,QCOM,JPM,GS,MS,V,MA,UNH,LLY,COST,WMT,KO,PEP,XOM,CVX,CAT,BA,GE,SPY,QQQ,IWM,DIA,XLF,XLK,XLV,XLY,XLI,XLE,XLB,XLU,XLP,TLT,GLD`
- `MARKET_HISTORY_PERIOD=5y`
- `MARKET_HISTORY_INTERVAL=1d`

## 2) Run API

```bash
uvicorn app.main:app --reload
```

Shortcut:

```bash
npm start
```

## 3) Run frontend dashboard

```bash
cd frontend
npm install
npm run dev
```

Shortcut from project root:

```bash
npm run frontend
```

Open:
- `http://127.0.0.1:5173`

The dashboard now gives you:
- a market overview
- macro ETF context
- sector leadership
- relative-strength leaders and laggards
- setup scans
- quick research operations
- data status and quality views
- embedded docs

## 4) Run market ingestion

```bash
python -m app.ingestion.run_once
```

Or via API:
- `POST /ingest/run`

## 5) Run analytics refresh

```bash
python -m app.analytics.run_once
```

This computes the market analytics used by the research desk, including:
- multi-horizon returns
- moving-average and EMA structure
- ATR / range / volatility
- RSI and Bollinger z-score
- breakout and drawdown context
- trend slopes
- relative strength vs SPY, QQQ, and sector ETFs
- market and sector correlation context

## 6) Research API

Research endpoints:
- `GET /research/overview`
- `GET /research/rankings?limit=25`
- `GET /research/scans`
- `GET /research/summary`

Operational endpoints still used by the dashboard:
- `GET /health`
- `POST /ingest/run`
- `GET /ingest/status`
- `POST /pipeline/run`
- `GET /pipeline/status`
- `GET /data/status`
- `GET /data/quality`
- `POST /run/full`
- `GET /docs/text`

## 7) Product Direction

This repo is intentionally focused on helping a human answer:
- what parts of the market are strongest?
- what parts are weakest?
- which names are outperforming?
- which setups deserve attention?

That means the repo now emphasizes:
- rankings
- scans
- summaries
- research workflow speed

More than:
- predictive accuracy
- model comparison
- automated trading claims

## 8) Current Reality

The current pivot is centered on a research desk workflow:
- overview of macro ETFs and sector ETFs
- relative-strength ranking of equities
- scanner outputs for breakout, pullback, and volatility-expansion setups
- daily summary bullets generated from the current market state

The active repo is now cleanly centered on market research rather than prediction infrastructure.

## 9) Suggested Next Steps

Best next steps for this repo:
1. add watchlists and saved ticker views
2. add stronger market breadth and sector rotation analytics
3. add export and alerting paths for ranked names and scans
4. tighten the UI into a cleaner research-terminal style
