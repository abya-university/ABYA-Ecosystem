import { useEffect, useState } from "react";
import {
  Award,
  CircleSlash2,
  Coins,
  Sparkles,
  Zap,
  Shield,
  Crown,
  Star,
  Calendar,
  Gift,
  TrendingUp,
  Users,
  Target,
  Rocket,
  Flame,
  Gem,
  Lock,
  Unlock,
  CheckCircle2,
  Medal,
  Trophy,
} from "lucide-react";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import CommunityBadgeFacetABI from "../artifacts/contracts/CommunityBadgesFacet.sol/CommunityBadgesFacet.json";
import { toast } from "react-toastify";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { useDarkMode } from "../contexts/themeContext";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const CommunityBadgeFacet_ABI = CommunityBadgeFacetABI.abi;

// Enhanced badge display mapping with modern styling
const BADGE_DISPLAY_MAP = {
  0: {
    name: "Newcomer",
    icon: (
      <img src="/newcomer.jpg" className="w-12 h-12 object-cover rounded-xl" />
    ),
    color: "from-slate-400 to-slate-500",
    lightColor: "from-slate-100 to-slate-200",
    textColor: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-300 dark:border-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-800/50",
    gradient: "from-slate-500/20 to-slate-600/20",
    glow: "group-hover:shadow-slate-500/20",
    requirements: "Join the community",
    reward: "0 ABYTKN",
    description: "Start your journey in the ABYA community",
  },
  1: {
    name: "Participant",
    icon: (
      <img
        src="/participant.jpg"
        className="w-12 h-12 object-cover rounded-xl"
      />
    ),
    color: "from-amber-400 to-amber-500",
    lightColor: "from-amber-100 to-amber-200",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    gradient: "from-amber-500/20 to-amber-600/20",
    glow: "group-hover:shadow-amber-500/20",
    requirements: "1+ Events",
    reward: "10 ABYTKN",
    description: "Take your first step in community events",
  },
  2: {
    name: "Contributor",
    icon: (
      <img
        src="/contributor.jpg"
        className="w-12 h-12 object-cover rounded-xl"
      />
    ),
    color: "from-blue-400 to-blue-500",
    lightColor: "from-blue-100 to-blue-200",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    gradient: "from-blue-500/20 to-blue-600/20",
    glow: "group-hover:shadow-blue-500/20",
    requirements: "3+ Events",
    reward: "25 ABYTKN",
    description: "Start making a difference in the community",
  },
  3: {
    name: "Leader",
    icon: (
      <img src="/leader.jpg" className="w-12 h-12 object-cover rounded-xl" />
    ),
    color: "from-yellow-400 to-yellow-500",
    lightColor: "from-yellow-100 to-yellow-200",
    textColor: "text-yellow-700 dark:text-yellow-300",
    borderColor: "border-yellow-300 dark:border-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    gradient: "from-yellow-500/20 to-yellow-600/20",
    glow: "group-hover:shadow-yellow-500/20",
    requirements: "5+ Events",
    reward: "50 ABYTKN",
    description: "Lead and inspire others in the community",
  },
  4: {
    name: "Champion",
    icon: (
      <img src="/champion.jpg" className="w-12 h-12 object-cover rounded-xl" />
    ),
    color: "from-purple-400 to-purple-500",
    lightColor: "from-purple-100 to-purple-200",
    textColor: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    gradient: "from-purple-500/20 to-purple-600/20",
    glow: "group-hover:shadow-purple-500/20",
    requirements: "10+ Events",
    reward: "100 ABYTKN",
    description: "The highest honor in the ABYA community",
  },
};

const RewardsSection = () => {
  const { darkMode } = useDarkMode();
  const [userBadge, setUserBadge] = useState(null);
  const [claimRewardsLoading, setClaimRewardsLoading] = useState(false);
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const { memberBadgeDetails, fetchMemberBadgeDetails, members } =
    useCommunityMembers();
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  useEffect(() => {
    if (address) {
      fetchMemberBadgeDetails(address);
    }
    if (memberBadgeDetails) {
      setUserBadge(memberBadgeDetails.currentBadge);
    }
  }, [memberBadgeDetails, address]);

  // Handle Claim Badge Rewards
  const handleClaimRewards = async () => {
    if (!isConnected || !account) {
      toast.error("Please connect your wallet first");
      return;
    }

    setClaimRewardsLoading(true);

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: CommunityBadgeFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const tx = await prepareContractCall({
        contract,
        method: "claimBadgeRewards",
        params: [],
      });

      await sendTransaction({ transaction: tx, account });
      toast.success("🎉 Badge rewards claimed successfully!");

      // Refresh badge details after claiming
      fetchMemberBadgeDetails(address);
    } catch (error) {
      console.error("Error claiming rewards:", error);
      if (error.message?.includes("No rewards to claim")) {
        toast.info("No rewards available to claim at this time");
      } else {
        toast.error("Failed to claim rewards");
      }
    } finally {
      setClaimRewardsLoading(false);
    }
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  // Render the current badge section
  const renderCurrentBadge = () => {
    const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
    const badgeInfo = BADGE_DISPLAY_MAP[currentBadgeLevel];
    const isMember = members?.includes(address);
    const pendingRewards = memberBadgeDetails?.pendingRewards || "0";
    const nextBadgeLevel = Math.min(currentBadgeLevel + 1, 4);
    const nextBadgeInfo = BADGE_DISPLAY_MAP[nextBadgeLevel];
    const eventsNeeded =
      nextBadgeLevel === 1
        ? 1
        : nextBadgeLevel === 2
        ? 3
        : nextBadgeLevel === 3
        ? 5
        : 10;
    const eventsAttended = memberBadgeDetails?.totalEventsAttended || 0;
    const progressToNext = Math.min((eventsAttended / eventsNeeded) * 100, 100);

    return (
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl mb-8 ${cardStyle}`}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow-500/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Badge Display */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${badgeInfo.color} blur-xl opacity-50 group-hover:opacity-75 transition-opacity`}
                />
                <div
                  className={`relative p-4 rounded-2xl bg-gradient-to-br ${badgeInfo.color} shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}
                >
                  {isMember ? (
                    <div className="w-16 h-16 flex items-center justify-center">
                      {badgeInfo.icon}
                    </div>
                  ) : (
                    <CircleSlash2 className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                {isMember && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center lg:text-left">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
                  {isMember ? badgeInfo.name : "Community Badges"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {isMember
                    ? badgeInfo.description
                    : "Join the community to unlock badges and earn rewards"}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full bg-gradient-to-r ${badgeInfo.color} bg-opacity-20 text-gray-800 dark:text-white font-medium`}
                  >
                    {badgeInfo.reward}
                  </span>
                  {isMember && (
                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <Gift className="w-4 h-4" />
                      {pendingRewards} ABYTKN pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <button
              onClick={handleClaimRewards}
              disabled={
                claimRewardsLoading ||
                !isConnected ||
                !isMember ||
                pendingRewards === "0"
              }
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="relative flex items-center justify-center gap-3">
                {claimRewardsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span className="font-semibold text-white">
                      Claiming...
                    </span>
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white">
                      Claim Rewards
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Progress to next badge */}
          {isMember && currentBadgeLevel < 4 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Progress to {nextBadgeInfo.name}
                </span>
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  {eventsAttended}/{eventsNeeded} Events
                </span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}

          {/* Not a member warning */}
          {!isMember && isConnected && (
            <div className="mt-6 p-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full" />
                </div>
                <span className="text-red-700 dark:text-red-300 font-medium">
                  Join the community to start earning badges and rewards!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render badge levels grid
  const renderBadgeLevels = () => {
    const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
    const isMember = members?.includes(address);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <span className="bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
              Badge Progression
            </span>
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Lock className="w-4 h-4" />
            <span>Locked</span>
            <Unlock className="w-4 h-4 ml-2" />
            <span>Unlocked</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(BADGE_DISPLAY_MAP).map(([level, badge]) => {
            const levelNum = parseInt(level);
            const isUnlocked = isMember && levelNum <= currentBadgeLevel;
            const isCurrentBadge = isMember && levelNum === currentBadgeLevel;
            const isNextBadge = isMember && levelNum === currentBadgeLevel + 1;

            return (
              <div
                key={level}
                className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  isCurrentBadge
                    ? `border-yellow-400 dark:border-yellow-500 ${badge.glow}`
                    : isUnlocked
                    ? `border-green-400 dark:border-green-500`
                    : `border-gray-200 dark:border-gray-700`
                } ${badge.bgColor}`}
                onMouseEnter={() => setHoveredBadge(levelNum)}
                onMouseLeave={() => setHoveredBadge(null)}
              >
                {/* Background gradient animation */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div
                    className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 ${
                      isUnlocked
                        ? "border-green-400"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-tr-2xl`}
                  />
                </div>

                <div className="relative flex flex-col items-center text-center space-y-3">
                  {/* Badge icon with glow effect */}
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${badge.color} blur-xl opacity-0 group-hover:opacity-50 transition-opacity`}
                    />
                    <div
                      className={`relative p-3 rounded-xl bg-gradient-to-br ${badge.color} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        {badge.icon}
                      </div>
                    </div>

                    {/* LOCK/UNLOCK INDICATOR - FIXED */}
                    <div className="absolute -top-2 -right-2">
                      {isUnlocked ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                          <Unlock className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge info */}
                  <div>
                    <h4
                      className={`font-bold text-lg mb-1 ${
                        isCurrentBadge
                          ? "text-yellow-600 dark:text-yellow-400"
                          : isUnlocked
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {badge.description}
                    </p>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 dark:text-yellow-300">
                      {badge.reward}
                    </div>
                  </div>

                  {/* Requirement */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {badge.requirements}
                  </div>

                  {/* Progress indicator for next badge */}
                  {isNextBadge && (
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-yellow-600">Next</span>
                        <span className="text-gray-500">Progress</span>
                      </div>
                      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Status text - additional indicator */}
                  <div className="mt-1 text-xs font-medium">
                    {isUnlocked ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-transparent p-8">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                <Rocket className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                Community Rewards
              </h1>
            </div>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 max-w-2xl">
              Earn badges, collect rewards, and grow your influence in the ABYA
              community
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl border ${glassCardStyle}`}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-200">
                  Active Members
                </span>
                <span className="text-sm font-bold text-black dark:text-white ml-auto">
                  {members?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderCurrentBadge()}
      {renderBadgeLevels()}

      {/* Benefits Section */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />

        <div className="relative">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
              Badge Benefits & Perks
            </span>
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Sparkles className="w-6 h-6 text-purple-500" />,
                title: "Exclusive Access",
                description:
                  "Special events, early features, and premium content access",
                gradient: "from-purple-500/20 to-pink-500/20",
                color: "purple",
              },
              {
                icon: <Coins className="w-6 h-6 text-yellow-500" />,
                title: "Token Rewards",
                description:
                  "Regular ABYTKN token distributions and bonus rewards",
                gradient: "from-yellow-500/20 to-amber-500/20",
                color: "yellow",
              },
              {
                icon: <Shield className="w-6 h-6 text-blue-500" />,
                title: "Governance Power",
                description: "Increased voting weight in community decisions",
                gradient: "from-blue-500/20 to-cyan-500/20",
                color: "blue",
              },
              {
                icon: <Award className="w-6 h-6 text-green-500" />,
                title: "Recognition",
                description:
                  "Featured in community highlights and leaderboards",
                gradient: "from-green-500/20 to-emerald-500/20",
                color: "green",
              },
              {
                icon: <Crown className="w-6 h-6 text-red-500" />,
                title: "Priority Support",
                description: "Dedicated support and faster response times",
                gradient: "from-red-500/20 to-rose-500/20",
                color: "red",
              },
              {
                icon: <Star className="w-6 h-6 text-cyan-500" />,
                title: "Networking",
                description: "Connect with other top contributors and leaders",
                gradient: "from-cyan-500/20 to-blue-500/20",
                color: "cyan",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {benefit.description}
                    </p>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1">
                  <div
                    className={`h-full w-0 group-hover:w-full bg-gradient-to-r ${benefit.gradient} transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Level</p>
              <p className="text-2xl font-bold text-white">
                {BADGE_DISPLAY_MAP[memberBadgeDetails?.currentBadge || 0]
                  ?.name || "Newcomer"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-green-500 to-green-600 hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Events Attended</p>
              <p className="text-2xl font-bold text-white">
                {memberBadgeDetails?.totalEventsAttended || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Pending Rewards</p>
              <p className="text-2xl font-bold text-white">
                {memberBadgeDetails?.pendingRewards || "0"} ABYTKN
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Coins className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsSection;
