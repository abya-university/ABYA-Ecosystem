import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const addDelegate = async (identityDid, delegateType, delegate, validity) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS, PRIVATE_KEY } = process.env;

    if (!INFURA_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
      console.error("Missing environment variables");
      throw new Error("Environment variables are missing.");
    }

    // Extract the Ethereum address from the DID
    const identity = identityDid.split(":").pop(); // Extracts the Ethereum address part
    console.log(`Adding delegate ${delegate} for identity ${identity} with type ${delegateType} and validity ${validity} seconds`);

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);

    // Set up a signer using the private key of the identity owner
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
      signer
    );

    // Hash the delegate type
    const delegateTypeHash = ethers.id(delegateType);

    // Add the delegate
    const tx = await DidReg.addDelegate(identity, delegateTypeHash, delegate, validity);
    console.log("Transaction sent. Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    console.log(`Delegate ${delegate} added successfully for ${delegateType} under identity ${identity}`);
    return receipt;
  } catch (error) {
    console.error("Error adding delegate:", error);
    throw error;
  }
};

// Handle command-line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const [identityDid, delegateType, delegate, validity] = process.argv.slice(2);

  if (!identityDid || !delegateType || !delegate || !validity) {
    console.error("Usage: node addDelegate.js <identityDid> <delegateType> <delegate> <validity>");
    process.exit(1);
  }

  addDelegate(identityDid, delegateType, delegate, parseInt(validity, 10));
}

// Run: node addDelegate.js <identityDid> <delegateType> <delegate> <validity>

// Example: node src/modules/addDelegate.js did:ethr:sepolia:0xeDB147c7fb742a5648359818EE0936a68Fce173d DID-JWT 0xa77759E342c83377449B2fB2eCe35b621de40Bf5 3600
