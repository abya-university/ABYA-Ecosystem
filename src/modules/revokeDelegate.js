import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const revokeDelegate = async (identityDid, delegateType, delegate) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS, PRIVATE_KEY } = process.env;

    if (!INFURA_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
      console.error("❌ Missing environment variables");
      throw new Error("Environment variables are missing.");
    }

    // Extract the Ethereum address from the DID
    const identity = identityDid.split(":").pop(); // Extracts Ethereum address

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);

    // Create wallet with private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("✅ Transaction sender:", wallet.address);
    console.log("✅ DID identity owner:", identity);

    // Ensure the wallet is the DID controller
    if (wallet.address.toLowerCase() !== identity.toLowerCase()) {
      console.error("⚠️ Wallet is not the controller of this DID. Revocation may fail.");
    }

    // Instantiate the DID Registry contract **WITH A SIGNER**
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi,
      wallet // Use wallet instead of provider
    );

    // Encode delegateType correctly
    const delegateTypeHash = ethers.id(delegateType);
    console.log("🔹 Encoded delegateType:", delegateTypeHash);

    // Call the revokeDelegate function
    console.log(`🚀 Sending transaction to revoke delegate: ${delegate}`);
    const tx = await DidReg.revokeDelegate(identity, delegateTypeHash, delegate);
    console.log("⏳ Transaction sent. Waiting for confirmation...");

    // Wait for confirmation (3 blocks for extra security)
    const receipt = await tx.wait(3);
    console.log("✅ Transaction confirmed:", receipt);

    // Check logs to confirm revocation
    console.log("🔍 Checking transaction logs...");
    const revokedEvent = receipt.logs.find(log => log.topics.includes(ethers.id("RevokedDelegate(address,bytes32,address)")));
    
    if (revokedEvent) {
      console.log("🎉 Revocation successful! Delegate removed.");
    } else {
      console.warn("⚠️ No RevokedDelegate event found. Ensure revocation was processed.");
    }

    // Verify delegate status
    const isValid = await DidReg.validDelegate(identity, delegateTypeHash, delegate);
    console.log(`🔍 Delegate ${delegate} valid: ${isValid ? "✅ Yes" : "❌ No"}`);
    
  } catch (error) {
    console.error("❌ Error revoking delegate:", error);
    throw error;
  }
};

// Handle command-line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const [identityDid, delegateType, delegate] = process.argv.slice(2);

  if (!identityDid || !delegateType || !delegate) {
    console.error("Usage: node revokeDelegate.js <identityDid> <delegateType> <delegate>");
    process.exit(1);
  }

  revokeDelegate(identityDid, delegateType, delegate);
}

// Run: node revokeDelegate.js <identityDid> <delegateType> <delegate>
// Example: node src/modules/revokeDelegate.js did:ethr:sepolia:0xeDB147c7fb742a5648359818EE0936a68Fce173d DID-JWT 0xa77759E342c83377449B2fB2eCe35b621de40Bf5
