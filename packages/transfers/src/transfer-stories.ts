export interface TransferErrorCopy {
  walletSeedRequired: string;
  unknownMission: string;
  confirmIdRequired: string;
  confirmationNotMissionFunding: string;
  confirmationNotRainCardFunding: string;
  transferConfirmationNotFound: string;
  transferConfirmationExpired: string;
  transferConfirmationIntegrityFailed: string;
  missionFundingTargetUnconfigured: string;
}

export interface TransferErrorMarkers {
  walletSeedRequired: string;
  unknownMission: string;
  confirmIdRequired: string;
  confirmationNotMissionFunding: string;
  confirmationNotRainCardFunding: string;
  transferConfirmationNotFound: string;
  transferConfirmationExpired: string;
  transferConfirmationIntegrityFailed: string;
}

export interface TransferStory {
  id: string;
  errors: TransferErrorCopy;
  markers: TransferErrorMarkers;
}

export const DEFAULT_TRANSFER_STORY: TransferStory = {
  id: "confirmed-wallet-transfer",
  errors: {
    walletSeedRequired: "wallet seed required",
    unknownMission: "unknown mission",
    confirmIdRequired: "confirmId required",
    confirmationNotMissionFunding: "confirmation is not for mission funding",
    confirmationNotRainCardFunding: "confirmation is not for rain card funding",
    transferConfirmationNotFound: "transfer confirmation not found or already used",
    transferConfirmationExpired: "transfer confirmation expired",
    transferConfirmationIntegrityFailed: "transfer confirmation failed integrity check",
    missionFundingTargetUnconfigured: "{envVar} is not configured",
  },
  markers: {
    walletSeedRequired: "wallet seed required",
    unknownMission: "unknown mission",
    confirmIdRequired: "confirmid required",
    confirmationNotMissionFunding: "confirmation is not for mission funding",
    confirmationNotRainCardFunding: "confirmation is not for rain card funding",
    transferConfirmationNotFound: "transfer confirmation not found or already used",
    transferConfirmationExpired: "transfer confirmation expired",
    transferConfirmationIntegrityFailed: "transfer confirmation failed integrity check",
  },
};

export function walletSeedRequiredMessage(story: TransferStory = DEFAULT_TRANSFER_STORY): string {
  return story.errors.walletSeedRequired;
}

export function unknownMissionMessage(story: TransferStory = DEFAULT_TRANSFER_STORY): string {
  return story.errors.unknownMission;
}

export function confirmIdRequiredMessage(story: TransferStory = DEFAULT_TRANSFER_STORY): string {
  return story.errors.confirmIdRequired;
}

export function confirmationNotMissionFundingMessage(
  story: TransferStory = DEFAULT_TRANSFER_STORY,
): string {
  return story.errors.confirmationNotMissionFunding;
}

export function transferConfirmationNotFoundMessage(
  story: TransferStory = DEFAULT_TRANSFER_STORY,
): string {
  return story.errors.transferConfirmationNotFound;
}

export function transferConfirmationExpiredMessage(
  story: TransferStory = DEFAULT_TRANSFER_STORY,
): string {
  return story.errors.transferConfirmationExpired;
}

export function transferConfirmationIntegrityFailedMessage(
  story: TransferStory = DEFAULT_TRANSFER_STORY,
): string {
  return story.errors.transferConfirmationIntegrityFailed;
}

export function missionFundingTargetUnconfiguredReason(
  envVar: string,
  story: TransferStory = DEFAULT_TRANSFER_STORY,
): string {
  return renderTransferTemplate(story.errors.missionFundingTargetUnconfigured, { envVar });
}

export function transferErrorMarkers(
  story: TransferStory = DEFAULT_TRANSFER_STORY,
): TransferErrorMarkers {
  return story.markers;
}

function renderTransferTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
