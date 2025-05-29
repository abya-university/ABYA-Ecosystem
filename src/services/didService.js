// didService.js

import { ethers } from "ethers";
import { EthrDID } from "ethr-did";
import { Resolver } from "did-resolver";
import { getResolver } from "ethr-did-resolver";


/**
 * Create an Ethr-DID instance (and return its DID URI)
 * directly from a connected ethers.js Signer.
 */
export const createDidFromSigner = async (signer, registryAddress, chainName = "sepolia") => {
  if (!signer) throw new Error("Ethers signer is required");

  const address = await signer.getAddress();

  const ethrDid = new EthrDID({
    identifier: address,
    signer,                       // ← pass the signer instead of privateKey
    chainNameOrId: chainName,
    registry: registryAddress,
  });

  return ethrDid.did;          
};

/**
 * Create a DID using the provided private key.
 */
export const createDid = async (privateKey, infuraUrl, contractAddress) => {
  try {
    if (!privateKey) throw new Error("Private key is required");

    const formattedPrivateKey = privateKey.startsWith("0x")
      ? privateKey.slice(2)
      : privateKey;

    const provider = new ethers.JsonRpcProvider(infuraUrl);
    const wallet = new ethers.Wallet(`0x${formattedPrivateKey}`, provider);

    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey.replace(/^0x/, ""),
      provider,
      chainNameOrId: "sepolia",
    });

    console.log("Generated DID:", ethrDid.did);
    return ethrDid.did;
  } catch (error) {
    console.error("Error in createDid:", error.message);
    throw new Error(`DID creation failed: ${error.message}`);
  }
};

/**
 * Resolve a DID and retrieve its document.
 */
export const resolveDid = async (did, infuraUrl, contractAddress) => {
  try {
    if (!did) throw new Error("DID is required for resolution");

    const resolver = new Resolver(
      getResolver({
        networks: [
          {
            name: "sepolia",
            rpcUrl: infuraUrl,
            registry: contractAddress,
          },
        ],
      })
    );

    const resolvedDid = await resolver.resolve(did);
    if (!resolvedDid || !resolvedDid.didDocument) {
      throw new Error("Failed to resolve DID.");
    }

    console.log("Resolved DID Document:", resolvedDid.didDocument);
    return resolvedDid.didDocument;
  } catch (error) {
    console.error("Error in resolveDid:", error.message);
    throw new Error(`DID resolution failed: ${error.message}`);
  }
};
