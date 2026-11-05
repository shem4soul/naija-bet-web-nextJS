"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Field, Spinner } from "@/components/ui";

function maxDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function ageOf(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/wallet/deposit";
  const [form, setForm] = useState({ username: "", email: "", phone: "", firstName: "", lastName: "", dateOfBirth: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pwOk = form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /\d/.test(form.password);

  return (
    <div className="card card-pad sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted">It takes a minute. You must be 18 or older to bet.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!form.dateOfBirth || ageOf(form.dateOfBirth) < 18) return setError("You must be at least 18 years old to open an account.");
          if (!pwOk) return setError("Password needs at least 8 characters, including a letter and a number.");
          setBusy(true);
          try {
            await register({
              username: form.username.trim(),
              email: form.email.trim(),
              password: form.password,
              dateOfBirth: form.dateOfBirth,
              ...(form.phone.trim() ? { phone: form.phone.replace(/\s/g, "") } : {}),
              ...(form.firstName.trim() ? { firstName: form.firstName.trim() } : {}),
              ...(form.lastName.trim() ? { lastName: form.lastName.trim() } : {}),
            });
            router.replace(next);
          } catch (err) {
            setError(
              err instanceof ApiError && err.code === "ACCOUNT_EXISTS"
                ? "That username, email or phone number is already registered."
                : errorMessage(err),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input className="input" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
          </Field>
          <Field label="Last name">
            <input className="input" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
          </Field>
        </div>
        <Field label="Username" hint="3–32 letters, numbers or underscores">
          <input className="input" autoComplete="username" required pattern="[A-Za-z0-9_]{3,32}" value={form.username} onChange={set("username")} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Phone (optional)" hint="e.g. +2348012345678">
          <input className="input" type="tel" autoComplete="tel" pattern="\+?[0-9 ]{10,18}" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Date of birth">
          <input className="input" type="date" required max={maxDob()} value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        </Field>
        <Field label="Password" hint="At least 8 characters with a letter and a number">
          <input className="input" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set("password")} />
        </Field>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-brand)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          <span>I confirm I am 18 or older and accept the terms and the responsible gambling policy.</span>
        </label>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy || !agree}>
          {busy ? <Spinner className="size-5 text-brand-ink" /> : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Log in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
