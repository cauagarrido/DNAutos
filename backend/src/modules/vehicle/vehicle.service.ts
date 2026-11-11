import { AnycarService } from "../../integrations/anycar/anycar.client";
import { FullVehicleReport } from "../../contracts/vehicle";

export class VehicleService {
  static async getPreview(plate: string) {
    const report = await AnycarService.getFullReport(plate);
    return report.basicInfo;
  }

  static async getFullReport(plate: string): Promise<FullVehicleReport> {
    return AnycarService.getFullReport(plate);
  }
}
