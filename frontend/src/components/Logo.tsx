export function Logo({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-brand-600">prep</span>
      <span className="text-accent-600">Pilot</span>
    </span>
  );
}