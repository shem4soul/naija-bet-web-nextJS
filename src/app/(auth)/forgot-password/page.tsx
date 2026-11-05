"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Field, Spinner } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent)
    return (
      <div className="card card-pad text-center sm:p-8">
        <MailCheck className="mx-auto mb-3 size-10 text-brand" />
        <h1 className="text-xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted">If an account exists for {email}, we&apos;ve sent a link to reset your password. It expires shortly, so use it soon.</p>
        <Link href="/login" className="btn-secondary mt-6 w-full">Back to log in</Link>
      </div>
    );

  return (
    <div className="card card-pad sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">Enter your account email and we&apos;ll send you a reset link.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api("/auth/forgot-password", { method: "POST", body: { email: email.trim() }, auth: false });
            setSent(true);
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="size-5 text-brand-ink" /> : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Remembered it? <Link href="/login" className="font-semibold text-brand hover:underline">Log in</Link>
      </p>
    </div>
  );
}
