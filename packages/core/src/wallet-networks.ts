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
