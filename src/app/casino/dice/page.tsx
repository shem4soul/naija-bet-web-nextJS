"use client";

import { useState } from "react";
import clsx from "clsx";
import { floor2, money } from "@/lib/format";
import type { DiceResult } from "@/lib/types";
import { usePlay } from "@/lib/use-play";
import { GameShell, RecentRounds, StakeControl, useGame } from "@/components/casino";
import { Spinner } from "@/components/ui";

const EDGE = 0.02;

export default function DicePage() {
  const game = useGame("dice");
  const [stake, setStake] = useState("100");
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<"under" | "over">("under");
  const { play, pending, last, rounds } = usePlay<{ stake: number; target: number; direction: "under" | "over" }, DiceResult>("/casino/dice/play", "/casino/dice");

  const chance = direction === "under" ? target : 100 - target;
  const multiplier = Number(((100 / chance) * (1 - EDGE)).toFixed(4));
  const payout = floor2((Number(stake) || 0) * multiplier);

  return (
    <GameShell
      title="Dice"
      game={game}
      side={<RecentRounds rounds={rounds} render={(r) => { const d = r as DiceResult; return `Rolled ${d.roll.toFixed(2)} · ${d.direction} ${d.target}`; }} />}
    >
      <div className="card card-pad space-y-6">
        <div className="relative grid h-44 place-items-center overflow-hidden rounded-xl bg-bg">
          {last ? (
            <div key={last.roundId} className="text-center animate-pop">
              <p className={clsx("text-6xl font-bold tabular-nums", last.won ? "text-brand" : "text-danger")}>{last.roll.toFixed(2)}</p>
              <p className="mt-2 text-sm text-muted">{last.won ? `You won ${money(last.payout)}` : "No win this time"}</p>
            </div>
          ) : (
            <p className="text-muted">Set your target and roll</p>
          )}
        </div>

        <div>
          <div className="relative h-3 rounded-full" style={{
            background: direction === "under"
              ? `linear-gradient(to right, var(--color-brand) ${target}%, var(--color-danger) ${target}%)`
              : `linear-gradient(to right, var(--color-danger) ${target}%, var(--color-brand) ${target}%)`,
          }}>
            {last && <span className="absolute -top-1.5 size-6 -translate-x-1/2 rounded-full border-2 border-bg bg-ink shadow" style={{ left: `${last.roll}%` }} />}
          </div>
          <input type="range" min={2} max={98} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-3 w-full accent-[var(--color-brand)]" aria-label="Target" />
          <div className="flex justify-between text-xs text-faint"><span>0</span><span>50</span><span>100</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["under", "over"] as const).map((d) => (
            <button key={d} type="button" className="btn-secondary" onClick={() => setDirection(d)} style={direction === d ? { borderColor: "var(--color-brand)", color: "var(--color-brand)" } : undefined}>
              Roll {d} {target}
            </button>
          ))}
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">Win chance</dt><dd className="font-bold">{chance}%</dd></div>
          <div className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">Multiplier</dt><dd className="font-bold">{multiplier.toFixed(2)}×</dd></div>
          <div className="rounded-lg bg-surface-2 p-3"><dt className="text-xs text-muted">Payout</dt><dd className="font-bold text-brand">{money(payout)}</dd></div>
        </dl>

        <StakeControl value={stake} onChange={setStake} game={game} disabled={pending} />
        <button className="btn-primary w-full py-3 text-base" disabled={pending || !(Number(stake) > 0)} onClick={() => play({ stake: Number(stake), target, direction })}>
          {pending ? <Spinner className="size-5 text-brand-ink" /> : `Roll for ${money(Number(stake) || 0)}`}
        </button>
      </div>
    </GameShell>
  );
}
