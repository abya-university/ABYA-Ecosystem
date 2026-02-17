import React, { createContext, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  readContract,
  defineChain,
  prepareContractCall,
  sendTransaction,
  toWei,
} from "thirdweb";
import { toast } from "react-toastify";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";
import RevenueSharingFacetABI from "../artifacts/contracts/RevenueSharingFacet.sol/RevenueSharingFacet.json";
import USDCABI from "../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";

const RevenueSharingFacet_ABI = RevenueSharingFacetABI.abi;
const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const USDC_TOKEN_ADDRESS = import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS; // Sepolia USDC
const USDC_ABI = USDCABI.abi;

const RevenueSharingContext = createContext();

export const useRevenueSharing = () => {
  return React.useContext(RevenueSharingContext);
};

export const RevenueSharingProvider = ({ children }) => {
  // State for different data types
  const [commissionsBalance, setCommissionsBalance] = useState(null);
  const [earningsBreakdown, setEarningsBreakdown] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  // Error and success states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const account = useActiveAccount();
  const address = account?.address;

  /* 
    =====================================
    WRITE FUNCTIONS
    ===================================== 
    */

  // Helper function to approve USDC spending
  const approveUSDC = async (spenderAddress, amount) => {
    if (!address || !client) {
      const errorMsg = "Wallet not connected";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      console.log("Approving USDC for spending:", {
        spender: spenderAddress,
        amount: amount.toString(),
        amountInUSDC: (Number(amount) / 1_000_000).toFixed(2) + " USDC",
      });

      const usdcContract = getContract({
        address: USDC_TOKEN_ADDRESS,
        abi: USDC_ABI,
        client,
        chain: defineChain(11155111),
      });

      // Check current allowance
      const currentAllowance = await readContract({
        contract: usdcContract,
        method: "allowance",
        params: [address, spenderAddress],
      });

      console.log("Current allowance:", currentAllowance.toString());

      // If allowance is already sufficient, no need to approve again
      if (BigInt(currentAllowance.toString()) >= BigInt(amount.toString())) {
        console.log("Sufficient allowance already granted");
        return { success: true, data: currentAllowance };
      }

      // Approve the spending
      const approveTx = await prepareContractCall({
        contract: usdcContract,
        method: "approve",
        params: [spenderAddress, amount],
      });

      const approveReceipt = await sendTransaction({
        transaction: approveTx,
        account,
      });
      console.log("USDC approval successful:", approveReceipt);

      return { success: true, data: approveReceipt };
    } catch (err) {
      console.error("Error approving USDC:", err);
      const errorMsg = err.message || "Failed to approve USDC spending";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  //function to purchase a course and trigger revenue sharing
  const purchaseCourse = async (
    buyerAddress,
    creatorAddress,
    courseId,
    priceUSDC,
    reviewerAddress,
  ) => {
    if (!address || !client) {
      const errorMsg = "Wallet not connected";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const toastId = toast.loading("Processing course purchase...");
    setPurchaseLoading(true);
    setError(null);
    setSuccess(null);

    // Log purchase details for debugging
    console.log("Course Purchase Details:", {
      buyer: buyerAddress,
      creator: creatorAddress,
      courseId: courseId.toString(),
      priceUSDC: priceUSDC.toString(),
      priceInUSDC: (Number(priceUSDC) / 1_000_000).toFixed(2) + " USDC",
      reviewer: reviewerAddress,
    });

    try {
      // Step 1: Approve USDC spending if needed
      toast.update(toastId, {
        render: "Approving USDC spending...",
        type: "info",
        isLoading: true,
      });

      const approvalResult = await approveUSDC(DiamondAddress, priceUSDC);
      if (!approvalResult.success) {
        // Approval failed
        toast.update(toastId, {
          render: "Failed to approve USDC spending: " + approvalResult.error,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        setPurchaseLoading(false);
        return { success: false, error: approvalResult.error };
      }

      // Step 2: Proceed with course purchase
      toast.update(toastId, {
        render: "Processing payment...",
        type: "info",
        isLoading: true,
      });

      const contract = getContract({
        address: DiamondAddress,
        abi: RevenueSharingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "coursePurchase",
        params: [
          buyerAddress,
          creatorAddress,
          courseId,
          priceUSDC,
          reviewerAddress,
        ],
      });

      const receipt = await sendTransaction({ transaction, account });
      console.log("Course purchased, transaction receipt:", receipt);

      const successMsg = "Course purchased successfully";
      setSuccess(successMsg);
      toast.update(toastId, {
        render: successMsg,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      setPurchaseLoading(false);
      return { success: true, data: receipt };
    } catch (err) {
      console.error("Error purchasing course:", err);
      const errorMsg = err.message || "Failed to purchase course";
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setPurchaseLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  //function to withdraw commissions
  const withdrawCommissions = async () => {
    if (!address || !client) {
      const errorMsg = "Wallet not connected";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const toastId = toast.loading("Withdrawing commissions...");
    setWithdrawLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: RevenueSharingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "withdrawCommissions",
        params: [],
      });

      const receipt = await sendTransaction({ transaction, account });
      console.log("Commissions withdrawn, transaction receipt:", receipt);

      const successMsg = "Commissions withdrawn successfully";
      setSuccess(successMsg);
      toast.update(toastId, {
        render: successMsg,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      setWithdrawLoading(false);

      // Refresh balance after withdrawal
      await fetchCommissionsBalance(address);

      return { success: true, data: receipt };
    } catch (err) {
      console.error("Error withdrawing commissions:", err);
      const errorMsg = err.message || "Failed to withdraw commissions";
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setWithdrawLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  //function to request course refund and trigger revenue reversal
  const requestCourseRefund = async (courseId) => {
    if (!address || !client) {
      const errorMsg = "Wallet not connected";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const toastId = toast.loading("Requesting course refund...");
    setRefundLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: RevenueSharingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "requestCourseRefund",
        params: [courseId],
      });

      const receipt = await sendTransaction({ transaction, account });
      console.log("Course refund requested, transaction receipt:", receipt);

      const successMsg = "Course refund requested successfully";
      setSuccess(successMsg);
      toast.update(toastId, {
        render: successMsg,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      setRefundLoading(false);
      return { success: true, data: receipt };
    } catch (err) {
      console.error("Error requesting course refund:", err);
      const errorMsg = err.message || "Failed to request course refund";
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setRefundLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  /*
    =====================================
    READ FUNCTIONS
    ===================================== 
    */

  //function to get commissions balance
  const fetchCommissionsBalance = async (ambassadorAddress) => {
    const targetAddress = ambassadorAddress || address;

    if (!targetAddress || !client) {
      const errorMsg = "Wallet not connected or address not provided";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: RevenueSharingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const balance = await readContract({
        contract,
        method: "getCommissionBalance",
        params: [targetAddress],
      });

      setCommissionsBalance(balance);
      console.log("Commissions balance fetched:", balance);
      setLoading(false);
      return { success: true, data: balance };
    } catch (err) {
      console.error("Error fetching commissions balance:", err);
      const errorMsg = err.message || "Failed to fetch commissions balance";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  //function to get ambassador earnings breakdown
  const fetchEarningsBreakdown = async (ambassadorAddress) => {
    const targetAddress = ambassadorAddress || address;

    if (!targetAddress || !client) {
      const errorMsg = "Wallet not connected or address not provided";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: RevenueSharingFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const breakdown = await readContract({
        contract,
        method: "getAmbassadorEarningsBreakdown",
        params: [targetAddress],
      });

      setEarningsBreakdown(breakdown);
      console.log("Earnings breakdown fetched:", breakdown);
      setLoading(false);
      return { success: true, data: breakdown };
    } catch (err) {
      console.error("Error fetching earnings breakdown:", err);
      const errorMsg = err.message || "Failed to fetch earnings breakdown";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  return (
    <RevenueSharingContext.Provider
      value={{
        // State
        commissionsBalance,
        earningsBreakdown,
        loading,
        purchaseLoading,
        withdrawLoading,
        refundLoading,
        error,
        success,

        // Write Functions
        purchaseCourse,
        withdrawCommissions,
        requestCourseRefund,

        // Read Functions
        fetchCommissionsBalance,
        fetchEarningsBreakdown,
      }}
    >
      {children}
    </RevenueSharingContext.Provider>
  );
};
