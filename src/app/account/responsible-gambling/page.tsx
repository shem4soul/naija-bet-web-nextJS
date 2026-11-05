"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ShieldCheck, ShieldOff } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import type { DepositLimit } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { Container } from "@/components/container";
import { useToast } from "@/components/toast";
import { ErrorBox, Modal, PageHeader, PageLoader, RequireAuth, Spinner } from "@/components/ui";

const PERIODS = ["daily", "weekly", "monthly"] as const;
const EXCLUSIONS = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "3 months" },
  { days: 180, label: "6 months" },
  { days: 365, label: "1 year" },
  { days: 1825, label: "5 years" },
];

function LimitRow({ l }: { l: DepositLimit }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [value, setValue] = useState(l.limit ? String(Math.round(Number(l.limit))) : "");
  const save = useMutation({
    mutationFn: (amount: number | null) =>
      api<{ effect: "immediate" | "scheduled"; coolingOffHours: number }>("/account/limits/deposit", { method: "PUT", body: { period: l.period, amount } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["limits"] });
      toast(
        r.effect === "immediate"
          ? "Limit applied straight away."
          : `For your protection, this change takes effect after a ${r.coolingOffHours}-hour cooling-off period.`,
        r.effect === "immediate" ? "success" : "info",
      );
    },
    onError: (err) => toast(errorMessage(err), "error"),
  });
  const pct = l.limit ? Math.min(100, (Number(l.used) / Number(l.limit)) * 100) : 0;

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold capitalize">{l.period} limit</p>
        <p className="text-sm tabular-nums text-muted">{l.limit ? `${money(l.used)} of ${money(l.limit)} used` : `${money(l.used)} deposited · no limit`}</p>
      </div>
      {l.limit && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      )}
      {(l.pendingLimit || l.pendingRemoval) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-warn">
          <Clock className="size-3.5" />
          {l.pendingRemoval ? "Removal" : `Increase to ${money(l.pendingLimit)}`} scheduled for {dateTime(l.pendingEffectiveAt)}
        </p>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(value ? Number(value) : null);
        }}
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">₦</span>
          <input className="input pl-7 tabular-nums" inputMode="numeric" placeholder="No limit" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} />
        </div>
        <button className="btn-secondary" disabled={save.isPending}>{save.isPending ? <Spinner className="size-4" /> : value ? "Set limit" : "Remove"}</button>
      </form>
    </div>
  );
}

function SelfExclusion() {
  const { forget } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [confirming, setConfirming] = useState(false);
  const [agree, setAgree] = useState(false);
  const now = useNow(60_000);
  const exclude = useMutation({
    mutationFn: () => api<{ selfExclusionUntil: string }>("/account/self-exclusion", { method: "POST", body: { days, confirm: true } }),
    onSuccess: () => {
      // The API revokes every session after self-exclusion.
      forget();
      router.push("/login");
    },
  });
  const label = EXCLUSIONS.find((e) => e.days === days)?.label;

  return (
    <section className="card card-pad">
      <div className="flex items-start gap-3">
        <ShieldOff className="mt-0.5 size-5 text-danger" />
        <div>
          <h2 className="text-lg font-bold">Take a break (self-exclusion)</h2>
          <p className="mt-1 text-sm text-muted">
            Block yourself from betting, casino games and deposits for a set period. It <strong className="text-ink">can&apos;t be shortened or cancelled</strong> once
            started. You can still log in and withdraw your balance.
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EXCLUSIONS.map((e) => (
          <button key={e.days} type="button" onClick={() => setDays(e.days)} className="btn-secondary" data-active={days === e.days} style={days === e.days ? { borderColor: "var(--color-danger)" } : undefined}>
            {e.label}
          </button>
        ))}
      </div>
      <button className="btn-danger mt-5 w-full sm:w-auto" onClick={() => setConfirming(true)}>Self-exclude for {label}</button>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={`Self-exclude for ${label}?`}>
        <p className="text-sm text-muted">
          You won&apos;t be able to bet, play or deposit until {dateTime(new Date(now + days * 86_400_000).toISOString())}. You&apos;ll be signed out on every device.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-danger)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I understand this can&apos;t be undone early.
        </label>
        {exclude.error && <div className="mt-3"><ErrorBox message={errorMessage(exclude.error)} /></div>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
          <button className="btn btn-sm bg-danger py-2.5 text-white hover:bg-danger/90" disabled={!agree || exclude.isPending} onClick={() => exclude.mutate()}>
            {exclude.isPending ? <Spinner className="size-4 text-white" /> : "Confirm"}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function ResponsibleGambling() {
  const limits = useQuery({ queryKey: ["limits"], queryFn: () => api<{ deposit: DepositLimit[] }>("/account/limits") });
  const rows = PERIODS.map(
    (p) => limits.data?.deposit.find((l) => l.period === p) ?? { period: p, limit: null, used: "0.00", pendingLimit: null, pendingRemoval: false, pendingEffectiveAt: null },
  );

  return (
    <Container>
      <PageHeader title="Responsible gambling" subtitle="Tools to keep betting fun and in control." />
      <div className="space-y-6">
        <section className="card card-pad">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-brand" />
            <div>
              <h2 className="text-lg font-bold">Deposit limits</h2>
              <p className="mt-1 text-sm text-muted">Lowering a limit applies immediately. Raising or removing one waits 24 hours, giving you time to reconsider.</p>
            </div>
          </div>
          {limits.isLoading ? (
            <PageLoader />
          ) : limits.error ? (
            <div className="mt-4"><ErrorBox message={errorMessage(limits.error)} /></div>
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-3">{rows.map((l) => <LimitRow key={l.period} l={l} />)}</div>
          )}
        </section>
        <SelfExclusion />
        <section className="card card-pad text-sm text-muted">
          <h2 className="mb-2 text-base font-bold text-ink">Need to talk to someone?</h2>
          <p>If gambling is causing you or someone close to you problems, reach out to a professional support service or a trusted person. Signs to watch for include chasing losses, betting more than you planned, and borrowing to gamble.</p>
        </section>
      </div>
    </Container>
  );
}

export default function ResponsibleGamblingPage() {
  return (
    <RequireAuth>
      <ResponsibleGambling />
    </RequireAuth>
  );
}
