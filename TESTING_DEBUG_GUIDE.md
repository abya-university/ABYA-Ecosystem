# TESTING & DEBUGGING GUIDE

## What You'll See After Fixes Are Applied

### Success Case: First Founder Registration

#### Step 1: Click "Become Founding Ambassador"

**UI Shows**:

- Wallet Connected ✅
- Digital Identity (DID) - Ready ✅
- Already registered as ambassador? NO ✅

#### Step 2: Approve USDC (First Time Only)

**Browser**:

- MetaMask popup: "Approve USDC for Diamond Contract"
- Amount: 100 USDC
- Spender: Diamond Contract Address (from CONTRACT_ADDRESSES.diamond)

**Console**:

```
Checking USDC allowance...
Current allowance: 0
Allowance insufficient, requesting approval...
Requesting USDC approval...
USDC approval successful!
```

**Toast Notifications**:

- "Checking USDC allowance..." (loading)
- "Requesting USDC approval..." (loading)
- "USDC approval successful!" (success)

#### Step 3: Registration

**Console**:

```
Calling registerFoundingAmbassador with: {
  sponsor: "0x0000000000000000000000000000000000000000",  ← address(0) for first founder
  did: "0x1234..."
}
Transaction sent: {hash: "0xabc..."}
Transaction confirmed: {hash: "0xabc..."}
Starting fetchAmbassadors...
Contract instance created
getAllAmbassadors returned: ["0xYourAddress..."]
Valid ambassador addresses: ["0xYourAddress..."]
Processed ambassadors details: [{address: "0xYourAddress...", tier: 0, level: 2, ...}]
```

**Toast Notifications**:

- "Registering as founding ambassador..." (loading)
- "Successfully registered as founding ambassador!" (success)

#### Step 4: Role Updates & UI Changes

**Within 2-3 seconds**:

**Role Badge**:

- Changes from "Not Registered" → "👑 Founding Ambassador" (Yellow badge)

**Dashboard Metrics** (update):

- "Active Ambassadors": 0 → 1
- "Total Downline Sales": -- → 0 (or your actual downline)
- "Total Commissions": -- → 0 (or your actual commissions)

**Buttons**:

- "Become Founding Ambassador" → DISABLED (grayed out with checkmark)
- "Become General Ambassador" → HIDDEN (if dual paths)

**Wallet**:

- USDC Balance decreases by 100 USDC
- Example: 1000 USDC → 900 USDC

---

### What Happens If You Try to Register Again

**Button State**:

```
"Become Founding Ambassador" is DISABLED
↓
"Already registered as ambassador"
↓
"You cannot register as multiple ambassador types. Deregister first to switch."
```

**If you click**: Nothing happens (button disabled)

---

### Testing Sequence (Recommended Order)

#### Test 1: First Founder (YOU)

```
1. Open Network Dashboard
2. Verify wallet connected ✅
3. Verify DID shows "Ready" ✅
4. Click "Become Founding Ambassador"
5. Click "Approve" on USDC approval popup
6. Wait for approval confirmation
7. Confirm transaction
8. Wait 5-10 seconds
9. Verify:
   ✅ Role badge shows "Founding Ambassador"
   ✅ Active Ambassadors metric = 1
   ✅ USDC balance decreased by 100
   ✅ Button now shows "Already registered"
   ✅ Console shows "Successfully registered as founding ambassador!"
```

**Success Indicators**:

- Toast shows "Successfully registered as founding ambassador!"
- Role badge appears immediately and stays
- USDC balance visibly decreases
- Dashboard metrics update
- Cannot register again (button disabled)

#### Test 2: Second Founder/Sponsor (Different Wallet)

```
1. Disconnect first wallet
2. Connect second wallet
3. Go to Network Dashboard
4. Notice "Already registered as ambassador" message is GONE
5. Click "Become Founding Ambassador"
6. NO USDC APPROVAL NEEDED (second wallet has unlimited)
7. Confirm transaction
8. Wait 5-10 seconds
9. Verify:
   ✅ Role badge shows "Founding Ambassador"
   ✅ Active Ambassadors metric = 2
   ✅ USDC balance decreased by 100
   ✅ Can see first founder in Network list
```

#### Test 3: General Ambassador

```
1. Use third wallet that has $50+ enrolled courses
2. Go to Network Dashboard
3. Verify "You're qualified!" message shows
4. Enter first founder's address as sponsor
5. Click "Register as General Ambassador"
6. Confirm transaction (NO USDC approval, course already paid)
7. Wait 5-10 seconds
8. Verify:
   ✅ Role badge shows "General Ambassador"
   ✅ Active Ambassadors metric = 3
   ✅ Appears in network both as root and under sponsor's tree
```

---

## Debugging: What to Check If Registration Fails

### Error: "registerAmbassador" function not found

```
Error in Console:
"The method 'registerAmbassador' does not exist or is not available."
```

**Cause**: Context wasn't updated or old ABI is cached

**Fix**:

1. Verify [src/contexts/ambassadorNetworkContext.jsx](src/contexts/ambassadorNetworkContext.jsx) line 87 says:
   ```javascript
   method: "registerFoundingAmbassador",
   ```
   (NOT "registerAmbassador")
2. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. Clear cache: DevTools → Application → Clear Site Data
4. Try again

### Error: "Invalid sponsor" or "Already registered"

```
Error in Console:
"Error registering ambassador - Full error: Error: Invalid sponsor"
```

**Cause 1**: Sponsor address is invalid/doesn't exist

**Fix**:

- For first founder: Should automatically use address(0)
- For others: Verify entered address is a real ambassador

**Cause 2**: Wallet already registered

**Fix**:

- Check if role badge shows "Founding Ambassador" or "General Ambassador"
- If yes: Cannot register again, must deregister first
- If no: Clear browser cache and try again

### Error: "Insufficient USDC balance"

```
Error in Console:
"Error registering ambassador - Full error: Error: Insufficient USDC balance"
```

**Cause**: User has < 100 USDC

**Fix**:

- For testnet: Request test USDC from faucet
- Command to check balance:
  ```javascript
  // Open browser console on Network Dashboard
  const { ethers } = await import("ethers");
  const balance = await ethers.provider.getBalance("YOUR_ADDRESS");
  console.log(ethers.formatUnits(balance));
  ```

### Error: "USDC entry fee failed"

```
Error in Console:
"Error registering ambassador - Full error: Error: USDC entry fee failed"
```

**Cause**: One of:

1. USDC approval failed
2. DAO treasury address not set in contract
3. Wrong USDC contract address
4. USDC transfer reverted

**Fix**:

1. Check USDC approval again:

   ```javascript
   // In browser console
   const { client } = await import('./services/client');
   const usdcContract = getContract({
     address: '0xUSDC_ADDRESS',
     ...
   });
   const allowance = await readContract({
     contract: usdcContract,
     method: 'function allowance(address owner, address spender) view returns (uint256)',
     params: ['YOUR_ADDRESS', CONTRACT_ADDRESSES.diamond]
   });
   console.log(allowance); // Should be huge number (unlimited)
   ```

2. Verify DAO treasury is set in contract:

   - Go to contract explorer
   - Search for daoTreasury variable
   - Should NOT be address(0)

3. Verify USDC address in `src/constants/addresses.js`:
   ```javascript
   // Should be Sepolia USDC
   VITE_APP_SEPOLIA_USDC_ADDRESS=0x<correct address>
   ```

### Error: "Transaction reverted"

```
Error in Console:
"Error registering ambassador - Full error: Error: Transaction reverted for an unknown reason, or was reverted with invalid data"
```

**Cause**: Contract revert (check contract console logs)

**Check Contract State**:

```bash
# SSH to your server where contract runs
# Check contract logs for the specific error

# Or use contract explorer:
# 1. Go to contract
# 2. Go to "Debug contract"
# 3. Call getAmbassadorDetails(YOUR_ADDRESS)
# 4. If returns all zeros = not registered
# 5. If reverts = input validation failure
```

---

## Console Debugging Checklist

Run these in browser console while testing:

### Check 1: Verify Context Loaded

```javascript
const { useAmbassadorNetwork } = await import(
  "./contexts/ambassadorNetworkContext"
);
const context = useAmbassadorNetwork();
console.log("Context loaded:", !!context);
console.log(
  "Has registerFoundingAmbassador:",
  typeof context.registerFoundingAmbassador === "function",
);
console.log(
  "Has getAllAmbassadors:",
  typeof context.getAllAmbassadors === "function",
);
```

### Check 2: Verify Contract Connection

```javascript
const { getContract, readContract } = await import("thirdweb");
const { client } = await import("./services/client");
const CONTRACT_ADDRESSES = await import("./constants/addresses");

const contract = getContract({
  address: CONTRACT_ADDRESSES.diamond,
  client,
  chain: defineChain(11155111),
});

// Test getAllAmbassadors
try {
  const result = await readContract({
    contract,
    method: "getAllAmbassadors",
  });
  console.log("getAllAmbassadors returned:", result);
} catch (e) {
  console.log("getAllAmbassadors not found:", e.message);
}
```

### Check 3: Verify USDC

```javascript
const { ethers } = await import("ethers");
const USDC_ADDRESS = import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS;

// Get balance
const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
const balance = await provider.call({
  to: USDC_ADDRESS,
  data:
    ethers.id("balanceOf(address)").slice(0, 10) +
    "YOUR_ADDRESS".slice(2).padStart(64, "0"),
});
console.log("USDC Balance:", ethers.formatUnits(balance, 6));
```

### Check 4: Monitor Transaction

```javascript
// After clicking register, get hash from logs
const txHash = "0x..."; // From console or MetaMask

const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
const receipt = await provider.getTransactionReceipt(txHash);

console.log("Transaction Status:", receipt.status === 1 ? "Success" : "Failed");
console.log("Gas Used:", receipt.gasUsed.toString());
console.log("Block:", receipt.blockNumber);
```

---

## Expected Console Output (Successful Registration)

```javascript
// When page loads:
[Context] AmbassadorNetworkProvider initialized
[User Context] Checking user roles...
[Theme] Dark mode enabled

// When you click "Become Founding Ambassador":
Checking USDC allowance...
Current allowance: 0
Allowance insufficient, requesting approval...

// (MetaMask popup appears - you click Approve)

USDC approval successful!
Calling registerFoundingAmbassador with: {
  "sponsor": "0x0000000000000000000000000000000000000000",
  "did": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
Transaction sent: TransactionResponse {
  hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  ...
}
Transaction confirmed: TransactionReceipt { ... }
Starting fetchAmbassadors...
Contract instance created
getAllAmbassadors returned: [
  "0x1234567890abcdef1234567890abcdef12345678"
]
Raw ambassador addresses: ["0x1234567890abcdef1234567890abcdef12345678"]
Valid ambassador addresses: ["0x1234567890abcdef1234567890abcdef12345678"]
[9 return values from getAmbassadorDetails...]
Processed ambassadors details: [
  {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    did: "0x1234...",
    tier: 0,  // FOUNDING = 0
    level: 2, // Founding ambassadors start at Level 2
    sponsor: "0x0000000000000000000000000000000000000000",
    leftLeg: "0x0000000000000000000000000000000000000000",
    rightLeg: "0x0000000000000000000000000000000000000000",
    totalDownlineSales: 0n,
    lifetimeCommissions: 0n,
    isActive: false  // Needs 2 recruits to activate
  }
]
[Role refresh] Checking FOUNDING_AMBASSADOR_ROLE...
[Role refresh] User role: "Founding Ambassador"
[Finally] Success! Role badge appears, metrics update
```

---

## Role Badge Appearance Timeline

- **T=0s**: Click register
- **T=2-4s**: Role badge updates to "Founding Ambassador"
- **T=4-6s**: Dashboard metrics refresh
- **T=6-10s**: Full network list updates
- **T=10s**: Page fully synchronized

If role badge doesn't appear after 10 seconds → Clear cache and refresh page

---

## Quick Troubleshooting Table

| Symptom                                    | Likely Cause                 | Solution                                      |
| ------------------------------------------ | ---------------------------- | --------------------------------------------- |
| Button disabled, says "Already registered" | You ARE registered           | Use different wallet or deregister first      |
| "Invalid sponsor address" error            | Sponsor address format wrong | Check address starts with 0x and 40 hex chars |
| "Insufficient USDC balance"                | Need 100+ USDC               | Get test USDC from faucet                     |
| "registerAmbassador not found"             | Old code cached              | Hard refresh (Ctrl+Shift+R) + clear cache     |
| Role badge doesn't update                  | Role refresh failed          | Check console for errors, refresh page        |
| USDC approved but registration fails       | DAO treasury not set         | Check contract setup                          |
| Transaction reverts with no message        | Contract validation failed   | Check console logs and contract state         |
| Ambassador appears in explorer but not UI  | Data sync lag                | Wait 5-10 seconds, refresh page               |
