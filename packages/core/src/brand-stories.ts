export interface BrandAppMetadata {
  productName: string;
  layoutTitle: string;
  layoutDescription: string;
  manifestName: string;
  manifestShortName: string;
  manifestDescription: string;
  appleTitle: string;
  themeColor: string;
}

export interface BrandReportMetadata {
  author: string;
  eyebrowProduct: string;
}

export interface BrandStory {
  id: string;
  app: BrandAppMetadata;
  reports: BrandReportMetadata;
}

export const DEFAULT_BRAND_STORY: BrandStory = {
  id: "leclerc-field-intelligence-brand",
  app: {
    productName: "LeClerc",
    layoutTitle: "LeClerc - Field Intelligence Station",
    layoutDescription:
      "Local-first field intelligence: capture, recall, analyze, pay and dead-drop - nothing leaves a server you don't control. Powered by QVAC.",
    manifestName: "LeClerc - Field Intelligence",
    manifestShortName: "LeClerc",
    manifestDescription:
      "Local-first field intelligence on QVAC: capture, recall, analyze, pay and dead-drop - offline.",
    appleTitle: "LeClerc",
    themeColor: "#0a0e14",
  },
  reports: {
    author: "LeClerc",
    eyebrowProduct: "LeClerc",
  },
};

export function brandAppMetadata(story: BrandStory = DEFAULT_BRAND_STORY): BrandAppMetadata {
  return story.app;
}

export function brandReportMetadata(story: BrandStory = DEFAULT_BRAND_STORY): BrandReportMetadata {
  return story.reports;
}
