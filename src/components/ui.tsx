"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("flex items-center gap-2 font-bold tracking-tight", className)} aria-label="Naija Sportsbook home">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-ink shadow-[0_0_24px_-6px] shadow-brand">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V4l16 16V4" />
        </svg>
      </span>
      <span className="text-base leading-none sm:text-lg">
        Naija<span className="text-brand">Sportsbook</span>
      </span>
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("size-5 animate-spin text-muted", className)} />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-48 place-items-center">
      <Spinner className="size-7" />
    </div>
  );
}

export function Empty({ title, children, icon }: { title: string; children?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

const BADGE: Record<string, string> = {
  won: "bg-brand/15 text-brand",
  success: "bg-brand/15 text-brand",
  verified: "bg-brand/15 text-brand",
  active: "bg-brand/15 text-brand",
  open: "bg-brand/15 text-brand",
  win: "bg-brand/15 text-brand",
  lost: "bg-danger/15 text-danger",
  failed: "bg-danger/15 text-danger",
  rejected: "bg-danger/15 text-danger",
  loss: "bg-danger/15 text-danger",
  banned: "bg-danger/15 text-danger",
  pending: "bg-warn/15 text-warn",
  pending_review: "bg-warn/15 text-warn",
  processing: "bg-info/15 text-info",
  approved: "bg-info/15 text-info",
  live: "bg-danger/15 text-danger",
  cashed_out: "bg-gold/15 text-gold",
  void: "bg-surface-3 text-muted",
  reversed: "bg-surface-3 text-muted",
  abandoned: "bg-surface-3 text-muted",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        BADGE[status] ?? "bg-surface-3 text-muted",
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Sends logged-out visitors to /login and back afterwards. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <PageLoader />;
  return <>{children}</>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="card card-pad w-full max-w-md animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
