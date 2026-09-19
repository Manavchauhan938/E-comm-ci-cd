import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

const tones = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-800',
};

export function ToastProvider() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={cn(
            'pointer-events-auto rounded-xl border px-4 py-3 text-left text-sm shadow-lift transition',
            tones[t.type] || tones.info
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
