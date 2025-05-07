import { useState } from "react";
import { X, Gift, Calendar } from "lucide-react";
import { ethers } from "ethers";
import { useEthersSigner } from "./useClientSigner";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { toast, ToastContainer } from "react-toastify";

const Community_ABI = CommunityABI.abi;
const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;

const AirdropModal = ({ setShowAirdropModal }) => {
  const [airdropData, setAirdropData] = useState({
    amount: "",
    startTime: "",
    endTime: "",
  });
  const [distributeAirdropsLoading, setDistributeAirdropsLoading] =
    useState(false);
  const [error, setError] = useState("");
  const signerPromise = useEthersSigner();

  const handleAirdrop = async () => {
    try {
      setDistributeAirdropsLoading(true);

      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      // Convert datetime strings to Unix timestamps
      const startTimestamp = Math.floor(
        new Date(airdropData.startTime).getTime() / 1000
      );
      const endTimestamp = Math.floor(
        new Date(airdropData.endTime).getTime() / 1000
      );

      // Call your contract function with the new parameters
      const tx = await communityContract.createAirdropProposal(
        ethers.parseEther(airdropData.amount),
        startTimestamp,
        endTimestamp
      );

      await tx.wait();

      // Success handling
      toast.success("Airdrop proposal submitted successfully");
      setAirdropData({ amount: "", startTime: "", endTime: "" });
      setShowAirdropModal(false);
    } catch (error) {
      setError(`Error distributing airdrops: ${error.message}`);
      console.error("Error distributing airdrops:", error);
      toast.error(`Failed to submit airdrop proposal: ${error.message}`);
    } finally {
      setDistributeAirdropsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <ToastContainer position="bottom-right" theme="colored" />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Airdrop Campaign
          </h3>
          <button
            onClick={() => setShowAirdropModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount per Address (ABYATKN)
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  value={airdropData.startTime}
                  onChange={(e) =>
                    setAirdropData({
                      ...airdropData,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  value={airdropData.endTime}
                  onChange={(e) =>
                    setAirdropData({ ...airdropData, endTime: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This airdrop will be active for all community members to claim
              during the specified period. Each member can claim only once.
            </p>
          </div>

          <button
            onClick={handleAirdrop}
            disabled={distributeAirdropsLoading}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center hover:cursor-pointer"
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
};

export default AirdropModal;
