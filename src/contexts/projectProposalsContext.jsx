import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { useEthersSigner } from "../components/useClientSigner";
import { toast } from "react-toastify";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const ProjectProposalsContext = createContext();

export const useProjectProposals = () => {
  return useContext(ProjectProposalsContext);
};

export const ProjectProposalsProvider = ({ children }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const signerPromise = useEthersSigner();
  const { isConnected } = useAccount();

  // Format proposals data from contract response
  const formatProposals = (proposalsData) => {
    return proposalsData.map((proposal) => ({
      id: Number(proposal.id),
      creator: proposal.creator,
      name: proposal.name,
      description: proposal.description,
      techStack: proposal.techStack,
      blockchain: proposal.blockchain,
      requestedAmount: ethers.formatEther(proposal.requestedAmount),
      timeline: Number(proposal.timeline),
      stage: Number(proposal.stage),
      isApproved: proposal.isApproved,
      isRejected: proposal.isRejected,
      rejectionReason: proposal.rejectionReason,
      approvalCount: Number(proposal.approvalCount),
    }));
  };

  // Fetch all project proposals from the contract
  const fetchProposals = async () => {
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

      const proposalsData = await communityContract.getAllProjectProposals();
      console.log("Project Proposals (raw data): ", proposalsData);

      // Format the data
      const formattedProposals = formatProposals(proposalsData);
      console.log("Project Proposals (formatted): ", formattedProposals);

      // Update state
      setProposals(formattedProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setError(error);
      toast.error("Error fetching project proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    console.log("Updated proposals state:", proposals);
  }, [proposals]);

  return (
    <ProjectProposalsContext.Provider
      value={{ proposals, loading, fetchProposals, error }}
    >
      {children}
    </ProjectProposalsContext.Provider>
  );
};
