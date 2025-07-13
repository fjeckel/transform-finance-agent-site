import React, { useState, useCallback } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/security';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  sanitize?: boolean;
  maxLength?: number;
}

export const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    showPasswordToggle = false, 
    sanitize = true,
    maxLength = 500,
    onChange,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [hasBeenFocused, setHasBeenFocused] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      
      // Apply length limit
      if (value.length > maxLength) {
        value = value.slice(0, maxLength);
      }
      
      // Sanitize input if enabled
      if (sanitize && type !== 'password') {
        value = sanitizeText(value);
      }
      
      // Update the event with sanitized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value,
        },
      };
      
      onChange?.(syntheticEvent);
    }, [onChange, sanitize, type, maxLength]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setHasBeenFocused(true);
      props.onFocus?.(e);
    }, [props.onFocus]);

    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
            <Shield className="h-3 w-3 text-muted-foreground" />
            {label}
          </label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              "pr-10",
              error && hasBeenFocused && "border-destructive focus-visible:ring-destructive",
              className
            )}
            onChange={handleChange}
            onFocus={handleFocus}
            autoComplete={type === 'password' ? 'current-password' : undefined}
            {...props}
          />
          {showPasswordToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </Button>
          )}
        </div>
        {error && hasBeenFocused && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {error}
          </p>
        )}
        {maxLength && (
          <p className="text-xs text-muted-foreground">
            {props.value?.toString().length || 0}/{maxLength} characters
          </p>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';