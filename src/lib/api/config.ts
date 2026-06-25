// API Configuration for connecting to fintech_auth_backend
// Use environment variables or default to local development

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
  },
  // Market
  market: {
    stocks: `${API_BASE_URL}/market/stocks`,
    search: (q: string) => `${API_BASE_URL}/market/stocks/search?q=${encodeURIComponent(q)}`,
    topGainers: `${API_BASE_URL}/market/stocks/top-gainers`,
    topLosers: `${API_BASE_URL}/market/stocks/top-losers`,
    mostActive: `${API_BASE_URL}/market/stocks/most-active`,
    stock: (symbol: string) => `${API_BASE_URL}/market/stocks/${encodeURIComponent(symbol)}`,
    indices: `${API_BASE_URL}/market/indices`,
    candles: (symbol: string, interval: string) => `${API_BASE_URL}/market/candles/${encodeURIComponent(symbol)}?interval=${interval}`,
  },
  // Portfolio
  portfolio: {
    holdings: `${API_BASE_URL}/portfolio/holdings`,
    transactions: `${API_BASE_URL}/portfolio/transactions`,
    summary: `${API_BASE_URL}/portfolio/summary`,
  },
  // AI Prediction
  ai: {
    predict: (symbol: string) => `${API_BASE_URL}/ai/predict/${encodeURIComponent(symbol)}`,
    sentiment: (symbol: string) => `${API_BASE_URL}/ai/sentiment/${encodeURIComponent(symbol)}`,
    signals: (symbol: string) => `${API_BASE_URL}/ai/signals/${encodeURIComponent(symbol)}`,
    recommendation: (symbol: string) => `${API_BASE_URL}/ai/recommendation/${encodeURIComponent(symbol)}`,
  },
  // Watchlist
  watchlist: {
    list: `${API_BASE_URL}/watchlist`,
    add: `${API_BASE_URL}/watchlist/add`,
    remove: (symbol: string) => `${API_BASE_URL}/watchlist/remove/${encodeURIComponent(symbol)}`,
  },
  // Investments
  investments: {
    mutualFunds: `${API_BASE_URL}/mutual-funds`,
    sip: `${API_BASE_URL}/sip`,
    ipo: `${API_BASE_URL}/ipo`,
  },
  // Alerts
  alerts: {
    list: `${API_BASE_URL}/alerts`,
    create: `${API_BASE_URL}/alerts/create`,
  },
} as const;