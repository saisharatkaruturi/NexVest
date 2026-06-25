// Market/Stock API functions
import { createServerFn } from "@tanstack/react-start";
import { API_ENDPOINTS } from "./config";

// Types for Stock responses
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  avg_volume: number;
  market_cap: number | null;
  pe_ratio: number | null;
  eps: number | null;
  high_52w: number | null;
  low_52w: number | null;
  is_active: boolean;
  last_updated: string;
}

export interface StockSearchResult {
  stocks: Stock[];
  total: number;
}

export interface StockWithSparkline extends Stock {
  sparkline?: number[];
}

// Server function to get all stocks
export const getStocks = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const params = data || { limit: 100, offset: 0 };
    const limit = params?.limit ?? 100;
    const offset = params?.offset ?? 0;
    try {
      const response = await fetch(`${API_ENDPOINTS.market.stocks}?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Stock[];
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
      throw error;
    }
  });

// Server function to search stocks
export const searchStocks = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const params = data || { query: "", limit: 20 };
    const query = params?.query || "";
    const limit = params?.limit ?? 20;
    try {
      const response = await fetch(`${API_ENDPOINTS.market.search(query)}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as StockSearchResult;
    } catch (error) {
      console.error("Failed to search stocks:", error);
      throw error;
    }
  });

// Server function to get top gainers
export const getTopGainers = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const limit = data || 10;
    try {
      const response = await fetch(`${API_ENDPOINTS.market.topGainers}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Stock[];
    } catch (error) {
      console.error("Failed to fetch top gainers:", error);
      throw error;
    }
  });

// Server function to get top losers
export const getTopLosers = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const limit = data || 10;
    try {
      const response = await fetch(`${API_ENDPOINTS.market.topLosers}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Stock[];
    } catch (error) {
      console.error("Failed to fetch top losers:", error);
      throw error;
    }
  });

// Server function to get most active stocks
export const getMostActive = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const limit = data || 10;
    try {
      const response = await fetch(`${API_ENDPOINTS.market.mostActive}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Stock[];
    } catch (error) {
      console.error("Failed to fetch most active:", error);
      throw error;
    }
  });

// Server function to get stock by symbol
export const getStock = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const symbol = data || "RELIANCE";
    try {
      const response = await fetch(API_ENDPOINTS.market.stock(symbol));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Stock;
    } catch (error) {
      console.error("Failed to fetch stock:", error);
      throw error;
    }
  });