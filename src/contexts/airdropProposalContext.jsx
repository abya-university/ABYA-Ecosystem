import { createContext, useContext, useState, useEffect } from "react";
import CommunityGovernanceFacet from "../artifacts/contracts/CommunityGovernanceFacet.sol/CommunityGovernanceFacet.json";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ethers } from "ethers";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamondAddress;
const CommunityGovernanceFacet_ABI = CommunityGovernanceFacet.abi;

const AirdropProposalsContext = createContext();

export const useAirdropProposals = () => {
  return useContext(AirdropProposalsContext);
};

export const AirdropProposalProvider = ({ children }) => {
  const [airdropProposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

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
      const communityContract = await getContract({
        address: DiamondAddress,
        abi: CommunityGovernanceFacet_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
      });

      // const proposalsData = await communityContract.getAllAirdropProposals();
      const proposalsData = await readContract({
        contract: communityContract,
        method:
          "function getAllAirdropProposals() view returns ((uint256 airdropId, uint256 amount, uint256 startTime, uint256 endTime, bool isActive, uint256 approvalCount)[])",
        params: [],
      });
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
