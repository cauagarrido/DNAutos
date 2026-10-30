import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSearch } from './components/hero/HeroSearch';
import { ReportContainer } from './components/report/ReportContainer';
import { MyQueriesDrawer } from './components/history/MyQueriesDrawer';
import { useVehicleQuery } from './hooks/useVehicleQuery';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/auth/AuthModal';
import { vehicleApi } from './services/api';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlate, setPendingPlate] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const paymentStarted = useRef<string | null>(null);
  const {
    step,
    plate,
    setPlate,
    fullReport,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isLoading,
    history,
    error,
    handleSearch,
    handleFipeReport,
    handleSelectReportFromHistory,
    handleClearHistory,
    refreshHistory,
    handleResetToSearch,
  } = useVehicleQuery();

  const beginCheckout = useCallback(async (targetPlate: string) => {
    setCheckoutError(null);
    try {
      const checkout = await vehicleApi.createCheckout(targetPlate);
      window.location.assign(checkout.checkoutUrl);
    } catch (error: any) {
      setCheckoutError(error?.response?.data?.message || error.message || 'Não foi possível iniciar o pagamento.');
    }
  }, []);

  const requestPlateReport = useCallback((target?: string) => {
    const clean = (target || plate).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 7) return;
    if (!isAuthenticated) { setPendingPlate(clean); setAuthOpen(true); return; }
    void beginCheckout(clean);
  }, [beginCheckout, isAuthenticated, plate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('paymentId');
    if (!paymentId || !['sucesso', 'pendente'].includes(params.get('pagamento') || '') || !isAuthenticated) return;
    if (paymentStarted.current === paymentId) return;
    paymentStarted.current = paymentId;
    let active = true;
    setPaymentMessage('Confirmando o pagamento…');
    const check = async () => {
      for (let attempt = 0; attempt < 45 && active; attempt += 1) {
        try {
          const status = await vehicleApi.getCheckoutStatus(paymentId);
          if (status.reportToken && status.isPaid) {
            setPaymentMessage(null);
            const loaded = await handleSearch(status.plate, status.reportToken);
            if (loaded) window.history.replaceState({}, '', window.location.pathname);
            else setPaymentMessage('Pagamento confirmado. O relatório não carregou; recarregue a página para tentar novamente.');
            return;
          }
          if (status.status === 'rejected') { setPaymentMessage('O pagamento não foi aprovado. Você pode iniciar uma nova consulta.'); return; }
        } catch { /* a confirmação pode chegar alguns segundos depois do retorno do gateway */ }
        await new Promise((resolve) => window.setTimeout(resolve, 4000));
      }
      if (active) setPaymentMessage('Ainda aguardamos a confirmação do pagamento. Recarregue esta página em instantes para tentar novamente.');
    };
    void check();
    return () => { active = false; };
  }, [handleSearch, isAuthenticated]);

  const isDarkTheme = step === 'SEARCH';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isDarkTheme
        ? 'bg-[#0B1320] text-white selection:bg-[#FF6A00] selection:text-white'
          : 'bg-[#F6F7F5] text-slate-800 selection:bg-orange-600 selection:text-white'
      }`}
    >
      {/* 1. Header */}
      <Navbar
        theme={isDarkTheme ? 'dark' : 'light'}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={history.length}
        onResetToHome={handleResetToSearch}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* 2. Conteúdo Principal */}
      <main className="flex-1">
        {step === 'SEARCH' && (
          <HeroSearch
            plate={plate}
            setPlate={setPlate}
            onSearch={requestPlateReport}
            onFipeResult={handleFipeReport}
            isLoading={isLoading}
            error={checkoutError || error}
          />
        )}

        {step === 'REPORT' && fullReport && (
          <ReportContainer
            report={fullReport}
            onNewSearch={handleResetToSearch}
          />
        )}
      </main>

      {/* 3. Gaveta de Histórico */}
      <MyQueriesDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onSelectReport={handleSelectReportFromHistory}
        onClearHistory={handleClearHistory}
      />

      {/* 4. Rodapé */}
      <Footer theme={isDarkTheme ? 'dark' : 'light'} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); void refreshHistory(); if (pendingPlate) void beginCheckout(pendingPlate); }} />
      {paymentMessage && <div role="status" className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl bg-[#0B1320] border border-orange-500/50 px-5 py-4 text-sm text-white shadow-xl">{paymentMessage}</div>}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
