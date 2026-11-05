"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { ApiError, api, errorMessage } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import type { Deposit, DepositInit, DepositLimit } from "@/lib/types";
import { Container } from "@/components/container";
import { WalletHeader } from "@/components/wallet-nav";
import { ErrorBox, RequireAuth, Spinner, StatusBadge } from "@/components/ui";

const QUICK = [1000, 2000, 5000, 10000, 20000, 50000];

function DepositForm() {
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limits = useQuery({ queryKey: ["limits"], queryFn: () => api<{ deposit: DepositLimit[] }>("/account/limits") });
  const history = useQuery({ queryKey: ["wallet", "deposits"], queryFn: () => api<Deposit[]>("/wallet/deposits", { query: { limit: 10 } }) });
  const activeLimits = limits.data?.deposit.filter((l) => l.limit !== null) ?? [];

  return (
    <Container>
      <WalletHeader />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card card-pad">
          <h2 className="text-lg font-bold">Deposit with Paystack</h2>
          <p className="mt-1 text-sm text-muted">Pay by card, bank transfer, USSD or bank app. Your wallet is credited as soon as Paystack confirms.</p>
          <form
            className="mt-6 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const init = await api<DepositInit>("/wallet/deposits", { method: "POST", body: { amount: Number(amount) } });
                window.location.assign(init.authorizationUrl);
              } catch (err) {
                setBusy(false);
                if (err instanceof ApiError && err.code === "DEPOSIT_LIMIT_EXCEEDED") setError(err.message);
                else if (err instanceof ApiError && err.code === "SELF_EXCLUDED") setError(err.message);
                else setError(errorMessage(err));
              }
            }}
          >
            <div>
              <label className="label" htmlFor="amount">Amount (₦)</label>
              <input
                id="amount"
                inputMode="numeric"
                className="input text-2xl font-bold tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              />
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => setAmount(String(q))} className="btn-secondary btn-sm" data-active={amount === String(q)}>
                    ₦{q.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-faint">Minimum deposit ₦100.</p>
            </div>
            {error && <ErrorBox message={error} />}
            <button className="btn-primary w-full py-3 text-base" disabled={busy || !(Number(amount) > 0)}>
              {busy ? <Spinner className="size-5 text-brand-ink" /> : <><Lock className="size-4" /> Pay {money(Number(amount) || 0)} securely</>}
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-faint">
              <span className="flex items-center gap-1"><ShieldCheck className="size-3.5" /> Secured by Paystack</span>
              <span className="flex items-center gap-1"><CreditCard className="size-3.5" /> Cards · Transfer · USSD</span>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className="card card-pad">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your deposit limits</h3>
              <Link href="/account/responsible-gambling" className="text-xs text-brand hover:underline">Manage</Link>
            </div>
            {activeLimits.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No limits set. Setting a limit helps you stay in control.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {activeLimits.map((l) => {
                  const pct = Math.min(100, (Number(l.used) / Number(l.limit)) * 100);
                  return (
                    <li key={l.period}>
                      <div className="flex justify-between text-sm"><span className="capitalize">{l.period}</span><span className="tabular-nums text-muted">{money(l.used)} / {money(l.limit)}</span></div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <h3 className="border-b border-line px-4 py-3 font-semibold">Recent deposits</h3>
            {history.isLoading && <div className="p-4"><Spinner /></div>}
            {history.data?.length === 0 && <p className="p-4 text-sm text-muted">No deposits yet.</p>}
            <ul className="divide-y divide-line/60">
              {history.data?.map((d) => (
                <li key={d.reference} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <div className="flex-1">
                    <p className="font-semibold tabular-nums">{money(d.amount)}</p>
                    <p className="text-xs text-faint">{dateTime(d.createdAt)}{d.channel ? ` · ${d.channel}` : ""}</p>
                  </div>
                  {d.status === "pending" ? (
                    <Link href={`/wallet/deposit/callback?reference=${d.reference}`} className="text-xs font-semibold text-brand hover:underline">Check status</Link>
                  ) : (
                    <StatusBadge status={d.status} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Container>
  );
}

export default function DepositPage() {
  return (
    <RequireAuth>
      <DepositForm />
    </RequireAuth>
  );
}
