import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Автономный режим — тесты и прогресс работают без интернета</span>
    </div>
  );
}
