import { useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  HardDrive,
  Laptop,
  MonitorDown,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react';
import { PersistedProgress } from '../types/quiz';
import {
  downloadProgressJson,
  formatRussianDateTime,
  parseImportedProgress,
} from '../utils/storage';
import { downloadStandaloneOfflineHtml } from '../utils/offlineHtmlExport';
import { TOTAL_QUESTIONS, TOTAL_SUBTOPICS, TOTAL_THEMES } from '../data';
import { ConfirmModal } from './ConfirmModal';
import { PWAInstallButton } from './PWAInstallButton';

interface DesktopBuildViewProps {
  progress: PersistedProgress;
  onImportProgress: (next: PersistedProgress) => void;
  onResetAllProgress: () => void;
}

const BUILD_COMMANDS = `npm install
npm install -D electron electron-builder
npm run build
npx electron-builder --config electron-builder.json --win`;

export function DesktopBuildView({
  progress,
  onImportProgress,
  onResetAllProgress,
}: DesktopBuildViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'ok' | 'err';
    message: string;
  } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showManualCommands, setShowManualCommands] = useState(false);
  const [resetAllOpen, setResetAllOpen] = useState(false);

  const isElectron = Boolean(window.electronAPI?.isElectron);
  const answeredCount = Object.keys(progress.answers).length;
  const bookmarkCount = Object.values(progress.bookmarks).filter(Boolean).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseImportedProgress(text);
      if (!parsed) {
        setImportStatus({
          type: 'err',
          message: 'Не удалось прочитать файл: требуется корректный JSON резервной копии.',
        });
      } else {
        onImportProgress(parsed);
        setImportStatus({
          type: 'ok',
          message: `Прогресс восстановлен: ${Object.keys(parsed.answers).length} ответов, ${parsed.history.length} попыток.`,
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleCopyCommands = async () => {
    try {
      await navigator.clipboard.writeText(BUILD_COMMANDS);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // Clipboard may be restricted
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
          Установка на компьютер и сохранение данных
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Как запускать тренажёр на Windows
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Выберите самый удобный для вас способ — от мгновенной установки ярлыка на рабочий стол
          без команд до сборки классического файла <span className="font-mono text-slate-800">.exe</span>.
        </p>
      </header>

      {/* Way 1: Easiest — Install as Desktop App (PWA) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Laptop className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-red-700">
                Способ 1 · Самый простой (без терминала и сборки)
              </div>
              <h2 className="mt-0.5 font-display text-lg font-bold text-slate-900">
                Установить как программу на рабочий стол Windows
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
                Создаёт обычный ярлык <strong>«Охрана труда»</strong> на рабочем столе и в меню
                «Пуск». Открывается в отдельном окне без панели браузера, работает без интернета и
                помнит все ваши ответы и исходные PDF-конспекты.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <PWAInstallButton variant="card" />
          </div>
        </div>
      </section>

      {/* Way 2: Single Offline File */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileCode2 className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Способ 2 · Один файл на компьютер или флешку (без установки)
              </div>
              <h2 className="mt-0.5 font-display text-lg font-bold text-slate-900">
                Скачать автономный файл тренажёра (.html)
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
                Один готовый файл со всеми {TOTAL_THEMES} документами, {TOTAL_SUBTOPICS} темами,{' '}
                {TOTAL_QUESTIONS} тестовыми заданиями и вашим текущим прогрессом. Просто сохраните
                на рабочий стол и открывайте двойным кликом — интернет и установка программ не
                нужны.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadStandaloneOfflineHtml(progress)}
            className="h-10 px-4 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Скачать файл (.html)</span>
          </button>
        </div>
      </section>

      {/* Way 3: Automatic .EXE Builder via Double-Click .bat */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <MonitorDown className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Способ 3 · Если нужен именно файл .exe (автоматически, без ввода команд)
              </div>
              <h2 className="mt-0.5 font-display text-lg font-bold text-slate-900">
                Собрать Windows .exe двойным кликом по Build_EXE_Windows.bat
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Внутри проекта уже лежит готовый автосборщик{' '}
                <span className="font-mono text-xs font-semibold text-slate-900">
                  Build_EXE_Windows.bat
                </span>
                . Вам не нужно ничего печатать вручную — достаточно 3 простых шагов на вашем ПК:
              </p>
            </div>

            <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5 leading-relaxed">
              <li>
                Скачайте проект архивом (ZIP) на компьютер и распакуйте в любую папку (например, на
                Рабочий стол).
              </li>
              <li>
                Убедитесь, что на компьютере установлен бесплатный <strong>Node.js</strong> (если
                нет — скачайте с <span className="font-mono text-xs text-slate-900">nodejs.org</span>{' '}
                кнопкой «LTS» и нажмите «Далее → Установить»).
              </li>
              <li>
                Откройте распакованную папку и <strong>дважды кликните по файлу</strong>{' '}
                <span className="font-mono text-xs font-semibold text-slate-900">
                  Build_EXE_Windows.bat
                </span>
                . Скрипт сам соберёт программу и автоматически откроет папку{' '}
                <span className="font-mono text-xs text-slate-900">release</span> с двумя готовыми{' '}
                <span className="font-mono text-xs text-slate-900">.exe</span> файлами (установщик и
                портативный).
              </li>
            </ol>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowManualCommands((v) => !v)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showManualCommands ? 'rotate-180' : ''
                  }`}
                />
                <span>Показать команды для ручной сборки в терминале</span>
              </button>

              {showManualCommands && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Альтернатива .bat-файлу (PowerShell / cmd):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCommands}
                      className="h-7 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCmd ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                  <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                    {BUILD_COMMANDS}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Progress Storage & Backup Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Сохранённый прогресс и резервная копия
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Режим хранения:{' '}
              <strong className="text-slate-900">
                {isElectron
                  ? 'Файл progress.json на диске (Windows) + локальное хранилище'
                  : 'Автоматическое постоянное локальное хранилище'}
              </strong>
              . Вы можете перенести свои ответы на другой компьютер через файл резервной копии.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-sm">
          <div>
            <div className="text-xs text-slate-500">Отвечено вопросов</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
              {answeredCount} / {TOTAL_QUESTIONS}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Попыток в истории</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
              {progress.history.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Закладок</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
              {bookmarkCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Последнее сохранение</div>
            <div className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums text-xs">
              {formatRussianDateTime(progress.lastSavedAt)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => downloadProgressJson(progress)}
            className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт прогресса (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Импорт прогресса (.json)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setResetAllOpen(true)}
            className="h-9 px-4 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-700 inline-flex items-center gap-2 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить весь прогресс</span>
          </button>
        </div>

        {importStatus && (
          <div
            className={`rounded-lg border p-3 text-xs flex items-center gap-2 ${
              importStatus.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {importStatus.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </section>

      <ConfirmModal
        open={resetAllOpen}
        title="Сбросить весь сохранённый прогресс?"
        description="Будут удалены все выбранные ответы по 7 документам, все закладки и вся история попыток. Рекомендуется сначала сохранить резервную копию в JSON."
        confirmLabel="Сбросить всё"
        destructive
        onConfirm={() => {
          onResetAllProgress();
          setResetAllOpen(false);
        }}
        onCancel={() => setResetAllOpen(false)}
      />
    </div>
  );
}
