"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface SlipSelection {
  oddsId: number;
  eventId: number;
  home: string;
  away: string;
  league: string;
  startTime: string;
  marketType: string;
  line: string | null;
  selection: string;
  price: string;
  /** Set when the server reports the selection can no longer be backed. */
  unavailable?: boolean;
  /** Previous price, shown when the server reported a change. */
  previousPrice?: string;
}

export type AcceptOddsChanges = "none" | "higher" | "any";

interface BetSlipValue {
  selections: SlipSelection[];
  stake: string;
  acceptOddsChanges: AcceptOddsChanges;
  bookingCode: string | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  setStake: (v: string) => void;
  setAcceptOddsChanges: (v: AcceptOddsChanges) => void;
  /** Adds the selection, replaces another pick from the same match, or removes it if already picked. */
  toggle: (s: SlipSelection) => void;
  remove: (oddsId: number) => void;
  clear: () => void;
  isSelected: (oddsId: number) => boolean;
  load: (items: SlipSelection[], bookingCode?: string | null) => void;
  applyPriceChanges: (changes: { oddsId: number; current: string }[]) => void;
  markUnavailable: (oddsIds: number[]) => void;
  totalOdds: number;
}

const KEY = "nb.betslip.v1";
const BetSlipContext = createContext<BetSlipValue | null>(null);

interface Persisted {
  selections: SlipSelection[];
  stake: string;
  acceptOddsChanges: AcceptOddsChanges;
  bookingCode: string | null;
}

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<SlipSelection[]>([]);
  const [stake, setStake] = useState("1000");
  const [acceptOddsChanges, setAcceptOddsChanges] = useState<AcceptOddsChanges>("higher");
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved slip after hydration. Reading localStorage during render would make the
  // server-rendered HTML differ from the first client render, so this sync happens in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        // Drop picks whose match has already kicked off.
        setSelections((p.selections ?? []).filter((s) => new Date(s.startTime).getTime() > Date.now()));
        setStake(p.stake ?? "1000");
        setAcceptOddsChanges(p.acceptOddsChanges ?? "higher");
        setBookingCode(p.bookingCode ?? null);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      const p: Persisted = { selections, stake, acceptOddsChanges, bookingCode };
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* storage full or unavailable */
    }
  }, [hydrated, selections, stake, acceptOddsChanges, bookingCode]);

  const toggle = useCallback((s: SlipSelection) => {
    setSelections((prev) => {
      if (prev.some((p) => p.oddsId === s.oddsId)) return prev.filter((p) => p.oddsId !== s.oddsId);
      // One selection per match: replace any other pick from the same event.
      return [...prev.filter((p) => p.eventId !== s.eventId), s];
    });
  }, []);

  const remove = useCallback((oddsId: number) => setSelections((prev) => prev.filter((p) => p.oddsId !== oddsId)), []);

  const clear = useCallback(() => {
    setSelections([]);
    setBookingCode(null);
  }, []);

  const load = useCallback((items: SlipSelection[], code?: string | null) => {
    setSelections(items);
    setBookingCode(code ?? null);
    setOpen(true);
  }, []);

  const applyPriceChanges = useCallback((changes: { oddsId: number; current: string }[]) => {
    setSelections((prev) =>
      prev.map((s) => {
        const c = changes.find((x) => x.oddsId === s.oddsId);
        return c ? { ...s, previousPrice: s.price, price: c.current } : s;
      }),
    );
  }, []);

  const markUnavailable = useCallback((ids: number[]) => {
    setSelections((prev) => prev.map((s) => (ids.includes(s.oddsId) ? { ...s, unavailable: true } : s)));
  }, []);

  const isSelected = useCallback((oddsId: number) => selections.some((s) => s.oddsId === oddsId), [selections]);

  const totalOdds = useMemo(
    () => selections.filter((s) => !s.unavailable).reduce((acc, s) => acc * Number(s.price), 1),
    [selections],
  );

  const value: BetSlipValue = {
    selections,
    stake,
    acceptOddsChanges,
    bookingCode,
    open,
    setOpen,
    setStake,
    setAcceptOddsChanges,
    toggle,
    remove,
    clear,
    isSelected,
    load,
    applyPriceChanges,
    markUnavailable,
    totalOdds,
  };

  return <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>;
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error("useBetSlip must be used inside <BetSlipProvider>");
  return ctx;
}
