import React, { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ethers } from "ethers";
import { client } from "../services/client";
import AmbassadorNetworkFacetABI from "../artifacts/contracts/AmbassadorNetworkFacet.sol/AmbassadorNetworkFacet.json";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const AmbassadorNetworkContext_ABI = AmbassadorNetworkFacetABI.abi;

const AmbassadorNetworkContext = createContext();

// Helper function to convert DID string to bytes32 hash
const hashDID = (didString) => {
  if (!didString) {
    throw new Error("DID is required");
  }
  // Hash the DID string using keccak256 to get bytes32
  const hashedDID = ethers.keccak256(ethers.toUtf8Bytes(didString));
  console.log(`DID: ${didString} -> Hashed: ${hashedDID}`);
  return hashedDID;
};

export const useAmbassadorNetwork = () => {
  return useContext(AmbassadorNetworkContext);
};

export const AmbassadorNetworkProvider = ({ children }) => {
  const account = useActiveAccount();
  const address = account?.address || null;
  const ambassadorAddress = address;
  const [ambassadorDetails, setAmbassadorDetails] = useState([]);

  // Loading and error states
  const [loadingRegisterFounding, setLoadingRegisterFounding] = useState(false);
  const [loadingRegisterGeneral, setLoadingRegisterGeneral] = useState(false);
  const [loadingFetchAmbassadors, setLoadingFetchAmbassadors] = useState(false);
  const [error, setError] = useState(null);

  /*  ===================================================
  // WRITE/TRANSACTION FUNCTIONS
  ======================================================
  */

  //function to register a new founding ambassador
  const registerFoundingAmbassador = async (sponsorAddress, did) => {
    if (!address) {
      const errorMsg = "No connected wallet found";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // For first ambassador, sponsor is address(0). For subsequent ambassadors, sponsor must be provided.
    let resolvedSponsorAddress = sponsorAddress;
    if (!resolvedSponsorAddress || resolvedSponsorAddress.trim() === "") {
      resolvedSponsorAddress = "0x0000000000000000000000000000000000000000"; // address(0)
    }

    if (!did) {
      const errorMsg = "Missing DID";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate sponsor address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(resolvedSponsorAddress)) {
      const errorMsg = "Invalid sponsor address format";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoadingRegisterFounding(true);
    setError(null);
    const toastId = toast.loading("Registering as founding ambassador...");

    try {
      // Hash the DID string to bytes32
      let hashedDID;
      try {
        hashedDID = hashDID(did);
      } catch (hashError) {
        const errorMsg = `Failed to hash DID: ${hashError.message}`;
        toast.error(errorMsg);
        setError(errorMsg);
        setLoadingRegisterFounding(false);
        return;
      }

      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111),
      });

      console.log("Calling registerFoundingAmbassador with:", {
        sponsor: resolvedSponsorAddress,
        did: did,
        hashedDID: hashedDID,
      });

      const transaction = await prepareContractCall({
        contract,
        method: "registerFoundingAmbassador",
        params: [resolvedSponsorAddress, hashedDID],
      });

      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      toast.update(toastId, {
        render: "Successfully registered as founding ambassador!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh the ambassadors list after registration
      await fetchAmbassadors();
    } catch (error) {
      const errorMsg = error.message || "Error registering founding ambassador";
      console.error("Error registering ambassador - Full error:", error);
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoadingRegisterFounding(false);
    }
  };

  //function to register a new general ambassador
  const registerGeneralAmbassador = async (sponsorAddress, did, courseId) => {
    if (!address) {
      const errorMsg = "No connected wallet found";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (!sponsorAddress || sponsorAddress.trim() === "") {
      const errorMsg = "Sponsor address is required for general ambassador";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate sponsor address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(sponsorAddress)) {
      const errorMsg = "Invalid sponsor address format";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (!did || !courseId) {
      const errorMsg = "Missing DID or courseId";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoadingRegisterGeneral(true);
    setError(null);
    const toastId = toast.loading("Registering as general ambassador...");

    try {
      // Hash the DID string to bytes32
      let hashedDID;
      try {
        hashedDID = hashDID(did);
      } catch (hashError) {
        const errorMsg = `Failed to hash DID: ${hashError.message}`;
        toast.error(errorMsg);
        setError(errorMsg);
        setLoadingRegisterGeneral(false);
        return;
      }

      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111),
      });

      console.log("Calling registerGeneralAmbassador with:", {
        sponsor: sponsorAddress,
        did: did,
        hashedDID: hashedDID,
        courseId: courseId,
      });

      const transaction = await prepareContractCall({
        contract,
        method: "registerGeneralAmbassador",
        params: [sponsorAddress, hashedDID, courseId],
      });

      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      toast.update(toastId, {
        render: "Successfully registered as general ambassador!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh the ambassadors list after registration
      await fetchAmbassadors();
    } catch (error) {
      const errorMsg = error.message || "Error registering general ambassador";
      console.error(
        "Error registering general ambassador - Full error:",
        error,
      );
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoadingRegisterGeneral(false);
    }
  };

  //function to de-register a founding ambassador
  const deregisterFoundingAmbassador = async () => {
    if (!address) {
      const errorMsg = "No connected wallet found";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    const toastId = toast.loading("Deregistering as founding ambassador...");
    setError(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "deregisterFoundingAmbassador",
        params: [],
      });
      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      toast.update(toastId, {
        render: "Successfully deregistered as founding ambassador",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh the ambassadors list after de-registration
      await fetchAmbassadors();
    } catch (error) {
      const errorMsg =
        error.message || "Error deregistering as founding ambassador";
      console.error("Error deregistering ambassador - Full error:", error);
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  //function to de-register a general ambassador
  const deregisterGeneralAmbassador = async () => {
    if (!address) {
      const errorMsg = "No connected wallet found";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    const toastId = toast.loading("Deregistering as general ambassador...");
    setError(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "deregisterGeneralAmbassador",
        params: [],
      });
      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      toast.update(toastId, {
        render: "Successfully deregistered as general ambassador",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh the ambassadors list after de-registration
      await fetchAmbassadors();
    } catch (error) {
      const errorMsg =
        error.message || "Error deregistering as general ambassador";
      console.error(
        "Error deregistering general ambassador - Full error:",
        error,
      );
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  //function to update ambassador level (promote or demote)
  const updateAmbassadorLevel = async (ambassadorId, newLevel) => {
    if (!address) {
      const errorMsg = "No connected wallet found";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (!ambassadorId && ambassadorId !== 0) {
      const errorMsg = "Missing ambassadorId";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    const toastId = toast.loading("Updating ambassador level...");
    setError(null);

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = await prepareContractCall({
        contract,
        method: "updateAmbassadorLevel",
        params: [ambassadorId, newLevel],
      });
      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      toast.update(toastId, {
        render: "Ambassador level updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh the ambassadors list after level update
      await fetchAmbassadors();
    } catch (error) {
      const errorMsg = error.message || "Error updating ambassador level";
      console.error("Error updating ambassador level - Full error:", error);
      setError(errorMsg);
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  /* ===================================================
  // VIEW/READ FUNCTIONS
  ======================================================
  */

  //get ambassador details by address from the contract
  const fetchAmbassadors = async () => {
    console.log("Starting fetchAmbassadors...");

    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });
        console.log("Contract instance created");

        // Get all ambassador addresses
        let allAddresses;
        try {
          // Try to use getAllAmbassadors if it exists
          allAddresses = await readContract({
            contract,
            method: "getAllAmbassadors",
            params: [],
          });
          console.log("getAllAmbassadors returned:", allAddresses);
        } catch (err) {
          // Fallback to getRootAmbassadors if getAllAmbassadors doesn't exist
          console.log("getAllAmbassadors not found, using getRootAmbassadors");
          allAddresses = await readContract({
            contract,
            method: "getRootAmbassadors",
            params: [],
          });
          console.log("getRootAmbassadors returned:", allAddresses);
        }

        // Filter out zero addresses
        const validAddresses = allAddresses.filter(
          (addr) =>
            addr && addr !== "0x0000000000000000000000000000000000000000",
        );

        console.log("Valid ambassador addresses:", validAddresses);

        // Fetch details for each ambassador
        const ambassadorsDataPromises = validAddresses.map((addr) =>
          readContract({
            contract,
            method:
              "function getAmbassadorDetails(address _ambassador) view returns (bytes32 did, uint8 tier, uint8 level, address sponsor, address leftLeg, address rightLeg, uint256 totalDownlineSales, uint256 lifetimeCommissions, bool isActive)",
            params: [addr],
          }),
        );

        const ambassadorsRawData = await Promise.all(ambassadorsDataPromises);

        // Process the raw data into a more usable format
        const ambassadorDetails = ambassadorsRawData.map(
          (ambassador, index) => ({
            address: validAddresses[index],
            did: ambassador[0],
            tier: ambassador[1],
            level: ambassador[2],
            sponsor: ambassador[3],
            leftLeg: ambassador[4],
            rightLeg: ambassador[5],
            totalDownlineSales: ambassador[6],
            lifetimeCommissions: ambassador[7],
            isActive: ambassador[8],
          }),
        );

        console.log("Processed ambassadors details:", ambassadorDetails);
        setAmbassadorDetails(ambassadorDetails);
        return ambassadorDetails;
      } catch (fetchError) {
        console.error("Error fetching ambassadors - Full error:", fetchError);
        setError(fetchError.message);
      }
    } else {
      console.warn("No client available");
    }
  };

  //function to get ALL ambassadors (not just roots)
  const getAllAmbassadors = async () => {
    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        // Get all ambassador addresses
        let allAddresses;
        try {
          allAddresses = await readContract({
            contract,
            method: "getAllAmbassadors",
            params: [],
          });
          console.log("getAllAmbassadors returned:", allAddresses);
        } catch (err) {
          // Fallback to getRootAmbassadors if getAllAmbassadors doesn't exist
          console.log("getAllAmbassadors not found, using getRootAmbassadors");
          allAddresses = await readContract({
            contract,
            method: "getRootAmbassadors",
            params: [],
          });
          console.log("getRootAmbassadors returned:", allAddresses);
        }

        // Filter out zero addresses
        const validAddresses = allAddresses.filter(
          (addr) =>
            addr && addr !== "0x0000000000000000000000000000000000000000",
        );

        console.log("Valid ambassador addresses:", validAddresses);

        // Fetch details for each ambassador
        const ambassadorsDataPromises = validAddresses.map((addr) =>
          readContract({
            contract,
            method:
              "function getAmbassadorDetails(address _ambassador) view returns (bytes32 did, uint8 tier, uint8 level, address sponsor, address leftLeg, address rightLeg, uint256 totalDownlineSales, uint256 lifetimeCommissions, bool isActive)",
            params: [addr],
          }),
        );

        const ambassadorsRawData = await Promise.all(ambassadorsDataPromises);

        // Process the raw data into a more usable format
        const allAmbassadors = ambassadorsRawData.map((ambassador, index) => ({
          address: validAddresses[index],
          did: ambassador[0],
          tier: ambassador[1],
          level: ambassador[2],
          sponsor: ambassador[3],
          leftLeg: ambassador[4],
          rightLeg: ambassador[5],
          totalDownlineSales: ambassador[6],
          lifetimeCommissions: ambassador[7],
          isActive: ambassador[8],
        }));

        console.log("All ambassadors details:", allAmbassadors);
        return allAmbassadors;
      } catch (fetchError) {
        console.error(
          "Error fetching all ambassadors - Full error:",
          fetchError,
        );
        setError(fetchError.message);
      }
    } else {
      console.warn("No client available");
    }
  };

  //function to get direct downline ambassador
  const fetchDirectDownline = async (ambassadorAddress, maxDepth) => {
    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        const downlineData = await readContract({
          contract,
          method: "getDownlineCount",
          params: [ambassadorAddress, maxDepth],
        });

        console.log("Raw downline data:", downlineData);

        // Process the raw data into a more usable format
        const downline = downlineData.map((ambassador) => ({
          id: ambassador.id,
          address: ambassador.addr,
          name: ambassador.name,
          level: ambassador.level,
          totalReferred: ambassador.totalReferred,
          totalRewards: ambassador.totalRewards,
        }));

        console.log("Processed downline details:", downline);
        return downline;
      } catch (fetchError) {
        console.error(
          "Error fetching direct downline - Full error:",
          fetchError,
        );
      }
    } else {
      console.warn("No signer available");
    }
  };

  //function to get tree structure for a single ambassador (returns address and basic info for left/right legs)
  const getAmbassadorTree = async (ambassadorAddress, depth) => {
    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        const treeData = await readContract({
          contract,
          method: "getAmbassadorTree",
          params: [ambassadorAddress, depth],
        });

        console.log("Raw tree data:", treeData);

        // Process the raw data into a more usable format
        const tree = treeData.map((node) => ({
          id: node.id,
          address: node.addr,
          name: node.name,
          level: node.level,
          totalReferred: node.totalReferred,
          totalRewards: node.totalRewards,
        }));

        console.log("Processed tree details:", tree);
        return tree;
      } catch (fetchError) {
        console.error(
          "Error fetching ambassador tree - Full error:",
          fetchError,
        );
        throw fetchError;
      }
    } else {
      console.warn("No signer available");
    }
  };

  //function to get all root ambassadors (those without a sponsor)
  const getRootAmbassadors = async () => {
    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        // Get all root ambassador addresses
        const rootAddresses = await readContract({
          contract,
          method: "getRootAmbassadors",
          params: [],
        });

        console.log("Raw root ambassadors addresses:", rootAddresses);

        // Fetch details for each root ambassador
        const ambassadorsDataPromises = rootAddresses.map((addr) =>
          readContract({
            contract,
            method:
              "function getAmbassadorDetails(address _ambassador) view returns (bytes32 did, uint8 tier, uint8 level, address sponsor, address leftLeg, address rightLeg, uint256 totalDownlineSales, uint256 lifetimeCommissions, bool isActive)",
            params: [addr],
          }),
        );

        const ambassadorsRawData = await Promise.all(ambassadorsDataPromises);

        // Process the raw data into a more usable format
        const rootAmbassadors = ambassadorsRawData.map((ambassador, index) => ({
          address: rootAddresses[index],
          did: ambassador[0],
          tier: ambassador[1],
          level: ambassador[2],
          sponsor: ambassador[3],
          leftLeg: ambassador[4],
          rightLeg: ambassador[5],
          totalDownlineSales: ambassador[6],
          lifetimeCommissions: ambassador[7],
          isActive: ambassador[8],
        }));

        console.log("Processed root ambassadors details:", rootAmbassadors);
        return rootAmbassadors;
      } catch (fetchError) {
        console.error(
          "Error fetching root ambassadors - Full error:",
          fetchError,
        );
      }
    } else {
      console.warn("No client available");
    }
  };

  //function to get direct children (left and right legs)
  const getDirectDownline = async (ambassadorAddress) => {
    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        const downlineData = await readContract({
          contract,
          method: "getDirectDownline",
          params: [ambassadorAddress],
        });

        console.log("Raw direct downline data:", downlineData);

        // Process the raw data into a more usable format
        const directDownline = downlineData.map((ambassador) => ({
          id: ambassador.id,
          address: ambassador.addr,
          name: ambassador.name,
          level: ambassador.level,
          totalReferred: ambassador.totalReferred,
          totalRewards: ambassador.totalRewards,
        }));

        console.log("Processed direct downline details:", directDownline);
        return directDownline;
      } catch (fetchError) {
        console.error(
          "Error fetching direct downline - Full error:",
          fetchError,
        );
      }
    } else {
      console.warn("No signer available");
    }
  };

  return (
    <AmbassadorNetworkContext.Provider
      value={{
        ambassadorDetails,
        fetchAmbassadors,
        getAllAmbassadors,
        registerFoundingAmbassador,
        registerGeneralAmbassador,
        getAmbassadorTree,
        getRootAmbassadors,
        getDirectDownline,
        loadingRegisterFounding,
        loadingRegisterGeneral,
        loadingFetchAmbassadors,
        error,
      }}
    >
      {children}
    </AmbassadorNetworkContext.Provider>
  );
};

export const useAmbassadorNetworkContext = () => {
  const context = useContext(AmbassadorNetworkContext);
  if (!context) {
    throw new Error(
      "useAmbassadorNetworkContext must be used within an AmbassadorNetworkProvider",
    );
  }
  return context;
};
