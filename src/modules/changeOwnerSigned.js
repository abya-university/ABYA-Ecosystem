import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const changeOwnerSigned = async (identityDID, newOwnerAddress, ownerPrivateKey) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS } = process.env;

    if (!INFURA_URL || !CONTRACT_ADDRESS) {
      throw new Error("Missing environment variables");
    }

    // Extract identity address from DID
    const identityAddress = identityDID.split(":")[3];
    if (!identityAddress || !ethers.isAddress(identityAddress)) {
      throw new Error("Invalid DID format or address. Ensure it follows 'did:ethr:sepolia:<address>'");
    }

    console.log(`Changing ownership for identity: ${identityDID} to new owner: ${newOwnerAddress}`);

    if (!ethers.isAddress(newOwnerAddress)) {
      throw new Error("Invalid new owner address");
    }

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const signer = new ethers.Wallet(ownerPrivateKey, provider);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
      signer
    );

    // Get nonce for current owner
    const nonce = await DidReg.nonce(identityAddress);

    // Create the hash to sign
    const hash = ethers.solidityPackedKeccak256(
      ["bytes1", "bytes1", "address", "uint256", "address", "string", "address"],
      [
        "0x19", // byte(0x19)
        "0x00", // byte(0)
        CONTRACT_ADDRESS, // Address of the registry
        nonce, // Nonce of the current owner
        identityAddress, // Identity address
        "changeOwner", // Function name
        newOwnerAddress, // New owner address
      ]
    );

    console.log(`Generated hash: ${hash}`);

    // Sign the hash
    const signature = await signer.signMessage(ethers.getBytes(hash));
    const { r, s, v } = ethers.Signature.from(signature);

    console.log(`Signature: r=${r}, s=${s}, v=${v}`);

    // Call changeOwnerSigned on the contract
    const tx = await DidReg.changeOwnerSigned(identityAddress, v, r, s, newOwnerAddress);

    console.log("Transaction sent! Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log(`Ownership changed successfully! Transaction hash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error("Error changing identity ownership with signature:", error.message);
    throw error;
  }
};

// Command-line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const identityDID = process.argv[2];
  const newOwnerAddress = process.argv[3];
  const ownerPrivateKey = process.argv[4]; // Pass private key securely

  if (!identityDID || !newOwnerAddress || !ownerPrivateKey) {
    console.error("Usage: node changeOwnerSigned.js <DID> <newOwnerAddress> <ownerPrivateKey>");
    process.exit(1);
  }

  changeOwnerSigned(identityDID, newOwnerAddress, ownerPrivateKey).catch(() => {
    process.exit(1);
  });
}

// Usage Example:
// node src/modules/changeOwnerSigned.js did:ethr:sepolia:0xYourIdentityAddress 0xNewOwnerAddress YourPrivateKey
