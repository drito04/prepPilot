interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="h-1 w-12 rounded-full bg-accent-500" />
      {description && <p className="text-slate-600">{description}</p>}
    </div>
  );
}