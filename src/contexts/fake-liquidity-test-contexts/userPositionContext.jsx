import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import contractAbi from "../../artifacts/fakeLiquidityArtifacts/Add_Swap_Contract.sol/Add_Swap_Contract.json";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import {
  getContract,
  readContract,
  sendTransaction,
  prepareContractCall,
} from "thirdweb";
import { client } from "../../services/client";
import { defineChain } from "thirdweb/chains";
import CONTRACT_ADDRESSES from "../../constants/addresses";

// Create context
const UserPositionContext = createContext();

const contract_abi = contractAbi.abi;

// Constants - Import from env or config
const CONTRACT_CONFIG = {
  ADDRESSES: {
    ADD_SWAP_CONTRACT: CONTRACT_ADDRESSES.Liquidity,
    TOKEN0: CONTRACT_ADDRESSES.ABYTKN, // ABYTKN (token0)
    TOKEN1: CONTRACT_ADDRESSES.USDC, // USDC (token1)
  },
  CHAIN: defineChain(11155111), // Sepolia chain
};

export function UserPositionProvider({ children }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token0Decimals, setToken0Decimals] = useState(18);
  const [token1Decimals, setToken1Decimals] = useState(18);

  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  // Initialize contracts with thirdweb
  const swapContract = useMemo(
    () =>
      getContract({
        client,
        address: CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        chain: CONTRACT_CONFIG.CHAIN,
        abi: contract_abi,
      }),
    [
      client,
      CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
      CONTRACT_CONFIG.CHAIN,
      contract_abi,
    ],
  );

  // Reactive data with thirdweb hooks - now includes address parameter
  const { data: userPositionsData, isLoading: positionsLoading } =
    useReadContract({
      contract: swapContract,
      method: "getUserPositions",
      params: [address],
      queryOptions: {
        enabled: !!address, // Only run query if address exists
      },
    });

  // Common error handler
  const handleError = (operation, error, fallbackMessage) => {
    console.error(`Error ${operation}:`, error);
    setError(fallbackMessage || `Failed to ${operation}`);
    return null;
  };

  // Manual contract read for complex operations
  const readContractManual = useCallback(
    async (method, params = [], accountOverride) => {
      try {
        return await readContract({
          contract: swapContract,
          method,
          params,
          account: accountOverride ?? address,
        });
      } catch (error) {
        throw new Error(`Contract read failed for ${method}: ${error.message}`);
      }
    },
    [swapContract, address],
  );

  // Fetch token decimals
  const fetchTokenDecimals = useCallback(async () => {
    try {
      // Get token addresses from contract (handle different return shapes)
      const rawToken0 = await readContractManual("token0");
      const rawToken1 = await readContractManual("token1");

      const resolveAddr = (val) => {
        if (!val) return null;
        if (typeof val === "string") return val;
        if (Array.isArray(val) && val.length > 0) return String(val[0]);
        if (val?.toString && typeof val.toString === "function") {
          const s = val.toString();
          if (s && s !== "0x") return s;
        }
        if (val?.address) return val.address;
        return null;
      };

      const token0Address = resolveAddr(rawToken0);
      const token1Address = resolveAddr(rawToken1);

      if (!token0Address || !token1Address) {
        throw new Error("Could not resolve token addresses");
      }

      // Create token contracts for decimals (use simple ERC20 ABI)
      const token0Contract = getContract({
        client,
        address: token0Address,
        chain: CONTRACT_CONFIG.CHAIN,
        abi: ["function decimals() view returns (uint8)"],
      });

      const token1Contract = getContract({
        client,
        address: token1Address,
        chain: CONTRACT_CONFIG.CHAIN,
        abi: ["function decimals() view returns (uint8)"],
      });

      // Try thirdweb readContract first, fall back to ethers provider call if needed
      let decimals0, decimals1;
      try {
        decimals0 = await readContract({
          contract: token0Contract,
          method: "decimals()",
        });
      } catch (err) {
        // try without parentheses (some providers accept both)
        try {
          decimals0 = await readContract({
            contract: token0Contract,
            method: "decimals",
          });
        } catch (e) {
          decimals0 = null;
        }
      }

      try {
        decimals1 = await readContract({
          contract: token1Contract,
          method: "decimals()",
          params: [],
        });
      } catch (err) {
        try {
          decimals1 = await readContract({
            contract: token1Contract,
            method: "decimals",
            params: [],
          });
        } catch (e) {
          decimals1 = null;
        }
      }

      // Final fallback: use ethers JsonRpcProvider to call decimals directly
      // if (decimals0 == null || decimals1 == null) {
      //   const provider = new ethers.JsonRpcProvider(
      //     import.meta.env.VITE_APP_SKALE_RPC_URL ||
      //       import.meta.env.VITE_APP_SEPOLIA_RPC_URL
      //   );
      //   if (decimals0 == null) {
      //     const token0Iface = new ethers.Interface([
      //       "function decimals() view returns (uint8)",
      //     ]);
      //     const token0ContractEthers = new ethers.Contract(
      //       token0Address,
      //       token0Iface,
      //       provider
      //     );
      //     try {
      //       decimals0 = await token0ContractEthers.decimals();
      //     } catch (err) {
      //       // console.warn("ethers fallback decimals0 failed:", err);
      //       decimals0 = 18;
      //     }
      //   }
      //   if (decimals1 == null) {
      //     const token1Iface = new ethers.Interface([
      //       "function decimals() view returns (uint8)",
      //     ]);
      //     const token1ContractEthers = new ethers.Contract(
      //       token1Address,
      //       token1Iface,
      //       provider
      //     );
      //     try {
      //       decimals1 = await token1ContractEthers.decimals();
      //     } catch (err) {
      //       console.warn("ethers fallback decimals1 failed:", err);
      //       decimals1 = 18;
      //     }
      //   }
      // }

      // Ensure numbers
      setToken0Decimals(Number(decimals0 ?? 18));
      setToken1Decimals(Number(decimals1 ?? 18));

      console.log("Token decimals:", {
        token0: token0Decimals,
        token1: token1Decimals,
      });
    } catch (error) {
      console.error("Failed to fetch token decimals:", error);
      // Fallback to default decimals
      setToken0Decimals(18);
      setToken1Decimals(18);
    }
  }, [readContractManual]);

  // Get detailed position information
  const getPositionDetails = useCallback(
    async (tokenId) => {
      try {
        console.log(`Fetching details for position ${tokenId}`);

        // First try using the direct method if it exists
        try {
          const details = await readContractManual("getPositionDetails", [
            tokenId,
          ]);
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
            error,
          );
        }

        // Fallback method: Try to get position manager and call directly
        try {
          const positionManager = await readContractManual(
            "positionManager",
          ).catch(() => null);

          if (positionManager) {
            // Use ethers for direct position manager calls
            const provider = new ethers.JsonRpcProvider(
              import.meta.env.VITE_APP_SEPOLIA_RPC_URL ||
                import.meta.env.VITE_APP_RPC_URL,
            );

            const positionManagerInterface = new ethers.Interface([
              "function positions(uint256) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
            ]);

            const positionManagerContract = new ethers.Contract(
              positionManager,
              positionManagerInterface,
              provider,
            );

            const positionData = await positionManagerContract.positions(
              tokenId,
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

        // Final fallback: Return minimal object
        console.warn(
          `Could not fetch complete details for position ${tokenId}`,
        );
        return {
          tokenId: tokenId.toString(),
          liquidity: "0",
          token0: CONTRACT_CONFIG.ADDRESSES.TOKEN0,
          token1: CONTRACT_CONFIG.ADDRESSES.TOKEN1,
        };
      } catch (error) {
        console.error(
          `Failed to get position details for token ${tokenId}:`,
          error,
        );
        return null;
      }
    },
    [readContractManual],
  );

  // Get position values (amounts of tokens)
  const getPositionAmounts = useCallback(
    async (tokenId) => {
      try {
        // Try different function names that might exist in your contract
        const methods = [
          "getPositionAmounts",
          "getTokenAmountsFromLiquidity",
          "getPositionTokenAmounts",
        ];

        for (const method of methods) {
          try {
            const result = await readContractManual(method, [tokenId]);
            if (result && result.length >= 2) {
              return {
                token0: ethers.formatUnits(result[0], token0Decimals),
                token1: ethers.formatUnits(result[1], token1Decimals),
              };
            }
          } catch (e) {
            console.warn(`Method ${method} failed:`, e);
          }
        }

        // If all methods fail, return zeros
        return { token0: "0", token1: "0" };
      } catch (error) {
        console.error(`Failed to get amounts for position ${tokenId}:`, error);
        return { token0: "0", token1: "0" };
      }
    },
    [readContractManual, token0Decimals, token1Decimals],
  );

  // Get estimated fees for a position
  const getPositionFees = useCallback(
    async (tokenId) => {
      try {
        // Try getPositionFees function first
        try {
          const result = await readContractManual("getPositionFees", [tokenId]);
          if (result && result.length >= 2) {
            return {
              token0: ethers.formatUnits(result[0], token0Decimals),
              token1: ethers.formatUnits(result[1], token1Decimals),
            };
          }
        } catch (e) {
          console.warn("getPositionFees method failed:", e);
        }

        // Alternative: try to get position details directly
        try {
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
    [readContractManual, token0Decimals, token1Decimals, getPositionDetails],
  );

  // Get all positions for the connected user (manual version for complex processing)
  const getUserPositionsManual = useCallback(async () => {
    if (!isConnected || !address) {
      setPositions([]);
      return [];
    }

    setLoading(true);
    setError(null);
    const toastId = toast.loading("Loading your positions...");

    try {
      console.log("Fetching user positions manually for address:", address);

      // Use manual read for position IDs - pass address as parameter
      const tokenIds = await readContractManual("getUserPositions", [address]);
      console.log("Raw user position IDs:", tokenIds);

      // Convert BigNumber to strings for display
      const positionIds = tokenIds.map((id) => id.toString());
      console.log("User position IDs:", positionIds);

      if (!tokenIds || tokenIds.length === 0) {
        console.log("No positions found");
        setPositions([]);
        toast.update(toastId, {
          render: "No liquidity positions found",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
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
              error,
            );
            return null;
          }
        }),
      );

      // Filter out any positions that failed to load
      const validPositions = positionsData.filter((p) => p !== null);
      console.log("Loaded positions:", validPositions);

      setPositions(validPositions);
      toast.update(toastId, {
        render: `Loaded ${validPositions.length} position${
          validPositions.length !== 1 ? "s" : ""
        }`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      return validPositions;
    } catch (error) {
      console.error("Failed to fetch user positions:", error);
      setError(`Failed to load positions: ${error.message}`);
      toast.update(toastId, {
        render: `Error loading positions: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    isConnected,
    address,
    readContractManual,
    getPositionDetails,
    getPositionAmounts,
    getPositionFees,
  ]);

  // Collect fees from a position using thirdweb transactions
  const collectFees = useCallback(
    async (tokenId) => {
      setLoading(true);
      const toastId = toast.loading("Collecting fees from position...");
      try {
        console.log(`Collecting fees for token ID: ${tokenId}`);

        // First transaction: Approve position manager
        console.log(`Approving position manager for token ID: ${tokenId}`);
        toast.update(toastId, {
          render: "Approving position manager...",
          isLoading: true,
        });

        const approveTx = sendTransaction({
          contract: swapContract,
          method: "approvePositionManager",
          params: [tokenId],
        });

        const approveReceipt = await approveTx;
        console.log(
          "Position manager approved successfully:",
          approveReceipt.transactionHash,
        );

        // Second transaction: Collect fees
        console.log(`Collecting fees for token ID: ${tokenId}`);
        toast.update(toastId, {
          render: "Collecting accumulated fees...",
          isLoading: true,
        });

        const collectTx = sendTransaction({
          contract: swapContract,
          method: "collectFees",
          params: [tokenId],
        });

        const collectReceipt = await collectTx;
        console.log(
          "Fees collected successfully:",
          collectReceipt.transactionHash,
        );

        // Refresh user positions to update UI
        await getUserPositionsManual();

        toast.update(toastId, {
          render: "Fees collected successfully!",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });

        return {
          success: true,
          hash: collectReceipt.transactionHash,
          approveHash: approveReceipt.transactionHash,
        };
      } catch (error) {
        console.error("Failed to collect fees:", error);
        setError(error.message || "Failed to collect fees");
        toast.update(toastId, {
          render: `Error collecting fees: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        return {
          success: false,
          error: error.message || "Unknown error occurred",
        };
      } finally {
        setLoading(false);
      }
    },
    [swapContract, getUserPositionsManual],
  );

  // Remove liquidity from position using thirdweb transactions
  const removeLiquidity = useCallback(
    async (tokenId, liquidityAmount) => {
      if (!account) {
        toast.error("Wallet not connected");
        return {
          success: false,
          error: "Wallet not connected",
        };
      }

      setLoading(true);
      const toastId = toast.loading("Removing liquidity from position...");
      try {
        console.log("Removing liquidity:", { tokenId, liquidityAmount });

        // First transaction: Approve position manager
        console.log(`Approving position manager for token ID: ${tokenId}`);
        toast.update(toastId, {
          render: "Approving position manager...",
          isLoading: true,
        });

        const approveTx = prepareContractCall({
          contract: swapContract,
          method: "approvePositionManager",
          params: [tokenId],
        });

        const approveReceipt = await sendTransaction({
          transaction: approveTx,
          account,
        });
        console.log(
          "Position manager approved successfully:",
          approveReceipt.transactionHash,
        );

        // Second transaction: Remove liquidity
        // Convert liquidity to uint128 (not uint256)
        const liquidityBN = BigInt(
          Math.floor(parseFloat(liquidityAmount) * 1e18),
        );

        const removeLiquidityTx = prepareContractCall({
          contract: swapContract,
          method: "removeLiquidity",
          params: [BigInt(tokenId), liquidityBN],
        });

        console.log("Sending removeLiquidity transaction...");
        toast.update(toastId, {
          render: "Processing transaction...",
          isLoading: true,
        });

        const txResult = await sendTransaction({
          transaction: removeLiquidityTx,
          account,
        });

        console.log("Transaction result:", txResult);

        // Refresh positions after successful removal
        await getUserPositionsManual();

        toast.update(toastId, {
          render: "Liquidity removed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });

        return {
          success: true,
          hash: txResult.transactionHash,
          approveHash: approveReceipt.transactionHash,
        };
      } catch (error) {
        console.error(
          `Failed to remove liquidity for position ${tokenId}:`,
          error,
        );
        toast.update(toastId, {
          render: `Error removing liquidity: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        return {
          success: false,
          error: error.message || "Transaction failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [swapContract, account, getUserPositionsManual],
  );

  // Use reactive data when available, fallback to manual
  useEffect(() => {
    if (userPositionsData && isConnected) {
      console.log("Using reactive position data:", userPositionsData);
      // Process reactive data if needed, or use manual for complex processing
      getUserPositionsManual();
    }
  }, [userPositionsData, isConnected, getUserPositionsManual]);

  // Refresh data when account changes
  useEffect(() => {
    if (isConnected) {
      console.log("Account connected - fetching data");
      toast.info("Wallet connected. Loading positions...", {
        autoClose: 2000,
      });
      fetchTokenDecimals();
      getUserPositionsManual();
    } else {
      console.log("Account disconnected - clearing positions");
      setPositions([]);
      setError(null);
    }
  }, [isConnected, fetchTokenDecimals, getUserPositionsManual]);

  const value = {
    positions,
    loading: loading || positionsLoading,
    error,
    token0Decimals,
    token1Decimals,
    getUserPositions: getUserPositionsManual,
    getPositionDetails,
    getPositionFees,
    getPositionAmounts,
    collectFees,
    removeLiquidity,
    refreshPositions: getUserPositionsManual,
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
      "useUserPositions must be used within a UserPositionProvider",
    );
  }
  return context;
}
