import { useEffect, useRef } from 'react';

interface AutoSaveOptions {
  delay: number; // Debounce delay in milliseconds
  onSave: () => Promise<void>;
  isDirty: boolean;
}

export function useAutoSave({ delay, onSave, isDirty }: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Only trigger if there are unsaved changes
    if (!isDirty || isSavingRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      try {
        await onSave();
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Optionally show toast notification to user
      } finally {
        isSavingRef.current = false;
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, delay, onSave]);
}
