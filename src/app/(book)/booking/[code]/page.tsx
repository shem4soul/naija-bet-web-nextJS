"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Ticket, XCircle } from "lucide-react";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useBetSlip } from "@/lib/betslip";
import { dateTime, kickoff, odds } from "@/lib/format";
import { marketName, selectionLabel, teamsFromMatch } from "@/lib/markets";
import type { BookingCodeDetail } from "@/lib/types";
import { Empty, ErrorBox, PageLoader } from "@/components/ui";

export default function BookingCodePage() {
  const { code } = useParams<{ code: string }>();
  const { load } = useBetSlip();
  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", code],
    queryFn: () => api<BookingCodeDetail>(`/sports/booking-codes/${encodeURIComponent(code.toUpperCase())}`, { auth: false }),
  });

  if (isLoading) return <PageLoader />;
  if (error)
    return error instanceof ApiError && error.status === 404 ? (
      <Empty title="Booking code not found" icon={<Ticket className="size-8" />}>The code may be wrong or have expired.</Empty>
    ) : (
      <ErrorBox message={errorMessage(error)} />
    );
  if (!data) return null;

  const available = data.selections.filter((s) => s.available);

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div className="grid size-12 place-items-center rounded-xl bg-brand/15 text-brand">
          <Ticket className="size-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted">Booking code</p>
          <p className="font-mono text-2xl font-bold tracking-widest">{data.code}</p>
          <p className="text-xs text-faint">Expires {dateTime(data.expiresAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Total odds</p>
          <p className="text-2xl font-bold">{odds(data.totalOdds)}</p>
        </div>
      </div>

      <section className="card divide-y divide-line/60 overflow-hidden">
        {data.selections.map((s) => {
          const t = teamsFromMatch(s.match);
          return (
            <div key={s.oddsId} className="flex items-center gap-3 px-4 py-3">
              {s.available ? <CheckCircle2 className="size-5 shrink-0 text-brand" /> : <XCircle className="size-5 shrink-0 text-danger" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{selectionLabel(s.marketType, s.selection, s.line, t)}</p>
                <p className="truncate text-xs text-muted">
                  {marketName(s.marketType, s.line)} · {s.match} · {kickoff(s.startTime)}
                </p>
              </div>
              <p className="font-bold tabular-nums">{odds(s.price)}</p>
            </div>
          );
        })}
      </section>

      {available.length < data.selections.length && (
        <p className="text-sm text-warn">
          {data.selections.length - available.length} selection(s) have kicked off or been suspended and will be left out.
        </p>
      )}

      <button
        className="btn-primary w-full py-3"
        disabled={available.length === 0}
        onClick={() =>
          load(
            available.map((s) => {
              const t = teamsFromMatch(s.match);
              return {
                oddsId: s.oddsId,
                eventId: s.eventId,
                home: t.home,
                away: t.away,
                league: "",
                startTime: s.startTime,
                marketType: s.marketType,
                line: s.line,
                selection: s.selection,
                price: s.price,
              };
            }),
            data.code,
          )
        }
      >
        Load {available.length} selection{available.length === 1 ? "" : "s"} into bet slip
      </button>
    </div>
  );
}
