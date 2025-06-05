import { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { useEthersSigner } from "../components/useClientSigner";
import PropTypes from "prop-types";

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
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState(null);
  const signerPromise = useEthersSigner();

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log("Connection Status:", isConnected);
      console.log("Address:", address);

      if (!isConnected || !address) {
        console.log("Early return - not connected or no address");
        return;
      }

      try {
        const signer = await signerPromise;
        console.log("Signer obtained:", !!signer);

        const contract = new ethers.Contract(
          ContractAddress,
          ContractABI,
          signer
        );

        console.log("Contract Address:", ContractAddress);
        console.log("Current Address:", address);

        const isReviewer = await contract.hasRole(REVIEWER_ROLE, address);
        const isMultisigApprover = await contract.hasRole(
          MULTISIG_APPROVER,
          address
        );
        const isCourseOwner = await contract.hasRole(
          COURSE_OWNER_ROLE,
          address
        );
        const isDefaultAdmin = await contract.hasRole(
          DEFAULT_ADMIN_ROLE,
          address
        );
        const isCommunityManager = await contract.hasRole(
          COMMUNITY_MANAGER,
          address
        );

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
  }, [address, isConnected, signerPromise]);

  return (
    <UserContext.Provider value={{ role }}>{children}</UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUser = () => useContext(UserContext);
