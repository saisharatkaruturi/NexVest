import { useNavigate } from "@tanstack/react-router";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useMarket } from "@/lib/market-store";
import { allAssets } from "@/lib/mock-data";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGES = [
  { name: "Dashboard", to: "/app" },
  { name: "Trading Terminal", to: "/app/terminal" },
  { name: "Markets", to: "/app/markets" },
  { name: "Watchlist", to: "/app/watchlist" },
  { name: "Portfolio", to: "/app/portfolio" },
  { name: "Analytics", to: "/app/analytics" },
  { name: "Crypto", to: "/app/crypto" },
  { name: "Gold & Silver", to: "/app/gold" },
  { name: "Mutual Funds", to: "/app/funds" },
  { name: "IPO Centre", to: "/app/ipo" },
  { name: "AI Advisor", to: "/app/ai" },
  { name: "News", to: "/app/news" },
  { name: "Learn", to: "/app/learn" },
  { name: "Settings", to: "/app/settings" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { quote } = useMarket();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search assets, pages, or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem
              key={p.to}
              value={`page ${p.name}`}
              onSelect={() => {
                navigate({ to: p.to });
                onOpenChange(false);
              }}
            >
              <Search className="w-4 h-4" />
              <span>{p.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Assets">
          {allAssets.map((a) => {
            const l = quote(a.symbol);
            const p = l?.price ?? a.price;
            const c = l?.changePct ?? a.changePct;
            const up = c >= 0;
            return (
              <CommandItem
                key={a.symbol}
                value={`asset ${a.symbol} ${a.name}`}
                onSelect={() => {
                  navigate({ to: "/app/stock", search: { symbol: a.symbol } });
                  onOpenChange(false);
                }}
              >
                <span className="font-mono font-semibold w-16 truncate">{a.symbol}</span>
                <span className="text-muted-foreground text-xs truncate flex-1">{a.name}</span>
                <span className="text-xs font-mono">₹{p.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                <span className={cn("text-xs flex items-center gap-0.5 w-16 justify-end", up ? "text-profit" : "text-loss")}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {up ? "+" : ""}{c.toFixed(2)}%
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
