// ULID (Universally Unique Lexicographically Sortable Identifier) implementation
// Provides lexicographically sortable unique identifiers with timestamp ordering

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

// Cache for timestamp to avoid recalculating
let lastTime = 0;
let lastRandom: number[] = [];

/**
 * Generate a ULID string
 * Format: RRRRRRRRRRTTTTTTTTTT (10 chars time + 16 chars random)
 */
export function generateUlid(seedTime?: number): string {
  const now = seedTime || Date.now();
  
  if (now === lastTime) {
    // If same millisecond, increment random part
    incrementRandom();
  } else {
    // New millisecond, generate new random
    lastTime = now;
    generateRandom();
  }
  
  return encodeTime(now, TIME_LEN) + encodeRandom(lastRandom, RANDOM_LEN);
}

/**
 * Extract timestamp from ULID
 */
export function getUlidTime(ulid: string): number {
  return decodeTime(ulid.slice(0, TIME_LEN));
}

/**
 * Check if string is valid ULID format
 */
export function isValidUlid(ulid: string): boolean {
  if (ulid.length !== TIME_LEN + RANDOM_LEN) {
    return false;
  }
  
  for (let i = 0; i < ulid.length; i++) {
    if (ENCODING.indexOf(ulid[i]) === -1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate ULID with specific timestamp for testing
 */
export function generateUlidWithTime(timestamp: number): string {
  if (timestamp > TIME_MAX) {
    throw new Error('Timestamp exceeds maximum value');
  }
  
  generateRandom(); // Always new random for testing
  return encodeTime(timestamp, TIME_LEN) + encodeRandom(lastRandom, RANDOM_LEN);
}

// Private helper functions

function encodeTime(now: number, len: number): string {
  let str = '';
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING[mod] + str;
    now = Math.floor(now / ENCODING_LEN);
  }
  return str;
}

function encodeRandom(random: number[], len: number): string {
  let str = '';
  for (let i = 0; i < len; i++) {
    str += ENCODING[random[i] % ENCODING_LEN];
  }
  return str;
}

function decodeTime(str: string): number {
  let time = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = ENCODING.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid ULID character: ' + char);
    }
    time = time * ENCODING_LEN + index;
  }
  return time;
}

function generateRandom(): void {
  lastRandom = [];
  for (let i = 0; i < RANDOM_LEN; i++) {
    lastRandom.push(Math.floor(Math.random() * ENCODING_LEN));
  }
}

function incrementRandom(): void {
  // Increment random part like a little-endian number
  for (let i = RANDOM_LEN - 1; i >= 0; i--) {
    if (lastRandom[i] < ENCODING_LEN - 1) {
      lastRandom[i]++;
      break;
    }
    lastRandom[i] = 0;
  }
}

// Utility functions for React components

/**
 * Sort array of objects by ULID field
 */
export function sortByUlid<T>(array: T[], getUlid: (item: T) => string): T[] {
  return array.sort((a, b) => {
    const aUlid = getUlid(a);
    const bUlid = getUlid(b);
    return aUlid.localeCompare(bUlid);
  });
}

/**
 * Group ULIDs by time bucket (e.g., by hour, day)
 */
export function groupUlidsByTime<T>(
  array: T[], 
  getUlid: (item: T) => string,
  bucketSize: 'hour' | 'day' | 'week' = 'day'
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  
  for (const item of array) {
    const ulid = getUlid(item);
    const timestamp = getUlidTime(ulid);
    const date = new Date(timestamp);
    
    let bucketKey: string;
    switch (bucketSize) {
      case 'hour':
        bucketKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        bucketKey = weekStart.toISOString().split('T')[0];
        break;
      case 'day':
      default:
        bucketKey = date.toISOString().split('T')[0];
        break;
    }
    
    if (!groups[bucketKey]) {
      groups[bucketKey] = [];
    }
    groups[bucketKey].push(item);
  }
  
  return groups;
}

/**
 * Get the age of a ULID in milliseconds
 */
export function getUlidAge(ulid: string): number {
  const timestamp = getUlidTime(ulid);
  return Date.now() - timestamp;
}

/**
 * Check if ULID is within a time range
 */
export function isUlidInTimeRange(
  ulid: string, 
  startTime: number, 
  endTime: number
): boolean {
  const timestamp = getUlidTime(ulid);
  return timestamp >= startTime && timestamp <= endTime;
}