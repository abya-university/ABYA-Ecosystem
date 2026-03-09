import React, { createContext, useState } from "react";
import { toast } from "react-toastify";
import VestingFacetABI from "../artifacts/contracts/VestingFacet.sol/VestingFacet.json";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { useActiveAccount } from "thirdweb/react";
import {
  defineChain,
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const VestingFacet_ABI = VestingFacetABI.abi;

export const VestingContext = createContext();

export const useVesting = () => {
  const context = React.useContext(VestingContext);
  if (!context) {
    throw new Error("useVesting must be used within a VestingProvider");
  }
  return context;
};

export const VestingProvider = ({ children }) => {
  const account = useActiveAccount();
  const address = account?.address;

  /* =================================
    STATE VARIABLES
    ================================= */

  // Vesting data state
  const [vestingData, setVestingData] = useState({
    vested: null,
    unvested: null,
    claimed: null,
    lifetime: null,
  });

  // Vesting schedule state
  const [vestingSchedule, setVestingScheduleState] = useState({
    startTime: null,
    duration: null,
    elapsed: null,
    percentVested: null,
  });

  // Loading states
  const [loadingUpdateVesting, setLoadingUpdateVesting] = useState(false);
  const [loadingDistributeTokens, setLoadingDistributeTokens] = useState(false);
  const [loadingClaimTokens, setLoadingClaimTokens] = useState(false);
  const [loadingVestingInfo, setLoadingVestingInfo] = useState(false);
  const [loadingVestingSchedule, setLoadingVestingScheduleLoad] =
    useState(false);

  // Error states
  const [error, setError] = useState(null);

  /*=================================
    WRITE FUNCTIONS
    =================================*/

  // Function to update vesting for ambassador
  const updateVesting = async (ambassadorAddress) => {
    if (!address || !client) {
      toast.error("No active account found");
      setError("No active account found");
      return;
    }

    setLoadingUpdateVesting(true);
    setError(null);
    const toastId = toast.loading("Updating vesting...");

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: VestingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "updateVesting",
        params: [ambassadorAddress],
      });

      const receipt = await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Vesting updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      console.log("Vesting updated:", receipt);
    } catch (error) {
      const errorMessage = error.message || "Error updating vesting";
      console.error("Error updating vesting:", error);
      setError(errorMessage);

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoadingUpdateVesting(false);
    }
  };

  // Function to distribute vested tokens to ambassador
  const distributeVestedTokens = async (purchaseId, buyerAddress) => {
    if (!address || !client) {
      toast.error("No active account found");
      setError("No active account found");
      return;
    }

    setLoadingDistributeTokens(true);
    setError(null);
    const toastId = toast.loading("Distributing token rewards...");

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: VestingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "distributeTokenRewards",
        params: [purchaseId, buyerAddress],
      });

      const receipt = await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Token rewards distributed successfully!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      console.log("Tokens distributed:", receipt);
    } catch (error) {
      const errorMessage = error.message || "Error distributing token rewards";
      console.error("Error distributing vested tokens:", error);
      setError(errorMessage);

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoadingDistributeTokens(false);
    }
  };

  // Function to claim vested tokens
  const claimVestedTokens = async () => {
    if (!address || !client) {
      toast.error("No active account found");
      setError("No active account found");
      return;
    }

    setLoadingClaimTokens(true);
    setError(null);
    const toastId = toast.loading("Claiming vested tokens...");

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: VestingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "claimTokens",
        params: [],
      });

      const receipt = await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Tokens claimed successfully!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh vesting info after claiming
      await getVestingInfo(address);
      console.log("Tokens claimed:", receipt);
    } catch (error) {
      const errorMessage = error.message || "Error claiming vested tokens";
      console.error("Error claiming vested tokens:", error);
      setError(errorMessage);

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoadingClaimTokens(false);
    }
  };

  /* =================================
    VIEW FUNCTIONS
    ================================= */

  // Function to get ambassador vesting info (vested, unvested, claimed, balances etc)
  const getVestingInfo = async (ambassadorAddress) => {
    if (!client) {
      console.error("Client not initialized");
      return;
    }

    setLoadingVestingInfo(true);
    setError(null);

    try {
      console.log("Getting vesting info for:", ambassadorAddress);

      const contract = await getContract({
        address: DiamondAddress,
        abi: VestingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      console.log("Contract initialized for address:", DiamondAddress);

      const result = await readContract({
        contract,
        method: "getTokenBalance",
        params: [ambassadorAddress],
      });

      console.log("Raw result from getTokenBalance:", result);
      console.log("Result[0] (vested):", result[0], "Type:", typeof result[0]);
      console.log(
        "Result[1] (unvested):",
        result[1],
        "Type:",
        typeof result[1],
      );
      console.log("Result[2] (claimed):", result[2], "Type:", typeof result[2]);
      console.log(
        "Result[3] (lifetime):",
        result[3],
        "Type:",
        typeof result[3],
      );

      setVestingData({
        vested: result[0],
        unvested: result[1],
        claimed: result[2],
        lifetime: result[3],
      });

      console.log("Vesting data state updated with:", {
        vested: result[0],
        unvested: result[1],
        claimed: result[2],
        lifetime: result[3],
      });

      return result;
    } catch (error) {
      const errorMessage = error.message || "Error getting vesting info";
      console.error(
        "Error getting vesting info for",
        ambassadorAddress,
        ":",
        error,
      );
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      setError(errorMessage);
      setVestingData({
        vested: 0n,
        unvested: 0n,
        claimed: 0n,
        lifetime: 0n,
      });
      // Don't show toast error here - let component handle it
    } finally {
      setLoadingVestingInfo(false);
    }
  };

  // Get vesting schedule for ambassador
  const getVestingSchedule = async (ambassadorAddress) => {
    if (!client) {
      console.error("Client not initialized");
      return;
    }

    setLoadingVestingScheduleLoad(true);
    setError(null);

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: VestingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const result = await readContract({
        contract,
        method: "getVestingSchedule",
        params: [ambassadorAddress],
      });

      setVestingScheduleState({
        startTime: result[0],
        duration: result[1],
        elapsed: result[2],
        percentVested: result[3],
      });

      console.log("Vesting schedule retrieved:", result);
      return result;
    } catch (error) {
      const errorMessage = error.message || "Error getting vesting schedule";
      console.error("Error getting vesting schedule:", error);
      setError(errorMessage);
      setVestingScheduleState({
        startTime: 0n,
        duration: 0n,
        elapsed: 0n,
        percentVested: 0n,
      });
      toast.error(errorMessage);
    } finally {
      setLoadingVestingScheduleLoad(false);
    }
  };

  const value = {
    // State
    vestingData,
    vestingSchedule,
    error,

    // Loading states
    loadingUpdateVesting,
    loadingDistributeTokens,
    loadingClaimTokens,
    loadingVestingInfo,
    loadingVestingSchedule,

    // Functions
    updateVesting,
    distributeVestedTokens,
    claimVestedTokens,
    getVestingInfo,
    getVestingSchedule,
  };

  return (
    <VestingContext.Provider value={value}>{children}</VestingContext.Provider>
  );
};
