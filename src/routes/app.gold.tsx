import { createFileRoute } from "@tanstack/react-router";
import { commodities } from "@/lib/mock-data";
import { Sparkline } from "@/components/sparkline";
import { Shield, Truck, Coins, Info, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { useMarket, lookupQuote } from "@/lib/market-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/gold")({
  component: Gold,
});

const CHIPS = [100, 500, 1000, 2000, 5000, 10000];
type Mode = "buy" | "sell" | "sip";

function Gold() {
  const { state, dispatch } = useMarket();
  const [mode, setMode] = useState<Mode>("buy");
  const [amount, setAmount] = useState("500");
  const [grams, setGrams] = useState("0.1");
  const [sipAmount, setSipAmount] = useState("500");
  const [sipFreq, setSipFreq] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [sipDay, setSipDay] = useState("5");
  const [autoSipConfirm, setAutoSipConfirm] = useState(false);

  const goldQuote = lookupQuote(state, "GOLD");
  const pricePerGram = goldQuote?.price ?? 7842;
  const changePct = goldQuote?.changePct ?? 0.42;
  const up = changePct >= 0;

  const amt = Math.max(0, Number(amount) || 0);
  const gstRate = 0.03;
  const goldQty = amt / pricePerGram;
  const gst = amt * gstRate;
  const total = amt + gst;

  const g = Math.max(0, Number(grams) || 0);
  const sellValue = g * pricePerGram;
  const sellGst = sellValue * gstRate;
  const sellNet = sellValue - sellGst;

  const isValidAmount = amt >= 10;
  const canBuy = isValidAmount && amt <= state.wallet;
  const canSell = g > 0 && g * pricePerGram <= state.goldHolding.grams * pricePerGram;

  const placeBuy = () => {
    if (!canBuy) { toast.error(amt > state.wallet ? "Insufficient wallet balance" : "Minimum ₹10"); return; }
    dispatch({ type: "BUY_GOLD", grams: goldQty, price: pricePerGram, total: total });
    toast.success(`Bought ${goldQty.toFixed(4)}g gold for ₹${total.toFixed(2)}`, { description: `Wallet debited. 3% GST included.` });
  };

  const placeSell = () => {
    if (!canSell) { toast.error("Insufficient gold balance"); return; }
    dispatch({ type: "SELL_GOLD", grams: g, price: pricePerGram, grossValue: sellNet });
    toast.success(`Sold ${g.toFixed(4)}g gold for ₹${sellNet.toFixed(2)}`, { description: `Wallet credited after 3% GST & 1% TC.` });
  };

  const startSip = () => {
    const amt = Math.max(0, Number(sipAmount) || 0);
    if (amt < 100) { toast.error("Minimum SIP is ₹100"); return; }
    const sId = `sip_gold_${Date.now()}`;
    dispatch({ type: "START_GOLD_SIP", sipId: sId, amount: amt, frequency: sipFreq });
    setAutoSipConfirm(true);
    setTimeout(() => setAutoSipConfirm(false), 4000);
    toast.success(`Gold SIP started: ₹${amt} ${sipFreq}`, { description: `Auto-debit enabled from wallet. Ref ${sId.slice(-6)}` });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Digital Gold & Silver</h1>
          <p className="text-sm text-muted-foreground mt-1">24K pure gold · Insured & vaulted · Live MMTC-PAMP pricing</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Your gold balance</div>
          <div className="text-2xl font-bold text-gold">{state.goldHolding.grams.toFixed(4)} g</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="relative bg-gradient-card border border-border rounded-2xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-gold opacity-10" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-xl">🥇</div>
                <div>
                  <div className="font-bold text-lg">Gold (24K)</div>
                  <div className="text-xs text-muted-foreground">Per gram · Live MMTC-PAMP</div>
                </div>
              </div>
              <div className="text-4xl font-bold">₹{pricePerGram.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              <div className={cn("text-sm font-semibold mt-1", up ? "text-profit" : "text-loss")}>{up ? "+" : ""}₹{(pricePerGram * changePct / 100).toFixed(2)} ({up ? "+" : ""}{changePct.toFixed(2)}%) today</div>
              <Sparkline data={commodities[0].sparkline || []} positive={up} width={380} height={70} />
            </div>
            <div className="bg-background/40 backdrop-blur border border-border rounded-xl p-4">
              <div className="flex gap-1 bg-surface rounded-lg p-1 mb-3 text-sm">
                {(["buy", "sell", "sip"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn("flex-1 py-2 rounded-md font-semibold transition", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    {m === "buy" ? "Buy" : m === "sell" ? "Sell" : "SIP"}
                  </button>
                ))}
              </div>

              {mode === "buy" && (
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Amount (₹)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-10 pl-8 pr-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary/40" />
                    </div>
                    {!isValidAmount && <p className="text-[10px] text-loss mt-1">Minimum ₹10</p>}
                    {isValidAmount && amt > state.wallet && <p className="text-[10px] text-loss mt-1">Insufficient wallet — add funds first</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {CHIPS.map((v) => (
                      <button key={v} onClick={() => setAmount(String(v))} className={cn("text-xs px-3 py-1 rounded-md border transition", Number(amount) === v ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border")}>₹{v}</button>
                    ))}
                  </div>
                  <div className="bg-surface rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Gold quantity</span><span className="font-mono font-semibold">{goldQty.toFixed(4)} g</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">GST (3%)</span><span className="font-mono">₹{gst.toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>You pay</span><span className="font-mono">₹{total.toFixed(2)}</span></div>
                  </div>
                  <button disabled={!canBuy} onClick={placeBuy} className="w-full py-3 rounded-lg bg-gradient-gold text-background font-bold disabled:opacity-50 disabled:cursor-not-allowed">Buy Gold</button>
                </div>
              )}

              {mode === "sell" && (
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Quantity (grams)</label>
                    <div className="relative mt-1">
                      <input value={grams} onChange={(e) => setGrams(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary/40" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">g</span>
                    </div>
                    {!canSell && g > 0 && <p className="text-[10px] text-loss mt-1">You only hold {state.goldHolding.grams.toFixed(4)} g</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[0.1, 0.5, 1, 5].map((v) => (
                      <button key={v} onClick={() => setGrams(String(v))} className={cn("text-xs px-3 py-1 rounded-md border", Number(grams) === v ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border")}>{v} g</button>
                    ))}
                  </div>
                  <div className="bg-surface rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Gross value</span><span className="font-mono">₹{sellValue.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">GST (3%)</span><span className="font-mono">- ₹{sellGst.toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>You receive</span><span className="font-mono text-profit">₹{sellNet.toFixed(2)}</span></div>
                  </div>
                  <button disabled={!canSell} onClick={placeSell} className="w-full py-3 rounded-lg bg-gradient-gold text-background font-bold disabled:opacity-50 disabled:cursor-not-allowed">Sell Gold</button>
                </div>
              )}

              {mode === "sip" && (
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">SIP amount (₹)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} className="w-full h-10 pl-8 pr-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary/40" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(["Daily", "Weekly", "Monthly"] as const).map((f) => (
                      <button key={f} onClick={() => setSipFreq(f)} className={cn("flex-1 text-xs py-1.5 rounded-md border", sipFreq === f ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border")}>{f}</button>
                    ))}
                  </div>
                  {sipFreq === "Monthly" && (
                    <div>
                      <label className="text-xs text-muted-foreground">Debit day</label>
                      <select value={sipDay} onChange={(e) => setSipDay(e.target.value)} className="w-full h-10 px-3 mt-1 rounded-lg bg-surface border border-border">
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}</option>)}
                      </select>
                    </div>
                  )}
                  {autoSipConfirm && (
                    <div className="bg-info/10 border border-info/30 rounded-md p-2 text-xs flex items-center gap-1.5 text-info">
                      <Clock className="w-3 h-3" /> Next debit scheduled
                    </div>
                  )}
                  <button onClick={startSip} className="w-full py-3 rounded-lg bg-gradient-gold text-background font-bold">Start Gold SIP</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { i: Shield, t: "100% Insured", d: "Stored in MMTC-PAMP vault" },
            { i: Truck, t: "Physical Delivery", d: "Convert digital to coins/bars" },
            { i: Coins, t: "SIP from ₹100", d: "Daily, weekly or monthly" },
            { i: Info, t: "No making charges", d: "Same buy/sell spread ~3%" },
          ].map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><f.i className="w-4 h-4 text-gold" /></div>
              <div>
                <div className="font-semibold text-sm">{f.t}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {commodities.map((c) => {
          const up = c.changePct >= 0;
          return (
            <div key={c.symbol} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">Per gram · {c.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">₹{c.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                  <div className={cn("text-xs font-semibold", up ? "text-profit" : "text-loss")}>{up ? "+" : ""}{c.changePct.toFixed(2)}%</div>
                </div>
              </div>
              <Sparkline data={c.sparkline || []} positive={up} width={500} height={60} />
              <button onClick={() => toast.info(`Trading ${c.symbol} - coming soon`)} className="mt-3 w-full py-2 rounded-md bg-surface border border-border text-sm hover:border-primary/40">Trade {c.name.split(" ")[0]}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
