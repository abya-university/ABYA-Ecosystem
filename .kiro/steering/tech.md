# Technology Stack & Build System

## Frontend Stack
- **Framework**: React 18 with Vite build system
- **Styling**: Tailwind CSS with dark mode support
- **Routing**: React Router DOM
- **State Management**: React Context API with multiple providers
- **UI Components**: Lucide React icons, React Icons, custom components
- **Charts**: Recharts, React Minimal Pie Chart

## Web3 Integration
- **Wallet Connection**: RainbowKit + Wagmi v2
- **Blockchain Interaction**: Ethers.js v6, Viem
- **Identity**: DID (Decentralized Identity) with ethr-did, did-jwt
- **Authentication**: SIWE (Sign-In with Ethereum)
- **IPFS**: Pinata for decentralized storage

## Smart Contracts
- **Framework**: Hardhat with TypeScript support
- **Solidity Version**: 0.8.27
- **Libraries**: OpenZeppelin contracts, Uniswap V3 periphery
- **Testing**: Chai, Mocha, Hardhat network helpers
- **Deployment**: Hardhat Ignition, custom deployment scripts

## Development Tools
- **Linting**: ESLint with React plugins
- **Testing**: Jest for unit tests
- **Package Manager**: npm
- **Environment**: Node.js 18+

## Build Commands
```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Smart Contracts
npx hardhat compile  # Compile contracts
npx hardhat test     # Run contract tests
npx hardhat node     # Start local blockchain

# Docker Development
make dev-up          # Start development environment
make dev-down        # Stop development environment
make dev-logs        # View logs
make test            # Run tests in container
```

## Network Configuration
- **Local**: Hardhat network (chainId: 31337)
- **Production**: SKALE network (chainId: 1020352220)
- **Artifacts**: Generated in `src/artifacts` for frontend integration