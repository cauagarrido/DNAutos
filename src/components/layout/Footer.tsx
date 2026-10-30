import React from 'react';

interface FooterProps { theme?: 'dark' | 'light'; }
export const Footer: React.FC<FooterProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  return (
    <footer className={`w-full py-8 text-xs sm:text-sm no-print ${isDark ? 'bg-[#080E17] border-t border-slate-800 text-slate-400' : 'bg-[#F6F7F5] border-t border-slate-200 text-slate-500'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
        <img src="/dnautos-logo.png" alt="DNAutos Vistorias" className="w-44 h-auto rounded bg-white" />
        <div className="flex flex-wrap items-center justify-center gap-5 text-center">
          <span>Informação · Confiança · Transparência</span>
          <span>Consulta segura</span>
          <span>© {new Date().getFullYear()} DNAutos Vistorias</span>
        </div>
      </div>
    </footer>
  );
};
