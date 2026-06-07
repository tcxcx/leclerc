import { chainById, type ChainCatalogEntry, type LeclercChainId } from "@leclerc/transfer-core";

export function txUrl(chainOrId: ChainCatalogEntry | LeclercChainId, hash: string): string {
  const chain = resolveChain(chainOrId);
  return `${chain.explorerBaseUrl}/${chain.explorerTxPath}/${hash}`;
}

export function addressUrl(chainOrId: ChainCatalogEntry | LeclercChainId, address: string): string {
  const chain = resolveChain(chainOrId);
  return `${chain.explorerBaseUrl}/${chain.explorerAddressPath}/${address}`;
}

export function explorerTxUrl(chainOrId: ChainCatalogEntry | LeclercChainId, hash: string): string {
  return txUrl(chainOrId, hash);
}

export function explorerAddressUrl(chainOrId: ChainCatalogEntry | LeclercChainId, address: string): string {
  return addressUrl(chainOrId, address);
}

function resolveChain(chainOrId: ChainCatalogEntry | LeclercChainId): ChainCatalogEntry {
  if (typeof chainOrId !== "number") return chainOrId;
  const chain = chainById(chainOrId);
  if (!chain) throw new Error(`unsupported chainId ${chainOrId}`);
  return chain;
}
