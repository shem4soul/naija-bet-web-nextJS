"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarX2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { EventSummary, League } from "@/lib/types";
import { EventRow } from "@/components/event-row";
import { flag } from "@/components/league-nav";
import { Empty, ErrorBox, PageLoader, Spinner } from "@/components/ui";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Results" },
] as const;
const PAGE = 20;

export default function LeaguePage() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<(typeof TABS)[number]["id"]>("upcoming");

  const league = useQuery({
    queryKey: ["league", slug],
    queryFn: () => api<League>(`/sports/leagues/${slug}`, { auth: false }),
  });

  const events = useInfiniteQuery({
    queryKey: ["league-events", slug, status],
    queryFn: ({ pageParam }) =>
      api<EventSummary[]>(`/sports/leagues/${slug}/events`, { query: { status, limit: PAGE, offset: pageParam }, auth: false }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length * PAGE : undefined),
    refetchInterval: status === "finished" ? false : 30_000,
  });

  if (league.isLoading) return <PageLoader />;
  if (league.error) return <ErrorBox message={errorMessage(league.error)} />;
  const l = league.data!;
  const rows = events.data?.pages.flat() ?? [];

  return (
    <div className="space-y-5">
      <div className="card flex items-center gap-4 p-5">
        <span className="grid size-14 place-items-center rounded-xl bg-surface-3 text-3xl">{flag(l.country_code)}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{l.name}</h1>
          <p className="text-sm text-muted">
            {l.country ?? "International"} · {l.upcoming_events} upcoming {l.upcoming_events === 1 ? "match" : "matches"}
          </p>
        </div>
      </div>

      <div className="flex gap-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={status === t.id} className="tab" data-active={status === t.id} onClick={() => setStatus(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <section className="card overflow-hidden">
        {events.isLoading && <PageLoader />}
        {events.error && <div className="p-4"><ErrorBox message={errorMessage(events.error)} onRetry={() => events.refetch()} /></div>}
        {!events.isLoading && rows.length === 0 && !events.error && (
          <div className="p-4">
            <Empty title={status === "live" ? "No live matches right now" : status === "finished" ? "No results yet" : "No upcoming matches"} icon={<CalendarX2 className="size-8" />} />
          </div>
        )}
        {rows.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </section>
      {events.hasNextPage && (
        <button className="btn-secondary w-full" onClick={() => events.fetchNextPage()} disabled={events.isFetchingNextPage}>
          {events.isFetchingNextPage ? <Spinner className="size-4" /> : "Load more"}
        </button>
      )}
    </div>
  );
}
