// Real market data client. Fetches from backend with offline fallback.
// When backend is reachable, prices come from /market/stocks + /market/indices.
// When not, we keep ticking locally so the UI never goes stale.

import { API_ENDPOINTS } from "./config";

export interface QuotePayload {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  name?: string;
  type?: "stock" | "crypto" | "index" | "commodity" | "etf" | "mf";
  exchange?: string;
}

export type MarketDataSource = "backend" | "local";

let lastSource: MarketDataSource = "local";
let lastFetchAt = 0;
const listeners = new Set<(s: MarketDataSource, ts: number) => void>();

export function getDataSource(): MarketDataSource { return lastSource; }
export function getLastFetchAt(): number { return lastFetchAt; }
export function subscribeDataSource(fn: (s: MarketDataSource, ts: number) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setSource(s: MarketDataSource) {
  lastSource = s;
  lastFetchAt = Date.now();
  listeners.forEach((fn) => fn(s, lastFetchAt));
}

async function tryFetch(url: string, timeoutMs = 3000): Promise<unknown | null> {
  try {
    const res = await Promise.race([
      fetch(url, { headers: { Accept: "application/json" } }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
    ]);
    if (!(res as Response).ok) return null;
    return await (res as Response).json();
  } catch {
    return null;
  }
}

function normalize(raw: any): QuotePayload[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.results) ? raw.results : [];
  return arr
    .map((r: any) => {
      const symbol = r.symbol || r.ticker || r.s;
      if (!symbol) return null;
      const price = Number(r.price ?? r.last_price ?? r.ltp ?? r.close ?? r.c);
      if (!Number.isFinite(price)) return null;
      const change = Number(r.change ?? r.net_change ?? 0);
      const changePct = Number(r.changePct ?? r.change_percent ?? r.pct_change ?? 0);
      return {
        symbol: String(symbol).toUpperCase(),
        price,
        change: Number.isFinite(change) ? change : 0,
        changePct: Number.isFinite(changePct) ? changePct : 0,
        name: r.name,
        type: r.type,
        exchange: r.exchange,
      } as QuotePayload;
    })
    .filter((x: QuotePayload | null): x is QuotePayload => x !== null);
}

/** Fetch all live quotes (stocks + indices) from the backend. Returns null if backend is down. */
export async function fetchLiveQuotes(): Promise<QuotePayload[] | null> {
  const [stocks, indices] = await Promise.all([
    tryFetch(API_ENDPOINTS.market.stocks),
    tryFetch(API_ENDPOINTS.market.indices),
  ]);
  if (stocks === null && indices === null) {
    setSource("local");
    return null;
  }
  const merged = [...normalize(stocks), ...normalize(indices)];
  if (merged.length === 0) {
    setSource("local");
    return null;
  }
  setSource("backend");
  return merged;
}

/** Top gainers/losers/active */
export async function fetchTopMovers(direction: "gainers" | "losers" | "active"): Promise<QuotePayload[] | null> {
  const url = direction === "gainers" ? API_ENDPOINTS.market.topGainers
            : direction === "losers" ? API_ENDPOINTS.market.topLosers
            : API_ENDPOINTS.market.mostActive;
  const raw = await tryFetch(url);
  if (raw === null) return null;
  const out = normalize(raw);
  if (out.length === 0) return null;
  setSource("backend");
  return out;
}

/** Single-symbol quote */
export async function fetchQuote(symbol: string): Promise<QuotePayload | null> {
  const raw = await tryFetch(API_ENDPOINTS.market.stock(symbol));
  if (raw === null) return null;
  const arr = normalize(raw);
  if (arr.length === 0) return null;
  setSource("backend");
  return arr[0];
}

/** Polling loop: caller passes the setQuoteFn. Returns stop function. */
export function startMarketPolling(
  setQuote: (symbol: string, q: { price: number; change: number; changePct: number; ts: number }) => void,
  intervalMs = 10000,
): () => void {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const quotes = await fetchLiveQuotes();
    if (quotes && quotes.length > 0) {
      for (const q of quotes) {
        setQuote(q.symbol, { price: q.price, change: q.change, changePct: q.changePct, ts: Date.now() });
      }
    }
  };
  tick();
  const id = setInterval(tick, intervalMs);
  return () => { stopped = true; clearInterval(id); };
}
