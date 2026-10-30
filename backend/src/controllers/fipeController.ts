import { Request, Response, NextFunction } from 'express';
import { FipeService } from '../services/fipeService';
import { VehicleKind } from '../types/fipe';

export class FipeController {
  /**
   * GET /api/fipe/brands?tipo=carros
   */
  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const tipo = (req.query.tipo as VehicleKind) || 'carros';
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
      const tipo = (req.query.tipo as VehicleKind) || 'carros';
      const brandCode = (req.query.brandCode as string) || (req.query.brand as string);
      if (!brandCode) {
        res.status(400).json({ message: 'brandCode é obrigatório.' });
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
      const tipo = (req.query.tipo as VehicleKind) || 'carros';
      const brandCode = req.query.brandCode as string;
      const modelCode = req.query.modelCode as string;
      if (!brandCode || !modelCode) {
        res.status(400).json({ message: 'brandCode e modelCode são obrigatórios.' });
        return;
      }
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
      const tipo = (req.query.tipo as VehicleKind) || 'carros';
      const brandCode = req.query.brandCode as string;
      const modelCode = req.query.modelCode as string;
      const yearCode = req.query.yearCode as string;

      if (!brandCode || !modelCode || !yearCode) {
        res.status(400).json({ message: 'brandCode, modelCode e yearCode são obrigatórios.' });
        return;
      }
      const vehicle = await FipeService.getVehicleData(tipo, brandCode, modelCode, yearCode);
      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  }
}
