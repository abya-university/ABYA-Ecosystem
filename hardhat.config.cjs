require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
require("hardhat-contract-sizer");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':ERC20$'],
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    viaIR: true,
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    skale: {
      url: process.env.VITE_APP_RPC_URL,
      accounts: [process.env.VITE_APP_PRIVATE_KEY],
      chainId: 1020352220,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./src/artifacts",
  },
  etherscan: {
    apiKey: {
      // Is not required by blockscout. Can be any non-empty string
      'skale': "abc"
    },
    customChains: [
      {
        network: "skale",
        chainId: 1020352220,
        urls: {
          apiURL: process.env.VITE_APP_BROCK_EXPLORER,
          browserURL: process.env.VITE_APP_RPC_URL,
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }

};