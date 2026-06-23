'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';

type ReportProblemDialogProps = {
  orderId?: string;
  triggerLabel?: string;
  defaultTarget?: 'restaurant_support' | 'app_support';
  allowAppSupport?: boolean;
  onSubmitted?: () => void;
};

const categoryOptions = [
  { value: 'order_issue', label: 'Order issue' },
  { value: 'delivery_issue', label: 'Delivery issue' },
  { value: 'food_quality', label: 'Food quality' },
  { value: 'missing_item', label: 'Missing item' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'courier_issue', label: 'Courier issue' },
  { value: 'app_issue', label: 'App issue' },
  { value: 'other', label: 'Other' },
];

const ReportProblemDialog = ({
  orderId,
  triggerLabel = 'Report a problem',
  defaultTarget = 'restaurant_support',
  allowAppSupport = true,
  onSubmitted,
}: ReportProblemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [target, setTarget] = useState(defaultTarget);
  const [category, setCategory] = useState('order_issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setTarget(defaultTarget);
    setCategory('order_issue');
    setSubject('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (subject.trim().length < 4) {
      sonnerToast.error('Please add a short subject');
      return;
    }

    if (description.trim().length < 10) {
      sonnerToast.error('Please describe the problem with a little more detail');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          target,
          category,
          subject,
          description,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to send problem report');
      }

      sonnerToast.success('Problem report sent');
      resetForm();
      setOpen(false);
      onSubmitted?.();
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to send problem report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' variant='outline' className='gap-2'>
          <AlertCircle className='size-4' />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>
            Send this as a ticket so the restaurant owner or app support can review it.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Send to</Label>
            <Select value={target} onValueChange={(value) => setTarget(value as typeof target)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='restaurant_support'>Restaurant support</SelectItem>
                {allowAppSupport && <SelectItem value='app_support'>App support</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Problem type</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='ticket-subject'>Subject</Label>
            <Input
              id='ticket-subject'
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              placeholder='Wrong pizza size, missing item...'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='ticket-description'>Details</Label>
            <Textarea
              id='ticket-description'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder='Explain what happened and what needs to be checked.'
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button type='button' onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportProblemDialog;
