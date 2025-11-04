import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { ethers } from "ethers";
import CONTRACT_ABI from "../../artifacts/fakeLiquidityArtifacts/Add_Swap_Contract.sol/Add_Swap_Contract.json";
import USDC_ABI from "../../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";
import ABYTKN_ABI from "../../artifacts/fakeLiquidityArtifacts/ABYATKN.sol/ABYATKN.json";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { client } from "../../services/client";
import { defineChain } from "thirdweb/chains";

// Constants and Configuration
const CONTRACT_CONFIG = {
  ABI: {
    SWAP: CONTRACT_ABI.abi,
    USDC: USDC_ABI.abi,
    ABYTKN: ABYTKN_ABI.abi,
  },
  ADDRESSES: {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_SEPOLIA_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_ADDRESS, // ABYTKN
    TOKEN1: import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS, // USDC
    UNISWAP_POOL: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_USDC_500,
  },
  CHAIN: defineChain(11155111),
  METHODS: {
    BALANCE_OF: "function balanceOf(address account) view returns (uint256)",
    GET_POOL_INFO:
      "function getPoolInfo() view returns (uint160 sqrtPriceX96, int24 tick, uint128 liquidity)",
    GET_POOL_BALANCES:
      "function getPoolBalances() view returns (uint256 bal0, uint256 bal1)",
    GET_TOKEN_PRICE: "function getTokenPrice() view returns (uint256 price)",
    GET_TX_HISTORY:
      "function getUserTransactionHistory() view returns ((uint256 id, uint8 transactionType, string fromToken, string toToken, uint256 fromAmount, uint256 toAmount, uint256 timestamp, bytes32 hash, string status)[])",
  },
};

// Utility Functions
const ContractUtils = {
  // Common contract creation function
  createContract: (address, abi) => {
    return getContract({
      client,
      address,
      chain: CONTRACT_CONFIG.CHAIN,
      abi,
    });
  },

  // Common contract read function (manual for complex cases)
  readContractManual: async (contract, method, params = []) => {
    return readContract({
      contract,
      method,
      params,
    });
  },

  // Format transaction data consistently
  formatTransaction: (tx, index) => {
    const tokenMapping = {
      [CONTRACT_CONFIG.ADDRESSES.TOKEN0?.toLowerCase()]: "ABYTKN",
      [CONTRACT_CONFIG.ADDRESSES.TOKEN1?.toLowerCase()]: "USDC",
    };

    return {
      id: Number(tx.id) || index,
      type: Number(tx.transactionType) === 1 ? "swap" : "liquidity",
      fromToken: tokenMapping[tx.fromToken?.toLowerCase()] || "Unknown",
      toToken: tokenMapping[tx.toToken?.toLowerCase()] || "Unknown",
      fromAmount: ethers.formatUnits(tx.fromAmount || 0, 18),
      toAmount: ethers.formatUnits(tx.toAmount || 0, 18),
      timestamp: new Date(Number(tx.timestamp || 0) * 1000),
      hash: tx.hash,
      status: tx.status || "confirmed",
    };
  },

  // Get token balance with consistent formatting
  getTokenBalance: async (contract, address) => {
    const balance = await ContractUtils.readContractManual(
      contract,
      "balanceOf",
      [address]
    );
    return balance ? ethers.formatUnits(balance, 18) : "0.0";
  },
};

const PriceUtils = {
  // Calculate price impact and minimum received
  calculatePriceImpact: (inputAmount, output, slippageTolerance) => {
    const impact = Math.min((parseFloat(inputAmount) / 1000) * 0.1, 5);
    const minReceived = (
      parseFloat(output) *
      (1 - slippageTolerance / 100)
    ).toFixed(6);
    return { impact, minReceived };
  },

  // Calculate ratio validation
  calculateRatioWithPoolPrice: (token0Amount, token1Amount, poolPrice) => {
    if (!token0Amount || !token1Amount || !poolPrice) return null;

    const amount0 = parseFloat(token0Amount);
    const amount1 = parseFloat(token1Amount);

    if (amount0 <= 0 || amount1 <= 0) return null;

    const currentRatio = amount1 / amount0;
    const tolerance = 0.05;

    const isValidRatio =
      Math.abs(currentRatio - poolPrice) / poolPrice <= tolerance;

    return {
      ratio: currentRatio,
      poolPrice,
      isValidRatio,
      tolerance,
      suggestedToken1Amount: (amount0 * poolPrice).toFixed(6),
      suggestedToken0Amount: (amount1 / poolPrice).toFixed(6),
      priceDifference: (((currentRatio - poolPrice) / poolPrice) * 100).toFixed(
        2
      ),
    };
  },
};

// Create the context
const TransactionHistoryContext = createContext();

// Create a provider component
export function TransactionHistoryProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isInitialRatio, setIsInitialRatio] = useState(true);
  const [poolPrice, setPoolPrice] = useState(1000);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);

  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  // Pool information
  const [poolInfo, setPoolInfo] = useState({
    liquidity: "0.0",
    volume24h: "0.0",
    fees24h: "0.0",
    apr: "0.0",
    token0Price: "0.0",
    token1Price: "0.0",
    sqrtPriceX96: "N/A",
    tick: "N/A",
    token0Balance: "N/A",
    token1Balance: "N/A",
  });

  // Token balances
  const [balances, setBalances] = useState({
    ABYTKN: "0.0",
    USDC: "0.0",
    ETH: "0.0",
  });

  // Use refs for values that don't need to trigger re-renders
  const isMountedRef = useRef(true);

  // Initialize contracts - use useMemo to prevent recreation on every render
  const swapContract = React.useMemo(
    () =>
      ContractUtils.createContract(
        CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        CONTRACT_CONFIG.ABI.SWAP
      ),
    []
  );

  const abytknContract = React.useMemo(
    () =>
      ContractUtils.createContract(
        CONTRACT_CONFIG.ADDRESSES.TOKEN0,
        CONTRACT_CONFIG.ABI.ABYTKN
      ),
    []
  );

  const usdcContract = React.useMemo(
    () =>
      ContractUtils.createContract(
        CONTRACT_CONFIG.ADDRESSES.TOKEN1,
        CONTRACT_CONFIG.ABI.USDC
      ),
    []
  );

  // Common error handler - useCallback to prevent recreation
  const handleError = useCallback((operation, error, fallbackMessage) => {
    console.error(`Error ${operation}:`, error);
    setError(fallbackMessage || `Failed to ${operation}`);
    return null;
  }, []);

  // Function to fetch transaction history from the contract
  const fetchTransactionHistory = useCallback(async () => {
    if (!isConnected || !address) return;

    setLoading(true);
    setError(null);

    try {
      const txHistoryData = await ContractUtils.readContractManual(
        swapContract,
        "getUserTransactionHistory"
      );

      console.log("Raw transaction history:", txHistoryData);

      const formattedTransactions = txHistoryData.map((tx, index) =>
        ContractUtils.formatTransaction(tx, index)
      );

      console.log("Formatted transactions:", formattedTransactions);
      setTransactions(formattedTransactions);
    } catch (err) {
      handleError("fetching transaction history", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isConnected, address, swapContract, handleError]);

  // Manual balance loading
  const loadBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const [manualAbytknBalance, manualUsdcBalance] = await Promise.all([
        ContractUtils.getTokenBalance(abytknContract, address),
        ContractUtils.getTokenBalance(usdcContract, address),
      ]);

      console.log("Manual Balances:", {
        manualAbytknBalance,
        manualUsdcBalance,
      });

      setBalances((prev) => ({
        ...prev,
        ABYTKN: manualAbytknBalance,
        USDC: manualUsdcBalance,
      }));
    } catch (error) {
      handleError("loading balances manually", error);
    }
  }, [isConnected, address, abytknContract, usdcContract, handleError]);

  // Function to calculate output amount
  const calculateOutputAmount = useCallback(
    async (inputAmount, inputTokenSymbol, outputTokenSymbol) => {
      if (!inputAmount || parseFloat(inputAmount) === 0) {
        return { output: "0", impact: 0, minReceived: "0" };
      }

      try {
        const tokenPrice = await ContractUtils.readContractManual(
          swapContract,
          "getTokenPrice"
        );

        if (!tokenPrice) {
          throw new Error("No contract available");
        }

        const rate =
          inputTokenSymbol === "ABYTKN"
            ? parseFloat(ethers.formatUnits(tokenPrice, 18)) || 0
            : 1 / (parseFloat(ethers.formatUnits(tokenPrice, 18)) || 1);

        const output = (parseFloat(inputAmount) * rate).toFixed(6);
        const { impact, minReceived } = PriceUtils.calculatePriceImpact(
          inputAmount,
          output,
          slippageTolerance
        );

        return { output, impact, minReceived };
      } catch (error) {
        console.error("Price calculation error:", error);

        // Fallback calculation
        const rate = inputTokenSymbol === "ABYTKN" ? 1.2345 : 0.8102;
        const output = (parseFloat(inputAmount) * rate).toFixed(6);
        const { impact, minReceived } = PriceUtils.calculatePriceImpact(
          inputAmount,
          output,
          slippageTolerance
        );

        return { output, impact, minReceived };
      }
    },
    [swapContract, slippageTolerance]
  );

  // Manual pool info loading
  const loadPoolInfo = useCallback(async () => {
    if (!isConnected) return;

    try {
      const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;

      if (!poolAddress) {
        setError("Pool address not configured");
        return;
      }

      const [poolInfoData, balancesData, tokenPriceData, priceData] =
        await Promise.allSettled([
          ContractUtils.readContractManual(swapContract, "getPoolInfo"),
          ContractUtils.readContractManual(swapContract, "getPoolBalances"),
          ContractUtils.readContractManual(swapContract, "getTokenPrice"),
          getCurrentPoolPrice(),
        ]);

      const poolData = {
        liquidity:
          poolInfoData.status === "fulfilled" && poolInfoData.value?.[2]
            ? ethers.formatUnits(poolInfoData.value[2], 18)
            : "N/A",
        sqrtPriceX96:
          poolInfoData.status === "fulfilled"
            ? poolInfoData.value?.[0]?.toString()
            : "N/A",
        tick:
          poolInfoData.status === "fulfilled"
            ? poolInfoData.value?.[1]?.toString()
            : "N/A",
        token0Balance:
          balancesData.status === "fulfilled" &&
          balancesData.value?.[0] !== undefined
            ? ethers.formatUnits(balancesData.value[0], 18)
            : "N/A",
        token1Balance:
          balancesData.status === "fulfilled" &&
          balancesData.value?.[1] !== undefined
            ? ethers.formatUnits(balancesData.value[1], 18)
            : "N/A",
        token0Price:
          tokenPriceData.status === "fulfilled" &&
          tokenPriceData.value !== undefined
            ? ethers.formatUnits(tokenPriceData.value, 18)
            : "N/A",
      };

      poolData.token1Price =
        poolData.token0Price !== "N/A"
          ? (1 / parseFloat(poolData.token0Price)).toFixed(6)
          : "N/A";

      if (priceData.status === "fulfilled") {
        setPoolPrice(priceData.value.price);
        setIsInitialRatio(priceData.value.isInitialRatio);
      }

      setPoolInfo({
        ...poolData,
        volume24h: "N/A",
        fees24h: "N/A",
        apr: "N/A",
      });
    } catch (error) {
      handleError("loading pool info", error, "Failed to load pool info");
      setPoolInfo({
        liquidity: "N/A",
        sqrtPriceX96: "N/A",
        tick: "N/A",
        token0Balance: "N/A",
        token1Balance: "N/A",
        token0Price: "N/A",
        token1Price: "N/A",
        volume24h: "N/A",
        fees24h: "N/A",
        apr: "N/A",
      });
    }
  }, [isConnected, swapContract, handleError]);

  // Advanced pool price calculation
  const getCurrentPoolPrice = useCallback(async () => {
    try {
      const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;

      if (
        !poolAddress ||
        poolAddress === "0x0000000000000000000000000000000000000000"
      ) {
        return { price: 1000, isInitialRatio: true };
      }

      // Try direct pool contract call using ethers for complex interactions
      try {
        const provider = new ethers.JsonRpcProvider(
          import.meta.env.VITE_APP_SEPOLIA_RPC_URL
        );

        const poolInterface = new ethers.Interface([
          "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
          "function token0() view returns (address)",
          "function token1() view returns (address)",
          "function liquidity() view returns (uint128)",
        ]);

        const poolContract = new ethers.Contract(
          poolAddress,
          poolInterface,
          provider
        );

        const [slot0, poolToken0, poolToken1, liquidity] = await Promise.all([
          poolContract.slot0(),
          poolContract.token0(),
          poolContract.token1(),
          poolContract.liquidity(),
        ]);

        if (liquidity.toString() === "0" && !slot0.tick) {
          return { price: 1000, isInitialRatio: true };
        }

        const tick = parseInt(slot0.tick.toString());
        let rawPrice = Math.pow(1.0001, tick);

        // Get token decimals
        const token0Contract = new ethers.Contract(
          poolToken0,
          CONTRACT_CONFIG.ABI.USDC,
          provider
        );
        const token1Contract = new ethers.Contract(
          poolToken1,
          CONTRACT_CONFIG.ABI.ABYTKN,
          provider
        );

        const [token0Decimals, token1Decimals] = await Promise.all([
          token0Contract.decimals(),
          token1Contract.decimals(),
        ]);

        const decimalAdjustment = Math.pow(10, token1Decimals - token0Decimals);
        rawPrice = rawPrice * decimalAdjustment;

        const token0IsABYTKN =
          poolToken0.toLowerCase() ===
          CONTRACT_CONFIG.ADDRESSES.TOKEN0.toLowerCase();
        const finalPrice = token0IsABYTKN ? rawPrice : 1 / rawPrice;

        if (finalPrice > 0 && finalPrice < 1000000) {
          return { price: finalPrice, isInitialRatio: false };
        }
      } catch (directError) {
        console.log("Direct pool call failed:", directError.message);
      }

      return { price: 1000, isInitialRatio: true };
    } catch (error) {
      console.error("Error fetching pool price:", error);
      return { price: 1000, isInitialRatio: true };
    }
  }, []);

  const fetchPoolPrice = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingPrice(true);
    try {
      const priceData = await getCurrentPoolPrice();
      setPoolPrice(priceData.price);
      setIsInitialRatio(priceData.isInitialRatio);
    } catch (error) {
      handleError("fetching pool price", error);
    } finally {
      setIsLoadingPrice(false);
    }
  }, [isConnected, getCurrentPoolPrice, handleError]);

  const refreshPoolPrice = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingPrice(true);
    try {
      const tokenPrice = await ContractUtils.readContractManual(
        swapContract,
        "getTokenPrice"
      );

      if (tokenPrice) {
        let formattedPrice = parseFloat(ethers.formatUnits(tokenPrice, 18));

        // Get actual token0 from the pool to verify order
        const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;
        if (poolAddress) {
          const provider = new ethers.JsonRpcProvider(
            import.meta.env.VITE_APP_SEPOLIA_RPC_URL
          );
          const poolContract = new ethers.Contract(
            poolAddress,
            ["function token0() view returns (address)"],
            provider
          );

          const actualToken0 = await poolContract.token0();
          const token0IsABYTKN =
            actualToken0.toLowerCase() ===
            CONTRACT_CONFIG.ADDRESSES.TOKEN0.toLowerCase();

          // If token0 is USDC (not ABYTKN), we need to invert the price
          if (!token0IsABYTKN && formattedPrice > 0) {
            formattedPrice = 1 / formattedPrice;
          }
        }

        setPoolPrice(formattedPrice);
        setIsInitialRatio(false);
      }
    } catch (error) {
      handleError("refreshing pool price", error);
      setPoolPrice(1000);
      setIsInitialRatio(true);
    } finally {
      setIsLoadingPrice(false);
    }
  }, [isConnected, swapContract, handleError]);

  // Use reactive data from thirdweb hooks
  const { data: txHistoryData, isLoading: historyLoading } = useReadContract({
    contract: swapContract,
    method: "getUserTransactionHistory",
    params: [],
  });

  const { data: abytknBalance } = useReadContract({
    contract: abytknContract,
    method: "balanceOf",
    params: [address || "0x"],
  });

  const { data: usdcBalance } = useReadContract({
    contract: usdcContract,
    method: "balanceOf",
    params: [address || "0x"],
  });

  const { data: tokenPrice } = useReadContract({
    contract: swapContract,
    method: "getTokenPrice",
    params: [],
  });

  const { data: poolInfoData } = useReadContract({
    contract: swapContract,
    method: "getPoolInfo",
    params: [],
  });

  const { data: poolBalances } = useReadContract({
    contract: swapContract,
    method: "getPoolBalances",
    params: [],
  });

  // Fetch transaction history when the user connects their wallet
  useEffect(() => {
    if (isConnected) {
      fetchTransactionHistory();
    } else {
      setTransactions([]);
    }
  }, [isConnected, fetchTransactionHistory]);

  // Update reactive data when hooks change - use proper dependencies
  useEffect(() => {
    if (abytknBalance && isMountedRef.current) {
      setBalances((prev) => ({
        ...prev,
        ABYTKN: ethers.formatUnits(abytknBalance, 18),
      }));
    }
  }, [abytknBalance]);

  useEffect(() => {
    if (usdcBalance && isMountedRef.current) {
      setBalances((prev) => ({
        ...prev,
        USDC: ethers.formatUnits(usdcBalance, 18),
      }));
    }
  }, [usdcBalance]);

  useEffect(() => {
    if (tokenPrice && isMountedRef.current) {
      const formattedPrice = parseFloat(ethers.formatUnits(tokenPrice, 18));
      setPoolPrice(formattedPrice);
      setIsInitialRatio(false);
    }
  }, [tokenPrice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to refresh transaction history
  const refreshHistory = useCallback(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      transactions,
      loading: loading || historyLoading,
      error,
      refreshHistory,
      loadBalances,
      calculateOutputAmount,
      loadPoolInfo,
      balances,
      poolInfo,
      fetchPoolPrice,
      getCurrentPoolPrice,
      refreshPoolPrice,
      isLoadingPrice,
      isInitialRatio,
      poolPrice,
      calculateRatioWithPoolPrice: PriceUtils.calculateRatioWithPoolPrice,
      slippageTolerance,
      setSlippageTolerance,
    }),
    [
      transactions,
      loading,
      historyLoading,
      error,
      refreshHistory,
      loadBalances,
      calculateOutputAmount,
      loadPoolInfo,
      balances,
      poolInfo,
      fetchPoolPrice,
      getCurrentPoolPrice,
      refreshPoolPrice,
      isLoadingPrice,
      isInitialRatio,
      poolPrice,
      slippageTolerance,
    ]
  );

  return (
    <TransactionHistoryContext.Provider value={value}>
      {children}
    </TransactionHistoryContext.Provider>
  );
}

// Custom hook for using the transaction history context
export function useTransactionHistory() {
  const context = useContext(TransactionHistoryContext);

  if (context === undefined) {
    throw new Error(
      "useTransactionHistory must be used within a TransactionHistoryProvider"
    );
  }

  return context;
}
