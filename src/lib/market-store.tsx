import {
  createContext, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from "react";
import {
  indices as seedIndices,
  stocks as seedStocks,
  crypto as seedCrypto,
  commodities as seedCommodities,
  mutualFunds as seedFunds,
  ipos as seedIpos,
  newsItems as seedNews,
  holdings as seedHoldings,
  type Asset,
} from "./mock-data";

/* -------------------- Types -------------------- */

export type OrderType = "MARKET" | "LIMIT" | "STOP" | "STOP_LOSS";
export type OrderKind = "BUY" | "SELL";
export type OrderStatus = "OPEN" | "EXECUTED" | "CANCELLED";

export interface Order {
  id: string;
  symbol: string;
  kind: OrderKind;
  type: OrderType;
  qty: number;
  price: number;
  status: OrderStatus;
  createdAt: number;
}

export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  realized: number;
}

export interface Trade {
  id: string;
  symbol: string;
  kind: OrderKind;
  qty: number;
  price: number;
  total: number;
  at: number;
}

export interface FundHolding {
  id: string;
  name: string;
  category: string;
  amount: number;
  units: number;
  nav: number;
  startedAt: number;
}

export interface SIP {
  id: string;
  fundId: string;
  fundName: string;
  monthly: number;
  frequency: "Daily" | "Weekly" | "Monthly";
  stepUp: number;
  startedAt: number;
}

export interface GoldHolding {
  grams: number;
  avgPrice: number;
  invested: number;
}

export interface IPOApplication {
  id: string;
  name: string;
  lots: number;
  amount: number;
  appliedAt: number;
  status: "PENDING" | "ALLOTTED" | "REFUNDED";
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  tag: string;
  body: string;
  url?: string;
}

export interface CourseProgress {
  id: string;
  title: string;
  level: string;
  totalLessons: number;
  doneLessons: number;
}

export interface State {
  // Prices are derived from base + drift; base stays constant in this session
  base: Record<string, Asset>;
  // Live ticking prices
  live: Record<string, { price: number; change: number; changePct: number; ts: number }>;
  wallet: number; // INR cash
  orders: Order[];
  positions: Position[];
  trades: Trade[];
  fundHoldings: FundHolding[];
  sips: SIP[];
  goldHolding: GoldHolding;
  ipoApplications: IPOApplication[];
  watchlists: Watchlist[];
  activeWatchlist: string;
  notifications: Notification[];
  courses: CourseProgress[];
  theme: "dark" | "light";
  marketOpen: boolean;
}

type Action =
  | { type: "TICK"; live: State["live"] }
  | { type: "SET_LIVE_QUOTE"; symbol: string; price: number; change: number; changePct: number }
  | { type: "PLACE_ORDER"; order: Order; trade?: Trade; position: Position | null; walletDelta: number }
  | { type: "CANCEL_ORDER"; id: string }
  | { type: "ADD_WATCHLIST"; name: string }
  | { type: "SET_ACTIVE_WATCHLIST"; id: string }
  | { type: "ADD_TO_WATCHLIST"; symbol: string; listId?: string }
  | { type: "REMOVE_FROM_WATCHLIST"; symbol: string; listId?: string }
  | { type: "ADD_FUND"; fund: FundHolding }
  | { type: "ADD_SIP"; sip: SIP }
  | { type: "BUY_GOLD"; grams: number; price: number; total: number }
  | { type: "SELL_GOLD"; grams: number; price: number; grossValue: number }
  | { type: "START_GOLD_SIP"; sipId: string; amount: number; frequency: "Daily" | "Weekly" | "Monthly" }
  | { type: "APPLY_IPO"; app: IPOApplication }
  | { type: "MARKET_OPEN"; open: boolean }
  | { type: "PUSH_NOTIFICATION"; n: Notification }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "START_COURSE"; id: string; title: string; level: string; lessons: number }
  | { type: "COMPLETE_LESSON"; id: string }
  | { type: "SET_THEME"; theme: "dark" | "light" }
  | { type: "ADD_FUNDS"; amount: number }
  | { type: "HYDRATE"; partial: Partial<State> };

/* -------------------- Seed building -------------------- */

function allBase(): Asset[] {
  return [
    ...seedIndices,
    ...seedStocks,
    ...seedCrypto,
    ...seedCommodities,
  ];
}

function makeBaseMap(): Record<string, Asset> {
  const out: Record<string, Asset> = {};
  for (const a of allBase()) out[a.symbol] = a;
  return out;
}

function liveFromBase(base: Record<string, Asset>): State["live"] {
  const out: State["live"] = {};
  for (const sym of Object.keys(base)) {
    const a = base[sym];
    out[sym] = { price: a.price, change: a.change, changePct: a.changePct, ts: Date.now() };
  }
  return out;
}

function makeEmptyUserState(): Partial<State> {
  return {
    wallet: 0,
    orders: [],
    positions: [],
    trades: [],
    fundHoldings: [],
    sips: [],
    goldHolding: { grams: 0, avgPrice: 0, invested: 0 },
    ipoApplications: [],
    watchlists: [
      { id: "wl-1", name: "My Stocks", symbols: [] },
      { id: "wl-2", name: "Crypto Picks", symbols: [] },
      { id: "wl-3", name: "Long Term", symbols: [] },
      { id: "wl-4", name: "Swing Trades", symbols: [] },
    ],
    activeWatchlist: "wl-1",
    notifications: [
      { id: `n-seed-${Date.now()}`, title: "Welcome to NexVest", body: "Your account is set up. Add funds to start investing today.", at: Date.now(), read: false },
    ],
    courses: [],
    theme: "dark",
  };
}

function makeDemoSeedState(): Partial<State> {
  return {
    wallet: 12480,
    watchlists: [
      { id: "wl-1", name: "My Stocks", symbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "BHARTIARTL"] },
      { id: "wl-2", name: "Crypto Picks", symbols: ["BTC", "ETH", "SOL"] },
      { id: "wl-3", name: "Long Term", symbols: ["RELIANCE", "TCS", "HDFCBANK"] },
      { id: "wl-4", name: "Swing Trades", symbols: ["TATAMOTORS", "ADANIENT", "WIPRO"] },
    ],
    activeWatchlist: "wl-1",
    notifications: [
      { id: "n-seed-1", title: "Welcome to NexVest", body: "Your account is set up. Start investing today.", at: Date.now() - 1000 * 60 * 60 * 2, read: false },
      { id: "n-seed-2", title: "BTC crossed $95K", body: "Bitcoin is up 4.2% in the last 24 hours.", at: Date.now() - 1000 * 60 * 45, read: false },
      { id: "n-seed-3", title: "SIP reminder", body: "Your monthly SIP will be deducted tomorrow.", at: Date.now() - 1000 * 60 * 15, read: false },
    ],
  };
}

const initialState: State = {
  base: makeBaseMap(),
  live: liveFromBase(makeBaseMap()),
  wallet: 0,
  orders: [],
  positions: [],
  trades: [],
  fundHoldings: [],
  sips: [],
  goldHolding: { grams: 0, avgPrice: 0, invested: 0 },
  ipoApplications: [],
  watchlists: [
    { id: "wl-1", name: "My Stocks", symbols: [] },
    { id: "wl-2", name: "Crypto Picks", symbols: [] },
    { id: "wl-3", name: "Long Term", symbols: [] },
    { id: "wl-4", name: "Swing Trades", symbols: [] },
  ],
  activeWatchlist: "wl-1",
  notifications: [],
  courses: [],
  theme: "dark",
  marketOpen: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TICK":
      return { ...state, live: action.live };
    case "SET_LIVE_QUOTE": {
      const cur = state.live[action.symbol];
      if (!cur) return state;
      return {
        ...state,
        live: {
          ...state.live,
          [action.symbol]: {
            price: action.price,
            change: action.change,
            changePct: action.changePct,
            ts: Date.now(),
          },
        },
      };
    }
    case "PLACE_ORDER": {
      return {
        ...state,
        orders: [action.order, ...state.orders],
        positions: action.position
          ? (() => {
              const idx = state.positions.findIndex((p) => p.symbol === action.position!.symbol);
              if (idx === -1) return [...state.positions, action.position!];
              const existing = state.positions[idx];
              const updated: Position = {
                symbol: existing.symbol,
                qty: existing.qty + action.position.qty,
                avgPrice:
                  (existing.qty * existing.avgPrice + action.position.qty * action.position.avgPrice) /
                  (existing.qty + action.position.qty || 1),
                realized: existing.realized + action.position.realized,
              };
              const next = [...state.positions];
              next[idx] = updated;
              return next;
            })()
          : state.positions,
        trades: action.trade ? [action.trade, ...state.trades] : state.trades,
        wallet: state.wallet + action.walletDelta,
      };
    }
    case "CANCEL_ORDER":
      return { ...state, orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: "CANCELLED" } : o)) };
    case "ADD_WATCHLIST":
      return {
        ...state,
        watchlists: [...state.watchlists, { id: `wl-${Date.now()}`, name: action.name, symbols: [] }],
      };
    case "SET_ACTIVE_WATCHLIST":
      return { ...state, activeWatchlist: action.id };
    case "ADD_TO_WATCHLIST": {
      const listId = action.listId ?? state.activeWatchlist;
      return {
        ...state,
        watchlists: state.watchlists.map((w) =>
          w.id === listId && !w.symbols.includes(action.symbol)
            ? { ...w, symbols: [...w.symbols, action.symbol] }
            : w
        ),
      };
    }
    case "REMOVE_FROM_WATCHLIST": {
      const listId = action.listId ?? state.activeWatchlist;
      return {
        ...state,
        watchlists: state.watchlists.map((w) =>
          w.id === listId ? { ...w, symbols: w.symbols.filter((s) => s !== action.symbol) } : w
        ),
      };
    }
    case "ADD_FUND":
      return { ...state, fundHoldings: [action.fund, ...state.fundHoldings], wallet: state.wallet - action.fund.amount };
    case "ADD_SIP":
      return { ...state, sips: [action.sip, ...state.sips] };
    case "BUY_GOLD": {
      const newGrams = state.goldHolding.grams + action.grams;
      const newInvested = state.goldHolding.invested + action.total;
      return {
        ...state,
        goldHolding: { grams: newGrams, avgPrice: newGrams > 0 ? newInvested / newGrams : 0, invested: newInvested },
        wallet: state.wallet - action.total,
      };
    }
    case "SELL_GOLD": {
      const newGrams = Math.max(0, state.goldHolding.grams - action.grams);
      const ratio = state.goldHolding.grams > 0 ? newGrams / state.goldHolding.grams : 0;
      return {
        ...state,
        goldHolding: { ...state.goldHolding, grams: newGrams, invested: state.goldHolding.invested * ratio },
        wallet: state.wallet + action.grossValue,
      };
    }
    case "START_GOLD_SIP":
      return { ...state, wallet: state.wallet - action.amount };
    case "APPLY_IPO":
      return { ...state, ipoApplications: [action.app, ...state.ipoApplications], wallet: state.wallet - action.app.amount };
    case "MARKET_OPEN":
      return { ...state, marketOpen: action.open };
    case "PUSH_NOTIFICATION":
      return { ...state, notifications: [action.n, ...state.notifications].slice(0, 50) };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };
    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: [] };
    case "START_COURSE":
      if (state.courses.find((c) => c.id === action.id)) return state;
      return {
        ...state,
        courses: [...state.courses, { id: action.id, title: action.title, level: action.level, totalLessons: action.lessons, doneLessons: 0 }],
      };
    case "COMPLETE_LESSON":
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.id ? { ...c, doneLessons: Math.min(c.totalLessons, c.doneLessons + 1) } : c
        ),
      };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "ADD_FUNDS":
      return { ...state, wallet: state.wallet + action.amount };
    case "HYDRATE":
      return { ...state, ...action.partial };
  }
}

/* -------------------- Context -------------------- */

interface MarketContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  // Selectors
  quote: (symbol: string) => State["live"][string] | undefined;
  allQuotes: () => State["live"];
  baseAsset: (symbol: string) => Asset | undefined;
  holdings: () => { symbol: string; qty: number; avg: number; ltp: number; invested: number; current: number; changePct: number }[];
  // Actions
  placeOrder: (input: { symbol: string; kind: OrderKind; type: OrderType; qty: number; price?: number }) => { ok: boolean; reason?: string; order?: Order };
  cancelOrder: (id: string) => void;
  addWatchlist: (name: string) => void;
  setActiveWatchlist: (id: string) => void;
  addToWatchlist: (symbol: string, listId?: string) => void;
  removeFromWatchlist: (symbol: string, listId?: string) => void;
  buyGold: (grams: number, price: number) => { ok: boolean; reason?: string };
  startFundInvestment: (fund: { name: string; category: string }, amount: number) => { ok: boolean };
  startSIP: (fundId: string, fundName: string, monthly: number, frequency: SIP["frequency"], stepUp: number) => { ok: boolean };
  applyIPO: (name: string, lots: number, pricePerShare: number) => { ok: boolean };
  notify: (title: string, body: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  startCourse: (id: string, title: string, level: string, lessons: number) => void;
  completeLesson: (id: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  addFunds: (amount: number) => void;
  dataSource: "backend" | "local";
  lastFetchAt: number;
}

const MarketContext = createContext<MarketContextValue | null>(null);

/* -------------------- Provider -------------------- */

const STORAGE_KEY = "nexvest:market-state-v1";

function storageKeyFor(userId: string | null | undefined): string {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

function loadPersisted(userId: string | null | undefined): Partial<State> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || !parsed) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistState(state: State, userId: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    const slice = {
      wallet: state.wallet,
      orders: state.orders.slice(0, 30),
      positions: state.positions,
      trades: state.trades.slice(0, 30),
      fundHoldings: state.fundHoldings,
      sips: state.sips,
      goldHolding: state.goldHolding,
      ipoApplications: state.ipoApplications,
      watchlists: state.watchlists,
      activeWatchlist: state.activeWatchlist,
      notifications: state.notifications.slice(0, 30),
      courses: state.courses,
      theme: state.theme,
    };
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(slice));
  } catch {
    /* ignore quota */
  }
}

export function MarketProvider({ children, userId, isDemo }: { children: ReactNode; userId: string | null; isDemo?: boolean }) {
  const [state, dispatch] = useReducer(reducer, initialState, (s) => {
    const persisted = loadPersisted(userId);
    if (persisted) return { ...s, ...persisted };
    if (isDemo) return { ...s, ...makeDemoSeedState() };
    return { ...s, ...makeEmptyUserState() };
  });

  // Switch user: when userId changes, re-seed from per-user storage or fresh defaults.
  useEffect(() => {
    const persisted = loadPersisted(userId);
    if (persisted) {
      dispatch({ type: "HYDRATE", partial: persisted });
    } else if (isDemo) {
      dispatch({ type: "HYDRATE", partial: makeDemoSeedState() });
    } else {
      dispatch({ type: "HYDRATE", partial: makeEmptyUserState() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Tick prices every 1.5s with a small random walk
  const liveRef = useRef(state.live);
  liveRef.current = state.live;
  useEffect(() => {
    const id = setInterval(() => {
      const cur = liveRef.current;
      const next: State["live"] = {};
      for (const sym of Object.keys(cur)) {
        const prev = cur[sym];
        // Volatility: stocks 0.05%, crypto 0.2%, commodities 0.03%
        const isCrypto = sym === "BTC" || sym === "ETH" || sym === "SOL" || sym === "BNB" || sym === "XRP" || sym === "DOGE" || sym === "ADA" || sym === "AVAX";
        const isCommodity = sym === "GOLD" || sym === "SILVER";
        const vol = isCrypto ? 0.0025 : isCommodity ? 0.0008 : 0.0012;
        const drift = (Math.random() - 0.5) * 2 * vol;
        const newPrice = +(prev.price * (1 + drift)).toFixed(prev.price < 10 ? 4 : prev.price < 100 ? 3 : 2);
        const baseAsset = state.base[sym];
        const basePrice = baseAsset?.price ?? newPrice;
        const change = +(newPrice - basePrice).toFixed(2);
        const changePct = +((change / basePrice) * 100).toFixed(2);
        next[sym] = { price: newPrice, change, changePct, ts: Date.now() };
      }
      dispatch({ type: "TICK", live: next });
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real API polling — primary source. Falls back silently to local tick when backend is down.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const { fetchLiveQuotes } = await import("@/lib/api/market-client");
        const quotes = await fetchLiveQuotes();
        if (quotes && !stopped) {
          for (const q of quotes) {
            if (Number.isFinite(q.price)) {
              dispatch({ type: "SET_LIVE_QUOTE", symbol: q.symbol, price: q.price, change: q.change, changePct: q.changePct });
            }
          }
        }
      } catch {
        /* keep ticking locally */
      }
    };
    poll();
    const id = setInterval(poll, 12000);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  // Persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => persistState(state, userId), 300);
    return () => clearTimeout(t);
  }, [state, userId]);

  // Theme switching
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light", state.theme === "light");
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  // Hydrate theme on mount
  useEffect(() => {
    const persisted = loadPersisted(userId);
    if (persisted?.theme) dispatch({ type: "SET_THEME", theme: persisted.theme });
  }, [userId]);

  /* ------ Selector/action helpers ------ */
  const quote = (symbol: string) => state.live[symbol];
  const allQuotes = () => state.live;
  const baseAsset = (symbol: string) => state.base[symbol];

  const holdings = () => {
    return state.positions.map((p) => {
      const ltp = state.live[p.symbol]?.price ?? p.avgPrice;
      const invested = p.qty * p.avgPrice;
      const current = p.qty * ltp;
      const changePct = state.live[p.symbol]?.changePct ?? 0;
      return { symbol: p.symbol, qty: p.qty, avg: p.avgPrice, ltp, invested, current, changePct };
    });
  };

  const placeOrder: MarketContextValue["placeOrder"] = ({ symbol, kind, type, qty, price }) => {
    if (qty <= 0) return { ok: false, reason: "Quantity must be positive" };
    const live = state.live[symbol];
    if (!live) return { ok: false, reason: `Unknown symbol: ${symbol}` };
    const fillPrice = type === "MARKET" ? live.price : price ?? live.price;
    if (!fillPrice || fillPrice <= 0) return { ok: false, reason: "Invalid price" };
    const total = +(qty * fillPrice).toFixed(2);
    const isCrypto = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX"].includes(symbol);
    const isGold = symbol === "GOLD";
    const walletDelta = kind === "BUY" ? -total : +total;
    if (kind === "BUY" && total > state.wallet) {
      return { ok: false, reason: "Insufficient wallet balance" };
    }
    const id = `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const order: Order = {
      id,
      symbol,
      kind,
      type,
      qty,
      price: fillPrice,
      status: type === "MARKET" ? "EXECUTED" : "OPEN",
      createdAt: Date.now(),
    };

    // Update position
    let newPos: Position | null = null;
    const existing = state.positions.find((p) => p.symbol === symbol);
    if (type === "MARKET" || true) {
      if (kind === "BUY") {
        if (existing) {
          newPos = {
            symbol,
            qty: existing.qty + qty,
            avgPrice: (existing.qty * existing.avgPrice + qty * fillPrice) / (existing.qty + qty),
            realized: existing.realized,
          };
        } else {
          newPos = { symbol, qty, avgPrice: fillPrice, realized: 0 };
        }
      } else {
        // SELL
        if (!existing || existing.qty < qty) {
          return { ok: false, reason: "Insufficient holdings to sell" };
        }
        const realized = (fillPrice - existing.avgPrice) * qty;
        const remaining = existing.qty - qty;
        if (remaining === 0) {
          newPos = { symbol, qty: 0, avgPrice: existing.avgPrice, realized: existing.realized + realized };
          // Remove zero positions
          setTimeout(() => {
            // We dispatch a no-op pattern using positions filter; handled below
          }, 0);
        } else {
          newPos = {
            symbol,
            qty: existing.qty - qty,
            avgPrice: existing.avgPrice,
            realized: existing.realized + realized,
          };
        }
      }
    }

    const trade: Trade = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol,
      kind,
      qty,
      price: fillPrice,
      total,
      at: Date.now(),
    };

    dispatch({ type: "PLACE_ORDER", order, trade, position: newPos, walletDelta });
    notify(
      `${kind === "BUY" ? "Bought" : "Sold"} ${qty} ${symbol} @ ₹${fillPrice.toLocaleString("en-IN")}`,
      `Order ${id.slice(0, 8)} ${type === "MARKET" ? "executed" : "placed"}.`
    );
    return { ok: true, order };
  };

  const cancelOrder: MarketContextValue["cancelOrder"] = (id) => dispatch({ type: "CANCEL_ORDER", id });
  const addWatchlist: MarketContextValue["addWatchlist"] = (name) => dispatch({ type: "ADD_WATCHLIST", name });
  const setActiveWatchlist: MarketContextValue["setActiveWatchlist"] = (id) => dispatch({ type: "SET_ACTIVE_WATCHLIST", id });
  const addToWatchlist: MarketContextValue["addToWatchlist"] = (symbol, listId) =>
    dispatch({ type: "ADD_TO_WATCHLIST", symbol, listId });
  const removeFromWatchlist: MarketContextValue["removeFromWatchlist"] = (symbol, listId) =>
    dispatch({ type: "REMOVE_FROM_WATCHLIST", symbol, listId });

  const buyGold: MarketContextValue["buyGold"] = (grams, price) => {
    const total = +(grams * price).toFixed(2);
    if (total > state.wallet) return { ok: false, reason: "Insufficient wallet balance" };
    dispatch({ type: "BUY_GOLD", grams, price, total });
    notify(`Bought ${grams.toFixed(4)}g Gold`, `Invested ₹${total.toLocaleString("en-IN")} at ₹${price}/g.`);
    return { ok: true };
  };

  const startFundInvestment: MarketContextValue["startFundInvestment"] = (fund, amount) => {
    if (amount <= 0) return { ok: false };
    if (amount > state.wallet) return { ok: false };
    const mf = seedFunds.find((f) => f.name === fund.name);
    const nav = +(amount / (mf ? 100 : 100)).toFixed(4); // virtual NAV
    const holding: FundHolding = {
      id: `fh-${Date.now()}`,
      name: fund.name,
      category: fund.category,
      amount,
      units: nav,
      nav,
      startedAt: Date.now(),
    };
    dispatch({ type: "ADD_FUND", fund: holding });
    notify(`Invested in ${fund.name}`, `₹${amount.toLocaleString("en-IN")} allocated.`);
    return { ok: true };
  };

  const startSIP: MarketContextValue["startSIP"] = (fundId, fundName, monthly, frequency, stepUp) => {
    if (monthly < 100) return { ok: false };
    const sip: SIP = {
      id: `sip-${Date.now()}`,
      fundId,
      fundName,
      monthly,
      frequency,
      stepUp,
      startedAt: Date.now(),
    };
    dispatch({ type: "ADD_SIP", sip });
    notify(`SIP started`, `₹${monthly.toLocaleString("en-IN")}/${frequency} in ${fundName}.`);
    return { ok: true };
  };

  const applyIPO: MarketContextValue["applyIPO"] = (name, lots, pricePerShare) => {
    const amount = lots * pricePerShare;
    if (amount > state.wallet) return { ok: false };
    const app: IPOApplication = {
      id: `ipo-${Date.now()}`,
      name,
      lots,
      amount,
      appliedAt: Date.now(),
      status: "PENDING",
    };
    dispatch({ type: "APPLY_IPO", app });
    notify(`Applied for ${name}`, `${lots} lots blocked for ₹${amount.toLocaleString("en-IN")}.`);
    return { ok: true };
  };

  const notify: MarketContextValue["notify"] = (title, body) =>
    dispatch({ type: "PUSH_NOTIFICATION", n: { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, title, body, at: Date.now(), read: false } });
  const markNotificationRead: MarketContextValue["markNotificationRead"] = (id) => dispatch({ type: "MARK_NOTIFICATION_READ", id });
  const clearNotifications: MarketContextValue["clearNotifications"] = () => dispatch({ type: "CLEAR_NOTIFICATIONS" });
  const startCourse: MarketContextValue["startCourse"] = (id, title, level, lessons) =>
    dispatch({ type: "START_COURSE", id, title, level, lessons });
  const completeLesson: MarketContextValue["completeLesson"] = (id) => dispatch({ type: "COMPLETE_LESSON", id });
  const setTheme: MarketContextValue["setTheme"] = (theme) => dispatch({ type: "SET_THEME", theme });
  const addFunds: MarketContextValue["addFunds"] = (amount) => {
    dispatch({ type: "ADD_FUNDS", amount });
    notify("Wallet topped up", `₹${amount.toLocaleString("en-IN")} added.`);
  };

  const [dataSource, setDataSource] = useState<"backend" | "local">("local");
  const [lastFetchAt, setLastFetchAt] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { subscribeDataSource, getDataSource } = await import("@/lib/api/market-client");
      setDataSource(getDataSource());
      return subscribeDataSource((s, ts) => {
        if (cancelled) return;
        setDataSource(s);
        setLastFetchAt(ts);
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<MarketContextValue>(
    () => ({
      state,
      dispatch,
      quote,
      allQuotes,
      baseAsset,
      holdings,
      placeOrder,
      cancelOrder,
      addWatchlist,
      setActiveWatchlist,
      addToWatchlist,
      removeFromWatchlist,
      buyGold,
      startFundInvestment,
      startSIP,
      applyIPO,
      notify,
      markNotificationRead,
      clearNotifications,
      startCourse,
      completeLesson,
      setTheme,
      addFunds,
      dataSource,
      lastFetchAt,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, dataSource, lastFetchAt]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}

/* -------------------- Convenience selectors -------------------- */

export function useQuote(symbol: string | undefined | null) {
  const { state } = useMarket();
  if (!symbol) return undefined;
  return state.live[symbol];
}

/** Pure helper to look up a live quote by symbol. */
export function lookupQuote(state: State, symbol: string | undefined | null) {
  if (!symbol) return undefined;
  return state.live[symbol];
}

/** Pure helper to look up base asset metadata. */
export function lookupBase(state: State, symbol: string) {
  return state.base[symbol];
}

export function useHoldings() {
  const { state } = useMarket();
  return useMemo(() => {
    return state.positions.map((p) => {
      const ltp = state.live[p.symbol]?.price ?? p.avgPrice;
      const invested = p.qty * p.avgPrice;
      const current = p.qty * ltp;
      const changePct = state.live[p.symbol]?.changePct ?? 0;
      return { symbol: p.symbol, qty: p.qty, avg: p.avgPrice, ltp, invested, current, changePct };
    });
  }, [state.positions, state.live]);
}

export function useTotalPnL() {
  const { state } = useMarket();
  return useMemo(() => {
    let invested = 0;
    let current = 0;
    let day = 0;
    for (const p of state.positions) {
      const ltp = state.live[p.symbol]?.price ?? p.avgPrice;
      const changePct = state.live[p.symbol]?.changePct ?? 0;
      invested += p.qty * p.avgPrice;
      current += p.qty * ltp;
      day += (p.qty * ltp * changePct) / 100;
    }
    // gold
    invested += state.goldHolding.invested;
    const goldLtp = state.live["GOLD"]?.price ?? 7842;
    current += state.goldHolding.grams * goldLtp;
    day += state.goldHolding.grams * (goldLtp * (state.live["GOLD"]?.changePct ?? 0)) / 100;
    // funds
    for (const f of state.fundHoldings) {
      invested += f.amount;
      current += f.amount * 1.12; // mock 12% gain
    }
    return { invested, current, pnl: current - invested, day, pnlPct: invested > 0 ? ((current - invested) / invested) * 100 : 0 };
  }, [state.positions, state.live, state.goldHolding, state.fundHoldings]);
}
