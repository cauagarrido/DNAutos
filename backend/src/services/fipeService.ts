import axios from 'axios';
import { env } from '../config/env';
import {
  VehicleKind,
  FipeBrand,
  FipeModelItem,
  FipeYearItem,
  FipeVehicleData,
  ApiBrBrand,
  ApiBrModel,
  ApiBrYear,
  ApiBrVehicleDetail,
} from '../types/fipe';

const KIND_PATH_MAP: Record<VehicleKind, string> = {
  carros: 'cars',
  motos: 'motorcycles',
  caminhoes: 'trucks',
};

const fipeClient = axios.create({
  baseURL: env.fipeApiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.fipeApiKey}`,
  },
});

export class FipeService {
  /**
   * Retorna lista de marcas FIPE
   */
  static async getBrands(tipo: VehicleKind = 'carros'): Promise<FipeBrand[]> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || 'cars';
      const res = await fipeClient.get<ApiBrBrand[]>(`/${kindPath}/brands`);
      return res.data.map((item) => ({
        codigo: String(item.code),
        nome: item.name,
      }));
    } catch (error: any) {
      console.error(`[FipeService] Erro ao buscar marcas (${tipo}):`, error?.message || error);
      throw new Error(`Falha ao obter marcas da Tabela FIPE: ${error?.message || 'Erro de conexão'}`);
    }
  }

  /**
   * Retorna lista de modelos FIPE para uma marca
   */
  static async getModels(tipo: VehicleKind = 'carros', brandCode: string): Promise<FipeModelItem[]> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || 'cars';
      const res = await fipeClient.get<ApiBrModel[]>(`/${kindPath}/brands/${brandCode}/models`);
      return res.data.map((m) => ({
        codigo: m.code,
        nome: m.name,
      }));
    } catch (error: any) {
      console.error(`[FipeService] Erro ao buscar modelos (brand: ${brandCode}):`, error?.message || error);
      throw new Error(`Falha ao obter modelos da marca ${brandCode}`);
    }
  }

  /**
   * Retorna anos disponíveis para marca + modelo
   */
  static async getYears(
    tipo: VehicleKind = 'carros',
    brandCode: string,
    modelCode: number | string
  ): Promise<FipeYearItem[]> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || 'cars';
      const res = await fipeClient.get<ApiBrYear[]>(
        `/${kindPath}/brands/${brandCode}/models/${modelCode}/years`
      );
      return res.data.map((y) => ({
        codigo: String(y.code),
        nome: y.name,
      }));
    } catch (error: any) {
      console.error(`[FipeService] Erro ao buscar anos (${brandCode}/${modelCode}):`, error?.message || error);
      throw new Error(`Falha ao obter anos para o modelo ${modelCode}`);
    }
  }

  /**
   * Retorna dados completos do veículo na FIPE
   */
  static async getVehicleData(
    tipo: VehicleKind = 'carros',
    brandCode: string,
    modelCode: number | string,
    yearCode: string
  ): Promise<FipeVehicleData> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || 'cars';
      const res = await fipeClient.get<ApiBrVehicleDetail>(
        `/${kindPath}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`
      );
      const d = res.data;
      return {
        Valor: d.price,
        Marca: d.brand,
        Modelo: d.model,
        AnoModelo: d.modelYear,
        Combustivel: d.fuel,
        CodigoFipe: d.codeFipe,
        MesReferencia: d.referenceMonth,
        TipoVeiculo: d.vehicleType,
        SiglaCombustivel: d.fuelAcronym,
      };
    } catch (error: any) {
      console.error(`[FipeService] Erro ao buscar dados do veículo (${brandCode}/${modelCode}/${yearCode}):`, error?.message || error);
      throw new Error(`Falha ao obter cotação FIPE para os parâmetros informados`);
    }
  }
}
