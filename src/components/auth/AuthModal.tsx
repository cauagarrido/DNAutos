import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { X, Mail, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback chamado após auth bem-sucedida */
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!form.name.trim()) { setError('Por favor, informe seu nome.'); return; }
      if (!form.email.trim()) { setError('Por favor, informe seu e-mail.'); return; }
      if (form.password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
      if (form.password !== form.confirmPassword) { setError('As senhas não coincidem.'); return; }
    } else {
      if (!form.email.trim()) { setError('Por favor, informe seu e-mail.'); return; }
      if (!form.password) { setError('Por favor, informe sua senha.'); return; }
    }

    setIsLoading(true);
    try {
        if (mode === 'register') {
        await register({ name: form.name, email: form.email, password: form.password });
      } else {
        await login({ email: form.email, password: form.password });
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Autenticação"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0d1624] border border-slate-700/80 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-cyan-400 to-blue-500" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                {mode === 'register' ? 'Criar conta gratuita' : 'Bem-vindo de volta!'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'register'
                  ? 'Cadastre-se para consultar placas'
                  : 'Faça login para continuar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Name (register only) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block" htmlFor="auth-name">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Ex: João Silva"
                  className="w-full bg-[#0f1e35] border border-slate-600/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block" htmlFor="auth-email">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                placeholder="seu@email.com"
                className="w-full bg-[#0f1e35] border border-slate-600/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block" htmlFor="auth-password">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                value={form.password}
                onChange={handleChange('password')}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                className="w-full bg-[#0f1e35] border border-slate-600/70 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password (register only) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block" htmlFor="auth-confirm">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Repita a senha"
                  className="w-full bg-[#0f1e35] border border-slate-600/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            id="auth-submit-btn"
            className="w-full mt-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'register' ? (
              'Criar conta e consultar'
            ) : (
              'Entrar e consultar'
            )}
          </button>

          {/* Toggle mode e Consulta sem cadastro */}
          <div className="space-y-2 pt-1 text-center">
            <p className="text-xs text-slate-500">
              {mode === 'register' ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-orange-400 font-semibold hover:text-orange-300 transition-colors cursor-pointer"
              >
                {mode === 'register' ? 'Fazer login' : 'Cadastrar agora'}
              </button>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors cursor-pointer border border-dashed border-slate-700 hover:border-orange-500/40 rounded-xl"
            >
              Voltar à busca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
