"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, CircleUser, Dices, Home, LogOut, Receipt, Search, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBetSlip } from "@/lib/betslip";
import { money } from "@/lib/format";
import { Logo } from "./ui";

const NAV = [
  { href: "/", label: "Sports", match: (p: string) => p === "/" || p.startsWith("/leagues") || p.startsWith("/events") || p.startsWith("/search") },
  { href: "/casino", label: "Casino", match: (p: string) => p.startsWith("/casino") },
  { href: "/bets", label: "My Bets", match: (p: string) => p.startsWith("/bets") },
];

function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className={clsx("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search teams"
        className="input h-10 py-0 pl-9"
        aria-label="Search teams"
      />
    </form>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;
  const items = [
    { href: "/account", label: "My account", icon: CircleUser },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/bets", label: "My bets", icon: Receipt },
    { href: "/account/responsible-gambling", label: "Responsible gambling", icon: ShieldCheck },
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost px-2" aria-expanded={open} aria-haspopup="menu">
        <span className="grid size-8 place-items-center rounded-full bg-surface-3 text-sm font-bold uppercase text-ink">
          {user.username.slice(0, 1)}
        </span>
        <ChevronDown className="hidden size-4 sm:block" />
      </button>
      {open && (
        <div className="card absolute right-0 top-12 z-50 w-60 overflow-hidden p-1 shadow-2xl" role="menu">
          <div className="border-b border-line px-3 py-2.5">
            <p className="font-semibold">{user.username}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink"
              role="menuitem"
            >
              <i.icon className="size-4" /> {i.label}
            </Link>
          ))}
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
            role="menuitem"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-4">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="tab" data-active={n.match(pathname)}>
              {n.label}
            </Link>
          ))}
        </nav>
        <SearchBox className="ml-auto hidden w-64 lg:block" />
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {loading ? (
            <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-2" />
          ) : user ? (
            <>
              <Link href="/wallet" className="hidden rounded-lg border border-line px-3 py-2 text-right sm:block">
                <span className="block text-[10px] uppercase tracking-wide text-muted">Balance</span>
                <span className="block text-sm font-bold tabular-nums">{money(user.wallet?.balance ?? 0)}</span>
              </Link>
              <Link href="/wallet/deposit" className="btn-primary whitespace-nowrap px-3 sm:px-4">
                Deposit
              </Link>
              <AccountMenu />
            </>
          ) : (
            <>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-ghost whitespace-nowrap px-3">
                Log in
              </Link>
              <Link href="/register" className="btn-primary whitespace-nowrap px-3 sm:px-4">
                Join now
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-line px-4 py-2 lg:hidden">
        <SearchBox />
      </div>
    </header>
  );
}

/** Bottom tab bar on phones. */
export function MobileNav() {
  const pathname = usePathname();
  const { selections, setOpen } = useBetSlip();
  const tabs = [
    { href: "/", label: "Sports", icon: Home, active: NAV[0].match(pathname) },
    { href: "/casino", label: "Casino", icon: Dices, active: pathname.startsWith("/casino") },
    { href: "/bets", label: "My Bets", icon: Receipt, active: pathname.startsWith("/bets") },
    { href: "/account", label: "Account", icon: CircleUser, active: pathname.startsWith("/account") || pathname.startsWith("/wallet") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Mobile">
      <div className="grid grid-cols-5">
        {tabs.slice(0, 2).map((t) => (
          <Link key={t.href} href={t.href} className={clsx("flex flex-col items-center gap-1 py-2 text-[11px]", t.active ? "text-brand" : "text-muted")}>
            <t.icon className="size-5" />
            {t.label}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted">
          <span className="relative">
            <Ticket className="size-5" />
            {selections.length > 0 && (
              <span className="absolute -right-2.5 -top-2 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-ink">
                {selections.length}
              </span>
            )}
          </span>
          Bet slip
        </button>
        {tabs.slice(2).map((t) => (
          <Link key={t.href} href={t.href} className={clsx("flex flex-col items-center gap-1 py-2 text-[11px]", t.active ? "text-brand" : "text-muted")}>
            <t.icon className="size-5" />
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
