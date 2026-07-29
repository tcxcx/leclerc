export interface ApiErrorMarkers {
  unknownAction: string;
  dropPassphraseRequired: string;
  dropNotJoined: string;
  unknownCard: string;
  confirmIdRequired: string;
  rainCardDepositUnconfigured: string;
  sparkNetworkMismatch: string;
  stationKeyMissing: string;
  briefRecordsRequired: string;
  briefExportUnsupportedFormat: string;
  briefExportPayloadRequired: string;
  documentImageRequired: string;
  captureSourceRequired: string;
  qvacUpstreamUnconfigured: string;
  qvacUpstreamFailed: string;
}

export interface ApiErrorStory {
  id: string;
  markers: ApiErrorMarkers;
}

export const DEFAULT_API_ERROR_STORY: ApiErrorStory = {
  id: "stable-api-error-codes",
  markers: {
    unknownAction: "unknown action",
    dropPassphraseRequired: "drop passphrase required",
    dropNotJoined: "drop not joined",
    unknownCard: "unknown card",
    confirmIdRequired: "confirmid required",
    rainCardDepositUnconfigured: "must be configured for live rain card funding",
    sparkNetworkMismatch: "spark_network must be testnet",
    stationKeyMissing: "startqvacprovider returned no publickey",
    briefRecordsRequired: "no records",
    briefExportUnsupportedFormat: "unsupported format",
    briefExportPayloadRequired: "missing brief or records",
    documentImageRequired: "missing image",
    captureSourceRequired: "empty source",
    qvacUpstreamUnconfigured: "qvac_base_url not configured",
    qvacUpstreamFailed: "all qvac upstreams failed",
  },
};

export function apiErrorMarkers(story: ApiErrorStory = DEFAULT_API_ERROR_STORY): ApiErrorMarkers {
  return story.markers;
}
