# AmbassadorNetworkFacet Contract Updates Needed

## 1. Add Missing Function to Contract

Add this function to get ALL ambassadors (not just roots):

```solidity
//function to get all registered ambassadors
function getAllAmbassadors() external view returns (address[] memory) {
    LibDiamond.AmbassadorProgramStorage storage s = LibDiamond.ambassadorProgramStorage();
    return s.allAmbassadors;
}
```

## 2. Verify Field Name in Struct

The `getAmbassadorDetails` function returns `ambassador.lifetimeCommissionsEarned`
Make sure this field exists in `LibDiamond.Ambassador` struct. If it's named differently, update the return statement.

## 3. Frontend Fix: Allow address(0) as Sponsor

The first founding ambassador should be able to register with `sponsor = address(0)`.

## 4. Add Error Logging

The USDC transfer might be failing. Add better error handling in the contract or ensure:

- User has approved the DIAMOND contract (not another contract)
- User has sufficient USDC balance
- DAO treasury address is set correctly
