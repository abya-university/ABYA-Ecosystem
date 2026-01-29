import { createContext, useState, useEffect, useContext } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import Ecosystem1FacetABI from "../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import PropTypes from "prop-types";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { client } from "../services/client";
import { ethers } from "ethers";
import { getContract, readContract } from "thirdweb";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { defineChain } from "thirdweb/chains";

const DidContext = createContext();

export const DidProvider = ({ children }) => {
  const [did, setDid] = useState(null);
  const [didDocument, setDidDocument] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const chain = useActiveWalletChain();
  // make an api call to veramo service(running on localhost:3000) to create a did:ethr
  useEffect(() => {
    const createDID = async () => {
      if (!isConnected || !address || !chain) return;

      try {
        const response = await fetch("http://localhost:3000/did/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: "did:ethr",
            walletAddress: address,
            network: chain?.name?.toLowerCase(), // lowercased network name (e.g., "sepolia")
            // chainId: chain.id, // include explicit chainId for backend flexibility
          }),
        });

        const data = await response.json();
        console.log("DID Creation Response:", data);
        setDid(data.identifier?.did);
      } catch (error) {
        console.error("Error creating DID:", error);
      }
    };

    createDID();
  }, [address, isConnected, chain]);

  // did resolve
  useEffect(() => {
    const resolveDID = async () => {
      if (!did) return;

      try {
        const response = await fetch(
          `http://localhost:3000/did/${did}/resolve`,
        );
        const data = await response.json();
        console.log("DID Resolution Response:", data);
        setDidDocument(data?.resolution?.didDocument);
      } catch (error) {
        console.error("Error resolving DID:", error);
      }
    };

    resolveDID();
  }, [did]);

return (
    <DidContext.Provider value={{ did, didDocument }}>
      {children}
    </DidContext.Provider>
  );
};

DidProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useDid = () => useContext(DidContext);