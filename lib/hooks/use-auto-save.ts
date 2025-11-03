import { useEffect, useRef, useState, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  error: string | null;
  save: () => Promise<void>;
}

/**
 * Custom hook for auto-saving form data with debouncing
 *
 * @param data - The data to auto-save
 * @param onSave - Async function to save the data
 * @param delay - Debounce delay in milliseconds (default: 3000)
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');
    setError(null);

    try {
      await onSave(data);
      setStatus('saved');
      setLastSaved(new Date());
      previousDataRef.current = data;
    } catch (err) {
      console.error('Auto-save error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to auto-save');
    } finally {
      isSavingRef.current = false;

      // Reset to idle after showing saved status for 2 seconds
      setTimeout(() => {
        setStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    }
  }, [data, onSave]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if data has actually changed
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (dataChanged && !isSavingRef.current) {
      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        save();
      }, delay);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  return {
    status,
    lastSaved,
    error,
    save,
  };
}
