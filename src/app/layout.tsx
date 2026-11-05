import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header, MobileNav } from "@/components/header";
import { Footer } from "@/components/footer";
import { BetSlipDrawer } from "@/components/bet-slip";

export const metadata: Metadata = {
  title: {
    default: "Naija Sportsbook — Bet on EPL, LaLiga & NPFL",
    template: "%s · Naija Sportsbook",
  },
  description:
    "Bet on the Premier League, LaLiga, NPFL and more. Singles, accumulators, cash-out and booking codes, with instant Paystack deposits and payouts.",
  applicationName: "Naija Sportsbook",
};

export const viewport: Viewport = {
  themeColor: "#07110d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
          <BetSlipDrawer />
        </Providers>
      </body>
    </html>
  );
}
