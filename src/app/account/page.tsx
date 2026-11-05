"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { Container } from "@/components/container";
import { useToast } from "@/components/toast";
import { Field, PageHeader, RequireAuth, Spinner, StatusBadge } from "@/components/ui";

function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  // RequireAuth guarantees the user is loaded before this renders.
  const [form, setForm] = useState(() => ({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "" }));
  const [busy, setBusy] = useState(false);

  return (
    <section className="card card-pad">
      <h2 className="text-lg font-bold">Personal details</h2>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const body: Record<string, string> = {};
            if (form.firstName.trim()) body.firstName = form.firstName.trim();
            if (form.lastName.trim()) body.lastName = form.lastName.trim();
            if (form.phone.trim()) body.phone = form.phone.replace(/\s/g, "");
            await api("/account/me", { method: "PATCH", body });
            await refreshUser();
            toast("Profile updated", "success");
          } catch (err) {
            toast(errorMessage(err), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Username"><input className="input" value={user?.username ?? ""} disabled /></Field>
        <Field label="Email"><input className="input" value={user?.email ?? ""} disabled /></Field>
        <Field label="First name"><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
        <Field label="Last name"><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
        <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <div className="flex items-end">
          <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? <Spinner className="size-4 text-brand-ink" /> : "Save changes"}</button>
        </div>
      </form>
    </section>
  );
}

function Security() {
  const { forget } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section className="card card-pad">
      <h2 className="text-lg font-bold">Password &amp; sessions</h2>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/account/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
            setCurrent("");
            setNext("");
            toast("Password changed. Other devices have been signed out.", "success");
          } catch (err) {
            toast(errorMessage(err), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Current password"><input className="input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password" hint="At least 8 characters with a letter and a number">
          <input className="input" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner className="size-4 text-brand-ink" /> : "Change password"}</button>
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              if (!confirm("Sign out of every device, including this one?")) return;
              try {
                await api("/auth/logout-all", { method: "POST" });
              } catch {
                /* clear locally anyway */
              }
              forget();
              router.push("/login");
            }}
          >
            <LogOut className="size-4" /> Sign out everywhere
          </button>
        </div>
      </form>
    </section>
  );
}

function AccountOverview() {
  const { user } = useAuth();
  if (!user) return null;
  const links = [
    { href: "/wallet", icon: Wallet, title: "Wallet", text: "Balance, deposits and withdrawals" },
    { href: "/bets", icon: Receipt, title: "My bets", text: "Open bets, cash-out and history" },
    { href: "/account/responsible-gambling", icon: ShieldCheck, title: "Responsible gambling", text: "Deposit limits and self-exclusion" },
  ];
  return (
    <Container>
      <PageHeader title={`Hi, ${user.firstName || user.username}`} subtitle={`Member since ${dateTime(user.createdAt)}`} />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <span className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">Account <StatusBadge status={user.status} /></span>
        <span className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">KYC <StatusBadge status={user.kycStatus} /></span>
        {user.selfExclusionUntil && new Date(user.selfExclusionUntil) > new Date() && (
          <span className="flex items-center gap-2 rounded-lg border border-warn/40 px-3 py-2 text-warn">Self-excluded until {dateTime(user.selfExclusionUntil)}</span>
        )}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="card group flex items-center gap-3 p-4 transition hover:border-brand/50">
            <l.icon className="size-5 text-brand" />
            <div className="flex-1">
              <p className="font-semibold">{l.title}</p>
              <p className="text-xs text-muted">{l.text}</p>
            </div>
            <ChevronRight className="size-4 text-faint transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
      <div className="space-y-6">
        <Profile />
        <Security />
      </div>
    </Container>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountOverview />
    </RequireAuth>
  );
}
