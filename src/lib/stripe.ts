import { loadStripe, Stripe } from '@stripe/stripe-js';

// Enhanced Stripe configuration with monitoring
interface StripeConfig {
  publishableKey: string;
  apiVersion?: string;
  locale?: string;
}

// Initialize Stripe with enhanced configuration
let stripePromise: Promise<Stripe | null>;
let stripeConfig: StripeConfig | null = null;

const getStripeConfig = (): StripeConfig => {
  if (!stripeConfig) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error(
        'Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env.local file'
      );
    }
    
    // Validate key format
    if (!publishableKey.startsWith('pk_')) {
      throw new Error(
        'Invalid Stripe publishable key format. Key should start with "pk_"'
      );
    }
    
    stripeConfig = {
      publishableKey,
      locale: 'de', // German locale for German interface
    };
  }
  
  return stripeConfig;
};

const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    try {
      const config = getStripeConfig();
      
      stripePromise = loadStripe(config.publishableKey, {
        locale: config.locale as any,
      });
      
      // Add load monitoring
      const startTime = Date.now();
      const stripe = await stripePromise;
      const loadTime = Date.now() - startTime;
      
      if (stripe) {
        console.log(`Stripe loaded successfully in ${loadTime}ms`);
        
        // Track Stripe initialization
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'stripe_initialized', {
            load_time_ms: loadTime,
            environment: config.publishableKey.includes('test') ? 'test' : 'live'
          });
        }
      } else {
        console.error('Failed to initialize Stripe');
        
        // Track initialization failure
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'stripe_init_failed', {
            load_time_ms: loadTime
          });
        }
      }
      
      return stripe;
    } catch (error) {
      console.error('Error loading Stripe:', error);
      return null;
    }
  }
  
  return stripePromise;
};

export default getStripe;

// Enhanced currency handling with validation
const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Helper function to validate currency
export const validateCurrency = (currency: string): currency is SupportedCurrency => {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
};

// Enhanced price formatting with error handling
export const formatPrice = (amount: number, currency: string = 'EUR'): string => {
  try {
    const normalizedCurrency = currency.toUpperCase();
    
    if (!validateCurrency(normalizedCurrency)) {
      console.warn(`Unsupported currency: ${currency}, falling back to EUR`);
      currency = 'EUR';
    }
    
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      console.warn(`Invalid amount: ${amount}, using 0`);
      amount = 0;
    }
    
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${amount.toFixed(2)} ${currency}`;
  }
};

// Enhanced cents conversion with validation
export const toCents = (amount: number): number => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error(`Invalid amount for cents conversion: ${amount}`);
  }
  
  if (amount < 0) {
    throw new Error(`Amount cannot be negative: ${amount}`);
  }
  
  // Handle precision issues with floating point arithmetic
  return Math.round(amount * 100);
};

// Enhanced cents to currency conversion
export const fromCents = (cents: number): number => {
  if (typeof cents !== 'number' || isNaN(cents)) {
    throw new Error(`Invalid cents value: ${cents}`);
  }
  
  if (cents < 0) {
    throw new Error(`Cents cannot be negative: ${cents}`);
  }
  
  return cents / 100;
};

// Utility to get minimum charge amount for a currency
export const getMinimumChargeAmount = (currency: string): number => {
  const minimums: Record<SupportedCurrency, number> = {
    EUR: 0.50,
    USD: 0.50,
    GBP: 0.30,
  };
  
  const normalizedCurrency = currency.toUpperCase() as SupportedCurrency;
  return minimums[normalizedCurrency] || 0.50;
};

// Validate payment amount against Stripe limits
export const validatePaymentAmount = (amount: number, currency: string): { valid: boolean; error?: string } => {
  const minimum = getMinimumChargeAmount(currency);
  const maximum = 999999.99; // Stripe's maximum
  
  if (amount < minimum) {
    return {
      valid: false,
      error: `Amount must be at least ${formatPrice(minimum, currency)}`
    };
  }
  
  if (amount > maximum) {
    return {
      valid: false,
      error: `Amount cannot exceed ${formatPrice(maximum, currency)}`
    };
  }
  
  return { valid: true };
};