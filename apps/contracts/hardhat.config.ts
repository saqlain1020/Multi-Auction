import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";

const mnemonic: string | undefined = process.env.MNEMONIC;
const accounts = { mnemonic };

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      polygonAmoy: "",
    },
  },
  sourcify: {
    enabled: false,
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
    },
    polygonMumbai: {
      url: "https://rpc-amoy.polygon.technology",
      accounts,
    },
  },
};

export default config;

