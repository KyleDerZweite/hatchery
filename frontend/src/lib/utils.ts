import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Open a user-supplied URL in a new tab, but only if it is http(s).
 * Blocks javascript:/data: URLs stored in shared records (e.g. public eggs).
 */
export function openExternalUrl(url: string) {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return
  }
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
