import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import CONTRACT_ABI from "../../artifacts/contracts/fake-liquidity-abis/add_swap_contract.json";
import USDC_ABI from "../../artifacts/contracts/fake-liquidity-abis/usdc.json";
import ABYTKN_ABI from "../../artifacts/contracts/fake-liquidity-abis/abyatkn.json";
import { useActiveAccount } from "thirdweb/react";
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
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_USDC_ADDRESS, // USDC
    TOKEN1: import.meta.env.VITE_APP_ABYATKN_ADDRESS, // ABYTKN
    UNISWAP_POOL: import.meta.env.VITE_APP_ABYATKN_USDC_500, // Uniswap pool address
  },
  CHAIN: defineChain(1020352220),
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
  createContract: async (address, abi, signer) => {
    return getContract({
      address,
      abi,
      signer,
      chain: CONTRACT_CONFIG.CHAIN,
    });
  },

  // Common contract read function
  readContract: async (contract, methodSignature, params = []) => {
    return readContract({
      contract,
      method: methodSignature,
      params,
    });
  },

  // Format transaction data consistently
  formatTransaction: (tx, index) => {
    const tokenMapping = {
      [CONTRACT_CONFIG.ADDRESSES.TOKEN0?.toLowerCase()]: "TKN0(USDC)",
      [CONTRACT_CONFIG.ADDRESSES.TOKEN1?.toLowerCase()]: "TKN1(ABYATKN)",
    };

    return {
      id: Number(tx.id) || index,
      type: Number(tx.transactionType) === 1 ? "swap" : "liquidity",
      token0Symbol: tokenMapping[tx.fromToken?.toLowerCase()] || "TKN0",
      token1Symbol: tokenMapping[tx.toToken?.toLowerCase()] || "TKN1",
      token0Amount: ethers.formatUnits(tx.fromAmount || 0, 18),
      token1Amount: ethers.formatUnits(tx.toAmount || 0, 18),
      timestamp: new Date(Number(tx.timestamp || 0) * 1000),
      hash: tx.hash,
      status: tx.status || "confirmed",
    };
  },

  // Get token balance with consistent formatting
  getTokenBalance: async (contract, address) => {
    const balance = await ContractUtils.readContract(
      contract,
      CONTRACT_CONFIG.METHODS.BALANCE_OF,
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
  });

  // Token balances
  const [balances, setBalances] = useState({
    TOKEN0: "0.0",
    TOKEN1: "0.0",
    ETH: "0.0",
  });

  // Common error handler
  const handleError = (operation, error, fallbackMessage) => {
    console.error(`Error ${operation}:`, error);
    setError(fallbackMessage || `Failed to ${operation}`);
    return null;
  };

  // Common contract initialization
  const initializeContract = useCallback(
    async (address, abi) => {
      if (!isConnected || !address) return null;

      try {
        const signer = await client;
        if (!signer) return null;

        return await ContractUtils.createContract(address, abi, signer);
      } catch (error) {
        return handleError("initializing contract", error);
      }
    },
    [isConnected, client]
  );

  // Function to fetch transaction history from the contract
  const fetchTransactionHistory = useCallback(async () => {
    if (!isConnected || !address || !client) return;

    setLoading(true);
    setError(null);

    try {
      const contract = await initializeContract(
        CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        CONTRACT_CONFIG.ABI.SWAP
      );

      if (!contract) return;

      const txHistoryData = await ContractUtils.readContract(
        contract,
        CONTRACT_CONFIG.METHODS.GET_TX_HISTORY
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
      setLoading(false);
    }
  }, [isConnected, address, initializeContract]);

  // Fetch transaction history when the user connects their wallet
  useEffect(() => {
    if (isConnected) {
      fetchTransactionHistory();
    } else {
      setTransactions([]);
    }
  }, [isConnected, fetchTransactionHistory]);

  // Function to refresh transaction history
  const refreshHistory = () => {
    fetchTransactionHistory();
  };

  const loadBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const signer = await client;
      if (!signer) return;

      const usdcContract = await initializeContract(
        CONTRACT_CONFIG.ADDRESSES.TOKEN0,
        CONTRACT_CONFIG.ABI.USDC
      );

      const abytknContract = await initializeContract(
        CONTRACT_CONFIG.ADDRESSES.TOKEN1,
        CONTRACT_CONFIG.ABI.ABYTKN
      );

      if (!usdcContract || !abytknContract) return;

      const [usdcBalance, abytknBalance, ethBalance] = await Promise.all([
        ContractUtils.getTokenBalance(usdcContract, address),
        ContractUtils.getTokenBalance(abytknContract, address),
        signer.getBalance().then((balance) => ethers.formatUnits(balance, 18)),
      ]);

      console.log("Balances:", { usdcBalance, abytknBalance, ethBalance });

      setBalances({
        TOKEN0: usdcBalance,
        TOKEN1: abytknBalance,
        ETH: ethBalance,
      });
    } catch (error) {
      handleError("loading balances", error);
    }
  }, [isConnected, address, initializeContract]);

  // Function to calculate output amount
  const calculateOutputAmount = useCallback(
    async (inputAmount, inputTokenSymbol, outputTokenSymbol) => {
      if (!inputAmount || parseFloat(inputAmount) === 0) {
        return { output: "0", impact: 0, minReceived: "0" };
      }

      try {
        const contract = await initializeContract(
          CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
          CONTRACT_CONFIG.ABI.SWAP
        );

        if (!contract) {
          throw new Error("No contract available");
        }

        const tokenPrice = await ContractUtils.readContract(
          contract,
          CONTRACT_CONFIG.METHODS.GET_TOKEN_PRICE
        );

        const rate =
          inputTokenSymbol === "TOKEN0"
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
        const rate = inputTokenSymbol === "TOKEN0" ? 1.2345 : 0.8102;
        const output = (parseFloat(inputAmount) * rate).toFixed(6);
        const { impact, minReceived } = PriceUtils.calculatePriceImpact(
          inputAmount,
          output,
          slippageTolerance
        );

        return { output, impact, minReceived };
      }
    },
    [initializeContract, slippageTolerance]
  );

  const loadPoolInfo = useCallback(async () => {
    if (!isConnected) return;

    try {
      const contract = await initializeContract(
        CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        CONTRACT_CONFIG.ABI.SWAP
      );

      if (!contract) return;

      const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;

      if (!poolAddress) {
        setError("Pool address not configured");
        return;
      }

      const [poolInfoData, balancesData, tokenPriceData, priceData] =
        await Promise.allSettled([
          ContractUtils.readContract(
            contract,
            CONTRACT_CONFIG.METHODS.GET_POOL_INFO
          ),
          ContractUtils.readContract(
            contract,
            CONTRACT_CONFIG.METHODS.GET_POOL_BALANCES
          ),
          ContractUtils.readContract(
            contract,
            CONTRACT_CONFIG.METHODS.GET_TOKEN_PRICE
          ),
          getCurrentPoolPrice(contract),
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
  }, [isConnected, initializeContract]);

  const getCurrentPoolPrice = async (contract) => {
    try {
      const poolAddress = CONTRACT_CONFIG.ADDRESSES.UNISWAP_POOL;

      if (
        !poolAddress ||
        poolAddress === "0x0000000000000000000000000000000000000000"
      ) {
        return { price: 1000, isInitialRatio: true };
      }

      // Try direct pool contract call
      try {
        const poolInterface = new ethers.Interface([
          "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
          "function token0() view returns (address)",
          "function token1() view returns (address)",
          "function liquidity() view returns (uint128)",
        ]);

        const poolContract = new ethers.Contract(
          poolAddress,
          poolInterface,
          contract.runner
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
          contract.runner
        );
        const token1Contract = new ethers.Contract(
          poolToken1,
          CONTRACT_CONFIG.ABI.ABYTKN,
          contract.runner
        );

        const [token0Decimals, token1Decimals] = await Promise.all([
          token0Contract.decimals(),
          token1Contract.decimals(),
        ]);

        const decimalAdjustment = Math.pow(10, token1Decimals - token0Decimals);
        rawPrice = rawPrice * decimalAdjustment;

        const token0IsUsdc =
          poolToken0.toLowerCase() ===
          CONTRACT_CONFIG.ADDRESSES.TOKEN0.toLowerCase();
        const finalPrice = token0IsUsdc ? 1 / rawPrice : rawPrice;

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
  };

  const fetchPoolPrice = async () => {
    if (!isConnected) return;

    setIsLoadingPrice(true);
    try {
      const contract = await initializeContract(
        CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        CONTRACT_CONFIG.ABI.SWAP
      );

      if (contract) {
        const priceData = await getCurrentPoolPrice(contract);
        setPoolPrice(priceData.price);
        setIsInitialRatio(priceData.isInitialRatio);
      }
    } catch (error) {
      handleError("fetching pool price", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const refreshPoolPrice = async () => {
    if (!client) return;

    setIsLoadingPrice(true);
    try {
      const contract = await initializeContract(
        CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        CONTRACT_CONFIG.ABI.SWAP
      );

      if (contract) {
        const tokenPrice = await ContractUtils.readContract(
          contract,
          CONTRACT_CONFIG.METHODS.GET_TOKEN_PRICE
        );

        if (tokenPrice) {
          let formattedPrice = parseFloat(ethers.formatUnits(tokenPrice, 18));

          // Price inversion logic based on token order
          const contractToken0 = await contract.token0();
          const contractToken0IsABYTKN =
            contractToken0.toLowerCase() ===
            CONTRACT_CONFIG.ADDRESSES.TOKEN1.toLowerCase();

          if (contractToken0IsABYTKN && formattedPrice > 0) {
            formattedPrice = 1 / formattedPrice;
          }

          setPoolPrice(formattedPrice);
          setIsInitialRatio(false);
        }
      }
    } catch (error) {
      handleError("refreshing pool price", error);
      setPoolPrice(1000);
      setIsInitialRatio(true);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Value provided by the context
  const value = {
    transactions,
    loading,
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
  };

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
