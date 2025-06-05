import { createContext, useContext, useState, useEffect } from "react";
import { useEthersSigner } from "../components/useClientSigner";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import CommunityBadgeABI from "../artifacts/contracts/Community Contracts/CommunityBadgeSystem.sol/CommunityBadgeSystem.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";

const Community_ABI = CommunityABI.abi;
const CommunityBadge_ABI = CommunityBadgeABI.abi;
const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const CommunityBadgeAddress = import.meta.env
  .VITE_APP_COMMUNITYBADGESYSTEM_CONTRACT_ADDRESS;

const CommunityMembersContext = createContext();

export const useCommunityMembers = () => {
  return useContext(CommunityMembersContext);
};

export const CommunityMembersProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [memberBadgeDetails, setMemberBadgeDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const signerPromise = useEthersSigner();
  const { isConnected, address } = useAccount();

  // Fetch all members from the contract
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const communityMembers = await contract.getAllCommunityMembers();
      const formattedMembers = Array.from(communityMembers);
      setMembers(formattedMembers);
    } catch (error) {
      setError(error);
      toast.error("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  //fetch all member badge details
  const fetchMemberBadgeDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityBadgeAddress,
        CommunityBadge_ABI,
        signer
      );

      // Fetch raw badge details from the contract
      const memberBadgeDetails = await contract.getMemberBadgeDetails(address);

      // Format the badge details into a structured object
      const formattedMemberBadgeDetails = {
        currentBadge: Number(memberBadgeDetails[0]), // Convert BigInt to number (uint8)
        badgeName: memberBadgeDetails[1], // String
        iconURI: memberBadgeDetails[2], // String
        tokenReward: memberBadgeDetails[3].toString(), // Convert BigInt to string (uint256)
        totalEventsAttended: Number(memberBadgeDetails[4]), // Convert BigInt to number (uint256)
      };

      // Update state with the formatted badge details
      setMemberBadgeDetails(formattedMemberBadgeDetails);
    } catch (error) {
      setError(error);
      toast.error("Failed to fetch member badge details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchMemberBadgeDetails();
  }, [isConnected]);

  return (
    <CommunityMembersContext.Provider
      value={{
        members,
        loading,
        error,
        fetchMembers,
        memberBadgeDetails,
        fetchMemberBadgeDetails,
      }}
    >
      {children}
    </CommunityMembersContext.Provider>
  );
};
