export type VehicleKind = 'carros' | 'motos' | 'caminhoes';

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModelItem {
  codigo: number | string;
  nome: string;
}

export interface FipeYearItem {
  codigo: string;
  nome: string;
}

export interface FipeVehicleData {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

export interface ApiBrBrand {
  code: string;
  name: string;
}

export interface ApiBrModel {
  code: string | number;
  name: string;
}

export interface ApiBrYear {
  code: string;
  name: string;
}

export interface ApiBrVehicleDetail {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
  vehicleType: number;
  fuelAcronym: string;
}
