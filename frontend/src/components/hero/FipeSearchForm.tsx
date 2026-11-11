import React, { useState, useEffect } from "react";
import { ChevronDown, Loader2, Search, AlertCircle } from "lucide-react";
import {
  fipeService,
  VehicleKind,
  FipeBrand,
  FipeModelItem,
  FipeYearItem,
  FipeVehicleData,
} from "../../services/fipeService";
import { errorMessage } from "../../services/http";

interface FipeSearchFormProps {
  onResult: (data: FipeVehicleData, tipo: VehicleKind) => void;
}

const KIND_OPTIONS: { value: VehicleKind; label: string; emoji: string }[] = [
  { value: "carros", label: "Carro", emoji: "🚗" },
  { value: "motos", label: "Moto", emoji: "🏍️" },
  { value: "caminhoes", label: "Caminhão", emoji: "🚛" },
];

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  isLoading,
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-slate-600 block">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="glass-control w-full appearance-none rounded-xl px-3 py-2.5 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <option value="" className="text-slate-400">
          {isLoading ? "Carregando…" : placeholder}
        </option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="text-slate-900 bg-white"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </div>
  </div>
);

export const FipeSearchForm: React.FC<FipeSearchFormProps> = ({ onResult }) => {
  const [tipo, setTipo] = useState<VehicleKind>("carros");

  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [models, setModels] = useState<FipeModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);

  const [years, setYears] = useState<FipeYearItem[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loadingYears, setLoadingYears] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Step 1 — load brands when tipo changes
  useEffect(() => {
    let active = true;
    setLoadingBrands(true);
    setError(null);

    fipeService
      .getBrands(tipo)
      .then((data) => {
        if (active) setBrands(data);
      })
      .catch((error) => {
        if (active)
          setError(
            errorMessage(
              error,
              "Não foi possível carregar as marcas. Tente novamente em instantes.",
            ),
          );
      })
      .finally(() => {
        if (active) setLoadingBrands(false);
      });
    return () => {
      active = false;
    };
  }, [tipo]);

  // Step 2 — load models when brand changes
  useEffect(() => {
    let active = true;
    setLoadingModels(false);
    if (!selectedBrand) return;
    setLoadingModels(true);
    setError(null);

    fipeService
      .getModels(tipo, selectedBrand)
      .then((res) => {
        if (active) setModels(res.modelos);
      })
      .catch((error) => {
        if (active)
          setError(
            errorMessage(
              error,
              "Não foi possível carregar os modelos. Tente novamente.",
            ),
          );
      })
      .finally(() => {
        if (active) setLoadingModels(false);
      });
    return () => {
      active = false;
    };
  }, [selectedBrand, tipo]);

  // Step 3 — load years when model changes
  useEffect(() => {
    let active = true;
    setLoadingYears(false);
    if (!selectedModel) return;
    setLoadingYears(true);
    setError(null);

    fipeService
      .getYears(tipo, selectedBrand, selectedModel)
      .then((data) => {
        if (active) setYears(data);
      })
      .catch((error) => {
        if (active)
          setError(
            errorMessage(
              error,
              "Não foi possível carregar os anos. Tente novamente.",
            ),
          );
      })
      .finally(() => {
        if (active) setLoadingYears(false);
      });
    return () => {
      active = false;
    };
  }, [selectedModel, selectedBrand, tipo]);

  const handleConsult = async () => {
    if (!selectedBrand || !selectedModel || !selectedYear || queryLoading)
      return;
    setQueryLoading(true);
    setError(null);
    try {
      const data = await fipeService.getVehicleData(
        tipo,
        selectedBrand,
        selectedModel,
        selectedYear,
      );
      onResult(data, tipo);
    } catch (error) {
      setError(
        errorMessage(
          error,
          "Não foi possível consultar o valor FIPE. Tente novamente.",
        ),
      );
    } finally {
      setQueryLoading(false);
    }
  };

  const canConsult =
    !!selectedBrand &&
    !!selectedModel &&
    !!selectedYear &&
    !loadingBrands &&
    !loadingModels &&
    !loadingYears &&
    !queryLoading;

  return (
    <div className="space-y-4">
      {/* Indicador dos 4 passos da API FIPE (Parallelum) */}
      <div className="glass-control flex items-center justify-between rounded-xl px-2 py-2 text-[10px] text-slate-500 font-medium mb-3">
        <span className={selectedBrand ? "text-orange-400 font-bold" : ""}>
          1. Marca
        </span>
        <span>→</span>
        <span className={selectedModel ? "text-orange-400 font-bold" : ""}>
          2. Modelo
        </span>
        <span>→</span>
        <span className={selectedYear ? "text-orange-400 font-bold" : ""}>
          3. Ano
        </span>
        <span>→</span>
        <span className={canConsult ? "text-orange-400 font-bold" : ""}>
          4. Valor
        </span>
      </div>

      {/* Tipo de veículo — botões */}
      <div>
        <span className="text-xs font-semibold text-slate-600 block mb-2">
          Tipo de veículo
        </span>
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Tipo de veículo"
        >
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={tipo === opt.value}
              disabled={queryLoading}
              onClick={() => {
                if (tipo === opt.value) return;
                setTipo(opt.value);
                setBrands([]);
                setSelectedBrand("");
                setModels([]);
                setSelectedModel("");
                setYears([]);
                setSelectedYear("");
                setError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                tipo === opt.value
                  ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-md shadow-orange-500/20"
                  : "bg-white/65 text-slate-600 border-slate-200 hover:border-orange-300"
              }`}
            >
              <span className="block text-base leading-none mb-0.5">
                {opt.emoji}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Marca */}
      <SelectField
        id="fipe-brand"
        label="Marca"
        value={selectedBrand}
        onChange={(value) => {
          setSelectedBrand(value);
          setModels([]);
          setSelectedModel("");
          setYears([]);
          setSelectedYear("");
          setError(null);
        }}
        options={brands.map((b) => ({ value: b.codigo, label: b.nome }))}
        placeholder="Selecione a marca"
        isLoading={loadingBrands}
        disabled={brands.length === 0 || queryLoading}
      />

      {/* Modelo */}
      <SelectField
        id="fipe-model"
        label="Modelo"
        value={selectedModel}
        onChange={(value) => {
          setSelectedModel(value);
          setYears([]);
          setSelectedYear("");
          setError(null);
        }}
        options={models.map((m) => ({
          value: String(m.codigo),
          label: m.nome,
        }))}
        placeholder={
          selectedBrand ? "Selecione o modelo" : "Selecione a marca primeiro"
        }
        isLoading={loadingModels}
        disabled={!selectedBrand || models.length === 0 || queryLoading}
      />

      {/* Ano */}
      <SelectField
        id="fipe-year"
        label="Ano / Combustível"
        value={selectedYear}
        onChange={setSelectedYear}
        options={years.map((y) => ({ value: y.codigo, label: y.nome }))}
        placeholder={
          selectedModel ? "Selecione o ano" : "Selecione o modelo primeiro"
        }
        isLoading={loadingYears}
        disabled={!selectedModel || years.length === 0 || queryLoading}
      />

      {/* Erro */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Botão consultar */}
      <button
        type="button"
        onClick={handleConsult}
        disabled={!canConsult}
        id="fipe-consult-btn"
        className="liquid-button w-full"
        aria-busy={queryLoading}
      >
        {queryLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Search className="w-4 h-4" />
            Consultar valor FIPE
          </>
        )}
      </button>
    </div>
  );
};
