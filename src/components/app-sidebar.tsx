import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, TrendingUp, Star, Briefcase, BarChart3, Coins, Gem,
  PieChart, Rocket, Sparkles, Newspaper, GraduationCap, Settings, Activity,
  CandlestickChart, Crown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/terminal", label: "Trading Terminal", icon: CandlestickChart },
  { to: "/app/markets", label: "Markets", icon: TrendingUp },
  { to: "/app/watchlist", label: "Watchlist", icon: Star },
  { to: "/app/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/crypto", label: "Crypto", icon: Coins },
  { to: "/app/gold", label: "Gold & Silver", icon: Gem },
  { to: "/app/funds", label: "Mutual Funds", icon: PieChart },
  { to: "/app/ipo", label: "IPO", icon: Rocket },
  { to: "/app/ai", label: "AI Advisor", icon: Sparkles },
  { to: "/app/news", label: "News", icon: Newspaper },
  { to: "/app/learn", label: "Learn", icon: GraduationCap },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const PRO_FEATURES = [
  "Unlimited AI Advisor queries",
  "Real-time advanced charts & indicators",
  "Options strategy builder with Greeks",
  "Priority order execution",
  "Exclusive research reports",
  "Ad-free experience",
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-profit flex items-center justify-center shadow-glow">
          <Activity className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
        </div>
        <span className="font-bold text-lg tracking-tight">NexVest</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const isActive = item.exact
            ? pathname === item.to
            : pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-primary border-l-2 border-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl bg-gradient-card border border-border p-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-gold opacity-5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-semibold">AI Copilot Pro</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">Unlock premium recommendations & live analytics</p>
            <button onClick={() => setUpgradeOpen(true)} className="w-full text-xs bg-primary text-primary-foreground rounded-md py-1.5 font-medium hover:opacity-90 transition">Upgrade to Pro</button>
          </div>
        </div>
      </div>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-gold" /> Upgrade to Pro</DialogTitle>
            <DialogDescription>Cancel anytime · 7-day free trial</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-profit shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPlan("monthly")} className={cn("p-3 rounded-lg border text-left transition", plan === "monthly" ? "bg-primary/10 border-primary/40" : "bg-surface border-border")}>
                <div className="text-[10px] text-muted-foreground uppercase">Monthly</div>
                <div className="text-xl font-bold mt-1">₹499<span className="text-xs text-muted-foreground">/mo</span></div>
              </button>
              <button onClick={() => setPlan("yearly")} className={cn("p-3 rounded-lg border text-left transition relative", plan === "yearly" ? "bg-primary/10 border-primary/40" : "bg-surface border-border")}>
                <div className="absolute -top-2 right-2 text-[9px] bg-profit text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">SAVE 40%</div>
                <div className="text-[10px] text-muted-foreground uppercase">Yearly</div>
                <div className="text-xl font-bold mt-1">₹3,599<span className="text-xs text-muted-foreground">/yr</span></div>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Maybe later</Button>
            <Button onClick={() => { setUpgradeOpen(false); toast.success("Welcome to Pro! 🎉", { description: `Your ${plan} plan is active. 7-day trial — no charge today.` }); }}>
              <Crown className="w-4 h-4" /> Start free trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
