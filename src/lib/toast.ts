'use client';
import { toast as sonner } from 'sonner';

export const toast = {
  success: (msg: string, opts?: { description?: string }) => sonner.success(msg, opts),
  error:   (msg: string, opts?: { description?: string }) => sonner.error(msg, opts),
  info:    (msg: string, opts?: { description?: string }) => sonner.info(msg, opts),
  warning: (msg: string, opts?: { description?: string }) => sonner.warning(msg, opts),
  loading: (msg: string) => sonner.loading(msg),
  dismiss: (id?: string | number) => sonner.dismiss(id),
  promise: <T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
    sonner.promise(p, msgs),
};
