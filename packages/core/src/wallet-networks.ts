import {
  isWritableChain,
  listLeclercAssetsForChain,
  listLeclercChains,
  tokenAddress,
  type LeclercAssetId,
  type LeclercChainId,
  type LeclercChainKey,
  type LeclercNetworkKind,
} from "@leclerc/transfer-core";

export interface WalletTokenOption {
  id: LeclercAssetId;
  symbol: string;
  displaySymbol: string;
  name: string;
  decimals: number;
  address: string;
  iconPath: string;
  color: string;
}

export interface WalletNetworkOption {
  key: LeclercChainKey;
  chainId: LeclercChainId;
  name: string;
  shortName: string;
  network: LeclercNetworkKind;
  writable: boolean;
  writePolicy: "allowed-testnet" | "read-only";
  nativeGasToken: string;
  iconPath: string;
  brandColor: string;
  tokenCount: number;
  tokens: WalletTokenOption[];
}

export interface WalletNetworkSelectorInput {
  chainId?: LeclercChainId | number | null;
  assetId?: LeclercAssetId | null;
}

export interface WalletNetworkSelectorModel {
  networks: WalletNetworkOption[];
  selectedNetwork: WalletNetworkOption;
  selectedChainId: LeclercChainId;
  availableTokens: WalletTokenOption[];
  selectedToken: WalletTokenOption | null;
  selectedAssetId: LeclercAssetId | null;
}

export function walletNetworkOptions(): WalletNetworkOption[] {
  return listLeclercChains().map((chain) => {
    const tokens = listLeclercAssetsForChain(chain.chainId).map((asset) => {
      const address = tokenAddress(asset.id, chain.chainId);
      if (!address) {
        throw new Error(`missing ${asset.id} token address for ${chain.name}`);
      }
      return {
        id: asset.id,
        symbol: asset.symbol,
        displaySymbol: asset.displaySymbol,
        name: asset.name,
        decimals: asset.decimals,
        address,
        iconPath: asset.iconPath,
        color: asset.color,
      };
    });

    return {
      key: chain.key,
      chainId: chain.chainId,
      name: chain.name,
      shortName: chain.shortName,
      network: chain.network,
      writable: isWritableChain(chain),
      writePolicy: chain.writePolicy,
      nativeGasToken: chain.nativeGasToken,
      iconPath: chain.iconPath,
      brandColor: chain.brandColor,
      tokenCount: tokens.length,
      tokens,
    };
  });
}

export function createWalletNetworkSelector(
  input: WalletNetworkSelectorInput = {},
  networks: WalletNetworkOption[] = walletNetworkOptions(),
): WalletNetworkSelectorModel {
  if (networks.length === 0) {
    throw new Error("wallet network catalog is empty");
  }

  const selectedNetwork =
    networks.find((network) => network.chainId === input.chainId) ??
    networks.find((network) => network.writable) ??
    networks[0];
  const availableTokens = selectedNetwork.tokens;
  const selectedToken =
    availableTokens.find((token) => token.id === input.assetId) ??
    availableTokens[0] ??
    null;

  return {
    networks,
    selectedNetwork,
    selectedChainId: selectedNetwork.chainId,
    availableTokens,
    selectedToken,
    selectedAssetId: selectedToken?.id ?? null,
  };
}

export function selectWalletNetwork(
  selector: WalletNetworkSelectorModel,
  chainId: LeclercChainId | number,
): WalletNetworkSelectorModel {
  return createWalletNetworkSelector(
    {
      chainId,
      assetId: selector.selectedAssetId,
    },
    selector.networks,
  );
}

export function selectWalletToken(
  selector: WalletNetworkSelectorModel,
  assetId: LeclercAssetId,
): WalletNetworkSelectorModel {
  return createWalletNetworkSelector(
    {
      chainId: selector.selectedChainId,
      assetId,
    },
    selector.networks,
  );
}
