export const CHECKSUM_POLICY =
  "A file is accepted only after its SHA-256 value is computed from the reviewed file and compared with the publisher's manifest or recorded checksum.";

export function isSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

export function sha256Matches(expected: string, actual: string): boolean {
  if (!isSha256Hex(expected) || !isSha256Hex(actual)) return false;
  return expected === actual;
}
