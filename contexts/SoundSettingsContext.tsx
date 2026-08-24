'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys } from '@/libs/queryKeys';

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

type NotificationSoundSettingsResponse = {
  notificationSoundEnabled: boolean;
};

type MessageSoundSettingsResponse = {
  messageSoundEnabled: boolean;
};

type MutationContext<TSettings> = {
  previousSettings?: TSettings;
};

const fetchNotificationSoundSettings = async (): Promise<NotificationSoundSettingsResponse> => {
  const response = await fetch('/api/notifications/settings', { cache: 'no-store' });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to load notification sound settings');
  }

  return {
    notificationSoundEnabled: Boolean(json?.notificationSoundEnabled),
  };
};

const fetchMessageSoundSettings = async (): Promise<MessageSoundSettingsResponse> => {
  const response = await fetch('/api/messages/settings', { cache: 'no-store' });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to load message sound settings');
  }

  return {
    messageSoundEnabled: Boolean(json?.messageSoundEnabled),
  };
};

const updateNotificationSoundSettings = async (
  notificationSoundEnabled: boolean
): Promise<NotificationSoundSettingsResponse> => {
  const response = await fetch('/api/notifications/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationSoundEnabled }),
  });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to update notification sound settings');
  }

  return {
    notificationSoundEnabled: Boolean(json?.notificationSoundEnabled),
  };
};

const updateMessageSoundSettings = async (
  messageSoundEnabled: boolean
): Promise<MessageSoundSettingsResponse> => {
  const response = await fetch('/api/messages/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageSoundEnabled }),
  });
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to update message sound settings');
  }

  return {
    messageSoundEnabled: Boolean(json?.messageSoundEnabled),
  };
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
  const queryClient = useQueryClient();
  const isAuthenticated = status === 'authenticated';

  const notificationSoundQuery = useQuery({
    queryFn: fetchNotificationSoundSettings,
    queryKey: queryKeys.soundSettings.notifications(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const messageSoundQuery = useQuery({
    queryFn: fetchMessageSoundSettings,
    queryKey: queryKeys.soundSettings.messages(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const notificationSoundMutation = useMutation<
    NotificationSoundSettingsResponse,
    Error,
    boolean,
    MutationContext<NotificationSoundSettingsResponse>
  >({
    mutationFn: updateNotificationSoundSettings,
    onError: (_error, _enabled, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.soundSettings.notifications(), context.previousSettings);
      }
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.soundSettings.notifications() });
      const previousSettings = queryClient.getQueryData<NotificationSoundSettingsResponse>(
        queryKeys.soundSettings.notifications()
      );

      queryClient.setQueryData(queryKeys.soundSettings.notifications(), {
        notificationSoundEnabled: enabled,
      });

      return { previousSettings };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.soundSettings.notifications(), settings);
    },
  });

  const messageSoundMutation = useMutation<
    MessageSoundSettingsResponse,
    Error,
    boolean,
    MutationContext<MessageSoundSettingsResponse>
  >({
    mutationFn: updateMessageSoundSettings,
    onError: (_error, _enabled, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.soundSettings.messages(), context.previousSettings);
      }
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.soundSettings.messages() });
      const previousSettings = queryClient.getQueryData<MessageSoundSettingsResponse>(
        queryKeys.soundSettings.messages()
      );

      queryClient.setQueryData(queryKeys.soundSettings.messages(), {
        messageSoundEnabled: enabled,
      });

      return { previousSettings };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.soundSettings.messages(), settings);
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.removeQueries({ queryKey: queryKeys.soundSettings.all });
    }
  }, [isAuthenticated, queryClient]);

  const notificationSoundEnabled = isAuthenticated
    ? Boolean(notificationSoundQuery.data?.notificationSoundEnabled)
    : false;
  const messageSoundEnabled = isAuthenticated
    ? Boolean(messageSoundQuery.data?.messageSoundEnabled)
    : false;
  const loading =
    status === 'loading' ||
    (isAuthenticated && (notificationSoundQuery.isLoading || messageSoundQuery.isLoading));

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
      await notificationSoundMutation.mutateAsync(enabled);

      if (enabled) {
        playGeneratedNotificationTone();
      }
    },
    [notificationSoundMutation]
  );

  const updateMessageSoundEnabled = useCallback(
    async (enabled: boolean) => {
      await messageSoundMutation.mutateAsync(enabled);

      if (enabled) {
        playGeneratedNotificationTone();
      }
    },
    [messageSoundMutation]
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
