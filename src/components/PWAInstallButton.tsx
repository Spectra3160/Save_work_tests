import { useState } from 'react';
import { CheckCircle2, Download, Laptop, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export function PWAInstallButton({ variant = 'card' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
        <span>Приложение уже установлено на устройство</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'compact'
            ? 'h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer'
            : 'h-10 px-4 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer'
        }
      >
        <Download className="w-4 h-4" />
        <span>Установить на ПК</span>
      </button>
    );
  }

  if (variant === 'compact') {
    if (!isIOS) return null;
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Установить</span>
        </button>
        {showGuide && (
          <InstallGuideModal isIOS={isIOS} isInIframe={isInIframe} onClose={() => setShowGuide(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
      >
        <Laptop className="w-4 h-4" />
        <span>Как установить в 2 клика</span>
      </button>

      {showGuide && (
        <InstallGuideModal isIOS={isIOS} isInIframe={isInIframe} onClose={() => setShowGuide(false)} />
      )}
    </>
  );
}

function InstallGuideModal({
  isIOS,
  isInIframe,
  onClose,
}: {
  isIOS: boolean;
  isInIframe: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-guide-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 id="pwa-guide-title" className="font-display text-base font-bold text-slate-900">
            {isIOS
              ? 'Установка на iPhone / iPad'
              : 'Установка как программы на Windows (без сборки EXE)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5">
            <li>Нажмите кнопку <strong>«Поделиться»</strong> в нижней панели Safari.</li>
            <li>Прокрутите вниз и выберите <strong>«На экран „Домой“»</strong>.</li>
            <li>Нажмите <strong>«Добавить»</strong> — приложение появится как отдельная иконка.</li>
          </ol>
        ) : (
          <ol className="space-y-2.5 text-sm text-slate-700 list-decimal pl-5 leading-relaxed">
            {isInIframe && (
              <li>
                Откройте приложение в отдельной вкладке браузера <strong>Chrome</strong> или{' '}
                <strong>Microsoft Edge</strong> (кнопка «Открыть в новой вкладке» в правом верхнем углу окна предпросмотра).
              </li>
            )}
            <li>
              В адресной строке браузера справа нажмите значок <strong>«Установить приложение»</strong>{' '}
              (или откройте меню браузера <strong>⋮ / ⋯</strong> → <strong>Приложения</strong> →{' '}
              <strong>Установить этот сайт как приложение</strong>).
            </li>
            <li>
              Подтвердите установку — на рабочем столе и в меню «Пуск» появится ярлык{' '}
              <strong>«Охрана труда»</strong>. Приложение будет открываться в собственном окне как
              обычная программа Windows и работать без интернета.
            </li>
          </ol>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
