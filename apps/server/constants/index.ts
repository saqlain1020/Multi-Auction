export const MONGO_STRING = process.env.MONGO_STRING as string;
export const PORT = process.env.PORT || 8000;
export const RPC = "https://polygon-amoy.g.alchemy.com/v2/On3m1BH9tQieZuJqsmoc7vrh03FPXzRF";
export const MultiAuctionAddress = "0xea7a6B8577719913105fE1bDe03dF1E7b2178C74";
export const MNEMONIC = process.env.MNEMONIC as string;
export const AuctionContractCreationBlock = 12247929;
if (!MONGO_STRING || !MNEMONIC) throw new Error("Env incomplete!");
