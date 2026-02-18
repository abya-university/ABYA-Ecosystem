import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Activity, Globe, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../contexts/themeContext";
import { useAmbassadorNetwork } from "../../contexts/ambassadorNetworkContext";
import { useDid } from "../../contexts/DidContext";

export default function NetworkDashboard() {
  const { darkMode } = useDarkMode();
  const { ambassadorDetails, fetchAmbassadors, registerFoundingAmbassador } =
    useAmbassadorNetwork();
  const account = useActiveAccount();
  const { did } = useDid();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!account?.address || !fetchAmbassadors) return;
    fetchAmbassadors().catch((error) => {
      console.error("Failed to fetch ambassador details:", error);
    });
  }, [account?.address, fetchAmbassadors]);

  const handleFoundingRegister = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    if (!registerFoundingAmbassador) return;
    if (!account?.address || !did) {
      setStatusMessage("Wallet address and DID are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerFoundingAmbassador(account.address, did);
      setStatusMessage("Founding ambassador registration submitted.");
    } catch (error) {
      console.error("Failed to register founding ambassador:", error);
      setStatusMessage("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneralRegister = () => {
    navigate("/mainpage?section=courses");
  };

  const ambassadorList = Array.isArray(ambassadorDetails)
    ? ambassadorDetails
    : [];

  const totals = useMemo(() => {
    return ambassadorList.reduce(
      (accumulator, ambassador) => {
        const referred = Number(ambassador.totalReferred);
        const rewards = Number(ambassador.totalRewards);

        return {
          totalReferred:
            accumulator.totalReferred + (Number.isNaN(referred) ? 0 : referred),
          totalRewards:
            accumulator.totalRewards + (Number.isNaN(rewards) ? 0 : rewards),
        };
      },
      { totalReferred: 0, totalRewards: 0 },
    );
  }, [ambassadorList]);

  const cardStyle = darkMode
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Ambassador Network
        </p>
        <h1 className="text-3xl font-semibold">Network Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Track growth, manage your community, and stay on top of ambassador
          performance.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Active Ambassadors",
            value: ambassadorList.length || "--",
            icon: Users2,
          },
          {
            title: "Total Referred",
            value: totals.totalReferred || "--",
            icon: Globe,
          },
          {
            title: "Total Rewards",
            value: totals.totalRewards || "--",
            icon: Activity,
          },
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
        <h2 className="text-lg font-semibold">Today&apos;s focus</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Prioritize regional meetups, highlight top referrers, and queue
          content drops for the next ambassador wave.
        </p>
      </div>

      <div className={`rounded-3xl border p-6 ${cardStyle}`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Register as Ambassador</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Founding members pay 100 USDC. General ambassadors enroll in a
              paid course (50+ USDC) to join.
            </p>
          </div>
          {did ? (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              DID ready
            </span>
          ) : (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              DID loading
            </span>
          )}
        </div>

        {statusMessage && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {statusMessage}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleFoundingRegister}
            className="space-y-4 rounded-2xl border border-slate-200/70 p-4 dark:border-white/10"
          >
            <div>
              <h3 className="text-base font-semibold">Founding Ambassador</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sponsor is auto-filled with your wallet address.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {account?.address || "Connect wallet to continue"}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {did || "DID initializing..."}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !did || !account?.address}
              className="w-full rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-yellow-500/60"
            >
              {isSubmitting ? "Submitting..." : "Register as Founding"}
            </button>
          </form>

          <div className="space-y-4 rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
            <div>
              <h3 className="text-base font-semibold">General Ambassador</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Enroll in any paid course (50+ USDC) to qualify.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGeneralRegister}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Courses to Enroll
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
