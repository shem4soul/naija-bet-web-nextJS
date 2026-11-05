"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { money } from "@/lib/format";
import type { SlotsResult } from "@/lib/types";
import { usePlay } from "@/lib/use-play";
import { GameShell, RecentRounds, StakeControl, useGame } from "@/components/casino";
import { Spinner } from "@/components/ui";

const SYMBOL: Record<string, string> = { CHERRY: "🍒", LEMON: "🍋", BELL: "🔔", STAR: "⭐", SEVEN: "7️⃣" };
const PAYTABLE = [
  { s: "SEVEN", x: 50 },
  { s: "STAR", x: 10 },
  { s: "BELL", x: 5 },
  { s: "LEMON", x: 3 },
  { s: "CHERRY", x: 2 },
];
const ALL = Object.keys(SYMBOL);

export default function SlotsPage() {
  const game = useGame("slots");
  const [stake, setStake] = useState("50");
  const { play, pending, last, rounds } = usePlay<{ stake: number }, SlotsResult>("/casino/slots/play", "/casino/slots");
  const [spinning, setSpinning] = useState<string[] | null>(null);

  // Cycle random symbols while the request is in flight.
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setSpinning([0, 1, 2].map(() => ALL[Math.floor(Math.random() * ALL.length)])), 80);
    return () => clearInterval(t);
  }, [pending]);

  const shown = pending ? spinning : null;
  const reels = shown ?? last?.reels ?? ["SEVEN", "SEVEN", "SEVEN"];

  return (
    <GameShell
      title="Classic Slots"
      game={game}
      side={
        <div className="space-y-4">
          <div className="card card-pad">
            <h3 className="mb-3 text-sm font-semibold">Pays (three in a row)</h3>
            <ul className="space-y-2 text-sm">
              {PAYTABLE.map((p) => (
                <li key={p.s} className="flex items-center justify-between">
                  <span className="text-lg tracking-widest">{SYMBOL[p.s].repeat(3)}</span>
                  <span className="font-semibold">{p.x}×</span>
                </li>
              ))}
            </ul>
          </div>
          <RecentRounds rounds={rounds} render={(r) => (r as SlotsResult).reels.map((s) => SYMBOL[s] ?? s).join(" ")} />
        </div>
      }
    >
      <div className="card card-pad space-y-6">
        <div className="rounded-2xl border-4 border-gold/40 bg-gradient-to-b from-[#1b0c12] to-bg p-4 shadow-[inset_0_0_40px_rgba(0,0,0,.6)]">
          <div className="grid grid-cols-3 gap-3">
            {reels.map((s, i) => (
              <div key={i} className={clsx("grid aspect-square place-items-center rounded-xl bg-surface text-6xl sm:text-7xl", shown && "blur-[1px]")}>
                <span key={`${last?.roundId}-${i}-${s}`} className={clsx(!shown && "animate-pop")}>{SYMBOL[s] ?? s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className={clsx("min-h-6 text-center font-semibold", last?.won ? "text-brand" : "text-muted")}>
          {pending ? "Spinning…" : last ? (last.won ? `${last.multiplier}× — you won ${money(last.payout)}!` : "No match. Spin again?") : "Match three to win"}
        </p>
        <StakeControl value={stake} onChange={setStake} game={game} disabled={pending} />
        <button className="btn-primary w-full py-3 text-base" disabled={pending || !(Number(stake) > 0)} onClick={() => play({ stake: Number(stake) })}>
          {pending ? <Spinner className="size-5 text-brand-ink" /> : `Spin for ${money(Number(stake) || 0)}`}
        </button>
      </div>
    </GameShell>
  );
}
