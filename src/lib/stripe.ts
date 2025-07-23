import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Missing Stripe publishable key');
      return null;
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default getStripe;

// Helper function to format currency
export const formatPrice = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Helper function to convert price to cents for Stripe
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

// Helper function to convert cents back to currency amount
export const fromCents = (cents: number): number => {
  return cents / 100;
};