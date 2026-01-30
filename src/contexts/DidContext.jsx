// src/contexts/DidContext.jsx
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

// Pre-configured did:key issuer DID - Option B from Veramo documentation
// This avoids the bug in the backend's issuer DID creation ("error is not defined")
const ISSUER_DID_KEY = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";

export const DidProvider = ({ children }) => {
  const [did, setDid] = useState(null);
  const [didDocument, setDidDocument] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const chain = useActiveWalletChain();
  const [VC, setVC] = useState(null);
  const [issuerDidValue, setIssuerDidValue] = useState(null);
  const [issuerDidError, setIssuerDidError] = useState(null);

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

  // Initialize issuer DID on component mount
  useEffect(() => {
    const initializeIssuerDid = async () => {
      if (issuerDidValue) {
        console.log("[DidProvider] Issuer DID already initialized:", issuerDidValue);
        return;
      }

      try {
        console.log("[DidProvider] Initializing issuer DID via backend...");
        const response = await fetch("http://localhost:3000/did/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "did:key" }),
        });

        console.log(`[DidProvider] Issuer DID creation status: ${response.status}`);

        if (!response.ok) {
          let errMsg = `HTTP ${response.status}`;
          try {
            const errData = await response.json();
            errMsg = errData?.error || errData?.message || errMsg;
          } catch (e) {
            // ignore
          }
          throw new Error(`Failed to create issuer DID: ${errMsg}`);
        }

        const data = await response.json();
        console.log("[DidProvider] Issuer DID response:", data);

        if (!data?.identifier?.did) {
          throw new Error("Backend did:create returned no identifier.did");
        }

        setIssuerDidValue(data.identifier.did);
        setIssuerDidError(null);
        console.log("[DidProvider] ✓ Issuer DID initialized:", data.identifier.did);
      } catch (error) {
        const message = error?.message || String(error);
        console.error("[DidProvider] Failed to initialize issuer DID:", message);
        setIssuerDidError(message);
      }
    };

    initializeIssuerDid();
  }, []);

  // create DID key for issuer - lazy creation if not initialized
  const createIssuerDid = async () => {
    // If we already have a managed issuer DID recorded, return it
    if (issuerDidValue) {
      console.log("[createIssuerDid] Returning cached issuer DID:", issuerDidValue);
      return issuerDidValue;
    }

    // Try to create a did:key via the backend so the agent manages the identifier
    try {
      console.log("[createIssuerDid] Creating issuer DID via backend...");
      const response = await fetch("http://localhost:3000/did/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "did:key" }),
      });

      console.log(`[createIssuerDid] Backend response status: ${response.status}`);

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData?.error || errData?.message || errMsg;
        } catch (e) {
          // ignore
        }
        throw new Error(`Failed to create issuer DID: ${errMsg}`);
      }

      const data = await response.json();
      console.log("[createIssuerDid] Response data:", data);

      if (!data?.identifier?.did) {
        throw new Error("Backend did:create returned no identifier.did");
      }

      setIssuerDidValue(data.identifier.did);
      setIssuerDidError(null);
      console.log("[createIssuerDid] ✓ Created issuer DID:", data.identifier.did);
      return data.identifier.did;
    } catch (error) {
      const message = error?.message || String(error);
      console.error("[createIssuerDid] Error:", message);
      setIssuerDidError(message);
      throw new Error(
        `Failed to create issuer DID via backend: ${message}. \nPlease create a managed did:key on the Veramo service and retry. Example:\n  curl -X POST http://localhost:3000/did/create -H "Content-Type: application/json" -d '{"provider":"did:key"}'`
      );
    }
  };

  // VC issuance helper (exported) - issues a VC via local Veramo service
  const issueVC = async (credentialInput) => {
    console.log("[issueVC] Starting VC issuance...");
    
    // credentialInput may be either the credential object or { credential: <obj> }
    const credential = credentialInput?.credential || credentialInput;

    if (!credential) {
      console.error("[issueVC] No credential provided");
      throw new Error("No credential provided");
    }

    if (!did) {
      console.error("[issueVC] No subject DID available");
      throw new Error("Subject DID not available");
    }

    try {
      // Ensure issuer DID is a DID managed by the Veramo agent
      const issuerDid = issuerDidValue || (await createIssuerDid());
      
      if (!issuerDid) {
        throw new Error("Issuer DID is still null after initialization");
      }

      console.log("[issueVC] Using issuer DID:", issuerDid);
      console.log("[issueVC] Subject DID:", did);

      // Build credentialSubject matching backend expectation
      const credentialSubject = {
        name: credential?.learner,
        course: credential?.courseName,
        university: credential?.issuer,
        issueDate: credential?.issueDate || credential?.date,
      };

      // Remove undefined values from credentialSubject
      Object.keys(credentialSubject).forEach(
        (key) => credentialSubject[key] === undefined && delete credentialSubject[key]
      );

      const credentialPayload = {
        issuerDid,
        subjectDid: did,
        credentialSubject,
        type: ["VerifiableCredential", "CourseCompletionCredential"],
      };

      console.log("[issueVC] Payload structure:", {
        issuerDid: credentialPayload.issuerDid,
        subjectDid: credentialPayload.subjectDid,
        credentialSubject: credentialPayload.credentialSubject,
        type: credentialPayload.type,
      });
      console.log("[issueVC] Full payload being sent:", JSON.stringify(credentialPayload, null, 2));

      const response = await fetch("http://localhost:3000/credential/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentialPayload),
      });

      console.log(`[issueVC] Backend response status: ${response.status}`);

      // Check HTTP status before parsing
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorData?.message || errorMsg;
          console.error("[issueVC] Backend error data:", errorData);
        } catch (parseError) {
          // Response wasn't JSON
          const textError = await response.text();
          console.error("[issueVC] Backend error text:", textError);
        }
        throw new Error(`VC creation failed: ${errorMsg}`);
      }

      const data = await response.json();
      console.log("[issueVC] Response data:", data);

      if (data.success === false) {
        throw new Error(`Backend error: ${data.error || data.message || "Unknown error"}`);
      }

      if (!data.verifiableCredential) {
        console.warn("[issueVC] No verifiableCredential in response");
        console.log("[issueVC] Full response:", data);
      }

      setVC(data.verifiableCredential);
      console.log("[issueVC] ✓ VC issuance successful");
      console.log("[issueVC] Credential returned:", data.verifiableCredential);
      return data;
    } catch (error) {
      const errorMsg = error?.message || String(error);
      console.error("[issueVC] Error:", errorMsg);
      throw error;
    }
  };

  return (
    <DidContext.Provider value={{ did, didDocument, VC, issueVC }}>
      {children}
    </DidContext.Provider>
  );
};

DidProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useDid = () => useContext(DidContext);
