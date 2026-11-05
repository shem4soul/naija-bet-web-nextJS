"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import type { Game, RoundResultBase } from "@/lib/types";

export function useGames() {
  return useQuery({ queryKey: ["games"], queryFn: () => api<Game[]>("/casino/games", { auth: false }), staleTime: 10 * 60_000 });
}

export function useGame(type: Game["type"]) {
  const { data } = useGames();
  return data?.find((g) => g.type === type);
}

export function GameShell({ title, game, children, side }: { title: string; game?: Game; children: React.ReactNode; side?: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/casino" className="mb-1 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ChevronLeft className="size-4" /> Casino
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {game && (
            <p className="text-xs text-faint">
              RTP {Number(game.rtp_percent).toFixed(0)}% · stake {money(game.min_bet)} – {money(game.max_bet)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="rounded-lg border border-line px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted">Balance</p>
              <p className="text-sm font-bold tabular-nums">{money(user.wallet?.balance ?? 0)}</p>
            </div>
          )}
          <Link href="/casino/fairness" className="btn-secondary btn-sm"><ShieldCheck className="size-3.5" /> Provably fair</Link>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>{children}</div>
        <aside>{side}</aside>
      </div>
    </div>
  );
}

export function StakeControl({ value, onChange, game, disabled }: { value: string; onChange: (v: string) => void; game?: Game; disabled?: boolean }) {
  const n = Number(value) || 0;
  const min = Number(game?.min_bet ?? 50);
  const max = Number(game?.max_bet ?? 100000);
  const clamp = (x: number) => String(Math.max(min, Math.min(max, Math.round(x))));
  return (
    <div>
      <label className="label" htmlFor="stake">Stake (₦)</label>
      <div className="flex gap-2">
        <input id="stake" className="input text-lg font-semibold tabular-nums" inputMode="numeric" disabled={disabled} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} />
        <button type="button" className="btn-secondary px-3" disabled={disabled} onClick={() => onChange(clamp(n / 2))}>½</button>
        <button type="button" className="btn-secondary px-3" disabled={disabled} onClick={() => onChange(clamp(n * 2))}>2×</button>
      </div>
    </div>
  );
}

export function RecentRounds({ rounds, render }: { rounds: RoundResultBase[]; render: (r: RoundResultBase) => React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <h3 className="border-b border-line px-4 py-3 text-sm font-semibold">This session</h3>
      {rounds.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">Your rounds will appear here.</p>
      ) : (
        <ul className="max-h-[420px] divide-y divide-line/60 overflow-y-auto">
          {rounds.map((r) => (
            <li key={r.roundId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-muted">{render(r)}</span>
              <span className={r.won ? "font-semibold text-brand" : "text-faint"}>{r.won ? `+${money(r.payout)}` : "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
