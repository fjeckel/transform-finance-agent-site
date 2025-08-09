import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Generate ULID (Universally Unique Lexicographically Sortable Identifier)
 * Based on https://github.com/ulid/spec
 */
export function generateULID(seedTime?: number): string {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const TIME_LEN = 10;
  const RANDOM_LEN = 16;
  
  const now = seedTime || Date.now();
  
  // Encode timestamp (10 characters)
  let timeString = '';
  let timestamp = now;
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    timeString = ENCODING[timestamp % 32] + timeString;
    timestamp = Math.floor(timestamp / 32);
  }
  
  // Generate random part (16 characters)
  let randomString = '';
  for (let i = 0; i < RANDOM_LEN; i++) {
    randomString += ENCODING[Math.floor(Math.random() * 32)];
  }
  
  return timeString + randomString;
}