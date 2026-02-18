# Required AmbassadorNetworkFacet Changes

## 1. ADD THIS FUNCTION to AmbassadorNetworkFacet.sol

Add this function to the VIEW FUNCTIONS section (after `getRootAmbassadors`):

```solidity
//function to get all registered ambassadors (both root and non-root)
function getAllAmbassadors() external view returns (address[] memory) {
    LibDiamond.AmbassadorProgramStorage storage s = LibDiamond.ambassadorProgramStorage();
    return s.allAmbassadors;
}
```

This is critical for the frontend to fetch ALL ambassadors, not just root ones.

## 2. VERIFY CONTRACT FIELDS

Make sure the Ambassador struct has this field (used in getAmbassadorDetails return):

- `lifetimeCommissionsEarned` (not `lifetimeCommissions`)

If it's named differently, update the return statement in `getAmbassadorDetails`:

```solidity
return (ambassador.DID, ambassador.tier, ambassador.level, ambassador.sponsor, ambassador.leftLeg,ambassador.rightLeg, ambassador.totalDownlineSales, ambassador.lifetimeCommissionsEarned, ambassador.isActive);
```

## 3. VERIFY DAO TREASURY IS SET

In your deployment script, ensure you set the DAO treasury address:

```javascript
// In your deployment/setup function:
// ds.daoTreasury = <VALID_TREASURY_ADDRESS>;
```

If this is not set (is address(0)), the USDC transfer will fail.

## 4. RECOMPILE AND REDEPLOY

After adding the `getAllAmbassadors` function:

```bash
npx hardhat compile
npx hardhat run scripts/diamondContractsDeploy.js --network sepolia
```

## Testing Checklist

After redeploying:

1. ✅ Call `getAllAmbassadors()` - should return array of ambassador addresses
2. ✅ Call `getAmbassadorDetails(address)` - should return 9 values with correct field names
3. ✅ Test founding ambassador registration with approval flow
4. ✅ Verify USDC transferred from user to DAO treasury
5. ✅ Verify ambassador appears in `getAllAmbassadors()` after registration
