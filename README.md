# Naija Sportsbook — Player website

naijabetwebfrontend.vercel.app

The customer-facing website for the [Naija Sportsbook API](https://github.com/shem4soul/Node-Bet-casino-sportsbook): football betting on the Premier League, LaLiga, NPFL and more, a provably-fair casino, and Paystack deposits and withdrawals.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS 4** and **TanStack Query**.

## Features

| Area | What's included |
| --- | --- |
| Sportsbook | Featured board, league pages (upcoming / live / results), team search, full match markets (1X2, double chance, draw no bet, totals, BTTS, odd/even, half-time, HT/FT, correct score, Asian handicap, team totals) |
| Bet slip | Singles and accumulators (one pick per match), quick stakes, odds-change handling (`ODDS_CHANGED` updates prices in place), unavailable-selection warnings, idempotent placement, booking codes (create, copy, load) |
| My bets | Filters by status, leg-by-leg results, live **cash-out** offers with confirmation |
| Wallet | Balance, full ledger history, **Paystack deposit** (redirect + callback verification with polling), withdrawals to Nigerian banks with NUBAN name resolution, KYC prompts |
| Casino | Dice, coin flip and slots, plus a provably-fair page (seed commitment, rotate & reveal, round history) |
| Account | Profile, change password, sign out everywhere, **deposit limits** (24-hour cooling-off on increases) and **self-exclusion** |
| Auth | Register (18+ check), login by email/username/phone, forgot/reset password, silent token refresh |

The layout is responsive: three columns on desktop (leagues, content and a docked bet slip), with a bottom tab bar and a slide-up bet slip on phones.

## Quick start

Requirements: Node 20+ (22 recommended) and a running Naija Sportsbook API.

```bash
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm run dev                    # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL including `/api/v1`, e.g. `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_LICENCE_TEXT` | Optional line shown in the footer, e.g. your licence number |

`NEXT_PUBLIC_*` values are built into the JavaScript bundle, so rebuild after changing them.

## API settings this site relies on

Set these in the **API's** `.env`:

```env
FRONTEND_URL=https://www.yourdomain.com          # password-reset links and the Paystack callback
CORS_ORIGINS=https://www.yourdomain.com,https://admin.yourdomain.com
```

* Paystack returns customers to `FRONTEND_URL/wallet/deposit/callback?reference=…`. This site verifies the payment there and keeps checking for up to a minute while a bank transfer confirms.
* Password-reset emails link to `FRONTEND_URL/reset-password?token=…`, which this site handles.

## Deploy

**Vercel:** import the repo, set `NEXT_PUBLIC_API_URL` in Project → Settings → Environment Variables, and deploy.

**Docker / your own server** (the build uses Next.js standalone output):

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 -t naija-bet-web .
docker run -p 3000:3000 naija-bet-web
```

Or without Docker: `npm ci && npm run build && npm start`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |

## Project structure

```
src/
  app/(book)/        sportsbook pages with the league sidebar and docked bet slip
  app/(auth)/        login, register, forgot/reset password
  app/wallet/        overview, deposit (+ Paystack callback), withdraw
  app/account/       profile & security, responsible gambling
  app/casino/        lobby, dice, coin flip, slots, provably fair
  components/        header, footer, bet slip, odds buttons, UI kit
  lib/               API client (token refresh), auth, bet slip state, formatting, market labels, types
```

Tokens are kept in `localStorage`. Refresh tokens are single-use, so concurrent requests share one refresh call, and a reused or expired token logs the user out cleanly.

## Before launch

Real-money betting is licensed activity. Have your licence, terms, privacy policy and responsible-gambling information in place, and update the footer and register page links to point at them.

## Author

Emmanuel Seun Shittu · [@shem4soul](https://github.com/shem4soul) · shem4soul@gmail.com
