"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";

const TABS = [
  { href: "/wallet", label: "Overview" },
  { href: "/wallet/deposit", label: "Deposit" },
  { href: "/wallet/withdraw", label: "Withdraw" },
];

export function WalletHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  return (
    <div className="mb-6 space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#063d24] to-surface p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand/20 blur-3xl" />
        <p className="relative text-xs uppercase tracking-wide text-muted">Available balance</p>
        <p className="relative mt-1 text-4xl font-bold tabular-nums tracking-tight">{money(user?.wallet?.balance ?? 0)}</p>
        <p className="relative mt-1 text-xs text-faint">Naira wallet · payments by Paystack</p>
      </div>
      <div className="flex gap-1">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="tab" data-active={pathname === t.href}>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
