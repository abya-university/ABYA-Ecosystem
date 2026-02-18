import { useMemo } from "react";
import { ArrowUpRight, Coins, LineChart, CheckCircle } from "lucide-react";
import { useDarkMode } from "../../contexts/themeContext";
import { useAmbassadorNetwork } from "../../contexts/ambassadorNetworkContext";
import { useUser } from "../../contexts/userContext";
import VestingInfo from "../../components/AmbassadorComponents/VestingInfo";

export default function RevenuePortfolio() {
  const { darkMode } = useDarkMode();
  const { ambassadorDetails } = useAmbassadorNetwork();
  const { role } = useUser();

  const ambassadorList = Array.isArray(ambassadorDetails)
    ? ambassadorDetails
    : [];

  const totals = useMemo(() => {
    return ambassadorList.reduce(
      (accumulator, ambassador) => {
        const commissions = Number(ambassador.lifetimeCommissions);

        return {
          totalCommissions:
            accumulator.totalCommissions +
            (Number.isNaN(commissions) ? 0 : commissions),
        };
      },
      { totalCommissions: 0 },
    );
  }, [ambassadorList]);

  const cardStyle = darkMode
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Portfolio & Earnings
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Revenue & Vesting</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Monitor revenue streams, vesting schedules, unlock rewards, and
              keep payouts on track.
            </p>
          </div>
          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  role === "Founding Ambassador"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {role}
                </div>
              </div>
            )}
        </div>
      </header>

      {/* Vesting Section - using reusable component */}
      <VestingInfo showClaimButton={true} />

      {/* Revenue Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Pending Payouts",
            value: totals.totalCommissions
              ? `$${Number(totals.totalCommissions).toLocaleString()}`
              : "$--",
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
          <li>Check vesting schedule and claim eligible tokens.</li>
          <li>Approve next payout batch.</li>
        </ul>
      </div>
    </section>
  );
}
