// ipfsService.js

import { PinataSDK } from "pinata-web3";

// Initialize Pinata SDK using JWT and Gateway URL from environment variables
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

/**
 * Uploads a DID document to Pinata with a filename that includes the DID.
 * @param {string} did - The DID for which the document is generated.
 * @param {Object} didDocument - The DID document object.
 * @returns {Promise<string>} - The IPFS hash (CID) of the uploaded document.
 */
export const storeDidDocument = async (did, didDocument) => {
  try {
    const documentString = JSON.stringify(didDocument, null, 2);
    const blob = new Blob([documentString], { type: "application/json" });
    const safeDid = did.replace(/:/g, ":");
    const fileName = `diddoc-${safeDid}.json`;
    const file = new File([blob], fileName, { type: "application/json" });
    const uploadResponse = await pinata.upload.file(file);
    return uploadResponse.IpfsHash;
  } catch (error) {
    console.error("Error uploading DID document to Pinata:", error);
    throw error;
  }
};

/**
 * Fetches a DID document from Pinata using the provided CID.
 * @param {string} cid - The IPFS CID of the DID document.
 * @returns {Promise<Object>} - The fetched DID document object.
 */
export const fetchDidDocument = async (cid) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${cid}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch DID document from IPFS");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching DID document from Pinata:", error);
    throw error;
  }
};

/**
 * Helper function to retrieve the current DID registry CID (if it exists)
 * by searching for a file with metadata name "did.json".
 * @returns {Promise<string|null>} - The current registry CID or null if not found.
 */
const getDidRegistryCid = async () => {
  try {
    const response = await pinata.pinList({ name: "did.json" });
    if (response.count > 0 && response.rows.length > 0) {
      return response.rows[0].ipfs_pin_hash;
    }
    return null;
  } catch (error) {
    console.error("Error fetching DID registry from Pinata:", error);
    return null;
  }
};

/**
 * Updates the DID registry on Pinata by appending a new DID record with a timestamp.
 *
 * @param {Object} params - Parameters for the update.
 * @param {string} params.did - The newly generated DID.
 * @param {string} params.didDocumentCid - The IPFS CID of the stored DID document.
 * @param {string} params.didOwner - The owner of the DID.
 * @returns {Promise<string>} - The CID of the updated did.json file.
 */
export const updateDidRegistry = async ({ did, didDocumentCid, didOwner }) => {
  try {
    const currentCid = await getDidRegistryCid();
    let registry;
    if (currentCid) {
      registry = await fetchDidDocument(currentCid);
    } else {
      registry = { dids: [] };
    }
    registry.dids.push({
      did,
      didOwner,
      didDocumentCid,
      timestamp: new Date().toISOString(),
    });
    const registryString = JSON.stringify(registry, null, 2);
    const blob = new Blob([registryString], { type: "application/json" });
    const file = new File([blob], "did.json", { type: "application/json" });
    const uploadResponse = await pinata.upload.file(file, {
      pinataMetadata: { name: "did.json" },
    });
    return uploadResponse.IpfsHash;
  } catch (error) {
    console.error("Error updating DID registry on Pinata:", error);
    throw error;
  }
};

/**
 * Stores a student profile on Pinata by creating a JSON file that maps the student profile 
 * with the associated DID and the CID of the DID document.
 *
 * @param {string} did - The DID of the student.
 * @param {Object} profileData - The profile data including student information.
 * @returns {Promise<string>} - The IPFS hash (CID) of the stored profile.
 */
export const storeStudentProfile = async (did, profileData) => {
  try {
    const profileString = JSON.stringify(profileData, null, 2);
    const blob = new Blob([profileString], { type: "application/json" });
    const safeDid = did.replace(/:/g, ":");
    const fileName = `profile-${safeDid}.json`;
    const file = new File([blob], fileName, { type: "application/json" });
    const uploadResponse = await pinata.upload.file(file, {
      pinataMetadata: { name: `profile-${safeDid}` },
    });
    return uploadResponse.IpfsHash;
  } catch (error) {
    console.error("Error uploading student profile to Pinata:", error);
    throw error;
  }
};



/**
 * Unpins a given CID from Pinata to free up space.
 * @param {string} cid - The IPFS CID to unpin.
 */
export const unpinCID = async (cid) => {
  try {
    await pinata.unpin(cid);
    console.log(`Successfully unpinned CID: ${cid}`);
  } catch (error) {
    console.error(`Failed to unpin CID ${cid}:`, error);
    throw error;
  }
};





// Optional Wallet Connection

/**
 * Append a new DID entry into the global `did.json` registry on Pinata.
 * @param {string} did       - The full did:ethr:… string
 * @param {string} cid       - The IPFS CID of the DID document itself
 * @param {string} owner     - The on‐chain owner address
 * @returns {Promise<string>} - The new global registry CID
 */
export async function registerDidInGlobalRegistry({ did, cid, owner }) {
  // 1) fetch the latest did.json pin (if any)
  let existing = { dids: [] };
  try {
    const list = await pinata.pinList({ name: "did.json" });
    if (list.count > 0) {
      const latestHash = list.rows[0].ipfs_pin_hash;
      const resp = await fetch(`${process.env.VITE_PINATA_GATEWAY}/ipfs/${latestHash}`);
      existing = await resp.json();
    }
  } catch (err) {
    console.warn("No existing registry or fetch error:", err);
  }

  // 2) append our new entry
  existing.dids.push({
    did,
    owner,
    didDocumentCid: cid,
    timestamp: new Date().toISOString(),
  });

  // 3) re‐upload updated did.json
  const blob = new Blob([JSON.stringify(existing, null, 2)], {
    type: "application/json",
  });
  const file = new File([blob], "did.json", { type: "application/json" });
  const upload = await pinata.upload.file(file, {
    pinataMetadata: { name: "did.json" },
  });
  return upload.IpfsHash;
}


/**
 * Append a new DID + timestamp to a global DID registry on Pinata.
 * @param {string} did
 * @returns {Promise<string>}  the new registry CID
 */
export const registerDidOnIpfs = async (did) => {
  try {
    // 1. see if we already have a registry pinned:
    const existingCid = await getDidRegistryCid(/* look for “did-registry.json” */);
    let registry;

    if (existingCid) {
      // fetch the old registry array
      registry = await fetchDidDocument(existingCid);
    } else {
      registry = { dids: [] };
    }

    // 2. append the new entry
    registry.dids.push({
      did,
      timestamp: new Date().toISOString(),
    });

    // 3. upload the updated registry
    const registryString = JSON.stringify(registry, null, 2);
    const blob = new Blob([registryString], { type: "application/json" });
    const file = new File([blob], "did-registry.json", { type: "application/json" });
    const uploadResponse = await pinata.upload.file(file, {
      pinataMetadata: { name: "did-registry.json" },
    });

    return uploadResponse.IpfsHash;
  } catch (err) {
    console.error("Error updating DID registry:", err);
    throw err;
  }
};

