const TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

/**
 * Compute crc32 as used by Telegram TL (little-endian polynomial 0xEDB88320).
 * Returns an unsigned 32-bit number.
 */
export function crc32(input: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    const b = input.charCodeAt(i) & 0xff;
    const t = TABLE[(crc ^ b) & 0xff]!;
    crc = t ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function toHex8(n: number): string {
  return n.toString(16).padStart(8, "0");
}
