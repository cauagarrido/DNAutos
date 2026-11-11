import { Request, Response, NextFunction } from "express";
import { FipeService } from "../../integrations/fipe/fipe.client";
import { z } from "zod";

const kind = z.enum(["carros", "motos", "caminhoes"]).default("carros");
const identifier = z.string().regex(/^\d{1,8}$/);
const yearsQuery = z
  .object({ tipo: kind, brandCode: identifier, modelCode: identifier })
  .strict();

export class FipeController {
  /**
   * GET /api/fipe/brands?tipo=carros
   */
  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipo } = z.object({ tipo: kind }).strict().parse(req.query);
      const brands = await FipeService.getBrands(tipo);
      res.json(brands);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/fipe/models?tipo=carros&brandCode=21
   */
  static async getModels(req: Request, res: Response, next: NextFunction) {
    try {
      const query = z
        .object({
          tipo: kind,
          brandCode: identifier.optional(),
          brand: identifier.optional(),
        })
        .strict()
        .parse(req.query);
      const tipo = query.tipo,
        brandCode = query.brandCode || query.brand;
      if (!brandCode) {
        res.status(400).json({ message: "brandCode é obrigatório." });
        return;
      }
      const models = await FipeService.getModels(tipo, brandCode);
      res.json({ modelos: models, anos: [] });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/fipe/years?tipo=carros&brandCode=21&modelCode=4824
   */
  static async getYears(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipo, brandCode, modelCode } = yearsQuery.parse(req.query);
      const years = await FipeService.getYears(tipo, brandCode, modelCode);
      res.json(years);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/fipe/vehicle?tipo=carros&brandCode=21&modelCode=4824&yearCode=2020-1
   */
  static async getVehicleData(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipo, brandCode, modelCode, yearCode } = yearsQuery
        .extend({ yearCode: z.string().regex(/^\d{4,5}-[1-9]$/) })
        .parse(req.query);

      const vehicle = await FipeService.getVehicleData(
        tipo,
        brandCode,
        modelCode,
        yearCode,
      );
      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  }
}
