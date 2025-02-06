import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

export const storeDidDocument = async (didDocument) => {
  try {
    const blob = new Blob([JSON.stringify(didDocument)], { type: "application/json" });
    const file = new File([blob], "didDocument.json", { type: "application/json" });

    const upload = await pinata.upload.file(file);
    return upload.IpfsHash; // Returns the CID of the uploaded DID document
  } catch (error) {
    console.error("Error uploading DID document to IPFS:", error);
    throw error;
  }
};

export const fetchDidDocument = async (cid) => {
  try {
    const response = await fetch(`https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error("Failed to fetch DID document from IPFS");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching DID document from IPFS:", error);
    throw error;
  }
};
