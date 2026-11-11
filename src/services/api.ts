import { http } from "./http";
import {
  FullVehicleReport,
  InspectionBookingRequest,
  InsuranceQuoteRequest,
} from "../types/vehicle";
export interface Purchase {
  id: string;
  plate: string;
  amountCents: number;
  status: string;
  reportState: string;
  createdAt: string;
  expiresAt: string;
  checkoutUrl: string | null;
  refundRequested: boolean;
}
export interface CheckoutStatus {
  orderId: string;
  plate: string;
  isPaid: boolean;
  status: string;
  reportState: string;
  amountCents: number;
  checkoutUrl: string | null;
}
export const vehicleApi = {
  async createCheckout(plate: string, requestKey: string) {
    return (
      await http.post<{
        orderId: string;
        checkoutUrl: string;
        amountCents: number;
        expiresAt: string;
      }>("/checkout", { plate }, { headers: { "Idempotency-Key": requestKey } })
    ).data;
  },
  async getCheckoutStatus(orderId: string) {
    return (
      await http.get<CheckoutStatus>(
        `/checkout/status/${encodeURIComponent(orderId)}`,
      )
    ).data;
  },
  async getPurchases(offset = 0) {
    return (
      await http.get<{ orders: Purchase[]; nextOffset: number | null }>(
        "/account/orders",
        { params: { offset } },
      )
    ).data;
  },
  async requestSupport(
    orderId: string,
    kind: "refund" | "error",
    message: string,
  ) {
    return (
      await http.post<{ protocol: string; message: string }>(
        "/account/support",
        { orderId, kind, message },
      )
    ).data;
  },
  async getAccountHistory() {
    return (await http.get<FullVehicleReport[]>("/auth/reports")).data;
  },
  async getFullReport(orderId: string) {
    return (
      await http.post<FullVehicleReport>(
        `/vehicle/orders/${encodeURIComponent(orderId)}/report`,
        {},
        { timeout: 60000 },
      )
    ).data;
  },
  async requestInspectionBooking(data: InspectionBookingRequest) {
    return (
      await http.post<{ success: boolean; protocol: string }>(
        "/inspection/schedule",
        data,
      )
    ).data;
  },
  async requestInsuranceQuote(data: InsuranceQuoteRequest) {
    return (
      await http.post<{ success: boolean; protocol: string }>(
        "/insurance/quote",
        data,
      )
    ).data;
  },
};
