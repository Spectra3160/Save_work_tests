import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                destructive
                  ? 'bg-red-50 text-red-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3
                id="confirm-modal-title"
                className="font-display font-bold text-base text-slate-900"
              >
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Закрыть"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 px-4 rounded-lg text-sm font-medium text-white cursor-pointer ${
              destructive
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
