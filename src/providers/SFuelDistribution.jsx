import { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SFUELDISTRIBUTIONABI from "../artifacts/contracts/SFuelDistributor.sol/SFuelDistributor.json";
import { toast } from "react-toastify";

const SFUEL_DISTRIBUTOR_ABI = SFUELDISTRIBUTIONABI.abi;
const DISTRIBUTOR_CONTRACT_ADDRESS = import.meta.env
  .VITE_APP_SFUEL_DISTRIBUTION_CONTRACT_ADDRESS;
const SFUEL_THRESHOLD = parseEther("0.000005");

export default function SFuelDistributor() {
  const { address, isConnected } = useAccount();
  const [needsSFuel, setNeedsSFuel] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [distributionStatus, setDistributionStatus] = useState("");

  // Get user's sFUEL balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    chainId: 1020352220,
    enabled: isConnected,
  });

  // Get WHITELIST_ROLE constant from contract
  const { data: whitelistRole } = useReadContract({
    address: DISTRIBUTOR_CONTRACT_ADDRESS,
    abi: SFUEL_DISTRIBUTOR_ABI,
    functionName: "WHITELIST_ROLE",
    chainId: 1020352220,
    enabled: isConnected,
  });

  // Check if user has whitelist role
  const { data: hasWhitelistRole, refetch: refetchWhitelistStatus } =
    useReadContract({
      address: DISTRIBUTOR_CONTRACT_ADDRESS,
      abi: SFUEL_DISTRIBUTOR_ABI,
      functionName: "hasRole",
      args: [whitelistRole, address],
      chainId: 1020352220,
      enabled: Boolean(whitelistRole && address && isConnected),
    });

  // Check if user is eligible for distribution
  const { data: eligibleForDistribution, refetch: refetchEligibility } =
    useReadContract({
      address: DISTRIBUTOR_CONTRACT_ADDRESS,
      abi: SFUEL_DISTRIBUTOR_ABI,
      functionName: "isEligibleForDistribution",
      args: [address],
      chainId: 1020352220,
      enabled: Boolean(address && isConnected),
    });

  // Setup contract write for whitelist function
  const {
    writeContractAsync: whitelist,
    isPending,
    isSuccess,
    error,
  } = useWriteContract();

  // Check if user needs sFUEL when their balance data loads
  useEffect(() => {
    if (balanceData) {
      const userBalance = parseEther(balanceData.formatted);
      setNeedsSFuel(userBalance < SFUEL_THRESHOLD);
    }
  }, [balanceData]);

  // Update whitelist and eligibility status when data changes
  useEffect(() => {
    setIsWhitelisted(Boolean(hasWhitelistRole));
    setIsEligible(Boolean(eligibleForDistribution));
  }, [hasWhitelistRole, eligibleForDistribution]);

  console.log(
    "Balance:",
    balanceData ? formatEther(balanceData.value) : "unknown"
  );
  console.log("IsEligible:", isEligible);
  console.log("IsWhitelisted:", isWhitelisted);

  // Function to handle sFUEL distribution
  const handleDistributeSFuel = async () => {
    if (!isEligible || !address || isPending) return;

    try {
      setDistributionStatus("Requesting sFUEL...");

      await whitelist({
        address: DISTRIBUTOR_CONTRACT_ADDRESS,
        abi: SFUEL_DISTRIBUTOR_ABI,
        functionName: "whitelist",
        args: [address],
        chainId: 1020352220,
        gas: 100000n,
      });

      toast.success("sFUEL distribution successful!");
      setDistributionStatus("sFUEL distribution successful!");

      // Refresh balance and statuses after distribution
      setTimeout(() => {
        refetchBalance();
        refetchWhitelistStatus();
        refetchEligibility();
      }, 3000); // Give blockchain some time to process
    } catch (err) {
      console.error("sFUEL distribution failed:", err);
      toast.error(`Distribution failed: ${err.message || "Unknown error"}`);
      setDistributionStatus(
        `Distribution failed: ${err.message || "Unknown error"}`
      );
    }
  };

  // Auto-trigger sFUEL distribution when needed
  useEffect(() => {
    if (
      isEligible &&
      isConnected &&
      !isWhitelisted &&
      !isPending &&
      !isSuccess
    ) {
      handleDistributeSFuel();
    }
  }, [isEligible, isConnected, isWhitelisted, isPending, isSuccess]);

  return (
    <div className="dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-yellow-500/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-yellow-500/10 rounded-full blur-lg"></div>

      {/* Header with glow effect */}
      <div className="relative z-10 flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-900"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0110 2v5.8h5a1 1 0 01.5 1.8l-9 7A1 1 0 015 15.4V9.6H2a1 1 0 01-.5-1.8l9-7a1 1 0 01.8-.1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight">
          sFUEL Distribution
        </h2>
      </div>

      {!isConnected ? (
        <div className="dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border dark:border-gray-700 shadow-inner">
          <p className="dark:text-gray-300 mb-4">
            Connect your wallet to check sFUEL balance
          </p>
          <div className="mt-4 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <>
          {/* Wallet info card with glassmorphism */}
          <div className="mb-6 p-5 rounded-lg dark:bg-gray-800/70 backdrop-blur-sm border dark:border-gray-700 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-md"></div>

            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-gray-400 font-medium">
                  Wallet Address
                </span>
              </div>
              <p className="dark:text-gray-100 font-mono text-sm pl-5 break-all">
                {address}
              </p>

              <div className="flex items-center mt-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-gray-400 font-medium">sFUEL Balance</span>
              </div>
              <div className="pl-5">
                {balanceData ? (
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold dark:text-white">
                      {parseFloat(formatEther(balanceData.value)).toFixed(8)}
                    </span>
                    <span className="ml-2 text-yellow-500 font-semibold">
                      SFUEL
                    </span>
                  </div>
                ) : (
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-4 w-24 bg-gray-700 rounded"></div>
                    <div className="h-4 w-12 bg-gray-700 rounded"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* sFUEL status and actions */}
          {needsSFuel && (
            <div className="mt-4 p-5 rounded-lg dark:bg-gray-800/70 backdrop-blur-sm border border-yellow-500/20 relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-lg"></div>

              <div className="flex items-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-yellow-500 font-medium">
                  Your sFUEL balance is below the required threshold
                </p>
              </div>

              <button
                onClick={handleDistributeSFuel}
                disabled={isPending || isSuccess}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 shadow-lg ${
                  isPending
                    ? "dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 shadow-yellow-500/20 hover:shadow-yellow-500/30"
                }`}
              >
                {isPending ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Request sFUEL"
                )}
              </button>

              {distributionStatus && (
                <div
                  className={`mt-4 p-3 rounded-lg ${
                    isSuccess
                      ? "bg-green-900/20 border border-green-500/30 text-green-500"
                      : error
                      ? "bg-red-900/20 border border-red-500/30 text-red-400"
                      : "bg-blue-900/20 border border-blue-500/30 text-blue-400"
                  }`}
                >
                  <p className="text-center">{distributionStatus}</p>
                </div>
              )}
            </div>
          )}

          {isWhitelisted && (
            <div className="mt-4 p-5 rounded-lg bg-green-900/10 backdrop-blur-sm border border-green-500/30 relative overflow-hidden">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-500/10 rounded-full blur-lg"></div>

              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-green-400 font-medium">
                  Your address is whitelisted! You can now proceed with minting
                  or other actions.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
