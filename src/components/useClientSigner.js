import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useMemo } from 'react';

export function useEthersSigner() {
    const { data: walletClient } = useWalletClient();

    return useMemo(() => {
        if (!walletClient) {
            console.log("No wallet client available");
            return undefined;
        }

        try {
            // Create a provider with explicit network configuration
            const provider = new ethers.BrowserProvider(
                window.ethereum,
                {
                    chainId: 1020352220,
                    name: 'skale-titan'
                }
            );

            // Override resolveName to prevent ENS resolution
            provider.resolveName = async (name) => name;

            return provider.getSigner().then(signer => {
                // Extensive logging with null checks
                console.log("Signer creation details:", {
                    signerExists: !!signer,
                    hasGetAddress: typeof signer?.getAddress === 'function'
                });

                // Ensure the signer has necessary methods
                if (typeof signer?.getAddress !== 'function') {
                    console.error("Signer is missing getAddress method");
                    throw new Error("Invalid signer object");
                }

                return signer;
            }).catch(signerError => {
                console.error("Signer creation error:", {
                    message: signerError.message,
                    name: signerError.name,
                    code: signerError.code
                });
                return undefined;
            });
        } catch (providerError) {
            console.error("Provider creation error:", {
                message: providerError.message,
                name: providerError.name
            });
            return undefined;
        }
    }, [walletClient]);
}