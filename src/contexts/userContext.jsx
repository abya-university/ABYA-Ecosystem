import { createContext, useState, useEffect, useContext } from "react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import PropTypes from "prop-types";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { ethers } from "ethers";
import { defineChain, getContract, readContract } from "thirdweb";

const ContractABI = Ecosystem2ABI.abi;
const ContractAddress = import.meta.env.VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;

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
        const signer = await client;

        const contract = await getContract({
          address: ContractAddress,
          abi: ContractABI,
          signer,
          chain: defineChain(1020352220),
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
