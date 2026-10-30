import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';
import { API_BASE_URL } from './config';
import {
  FullVehicleReport,
  VehicleBasicInfo,
  InspectionBookingRequest,
  InsuranceQuoteRequest
} from '../types/vehicle';

// Configuração da URL do Backend (Vite env ou fallback padrão)
export { API_BASE_URL } from './config';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const vehicleApi = {
  /**
   * Busca os dados básicos do veículo para a tela de prévia direto na API
   */
  async getVehiclePreview(plate: string): Promise<VehicleBasicInfo> {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const response = await apiClient.get<VehicleBasicInfo>(`/vehicle/preview/${cleanPlate}`);
    return response.data;
  },

  async createCheckout(plate: string): Promise<{ paymentId: string; checkoutUrl: string; amount: number; expiresAt: string }> {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const response = await apiClient.post('/checkout', { plate: cleanPlate });
    return response.data;
  },

  async getCheckoutStatus(paymentId: string): Promise<{ isPaid: boolean; status: string; reportToken?: string; plate: string }> {
    const response = await apiClient.get(`/checkout/status/${paymentId}`);
    return response.data;
  },

  async getAccountHistory(): Promise<FullVehicleReport[]> {
    const response = await apiClient.get<FullVehicleReport[]>('/auth/reports');
    return response.data;
  },

  async clearAccountHistory(): Promise<void> {
    await apiClient.delete('/auth/reports');
  },

  /**
   * Obtém o relatório completo do veículo por placa direto na API
   */
  async getFullReport(plate: string, paymentToken: string): Promise<FullVehicleReport> {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const response = await apiClient.get<FullVehicleReport>(`/vehicle/report/${cleanPlate}`, {
      headers: { Authorization: `Bearer ${paymentToken}` },
    });
    
    // Salva no histórico local do navegador ao receber resposta válida
    vehicleApi.saveToLocalHistory(response.data);
    return response.data;
  },

  /**
   * Envia formulário de agendamento de Vistoria Cautelar Presencial direto na API
   */
  async requestInspectionBooking(data: InspectionBookingRequest): Promise<{ success: boolean; protocol: string }> {
    const response = await apiClient.post('/inspection/schedule', data);
    return response.data;
  },

  /**
   * Envia solicitação de cotação de seguro/proteção veicular direto na API
   */
  async requestInsuranceQuote(data: InsuranceQuoteRequest): Promise<{ success: boolean; protocol: string }> {
    const response = await apiClient.post('/insurance/quote', data);
    return response.data;
  },

  /**
   * Gerenciamento de Histórico Local (Minhas Consultas)
   */
  getLocalHistory(): FullVehicleReport[] {
    try {
      const stored = localStorage.getItem('benzcheck_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler histórico local', e);
    }
    return [];
  },

  saveToLocalHistory(report: FullVehicleReport): void {
    try {
      const current = this.getLocalHistory();
      const filtered = current.filter(r => r.basicInfo.plate !== report.basicInfo.plate);
      const updated = [report, ...filtered].slice(0, 10);
      localStorage.setItem('benzcheck_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar no histórico local', e);
    }
  }
};
