import type { ReactNode } from 'react';

type Variant = 'error' | 'success' | 'info';

const STYLES: Record<Variant, string> = {
  error: 'bg-red-50 text-red-700',
  success: 'bg-green-50 text-green-800',
  info: 'bg-brand-50 text-brand-700',
};

export function Alert({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-md px-3 py-2 text-sm ${STYLES[variant]}`}
    >
      {children}
    </p>
  );
}