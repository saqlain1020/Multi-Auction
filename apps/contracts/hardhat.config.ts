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
      polygonAmoy: "TTJKDGPV1AY4H52N6HECABFZ8WDUGXD5G2",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
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
    polygonAmoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts,
    },
  },
};

export default config;


