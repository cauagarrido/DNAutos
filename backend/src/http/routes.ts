import { Router } from "express";
import vehicleRoutes from "../modules/vehicle/vehicle.routes";
import checkoutRoutes from "../modules/checkout/checkout.routes";
import fipeRoutes from "../modules/fipe/fipe.routes";
import authRoutes from "../modules/auth/auth.routes";
import accountRoutes from "../modules/account/account.routes";
import maintenanceRoutes from "../modules/maintenance/maintenance.routes";
import {
  authConfigured,
  checkoutConfigured,
  env,
  PRICE_CENTS,
} from "../config/env";
import { publicRateLimit } from "./middleware/security";
const router = Router();
router.get("/health", (_req, res) => {
  res.json({ status: "OK", service: "DNAutos API" });
});
router.get("/config", (_req, res) => {
  const url = env.supportUrl;
  res.json({
    authAvailable: authConfigured(),
    checkoutAvailable: checkoutConfigured(),
    priceCents: PRICE_CENTS,
    supportUrl: /^https:\/\//.test(url) ? url : null,
    requirePhoneMfa: env.requirePhoneMfa,
  });
});
router.use("/auth", authRoutes);
router.use("/vehicle", vehicleRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/account", accountRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/fipe", publicRateLimit(90, 60), fipeRoutes);
// Legacy lead forms are disabled until a real delivery/persistence integration exists.
router.post(["/inspection/schedule", "/insurance/quote"], (_req, res) => {
  res
    .status(503)
    .json({ message: "Use o contato direto para solicitar atendimento." });
});
export default router;
