import axios from "axios";
import { env } from "../../config/env";
import { FullVehicleReport } from "../../contracts/vehicle";
import { HttpError, plateSchema } from "../../shared/security";

type AnycarEnvelope = {
  status?: boolean;
  dados?: Record<string, unknown>;
  [key: string]: unknown;
};
const text = (...values: unknown[]) => {
  const v = values.find(
    (x) => x !== undefined && x !== null && String(x).trim() !== "",
  );
  return v === undefined ? "" : String(v);
};
const numberOrNull = (...values: unknown[]): number | null => {
  const v = values.find((x) => x !== undefined && x !== null && x !== "");
  if (v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number(
          String(v)
            .replace(/[^\d,.-]/g, "")
            .replace(/\.(?=.*\.)/g, "")
            .replace(",", "."),
        );
  return Number.isFinite(n) ? n : null;
};
const flag = (...values: unknown[]): boolean | null => {
  const v = values.find((x) => x !== undefined && x !== null && x !== "");
  if (v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.length ? true : null;
  const s = String(v).trim().toLowerCase();
  if (
    /^(não|nao|false|0|livre|regular|nenhum|nenhuma|inexistente|sem (ocorrência|ocorrencia|registro|restrição|restricao|débitos|debitos))$/.test(
      s,
    )
  )
    return false;
  if (/^(sim|true|1|ativo|positiva|positivo|pendente|com registro)$/.test(s))
    return true;
  return null;
};
const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const hasValue = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim() !== "";

export class AnycarService {
  static async getFullReport(plate: string): Promise<FullVehicleReport> {
    if (
      !env.anycarContractVerified ||
      !env.anycarApiUrl ||
      !env.anycarApiKey ||
      !env.anycarReportTypes.length
    ) {
      const e = new Error(
        "Integração AnyCar ainda não configurada. Complete ANYCAR_API_URL, ANYCAR_API_KEY e ANYCAR_REPORT_TYPES após receber as credenciais e o contrato OpenAPI empresarial.",
      ) as Error & { status: number };
      e.status = 503;
      throw e;
    }
    const clean = plateSchema.parse(plate);
    if (!env.anycarApiUrl.startsWith("https://"))
      throw new HttpError(503, "Provedor indisponível.");
    const responses = await Promise.all(
      env.anycarReportTypes.map(async (tipo) => {
        const response = await axios.post<AnycarEnvelope>(
          `${env.anycarApiUrl.replace(/\/$/, "")}/api/consultar`,
          { tipo, placa: clean },
          {
            timeout: 20000,
            maxRedirects: 0,
            maxContentLength: 2 * 1024 * 1024,
            headers: {
              "x-api-key": env.anycarApiKey,
              "Content-Type": "application/json",
            },
          },
        );
        if (
          response.data.status === false ||
          !response.data.dados ||
          typeof response.data.dados !== "object"
        )
          throw new Error(`A AnyCar não retornou dados válidos para ${tipo}.`);
        return { tipo, dados: response.data.dados };
      }),
    );
    const flattened = Object.assign({}, ...responses.map((item) => item.dados));
    const byType = Object.fromEntries(
      responses.map((item) => [item.tipo, item.dados]),
    );
    const report = this.toReport(clean, flattened, byType);
    return report;
  }

  private static toReport(
    plate: string,
    raw: Record<string, unknown>,
    byType: Record<string, Record<string, unknown>>,
  ): FullVehicleReport {
    const cadastral = obj(
      raw.cadastral ?? raw.dadosCadastrais ?? raw.veiculo ?? raw,
    );
    const fipe = obj(raw.fipe ?? raw.precificacao);
    const financial = obj(raw.financeiro ?? raw.debitos);
    const risks = obj(raw.riscos ?? raw.verificacoes);
    const km = obj(raw.quilometragem ?? raw.historicoKm);
    const brand = text(cadastral.marca, raw.marca);
    const model = text(cadastral.modelo, raw.modelo);
    const year = numberOrNull(
      cadastral.anoModelo,
      cadastral.anoFabricacao,
      raw.anoModelo,
      raw.anoFabricacao,
    );
    const fipeValue = numberOrNull(
      fipe.valor,
      raw.valorFipe,
      raw.fipeValor,
      raw.valor,
    );
    const auctionData = byType["veicular-leilao-1"];
    const accidentData = byType["veicular-sinistro-1"];
    const gravameData = byType["veicular-gravame"];
    const auctionDetails = obj(risks.leilao ?? raw.leilao);
    const accidentDetails = obj(risks.sinistro ?? raw.sinistro);
    const auction =
      flag(
        auctionDetails.hasAuction,
        auctionDetails.possuiLeilao,
        raw.passagemLeilao,
        raw.leilao && typeof raw.leilao !== "object" ? raw.leilao : undefined,
        raw.dataLeilao,
      ) ??
      (hasValue(auctionData?.dataLeilao) || hasValue(auctionData?.lote)
        ? true
        : null);
    const accident =
      flag(
        accidentDetails.hasAccident,
        accidentDetails.possuiSinistro,
        raw.indicioSinistro,
        accidentData?.tipo,
        accidentData?.severidade,
      ) ??
      (hasValue(accidentData?.dataEvento) || hasValue(accidentData?.seguradora)
        ? true
        : null);
    const theft = flag(risks.rouboFurto, raw.rouboFurto, raw.alertaRoubo);
    const debts =
      flag(financial.possuiDebitos, raw.possuiDebitos) ??
      (numberOrNull(financial.total, raw.totalDebitos) === null
        ? null
        : (numberOrNull(financial.total, raw.totalDebitos) ?? 0) > 0);
    const scoreValue = numberOrNull(raw.score, raw.scoreVeiculo, risks.score);
    const score =
      scoreValue === null ? null : Math.max(0, Math.min(100, scoreValue));
    const debtRows = Array.isArray(financial.itens)
      ? financial.itens
      : Array.isArray(raw.debitos)
        ? raw.debitos
        : [];

    return {
      id: `ANYCAR-${plate}-${Date.now()}`,
      consultedAt: new Date().toISOString(),
      basicInfo: {
        plate,
        brand,
        model,
        version: text(cadastral.versao, model),
        yearFabrication: numberOrNull(cadastral.anoFabricacao, year),
        yearModel: year,
        color: text(cadastral.cor),
        fuel: text(cadastral.combustivel),
        city: text(cadastral.municipio),
        state: text(cadastral.uf),
        chassisMasked: text(cadastral.chassi),
        renavamMasked: text(cadastral.renavam),
        engineMasked: text(cadastral.motor),
        fipeValue,
        fipeCode: text(fipe.codigoFipe, raw.codigoFipe),
      },
      cadastral: {
        chassis: text(cadastral.chassi),
        engine: text(cadastral.motor),
        renavam: text(cadastral.renavam),
        origin: text(cadastral.origem),
        powerHp: text(cadastral.potencia),
        cylinderCapacity: text(cadastral.cilindrada),
        vehicleType: text(cadastral.tipo, cadastral.especie),
        segment: text(cadastral.categoria, cadastral.carroceria),
        passengers: numberOrNull(cadastral.capacidade),
        fipeValue,
        fipeCode: text(fipe.codigoFipe, raw.codigoFipe),
        fipeHistory: [],
      },
      financial: {
        hasDebts: debts,
        totalDebtsAmount: numberOrNull(financial.total, raw.totalDebitos),
        ipvaStatus: "Não informado",
        licensingStatus: "Não informado",
        debtsList: debtRows
          .filter((row) => numberOrNull(obj(row).valor) !== null)
          .map((row, i) => {
            const d = obj(row);
            const kind = text(d.tipo).toLowerCase();
            return {
              id: String(d.id ?? i),
              type: (kind.includes("ipva")
                ? "IPVA"
                : kind.includes("multa")
                  ? "Multa"
                  : "Taxa") as "IPVA" | "Multa" | "Taxa",
              description: text(d.descricao, d.tipo),
              dueDate: text(d.vencimento),
              amount: numberOrNull(d.valor) ?? 0,
              status: "Em Aberto" as const,
            };
          }),
        gravame: {
          hasFinancialRestriction: flag(
            risks.gravame,
            raw.gravame,
            gravameData?.situacao,
          ),
          status:
            flag(risks.gravame, raw.gravame, gravameData?.situacao) === null
              ? "Não informado"
              : flag(risks.gravame, raw.gravame, gravameData?.situacao)
                ? "Não informado"
                : "Livre",
          financialInstitution: text(gravameData?.agenteFinanceiro),
          inclusionDate: text(gravameData?.dataInclusao),
          contractType: text(gravameData?.tipo),
        },
      },
      risks: {
        overallRiskLevel:
          score === null
            ? "warning"
            : score >= 70
              ? "safe"
              : score >= 40
                ? "warning"
                : "danger",
        riskScore: score,
        riskSummary: text(
          raw.recomendacao,
          raw.resumo,
          "Relatório fornecido pela AnyCar.",
        ),
        theftRecord: {
          isStolenOrTheftAlert: theft,
          status:
            theft === null
              ? "Não informado"
              : theft
                ? "Alerta informado pelo provedor"
                : "Sem Alerta de Furto/Roubo",
        },
        judicialRestrictions: {
          hasRestriction: flag(risks.restricaoJudicial, raw.restricaoJudicial),
          type:
            flag(risks.restricaoJudicial, raw.restricaoJudicial) === false
              ? "Sem Restrição Judicial"
              : "Não informado",
        },
        auction: {
          hasAuction: auction,
          auctionScoreRisk: null,
          notes: text(risks.leilao, raw.leilao),
        },
        accident: {
          hasAccident: accident,
          severity: accident === false ? "Sem Registros" : undefined,
          description: text(risks.sinistro, raw.sinistro),
        },
        recall: { hasPendingRecall: flag(risks.recall, raw.recallPendente) },
        tamperingAlert: {
          hasMileageTamperingSuspicion: flag(km.adulteracao, raw.adulteracaoKm),
        },
      },
      ownersMileage: {
        totalOwnersCount: numberOrNull(raw.quantidadeProprietarios),
        currentOwnerType: text(raw.tipoProprietario),
        usageProfile: "Não informado",
        estimatedCurrentMileage: numberOrNull(km.atual, raw.kmAtual),
        ownerHistory: [],
        mileageHistory: [], // Enable only after source, date and unit fields are confirmed in the contracted schema.
      },
    };
  }
}
