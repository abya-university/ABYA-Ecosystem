import { createContext, useState, useEffect, useContext } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import PropTypes from "prop-types";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { ethers } from "ethers";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REVIEWER_ROLE"));
const MULTISIG_APPROVER = ethers.keccak256(
  ethers.toUtf8Bytes("MULTISIG_APPROVER")
);
const COURSE_OWNER_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("COURSE_OWNER_ROLE")
);
const DEFAULT_ADMIN_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("DEFAULT_ADMIN_ROLE")
);
const COMMUNITY_MANAGER = ethers.keccak256(
  ethers.toUtf8Bytes("COMMUNITY_MANAGER")
);

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log("Connection Status:", isConnected);
      console.log("Address:", address);

      if (!isConnected || !address) {
        console.log("Early return - not connected or no address");
        return;
      }

      try {
        const contract = await getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        const isReviewer = await readContract({
          contract,
          method:
            "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [REVIEWER_ROLE, address],
        });

        const isMultisigApprover = await readContract({
          contract,
          method:
            "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [MULTISIG_APPROVER, address],
        });

        const isCourseOwner = await readContract({
          contract,
          method:
            "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [COURSE_OWNER_ROLE, address],
        });

        const isDefaultAdmin = await readContract({
          contract,
          method:
            "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [DEFAULT_ADMIN_ROLE, address],
        });

        const isCommunityManager = await readContract({
          contract,
          method:
            "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [COMMUNITY_MANAGER, address],
        });

        if (isReviewer) {
          setRole("Reviewer");
        } else if (isMultisigApprover) {
          setRole("Multisig Approver");
        } else if (isCourseOwner) {
          setRole("Course Owner");
        } else if (isCommunityManager) {
          setRole("Community Manager");
        } else if (isDefaultAdmin) {
          setRole("ADMIN");
        } else {
          setRole("USER");
        }
      } catch (error) {
        console.error("Detailed Error:", error);
      }
    };

    fetchUserRole();
  }, [address, isConnected, client]);

  return (
    <UserContext.Provider value={{ role }}>{children}</UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUser = () => useContext(UserContext);
