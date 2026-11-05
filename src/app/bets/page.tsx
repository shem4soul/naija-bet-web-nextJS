"use client";

import Link from "next/link";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, CircleSlash, Receipt, XCircle } from "lucide-react";
import clsx from "clsx";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, kickoff, money, odds } from "@/lib/format";
import { marketName, selectionLabel, teamsFromMatch } from "@/lib/markets";
import type { BetSlip, BetStatus, CashoutQuote, CashoutResult } from "@/lib/types";
import { Container } from "@/components/container";
import { useToast } from "@/components/toast";
import { Empty, ErrorBox, Modal, PageHeader, PageLoader, RequireAuth, Spinner, StatusBadge } from "@/components/ui";

const FILTERS: { id: BetStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Open" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "cashed_out", label: "Cashed out" },
  { id: "void", label: "Void" },
];
const PAGE = 15;

function LegIcon({ result }: { result: string }) {
  if (result === "won") return <CheckCircle2 className="size-4 text-brand" />;
  if (result === "lost") return <XCircle className="size-4 text-danger" />;
  if (result === "void") return <CircleSlash className="size-4 text-muted" />;
  return <Circle className="size-4 text-faint" />;
}

function CashOut({ bet }: { bet: BetSlip }) {
  const [quote, setQuote] = useState<CashoutQuote | null>(null);
  const [checking, setChecking] = useState(false);
  const toast = useToast();
  const qc = useQueryClient();
  const { setBalance } = useAuth();

  const cash = useMutation({
    mutationFn: (expected: number) =>
      api<CashoutResult>(`/sports/bets/${bet.id}/cashout`, { method: "POST", body: { expectedAmount: expected } }),
    onSuccess: (r) => {
      setQuote(null);
      setBalance(r.balance);
      toast(`Cashed out ${money(r.cashedOut)}`, "success");
      qc.invalidateQueries({ queryKey: ["bets"] });
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.code === "CASHOUT_CHANGED") {
        toast("The cash-out offer changed. Here's the new amount.", "info");
        setQuote(await api<CashoutQuote>(`/sports/bets/${bet.id}/cashout`));
        return;
      }
      setQuote(null);
      toast(errorMessage(err), "error");
    },
  });

  return (
    <>
      <button
        className="btn-secondary btn-sm border-gold/40 text-gold hover:bg-gold/10"
        disabled={checking}
        onClick={async () => {
          setChecking(true);
          try {
            const q = await api<CashoutQuote>(`/sports/bets/${bet.id}/cashout`);
            if (!q.available) toast(q.reason ?? "Cash-out isn't available for this bet right now.", "info");
            else setQuote(q);
          } catch (err) {
            toast(errorMessage(err), "error");
          } finally {
            setChecking(false);
          }
        }}
      >
        {checking ? <Spinner className="size-3.5" /> : "Cash out"}
      </button>
      <Modal open={!!quote} onClose={() => setQuote(null)} title="Cash out this bet?">
        <p className="text-sm text-muted">You&apos;ll receive this amount now and the bet will close. This can&apos;t be undone.</p>
        <div className="my-5 rounded-xl bg-gold/10 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">Cash-out offer</p>
          <p className="text-3xl font-bold text-gold">{money(quote?.amount)}</p>
          <p className="mt-1 text-xs text-faint">Stake {money(bet.stake)} · potential win {money(bet.potentialPayout)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={() => setQuote(null)}>Keep bet</button>
          <button className="btn-primary" disabled={cash.isPending} onClick={() => quote?.amount && cash.mutate(Number(quote.amount))}>
            {cash.isPending ? <Spinner className="size-4 text-brand-ink" /> : "Confirm cash out"}
          </button>
        </div>
      </Modal>
    </>
  );
}

function BetCard({ bet }: { bet: BetSlip }) {
  const settled = bet.status !== "pending";
  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <StatusBadge status={bet.status} label={bet.status === "pending" ? "Open" : undefined} />
        <span className="text-sm font-semibold">{bet.betType === "single" ? "Single" : `${bet.selections.length}-fold accumulator`}</span>
        <span className="ml-auto text-xs text-faint">#{bet.id} · {dateTime(bet.createdAt)}</span>
      </header>
      <ul className="divide-y divide-line/50">
        {bet.selections.map((s) => {
          const t = teamsFromMatch(s.match);
          return (
            <li key={s.oddsId} className="flex items-center gap-3 px-4 py-2.5">
              <LegIcon result={s.result} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{selectionLabel(s.marketType, s.selection, s.line, t)}</p>
                <p className="truncate text-xs text-muted">
                  {marketName(s.marketType, s.line)} · <Link href={`/events/${s.eventId}`} className="hover:text-ink">{s.match}</Link> · {kickoff(s.startTime)}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{odds(s.price)}</span>
            </li>
          );
        })}
      </ul>
      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface-2/50 px-4 py-3 text-sm">
        <div><span className="text-muted">Stake </span><span className="font-semibold">{money(bet.stake)}</span></div>
        <div><span className="text-muted">Odds </span><span className="font-semibold">{odds(bet.totalOdds)}</span></div>
        <div>
          <span className="text-muted">{settled ? "Returned " : "To win "}</span>
          <span className={clsx("font-bold", (bet.status === "won" || bet.status === "cashed_out") && "text-brand")}>
            {money(settled ? (bet.payout ?? "0") : bet.potentialPayout)}
          </span>
        </div>
        {bet.bookingCode && <span className="font-mono text-xs text-faint">Code {bet.bookingCode}</span>}
        <div className="ml-auto">{bet.status === "pending" && <CashOut bet={bet} />}</div>
      </footer>
    </article>
  );
}

function BetsList() {
  const [filter, setFilter] = useState<BetStatus | "all">("all");
  const q = useInfiniteQuery({
    queryKey: ["bets", filter],
    queryFn: ({ pageParam }) =>
      api<BetSlip[]>("/sports/bets", { query: { status: filter === "all" ? undefined : filter, limit: PAGE, offset: pageParam } }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length * PAGE : undefined),
  });
  const bets = q.data?.pages.flat() ?? [];

  return (
    <Container>
      <PageHeader title="My bets" subtitle="Track open bets, cash out, and review your history." />
      <div className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className="tab shrink-0" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {q.isLoading && <PageLoader />}
      {q.error && <ErrorBox message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
      {!q.isLoading && bets.length === 0 && !q.error && (
        <Empty title="No bets here yet" icon={<Receipt className="size-8" />}>
          <Link href="/" className="text-brand underline">Browse matches</Link> and tap the odds to build a bet slip.
        </Empty>
      )}
      <div className="space-y-4">
        {bets.map((b) => (
          <BetCard key={b.id} bet={b} />
        ))}
      </div>
      {q.hasNextPage && (
        <button className="btn-secondary mt-4 w-full" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
          {q.isFetchingNextPage ? <Spinner className="size-4" /> : "Load more"}
        </button>
      )}
    </Container>
  );
}

export default function BetsPage() {
  return (
    <RequireAuth>
      <BetsList />
    </RequireAuth>
  );
}
