import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Profile_ABI from "../artifacts/contracts/Profile.sol/Nemezis.json";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { toast } from "react-toastify";

const profileABI = Profile_ABI.abi;
export const PROFILE_CONTRACT_ADDRESS = import.meta.env
  .VITE_APP_PROFILE_CONTRACT_ADDRESS;

const ProfileContext = createContext();

const EMPTY_PROFILE = {
  id: null,
  fname: "",
  lname: "",
  email: "",
  account: "",
  active: false,
  createdAt: null,
  updatedAt: null,
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!account;

  const createProfile = useCallback(
    async (fname, lname, email) => {
      try {
        if (!isConnected || !address || !client) {
          throw new Error("Please connect your wallet first");
        }

        setLoading(true);
        const contract = getContract({
          address: PROFILE_CONTRACT_ADDRESS,
          abi: profileABI,
          client,
          chain: defineChain(1020352220),
        });

        const tx = prepareContractCall({
          contract,
          method:
            "function createProfile(string _fname, string _lname, string _email) returns (uint256)",
          params: [fname, lname, email],
        });

        const result = await sendTransaction(tx);
        toast.success("Profile created successfully!");

        // Refresh profile after creation
        await getProfileByAccount();
        return result;
      } catch (error) {
        console.error("Error creating profile:", error);
        const errorMessage = error.message.includes("Email already exists")
          ? "This email is already registered"
          : "Failed to create profile. Please try again.";
        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, address]
  );

  const getProfileByAccount = useCallback(async () => {
    try {
      if (!isConnected || !address || !client) {
        setProfile(EMPTY_PROFILE);
        return;
      }

      setLoading(true);
      const contract = getContract({
        address: PROFILE_CONTRACT_ADDRESS,
        abi: profileABI,
        client,
        chain: defineChain(1020352220),
      });

      const profiles = await readContract({
        contract,
        method:
          "function getProfilesByAccount(address _account) view returns (tuple(uint256 id, string fname, string lname, string email, address account, bool active, uint256 createdAt, uint256 updatedAt)[])",
        params: [address],
      });

      if (profiles && profiles.length > 0) {
        // Get the most recent active profile
        const activeProfile = profiles.find((p) => p.active) || profiles[0];
        setProfile(activeProfile);
      } else {
        setProfile(EMPTY_PROFILE);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(EMPTY_PROFILE);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  const deactivateProfile = useCallback(
    async (profileId) => {
      try {
        if (!isConnected || !address || !client) {
          throw new Error("Please connect your wallet first");
        }

        setLoading(true);
        const contract = getContract({
          address: PROFILE_CONTRACT_ADDRESS,
          abi: profileABI,
          client,
          chain: defineChain(1020352220),
        });

        const tx = prepareContractCall({
          contract,
          method: "function deactivateProfile(uint256 _profileId)",
          params: [profileId],
        });

        await sendTransaction(tx);
        toast.success("Profile deactivated successfully");

        // Refresh profile after deactivation
        await getProfileByAccount();
      } catch (error) {
        console.error("Error deactivating profile:", error);
        toast.error("Failed to deactivate profile");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, address, getProfileByAccount]
  );

  const getAllProfiles = useCallback(async () => {
    try {
      if (!client) return [];

      const contract = getContract({
        address: PROFILE_CONTRACT_ADDRESS,
        abi: profileABI,
        client,
        chain: defineChain(1020352220),
      });

      const profiles = await readContract({
        contract,
        method:
          "function getAllProfiles() view returns (tuple(uint256 id, string fname, string lname, string email, address account, bool active, uint256 createdAt, uint256 updatedAt)[])",
      });

      return profiles || [];
    } catch (error) {
      console.error("Error fetching all profiles:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      getProfileByAccount();
    } else {
      setProfile(EMPTY_PROFILE);
    }
  }, [isConnected, address, getProfileByAccount]);

  const clearProfile = () => {
    setProfile(EMPTY_PROFILE);
  };

  const value = {
    profile,
    loading,
    createProfile,
    deactivateProfile,
    getProfileByAccount,
    getAllProfiles,
    clearProfile,
    hasProfile: profile.id !== null && profile.active,
    isConnected,
    address,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
