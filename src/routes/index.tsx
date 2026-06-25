import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MarketTicker } from "@/components/market-ticker";
import { Sparkline } from "@/components/sparkline";
import {
  Activity, ArrowRight, Sparkles, TrendingUp, Shield, Zap, Brain, Coins,
  PieChart, LineChart, Users, Award, ChevronRight, BarChart3, Gem,
} from "lucide-react";
import { indices, stocks, crypto } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexVest — Invest. Trade. Grow. AI-Powered Investment Super App" },
      { name: "description", content: "Stocks, crypto, mutual funds, SIPs, digital gold and AI-powered investing — all in one intelligent platform." },
      { property: "og:title", content: "NexVest — AI Investment Super App" },
      { property: "og:description", content: "Stocks, crypto, mutual funds, SIPs, gold and AI advisors in one platform." },
    ],
  }),
  component: Landing,
});

function Navbar() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-profit flex items-center justify-center shadow-glow">
            <Activity className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
          </div>
          <span className="font-bold text-lg tracking-tight">NexVest</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground ml-2 px-2 py-1 rounded-full bg-surface border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" /> Markets Open
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground ml-4">
          {[
            { l: "Stocks", to: "/app/markets" },
            { l: "Crypto", to: "/app/crypto" },
            { l: "Mutual Funds", to: "/app/funds" },
            { l: "Gold", to: "/app/gold" },
            { l: "IPO", to: "/app/ipo" },
          ].map((x) => (
            <Link key={x.l} to={x.to} className="px-3 py-2 rounded-md hover:text-foreground hover:bg-surface transition">
              {x.l}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => navigate({ to: "/login" })} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">Login</button>
          <Link to="/signup" className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition shadow-glow">
            Open Account <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Link to="/app" className="md:hidden text-sm font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg">
          Open
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-crypto/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary border border-primary/30 bg-primary/10 px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3 h-3" /> Powered by AI Copilot v3.0
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Invest. Trade. <span className="bg-gradient-to-r from-primary via-profit to-info bg-clip-text text-transparent">Grow.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-5 max-w-xl leading-relaxed">
            Stocks, crypto, mutual funds, SIPs, gold and AI-powered advisors — your entire financial life in one intelligent platform.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/app" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition shadow-glow">
              Start Investing <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/app/markets" className="inline-flex items-center gap-2 bg-surface border border-border font-semibold px-6 py-3.5 rounded-xl hover:border-primary/40 transition">
              Explore Markets
            </Link>
            <Link to="/app/ai" className="inline-flex items-center gap-2 border border-crypto/40 text-crypto font-semibold px-6 py-3.5 rounded-xl hover:bg-crypto/10 transition">
              <Brain className="w-4 h-4" /> Try AI Advisor
            </Link>
          </div>
          <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-profit" /> SEBI Registered</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-gold" /> Zero brokerage*</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-info" /> 15M+ investors</div>
          </div>
        </div>

        {/* Floating preview cards */}
        <div className="relative h-[520px] hidden lg:block">
          <div className="absolute top-0 right-0 w-80 bg-card border border-border rounded-2xl p-5 shadow-elevated animate-float">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Portfolio Value</div>
                <div className="text-2xl font-bold mt-0.5">₹ 4,82,640</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-profit font-semibold">+₹ 38,420</div>
                <div className="text-xs text-profit">+8.65% all time</div>
              </div>
            </div>
            <Sparkline data={indices[0].sparkline!} positive width={280} height={70} />
            <div className="flex gap-2 mt-3 text-xs">
              {["1D", "1W", "1M", "1Y", "ALL"].map((t, i) => (
                <span key={t} className={`px-2 py-1 rounded ${i === 3 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{t}</span>
              ))}
            </div>
          </div>
          <div className="absolute top-44 left-0 w-72 bg-card border border-border rounded-2xl p-4 shadow-elevated animate-float" style={{ animationDelay: "1.5s" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-crypto/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-crypto" />
              </div>
              <div className="text-sm font-semibold">AI Recommendation</div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">High-confidence signal</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">BUY TCS</div>
                <div className="text-xs text-muted-foreground">Target ₹4,420 • SL ₹3,980</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="text-profit font-bold">91%</div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-8 w-64 bg-card border border-border rounded-2xl p-4 shadow-elevated animate-float" style={{ animationDelay: "0.8s" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">₿</div>
                <span className="text-sm font-semibold">Bitcoin</span>
              </div>
              <span className="text-xs text-profit font-semibold">+4.19%</span>
            </div>
            <div className="text-xl font-bold">$95,234</div>
            <Sparkline data={crypto[0].sparkline!} positive width={224} height={40} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Brain, color: "crypto", title: "AI Investing", desc: "Personalized stock & fund picks with confidence scores." },
    { icon: LineChart, color: "info", title: "Pro Charts", desc: "TradingView-grade candles, 50+ indicators, drawing tools." },
    { icon: Coins, color: "gold", title: "Crypto Exchange", desc: "Spot, futures, leverage and staking, all in one app." },
    { icon: PieChart, color: "primary", title: "SIPs & Funds", desc: "Daily, weekly, monthly & step-up SIPs auto-managed." },
    { icon: Gem, color: "gold", title: "Digital Gold", desc: "Buy 24K gold from ₹10. Redeem physical anytime." },
    { icon: Zap, color: "primary", title: "Smart Orders", desc: "GTT, Iceberg, Bracket, TWAP, VWAP, AMO supported." },
    { icon: Shield, color: "info", title: "Bank-Grade Security", desc: "End-to-end encryption, 2FA, biometric & vault." },
    { icon: BarChart3, color: "crypto", title: "Deep Analytics", desc: "XIRR, CAGR, alpha, beta, Sharpe — all visualized." },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="text-sm font-semibold text-primary mb-3">EVERYTHING YOU NEED</div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">One app. Every asset. <span className="text-primary">Zero compromises.</span></h2>
        <p className="text-muted-foreground mt-4">Built for beginners and pros. From your first ₹100 SIP to leveraged crypto futures.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((f) => (
          <div key={f.title} className="group bg-gradient-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:-translate-y-1 transition-all">
            <div className={`w-11 h-11 rounded-xl bg-${f.color}/10 border border-${f.color}/20 flex items-center justify-center mb-4`}>
              <f.icon className={`w-5 h-5 text-${f.color}`} />
            </div>
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Trust() {
  const stats = [
    { v: "15M+", l: "Active investors" },
    { v: "₹2L Cr", l: "Assets managed" },
    { v: "99.99%", l: "Platform uptime" },
    { v: "4.7★", l: "Play Store rating" },
  ];
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">{s.v}</div>
            <div className="text-sm text-muted-foreground mt-2">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketsPreview() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-sm font-semibold text-primary mb-2">LIVE MARKETS</div>
          <h2 className="text-3xl md:text-4xl font-bold">What's moving right now</h2>
        </div>
        <Link to="/app/markets" className="hidden md:inline-flex items-center gap-1 text-sm text-primary font-semibold">View all <ChevronRight className="w-4 h-4" /></Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><span className="font-semibold">Top Stocks</span></div>
            <span className="text-xs text-muted-foreground">NSE</span>
          </div>
          <div className="divide-y divide-border">
            {stocks.slice(0, 5).map((s) => {
              const up = s.changePct >= 0;
              return (
                <div key={s.symbol} className="px-5 py-3 flex items-center gap-4 hover:bg-surface/50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{s.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                  </div>
                  <Sparkline data={s.sparkline!} positive={up} />
                  <div className="text-right w-24">
                    <div className="font-semibold text-sm">₹{s.price.toLocaleString("en-IN")}</div>
                    <div className={`text-xs font-medium ${up ? "text-profit" : "text-loss"}`}>{up ? "+" : ""}{s.changePct.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-crypto" /><span className="font-semibold">Top Crypto</span></div>
            <span className="text-xs text-muted-foreground">24h</span>
          </div>
          <div className="divide-y divide-border">
            {crypto.slice(0, 5).map((s) => {
              const up = s.changePct >= 0;
              return (
                <div key={s.symbol} className="px-5 py-3 flex items-center gap-4 hover:bg-surface/50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{s.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                  </div>
                  <Sparkline data={s.sparkline!} positive={up} />
                  <div className="text-right w-24">
                    <div className="font-semibold text-sm">${s.price.toLocaleString("en-US")}</div>
                    <div className={`text-xs font-medium ${up ? "text-profit" : "text-loss"}`}>{up ? "+" : ""}{s.changePct.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-card border border-border p-12 md:p-16 text-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="relative">
          <Award className="w-12 h-12 text-primary mx-auto mb-5" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Start your wealth journey today</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Open your account in under 5 minutes. ₹0 account opening. ₹0 brokerage on equity delivery.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link to="/app" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-xl shadow-glow">
              Open free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/app/learn" className="inline-flex items-center gap-2 bg-surface border border-border font-semibold px-6 py-3.5 rounded-xl">
              Learn investing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { t: "Products", l: ["Stocks", "Mutual Funds", "Crypto", "Digital Gold", "IPO", "ETFs", "Bonds"] },
    { t: "Company", l: ["About", "Careers", "Press", "Blog", "Investors"] },
    { t: "Resources", l: ["Help Center", "API Docs", "Learn", "Calculators", "Status"] },
    { t: "Legal", l: ["Terms", "Privacy", "Disclosures", "Risk", "Compliance"] },
  ];
  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 grid md:grid-cols-5 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-profit flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="font-bold">NexVest</span>
          </div>
          <p className="text-sm text-muted-foreground">India's AI-first investment super app.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <div className="text-sm font-semibold mb-3">{c.t}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.l.map((x) => <li key={x} className="hover:text-foreground cursor-pointer">{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-5 text-xs text-muted-foreground text-center">
        © 2026 NexVest Technologies. SEBI Reg. No. INZ000000000. Investments are subject to market risk.
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <MarketTicker />
      <Hero />
      <Trust />
      <Features />
      <MarketsPreview />
      <CTA />
      <Footer />
    </div>
  );
}
