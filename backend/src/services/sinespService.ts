import sinesp from 'sinesp-api';
import axios from 'axios';
import { env } from '../config/env';

export interface SinespResponse {
  codigoRetorno: string;
  mensagemRetorno: string;
  codigoSituacao?: string;
  situacao?: string;
  modelo: string;
  marca: string;
  cor: string;
  ano: string;
  anoModelo: string;
  placa: string;
  data?: string;
  uf: string;
  municipio: string;
  chassi?: string;
  dataAtualizacaoCaracteristicasVeiculo?: string;
  dataAtualizacaoRouboFurto?: string;
}

export class SinespService {
  /**
   * Realiza a consulta da placa no SINESP / API de Placas
   */
  static async searchPlate(plate: string): Promise<SinespResponse | null> {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Se houver um SINESP_TOKEN ou URL customizada no .env (ex: wdapi2 ou provedor parceiro)
    if (process.env.SINESP_TOKEN) {
      try {
        const token = process.env.SINESP_TOKEN;
        const host = process.env.SINESP_HOST || 'wdapi2.com.br';
        const url = `https://${host}/consulta/${cleanPlate}/${token}`;
        
        console.log(`[SinespService] Consultando API externa personalizada: ${url}`);
        const res = await axios.get(url, { timeout: 8000 });
        if (res.data && res.data.modelo) {
          return {
            codigoRetorno: '0',
            mensagemRetorno: 'Sem erros.',
            situacao: res.data.situacao || 'Sem restrição',
            modelo: res.data.modelo || res.data.marca,
            marca: res.data.marca || res.data.modelo,
            cor: res.data.cor || 'Não informada',
            ano: String(res.data.ano || res.data.anoModelo || '2020'),
            anoModelo: String(res.data.anoModelo || res.data.ano || '2020'),
            placa: cleanPlate,
            uf: res.data.uf || 'SP',
            municipio: res.data.municipio || 'SÃO PAULO',
            chassi: res.data.chassi || `****${cleanPlate.slice(-4)}`,
          };
        }
      } catch (err: any) {
        console.warn(`[SinespService] Erro ao consultar via API com token:`, err?.message);
      }
    }

    // Tentativa padrão via sinesp-api package
    try {
      if (process.env.SINESP_HOST) {
        sinesp.configure({
          host: process.env.SINESP_HOST,
          endpoint: process.env.SINESP_ENDPOINT || 'consulta',
          serviceVersion: process.env.SINESP_VERSION || 'v1',
          timeout: 10000,
        });
      }

      console.log(`[SinespService] Consultando placa ${cleanPlate} via sinesp-api...`);
      const result = await sinesp.search(cleanPlate);
      if (result && result.modelo) {
        return result as SinespResponse;
      }
    } catch (error: any) {
      console.warn(`[SinespService] Consulta sinesp-api para ${cleanPlate} retornou aviso/falha:`, error?.message || error);
    }

    return null;
  }
}
