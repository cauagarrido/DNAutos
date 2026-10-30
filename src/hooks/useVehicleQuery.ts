import { useState, useEffect } from 'react';
import { vehicleApi, API_BASE_URL } from '../services/api';
import { FipeVehicleData, VehicleKind } from '../services/fipeService';
import { buildReportFromFipe } from '../utils/fipeReportBuilder';
import { authService } from '../services/authService';
import {
  VehicleBasicInfo,
  FullVehicleReport,
} from '../types/vehicle';

export type QueryStep = 'SEARCH' | 'REPORT';

export function useVehicleQuery() {
  const [step, setStep] = useState<QueryStep>('SEARCH');
  const [plate, setPlate] = useState<string>('');
  const [basicInfo, setBasicInfo] = useState<VehicleBasicInfo | null>(null);
  const [fullReport, setFullReport] = useState<FullVehicleReport | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FullVehicleReport[]>([]);

  // Carrega histórico local ao inicializar
  useEffect(() => {
    if (authService.isAuthenticated()) vehicleApi.getAccountHistory().then(setHistory).catch(() => setHistory([]));
    else setHistory(vehicleApi.getLocalHistory());
  }, []);

  /**
   * Busca por placa — chama o backend da aplicação
   */
  const handleSearch = async (targetPlate?: string, reportToken?: string): Promise<boolean> => {
    const searchTarget = targetPlate || plate;
    const clean = searchTarget.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 7) return false;

    setIsLoading(true);
    setError(null);

    try {
      if (!reportToken) throw new Error('O relatório só pode ser aberto após o pagamento ser confirmado.');
      const report = await vehicleApi.getFullReport(clean, reportToken);
      setPlate(clean);
      setBasicInfo(report.basicInfo);
      setFullReport(report);
      setStep('REPORT');
      setHistory(authService.isAuthenticated() ? await vehicleApi.getAccountHistory() : vehicleApi.getLocalHistory());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    } catch (err: any) {
      let message = 'Não foi possível consultar esta placa. Tente novamente.';
      if (
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        err?.message?.includes('ERR_CONNECTION_REFUSED')
      ) {
        message = `Servidor backend indisponível em (${API_BASE_URL}). Certifique-se de que a API está rodando ou defina a variável VITE_API_URL no arquivo .env.`;
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Recebe dados vindos da consulta FIPE e navega para o relatório (salva no histórico provisório sem cadastro)
   */
  const handleFipeReport = (data: FipeVehicleData, tipo: VehicleKind) => {
    const report = buildReportFromFipe(data, tipo);
    vehicleApi.saveToLocalHistory(report);
    setFullReport(report);
    setBasicInfo(report.basicInfo);
    setStep('REPORT');
    setHistory(vehicleApi.getLocalHistory());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Abre um relatório salvo diretamente do histórico
   */
  const handleSelectReportFromHistory = (report: FullVehicleReport) => {
    setPlate(report.basicInfo.plate);
    setBasicInfo(report.basicInfo);
    setFullReport(report);
    setStep('REPORT');
    setIsHistoryDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Limpa histórico
   */
  const handleClearHistory = () => {
    localStorage.removeItem('benzcheck_history');
    setHistory([]);
    if (authService.isAuthenticated()) void vehicleApi.clearAccountHistory();
  };

  const refreshHistory = async () => {
    if (authService.isAuthenticated()) setHistory(await vehicleApi.getAccountHistory());
  };

  /**
   * Reseta o fluxo para uma nova busca na Home
   */
  const handleResetToSearch = () => {
    setStep('SEARCH');
    setBasicInfo(null);
    setFullReport(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    step,
    plate,
    setPlate,
    basicInfo,
    fullReport,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isLoading,
    error,
    history,
    handleSearch,
    handleFipeReport,
    handleSelectReportFromHistory,
    handleClearHistory,
    refreshHistory,
    handleResetToSearch,
  };
}
