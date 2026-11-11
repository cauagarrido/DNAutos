import axios from 'axios';
import { API_BASE_URL } from './config';

export type VehicleKind = 'carros' | 'motos' | 'caminhoes';
export interface FipeBrand { codigo: string; nome: string }
export interface FipeModelItem { codigo: number | string; nome: string }
export interface FipeModelsResponse { modelos: FipeModelItem[]; anos: FipeYearItem[] }
export interface FipeYearItem { codigo: string; nome: string }
export interface FipeVehicleData {
  Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string;
  CodigoFipe: string; MesReferencia: string; TipoVeiculo: number; SiglaCombustivel: string;
}
const client = axios.create({ baseURL: `${API_BASE_URL}/fipe`, timeout: 12000 });
export const fipeService = {
  async getBrands(tipo: VehicleKind): Promise<FipeBrand[]> {
    return (await client.get<FipeBrand[]>('/brands', { params: { tipo } })).data;
  },
  async getModels(tipo: VehicleKind, brandCode: string): Promise<FipeModelsResponse> {
    return (await client.get<FipeModelsResponse>('/models', { params: { tipo, brandCode } })).data;
  },
  async getYears(tipo: VehicleKind, brandCode: string, modelCode: number | string): Promise<FipeYearItem[]> {
    return (await client.get<FipeYearItem[]>('/years', { params: { tipo, brandCode, modelCode } })).data;
  },
  async getVehicleData(tipo: VehicleKind, brandCode: string, modelCode: number | string, yearCode: string): Promise<FipeVehicleData> {
    return (await client.get<FipeVehicleData>('/vehicle', { params: { tipo, brandCode, modelCode, yearCode } })).data;
  },
};
