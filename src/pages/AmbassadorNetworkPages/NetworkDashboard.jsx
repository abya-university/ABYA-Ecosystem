import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  Activity,
  Globe,
  Users2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  } = useAmbassadorNetwork();
  const { enrolledCourses, role, refreshRole } = useUser();
  const account = useActiveAccount();
  const { did } = useDid();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sponsorAddress, setSponsorAddress] = useState("");
  const [userAmbassadorDetails, setUserAmbassadorDetails] = useState(null);

  // USDC configuration
  const USDC_ADDRESS = import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS;
  const REGISTRATION_FEE = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)
  const USDC_ABI = UsdCoinABI.abi;

  useEffect(() => {
    if (!account?.address || !fetchAmbassadors) return;
    fetchAmbassadors().catch((error) => {
      console.error("Failed to fetch ambassador details:", error);
    });
  }, [account?.address, fetchAmbassadors]);

  // Refetch ambassadors when role changes (after registration)
  useEffect(() => {
    console.log("Role changed to:", role);
    if (
      role &&
      (role === "Founding Ambassador" || role === "General Ambassador")
    ) {
      console.log("User is ambassador, fetching details...");
      fetchAmbassadors().catch((error) => {
        console.error("Failed to refresh ambassador details:", error);
      });

      // Also fetch current user's ambassador details
      if (account?.address) {
        const fetchUserDetails = async () => {
          try {
            console.log(
              "Fetching user ambassador details for:",
              account.address,
            );
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

            console.log("User ambassador details fetched:", ambassadorData);
            setUserAmbassadorDetails(ambassadorData);
          } catch (error) {
            console.error("Error fetching user ambassador details:", error);
          }
        };

        fetchUserDetails();
      }
    } else {
      console.log("User is not ambassador, role:", role);
    }
  }, [role, fetchAmbassadors, account?.address]);

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
    navigate("/mainpage?section=courses");
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

    setIsSubmittingGeneral(true);
    const toastId = toast.loading("Registering as general ambassador...");
    try {
      // Get the first enrolled course ID for registration (could be modified to allow course selection)
      const firstCourseId = enrolledCourses?.[0]?.courseId || 1;

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
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Ambassador Network
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Network Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track growth, manage your community, and stay on top of ambassador
              performance.
            </p>
          </div>
          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  role === "Founding Ambassador"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {role}
                </div>
              </div>
            )}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Active Ambassadors",
            value: totals.activeCount || 0,
            icon: Users2,
          },
          {
            title: "Total Downline Sales",
            value: totals.totalDownlineSales || "--",
            icon: Globe,
          },
          {
            title: "Total Commissions",
            value: totals.totalCommissions || "--",
            icon: Activity,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-2xl border p-4 shadow-sm ${cardStyle}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
                <div className="rounded-xl bg-yellow-500/15 p-2 text-yellow-600 dark:text-yellow-400">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Ambassador Details Section - PROMINENT DISPLAY */}
      {userAmbassadorDetails ? (
        <div className={`rounded-3xl border p-6 shadow-lg ${cardStyle}`}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`rounded-full p-3 ${
                userAmbassadorDetails.tier === 0
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              <CheckCircle
                className={`h-6 w-6 ${
                  userAmbassadorDetails.tier === 0
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your Ambassador Profile</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userAmbassadorDetails.tier === 0 ? "Founding" : "General"}{" "}
                Ambassador • Level {userAmbassadorDetails.level}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                Tier
              </p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {userAmbassadorDetails.tier === 0 ? "Founding" : "General"}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                Level
              </p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {userAmbassadorDetails.level}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                Status
              </p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {userAmbassadorDetails.isActive ? "🟢 Active" : "⚪ Inactive"}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                Downline Sales
              </p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                $
                {Number(
                  userAmbassadorDetails.totalDownlineSales || 0,
                ).toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50 lg:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold">
                DID Hash (bytes32)
              </p>
              <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/30 p-2 rounded">
                {userAmbassadorDetails.did}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Keccak256 hash of your original DID
              </p>
            </div>

            {userAmbassadorDetails.sponsor &&
              userAmbassadorDetails.sponsor !==
                "0x0000000000000000000000000000000000000000" && (
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50 lg:col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold">
                    Sponsor Address
                  </p>
                  <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/30 p-2 rounded">
                    {userAmbassadorDetails.sponsor}
                  </p>
                </div>
              )}
          </div>
        </div>
      ) : role === "Founding Ambassador" || role === "General Ambassador" ? (
        <div className={`rounded-3xl border p-6 ${cardStyle}`}>
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-yellow-500 dark:border-slate-600 dark:border-t-yellow-400"></div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Loading your ambassador profile...
            </p>
          </div>
        </div>
      ) : null}

      <div className={`rounded-3xl border p-6 ${cardStyle}`}>
        <h2 className="text-lg font-semibold">Today&apos;s focus</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Prioritize regional meetups, highlight top referrers, and queue
          content drops for the next ambassador wave.
        </p>
      </div>

      <div className={`rounded-3xl border p-6 ${cardStyle}`}>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Register as Ambassador</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Founding members pay 100 USDC. General ambassadors enroll in a
              paid course (50+ USDC) to join.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`flex gap-3 rounded-xl p-3 ${
                statusMessage.includes("successful")
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
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

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Founding Ambassador Section */}
            <div className="space-y-4 rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
              <div>
                <h3 className="text-base font-semibold">Founding Ambassador</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Become a founding member and lead your network from day one.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Note: The first founder has no sponsor. Subsequent founders
                  must have a sponsor.
                </p>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Wallet Connected
                  </p>
                  <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">
                    {account?.address
                      ? `${account.address.slice(
                          0,
                          6,
                        )}...${account.address.slice(-4)}`
                      : "Not connected"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Digital Identity (DID)
                  </p>
                  <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">
                    {did ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        Ready
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        Initializing...
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {userAmbassadorStatus && (
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Already registered as ambassador
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    You cannot register as multiple ambassador types. Deregister
                    first to switch.
                  </p>
                </div>
              )}

              <button
                onClick={handleFoundingRegister}
                disabled={
                  isSubmitting ||
                  !did ||
                  !account?.address ||
                  loading ||
                  !!userAmbassadorStatus
                }
                className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-yellow-500/60 disabled:text-slate-700"
              >
                {isSubmitting ? "Registering..." : "Become Founding Ambassador"}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                One-time fee: 100 USDC
              </p>
            </div>

            {/* General Ambassador Section */}
            <div className="space-y-4 rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
              <div>
                <h3 className="text-base font-semibold">General Ambassador</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Enroll in paid courses (50+ USDC total) to qualify as an
                  ambassador.
                </p>
              </div>

              {isQualifiedForGeneralAmbassador ? (
                // User has enrolled in courses worth >= 50 USDC - show registration form
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        You're qualified!
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      Total spent: ${totalEnrolledUSDC.toFixed(2)} USDC
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Wallet Connected
                    </p>
                    <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">
                      {account?.address
                        ? `${account.address.slice(
                            0,
                            6,
                          )}...${account.address.slice(-4)}`
                        : "Not connected"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Digital Identity (DID)
                    </p>
                    <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">
                      {did ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          Initializing...
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Sponsor Address (Founding Ambassador)
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={sponsorAddress}
                      onChange={(e) => setSponsorAddress(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-green-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Enter the wallet address of your founding ambassador
                      sponsor
                    </p>
                  </div>

                  {userAmbassadorStatus && (
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                          Already registered as ambassador
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        You cannot register as multiple ambassador types.
                        Deregister first to switch.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleGeneralAmbassadorRegister}
                    disabled={
                      isSubmittingGeneral ||
                      !did ||
                      !account?.address ||
                      loading ||
                      !sponsorAddress ||
                      !!userAmbassadorStatus
                    }
                    className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-green-600/60 disabled:text-slate-200"
                  >
                    {isSubmittingGeneral
                      ? "Registering..."
                      : "Become General Ambassador"}
                  </button>
                </div>
              ) : (
                // User hasn't enrolled in enough paid courses - show enrollment prompt
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        Not yet qualified
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Current spend: ${totalEnrolledUSDC.toFixed(2)} USDC
                      <br />
                      Required: $50.00 USDC
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Start earning commissions and build your network through
                    education!
                  </p>

                  <button
                    type="button"
                    onClick={handleGeneralRegister}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    View Courses to Enroll
                  </button>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fees vary by course
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
