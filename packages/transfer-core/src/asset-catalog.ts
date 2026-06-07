export type HexAddress = `0x${string}`;

export type LeclercChainId = 5042002 | 42161;
export type LeclercChainKey = "arc-testnet" | "arbitrum-one";
export type LeclercNetworkKind = "testnet" | "mainnet-readonly";

export interface ChainCatalogEntry {
  key: LeclercChainKey;
  chainId: LeclercChainId;
  name: string;
  shortName: string;
  network: LeclercNetworkKind;
  role: "hub" | "spoke-readonly";
  rpcUrls: readonly string[];
  rpcEnv?: string;
  explorerBaseUrl: string;
  explorerTxPath: "tx";
  explorerAddressPath: "address";
  nativeGasToken: string;
  iconPath: string;
  brandColor: string;
  writePolicy: "allowed-testnet" | "read-only";
}

export type AssetKind = "evm-token" | "spark-native" | "spark-token" | "catalog-only";

export interface AssetCatalogEntry {
  id: LeclercAssetId;
  symbol: string;
  displaySymbol: string;
  name: string;
  decimals: number;
  kind: AssetKind;
  iconPath: string;
  color: string;
  balancePriority: number;
  transferPolicy: "testnet-only" | "read-only" | "spark-testnet" | "unconfigured";
  addresses: Partial<Record<LeclercChainId, HexAddress>>;
  liquidityHomeChainId?: LeclercChainId;
  strategy?: "CCTP" | "Hyperlane" | "Spark" | "TetherNative" | "Manual";
  source: string;
  note?: string;
}

export type LeclercAssetId =
  | "usdt"
  | "btc"
  | "xaut"
  | "usdc"
  | "eurc"
  | "mxnb"
  | "qcad"
  | "audf"
  | "jpyc"
  | "cirbtc";

export const ARC_TESTNET_CHAIN_ID = 5042002 satisfies LeclercChainId;
export const ARBITRUM_ONE_CHAIN_ID = 42161 satisfies LeclercChainId;

export const LECLERC_CHAINS = {
  "arc-testnet": {
    key: "arc-testnet",
    chainId: ARC_TESTNET_CHAIN_ID,
    name: "Arc Testnet",
    shortName: "Arc",
    network: "testnet",
    role: "hub",
    rpcUrls: ["https://rpc.drpc.testnet.arc.network", "https://rpc.testnet.arc.network"],
    rpcEnv: "ARC_TESTNET_RPC_URL",
    explorerBaseUrl: "https://explorer.testnet.arc.network",
    explorerTxPath: "tx",
    explorerAddressPath: "address",
    nativeGasToken: "USDC",
    iconPath: "/networks/arc.svg",
    brandColor: "#3a1b78",
    writePolicy: "allowed-testnet",
  },
  "arbitrum-one": {
    key: "arbitrum-one",
    chainId: ARBITRUM_ONE_CHAIN_ID,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    network: "mainnet-readonly",
    role: "spoke-readonly",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-one-rpc.publicnode.com",
      "https://arbitrum.drpc.org",
    ],
    rpcEnv: "ARBITRUM_RPC_URL",
    explorerBaseUrl: "https://arbiscan.io",
    explorerTxPath: "tx",
    explorerAddressPath: "address",
    nativeGasToken: "ETH",
    iconPath: "/networks/arbitrum.svg",
    brandColor: "#2d374b",
    writePolicy: "read-only",
  },
} as const satisfies Record<LeclercChainKey, ChainCatalogEntry>;

export const LECLERC_ASSETS = {
  usdt: {
    id: "usdt",
    symbol: "USDT",
    displaySymbol: "USD₮",
    name: "Tether USD",
    decimals: 6,
    kind: "spark-token",
    iconPath: "/assets/stable-tokens/usdt_token_icon.svg",
    color: "#26a17b",
    balancePriority: 10,
    transferPolicy: "spark-testnet",
    addresses: {},
    strategy: "TetherNative",
    source: "@tetherto/wdk Spark token rail; no Arc contract in defi-web-app registry",
    note: "Resolved through Spark/WDK token metadata when the wallet runtime exposes token balances.",
  },
  btc: {
    id: "btc",
    symbol: "BTC",
    displaySymbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
    kind: "spark-native",
    iconPath: "/assets/stable-tokens/btc_token_icon.svg",
    color: "#f7931a",
    balancePriority: 20,
    transferPolicy: "spark-testnet",
    addresses: {},
    strategy: "Spark",
    source: "@tetherto/wdk-wallet-spark TESTNET sats balance",
  },
  xaut: {
    id: "xaut",
    symbol: "XAUT",
    displaySymbol: "XAU₮",
    name: "Tether Gold",
    decimals: 6,
    kind: "spark-token",
    iconPath: "/assets/stable-tokens/xaut_token_icon.svg",
    color: "#d6ad49",
    balancePriority: 30,
    transferPolicy: "spark-testnet",
    addresses: {},
    strategy: "TetherNative",
    source: "@tetherto/wdk Spark token rail; no Arc contract in defi-web-app registry",
    note: "Catalog-ready until the installed WDK runtime exposes XAU₮ token identifiers.",
  },
  usdc: {
    id: "usdc",
    symbol: "USDC",
    displaySymbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/usdc_token_icon.svg",
    color: "#2775ca",
    balancePriority: 40,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "CCTP",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0x3600000000000000000000000000000000000000",
      [ARBITRUM_ONE_CHAIN_ID]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    },
    source: "../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json",
  },
  eurc: {
    id: "eurc",
    symbol: "EURC",
    displaySymbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/eurc_token_icon.svg",
    color: "#6b5bff",
    balancePriority: 50,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "CCTP",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    },
    source: "../defi-web-app/apps/hyper-mcp/src/registry/contracts.json",
  },
  mxnb: {
    id: "mxnb",
    symbol: "MXNB",
    displaySymbol: "MXNB",
    name: "Mexican Peso Stablecoin",
    decimals: 6,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/mxnb_token_icon.svg",
    color: "#7ac878",
    balancePriority: 60,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "Hyperlane",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0x836F73Fbc370A9329Ba4957E47912DfDBA6BA461",
      [ARBITRUM_ONE_CHAIN_ID]: "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA",
    },
    source: "../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json",
  },
  qcad: {
    id: "qcad",
    symbol: "QCAD",
    displaySymbol: "QCAD",
    name: "Canadian Dollar Stablecoin",
    decimals: 6,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/qcad_token_icon.png",
    color: "#e53935",
    balancePriority: 70,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "Hyperlane",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0x23d7CFFd0876f3ABb6B074287ba2aeefBc83825d",
    },
    source: "../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json",
  },
  audf: {
    id: "audf",
    symbol: "AUDF",
    displaySymbol: "AUDF",
    name: "Australian Dollar Stablecoin",
    decimals: 6,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/audf_token_icon.svg",
    color: "#2ca66f",
    balancePriority: 80,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "Hyperlane",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0xd2a530170D71a9Cfe1651Fb468E2B98F7Ed7456b",
    },
    source: "../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json",
  },
  jpyc: {
    id: "jpyc",
    symbol: "JPYC",
    displaySymbol: "JPYC",
    name: "JPY Coin",
    decimals: 18,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/jpyc_token_icon.png",
    color: "#ff5fb0",
    balancePriority: 90,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "Hyperlane",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29",
    },
    source: "../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json",
  },
  cirbtc: {
    id: "cirbtc",
    symbol: "cirBTC",
    displaySymbol: "cirBTC",
    name: "Circle Bitcoin",
    decimals: 8,
    kind: "evm-token",
    iconPath: "/assets/stable-tokens/cirbtc_token_icon.svg",
    color: "#f0b90b",
    balancePriority: 100,
    transferPolicy: "testnet-only",
    liquidityHomeChainId: ARC_TESTNET_CHAIN_ID,
    strategy: "Hyperlane",
    addresses: {
      [ARC_TESTNET_CHAIN_ID]: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
    },
    source: "../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json",
    note: "defi-web-app marks decimals as TODO-VERIFY; catalog keeps BTC-convention 8 decimals.",
  },
} as const satisfies Record<LeclercAssetId, AssetCatalogEntry>;

export const LECLERC_ASSET_IDS = Object.keys(LECLERC_ASSETS) as LeclercAssetId[];
export const LECLERC_CHAIN_KEYS = Object.keys(LECLERC_CHAINS) as LeclercChainKey[];

export function listLeclercAssets(): AssetCatalogEntry[] {
  return LECLERC_ASSET_IDS.map((id) => LECLERC_ASSETS[id]).sort(
    (a, b) => a.balancePriority - b.balancePriority,
  );
}

export function listLeclercChains(): ChainCatalogEntry[] {
  return LECLERC_CHAIN_KEYS.map((key) => LECLERC_CHAINS[key]);
}

export function getLeclercAsset(id: LeclercAssetId): AssetCatalogEntry {
  return LECLERC_ASSETS[id];
}

export function getLeclercChain(key: LeclercChainKey): ChainCatalogEntry {
  return LECLERC_CHAINS[key];
}

export function chainById(chainId: number): ChainCatalogEntry | null {
  return listLeclercChains().find((chain) => chain.chainId === chainId) ?? null;
}

export function tokenAddress(
  assetId: LeclercAssetId,
  chainId: LeclercChainId,
): HexAddress | null {
  const addresses = LECLERC_ASSETS[assetId].addresses as Partial<Record<LeclercChainId, HexAddress>>;
  return addresses[chainId] ?? null;
}

export function rpcUrlForChain(
  chain: ChainCatalogEntry,
  env: Partial<Record<string, string | undefined>> = {},
): string {
  const fromEnv = chain.rpcEnv ? env[chain.rpcEnv]?.trim() : undefined;
  return fromEnv || chain.rpcUrls[0];
}

export function isWritableChain(chain: ChainCatalogEntry): boolean {
  return chain.writePolicy === "allowed-testnet" && chain.network === "testnet";
}

export function assertWritableTestnetChain(chainId: LeclercChainId): ChainCatalogEntry {
  const chain = chainById(chainId);
  if (!chain) throw new Error(`unsupported chainId ${chainId}`);
  if (!isWritableChain(chain)) {
    throw new Error(`${chain.name} is read-only for LeClerc transfers; choose an allowed testnet`);
  }
  return chain;
}
