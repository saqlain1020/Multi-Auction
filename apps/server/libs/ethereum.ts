import { createPublicClient, createWalletClient, http } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import { MNEMONIC, RPC } from "../constants";

export const publicClient = createPublicClient({
  transport: http(RPC),
  chain: polygonAmoy,
});

export const walletClient = createWalletClient({
  account: mnemonicToAccount(MNEMONIC),
  transport: http(RPC),
  chain: polygonAmoy,
});
