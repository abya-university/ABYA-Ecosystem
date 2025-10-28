import { createContext, useContext, useState, useEffect } from "react";
import CommunityGovernanceFacet from "../artifacts/contracts/CommunityGovernanceFacet.sol/CommunityGovernanceFacet.json";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ethers } from "ethers";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const CommunityGovernanceFacet_ABI = CommunityGovernanceFacet.abi;

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
        address: DiamondAddress,
        abi: CommunityGovernanceFacet_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
      });

      const proposalsData = await readContract({
        contract: communityContract,
        method: "getAllProjectProposals",
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
