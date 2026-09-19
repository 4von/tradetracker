export const KEY_TRADES = 'ttfx.trades.v1';
export const KEY_SETTINGS = 'ttfx.settings.v1';

export const DEFAULT_LOT_SIZES = {
  EURUSD: 100000, GBPUSD: 100000, USDJPY: 100000, USDCHF: 100000,
  AUDUSD: 100000, USDCAD: 100000, NZDUSD: 100000,
  EURGBP: 100000, EURJPY: 100000, GBPJPY: 100000, AUDJPY: 100000,
  XAUUSD: 100, XAGUSD: 5000,
  BTCUSD: 1, ETHUSD: 1, SOLUSD: 1, XRPUSD: 1, BNBUSD: 1,
  ADAUSD: 1, DOGEUSD: 1, LTCUSD: 1, AVAXUSD: 1, LINKUSD: 1,
};

export const ASSET_CLASS = {
  EURUSD:'forex', GBPUSD:'forex', USDJPY:'forex', USDCHF:'forex', AUDUSD:'forex',
  USDCAD:'forex', NZDUSD:'forex', EURGBP:'forex', EURJPY:'forex', GBPJPY:'forex', AUDJPY:'forex',
  XAUUSD:'metal', XAGUSD:'metal',
  BTCUSD:'crypto', ETHUSD:'crypto', SOLUSD:'crypto', XRPUSD:'crypto', BNBUSD:'crypto',
  ADAUSD:'crypto', DOGEUSD:'crypto', LTCUSD:'crypto', AVAXUSD:'crypto', LINKUSD:'crypto',
};

export const PRICE_DECIMALS = {
  EURUSD:5, GBPUSD:5, USDJPY:3, USDCHF:5, AUDUSD:5, USDCAD:5, NZDUSD:5,
  EURGBP:5, EURJPY:3, GBPJPY:3, AUDJPY:3,
  XAUUSD:2, XAGUSD:3,
  BTCUSD:2, ETHUSD:2, SOLUSD:2, XRPUSD:4, BNBUSD:2,
  ADAUSD:4, DOGEUSD:5, LTCUSD:2, AVAXUSD:2, LINKUSD:3,
};

export const STRATEGIES = [
  'Breakout','Trend Continuation','Range Reversal','Supply/Demand','Liquidity Sweep',
  'Order Block','Fair Value Gap','London Open','NY Open','News Play',
  'Mean Reversion','Momentum','Scalp','Swing',
];

export const TIMEFRAMES = ['1m','5m','15m','30m','1H','4H','1D','1W'];
export const SESSIONS = ['Asian','London','NY Overlap','New York','Sydney'];
export const DOW_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];