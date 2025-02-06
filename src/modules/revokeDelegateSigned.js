import { ethers } from "ethers";
import dotenv from "dotenv";
import pkg from "ethr-did-registry";
const { EthereumDIDRegistry } = pkg;

// Load environment variables
dotenv.config();

const signAndRevokeDelegate = async (identityDid, delegateType, delegate) => {
  try {
    const { INFURA_URL, CONTRACT_ADDRESS, PRIVATE_KEY } = process.env;

    if (!INFURA_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
      console.error("Missing environment variables");
      throw new Error("Environment variables are missing.");
    }

    // Extract the Ethereum address from the DID
    const identity = identityDid.split(":").pop(); // Extracts the Ethereum address part

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(INFURA_URL);

    // Create wallet with private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Hashing the delegate type
    const delegateTypeHash = ethers.id(delegateType); // Hash the delegate type

    // Create nonce (a simple example; you may need a more complex mechanism to get the actual nonce)
    const nonce = await provider.getTransactionCount(wallet.address);

    // Prepare the data to be signed
    const registryAddress = CONTRACT_ADDRESS;
    const dataToSign = ethers.utils.solidityKeccak256(
      ["bytes1", "bytes1", "address", "uint256", "address", "string", "bytes32", "address"],
      [ethers.hexlify([0x19]), ethers.hexlify([0x00]), registryAddress, nonce, identity, "revokeDelegate", delegateTypeHash, delegate]
    );

    // Sign the data
    const signature = await wallet.signMessage(ethers.utils.arrayify(dataToSign));

    // Extract V, R, S components from the signature
    const { v, r, s } = ethers.utils.splitSignature(signature);

    // Instantiate the DID Registry contract
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistry.abi,
      provider
    );

    // Call the `revokeDelegateSigned` function
    const tx = await DidReg.revokeDelegateSigned(
      identity,
      v,
      r,
      s,
      delegateTypeHash,
      delegate,
      { from: wallet.address }
    );

    console.log(`Transaction sent. Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${receipt.transactionHash}`);
  } catch (error) {
    console.error("Error revoking delegate with signature:", error);
    throw error;
  }
};

// Handle command-line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  const [identityDid, delegateType, delegate] = process.argv.slice(2);

  if (!identityDid || !delegateType || !delegate) {
    console.error("Usage: node revokeDelegateSigned.js <identityDid> <delegateType> <delegate>");
    process.exit(1);
  }

  signAndRevokeDelegate(identityDid, delegateType, delegate);
}

// Run: node revokeDelegateSigned.js <identityDid> <delegateType> <delegate>
// Example: node src/modules/revokeDelegateSigned.js did:ethr:sepolia:0xeDB147c7fb742a5648359818EE0936a68Fce173d DID-JWT 0xa77759E342c83377449B2fB2eCe35b621de40Bf5
