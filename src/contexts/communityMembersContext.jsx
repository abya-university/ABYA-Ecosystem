import { createContext, useContext, useState, useEffect } from "react";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import CommunityBadgeABI from "../artifacts/contracts/Community Contracts/CommunityBadgeSystem.sol/CommunityBadgeSystem.json";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract, defineChain } from "thirdweb";
import { client } from "../services/client";

const Community_ABI = CommunityABI.abi;
const CommunityBadge_ABI = CommunityBadgeABI.abi;
const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const CommunityBadgeAddress = import.meta.env
  .VITE_APP_COMMUNITYBADGESYSTEM_CONTRACT_ADDRESS;

// Define your chain
const SKALE_CHAIN = defineChain(1020352220);

const CommunityMembersContext = createContext();

export const useCommunityMembers = () => {
  return useContext(CommunityMembersContext);
};

export const CommunityMembersProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [memberBadgeDetails, setMemberBadgeDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  // ✅ Fixed fetchMembers function
  const fetchMembers = async () => {
    if (!isConnected) {
      console.log("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // console.log("Fetching members from contract:", CommunityAddress);

      const contract = getContract({
        address: CommunityAddress,
        abi: Community_ABI,
        client,
        chain: SKALE_CHAIN,
      });

      const communityMembers = await readContract({
        contract,
        method: "function getAllCommunityMembers() view returns (address[])",
        params: [],
      });

      // console.log("Raw community members:", communityMembers);

      // Convert to array if needed and filter out zero addresses
      const formattedMembers = Array.isArray(communityMembers)
        ? communityMembers.filter(
            (addr) => addr !== "0x0000000000000000000000000000000000000000"
          )
        : [];

      // console.log("Formatted members:", formattedMembers);
      setMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      setError(error.message || "Failed to fetch members");
      toast.error(
        "Failed to fetch members: " + (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed fetchMemberBadgeDetails function
  const fetchMemberBadgeDetails = async () => {
    if (!isConnected || !address) {
      console.log("Wallet not connected or no address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching badge details for:", address);

      const contract = getContract({
        address: CommunityBadgeAddress,
        abi: CommunityBadge_ABI,
        client,
        chain: SKALE_CHAIN,
      });

      const memberBadgeDetails = await readContract({
        contract,
        method:
          "function getMemberBadgeDetails(address _member) view returns (uint8 currentBadge, string badgeName, string iconURI, uint256 tokenReward, uint256 totalEventsAttended)",
        params: [address],
      });

      console.log("Raw badge details:", memberBadgeDetails);

      const formattedMemberBadgeDetails = {
        currentBadge: Number(memberBadgeDetails[0]),
        badgeName: memberBadgeDetails[1],
        iconURI: memberBadgeDetails[2],
        tokenReward: memberBadgeDetails[3].toString(),
        totalEventsAttended: Number(memberBadgeDetails[4]),
      };

      console.log("Formatted badge details:", formattedMemberBadgeDetails);
      setMemberBadgeDetails(formattedMemberBadgeDetails);
    } catch (error) {
      console.error("Error fetching member badge details:", error);
      setError(error.message || "Failed to fetch member badge details");
      toast.error(
        "Failed to fetch member badge details: " +
          (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed useEffect with proper dependencies
  useEffect(() => {
    if (isConnected) {
      fetchMembers();
      if (address) {
        fetchMemberBadgeDetails();
      }
    } else {
      // Reset state when disconnected
      setMembers([]);
      setMemberBadgeDetails([]);
    }
  }, [isConnected, address]);

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
