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
