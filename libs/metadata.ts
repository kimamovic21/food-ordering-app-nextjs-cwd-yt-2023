import type { Metadata } from 'next';

export const SITE_NAME = 'Food Order App';

export const DEFAULT_DESCRIPTION =
  'Order food from top local restaurants, track deliveries in real time, and manage your meals in one place.';

type CreatePageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

export const createPageMetadata = ({
  title,
  description,
  path,
  noIndex = false,
}: CreatePageMetadataOptions): Metadata => {
  return {
    title,
    description,
    alternates: path ? { canonical: path } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
};
