import { cn } from '../../lib/utils';

export function Input({ label, error, className, id, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm',
          'placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
