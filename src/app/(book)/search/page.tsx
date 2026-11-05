"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { EventSummary } from "@/lib/types";
import { EventRow } from "@/components/event-row";
import { Empty, ErrorBox, PageLoader } from "@/components/ui";

function Results() {
  const q = useSearchParams().get("q")?.trim() ?? "";
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", q],
    queryFn: () => api<EventSummary[]>("/sports/events", { query: { search: q, status: "upcoming", limit: 50 }, auth: false }),
    enabled: q.length > 0,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">
        {q ? <>Results for “{q}”</> : "Search"}
      </h1>
      {!q && <Empty title="Search for a team">Type a team name in the search box, e.g. Enyimba or Arsenal.</Empty>}
      {isLoading && <PageLoader />}
      {error && <ErrorBox message={errorMessage(error)} />}
      {data && data.length === 0 && (
        <Empty title="No upcoming matches found" icon={<SearchX className="size-8" />}>
          Check the spelling, or browse a league from the menu.
        </Empty>
      )}
      {data && data.length > 0 && (
        <section className="card overflow-hidden">
          {data.map((e) => (
            <EventRow key={e.id} event={e} showLeague />
          ))}
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Results />
    </Suspense>
  );
}
