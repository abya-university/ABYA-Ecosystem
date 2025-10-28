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
} from "lucide-react";
import { Trophy, Medal } from "lucide-react";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import CommunityBadgeFacetABI from "../artifacts/contracts/CommunityBadgesFacet.sol/CommunityBadgesFacet.json";
import { toast } from "react-toastify";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const CommunityBadgeFacet_ABI = CommunityBadgeFacetABI.abi;

// Enhanced badge display mapping
const BADGE_DISPLAY_MAP = {
  0: {
    name: "Newcomer",
    icon: <Medal className="w-10 h-10 text-gray-400" />,
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-800/50",
    borderColor: "border-gray-200 dark:border-gray-700",
    requirements: "Join the community",
    reward: "0 ABYTKN",
  },
  1: {
    name: "Participant",
    icon: <Medal className="w-10 h-10 text-amber-500" />,
    color: "from-amber-400 to-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-700",
    requirements: "1+ Events",
    reward: "10 ABYTKN",
  },
  2: {
    name: "Contributor",
    icon: <Shield className="w-10 h-10 text-blue-500" />,
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700",
    requirements: "3+ Events",
    reward: "25 ABYTKN",
  },
  3: {
    name: "Leader",
    icon: <Trophy className="w-10 h-10 text-yellow-500" />,
    color: "from-yellow-400 to-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-700",
    requirements: "5+ Events",
    reward: "50 ABYTKN",
  },
  4: {
    name: "Champion",
    icon: <Crown className="w-10 h-10 text-purple-500" />,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-700",
    requirements: "10+ Events",
    reward: "100 ABYTKN",
  },
};

const RewardsSection = () => {
  const [userBadge, setUserBadge] = useState(null);
  const [claimRewardsLoading, setClaimRewardsLoading] = useState(false);
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

  // Render the current badge section
  const renderCurrentBadge = () => {
    const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
    const badgeInfo = BADGE_DISPLAY_MAP[currentBadgeLevel];
    const isMember = members?.includes(address);
    const pendingRewards = memberBadgeDetails?.pendingRewards || "0";

    return (
      <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-8 border border-yellow-200 dark:border-yellow-800/30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className={`p-4 rounded-2xl bg-gradient-to-br ${badgeInfo.color} shadow-lg`}
              >
                {isMember ? (
                  badgeInfo.icon
                ) : (
                  <CircleSlash2 className="w-10 h-10 text-gray-400" />
                )}
              </div>
              {isMember && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {isMember ? badgeInfo.name : "Community Badges"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                {isMember
                  ? badgeInfo.requirements
                  : "Join the community to unlock badges"}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                {isMember
                  ? `Pending Rewards: ${pendingRewards} ABYTKN`
                  : "Connect wallet to view rewards"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimRewards}
            disabled={
              claimRewardsLoading ||
              !isConnected ||
              !isMember ||
              pendingRewards === "0"
            }
            className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-cyan-950 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 font-semibold min-w-[180px] justify-center"
          >
            {claimRewardsLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-950"></div>
            ) : (
              <>
                <Award className="w-5 h-5" />
                Claim Rewards
              </>
            )}
          </button>
        </div>

        {!isMember && isConnected && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-red-700 dark:text-red-300 font-medium">
                Join the community to start earning badges and rewards!
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render badge levels grid
  const renderBadgeLevels = () => {
    const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
    const isMember = members?.includes(address);

    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Badge Progression
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(BADGE_DISPLAY_MAP).map(([level, badge]) => {
            const levelNum = parseInt(level);
            const isUnlocked = isMember && levelNum <= currentBadgeLevel;
            const isCurrentBadge = isMember && levelNum === currentBadgeLevel;

            return (
              <div
                key={level}
                className={`
                  ${badge.bgColor} 
                  rounded-2xl p-5 border-2 transition-all duration-300 transform hover:scale-105
                  ${
                    isCurrentBadge
                      ? "ring-4 ring-yellow-400 shadow-2xl border-yellow-300 dark:border-yellow-600"
                      : isUnlocked
                      ? `border-green-300 dark:border-green-600 shadow-lg`
                      : `border-gray-200 dark:border-gray-700 shadow-md opacity-70`
                  }
                `}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${badge.color} shadow-md`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1">
                    <h4
                      className={`font-bold text-lg ${
                        isCurrentBadge
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-gray-800 dark:text-white"
                      }`}
                    >
                      {badge.name}
                    </h4>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-2">
                      {badge.requirements}
                    </p>

                    <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      {badge.reward}
                    </div>
                  </div>

                  <div className="mt-2">
                    {isUnlocked ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Unlocked
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Locked
                      </div>
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
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-3">
          Community Rewards
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Earn badges, collect rewards, and grow your influence in the ABYA
          community
        </p>
      </div>

      {renderCurrentBadge()}
      {renderBadgeLevels()}

      {/* Benefits Section */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-yellow-500" />
          Badge Benefits & Perks
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Sparkles className="w-8 h-8 text-purple-500" />,
              title: "Exclusive Access",
              description:
                "Special events, early features, and premium content access",
            },
            {
              icon: <Coins className="w-8 h-8 text-yellow-500" />,
              title: "Token Rewards",
              description:
                "Regular ABYTKN token distributions and bonus rewards",
            },
            {
              icon: <Shield className="w-8 h-8 text-blue-500" />,
              title: "Governance Power",
              description: "Increased voting weight in community decisions",
            },
            {
              icon: <Award className="w-8 h-8 text-green-500" />,
              title: "Recognition",
              description: "Featured in community highlights and leaderboards",
            },
            {
              icon: <Crown className="w-8 h-8 text-red-500" />,
              title: "Priority Support",
              description: "Dedicated support and faster response times",
            },
            {
              icon: <Star className="w-8 h-8 text-cyan-500" />,
              title: "Networking",
              description: "Connect with other top contributors and leaders",
            },
          ].map((benefit, index) => (
            <div
              key={index}
              className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Current Level</p>
              <p className="text-2xl font-bold">
                {BADGE_DISPLAY_MAP[memberBadgeDetails?.currentBadge || 0]
                  ?.name || "Newcomer"}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Events Attended</p>
              <p className="text-2xl font-bold">
                {memberBadgeDetails?.totalEventsAttended || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Pending Rewards</p>
              <p className="text-2xl font-bold">
                {memberBadgeDetails?.pendingRewards || "0"} ABYTKN
              </p>
            </div>
            <Coins className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsSection;
