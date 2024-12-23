import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

dotenv.config();

const registerDid = async () => {
  try {
    const { INFURA_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

    if (!INFURA_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
      console.error("Missing environment variables");
      throw new Error("Environment variables are missing.");
    }

    // Load the DID information from dids.json
    const didData = JSON.parse(fs.readFileSync("./src/modules/dids/dids.json"));

    if (!didData || !didData.did || !didData.address) {
      throw new Error("Invalid DID data. Ensure DID creation was successful.");
    }

    const { did, address } = didData;

    // Extract the Ethereum address from the DID string (remove "did:ethr:sepolia:" part)
    const ethereumAddress = did.split(":")[3]; // Extracts the address part

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
      wallet
    );

    // Register the DID by changing the owner
    console.log("Registering DID:", did);
    const tx = await DidReg.changeOwner(
      ethereumAddress,  // Ethereum address extracted from the DID
      address           // DID owner's address
    );

    await tx.wait(); // Wait for the transaction to be mined

    console.log(`DID successfully registered: ${did}`);
    console.log(`Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Error during DID registration:", error);
  }
};

// Execute if the script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  registerDid();
}
