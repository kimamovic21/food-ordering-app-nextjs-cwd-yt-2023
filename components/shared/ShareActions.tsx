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

interface ShareActionsProps {
  url: string;
  title: string;
  className?: string;
}

const ShareActions = ({ url, title, className }: ShareActionsProps) => {
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
      </div>
    </div>
  );
};

export default ShareActions;
