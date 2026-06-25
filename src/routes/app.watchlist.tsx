import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkline } from "@/components/sparkline";
import { stocks, crypto } from "@/lib/mock-data";
import { Plus, Star, MoreHorizontal, X, Trash2, Edit2, Check, Search, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OrderTicket } from "@/components/order-ticket";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/watchlist")({
  component: Watchlist,
});

type WL = { id: string; name: string; symbols: string[]; created: number };

const DEFAULT_LISTS: WL[] = [
  { id: "stocks", name: "My Stocks", created: Date.now() - 86400000 * 30, symbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "SBIN", "LT", "ITC", "HINDUNILVR", "KOTAKBANK", "AXISBANK", "BAJFINANCE", "ASIANPAINT"] },
  { id: "crypto", name: "Crypto Picks", created: Date.now() - 86400000 * 14, symbols: ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA"] },
  { id: "long", name: "Long Term", created: Date.now() - 86400000 * 60, symbols: ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC", "BHARTIARTL"] },
  { id: "swing", name: "Swing Trades", created: Date.now() - 86400000 * 7, symbols: ["TATAMOTORS", "ADANIENT", "ZOMATO", "PAYTM", "POLICYBZR"] },
];

const ALL_SYMBOLS = [...stocks.map((s) => s.symbol), ...crypto.map((c) => c.symbol)];

function Watchlist() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<WL[]>(DEFAULT_LISTS);
  const [activeId, setActiveId] = useState("stocks");
  const [addListOpen, setAddListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [addSymbolOpen, setAddSymbolOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [order, setOrder] = useState<{ symbol: string; kind: "BUY" | "SELL" } | null>(null);

  const active = lists.find((l) => l.id === activeId) || lists[0];

  const lookupBySymbol = (sym: string) => {
    const s = stocks.find((x) => x.symbol === sym);
    if (s) return s;
    const c = crypto.find((x) => x.symbol === sym);
    return c;
  };

  const items = useMemo(() => active.symbols.map(lookupBySymbol).filter(Boolean), [active]);

  const createList = () => {
    if (!newListName.trim()) { toast.error("Enter a name"); return; }
    const l: WL = { id: `l_${Date.now()}`, name: newListName.trim(), symbols: [], created: Date.now() };
    setLists([...lists, l]);
    setActiveId(l.id);
    setNewListName("");
    setAddListOpen(false);
    toast.success(`Watchlist "${l.name}" created`);
  };

  const removeSymbol = (sym: string) => {
    setLists(lists.map((l) => l.id === activeId ? { ...l, symbols: l.symbols.filter((s) => s !== sym) } : l));
    toast("Removed from watchlist", { description: sym });
  };

  const addSymbol = (sym: string) => {
    if (active.symbols.includes(sym)) { toast.error(`${sym} already in ${active.name}`); return; }
    setLists(lists.map((l) => l.id === activeId ? { ...l, symbols: [...l.symbols, sym] } : l));
    setAddSymbolOpen(false);
    setSearch("");
    toast.success(`Added ${sym} to ${active.name}`);
  };

  const deleteList = (id: string) => {
    if (lists.length === 1) { toast.error("Can't delete last watchlist"); return; }
    const name = lists.find((l) => l.id === id)?.name;
    setLists(lists.filter((l) => l.id !== id));
    if (activeId === id) setActiveId(lists[0].id);
    toast.success(`Deleted "${name}"`);
  };

  const renameList = () => {
    if (!renameValue.trim()) return;
    setLists(lists.map((l) => l.id === activeId ? { ...l, name: renameValue.trim() } : l));
    setRenameOpen(false);
    setRenameValue("");
    toast.success("Watchlist renamed");
  };

  const filteredSearch = ALL_SYMBOLS.filter((s) => s.toLowerCase().includes(search.toLowerCase()) && !active.symbols.includes(s)).slice(0, 8);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto grid lg:grid-cols-[260px_1fr] gap-5">
      <aside className="space-y-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-1.5"><Star className="w-4 h-4 text-gold fill-gold" /> Watchlists</h2>
          <button onClick={() => setAddListOpen(true)} className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        {lists.map((l) => (
          <div key={l.id} className={cn("group rounded-lg flex items-center justify-between transition", activeId === l.id ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-surface text-muted-foreground border border-transparent")}>
            <button onClick={() => setActiveId(l.id)} className="flex-1 text-left px-3 py-2.5 text-sm flex items-center gap-2 min-w-0">
              <Star className={cn("w-3.5 h-3.5 shrink-0", activeId === l.id ? "fill-current" : "")} />
              <span className="truncate">{l.name}</span>
            </button>
            <span className="text-xs px-2">{l.symbols.length}</span>
            <button onClick={() => deleteList(l.id)} className="opacity-0 group-hover:opacity-100 px-2 text-muted-foreground hover:text-loss transition" title="Delete list"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </aside>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-2">
          <div>
            <div className="font-semibold flex items-center gap-2">{active.name} <button onClick={() => { setRenameValue(active.name); setRenameOpen(true); }} className="text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button></div>
            <div className="text-xs text-muted-foreground">{active.symbols.length} instruments · Live</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddSymbolOpen(true)} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 flex items-center gap-1"><Plus className="w-3 h-3" /> Add symbol</button>
            <button onClick={() => toast.info("Watchlist options")} className="w-8 h-8 rounded-md hover:bg-surface flex items-center justify-center"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <div className="font-medium">No symbols in {active.name}</div>
            <div className="text-xs mt-1">Click "Add symbol" to start tracking</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Symbol</th>
                <th className="text-right px-5 py-3 font-medium">LTP</th>
                <th className="text-right px-5 py-3 font-medium">Change</th>
                <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Chart</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a: any) => {
                const up = a.changePct >= 0;
                return (
                  <tr key={a.symbol} className="border-b border-border/50 hover:bg-surface/50 group">
                    <td className="px-5 py-3 cursor-pointer" onClick={() => navigate({ to: "/app/terminal", search: { symbol: a.symbol } })}>
                      <div className="font-semibold flex items-center gap-1.5">{a.symbol} <TrendingUp className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" /></div>
                      <div className="text-xs text-muted-foreground">{a.name}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">{a.type === "crypto" ? "$" : "₹"}{a.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className={cn("px-5 py-3 text-right font-semibold", up ? "text-profit" : "text-loss")}>{up ? "+" : ""}{a.changePct.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-right hidden md:table-cell"><div className="inline-block"><Sparkline data={a.sparkline || []} positive={up} width={100} height={32} /></div></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setOrder({ symbol: a.symbol, kind: "BUY" })} className="px-3 py-1 text-xs font-semibold rounded-md bg-profit/15 text-profit hover:bg-profit hover:text-primary-foreground transition">BUY</button>
                        <button onClick={() => setOrder({ symbol: a.symbol, kind: "SELL" })} className="px-3 py-1 text-xs font-semibold rounded-md bg-loss/15 text-loss hover:bg-loss hover:text-white transition">SELL</button>
                        <button onClick={() => removeSymbol(a.symbol)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md hover:bg-loss/10 text-muted-foreground hover:text-loss flex items-center justify-center transition" title="Remove"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add list dialog */}
      <Dialog open={addListOpen} onOpenChange={setAddListOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New watchlist</DialogTitle>
            <DialogDescription>Group symbols you want to track together</DialogDescription>
          </DialogHeader>
          <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. Tech stocks" autoFocus onKeyDown={(e) => e.key === "Enter" && createList()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddListOpen(false)}>Cancel</Button>
            <Button onClick={createList}><Check className="w-4 h-4" /> Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename watchlist</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && renameList()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={renameList}><Check className="w-4 h-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add symbol dialog */}
      <Dialog open={addSymbolOpen} onOpenChange={setAddSymbolOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to {active.name}</DialogTitle>
            <DialogDescription>Search from {ALL_SYMBOLS.length} instruments</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticker…" className="pl-9" autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto -mx-2">
            {filteredSearch.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">{search ? "No matches" : "Start typing…"}</div>
            ) : filteredSearch.map((sym) => {
              const a: any = lookupBySymbol(sym);
              return (
                <button key={sym} onClick={() => addSymbol(sym)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface rounded-md">
                  <div>
                    <div className="font-semibold text-sm">{sym}</div>
                    <div className="text-xs text-muted-foreground">{a?.name || sym}</div>
                  </div>
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {order && <OrderTicket open={true} onOpenChange={() => setOrder(null)} symbol={order.symbol} defaultKind={order.kind} />}
    </div>
  );
}
