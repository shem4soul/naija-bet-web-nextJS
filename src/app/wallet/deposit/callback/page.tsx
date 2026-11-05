"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import type { Deposit } from "@/lib/types";
import { Container } from "@/components/container";
import { RequireAuth, Spinner } from "@/components/ui";

/** Paystack redirects here with ?reference=… (PAYSTACK_CALLBACK_URL on the API). */
function Verify() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const { refreshUser } = useAuth();
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await api<Deposit>(`/wallet/deposits/${encodeURIComponent(reference)}/verify`, { method: "POST" });
        if (cancelled) return;
        setDeposit(d);
        if (d.status === "success") refreshUser();
        // Bank transfers can take a moment to confirm – keep checking for ~1 minute.
        if (d.status === "pending" && attempt < 12) timer.current = setTimeout(() => setAttempt((a) => a + 1), 5000);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reference, attempt, refreshUser]);

  const box = "card card-pad mx-auto max-w-md text-center sm:p-8";

  if (!reference) return <div className={box}><p>Missing payment reference.</p><Link href="/wallet/deposit" className="btn-primary mt-6 w-full">Back to deposit</Link></div>;
  if (error)
    return (
      <div className={box}>
        <XCircle className="mx-auto mb-3 size-12 text-danger" />
        <h1 className="text-xl font-bold">We couldn&apos;t confirm this payment</h1>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <button className="btn-secondary mt-6 w-full" onClick={() => { setError(null); setAttempt((a) => a + 1); }}>Try again</button>
      </div>
    );
  if (!deposit)
    return (
      <div className={box}>
        <Spinner className="mx-auto mb-3 size-10 text-brand" />
        <h1 className="text-xl font-bold">Confirming your payment…</h1>
        <p className="mt-2 text-sm text-muted">Checking with Paystack. This only takes a moment.</p>
      </div>
    );

  if (deposit.status === "success")
    return (
      <div className={box}>
        <CheckCircle2 className="mx-auto mb-3 size-12 text-brand animate-pop" />
        <h1 className="text-xl font-bold">{money(deposit.amount)} added to your wallet</h1>
        <p className="mt-2 text-sm text-muted">Your deposit was successful. Good luck!</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link href="/wallet" className="btn-secondary">View wallet</Link>
          <Link href="/" className="btn-primary">Start betting</Link>
        </div>
      </div>
    );

  if (deposit.status === "pending")
    return (
      <div className={box}>
        <Clock className="mx-auto mb-3 size-12 text-warn" />
        <h1 className="text-xl font-bold">Payment pending</h1>
        <p className="mt-2 text-sm text-muted">
          We haven&apos;t received confirmation from Paystack yet. If you paid by transfer it can take a few minutes — your wallet is credited automatically.
        </p>
        <div className="mt-6 grid gap-2">
          {deposit.authorizationUrl && <a href={deposit.authorizationUrl} className="btn-primary">Continue payment</a>}
          <Link href="/wallet" className="btn-secondary">Go to wallet</Link>
        </div>
      </div>
    );

  return (
    <div className={box}>
      <XCircle className="mx-auto mb-3 size-12 text-danger" />
      <h1 className="text-xl font-bold">Payment {deposit.status}</h1>
      <p className="mt-2 text-sm text-muted">No money was taken from your wallet. You can try again.</p>
      <Link href="/wallet/deposit" className="btn-primary mt-6 w-full">Try again</Link>
    </div>
  );
}

export default function DepositCallbackPage() {
  return (
    <RequireAuth>
      <Container>
        <Suspense>
          <Verify />
        </Suspense>
      </Container>
    </RequireAuth>
  );
}
