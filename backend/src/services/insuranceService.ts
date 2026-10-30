import { InsuranceQuoteRequest } from '../types/vehicle';

export class InsuranceService {
  static requestQuote(data: InsuranceQuoteRequest): { success: boolean; protocol: string } {
    if (!data.plate || !data.name || !data.phone || !data.email) {
      throw new Error('Campos obrigatórios ausentes para cotação de seguro.');
    }

    const protocol = `SEG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    console.log(`[InsuranceService] Cotação de seguro registrada: ${protocol} para ${data.name} (${data.plate})`);

    return {
      success: true,
      protocol,
    };
  }
}
