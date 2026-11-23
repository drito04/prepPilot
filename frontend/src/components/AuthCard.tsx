import type { ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-t-4 border-slate-200 border-t-accent-500 bg-white p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <Logo className="block text-2xl" />
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
        {children}
        {footer && (
          <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-600">{footer}</div>
        )}
      </div>
    </div>
  );
}