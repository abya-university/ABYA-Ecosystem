// src/services/ipfsService.js
import { PinataSDK } from "pinata-web3";

// Initialize Pinata SDK using JWT and Gateway URL from environment variables
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

/**
 * Uploads a DID document to Pinata.
 * @param {Object} didDocument
 * @returns {Promise<string>}
 */
export const storeDidDocument = async (didDocument) => {
  try {
    // Create a blob from the JSON-stringified DID document
    const blob = new Blob([JSON.stringify(didDocument)], { type: "application/json" });
    // Create a File instance (required by the Pinata SDK)
    const file = new File([blob], "didDocument.json", { type: "application/json" });

    // Upload the file to Pinata
    const uploadResponse = await pinata.upload.file(file);
    return uploadResponse.IpfsHash;
  } catch (error) {
    console.error("Error uploading DID document to Pinata:", error);
    throw error;
  }
};

/**
 * Fetches a DID document from Pinata using the provided CID.
 * @param {string} cid
 * @returns {Promise<Object>}
 */
export const fetchDidDocument = async (cid) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error("Failed to fetch DID document from IPFS");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching DID document from Pinata:", error);
    throw error;
  }
};
