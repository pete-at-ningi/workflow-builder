'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  delay?: number;
  onSave: () => Promise<void>;
  enabled?: boolean;
}

export function useAutosave({ delay = 2000, onSave, enabled = true }: UseAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const triggerSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSave();
      setStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Autosave failed:', error);
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, enabled]);

  const debouncedSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status to indicate changes are pending
    if (status === 'saved' || status === 'idle') {
      setStatus('idle');
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, delay);
  }, [delay, triggerSave, enabled, status]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSaved,
    triggerSave: debouncedSave,
    isSaving: status === 'saving',
  };
}
