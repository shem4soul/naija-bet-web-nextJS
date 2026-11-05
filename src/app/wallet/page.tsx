"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, ScrollText } from "lucide-react";
import clsx from "clsx";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";
import { Container } from "@/components/container";
import { WalletHeader } from "@/components/wallet-nav";
import { Empty, ErrorBox, PageLoader, RequireAuth, Spinner } from "@/components/ui";

const TYPE_LABEL: Record<TransactionType, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  withdrawal_reversal: "Withdrawal refund",
  bet_stake: "Bet placed",
  bet_payout: "Bet won",
  bet_void_refund: "Bet refund (void)",
  bet_cashout: "Cash out",
  game_stake: "Casino stake",
  game_payout: "Casino win",
  adjustment: "Adjustment",
};

const FILTERS: { id: TransactionType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "bet_stake", label: "Stakes" },
  { id: "bet_payout", label: "Winnings" },
  { id: "bet_cashout", label: "Cash outs" },
];
const PAGE = 25;

function Overview() {
  const { refreshUser } = useAuth();
  const [type, setType] = useState<TransactionType | "all">("all");
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const q = useInfiniteQuery({
    queryKey: ["wallet", "transactions", type],
    queryFn: ({ pageParam }) =>
      api<Transaction[]>("/wallet/transactions", { query: { type: type === "all" ? undefined : type, limit: PAGE, offset: pageParam } }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length * PAGE : undefined),
  });
  const rows = q.data?.pages.flat() ?? [];

  return (
    <Container>
      <WalletHeader />
      <section className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-semibold">Transactions</h2>
          <select value={type} onChange={(e) => setType(e.target.value as TransactionType | "all")} className="input h-9 w-auto py-0 text-xs">
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </header>
        {q.isLoading && <PageLoader />}
        {q.error && <div className="p-4"><ErrorBox message={errorMessage(q.error)} /></div>}
        {!q.isLoading && rows.length === 0 && !q.error && (
          <div className="p-4"><Empty title="No transactions yet" icon={<ScrollText className="size-8" />} /></div>
        )}
        <ul className="divide-y divide-line/60">
          {rows.map((t) => {
            const credit = Number(t.amount) > 0;
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className={clsx("grid size-9 shrink-0 place-items-center rounded-full", credit ? "bg-brand/15 text-brand" : "bg-surface-3 text-muted")}>
                  {credit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{TYPE_LABEL[t.type] ?? t.type}</p>
                  <p className="truncate text-xs text-faint">
                    {dateTime(t.created_at)}
                    {t.reference_type === "bet_slip" && t.reference_id ? ` · Bet #${t.reference_id}` : ""}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className={clsx("text-sm font-semibold tabular-nums", credit ? "text-brand" : "text-ink")}>
                    {credit ? "+" : "−"}{money(Math.abs(Number(t.amount)))}
                  </p>
                  <p className="text-xs tabular-nums text-faint">{money(t.balance_after)}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {q.hasNextPage && (
          <div className="border-t border-line p-3">
            <button className="btn-ghost w-full" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
              {q.isFetchingNextPage ? <Spinner className="size-4" /> : "Load more"}
            </button>
          </div>
        )}
      </section>
    </Container>
  );
}

export default function WalletPage() {
  return (
    <RequireAuth>
      <Overview />
    </RequireAuth>
  );
}
