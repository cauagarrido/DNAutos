import React, { useState } from 'react';
import { FileText, ShieldCheck, Crosshair, Shield, ArrowRight, Lock, AlertCircle, ScanLine, ListFilter } from 'lucide-react';
import { FipeSearchForm } from './FipeSearchForm';
import { FipeVehicleData, VehicleKind } from '../../services/fipeService';

type SearchTab = 'placa' | 'fipe';
interface HeroSearchProps {
  plate: string;
  setPlate: (plate: string) => void;
  onSearch: (customPlate?: string) => void;
  onFipeResult: (data: FipeVehicleData, tipo: VehicleKind) => void;
  isLoading: boolean;
  error?: string | null;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ plate, setPlate, onSearch, onFipeResult, isLoading, error }) => {
  const [tab, setTab] = useState<SearchTab>('placa');
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7));

  const features = [
    { icon: <FileText className="w-[18px] h-[18px]" />, title: 'Histórico', detail: 'veicular' },
    { icon: <ShieldCheck className="w-[18px] h-[18px]" />, title: 'Situação', detail: 'documental' },
    { icon: <Crosshair className="w-[18px] h-[18px]" />, title: 'Quilometragem', detail: 'e manutenção' },
    { icon: <Shield className="w-[18px] h-[18px]" />, title: 'Leilão', detail: 'e sinistros' },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-[#F6F7F5] text-[#0B1320]">
      <div className="absolute inset-0 -z-20 bg-cover bg-[center_58%] opacity-[0.2]" style={{ backgroundImage: "url('/dnautos-hero-light.png')" }} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#F6F7F5]/95 via-[#F6F7F5]/80 to-[#F6F7F5]/45" />
      <div className="pointer-events-none absolute -top-40 -left-32 -z-10 h-[32rem] w-[32rem] rounded-full bg-white/80 blur-[100px]" />
      <div className="pointer-events-none absolute top-40 right-[-8rem] -z-10 h-[25rem] w-[25rem] rounded-full bg-orange-200/35 blur-[110px]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="lg:col-span-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-3.5 py-2 text-[10px] font-bold tracking-[0.17em] text-slate-600 shadow-sm backdrop-blur-xl sm:text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#FF6A00]" /> DNAUTOS VISTORIAS · INFORMAÇÃO VEICULAR
          </div>

          <h1 className="max-w-2xl text-[2.65rem] font-extrabold leading-[1.04] tracking-[-0.055em] text-[#0B1320] sm:text-6xl lg:text-[4.4rem]">
            Mais informação.<br />
            Mais <span className="text-[#F06400]">segurança</span><br />
            para o seu próximo destino.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            O DNA completo do seu veículo. Consulte histórico, situação documental, quilometragem e muito mais antes de decidir.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-white/90 bg-white/55 px-3 py-4 text-center shadow-[0_8px_28px_rgba(21,35,52,.06)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/85">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F06400] ring-1 ring-orange-100/80">{feature.icon}</div>
                <span className="block text-[11px] font-bold text-slate-800">{feature.title}</span>
                <span className="block text-[10px] text-slate-500">{feature.detail}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Lock className="h-3.5 w-3.5 text-[#F06400]" /> Conta protegida · Pagamento confirmado antes da liberação do relatório
          </div>
        </div>

        <div className="lg:col-span-6 lg:pl-4">
          <div className="mx-auto w-full max-w-[31rem] rounded-[2rem] border border-white/90 bg-white/65 p-2 shadow-[0_30px_100px_rgba(22,34,50,.14)] backdrop-blur-2xl ring-1 ring-slate-900/[0.035]">
            <div className="overflow-hidden rounded-[1.55rem] bg-white/75">
              <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E65B00]">Consulta segura</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-[#0B1320]">Descubra o histórico do veículo</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[#F06400] ring-1 ring-orange-100"><ScanLine className="h-5 w-5" /></div>
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-full border border-slate-200/70 bg-slate-100/75 p-1 mx-5 mt-5 sm:mx-6">
                <button type="button" onClick={() => setTab('placa')} className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-bold transition ${tab === 'placa' ? 'bg-white text-[#0B1320] shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}>
                  <ScanLine className="h-3.5 w-3.5" /> Por placa
                </button>
                <button type="button" onClick={() => setTab('fipe')} className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-bold transition ${tab === 'fipe' ? 'bg-white text-[#0B1320] shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}>
                  <ListFilter className="h-3.5 w-3.5" /> Tabela FIPE
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {tab === 'placa' ? (
                  <div>
                    <label htmlFor="plate-input" className="mb-2 block text-xs font-semibold text-slate-600">Placa do veículo</label>
                    <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-inner shadow-slate-100 transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100/70">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#003399] text-white">
                        <span className="text-[8px] leading-none text-yellow-300">★</span><span className="mt-0.5 text-[10px] font-black tracking-wider">BR</span>
                      </div>
                      <input id="plate-input" type="text" value={plate} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && onSearch()} placeholder="ABC1D23" maxLength={7} aria-label="Digite a placa do veículo" className="min-w-0 flex-1 bg-transparent px-3 text-center font-mono text-2xl font-black uppercase tracking-[0.22em] text-[#0B1320] outline-none placeholder:text-slate-300 sm:text-3xl" />
                      <span className="mr-3 hidden rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-semibold text-slate-400 sm:block">MERCOSUL</span>
                    </div>

                    <button type="button" onClick={() => onSearch()} disabled={isLoading || plate.length < 7} id="search-plate-btn" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#FF8126] to-[#F06400] py-3.5 text-sm font-bold text-white shadow-[0_9px_20px_rgba(240,100,0,.23)] ring-1 ring-orange-600/15 transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(240,100,0,.27)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">
                      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><ArrowRight className="h-4 w-4" /> Consultar veículo</>}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-slate-500">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" /> Faça login e conclua o pagamento para liberar o relatório completo.
                    </div>
                    {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3 text-xs font-medium text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
                  </div>
                ) : (
                  <div>
                    <h3 className="mb-1 text-base font-bold text-[#0B1320]">Consultar Tabela FIPE</h3>
                    <p className="mb-4 text-xs text-slate-500">Pesquise por categoria, marca, modelo e ano.</p>
                    <FipeSearchForm onResult={onFipeResult} isLoading={isLoading} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 border-t border-slate-200/60 bg-white/45 py-3 text-[10px] font-medium text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-[#F06400]" /> DNAutos Vistorias · Informação para decidir com confiança
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
