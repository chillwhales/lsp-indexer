import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a raw uint256 token supply string into a human-readable amount.
 *
 * Mirrors the marketplace's `formatTokenAmountCompact`:
 * - Divides by `10^decimals` (LSP7 tokens store supply as raw wei-like value)
 * - Compact notation for large numbers (K, M, B, T)
 * - Falls back to the raw string if BigInt conversion fails
 */
export function formatTokenAmount(rawSupply: string, decimals: number): string {
  try {
    const raw = BigInt(rawSupply);
    const divisor = 10n ** BigInt(decimals);
    const whole = raw / divisor;
    const frac = raw % divisor;
    const num = Number(whole) + Number(frac) / Number(divisor);

    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1_000) return num.toFixed(2);

    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    return rawSupply;
  }
}

/** Validate that a URL uses a safe protocol (prevents javascript: / data: XSS) */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ipfs:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
