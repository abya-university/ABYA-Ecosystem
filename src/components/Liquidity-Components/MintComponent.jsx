import { useState, useEffect } from "react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ethers } from "ethers";
import CONTRACT_ABI from "../../artifacts/fakeLiquidityArtifacts/Add_Swap_Contract.sol/Add_Swap_Contract.json";
import USDC_ABI from "../../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";
import ABYTKN_ABI from "../../artifacts/fakeLiquidityArtifacts/ABYATKN.sol/ABYATKN.json";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../services/client";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

// Constants - Aligned with our configuration
const CONTRACT_CONFIG = {
  ADDRESSES: {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_SEPOLIA_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_ADDRESS, // ABYTKN
    TOKEN1: import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS, // USDC
    UNISWAP_POOL: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_USDC_500,
  },
  CHAIN: defineChain(11155111), // Sepolia
};

const MintComponent = () => {
  const [mintData, setMintData] = useState({
    usdcAmount: "",
    abytknAmount: "",
  });
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const { loadBalances, loadPoolInfo } = useTransactionHistory();
  const [loadingUSDC, setLoadingUSDC] = useState(false);
  const [loadingABYTKN, setLoadingABYTKN] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (isConnected) {
      loadBalances();
      loadPoolInfo();
      const interval = setInterval(() => {
        loadBalances();
        loadPoolInfo();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, address, loadBalances, loadPoolInfo]);

  const mintUSDCTokens = async (amount) => {
    console.log("Minting", amount, "USDC");

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.error("Invalid amount provided for minting:", amount);
      setError("Please enter a valid amount to mint");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoadingUSDC(true);
    setError("");
    setSuccess("");

    try {
      // Initialize USDC contract
      const usdcContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.TOKEN1, // USDC address
        abi: usdcAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const parsedAmount = ethers.parseEther(amount.toString());

      console.log("Minting USDC:", {
        to: address,
        amount: amount,
        parsedAmount: parsedAmount.toString(),
      });

      // Prepare and send mint transaction
      const transaction = prepareContractCall({
        contract: usdcContract,
        method: "mint",
        params: [address, parsedAmount],
      });

      const tx = await sendTransaction({ transaction, account });

      setTxHash(tx.transactionHash);

      setSuccess(`Successfully minted ${amount} USDC!`);
      loadBalances(); // Refresh balances
      setMintData((prev) => ({
        ...prev,
        usdcAmount: "",
      }));
    } catch (error) {
      console.error("USDC Minting error:", error);
      let errorMessage = "Failed to mint USDC";

      if (error.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (error.message.includes("execution reverted")) {
        errorMessage =
          "Contract execution reverted - you may not have minting permissions";
      } else {
        errorMessage += `: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoadingUSDC(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
        setTxHash("");
      }, 5000);
    }
  };

  const mintABYATokens = async (amount) => {
    console.log("Minting", amount, "ABYTKN");

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.error("Invalid amount provided for minting:", amount);
      setError("Please enter a valid amount to mint");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoadingABYTKN(true);
    setError("");
    setSuccess("");

    try {
      // Initialize ABYTKN contract
      const abytknContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.TOKEN0, // ABYTKN address
        abi: abyatknAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const parsedAmount = ethers.parseEther(amount.toString());

      console.log("Minting ABYTKN:", {
        to: address,
        amount: amount,
        parsedAmount: parsedAmount.toString(),
      });

      // Prepare and send mint transaction (use same signature as USDC)
      const transaction = prepareContractCall({
        contract: abytknContract,
        method: "mint",
        params: [address, parsedAmount],
        gas: 500000n,
        gasPrice: 0n,
        value: 0n,
      });

      // sendTransaction expects an object { transaction, account }
      const tx = await sendTransaction({ transaction, account });

      // prefer transactionHash or hash
      setTxHash(tx.transactionHash ?? tx.hash);

      setSuccess(`Successfully minted ${amount} ABYTKN!`);
      loadBalances(); // Refresh balances
      setMintData((prev) => ({
        ...prev,
        abytknAmount: "",
      }));
    } catch (error) {
      console.error("ABYTKN Minting error:", error);
      let errorMessage = "Failed to mint ABYTKN";

      const msg = error?.message ?? String(error);
      if (msg.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (msg.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (msg.includes("execution reverted")) {
        errorMessage =
          "Contract execution reverted - you may not have minting permissions";
      } else {
        errorMessage += `: ${msg}`;
      }

      setError(errorMessage);
    } finally {
      setLoadingABYTKN(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
        setTxHash("");
      }, 5000);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-500 mb-2">
            Token Minting
          </h3>
          <p className="text-sm text-yellow-800 dark:text-gray-100">
            Mint test tokens for development and testing purposes.
          </p>
        </div>

        {/* USDC Minting */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            Mint USDC
          </h4>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Amount to mint"
              value={mintData.usdcAmount}
              onChange={(e) =>
                setMintData({
                  ...mintData,
                  usdcAmount: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => mintUSDCTokens(mintData.usdcAmount)}
              disabled={!isConnected || loadingUSDC || !mintData.usdcAmount}
              className="w-full bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingUSDC ? "Minting..." : "Mint USDC"}
            </button>
          </div>
        </div>

        {/* ABYTKN Minting */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            Mint ABYTKN
          </h4>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Amount to mint"
              value={mintData.abytknAmount}
              onChange={(e) =>
                setMintData({
                  ...mintData,
                  abytknAmount: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => mintABYATokens(mintData.abytknAmount)}
              disabled={!isConnected || loadingABYTKN || !mintData.abytknAmount}
              className="w-full bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingABYTKN ? "Minting..." : "Mint ABYTKN"}
            </button>
          </div>
        </div>

        {/* Transaction Hash Display */}
        {txHash && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-400 break-all">
              <strong>Transaction:</strong>{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300"
              >
                {txHash}
              </a>
            </p>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-800 dark:text-gray-100">
            <strong>Note:</strong> Make sure your token contracts have minting
            functionality enabled and you have the required permissions.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg shadow-lg max-w-md">
          <AlertCircle size={20} className="inline-block mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg shadow-lg max-w-md">
          <CheckCircle size={20} className="inline-block mr-2" />
          {success}
        </div>
      )}
    </>
  );
};

export default MintComponent;
