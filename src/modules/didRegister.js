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
    const didsData = JSON.parse(fs.readFileSync("./src/modules/dids/dids.json"));

    if (!didsData || !Array.isArray(didsData) || didsData.length === 0) {
      throw new Error("Invalid DID data. Ensure DID creation was successful.");
    }

    // Assuming the latest DID is the first in the list
    const didData = didsData[didsData.length - 1]; // You can adjust this logic based on how you want to select the DID
    const { did, address } = didData;

    if (!did || !address) {
      throw new Error("Invalid DID data. Ensure DID creation was successful.");
    }

    // Extract the Ethereum address from the DID string (remove "did:ethr:sepolia:" part)
    const ethereumAddress = did.split(":")[3]; // Extracts the address part

    // Load existing registered DID data from registeredDids.json
    const outputPath = "./src/modules/dids/registeredDids.json";
    let registeredDids = [];

    if (fs.existsSync(outputPath)) {
      registeredDids = JSON.parse(fs.readFileSync(outputPath));
    }

    // Check if the DID is already registered
    const isAlreadyRegistered = registeredDids.some((entry) => entry.did === did);

    if (isAlreadyRegistered) {
      console.log(`DID already registered: ${did}`);
      return;
    }

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
      ethereumAddress, // Ethereum address extracted from the DID
      address // DID owner's address
    );

    await tx.wait(); // Wait for the transaction to be mined

    console.log(`DID successfully registered: ${did}`);
    console.log(`Transaction hash: ${tx.hash}`);

    // Prepare the data to write to the JSON file
    const registeredDidData = {
      did,
      address,
      transactionHash: tx.hash,
      registeredAt: new Date().toISOString() // Add timestamp
    };

    // Append the new DID registration data
    registeredDids.push(registeredDidData);

    // Write the updated data back to the file
    fs.writeFileSync(outputPath, JSON.stringify(registeredDids, null, 2));

    console.log(`DID data written to registeredDids.json`);
  } catch (error) {
    console.error("Error during DID registration:", error);
  }
};

// Execute if the script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  registerDid();
}
