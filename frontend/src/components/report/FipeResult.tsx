import { ArrowLeft, ChartNoAxesCombined, Info } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import type { FipeVehicleData, VehicleKind } from "../../services/fipeService";
import { LiquidGlass } from "../ui/LiquidGlass";

export function FipeResult({
  data,
  tipo,
  onNewSearch,
}: {
  data: FipeVehicleData;
  tipo: VehicleKind;
  onNewSearch: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className="page-container py-10 sm:py-16"
      aria-labelledby="fipe-result-title"
    >
      <button
        type="button"
        className="text-link mb-7 min-h-11"
        onClick={onNewSearch}
      >
        <ArrowLeft size={17} aria-hidden="true" /> Voltar
      </button>
      <LiquidGlass className="rounded-[28px] p-6 sm:p-10 max-w-3xl mx-auto">
        <span className="eyebrow">TABELA FIPE · CONSULTA GRATUITA</span>
        <h1
          ref={heading}
          tabIndex={-1}
          id="fipe-result-title"
          className="text-2xl sm:text-4xl font-bold mt-4"
        >
          {data.Modelo}
        </h1>
        <p className="text-slate-600 mt-2">
          {data.Marca} · {data.AnoModelo} · {data.Combustivel}
        </p>
        <div className="glass-card rounded-2xl p-5 sm:p-7 my-7">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <ChartNoAxesCombined size={19} aria-hidden="true" /> Valor de
            referência
          </p>
          <p className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-3">
            {data.Valor}
          </p>
          <p className="text-sm text-slate-600 mt-3">
            Referência: {data.MesReferencia}
          </p>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div>
            <dt className="text-slate-600">Código FIPE</dt>
            <dd className="font-semibold mt-1">{data.CodigoFipe}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Tipo de veículo</dt>
            <dd className="font-semibold mt-1">
              {{ carros: "Carro", motos: "Moto", caminhoes: "Caminhão" }[tipo]}
            </dd>
          </div>
        </dl>
        <p className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed mt-7">
          <Info size={19} className="flex-none mt-0.5" aria-hidden="true" />A
          FIPE informa um preço médio de referência. Esta consulta é gratuita,
          não exige conta e não verifica histórico, débitos ou restrições de uma
          placa. O preço real depende das condições do veículo.
        </p>
      </LiquidGlass>
    </section>
  );
}
