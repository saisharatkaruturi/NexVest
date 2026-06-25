// Portfolio API functions
import { createServerFn } from "@tanstack/react-start";
import { API_ENDPOINTS } from "./config";

// Types for Portfolio responses
export interface Holding {
  id: string;
  user_id: string;
  stock_id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
  exchange: string;
  last_updated: string;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_profit_loss: number;
  profit_loss_percent: number;
  day_profit_loss: number;
  day_profit_loss_percent: number;
  xirr: number;
  cagr: number;
  holdings_count: number;
  last_updated: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  stock_id: string;
  symbol: string;
  transaction_type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total_amount: number;
  brokerage: number;
  gst: number;
  stamp_duty: number;
  total_with_taxes: number;
  status: string;
  created_at: string;
}

// Server function to get portfolio summary
export const getPortfolioSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.portfolio.summary);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as PortfolioSummary;
    } catch (error) {
      console.error("Failed to fetch portfolio summary:", error);
      throw error;
    }
  });

// Server function to get holdings
export const getHoldings = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.portfolio.holdings);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Holding[];
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
      throw error;
    }
  });

// Server function to get transactions
export const getTransactions = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const params = (data as { limit?: number; transaction_type?: string } | undefined) || { limit: 50 };
    const limit = params?.limit ?? 50;
    const type = params?.transaction_type ? `&transaction_type=${params.transaction_type}` : "";
    try {
      const response = await fetch(`${API_ENDPOINTS.portfolio.transactions}?limit=${limit}${type}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Transaction[];
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      throw error;
    }
  });