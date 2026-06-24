'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { toast, type ExternalToast } from 'sonner';

type ToastMessage = ReactNode;
type ToastVariant = 'success' | 'error' | 'pending';
type PromiseToastOptions = Parameters<typeof toast.promise>[1];
type PromiseToastMessage<Data = unknown> = ReactNode | ((data: Data) => ReactNode);

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
    const {
      loading,
      success,
      error,
      finally: onFinally,
      ...rawToastOptions
    } = (options ?? {}) as PromiseToastOptions & {
      loading?: PromiseToastMessage;
      success?: PromiseToastMessage<ToastData>;
      error?: PromiseToastMessage<unknown>;
      finally?: () => void | Promise<void>;
    };
    const toastOptions = rawToastOptions as ExternalToast;
    const activePromise = typeof promise === 'function' ? promise() : promise;
    const loadingToastId = sonnerToast.loading(loading || 'Loading...', toastOptions);

    activePromise
      .then(async (data) => {
        const successMessage =
          typeof success === 'function' ? success(data) : success || 'Completed successfully.';
        sonnerToast.success((await successMessage) as ToastMessage, {
          ...toastOptions,
          id: loadingToastId,
        });
      })
      .catch(async (err) => {
        const errorMessage =
          typeof error === 'function' ? error(err) : error || 'Something went wrong.';
        sonnerToast.error((await errorMessage) as ToastMessage, {
          ...toastOptions,
          id: loadingToastId,
        });
      })
      .finally(() => {
        void onFinally?.();
      });

    return activePromise;
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
