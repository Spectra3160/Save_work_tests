import { Download, FileText, X } from 'lucide-react';
import { ThemeDocument } from '../types/quiz';

interface PdfModalProps {
  theme: ThemeDocument | null;
  onClose: () => void;
}

export function PdfModal({ theme, onClose }: PdfModalProps) {
  if (!theme) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/55"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-red-700 shrink-0" />
            <div className="min-w-0">
              <h3
                id="pdf-modal-title"
                className="font-display font-bold text-sm sm:text-base text-slate-900 truncate"
              >
                {theme.code}. {theme.title}
              </h3>
              <p className="text-xs text-slate-500">
                Исходный учебный материал · {theme.dateLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={theme.pdfPath}
              download={`${theme.code}.pdf`}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Скачать PDF
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть просмотр PDF"
              className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100">
          <iframe
            src={theme.pdfPath}
            title={`Документ ${theme.code}`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
