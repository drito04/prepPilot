export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-sm text-slate-600">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
      />
      {label}
    </div>
  );
}