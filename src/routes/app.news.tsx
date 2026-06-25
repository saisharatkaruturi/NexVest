import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { detailedNews } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bookmark, Share2, ExternalLink, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/news")({
  component: News,
});

const TABS = [
  { k: "all", l: "All" },
  { k: "Markets", l: "Markets" },
  { k: "Crypto", l: "Crypto" },
  { k: "Earnings", l: "Earnings" },
  { k: "IPO", l: "IPO" },
  { k: "Policy", l: "Policy" },
  { k: "Global", l: "Global" },
  { k: "Commodities", l: "Commodities" },
];

function News() {
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState<typeof detailedNews[number] | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (tab === "all") return detailedNews;
    return detailedNews.filter((n) => n.tag === tab);
  }, [tab]);

  const toggleBookmark = (id: string) => {
    setBookmarks((b) => {
      const n = new Set(b);
      if (n.has(id)) { n.delete(id); toast("Removed from bookmarks"); }
      else { n.add(id); toast.success("Bookmarked"); }
      return n;
    });
  };

  const share = (n: typeof detailedNews[number]) => {
    if (navigator.share) {
      navigator.share({ title: n.title, text: n.body }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${n.title} — via NexVest`);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">News & Insights</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> AI-curated · From 40+ sources · {filtered.length} stories
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "whitespace-nowrap px-4 py-2 text-sm rounded-full transition flex items-center gap-1.5",
              tab === t.k ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {t.l}
            {t.k !== "all" && (
              <span className="text-[10px] opacity-70">({detailedNews.filter((n) => n.tag === t.k).length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          No stories in this category right now. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n, i) => (
            <article
              key={n.id}
              onClick={() => setOpen(n)}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition cursor-pointer flex gap-4 group"
            >
              <div className={cn("w-24 h-24 rounded-xl shrink-0 hidden sm:flex items-center justify-center text-2xl font-bold",
                n.tag === "Markets" ? "bg-info/15 text-info" :
                n.tag === "Crypto" ? "bg-crypto/15 text-crypto" :
                n.tag === "Earnings" ? "bg-profit/15 text-profit" :
                n.tag === "IPO" ? "bg-gold/15 text-gold" :
                n.tag === "Policy" ? "bg-warning/15 text-warning" :
                n.tag === "Global" ? "bg-loss/15 text-loss" :
                "bg-surface text-foreground"
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-semibold">{n.tag}</span>
                  <span className="text-xs text-muted-foreground">{n.source} · {n.time}</span>
                  {bookmarks.has(n.id) && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-semibold">★ Saved</span>}
                </div>
                <h2 className="font-semibold text-base sm:text-lg leading-snug group-hover:text-primary transition">{n.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.body}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 2.4k reads</span>
                  <span>·</span>
                  <span>3 min read</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-semibold">{open.tag}</span>
                  <span className="text-xs text-muted-foreground">{open.source} · {open.time}</span>
                </div>
                <DialogTitle className="text-xl leading-snug">{open.title}</DialogTitle>
                <DialogDescription>AI-curated market intelligence</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-foreground/90 mt-2 whitespace-pre-line">{open.body}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <button onClick={() => toggleBookmark(open.id)} className={cn("px-3 py-2 text-xs rounded-md border flex items-center gap-1.5", bookmarks.has(open.id) ? "bg-gold/15 text-gold border-gold/30" : "bg-surface border-border hover:border-primary/40")}>
                  <Bookmark className={cn("w-3.5 h-3.5", bookmarks.has(open.id) && "fill-current")} /> {bookmarks.has(open.id) ? "Saved" : "Save"}
                </button>
                <button onClick={() => share(open)} className="px-3 py-2 text-xs rounded-md bg-surface border border-border hover:border-primary/40 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={() => toast.info("Opening source article...")} className="px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 ml-auto">
                  <ExternalLink className="w-3.5 h-3.5" /> Read full
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
