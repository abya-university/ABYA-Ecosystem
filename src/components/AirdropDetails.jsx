import React, { useEffect, useState } from "react";
import { useAirdropProposals } from "../contexts/airdropProposalContext";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useEthersSigner } from "../components/useClientSigner";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { toast } from "react-toastify";
import { useUser } from "../contexts/userContext";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { CheckCircle, Calendar, Award, Clock, Gift, Users } from "lucide-react";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const AirdropDetails = () => {
  const { airdropProposals, fetchAirdropProposals } = useAirdropProposals();
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [approveLoadingId, setApproveLoadingId] = useState(null);
  const [activeAirdrop, setActiveAirdrop] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const { role } = useUser();
  const { members } = useCommunityMembers();
  const [isMember, setIsMember] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [hasClaimed, setHasClaimed] = useState(false);

  const checkClaimStatus = async () => {
    if (!activeAirdrop || !address) return;

    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const claimed = await communityContract.checkClaimStatus(
        address,
        activeAirdrop.airdropId
      );
      setHasClaimed(claimed);
    } catch (error) {
      console.error("Error checking claim status:", error);
    }
  };

  useEffect(() => {
    fetchAirdropProposals();
    findActiveAirdrop();

    // Check if user is a community member
    if (address && members) {
      setIsMember(members.includes(address));
    }

    if (activeAirdrop && address) {
      checkClaimStatus();
    }
  }, [address, members, activeAirdrop]);

  useEffect(() => {
    if (activeAirdrop) {
      const updateTimeRemaining = () => {
        const endTime = new Date(activeAirdrop.endTime);
        const now = new Date();
        const diff = Math.max(0, endTime - now);

        setTimeRemaining({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      };

      updateTimeRemaining();
      const timer = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(timer);
    }
  }, [activeAirdrop]);

  const findActiveAirdrop = () => {
    const active = airdropProposals.find((airdrop) => airdrop.isActive);
    setActiveAirdrop(active || null);
  };

  const handleApprove = async (airdropId) => {
    setApproveLoadingId(airdropId);
    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );
      const tx = await communityContract.approveAirdropProposal(airdropId);
      toast.info("Approving Airdrop Proposal...");
      await tx.wait();
      toast.success("Airdrop Proposal Approved!");
      fetchAirdropProposals();
    } catch (error) {
      console.error("Error approving airdrop proposal:", error);
      toast.error("Failed to approve airdrop proposal.");
    } finally {
      setApproveLoadingId(null);
    }
  };

  const handleClaim = async () => {
    if (!activeAirdrop) return;
    setClaimLoading(true);
    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );
      const tx = await communityContract.claimAirdrop(activeAirdrop.airdropId);
      toast.info("Claiming Airdrop...");
      await tx.wait();
      toast.success("Airdrop Claimed Successfully! 🎉");
      fetchAirdropProposals();
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      toast.error("Failed to claim airdrop.");
    } finally {
      setClaimLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  // Admin/Manager/Multisig View
  if (
    role === "Multisig Approver" ||
    role === "ADMIN" ||
    role === "Community Manager"
  ) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Airdrop Proposal Management
          </h1>
          <div className="px-4 py-2 bg-amber-50 dark:bg-gray-700 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {role === "ADMIN" ? "Administrator" : role}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {airdropProposals.length > 0 ? (
            airdropProposals.map((airdrop) => (
              <div
                key={airdrop.airdropId}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-l-yellow-500 border-t border-r border-b border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Airdrop #{airdrop.airdropId}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Created on{" "}
                      {new Date(airdrop.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 ${
                      airdrop.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {airdrop.isActive ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col p-3 rounded-lg bg-amber-50 dark:bg-gray-700">
                    <span className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-1">
                      Amount
                    </span>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-amber-500 mr-2" />
                      <span className="font-bold text-lg">
                        {airdrop.amount} ETH
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col p-3 rounded-lg bg-blue-50 dark:bg-gray-700">
                    <span className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-300 mb-1">
                      Approvals
                    </span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="font-bold text-lg">
                        {airdrop.approvalCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Start Time:
                      </span>
                    </div>
                    <span className="font-medium">
                      {new Date(airdrop.startTime).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        End Time:
                      </span>
                    </div>
                    <span className="font-medium">
                      {new Date(airdrop.endTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleApprove(airdrop.airdropId)}
                    disabled={approveLoadingId === airdrop.airdropId}
                    className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 relative"
                  >
                    {approveLoadingId === airdrop.airdropId ? (
                      <>
                        <span className="opacity-0">Approve</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        </div>
                      </>
                    ) : (
                      "Approve Proposal"
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
                No Airdrop Proposals
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                There are currently no airdrop proposals to manage.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } // Normal User View section only - with updated yellow theme
  else {
    // Normal User View - Only show if they're a community member
    return (
      <div className="container mx-auto p-6">
        {isMember ? (
          <>
            <h1 className="text-3xl font-bold text-center text-yellow-500 dark:text-yellow-400 bg-clip-text mb-8">
              Claim Your Community Airdrop
            </h1>

            {activeAirdrop ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-yellow-500/20">
                  <div className="h-14 bg-gradient-to-r from-yellow-500 to-amber-500"></div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                          <Gift className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            Active Airdrop #{activeAirdrop.airdropId}
                          </h2>
                          <p className="text-sm text-gray-400">
                            Available to community members
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center text-xs font-medium">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1"></span>
                        Active
                      </span>
                    </div>

                    <div className="dark:bg-gray-800 rounded-xl p-6 mb-6 dark:shadow-inner border dark:border-gray-700 shadow-md">
                      <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Award className="w-12 h-12 text-yellow-500" />
                        </div>
                      </div>

                      <div className="text-center mb-6">
                        <h3 className="text-4xl font-bold dark:text-white text-yellow-500 mb-1">
                          {activeAirdrop.amount} ABYATKN
                        </h3>
                        <p className="text-sm text-gray-400">
                          Available for claiming
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-6">
                        <div className="dark:bg-gray-900 p-3 rounded-lg text-center border border-yellow-500/20">
                          <span className="block text-2xl font-bold text-yellow-500">
                            {timeRemaining.days}
                          </span>
                          <span className="text-xs text-gray-400">Days</span>
                        </div>
                        <div className="dark:bg-gray-900 p-3 rounded-lg text-center border border-yellow-500/20">
                          <span className="block text-2xl font-bold text-yellow-500">
                            {timeRemaining.hours}
                          </span>
                          <span className="text-xs text-gray-400">Hours</span>
                        </div>
                        <div className="dark:bg-gray-900 p-3 rounded-lg text-center border border-yellow-500/20">
                          <span className="block text-2xl font-bold text-yellow-500">
                            {timeRemaining.minutes}
                          </span>
                          <span className="text-xs text-gray-400">Minutes</span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={handleClaim}
                          disabled={claimLoading || hasClaimed}
                          className={`w-3/4 py-3 px-6 font-bold rounded-xl shadow-lg transition-all duration-300 ${
                            hasClaimed
                              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                              : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-cyan-950 hover:shadow-xl transform hover:scale-105"
                          }`}
                        >
                          {claimLoading ? (
                            <>
                              <span className="opacity-0">
                                Claim Your Airdrop
                              </span>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-950"></div>
                              </div>
                            </>
                          ) : hasClaimed ? (
                            "Already Claimed"
                          ) : (
                            "Claim Your Airdrop"
                          )}
                        </button>
                      </div>
                      {hasClaimed && (
                        <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-center text-sm text-yellow-500">
                            You've already claimed this airdrop.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="dark:bg-gray-900 rounded-lg p-4 border dark:border-gray-700">
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium text-gray-300">
                          Time Remaining:
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Start:{" "}
                          {new Date(activeAirdrop.startTime).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400">
                          End:{" "}
                          {new Date(activeAirdrop.endTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-yellow-500/20">
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                  <Gift className="w-10 h-10 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  No Active Airdrops
                </h3>
                <p className="text-gray-400">
                  There are currently no active airdrops available for claiming.
                  Check back later for new opportunities!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-md mx-auto dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-yellow-500/20">
            <div className="w-20 h-20 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
              <Users className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Membership Required
            </h3>
            <p className="text-gray-400 mb-6">
              You need to be a community member to view and claim airdrops. Join
              our community to participate in future airdrops!
            </p>
            <button className="py-2 px-6 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300">
              Learn More
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default AirdropDetails;
