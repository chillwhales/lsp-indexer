import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a raw uint256 token supply into human-readable amount using pure BigInt arithmetic. */
export function formatTokenAmount(rawSupply: string, decimals: number): string {
  try {
    const raw = BigInt(rawSupply);
    const divisor = 10n ** BigInt(decimals);

    if (raw === 0n) return '0';

    // amount < 0.0001 ⟺ raw * 10_000 < divisor
    if (raw * 10_000n < divisor) return '<0.0001';

    // amount < 1 ⟺ raw < divisor → show 4 decimal places
    if (raw < divisor) return bigintFixed(raw, divisor, 4);

    // amount < 1_000 ⟺ raw < 1_000 * divisor → show 2 decimal places
    if (raw < 1_000n * divisor) return bigintFixed(raw, divisor, 2);

    // Compact: compute whole units then format with K/M/B/T suffix
    return bigintCompact(raw / divisor);
  } catch {
    return rawSupply;
  }
}

/** BigInt fixed-point to decimal string, rounded half-up. */
function bigintFixed(raw: bigint, divisor: bigint, fractionDigits: number): string {
  const scale = 10n ** BigInt(fractionDigits);
  // Multiply first, then divide with rounding to get scaled integer
  const scaled = (raw * scale + divisor / 2n) / divisor;
  const intPart = scaled / scale;
  const fracPart = scaled % scale;
  const fracStr = fracPart.toString().padStart(fractionDigits, '0').replace(/0+$/, '');
  return fracStr ? `${intPart}.${fracStr}` : intPart.toString();
}

/** Compact format with K/M/B/T suffix using BigInt arithmetic. */
function bigintCompact(wholeUnits: bigint): string {
  const tiers: Array<[bigint, string]> = [
    [1_000_000_000_000n, 'T'],
    [1_000_000_000n, 'B'],
    [1_000_000n, 'M'],
    [1_000n, 'K'],
  ];

  for (const [threshold, suffix] of tiers) {
    if (wholeUnits >= threshold) {
      // Scale by 10 to get one decimal digit, with rounding
      const scaled = (wholeUnits * 10n + threshold / 2n) / threshold;
      const intPart = scaled / 10n;
      const fracPart = scaled % 10n;
      return fracPart === 0n ? `${intPart}${suffix}` : `${intPart}.${fracPart}${suffix}`;
    }
  }

  return wholeUnits.toString();
}

/** Format an ISO timestamp to a locale-aware date+time string. */
export function formatTimestamp(timestamp: string | number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

/** Format an ISO timestamp to a relative time string (e.g. "2 days ago") */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) return timestamp;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/** Truncate an address to 0x1234...abcd format. */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Profile display label: name if available, otherwise truncated address. */
export function getProfileLabel(
  profile: { name?: string | null; address?: string } | null | undefined,
  fallbackAddress: string,
): string {
  if (profile?.name) return profile.name;
  if (profile?.address) return truncateAddress(profile.address);
  return truncateAddress(fallbackAddress);
}

/** Digital asset display label and symbol. */
export function getDigitalAssetLabel(
  da: { name?: string | null; symbol?: string | null; address?: string } | null | undefined,
  fallbackAddress: string,
): { label: string; symbol: string | null } {
  if (!da) return { label: truncateAddress(fallbackAddress), symbol: null };
  return {
    label: da.name ?? truncateAddress(da.address ?? fallbackAddress),
    symbol: da.symbol ?? null,
  };
}

/** Validate that a URL uses a safe protocol (prevents javascript: / data: XSS). */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ipfs:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** Resolve a URL, converting ipfs:// to an HTTPS gateway URL */
export function resolveUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}
