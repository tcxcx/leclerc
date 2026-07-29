export interface NetworkTokenErrorCopy {
  unsupportedChainId: string;
  chainReadOnlyForTransfers: string;
  chainReadOnlyForWallet: string;
  assetNotConfiguredOnChain: string;
  missingTokenAddress: string;
  evmWritableChainRequired: string;
  emptyWalletNetworkCatalog: string;
  assetNotEnabledForEvmTestnet: string;
}

export interface NetworkTokenErrorMarkers {
  unsupportedChainId: string;
  chainReadOnlyForTransfers: string;
  chainReadOnlyForWallet: string;
  assetNotConfiguredOnChain: string;
  assetNotEnabledForEvmTestnet: string;
  evmWritableChainRequired: string;
}

export interface NetworkTokenStory {
  id: string;
  errors: NetworkTokenErrorCopy;
  markers: NetworkTokenErrorMarkers;
}

export const DEFAULT_NETWORK_TOKEN_STORY: NetworkTokenStory = {
  id: "network-token-selector",
  errors: {
    unsupportedChainId: "unsupported chainId {chainId}",
    chainReadOnlyForTransfers: "{chainName} is read-only for LeClerc transfers; choose an allowed testnet",
    chainReadOnlyForWallet: "{chainName} is read-only in LeClerc; writes are testnet-only",
    assetNotConfiguredOnChain: "{assetSymbol} is not configured on {chainName}",
    missingTokenAddress: "missing {assetId} token address for {chainName}",
    evmWritableChainRequired: "EVM_CHAIN_ID must be Arc Testnet (5042002) for writable wallet flows",
    emptyWalletNetworkCatalog: "wallet network catalog is empty",
    assetNotEnabledForEvmTestnet: "{assetSymbol} is not enabled for EVM testnet transfers",
  },
  markers: {
    unsupportedChainId: "unsupported chainid",
    chainReadOnlyForTransfers: "is read-only for leclerc transfers",
    chainReadOnlyForWallet: "is read-only in leclerc",
    assetNotConfiguredOnChain: "is not configured on",
    assetNotEnabledForEvmTestnet: "is not enabled for evm testnet transfers",
    evmWritableChainRequired: "evm_chain_id must be arc testnet",
  },
};

export function unsupportedChainIdMessage(
  chainId: string | number,
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return renderNetworkTokenTemplate(story.errors.unsupportedChainId, { chainId });
}

export function chainReadOnlyForTransfersMessage(
  chainName: string,
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return renderNetworkTokenTemplate(story.errors.chainReadOnlyForTransfers, { chainName });
}

export function chainReadOnlyForWalletMessage(
  chainName: string,
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return renderNetworkTokenTemplate(story.errors.chainReadOnlyForWallet, { chainName });
}

export function assetNotConfiguredOnChainMessage(
  assetSymbol: string,
  chainName: string,
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return renderNetworkTokenTemplate(story.errors.assetNotConfiguredOnChain, {
    assetSymbol,
    chainName,
  });
}

export function missingTokenAddressMessage(
  assetId: string,
  chainName: string,
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return renderNetworkTokenTemplate(story.errors.missingTokenAddress, {
    assetId,
    chainName,
  });
}

export function evmWritableChainRequiredMessage(
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return story.errors.evmWritableChainRequired;
}

export function emptyWalletNetworkCatalogMessage(
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return story.errors.emptyWalletNetworkCatalog;
}

export function assetNotEnabledForEvmTestnetMessage(
  assetSymbol: string,
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): string {
  return renderNetworkTokenTemplate(story.errors.assetNotEnabledForEvmTestnet, { assetSymbol });
}

export function networkTokenErrorMarkers(
  story: NetworkTokenStory = DEFAULT_NETWORK_TOKEN_STORY,
): NetworkTokenErrorMarkers {
  return story.markers;
}

function renderNetworkTokenTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
