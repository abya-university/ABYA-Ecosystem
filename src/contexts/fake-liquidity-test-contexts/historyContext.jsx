import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import CONTRACT_ABI from "../../artifacts/fake-liquidity-abis/add_swap_contract.json";
import { useEthersSigner } from "../../components/useClientSigner";
import USDC_ABI from "../../artifacts/fake-liquidity-abis/usdc.json";
import ABYTKN_ABI from "../../artifacts/fake-liquidity-abis/abyatkn.json";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

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

  const { address, isConnected } = useAccount();
  const signerPromise = useEthersSigner();

  const contract_address = import.meta.env.VITE_APP_ADD_SWAP_CONTRACT;

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

  const CONTRACT_ADDRESSES = {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_USDC_ADDRESS, // USDC
    TOKEN1: import.meta.env.VITE_APP_ABYATKN_ADDRESS, // ABYTKN
    UNISWAP_POOL: import.meta.env.VITE_APP_ABYATKN_USDC_500, // Uniswap pool address
  };

  // Function to fetch transaction history from the contract
  const fetchTransactionHistory = useCallback(async () => {
    if (!isConnected || !address || !signerPromise) return;

    const signer = await signerPromise;

    setLoading(true);
    setError(null);

    try {
      const contract = new ethers.Contract(
        contract_address,
        contractAbi,
        signer
      );

      // Call the contract's getTransactionHistory function
      const txHistoryData = await contract.getUserTransactionHistory();
      console.log("Raw transaction history:", txHistoryData);

      // Format the transaction data
      // Update the mapping to match the contract's return structure
      const formattedTransactions = txHistoryData.map((tx, index) => {
        return {
          id: Number(tx.id) || index,
          type: Number(tx.transactionType) === 1 ? "swap" : "liquidity",
          token0Symbol:
            tx.fromToken === "0xac485503f2f2da0311159187374c0b568eb84e5a"
              ? "TKN0(USDC)"
              : tx.fromToken === "0xc1303afc18ab049bf0b9aab4231ac24ac93c92a4"
              ? "TKN1(ABYATKN)"
              : tx.fromToken || "TKN0",
          token1Symbol:
            tx.toToken === "0xac485503f2f2da0311159187374c0b568eb84e5a"
              ? "TKN0(USDC)"
              : tx.toToken === "0xc1303afc18ab049bf0b9aab4231ac24ac93c92a4"
              ? "TKN1(ABYATKN)"
              : tx.toToken || "TKN1",
          token0Amount: ethers.formatUnits(tx.fromAmount || 0, 18), // Changed from amount0 to fromAmount
          token1Amount: ethers.formatUnits(tx.toAmount || 0, 18), // Changed from amount1 to toAmount
          timestamp: new Date(Number(tx.timestamp || 0) * 1000),
          hash: tx.hash, // Changed from txHash to hash
          status: tx.status || "confirmed",
        };
      });

      console.log("Formatted transactions:", formattedTransactions);
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setError("Failed to fetch transaction history: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, signerPromise, contract_address]);

  // Fetch transaction history when the user connects their wallet
  useEffect(() => {
    if (isConnected) {
      fetchTransactionHistory();
    } else {
      setTransactions([]);
    }
  }, [isConnected, fetchTransactionHistory]);

  // Function to refresh transaction history (can be called after new transactions)
  const refreshHistory = () => {
    fetchTransactionHistory();
  };

  const loadBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const signer = await signerPromise;
      if (!signer) return;

      const provider = signer.provider;

      const usdcContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN0,
        usdcAbi,
        signer
      );
      const abytknContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN1,
        abyatknAbi,
        signer
      );

      const usdcBalance = await usdcContract.balanceOf(address);
      const abytknBalance = await abytknContract.balanceOf(address);
      const ethBalance = await provider.getBalance(address);

      console.log("USDC Balance:", usdcBalance);
      console.log("ABYTKN Balance:", abytknBalance);
      console.log("ETH Balance:", ethBalance);

      setBalances({
        TOKEN0: usdcBalance ? ethers.formatUnits(usdcBalance, 18) : "0.0",
        TOKEN1: abytknBalance ? ethers.formatUnits(abytknBalance, 18) : "0.0",
        ETH: ethBalance ? ethers.formatUnits(ethBalance, 18) : "0.0",
      });
    } catch (error) {
      console.error("Error loading balances:", error);
      setError("Failed to load balances");
    }
  }, [isConnected, address, signerPromise]);

  // Function to calculate output amount (replace with actual price calculation)
  const calculateOutputAmount = useCallback(
    async (inputAmount, inputTokenSymbol, outputTokenSymbol) => {
      if (!inputAmount || parseFloat(inputAmount) === 0)
        return { output: "0", impact: 0, minReceived: "0" };

      try {
        console.log("Starting price calculation...");
        console.log("Contract address:", CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT);
        console.log("Pool address:", CONTRACT_ADDRESSES.UNISWAP_POOL);

        const signer = await signerPromise;
        console.log("Signer obtained:", !!signer);

        if (!signer) {
          throw new Error("No signer available");
        }

        const contract = new ethers.Contract(
          CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
          contractAbi,
          signer.provider || signer
        );

        console.log("Contract instance created");

        const poolAddress = CONTRACT_ADDRESSES.UNISWAP_POOL;

        // Check if the contract method exists
        if (!contract.getTokenPrice) {
          throw new Error("getTokenPrice method not found on contract");
        }

        console.log("Calling getTokenPrice...");
        const token0Price = await contract.getTokenPrice(poolAddress);
        console.log("Token price retrieved:", token0Price.toString());

        // Your existing logic continues...
        const rate =
          inputTokenSymbol === "TOKEN0"
            ? parseFloat(ethers.formatUnits(token0Price, 18)) || 0
            : 1 / (parseFloat(ethers.formatUnits(token0Price, 18)) || 1);

        console.log("Calculated rate:", rate);

        const output = (parseFloat(inputAmount) * rate).toFixed(6);
        const impact = Math.min((parseFloat(inputAmount) / 1000) * 0.1, 5);
        const minReceived = (
          parseFloat(output) *
          (1 - slippageTolerance / 100)
        ).toFixed(6);

        return { output, impact, minReceived };
      } catch (error) {
        console.error("Detailed price calculation error:", {
          message: error.message,
          code: error.code,
          reason: error.reason,
          stack: error.stack,
        });

        // Fallback calculation
        const rate = inputTokenSymbol === "TOKEN0" ? 1.2345 : 0.8102;
        const output = (parseFloat(inputAmount) * rate).toFixed(6);
        const impact = Math.min((parseFloat(inputAmount) / 1000) * 0.1, 5);
        const minReceived = (
          parseFloat(output) *
          (1 - slippageTolerance / 100)
        ).toFixed(6);
        return { output, impact, minReceived };
      }
    },
    [signerPromise, slippageTolerance]
  );

  // Wrap loadPoolInfo in useCallback
  const loadPoolInfo = async () => {
    if (!isConnected) return;

    try {
      const signer = await signerPromise;
      if (!signer) {
        console.log("No signer available");
        return;
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
        contractAbi,
        signer
      );

      const poolAddress = CONTRACT_ADDRESSES.UNISWAP_POOL;

      if (!poolAddress) {
        console.error("Pool address not found in environment variables");
        setError("Pool address not configured");
        return;
      }

      let poolData = {};

      try {
        const poolInfo = await contract.getPoolInfo(poolAddress);
        poolData.sqrtPriceX96 = poolInfo[0]?.toString() || "0";
        poolData.tick = poolInfo[1]?.toString() || "0";
        poolData.liquidity = poolInfo[2]
          ? ethers.formatUnits(poolInfo[2], 18)
          : "0";
      } catch (err) {
        console.log("Error getting pool info:", err.message);
        poolData.liquidity = "N/A";
        poolData.sqrtPriceX96 = "N/A";
        poolData.tick = "N/A";
      }

      try {
        const balances = await contract.getPoolBalances(poolAddress);
        poolData.token0Balance =
          balances[0] !== undefined ? ethers.formatUnits(balances[0], 18) : "0";
        poolData.token1Balance =
          balances[1] !== undefined ? ethers.formatUnits(balances[1], 18) : "0";
      } catch (err) {
        console.log("Error getting pool balances:", err.message);
        poolData.token0Balance = "N/A";
        poolData.token1Balance = "N/A";
      }

      try {
        const token0Price = await contract.getTokenPrice(poolAddress);
        poolData.token0Price =
          token0Price !== undefined
            ? ethers.formatUnits(token0Price, 18)
            : "N/A";
        poolData.token1Price =
          token0Price !== undefined
            ? (1 / parseFloat(ethers.formatUnits(token0Price, 18))).toFixed(6)
            : "N/A";
        console.log("Token0 Price:", token0Price);
      } catch (err) {
        console.log("Error getting token price:", err.message);
        poolData.token0Price = "N/A";
        poolData.token1Price = "N/A";
      }

      // Get the current pool price for liquidity provision
      const priceData = await getCurrentPoolPrice(contract);
      setPoolPrice(priceData.price);
      setIsInitialRatio(priceData.isInitialRatio);

      console.log("Pool Info:", poolInfo);
      console.log("Pool Balances:", balances);
      console.log("Current Pool Price:", priceData);

      setPoolInfo({
        liquidity: poolData.liquidity,
        sqrtPriceX96: poolData.sqrtPriceX96,
        tick: poolData.tick,
        token0Balance: poolData.token0Balance,
        token1Balance: poolData.token1Balance,
        token0Price: poolData.token0Price,
        token1Price: poolData.token1Price,
        volume24h: "N/A",
        fees24h: "N/A",
        apr: "N/A",
      });
    } catch (error) {
      console.error("Error loading pool info:", error);
      setError("Failed to load pool info: " + error.message);
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
  };

  const getCurrentPoolPrice = async (contract) => {
    try {
      const poolAddress = CONTRACT_ADDRESSES.UNISWAP_POOL;

      if (
        !poolAddress ||
        poolAddress === "0x0000000000000000000000000000000000000000"
      ) {
        console.log("No pool address configured - using initial ratio");
        return { price: 1000, isInitialRatio: true };
      }

      console.log("Using pool address:", poolAddress);

      // Try direct pool contract call using tick value instead
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

        // Get slot0 data which contains tick and sqrtPriceX96
        const slot0 = await poolContract.slot0();
        const poolToken0 = await poolContract.token0();
        const poolToken1 = await poolContract.token1();

        // Get liquidity to check if pool has been initialized
        const liquidity = await poolContract.liquidity();

        console.log("Pool data:", {
          sqrtPriceX96: slot0.sqrtPriceX96.toString(),
          tick: slot0.tick.toString(),
          poolToken0,
          poolToken1,
          liquidity: liquidity.toString(),
        });

        // Check if pool has liquidity
        if (liquidity.toString() === "0" && !slot0.tick) {
          console.log("Pool has no liquidity - using initial ratio");
          return { price: 1000, isInitialRatio: true };
        }

        // Use the tick value to calculate price (more accurate than sqrtPriceX96 for display)
        const tick = parseInt(slot0.tick.toString());
        let rawPrice = Math.pow(1.0001, tick);

        console.log("Raw price from tick:", rawPrice);

        // Get token contracts to check decimals
        const token0Contract = new ethers.Contract(
          poolToken0,
          USDC_ABI.abi, // Using as generic ERC20 ABI
          contract.runner
        );

        const token1Contract = new ethers.Contract(
          poolToken1,
          ABYTKN_ABI.abi, // Using as generic ERC20 ABI
          contract.runner
        );

        // Get decimals
        const token0Decimals = await token0Contract.decimals();
        const token1Decimals = await token1Contract.decimals();

        console.log("Token decimals:", {
          token0: token0Decimals,
          token1: token1Decimals,
        });

        // Adjust for decimal differences
        const decimalAdjustment = Math.pow(10, token1Decimals - token0Decimals);
        rawPrice = rawPrice * decimalAdjustment;

        console.log("Price after decimal adjustment:", rawPrice);

        // Check token ordering to determine if we need to invert
        const token0IsUsdc =
          poolToken0.toLowerCase() === CONTRACT_ADDRESSES.TOKEN0.toLowerCase();

        let finalPrice;
        if (token0IsUsdc) {
          // If USDC is token0, price is USDC/ABYTKN, but we want ABYTKN/USDC
          finalPrice = 1 / rawPrice;
        } else {
          // If ABYTKN is token0, price is ABYTKN/USDC which is what we want
          finalPrice = rawPrice;
        }

        console.log("Final calculated price (ABYTKN per USDC):", finalPrice);

        // Sanity check
        if (finalPrice > 0 && finalPrice < 1000000) {
          return { price: finalPrice, isInitialRatio: false };
        } else {
          console.warn("Price outside reasonable range:", finalPrice);
          return { price: 1000, isInitialRatio: true };
        }
      } catch (directError) {
        console.log("Error with direct pool call:", directError.message);
      }

      // Fallback to contract methods if direct call fails
      try {
        const poolInfo = await contract.getPoolInfo(poolAddress);
        if (poolInfo && poolInfo.length > 1) {
          const tick = parseInt(poolInfo[1].toString());
          console.log("Pool tick from contract:", tick);

          // Calculate price from tick
          const rawPrice = Math.pow(1.0001, tick);

          // Check token ordering
          const contractToken0 = await contract.token0();
          const token0IsUsdc =
            contractToken0.toLowerCase() ===
            CONTRACT_ADDRESSES.TOKEN0.toLowerCase();

          // Adjust based on token order
          const price = token0IsUsdc ? 1 / rawPrice : rawPrice;

          console.log("Contract method calculated price:", price);

          if (price > 0 && price < 1000000) {
            return { price, isInitialRatio: false };
          }
        }
      } catch (contractError) {
        console.log("Error using contract method:", contractError.message);
      }

      // Final fallback
      console.log("All methods failed, using initial ratio");
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
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
        contractAbi,
        signer
      );

      const priceData = await getCurrentPoolPrice(contract);
      setPoolPrice(priceData.price);
      setIsInitialRatio(priceData.isInitialRatio);

      console.log("Pool price fetched:", priceData);
    } catch (error) {
      console.error("Error fetching pool price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const refreshPoolPrice = async () => {
    if (!signerPromise) return;

    setIsLoadingPrice(true);
    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
        contractAbi,
        signer
      );

      // Get the pool price
      const tokenPrice = await contract.getTokenPrice(
        CONTRACT_ADDRESSES.UNISWAP_POOL
      );

      if (tokenPrice) {
        // The contract's getTokenPrice might return different format based on token order
        // Let's check what the actual token order is
        const contractToken0 = await contract.token0();
        const contractToken1 = await contract.token1();

        // Contract token0 is your config TOKEN1 (ABYTKN)
        // Contract token1 is your config TOKEN0 (USDC)

        // If getTokenPrice returns price of token1 in terms of token0
        // That would be USDC price in terms of ABYTKN
        // But we want ABYTKN price in terms of USDC for the UI

        let formattedPrice = parseFloat(ethers.formatUnits(tokenPrice, 18));

        // Check if we need to invert the price
        const contractToken0IsABYTKN =
          contractToken0.toLowerCase() ===
          CONTRACT_ADDRESSES.TOKEN1.toLowerCase();

        if (contractToken0IsABYTKN) {
          // If contract token0 is ABYTKN, then the price might be USDC per ABYTKN
          // We want ABYTKN per USDC, so we need to invert
          if (formattedPrice > 0) {
            formattedPrice = 1 / formattedPrice;
          }
        }

        console.log("Refreshed pool price:", formattedPrice);
        setPoolPrice(formattedPrice);
        setIsInitialRatio(false);
      }
    } catch (error) {
      console.error("Error refreshing pool price:", error);
      // Fallback to a reasonable default
      setPoolPrice(1000); // 1000 ABYTKN per USDC
      setIsInitialRatio(true);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Helper function to calculate and validate ratio
  const calculateRatioWithPoolPrice = (
    token0Amount,
    token1Amount,
    poolPrice
  ) => {
    if (!token0Amount || !token1Amount || !poolPrice) return null;

    const amount0 = parseFloat(token0Amount); // USDC amount (from UI)
    const amount1 = parseFloat(token1Amount); // ABYTKN amount (from UI)

    if (amount0 <= 0 || amount1 <= 0) return null;

    const currentRatio = amount1 / amount0; // ABYTKN per USDC (UI ratio)
    const tolerance = 0.05; // 5% tolerance

    const isValidRatio =
      Math.abs(currentRatio - poolPrice) / poolPrice <= tolerance;

    return {
      ratio: currentRatio,
      poolPrice: poolPrice,
      isValidRatio,
      tolerance,
      suggestedToken1Amount: (amount0 * poolPrice).toFixed(6), // Suggested ABYTKN amount
      suggestedToken0Amount: (amount1 / poolPrice).toFixed(6), // Suggested USDC amount
      priceDifference: (((currentRatio - poolPrice) / poolPrice) * 100).toFixed(
        2
      ),
    };
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
    calculateRatioWithPoolPrice,
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
