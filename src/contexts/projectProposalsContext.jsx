import { createContext, useContext, useState, useEffect } from "react";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { useEthersSigner } from "../components/useClientSigner";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { defineChain, getContract, readContract } from "thirdweb";
import { ethers } from "ethers";

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
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

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
      const communityContract = await getContract({
        address: CommunityAddress,
        abi: Community_ABI,
        client,
        chain: defineChain(1020352220),
      });

      const proposalsData = await readContract({
        contract: communityContract,
        method:
          "function getAllProjectProposals() view returns ((uint256 id, address creator, string name, string description, string[] techStack, string blockchain, uint256 requestedAmount, uint256 timeline, uint8 stage, bool isApproved, bool isRejected, string rejectionReason, uint256 approvalCount)[])",
        params: [],
      });

      // Format the data
      const formattedProposals = formatProposals(proposalsData);
      // console.log("Project Proposals (formatted): ", formattedProposals);

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
    // console.log("Updated proposals state:", proposals);
  }, [isConnected]); // ✅ Only re-run when connection status changes

  return (
    <ProjectProposalsContext.Provider
      value={{ proposals, loading, fetchProposals, error }}
    >
      {children}
    </ProjectProposalsContext.Provider>
  );
};
