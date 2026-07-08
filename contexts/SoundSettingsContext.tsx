'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

type SoundOptions = {
  force?: boolean;
};

type SoundSettingsContextValue = {
  notificationSoundEnabled: boolean;
  messageSoundEnabled: boolean;
  loading: boolean;
  updateNotificationSoundEnabled: (enabled: boolean) => Promise<void>;
  updateMessageSoundEnabled: (enabled: boolean) => Promise<void>;
  playNotificationSound: (options?: SoundOptions) => void;
  playMessageSound: (options?: SoundOptions) => void;
};

const SoundSettingsContext = createContext<SoundSettingsContextValue | undefined>(undefined);

type SoundSettingsProviderProps = {
  children: ReactNode;
};

const shouldPlaySound = (force?: boolean) => {
  if (force) {
    return true;
  }

  if (typeof document === 'undefined') {
    return false;
  }

  return document.hidden || !document.hasFocus();
};

const playGeneratedNotificationTone = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextConstructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  const audioContext = new AudioContextConstructor();
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  gain.connect(audioContext.destination);

  const tones = [
    { frequency: 880, start: 0, duration: 0.16 },
    { frequency: 1174.66, start: 0.18, duration: 0.2 },
  ];

  tones.forEach((tone) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, now + tone.start);
    oscillator.connect(gain);
    oscillator.start(now + tone.start);
    oscillator.stop(now + tone.start + tone.duration);
  });

  window.setTimeout(() => {
    void audioContext.close().catch(() => undefined);
  }, 800);
};

export const SoundSettingsProvider = ({ children }: SoundSettingsProviderProps) => {
  const { status } = useSession();
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(false);
  const [messageSoundEnabled, setMessageSoundEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (status !== 'authenticated') {
      setNotificationSoundEnabled(false);
      setMessageSoundEnabled(false);
      return;
    }

    try {
      setLoading(true);
      const [notificationsResult, messagesResult] = await Promise.allSettled([
        fetch('/api/notifications/settings', { cache: 'no-store' }),
        fetch('/api/messages/settings', { cache: 'no-store' }),
      ]);

      if (notificationsResult.status === 'fulfilled' && notificationsResult.value.ok) {
        const notificationsJson = await notificationsResult.value.json().catch(() => null);
        setNotificationSoundEnabled(Boolean(notificationsJson?.notificationSoundEnabled));
      }

      if (messagesResult.status === 'fulfilled' && messagesResult.value.ok) {
        const messagesJson = await messagesResult.value.json().catch(() => null);
        setMessageSoundEnabled(Boolean(messagesJson?.messageSoundEnabled));
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const playSound = useCallback((enabled: boolean, options?: SoundOptions) => {
    if (!enabled || !shouldPlaySound(options?.force)) {
      return;
    }

    try {
      playGeneratedNotificationTone();
    } catch {
      // Browsers can still reject audio in some autoplay states. Keep app UX resilient.
    }
  }, []);

  const playNotificationSound = useCallback(
    (options?: SoundOptions) => playSound(notificationSoundEnabled, options),
    [notificationSoundEnabled, playSound]
  );

  const playMessageSound = useCallback(
    (options?: SoundOptions) => playSound(messageSoundEnabled, options),
    [messageSoundEnabled, playSound]
  );

  const updateNotificationSoundEnabled = useCallback(
    async (enabled: boolean) => {
      const previousValue = notificationSoundEnabled;
      setNotificationSoundEnabled(enabled);

      const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationSoundEnabled: enabled }),
      });

      if (!response.ok) {
        setNotificationSoundEnabled(previousValue);
        throw new Error('Failed to update notification sound settings');
      }

      const json = await response.json().catch(() => null);
      setNotificationSoundEnabled(Boolean(json?.notificationSoundEnabled));

      if (enabled) {
        playGeneratedNotificationTone();
      }
    },
    [notificationSoundEnabled]
  );

  const updateMessageSoundEnabled = useCallback(
    async (enabled: boolean) => {
      const previousValue = messageSoundEnabled;
      setMessageSoundEnabled(enabled);

      const response = await fetch('/api/messages/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageSoundEnabled: enabled }),
      });

      if (!response.ok) {
        setMessageSoundEnabled(previousValue);
        throw new Error('Failed to update message sound settings');
      }

      const json = await response.json().catch(() => null);
      setMessageSoundEnabled(Boolean(json?.messageSoundEnabled));

      if (enabled) {
        playGeneratedNotificationTone();
      }
    },
    [messageSoundEnabled]
  );

  const value = useMemo(
    () => ({
      notificationSoundEnabled,
      messageSoundEnabled,
      loading,
      updateNotificationSoundEnabled,
      updateMessageSoundEnabled,
      playNotificationSound,
      playMessageSound,
    }),
    [
      notificationSoundEnabled,
      messageSoundEnabled,
      loading,
      updateNotificationSoundEnabled,
      updateMessageSoundEnabled,
      playNotificationSound,
      playMessageSound,
    ]
  );

  return <SoundSettingsContext.Provider value={value}>{children}</SoundSettingsContext.Provider>;
};

export const useSoundSettings = () => {
  const context = useContext(SoundSettingsContext);

  if (!context) {
    throw new Error('useSoundSettings must be used within SoundSettingsProvider');
  }

  return context;
};
