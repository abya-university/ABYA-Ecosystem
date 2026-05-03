<div align="center">

<img src="https://img.shields.io/badge/Network-SKALE%20Titan%20Hub-6366f1?style=for-the-badge" />
<img src="https://img.shields.io/badge/Standard-EIP--2535%20Diamond-059669?style=for-the-badge" />
<img src="https://img.shields.io/badge/Account%20Abstraction-EIP--4337-d97706?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-BSL%201.1-e11d48?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Mainnet%20Live-059669?style=for-the-badge" />

</div>

<br />

<div align="center">

# ABYA NEXUS
### Sovereign Economic Engine (S.E.E.)

**Learn it. Prove it. Own it.**

*A decentralized, Africa-first learning and earning protocol that makes Web3 feel like Web2 — built on SKALE Titan Hub, powered by heutagogical AI, and bootstrapped through a circular economy that runs on mobile money.*

[Website](https://nexus.abya.university) · [Documentation](https://docs.abya.university) · [Whitepaper](./docs/ABYA_Nexus_Whitepaper_v2.pdf) · [Twitter](https://twitter.com/ABYA_Nexus) · [Discord](https://discord.gg/abya) · [GitHub Issues](https://github.com/abya-university/ABYA-Ecosystem/issues)

</div>

---

## Table of Contents

- [What is ABYA Nexus?](#what-is-abya-nexus)
- [Core Philosophy](#core-philosophy)
- [Architecture Overview](#architecture-overview)
- [Feature Modules](#feature-modules)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [Running Tests](#running-tests)
- [Smart Contract Deployment](#smart-contract-deployment)
- [API Integration](#api-integration)
  - [M-Pesa (Safaricom Daraja)](#m-pesa-safaricom-daraja)
  - [Africa's Talking (Airtime)](#africas-talking-airtime)
  - [Dr. Kwame AI Tutor (Gemini MCP)](#dr-kwame-ai-tutor-gemini-mcp)
- [Deployment (Coolify + SiteGround)](#deployment-coolify--siteground)
- [The $ABYT Token](#the-abyt-token)
- [Governance](#governance)
- [Security](#security)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Community & Support](#community--support)
- [License](#license)

---

## What is ABYA Nexus?

ABYA Nexus is a **Sovereign Learning Protocol** — a decentralized application (dApp) that transforms education from an extractive, centralized industry into a community-owned ecosystem. It is engineered around one governing principle:

> *Web3 should work **for** learners, not **against** them.*

On ABYA Nexus, a learner in Nairobi can:

1. Sign up with **Google or email** — no wallet, no seed phrase, no gas fees
2. Study smart contract architecture with **Dr. Kwame**, an AI tutor that knows their on-chain history
3. Pay for courses with **M-Pesa** and earn **$ABYT tokens + airtime** while they learn
4. Graduate with a **blockchain-verified, ZK-proof credential** that no employer can fake or deny
5. Recruit peers and earn **binary ambassador commissions** on their network's activity
6. Govern the protocol through **reputation-weighted quadratic voting** in the Sovereign Council DAO

**The blockchain is the engine. Not the dashboard.**

### Why East Africa First?

| Signal | Data |
|--------|------|
| M-Pesa annual volume | $314 billion |
| Kenyans holding crypto | 35% of adults — highest in Africa |
| Dominant Web3 learning platforms in Africa | **Zero** |
| Africa's Talking API coverage | 300M+ phones, 18 countries |
| SKALE Titan Hub gas cost | **$0.00** per transaction |

East Africa is the most structurally ready market on earth for a mobile-first, zero-gas, M-Pesa-native Web3 learning protocol. That is the beachhead. Everything else is the expansion.

---

## Core Philosophy

ABYA Nexus is built on **heutagogy** — the theory of self-determined learning developed by Chris Hase. The curriculum progression across all learning tracks follows:

```
Pedagogy (teacher-led) → Andragogy (self-directed) → Heutagogy (self-determined)
```

This means the platform does not just deliver content. It builds learners who design their own learning journeys, determine their own goals, and take full ownership of their intellectual development — and their economic future.

### The Five UX Laws

Every interface decision in ABYA Nexus is governed by five non-negotiable principles:

| Law | Principle | Implementation |
|-----|-----------|----------------|
| 1 | **Zero Friction Onboarding** | Email/Google login → EIP-4337 smart account auto-deployed invisibly |
| 2 | **No Gas Anxiety** | ABYA Paymaster sponsors all UserOperations via SKALE Titan Hub |
| 3 | **Familiar Before Foreign** | Web2 UI patterns (progress bars, streaks, notifications) before DID/token jargon |
| 4 | **Real-Time Feedback** | Transaction receipts as "Lesson Complete" — not hex hashes |
| 5 | **Mobile-First Africa** | PWA with 2G/4G fallback; M-Pesa as primary payment rail |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ABYA NEXUS S.E.E.                           │
├─────────────────┬───────────────────────┬───────────────────────────┤
│   FRONTEND      │      BACKEND API       │    EXTERNAL INTEGRATIONS  │
│                 │                        │                           │
│  React 19       │  Node.js + Express     │  Safaricom Daraja (M-Pesa)│
│  TypeScript     │  TypeScript            │  Africa's Talking API     │
│  Tailwind CSS   │  PostgreSQL 16         │  Google Gemini 3 Pro (MCP)│
│  Vite           │  Redis 7               │  Pinata IPFS              │
│  PWA            │  Bull Queue            │  Stackup Bundler (4337)   │
├─────────────────┴───────────────────────┴───────────────────────────┤
│                    BLOCKCHAIN LAYER (SKALE TITAN HUB)                │
│                                                                      │
│  Diamond.sol (EIP-2535)                                              │
│  ├── IdentityFacet    — W3C DID, ABYA Passport (EIP-4337)           │
│  ├── RegistryFacet    — Pioneer/Ambassador verification              │
│  ├── AcademyFacet     — Enrollment, SBT minting, IP-NFT (EIP-5192)  │
│  ├── RewardsFacet     — $ABYT distribution, binary commission tree   │
│  ├── BridgeFacet      — M-Pesa escrow vault, yield distribution      │
│  └── GovernanceFacet  — Quadratic voting, DAO treasury               │
│                                                                      │
│  EIP-4337 Infrastructure                                             │
│  ├── ABYA Paymaster   — Sponsors all user gas fees                   │
│  ├── Bundler RPC      — UserOperation processing                     │
│  └── EntryPoint       — 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789  │
├──────────────────────────────────────────────────────────────────────┤
│                    DEPLOYMENT (COOLIFY + SITEGROUND)                  │
│                                                                      │
│  Coolify VPS → Traefik (SSL) → Frontend + Backend + DB + Redis       │
│  SiteGround DNS → A record → VPS IP                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Feature Modules

### 🎓 ABYA Passport (Decentralized Identity)
W3C-compliant Decentralized Identifier (DID) anchored to an EIP-4337 Smart Account. Learners own their educational history — it is portable, uncensorable, and survives protocol migrations. ZK-proof (Groth16 zk-SNARK) credentials allow skill verification without revealing private assessment data.

### 🤖 Dr. Kwame (AI Tutor)
Google Gemini 3 Pro integrated via the Model Context Protocol (MCP). Dr. Kwame reads each learner's on-chain state before every interaction and adapts curriculum to demonstrated mastery. Operates 24/7 in English, Swahili, French, and Yoruba.

### 💸 Regional P2P Bridge (M-Pesa × Escrow)
Safaricom Daraja C2B + STK Push integration with yield-bearing escrow vaults. M-Pesa deposits generate DeFi yield (4–8% APY via AAVE/Compound), which is split between P2P traders, the ABYA treasury, and the DAO.

### 📱 Airtime Incentives (Africa's Talking)
Learn-to-Earn that delivers tangible, immediately liquid rewards: mobile airtime. Dispatched programmatically to learners' SIM cards within 60 seconds of verified module completion across 18 African markets.

### 🌲 Binary Ambassador Network
On-chain binary referral tree with automated commission facets. Ambassadors earn 10% of their weaker leg's volume in $ABYT. A network of 5,000 founding ambassadors generates a self-propagating growth machine with $0 CAC.

### 📜 IP-NFT Curricula
EIP-721 metadata linked to IPFS content CIDs with royalty facets. Educators own their intellectual property as a tradeable on-chain asset and receive 65% primary revenue + 2% secondary royalties automatically.

### 🏛️ Sovereign Council (DAO)
Reputation-weighted quadratic voting (vote weight = √XP) on Diamond Facet upgrades, treasury allocations, and curriculum parameters. Controlled by a 5/9 Core Team multisig with a 48-hour timelock.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.x |
| Build | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Backend | Node.js + Express + TypeScript | 22.x LTS |
| ORM | Prisma | 5.x |
| Validation | Zod | 3.x |
| Job Queue | Bull (Redis-backed) | 4.x |
| Auth | Passport.js + JWT + Google OAuth | — |
| Smart Contracts | Solidity | 0.8.x |
| Dev Framework | Hardhat + Foundry | — |
| Blockchain | SKALE Titan Hub | Mainnet |
| Account Abstraction | EIP-4337 (Stackup Bundler) | — |
| Diamond Standard | EIP-2535 | — |
| Identity | W3C DID Core v1.0 (`did:abya:skale`) | — |
| ZK Proofs | Circom + SnarkJS + Groth16 | — |
| AI | Google Gemini 3 Pro via MCP | — |
| IPFS | Pinata Professional | — |
| Fiat Bridge | Safaricom Daraja API | v2 |
| Airtime | Africa's Talking | — |
| Deployment | Coolify + Traefik | — |
| DNS/Domain | SiteGround | — |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| E2E Testing | Playwright | — |
| Load Testing | k6 | — |

---

## Repository Structure

```
ABYA-Ecosystem/
├── apps/
│   ├── frontend/               # React 19 + TypeScript SPA
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── views/          # Page-level views (HomeView, DashboardView, etc.)
│   │   │   ├── context/        # NexusIdentityContext (global state)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client, blockchain interactions
│   │   │   └── types/          # TypeScript type definitions
│   │   ├── public/             # Static assets
│   │   └── vite.config.ts
│   │
│   └── backend/                # Node.js + Express API
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── services/       # Business logic (mpesa, airtime, gemini, etc.)
│       │   ├── middleware/      # Auth, rate limiting, validation
│       │   ├── models/         # Prisma schema + generated client
│       │   ├── oracle/         # On-chain event listener
│       │   └── queue/          # Bull job processors
│       └── prisma/
│           └── schema.prisma
│
├── contracts/                  # Solidity smart contracts
│   ├── Diamond.sol             # EIP-2535 Diamond Proxy
│   ├── facets/
│   │   ├── DiamondCutFacet.sol
│   │   ├── DiamondLoupeFacet.sol
│   │   ├── IdentityFacet.sol
│   │   ├── RegistryFacet.sol
│   │   ├── AcademyFacet.sol
│   │   ├── RewardsFacet.sol
│   │   ├── BridgeFacet.sol
│   │   └── GovernanceFacet.sol
│   ├── token/
│   │   └── ABYT.sol            # ERC-20 utility token with linear vesting
│   ├── libraries/
│   │   └── LibAppStorage.sol   # Shared Diamond storage struct
│   ├── circuits/               # Circom ZK-proof circuits
│   │   └── skillVerify.circom
│   ├── test/                   # Hardhat + Foundry tests
│   └── scripts/                # Deployment scripts
│       ├── deploy-diamond.ts
│       └── cut-facets.ts
│
├── docs/                       # Documentation
│   ├── ABYA_Nexus_Whitepaper_v2.pdf
│   ├── ABYA_Nexus_Platform_Dev_Guide_v1.pdf
│   ├── architecture/
│   ├── api-reference/
│   └── security/
│
├── infra/                      # Infrastructure configuration
│   ├── docker-compose.yml      # Local development
│   ├── docker-compose.prod.yml # Production (Coolify)
│   └── traefik/                # Reverse proxy config
│
├── .env.example                # Environment variable template
├── README.md
├── LICENSE.md
└── package.json                # Monorepo root (pnpm workspaces)
```

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 22.x LTS | Use `nvm` to manage versions |
| pnpm | ≥ 9.x | `npm install -g pnpm` |
| Docker + Docker Compose | Latest | For local database and Redis |
| Git | ≥ 2.x | |
| Foundry | Latest | `curl -L https://foundry.paradigm.xyz \| bash` |

You will also need API credentials for:
- Safaricom Daraja (M-Pesa) — [developer.safaricom.co.ke](https://developer.safaricom.co.ke) *(use sandbox for development)*
- Africa's Talking — [account.africastalking.com](https://account.africastalking.com) *(use sandbox for development)*
- Google Cloud Console (Gemini API) — [console.cloud.google.com](https://console.cloud.google.com)
- Pinata IPFS — [app.pinata.cloud](https://app.pinata.cloud)
- SKALE Titan Hub RPC — [NodeReal](https://nodereal.io) or [Ankr](https://ankr.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/abya-university/ABYA-Ecosystem.git
cd ABYA-Ecosystem

# Install all dependencies (monorepo)
pnpm install

# Install Foundry (for smart contract fuzzing)
foundryup
```

### Environment Variables

Copy the example environment file and populate all values:

```bash
cp .env.example .env
```

`.env.example` contains all required variables with documentation. **Never commit a populated `.env` file.** All production secrets are managed through Coolify's secret manager.

Key variables:

```bash
# Blockchain
SKALE_RPC_URL=                  # SKALE Titan Hub private RPC
BUNDLER_RPC_URL=                # EIP-4337 Bundler (Stackup/Pimlico)
PAYMASTER_ADDRESS=              # Deployed ABYA Paymaster address

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# M-Pesa (Safaricom Daraja)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_HMAC_SECRET=              # Generate: openssl rand -hex 32

# Africa's Talking
AT_API_KEY=
AT_USERNAME=

# AI Tutor
GEMINI_API_KEY=

# IPFS
PINATA_JWT=
PINATA_GATEWAY_URL=

# Auth
JWT_ACCESS_SECRET=              # Generate: openssl rand -hex 64
JWT_REFRESH_SECRET=             # Generate: openssl rand -hex 64
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> **Security note:** Use sandbox/testnet credentials for all third-party APIs during development. The Daraja sandbox and Africa's Talking sandbox do not trigger real charges or SMS.

### Local Development

```bash
# 1. Start local infrastructure (PostgreSQL + Redis)
docker compose up -d

# 2. Run database migrations
pnpm --filter backend prisma migrate dev

# 3. Start the backend API (http://localhost:4000)
pnpm --filter backend dev

# 4. Start the frontend (http://localhost:3000)
pnpm --filter frontend dev

# 5. (Optional) Start the ABYA Oracle event listener
pnpm --filter backend oracle:dev
```

The frontend proxies `/api` requests to the backend automatically in development mode.

### Running Tests

```bash
# Smart contract unit tests (Hardhat)
pnpm --filter contracts test

# Smart contract fuzz tests (Foundry Forge)
cd contracts && forge test

# Smart contract coverage report
pnpm --filter contracts coverage

# Backend unit + integration tests
pnpm --filter backend test

# Backend test coverage
pnpm --filter backend test:coverage

# Frontend component tests
pnpm --filter frontend test

# End-to-end tests (requires both services running)
pnpm e2e

# Load test (requires k6 installed)
k6 run infra/load-tests/api.js
```

**Coverage targets:** Smart contracts >90% line coverage · Backend >85% line coverage · E2E: full learner journey automated.

---

## Smart Contract Deployment

### Testnet (SKALE Titan Hub Testnet)

```bash
cd contracts

# Compile all contracts
npx hardhat compile

# Run pre-deployment checks
npx hardhat run scripts/preflight-check.ts --network skale-testnet

# Deploy Diamond and all facets
npx hardhat run scripts/deploy-diamond.ts --network skale-testnet

# Execute diamondCut() to register all facets
npx hardhat run scripts/cut-facets.ts --network skale-testnet

# Verify deployment
npx hardhat run scripts/verify-diamond.ts --network skale-testnet
```

### Mainnet (SKALE Titan Hub)

> ⚠️ **Mainnet deployment requires:**
> - Passing the full 23-item pre-launch checklist (see Platform Dev Guide)
> - External security audit with zero critical/high findings
> - 5/9 Core Team multisig signatures on all deployment transactions
> - 48-hour Timelock initialized before any upgrade operations begin

```bash
# Mainnet deploy — requires hardware wallet (Ledger/Trezor) signer
npx hardhat run scripts/deploy-diamond.ts --network skale-mainnet
```

### Diamond Architecture

ABYA uses the Diamond Standard (EIP-2535) for unlimited, modular upgradability via a single contract address. Storage is managed through a shared `AppStorage` struct — **never overlap storage slots across facets.**

```solidity
// All facets access storage through this pattern only
import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";

function someFunction() external {
    AppStorage storage s = LibAppStorage.diamondStorage();
    // Access s.dids, s.reputation, s.abytBalance, etc.
}
```

Upgrade operations are controlled by the **5/9 multisig + 48-hour Timelock**. No single actor — including the founding team — can unilaterally modify the protocol.

---

## API Integration

### M-Pesa (Safaricom Daraja)

ABYA uses Daraja v2 C2B (Customer to Business) with STK Push to allow learners to pay for courses directly from their M-Pesa account.

**Flow:**
1. Frontend calls `POST /api/bridge/mpesa/init` with `{ phoneNumber, courseId, amount }`
2. Backend initiates STK Push → M-Pesa sends PIN request to learner's phone
3. Learner enters PIN → Daraja sends webhook to `POST /api/bridge/mpesa/webhook`
4. Backend validates HMAC-SHA256 signature on webhook payload
5. Oracle triggers `BridgeFacet.confirmPayment()` on-chain → enrollment unlocked

**Sandbox setup:**
1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app → get Consumer Key + Consumer Secret
3. Use shortcode `174379` and passkey from Daraja sandbox
4. Expose your local webhook with `ngrok http 4000`

> All webhook handlers validate `MPESA_HMAC_SECRET` before processing. Requests without a valid signature return `401` immediately.

### Africa's Talking (Airtime)

ABYA dispatches airtime rewards to learners programmatically upon verified module completion.

**Flow:**
1. On-chain `AcademyFacet` emits `ModuleCompleted(learner, moduleId, tier)` event
2. ABYA Oracle detects event → calls `POST /api/rewards/airtime` (internal)
3. Backend validates idempotency key (prevents duplicate dispatch)
4. Bull queue job dispatches airtime via Africa's Talking SDK
5. Confirmation logged to PostgreSQL + emitted as `AirtimeDispatched` event on-chain

**Reward tiers:**

| Tier | Airtime Value | Module Criteria |
|------|--------------|-----------------|
| Bronze | ~$0.10 (~KES 13) | Introductory modules |
| Silver | ~$0.50 (~KES 65) | Intermediate modules |
| Gold | ~$1.00 (~KES 130) | Advanced/assessment modules |

**Sandbox setup:**
1. Register at [account.africastalking.com](https://account.africastalking.com)
2. Use sandbox username `sandbox` + your sandbox API key
3. Test airtime dispatch to the sandbox simulator (no real airtime is sent)

### Dr. Kwame AI Tutor (Gemini MCP)

Dr. Kwame is powered by Google Gemini 3 Pro via the Model Context Protocol. Each request injects the learner's current on-chain state as context.

**Setup:**
1. Create a GCP project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Generative Language API**
3. Create an API key → set as `GEMINI_API_KEY`
4. Configure safety settings: block financial advice (`HARM_CATEGORY_DANGEROUS_CONTENT: BLOCK_LOW_AND_ABOVE`)

**Request pattern:**

```typescript
// The backend injects on-chain context before every Dr. Kwame request
const prompt = buildSystemPrompt(learnerContext); // XP, modules, guild, balance, language
const response = await gemini.generateContentStream({ systemPrompt: prompt, userMessage });
// Stream SSE tokens to frontend
```

---

## Deployment (Coolify + SiteGround)

ABYA Nexus deploys its full application stack on **Coolify** (self-hosted, open-source PaaS) with the domain managed through **SiteGround**.

### DNS Configuration (SiteGround)

In SiteGround's DNS Zone Editor:
```
A record:    @       →  <YOUR_VPS_IP>
A record:    api     →  <YOUR_VPS_IP>
A record:    staging →  <YOUR_VPS_IP>
CNAME:       www     →  yourdomain.com
```

### Coolify Services

| Service | Type | Notes |
|---------|------|-------|
| Frontend | Static Deploy | Auto-SSL via Traefik |
| Backend API | Docker Container | Auto-deploy on `git push main` |
| PostgreSQL | Managed DB Service | Daily backup, 7-day retention |
| Redis | Managed Service | AOF persistence enabled |

### Production Deploy

```bash
# Push to main branch triggers auto-deploy via Coolify GitHub webhook
git push origin main

# Manual deploy (from Coolify dashboard)
# Navigate to your service → Deploy → Trigger manual deploy
```

All environment variables are configured in **Coolify's secret manager** — never in the repository. Staging and production environments use separate Coolify projects with isolated secrets.

---

## The $ABYT Token

`$ABYT` is the utility token powering the ABYA Nexus ecosystem. It is **not an investment vehicle** — it is the economic infrastructure of a learning protocol.

| Property | Value |
|----------|-------|
| Total Supply | 1,000,000,000 (1 billion) $ABYT |
| Token Standard | ERC-20 with linear vesting module |
| Blockchain | SKALE Titan Hub (bridgeable to Ethereum, Polygon) |
| Vesting | Linear over 4 years for team/advisor allocations |
| Distribution | Learn-to-Earn weighted — mastery, not capital |

**Allocation:**

| Category | % | Tokens | Unlock |
|----------|---|--------|--------|
| Learn-to-Earn Rewards | 35% | 350M | Over 10 years |
| Ecosystem & Grants | 20% | 200M | Milestone-gated |
| Team & Advisors | 15% | 150M | 4yr vesting, 1yr cliff |
| Community & Ambassadors | 15% | 150M | Earned via participation |
| Treasury | 10% | 100M | DAO-governed |
| LBP (Fjord Foundry) | 5% | 50M | 72-hour price discovery |

**Earn $ABYT by:**
- Completing course modules (10–500 $ABYT per module)
- Participating in guilds (50–200 $ABYT/week)
- Ambassador binary network commissions (10% of weaker leg volume)
- DAO governance participation
- Creating IP-NFT curricula (65% primary + 2% secondary royalties)

---

## Governance

ABYA Nexus is governed by the **Sovereign Council** — a multi-phase governance system that progressively decentralizes control from the founding team to the full DAO.

| Phase | Period | Structure |
|-------|--------|-----------|
| Phase 1 — Centralized | Years 1–2 | 5/9 Core Team multisig governs all protocol decisions |
| Phase 2 — Hybrid | Years 3–5 | DAO votes; Foundation Directors retain compliance veto |
| Phase 3 — Decentralized | Years 6+ | Full DAO governance; all decisions on-chain |

**Voting power** is reputation-weighted quadratic: `vote_weight = √(XP)`. This prevents capital dominance while rewarding genuine learning contribution.

**All upgrade proposals require:**
1. On-chain proposal with human-readable decoded calldata
2. >51% quorum of eligible voters
3. >60% approval threshold
4. 5/9 multisig signatures (current phase)
5. 48-hour Timelock before execution

---

## Security

ABYA Nexus takes security seriously. The protocol is designed with defense-in-depth across all layers.

### Smart Contract Security
- **External Audit:** All facets audited before mainnet deployment — report published in `/docs/security/`
- **Multisig:** 5/9 Core Team multisig (Gnosis Safe on SKALE) for all Diamond upgrades
- **Timelock:** 48-hour delay on all `diamondCut()` operations
- **Reentrancy Guards:** OpenZeppelin `ReentrancyGuard` on all token-handling facets
- **Storage Safety:** EIP-2535 `AppStorage` struct — no storage slot collisions
- **Fuzz Testing:** Foundry Forge fuzzing on all arithmetic functions

### API Security
- **M-Pesa Webhooks:** HMAC-SHA256 signature validation on every callback
- **Idempotency:** Redis-backed idempotency keys on all payment operations
- **Auth:** httpOnly + Secure + SameSite=Strict cookies for JWT storage
- **Rate Limiting:** 100 req/min globally; 10 req/min for auth endpoints
- **Input Validation:** Zod schema validation on all API endpoints
- **CORS:** Strict origin whitelist — no wildcard `*` in production

### Bug Bounty

ABYA operates a bug bounty program on **Immunefi**. Researchers who discover valid vulnerabilities are rewarded based on severity:

| Severity | Reward |
|----------|--------|
| Critical (funds at risk) | $10,000 – $100,000 |
| High | $5,000 – $10,000 |
| Medium | $1,000 – $5,000 |
| Low / Informational | $100 – $1,000 |

See [SECURITY.md](./SECURITY.md) for the full disclosure policy and scope.

### Reporting Vulnerabilities

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately via:
- **Email:** security@abya.university (PGP key available in SECURITY.md)
- **Immunefi:** [immunefi.com/bounty/abya](https://immunefi.com/bounty/abya)

We commit to acknowledging all reports within 48 hours and resolving critical issues within 7 days.

---

## Contributing

ABYA Nexus is an open-source protocol and welcomes contributions from developers, educators, designers, and community members across Africa and beyond.

### Before You Contribute

1. Read the [Platform Development Guide](./docs/ABYA_Nexus_Platform_Dev_Guide_v1.pdf) to understand architecture conventions
2. Check [open issues](https://github.com/abya-university/ABYA-Ecosystem/issues) and [active PRs](https://github.com/abya-university/ABYA-Ecosystem/pulls) to avoid duplication
3. For significant changes, open an issue first to discuss the approach

### Contribution Process

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make your changes following the conventions below
# 4. Run all tests and ensure they pass
pnpm test && pnpm --filter contracts test

# 5. Commit using Conventional Commits format
git commit -m "feat(academy): add module retry logic with backoff"

# 6. Push and open a Pull Request
git push origin feat/your-feature-name
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope):     New feature
fix(scope):      Bug fix
docs(scope):     Documentation changes
test(scope):     Adding or updating tests
refactor(scope): Code refactor without feature change
chore(scope):    Maintenance tasks
security(scope): Security improvements
```

**Scopes:** `contracts`, `frontend`, `backend`, `oracle`, `bridge`, `ai`, `governance`, `infra`, `docs`

### Code Standards

- **TypeScript:** Strict mode enabled — no `any` types without justification
- **Solidity:** NatSpec documentation on all public/external functions
- **Tests:** Every new feature must ship with corresponding tests
- **Security:** Smart contract changes require Foundry fuzz coverage before PR
- **Formatting:** Prettier (TS/JS) + `forge fmt` (Solidity) enforced via CI

### Areas We Need Help

- 🌍 **Translations:** Swahili, French, Yoruba, Amharic, Zulu UI strings
- 🔐 **ZK Circuits:** Additional Circom circuit optimization and new skill verification circuits
- 🧪 **Testing:** Expanding Playwright E2E coverage and load test scenarios
- 📚 **Documentation:** API reference, integration guides, video walkthroughs
- 🎨 **Design:** Figma component library alignment and mobile UX improvements
- 🔗 **Integrations:** Additional African mobile money APIs (MTN, Flutterwave, Airtel Money)

---

## Roadmap

### The Nexus Orbit

ABYA's development follows the **Nexus Orbit Naming Protocol** — each phase named after an Emerging Market Hub city paired with an Educational Systems Science philosopher.

| Phase | Name | Period | Focus |
|-------|------|--------|-------|
| **Phase 1** | 🟢 **Nairobi-Hase** *(Active)* | Now | Diamond Proxy, ABYA Passport, Dr. Kwame, M-Pesa Bridge, Africa's Talking, Binary Ambassador Network, $ABYT LBP |
| **Phase 2** | 🔵 Kigali-Connect | Month 13–24 | Employer ZK-Gateway, LinkedIn/Indeed Credential Bridge, Sovereign Sub-DAOs, West Africa M-Money expansion |
| **Phase 3** | 🟣 Bogota-Auto | Month 25–36 | AI Curriculum Architects, On-chain Reasoning Traces, Liquid Royalty Vaults, LatAm market entry (PIX/Boleto) |
| **Phase 4** | ⚪ Jakarta-Cyber | Month 37–48 | Omnichain State Persistence, Real-time Reputation Sync, Regenerative Treasury, SE Asia market entry |

---

## Community & Support

| Channel | Purpose | Link |
|---------|---------|------|
| 🌐 Website | Main platform | [nexus.abya.university](https://nexus.abya.university) |
| 📖 Docs | Developer documentation | [docs.abya.university](https://docs.abya.university) |
| 💬 Discord | Community hub, support | [discord.gg/abya](https://discord.gg/abya) |
| 🐦 Twitter/X | Announcements, updates | [@ABYA_Nexus](https://twitter.com/ABYA_Nexus) |
| 🐙 GitHub | Source, issues, PRs | [github.com/abya-university](https://github.com/abya-university/ABYA-Ecosystem) |
| 📧 General Email | Partnerships, press | info@abya.university |
| 🔐 Security Email | Vulnerability reports | security@abya.university |
| 👷 Careers | Join the Core Team | careers@abya.university |

---

## License

ABYA Nexus is released under the [Business Source License 1.1 (BSL 1.1)](./LICENSE.md).

Smart contracts, the SDK, and developer tooling are additionally available under the MIT License after the **Change Date** specified in `LICENSE.md`.

See [LICENSE.md](./LICENSE.md) for the full terms.

---

<div align="center">

**Built in Africa. Unstoppable everywhere.**

*© 2026 ABYA University | ABYA Nexus Foundation, Cayman Islands*

</div>
