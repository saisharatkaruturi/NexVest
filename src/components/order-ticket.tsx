import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarket, type OrderKind, type OrderType } from "@/lib/market-store";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderTicketProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  defaultKind?: OrderKind;
}

export function OrderTicket({ open, onOpenChange, symbol, defaultKind = "BUY" }: OrderTicketProps) {
  const { quote, baseAsset, placeOrder, state } = useMarket();
  const wallet = state.wallet;
  const live = quote(symbol);
  const base = baseAsset(symbol);
  const [kind, setKind] = useState<OrderKind>(defaultKind);
  const [type, setType] = useState<OrderType>("MARKET");
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(live?.price ?? 0);

  useEffect(() => {
    if (open) {
      setKind(defaultKind);
      setType("MARKET");
      setQty(1);
      setPrice(live?.price ?? 0);
    }
  }, [open, defaultKind, live?.price]);

  useEffect(() => {
    if (type === "MARKET" && live) setPrice(live.price);
  }, [type, live?.price]);

  if (!live || !base) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unknown symbol</DialogTitle>
            <DialogDescription>{symbol} is not in the market.</DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const total = qty * price;
  const isCrypto = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "MATIC", "LINK", "DOT", "TRX", "SHIB", "LTC"].includes(symbol);
  const isGold = symbol === "GOLD";
  const symbol_ = isCrypto ? "$" : isGold ? "₹" : "₹";
  const existingPosition = state.positions.find((p) => p.symbol === symbol);
  const insufficient = kind === "BUY" && total > wallet;
  const insufficientSell = kind === "SELL" && (!existingPosition || existingPosition.qty < qty);

  const submit = () => {
    const res = placeOrder({ symbol, kind, type, qty, price: type === "MARKET" ? undefined : price });
    if (res.ok) {
      toast.success(`${kind === "BUY" ? "Bought" : "Sold"} ${qty} ${symbol}`, {
        description: `${type === "MARKET" ? "Executed" : "Placed"} at ${symbol_}${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      });
      onOpenChange(false);
    } else {
      toast.error(res.reason || "Order failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div>
              <div className="text-lg font-bold">{symbol}</div>
              <div className="text-xs text-muted-foreground font-normal">{base.name}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold font-mono">
                {symbol_}{live.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <div className={cn("text-xs font-semibold", live.changePct >= 0 ? "text-profit" : "text-loss")}>
                {live.changePct >= 0 ? "+" : ""}{live.change.toFixed(2)} ({live.changePct.toFixed(2)}%)
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Place a {kind} order for {base.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buy/Sell tabs */}
          <div className="grid grid-cols-2 gap-1 bg-surface rounded-lg p-1">
            <button
              onClick={() => setKind("BUY")}
              className={cn("py-2 text-sm font-bold rounded-md transition", kind === "BUY" ? "bg-profit text-white" : "text-muted-foreground hover:text-foreground")}
            >
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> BUY
            </button>
            <button
              onClick={() => setKind("SELL")}
              className={cn("py-2 text-sm font-bold rounded-md transition", kind === "SELL" ? "bg-loss text-white" : "text-muted-foreground hover:text-foreground")}
            >
              <TrendingDown className="w-3.5 h-3.5 inline mr-1" /> SELL
            </button>
          </div>

          {/* Order type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Order type</Label>
            <div className="grid grid-cols-3 gap-1">
              {(["MARKET", "LIMIT", "STOP"] as OrderType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "py-1.5 text-xs font-semibold rounded-md border",
                    type === t
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-surface border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Qty */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              {existingPosition && (
                <span className="text-[10px] text-muted-foreground">
                  You hold {existingPosition.qty}
                </span>
              )}
            </div>
            <Input
              type="number"
              min={0.0001}
              step={isCrypto ? 0.0001 : 1}
              value={qty}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
              className="font-mono"
            />
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {existingPosition && kind === "SELL" ? (
                <>
                  <button onClick={() => setQty(Math.floor(existingPosition.qty * 0.25))} className="text-[11px] py-1 rounded bg-surface border border-border hover:border-primary/40">25%</button>
                  <button onClick={() => setQty(Math.floor(existingPosition.qty * 0.5))} className="text-[11px] py-1 rounded bg-surface border border-border hover:border-primary/40">50%</button>
                  <button onClick={() => setQty(Math.floor(existingPosition.qty * 0.75))} className="text-[11px] py-1 rounded bg-surface border border-border hover:border-primary/40">75%</button>
                  <button onClick={() => setQty(existingPosition.qty)} className="text-[11px] py-1 rounded bg-surface border border-border hover:border-primary/40">All</button>
                </>
              ) : (
                ["25%", "50%", "75%", "Max"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      if (p === "Max") {
                        const maxQty = isCrypto ? +(wallet / live.price).toFixed(4) : Math.floor(wallet / live.price);
                        setQty(maxQty);
                      } else {
                        const pct = parseInt(p) / 100;
                        setQty(isCrypto ? +(wallet / live.price * pct).toFixed(4) : Math.floor(wallet / live.price * pct));
                      }
                    }}
                    className="text-[11px] py-1 rounded bg-surface border border-border hover:border-primary/40"
                  >
                    {p}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Price (only for LIMIT/STOP) */}
          {type !== "MARKET" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">Price</Label>
                <button onClick={() => setPrice(live.price)} className="text-[10px] text-primary hover:underline">Use LTP</button>
              </div>
              <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="font-mono" />
            </div>
          )}

          {/* Summary */}
          <div className="bg-surface rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{symbol_}{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brokerage</span>
              <span className="font-mono">₹0</span>
            </div>
            <div className="flex justify-between font-bold pt-1.5 border-t border-border">
              <span>Total</span>
              <span className="font-mono">{symbol_}{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className={cn("font-mono", insufficient ? "text-loss" : "")}>₹{wallet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {insufficient && (
            <div className="flex items-center gap-2 text-xs text-loss bg-loss/10 border border-loss/20 rounded-md p-2">
              <AlertCircle className="w-3.5 h-3.5" /> Insufficient wallet balance for this order.
            </div>
          )}
          {insufficientSell && (
            <div className="flex items-center gap-2 text-xs text-loss bg-loss/10 border border-loss/20 rounded-md p-2">
              <AlertCircle className="w-3.5 h-3.5" /> You don't have enough {symbol} to sell.
            </div>
          )}

          <Button
            onClick={submit}
            disabled={qty <= 0 || price <= 0 || insufficient || insufficientSell}
            className={cn("w-full h-11 font-bold", kind === "BUY" ? "bg-profit hover:bg-profit/90" : "bg-loss hover:bg-loss/90")}
          >
            <CheckCircle2 className="w-4 h-4" /> {kind} {qty} {symbol}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
