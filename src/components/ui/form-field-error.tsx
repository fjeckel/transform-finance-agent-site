import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldErrorProps {
  error?: string;
  className?: string;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-destructive mt-1 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <span>{error}</span>
    </div>
  );
};

interface AutoSaveIndicatorProps {
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ lastSaved, isSaving }) => {
  if (!lastSaved && !isSaving) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isSaving ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border border-muted-foreground border-t-transparent" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <span>
          Last saved: {lastSaved.toLocaleTimeString()}
        </span>
      ) : null}
    </div>
  );
};