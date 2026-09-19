# TradeTracker FX

A modern Forex & Crypto trading journal with detailed performance analytics.

## Features
- USD-denominated trade logging (forex, metals, crypto)
- Net P&L after commissions and swap/funding
- R-multiple tracking per trade
- Equity curve, drawdown, profit factor, expectancy
- Strategy / session / day-of-week analytics
- Daily P&L calendar heatmap
- Position size calculator
- CSV import/export
- All data stored locally in the browser (localStorage)

## Local dev
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy
Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.

⚠️ Remember to update `base` in `vite.config.js` to match your repo name.