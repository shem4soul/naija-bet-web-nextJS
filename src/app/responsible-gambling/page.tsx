import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/container";

export const metadata: Metadata = { title: "Responsible gambling" };

const TIPS = [
  { t: "Set a budget", d: "Decide what you can afford to lose before you start, and stick to it. Use deposit limits to make it automatic." },
  { t: "Never chase losses", d: "Losses are part of betting. Trying to win them back usually leads to bigger losses." },
  { t: "Take regular breaks", d: "Step away and do something else. If you need longer, use self-exclusion." },
  { t: "Don't bet under pressure", d: "Avoid betting when you're stressed, upset, or have been drinking." },
  { t: "It's entertainment, not income", d: "Treat betting as paid entertainment, never as a way to make money or pay bills." },
];

export default function ResponsibleGamblingInfo() {
  return (
    <Container>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="mb-3 inline-grid size-12 place-items-center rounded-full border-2 border-danger text-sm font-bold text-danger">18+</p>
          <h1 className="text-3xl font-bold tracking-tight">Responsible gambling</h1>
          <p className="mt-2 text-muted">
            We want betting to stay fun. Betting is only for people aged 18 and over, and we provide tools to help you stay in control.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPS.map((x) => (
            <div key={x.t} className="card card-pad">
              <p className="font-semibold">{x.t}</p>
              <p className="mt-1 text-sm text-muted">{x.d}</p>
            </div>
          ))}
        </div>
        <div className="card card-pad">
          <h2 className="text-lg font-bold">Your tools</h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted">
            <li><strong className="text-ink">Deposit limits</strong> — daily, weekly and monthly caps. Increases wait 24 hours.</li>
            <li><strong className="text-ink">Self-exclusion</strong> — block betting and deposits for 24 hours up to 5 years. It can&apos;t be lifted early.</li>
            <li><strong className="text-ink">Transaction history</strong> — see every deposit, stake and win in your wallet.</li>
          </ul>
          <Link href="/account/responsible-gambling" className="btn-primary mt-5">Manage my limits</Link>
        </div>
      </div>
    </Container>
  );
}
