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
import CONTRACT_ADDRESSES from "../../constants/addresses";

// Constants and Configuration
const CONTRACT_CONFIG = {
  ABI: {
    SWAP: CONTRACT_ABI.abi,
    USDC: USDC_ABI.abi,
    ABYTKN: ABYTKN_ABI.abi,
  },
  ADDRESSES: {
    ADD_SWAP_CONTRACT: CONTRACT_ADDRESSES.Liquidity,
    TOKEN0: CONTRACT_ADDRESSES.ABYTKN, // ABYTKN
    TOKEN1: CONTRACT_ADDRESSES.USDC, // USDC
    UNISWAP_POOL: CONTRACT_ADDRESSES.ABYTKN_USDC_POOL,
  },
  CHAIN: defineChain(11155111),
};

// Utility Functions
const ContractUtils = {
  createContract: (address, abi) => {
    return getContract({
      client,
      address,
      chain: CONTRACT_CONFIG.CHAIN,
      abi,
    });
  },

  readContractManual: async (contract, method, params = []) => {
    return readContract({
      contract,
      method,
      params,
    });
  },

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

  getTokenBalance: async (contract, address, decimals = 18) => {
    const balance = await ContractUtils.readContractManual(
      contract,
      "balanceOf",
      [address],
    );
    return balance ? ethers.formatUnits(balance, decimals) : "0.0";
  },
};

const PriceUtils = {
  getTokenDecimals: (symbol) => {
    const decimalsMap = {
      ABYTKN: 18,
      USDC: 6,
    };
    return decimalsMap[symbol] || 18;
  },

  calculatePriceImpact: (
    inputAmount,
    outputRaw,
    slippageTolerance,
    outputTokenSymbol,
  ) => {
    const impact = Math.min((parseFloat(inputAmount) / 1000) * 0.1, 5);

    // Use BigInt for precise calculations
    const outputBigInt = BigInt(outputRaw);
    const outputDecimals = outputTokenSymbol === "ABYTKN" ? 18 : 6;

    // Calculate minimum received with slippage
    const slippageFactor = (1 - slippageTolerance / 100) * 10000;
    const minReceivedBigInt =
      (outputBigInt * BigInt(Math.floor(slippageFactor))) / 10000n;

    return {
      impact,
      minReceived: minReceivedBigInt.toString(),
    };
  },

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
        2,
      ),
    };
  },
};

// Create the context
const TransactionHistoryContext = createContext();

export function TransactionHistoryProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAllTransactions, setLoadingAllTransactions] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isInitialRatio, setIsInitialRatio] = useState(true);
  const [poolPrice, setPoolPrice] = useState(1000);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);

  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

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

  const [balances, setBalances] = useState({
    ABYTKN: "0.0",
    USDC: "0.0",
    ETH: "0.0",
  });

  const isMountedRef = useRef(true);

  const swapContract = React.useMemo(
    () =>
      ContractUtils.createContract(
        CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        CONTRACT_CONFIG.ABI.SWAP,
      ),
    [],
  );

  const abytknContract = React.useMemo(
    () =>
      ContractUtils.createContract(
        CONTRACT_CONFIG.ADDRESSES.TOKEN0,
        CONTRACT_CONFIG.ABI.ABYTKN,
      ),
    [],
  );

  const usdcContract = React.useMemo(
    () =>
      ContractUtils.createContract(
        CONTRACT_CONFIG.ADDRESSES.TOKEN1,
        CONTRACT_CONFIG.ABI.USDC,
      ),
    [],
  );

  const handleError = useCallback((operation, error, fallbackMessage) => {
    console.error(`Error ${operation}:`, error);
    setError(fallbackMessage || `Failed to ${operation}`);
    return null;
  }, []);

  const fetchAllTransactionHistory = useCallback(async () => {
    if (!client) {
      setAllTransactions([]);
      setLoadingAllTransactions(false);
      return;
    }

    setLoadingAllTransactions(true);
    setError(null);

    try {
      const contract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        abi: CONTRACT_CONFIG.ABI.SWAP,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const txHistoryData = await readContract({
        contract,
        method: "getAllTransactionHistory",
        params: [],
      });

      if (Array.isArray(txHistoryData) && txHistoryData.length > 0) {
        const formattedTransactions = txHistoryData.map((tx, index) =>
          ContractUtils.formatTransaction(tx, index),
        );
        setAllTransactions(formattedTransactions);
      } else {
        setAllTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching all transaction history:", err);
      handleError("fetching all transaction history", err);
      setAllTransactions([]);
    } finally {
      if (isMountedRef.current) {
        setLoadingAllTransactions(false);
      }
    }
  }, [client, handleError]);

  const fetchTransactionHistory = useCallback(async () => {
    if (!isConnected || !address || !client) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 10000);
    });

    try {
      const contract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        abi: CONTRACT_CONFIG.ABI.SWAP,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const txHistoryData = await Promise.race([
        readContract({
          contract,
          method: "getUserTransactionHistory",
          params: [address],
        }),
        timeoutPromise,
      ]);

      if (Array.isArray(txHistoryData) && txHistoryData.length > 0) {
        const formattedTransactions = txHistoryData.map((tx, index) =>
          ContractUtils.formatTransaction(tx, index),
        );
        setTransactions(formattedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching transaction history:", err);

      if (err.message === "Request timeout") {
        setError("Request timed out. Please try again.");
      } else {
        handleError("fetching transaction history", err);
      }

      setTransactions([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isConnected, address, client, handleError]);

  const loadBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const [manualAbytknBalance, manualUsdcBalance] = await Promise.all([
        ContractUtils.getTokenBalance(abytknContract, address, 18),
        ContractUtils.getTokenBalance(usdcContract, address, 6),
      ]);

      setBalances((prev) => ({
        ...prev,
        ABYTKN: manualAbytknBalance,
        USDC: manualUsdcBalance,
      }));
    } catch (error) {
      handleError("loading balances manually", error);
    }
  }, [isConnected, address, abytknContract, usdcContract, handleError]);

  // FIXED: calculateOutputAmount using ethers for precise calculations
  const calculateOutputAmount = useCallback(
    async (inputAmount, inputTokenSymbol, outputTokenSymbol) => {
      if (!inputAmount || parseFloat(inputAmount) === 0) {
        return { output: "0", impact: 0, minReceived: "0" };
      }

      try {
        const tokenPrice = await ContractUtils.readContractManual(
          swapContract,
          "getTokenPrice",
        );

        const basePrice = tokenPrice
          ? parseFloat(ethers.formatUnits(tokenPrice, 18))
          : 1000;

        let outputInUnits;

        if (inputTokenSymbol === "USDC" && outputTokenSymbol === "ABYTKN") {
          outputInUnits = parseFloat(inputAmount) * basePrice;
        } else if (
          inputTokenSymbol === "ABYTKN" &&
          outputTokenSymbol === "USDC"
        ) {
          outputInUnits = parseFloat(inputAmount) / basePrice;
        } else {
          outputInUnits = 0;
        }

        // Use ethers to handle the decimal conversion
        const outputDecimals = outputTokenSymbol === "ABYTKN" ? 18 : 6;

        // Convert to string with full precision
        const outputInUnitsStr = outputInUnits.toFixed(18);

        // Use ethers to parse units - this handles the decimal conversion correctly
        const outputRaw = ethers.parseUnits(outputInUnitsStr, outputDecimals);

        // Return as string
        const outputStr = outputRaw.toString();

        const { impact, minReceived } = PriceUtils.calculatePriceImpact(
          inputAmount,
          outputStr,
          slippageTolerance,
          outputTokenSymbol,
        );

        return {
          output: outputStr,
          impact,
          minReceived,
        };
      } catch (error) {
        console.error("Price calculation error:", error);

        // Fallback calculation
        const basePrice = 1000;
        let outputInUnits;

        if (inputTokenSymbol === "USDC" && outputTokenSymbol === "ABYTKN") {
          outputInUnits = parseFloat(inputAmount) * basePrice;
        } else if (
          inputTokenSymbol === "ABYTKN" &&
          outputTokenSymbol === "USDC"
        ) {
          outputInUnits = parseFloat(inputAmount) / basePrice;
        } else {
          outputInUnits = 0;
        }

        const outputDecimals = outputTokenSymbol === "ABYTKN" ? 18 : 6;
        const outputInUnitsStr = outputInUnits.toFixed(18);
        const outputRaw = ethers.parseUnits(outputInUnitsStr, outputDecimals);
        const outputStr = outputRaw.toString();

        const { impact, minReceived } = PriceUtils.calculatePriceImpact(
          inputAmount,
          outputStr,
          slippageTolerance,
          outputTokenSymbol,
        );

        return {
          output: outputStr,
          impact,
          minReceived,
        };
      }
    },
    [swapContract, slippageTolerance],
  );

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
    }
  }, [isConnected, swapContract, handleError]);

  const getCurrentPoolPrice = useCallback(async () => {
    try {
      const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;

      if (
        !poolAddress ||
        poolAddress === "0x0000000000000000000000000000000000000000"
      ) {
        return { price: 1000, isInitialRatio: true };
      }

      try {
        const provider = new ethers.JsonRpcProvider(
          import.meta.env.VITE_APP_SEPOLIA_RPC_URL ||
            import.meta.env.VITE_APP_RPC_URL,
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
          provider,
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

        const token0Contract = new ethers.Contract(
          poolToken0,
          CONTRACT_CONFIG.ABI.USDC,
          provider,
        );
        const token1Contract = new ethers.Contract(
          poolToken1,
          CONTRACT_CONFIG.ABI.ABYTKN,
          provider,
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
        "getTokenPrice",
      );

      if (tokenPrice) {
        let formattedPrice = parseFloat(ethers.formatUnits(tokenPrice, 18));

        const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;
        if (poolAddress) {
          const provider = new ethers.JsonRpcProvider(
            import.meta.env.VITE_APP_SEPOLIA_RPC_URL,
          );
          const poolContract = new ethers.Contract(
            poolAddress,
            ["function token0() view returns (address)"],
            provider,
          );

          const actualToken0 = await poolContract.token0();
          const token0IsABYTKN =
            actualToken0.toLowerCase() ===
            CONTRACT_CONFIG.ADDRESSES.TOKEN0.toLowerCase();

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

  useEffect(() => {
    if (isConnected) {
      fetchTransactionHistory();
    } else {
      setTransactions([]);
    }
  }, [isConnected, fetchTransactionHistory]);

  useEffect(() => {
    fetchAllTransactionHistory();
  }, [fetchAllTransactionHistory]);

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
        USDC: ethers.formatUnits(usdcBalance, 6),
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshHistory = useCallback(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  const refreshAllHistory = useCallback(() => {
    fetchAllTransactionHistory();
  }, [fetchAllTransactionHistory]);

  const value = React.useMemo(
    () => ({
      transactions,
      allTransactions,
      loading,
      loadingAllTransactions,
      error,
      refreshHistory,
      refreshAllHistory,
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
      allTransactions,
      loading,
      loadingAllTransactions,
      error,
      refreshHistory,
      refreshAllHistory,
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
    ],
  );

  return (
    <TransactionHistoryContext.Provider value={value}>
      {children}
    </TransactionHistoryContext.Provider>
  );
}

export function useTransactionHistory() {
  const context = useContext(TransactionHistoryContext);

  if (context === undefined) {
    throw new Error(
      "useTransactionHistory must be used within a TransactionHistoryProvider",
    );
  }

  return context;
}
