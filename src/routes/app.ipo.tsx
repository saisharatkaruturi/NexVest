import { createFileRoute } from "@tanstack/react-router";
import { ipos } from "@/lib/mock-data";
import { Rocket, Calendar, TrendingUp, Check, X, ExternalLink, Info, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/lib/market-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ipo")({
  component: IPO,
});

const TABS = [
  { k: "all", l: "All" },
  { k: "open", l: "Open" },
  { k: "upcoming", l: "Upcoming" },
  { k: "listed", l: "Listed" },
  { k: "mainboard", l: "Mainboard" },
  { k: "sme", l: "SME" },
];

function IPO() {
  const { state, dispatch } = useMarket();
  const [tab, setTab] = useState("all");
  const [applyOpen, setApplyOpen] = useState<typeof ipos[number] | null>(null);
  const [lots, setLots] = useState(1);
  const [upi, setUpi] = useState("");
  const [cat, setCat] = useState<"Retail" | "HNI" | "QIB" | "Employee">("Retail");

  const counts = useMemo(() => ({
    open: ipos.filter((i) => i.status === "open").length,
    upcoming: ipos.filter((i) => i.status === "upcoming").length,
    mainboard: ipos.filter((i) => i.lot >= 50).length,
    sme: ipos.filter((i) => i.lot < 50).length,
    applied: state.ipoApplications.length,
  }), [state.ipoApplications]);

  const filtered = useMemo(() => {
    if (tab === "all") return ipos;
    if (tab === "open") return ipos.filter((i) => i.status === "open");
    if (tab === "upcoming") return ipos.filter((i) => i.status === "upcoming");
    if (tab === "listed") return ipos.filter((i) => i.status === "listed");
    if (tab === "mainboard") return ipos.filter((i) => i.lot >= 50);
    if (tab === "sme") return ipos.filter((i) => i.lot < 50);
    return ipos;
  }, [tab]);

  const applied = (name: string) => state.ipoApplications.some((a) => a.name === name);

  const parsePrice = (band: string): number => {
    const m = band.match(/₹(\d+)/);
    return m ? Number(m[1]) : 100;
  };

  const openApply = (i: typeof ipos[number]) => {
    setApplyOpen(i);
    setLots(1);
    setUpi("");
  };

  const submitApply = () => {
    if (!applyOpen) return;
    if (!upi || !upi.includes("@")) { toast.error("Enter a valid UPI ID"); return; }
    const price = parsePrice(applyOpen.price);
    const shares = applyOpen.lot * lots;
    const amount = price * shares;
    if (amount > state.wallet) { toast.error(`Insufficient balance. Need ₹${amount.toLocaleString("en-IN")}`); return; }
    dispatch({
      type: "APPLY_IPO",
      app: {
        id: `ipo-${Date.now()}`,
        name: applyOpen.name,
        lots,
        amount,
        appliedAt: Date.now(),
        status: "PENDING",
      },
    });
    toast.success(`Applied to ${applyOpen.name}`, { description: `${lots} lot(s) · ${shares} shares · ₹${amount.toLocaleString("en-IN")} blocked` });
    setApplyOpen(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Rocket className="w-6 h-6 text-gold" /> IPO Centre</h1>
          <p className="text-sm text-muted-foreground mt-1">Apply via UPI · Live GMP · Real-time subscription</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Your applications</div>
          <div className="text-2xl font-bold">{counts.applied}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Open", v: counts.open, c: "profit" },
          { l: "Upcoming", v: counts.upcoming, c: "info" },
          { l: "Mainboard", v: counts.mainboard, c: "gold" },
          { l: "SME", v: counts.sme, c: "crypto" },
        ].map((m) => (
          <div key={m.l} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{m.l}</div>
            <div className={cn("text-3xl font-bold mt-1", `text-${m.c}`)}>{m.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="font-semibold">All IPOs</div>
          <div className="flex gap-1 text-xs overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} className={cn("px-3 py-1.5 rounded-md whitespace-nowrap transition", tab === t.k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface")}>{t.l}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No IPOs in this category</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((i) => {
              const isApplied = applied(i.name);
              return (
                <div key={i.name} className="px-5 py-4 grid md:grid-cols-[1fr_auto] gap-4 items-center hover:bg-surface/50">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{i.name}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                        i.status === "open" ? "bg-profit/15 text-profit" :
                        i.status === "upcoming" ? "bg-info/15 text-info" :
                        "bg-gold/15 text-gold"
                      )}>
                        {i.status === "open" ? "OPEN" : i.status === "upcoming" ? "UPCOMING" : "LISTED"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border uppercase font-semibold">{i.lot >= 50 ? "Mainboard" : "SME"}</span>
                      {isApplied && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Applied</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-xs">
                      <div><div className="text-muted-foreground">Price Band</div><div className="font-semibold mt-0.5">{i.price}</div></div>
                      <div><div className="text-muted-foreground">Lot Size</div><div className="font-semibold mt-0.5">{i.lot}</div></div>
                      <div><div className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Open</div><div className="font-semibold mt-0.5">{i.open}</div></div>
                      <div><div className="text-muted-foreground">Close</div><div className="font-semibold mt-0.5">{i.close}</div></div>
                      <div><div className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />GMP</div><div className="font-semibold mt-0.5 text-profit">{i.gmp}</div></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toast.info(`Opening ${i.name} detail page`)} className="px-3 py-2 rounded-lg bg-surface border border-border text-sm hover:border-primary/40 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Details</button>
                    <button
                      disabled={i.status !== "open" || isApplied}
                      onClick={() => openApply(i)}
                      className={cn("px-5 py-2.5 rounded-lg font-semibold text-sm transition",
                        isApplied ? "bg-primary/15 text-primary cursor-default" : "bg-primary text-primary-foreground hover:opacity-90",
                        i.status !== "open" && "disabled:opacity-40 disabled:cursor-not-allowed"
                      )}
                    >
                      {isApplied ? "Applied" : i.status === "open" ? "Apply via UPI" : i.status === "upcoming" ? <><Clock className="w-3.5 h-3.5 inline" /> Upcoming</> : "Listed"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {state.ipoApplications.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="font-semibold mb-3 flex items-center gap-1.5"><Check className="w-4 h-4 text-profit" /> Your IPO applications</div>
          <div className="space-y-2">
            {state.ipoApplications.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.lots} lot(s) · {a.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">₹{a.amount.toLocaleString("en-IN")}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(a.appliedAt).toLocaleDateString("en-IN")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!applyOpen} onOpenChange={(o) => !o && setApplyOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Rocket className="w-4 h-4 text-gold" /> Apply to {applyOpen?.name}</DialogTitle>
            <DialogDescription>Price band {applyOpen?.price} · Lot size {applyOpen?.lot}</DialogDescription>
          </DialogHeader>
          {applyOpen && (() => {
            const price = parsePrice(applyOpen.price);
            const shares = applyOpen.lot * lots;
            const amount = price * shares;
            return (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Investor category</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["Retail", "HNI", "QIB", "Employee"] as const).map((c) => (
                      <button key={c} onClick={() => setCat(c)} className={cn("py-1.5 text-xs rounded-md border", cat === c ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border")}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Number of lots</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setLots(Math.max(1, lots - 1))} className="w-8 h-8 rounded-md bg-surface border border-border hover:border-primary/40">−</button>
                    <Input type="number" min={1} max={14} value={lots} onChange={(e) => setLots(Math.max(1, Math.min(14, Number(e.target.value))))} className="text-center" />
                    <button onClick={() => setLots(Math.min(14, lots + 1))} className="w-8 h-8 rounded-md bg-surface border border-border hover:border-primary/40">+</button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">UPI ID for refund / allotment</div>
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@bankupi" />
                </div>
                <div className="bg-surface rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Shares</span><span className="font-mono">{shares}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Per share</span><span className="font-mono">₹{price}</span></div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>Block amount</span><span className="font-mono">₹{amount.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(null)}>Cancel</Button>
            <Button onClick={submitApply}><Check className="w-4 h-4" /> Confirm & block funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
