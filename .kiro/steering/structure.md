# Project Structure & Organization

## Root Level
- **Configuration Files**: `package.json`, `vite.config.js`, `hardhat.config.cjs`, `tailwind.config.js`
- **Docker**: `Dockerfile`, `Dockerfile.dev`, `docker-compose.dev.yml`, `Makefile`
- **Environment**: `.env.example` for environment variables template

## Smart Contracts (`/contracts`)
- **Main Contracts**: `LMS Token.sol`, `Treasury.sol`, `Vesting.sol`, `LiquidityContract.sol`
- **Specialized Folders**:
  - `Community Contracts/` - Community governance and features
  - `DiamondProxy/` - Diamond pattern proxy contracts
  - `Ecosystem Contracts/` - Core ecosystem functionality
  - `EthereumDIDRegistry/` - DID registry implementation

## Frontend Application (`/src`)
- **Entry Points**: `main.jsx` (app bootstrap), `App.jsx` (routing)
- **Pages**: Route components in `/pages`
- **Components**: Reusable UI components in `/components`
- **Contexts**: React Context providers for state management
- **Services**: API and blockchain interaction logic
- **Assets**: Static assets and images
- **Config**: Configuration files and constants
- **Artifacts**: Generated contract ABIs from Hardhat

## Development & Deployment
- **Scripts** (`/scripts`): Hardhat deployment scripts for each contract
- **Test** (`/test`): Contract and application tests
- **Ignition** (`/ignition`): Hardhat Ignition deployment modules
- **Public** (`/public`): Static assets served by Vite

## Key Patterns
- **Context Providers**: Extensive use of React Context for state management
- **Contract Deployment**: Individual deployment scripts per contract type
- **Modular Architecture**: Separation of concerns between contracts, frontend, and services
- **Environment Configuration**: Docker-based development with environment variable management

## File Naming Conventions
- **Contracts**: PascalCase with descriptive names
- **React Components**: PascalCase for component files
- **Scripts**: camelCase with descriptive suffixes (e.g., `Deploy.js`)
- **Tests**: Match source file names with `.test.js` or `.test.ts` suffix