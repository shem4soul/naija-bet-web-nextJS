import { LeagueNav } from "@/components/league-nav";
import { BetSlipPanel } from "@/components/bet-slip";

export default function SportsbookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_340px]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <LeagueNav />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
      <aside className="hidden xl:block">
        <div className="card card-pad sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
          <BetSlipPanel />
        </div>
      </aside>
    </div>
  );
}
