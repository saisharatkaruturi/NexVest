import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { mutualFunds } from "@/lib/mock-data";
import { useMarket } from "@/lib/market-store";
import { Star, Sparkles, TrendingUp, Award, Shield, Search, Plus, X, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/funds")({
  component: Funds,
});

const SIP_AMOUNTS = [1000, 2500, 5000, 10000, 25000];
const FREQ = [
  { k: "Daily", l: "Daily" },
  { k: "Weekly", l: "Weekly" },
  { k: "Monthly", l: "Monthly" },
] as const;
type FreqKey = typeof FREQ[number]["k"];
const STEP_UPS = [0, 5, 10, 15, 25];

function Funds() {
  const { state, startSIP, startFundInvestment } = useMarket();
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [sipFund, setSipFund] = useState<typeof mutualFunds[number] | null>(null);
  const [investFund, setInvestFund] = useState<typeof mutualFunds[number] | null>(null);
  const [monthly, setMonthly] = useState(5000);
  const [frequency, setFrequency] = useState<FreqKey>("Monthly");
  const [stepUp, setStepUp] = useState(10);
  const [years, setYears] = useState(15);
  const [investAmt, setInvestAmt] = useState(10000);

  const categories = ["All", "Equity", "Debt", "Hybrid", "Index", "ELSS"];
  const cats = [
    { t: "AI Picks", i: Sparkles, c: "crypto", k: "ai" },
    { t: "Top Performers", i: TrendingUp, c: "profit", k: "top" },
    { t: "Tax Saving (ELSS)", i: Award, c: "gold", k: "elss" },
    { t: "Low Risk", i: Shield, c: "info", k: "low" },
  ];

  const filtered = useMemo(() => {
    let list = mutualFunds;
    if (cat === "Equity") list = list.filter((f) => f.category.toLowerCase().includes("equity"));
    else if (cat === "Debt") list = list.filter((f) => f.category.toLowerCase().includes("debt"));
    else if (cat === "Hybrid") list = list.filter((f) => f.category.toLowerCase().includes("hybrid"));
    else if (cat === "Index") list = list.filter((f) => f.category.toLowerCase().includes("index"));
    else if (cat === "ELSS") list = list.filter((f) => f.category.toLowerCase().includes("elss"));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(s) || f.category.toLowerCase().includes(s));
    }
    return list;
  }, [cat, search]);

  // SIP math
  const sipMonths = years * 12;
  const rate = 0.12 / 12; // assume 12% annual
  const fv = monthly * ((Math.pow(1 + rate, sipMonths) - 1) / rate) * (1 + rate);
  const invested = monthly * sipMonths;
  const gains = fv - invested;
  // With step-up: simpler linear estimate
  const fvWithStep = monthly * ((Math.pow(1 + rate, sipMonths) - 1) / rate) * (1 + rate) * (1 + stepUp / 100 * years / 2);
  const sipFv = stepUp > 0 ? fvWithStep : fv;

  const mySips = state.sips;
  const myFundHoldings = state.fundHoldings;

  const handleCategory = (k: string) => {
    if (k === "ai") setCat("All");
    else if (k === "top") setCat("All");
    else if (k === "elss") setCat("ELSS");
    else if (k === "low") setCat("Debt");
    toast.success(`Filter applied: ${k === "elss" ? "ELSS / Tax saving" : k === "low" ? "Low risk debt" : "Showing all top funds"}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mutual Funds & SIPs</h1>
          <p className="text-sm text-muted-foreground mt-1">Direct funds · 0% commission · AI curated</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="bg-surface/60 border border-border rounded-lg px-3 py-2">
            <div className="text-muted-foreground">My SIPs</div>
            <div className="font-bold">{mySips.length} active</div>
          </div>
          <div className="bg-surface/60 border border-border rounded-lg px-3 py-2">
            <div className="text-muted-foreground">Holdings</div>
            <div className="font-bold">₹{myFundHoldings.reduce((s, f) => s + f.amount, 0).toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cats.map((c) => (
          <button
            key={c.t}
            onClick={() => handleCategory(c.k)}
            className={cn("bg-gradient-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition", `hover:border-${c.c}/40`)}
          >
            <div className={cn("w-10 h-10 rounded-xl bg-info/10 border border-info/20 flex items-center justify-center mb-3", `bg-${c.c}/10 border-${c.c}/20`)}>
              <c.i className={cn("w-5 h-5", `text-${c.c}`)} />
            </div>
            <div className="font-semibold">{c.t}</div>
            <div className="text-xs text-muted-foreground mt-1">Explore 40+ funds</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="font-semibold">Top Performing Funds</div>
            <div className="flex gap-1 text-xs flex-wrap">
              {categories.map((t) => (
                <button
                  key={t}
                  onClick={() => setCat(t)}
                  className={cn("px-3 py-1.5 rounded transition", cat === t ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:bg-surface")}
                >{t}</button>
              ))}
            </div>
          </div>
          <div className="px-5 py-3 border-b border-border bg-surface/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fund name or category..."
                className="h-9 w-full pl-9 pr-3 rounded-md bg-surface border border-border text-xs focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">No funds match your filters.</div>
            ) : (
              filtered.map((f) => (
                <div key={f.name} className="px-5 py-4 hover:bg-surface/50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>{f.category}</span> · <span>{f.aum}</span> · <span>Risk: {f.risk}</span>
                        <span className="flex items-center gap-0.5 text-gold">
                          {Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">3Y</div>
                        <div className="text-profit font-bold text-sm">{f.returns3y}%</div>
                      </div>
                      <div className="text-right hidden md:block">
                        <div className="text-[10px] text-muted-foreground">5Y</div>
                        <div className="text-profit font-bold text-sm">{f.returns5y}%</div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => setInvestFund(f)}
                          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 whitespace-nowrap"
                        >Invest</button>
                        <button
                          onClick={() => setSipFund(f)}
                          className="text-xs px-3 py-1.5 rounded-md bg-surface border border-border font-semibold hover:border-primary/40 whitespace-nowrap"
                        >Start SIP</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="font-semibold mb-1">Quick SIP Calculator</div>
            <p className="text-xs text-muted-foreground mb-4">Auto-invest monthly. Cancel anytime.</p>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground">Monthly amount</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input
                    value={monthly}
                    onChange={(e) => setMonthly(Number(e.target.value) || 0)}
                    className="w-full h-10 pl-8 pr-3 rounded-lg bg-surface border border-border font-mono font-semibold"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {SIP_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setMonthly(v)}
                      className={cn("text-xs px-3 py-1 rounded-md border", monthly === v ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border")}
                    >₹{v.toLocaleString("en-IN")}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Frequency</label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {FREQ.map((t) => (
                    <button
                      key={t.k}
                      onClick={() => setFrequency(t.k)}
                      className={cn("py-2 text-xs rounded-md", frequency === t.k ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface border border-border")}
                    >{t.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Step-up annually</label>
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {STEP_UPS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setStepUp(v)}
                      className={cn("py-1.5 text-xs rounded-md", stepUp === v ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface border border-border")}
                    >{v}%</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duration: <span className="text-foreground font-semibold">{years} years</span></label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full mt-2 accent-primary"
                />
              </div>
              <div className="bg-surface rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Invested ({years}y)</span><span className="font-mono">₹{invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. gains @12%</span><span className="text-profit font-mono">₹{gains.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5"><span>Future value</span><span className="text-primary font-mono">₹{sipFv.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
              </div>
              <button
                onClick={() => { setSipFund(mutualFunds[0]); }}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90"
              >Start SIP</button>
            </div>
          </div>

          {mySips.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="font-semibold mb-2">My Active SIPs</div>
              <div className="space-y-2">
                {mySips.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-surface/40 rounded-lg p-2.5 text-xs">
                    <div>
                      <div className="font-semibold">{s.fundName}</div>
                      <div className="text-muted-foreground">₹{s.monthly.toLocaleString("en-IN")} / {s.frequency.toLowerCase()}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-profit/15 text-profit font-semibold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invest dialog (lumpsum) */}
      <Dialog open={!!investFund} onOpenChange={(o) => !o && setInvestFund(null)}>
        <DialogContent className="sm:max-w-md">
          {investFund && (
            <>
              <DialogHeader>
                <DialogTitle>Invest in {investFund.name}</DialogTitle>
                <DialogDescription>
                  {investFund.category} · 3Y returns <span className="text-profit font-semibold">{investFund.returns3y}%</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Amount (₹)</label>
                  <Input type="number" min={500} value={investAmt} onChange={(e) => setInvestAmt(Number(e.target.value) || 0)} className="mt-1" />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[1000, 5000, 10000, 25000, 50000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setInvestAmt(v)}
                        className={cn("text-xs px-3 py-1 rounded-md border", investAmt === v ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border")}
                      >₹{v.toLocaleString("en-IN")}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-surface rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">NAV (approx.)</span><span className="font-mono">₹{(Math.random() * 50 + 40).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Units you'll get</span><span className="font-mono">{(investAmt / 50).toFixed(3)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Wallet balance</span><span className="font-mono">₹{state.wallet.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInvestFund(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (investAmt > state.wallet) { toast.error("Insufficient wallet balance"); return; }
                    const r = startFundInvestment({ name: investFund.name, category: investFund.category }, investAmt);
                    if (r.ok) {
                      toast.success(`Invested ₹${investAmt.toLocaleString("en-IN")} in ${investFund.name}`);
                      setInvestFund(null);
                    } else {
                      toast.error(r.ok ? "Investment failed" : "Investment failed");
                    }
                  }}
                ><Check className="w-3.5 h-3.5" /> Confirm Investment</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SIP dialog */}
      <Dialog open={!!sipFund} onOpenChange={(o) => !o && setSipFund(null)}>
        <DialogContent className="sm:max-w-md">
          {sipFund && (
            <>
              <DialogHeader>
                <DialogTitle>Start SIP in {sipFund.name}</DialogTitle>
                <DialogDescription>₹{monthly.toLocaleString("en-IN")} / {frequency.toLowerCase()} for {years} years</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="bg-surface rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total invested</span><span className="font-mono">₹{invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expected gains</span><span className="text-profit font-mono">₹{gains.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1.5"><span>Future value</span><span className="text-primary font-mono">₹{sipFv.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground">You can pause or cancel anytime. First debit will be on the 1st of next month.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSipFund(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (monthly > state.wallet) { toast.error("Insufficient wallet balance for first installment"); return; }
                    const r = startSIP(sipFund.name, sipFund.name, monthly, frequency, stepUp);
                    if (r.ok) {
                      toast.success(`SIP started in ${sipFund.name}`, { description: `₹${monthly.toLocaleString("en-IN")} / ${frequency.toLowerCase()}` });
                      setSipFund(null);
                    } else {
                      toast.error("Could not start SIP");
                    }
                  }}
                ><Plus className="w-3.5 h-3.5" /> Start SIP</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
