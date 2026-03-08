import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Profile_ABI from "../artifacts/contracts/ProfileFacet.sol/ProfileFacet.json";
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
import CONTRACT_ADDRESSES from "../constants/addresses";

const profileABI = Profile_ABI.abi;
export const PROFILE_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.facets.ProfileFacet;

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
        if (!isConnected || !account) {
          throw new Error("Please connect your wallet first");
        }

        if (!PROFILE_CONTRACT_ADDRESS) {
          throw new Error("Profile contract address not configured");
        }

        setLoading(true);

        const contract = getContract({
          address: PROFILE_CONTRACT_ADDRESS,
          abi: profileABI,
          client,
          chain: defineChain(11155111),
        });

        // ✅ Prepare transaction with explicit gas settings
        const transaction = prepareContractCall({
          contract,
          method:
            "function createProfile(string _fname, string _lname, string _email) returns (uint256)",
          params: [fname, lname, email],
        });

        console.log("Transaction prepared:", transaction);

        if (!transaction) {
          throw new Error("Failed to prepare transaction");
        }

        // ✅ Send transaction with explicit account and timeout
        const transactionPromise = sendTransaction({
          transaction,
          account,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Transaction timeout after 45 seconds")),
            45000,
          ),
        );

        const result = await Promise.race([transactionPromise, timeoutPromise]);

        console.log("Profile creation result:", result);
        toast.success("Profile created successfully!");

        // Wait for transaction to be mined before refreshing
        setTimeout(() => {
          getProfileByAccount();
        }, 3000);

        return result;
      } catch (error) {
        console.error("Error creating profile:", error);

        let errorMessage = "Failed to create profile. Please try again.";

        if (error?.message) {
          if (error.message.includes("timeout")) {
            errorMessage = "Transaction timed out. Please try again.";
          } else if (
            error.message.includes("bundler") ||
            error.message.includes("UserOperation")
          ) {
            errorMessage =
              "Account abstraction failed. Try connecting with a different wallet type.";
          } else if (error.message.includes("Email already exists")) {
            errorMessage = "This email is already registered";
          } else if (error.message.includes("revert")) {
            errorMessage = "Transaction reverted. Please check your inputs.";
          } else if (error.message.includes("user rejected")) {
            errorMessage = "Transaction cancelled by user";
          } else {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, account],
  );

  const getProfileByAccount = useCallback(async () => {
    try {
      if (!isConnected || !address) {
        setProfile(EMPTY_PROFILE);
        return;
      }

      setLoading(true);
      const contract = getContract({
        address: PROFILE_CONTRACT_ADDRESS,
        abi: profileABI,
        client,
        chain: defineChain(11155111),
      });

      const profiles = await readContract({
        contract,
        method: "getProfilesByAccount",
        params: [address],
      });

      if (profiles && profiles.length > 0) {
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
        if (!isConnected || !account) {
          throw new Error("Please connect your wallet first");
        }

        setLoading(true);
        const contract = getContract({
          address: PROFILE_CONTRACT_ADDRESS,
          abi: profileABI,
          client,
          chain: defineChain(11155111),
        });

        const transaction = prepareContractCall({
          contract,
          method: "deactivateProfile",
          params: [profileId],
          gas: 500000n,
          gasPrice: 0n,
          maxFeePerGas: 0n,
          maxPriorityFeePerGas: 0n,
          value: 0n,
        });

        const result = await sendTransaction({
          transaction,
          account,
        });

        toast.success("Profile deactivated successfully");
        await getProfileByAccount();
        return result;
      } catch (error) {
        console.error("Error deactivating profile:", error);
        toast.error("Failed to deactivate profile");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, account, getProfileByAccount],
  );

  const getAllProfiles = useCallback(async () => {
    try {
      if (!client) return [];

      const contract = getContract({
        address: PROFILE_CONTRACT_ADDRESS,
        abi: profileABI,
        client,
        chain: defineChain(11155111),
      });

      const profiles = await readContract({
        contract,
        method: "getAllProfiles()",
        params: [],
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
