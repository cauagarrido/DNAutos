import React, { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  AlertCircle,
  CarFront,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Fingerprint,
  LockKeyhole,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { FipeSearchForm } from "./FipeSearchForm";
import { FipeVehicleData, VehicleKind } from "../../services/fipeService";
import { LiquidGlass } from "../ui/LiquidGlass";

type SearchTab = "placa" | "fipe";
interface HeroSearchProps {
  plate: string;
  setPlate: (plate: string) => void;
  onSearch: (customPlate?: string) => void;
  onFipeResult: (data: FipeVehicleData, tipo: VehicleKind) => void;
  isLoading: boolean;
  error?: string | null;
}

export function HeroSearch({
  plate,
  setPlate,
  onSearch,
  onFipeResult,
  isLoading,
  error,
}: HeroSearchProps) {
  const [tab, setTab] = useState<SearchTab>("placa");
  const chooseTab = (next: SearchTab) => {
    setTab(next);
    window.requestAnimationFrame(() =>
      document.getElementById(`search-tab-${next}`)?.focus(),
    );
  };
  const changeTab = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      chooseTab(
        event.key === "Home"
          ? "placa"
          : event.key === "End"
            ? "fipe"
            : tab === "placa"
              ? "fipe"
              : "placa",
      );
    }
  };
  return (
    <section
      className="hero-section page-container"
      id="inicio"
      aria-labelledby="hero-title"
    >
      <div className="hero-copy">
        <div className="eyebrow-pill">
          <span className="status-dot" /> Informação que faz a diferença
        </div>
        <h1 id="hero-title">
          Seu próximo carro.
          <br />
          <span>Sem pontos cegos.</span>
        </h1>
        <p className="hero-description">
          Uma boa escolha começa com uma história bem contada. Conheça o passado
          do veículo antes de fazer parte do futuro dele.
        </p>
        <div className="hero-checklist">
          <span>
            <Check size={15} aria-hidden="true" /> Histórico veicular
          </span>
          <span>
            <Check size={15} aria-hidden="true" /> Situação documental
          </span>
          <span>
            <Check size={15} aria-hidden="true" /> Leilão e sinistro
          </span>
        </div>
        <div className="hero-bottom-line">
          <a href="#como-funciona" className="text-link">
            Entenda como funciona <ArrowDown size={15} aria-hidden="true" />
          </a>
          <span className="hero-separator" />
          <span className="hero-reassurance">
            <Fingerprint size={18} aria-hidden="true" /> Sua conta, protegida.
          </span>
        </div>
      </div>

      <div className="query-scene">
        <div className="vehicle-image-wrap">
          <img
            src="/dnautos-hero-light.png"
            className="vehicle-image"
            alt="Veículo prateado em um ambiente claro e moderno"
            fetchPriority="high"
            width="1672"
            height="941"
          />
          <div className="scene-glow" aria-hidden="true" />
          <LiquidGlass className="scene-label">
            <span className="scene-label-icon">
              <ShieldCheck size={18} />
            </span>
            <span>
              Mais informação.<strong>Mais tranquilidade.</strong>
            </span>
          </LiquidGlass>
          <span className="scene-caption">O DNA da sua próxima escolha.</span>
        </div>

        <LiquidGlass className="query-panel" id="consultar">
          <div className="query-panel-heading">
            <div>
              <span className="eyebrow">
                {tab === "placa" ? "COMECE PELA PLACA" : "CONSULTA GRATUITA"}
              </span>
              <h2>
                {tab === "placa"
                  ? "O que o carro tem a contar?"
                  : "Quanto vale o veículo?"}
              </h2>
            </div>
            <span className="query-price">
              {tab === "placa" ? (
                <>
                  <strong>
                    R$ 50<span>,00</span>
                  </strong>
                  <small>por placa</small>
                </>
              ) : (
                <>
                  <strong>Grátis</strong>
                  <small>sem login</small>
                </>
              )}
            </span>
          </div>
          <div
            className="segmented-control"
            role="tablist"
            aria-label="Tipo de consulta"
          >
            <span
              className={`segmented-indicator ${tab === "fipe" ? "is-second" : ""}`}
              aria-hidden="true"
            />
            <button
              id="search-tab-placa"
              type="button"
              role="tab"
              aria-selected={tab === "placa"}
              aria-controls="search-panel-placa"
              tabIndex={tab === "placa" ? 0 : -1}
              onClick={() => setTab("placa")}
              onKeyDown={changeTab}
            >
              <CarFront size={16} aria-hidden="true" /> Pela placa
            </button>
            <button
              id="search-tab-fipe"
              type="button"
              role="tab"
              aria-selected={tab === "fipe"}
              aria-controls="search-panel-fipe"
              tabIndex={tab === "fipe" ? 0 : -1}
              onClick={() => setTab("fipe")}
              onKeyDown={changeTab}
            >
              <SlidersHorizontal size={15} aria-hidden="true" /> Tabela FIPE
            </button>
          </div>

          {tab === "placa" ? (
            <form
              id="search-panel-placa"
              role="tabpanel"
              aria-labelledby="search-tab-placa"
              onSubmit={(event) => {
                event.preventDefault();
                if (!isLoading) onSearch();
              }}
            >
              <label className="field-label" htmlFor="plate-input">
                Qual é a placa do veículo?
              </label>
              <div className="plate-field">
                <span className="plate-emblem" aria-hidden="true">
                  <span>BRASIL</span>
                  <CarFront size={21} />
                  <small>BR</small>
                </span>
                <input
                  id="plate-input"
                  name="plate"
                  type="text"
                  value={plate}
                  onChange={(event) =>
                    setPlate(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 7),
                    )
                  }
                  placeholder="ABC1D23"
                  maxLength={7}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-label="Digite a placa do veículo"
                  aria-describedby={
                    error ? "plate-hint plate-error" : "plate-hint"
                  }
                  aria-invalid={!!error}
                  disabled={isLoading}
                />
                <Search
                  className="plate-search-icon"
                  size={20}
                  aria-hidden="true"
                />
              </div>
              <p className="field-hint" id="plate-hint">
                Placa antiga ou Mercosul. Sem espaços ou traços.
              </p>
              {error && (
                <div
                  id="plate-error"
                  role="alert"
                  className="notice notice-error"
                >
                  <AlertCircle size={17} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
              <button
                className="liquid-button query-submit"
                type="submit"
                disabled={isLoading || plate.length !== 7}
                aria-label="Consultar veículo · R$ 50,00"
              >
                {isLoading ? (
                  <>
                    <span className="button-spinner" /> Aguarde…
                  </>
                ) : (
                  <>
                    Consultar veículo{" "}
                    <span className="button-trailing">
                      <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </>
                )}
              </button>
              <p className="query-payment-note">
                <LockKeyhole size={12} aria-hidden="true" /> Você confirma a
                compra antes de pagar.
              </p>
            </form>
          ) : (
            <div
              id="search-panel-fipe"
              role="tabpanel"
              aria-labelledby="search-tab-fipe"
              className="fipe-panel"
            >
              <p className="field-hint">
                Compare o valor de referência por marca, modelo e ano. Grátis e
                sem criar conta.
              </p>
              <FipeSearchForm onResult={onFipeResult} />
            </div>
          )}
          {tab === "placa" ? (
            <div className="query-panel-footer">
              <span>
                <ShieldCheck size={14} aria-hidden="true" /> Pagamento no
                Mercado Pago
              </span>
              <span>
                Pix e cartões <ChevronRight size={12} aria-hidden="true" />
              </span>
            </div>
          ) : (
            <div className="query-panel-footer">
              <span>
                <ChartNoAxesCombined size={14} aria-hidden="true" /> Preço médio
                de referência
              </span>
              <span>Sem cobrança</span>
            </div>
          )}
        </LiquidGlass>
      </div>
    </section>
  );
}
