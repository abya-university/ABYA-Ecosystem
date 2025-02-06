import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const changeOwner = async (identityDID, newOwnerAddress) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS, CURRENT_PRIVATE_KEY } = process.env;

    // Validate environment variables
    if (!INFURA_URL || !CONTRACT_ADDRESS || !CURRENT_PRIVATE_KEY) {
      throw new Error("Missing required environment variables: INFURA_URL, CONTRACT_ADDRESS, PRIVATE_KEY.");
    }

    // Extract the Ethereum address from the DID string
    const identityAddress = identityDID.split(":")[3];
    if (!identityAddress) {
      throw new Error("Invalid DID format. Ensure it follows 'did:ethr:sepolia:<address>'");
    }

    console.log(`Changing ownership for identity: ${identityDID}`);

    // Set up provider and signer
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(CURRENT_PRIVATE_KEY, provider);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
      wallet // Use wallet as signer
    );

    // Call the `changeOwner` function
    console.log("Sending transaction to change owner...");
    const tx = await DidReg.changeOwner(identityAddress, newOwnerAddress);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`Ownership changed successfully! Transaction hash: ${tx.hash}`);
    return receipt;
  } catch (error) {
    console.error("Error changing identity ownership:", error);
    throw error;
  }
};

// Handle command-line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const identityDID = process.argv[2]; // Get DID from command-line arguments
  const newOwnerAddress = process.argv[3]; // Get new owner address from command-line arguments

  if (!identityDID || !newOwnerAddress) {
    console.error("Usage: node changeOwner.js <DID> <newOwnerAddress>");
    process.exit(1);
  }

  changeOwner(identityDID, newOwnerAddress)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}


// run: node src/modules/changeOwner.js <DID> <newOwnerAddress>

// Example: 
// node src/modules/changeOwner.js did:ethr:sepolia:0xeDB147c7fb742a5648359818EE0936a68Fce173d 0xNewOwnerAddress
