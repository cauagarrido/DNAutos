import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Search, AlertCircle } from 'lucide-react';
import {
  fipeService,
  VehicleKind,
  FipeBrand,
  FipeModelItem,
  FipeYearItem,
  FipeVehicleData,
} from '../../services/fipeService';

interface FipeSearchFormProps {
  onResult: (data: FipeVehicleData, tipo: VehicleKind) => void;
  isLoading?: boolean;
}

const KIND_OPTIONS: { value: VehicleKind; label: string; emoji: string }[] = [
  { value: 'carros', label: 'Carro', emoji: '🚗' },
  { value: 'motos', label: 'Moto', emoji: '🏍️' },
  { value: 'caminhoes', label: 'Caminhão', emoji: '🚛' },
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
    <label htmlFor={id} className="text-xs font-semibold text-slate-300 block">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="w-full appearance-none bg-[#0f1e35] border border-slate-600/70 rounded-xl px-3 py-2.5 pr-9 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <option value="" className="text-slate-400">
          {isLoading ? 'Carregando…' : placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-white bg-[#0f1e35]">
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

export const FipeSearchForm: React.FC<FipeSearchFormProps> = ({ onResult, isLoading: parentLoading }) => {
  const [tipo, setTipo] = useState<VehicleKind>('carros');

  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [models, setModels] = useState<FipeModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);

  const [years, setYears] = useState<FipeYearItem[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loadingYears, setLoadingYears] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Step 1 — load brands when tipo changes
  useEffect(() => {
    setLoadingBrands(true);
    setSelectedBrand('');
    setModels([]);
    setSelectedModel('');
    setYears([]);
    setSelectedYear('');
    setError(null);

    fipeService
      .getBrands(tipo)
      .then(setBrands)
      .catch(() => setError('Falha ao carregar marcas. Verifique sua conexão.'))
      .finally(() => setLoadingBrands(false));
  }, [tipo]);

  // Step 2 — load models when brand changes
  useEffect(() => {
    if (!selectedBrand) return;
    setLoadingModels(true);
    setSelectedModel('');
    setYears([]);
    setSelectedYear('');
    setError(null);

    fipeService
      .getModels(tipo, selectedBrand)
      .then((res) => setModels(res.modelos))
      .catch(() => setError('Falha ao carregar modelos.'))
      .finally(() => setLoadingModels(false));
  }, [selectedBrand]);

  // Step 3 — load years when model changes
  useEffect(() => {
    if (!selectedModel) return;
    setLoadingYears(true);
    setSelectedYear('');
    setError(null);

    fipeService
      .getYears(tipo, selectedBrand, selectedModel)
      .then(setYears)
      .catch(() => setError('Falha ao carregar anos.'))
      .finally(() => setLoadingYears(false));
  }, [selectedModel]);

  const handleConsult = async () => {
    if (!selectedBrand || !selectedModel || !selectedYear) return;
    setError(null);
    try {
      const data = await fipeService.getVehicleData(
        tipo,
        selectedBrand,
        selectedModel,
        selectedYear
      );
      onResult(data, tipo);
    } catch {
      setError('Não foi possível consultar o valor FIPE. Tente novamente.');
    }
  };

  const canConsult = !!selectedBrand && !!selectedModel && !!selectedYear && !parentLoading;

  return (
    <div className="space-y-4">
      {/* Indicador dos 4 passos da API FIPE (Parallelum) */}
      <div className="flex items-center justify-between px-1 py-1.5 bg-[#0f1a2e] rounded-lg border border-slate-700/60 text-[10px] text-slate-400 font-medium mb-3">
        <span className={selectedBrand ? 'text-orange-400 font-bold' : ''}>1. Marca</span>
        <span>→</span>
        <span className={selectedModel ? 'text-orange-400 font-bold' : ''}>2. Modelo</span>
        <span>→</span>
        <span className={selectedYear ? 'text-orange-400 font-bold' : ''}>3. Ano</span>
        <span>→</span>
        <span className={canConsult ? 'text-orange-400 font-bold' : ''}>4. Valor</span>
      </div>

      {/* Tipo de veículo — botões */}
      <div>
        <span className="text-xs font-semibold text-slate-300 block mb-2">Tipo de veículo</span>
        <div className="grid grid-cols-3 gap-2">
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTipo(opt.value)}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                tipo === opt.value
                  ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-[#0f1e35] text-slate-300 border-slate-600/70 hover:border-orange-500/40'
              }`}
            >
              <span className="block text-base leading-none mb-0.5">{opt.emoji}</span>
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
        onChange={setSelectedBrand}
        options={brands.map((b) => ({ value: b.codigo, label: b.nome }))}
        placeholder="Selecione a marca"
        isLoading={loadingBrands}
        disabled={brands.length === 0}
      />

      {/* Modelo */}
      <SelectField
        id="fipe-model"
        label="Modelo"
        value={selectedModel}
        onChange={setSelectedModel}
        options={models.map((m) => ({ value: String(m.codigo), label: m.nome }))}
        placeholder={selectedBrand ? 'Selecione o modelo' : 'Selecione a marca primeiro'}
        isLoading={loadingModels}
        disabled={!selectedBrand || models.length === 0}
      />

      {/* Ano */}
      <SelectField
        id="fipe-year"
        label="Ano / Combustível"
        value={selectedYear}
        onChange={setSelectedYear}
        options={years.map((y) => ({ value: y.codigo, label: y.nome }))}
        placeholder={selectedModel ? 'Selecione o ano' : 'Selecione o modelo primeiro'}
        isLoading={loadingYears}
        disabled={!selectedModel || years.length === 0}
      />

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Botão consultar */}
      <button
        type="button"
        onClick={handleConsult}
        disabled={!canConsult}
        id="fipe-consult-btn"
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-2"
      >
        {parentLoading ? (
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
