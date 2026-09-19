import { useEffect } from 'react';
import { cn } from '../../lib/utils';

export function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lift dark:border-slate-700 dark:bg-slate-900',
          className
        )}
      >
        {title && <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
