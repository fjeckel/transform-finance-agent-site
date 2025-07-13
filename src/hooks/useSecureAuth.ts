import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  authRateLimiter, 
  sanitizeError, 
  secureEmailSchema, 
  securePasswordSchema 
} from '@/lib/security';

interface UseSecureAuthReturn {
  secureSignIn: (email: string, password: string) => Promise<void>;
  secureSignUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  isLoading: boolean;
  clearAttempts: () => void;
}

export const useSecureAuth = (): UseSecureAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const secureSignIn = useCallback(async (email: string, password: string) => {
    const clientId = `${email}_${navigator.userAgent}`;
    
    if (!authRateLimiter.isAllowed(clientId)) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: "Please wait before trying again.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate inputs
      secureEmailSchema.parse(email);
      securePasswordSchema.parse(password);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear rate limiting on success
      authRateLimiter.reset(clientId);
      
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      
    } catch (error: any) {
      const sanitizedError = sanitizeError(error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: sanitizedError,
      });
    } finally {
      setIsLoading(false);
    }
  }, [signIn, toast]);

  const secureSignUp = useCallback(async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ) => {
    const clientId = `${email}_${navigator.userAgent}`;
    
    if (!authRateLimiter.isAllowed(clientId)) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: "Please wait before trying again.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate inputs
      secureEmailSchema.parse(email);
      securePasswordSchema.parse(password);
      
      const { error } = await signUp(email, password, firstName, lastName);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear rate limiting on success
      authRateLimiter.reset(clientId);
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
    } catch (error: any) {
      const sanitizedError = sanitizeError(error);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: sanitizedError,
      });
    } finally {
      setIsLoading(false);
    }
  }, [signUp, toast]);

  const clearAttempts = useCallback(() => {
    // This would need to be implemented based on current user context
    // For now, we'll clear all attempts (in production, be more specific)
    authRateLimiter.reset('current_user');
  }, []);

  return {
    secureSignIn,
    secureSignUp,
    isLoading,
    clearAttempts,
  };
};