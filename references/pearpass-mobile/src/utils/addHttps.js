export const addHttps = (url) => {
  const lowerCaseUrl = url.toLowerCase()

  return lowerCaseUrl.startsWith('http://') ||
    lowerCaseUrl.startsWith('https://')
    ? lowerCaseUrl
    : `https://${lowerCaseUrl}`
}
