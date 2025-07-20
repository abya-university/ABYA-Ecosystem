import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import contractAbi from "../../artifacts/fake-liquidity-abis/add_swap_contract.json";
import { useEthersSigner } from "../../components/useClientSigner";

// Create context
const UserPositionContext = createContext();

const contract_abi = contractAbi.abi;

// Constants - Import from env or config
const CONTRACT_ADDRESSES = {
  ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_ADD_SWAP_CONTRACT,
  TOKEN0: import.meta.env.VITE_APP_USDC_ADDRESS,
  TOKEN1: import.meta.env.VITE_APP_ABYATKN_ADDRESS,
};

export function UserPositionProvider({ children }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token0Decimals, setToken0Decimals] = useState(18);
  const [token1Decimals, setToken1Decimals] = useState(18);
  const { isConnected } = useAccount();
  const signerPromise = useEthersSigner();

  // Initialize contract with user's signer
  const getContract = useCallback(async () => {
    try {
      if (!signerPromise) return null;
      const signer = await signerPromise;
      if (!signer) throw new Error("No signer available");
      return new ethers.Contract(
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
        contract_abi,
        signer
      );
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      setError("Failed to connect to contract");
      return null;
    }
  }, [signerPromise]);

  // Fetch token decimals
  const fetchTokenDecimals = useCallback(async () => {
    try {
      const contract = await getContract();
      if (!contract) return;

      const token0Address = await contract.token0();
      const token1Address = await contract.token1();

      const token0Contract = new ethers.Contract(
        token0Address,
        ["function decimals() view returns (uint8)"],
        contract.runner
      );

      const token1Contract = new ethers.Contract(
        token1Address,
        ["function decimals() view returns (uint8)"],
        contract.runner
      );

      const [decimals0, decimals1] = await Promise.all([
        token0Contract.decimals(),
        token1Contract.decimals(),
      ]);

      setToken0Decimals(decimals0);
      setToken1Decimals(decimals1);
    } catch (error) {
      console.error("Failed to fetch token decimals:", error);
    }
  }, [getContract]);

  // Get detailed position information
  const getPositionDetails = useCallback(
    async (tokenId) => {
      try {
        const contract = await getContract();
        if (!contract) return null;

        console.log(`Fetching details for position ${tokenId}`);

        // First try using the direct method if it exists
        try {
          const details = await contract.getPositionDetails(tokenId);
          return {
            tokenId: tokenId.toString(),
            token0: details.token0,
            token1: details.token1,
            liquidity: details.liquidity.toString(),
            feeGrowthInside0: details.feeGrowthInside0?.toString() || "0",
            feeGrowthInside1: details.feeGrowthInside1?.toString() || "0",
            tokensOwed0: details.tokensOwed0?.toString() || "0",
            tokensOwed1: details.tokensOwed1?.toString() || "0",
          };
        } catch (error) {
          console.warn(
            "Could not use getPositionDetails, trying alternative methods:",
            error
          );
        }

        // Fallback method: Call position manager directly or use another contract function
        try {
          // Get the position manager address from your contract
          const positionManager = await contract
            .positionManager()
            .catch(() => null);

          if (positionManager) {
            // Define a minimal interface for the position manager
            const positionManagerInterface = new ethers.Interface([
              "function positions(uint256) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
            ]);

            const positionManagerContract = new ethers.Contract(
              positionManager,
              positionManagerInterface,
              contract.runner
            );

            const positionData = await positionManagerContract.positions(
              tokenId
            );

            return {
              tokenId: tokenId.toString(),
              token0: positionData.token0,
              token1: positionData.token1,
              liquidity: positionData.liquidity.toString(),
              feeGrowthInside0:
                positionData.feeGrowthInside0LastX128?.toString() || "0",
              feeGrowthInside1:
                positionData.feeGrowthInside1LastX128?.toString() || "0",
              tokensOwed0: positionData.tokensOwed0?.toString() || "0",
              tokensOwed1: positionData.tokensOwed1?.toString() || "0",
            };
          }
        } catch (error) {
          console.warn("Could not use position manager directly:", error);
        }

        // Final fallback: Return a minimal object with the token ID
        console.warn(
          `Could not fetch complete details for position ${tokenId}`
        );
        return {
          tokenId: tokenId.toString(),
          liquidity: "0",
        };
      } catch (error) {
        console.error(
          `Failed to get position details for token ${tokenId}:`,
          error
        );
        return null;
      }
    },
    [getContract]
  );

  // Get position values (amounts of tokens)
  const getPositionAmounts = useCallback(
    async (tokenId) => {
      try {
        const contract = await getContract();
        if (!contract) return { token0: "0", token1: "0" };

        // Try different function names that might exist in your contract
        const methods = [
          "getPositionAmounts",
          "getTokenAmountsFromLiquidity",
          "getPositionTokenAmounts",
        ];

        for (const method of methods) {
          if (typeof contract[method] === "function") {
            try {
              const [amount0, amount1] = await contract[method](tokenId);
              return {
                token0: ethers.formatUnits(amount0, token0Decimals),
                token1: ethers.formatUnits(amount1, token1Decimals),
              };
            } catch (e) {
              console.warn(`Method ${method} failed:`, e);
            }
          }
        }

        // If all methods fail, return zeros
        return { token0: "0", token1: "0" };
      } catch (error) {
        console.error(`Failed to get amounts for position ${tokenId}:`, error);
        return { token0: "0", token1: "0" };
      }
    },
    [getContract, token0Decimals, token1Decimals]
  );

  // Get estimated fees for a position
  const getPositionFees = useCallback(
    async (tokenId) => {
      try {
        const contract = await getContract();
        if (!contract) return { token0: "0", token1: "0" };

        try {
          // Try getPositionFees function first
          if (typeof contract.getPositionFees === "function") {
            const [fees0, fees1] = await contract.getPositionFees(tokenId);
            return {
              token0: ethers.formatUnits(fees0, token0Decimals),
              token1: ethers.formatUnits(fees1, token1Decimals),
            };
          }
        } catch (e) {
          console.warn("getPositionFees method failed:", e);
        }

        try {
          // Alternative: try to get position details directly
          const details = await getPositionDetails(tokenId);
          if (details && details.tokensOwed0 && details.tokensOwed1) {
            return {
              token0: ethers.formatUnits(details.tokensOwed0, token0Decimals),
              token1: ethers.formatUnits(details.tokensOwed1, token1Decimals),
            };
          }
        } catch (e) {
          console.warn("Failed to get fees from position details:", e);
        }

        // If all methods fail, return zeros
        return { token0: "0", token1: "0" };
      } catch (error) {
        console.error(`Failed to get fees for position ${tokenId}:`, error);
        return { token0: "0", token1: "0" };
      }
    },
    [getContract, token0Decimals, token1Decimals, getPositionDetails]
  );

  // Get all positions for the connected user
  const getUserPositions = useCallback(async () => {
    if (!isConnected) {
      setPositions([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching user positions...");
      const contract = await getContract();
      if (!contract) {
        console.error("Contract not available");
        setLoading(false);
        return [];
      }

      // Call the contract's getUserPositions function
      const tokenIds = await contract.getUserPositions();
      console.log("Raw user position IDs:", tokenIds);

      // Convert BigNumber to strings for display
      const positionIds = tokenIds.map((id) => id.toString());
      console.log("User position IDs:", positionIds);

      if (!tokenIds || tokenIds.length === 0) {
        console.log("No positions found");
        setPositions([]);
        setLoading(false);
        return [];
      }

      // Get detailed information for each position
      const positionsData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            // Get basic position details
            const details = await getPositionDetails(tokenId);
            if (!details) return null;

            // Get token amounts
            const amounts = await getPositionAmounts(tokenId);

            // Get fees
            const fees = await getPositionFees(tokenId);

            return {
              tokenId: tokenId.toString(),
              ...details,
              ...amounts,
              fees,
            };
          } catch (error) {
            console.error(
              `Error fetching details for position ${tokenId}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any positions that failed to load
      const validPositions = positionsData.filter((p) => p !== null);
      console.log("Loaded positions:", validPositions);

      setPositions(validPositions);
      return validPositions;
    } catch (error) {
      console.error("Failed to fetch user positions:", error);
      setError(`Failed to load positions: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    isConnected,
    getContract,
    getPositionDetails,
    getPositionAmounts,
    getPositionFees,
  ]);

  // Collect fees from a position
  const collectFees = useCallback(
    async (tokenId) => {
      setLoading(true);
      try {
        const contract = await getContract();
        if (!contract) throw new Error("Contract not initialized");

        // First transaction: Approve position manager
        console.log(`Approving position manager for token ID: ${tokenId}`);
        const approveTx = await contract.approvePositionManager(tokenId);
        const approveReceipt = await approveTx.wait();

        if (approveReceipt.status !== 1) {
          throw new Error("Approval transaction failed");
        }
        console.log("Position manager approved successfully");

        // Second transaction: Collect fees
        console.log(`Collecting fees for token ID: ${tokenId}`);
        const collectTx = await contract.collectFees(tokenId);
        const collectReceipt = await collectTx.wait();

        if (collectReceipt.status !== 1) {
          throw new Error("Fee collection transaction failed");
        }

        // Refresh user positions to update UI
        await getUserPositions();

        return {
          success: true,
          hash: collectReceipt.transactionHash,
          approveHash: approveReceipt.transactionHash,
        };
      } catch (error) {
        console.error("Failed to collect fees:", error);
        setError(error.message || "Failed to collect fees");
        return {
          success: false,
          error: error.message || "Unknown error occurred",
        };
      } finally {
        setLoading(false);
      }
    },
    [getContract, getUserPositions]
  );

  // Remove liquidity from position
  const removeLiquidity = useCallback(
    async (tokenId, liquidityAmount) => {
      setLoading(true);
      try {
        const contract = await getContract();
        if (!contract) throw new Error("Contract not initialized");

        const tx = await contract.removeLiquidity(
          tokenId,
          ethers.parseUnits(liquidityAmount.toString(), 18) // Assuming 18 decimals for liquidity
        );
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          return { success: true, hash: tx.hash };
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error) {
        console.error(
          `Failed to remove liquidity for position ${tokenId}:`,
          error
        );
        return {
          success: false,
          error: error.reason || error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  // Refresh data when account changes
  useEffect(() => {
    if (isConnected) {
      console.log("Account connected - fetching data");
      fetchTokenDecimals();
      getUserPositions();
    } else {
      console.log("Account disconnected - clearing positions");
      setPositions([]);
    }
  }, [isConnected, fetchTokenDecimals, getUserPositions]);

  const value = {
    positions,
    loading,
    error,
    token0Decimals,
    token1Decimals,
    getUserPositions,
    getPositionDetails,
    getPositionFees,
    getPositionAmounts,
    collectFees,
    removeLiquidity,
    refreshPositions: getUserPositions,
  };

  return (
    <UserPositionContext.Provider value={value}>
      {children}
    </UserPositionContext.Provider>
  );
}

export function useUserPositions() {
  const context = useContext(UserPositionContext);
  if (context === undefined) {
    throw new Error(
      "useUserPositions must be used within a UserPositionProvider"
    );
  }
  return context;
}
