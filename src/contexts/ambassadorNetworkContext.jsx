import React, { createContext, useContext, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../services/client";
import AmbassadorNetworkFacetABI from "../artifacts/contracts/AmbassadorNetworkFacet.sol/AmbassadorNetworkFacet.json";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const AmbassadorNetworkContext_ABI = AmbassadorNetworkFacetABI.abi;

const AmbassadorNetworkContext = createContext();

export const useAmbassadorNetwork = () => {
  return useContext(AmbassadorNetworkContext);
};

export const AmbassadorNetworkProvider = ({ children }) => {
  const account = useActiveAccount();
  const address = account?.address || null;
  const ambassadorAddress = address;
  const [ambassadorDetails, setAmbassadorDetails] = useState({});

  /*  ===================================================
  // WRITE/TRANSACTION FUNCTIONS
  ======================================================
  */

  //function to register a new founding ambassador
  const registerFoundingAmbassador = async (sponsorAddress, did) => {
    if (!address) {
      console.error("No connected wallet found");
      return;
    }

    const resolvedSponsorAddress = sponsorAddress || address;

    if (!resolvedSponsorAddress || !did) {
      console.error("Missing sponsor address or DID");
      return;
    }

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
      });

      const transaction = await prepareContractCall({
        contract,
        method: "registerAmbassador",
        params: [resolvedSponsorAddress, did],
      });

      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      // Refresh the ambassadors list after registration
      await fetchAmbassadors();
    } catch (error) {
      console.error("Error registering ambassador - Full error:", error);
    }
  };

  //function to register a new general ambassador
  const registerGeneralAmbassador = async (sponsorAddress, did, courseId) => {
    if (!address) {
      console.error("No connected wallet found");
      return;
    }

    const resolvedSponsorAddress = sponsorAddress || address;

    if (!resolvedSponsorAddress || !did || !courseId) {
      console.error("Missing sponsor address, DID, or courseId");
      return;
    }

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
      });

      const transaction = await prepareContractCall({
        contract,
        method: "registerGeneralAmbassador",
        params: [resolvedSponsorAddress, did, courseId],
      });

      const tx = await sendTransaction({ transaction, account });
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed:", tx);

      // Refresh the ambassadors list after registration
      await fetchAmbassadors();
    } catch (error) {
      console.error(
        "Error registering general ambassador - Full error:",
        error,
      );
    }
  };

  //function to de-register a founding ambassador
  const deregisterFoundingAmbassador = async () => {
    if (!address) {
      console.error("No connected wallet found");
      return;
    }

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
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

      // Refresh the ambassadors list after de-registration
      await fetchAmbassadors();
    } catch (error) {
      console.error("Error deregistering ambassador - Full error:", error);
    }
  };

  //function to de-register a general ambassador
  const deregisterGeneralAmbassador = async () => {
    if (!address) {
      console.error("No connected wallet found");
      return;
    }

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
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

      // Refresh the ambassadors list after de-registration
      await fetchAmbassadors();
    } catch (error) {
      console.error(
        "Error deregistering general ambassador - Full error:",
        error,
      );
    }
  };

  //function to update ambassador level (promote or demote)
  const updateAmbassadorLevel = async (ambassadorId, newLevel) => {
    if (!address) {
      console.error("No connected wallet found");
      return;
    }

    if (!ambassadorId && ambassadorId !== 0) {
      console.error("Missing ambassadorId");
      return;
    }

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: AmbassadorNetworkContext_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
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

      // Refresh the ambassadors list after level update
      await fetchAmbassadors();
    } catch (error) {
      console.error("Error updating ambassador level - Full error:", error);
    }
  };

  /* ===================================================
  // VIEW/READ FUNCTIONS
  ======================================================
  */

  //get ambassador details by address from the contract
  const fetchAmbassadors = async () => {
    console.log("Starting fetchAmbassador details...");

    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: AmbassadorNetworkContext_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });
        console.log("Contract instance created");

        const ambassadorsData = await readContract({
          contract,
          method: "getAmbassadorDetails",
          params: [ambassadorAddress],
        });

        console.log("Raw ambassadors data:", ambassadorsData);

        // Process the raw data into a more usable format
        const ambassadorDetails = ambassadorsData.map((ambassador) => ({
          id: ambassador.id,
          address: ambassador.addr,
          name: ambassador.name,
          level: ambassador.level,
          totalReferred: ambassador.totalReferred,
          totalRewards: ambassador.totalRewards,
        }));

        console.log("Processed ambassadors details:", ambassadorDetails);
        setAmbassadorDetails(ambassadorDetails);
        return ambassadorDetails;
      } catch (fetchError) {
        console.error("Error fetching ambassadors - Full error:", fetchError);
      }
    } else {
      console.warn("No signer available");
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

        const rootData = await readContract({
          contract,
          method: "getRootAmbassadors",
          params: [],
        });

        console.log("Raw root ambassadors data:", rootData);

        // Process the raw data into a more usable format
        const rootAmbassadors = rootData.map((ambassador) => ({
          id: ambassador.id,
          address: ambassador.addr,
          name: ambassador.name,
          level: ambassador.level,
          totalReferred: ambassador.totalReferred,
          totalRewards: ambassador.totalRewards,
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
      console.warn("No signer available");
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
        registerFoundingAmbassador,
        registerGeneralAmbassador,
        getAmbassadorTree,
        getRootAmbassadors,
        getDirectDownline,
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
