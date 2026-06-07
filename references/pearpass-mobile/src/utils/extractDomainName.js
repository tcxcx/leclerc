import { addHttps } from './addHttps'

/**
 * @param {string | undefined} url - The website URL.
 * @returns {string|null} The main domain name, or null if invalid.
 */
export function extractDomainName(url) {
  if (!url) return null

  let hostname
  try {
    hostname = new URL(addHttps(url)).hostname
  } catch {
    return null
  }
  // Remove www. prefix if present
  hostname = hostname.replace(/^www\./, '')
  const parts = hostname.split('.')
  if (parts.length < 2) return null
  // For domains like google.co.uk, take the second-to-last part
  return parts.length > 2 ? parts[parts.length - 2] : parts[0]
}
