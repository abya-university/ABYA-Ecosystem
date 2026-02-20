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
                  The first members who establish the network from the
                  beginning. They pay a one-time registration fee of 100 USDC to
                  become ambassadors immediately and begin building their
                  downline.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Lead the network before general ambassadors join",
                    "Build a binary tree structure with left and right legs",
                    "Earn tier bonuses and higher commission percentages",
                    "Can recruit both founding and general ambassadors",
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
                  Members who enroll in paid courses (minimum 50 USDC total
                  spend) to become ambassadors. They grow their network through
                  education and referrals, with a sponsor from the founding
                  tier.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Require enrollment in at least one course to qualify",
                    "Must have a founding ambassador as sponsor",
                    "Earn commissions on their network's purchases",
                    "Entry-fee covered through course enrollment",
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

          {/* Ambassador Tiers & Progression */}
          <div className={`mt-6 rounded-2xl border p-6 ${glassCardStyle}`}>
            <div className="flex items-start gap-3 mb-4">
              <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-semibold">
                Ambassador Tiers & Progression
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              There are two ambassador tiers: General (Tier 1) and Founding
              (Tier 2). Within each tier, ambassadors progress through levels
              based on their network depth and activity. The network uses a
              binary tree structure where each ambassador can have a left and
              right leg, with commissions flowing from both directions.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  tier: "Tier 1: General Ambassador",
                  desc: "Entered through course enrollment (50+ USDC). Earn commissions on network purchases with a founding ambassador sponsor.",
                  color: "blue",
                },
                {
                  tier: "Tier 2: Founding Ambassador",
                  desc: "Direct entry with 100 USDC registration fee. Higher tier benefits and can act as sponsors for general ambassadors.",
                  color: "yellow",
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
                    {item.tier}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 italic">
              Note: Progression levels (1, 2, 3+) within each tier are
              determined by network depth, activity, and performance metrics.
            </p>
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
                <p className="mt-3 text-green-800 dark:text-green-300 mb-4">
                  Commission distribution is based on network member purchases.
                  Important: The first purchase by a newly registered member
                  does not generate commissions. Subsequent purchases by the
                  same member will trigger commissions throughout the network
                  hierarchy:
                </p>
                <div className="space-y-4">
                  {[
                    {
                      title: "First Purchase (Registration)",
                      rate: "No Commission",
                      desc: "initial course enrollment to become general ambassador",
                    },
                    {
                      title: "Subsequent Purchases",
                      rate: "Varies by Tier",
                      desc: "commissions distributed through entire upline and network",
                    },
                    {
                      title: "Refunds",
                      rate: "Reversed",
                      desc: "commissions are deducted from ambassador accounts",
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
              <h3 className="text-xl font-semibold mb-4">
                Revenue Triggers & Payment
              </h3>
              <div className="space-y-3">
                {[
                  "Course purchases by network members (not first registration)",
                  "Additional purchases and course re-enrollments",
                  "Commissions paid in USDC stablecoin to your wallet",
                  "Withdrawal available anytime (no waiting period)",
                  "Refunds automatically reverse associated commissions",
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

            {/* De-registration Section */}
            <div
              className={`lg:col-span-3 rounded-2xl border p-6 ${glassCardStyle}`}
            >
              <h3 className="text-xl font-semibold mb-4">
                De-registration & Refunds
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Founding ambassadors can de-register if they have no active
                  subordinates (left or right leg members). Refunds are tiered
                  based on how long you've been registered:
                </p>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    {
                      period: "0-3 days",
                      refund: "80 USDC (80% refund)",
                      color: "green",
                    },
                    {
                      period: "3-10 days",
                      refund: "50 USDC (50% refund)",
                      color: "yellow",
                    },
                    {
                      period: "10-30 days",
                      refund: "15 USDC (15% refund)",
                      color: "orange",
                    },
                    {
                      period: "30+ days",
                      refund: "5 USDC (5% refund)",
                      color: "red",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 text-center ${
                        item.color === "green"
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                          : item.color === "yellow"
                          ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
                          : item.color === "orange"
                          ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                          : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {item.period}
                      </p>
                      <p className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                        {item.refund}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Note: General ambassadors do not receive refunds upon
                  de-registration as their entry was through course enrollment,
                  not a direct fee.
                </p>
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
              a: "No, you must choose one path. Founding ambassadors have priority and higher tier benefits, plus early network advantages.",
            },
            {
              q: "When can I claim my vested tokens?",
              a: "Tokens vest linearly over 365 days at no cost. You can claim anytime after they're vested by accepting the withdrawal transaction.",
            },
            {
              q: "What is the binary tree network structure?",
              a: "Each ambassador can have up to two direct recruits: a left leg and a right leg. Your network depth can be unlimited, and commissions flow from all members in your tree.",
            },
            {
              q: "Why don't I earn commissions on my first purchase?",
              a: "The first course purchase registers you as a general ambassador. Only subsequent purchases by network members trigger commission distribution.",
            },
            {
              q: "How are commissions calculated?",
              a: "Commissions are based on your tier, level, and the purchase amounts of your network members. The first purchase doesn't generate commissions, but all subsequent purchases do.",
            },
            {
              q: "Can I withdraw commissions immediately?",
              a: "Yes! Commissions in USDC stablecoin can be withdrawn to your wallet anytime without waiting periods.",
            },
            {
              q: "Are commissions paid in USDC or another token?",
              a: "All commissions are paid in USDC stablecoin, which maintains a 1:1 peg with the US dollar. You can manage and withdraw them through your wallet.",
            },
            {
              q: "What happens if someone in my network gets a refund?",
              a: "Commissions on refunded purchases are automatically reversed and deducted from your account.",
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
