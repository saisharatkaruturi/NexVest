import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search, Bell, Wallet, Sparkles, Sun, Moon, User, LogOut, ChevronDown,
  Command, Plus, ArrowDownLeft, ArrowUpRight, CheckCheck, Trash2,
} from "lucide-react";
import { indices } from "@/lib/mock-data";
import { useMarket } from "@/lib/market-store";
import { CommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function AppTopbar() {
  const navigate = useNavigate();
  const { quote, state, markNotificationRead, clearNotifications, setTheme, addFunds, dispatch, dataSource, lastFetchAt } = useMarket();
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("5000");
  const [aiOpen, setAiOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = state.notifications.filter((n) => !n.read).length;
  const liveIndices = indices.slice(0, 3).map((i) => ({ ...i, ...(quote(i.symbol) ?? {}) }));

  const onLogout = () => {
    logout();
    toast.success("Logged out", { description: "See you soon!" });
    navigate({ to: "/login" });
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 md:px-6 gap-4">
      <div className="hidden lg:flex items-center gap-5 text-sm">
        {liveIndices.map((i) => {
          const up = (i.changePct ?? 0) >= 0;
          return (
            <button
              key={i.symbol}
              onClick={() => navigate({ to: "/app/terminal", search: { symbol: i.symbol } })}
              className="flex items-center gap-1.5 hover:text-primary transition"
            >
              <span className="text-muted-foreground font-medium">{i.symbol}</span>
              <span className="font-semibold">{(i.price ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              <span className={cn("text-xs", up ? "text-profit" : "text-loss")}>
                {up ? "+" : ""}{(i.changePct ?? 0).toFixed(2)}%
              </span>
            </button>
          );
        })}

        {/* Live data source indicator */}
        <div
          title={dataSource === "backend" ? `Live backend data · last sync ${timeAgo(lastFetchAt)} ago` : "Using offline mock — backend unreachable"}
          className={cn(
            "hidden xl:flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ml-1",
            dataSource === "backend" ? "bg-profit/10 text-profit border-profit/30" : "bg-info/10 text-info border-info/30"
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", dataSource === "backend" ? "bg-profit animate-pulse" : "bg-info")} />
          {dataSource === "backend" ? "Live" : "Cached"}
        </div>
      </div>

      {/* Search trigger */}
      <div className="flex-1 max-w-xl ml-auto lg:ml-4">
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full h-10 pl-10 pr-16 rounded-lg bg-surface border border-border text-sm text-muted-foreground hover:border-primary/40 transition flex items-center relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <span className="flex-1 text-left">Search stocks, crypto, mutual funds…</span>
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 items-center gap-0.5">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Wallet */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden md:flex items-center gap-2 h-10 px-3 rounded-lg bg-surface border border-border hover:border-primary/40 transition">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">₹{state.wallet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-4 border-b border-border">
              <div className="text-xs text-muted-foreground">Available balance</div>
              <div className="text-2xl font-bold mt-1">₹{state.wallet.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              <div className="flex gap-1 mt-3">
                <Button size="sm" onClick={() => setTopupOpen(true)} className="flex-1"><Plus className="w-3 h-3" /> Add</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info("Withdraw flow coming soon")}>Withdraw</Button>
              </div>
            </div>
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Quick stats</div>
              <div className="space-y-1.5 px-2 py-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Open orders</span><span className="font-mono font-semibold">{state.orders.filter((o) => o.status === "OPEN").length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Holdings</span><span className="font-mono font-semibold">{state.positions.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SIPs</span><span className="font-mono font-semibold">{state.sips.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gold</span><span className="font-mono font-semibold">{state.goldHolding.grams.toFixed(4)}g</span></div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* AI quick prompt */}
        <Popover open={aiOpen} onOpenChange={setAiOpen}>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-gradient-to-br from-crypto to-info border border-border hover:opacity-90 transition flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b border-border bg-gradient-card">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold">Quick AI prompts</span>
              </div>
              <p className="text-xs text-muted-foreground">Get instant insights powered by your live portfolio.</p>
            </div>
            <div className="p-2 space-y-1">
              {[
                { t: "Analyze my portfolio", d: "Risk, diversification, returns" },
                { t: "Should I buy RELIANCE now?", d: "AI verdict with target & stop loss" },
                { t: "Top 3 SIPs for ₹5,000/month", d: "Personalised fund recommendations" },
                { t: "Crypto outlook this week", d: "Sentiment + on-chain metrics" },
                { t: "Tax loss harvesting ideas", d: "Save up to ₹40k in taxes" },
              ].map((p) => (
                <button
                  key={p.t}
                  onClick={() => {
                    setAiOpen(false);
                    navigate({ to: "/app/ai" });
                    toast.success("Prompt sent to AI Copilot", { description: p.t });
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-surface transition"
                >
                  <div className="text-sm font-medium">{p.t}</div>
                  <div className="text-[11px] text-muted-foreground">{p.d}</div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <Button onClick={() => { setAiOpen(false); navigate({ to: "/app/ai" }); }} className="w-full" variant="outline">
                Open AI Advisor <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-surface border border-border hover:border-primary/40 transition flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-loss text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="font-semibold text-sm">Notifications</div>
              {state.notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {state.notifications.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  You're all caught up
                </div>
              ) : (
                state.notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={cn("w-full text-left px-4 py-3 border-b border-border/50 hover:bg-surface/50 flex items-start gap-3", !n.read && "bg-primary/5")}
                  >
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.at)} ago</div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border">
              <Button onClick={() => { setNotifOpen(false); navigate({ to: "/app/settings", search: { section: undefined } }); }} variant="outline" className="w-full">
                Notification settings
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-lg bg-surface border border-border hover:border-primary/40 transition hidden md:flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {state.theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-gradient-profit flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-90 transition">
              {(user?.name?.[0] ?? "U").toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="font-semibold text-foreground">{user?.name ?? "Investor"}</div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email ?? "guest@nexvest.app"}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings", search: { section: undefined } })}>
              <User className="w-4 h-4" /> Profile & settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTopupOpen(true)}>
              <ArrowDownLeft className="w-4 h-4" /> Add funds
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/app/portfolio" })}>
              <ArrowUpRight className="w-4 h-4" /> View portfolio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-loss focus:text-loss">
              <LogOut className="w-4 h-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Add funds dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add money to wallet</DialogTitle>
            <DialogDescription>Top up your NexVest wallet to start investing instantly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 25000].map((v) => (
                <button
                  key={v}
                  onClick={() => setTopupAmount(String(v))}
                  className={cn("py-2 text-sm rounded-md border font-semibold", topupAmount === String(v) ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border")}
                >
                  ₹{v.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="amt" className="text-xs text-muted-foreground">Custom amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input id="amt" type="number" min={100} value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} className="pl-7" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Min ₹100. Powered by UPI / Net Banking.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const amt = Math.max(0, Number(topupAmount));
              if (amt < 100) { toast.error("Minimum top-up is ₹100"); return; }
              addFunds(amt);
              setTopupOpen(false);
            }}>
              <Plus className="w-4 h-4" /> Add ₹{Number(topupAmount || 0).toLocaleString("en-IN")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

// Re-wire the CommandPalette prop API so it works with our internal open state
// (the palette is self-contained above; this file ends here)
