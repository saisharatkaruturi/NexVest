// AI Prediction API functions
import { createServerFn } from "@tanstack/react-start";
import { API_ENDPOINTS } from "./config";

// Types for AI Prediction responses
export interface Prediction {
  symbol: string;
  prediction_date: string;
  prediction_direction: "UP" | "DOWN" | "SIDEWAYS";
  confidence_score: number;
  model_used: string;
  features: {
    rsi: number;
    macd: number;
    sma_20: number;
    sma_50: number;
    volume_ratio: number;
    volatility: number;
  };
  recommendation: string;
  price_target: {
    current_price: number;
    target_price: number;
    stop_loss: number;
    upside_percent: number;
    downside_percent: number;
  };
  risk_level: string;
}

export interface Sentiment {
  symbol: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  score: number;
  rsi: number;
  momentum: number;
  news_count: number;
  last_updated: string;
}

export interface TechnicalSignals {
  symbol: string;
  rsi: { value: number; signal: string };
  macd: { value: number; signal: string };
  moving_averages: {
    sma_20: number;
    sma_50: number;
    sma_200: number;
    signal: string;
  };
  bollinger_bands: { upper: number; middle: number; lower: number; signal: string };
  overall_signal: string;
  last_updated: string;
}

export interface Recommendation {
  symbol: string;
  prediction: Prediction;
  sentiment: Sentiment;
  signals: TechnicalSignals;
  overall_recommendation: string;
  risk_level: string;
}

// Server function to get prediction for a symbol
export const getPrediction = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const symbol = data || "RELIANCE";
    try {
      const response = await fetch(API_ENDPOINTS.ai.predict(symbol));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Prediction;
    } catch (error) {
      console.error("Failed to fetch prediction:", error);
      throw error;
    }
  });

// Server function to get sentiment for a symbol
export const getSentiment = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const symbol = data || "RELIANCE";
    try {
      const response = await fetch(API_ENDPOINTS.ai.sentiment(symbol));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Sentiment;
    } catch (error) {
      console.error("Failed to fetch sentiment:", error);
      throw error;
    }
  });

// Server function to get technical signals for a symbol
export const getTechnicalSignals = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const symbol = data || "RELIANCE";
    try {
      const response = await fetch(API_ENDPOINTS.ai.signals(symbol));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as TechnicalSignals;
    } catch (error) {
      console.error("Failed to fetch signals:", error);
      throw error;
    }
  });

// Server function to get complete recommendation for a symbol
export const getRecommendation = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const symbol = data || "RELIANCE";
    try {
      const response = await fetch(API_ENDPOINTS.ai.recommendation(symbol));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Recommendation;
    } catch (error) {
      console.error("Failed to fetch recommendation:", error);
      throw error;
    }
  });

// Get multiple stock predictions at once
export const getMultiplePredictions = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const symbols = data || ["RELIANCE", "TCS", "HDFCBANK", "INFY", "BTC", "ETH"];
    try {
      const predictions = await Promise.all(
        symbols.map(async (symbol: string) => {
          const response = await fetch(API_ENDPOINTS.ai.predict(symbol));
          if (!response.ok) {
            return { symbol, error: true };
          }
          return (await response.json()) as Prediction;
        })
      );
      return predictions;
    } catch (error) {
      console.error("Failed to fetch multiple predictions:", error);
      throw error;
    }
  });