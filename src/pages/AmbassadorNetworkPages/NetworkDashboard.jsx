import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  Activity,
  Globe,
  Users2,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  TrendingUp,
  Award,
  Shield,
  Sparkles,
  Link2,
  Wallet,
  UserCheck,
  GraduationCap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getContract,
  readContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ethers } from "ethers";
import { useDarkMode } from "../../contexts/themeContext";
import { useAmbassadorNetwork } from "../../contexts/ambassadorNetworkContext";
import { useDid } from "../../contexts/DidContext";
import { useUser } from "../../contexts/userContext";
import { client } from "../../services/client";
import UsdCoinABI from "../../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";
import CONTRACT_ADDRESSES from "../../constants/addresses";
import AmbassadorNetworkFacetABI from "../../artifacts/contracts/AmbassadorNetworkFacet.sol/AmbassadorNetworkFacet.json";

export default function NetworkDashboard() {
  const { darkMode } = useDarkMode();
  const {
    ambassadorDetails,
    fetchAmbassadors,
    registerFoundingAmbassador,
    registerGeneralAmbassador,
    deregisterFoundingAmbassador,
    deregisterGeneralAmbassador,
  } = useAmbassadorNetwork();
  const { enrolledCourses, role, refreshRole } = useUser();
  const account = useActiveAccount();
  const { did } = useDid();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sponsorAddress, setSponsorAddress] = useState("");
  const [userAmbassadorDetails, setUserAmbassadorDetails] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // USDC configuration
  const USDC_ADDRESS = import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS;
  const REGISTRATION_FEE = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)
  const USDC_ABI = UsdCoinABI.abi;

  // Pre-fill sponsor address from URL parameter
  useEffect(() => {
    const sponsorFromUrl = searchParams.get("sponsor");
    if (sponsorFromUrl && /^0x[a-fA-F0-9]{40}$/.test(sponsorFromUrl)) {
      setSponsorAddress(sponsorFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!account?.address || !fetchAmbassadors) return;
    fetchAmbassadors().catch((error) => {
      console.error("Failed to fetch ambassador details:", error);
    });
  }, [account?.address, fetchAmbassadors]);

  // Refetch ambassadors when role changes (after registration)
  useEffect(() => {
    if (
      role &&
      (role === "Founding Ambassador" || role === "General Ambassador") &&
      account?.address
    ) {
      const fetchUserDetails = async () => {
        try {
          const diamondContract = await getContract({
            address: CONTRACT_ADDRESSES.diamond,
            abi: AmbassadorNetworkFacetABI.abi,
            client,
            chain: defineChain(11155111), // Sepolia
          });

          const details = await readContract({
            contract: diamondContract,
            method:
              "function getAmbassadorDetails(address _ambassador) view returns (bytes32 did, uint8 tier, uint8 level, address sponsor, address leftLeg, address rightLeg, uint256 totalDownlineSales, uint256 lifetimeCommissions, bool isActive)",
            params: [account.address],
          });

          const ambassadorData = {
            address: account.address,
            did: details[0],
            tier: details[1],
            level: details[2],
            sponsor: details[3],
            leftLeg: details[4],
            rightLeg: details[5],
            totalDownlineSales: details[6],
            lifetimeCommissions: details[7],
            isActive: details[8],
          };

          setUserAmbassadorDetails(ambassadorData);
        } catch (error) {
          console.error("Error fetching user ambassador details:", error);
        }
      };

      fetchUserDetails();
    }
  }, [role, account?.address]);

  // Memoized check for subordinates - only recalculates when userAmbassadorDetails changes
  const hasSubordinates = useMemo(() => {
    if (!userAmbassadorDetails) return false;

    const hasLeftLeg =
      userAmbassadorDetails.leftLeg &&
      userAmbassadorDetails.leftLeg !==
        "0x0000000000000000000000000000000000000000";
    const hasRightLeg =
      userAmbassadorDetails.rightLeg &&
      userAmbassadorDetails.rightLeg !==
        "0x0000000000000000000000000000000000000000";

    return hasLeftLeg || hasRightLeg;
  }, [userAmbassadorDetails]);

  // Memoized refund percentage calculation
  const refundPercentage = useMemo(() => {
    // Since we don't have entry timestamp from contract, provide general refund info
    // You can add entry timestamp to contract response if needed
    return {
      threeDay: 80,
      tenDay: 50,
      thirtyDay: 15,
      beyond: 5,
    };
  }, []);

  const handleFoundingRegister = async (event) => {
    if (event) event.preventDefault();
    setStatusMessage("");
    if (!registerFoundingAmbassador) return;
    if (!account?.address || !did) {
      const error = "Wallet address and DID are required.";
      setStatusMessage(error);
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Check current USDC allowance
      const usdcContract = await getContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
      });

      let allowanceToastId = toast.loading("Checking USDC allowance...");
      const currentAllowance = await readContract({
        contract: usdcContract,
        method:
          "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, CONTRACT_ADDRESSES.diamond],
      });

      const allowanceAmount = ethers.toBigInt(currentAllowance);

      // Step 2: If allowance is insufficient, request approval
      if (allowanceAmount < REGISTRATION_FEE) {
        toast.update(allowanceToastId, {
          render: "Requesting USDC approval...",
          type: "loading",
          isLoading: true,
        });

        // Prepare approve transaction
        const approveTx = prepareContractCall({
          contract: usdcContract,
          method:
            "function approve(address spender, uint256 amount) returns (bool)",
          params: [CONTRACT_ADDRESSES.diamond, REGISTRATION_FEE],
        });

        // Send approve transaction
        const approveResult = await sendTransaction({
          account,
          transaction: approveTx,
        });

        toast.update(allowanceToastId, {
          render: "USDC approval successful!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.dismiss(allowanceToastId);
      }

      // Step 3: Register as founding ambassador
      const registerToastId = toast.loading(
        "Registering as founding ambassador...",
      );
      await registerFoundingAmbassador(account.address, did);

      toast.update(registerToastId, {
        render: "Successfully registered as founding ambassador!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
      setStatusMessage("Founding ambassador registration successful!");

      // Step 4: Refresh ambassador list to update UI
      await fetchAmbassadors();

      // Step 5: Refresh user role to update the badge
      await refreshRole();
    } catch (error) {
      console.error("Failed to register founding ambassador:", error);
      const errorMsg =
        error.message || "Registration failed. Please try again.";
      setStatusMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneralRegister = () => {
    // Preserve sponsor parameter when navigating to courses
    const sponsorParam = sponsorAddress ? `&sponsor=${sponsorAddress}` : "";
    navigate(`/mainpage?section=courses${sponsorParam}`);
  };

  const handleGeneralAmbassadorRegister = async (event) => {
    if (event) event.preventDefault();
    setStatusMessage("");
    if (!registerGeneralAmbassador) return;
    if (!account?.address || !did) {
      const error = "Wallet address and DID are required.";
      setStatusMessage(error);
      toast.error(error);
      return;
    }

    if (!sponsorAddress || sponsorAddress.trim() === "") {
      const error = "Sponsor address is required.";
      setStatusMessage(error);
      toast.error(error);
      return;
    }

    // Validate that user has enrolled courses
    if (!enrolledCourses || enrolledCourses.length === 0) {
      const error =
        "You must be enrolled in at least one course to become a general ambassador.";
      setStatusMessage(error);
      toast.error(error);
      return;
    }

    setIsSubmittingGeneral(true);
    const toastId = toast.loading("Registering as general ambassador...");
    try {
      // Get the first enrolled course ID for registration
      const firstCourse = enrolledCourses[0];
      const firstCourseId = firstCourse?.courseId;

      if (firstCourseId === undefined || firstCourseId === null) {
        throw new Error(
          "Course ID not found. Please ensure you're enrolled in a valid course.",
        );
      }

      await registerGeneralAmbassador(sponsorAddress, did, firstCourseId);
      toast.update(toastId, {
        render: "Successfully registered as general ambassador!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
      setStatusMessage("General ambassador registration successful!");
      // Refresh ambassador list to update UI
      await fetchAmbassadors();

      // Refresh user role to update the badge
      await refreshRole();
    } catch (error) {
      console.error("Failed to register as general ambassador:", error);
      const errorMsg =
        error.message || "Registration failed. Please try again.";
      setStatusMessage(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setIsSubmittingGeneral(false);
    }
  };

  const ambassadorList = Array.isArray(ambassadorDetails)
    ? ambassadorDetails
    : [];

  // Calculate total USDC from enrolled courses
  const totalEnrolledUSDC = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;

    return enrolledCourses.reduce((total, course) => {
      const priceUSDC = Number(course.priceUSDC || 0);
      return total + (isNaN(priceUSDC) ? 0 : priceUSDC);
    }, 0);
  }, [enrolledCourses]);

  const isQualifiedForGeneralAmbassador = totalEnrolledUSDC >= 50;

  // Check if current user is founding or general ambassador
  const userAmbassadorStatus = useMemo(() => {
    if (!account?.address) return null;

    const userAmbassador = ambassadorList.find(
      (amb) => amb.address?.toLowerCase() === account.address.toLowerCase(),
    );

    return userAmbassador;
  }, [ambassadorList, account?.address]);

  const isFoundingAmbassador = !!userAmbassadorStatus;
  const isGeneralAmbassador = !!userAmbassadorStatus;

  // Generate referral link
  const generateReferralLink = () => {
    if (!account?.address) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/networkMainpage?sponsor=${account.address}`;
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    const link = generateReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToClipboard(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  const totals = useMemo(() => {
    return ambassadorList.reduce(
      (accumulator, ambassador) => {
        const downlineSales = Number(ambassador.totalDownlineSales || 0);
        const commissions = Number(ambassador.lifetimeCommissions || 0);
        const isActive = ambassador.isActive === true;

        return {
          totalDownlineSales:
            accumulator.totalDownlineSales +
            (Number.isNaN(downlineSales) ? 0 : downlineSales),
          totalCommissions:
            accumulator.totalCommissions +
            (Number.isNaN(commissions) ? 0 : commissions),
          activeCount: accumulator.activeCount + (isActive ? 1 : 0),
        };
      },
      { totalDownlineSales: 0, totalCommissions: 0, activeCount: 0 },
    );
  }, [ambassadorList]);

  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-slate-600/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70 hover:border-slate-300/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  return (
    <section className="space-y-8">
      {/* Header with modern gradient */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-transparent p-8">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-600 dark:text-yellow-400">
              <Sparkles className="h-4 w-4" />
              <span>Ambassador Network</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Network Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
              Track growth, manage your community, and stay on top of ambassador
              performance with real-time analytics.
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
                <span className="font-semibold">{role}</span>
              </div>
            )}
        </div>
      </header>

      {/* Stats Cards with modern design */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Active Ambassadors",
            value: totals.activeCount || 0,
            icon: Users2,
            gradient: "from-blue-500/20 to-cyan-500/20",
            iconColor: "text-blue-600 dark:text-blue-400",
          },
          {
            title: "Total Downline Sales",
            value: `$${totals.totalDownlineSales?.toLocaleString() || "0"}`,
            icon: TrendingUp,
            gradient: "from-green-500/20 to-emerald-500/20",
            iconColor: "text-green-600 dark:text-green-400",
          },
          {
            title: "Total Commissions",
            value: `$${totals.totalCommissions?.toLocaleString() || "0"}`,
            icon: Award,
            gradient: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-600 dark:text-purple-400",
          },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${cardStyle}`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-3 ${card.iconColor} bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="relative mt-4 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-1 rounded-full bg-gradient-to-r ${card.gradient.replace(
                    "/20",
                    "",
                  )}`}
                  style={{ width: hoveredCard === index ? "100%" : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* User Ambassador Profile - Modern Card */}
      {userAmbassadorDetails ? (
        <div
          className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl ${cardStyle}`}
        >
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-2xl p-4 ${
                    userAmbassadorDetails.tier === 2
                      ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/20"
                      : "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                  }`}
                >
                  <Shield
                    className={`h-8 w-8 ${
                      userAmbassadorDetails.tier === 2
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Your Ambassador Profile
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        userAmbassadorDetails.tier === 2
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {userAmbassadorDetails.tier === 2
                        ? "Founding"
                        : "General"}{" "}
                      Ambassador
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Level {userAmbassadorDetails.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Referral Section */}
              {userAmbassadorDetails.tier === 2 && (
                <div className="w-full lg:w-96">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                      <Link2 className="h-5 w-5" />
                      <p className="font-semibold">Share Your Network</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      Invite new ambassadors and earn commissions from their
                      network growth!
                    </p>
                    <button
                      onClick={copyReferralLink}
                      className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <div className="relative flex items-center justify-center gap-2">
                        {copiedToClipboard ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied to Clipboard!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Referral Link
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ambassador Details Grid */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-100/50 p-4 dark:bg-slate-800/50 backdrop-blur-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      userAmbassadorDetails.isActive
                        ? "bg-green-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  />
                  <p className="font-semibold">
                    {userAmbassadorDetails.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100/50 p-4 dark:bg-slate-800/50 backdrop-blur-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Downline Sales
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  $
                  {Number(
                    userAmbassadorDetails.totalDownlineSales || 0,
                  ).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100/50 p-4 dark:bg-slate-800/50 backdrop-blur-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Lifetime Commissions
                </p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  $
                  {Number(
                    userAmbassadorDetails.lifetimeCommissions || 0,
                  ).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100/50 p-4 dark:bg-slate-800/50 backdrop-blur-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  DID Hash
                </p>
                <p
                  className="font-mono text-xs truncate"
                  title={userAmbassadorDetails.did}
                >
                  {userAmbassadorDetails.did?.slice(0, 10)}...
                  {userAmbassadorDetails.did?.slice(-8)}
                </p>
              </div>

              {userAmbassadorDetails.sponsor &&
                userAmbassadorDetails.sponsor !==
                  "0x0000000000000000000000000000000000000000" && (
                  <div className="rounded-xl bg-slate-100/50 p-4 dark:bg-slate-800/50 backdrop-blur-sm lg:col-span-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Sponsor
                    </p>
                    <p className="font-mono text-sm">
                      {userAmbassadorDetails.sponsor.slice(0, 6)}...
                      {userAmbassadorDetails.sponsor.slice(-4)}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      ) : role === "Founding Ambassador" || role === "General Ambassador" ? (
        <div className={`rounded-3xl border p-12 ${cardStyle}`}>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-yellow-500 dark:border-slate-600 dark:border-t-yellow-400"></div>
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-yellow-500/20"></div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Loading your ambassador profile...
            </p>
          </div>
        </div>
      ) : null}

      {/* Today's Focus - Modern Card */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 ${glassCardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Today's Focus
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Prioritize regional meetups, highlight top referrers, and queue
            content drops for the next ambassador wave.
          </p>
        </div>
      </div>

      {/* Registration Section */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 ${glassCardStyle}`}
      >
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-yellow-500/10 to-green-500/10 blur-3xl" />

        <div className="relative space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Become an Ambassador</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Join our network and start earning commissions through education
              and referrals.
            </p>
          </div>

          {userAmbassadorStatus ? (
            /* Already Registered - Show warning with de-register button */
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 border border-amber-500/20">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-300">
                        Already registered as{" "}
                        {userAmbassadorStatus.tier === 2
                          ? "Founding"
                          : "General"}{" "}
                        Ambassador
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        You cannot register as multiple ambassador types.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* De-registration Section */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    De-registration
                  </h3>
                </div>

                {/* Check if has subordinates */}
                {hasSubordinates || userAmbassadorStatus.isActive ? (
                  /* Has subordinates - Cannot de-register */
                  <div className="space-y-3">
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-700 dark:text-red-300 mb-2">
                            De-registration Not Available
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            You cannot de-register because:
                          </p>
                          <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
                            {hasSubordinates && (
                              <li>
                                You have active subordinates in your network
                                (left or right leg)
                              </li>
                            )}
                            {userAmbassadorStatus.isActive && (
                              <li>
                                Your account is active with direct recruits
                              </li>
                            )}
                          </ul>
                          <p className="text-xs text-red-500 dark:text-red-400 mt-3 italic">
                            Note: The contract requires you to have no
                            subordinates and withdraw all commissions before
                            de-registering.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      disabled
                      className="w-full rounded-xl bg-slate-400 dark:bg-slate-700 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed opacity-50"
                    >
                      De-register (Not Available)
                    </button>
                  </div>
                ) : (
                  /* Can de-register */
                  <div className="space-y-4">
                    {/* Refund Information for Founding Ambassadors */}
                    {userAmbassadorStatus.tier === 2 && (
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                              Refund Information
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                              Your refund amount depends on how long you've been
                              an ambassador:
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-blue-600 dark:text-blue-400">
                              <p>
                                • 0-3 days: {refundPercentage.threeDay}% refund
                                (80 USDC)
                              </p>
                              <p>
                                • 3-10 days: {refundPercentage.tenDay}% refund
                                (50 USDC)
                              </p>
                              <p>
                                • 10-30 days: {refundPercentage.thirtyDay}%
                                refund (15 USDC)
                              </p>
                              <p>
                                • 30+ days: {refundPercentage.beyond}% refund (5
                                USDC)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* General Ambassador - No Refund */}
                    {userAmbassadorStatus.tier === 1 && (
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-700">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                              No Refund for General Ambassadors
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              General ambassadors do not receive refunds upon
                              de-registration as entry was through course
                              enrollment.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consequences Warning */}
                    <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4 border border-slate-300 dark:border-slate-600">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-sm">
                        ⚠️ You will lose access to:
                      </p>
                      <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>Your ambassador network and downline</li>
                        <li>Future commission earnings</li>
                        <li>Ambassador benefits and privileges</li>
                        <li>Your referral link and recruitment ability</li>
                      </ul>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                        Make sure to withdraw any pending commissions and claim
                        vested tokens before de-registering.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Are you absolutely sure you want to de-register as a ${
                            userAmbassadorStatus.tier === 2
                              ? "Founding"
                              : "General"
                          } Ambassador? This action cannot be undone.`,
                        );

                        if (!confirmed) return;

                        try {
                          if (userAmbassadorStatus.tier === 2) {
                            await deregisterFoundingAmbassador();
                            toast.success(
                              "Successfully de-registered as Founding Ambassador!",
                            );
                          } else {
                            await deregisterGeneralAmbassador();
                            toast.success(
                              "Successfully de-registered as General Ambassador!",
                            );
                          }
                          await fetchAmbassadors();
                          await refreshRole();
                        } catch (error) {
                          console.error("De-registration failed:", error);
                          toast.error(
                            error.message || "De-registration failed",
                          );
                        }
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
                    >
                      Confirm De-registration
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {!userAmbassadorStatus && statusMessage && (
            <div
              className={`rounded-xl p-4 flex gap-3 ${
                statusMessage.includes("successful")
                  ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-700 dark:text-green-300"
                  : "bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
              }`}
            >
              {statusMessage.includes("successful") ? (
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}

          {!userAmbassadorStatus && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Founding Ambassador Section */}
              <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent p-6 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-xl bg-yellow-500/20 p-3">
                      <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        Founding Ambassador
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Lead the network from day one
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-slate-100/50 p-3 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-slate-500" />
                          <span className="text-sm">Wallet</span>
                        </div>
                        <p className="font-mono text-sm">
                          {account?.address
                            ? `${account.address.slice(
                                0,
                                6,
                              )}...${account.address.slice(-4)}`
                            : "Not connected"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-100/50 p-3 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-slate-500" />
                          <span className="text-sm">DID Status</span>
                        </div>
                        {did ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Ready</span>
                          </span>
                        ) : (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            Initializing...
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleFoundingRegister}
                      disabled={
                        isSubmitting || !did || !account?.address || loading
                      }
                      className="group/btn relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isSubmitting
                          ? "Registering..."
                          : "Become Founding Ambassador"}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      One-time fee:{" "}
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        100 USDC
                      </span>
                    </p>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      Note: First founder has no sponsor. Subsequent founders
                      require one.
                    </p>
                  </div>
                </div>
              </div>

              {/* General Ambassador Section */}
              <div className="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-xl bg-green-500/20 p-3">
                      <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        General Ambassador
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Enroll in courses to qualify
                      </p>
                    </div>
                  </div>

                  {isQualifiedForGeneralAmbassador ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <p className="font-semibold text-green-700 dark:text-green-300">
                            You're qualified!
                          </p>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Total spent: ${totalEnrolledUSDC.toFixed(2)} USDC
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-slate-100/50 p-3 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">Wallet</span>
                          </div>
                          <p className="font-mono text-sm">
                            {account?.address
                              ? `${account.address.slice(
                                  0,
                                  6,
                                )}...${account.address.slice(-4)}`
                              : "Not connected"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-slate-100/50 p-3 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">DID Status</span>
                          </div>
                          {did ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Ready</span>
                            </span>
                          ) : (
                            <span className="text-sm text-amber-600 dark:text-amber-400">
                              Initializing...
                            </span>
                          )}
                        </div>

                        <div className="rounded-lg bg-slate-100/50 p-4 dark:bg-slate-800/50">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Sponsor Address
                          </label>
                          <input
                            type="text"
                            placeholder="0x..."
                            value={sponsorAddress}
                            onChange={(e) => setSponsorAddress(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white/50 px-4 py-3 text-sm font-mono focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100"
                          />
                          {sponsorAddress &&
                            /^0x[a-fA-F0-9]{40}$/.test(sponsorAddress) && (
                              <p className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Valid sponsor address detected
                              </p>
                            )}
                        </div>

                        <button
                          onClick={handleGeneralAmbassadorRegister}
                          disabled={
                            isSubmittingGeneral ||
                            !did ||
                            !account?.address ||
                            loading ||
                            !sponsorAddress
                          }
                          className="group/btn relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                          <span className="relative flex items-center justify-center gap-2">
                            {isSubmittingGeneral
                              ? "Registering..."
                              : "Become General Ambassador"}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4 border border-amber-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <p className="font-semibold text-amber-700 dark:text-amber-300">
                            Not yet qualified
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            Current spend:{" "}
                            <span className="font-semibold">
                              ${totalEnrolledUSDC.toFixed(2)} USDC
                            </span>
                          </p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            Required:{" "}
                            <span className="font-semibold">$50.00 USDC</span>
                          </p>
                        </div>
                      </div>

                      {sponsorAddress && (
                        <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border border-blue-500/20">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            Sponsor Address
                          </p>
                          <p className="font-mono text-sm break-all">
                            {sponsorAddress.slice(0, 6)}...
                            {sponsorAddress.slice(-4)}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleGeneralRegister}
                        className="group/btn relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg dark:from-slate-700 dark:to-slate-800"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                        <span className="relative flex items-center justify-center gap-2">
                          View Courses to Enroll
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </button>

                      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                        Fees vary by course
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
