import React, { useState } from 'react';
import { FullVehicleReport } from '../../types/vehicle';
import {
  ArrowLeft,
  ShieldCheck,
  Check,
  Car,
  FileCheck2,
  Gavel,
  ShieldAlert,
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle2,
  Search,
  Info,
} from 'lucide-react';
import { InspectionModal } from '../cta/InspectionModal';
import { vehicleApi } from '../../services/api';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ReportContainerProps {
  report: FullVehicleReport;
  onNewSearch: () => void;
}

export const ReportContainer: React.FC<ReportContainerProps> = ({
  report,
  onNewSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'historico' | 'documentacao' | 'vistoria' | 'resumo'>('historico');

  // Modais de ação
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [isAllDataModalOpen, setIsAllDataModalOpen] = useState(false);
  const [isFullAuditModalOpen, setIsFullAuditModalOpen] = useState(false);

  // Estado do formulário de seguro
  const [insuranceForm, setInsuranceForm] = useState({
    name: '',
    phone: '',
    zipCode: '',
  });
  const [insuranceProtocol, setInsuranceProtocol] = useState<string | null>(null);
  const [isInsuranceLoading, setIsInsuranceLoading] = useState(false);

  const handleInsuranceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInsuranceLoading(true);
    try {
      const res = await vehicleApi.requestInsuranceQuote({
        plate: report.basicInfo.plate,
        email: 'contato@cliente.com',
        usageType: 'Trabalho / Dia a Dia',
        ...insuranceForm,
      });
      setInsuranceProtocol(res.protocol);
      try {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsInsuranceLoading(false);
    }
  };

  const basic = report.basicInfo;
  const risks = report.risks;
  const financial = report.financial;
  const cadastral = report.cadastral;

  /** True quando o relatório veio da API FIPE (sem consulta de placa) */
  const isFipeOnly = basic.plate === 'FIPE';

  // Cálculo da circunferência para o anel de Score circular (raio 36)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = risks.riskScore ?? 0;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="w-full min-h-screen bg-[#e8ecf2] text-slate-800 pb-20 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* 1. Botão Superior de Retorno (<- Voltar) */}
        <div className="flex items-center justify-between">
          <button
            onClick={onNewSearch}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-300/50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
            Consulta gerada em {new Date(report.consultedAt).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* 2. Barra de Abas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2">
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'historico'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
            }`}
          >
            Histórico veicular
          </button>

          <button
            onClick={() => {
              setActiveTab('documentacao');
              setIsAllDataModalOpen(true);
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'documentacao'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
            }`}
          >
            Documentação
          </button>

          <button
            onClick={() => {
              setActiveTab('vistoria');
              setIsInspectionModalOpen(true);
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vistoria'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
            }`}
          >
            Vistoria cautelar
          </button>

          <button
            onClick={() => {
              setActiveTab('resumo');
              setIsFullAuditModalOpen(true);
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'resumo'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
            }`}
          >
            Resumo
          </button>
        </div>

        {/* 3. Grade Principal de 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Card 1: "Dados do veículo" */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Dados do veículo
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Marca</span>
                  <span className="font-semibold text-slate-900">{basic.brand}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Modelo</span>
                  <span className="font-semibold text-slate-900">{basic.model.replace(/LIMITED.*/i, '').trim()}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Versão</span>
                  <span className="font-semibold text-slate-900">{basic.version}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Ano de fabricação</span>
                  <span className="font-semibold text-slate-900">{basic.yearFabrication ?? '—'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Ano/modelo</span>
                  <span className="font-semibold text-slate-900">{basic.yearModel ?? '—'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Cor</span>
                  <span className="font-semibold text-slate-900">{basic.color}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Combustível</span>
                  <span className="font-semibold text-slate-900">{basic.fuel}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Categoria</span>
                  <span className="font-semibold text-slate-900">{cadastral.vehicleType}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAllDataModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todos os dados</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>

          {/* Card 2: "Principais informações" */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Principais informações
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {/* Leilão */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Gavel className="w-3.5 h-3.5 text-slate-400" />
                    <span>Leilão</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    {risks.auction.hasAuction == null ? 'Não informado' : risks.auction.hasAuction ? 'Possui registro' : 'Não possui registro'}
                  </span>
                </div>

                {/* Sinistro */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sinistro</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    {risks.accident.hasAccident == null ? 'Não informado' : risks.accident.hasAccident ? 'Possui registro' : 'Não possui registro'}
                  </span>
                </div>

                {/* Roubo e furto */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>Roubo e furto</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    {risks.theftRecord.isStolenOrTheftAlert == null ? 'Não informado' : risks.theftRecord.isStolenOrTheftAlert ? 'Possui registro' : 'Não possui registro'}
                  </span>
                </div>

                {/* Gravame */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gravame</span>
                  </div>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    financial.gravame.hasFinancialRestriction
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'text-slate-700'
                  }`}>
                    {financial.gravame.hasFinancialRestriction == null ? 'Não informado' : financial.gravame.hasFinancialRestriction ? 'Com registro' : 'Sem restrição'}
                  </span>
                </div>

                {/* Restrições */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restrições</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    {risks.judicialRestrictions.hasRestriction == null ? 'Não informado' : risks.judicialRestrictions.hasRestriction ? 'Possui restrição' : 'Não possui registro'}
                  </span>
                </div>

                {/* Débitos e multas */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Débitos e multas</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    {financial.hasDebts == null ? 'Não informado' : financial.hasDebts ? (financial.totalDebtsAmount == null ? 'Débitos encontrados' : `R$ ${financial.totalDebtsAmount.toFixed(2)}`) : 'Não possui débitos'}
                  </span>
                </div>

                {/* IPVA e licenciamento */}
                <div className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                    <span>IPVA e licenciamento</span>
                  </div>
                  <span className="font-semibold text-[#FF6A00]">
                    {financial.ipvaStatus === 'Não informado' || financial.licensingStatus === 'Não informado' ? 'Não informado' : financial.ipvaStatus === 'OK' && financial.licensingStatus === 'OK' ? 'Regular' : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100">
              <button
                onClick={() => setIsFullAuditModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver relatório completo</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>

          {/* Coluna 3: Cards de Ação e Serviços */}
          <div className="space-y-4 flex flex-col justify-between">
            
            {/* Card 1: Quer mais segurança? */}
            <div className="bg-[#f0f6fe] border border-blue-100 rounded-2xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5">
                <Search className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Quer mais segurança?
              </h4>
              <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed font-normal">
                Agende uma vistoria cautelar e conte com uma análise presencial e detalhada.
              </p>
              <button
                onClick={() => setIsInspectionModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-blue-400 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Agendar vistoria
              </button>
            </div>

            {/* Card 2: Proteja seu veículo */}
            <div className="bg-[#f0f6fe] border border-blue-100 rounded-2xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Proteja seu veículo
              </h4>
              <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed font-normal">
                Faça uma cotação de seguro e dirija com mais tranquilidade.
              </p>
              <button
                onClick={() => setIsInsuranceModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-blue-400 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Ver opções de seguro
              </button>
            </div>

          </div>

        </div>

        {/* 4. Card de Visão Geral do Veículo (Posicionado abaixo) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">

            {/* Seção 1: Identificação do Veículo sem foto (4 cols) */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {basic.brand} {basic.model.replace(/LIMITED.*/i, '').trim()}
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {basic.version} | {basic.yearFabrication ?? '—'} / {basic.yearModel ?? '—'}
                </p>

                {/* Badge de Placa Mercosul ou tag FIPE */}
                {isFipeOnly ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black tracking-wide">
                      TABELA FIPE
                    </span>
                    <span className="text-sm font-black text-orange-700">
                      {basic.fipeValue == null ? 'Não informado' : basic.fipeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center bg-white border border-slate-300 rounded-md overflow-hidden shadow-xs">
                    <div className="bg-[#003399] px-1.5 py-0.5 flex items-center justify-center">
                      <span className="text-[8px] font-black text-white leading-none">BR</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono font-black text-slate-800 tracking-wider">
                      {basic.plate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Seção 2: Score de Segurança da Compra (2 cols) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 lg:px-2 text-center">
              {isFipeOnly ? (
                /* Exibe código FIPE quando não há score */
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">Código FIPE</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{basic.fipeCode}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Ref. oficial</span>
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-600 mb-2.5">
                    Score de segurança da compra
                  </span>

                  {/* Gauge Circular Donut */}
                  <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 84 84">
                      <circle cx="42" cy="42" r={radius} stroke="#e2e8f0" strokeWidth="7" fill="none" />
                      <circle
                        cx="42" cy="42" r={radius}
                        stroke="#FF6A00" strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" fill="none"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-xl font-black text-slate-900 leading-none">{risks.riskScore ?? '—'}</span>
                        <span className="text-[10px] text-slate-400 font-bold leading-none block">/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      {risks.riskScore == null ? 'Score não informado' : risks.riskScore >= 70 ? 'Baixo risco' : risks.riskScore >= 40 ? 'Atenção' : 'Alto risco'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Seção 3: Resumo do Veículo */}
            <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 space-y-2">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Resumo do veículo
              </span>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="text-[11px] text-slate-600 space-y-2">
                  <p>Leilão: <strong>{risks.auction.hasAuction == null ? 'Não informado' : risks.auction.hasAuction ? 'Registro encontrado' : 'Sem registro'}</strong></p>
                  <p>Sinistro: <strong>{risks.accident.hasAccident == null ? 'Não informado' : risks.accident.hasAccident ? 'Registro encontrado' : 'Sem registro'}</strong></p>
                  <p>Restrição judicial: <strong>{risks.judicialRestrictions.hasRestriction == null ? 'Não informado' : risks.judicialRestrictions.hasRestriction ? 'Registro encontrado' : 'Sem registro'}</strong></p>
                  <p>Roubo ou furto: <strong>{risks.theftRecord.isStolenOrTheftAlert == null ? 'Não informado' : risks.theftRecord.isStolenOrTheftAlert ? 'Registro encontrado' : 'Sem registro'}</strong></p>
                  <p>Débitos: <strong>{financial.hasDebts == null ? 'Não informado' : financial.hasDebts ? (financial.totalDebtsAmount == null ? 'Débitos encontrados' : `R$ ${financial.totalDebtsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`) : 'Sem débitos'}</strong></p>
                </div>

                <div className="flex items-center gap-2">
                  {financial.gravame.hasFinancialRestriction ? (
                    <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#FF6A00] flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <span className={`text-[11px] font-medium ${financial.gravame.hasFinancialRestriction ? 'text-amber-700' : 'text-slate-700'}`}>
                    {financial.gravame.hasFinancialRestriction == null ? 'Gravame não informado' : financial.gravame.hasFinancialRestriction ? 'Com gravame' : 'Sem gravame'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FF6A00] flex items-center justify-center text-white flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Débitos: {financial.hasDebts == null ? 'Não informado' : financial.hasDebts ? 'Há registros' : 'Sem registros'}</span>
                </div>
              </div>
            </div>

            {/* Seção 4: Card Verde "Tudo Certo!" ou card FIPE info */}
            <div className="lg:col-span-3">
              {isFipeOnly ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col justify-center h-full">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Info className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-blue-900 tracking-tight">
                    Dados da Tabela FIPE
                  </h4>
                  <p className="text-xs text-blue-700 leading-relaxed mt-1 font-medium">
                    {risks.riskSummary}
                  </p>
                </div>
              ) : (
                <div className="bg-[#FFF8F1] border border-[#FFD1AD] rounded-2xl p-5 flex flex-col justify-center h-full">
                  <div className="w-8 h-8 rounded-full bg-[#FFE5CC] text-[#FF6A00] flex items-center justify-center mb-2">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-extrabold text-[#7A2E00] tracking-tight">
                    Resultado da consulta
                  </h4>
                  <p className="text-xs text-[#8A3900] leading-relaxed mt-1 font-medium">
                    {risks.riskSummary || 'Consulte os itens e as informações complementares retornadas pela fonte.'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* MODAL 1: Agendar Vistoria Cautelar */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        plate={basic.plate}
      />

      {/* MODAL 2: Cotação de Seguro */}
      <Modal
        isOpen={isInsuranceModalOpen}
        onClose={() => {
          setIsInsuranceModalOpen(false);
          setInsuranceProtocol(null);
        }}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cotação de Seguro Auto</h3>
              <p className="text-xs text-slate-500">{basic.brand} {basic.model} • Placa {basic.plate}</p>
            </div>
          </div>
        }
      >
        {insuranceProtocol ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cotação Solicitada com Sucesso!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Você receberá a tabela comparativa com os melhores valores de seguradoras parceiras diretamente no seu WhatsApp em instantes.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block text-xs">
              <span className="text-slate-500 block">Protocolo:</span>
              <strong className="text-orange-700 text-sm font-mono">{insuranceProtocol}</strong>
            </div>
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={() => setIsInsuranceModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInsuranceSubmit} className="space-y-4 text-xs text-slate-800">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Seu Nome Completo</label>
              <input
                type="text"
                required
                value={insuranceForm.name}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                placeholder="Ex: Ana Silva"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">WhatsApp para receber as propostas</label>
              <input
                type="tel"
                required
                value={insuranceForm.phone}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, phone: e.target.value })}
                placeholder="(11) 98765-4321"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">CEP de Pernoite</label>
              <input
                type="text"
                required
                value={insuranceForm.zipCode}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, zipCode: e.target.value })}
                placeholder="01001-000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                variant="glow"
                size="md"
                className="w-full text-xs font-bold"
                isLoading={isInsuranceLoading}
              >
                Receber Propostas das Seguradoras
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: Ver Todos os Dados Cadastrais */}
      <Modal
        isOpen={isAllDataModalOpen}
        onClose={() => setIsAllDataModalOpen(false)}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ficha Técnica & Dados Cadastrais</h3>
              <p className="text-xs text-slate-500">{basic.brand} {basic.model} • Placa {basic.plate}</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-800 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Chassi:</span>
              <strong className="font-mono text-slate-900">{cadastral.chassis}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Renavam:</span>
              <strong className="font-mono text-slate-900">{cadastral.renavam}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Motor:</span>
              <strong className="font-mono text-slate-900">{cadastral.engine}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Origem:</span>
              <strong className="text-slate-900">{cadastral.origin}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Potência:</span>
              <strong className="text-slate-900">{cadastral.powerHp}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Cilindrada:</span>
              <strong className="text-slate-900">{cadastral.cylinderCapacity}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Valor FIPE:</span>
              <strong className="text-orange-700 font-bold">{cadastral.fipeValue == null ? 'Não informado' : `R$ ${cadastral.fipeValue.toLocaleString('pt-BR')}`}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Código FIPE:</span>
              <strong className="font-mono text-slate-900">{cadastral.fipeCode}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Passageiros:</span>
              <strong className="text-slate-900">{cadastral.passengers == null ? 'Não informado' : `${cadastral.passengers} lugares`}</strong>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-900 mb-2">Histórico FIPE Recente</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
              {cadastral.fipeHistory.map((item, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">{item.month}</span>
                  <strong className="text-xs font-mono text-slate-800">R$ {item.value.toLocaleString('pt-BR')}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Ver Relatório Completo de Auditoria */}
      <Modal
        isOpen={isFullAuditModalOpen}
        onClose={() => setIsFullAuditModalOpen(false)}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Detalhes do histórico veicular</h3>
              <p className="text-xs text-slate-500">Dados fornecidos pela AnyCar</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-800 max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-900">
            <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              <span>Resultado da consulta</span>
            </h4>
            <p className="text-xs text-orange-800">
              {risks.riskSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block font-medium">Gravame Financeiro:</span>
              <strong className="text-slate-900 block mt-0.5">{financial.gravame.status}</strong>
              {financial.gravame.financialInstitution && (
                <p className="text-[11px] text-slate-500 mt-1">Instituição: {financial.gravame.financialInstitution}</p>
              )}
            </div>

            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block font-medium">Situação de Débitos:</span>
              <strong className="text-slate-900 block mt-0.5">
                {financial.hasDebts == null ? 'Situação não informada' : financial.hasDebts ? `Total: ${financial.totalDebtsAmount == null ? 'não informado' : `R$ ${financial.totalDebtsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}` : 'Nenhum débito pendente'}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">IPVA: {financial.ipvaStatus} · Licenciamento: {financial.licensingStatus}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-2">Histórico de Proprietários e Odômetro</h4>
            <div className="flex justify-between items-center text-xs text-slate-700 py-1">
              <span>Total de donos anteriores:</span>
              <strong>{report.ownersMileage.totalOwnersCount == null ? 'Não informado' : `${report.ownersMileage.totalOwnersCount} proprietários`}</strong>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-700 py-1 border-t border-slate-200 mt-1">
              <span>Quilometragem estimada:</span>
              <strong>{report.ownersMileage.estimatedCurrentMileage == null ? 'Não informado' : `${report.ownersMileage.estimatedCurrentMileage.toLocaleString('pt-BR')} km`}</strong>
            </div>
          </div>
        </div>
      </Modal>

      {report.providerData && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8" aria-labelledby="provider-data-title">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 id="provider-data-title" className="font-bold text-slate-900 mb-3">Dados complementares da consulta</h2>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words overflow-auto max-h-[32rem]">
              {JSON.stringify(report.providerData, null, 2)}
            </pre>
          </div>
        </section>
      )}

    </div>
  );
};

