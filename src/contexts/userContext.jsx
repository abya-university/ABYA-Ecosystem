import { createContext, useState, useEffect, useContext } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import Ecosystem1FacetABI from "../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import AmbassadorNetworkFacetABI from "../artifacts/contracts/AmbassadorNetworkFacet.sol/AmbassadorNetworkFacet.json";
import PropTypes from "prop-types";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { client } from "../services/client";
import { ethers } from "ethers";
import { getContract, readContract } from "thirdweb";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { defineChain } from "thirdweb/chains";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;
const AmbassadorNetworkFacet_ABI = AmbassadorNetworkFacetABI.abi;

const REVIEWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REVIEWER_ROLE"));
const MULTISIG_APPROVER = ethers.keccak256(
  ethers.toUtf8Bytes("MULTISIG_APPROVER"),
);
const COURSE_OWNER_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("COURSE_OWNER_ROLE"),
);
const DEFAULT_ADMIN_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("DEFAULT_ADMIN_ROLE"),
);
const COMMUNITY_MANAGER = ethers.keccak256(
  ethers.toUtf8Bytes("COMMUNITY_MANAGER"),
);
const FOUNDING_AMBASSADOR_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("FOUNDING_AMBASSADOR_ROLE"),
);
const GENERAL_AMBASSADOR_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("GENERAL_AMBASSADOR_ROLE"),
);

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const chain = useActiveWalletChain();
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Function to fetch and update user role
  const refreshRole = async () => {
    console.log("Refreshing user role...");
    console.log("Connection Status:", isConnected);
    console.log("Address:", address);

    if (!isConnected || !address || !chain) {
      console.log("Early return - not connected or no address");
      return;
    }

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111), // Sepolia chain
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

      const isFoundingAmbassador = await readContract({
        contract,
        method:
          "function hasRole(bytes32 role, address account) view returns (bool)",
        params: [FOUNDING_AMBASSADOR_ROLE, address],
      });

      const isGeneralAmbassador = await readContract({
        contract,
        method:
          "function hasRole(bytes32 role, address account) view returns (bool)",
        params: [GENERAL_AMBASSADOR_ROLE, address],
      });

      // FALLBACK: Check ambassador contract directly if hasRole returns false
      // Contract Tier enum: NONE=0, GENERAL=1, FOUNDING=2
      let ambassadorTier = null;
      if (!isFoundingAmbassador && !isGeneralAmbassador) {
        try {
          const ambassadorContract = await getContract({
            address: DiamondAddress,
            abi: AmbassadorNetworkFacet_ABI,
            client,
            chain: defineChain(11155111),
          });

          const ambassadorDetails = await readContract({
            contract: ambassadorContract,
            method:
              "function getAmbassadorDetails(address _ambassador) view returns (bytes32 did, uint8 tier, uint8 level, address sponsor, address leftLeg, address rightLeg, uint256 totalDownlineSales, uint256 lifetimeCommissions, bool isActive)",
            params: [address],
          });

          // If DID is not bytes32(0), user is an ambassador
          if (ambassadorDetails[0] !== ethers.ZeroHash) {
            ambassadorTier = ambassadorDetails[1]; // tier is 2nd element (index 1)
            console.log(
              "Ambassador detected via fallback check. Tier:",
              ambassadorTier,
            );
          }
        } catch (fallbackError) {
          console.log(
            "Fallback ambassador check failed (user likely not an ambassador):",
            fallbackError.message,
          );
        }
      }

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
      } else if (isFoundingAmbassador || ambassadorTier === 2) {
        // Tier enum: NONE=0, GENERAL=1, FOUNDING=2
        setRole("Founding Ambassador");
      } else if (isGeneralAmbassador || ambassadorTier === 1) {
        setRole("General Ambassador");
      } else {
        setRole("USER");
      }

      console.log(
        "Role updated:",
        isFoundingAmbassador || ambassadorTier === 2
          ? "Founding Ambassador"
          : isGeneralAmbassador || ambassadorTier === 1
          ? "General Ambassador"
          : "USER",
      );
      console.log("hasRole checks:", {
        isFoundingAmbassador,
        isGeneralAmbassador,
      });
      console.log("Fallback tier:", ambassadorTier);
    } catch (error) {
      console.error("Detailed Error:", error);
    }
  };

  useEffect(() => {
    refreshRole();
  }, [address, isConnected, chain, client]);

  //function to get all user enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isConnected || !address || !chain) return;

      try {
        const contract = await getContract({
          address: DiamondAddress,
          abi: Ecosystem1Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia chain
        });

        const contract2 = await getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia chain
        });

        const courseIds = await readContract({
          contract: contract2,
          method: "getUserEnrolledCourses",
          params: [address],
        });

        // Fetch details for each enrolled course
        const coursesDetails = await Promise.all(
          courseIds.map((courseId) =>
            readContract({
              contract,
              method: "getCourse",
              params: [courseId],
            }),
          ),
        );

        setEnrolledCourses(coursesDetails);

        console.log("Enrolled Courses:", coursesDetails);
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
      }
    };

    fetchEnrolledCourses();
  }, [address, isConnected, chain, client]);

  return (
    <UserContext.Provider value={{ role, enrolledCourses, refreshRole }}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUser = () => useContext(UserContext);
