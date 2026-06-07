export async function decodeQrFromImage(file: File | Blob): Promise<string> {
  if (typeof BarcodeDetector === 'undefined') {
    throw new Error('QR decoding not supported in this environment')
  }

  const detector = new BarcodeDetector({ formats: ['qr_code'] })
  const bitmap = await createImageBitmap(file)
  const results = await detector.detect(bitmap)

  if (!results.length) {
    throw new Error('No QR code detected in image')
  }

  return results[0].rawValue
}
