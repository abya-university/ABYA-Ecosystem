import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import { EthrDID } from 'ethr-did';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';

dotenv.config();

const createAndResolveDid = async () => {
  try {
    const { INFURA_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

    // Validate environment variables early on
    if (!INFURA_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
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
      chainNameOrId: 'sepolia',
    });

    console.log('Generated DID:', ethrDid.did);

    // Check if DID exists, skip creation if it does
    const didExists = await doesDidExist(ethrDid.did);
    if (didExists) {
      console.log(`DID ${ethrDid.did} already exists. Skipping creation.`);
      return;
    }

    // Setup DID Resolver
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

    // Resolve the DID
    const resolvedDid = await resolver.resolve(ethrDid.did);
    if (!resolvedDid.didDocument) {
      throw new Error('Failed to resolve DID.');
    }

    console.log('Resolved DID:', resolvedDid);

    // Save resolved DID Document as a JSON file using the index
    const didsPath = "./src/modules/dids/dids.json";
    let dids = [];

    if (fs.existsSync(didsPath)) {
      const existingData = fs.readFileSync(didsPath, "utf8");
      dids = JSON.parse(existingData);
    }

    const currentYear = new Date().getFullYear();
    const yearDids = dids.filter(didData => String(didData.index).startsWith(currentYear));
    const lastIndex = yearDids.length > 0 
      ? Math.max(...yearDids.map(didData => parseInt(didData.index))) 
      : currentYear * 1000;

    const newIndex = lastIndex + 1;

    const didData = {
      index: newIndex,
      did: ethrDid.did,
      address: wallet.address,
      //privateKey: wallet.privateKey, // Avoid logging in production
      createdAt: new Date().toISOString(),
    };

    // Add DID data to the list
    dids.push(didData);
    fs.writeFileSync(didsPath, JSON.stringify(dids, null, 2));
    console.log(`DID information saved to ${didsPath}`);

    // Save the resolved DID document to a new file named with the index
    const resolvedDidFilePath = `./src/modules/dids/didDocument/${newIndex}.json`;
    fs.writeFileSync(resolvedDidFilePath, JSON.stringify(resolvedDid, null, 2));
    console.log(`Resolved DID Document saved to ${resolvedDidFilePath}`);

    return ethrDid.did;
  } catch (error) {
    console.error('Error creating or resolving DID:', error.message);
    console.error(error.stack);
    throw error;
  }
};

const doesDidExist = async (did) => {
  const didsPath = "./src/modules/dids/dids.json";
  if (fs.existsSync(didsPath)) {
    const existingData = fs.readFileSync(didsPath, "utf8");
    const dids = JSON.parse(existingData);
    return dids.some(didData => didData.did === did);
  }
  return false;
};

// Execute the script if it's run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAndResolveDid();
}
