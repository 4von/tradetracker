import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Chart, registerables } from 'chart.js';
import { PRICE_DECIMALS } from './lib/constants.js';
import { registerPriceDecimals } from './lib/format.js';

// Wire price decimals into the format module
registerPriceDecimals(PRICE_DECIMALS);

Chart.register(...registerables);
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = 'rgba(148,163,184,0.08)';
Chart.defaults.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif";
Chart.defaults.font.size = 11;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);