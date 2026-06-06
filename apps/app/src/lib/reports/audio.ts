/**
 * Audio helpers for the report pipeline.
 *
 * The device sends WAV (verification-grade capture). We parse the header to
 * derive duration and to cap recordings at MAX_AUDIO_MS — keeping transcription
 * fast and predictable. Other containers (webm/opus) pass through unchanged
 * (we can't safely byte-truncate them), so the client should cap those itself.
 */

/** Hard cap on the audio we transcribe — keeps each turn fast and speedy. */
export const MAX_AUDIO_MS = 60_000;

interface WavInfo {
  byteRate: number; // bytes per second of audio
  dataOffset: number; // offset of the `data` chunk header
  dataSize: number; // bytes of PCM payload
}

function parseWav(buf: Buffer): WavInfo | null {
  if (buf.length < 44) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buf.toString("ascii", 8, 12) !== "WAVE") return null;

  let offset = 12;
  let byteRate = 0;
  let dataOffset = -1;
  let dataSize = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt " && offset + 8 + 16 <= buf.length) {
      byteRate = buf.readUInt32LE(offset + 8 + 8); // byteRate lives at fmt+8
    } else if (id === "data") {
      dataOffset = offset;
      dataSize = size;
      break; // `data` is the payload; stop here
    }
    offset += 8 + size + (size % 2); // chunks are word-aligned
  }
  if (byteRate <= 0 || dataOffset < 0 || dataSize <= 0) return null;
  return { byteRate, dataOffset, dataSize };
}

/** Best-effort recording duration in ms from a WAV buffer (null otherwise). */
export function wavDurationMs(buf: Buffer): number | null {
  const info = parseWav(buf);
  if (!info) return null;
  return Math.round((info.dataSize / info.byteRate) * 1000);
}

/**
 * Truncate a WAV to at most `maxMs` of audio, rebuilding the RIFF/data sizes so
 * the result is a valid WAV. If the buffer is short enough, not a WAV, or
 * unparseable, it is returned unchanged.
 */
export function clampWavToMs(buf: Buffer, maxMs: number = MAX_AUDIO_MS): Buffer {
  const info = parseWav(buf);
  if (!info) return buf;

  const durationMs = (info.dataSize / info.byteRate) * 1000;
  if (durationMs <= maxMs) return buf;

  let maxBytes = Math.floor((info.byteRate * maxMs) / 1000);
  maxBytes -= maxBytes % 2; // keep 16-bit sample (block) alignment
  const newDataSize = Math.min(info.dataSize, maxBytes);

  const head = Buffer.from(buf.subarray(0, info.dataOffset + 8)); // up to data header
  const pcm = buf.subarray(info.dataOffset + 8, info.dataOffset + 8 + newDataSize);
  const out = Buffer.concat([head, pcm]);

  out.writeUInt32LE(out.length - 8, 4); // RIFF chunk size
  out.writeUInt32LE(newDataSize, info.dataOffset + 4); // data chunk size
  return out;
}
