export type ApiClientExportFormat = "pdf" | "docx";

export interface ApiClientFallbackCopy {
  endpointStatus: string;
  documentStatus: string;
  briefExportStatus: string;
  briefExportFilename: string;
}

export interface ApiClientStory {
  id: string;
  fallbacks: ApiClientFallbackCopy;
}

export const DEFAULT_API_CLIENT_STORY: ApiClientStory = {
  id: "browser-api-client-fallbacks",
  fallbacks: {
    endpointStatus: "{url} {status}",
    documentStatus: "document {status}",
    briefExportStatus: "export {status}",
    briefExportFilename: "leclerc-brief.{format}",
  },
};

function renderApiClientTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}

export function apiClientEndpointStatusFallback(
  input: { url: string; status: number },
  story: ApiClientStory = DEFAULT_API_CLIENT_STORY,
): string {
  return renderApiClientTemplate(story.fallbacks.endpointStatus, input);
}

export function apiClientDocumentStatusFallback(
  status: number,
  story: ApiClientStory = DEFAULT_API_CLIENT_STORY,
): string {
  return renderApiClientTemplate(story.fallbacks.documentStatus, { status });
}

export function apiClientBriefExportStatusFallback(
  status: number,
  story: ApiClientStory = DEFAULT_API_CLIENT_STORY,
): string {
  return renderApiClientTemplate(story.fallbacks.briefExportStatus, { status });
}

export function apiClientBriefExportFilenameFallback(
  format: ApiClientExportFormat,
  story: ApiClientStory = DEFAULT_API_CLIENT_STORY,
): string {
  return renderApiClientTemplate(story.fallbacks.briefExportFilename, { format });
}
