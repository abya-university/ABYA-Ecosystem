import React, { useState, useEffect } from "react";
import { useUserPositions } from "../../contexts/fake-liquidity-test-contexts/userPositionContext";

const RemoveLiquidity = () => {
  const {
    positions,
    loading,
    error,
    removeLiquidity,
    refreshPositions,
    getPositionFees,
    getPositionDetails,
  } = useUserPositions();

  const [positionDetails, setPositionDetails] = useState(null);
  const [fees, setFees] = useState({ token0: "0", token1: "0" });
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [percentToRemove, setPercentToRemove] = useState(100);

  // Fetch positions on component mount
  useEffect(() => {
    refreshPositions();
  }, [refreshPositions]);

  // When a position is selected, get its details
  useEffect(() => {
    const fetchPositionDetails = async () => {
      if (selectedPositionId) {
        console.log(`Fetching details for position ${selectedPositionId}...`);
        const details = await getPositionDetails(selectedPositionId);
        console.log("Position details:", details);
        setPositionDetails(details);

        const feesData = await getPositionFees(selectedPositionId);
        console.log("Position fees:", feesData);
        setFees(feesData);
      } else {
        setPositionDetails(null);
        setFees({ token0: "0", token1: "0" });
      }
    };

    fetchPositionDetails();
  }, [selectedPositionId, getPositionDetails, getPositionFees]);

  // Handle position selection
  const handleSelectPosition = (tokenId) => {
    console.log(`Selected position: ${tokenId}`);
    setSelectedPositionId(tokenId);
  };

  // Handle removing liquidity
  const handleRemoveLiquidity = async () => {
    if (!selectedPositionId) return;

    setRemoving(true);
    try {
      // Convert percent to a decimal amount
      const liquidityAmount = (percentToRemove / 100).toString();

      const result = await removeLiquidity(selectedPositionId, liquidityAmount);

      if (result.success) {
        alert(
          `Successfully removed ${percentToRemove}% liquidity. Transaction: ${result.hash}`
        );
        refreshPositions();
        setSelectedPositionId(null);
      } else {
        alert(`Failed to remove liquidity: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setRemoving(false);
    }
  };

  console.log("User Positions:", positions);
  console.log("Selected Position Details:", positionDetails);
  console.log("Fees Data:", fees);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Remove Liquidity
      </h2>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-lg mb-4 border border-red-200 dark:border-red-500/30">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      )}

      {/* No Positions State */}
      {!loading && positions.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="mb-2">You don't have any liquidity positions.</p>
          <button
            onClick={refreshPositions}
            className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-500 dark:hover:text-yellow-400"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Position Selection */}
      {positions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Select Position
          </h3>
          <div className="grid gap-3">
            {positions.map((position) => (
              <div
                key={position.tokenId}
                onClick={() => handleSelectPosition(position.tokenId)}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPositionId === position.tokenId
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-500"
                    : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Position #{position.tokenId}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Liquidity:{" "}
                      {parseFloat(position.liquidity).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tokens: {parseFloat(position.token0 || "0").toFixed(6)} /{" "}
                      {parseFloat(position.token1 || "0").toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Position Details */}
      {positionDetails && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Position Details
          </h3>

          {/* Position Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Liquidity
              </p>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {parseFloat(positionDetails.liquidity).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Token ID
              </p>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {positionDetails.tokenId}
              </p>
            </div>
          </div>

          {/* Fees Info */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Collected Fees
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Token 0
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {parseFloat(fees.token0).toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Token 1
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {parseFloat(fees.token1).toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Liquidity Removal Controls */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Amount to Remove
            </p>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="range"
                min="1"
                max="100"
                value={percentToRemove}
                onChange={(e) => setPercentToRemove(parseInt(e.target.value))}
                className="flex-1 accent-yellow-500"
              />
              <span className="font-medium text-gray-800 dark:text-gray-100">
                {percentToRemove}%
              </span>
            </div>

            <button
              // onClick={handleRemoveLiquidity}
              onClick={() => alert("This feature is still under development.")}
              disabled={removing}
              className="w-full bg-yellow-500 dark:bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:bg-yellow-300 dark:disabled:bg-yellow-800 disabled:cursor-not-allowed transition-colors"
            >
              {removing
                ? "Processing..."
                : `Remove ${percentToRemove}% Liquidity`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveLiquidity;
