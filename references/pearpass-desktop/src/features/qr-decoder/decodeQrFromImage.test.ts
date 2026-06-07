import { decodeQrFromImage } from './decodeQrFromImage'

const MIGRATION_URI = 'otpauth-migration://offline?data=abc123'
const TOTP_URI = 'otpauth://totp/Google:user@gmail.com?secret=BASE32SECRET&issuer=Google'

const mockDetect = jest.fn<() => Promise<Array<Pick<DetectedBarcode, 'rawValue'>>>>()
const mockBitmap = {} as ImageBitmap

beforeEach(() => {
  ;(globalThis as any).BarcodeDetector = jest.fn().mockImplementation(() => ({
    detect: mockDetect
  }))
  ;(globalThis as any).createImageBitmap = jest
    .fn<() => Promise<ImageBitmap>>()
    .mockResolvedValue(mockBitmap)
})

afterEach(() => {
  delete (globalThis as any).BarcodeDetector
  delete (globalThis as any).createImageBitmap
  jest.clearAllMocks()
})

describe('decodeQrFromImage', () => {
  describe('happy path', () => {
    it('returns the raw QR value from a migration URI', async () => {
      mockDetect.mockResolvedValue([{ rawValue: MIGRATION_URI }])

      expect(await decodeQrFromImage(new Blob())).toBe(MIGRATION_URI)
    })

    it('returns the raw QR value from a standard otpauth URI', async () => {
      mockDetect.mockResolvedValue([{ rawValue: TOTP_URI }])

      expect(await decodeQrFromImage(new Blob())).toBe(TOTP_URI)
    })

    it('returns only the first result when multiple QR codes are detected', async () => {
      mockDetect.mockResolvedValue([{ rawValue: MIGRATION_URI }, { rawValue: TOTP_URI }])

      expect(await decodeQrFromImage(new Blob())).toBe(MIGRATION_URI)
    })

    it('passes the image bitmap to detector.detect', async () => {
      mockDetect.mockResolvedValue([{ rawValue: MIGRATION_URI }])

      await decodeQrFromImage(new Blob())

      expect(mockDetect).toHaveBeenCalledWith(mockBitmap)
    })

    it('initialises BarcodeDetector with qr_code format', async () => {
      mockDetect.mockResolvedValue([{ rawValue: MIGRATION_URI }])

      await decodeQrFromImage(new Blob())

      expect((globalThis as any).BarcodeDetector).toHaveBeenCalledWith({
        formats: ['qr_code']
      })
    })

    it('accepts a File as well as a Blob', async () => {
      mockDetect.mockResolvedValue([{ rawValue: MIGRATION_URI }])

      expect(
        await decodeQrFromImage(new File([''], 'qr.png', { type: 'image/png' }))
      ).toBe(MIGRATION_URI)
    })
  })

  describe('error handling', () => {
    it('throws when BarcodeDetector is not available', async () => {
      delete (globalThis as any).BarcodeDetector

      await expect(decodeQrFromImage(new Blob())).rejects.toThrow(
        'QR decoding not supported in this environment'
      )
    })

    it('throws when no QR code is found in the image', async () => {
      mockDetect.mockResolvedValue([])

      await expect(decodeQrFromImage(new Blob())).rejects.toThrow(
        'No QR code detected in image'
      )
    })
  })
})
