// Mock market data for the UI. No real API calls.

export type Asset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  type: "stock" | "crypto" | "etf" | "mf" | "commodity" | "index";
  exchange?: string;
  volume?: string;
  marketCap?: string;
  sparkline?: number[];
};

const spark = (seed: number, trend: "up" | "down" | "mixed" = "mixed") => {
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < 30; i++) {
    const drift = trend === "up" ? 0.4 : trend === "down" ? -0.4 : 0;
    v += (Math.sin(i * 0.6 + seed) + drift) * 2 + (Math.random() - 0.5);
    out.push(v);
  }
  return out;
};

export const indices: Asset[] = [
  { symbol: "NIFTY 50", name: "Nifty 50", price: 24632.45, change: 198.3, changePct: 0.81, type: "index", sparkline: spark(1, "up") },
  { symbol: "SENSEX", name: "BSE Sensex", price: 80892.12, change: 540.7, changePct: 0.67, type: "index", sparkline: spark(2, "up") },
  { symbol: "BANKNIFTY", name: "Bank Nifty", price: 52104.8, change: -212.4, changePct: -0.4, type: "index", sparkline: spark(3, "down") },
  { symbol: "NIFTY IT", name: "Nifty IT", price: 42018.6, change: 320.1, changePct: 0.77, type: "index", sparkline: spark(4, "up") },
];

export const stocks: Asset[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2945.2, change: 72.4, changePct: 2.52, type: "stock", exchange: "NSE", volume: "8.2M", marketCap: "₹19.9L Cr", sparkline: spark(5, "up") },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 4128.5, change: 38.7, changePct: 0.95, type: "stock", exchange: "NSE", volume: "2.1M", marketCap: "₹14.9L Cr", sparkline: spark(6, "up") },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1678.9, change: -12.3, changePct: -0.73, type: "stock", exchange: "NSE", volume: "12.5M", marketCap: "₹12.7L Cr", sparkline: spark(7, "down") },
  { symbol: "INFY", name: "Infosys", price: 1892.3, change: 24.5, changePct: 1.31, type: "stock", exchange: "NSE", volume: "5.4M", marketCap: "₹7.8L Cr", sparkline: spark(8, "up") },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1245.6, change: 8.9, changePct: 0.72, type: "stock", exchange: "NSE", volume: "9.1M", marketCap: "₹8.7L Cr", sparkline: spark(9, "up") },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", price: 1612.4, change: -5.2, changePct: -0.32, type: "stock", exchange: "NSE", volume: "3.8M", marketCap: "₹9.1L Cr", sparkline: spark(10, "mixed") },
  { symbol: "ITC", name: "ITC Limited", price: 478.3, change: 3.1, changePct: 0.65, type: "stock", exchange: "NSE", volume: "15.2M", marketCap: "₹5.9L Cr", sparkline: spark(11, "up") },
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 892.7, change: -18.4, changePct: -2.02, type: "stock", exchange: "NSE", volume: "22.1M", marketCap: "₹3.2L Cr", sparkline: spark(12, "down") },
  { symbol: "WIPRO", name: "Wipro", price: 542.8, change: 12.3, changePct: 2.32, type: "stock", exchange: "NSE", volume: "6.7M", marketCap: "₹2.8L Cr", sparkline: spark(13, "up") },
  { symbol: "ADANIENT", name: "Adani Enterprises", price: 2845.6, change: 95.2, changePct: 3.46, type: "stock", exchange: "NSE", volume: "4.2M", marketCap: "₹3.2L Cr", sparkline: spark(14, "up") },
];

export const crypto: Asset[] = [
  { symbol: "BTC", name: "Bitcoin", price: 95234.5, change: 3820.4, changePct: 4.19, type: "crypto", volume: "$42.1B", marketCap: "$1.88T", sparkline: spark(20, "up") },
  { symbol: "ETH", name: "Ethereum", price: 3412.8, change: -18.2, changePct: -0.53, type: "crypto", volume: "$18.4B", marketCap: "$410B", sparkline: spark(21, "mixed") },
  { symbol: "SOL", name: "Solana", price: 218.4, change: 12.6, changePct: 6.12, type: "crypto", volume: "$4.2B", marketCap: "$103B", sparkline: spark(22, "up") },
  { symbol: "BNB", name: "BNB", price: 642.1, change: 8.4, changePct: 1.33, type: "crypto", volume: "$1.8B", marketCap: "$94B", sparkline: spark(23, "up") },
  { symbol: "XRP", name: "Ripple", price: 2.34, change: 0.18, changePct: 8.33, type: "crypto", volume: "$8.1B", marketCap: "$134B", sparkline: spark(24, "up") },
  { symbol: "DOGE", name: "Dogecoin", price: 0.382, change: -0.012, changePct: -3.05, type: "crypto", volume: "$3.4B", marketCap: "$56B", sparkline: spark(25, "down") },
  { symbol: "ADA", name: "Cardano", price: 1.08, change: 0.04, changePct: 3.85, type: "crypto", volume: "$1.2B", marketCap: "$38B", sparkline: spark(26, "up") },
  { symbol: "AVAX", name: "Avalanche", price: 42.8, change: -1.2, changePct: -2.73, type: "crypto", volume: "$890M", marketCap: "$17B", sparkline: spark(27, "down") },
];

export const commodities: Asset[] = [
  { symbol: "GOLD", name: "Digital Gold (24K)", price: 7842, change: 86, changePct: 1.11, type: "commodity", sparkline: spark(30, "up") },
  { symbol: "SILVER", name: "Digital Silver", price: 94.5, change: -0.8, changePct: -0.84, type: "commodity", sparkline: spark(31, "mixed") },
];

export const mutualFunds = [
  { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", returns3y: 24.6, returns5y: 22.1, rating: 5, aum: "₹68,420 Cr", risk: "Moderately High" },
  { name: "Quant Small Cap Fund", category: "Small Cap", returns3y: 38.2, returns5y: 34.8, rating: 5, aum: "₹24,180 Cr", risk: "Very High" },
  { name: "Axis Bluechip Fund", category: "Large Cap", returns3y: 15.4, returns5y: 14.2, rating: 4, aum: "₹32,650 Cr", risk: "Moderately High" },
  { name: "Mirae Asset Large Cap Fund", category: "Large Cap", returns3y: 17.8, returns5y: 16.5, rating: 5, aum: "₹38,120 Cr", risk: "Moderately High" },
  { name: "SBI Small Cap Fund", category: "Small Cap", returns3y: 32.4, returns5y: 28.6, rating: 4, aum: "₹28,940 Cr", risk: "Very High" },
  { name: "HDFC Mid-Cap Opportunities", category: "Mid Cap", returns3y: 28.9, returns5y: 24.3, rating: 5, aum: "₹64,520 Cr", risk: "High" },
];

export const ipos = [
  { name: "Swiggy Limited", price: "₹371–390", lot: 38, open: "Nov 6", close: "Nov 8", gmp: "+₹22", status: "open" },
  { name: "NTPC Green Energy", price: "₹102–108", lot: 138, open: "Nov 19", close: "Nov 22", gmp: "+₹4", status: "upcoming" },
  { name: "Zinka Logistics", price: "₹259–273", lot: 54, open: "Nov 13", close: "Nov 18", gmp: "+₹18", status: "upcoming" },
  { name: "ACME Solar Holdings", price: "₹275–289", lot: 51, open: "Nov 6", close: "Nov 8", gmp: "+₹12", status: "open" },
];

export const newsItems = [
  { title: "Nifty hits fresh all-time high as IT stocks rally on US Fed rate cut expectations", source: "Mint", time: "12 min ago", tag: "Markets" },
  { title: "Bitcoin surges past $95,000 as institutional demand accelerates", source: "Bloomberg", time: "28 min ago", tag: "Crypto" },
  { title: "Reliance Q2 results: Net profit jumps 18% YoY, beats street estimates", source: "Economic Times", time: "1 hr ago", tag: "Earnings" },
  { title: "RBI keeps repo rate unchanged at 6.5%, maintains neutral stance", source: "Reuters", time: "2 hr ago", tag: "Policy" },
  { title: "Swiggy IPO subscribed 3.6x on final day, retail portion sees strong response", source: "Moneycontrol", time: "3 hr ago", tag: "IPO" },
];

export const holdings = [
  { symbol: "RELIANCE", qty: 25, avg: 2680, ltp: 2945.2, invested: 67000, current: 73630 },
  { symbol: "TCS", qty: 12, avg: 3820, ltp: 4128.5, invested: 45840, current: 49542 },
  { symbol: "HDFCBANK", qty: 40, avg: 1720, ltp: 1678.9, invested: 68800, current: 67156 },
  { symbol: "INFY", qty: 30, avg: 1640, ltp: 1892.3, invested: 49200, current: 56769 },
  { symbol: "ITC", qty: 150, avg: 420, ltp: 478.3, invested: 63000, current: 71745 },
  { symbol: "BTC", qty: 0.05, avg: 78000, ltp: 95234.5, invested: 3900, current: 4762 },
];

export const detailedNews = [
  {
    id: "n1",
    title: "Nifty hits fresh all-time high as IT stocks rally on US Fed rate cut expectations",
    source: "Mint",
    time: "12 min ago",
    tag: "Markets",
    body: "Indian benchmark Nifty 50 surged to a record high on Monday, led by gains in IT heavyweights like Infosys, TCS and Wipro. Analysts point to softer US inflation data and a dovish Fed commentary as the primary catalyst. Bank Nifty, however, traded flat amid profit booking in financial names. Foreign portfolio investors net bought ₹2,840 crore worth of equities.",
  },
  {
    id: "n2",
    title: "Bitcoin surges past $95,000 as institutional demand accelerates",
    source: "Bloomberg",
    time: "28 min ago",
    tag: "Crypto",
    body: "Bitcoin breached the psychologically important $95,000 mark for the first time in 2026, propelled by record inflows into US spot Bitcoin ETFs and a wave of corporate treasury allocations. BlackRock's IBIT alone has crossed $60B in AUM. Ether and Solana followed with 4-6% gains.",
  },
  {
    id: "n3",
    title: "Reliance Q2 results: Net profit jumps 18% YoY, beats street estimates",
    source: "Economic Times",
    time: "1 hr ago",
    tag: "Earnings",
    body: "Reliance Industries reported a consolidated net profit of ₹19,878 crore for Q2, up 18% year-on-year, beating Bloomberg consensus estimate of ₹18,400 crore. Revenue from operations grew 9% to ₹2.6 lakh crore, driven by strong performance in the consumer businesses and a recovery in O2C margins.",
  },
  {
    id: "n4",
    title: "RBI keeps repo rate unchanged at 6.5%, maintains neutral stance",
    source: "Reuters",
    time: "2 hr ago",
    tag: "Policy",
    body: "The Reserve Bank of India's Monetary Policy Committee voted 5-1 to keep the repo rate steady at 6.5% for the ninth consecutive meeting. Governor Sanjay Malhotra retained the 'neutral' stance, citing balanced risks to inflation and growth. Bond yields fell 4 basis points on the announcement.",
  },
  {
    id: "n5",
    title: "Swiggy IPO subscribed 3.6x on final day, retail portion sees strong response",
    source: "Moneycontrol",
    time: "3 hr ago",
    tag: "IPO",
    body: "Swiggy's ₹11,327 crore IPO closed with 3.6x subscription on the final day of bidding. The retail individual investor segment was subscribed 4.2x while the qualified institutional buyer portion was subscribed 2.8x. The price band is fixed at ₹371-390 per share, with a lot size of 38 shares.",
  },
  {
    id: "n6",
    title: "Crude oil drops 2% on demand concerns from China",
    source: "CNBC",
    time: "4 hr ago",
    tag: "Global",
    body: "Brent crude futures fell 1.9% to $78.40 per barrel after China's industrial production data missed expectations. Indian OMC stocks like BPCL and HPCL gained on hopes of lower input costs.",
  },
  {
    id: "n7",
    title: "Gold hovers near $2,720 as traders await US CPI print",
    source: "Kitco",
    time: "5 hr ago",
    tag: "Commodities",
    body: "Spot gold held steady at $2,718 per ounce ahead of the US consumer price index release. Traders are pricing in a 70% probability of a 25-bps Fed rate cut in December. Silver outperformed, gaining 1.2% to $33.10.",
  },
  {
    id: "n8",
    title: "Sebi tightens F&O rules, raises minimum contract size to ₹20 lakh",
    source: "Business Standard",
    time: "6 hr ago",
    tag: "Policy",
    body: "Capital markets regulator Sebi issued a circular raising the minimum contract size for index derivatives to ₹20 lakh from the current ₹15 lakh. The move aims to reduce retail losses in F&O trading which have crossed ₹1.5 lakh crore in the last three years.",
  },
  {
    id: "n9",
    title: "HDFC Bank Q2 update: Net interest income up 8% YoY",
    source: "Mint",
    time: "8 hr ago",
    tag: "Earnings",
    body: "HDFC Bank reported Q2 net interest income of ₹30,420 crore, up 7.8% year-on-year. Advances grew 5.2% while deposits rose 6.1%. Asset quality remained stable with gross NPA at 1.34%.",
  },
  {
    id: "n10",
    title: "Solana DEX volumes surpass Ethereum for second consecutive week",
    source: "The Defiant",
    time: "10 hr ago",
    tag: "Crypto",
    body: "Solana's on-chain DEX volumes hit $42 billion last week, edging past Ethereum's $39 billion. The growth is attributed to a wave of memecoin activity and the rise of AI-themed tokens on Pump.fun.",
  },
  {
    id: "n11",
    title: "NTPC Green Energy IPO opens Nov 19, price band set at ₹102-108",
    source: "Moneycontrol",
    time: "1 day ago",
    tag: "IPO",
    body: "NTPC Green Energy's ₹10,000 crore IPO will open for subscription on November 19 with a price band of ₹102-108 per share. The issue is entirely a fresh offer and the company will use proceeds to fund renewable energy projects.",
  },
  {
    id: "n12",
    title: "European markets close mixed amid ECB rate decision uncertainty",
    source: "Reuters",
    time: "1 day ago",
    tag: "Global",
    body: "European indices ended mixed on Friday as investors weighed mixed corporate earnings against expectations for a slower pace of ECB rate cuts. Stoxx 600 closed flat while DAX gained 0.3%.",
  },
];

export const moreStocks = [
  { symbol: "MARUTI", name: "Maruti Suzuki", price: 12450, change: 152, changePct: 1.24, type: "stock", exchange: "NSE", volume: "1.2M", marketCap: "₹3.7L Cr", sparkline: spark(50, "up") },
  { symbol: "SUNPHARMA", name: "Sun Pharma", price: 1820, change: -22, changePct: -1.19, type: "stock", exchange: "NSE", volume: "3.4M", marketCap: "₹4.3L Cr", sparkline: spark(51, "down") },
  { symbol: "LT", name: "Larsen & Toubro", price: 3640, change: 48, changePct: 1.34, type: "stock", exchange: "NSE", volume: "2.1M", marketCap: "₹5.0L Cr", sparkline: spark(52, "up") },
  { symbol: "AXISBANK", name: "Axis Bank", price: 1170, change: 14, changePct: 1.21, type: "stock", exchange: "NSE", volume: "7.8M", marketCap: "₹3.6L Cr", sparkline: spark(53, "up") },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", price: 1820, change: -8, changePct: -0.44, type: "stock", exchange: "NSE", volume: "4.1M", marketCap: "₹3.6L Cr", sparkline: spark(54, "down") },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", price: 7320, change: 95, changePct: 1.32, type: "stock", exchange: "NSE", volume: "1.4M", marketCap: "₹4.5L Cr", sparkline: spark(55, "up") },
  { symbol: "HCLTECH", name: "HCL Tech", price: 1845, change: 28, changePct: 1.54, type: "stock", exchange: "NSE", volume: "2.6M", marketCap: "₹5.0L Cr", sparkline: spark(56, "up") },
  { symbol: "ASIANPAINT", name: "Asian Paints", price: 2480, change: -32, changePct: -1.27, type: "stock", exchange: "NSE", volume: "1.1M", marketCap: "₹2.4L Cr", sparkline: spark(57, "down") },
  { symbol: "POWERGRID", name: "Power Grid Corp", price: 318, change: 4, changePct: 1.27, type: "stock", exchange: "NSE", volume: "8.9M", marketCap: "₹2.9L Cr", sparkline: spark(59, "up") },
  { symbol: "M&M", name: "Mahindra & Mahindra", price: 2980, change: 38, changePct: 1.29, type: "stock", exchange: "NSE", volume: "1.9M", marketCap: "₹3.7L Cr", sparkline: spark(60, "up") },
  { symbol: "NTPC", name: "NTPC Limited", price: 412, change: 6, changePct: 1.48, type: "stock", exchange: "NSE", volume: "12.4M", marketCap: "₹4.0L Cr", sparkline: spark(61, "up") },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", price: 11200, change: -120, changePct: -1.06, type: "stock", exchange: "NSE", volume: "0.5M", marketCap: "₹3.2L Cr", sparkline: spark(62, "down") },
  { symbol: "TITAN", name: "Titan Company", price: 3280, change: 42, changePct: 1.30, type: "stock", exchange: "NSE", volume: "0.9M", marketCap: "₹2.9L Cr", sparkline: spark(63, "up") },
  { symbol: "ONGC", name: "ONGC", price: 268, change: 3, changePct: 1.13, type: "stock", exchange: "NSE", volume: "14.1M", marketCap: "₹3.4L Cr", sparkline: spark(65, "up") },
];

export const moreCrypto = [
  { symbol: "MATIC", name: "Polygon", price: 0.74, change: 0.02, changePct: 2.78, type: "crypto", volume: "$640M", marketCap: "$7.4B", sparkline: spark(80, "up") },
  { symbol: "LINK", name: "Chainlink", price: 18.4, change: -0.3, changePct: -1.60, type: "crypto", volume: "$420M", marketCap: "$11.2B", sparkline: spark(81, "down") },
  { symbol: "DOT", name: "Polkadot", price: 7.2, change: 0.1, changePct: 1.41, type: "crypto", volume: "$280M", marketCap: "$10.1B", sparkline: spark(82, "up") },
  { symbol: "TRX", name: "Tron", price: 0.156, change: 0.004, changePct: 2.63, type: "crypto", volume: "$340M", marketCap: "$13.5B", sparkline: spark(83, "up") },
  { symbol: "SHIB", name: "Shiba Inu", price: 0.0000245, change: 0.0000008, changePct: 3.38, type: "crypto", volume: "$420M", marketCap: "$14.4B", sparkline: spark(84, "up") },
  { symbol: "LTC", name: "Litecoin", price: 78.4, change: 1.2, changePct: 1.55, type: "crypto", volume: "$310M", marketCap: "$5.8B", sparkline: spark(85, "up") },
];

export const allStocks = [...stocks, ...moreStocks];
export const allCrypto = [...crypto, ...moreCrypto];
export const allAssets = [...indices, ...allStocks, ...allCrypto, ...commodities];
