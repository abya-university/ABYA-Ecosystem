import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const checkDelegate = async (identityDid, delegateType, delegate) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS } = process.env;

    if (!INFURA_URL || !CONTRACT_ADDRESS) {
      console.error("Missing environment variables");
      throw new Error("Environment variables are missing.");
    }

    // Extract the Ethereum address from the DID
    const identity = identityDid.split(":").pop(); // Extracts the Ethereum address part
    console.log(`Checking if address ${delegate} is a delegate for identity ${identity} with type ${delegateType}`);

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
      provider
    );

    // Call the `validDelegate` function
    const delegateTypeHash = ethers.id(delegateType); // Hash the delegate type
    const isValidDelegate = await DidReg.validDelegate(identity, delegateTypeHash, delegate);

    if (isValidDelegate) {
      console.log(`Address ${delegate} is a valid delegate for ${delegateType} under identity ${identity}`);
    } else {
      console.log(`Address ${delegate} is NOT a valid delegate for ${delegateType} under identity ${identity}`);
    }

    return isValidDelegate;
  } catch (error) {
    console.error("Error checking delegate validity:", error);
    throw error;
  }
};

// Handle command-line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const [identityDid, delegateType, delegate] = process.argv.slice(2);

  if (!identityDid || !delegateType || !delegate) {
    console.error("Usage: node checkDelegate.js <identityDid> <delegateType> <delegate>");
    process.exit(1);
  }

  checkDelegate(identityDid, delegateType, delegate);
}

// Run: node checkDelegate.js <identityDid> <delegateType> <delegate>

// Example: node src/modules/checkDelegate.js did:ethr:sepolia:0xeDB147c7fb742a5648359818EE0936a68Fce173d DID-JWT 0xa77759E342c83377449B2fB2eCe35b621de40Bf5