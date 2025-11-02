import { useState, useEffect } from "react";
import { parseEther } from "viem";
import {
  Users,
  MessageCircle,
  Globe,
  Heart,
  Star,
  Plus,
  Calendar,
  Coins,
  X,
  PlusCircle,
  MapPin,
  Merge,
  GiftIcon,
  Badge,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import CommunityEngagementFacetABI from "../artifacts/contracts/CommunityEngagementFacet.sol/CommunityEngagementFacet.json";
import CommunityBadgeFacetABI from "../artifacts/contracts/CommunityBadgesFacet.sol/CommunityBadgesFacet.json";
import CommunityGovernanceFacetABI from "../artifacts/contracts/CommunityGovernanceFacet.sol/CommunityGovernanceFacet.json";
import TokenManagementFacet from "../artifacts/contracts/TokenManagementFacet.sol/TokenManagementFacet.json";
import { useCommunityEvents } from "../contexts/communityEventsContext";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import RewardsSection from "../components/RewardsSection";
import { useUser } from "../contexts/userContext";
import ProjectFundingRequestModal from "../components/ProjectRequestFundsForm";
import ProjectDetails from "./ProjectDetails";
import AirdropModal from "../components/AirdropModal";
import AirdropDetails from "../components/AirdropDetails";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";

const CommunityEngagementFacet_ABI = CommunityEngagementFacetABI.abi;
const CommunityBadgeFacet_ABI = CommunityBadgeFacetABI.abi;
const CommunityGovernanceFacet_ABI = CommunityGovernanceFacetABI.abi;
const TokenManagementFacet_ABI = TokenManagementFacet.abi;
const DiamondAddress = CONTRACT_ADDRESSES.diamond;

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showProjectRequestFundsForm, setShowProjectRequestFundsForm] =
    useState(false);
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showProjectFundingModal, setShowProjectFundingModal] = useState(false);
  const [eventData, setEventData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    maxParticipants: 50,
    isOnline: true, // Default to online event
    location: "",
    additionalDetails: "",
  });
  const [projectFundingData, setProjectFundingData] = useState({
    projectAddress: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [userBadge, setUserBadge] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const [badgeData, setBadgeData] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [createEventLoading, setCreateEventLoading] = useState(false);
  const [fundProjectLoading, setFundProjectLoading] = useState(false);
  const [participateLoading, setParticipateLoading] = useState(false);
  const [joinCommunityLoading, setJoinCommunityLoading] = useState(false);

  const { events, fetchEvents } = useCommunityEvents();
  const { members, fetchMembers } = useCommunityMembers();
  const { role } = useUser();

  useEffect(() => {
    (async () => {
      try {
        await fetchEvents();
      } catch (err) {
        console.error("fetchEvents failed:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchMembers();
      } catch (err) {
        console.error("fetchMembers failed:", err);
      }
    })();
  }, [isConnected]);

  // Fetch badge data
  const fetchBadgeData = async () => {
    if (!isConnected || !address) return;

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: CommunityBadgeFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const raw = await readContract({
        contract,
        method: "getMemberBadgeDetails",
        params: [address],
      });

      // normalize returned tuple to a structured object
      const formatted = {
        currentBadge: Number(raw[0]),
        badgeName: raw[1],
        iconURI: raw[2],
        tokenReward: raw[3]?.toString?.() ?? "0",
        totalEventsAttended: Number(raw[4]),
        pendingRewards: raw[5]?.toString?.() ?? "0",
      };

      setBadgeData(formatted);
    } catch (error) {
      console.error("Error fetching badge data:", error);
    }
  };

  // Fetch token balance
  const fetchTokenBalance = async () => {
    if (!isConnected || !address) return;

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: TokenManagementFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      // const balance = await contract.balanceOf(address);
      const balance = await readContract({
        contract,
        method: "getTokenBalance",
        params: [address],
      });

      setTokenBalance(balance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  // Use useEffect to call these functions when dependencies change
  useEffect(() => {
    if (isConnected) {
      fetchBadgeData();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalance();
    }
  }, [isConnected, address]);

  const handleJoinCommunity = async () => {
    if (!isConnected || !account) {
      toast.error("Please connect your wallet first");
      return;
    }

    setJoinCommunityLoading(true);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: CommunityEngagementFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = prepareContractCall({
        contract,
        method: "joinCommunity",
        params: [],
      });

      console.log("Sending transaction with EIP-7702 gas sponsorship...");

      // Add transaction options for better reliability
      await sendTransaction({
        transaction,
        account: account,
      });
      toast.success("Successfully joined the community!");
    } catch (error) {
      console.error("Error joining community:", error);

      // Dismiss any pending toasts
      toast.dismiss("tx-pending");

      if (error.message?.includes("Timeout")) {
        toast.info(
          "Transaction is taking longer than expected. It may still be processing. Check the explorer later.",
          { duration: 10000 }
        );
        // You might want to check transaction status later
        // checkTransactionStatusLater(transactionHash);
      } else if (error.message?.includes("already a member")) {
        toast.error("You are already a member of this community");
      } else if (error.message?.includes("user rejected")) {
        toast.error("Transaction was rejected");
      } else {
        toast.error("Failed to join community. Please try again!");
      }
    } finally {
      setJoinCommunityLoading(false);
    }
  };

  // Helper function to check transaction status later
  // const checkTransactionStatusLater = async (transactionHash) => {
  //   try {
  //     const receipt = await waitForReceipt({
  //       client,
  //       chain: defineChain(11155111),
  //       transactionHash,
  //       timeoutMs: 300000, // 5 minute wait
  //     });

  //     if (receipt.status === "success") {
  //       toast.success("Transaction confirmed! You've joined the community.");
  //       fetchMembers();
  //     }
  //   } catch (error) {
  //     console.log("Transaction status check:", error);
  //   }
  // };

  const handleCreateEvent = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    setCreateEventLoading(true);

    try {
      const startTimeUnix = new Date(eventData.startTime).getTime() / 1000;
      const endTimeUnix = new Date(eventData.endTime).getTime() / 1000;

      const contract = await getContract({
        address: DiamondAddress,
        abi: CommunityEngagementFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const tx = await prepareContractCall({
        contract,
        method: "createCommunityEvent",
        params: [
          eventData.name,
          BigInt(startTimeUnix),
          BigInt(endTimeUnix),
          BigInt(eventData.maxParticipants),
          eventData.isOnline,
          eventData.location,
          eventData.additionalDetails,
        ],
      });

      await sendTransaction({ transaction: tx, account });

      toast.success("Event created successfully!");
      setShowCreateEventModal(false);
      setEventData({
        name: "",
        startTime: "",
        endTime: "",
        maxParticipants: 50,
        isOnline: true,
        location: "",
        additionalDetails: "",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setCreateEventLoading(false);
    }
  };

  // Handle Fund Project
  const handleFundProject = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    setFundProjectLoading(true);

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: CommunityGovernanceFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const tx = await prepareContractCall({
        contract,
        method: "approveProjectProposal",
        params: [BigInt(projectFundingData.projectId)],
      });

      await sendTransaction(tx);

      toast.success("Project funding proposal created!");
      setShowProjectFundingModal(false);
      setProjectFundingData({
        projectAddress: "",
        amount: "",
      });
    } catch (error) {
      console.error("Error funding project:", error);
      toast.error("Failed to create funding proposal");
    }
  };

  // Handle Participate in Event
  const handleParticipateInEvent = async (eventId) => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    setParticipateLoading(true);

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: CommunityEngagementFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      // const tx = await contract.participateInEvent(BigInt(eventId));
      const tx = await prepareContractCall({
        contract,
        method: "participateInEvent",
        params: [eventId],
      });
      await sendTransaction({ transaction: tx, account });

      toast.success("You're now participating in this event!");
      fetchEvents();
    } catch (error) {
      console.error("Error participating in event:", error);
      toast.error("Failed to join event");
    }
  };

  const getEventStatus = (startTime, endTime) => {
    const now = Date.now();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "past";
    return "ongoing";
  };

  const fadeIn = "animate-fadeIn";
  const slideIn = "animate-slideIn";

  const featuredMembers = [
    {
      name: "Alice Ethereum",
      role: "Core Developer",
      avatar: "/api/placeholder/80/80",
    },
    {
      name: "Bob Blockchain",
      role: "Community Lead",
      avatar: "/api/placeholder/80/80",
    },
    {
      name: "Charlie Web3",
      role: "UX Architect",
      avatar: "/api/placeholder/80/80",
    },
  ];

  const recentActivities = [
    {
      icon: <Heart className="w-5 h-5 text-red-500" />,
      description: "New project proposal submitted",
      timestamp: "2h ago",
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      description: "Governance vote initiated",
      timestamp: "5h ago",
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-500" />,
      description: "New community chapter launched",
      timestamp: "1d ago",
    },
  ];

  const CreateEventModal = () => {
    // Move the handleInputChange function inside the modal component
    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setEventData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
    };

    // Handle radio button changes separately
    const handleRadioChange = (isOnline) => {
      setEventData((prevData) => ({
        ...prevData,
        isOnline,
        location: "", // Reset location when switching types
      }));
    };

    // Handle modal close
    const handleCloseModal = () => {
      setShowCreateEventModal(false);
      // Reset form data when closing
      setEventData({
        name: "",
        startTime: "",
        endTime: "",
        maxParticipants: 50,
        isOnline: true,
        location: "",
        additionalDetails: "",
      });
    };

    // Handle backdrop click (close when clicking outside modal)
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    };

    // Prevent form submission on enter key
    const handleFormSubmit = (e) => {
      e.preventDefault();
      handleCreateEvent();
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 ease-in-out scale-100 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Community Event
            </h3>
            <button
              onClick={handleCloseModal}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Wrap form elements in a form tag for better handling */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={eventData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                placeholder="Workshop, Hackathon, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={eventData.startTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={eventData.endTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Participants *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={eventData.maxParticipants}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Type *
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isOnline"
                    className="form-radio text-yellow-500 focus:ring-yellow-500"
                    checked={eventData.isOnline}
                    onChange={() => handleRadioChange(true)}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Online
                  </span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isOnline"
                    className="form-radio text-yellow-500 focus:ring-yellow-500"
                    checked={!eventData.isOnline}
                    onChange={() => handleRadioChange(false)}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Physical
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {eventData.isOnline ? "Meeting Link *" : "Location Address *"}
              </label>
              <input
                type="text"
                name="location"
                value={eventData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                placeholder={
                  eventData.isOnline
                    ? "https://meet.google.com/..."
                    : "123 Main St, City, Country"
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Details
              </label>
              <textarea
                name="additionalDetails"
                value={eventData.additionalDetails}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200 h-24 resize-none"
                placeholder="Dress code, items to bring, agenda, etc."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2 px-4 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEventLoading}
                className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-cyan-950 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
              >
                {createEventLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-950"></div>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal Component for Project Funding
  const ProjectFundingModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Fund Community Project
          </h3>
          <button
            onClick={() => setShowProjectFundingModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Address
            </label>
            <input
              type="text"
              value={projectFundingData.projectAddress}
              onChange={(e) =>
                setProjectFundingData({
                  ...projectFundingData,
                  projectAddress: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (ABYATKN)
            </label>
            <input
              type="text"
              value={projectFundingData.amount}
              onChange={(e) =>
                setProjectFundingData({
                  ...projectFundingData,
                  amount: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 100"
            />
          </div>

          <button
            onClick={handleFundProject}
            disabled={fundProjectLoading}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {fundProjectLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-950"></div>
            ) : (
              <>
                <Coins className="w-5 h-5 mr-2" />
                Submit Funding Proposal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 bg-gradient-to-br from-blue-50 to-cyan-100 min-h-screen p-4 md:p-6 transition-colors duration-300 pt-24 md:pt-28">
      <ToastContainer
        position="bottom-right"
        theme="colored"
        className="text-sm"
        toastClassName="rounded-lg shadow-lg"
      />

      {showCreateEventModal && <CreateEventModal />}
      {showAirdropModal && (
        <AirdropModal setShowAirdropModal={setShowAirdropModal} />
      )}
      {showProjectFundingModal && <ProjectFundingModal />}
      {showProjectRequestFundsForm && (
        <ProjectFundingRequestModal
          setShowProjectRequestFundsForm={setShowProjectRequestFundsForm}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-cyan-950" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                ABYA Community
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Connect, Collaborate, and Innovate with Web3 Enthusiasts Worldwide
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center lg:justify-start">
              <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full animate-pulse">
                🌟 Live Community
              </span>
              <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                🚀 {members?.length || 0} Members
              </span>
              <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full">
                ⚡ Active
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Improved */}
        <div className="flex overflow-x-auto space-x-1 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200 dark:border-gray-700 shadow-lg">
          {[
            { key: "overview", label: "Overview", icon: "📊" },
            { key: "events", label: "Events", icon: "🎪" },
            { key: "rewards", label: "Rewards", icon: "🏆" },
            { key: "projects", label: "Projects", icon: "💼" },
            { key: "airdrops", label: "Airdrops", icon: "🎁" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all duration-300 font-medium ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-cyan-950 shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          {isConnected && (
            <>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {role === "ADMIN" ||
                role === "Community Manager" ||
                role === "Reviewer" ? (
                  <>
                    <button
                      onClick={() => setShowCreateEventModal(true)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                    >
                      <Calendar className="w-5 h-5" />
                      Create Event
                    </button>

                    <button
                      onClick={() => setShowAirdropModal(true)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                    >
                      <GiftIcon className="w-5 h-5" />
                      Distribute Airdrops
                    </button>

                    <button
                      onClick={() => setShowProjectFundingModal(true)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                    >
                      <Coins className="w-5 h-5" />
                      Fund Project
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowProjectRequestFundsForm(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                  >
                    <Coins className="w-5 h-5" />
                    Request Project Funding
                  </button>
                )}
              </div>

              {/* Join Community Button */}
              <div className="flex justify-center lg:justify-end w-full lg:w-auto">
                {Array.isArray(members) && members.includes(address) ? (
                  <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-cyan-950 rounded-xl shadow-lg font-semibold">
                    <div className="relative">
                      <Badge className="w-6 h-6" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span>ABYA Member</span>
                  </div>
                ) : (
                  <button
                    onClick={handleJoinCommunity}
                    disabled={joinCommunityLoading}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-cyan-950 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joinCommunityLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-950"></div>
                    ) : (
                      <>
                        <Merge className="w-6 h-6" />
                        Join Community
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className={`${fadeIn}`}>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Community Stats */}
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  Community Stats
                </h2>
                <div className="space-y-5">
                  {[
                    {
                      icon: Users,
                      color: "blue",
                      label: "Total Members",
                      value: members?.length || 0,
                    },
                    {
                      icon: Globe,
                      color: "green",
                      label: "Countries",
                      value: "87",
                    },
                    {
                      icon: MessageCircle,
                      color: "purple",
                      label: "Active Discussions",
                      value: "1,234",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900 rounded-lg`}
                        >
                          <stat.icon
                            className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`}
                          />
                        </div>
                        <span className="text-gray-600 dark:text-gray-300">
                          {stat.label}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Members */}
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  Featured Members
                </h2>
                <div className="space-y-4">
                  {featuredMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                    >
                      <img
                        src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-14 h-14 rounded-full border-4 border-yellow-400 shadow-md"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.role}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  Recent Activities
                </h2>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                    >
                      {activity.icon}
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className={`space-y-6 ${fadeIn}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-yellow-500" />
                  Community Events
                </h2>
                {(role === "ADMIN" ||
                  role === "Community Manager" ||
                  role === "Reviewer") && (
                  <button
                    onClick={() => setShowCreateEventModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    New Event
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <Calendar className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    No events available
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Be the first to create an amazing community event and bring
                    everyone together!
                  </p>
                  <button
                    onClick={() => setShowCreateEventModal(true)}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-cyan-950 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                  >
                    Create First Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {events.map((event) => {
                    const now = Date.now();
                    const isUpcoming = event.startTime > now;
                    const isPast = event.endTime < now;
                    const isOngoing = !isUpcoming && !isPast;

                    const secondsToStart = Math.max(
                      0,
                      Math.floor((event.startTime - now) / 1000)
                    );
                    const days = Math.floor(secondsToStart / (60 * 60 * 24));
                    const hours = Math.floor(
                      (secondsToStart % (60 * 60 * 24)) / (60 * 60)
                    );
                    const minutes = Math.floor(
                      (secondsToStart % (60 * 60)) / 60
                    );
                    const seconds = Math.floor(secondsToStart % 60);

                    return (
                      <div
                        key={event.id}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white pr-2">
                                {event.name}
                              </h3>
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                  isUpcoming
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : isOngoing
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                }`}
                              >
                                {isUpcoming
                                  ? "Upcoming"
                                  : isOngoing
                                  ? "Ongoing"
                                  : "Past"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${
                                  event.isOnline
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                }`}
                              >
                                {event.isOnline ? "🌐 Online" : "📍 Physical"}
                              </span>
                              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
                                👥 {event.currentParticipants}/
                                {event.maxParticipants}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {event.additionalDetails ||
                            "Join this exciting community event!"}
                        </p>

                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          {event.isOnline ? (
                            <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          ) : (
                            <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {event.isOnline
                              ? "Click 'Join Event' when the event starts"
                              : event.location || "Location TBD"}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 dark:text-white">
                                {new Date(event.startTime).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(event.startTime).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isUpcoming && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl border border-blue-200 dark:border-blue-700">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 text-center">
                              Starting in:
                            </p>
                            <div className="flex justify-center space-x-4">
                              {[
                                { value: days, label: "Days" },
                                { value: hours, label: "Hours" },
                                { value: minutes, label: "Minutes" },
                                { value: seconds, label: "Seconds" },
                              ].map((time, index) => (
                                <div key={index} className="text-center">
                                  <div className="bg-white dark:bg-blue-800 rounded-lg p-2 min-w-12 shadow-sm">
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-200">
                                      {time.value.toString().padStart(2, "0")}
                                    </span>
                                  </div>
                                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    {time.label}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={async () => {
                            if (!event.isOnline) {
                              await handleParticipateInEvent(event.id);
                              return;
                            }
                            try {
                              await handleParticipateInEvent(event.id);
                              window.open(event.location, "_blank");
                            } catch (error) {
                              toast.error("Failed to join event");
                            }
                          }}
                          disabled={
                            participateLoading ||
                            isPast ||
                            isUpcoming ||
                            event.currentParticipants >= event.maxParticipants
                          }
                          className={`w-full py-3 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2
                          ${
                            isPast ||
                            isUpcoming ||
                            event.currentParticipants >= event.maxParticipants
                              ? "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                              : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-cyan-950 shadow-lg hover:shadow-xl hover:scale-105"
                          }`}
                        >
                          {participateLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-950"></div>
                          ) : isPast ? (
                            <>Event Ended</>
                          ) : isUpcoming ? (
                            <>Event Not Started</>
                          ) : event.currentParticipants >=
                            event.maxParticipants ? (
                            <>Event Full</>
                          ) : (
                            <>🎉 Join Event</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "rewards" && <RewardsSection />}

          {activeTab === "projects" && (
            <div className={`space-y-6 ${fadeIn}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                  <Coins className="w-8 h-8 text-green-500" />
                  Community Projects
                </h2>
                <button
                  onClick={() => setShowProjectFundingModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                >
                  <PlusCircle className="w-5 h-5" />
                  Fund Project
                </button>
              </div>
              <ProjectDetails />
            </div>
          )}

          {activeTab === "airdrops" && (
            <div className={`space-y-6 ${fadeIn}`}>
              <div className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3 mb-2">
                  <GiftIcon className="w-8 h-8 text-purple-500" />
                  Airdrop Distributions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and track airdrop distributions for community members
                </p>
              </div>
              <AirdropDetails />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
