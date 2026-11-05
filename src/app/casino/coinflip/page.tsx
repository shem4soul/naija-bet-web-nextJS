"use client";

import { useState } from "react";
import clsx from "clsx";
import { money } from "@/lib/format";
import type { CoinflipResult } from "@/lib/types";
import { usePlay } from "@/lib/use-play";
import { GameShell, RecentRounds, StakeControl, useGame } from "@/components/casino";
import { Spinner } from "@/components/ui";

export default function CoinflipPage() {
  const game = useGame("coinflip");
  const [stake, setStake] = useState("100");
  const [call, setCall] = useState<"heads" | "tails">("heads");
  const { play, pending, last, rounds } = usePlay<{ stake: number; call: "heads" | "tails" }, CoinflipResult>("/casino/coinflip/play", "/casino/coinflip");
  const face = last?.result ?? call;

  return (
    <GameShell
      title="Coin Flip"
      game={game}
      side={<RecentRounds rounds={rounds} render={(r) => { const c = r as CoinflipResult; return `Called ${c.call} · landed ${c.result}`; }} />}
    >
      <div className="card card-pad space-y-6">
        <div className="grid h-60 place-items-center rounded-xl bg-bg [perspective:800px]">
          <div
            key={last?.roundId ?? "idle"}
            className={clsx(
              "grid size-36 place-items-center rounded-full border-4 text-4xl font-black shadow-2xl",
              last && "animate-flip",
              face === "heads" ? "border-gold/70 bg-gradient-to-br from-gold to-[#b8891c] text-[#3a2a00]" : "border-line bg-gradient-to-br from-[#d8e4de] to-[#7f948a] text-[#1d2a24]",
            )}
          >
            {face === "heads" ? "H" : "T"}
          </div>
        </div>
        {last && (
          <p className={clsx("text-center font-semibold animate-pop", last.won ? "text-brand" : "text-danger")}>
            {last.won ? `It's ${last.result}! You won ${money(last.payout)}` : `It's ${last.result}. Better luck next flip.`}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {(["heads", "tails"] as const).map((c) => (
            <button key={c} type="button" className="btn-secondary py-3 capitalize" onClick={() => setCall(c)} style={call === c ? { borderColor: "var(--color-brand)", color: "var(--color-brand)" } : undefined}>
              {c}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-muted">Win pays 1.96× your stake</p>
        <StakeControl value={stake} onChange={setStake} game={game} disabled={pending} />
        <button className="btn-primary w-full py-3 text-base" disabled={pending || !(Number(stake) > 0)} onClick={() => play({ stake: Number(stake), call })}>
          {pending ? <Spinner className="size-5 text-brand-ink" /> : `Flip for ${money(Number(stake) || 0)}`}
        </button>
      </div>
    </GameShell>
  );
}
