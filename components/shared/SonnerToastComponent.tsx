'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { toast, type ExternalToast } from 'sonner';

type ToastMessage = ReactNode;
type ToastVariant = 'success' | 'error' | 'pending';
type PromiseToastOptions = Parameters<typeof toast.promise>[1];

type SonnerToastComponentProps = {
  success?: ToastMessage;
  error?: ToastMessage;
  pending?: ToastMessage;
  options?: ExternalToast;
};

const toastStyles: Record<ToastVariant, CSSProperties> = {
  success: {
    background: '#22c55e',
    color: 'white',
  },
  error: {
    background: '#ef4444',
    color: 'white',
  },
  pending: {
    background: 'var(--primary)',
    color: 'white',
  },
};

const promiseClassNames = {
  success: 'bg-green-500 text-white border-green-500',
  error: 'bg-red-500 text-white border-red-500',
  loading: 'bg-primary text-white border-primary',
};

const withToastStyle = (variant: ToastVariant, options?: ExternalToast): ExternalToast => ({
  ...options,
  style: {
    ...options?.style,
    ...toastStyles[variant],
  },
});

export const sonnerToast = {
  success: (message: ToastMessage, options?: ExternalToast) =>
    toast.success(message, withToastStyle('success', options)),
  error: (message: ToastMessage, options?: ExternalToast) =>
    toast.error(message, withToastStyle('error', options)),
  pending: (message: ToastMessage, options?: ExternalToast) =>
    toast.loading(message, withToastStyle('pending', options)),
  loading: (message: ToastMessage, options?: ExternalToast) =>
    toast.loading(message, withToastStyle('pending', options)),
  info: (message: ToastMessage, options?: ExternalToast) =>
    toast(message, withToastStyle('pending', options)),
  promise: <ToastData,>(
    promise: Promise<ToastData> | (() => Promise<ToastData>),
    options?: PromiseToastOptions
  ) => {
    const { classNames, style: _style, ...toastOptions } = options ?? {};

    return toast.promise(promise, {
      ...toastOptions,
      classNames: {
        ...classNames,
        ...promiseClassNames,
      },
    });
  },
  dismiss: toast.dismiss,
};

const SonnerToastComponent = ({ success, error, pending, options }: SonnerToastComponentProps) => {
  useEffect(() => {
    if (success) {
      sonnerToast.success(success, options);
      return;
    }

    if (error) {
      sonnerToast.error(error, options);
      return;
    }

    if (pending) {
      sonnerToast.pending(pending, options);
    }
  }, [error, options, pending, success]);

  return null;
};

export default SonnerToastComponent;
