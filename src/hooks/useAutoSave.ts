import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  interval?: number; // milliseconds
}

export const useAutoSave = ({ key, data, enabled = true, interval = 30000 }: AutoSaveOptions) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveToLocalStorage = useCallback(async () => {
    if (!enabled || !data) return;
    
    setIsSaving(true);
    try {
      localStorage.setItem(`autosave_${key}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: 'Auto-save failed',
        description: 'Your changes could not be saved automatically',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [key, data, enabled, toast]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to load auto-saved data:', error);
    }
    return null;
  }, [key]);

  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
  }, [key]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(saveToLocalStorage, interval);
    return () => clearInterval(intervalId);
  }, [saveToLocalStorage, enabled, interval]);

  // Save on data change (debounced)
  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(saveToLocalStorage, 2000);
    return () => clearTimeout(timeoutId);
  }, [data, saveToLocalStorage, enabled]);

  return {
    lastSaved,
    isSaving,
    saveNow: saveToLocalStorage,
    loadSaved: loadFromLocalStorage,
    clearAutoSave,
  };
};