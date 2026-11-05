"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { kickoff } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { OddsButton } from "./odds-button";
import { StatusBadge } from "./ui";

const ORDER = ["HOME", "DRAW", "AWAY"];
const LABELS: Record<string, string> = { HOME: "1", DRAW: "X", AWAY: "2" };

export function EventRow({ event, showLeague }: { event: EventSummary; showLeague?: boolean }) {
  const quotes = [...(event.main_odds ?? [])].sort((a, b) => ORDER.indexOf(a.selection) - ORDER.indexOf(b.selection));
  const now = useNow();
  const started = event.status !== "scheduled" || new Date(event.start_time).getTime() <= now;
  const hasScore = event.home_score !== null && event.away_score !== null;

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line/60 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:gap-4">
      <Link href={`/events/${event.id}`} className="group min-w-0">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted">
          {event.status === "scheduled" ? <span>{kickoff(event.start_time)}</span> : <StatusBadge status={event.status} />}
          {showLeague && <span className="truncate">· {event.league_name}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 space-y-0.5 font-medium">
            <p className="truncate">{event.home_team}</p>
            <p className="truncate">{event.away_team}</p>
          </div>
          {hasScore && (
            <div className="space-y-0.5 text-right font-bold tabular-nums">
              <p>{event.home_score}</p>
              <p>{event.away_score}</p>
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-3 gap-2 sm:w-56 sm:flex-none">
          {quotes.length === 3
            ? quotes.map((q) => (
                <OddsButton
                  key={q.oddsId}
                  label={LABELS[q.selection]}
                  disabled={started}
                  pick={{
                    oddsId: q.oddsId,
                    eventId: event.id,
                    home: event.home_team,
                    away: event.away_team,
                    league: event.league_name,
                    startTime: event.start_time,
                    marketType: "1X2",
                    line: null,
                    selection: q.selection,
                    price: q.price,
                  }}
                />
              ))
            : [0, 1, 2].map((i) => (
                <div key={i} className="odds-btn opacity-40" aria-hidden>
                  —
                </div>
              ))}
        </div>
        <Link
          href={`/events/${event.id}`}
          className="flex h-11 min-w-11 items-center justify-center rounded-lg px-1 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-ink"
          aria-label={`All ${event.open_markets} markets`}
        >
          +{Math.max(event.open_markets - 1, 0)}
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
