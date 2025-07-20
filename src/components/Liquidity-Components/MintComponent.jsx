import { useState, useEffect } from "react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useEthersSigner } from "../useClientSigner";
import { ethers } from "ethers";
import USDC_ABI from "../../artifacts/fake-liquidity-abis/usdc.json";
import ABYTKN_ABI from "../../artifacts/fake-liquidity-abis/abyatkn.json";

import CONTRACT_ABI from "../../artifacts/fake-liquidity-abis/add_swap_contract.json";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

const MintComponent = () => {
  const [mintData, setMintData] = useState({
    usdcAmount: "",
    abytknAmount: "",
  });
  const { isConnected, address } = useAccount();
  const { loadBalances, loadPoolInfo } = useTransactionHistory();
  const [loadingg, setLoadingg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const signerPromise = useEthersSigner();
  const [txHash, setTxHash] = useState("");

  // Contract addresses
  const CONTRACT_ADDRESSES = {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_USDC_ADDRESS, // USDC
    TOKEN1: import.meta.env.VITE_APP_ABYATKN_ADDRESS, // ABYTKN
    UNISWAP_POOL: import.meta.env.VITE_APP_ABYATKN_USDC_500, // Uniswap pool address
  };

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
  }, [isConnected, address, loadBalances]);

  const mintUSDCTokens = async (amount, tokenSymbol) => {
    console.log("Minting", amount, "of", tokenSymbol);

    if (!amount || isNaN(parseFloat(amount))) {
      console.error("Invalid amount provided for minting:", amount);
      setError("Please enter a valid amount to mint");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);

    try {
      const signer = await signerPromise;
      if (!signer) return;

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN0,
        USDC_ABI.abi,
        signer
      );

      const parsedAmount = ethers.parseEther(amount.toString()); // Ensure amount is valid
      const tx = await contract.mint(address, parsedAmount);

      setTxHash(tx.hash);
      await tx.wait();

      setSuccess(`Successfully minted ${amount} USDC!`);
      loadBalances(); // Refresh balances
      setMintData({
        ...mintData,
        usdcAmount: "",
      });
    } catch (error) {
      console.error("Minting error:", error);
      setError(`Failed to mint USDC: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
        setTxHash("");
      }, 5000);
    }
  };

  const mintABYATokens = async (amount, tokenSymbol) => {
    console.log("Minting", amount, "of", tokenSymbol);

    if (!amount || isNaN(parseFloat(amount))) {
      console.error("Invalid amount provided for minting:", amount);
      setError("Please enter a valid amount to mint");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoadingg(true);

    try {
      const signer = await signerPromise;
      if (!signer) return;

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN1,
        ABYTKN_ABI.abi,
        signer
      );

      const parsedAmount = ethers.parseEther(amount.toString()); // Ensure amount is valid
      const tx = await contract.mint(address, parsedAmount);

      setTxHash(tx.hash);
      await tx.wait();

      setSuccess(`Successfully minted ${amount} ABYATKN!`);
      loadBalances(); // Refresh balances
      setMintData({
        ...mintData,
        abytknAmount: "",
      });
    } catch (error) {
      console.error("Minting error:", error);
      setError(`Failed to mint ABYATKN: ${error.message}`);
    } finally {
      setLoadingg(false);
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
              onClick={() => {
                console.log("Mint Data:", mintData);
                console.log("Minting Amount:", mintData.usdcAmount);
                console.log("Minting Token Symbol:", mintData.tokenSymbol);
                mintUSDCTokens(mintData.usdcAmount, mintData.tokenSymbol);
              }}
              disabled={!isConnected || loading || !mintData.usdcAmount}
              className="w-full bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Minting..." : "Mint USDC"}
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
              onClick={() =>
                mintABYATokens(mintData.abytknAmount, mintData.tokenSymbol)
              }
              disabled={!isConnected || loadingg || !mintData.abytknAmount}
              className="w-full bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingg ? "Minting..." : "Mint ABYTKN"}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-800 dark:text-gray-100">
            <strong>Note:</strong> Make sure your token contracts have minting
            functionality enabled and you have the required permissions.
          </p>
        </div>
      </div>
      {/* Notifications */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg shadow-lg">
          <AlertCircle size={20} className="inline-block mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg shadow-lg">
          <CheckCircle size={20} className="inline-block mr-2" />
          {success}
        </div>
      )}
    </>
  );
};

export default MintComponent;
