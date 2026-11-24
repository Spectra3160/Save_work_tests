import { ShieldCheck, Menu, X } from 'lucide-react';
import { NavSection } from '../types/quiz';

interface TopBarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onResumeTest: () => void;
  hasStarted: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'catalog', label: 'Каталог тем' },
  { id: 'quiz', label: 'Тестирование' },
  { id: 'history', label: 'История и ошибки' },
  { id: 'desktop', label: 'Скачать / EXE' },
];

export function TopBar({
  activeSection,
  onSelectSection,
  onResumeTest,
  hasStarted,
  mobileMenuOpen,
  onToggleMobileMenu,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Закрыть меню разделов' : 'Открыть меню разделов'}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('catalog')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group"
          >
            <span className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-[15px] tracking-tight text-slate-900 group-hover:text-red-700 transition-colors">
              Охрана труда
            </span>
          </button>
        </div>

        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-8"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative h-16 flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-red-700" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onResumeTest}
            className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
          >
            {hasStarted ? 'Продолжить тест' : 'Начать тест'}
          </button>
        </div>
      </div>

      {/* Compact mobile section tabs */}
      <div className="md:hidden border-t border-slate-200 bg-white px-4 flex items-center gap-5 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`relative py-2.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-red-700" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
