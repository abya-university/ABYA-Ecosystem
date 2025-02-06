import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const verifyIdentityOwner = async (identityDID) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS } = process.env;

    if (!INFURA_URL || !CONTRACT_ADDRESS) {
      console.error("Missing environment variables");
      throw new Error("Environment variables are missing.");
    }

    // Extract the Ethereum address from the DID string
    const identityAddress = identityDID.split(":")[3]; // Assumes DID format: did:ethr:sepolia:<address>
    if (!identityAddress) {
      throw new Error("Invalid DID format. Ensure it follows 'did:ethr:sepolia:<address>'");
    }

    console.log(`Verifying owner for identity: ${identityDID}`);

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
      provider
    );

    // Call the `identityOwner` function
    const ownerAddress = await DidReg.identityOwner(identityAddress);

    console.log(`Identity Owner for ${identityDID} is: ${ownerAddress}`);
    return ownerAddress;
  } catch (error) {
    console.error("Error verifying identity ownership:", error);
    throw error;
  }
};

// Handle command-line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const identityDID = process.argv[2]; // Get DID from command-line arguments
  if (!identityDID) {
    console.error("Usage: node didOwner.js <DID>");
    process.exit(1);
  }
  verifyIdentityOwner(identityDID);
}

// run: node src/modules/didOwner.js <DID>