import { createContext, useContext, useState, useEffect } from "react";
import { useEthersSigner } from "../components/useClientSigner";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const Community_ABI = CommunityABI.abi;
const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;

const CommunityMembersContext = createContext();

export const useCommunityMembers = () => {
  return useContext(CommunityMembersContext);
};

export const CommunityMembersProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const signerPromise = useEthersSigner();
  const { isConnected } = useAccount();

  // Fetch all members from the contract
  const fetchMembers = async () => {
    // if (!isConnected) {
    //   setMembers([]);
    //   return;
    // }

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

  useEffect(() => {
    fetchMembers();
  }, [isConnected]);

  return (
    <CommunityMembersContext.Provider
      value={{ members, loading, error, fetchMembers }}
    >
      {children}
    </CommunityMembersContext.Provider>
  );
};
