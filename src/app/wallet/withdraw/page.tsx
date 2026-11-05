"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import clsx from "clsx";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import type { Bank, BankAccount, Withdrawal } from "@/lib/types";
import { Container } from "@/components/container";
import { useToast } from "@/components/toast";
import { WalletHeader } from "@/components/wallet-nav";
import { ErrorBox, Field, Modal, RequireAuth, Spinner, StatusBadge } from "@/components/ui";

const STATUS_HELP: Record<string, string> = {
  pending_review: "Waiting for approval",
  approved: "Approved",
  processing: "Sending to your bank",
  success: "Paid",
  failed: "Failed — refunded",
  reversed: "Reversed — refunded",
  rejected: "Rejected — refunded",
};

function AddAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [filter, setFilter] = useState("");
  const banks = useQuery({ queryKey: ["banks"], queryFn: () => api<Bank[]>("/wallet/banks"), enabled: open, staleTime: 60 * 60_000 });
  const filtered = useMemo(
    () => (banks.data ?? []).filter((b) => b.name.toLowerCase().includes(filter.toLowerCase())),
    [banks.data, filter],
  );
  const add = useMutation({
    mutationFn: () => api<BankAccount>("/wallet/bank-accounts", { method: "POST", body: { bankCode, accountNumber } }),
    onSuccess: (a) => {
      toast(`Added ${a.accountName} · ${a.bankName}`, "success");
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      setAccountNumber("");
      setBankCode("");
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add a bank account">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <Field label="Bank">
          <input className="input mb-2" placeholder="Search banks" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <select className="input" required value={bankCode} onChange={(e) => setBankCode(e.target.value)} size={5}>
            {banks.isLoading && <option disabled>Loading banks…</option>}
            {filtered.map((b) => (
              <option key={`${b.code}-${b.slug}`} value={b.code}>{b.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Account number (NUBAN)" hint="10 digits. We confirm the account name with your bank.">
          <input
            className="input font-mono tracking-wider"
            inputMode="numeric"
            required
            pattern="\d{10}"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        {banks.error && <ErrorBox message={errorMessage(banks.error)} />}
        {add.error && (
          <ErrorBox
            message={
              add.error instanceof ApiError && add.error.code === "ACCOUNT_UNRESOLVED"
                ? "We couldn't verify that account number with the bank. Check it and try again."
                : errorMessage(add.error)
            }
          />
        )}
        <button className="btn-primary w-full" disabled={add.isPending || !bankCode || accountNumber.length !== 10}>
          {add.isPending ? <Spinner className="size-4 text-brand-ink" /> : "Verify & save account"}
        </button>
      </form>
    </Modal>
  );
}

function Withdraw() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);

  const accounts = useQuery({ queryKey: ["bank-accounts"], queryFn: () => api<BankAccount[]>("/wallet/bank-accounts") });
  const history = useQuery({ queryKey: ["wallet", "withdrawals"], queryFn: () => api<Withdrawal[]>("/wallet/withdrawals", { query: { limit: 20 } }) });
  const selected = accountId ?? accounts.data?.find((a) => a.isDefault)?.id ?? accounts.data?.[0]?.id ?? null;

  const remove = useMutation({
    mutationFn: (id: number) => api(`/wallet/bank-accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
    onError: (err) => toast(errorMessage(err), "error"),
  });

  const withdraw = useMutation({
    mutationFn: () => api<Withdrawal>("/wallet/withdrawals", { method: "POST", body: { amount: Number(amount), bankAccountId: selected } }),
    onSuccess: (w) => {
      setAmount("");
      refreshUser();
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast(
        w.status === "pending_review"
          ? `Withdrawal of ${money(w.amount)} is awaiting approval. The funds are held for you.`
          : `Withdrawal of ${money(w.amount)} is on its way to your bank.`,
        "success",
      );
    },
  });

  const kycOk = user?.kycStatus === "verified";

  return (
    <Container>
      <WalletHeader />
      {!kycOk && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warn" />
          <div>
            <p className="font-semibold text-warn">Verify your identity to withdraw</p>
            <p className="mt-1 text-muted">
              Your KYC status is <strong className="capitalize text-ink">{user?.kycStatus}</strong>. Withdrawals need a verified account — contact support to complete verification.
            </p>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-lg font-bold">Withdraw to bank</h2>
          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              withdraw.mutate();
            }}
          >
            <Field label="Amount (₦)" hint="Minimum ₦1,000. Large withdrawals are reviewed before they're sent.">
              <div className="relative">
                <input
                  className="input pr-16 text-xl font-bold tabular-nums"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-surface-3 px-2 py-1 text-xs font-semibold"
                  onClick={() => setAmount(String(Math.floor(Number(user?.wallet?.balance ?? 0))))}
                >
                  Max
                </button>
              </div>
            </Field>
            <div>
              <span className="label">To account</span>
              {accounts.isLoading && <Spinner />}
              {accounts.data?.length === 0 && <p className="text-sm text-muted">Add a bank account to withdraw.</p>}
              <div className="space-y-2">
                {accounts.data?.map((a) => (
                  <label
                    key={a.id}
                    className={clsx(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition",
                      selected === a.id ? "border-brand bg-brand/5" : "border-line hover:border-faint",
                    )}
                  >
                    <input type="radio" name="account" className="accent-[var(--color-brand)]" checked={selected === a.id} onChange={() => setAccountId(a.id)} />
                    <Building2 className="size-5 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.accountName}</p>
                      <p className="text-xs text-muted">{a.bankName} · {a.accountNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Remove ${a.bankName} ${a.accountNumber}?`)) remove.mutate(a.id);
                      }}
                      className="rounded p-1.5 text-faint hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove account"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </label>
                ))}
              </div>
              <button type="button" className="btn-ghost mt-2 w-full border border-dashed border-line" onClick={() => setAdding(true)}>
                <Plus className="size-4" /> Add bank account
              </button>
            </div>
            {withdraw.error && (
              <ErrorBox
                message={
                  withdraw.error instanceof ApiError && withdraw.error.code === "KYC_REQUIRED"
                    ? "Your identity must be verified before you can withdraw."
                    : errorMessage(withdraw.error)
                }
              />
            )}
            <button className="btn-primary w-full py-3" disabled={withdraw.isPending || !selected || !(Number(amount) > 0)}>
              {withdraw.isPending ? <Spinner className="size-5 text-brand-ink" /> : `Withdraw ${amount ? money(Number(amount)) : ""}`}
            </button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <h3 className="border-b border-line px-4 py-3 font-semibold">Withdrawal history</h3>
          {history.isLoading && <div className="p-4"><Spinner /></div>}
          {history.data?.length === 0 && <p className="p-4 text-sm text-muted">No withdrawals yet.</p>}
          <ul className="divide-y divide-line/60">
            {history.data?.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums">{money(w.amount)}</p>
                  <p className="truncate text-xs text-faint">{w.bankName} {w.accountNumber} · {dateTime(w.createdAt)}</p>
                  {w.failureReason && <p className="text-xs text-danger">{w.failureReason}</p>}
                </div>
                <div className="text-right">
                  <StatusBadge status={w.status} />
                  <p className="mt-1 text-[11px] text-faint">{STATUS_HELP[w.status]}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1.5 border-t border-line px-4 py-3 text-xs text-faint">
            <BadgeCheck className="size-3.5" /> Failed or reversed transfers are refunded to your wallet automatically.
          </p>
        </section>
      </div>
      <AddAccount open={adding} onClose={() => setAdding(false)} />
    </Container>
  );
}

export default function WithdrawPage() {
  return (
    <RequireAuth>
      <Withdraw />
    </RequireAuth>
  );
}
