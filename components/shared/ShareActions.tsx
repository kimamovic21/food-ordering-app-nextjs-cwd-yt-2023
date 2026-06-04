'use client';

import {
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  TwitterShareButton,
} from 'react-share';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareActionsProps {
  url: string;
  title: string;
  className?: string;
}

const ShareActions = ({ url, title, className }: ShareActionsProps) => {
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  return (
    <div className={className}>
      <p className='text-sm font-medium text-muted-foreground mb-2'>Share with friends</p>
      <div className='grid w-fit grid-flow-col auto-cols-max items-center gap-2'>
        <WhatsappShareButton className='shrink-0 leading-none' url={url} title={title}>
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>
        <FacebookShareButton className='shrink-0 leading-none' url={url} hashtag='#PizzaHub'>
          <FacebookIcon size={32} round />
        </FacebookShareButton>
        <TwitterShareButton className='shrink-0 leading-none' url={url} title={title}>
          <XIcon size={32} round />
        </TwitterShareButton>
        <TelegramShareButton className='shrink-0 leading-none' url={url} title={title}>
          <TelegramIcon size={32} round />
        </TelegramShareButton>
        <button
          type='button'
          data-slot='button'
          onClick={handleCopyLink}
          className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
          aria-label='Copy link'
          title='Copy link'
        >
          <Copy className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
};

export default ShareActions;
