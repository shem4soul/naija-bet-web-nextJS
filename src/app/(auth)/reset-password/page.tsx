"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ApiError, api, errorMessage } from "@/lib/api";
import { Field, Spinner } from "@/components/ui";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token)
    return (
      <div className="card card-pad text-center sm:p-8">
        <h1 className="text-xl font-bold">Invalid reset link</h1>
        <p className="mt-2 text-sm text-muted">This link is missing its token. Request a new one.</p>
        <Link href="/forgot-password" className="btn-primary mt-6 w-full">Request a new link</Link>
      </div>
    );

  if (done)
    return (
      <div className="card card-pad text-center sm:p-8">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-brand" />
        <h1 className="text-xl font-bold">Password updated</h1>
        <p className="mt-2 text-sm text-muted">For your security, all devices were signed out. Log in with your new password.</p>
        <Link href="/login" className="btn-primary mt-6 w-full">Log in</Link>
      </div>
    );

  return (
    <div className="card card-pad sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (password !== confirm) return setError("The passwords don't match.");
          setBusy(true);
          try {
            await api("/auth/reset-password", { method: "POST", body: { token, newPassword: password }, auth: false });
            setDone(true);
          } catch (err) {
            setError(err instanceof ApiError && err.code === "RESET_TOKEN_INVALID" ? "This link has expired or was already used." : errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="New password" hint="At least 8 characters with a letter and a number">
          <input className="input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password">
          <input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="size-5 text-brand-ink" /> : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
