import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook to track elapsed time for an order from creation until delivery
 * @param createdAt - Order creation timestamp
 * @param completedAt - Order completion timestamp (when marked as delivered)
 * @returns Formatted elapsed time string (HH:MM:SS or MM:SS)
 */
export function useOrderElapsedTime(
  createdAt: string,
  completedAt?: string | null,
  durationOffsetMinutes = 0
): string {
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  const calculateElapsed = useCallback(() => {
    const start = new Date(createdAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const offsetMs = Math.max(0, Number(durationOffsetMinutes) || 0) * 60 * 1000;
    const elapsedMs = end - start + offsetMs;

    if (elapsedMs < 0) return '00:00';

    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format: HH:MM:SS if hours > 0, otherwise MM:SS
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [createdAt, completedAt, durationOffsetMinutes]);

  useEffect(() => {
    // Set initial value by calling the callback
    const updateTime = () => {
      setElapsedTime(calculateElapsed());
    };

    updateTime();

    // Update every second only if order is not completed (to conserve resources)
    if (completedAt) {
      return; // Order is completed, time is frozen
    }

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [calculateElapsed, completedAt]);

  return elapsedTime;
}

/**
 * Formats milliseconds into HH:MM:SS or MM:SS format
 */
export function formatMillisecondsToTime(ms: number): string {
  if (ms < 0) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
