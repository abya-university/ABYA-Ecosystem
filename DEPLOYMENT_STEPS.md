# QUICK DEPLOY GUIDE

## Step 1: ADD Function to AmbassadorNetworkFacet.sol

Find the `getRootAmbassadors()` function in your contract. After it, add this:

```solidity
//function to get all registered ambassadors (both root and non-root)
function getAllAmbassadors() external view returns (address[] memory) {
    LibDiamond.AmbassadorProgramStorage storage s = LibDiamond.ambassadorProgramStorage();
    return s.allAmbassadors;
}
```

**Location**: In the VIEW FUNCTIONS section, after `getRootAmbassadors()` (around line 300)

---

## Step 2: Compile

```bash
cd /home/pierre/Desktop/pierre/Solidity_Projects/ABYA-Ecosystem
npx hardhat compile
```

**Expected output**:

```
contracts/AmbassadorNetworkFacet.sol: Warning: SPDX license identifier not provided in source file. Before publishing, consider adding comments such as "// SPDX-License-Identifier: MIT" at the very top of the file.
Compiled successfully
```

---

## Step 3: Deploy

```bash
npx hardhat run scripts/diamondContractsDeploy.js --network sepolia
```

**Expected output**: Transaction hash and deployment confirmation

---

## Step 4: Verify in Explorer

1. Go to [Sepolia Explorer](https://sepolia.etherscan.io)
2. Search for your diamond contract address
3. Go to the "Contract" tab
4. Expand "AmbassadorNetworkFacet"
5. Find `getAllAmbassadors` in the function list
6. Click it and call it to verify it returns an address array

---

## Step 5: Test in Frontend

1. Go to Network Dashboard
2. Click "Become Founding Ambassador"
3. Approve USDC
4. Confirm registration
5. Wait 5-10 seconds
6. Check that:
   - Role badge shows "Founding Ambassador"
   - Dashboard metrics update
   - You appear in ambassador list

---

## 🐛 If Still Getting Errors

### Error: "registerAmbassador" function not found

- **Cause**: Method name mismatch still exists
- **Fix**: Ensure context was updated correctly (see BUGS_FIXED_SUMMARY.md)

### Error: "Invalid sponsor"

- **Cause**: Sponsor address validation in contract
- **Fix**: For first founder, send address(0) or empty string (context handles this)

### Error: "USDC entry fee failed"

- **Cause**: USDC transfer failed
- **Reasons**:
  1. User didn't approve USDC to diamond contract
  2. DAO treasury address not set in contract
  3. User doesn't have 100 USDC
  4. USDC contract address incorrect
- **Fix**: Check all above in your deployment script

### Error: "Insufficient USDC balance"

- **Cause**: User balance < 100 USDC (6 decimals)
- **Fix**: Send test USDC or reduce fee (for testing)

---

## Frontend Verification Commands

In browser console (while on Network Dashboard):

```javascript
// Check if context is working
const { ambassadorDetails } = useAmbassadorNetwork();
console.log(ambassadorDetails);

// Check if getAllAmbassadors is exported
const { getAllAmbassadors } = useAmbassadorNetwork();
console.log(typeof getAllAmbassadors); // Should be "function"
```

---

## Emergency Fallback

If you cannot add the function to contract, the frontend will automatically fallback to using `getRootAmbassadors()` only. This means:

- First ambassador will work fine
- Subsequent ambassadors will be invisible (they're non-roots)
- This is NOT recommended for production!

---

## Contract Verification

After deployment, verify the function was added:

```bash
npx hardhat verify --network sepolia <DIAMOND_ADDRESS> --contract contracts/AmbassadorNetworkFacet.sol:AmbassadorNetworkFacet
```

Then check [Sepolia Explorer](https://sepolia.etherscan.io) > your contract > "Read Contract" to see `getAllAmbassadors()`
