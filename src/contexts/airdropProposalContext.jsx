import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { useEthersSigner } from "../components/useClientSigner";
import { toast } from "react-toastify";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const AirdropProposalsContext = createContext();

export const useAirdropProposals = () => {
  return useContext(AirdropProposalsContext);
};

export const AirdropProposalProvider = ({ children }) => {
  const [airdropProposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const signerPromise = useEthersSigner();
  const { isConnected } = useAccount();

  // Format proposals data from contract response
  const formatProposals = (proposalsData) => {
    return proposalsData.map((proposal) => ({
      airdropId: Number(proposal.airdropId),
      amount: ethers.formatEther(proposal.amount),
      startTime: new Date(Number(proposal.startTime) * 1000).toLocaleString(),
      endTime: new Date(Number(proposal.endTime) * 1000).toLocaleString(),
      isActive: proposal.isActive,
      approvalCount: Number(proposal.approvalCount),
    }));
  };

  const fetchAirdropProposals = async () => {
    if (!isConnected) {
      setProposals([]);
      return;
    }

    setLoading(true);
    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const proposalsData = await communityContract.getAllAirdropProposals();
      const formattedProposals = formatProposals(proposalsData);

      setProposals(formattedProposals);
      // toast.success("Airdrop Proposal fetched successfully!");
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setError(error);
      toast.error("Error fetching airdrop proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchAirdropProposals();
    }
  }, [isConnected]);

  return (
    <AirdropProposalsContext.Provider
      value={{ airdropProposals, loading, fetchAirdropProposals, error }}
    >
      {children}
    </AirdropProposalsContext.Provider>
  );
};
