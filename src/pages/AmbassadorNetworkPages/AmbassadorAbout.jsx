import {
  Check,
  TrendingUp,
  Lock,
  Users,
  Zap,
  Gift,
  CheckCircle,
  Crown,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Clock,
  Wallet,
  Layers,
  HelpCircle,
  Award,
} from "lucide-react";
import { useDarkMode } from "../../contexts/themeContext";
import { useUser } from "../../contexts/userContext";

export default function AmbassadorAbout() {
  const { darkMode } = useDarkMode();
  const { role } = useUser();

  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-slate-600/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70 hover:border-slate-300/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  const timelineItems = [
    {
      day: 0,
      label: "Tokens Earned",
      status: "100% Unvested",
      color: "red",
      progress: 0,
    },
    {
      day: 182,
      label: "Half-Vested",
      status: "50% Vested",
      color: "yellow",
      progress: 50,
    },
    {
      day: 365,
      label: "Fully Vested",
      status: "100% Available",
      color: "green",
      progress: 100,
    },
  ];

  const colorVariants = {
    red: {
      bg: "from-red-500/20 to-rose-500/20",
      border: "border-red-500/30",
      text: "text-red-600 dark:text-red-400",
      light: "bg-red-50 dark:bg-red-900/20",
      dark: "bg-red-100 dark:bg-red-900/30",
    },
    yellow: {
      bg: "from-yellow-500/20 to-amber-500/20",
      border: "border-yellow-500/30",
      text: "text-yellow-600 dark:text-yellow-400",
      light: "bg-yellow-50 dark:bg-yellow-900/20",
      dark: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    green: {
      bg: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
      text: "text-green-600 dark:text-green-400",
      light: "bg-green-50 dark:bg-green-900/20",
      dark: "bg-green-100 dark:bg-green-900/30",
    },
    blue: {
      bg: "from-blue-500/20 to-indigo-500/20",
      border: "border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      light: "bg-blue-50 dark:bg-blue-900/20",
      dark: "bg-blue-100 dark:bg-blue-900/30",
    },
    purple: {
      bg: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30",
      text: "text-purple-600 dark:text-purple-400",
      light: "bg-purple-50 dark:bg-purple-900/20",
      dark: "bg-purple-100 dark:bg-purple-900/30",
    },
  };

  return (
    <section className="space-y-8">
      {/* Header with modern gradient */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-transparent p-8">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-600 dark:text-yellow-400">
              <Sparkles className="h-4 w-4" />
              <span>About the Program</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Ambassador Ecosystem Guide
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Understand how the ambassador program, vesting, and revenue
              sharing work together to create opportunities for growth and
              earning.
            </p>
          </div>

          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`group relative inline-flex items-center gap-3 rounded-2xl px-6 py-3 ${
                  role === "Founding Ambassador"
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30"
                    : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
                }`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold whitespace-nowrap">{role}</span>
              </div>
            )}
        </div>
      </header>

      {/* Ambassador Program Section */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-4">
              <Users className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ambassador Program</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                The ABYA ambassador program is a multi-tier network structure
                that rewards members for building communities and referring
                others to the platform.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Founding Ambassadors */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${colorVariants.yellow.border}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colorVariants.yellow.bg} opacity-20`}
              />
              <div className="relative">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-yellow-900 dark:text-yellow-200">
                  <Crown className="h-6 w-6" />
                  Founding Ambassadors
                </h3>
                <p className="mt-3 text-yellow-800 dark:text-yellow-300">
                  The first members who lead the network from day one. They pay
                  a 100 USDC registration fee to become ambassadors immediately.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Build their own network directly",
                    "Receive higher tier benefits",
                    "Earn commissions from direct and indirect referrals",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-yellow-500/20 p-1">
                        <Check
                          className={`h-3 w-3 ${colorVariants.yellow.text}`}
                        />
                      </div>
                      <span className="text-sm text-yellow-800 dark:text-yellow-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* General Ambassadors */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${colorVariants.blue.border}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colorVariants.blue.bg} opacity-20`}
              />
              <div className="relative">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-blue-900 dark:text-blue-200">
                  <GraduationCap className="h-6 w-6" />
                  General Ambassadors
                </h3>
                <p className="mt-3 text-blue-800 dark:text-blue-300">
                  Members who complete a paid course (50+ USDC) to become
                  ambassadors. They build their network through education.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Complete course enrollment requirement",
                    "Earn while learning",
                    "Build network through referrals",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-blue-500/20 p-1">
                        <Check
                          className={`h-3 w-3 ${colorVariants.blue.text}`}
                        />
                      </div>
                      <span className="text-sm text-blue-800 dark:text-blue-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ambassador Levels */}
          <div className={`mt-6 rounded-2xl border p-6 ${glassCardStyle}`}>
            <div className="flex items-start gap-3 mb-4">
              <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-semibold">
                Ambassador Levels & Tiers
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Ambassadors progress through levels based on their network size
              and activity. Each level unlocks additional benefits:
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  level: "Level 1",
                  desc: "Base rewards, limited upline depth",
                  color: "blue",
                },
                {
                  level: "Level 2",
                  desc: "Increased rewards, expanded network reach",
                  color: "green",
                },
                {
                  level: "Level 3+",
                  desc: "Premium benefits, maximum earning potential",
                  color: "purple",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 ${
                    colorVariants[item.color].border
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      colorVariants[item.color].text
                    }`}
                  >
                    {item.level}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vesting Section */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Token Vesting System</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Ambassadors earn ABYT tokens through their network activities.
                These tokens are subject to a vesting schedule to ensure
                long-term commitment.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* How Vesting Works */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-6 ${colorVariants.blue.border}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colorVariants.blue.bg} opacity-20`}
              />
              <div className="relative">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-blue-900 dark:text-blue-200">
                  <Clock className="h-5 w-5" />
                  How Vesting Works
                </h3>
                <p className="mt-3 text-blue-800 dark:text-blue-300">
                  When you trigger token rewards through purchases made by
                  people in your network, tokens enter a 365-day vesting period:
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    {
                      period: "Day 1-365",
                      desc: "Tokens vest linearly over 365 days",
                    },
                    {
                      period: "Unvested",
                      desc: "Cannot be claimed or transferred",
                    },
                    {
                      period: "Vested",
                      desc: "Available to claim anytime after vesting",
                    },
                    { period: "Claimed", desc: "Withdrawn to your wallet" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span
                        className={`min-w-24 font-semibold ${colorVariants.blue.text}`}
                      >
                        {item.period}:
                      </span>
                      <span className="text-sm text-blue-800 dark:text-blue-300">
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vesting Timeline */}
            <div className={`rounded-2xl border p-6 ${glassCardStyle}`}>
              <h3 className="text-xl font-semibold mb-6">Vesting Timeline</h3>
              <div className="space-y-6">
                {timelineItems.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="min-w-20">
                        <p className="text-sm font-semibold text-slate-500">
                          Day {item.day}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div
                          className={`rounded-xl p-4 ${
                            colorVariants[item.color].dark
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p
                              className={`text-sm font-semibold ${
                                colorVariants[item.color].text
                              }`}
                            >
                              {item.label}
                            </p>
                            <p
                              className={`text-xs ${
                                colorVariants[item.color].text
                              }`}
                            >
                              {item.status}
                            </p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${
                                colorVariants[item.color].bg
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Actions */}
            <div
              className={`lg:col-span-2 rounded-2xl border p-6 ${glassCardStyle}`}
            >
              <h3 className="text-xl font-semibold mb-4">Token Management</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Zap,
                    label: "Update Vesting",
                    desc: "Manually trigger vesting calculations",
                    color: "yellow",
                  },
                  {
                    icon: Gift,
                    label: "Claim Tokens",
                    desc: "Withdraw all vested tokens",
                    color: "green",
                  },
                  {
                    icon: TrendingUp,
                    label: "View Schedule",
                    desc: "See vesting progress and timeline",
                    color: "blue",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 ${
                        colorVariants[item.color].border
                      }`}
                    >
                      <div
                        className={`mb-3 rounded-lg p-2 ${
                          colorVariants[item.color].light
                        } w-fit`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            colorVariants[item.color].text
                          }`}
                        />
                      </div>
                      <p
                        className={`font-semibold ${
                          colorVariants[item.color].text
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Sharing Section */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4">
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Revenue Sharing Model</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                The revenue sharing system distributes commissions across your
                network based on ambassador tiers and performance metrics.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Commission Structure */}
            <div
              className={`lg:col-span-2 relative overflow-hidden rounded-2xl border p-6 ${colorVariants.green.border}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colorVariants.green.bg} opacity-20`}
              />
              <div className="relative">
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-200 mb-4">
                  Commission Structure
                </h3>
                <p className="text-green-800 dark:text-green-300 mb-4">
                  When team members purchase courses or products, commissions
                  are distributed:
                </p>
                <div className="space-y-4">
                  {[
                    {
                      title: "Direct Referral",
                      rate: "15-20%",
                      desc: "commission from direct purchases",
                    },
                    {
                      title: "Level 2",
                      rate: "5-10%",
                      desc: "from second-tier network",
                    },
                    {
                      title: "Level 3+",
                      rate: "Tiered",
                      desc: "commissions deeper in network",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 ${colorVariants.green.text}`}
                      />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-200">
                          {item.title}:{" "}
                          <span className="text-green-600 dark:text-green-400">
                            {item.rate}
                          </span>
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue Triggers */}
            <div className={`rounded-2xl border p-6 ${glassCardStyle}`}>
              <h3 className="text-xl font-semibold mb-4">Revenue Triggers</h3>
              <div className="space-y-3">
                {[
                  "Course purchases by network members",
                  "Product or service transactions",
                  "Additional purchases by referred members",
                  "Bonus activations for tier achievements",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-green-500/20 p-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Withdrawal */}
            <div
              className={`lg:col-span-3 rounded-2xl border p-6 ${glassCardStyle}`}
            >
              <h3 className="text-xl font-semibold mb-4">
                Payment & Withdrawal
              </h3>
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Commission", value: "Held in USDC", icon: Wallet },
                  {
                    label: "Withdrawal",
                    value: "Withdraw anytime",
                    icon: Gift,
                  },
                  {
                    label: "Frequency",
                    value: "Real-time updates",
                    icon: Clock,
                  },
                  {
                    label: "Refunds",
                    value: "Reverse commissions",
                    icon: ArrowRight,
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 shadow-lg ${cardStyle}`}
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-yellow-500" />
          Getting Started
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: 1,
              title: "Connect Your Wallet",
              desc: "Connect your Web3 wallet and set up your Digital Identity (DID)",
              color: "yellow",
            },
            {
              step: 2,
              title: "Register as Ambassador",
              desc: "Choose founding (100 USDC) or general (complete course) path",
              color: "blue",
            },
            {
              step: 3,
              title: "Build Your Network",
              desc: "Invite others and watch your commissions grow",
              color: "green",
            },
            {
              step: 4,
              title: "Earn & Withdraw",
              desc: "Claim vested tokens and withdraw commissions",
              color: "purple",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                colorVariants[item.color].border
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  colorVariants[item.color].bg
                } opacity-20`}
              />
              <div className="relative">
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                    colorVariants[item.color].bg
                  }`}
                >
                  <span
                    className={`text-xl font-bold ${
                      colorVariants[item.color].text
                    }`}
                  >
                    {item.step}
                  </span>
                </div>
                <h3
                  className={`text-lg font-semibold ${
                    colorVariants[item.color].text
                  } mb-2`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 shadow-lg ${cardStyle}`}
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-blue-500" />
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
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
              className="group rounded-xl border border-slate-200/50 p-4 transition-all duration-300 hover:border-slate-300/70 dark:border-white/5 dark:hover:border-white/10"
            >
              <summary className="cursor-pointer font-medium flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-2xl group-open:rotate-180 transition-transform duration-300">
                  ⌄
                </span>
              </summary>
              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/5">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
