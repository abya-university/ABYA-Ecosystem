import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Star,
  Award,
  BadgeCheck,
  Calendar,
  MapPin,
  Globe,
  Users,
  ChevronRight,
  ExternalLink,
  Filter,
  Grid,
  List,
  Eye,
  Download,
  Share2,
  Lock,
  Sparkles,
  Zap,
  Flame,
  Crown,
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  Clock,
  GitBranch,
  FileText,
  Key,
  Database,
  Verified,
  X,
  Bell,
  Hash,
  Activity,
} from "lucide-react";
import { useCertificates } from "../contexts/certificatesContext";
import { useDid } from "../contexts/DidContext";
import Certificate from "../components/Certificate";
import { CSSTransition } from "react-transition-group";
import "../index.css";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { useCommunityEvents } from "../contexts/communityEventsContext";
import { useActiveAccount } from "thirdweb/react";

const BADGE_DISPLAY_MAP = {
  0: {
    name: "Newcomer",
    icon: <Medal className="w-5 h-5" />,
    color: "from-gray-400 to-gray-500",
    border: "border-gray-200",
    lightBg: "bg-gray-50",
    requirements: "Join the community",
  },
  1: {
    name: "Participant",
    icon: <Star className="w-5 h-5" />,
    color: "from-amber-400 to-amber-500",
    border: "border-amber-100",
    lightBg: "bg-amber-50",
    requirements: "Complete 1+ Event",
  },
  2: {
    name: "Contributor",
    icon: <Award className="w-5 h-5" />,
    color: "from-blue-400 to-blue-500",
    border: "border-blue-100",
    lightBg: "bg-blue-50",
    requirements: "Complete 3+ Events",
  },
  3: {
    name: "Leader",
    icon: <Trophy className="w-5 h-5" />,
    color: "from-yellow-400 to-yellow-500",
    border: "border-yellow-100",
    lightBg: "bg-yellow-50",
    requirements: "Complete 5+ Events",
  },
  4: {
    name: "Champion",
    icon: <Crown className="w-5 h-5" />,
    color: "from-purple-400 to-purple-500",
    border: "border-purple-100",
    lightBg: "bg-purple-50",
    requirements: "Complete 10+ Events",
  },
};

const AchievementsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { certificates, getTokenURI } = useCertificates();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenURIs, setTokenURIs] = useState({});
  const [tokenMeta, setTokenMeta] = useState({});
  const [selectedSBT, setSelectedSBT] = useState(null);
  const [showSBTPopup, setShowSBTPopup] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [filter, setFilter] = useState("all");
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [verifiableCredentials, setVerifiableCredentials] = useState([]);
  const [vcLoading, setVcLoading] = useState(false);
  const [vcError, setVcError] = useState(null);
  const [selectedVC, setSelectedVC] = useState(null);
  const [showVCDetailPopup, setShowVCDetailPopup] = useState(false);

  const [userBadge, setUserBadge] = useState(null);
  const { memberBadgeDetails, fetchMemberBadgeDetails } = useCommunityMembers();
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
  const badgeInfo = BADGE_DISPLAY_MAP[currentBadgeLevel];
  const { events, fetchEvents } = useCommunityEvents();
  const { members, fetchMembers } = useCommunityMembers();
  const { getVerifiableCredentials } = useDid();

  // Mock ABYTKN tokens
  const abytkns = [
    {
      id: 1,
      name: "Blockchain Basics",
      value: "250 ABYTKN",
      date: "Jan 20, 2024",
      status: "claimed",
      rarity: "common",
      icon: "🔗",
    },
    {
      id: 2,
      name: "Smart Contract Mastery",
      value: "500 ABYTKN",
      date: "Feb 28, 2024",
      status: "claimed",
      rarity: "rare",
      icon: "⚡",
    },
    {
      id: 3,
      name: "Web3 Security",
      value: "750 ABYTKN",
      date: "Mar 15, 2024",
      status: "pending",
      rarity: "epic",
      icon: "🛡️",
    },
  ];

  const formatVCDate = (seconds) => {
    if (seconds === undefined || seconds === null) return "Unknown";
    const ms = Number(seconds) * 1000;
    if (Number.isNaN(ms)) return "Unknown";
    return new Date(ms).toLocaleDateString();
  };

  useEffect(() => {
    fetchEvents();
    if (address) {
      fetchMemberBadgeDetails(address);
    }
    fetchMembers();
  }, [address]);

  useEffect(() => {
    if (memberBadgeDetails) {
      setUserBadge(memberBadgeDetails.currentBadge);
    }
  }, [memberBadgeDetails]);

  useEffect(() => {
    const fetchVCs = async () => {
      if (!address || !getVerifiableCredentials) return;
      setVcLoading(true);
      setVcError(null);

      try {
        const vcs = await getVerifiableCredentials(address);
        setVerifiableCredentials(Array.isArray(vcs) ? vcs : []);
      } catch (error) {
        console.error("Failed to load VCs:", error);
        setVcError(error?.message || "Failed to load verifiable credentials");
      } finally {
        setVcLoading(false);
      }
    };

    fetchVCs();
  }, [address, getVerifiableCredentials]);

  useEffect(() => {
    const fetchTokenURIs = async () => {
      if (!certificates || certificates.length === 0) return;
      const uris = {};
      for (const cert of certificates) {
        if (cert.certificateId) {
          const uri = await getTokenURI(cert.certificateId);
          if (uri) {
            uris[cert.certificateId] = uri;
          }
        }
      }
      setTokenURIs(uris);
    };
    fetchTokenURIs();
  }, [certificates, getTokenURI]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!tokenURIs || Object.keys(tokenURIs).length === 0) return;
      const metaMap = {};
      await Promise.all(
        Object.entries(tokenURIs).map(async ([tokenId, uri]) => {
          try {
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${uri}`);
            if (res.ok) {
              const json = await res.json();
              metaMap[tokenId] = json;
            }
          } catch (err) {
            console.error("Metadata fetch failed:", err);
          }
        }),
      );
      setTokenMeta(metaMap);
    };
    fetchMeta();
  }, [tokenURIs]);

  const handleSBTSelect = (cert, meta) => {
    const imageCid = meta?.image?.replace("ipfs://", "");
    setSelectedSBT({
      cert,
      meta,
      imageUrl: imageCid
        ? `https://gateway.pinata.cloud/ipfs/${imageCid}`
        : null,
    });
    setShowSBTPopup(true);
  };

  const handleCertificateClick = (cert) => {
    setSelectedCertificate(cert);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTimeout(() => setSelectedCertificate(null), 300);
  };

  const handleEventDetailsClick = (event) => {
    setSelectedEvent(event);
    setShowEventPopup(true);
  };

  const getEventStatus = (startTime, endTime) => {
    const now = Date.now();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "past";
    return "ongoing";
  };

  const getEventStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "past":
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleParticipateInEvent = async (eventId) => {
    // Implement your contract interaction here
    console.log("Participating in event:", eventId);
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (filter === "claimed") return cert.status === "claimed";
    if (filter === "pending") return cert.status === "pending";
    return true;
  });

  const getRarityColor = (rarity) => {
    const colors = {
      legendary: "bg-gradient-to-r from-purple-500 to-pink-500",
      epic: "bg-gradient-to-r from-orange-500 to-red-500",
      rare: "bg-gradient-to-r from-blue-500 to-cyan-500",
      common: "bg-gradient-to-r from-green-500 to-emerald-500",
    };
    return colors[rarity.toLowerCase()] || colors.common;
  };

  const getVCStatusColor = (status) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "expiring":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "revoked":
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVCTypeIcon = (type) => {
    switch (type) {
      case "Identity":
        return <Shield className="w-4 h-4" />;
      case "Education":
        return <FileText className="w-4 h-4" />;
      case "Professional":
        return <BadgeCheck className="w-4 h-4" />;
      default:
        return <Key className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Achievements Hub
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress, collect SBTs, and earn rewards
              </p>
            </div>

            {/* Stats Summary */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                  <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Badge</p>
                  <p className="font-semibold">{badgeInfo?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                  <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">SBTs</p>
                  <p className="font-semibold">{certificates.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - SBT Collection & Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* SBT Collection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        Soulbound Tokens
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your non-transferable digital achievements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setViewMode(viewMode === "grid" ? "list" : "grid")
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={viewMode === "grid" ? "List view" : "Grid view"}
                    >
                      {viewMode === "grid" ? (
                        <List className="w-5 h-5" />
                      ) : (
                        <Grid className="w-5 h-5" />
                      )}
                    </button>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                    >
                      <option value="all">All SBTs</option>
                      <option value="claimed">Claimed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {certificates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      No SBTs yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Complete courses and events to earn your first SBT
                    </p>
                  </div>
                ) : (
                  <div
                    className={`gap-4 ${
                      viewMode === "grid"
                        ? "grid grid-cols-2 sm:grid-cols-3"
                        : "space-y-3"
                    }`}
                  >
                    {filteredCertificates.map((cert, index) => {
                      const tokenIdKey = cert.certificateId?.toString();
                      const tokenURI = tokenURIs[tokenIdKey];
                      const meta = tokenMeta[tokenIdKey];
                      const imageCid = meta?.image?.replace("ipfs://", "");
                      const imageUrl = imageCid
                        ? `https://gateway.pinata.cloud/ipfs/${imageCid}`
                        : null;

                      return (
                        <div
                          key={index}
                          className={`group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                            viewMode === "grid" ? "aspect-square" : ""
                          }`}
                          onClick={() =>
                            imageUrl && handleSBTSelect(cert, meta)
                          }
                        >
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden h-full">
                            {/* NFT Preview */}
                            <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={cert.courseName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                #{cert.certificateId?.toString().slice(0, 6)}...
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {cert.courseName}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {cert.cert_issuer}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(
                                    Number(cert.issue_date) * 1000,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200 rounded-full">
                                  SBT
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Community Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        Community Events
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Participate and earn rewards
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {events?.length || 0} events
                  </div>
                </div>
              </div>
              <div className="p-6">
                {!events || events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No upcoming events
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 4).map((event) => {
                      const eventStatus = getEventStatus(
                        event.startTime,
                        event.endTime,
                      );
                      const isUpcoming = eventStatus === "upcoming";
                      const isOngoing = eventStatus === "ongoing";

                      return (
                        <div
                          key={event.id}
                          className="group p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handleEventDetailsClick(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {event.name}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getEventStatusColor(
                                    eventStatus,
                                  )}`}
                                >
                                  {eventStatus === "upcoming"
                                    ? "Upcoming"
                                    : eventStatus === "ongoing"
                                    ? "Ongoing"
                                    : "Past"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {event.description ||
                                  "Community gathering event"}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(
                                    event.startTime,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  {event.isOnline ? (
                                    <Globe className="w-4 h-4" />
                                  ) : (
                                    <MapPin className="w-4 h-4" />
                                  )}
                                  {event.isOnline
                                    ? "Online"
                                    : event.location || "TBD"}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Users className="w-4 h-4" />
                                  {event.currentParticipants}/
                                  {event.maxParticipants}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform ml-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {events && events.length > 4 && (
                  <div className="mt-6 text-center">
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      View all events ({events.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats, Badges, Tokens, VCs */}
          <div className="space-y-6">
            {/* User Stats Card */}
            <div className="dark:bg-gradient-to-br from-gray-900 to-gray-800 dark:text-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Progress</h3>
                  <p className="text-sm dark:text-gray-300">
                    Track your achievements
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">Current Badge</span>
                  <span className="font-semibold flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${badgeInfo?.color}`}
                    ></div>
                    {badgeInfo?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">SBTs Collected</span>
                  <span className="font-semibold">{certificates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">Events Attended</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">ABYTKN Balance</span>
                  <span className="font-semibold">1,500</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <Flame className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      Level {currentBadgeLevel + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Badge Journey</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Progress through ranks
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(BADGE_DISPLAY_MAP).map(([level, badge]) => {
                    const levelNum = parseInt(level);
                    const isUnlocked = levelNum <= currentBadgeLevel;
                    const isCurrent = levelNum === currentBadgeLevel;

                    return (
                      <div
                        key={level}
                        className={`relative p-4 rounded-xl border transition-all duration-300 ${
                          isCurrent
                            ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700"
                            : isUnlocked
                            ? "bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                            : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              isUnlocked
                                ? `bg-gradient-to-r ${badge.color}`
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <div
                              className={
                                isUnlocked ? "text-white" : "text-gray-400"
                              }
                            >
                              {badge.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-semibold ${
                                isCurrent
                                  ? "text-yellow-700 dark:text-yellow-300"
                                  : ""
                              }`}
                            >
                              {badge.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {badge.requirements}
                            </p>
                          </div>
                          {isUnlocked && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ABYTKN Tokens */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">ABYTKN Rewards</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Earn tokens for participation
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {abytkns.map((token) => (
                    <div
                      key={token.id}
                      className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                        token.status === "claimed"
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-100 dark:border-green-800"
                          : "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-yellow-100 dark:border-yellow-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{token.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {token.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {token.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getRarityColor(
                              token.rarity,
                            )} bg-clip-text text-transparent`}
                          >
                            {token.value}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              token.status === "claimed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {token.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NEW: Verifiable Credentials Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Verified className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      Verifiable Credentials
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your verified identity documents
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {vcLoading && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
                      Loading verifiable credentials...
                    </div>
                  )}

                  {!vcLoading && vcError && (
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                      {vcError}
                    </div>
                  )}

                  {!vcLoading &&
                    !vcError &&
                    verifiableCredentials.length === 0 && (
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
                        No verifiable credentials found for this wallet.
                      </div>
                    )}

                  {verifiableCredentials.map((vc, index) => {
                    const vcType = Array.isArray(vc.credentialType)
                      ? vc.credentialType.find(
                          (t) => t !== "VerifiableCredential",
                        ) || vc.credentialType[0]
                      : vc.credentialType;
                    const vcStatus = "valid";
                    const issuedAt = formatVCDate(vc.issuanceDate);

                    return (
                      <div
                        key={`${vc.credentialID ?? index}-${vc.owner ?? "vc"}`}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex-shrink-0">
                              {getVCTypeIcon(vcType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {vc.course || "Verifiable Credential"}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Issued by {vc.issuer}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                Subject: {vc.subject}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                ID: {vc.credentialID}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getVCStatusColor(
                                    vcStatus,
                                  )}`}
                                >
                                  {vcStatus}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {vcType || "Credential"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Issued {issuedAt}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedVC(vc);
                              setShowVCDetailPopup(true);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                            title="View full VC details"
                          >
                            <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Popup */}
        <CSSTransition
          in={showEventPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative max-w-2xl w-full mx-4">
              {selectedEvent && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedEvent.name}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`text-sm px-3 py-1 rounded-full ${getEventStatusColor(
                              getEventStatus(
                                selectedEvent.startTime,
                                selectedEvent.endTime,
                              ),
                            )}`}
                          >
                            {getEventStatus(
                              selectedEvent.startTime,
                              selectedEvent.endTime,
                            )}
                          </span>
                          <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            {selectedEvent.isOnline ? "Online" : "In-person"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEventPopup(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Event Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Start Date
                        </p>
                        <p className="font-medium">
                          {new Date(
                            selectedEvent.startTime,
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(
                            selectedEvent.startTime,
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          End Date
                        </p>
                        <p className="font-medium">
                          {new Date(selectedEvent.endTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(selectedEvent.endTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Location & Participants */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        {selectedEvent.isOnline ? (
                          <Globe className="w-5 h-5 text-blue-500" />
                        ) : (
                          <MapPin className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Location
                          </p>
                          <p className="font-medium">
                            {selectedEvent.isOnline
                              ? "Online Event"
                              : selectedEvent.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Participants
                          </p>
                          <p className="font-medium">
                            {selectedEvent.currentParticipants} /{" "}
                            {selectedEvent.maxParticipants}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedEvent.description && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Description
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() =>
                          handleParticipateInEvent(selectedEvent.id)
                        }
                        disabled={
                          getEventStatus(
                            selectedEvent.startTime,
                            selectedEvent.endTime,
                          ) !== "ongoing" ||
                          selectedEvent.currentParticipants >=
                            selectedEvent.maxParticipants
                        }
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                          getEventStatus(
                            selectedEvent.startTime,
                            selectedEvent.endTime,
                          ) === "ongoing" &&
                          selectedEvent.currentParticipants <
                            selectedEvent.maxParticipants
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {getEventStatus(
                          selectedEvent.startTime,
                          selectedEvent.endTime,
                        ) === "upcoming"
                          ? "Event Starting Soon"
                          : getEventStatus(
                              selectedEvent.startTime,
                              selectedEvent.endTime,
                            ) === "ongoing"
                          ? selectedEvent.currentParticipants >=
                            selectedEvent.maxParticipants
                            ? "Event Full"
                            : "Join Event"
                          : "Event Ended"}
                      </button>
                      <button className="py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>

        {/* Certificate Popup */}
        <CSSTransition
          in={showPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative max-w-6xl w-full mx-4 mt-[60px]">
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-red-500 hover:bg-white/20 text-white backdrop-blur-lg"
              >
                <X className="w-6 h-6" />
              </button>
              {selectedCertificate && (
                <Certificate certificateData={selectedCertificate} />
              )}
            </div>
          </div>
        </CSSTransition>

        {/* SBT Popup */}
        <CSSTransition
          in={showSBTPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
              className="relative max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSBTPopup(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg"
              >
                <X className="w-6 h-6" />
              </button>

              {selectedSBT && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                  {selectedSBT.imageUrl ? (
                    <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                      <img
                        src={selectedSBT.imageUrl}
                        alt={selectedSBT.cert.courseName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                        #
                        {selectedSBT.cert.certificateId?.toString().slice(0, 8)}
                        ...
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedSBT.cert.courseName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Issued by {selectedSBT.cert.cert_issuer}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowSBTPopup(false);
                          handleCertificateClick(selectedSBT.cert);
                        }}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        View Certificate
                      </button>
                      <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>

        {/* VC Details Popup */}
        <CSSTransition
          in={showVCDetailPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setShowVCDetailPopup(false)}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedVC && (
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                        {getVCTypeIcon(
                          Array.isArray(selectedVC.credentialType)
                            ? selectedVC.credentialType.find(
                                (t) => t !== "VerifiableCredential",
                              ) || selectedVC.credentialType[0]
                            : selectedVC.credentialType,
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedVC.course || "Verifiable Credential"}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {Array.isArray(selectedVC.credentialType)
                            ? selectedVC.credentialType.join(", ")
                            : selectedVC.credentialType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid of details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Issuer Details */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Issuer Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issuer
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.issuer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issuer DID
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.issuerDID || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subject Details */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" />
                        Subject Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Subject
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.subject}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Subject DID
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.subjectDID || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credential Details */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Credential Details
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Credential ID
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.credentialID}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Course
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.course}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Dates
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issued
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatVCDate(selectedVC.issuanceDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Owner Address
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.owner}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={() => setShowVCDetailPopup(false)}
                      className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>
      </div>
    </div>
  );
};

export default AchievementsPage;
