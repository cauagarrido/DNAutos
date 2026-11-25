import axios from "axios";
import { HttpError } from "../../shared/security";
import { env } from "../../config/env";
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
} from "../../contracts/fipe";

const KIND_PATH_MAP: Record<VehicleKind, string> = {
  carros: "cars",
  motos: "motorcycles",
  caminhoes: "trucks",
};

const fipeClient = axios.create({
  baseURL: env.fipeApiUrl,
  timeout: 10000,
  maxRedirects: 0,
  headers: { "Content-Type": "application/json" },
});

// A FIPE API autentica com X-Subscription-Token (não com Authorization: Bearer).
fipeClient.interceptors.request.use((config) => {
  if (env.fipeApiKey)
    config.headers.set("X-Subscription-Token", env.fipeApiKey);
  return config;
});


function handleFipeError(op: string, error: any, fallbackMessage: string): never {
  const status = error?.response?.status ?? null;
  const code = error?.code ?? null;
  console.error(JSON.stringify({ event: "fipe_error", op, status, code }));
  if (status === 400 || status === 404) throw new HttpError(404, "Registro FIPE não encontrado.");
  if (status === 429) throw new HttpError(429, "Limite de consultas FIPE atingido. Tente novamente em instantes.");
  throw new HttpError(502, fallbackMessage);
}

export class FipeService {
  /**
   * Retorna lista de marcas FIPE
   */
  static async getBrands(tipo: VehicleKind = "carros"): Promise<FipeBrand[]> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || "cars";
      const res = await fipeClient.get<ApiBrBrand[]>(`/${kindPath}/brands`);
      return res.data.map((item) => ({
        codigo: String(item.code),
        nome: item.name,
      }));
    } catch (error: any) {
      handleFipeError("getBrands", error, "Falha ao obter marcas da Tabela FIPE.");
    }
  }

  /**
   * Retorna lista de modelos FIPE para uma marca
   */
  static async getModels(
    tipo: VehicleKind = "carros",
    brandCode: string,
  ): Promise<FipeModelItem[]> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || "cars";
      const res = await fipeClient.get<ApiBrModel[]>(
        `/${kindPath}/brands/${brandCode}/models`,
      );
      return res.data.map((m) => ({
        codigo: m.code,
        nome: m.name,
      }));
    } catch (error: any) {
      handleFipeError("getModels", error, "Falha ao obter modelos da Tabela FIPE.");
    }
  }

  /**
   * Retorna anos disponíveis para marca + modelo
   */
  static async getYears(
    tipo: VehicleKind = "carros",
    brandCode: string,
    modelCode: number | string,
  ): Promise<FipeYearItem[]> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || "cars";
      const res = await fipeClient.get<ApiBrYear[]>(
        `/${kindPath}/brands/${brandCode}/models/${modelCode}/years`,
      );
      return res.data.map((y) => ({
        codigo: String(y.code),
        nome: y.name,
      }));
    } catch (error: any) {
      handleFipeError("getYears", error, "Falha ao obter anos da Tabela FIPE.");
    }
  }

  /**
   * Retorna dados completos do veículo na FIPE
   */
  static async getVehicleData(
    tipo: VehicleKind = "carros",
    brandCode: string,
    modelCode: number | string,
    yearCode: string,
  ): Promise<FipeVehicleData> {
    try {
      const kindPath = KIND_PATH_MAP[tipo] || "cars";
      const res = await fipeClient.get<ApiBrVehicleDetail>(
        `/${kindPath}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`,
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
      handleFipeError("getVehicleData", error, "Falha ao obter cotação FIPE.");
    }
  }
}
