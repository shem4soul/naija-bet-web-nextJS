"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coins, Dices, ShieldCheck, Zap } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { FeaturedLeague } from "@/lib/types";
import { EventRow } from "@/components/event-row";
import { flag, useLeagues } from "@/components/league-nav";
import { Empty, ErrorBox } from "@/components/ui";

function Hero() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#063d24] via-surface to-surface p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-24 size-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative max-w-xl">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          <Zap className="size-3.5" /> Premier League · LaLiga · NPFL
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Back your team. <span className="text-brand">Cash out</span> on your terms.
        </h1>
        <p className="mt-3 text-muted">
          Singles and accumulators of up to 40 legs, live cash-out offers and shareable booking codes — with instant Paystack deposits.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link href="/wallet/deposit" className="btn-primary">
              Deposit with Paystack <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link href="/register" className="btn-primary">
              Create free account <ArrowRight className="size-4" />
            </Link>
          )}
          <Link href="/casino" className="btn-secondary">
            <Dices className="size-4" /> Play casino
          </Link>
        </div>
      </div>
      <div className="relative mt-8 grid gap-3 text-sm sm:grid-cols-3">
        {[
          { icon: Coins, t: "Fast payouts", d: "Withdraw straight to any Nigerian bank" },
          { icon: Zap, t: "Cash out", d: "Take a fair offer before the final whistle" },
          { icon: ShieldCheck, t: "Play safe", d: "Deposit limits & self-exclusion built in" },
        ].map((f) => (
          <div key={f.t} className="flex items-start gap-3 rounded-xl border border-line/70 bg-bg/40 p-3">
            <f.icon className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <p className="font-semibold">{f.t}</p>
              <p className="text-xs text-muted">{f.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeagueChips() {
  const { data } = useLeagues();
  if (!data?.length) return null;
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      {data.map((l) => (
        <Link key={l.id} href={`/leagues/${l.slug}`} className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
          <span>{flag(l.country_code)}</span> {l.short_name ?? l.name}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["featured"],
    queryFn: () => api<FeaturedLeague[]>("/sports/featured", { query: { perLeague: 6 }, auth: false }),
    refetchInterval: 30_000,
  });
  const { data: leagues } = useLeagues();

  return (
    <div className="space-y-6">
      <Hero />
      <LeagueChips />

      <h2 className="text-xl font-bold tracking-tight">Top matches</h2>

      {error && <ErrorBox message={errorMessage(error)} onRetry={() => refetch()} />}
      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-56 animate-pulse" />
          ))}
        </div>
      )}
      {data && data.every((b) => b.events.length === 0) && (
        <Empty title="No upcoming matches yet">New fixtures are added regularly — check back soon.</Empty>
      )}
      {data
        ?.filter((b) => b.events.length > 0)
        .map((board) => {
          const meta = leagues?.find((l) => l.slug === board.league.slug);
          return (
            <section key={board.league.slug} className="card overflow-hidden">
              <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-lg leading-none">{flag(meta?.country_code)}</span>
                  <h3 className="truncate font-semibold">{board.league.name}</h3>
                  {board.league.country && <span className="hidden text-xs text-faint sm:inline">{board.league.country}</span>}
                </div>
                <Link href={`/leagues/${board.league.slug}`} className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand hover:underline">
                  All matches <ArrowRight className="size-3.5" />
                </Link>
              </header>
              {board.events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </section>
          );
        })}

      <Link href="/casino" className="card group flex items-center gap-4 p-5 transition hover:border-brand/50">
        <div className="grid size-12 place-items-center rounded-xl bg-gold/15 text-gold">
          <Dices className="size-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Provably fair casino</p>
          <p className="text-sm text-muted">Dice, coin flip and classic slots — verify every round yourself.</p>
        </div>
        <ArrowRight className="size-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
      </Link>
    </div>
  );
}
