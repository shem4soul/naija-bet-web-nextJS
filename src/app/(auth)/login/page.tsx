"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Field, Spinner } from "@/components/ui";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  return (
    <div className="card card-pad sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in with your email, username or phone number.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await login(identifier.trim(), password);
            router.replace(next);
          } catch (err) {
            setError(
              err instanceof ApiError && err.code === "INVALID_CREDENTIALS"
                ? "That login and password don't match."
                : errorMessage(err),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Email, username or phone">
          <input className="input" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input
              className="input pr-10"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-faint hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-brand hover:underline">Forgot password?</Link>
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="size-5 text-brand-ink" /> : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New here? <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
