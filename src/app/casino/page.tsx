"use client";

import Link from "next/link";
import { ArrowRight, Circle, Cherry, Dices, ShieldCheck } from "lucide-react";
import { money } from "@/lib/format";
import { useGames } from "@/components/casino";
import { ErrorBox, PageLoader } from "@/components/ui";

const META = {
  dice: { href: "/casino/dice", icon: Dices, blurb: "Pick a target and roll over or under. You choose the odds.", tint: "from-[#063d24]" },
  coinflip: { href: "/casino/coinflip", icon: Circle, blurb: "Heads or tails — call it right and double up.", tint: "from-[#3a2c05]" },
  slots: { href: "/casino/slots", icon: Cherry, blurb: "Three reels, five symbols. Line up three sevens for 50×.", tint: "from-[#3d0b1b]" },
} as const;

export default function CasinoLobby() {
  const { data, isLoading, error } = useGames();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Casino</h1>
          <p className="mt-1 text-muted">Instant games with results you can verify yourself.</p>
        </div>
        <Link href="/casino/fairness" className="btn-secondary"><ShieldCheck className="size-4" /> How provably fair works</Link>
      </div>
      {isLoading && <PageLoader />}
      {error && <ErrorBox message="Couldn't load games." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((g) => {
          const m = META[g.type];
          return (
            <Link key={g.slug} href={m.href} className={`group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br ${m.tint} to-surface p-6 transition hover:border-brand/50`}>
              <m.icon className="mb-10 size-12 text-ink/90 transition group-hover:scale-110" strokeWidth={1.5} />
              <h2 className="text-xl font-bold">{g.name}</h2>
              <p className="mt-1 text-sm text-muted">{m.blurb}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-faint">
                <span>RTP {Number(g.rtp_percent).toFixed(0)}% · from {money(g.min_bet)}</span>
                <span className="flex items-center gap-1 font-semibold text-brand">Play <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
