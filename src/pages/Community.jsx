import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  Users,
  MessageCircle,
  Globe,
  Heart,
  Star,
  Plus,
  Calendar,
  Award,
  Gift,
  Zap,
  ArrowRight,
  Coins,
  Sparkles,
  Activity,
  X,
  PlusCircle,
  MapPin,
  Merge,
  Check,
  GiftIcon,
  Badge,
} from "lucide-react";
import { FaMedal, FaGem, FaTrophy } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import { ethers } from "ethers";
import { useEthersSigner } from "../components/useClientSigner";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { useCommunityEvents } from "../contexts/communityEventsContext";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import RewardsSection from "../components/RewardsSection";
import { useUser } from "../contexts/userContext";

const Community_ABI = CommunityABI.abi;
const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
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
  const [airdropData, setAirdropData] = useState({
    amount: "",
    addresses: "",
  });
  const [projectFundingData, setProjectFundingData] = useState({
    projectAddress: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [userBadge, setUserBadge] = useState(null);
  const signerPromise = useEthersSigner();
  const { address, isConnected } = useAccount();
  const [badgeData, setBadgeData] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [createEventLoading, setCreateEventLoading] = useState(false);
  const [distributeAirdropsLoading, setDistributeAirdropsLoading] =
    useState(false);
  const [fundProjectLoading, setFundProjectLoading] = useState(false);
  const [participateLoading, setParticipateLoading] = useState(false);
  const [joinCommunityLoading, setJoinCommunityLoading] = useState(false);

  const { events, fetchEvents } = useCommunityEvents();
  const { members, fetchMembers } = useCommunityMembers();
  const { role } = useUser();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [members]);

  console.log("Events: ", events);
  console.log("Members: ", members);

  // Fetch badge data
  const fetchBadgeData = async () => {
    if (!isConnected) return;

    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const badge = await contract.checkMemberBadge();
      setBadgeData(badge);
    } catch (error) {
      console.error("Error fetching badge data:", error);
    }
  };

  // Fetch token balance
  const fetchTokenBalance = async () => {
    if (!isConnected || !address) return;

    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const balance = await contract.balanceOf(address);
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

  //handle join community
  const handleJoinCommunity = async () => {
    setJoinCommunityLoading(true);

    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const tx = await contract.joinCommunity();
      await tx.wait();

      toast.success("You've successfully joined the community!");
      setJoinCommunityLoading(false);
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const handleCreateEvent = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    setCreateEventLoading(true);

    try {
      const startTimeUnix = new Date(eventData.startTime).getTime() / 1000;
      const endTimeUnix = new Date(eventData.endTime).getTime() / 1000;

      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const tx = await contract.createEvent(
        eventData.name,
        BigInt(startTimeUnix),
        BigInt(endTimeUnix),
        BigInt(eventData.maxParticipants),
        eventData.isOnline,
        eventData.location,
        eventData.additionalDetails
      );

      await tx.wait();

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

  // Example for handleAirdrop
  const handleAirdrop = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    setDistributeAirdropsLoading(true);

    try {
      const addressList = airdropData.addresses
        .split("\n")
        .map((addr) => addr.trim())
        .filter((addr) => addr);

      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const tx = await contract.distributeAirdrops(
        parseEther(airdropData.amount),
        addressList
      );

      await tx.wait();

      toast.success("Airdrop proposal created!");
      setShowAirdropModal(false);
      setAirdropData({
        amount: "",
        addresses: "",
      });
    } catch (error) {
      console.error("Error distributing airdrops:", error);
      toast.error("Failed to create airdrop proposal");
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
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const tx = await contract.fundCommunityProjects(
        projectFundingData.projectAddress,
        parseEther(projectFundingData.amount)
      );

      await tx.wait();

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
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const tx = await contract.participateInEvent(BigInt(eventId));
      await tx.wait();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const CreateEventModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 ease-in-out scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Community Event
          </h3>
          <button
            onClick={() => setShowCreateEventModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              value={eventData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Workshop, Hackathon, etc."
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Type *
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="isOnline"
                  className="form-radio text-yellow-500"
                  checked={eventData.isOnline}
                  onChange={() =>
                    setEventData({ ...eventData, isOnline: true })
                  }
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  Online
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="isOnline"
                  className="form-radio text-yellow-500"
                  checked={!eventData.isOnline}
                  onChange={() =>
                    setEventData({ ...eventData, isOnline: false })
                  }
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={
                eventData.isOnline
                  ? "https://meet.google.com/..."
                  : "123 Main St, City, Country"
              }
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24"
              placeholder="Dress code, items to bring, agenda, etc."
            />
          </div>

          <button
            onClick={handleCreateEvent}
            disabled={createEventLoading}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
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
      </div>
    </div>
  );

  // Modal Component for Airdrops
  const AirdropModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Distribute Airdrops
          </h3>
          <button
            onClick={() => setShowAirdropModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount per Address (LMS)
            </label>
            <input
              type="text"
              value={airdropData.amount}
              onChange={(e) =>
                setAirdropData({ ...airdropData, amount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Addresses (one per line)
            </label>
            <textarea
              value={airdropData.addresses}
              onChange={(e) =>
                setAirdropData({ ...airdropData, addresses: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32"
              placeholder="0x123...&#10;0x456...&#10;0x789..."
            />
          </div>

          <button
            onClick={handleAirdrop}
            disabled={distributeAirdropsLoading}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {distributeAirdropsLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-950"></div>
            ) : (
              <>
                <Gift className="w-5 h-5 mr-2" />
                Submit Airdrop Proposal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

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
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-6 transition-colors duration-300 pt-[100px]">
      <ToastContainer position="bottom-right" theme="colored" />

      {showCreateEventModal && <CreateEventModal />}
      {showAirdropModal && <AirdropModal />}
      {showProjectFundingModal && <ProjectFundingModal />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold dark:text-yellow-400 text-yellow-500 flex items-center">
              ABYA Community Hub
              <span className="ml-3 text-sm font-normal px-2 py-1 bg-blue-500 text-white rounded-full animate-pulse">
                Live
              </span>
            </h1>
            <p className="text-gray-400">Connect, Collaborate, Innovate</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-4 mb-8 border-b border-gray-800 pb-2">
          {["Overview", "Events", "Rewards", "Projects"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.toLowerCase()
                  ? "dark:text-white text-gray-800 border-b-2 border-yellow-500 transform translate-y-[2px]"
                  : "text-gray-500 dark:hover:text-white hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="relative flex flex-wrap items-center justify-between mb-8">
          {isConnected && (
            <>
              <div className="flex flex-wrap gap-3">
                {(role === "ADMIN" ||
                  role === "Community Manager" ||
                  role === "Reviewer") && (
                  <>
                    <button
                      onClick={() => setShowCreateEventModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                    >
                      <Calendar className="w-5 h-5" />
                      Create Event
                    </button>

                    <button
                      onClick={() => setShowAirdropModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                    >
                      <GiftIcon className="w-5 h-5" />
                      Distribute Airdrops
                    </button>

                    <button
                      onClick={() => setShowProjectFundingModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                    >
                      <Coins className="w-5 h-5" />
                      Fund Project
                    </button>
                  </>
                )}
              </div>

              {/* Join community button */}
              <div className="mt-3 sm:mt-0">
                {members.includes(address) ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg shadow-md">
                    <div className="relative">
                      <Badge className="w-5 h-5" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="font-medium">ABYA Member</span>
                  </div>
                ) : (
                  <button
                    onClick={handleJoinCommunity}
                    disabled={joinCommunityLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                  >
                    {joinCommunityLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    ) : (
                      <>
                        <Merge className="w-5 h-5" />
                        Join Community
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className={`grid md:grid-cols-3 gap-6 ${fadeIn}`}>
            {/* Community Stats */}
            <div
              className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
            >
              <h2 className="text-xl font-semibold mb-4">Community Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Users className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-gray-400">Total Members</p>
                    <p className="text-2xl font-bold">{members?.length}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Globe className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-gray-400">Countries</p>
                    <p className="text-2xl font-bold">87</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <MessageCircle className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="text-gray-400">Active Discussions</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Members */}
            <div
              className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
            >
              <h2 className="text-xl font-semibold mb-4">Featured Members</h2>
              {featuredMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 mb-4 last:mb-0"
                >
                  <img
                    src={`https://api.dicebear.com/6.x/personas/svg?seed=${Math.random()
                      .toString(36)
                      .substring(7)}`}
                    alt={member.name}
                    className="w-12 h-12 rounded-full border-2 border-blue-500"
                  />
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activities */}
            <div
              className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
            >
              <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 mb-4 last:mb-0"
                >
                  {activity.icon}
                  <div>
                    <p>{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className={`space-y-6 ${fadeIn}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Community Events</h2>
              {(role === "ADMIN" ||
                role === "Community Manager" ||
                role === "Reviewer") && (
                <button
                  onClick={() => setShowCreateEventModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-300 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Event
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-medium">No events available</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Be the first to create a community event!
                </p>
                <button
                  onClick={() => setShowCreateEventModal(true)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 rounded-lg transition-colors duration-300"
                >
                  Create Event
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {events.map((event) => {
                  // Calculate countdown
                  const now = Date.now();
                  const isUpcoming = event.startTime > now;
                  const isPast = event.endTime < now;
                  const isOngoing = !isUpcoming && !isPast;

                  // Calculate countdown values
                  const secondsToStart = Math.max(
                    0,
                    Math.floor((event.startTime - now) / 1000)
                  );
                  const days = Math.floor(secondsToStart / (60 * 60 * 24));
                  const hours = Math.floor(
                    (secondsToStart % (60 * 60 * 24)) / (60 * 60)
                  );
                  const minutes = Math.floor((secondsToStart % (60 * 60)) / 60);
                  const seconds = Math.floor(secondsToStart % 60);

                  return (
                    <div
                      key={event.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-1000 relative"
                    >
                      <div className="absolute top-4 right-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isUpcoming
                              ? "bg-blue-100 text-blue-800"
                              : isOngoing
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isUpcoming
                            ? "Upcoming"
                            : isOngoing
                            ? "Ongoing"
                            : "Past"}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold mb-2 pr-16">
                        {event.name}
                      </h2>

                      {/* Event Type Badge */}
                      <div className="inline-block mb-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            event.isOnline
                              ? "bg-purple-100 text-purple-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {event.isOnline ? "Online" : "Physical"}
                        </span>
                      </div>

                      {/* Additional Details */}
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {event.additionalDetails
                          ? event.additionalDetails
                              .substring(0, 100)
                              .trim()
                              .concat(
                                event.additionalDetails.length > 100
                                  ? "..."
                                  : ""
                              )
                          : "Join this exciting community event!"}
                      </p>

                      {/* Location - Modified to hide actual link */}
                      <div className="flex items-start gap-2 mb-3">
                        <div className="mt-0.5">
                          {event.isOnline ? (
                            <Globe className="w-5 h-5 text-blue-500" />
                          ) : (
                            <MapPin className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis">
                          {event.isOnline
                            ? "Click 'Join Event' when the event starts"
                            : event.location || "Location TBD"}
                        </p>
                      </div>

                      {/* Date and Participants */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {new Date(event.startTime).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.startTime).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-gray-500" />
                          <span className="text-sm">
                            {event.currentParticipants} /{" "}
                            {event.maxParticipants}
                          </span>
                        </div>
                      </div>

                      {/* Countdown Timer - New Addition */}
                      {isUpcoming && (
                        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                            Starting in:
                          </p>
                          <div className="flex justify-center space-x-2">
                            <div className="text-center">
                              <span className="text-sm font-bold">{days}</span>
                              <p className="text-xs">days</p>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-bold">{hours}</span>
                              <p className="text-xs">hours</p>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-bold">
                                {minutes}
                              </span>
                              <p className="text-xs">min</p>
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-bold">
                                {seconds}
                              </span>
                              <p className="text-xs">sec</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Modified Join Button with contract function call */}
                      <button
                        onClick={async () => {
                          if (!event.isOnline) {
                            // For physical events, just call the contract function
                            await handleParticipateInEvent(event.id);
                            return;
                          }

                          try {
                            // For online events, call contract first then open meeting
                            await handleParticipateInEvent(event.id);
                            // Only open the link if contract call was successful
                            window.open(event.location, "_blank");
                          } catch (error) {
                            console.error("Failed to join event:", error);
                            toast.error("Failed to join event");
                          }
                        }}
                        disabled={
                          participateLoading ||
                          isPast ||
                          isUpcoming || // Disable if event hasn't started yet
                          event.currentParticipants >= event.maxParticipants
                        }
                        className={`mt-2 w-full py-2 px-4 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center
            ${
              isPast ||
              isUpcoming ||
              event.currentParticipants >= event.maxParticipants
                ? "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600 text-cyan-950"
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
                          <>Join Event</>
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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Community Projects</h2>
              <button
                onClick={() => setShowProjectFundingModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-300 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Fund Project
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  id: 1,
                  name: "DeFi Academy",
                  description:
                    "Educational platform for learning about decentralized finance",
                  funded: "12,500 ABYATKN",
                  status: "In Development",
                  creator: "0x123...456",
                },
                {
                  id: 2,
                  name: "NFT Marketplace",
                  description: "Community-owned marketplace for digital assets",
                  funded: "24,000 ABYATKN",
                  status: "Active",
                  creator: "0x789...012",
                },
              ].map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-1000"
                >
                  <h3 className="text-lg font-bold mb-2">{project.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {project.description}
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Funded:</span>
                      <span className="font-medium">{project.funded}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`font-medium ${
                          project.status === "Active"
                            ? "text-green-500"
                            : "text-blue-500"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Creator:</span>
                      <span className="font-medium">{project.creator}</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
