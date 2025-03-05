import React, { useEffect, useState } from "react";
import { Award, Coins, Sparkles, Zap } from "lucide-react";
import { Trophy, Medal } from "lucide-react";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { useAccount } from "wagmi";

// Mapping of BadgeLevel enum to display properties
const BADGE_DISPLAY_MAP = {
  0: {
    name: "Newcomer",
    icon: <Medal className="w-8 h-8 text-gray-400" />,
    color: "bg-gray-100 dark:bg-gray-800",
    requirements: "No participation yet",
  },
  1: {
    name: "Participant",
    icon: <Medal className="w-8 h-8 text-amber-600" />,
    color: "bg-amber-50 dark:bg-amber-900/20",
    requirements: "1+ Event Participation",
  },
  2: {
    name: "Contributor",
    icon: <Medal className="w-8 h-8 text-gray-500" />,
    color: "bg-gray-100 dark:bg-gray-800",
    requirements: "3+ Event Participation",
  },
  3: {
    name: "Leader",
    icon: <Trophy className="w-8 h-8 text-yellow-600" />,
    color: "bg-yellow-50 dark:bg-yellow-900/20",
    requirements: "5+ Event Participation",
  },
  4: {
    name: "Champion",
    icon: <Trophy className="w-8 h-8 text-cyan-600" />,
    color: "bg-cyan-50 dark:bg-cyan-900/20",
    requirements: "10+ Event Participation",
  },
};

const RewardsSection = () => {
  const [userBadge, setUserBadge] = useState(null);
  const { memberBadgeDetails, fetchMemberBadgeDetails } = useCommunityMembers();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    fetchMemberBadgeDetails(address);
    if (memberBadgeDetails) {
      // Use the currentBadge from the contract's badge details
      setUserBadge(memberBadgeDetails.currentBadge);
    }
  }, [memberBadgeDetails]);

  // Render the current badge section
  const renderCurrentBadge = () => {
    const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
    const badgeInfo = BADGE_DISPLAY_MAP[currentBadgeLevel];
    const [claimRewardsLoading, setClaimRewardsLoading] = useState(false);

    // Handle Claim Badge Rewards
    const handleClaimRewards = async () => {
      if (!isConnected) {
        openConnectModal();
        return;
      }

      setClaimRewardsLoading(true);

      try {
        const signer = await signerPromise;
        const contract = new ethers.Contract(
          CommunityAddress,
          Community_ABI,
          signer
        );

        const tx = await contract.claimBadgeRewards();
        await tx.wait();

        toast.success("Badge rewards claimed successfully!");
      } catch (error) {
        console.error("Error claiming rewards:", error);
        toast.error("Failed to claim rewards");
      }
    };

    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Your Badge</h3>
            <div className="flex items-center gap-3">
              {badgeInfo.icon}
              <span className="text-2xl">{badgeInfo.name}</span>
            </div>
            <p className="text-gray-300 mt-2">
              Current Level: {badgeInfo.requirements}
            </p>
          </div>

          <button
            onClick={handleClaimRewards}
            disabled={claimRewardsLoading || !isConnected}
            className="py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 rounded-lg transition-colors duration-300 flex items-center gap-2"
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
      </div>
    );
  };

  // Render badge levels grid
  const renderBadgeLevels = () => {
    const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;

    return (
      <div className="grid md:grid-cols-5 gap-4">
        {Object.entries(BADGE_DISPLAY_MAP).map(([level, badge]) => {
          const levelNum = parseInt(level);
          const isUnlocked = levelNum <= currentBadgeLevel;
          const isCurrentBadge = levelNum === currentBadgeLevel;

          return (
            <div
              key={level}
              className={`
                ${badge.color} 
                rounded-xl shadow-lg p-6 border 
                ${
                  isUnlocked
                    ? "border-green-500/50 dark:border-green-500/30"
                    : "border-gray-200 dark:border-gray-700"
                }
                ${isCurrentBadge ? "ring-2 ring-yellow-500" : ""}
                opacity-${isUnlocked ? "100" : "50"}
                transition-all duration-300
              `}
            >
              <div className="flex flex-col items-center text-center">
                {badge.icon}
                <h3
                  className={`mt-2 font-bold ${
                    isCurrentBadge ? "text-yellow-600" : ""
                  }`}
                >
                  {badge.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {badge.requirements}
                </p>
                {isUnlocked && (
                  <div className="mt-2 text-green-600 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Unlocked
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Community Rewards & Badges</h2>

      {renderCurrentBadge()}
      {renderBadgeLevels()}

      {/* Benefits List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
        <h3 className="text-xl font-bold mb-4">Badge Benefits</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-500 mt-1" />
            <div>
              <p className="font-medium">Exclusive Access</p>
              <p className="text-sm text-gray-500">
                Access to special events and content
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Coins className="w-5 h-5 text-yellow-500 mt-1" />
            <div>
              <p className="font-medium">Token Rewards</p>
              <p className="text-sm text-gray-500">
                Regular LMS token distributions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-500 mt-1" />
            <div>
              <p className="font-medium">Governance Power</p>
              <p className="text-sm text-gray-500">
                Higher voting weight in community decisions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsSection;
