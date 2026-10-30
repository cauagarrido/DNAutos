import React, { useState } from 'react';
import { ChevronDown, History, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  theme?: 'dark' | 'light';
  onOpenHistory?: () => void;
  historyCount?: number;
  onResetToHome: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHistory, historyCount = 0, onResetToHome, onNavigateSection, onOpenAuth }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Usuário';

  const goTo = (id: string) => {
    setIsMobileMenuOpen(false);
    if (id === 'home') onResetToHome();
    else onNavigateSection?.(id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/75 bg-white/75 text-[#0B1320] shadow-[0_4px_24px_rgba(22,34,50,.045)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/65">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={onResetToHome} className="shrink-0 rounded-xl bg-white/80 px-2 py-1 transition hover:bg-white" aria-label="DNAutos Vistorias — início">
          <img src="/dnautos-logo.png" alt="DNAutos Vistorias" className="h-auto w-40 sm:w-48" />
        </button>

        <nav className="hidden items-center gap-7 text-[12px] font-semibold text-slate-600 lg:flex">
          <button onClick={() => goTo('home')} className="transition hover:text-[#E65B00]">Início</button>
          <button onClick={() => goTo('como-funciona')} className="transition hover:text-[#E65B00]">Como funciona</button>
          <button onClick={() => goTo('servicos')} className="transition hover:text-[#E65B00]">Serviços</button>
          <button onClick={() => goTo('duvidas')} className="transition hover:text-[#E65B00]">Dúvidas</button>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 rounded-full border border-white/90 bg-white/75 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-[#C94F00]">{user.name.charAt(0).toUpperCase()}</span>
                <span className="hidden sm:inline">Olá, {firstName}</span><ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {isUserMenuOpen && <div className="glass-panel absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl p-1.5 text-xs shadow-xl">
                <button onClick={() => { setIsUserMenuOpen(false); onOpenHistory?.(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-slate-700 transition hover:bg-white/80"><History className="h-4 w-4 text-[#F06400]" />Minhas consultas ({historyCount})</button>
                <button onClick={() => { setIsUserMenuOpen(false); logout(); onResetToHome(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium text-rose-600 transition hover:bg-rose-50"><LogOut className="h-4 w-4" />Sair da conta</button>
              </div>}
            </div>
          ) : (
            <>
              <button onClick={onOpenHistory} className="hidden items-center gap-2 rounded-full border border-white/90 bg-white/65 px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white sm:flex"><History className="h-4 w-4 text-[#F06400]" />Consultas{historyCount > 0 && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-[#C94F00]">{historyCount}</span>}</button>
              <button onClick={onOpenAuth} className="rounded-full bg-[#0B1320] px-4 py-2.5 text-[11px] font-bold text-white shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#18283A] sm:px-5 sm:text-xs">Entrar / Criar conta</button>
            </>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/70 text-slate-600 shadow-sm lg:hidden" aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}>{isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
        </div>
      </div>
      {isMobileMenuOpen && <div className="glass-panel absolute inset-x-3 top-[calc(100%+8px)] rounded-2xl p-3 shadow-xl lg:hidden">
        <div className="grid gap-1 text-sm font-semibold text-slate-700">
          <button onClick={() => goTo('home')} className="rounded-xl px-3 py-3 text-left hover:bg-white/80">Início</button>
          <button onClick={() => goTo('como-funciona')} className="rounded-xl px-3 py-3 text-left hover:bg-white/80">Como funciona</button>
          <button onClick={() => goTo('servicos')} className="rounded-xl px-3 py-3 text-left hover:bg-white/80">Serviços</button>
          <button onClick={() => goTo('duvidas')} className="rounded-xl px-3 py-3 text-left hover:bg-white/80">Dúvidas</button>
          {!isAuthenticated && <button onClick={() => { setIsMobileMenuOpen(false); onOpenHistory?.(); }} className="rounded-xl px-3 py-3 text-left hover:bg-white/80">Minhas consultas</button>}
        </div>
      </div>}
    </header>
  );
};
