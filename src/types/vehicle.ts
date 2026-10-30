export type RiskLevel = 'safe' | 'warning' | 'danger';

export interface VehicleBasicInfo {
  plate: string;
  brand: string;
  model: string;
  version: string;
  yearFabrication: number | null;
  yearModel: number | null;
  color: string;
  fuel: string;
  city: string;
  state: string;
  chassisMasked: string;
  renavamMasked: string;
  engineMasked: string;
  fipeValue: number | null;
  fipeCode: string;
}

export interface FipeHistoryItem {
  month: string;
  value: number;
}

export interface CadastralDetails {
  chassis: string;
  engine: string;
  renavam: string;
  origin: string; // Nacional / Importado
  powerHp: string;
  cylinderCapacity: string;
  vehicleType: string;
  segment: string;
  passengers: number | null;
  fipeValue: number | null;
  fipeCode: string;
  fipeHistory: FipeHistoryItem[];
}

export interface DebtItem {
  id: string;
  type: 'IPVA' | 'Licenciamento' | 'Multa' | 'DPVAT' | 'Taxa';
  year?: number;
  description: string;
  organ?: string;
  dueDate: string;
  amount: number;
  status: 'Pendente' | 'Pago' | 'Em Aberto' | 'Atrasado' | 'Inscrito em Dívida Ativa';
}

export interface FinancialDetails {
  hasDebts: boolean | null;
  totalDebtsAmount: number | null;
  ipvaStatus: 'OK' | 'Pendente' | 'Atrasado' | 'Não informado';
  licensingStatus: 'OK' | 'Pendente' | 'Atrasado' | 'Não informado';
  debtsList: DebtItem[];
  gravame: {
    hasFinancialRestriction: boolean | null;
    financialInstitution?: string;
    inclusionDate?: string;
    contractType?: string;
    status: 'Quitado' | 'Alienado Fiduciariamente' | 'Reserva de Domínio' | 'Livre' | 'Não informado';
  };
}

export interface AuctionRecord {
  hasAuction: boolean | null;
  auctioneer?: string;
  comitente?: string; // Seguradora, Banco, Detran
  lotNumber?: string;
  auctionDate?: string;
  category?: 'Recuperado de Financiamento' | 'Sinistro / Colisão' | 'Frota' | 'Leilão Judicial';
  damageLevel?: 'Sem Danos' | 'Pequena Monta' | 'Média Monta' | 'Grande Monta';
  auctionScoreRisk: number; // 0-100
  images?: string[];
  notes?: string;
}

export interface AccidentRecord {
  hasAccident: boolean | null;
  severity?: 'Leve' | 'Média Monta' | 'Grande Monta / PT' | 'Sem Registros';
  incidentDate?: string;
  repairedByInsurance?: boolean;
  description?: string;
}

export interface RiskDetails {
  overallRiskLevel: RiskLevel;
  riskScore: number | null; // null when the provider does not supply a score
  riskSummary: string;
  theftRecord: {
    isStolenOrTheftAlert: boolean | null;
    status: 'Sem Alerta de Furto/Roubo' | 'Alerta Ativo no SINESP' | 'Recuperado' | 'Não informado';
  };
  judicialRestrictions: {
    hasRestriction: boolean | null;
    type?: 'Renajud - Penhora' | 'Renajud - Transferência' | 'Sem Restrição Judicial' | 'Não informado';
    courtName?: string;
  };
  auction: AuctionRecord;
  accident: AccidentRecord;
  recall: {
    hasPendingRecall: boolean | null;
    campaignName?: string;
    urgency?: 'Baixa' | 'Alta';
  };
  tamperingAlert: {
    hasMileageTamperingSuspicion: boolean | null;
    notes?: string;
  };
}

export interface OwnerHistoryItem {
  ownerNumber: number;
  ownerType: 'Pessoa Física' | 'Pessoa Jurídica (Locadora)' | 'Pessoa Jurídica (Empresa/Frota)' | 'Concessionária';
  state: string;
  periodStart: string;
  periodEnd: string | 'Atual';
  durationMonths: number;
}

export interface MileageHistoryItem {
  date: string;
  mileage: number;
  source: 'Revisão Concessionária' | 'Laudo Cautelar' | 'Detran' | 'Anúncio Web';
  isSuspect?: boolean;
}

export interface OwnersAndMileageDetails {
  totalOwnersCount: number | null;
  currentOwnerType: string;
  ownerHistory: OwnerHistoryItem[];
  mileageHistory: MileageHistoryItem[];
  estimatedCurrentMileage: number | null;
  usageProfile: 'Uso Particular Severo' | 'Uso Particular Moderado' | 'Frota / Locadora' | 'Uso Misto' | 'Não informado';
}

export interface FullVehicleReport {
  id: string;
  consultedAt: string;
  basicInfo: VehicleBasicInfo;
  cadastral: CadastralDetails;
  financial: FinancialDetails;
  risks: RiskDetails;
  ownersMileage: OwnersAndMileageDetails;
  providerData?: Record<string, unknown>;
}

export interface InspectionBookingRequest {
  plate: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  preferredDate: string;
  inspectionType: 'Cautelar Completa' | 'Transferência Detran' | 'Pré-Compra Premium';
}

export interface InsuranceQuoteRequest {
  plate: string;
  name: string;
  phone: string;
  email: string;
  zipCode: string;
  usageType: 'Lazer' | 'Trabalho / Dia a Dia' | 'Aplicativo / Comercial';
}
