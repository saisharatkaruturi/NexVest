import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, PlayCircle, Award, BookOpen, Clock, CheckCircle2, ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/lib/market-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/learn")({
  component: Learn,
});

type Course = { id: string; t: string; lvl: "Beginner" | "Intermediate" | "Advanced"; lessons: number; mins: number; c: "profit" | "info" | "crypto" | "gold"; desc: string; modules: { t: string; lessons: { t: string; mins: number }[] }[]; started?: boolean; done?: number };

const COURSES: Course[] = [
  { id: "inv101", t: "Investing 101: Stocks Basics", lvl: "Beginner", lessons: 12, mins: 48, c: "profit", desc: "Learn the fundamentals of equity investing, market structure, and how to read stock quotes.", modules: [
    { t: "Getting started", lessons: [{ t: "What is a stock?", mins: 6 }, { t: "Stock exchanges explained", mins: 8 }, { t: "Reading a quote", mins: 5 }] },
    { t: "Analysis basics", lessons: [{ t: "Fundamental vs technical", mins: 9 }, { t: "P/E ratio & valuation", mins: 10 }] },
  ] },
  { id: "tech", t: "Master Technical Analysis", lvl: "Intermediate", lessons: 24, mins: 180, c: "info", desc: "Candlesticks, indicators, chart patterns and trend strategies used by professionals.", modules: [
    { t: "Chart types", lessons: [{ t: "Candlestick patterns", mins: 12 }, { t: "Support & resistance", mins: 9 }] },
    { t: "Indicators", lessons: [{ t: "RSI, MACD, Bollinger", mins: 15 }, { t: "Moving averages", mins: 10 }] },
  ] },
  { id: "options", t: "Options Trading Deep Dive", lvl: "Advanced", lessons: 18, mins: 220, c: "crypto", desc: "Greeks, payoff diagrams, spreads, straddles and risk-defined option strategies.", modules: [
    { t: "Foundations", lessons: [{ t: "Calls & puts", mins: 14 }, { t: "The Greeks", mins: 18 }] },
    { t: "Strategies", lessons: [{ t: "Vertical spreads", mins: 16 }, { t: "Iron condors", mins: 20 }] },
  ] },
  { id: "crypto", t: "Crypto Fundamentals", lvl: "Beginner", lessons: 10, mins: 60, c: "gold", desc: "Bitcoin, blockchain, wallets, exchanges and how to safely store digital assets.", modules: [
    { t: "Concepts", lessons: [{ t: "What is Bitcoin?", mins: 8 }, { t: "Blockchain 101", mins: 10 }] },
    { t: "Practical", lessons: [{ t: "Choosing a wallet", mins: 7 }, { t: "Buying your first coin", mins: 9 }] },
  ] },
  { id: "mf", t: "Mutual Funds Mastery", lvl: "Intermediate", lessons: 16, mins: 95, c: "profit", desc: "NAV, expense ratio, AUM, fund categories and building a SIP portfolio.", modules: [
    { t: "Concepts", lessons: [{ t: "What is a mutual fund?", mins: 8 }, { t: "NAV & expense ratio", mins: 9 }] },
    { t: "Strategy", lessons: [{ t: "Building a SIP", mins: 10 }, { t: "Tax implications", mins: 12 }] },
  ] },
  { id: "tax", t: "Tax & Portfolio Optimization", lvl: "Advanced", lessons: 14, mins: 110, c: "info", desc: "STCG, LTCG, harvesting losses and rebalancing for after-tax returns.", modules: [
    { t: "Tax basics", lessons: [{ t: "STCG vs LTCG", mins: 10 }, { t: "Harvesting losses", mins: 12 }] },
    { t: "Optimization", lessons: [{ t: "Rebalancing", mins: 11 }, { t: "Asset location", mins: 9 }] },
  ] },
];

function Learn() {
  const { state, startCourse, completeLesson } = useMarket();
  const [active, setActive] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState(0);

  const enriched = useMemo(() => COURSES.map((c) => {
    const s = state.courses.find((x) => x.id === c.id);
    return { ...c, started: !!s, done: s?.doneLessons || 0 };
  }), [state.courses]);

  const continueCourse = enriched.find((c) => c.started && c.done < c.lessons);

  const onStart = (c: Course) => {
    startCourse(c.id, c.t, c.lvl, c.lessons);
    toast.success(`Started "${c.t}"`, { description: `${c.lessons} lessons · ${c.mins} minutes` });
  };

  const onOpen = (c: Course) => {
    if (!c.started) onStart(c);
    const course = COURSES.find((x) => x.id === c.id)!;
    setActive(course);
    setCurrentLesson(enriched.find((e) => e.id === c.id)?.done || 0);
  };

  const onComplete = () => {
    if (!active) return;
    completeLesson(active.id);
    const totalLessons = active.modules.flatMap((m) => m.lessons).length;
    const next = currentLesson + 1;
    if (next >= totalLessons) {
      toast.success(`🎓 Course complete!`, { description: `You finished ${active.t}` });
      setActive(null);
    } else {
      setCurrentLesson(next);
      toast.success("Lesson complete", { description: `${next + 1} / ${totalLessons}` });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" /> Learn</h1>
          <p className="text-sm text-muted-foreground mt-1">{state.courses.length} courses in progress · Free certifications</p>
        </div>
        {continueCourse && (
          <button onClick={() => onOpen(continueCourse)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
            <PlayCircle className="w-4 h-4" /> Continue: {continueCourse.t}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[
          { i: PlayCircle, t: "Continue Learning", d: continueCourse ? `${continueCourse.t} · Lesson ${continueCourse.done + 1}` : "Pick a course to start", c: "info" },
          { i: Award, t: "Earn Certificates", d: `${state.courses.filter((c) => c.doneLessons >= c.totalLessons).length} certificates earned`, c: "gold" },
          { i: BookOpen, t: "Paper Trading", d: "Practice with ₹10L virtual money", c: "profit" },
        ].map((c) => (
          <div key={c.t} className="bg-gradient-card border border-border rounded-2xl p-5">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", `bg-${c.c}/10 border border-${c.c}/20`)}><c.i className={cn("w-5 h-5", `text-${c.c}`)} /></div>
            <div className="font-semibold">{c.t}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enriched.map((c) => {
          const pct = c.lessons > 0 ? (c.done / c.lessons) * 100 : 0;
          const completed = c.done >= c.lessons;
          return (
            <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition">
              <div className="h-32 bg-gradient-card relative">
                <div className={cn("absolute inset-0", `bg-${c.c}/10`)} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {completed ? <Trophy className="w-12 h-12 text-gold" /> : <PlayCircle className="w-12 h-12 text-white/80" />}
                </div>
                {c.started && (
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur text-[10px] px-2 py-1 rounded-full font-semibold">{c.done}/{c.lessons}</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", `bg-${c.c}/15 text-${c.c}`)}>{c.lvl}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{c.mins} min</span>
                  {completed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-semibold flex items-center gap-1"><Award className="w-3 h-3" /> Done</span>}
                </div>
                <div className="font-semibold leading-tight">{c.t}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.desc}</p>
                {c.started && (
                  <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-profit transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.lessons} lessons</span>
                  <button onClick={() => onOpen(c)} className="text-xs font-semibold text-primary hover:underline">
                    {c.started ? (completed ? "Review" : "Continue") : "Start course →"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (() => {
            const lessons = active.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, mod: m.t })));
            const cur = lessons[currentLesson] || lessons[0];
            const progress = currentLesson + 1;
            const total = lessons.length;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></button>
                    <span className="text-xs text-muted-foreground">{active.modules.find((m) => m.lessons.includes(cur))?.t}</span>
                  </div>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> {cur.t}
                  </DialogTitle>
                  <DialogDescription>Lesson {progress} of {total} · {cur.mins} min</DialogDescription>
                </DialogHeader>

                <div className="aspect-video bg-gradient-card border border-border rounded-xl flex items-center justify-center text-muted-foreground my-2">
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 mx-auto opacity-40" />
                    <p className="text-sm mt-2">Video player</p>
                  </div>
                </div>

                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-profit" style={{ width: `${(progress / total) * 100}%` }} />
                </div>

                <div className="text-sm leading-relaxed mt-3 text-foreground/90">
                  In this lesson you'll explore <strong>{cur.t.toLowerCase()}</strong>. You'll see practical examples and complete a short exercise at the end. Take your time and use the "Ask AI" button if you need clarification on any concept.
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">All lessons</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {lessons.map((l, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentLesson(i)}
                        className={cn("w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm", i === currentLesson ? "bg-primary/10 text-primary" : "hover:bg-surface text-muted-foreground")}
                      >
                        {i < progress ? <CheckCircle2 className="w-3.5 h-3.5 text-profit shrink-0" /> : <PlayCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span className="flex-1 truncate">{l.t}</span>
                        <span className="text-[10px]">{l.mins}m</span>
                      </button>
                    ))}
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setActive(null)}>Save & exit</Button>
                  <Button onClick={onComplete}><CheckCircle2 className="w-4 h-4" /> {progress >= total ? "Finish course" : "Mark complete & next"}</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
