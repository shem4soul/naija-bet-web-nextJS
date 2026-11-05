"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Star, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import type { League } from "@/lib/types";

export function flag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function useLeagues() {
  return useQuery({
    queryKey: ["leagues"],
    queryFn: () => api<League[]>("/sports/leagues", { auth: false }),
    staleTime: 5 * 60_000,
  });
}

export function LeagueNav() {
  const pathname = usePathname();
  const { data, isLoading } = useLeagues();
  const featured = data?.filter((l) => l.is_featured) ?? [];
  const others = data?.filter((l) => !l.is_featured) ?? [];

  const Item = ({ l }: { l: League }) => {
    const active = pathname === `/leagues/${l.slug}`;
    return (
      <Link
        href={`/leagues/${l.slug}`}
        className={clsx(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
          active ? "bg-surface-3 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        <span className="text-base leading-none">{flag(l.country_code)}</span>
        <span className="flex-1 truncate">{l.short_name ?? l.name}</span>
        {l.upcoming_events > 0 && <span className="text-xs tabular-nums text-faint">{l.upcoming_events}</span>}
      </Link>
    );
  };

  return (
    <nav className="space-y-5" aria-label="Leagues">
      <div>
        <p className="mb-2 flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-faint">
          <Star className="size-3.5" /> Top leagues
        </p>
        {isLoading && <div className="space-y-1 px-1">{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-surface-2" />)}</div>}
        {featured.map((l) => <Item key={l.id} l={l} />)}
      </div>
      {others.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-faint">
            <Trophy className="size-3.5" /> More football
          </p>
          {others.map((l) => <Item key={l.id} l={l} />)}
        </div>
      )}
    </nav>
  );
}
