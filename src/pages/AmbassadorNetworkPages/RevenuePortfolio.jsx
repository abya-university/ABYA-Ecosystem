import { useMemo } from "react";
import { ArrowUpRight, Coins, LineChart } from "lucide-react";
import { useDarkMode } from "../../contexts/themeContext";
import { useAmbassadorNetwork } from "../../contexts/ambassadorNetworkContext";

export default function RevenuePortfolio() {
  const { darkMode } = useDarkMode();
  const { ambassadorDetails } = useAmbassadorNetwork();

  const ambassadorList = Array.isArray(ambassadorDetails)
    ? ambassadorDetails
    : [];

  const totals = useMemo(() => {
    return ambassadorList.reduce(
      (accumulator, ambassador) => {
        const rewards = Number(ambassador.totalRewards);

        return {
          totalRewards:
            accumulator.totalRewards + (Number.isNaN(rewards) ? 0 : rewards),
        };
      },
      { totalRewards: 0 },
    );
  }, [ambassadorList]);

  const cardStyle = darkMode
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Revenue Sharing
        </p>
        <h1 className="text-3xl font-semibold">Revenue Portfolio</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Monitor revenue streams, unlock rewards, and keep payouts on track.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Pending Payouts",
            value: totals.totalRewards ? `$${totals.totalRewards}` : "$--",
            icon: Coins,
          },
          { title: "Monthly Growth", value: "+18.2%", icon: LineChart },
          { title: "Next Payout", value: "Mar 02", icon: ArrowUpRight },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-2xl border p-4 shadow-sm ${cardStyle}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
                <div className="rounded-xl bg-yellow-500/15 p-2 text-yellow-600 dark:text-yellow-400">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-3xl border p-6 ${cardStyle}`}>
        <h2 className="text-lg font-semibold">Revenue checklist</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>Confirm ambassador tiers and bonus eligibility.</li>
          <li>Review payout cadence and schedule reminders.</li>
          <li>Approve next payout batch.</li>
        </ul>
      </div>
    </section>
  );
}
