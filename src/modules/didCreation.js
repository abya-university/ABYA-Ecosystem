import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import { EthrDID } from 'ethr-did';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';

dotenv.config();

const createDid = async () => {
  try {
    const { INFURA_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

    // Ensure environment variables are present
    if (!INFURA_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
      console.error('Missing environment variables:', { INFURA_URL, PRIVATE_KEY, CONTRACT_ADDRESS });
      throw new Error('Missing environment variables.');
    }

    // Initialize Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Create EthrDID instance
    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: PRIVATE_KEY,
      provider,
      chainNameOrId: 'sepolia',  // Use SePOLIA network for testing
    });

    console.log('Generated DID:', ethrDid.did);

    // Setup DID Resolver with the correct contract address
    const resolver = new Resolver(
      getResolver({
        networks: [
          {
            name: 'sepolia',
            rpcUrl: INFURA_URL,
            registry: CONTRACT_ADDRESS,
          },
        ],
      })
    );

    // Save the DID and wallet information to a file
    const didData = {
      did: ethrDid.did,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };

    fs.writeFileSync("./src/modules/dids/dids.json", JSON.stringify(didData, null, 2));

    console.log(`DID Created: ${ethrDid.did}`);
    return didData;
  } catch (error) {
    console.error("Error creating DID:", error);
    throw error;
  }
};

// Check if the script is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Run the function only if this file is executed directly
  createDid();  // Fixed the name to match the function definition
}
