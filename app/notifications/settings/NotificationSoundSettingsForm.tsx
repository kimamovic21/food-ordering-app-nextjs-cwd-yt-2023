'use client';

import { useState } from 'react';
import { Bell, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import { useSoundSettings } from '@/contexts/SoundSettingsContext';

const NotificationSoundSettingsForm = () => {
  const {
    notificationSoundEnabled,
    loading,
    updateNotificationSoundEnabled,
    playNotificationSound,
  } = useSoundSettings();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    try {
      setSaving(true);
      await updateNotificationSoundEnabled(enabled);
      sonnerToast.success(enabled ? 'Notification sound enabled' : 'Notification sound disabled', {
        style: { background: '#22c55e', color: 'white' },
      });
    } catch (error) {
      console.error(error);
      sonnerToast.error('Failed to update notification sound setting', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Bell className='h-5 w-5 text-primary' />
          Notification Sound
        </CardTitle>
        <CardDescription>
          Play a short sound when new order, courier, restaurant, or support notifications arrive
          while this browser tab is not focused.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='flex items-start justify-between gap-4 rounded-xl border bg-muted/30 p-4'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-primary/10 p-2 text-primary'>
              {notificationSoundEnabled ? (
                <Volume2 className='h-5 w-5' />
              ) : (
                <VolumeX className='h-5 w-5' />
              )}
            </div>
            <div>
              <p className='font-semibold'>Sound alerts</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Applies to order notifications, courier updates, restaurant alerts, and support
                tickets.
              </p>
            </div>
          </div>

          <Checkbox
            checked={notificationSoundEnabled}
            disabled={loading || saving}
            aria-label='Enable notification sound'
            onCheckedChange={(checked) => handleToggle(Boolean(checked))}
            className='mt-1 size-5 cursor-pointer'
          />
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Button
            type='button'
            onClick={() => playNotificationSound({ force: true })}
            disabled={!notificationSoundEnabled || loading || saving}
            className='gap-2'
          >
            <Volume2 className='h-4 w-4' />
            Test sound
          </Button>

          {(loading || saving) && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Saving settings...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSoundSettingsForm;
