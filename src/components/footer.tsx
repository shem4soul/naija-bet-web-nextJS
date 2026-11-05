import Link from "next/link";
import { Logo } from "./ui";

const LICENCE = process.env.NEXT_PUBLIC_LICENCE_TEXT;

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-surface/40 pb-24 md:pb-0">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted">Football betting on the Premier League, LaLiga, NPFL and more — with fast Paystack deposits and payouts.</p>
        </div>
        <div>
          <p className="label">Bet</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/leagues/premier-league">Premier League</Link></li>
            <li><Link className="hover:text-ink" href="/leagues/la-liga">LaLiga</Link></li>
            <li><Link className="hover:text-ink" href="/leagues/npfl">NPFL</Link></li>
            <li><Link className="hover:text-ink" href="/casino">Casino</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Account</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/wallet/deposit">Deposit</Link></li>
            <li><Link className="hover:text-ink" href="/wallet/withdraw">Withdraw</Link></li>
            <li><Link className="hover:text-ink" href="/bets">My bets</Link></li>
            <li><Link className="hover:text-ink" href="/casino/fairness">Provably fair</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Play responsibly</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/account/responsible-gambling">Deposit limits &amp; self-exclusion</Link></li>
            <li><Link className="hover:text-ink" href="/responsible-gambling">Responsible gambling</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-danger font-bold text-danger">18+</span>
          <p className="flex-1">
            Gambling can be addictive. Only bet what you can afford to lose. Betting is for people aged 18 and over.
            {LICENCE ? ` ${LICENCE}` : ""}
          </p>
          <p>© {new Date().getFullYear()} Naija Sportsbook</p>
        </div>
      </div>
    </footer>
  );
}
