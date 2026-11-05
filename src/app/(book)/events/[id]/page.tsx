"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Lock } from "lucide-react";
import clsx from "clsx";
import { ApiError, api, errorMessage } from "@/lib/api";
import { dateTime, kickoff } from "@/lib/format";
import { MARKET_ORDER, marketName, selectionLabel } from "@/lib/markets";
import type { EventDetail, Market } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { OddsButton } from "@/components/odds-button";
import { Empty, ErrorBox, PageLoader, StatusBadge } from "@/components/ui";

const GROUPS = [
  { id: "all", label: "All markets", types: null },
  { id: "main", label: "Main", types: ["1X2", "DOUBLE_CHANCE", "DRAW_NO_BET", "BTTS"] },
  { id: "goals", label: "Goals", types: ["OVER_UNDER", "HOME_OVER_UNDER", "AWAY_OVER_UNDER", "ODD_EVEN", "BTTS"] },
  { id: "half", label: "Half-time", types: ["HT_1X2", "HT_FT"] },
  { id: "score", label: "Score & handicap", types: ["CORRECT_SCORE", "ASIAN_HANDICAP"] },
] as const;

function columnsFor(m: Market) {
  if (m.type === "CORRECT_SCORE" || m.type === "HT_FT") return "grid-cols-3";
  if (m.odds.length === 3) return "grid-cols-3";
  return "grid-cols-2";
}

function MarketCard({ m, e, closed }: { m: Market; e: EventDetail; closed: boolean }) {
  const teams = { home: e.home_team, away: e.away_team };
  const suspended = m.status !== "open";
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h3 className="text-sm font-semibold">{marketName(m.type, m.line, m.name)}</h3>
        {suspended && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Lock className="size-3" /> {m.status === "suspended" ? "Suspended" : m.status === "settled" ? "Settled" : "Void"}
          </span>
        )}
      </header>
      <div className={clsx("grid gap-2 p-3", columnsFor(m))}>
        {m.odds.map((o) => (
          <OddsButton
            key={o.oddsId}
            label={selectionLabel(m.type, o.selection, m.line, teams)}
            disabled={closed || suspended || !o.active}
            className={clsx(o.result === "won" && "ring-2 ring-brand")}
            pick={{
              oddsId: o.oddsId,
              eventId: e.id,
              home: e.home_team,
              away: e.away_team,
              league: e.league_name,
              startTime: e.start_time,
              marketType: m.type,
              line: m.line,
              selection: o.selection,
              price: o.price,
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<(typeof GROUPS)[number]["id"]>("all");
  const now = useNow();
  const { data: e, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: () => api<EventDetail>(`/sports/events/${id}`, { auth: false }),
    refetchInterval: 20_000,
  });

  const markets = useMemo(() => {
    if (!e) return [];
    const g = GROUPS.find((x) => x.id === group)!;
    return [...e.markets]
      .filter((m) => !g.types || (g.types as readonly string[]).includes(m.type))
      .sort((a, b) => {
        const ia = MARKET_ORDER.indexOf(a.type);
        const ib = MARKET_ORDER.indexOf(b.type);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || Number(a.line ?? 0) - Number(b.line ?? 0);
      });
  }, [e, group]);

  if (isLoading) return <PageLoader />;
  if (error)
    return error instanceof ApiError && error.status === 404 ? (
      <Empty title="Match not found">It may have been removed. <Link className="text-brand underline" href="/">Back to sports</Link></Empty>
    ) : (
      <ErrorBox message={errorMessage(error)} />
    );
  if (!e) return null;

  const closed = e.status !== "scheduled" || new Date(e.start_time).getTime() <= now;
  const hasScore = e.home_score !== null && e.away_score !== null;

  return (
    <div className="space-y-5">
      <Link href={`/leagues/${e.league_slug}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="size-4" /> {e.league_name}
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface-3 to-surface p-6 text-center">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted">
          {e.status === "scheduled" ? <span>{kickoff(e.start_time)}</span> : <StatusBadge status={e.status} />}
          <span>·</span>
          <span>{e.league_name}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <p className="text-lg font-bold sm:text-2xl">{e.home_team}</p>
          <div className="min-w-20 rounded-xl bg-bg/60 px-4 py-2 text-2xl font-bold tabular-nums sm:text-3xl">
            {hasScore ? `${e.home_score} – ${e.away_score}` : "vs"}
          </div>
          <p className="text-lg font-bold sm:text-2xl">{e.away_team}</p>
        </div>
        {e.ht_home_score !== null && e.ht_away_score !== null && (
          <p className="mt-3 text-xs text-muted">Half-time {e.ht_home_score} – {e.ht_away_score}</p>
        )}
        {closed && e.status === "scheduled" && (
          <p className="mt-4 text-sm text-warn">Kick-off has passed — betting is closed for this match.</p>
        )}
        {!closed && <p className="mt-4 text-xs text-faint">Kick-off {dateTime(e.start_time)} · pre-match betting only</p>}
      </div>

      <div className="-mx-4 flex gap-1 overflow-x-auto px-4" role="tablist">
        {GROUPS.map((g) => (
          <button key={g.id} role="tab" aria-selected={group === g.id} className="tab shrink-0" data-active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      {markets.length === 0 ? (
        <Empty title="No markets in this group" />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-2">
          {markets.map((m) => (
            <MarketCard key={m.id} m={m} e={e} closed={closed} />
          ))}
        </div>
      )}
    </div>
  );
}
