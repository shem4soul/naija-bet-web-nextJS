"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Copy, Share2, Ticket, Trash2, TriangleAlert, X } from "lucide-react";
import clsx from "clsx";
import { ApiError, api, errorMessage, newIdempotencyKey } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBetSlip, type AcceptOddsChanges, type SlipSelection } from "@/lib/betslip";
import { floor2, money, odds } from "@/lib/format";
import { marketName, selectionLabel, teamsFromMatch } from "@/lib/markets";
import type { BetSlip, BookingCodeDetail } from "@/lib/types";
import { useToast } from "./toast";
import { Spinner } from "./ui";

const QUICK_STAKES = [100, 500, 1000, 5000];

function SelectionCard({ s, onRemove }: { s: SlipSelection; onRemove: () => void }) {
  const teams = { home: s.home, away: s.away };
  const moved = s.previousPrice && s.previousPrice !== s.price;
  const up = moved && Number(s.price) > Number(s.previousPrice);
  return (
    <div className={clsx("rounded-lg border bg-surface-2 p-3", s.unavailable ? "border-danger/40" : "border-line")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{selectionLabel(s.marketType, s.selection, s.line, teams)}</p>
          <p className="mt-0.5 text-xs text-muted">{marketName(s.marketType, s.line)}</p>
          <p className="mt-1 truncate text-xs text-faint">
            {s.home} vs {s.away}
          </p>
        </div>
        <div className="text-right">
          <p className={clsx("font-bold tabular-nums", moved && (up ? "text-brand" : "text-warn"))}>
            {moved && (up ? <ArrowUp className="mr-0.5 inline size-3.5" /> : <ArrowDown className="mr-0.5 inline size-3.5" />)}
            {odds(s.price)}
          </p>
          {moved && <p className="text-[11px] text-faint line-through">{odds(s.previousPrice)}</p>}
        </div>
        <button onClick={onRemove} className="-mr-1 -mt-1 rounded p-1 text-faint hover:bg-surface-3 hover:text-ink" aria-label="Remove selection">
          <X className="size-4" />
        </button>
      </div>
      {s.unavailable && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
          <TriangleAlert className="size-3.5" /> No longer available — remove it to continue
        </p>
      )}
    </div>
  );
}

function LoadBookingCode() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { load } = useBetSlip();
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        setError(null);
        try {
          const b = await api<BookingCodeDetail>(`/sports/booking-codes/${encodeURIComponent(code.trim().toUpperCase())}`, { auth: false });
          const items = b.selections.filter((x) => x.available).map((x) => {
            const t = teamsFromMatch(x.match);
            return {
              oddsId: x.oddsId,
              eventId: x.eventId,
              home: t.home,
              away: t.away,
              league: "",
              startTime: x.startTime,
              marketType: x.marketType,
              line: x.line,
              selection: x.selection,
              price: x.price,
            };
          });
          if (!items.length) setError("Every selection on this code has started or been suspended.");
          else load(items, b.code);
        } catch (err) {
          setError(err instanceof ApiError && err.status === 404 ? "Booking code not found or expired." : errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label" htmlFor="booking-code">Have a booking code?</label>
      <div className="flex gap-2">
        <input
          id="booking-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. NB7K2QX"
          className="input font-mono uppercase"
          maxLength={16}
        />
        <button className="btn-secondary" disabled={busy || !code.trim()}>
          {busy ? <Spinner className="size-4" /> : "Load"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}

export function BetSlipPanel({ onClose }: { onClose?: () => void }) {
  const slip = useBetSlip();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [placed, setPlaced] = useState<BetSlip | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Idempotency key for the current slip; replaced whenever the picks or stake change.
  const idemKey = useRef<{ fp: string; key: string } | null>(null);

  const { selections, stake, setStake, totalOdds } = slip;
  const stakeNum = Number(stake);
  const hasUnavailable = selections.some((s) => s.unavailable);
  const potential = floor2(stakeNum * totalOdds);
  const balance = Number(user?.wallet?.balance ?? 0);

  // Changing the picks or stake starts a new slip: clear the old error (prices are excluded so an
  // ODDS_CHANGED update keeps its warning visible).
  const fingerprint = useMemo(() => `${selections.map((s) => s.oddsId).join(",")}|${stake}`, [selections, stake]);
  const [lastFingerprint, setLastFingerprint] = useState(fingerprint);
  if (fingerprint !== lastFingerprint) {
    setLastFingerprint(fingerprint);
    setError(null);
  }

  const place = useMutation({
    mutationFn: async () => {
      if (!idemKey.current || idemKey.current.fp !== fingerprint) idemKey.current = { fp: fingerprint, key: newIdempotencyKey() };
      return api<BetSlip>("/sports/bets", {
        method: "POST",
        headers: { "Idempotency-Key": idemKey.current.key },
        body: {
          stake: stakeNum,
          selections: selections.map((s) => ({ oddsId: s.oddsId, price: Number(s.price) })),
          acceptOddsChanges: slip.acceptOddsChanges,
          ...(slip.bookingCode ? { bookingCode: slip.bookingCode } : {}),
        },
      });
    },
    onSuccess: (bet) => {
      idemKey.current = null;
      setPlaced(bet);
      slip.clear();
      refreshUser();
      qc.invalidateQueries({ queryKey: ["bets"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast(`Bet placed — potential win ${money(bet.potentialPayout)}`, "success");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        // A definitive server answer means this key is spent; a network error keeps it for a safe retry.
        idemKey.current = null;
        if (err.code === "ODDS_CHANGED") {
          const changes = (err.details as { changes?: { oddsId: number; current: string }[] })?.changes ?? [];
          slip.applyPriceChanges(changes);
          setError({ code: err.code, message: "Odds have changed. Review the new prices and place your bet again." });
          return;
        }
        if (err.code === "SELECTIONS_UNAVAILABLE") {
          const ids = (err.details as { oddsIds?: number[] })?.oddsIds ?? [];
          slip.markUnavailable(ids);
        }
        setError({ code: err.code, message: errorMessage(err) });
        return;
      }
      setError({ message: errorMessage(err) });
    },
  });

  const book = useMutation({
    mutationFn: () =>
      api<{ code: string; selections: number }>("/sports/booking-codes", {
        method: "POST",
        body: { oddsIds: selections.filter((s) => !s.unavailable).map((s) => s.oddsId) },
      }),
    onSuccess: (r) => setBooked(r.code),
    onError: (err) => setError({ message: errorMessage(err) }),
  });

  if (placed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Bet placed</h2>
          {onClose && (
            <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="rounded-xl border border-brand/40 bg-brand/10 p-4 text-center animate-pop">
          <div className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-brand text-brand-ink">
            <Check className="size-6" />
          </div>
          <p className="font-semibold">Good luck!</p>
          <p className="text-sm text-muted">Bet #{placed.id} · {placed.selections.length === 1 ? "Single" : `${placed.selections.length}-fold accumulator`}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div><dt className="text-xs text-muted">Stake</dt><dd className="font-semibold">{money(placed.stake)}</dd></div>
            <div><dt className="text-xs text-muted">Odds</dt><dd className="font-semibold">{odds(placed.totalOdds)}</dd></div>
            <div><dt className="text-xs text-muted">To win</dt><dd className="font-semibold text-brand">{money(placed.potentialPayout)}</dd></div>
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/bets" onClick={onClose} className="btn-secondary">View my bets</Link>
          <button className="btn-primary" onClick={() => setPlaced(null)}>New bet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <Ticket className="size-5 text-brand" /> Bet slip
          {selections.length > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-ink">{selections.length}</span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          {selections.length > 0 && (
            <button onClick={slip.clear} className="btn-ghost btn-sm">
              <Trash2 className="size-3.5" /> Clear
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 text-muted hover:text-ink" aria-label="Close bet slip">
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {selections.length === 0 ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
            <Ticket className="mx-auto mb-2 size-8 text-faint" />
            <p className="font-semibold">Your bet slip is empty</p>
            <p className="mt-1 text-sm text-muted">Tap any odds to add a selection. Pick several matches for an accumulator.</p>
          </div>
          <LoadBookingCode />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold uppercase tracking-wide">{selections.length === 1 ? "Single" : `Accumulator · ${selections.length} legs`}</span>
            {slip.bookingCode && <span className="font-mono">Code {slip.bookingCode}</span>}
          </div>
          <div className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
            {selections.map((s) => (
              <SelectionCard key={s.oddsId} s={s} onRemove={() => slip.remove(s.oddsId)} />
            ))}
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <div>
              <label htmlFor="stake" className="label">Stake (₦)</label>
              <input
                id="stake"
                inputMode="decimal"
                className="input text-base font-semibold tabular-nums"
                value={stake}
                onChange={(e) => setStake(e.target.value.replace(/[^\d.]/g, ""))}
              />
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {QUICK_STAKES.map((q) => (
                  <button key={q} type="button" onClick={() => setStake(String(q))} className="btn-secondary btn-sm">
                    ₦{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 text-xs text-muted">
              <span>If odds change</span>
              <select
                value={slip.acceptOddsChanges}
                onChange={(e) => slip.setAcceptOddsChanges(e.target.value as AcceptOddsChanges)}
                className="rounded-md border border-line bg-bg px-2 py-1 text-xs text-ink"
              >
                <option value="higher">Accept higher odds</option>
                <option value="any">Accept any change</option>
                <option value="none">Ask me first</option>
              </select>
            </label>

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Total odds</dt><dd className="font-semibold tabular-nums">{totalOdds.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Potential win</dt><dd className="text-lg font-bold tabular-nums text-brand">{money(potential)}</dd></div>
            </dl>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error.message}
                {error.code === "INSUFFICIENT_FUNDS" && (
                  <Link href="/wallet/deposit" onClick={onClose} className="ml-1 font-semibold underline">Deposit now</Link>
                )}
              </div>
            )}

            {user ? (
              <button
                className="btn-primary w-full py-3 text-base"
                disabled={place.isPending || hasUnavailable || !(stakeNum > 0)}
                onClick={() => place.mutate()}
              >
                {place.isPending ? <Spinner className="size-5 text-brand-ink" /> : `Place bet · ${money(stakeNum || 0)}`}
              </button>
            ) : (
              <button
                className="btn-primary w-full py-3 text-base"
                onClick={() => {
                  onClose?.();
                  router.push(`/login?next=${encodeURIComponent(pathname)}`);
                }}
              >
                Log in to place bet
              </button>
            )}
            {user && stakeNum > balance && (
              <p className="text-center text-xs text-warn">
                Stake is more than your balance ({money(balance)}).{" "}
                <Link href="/wallet/deposit" onClick={onClose} className="underline">Deposit</Link>
              </p>
            )}

            {booked ? (
              <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">Booking code</p>
                  <p className="font-mono text-lg font-bold tracking-widest">{booked}</p>
                </div>
                <button
                  className="btn-secondary btn-sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(booked);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {
                      /* clipboard blocked */
                    }
                  }}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <button className="btn-ghost w-full" onClick={() => book.mutate()} disabled={book.isPending || hasUnavailable}>
                <Share2 className="size-4" /> {book.isPending ? "Creating code…" : "Share as booking code"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Full-screen bet slip on phones and tablets. */
export function BetSlipDrawer() {
  const { open, setOpen, selections } = useBetSlip();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {selections.length > 0 && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold text-brand-ink shadow-2xl shadow-brand/30 md:bottom-6 xl:hidden"
        >
          <Ticket className="size-5" /> Bet slip ({selections.length})
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Bet slip">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none sm:border-l sm:border-t-0">
            <BetSlipPanel onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
