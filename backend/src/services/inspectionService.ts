import { InspectionBookingRequest } from '../types/vehicle';

export class InspectionService {
  static schedule(data: InspectionBookingRequest): { success: boolean; protocol: string } {
    if (!data.plate || !data.name || !data.phone) {
      throw new Error('Campos obrigatórios ausentes para agendamento de vistoria.');
    }

    const protocol = `VIS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    console.log(`[InspectionService] Agendamento registrado: ${protocol} para ${data.name} (${data.plate})`);

    return {
      success: true,
      protocol,
    };
  }
}
