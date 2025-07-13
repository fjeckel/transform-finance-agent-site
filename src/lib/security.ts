// Security utilities and validation functions
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
};

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};

// Rate limiting for client-side actions
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const generalRateLimiter = new RateLimiter(30, 60000); // 30 attempts per minute

// Validation schemas with security in mind
export const secureEmailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .refine(email => !email.includes('<') && !email.includes('>'), 'Invalid characters');

export const securePasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');

export const secureTextSchema = z.string()
  .max(1000, 'Text too long')
  .refine(text => !/<script/i.test(text), 'Invalid content');

// Security headers helper
export const getSecurityHeaders = (): Record<string, string> => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

// Content Security Policy
export const getCSPHeader = (nonce?: string): string => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://aumijfxmeclxweojrefa.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://aumijfxmeclxweojrefa.supabase.co wss://aumijfxmeclxweojrefa.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ];
  
  if (nonce) {
    cspDirectives[1] = `script-src 'self' 'nonce-${nonce}' https://aumijfxmeclxweojrefa.supabase.co`;
  }
  
  return cspDirectives.join('; ');
};

// Error sanitization to prevent information leakage
export const sanitizeError = (error: any): string => {
  if (typeof error === 'string') {
    return error.includes('password') || error.includes('token') 
      ? 'Authentication error occurred' 
      : error;
  }
  
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('password') || message.includes('token') || message.includes('key')) {
      return 'Authentication error occurred';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Session security
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken && token.length === 64;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// File upload security
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB