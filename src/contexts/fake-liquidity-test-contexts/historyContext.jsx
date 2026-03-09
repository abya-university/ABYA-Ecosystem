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

    const fromToken = tokenMapping[tx.fromToken?.toLowerCase()] || "Unknown";
    const toToken = tokenMapping[tx.toToken?.toLowerCase()] || "Unknown";

    // Determine decimals based on token
    const fromDecimals = fromToken === "USDC" ? 6 : 18;
    const toDecimals = toToken === "USDC" ? 6 : 18;

    return {
      id: Number(tx.id) || index,
      type: Number(tx.transactionType) === 1 ? "swap" : "liquidity",
      fromToken: fromToken,
      toToken: toToken,
      fromAmount: ethers.formatUnits(tx.fromAmount || 0, fromDecimals),
      toAmount: ethers.formatUnits(tx.toAmount || 0, toDecimals),
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
  const [poolPrice, setPoolPrice] = useState(0.001); // 1 ABYTKN = 0.001 USDC
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

        // basePrice represents ABYTKN per USDC (e.g., 1000)
        const basePrice = tokenPrice
          ? parseFloat(ethers.formatUnits(tokenPrice, 18))
          : 1000;

        console.log("Price calculation:", {
          basePrice,
          inputAmount,
          inputTokenSymbol,
          outputTokenSymbol,
        });

        let outputInUnits; // This is in human-readable units

        if (inputTokenSymbol === "USDC" && outputTokenSymbol === "ABYTKN") {
          // USDC → ABYTKN: multiply (1 USDC = 1000 ABYTKN)
          // Use multiplication which is safe
          outputInUnits = parseFloat(inputAmount) * basePrice;
        } else if (
          inputTokenSymbol === "ABYTKN" &&
          outputTokenSymbol === "USDC"
        ) {
          // ABYTKN → USDC: divide (1000 ABYTKN = 1 USDC)
          // To avoid floating point issues, use multiplication by reciprocal
          // Instead of: parseFloat(inputAmount) / basePrice
          // Do: (parseFloat(inputAmount) * 1e18) / (basePrice * 1e18) but that's complex

          // Better: use integer math with BigInt
          const inputAmountBigInt = BigInt(
            Math.round(parseFloat(inputAmount) * 1e18),
          );
          const basePriceBigInt = BigInt(Math.round(basePrice * 1e18));

          // Calculate: (inputAmount * 10^18) / basePrice
          // This gives us the result scaled by 10^18
          const resultScaled =
            (inputAmountBigInt * BigInt(1e18)) / basePriceBigInt;

          // Convert back to number (this will be accurate because we used BigInt)
          outputInUnits = Number(resultScaled) / 1e18;
        } else {
          outputInUnits = 0;
        }

        console.log("Output in units (display value):", outputInUnits);

        // Convert to raw blockchain amount with proper decimals
        const outputDecimals = outputTokenSymbol === "ABYTKN" ? 18 : 6;

        // For USDC output (when swapping ABYTKN to USDC), we need to be extra careful
        if (outputTokenSymbol === "USDC") {
          // USDC has 6 decimals, so we need to multiply by 10^6
          // But first, ensure outputInUnits has high precision
          const outputInUnitsStr = outputInUnits.toFixed(12); // Use more decimals for precision
          const outputRaw = ethers.parseUnits(outputInUnitsStr, outputDecimals);
          console.log("Output raw (blockchain value):", outputRaw.toString());

          const { impact, minReceived } = PriceUtils.calculatePriceImpact(
            inputAmount,
            outputRaw.toString(),
            slippageTolerance,
            outputTokenSymbol,
          );

          return {
            output: outputRaw.toString(),
            impact,
            minReceived,
          };
        } else {
          // For ABYTKN output, use the regular method
          const outputInUnitsStr = outputInUnits.toString();
          const outputRaw = ethers.parseUnits(outputInUnitsStr, outputDecimals);

          console.log("Output raw (blockchain value):", outputRaw.toString());

          const { impact, minReceived } = PriceUtils.calculatePriceImpact(
            inputAmount,
            outputRaw.toString(),
            slippageTolerance,
            outputTokenSymbol,
          );

          return {
            output: outputRaw.toString(),
            impact,
            minReceived,
          };
        }
      } catch (error) {
        console.error("Price calculation error:", error);

        // Fallback calculation with better precision
        const basePrice = 1000;
        let outputInUnits;

        if (inputTokenSymbol === "USDC" && outputTokenSymbol === "ABYTKN") {
          outputInUnits = parseFloat(inputAmount) * basePrice;
        } else if (
          inputTokenSymbol === "ABYTKN" &&
          outputTokenSymbol === "USDC"
        ) {
          // Use BigInt for precise division
          const inputAmountBigInt = BigInt(
            Math.round(parseFloat(inputAmount) * 1e18),
          );
          const basePriceBigInt = BigInt(Math.round(basePrice * 1e18));
          const resultScaled =
            (inputAmountBigInt * BigInt(1e18)) / basePriceBigInt;
          outputInUnits = Number(resultScaled) / 1e18;
        } else {
          outputInUnits = 0;
        }

        const outputDecimals = outputTokenSymbol === "ABYTKN" ? 18 : 6;
        const outputInUnitsStr = outputInUnits.toFixed(12);
        const outputRaw = ethers.parseUnits(outputInUnitsStr, outputDecimals);

        const { impact, minReceived } = PriceUtils.calculatePriceImpact(
          inputAmount,
          outputRaw.toString(),
          slippageTolerance,
          outputTokenSymbol,
        );

        return {
          output: outputRaw.toString(),
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
            ? (
                parseFloat(ethers.formatUnits(tokenPriceData.value, 0)) *
                Math.pow(10, 12)
              ).toString()
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
        return { price: 0.001, isInitialRatio: true }; // 1 ABYTKN = 0.001 USDC
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
          return { price: 0.001, isInitialRatio: true }; // 1 ABYTKN = 0.001 USDC
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

      return { price: 0.001, isInitialRatio: true }; // 1 ABYTKN = 0.001 USDC
    } catch (error) {
      console.error("Error fetching pool price:", error);
      return { price: 0.001, isInitialRatio: true }; // 1 ABYTKN = 0.001 USDC
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
        // Get raw price and adjust for decimal differences
        const priceRaw = parseFloat(ethers.formatUnits(tokenPrice, 0));
        const decimalsToken0 = 18; // ABYTKN
        const decimalsToken1 = 6; // USDC
        const adjustmentFactor = Math.pow(10, decimalsToken0 - decimalsToken1);
        let formattedPrice = priceRaw * adjustmentFactor; // Price of 1 ABYTKN in USDC

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
      setPoolPrice(0.001); // Fallback: 1 ABYTKN = 0.001 USDC
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
      const priceRaw = parseFloat(ethers.formatUnits(tokenPrice, 0));
      const formattedPrice = priceRaw * Math.pow(10, 12); // 1 ABYTKN in USDC
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
