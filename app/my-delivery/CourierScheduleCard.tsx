'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import type { CourierWorkingHour } from '@/types/courier';

const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const CourierScheduleCard = () => {
  const [workingHours, setWorkingHours] = useState<CourierWorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/my-delivery/schedule', { cache: 'no-store' });
        const json = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(json?.error || 'Failed to load courier schedule');
        }

        if (!cancelled) {
          setWorkingHours(Array.isArray(json?.workingHours) ? json.workingHours : []);
        }
      } catch (error) {
        if (!cancelled) {
          sonnerToast.error(error instanceof Error ? error.message : 'Failed to load schedule');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSchedule();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateWorkingHours = (
    day: string,
    field: keyof CourierWorkingHour,
    value: string | boolean
  ) => {
    setWorkingHours((current) =>
      current.map((hours) => (hours.day === day ? { ...hours, [field]: value } : hours))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/my-delivery/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingHours }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to update courier schedule');
      }

      setWorkingHours(Array.isArray(json?.workingHours) ? json.workingHours : workingHours);
      sonnerToast.success(json?.message || 'Courier schedule updated');
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='size-5' />
          Availability Schedule
        </CardTitle>
        <CardDescription>
          These hours help restaurants assign couriers who are actually working now.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {loading ? (
          <p className='text-sm text-muted-foreground'>Loading schedule...</p>
        ) : (
          <div className='space-y-3'>
            {workingHours.map((hours) => (
              <div
                key={hours.day}
                className='grid gap-3 rounded-lg border p-3 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center'
              >
                <p className='font-medium'>{dayLabels[hours.day] || hours.day}</p>
                <div>
                  <Label htmlFor={`${hours.day}-start`} className='sr-only'>
                    Start time
                  </Label>
                  <Input
                    id={`${hours.day}-start`}
                    type='time'
                    value={hours.startTime}
                    disabled={Boolean(hours.isUnavailable)}
                    onChange={(event) =>
                      updateWorkingHours(hours.day, 'startTime', event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`${hours.day}-end`} className='sr-only'>
                    End time
                  </Label>
                  <Input
                    id={`${hours.day}-end`}
                    type='time'
                    value={hours.endTime}
                    disabled={Boolean(hours.isUnavailable)}
                    onChange={(event) =>
                      updateWorkingHours(hours.day, 'endTime', event.target.value)
                    }
                  />
                </div>
                <label className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Checkbox
                    checked={Boolean(hours.isUnavailable)}
                    onCheckedChange={(checked) =>
                      updateWorkingHours(hours.day, 'isUnavailable', checked === true)
                    }
                  />
                  Unavailable
                </label>
              </div>
            ))}
          </div>
        )}

        <div className='flex justify-end'>
          <Button type='button' onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourierScheduleCard;
