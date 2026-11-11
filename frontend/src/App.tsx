import { useCallback, useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HeroSearch } from "./components/hero/HeroSearch";
import { ReportContainer } from "./components/report/ReportContainer";
import { FipeResult } from "./components/report/FipeResult";
import { MyQueriesDrawer } from "./components/history/MyQueriesDrawer";
import { useVehicleQuery } from "./hooks/useVehicleQuery";
import { AuthModal, EmailLink } from "./components/auth/AuthModal";
import { vehicleApi } from "./services/api";
import { errorMessage } from "./services/http";
import { Modal } from "./components/ui/Modal";
import { HomeSections } from "./components/home/HomeSections";
import { GlassEffects } from "./components/ui/LiquidGlass";
import {
  Info,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  FileCheck2,
} from "lucide-react";
function AppContent() {
  const {
    isAuthenticated,
    session,
    config,
    loading: authLoading,
    authError,
  } = useAuth();
  const [emailLink, setEmailLink] = useState<EmailLink | null>(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1)),
      type = hash.get("type"),
      tokenHash = hash.get("token_hash");
    return tokenHash && (type === "signup" || type === "recovery")
      ? { tokenHash, type }
      : null;
  });
  const [authOpen, setAuthOpen] = useState(false),
    [checkoutPlate, setCheckoutPlate] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false),
    [checkoutError, setCheckoutError] = useState<string | null>(null),
    [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const key = useRef<{ plate: string; key: string } | null>(null);
  const query = useVehicleQuery();
  useEffect(() => {
    if (window.location.hash)
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.search,
      );
    const state = new URLSearchParams(window.location.search).get("auth");
    if (state === "error" || state === "locked") {
      setAuthOpen(true);
      setCheckoutError(
        state === "locked"
          ? "Acesso bloqueado. Use a recuperação por e-mail."
          : "Não foi possível entrar com o Google. Tente novamente.",
      );
    }
  }, []);
  const requestPlateReport = useCallback(
    (target?: string) => {
      const plate = (target || query.plate).replace(/[-\s]/g, "").toUpperCase();
      if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate)) {
        setCheckoutError("Informe uma placa válida, como ABC1234 ou ABC1D23.");
        return;
      }
      setCheckoutError(null);
      if (!isAuthenticated) {
        setAuthOpen(true);
        return;
      }
      setCheckoutPlate(plate);
    },
    [isAuthenticated, query.plate],
  );
  const beginCheckout = async () => {
    if (!checkoutPlate || checkoutBusy) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    if (key.current?.plate !== checkoutPlate)
      key.current = { plate: checkoutPlate, key: crypto.randomUUID() };
    try {
      const checkout = await vehicleApi.createCheckout(
        checkoutPlate,
        key.current.key,
      );
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setCheckoutError(errorMessage(error));
      setCheckoutBusy(false);
    }
  };
  const openOrder = useCallback(
    async (id: string) => {
      const loaded = await query.handleSearch(id);
      if (loaded) {
        query.setIsHistoryDrawerOpen(false);
        setPaymentMessage(null);
        window.history.replaceState({}, "", window.location.pathname);
      } else
        throw new Error(
          "Não foi possível abrir a consulta. A compra foi preservada; atualize o histórico ou fale com o suporte.",
        );
    },
    [query.handleSearch],
  );
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (!orderId || !isAuthenticated) return;
    let active = true,
      timer: number | undefined,
      attempt = 0;
    const check = async () => {
      try {
        const status = await vehicleApi.getCheckoutStatus(orderId);
        if (!active) return;
        if (status.isPaid) {
          setPaymentMessage(
            "Pagamento confirmado. Sua consulta está disponível no histórico de compras.",
          );
          return;
        }
        if (
          ["rejected", "cancelled", "refunded", "charged_back"].includes(
            status.status,
          )
        ) {
          setPaymentMessage(
            "Pagamento encerrado. Confira o histórico de compras.",
          );
          return;
        }
        setPaymentMessage(
          "Aguardando confirmação do Mercado Pago. Você pode acompanhar pelo histórico de compras.",
        );
        if (attempt++ < 60) timer = window.setTimeout(() => void check(), 5000);
      } catch (error) {
        if (active) setPaymentMessage(errorMessage(error));
      }
    };
    void check();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isAuthenticated]);
  const needsAuth = !!session && (session.mfaRequired || session.recovery);
  const navigateSection = (id: string) => {
    query.handleResetToSearch();
    window.requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      }),
    );
  };
  return (
    <div className="app-shell min-h-screen flex flex-col font-sans antialiased text-[#0B1320]">
      <a href="#main-content" className="skip-link">
        Ir para o conteúdo
      </a>
      <GlassEffects />
      <Navbar
        onOpenHistory={() => {
          if (isAuthenticated) query.setIsHistoryDrawerOpen(true);
          else setAuthOpen(true);
        }}
        historyCount={query.history.length}
        onResetToHome={query.handleResetToSearch}
        onOpenAuth={() => setAuthOpen(true)}
        onNavigateSection={navigateSection}
      />
      {authError && (
        <p role="status" className="site-notice site-notice-warning">
          {authError}
        </p>
      )}
      {config && !config.checkoutAvailable && (
        <p role="status" className="site-notice">
          <Info size={13} aria-hidden="true" />
          <span>
            Consultas por placa em preparação. Novas consultas serão liberadas
            em breve.
          </span>
        </p>
      )}
      {paymentMessage && (
        <div role="status" className="site-notice site-notice-success">
          {paymentMessage}
          <button
            onClick={() => query.setIsHistoryDrawerOpen(true)}
            className="ml-3 underline font-bold"
          >
            Ver compras
          </button>
        </div>
      )}
      <main className="flex-1" id="main-content" tabIndex={-1}>
        {query.step === "SEARCH" && (
          <>
            <HeroSearch
              plate={query.plate}
              setPlate={query.setPlate}
              onSearch={requestPlateReport}
              onFipeResult={query.handleFipeReport}
              isLoading={query.isLoading || checkoutBusy || authLoading}
              error={checkoutError || query.error}
            />
            <HomeSections />
          </>
        )}
        {query.step === "REPORT" && query.fullReport && (
          <ReportContainer
            report={query.fullReport}
            onNewSearch={query.handleResetToSearch}
          />
        )}
        {query.step === "FIPE" && query.fipeResult && (
          <FipeResult
            data={query.fipeResult.data}
            tipo={query.fipeResult.tipo}
            onNewSearch={query.handleResetToSearch}
          />
        )}
      </main>
      <MyQueriesDrawer
        isOpen={query.isHistoryDrawerOpen}
        onClose={() => query.setIsHistoryDrawerOpen(false)}
        onOpenOrder={openOrder}
      />
      <Footer onNavigateSection={navigateSection} />
      {config?.supportUrl && (
        <a
          href={config.supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="support-fab no-print"
        >
          <MessageCircle size={17} aria-hidden="true" /> Ajuda e estorno
        </a>
      )}
      <AuthModal
        isOpen={authOpen || needsAuth || !!emailLink}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          query.handleResetToSearch();
        }}
        emailLink={emailLink}
        onLinkConsumed={() => setEmailLink(null)}
      />
      <Modal
        isOpen={!!checkoutPlate}
        onClose={() => {
          if (!checkoutBusy) setCheckoutPlate(null);
        }}
        title="Confirmar compra"
      >
        <div>
          <div className="checkout-summary">
            <div>
              <span className="eyebrow">SUA CONSULTA</span>
              <strong className="checkout-plate">{checkoutPlate}</strong>
            </div>
            <div className="checkout-total">
              R$ 50,00<small>Uma placa. Uma consulta.</small>
            </div>
          </div>
          <p className="checkout-description">
            <CreditCard size={18} aria-hidden="true" />
            <span>
              Pague com Pix ou cartão no Mercado Pago. O QR Code Pix é gerado
              pelo gateway para este pagamento. Os meios disponíveis dependem da
              sua conta e do gateway.
            </span>
          </p>
          <p className="checkout-description">
            <FileCheck2 size={18} aria-hidden="true" />
            <span>
              Após a confirmação, realize a consulta pelo histórico de compras.
              A compra vale para esta placa.
            </span>
          </p>
          {checkoutError && (
            <p role="alert" className="notice notice-error mb-4">
              {checkoutError}
            </p>
          )}
          <button
            disabled={checkoutBusy || !config?.checkoutAvailable}
            onClick={() => void beginCheckout()}
            className="liquid-button w-full mt-2"
          >
            {checkoutBusy
              ? "Abrindo pagamento…"
              : config?.checkoutAvailable
                ? "Pagar R$ 50,00 no Mercado Pago"
                : "Pagamentos ainda indisponíveis"}
          </button>
          <p className="query-payment-note">
            <ShieldCheck size={13} aria-hidden="true" /> Pagamento no ambiente
            do Mercado Pago.
          </p>
          {config?.supportUrl && (
            <a
              className="block text-center text-xs underline"
              href={config.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com o suporte
            </a>
          )}
        </div>
      </Modal>
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
