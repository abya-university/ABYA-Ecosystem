import {
  Check,
  TrendingUp,
  Lock,
  Users,
  Zap,
  Gift,
  CheckCircle,
  Crown,
} from "lucide-react";
import { useDarkMode } from "../../contexts/themeContext";
import { useUser } from "../../contexts/userContext";

export default function AmbassadorAbout() {
  const { darkMode } = useDarkMode();
  const { role } = useUser();

  const cardStyle = darkMode
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  return (
    <section className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          About the Program
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              Ambassador Ecosystem Guide
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Understand how the ambassador program, vesting, and revenue
              sharing work together to create opportunities for growth and
              earning.
            </p>
          </div>
          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap ${
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

      {/* Ambassador Program Section */}
      <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
        <div className="flex items-start gap-3">
          <Users className="mt-1 h-6 w-6 flex-shrink-0 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold">Ambassador Program</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The ABYA ambassador program is a multi-tier network structure that
              rewards members for building communities and referring others to
              the platform.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* Founding Ambassadors */}
          <div className="rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 p-4 dark:from-yellow-900/20 dark:to-amber-900/20">
            <h3 className="flex items-center gap-2 font-semibold text-yellow-900 dark:text-yellow-200">
              <Crown className="h-5 w-5" />
              Founding Ambassadors
            </h3>
            <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-300">
              The first members who lead the network from day one. They pay a
              100 USDC registration fee to become ambassadors immediately.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Build their own network directly
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Receive higher tier benefits
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Earn commissions from direct and indirect referrals
              </li>
            </ul>
          </div>

          {/* General Ambassadors */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-900/20 dark:to-indigo-900/20">
            <h3 className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-200">
              <Users className="h-5 w-5" />
              General Ambassadors
            </h3>
            <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
              Members who complete a paid course (50+ USDC) to become
              ambassadors. They build their network through education.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Complete course enrollment requirement
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Earn while learning
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Build network through referrals
              </li>
            </ul>
          </div>

          {/* Ambassador Levels */}
          <div className="rounded-2xl border border-slate-200/50 p-4 dark:border-white/5">
            <h3 className="font-semibold">Ambassador Levels & Tiers</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Ambassadors progress through levels based on their network size
              and activity. Each level unlocks additional benefits:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="w-20 font-semibold">Level 1:</span>
                <span>Base rewards, limited upline depth</span>
              </li>
              <li className="flex gap-2">
                <span className="w-20 font-semibold">Level 2:</span>
                <span>Increased rewards, expanded network reach</span>
              </li>
              <li className="flex gap-2">
                <span className="w-20 font-semibold">Level 3+:</span>
                <span>Premium benefits, maximum earning potential</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vesting Section */}
      <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
        <div className="flex items-start gap-3">
          <Lock className="mt-1 h-6 w-6 flex-shrink-0 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold">Token Vesting System</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Ambassadors earn ABYT tokens through their network activities.
              These tokens are subject to a vesting schedule to ensure long-term
              commitment.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* How Vesting Works */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">
              How Vesting Works
            </h3>
            <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
              When you trigger token rewards through purchases made by people in
              your network, tokens enter a 365-day vesting period:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex gap-2">
                <span className="inline-block w-32">Day 1-365:</span>
                <span>Tokens vest linearly over 365 days</span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-32">Unvested:</span>
                <span>Cannot be claimed or transferred</span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-32">Vested:</span>
                <span>Available to claim anytime after vesting</span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-32">Claimed:</span>
                <span>Withdrawn to your wallet</span>
              </li>
            </ul>
          </div>

          {/* Vesting Timeline */}
          <div className="rounded-2xl border border-slate-200/50 p-4 dark:border-white/5">
            <h3 className="font-semibold">Vesting Timeline Example</h3>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-20 flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-500">
                      Day 0
                    </p>
                  </div>
                  <div className="flex-grow rounded-lg bg-red-100 px-3 py-2 dark:bg-red-900/30">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                      Tokens Earned
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      100% Unvested
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-20 flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-500">
                      Day 182
                    </p>
                  </div>
                  <div className="flex-grow rounded-lg bg-yellow-100 px-3 py-2 dark:bg-yellow-900/30">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                      Half-Vested
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      50% Vested, 50% Unvested
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-20 flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-500">
                      Day 365
                    </p>
                  </div>
                  <div className="flex-grow rounded-lg bg-green-100 px-3 py-2 dark:bg-green-900/30">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                      Fully Vested
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      100% Available to Claim
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Actions */}
          <div className="rounded-2xl border border-slate-200/50 p-4 dark:border-white/5">
            <h3 className="font-semibold">Token Management</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <Zap className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                <span>
                  <strong>Update Vesting:</strong> Manually trigger vesting
                  calculations to see newly available tokens
                </span>
              </li>
              <li className="flex gap-2">
                <Gift className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>
                  <strong>Claim Tokens:</strong> Withdraw all vested tokens to
                  your wallet
                </span>
              </li>
              <li className="flex gap-2">
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <span>
                  <strong>View Schedule:</strong> See vesting progress and
                  timeline
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Revenue Sharing Section */}
      <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold">Revenue Sharing Model</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The revenue sharing system distributes commissions across your
              network based on ambassador tiers and performance metrics.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* Commission Structure */}
          <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
            <h3 className="font-semibold text-green-900 dark:text-green-200">
              Commission Structure
            </h3>
            <p className="mt-2 text-sm text-green-800 dark:text-green-300">
              When team members purchase courses or products, commissions are
              distributed:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-green-800 dark:text-green-300">
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Direct Referral:</strong> 15-20% commission from
                  direct purchases
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Level 2:</strong> 5-10% from second-tier network
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Level 3+:</strong> Tiered commissions deeper in
                  network
                </span>
              </li>
            </ul>
          </div>

          {/* Revenue Triggers */}
          <div className="rounded-2xl border border-slate-200/50 p-4 dark:border-white/5">
            <h3 className="font-semibold">What Triggers Revenue Sharing?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Course purchases by network members</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Product or service transactions</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Additional purchases by referred members</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Bonus activations for tier achievements</span>
              </li>
            </ul>
          </div>

          {/* Payment & Withdrawal */}
          <div className="rounded-2xl border border-slate-200/50 p-4 dark:border-white/5">
            <h3 className="font-semibold">Payment & Withdrawal</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="inline-block w-32 font-semibold">
                  Commission:
                </span>
                <span>Held in USDC in your account</span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-32 font-semibold">
                  Withdrawal:
                </span>
                <span>Withdraw anytime to your wallet</span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-32 font-semibold">
                  Frequency:
                </span>
                <span>Real-time updates after transactions</span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-32 font-semibold">
                  Refunds:
                </span>
                <span>Request course refunds reverse commissions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
        <h2 className="text-xl font-semibold">Getting Started</h2>
        <div className="space-y-3">
          <div className="flex gap-3 rounded-xl bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-semibold text-white">
              1
            </span>
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-200">
                Connect Your Wallet
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                Connect your Web3 wallet and set up your Digital Identity (DID)
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
              2
            </span>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Register as Ambassador
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Choose founding (100 USDC) or general (complete course) path
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-green-50 p-3 dark:bg-green-900/20">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-semibold text-white">
              3
            </span>
            <div>
              <p className="font-medium text-green-900 dark:text-green-200">
                Build Your Network
              </p>
              <p className="text-xs text-green-800 dark:text-green-300">
                Invite others and watch your commissions grow
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-semibold text-white">
              4
            </span>
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-200">
                Earn & Withdraw
              </p>
              <p className="text-xs text-purple-800 dark:text-purple-300">
                Claim vested tokens and withdraw commissions as they accrue
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            {
              q: "Can I be both a founding and general ambassador?",
              a: "No, you must choose one path. Founding ambassadors have priority and higher tier benefits.",
            },
            {
              q: "When can I claim my vested tokens?",
              a: "Tokens vest linearly over 365 days. You can claim anytime after they're vested.",
            },
            {
              q: "How are commissions calculated?",
              a: "Commissions are based on your tier, level, and the purchase amounts of your network.",
            },
            {
              q: "Can I withdraw commissions immediately?",
              a: "Yes! Commissions in USDC can be withdrawn to your wallet anytime.",
            },
            {
              q: "What happens if someone in my network gets a refund?",
              a: "Commissions on refunded purchases are reversed from your account.",
            },
          ].map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-xl border border-slate-200/50 p-4 dark:border-white/5"
            >
              <summary className="cursor-pointer font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
