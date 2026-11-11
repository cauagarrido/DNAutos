import { http } from "./http";
import {
  AuthSession,
  RegisterData,
  LoginData,
  PublicConfig,
} from "../types/auth";
export const authService = {
  async config() {
    return (await http.get<PublicConfig>("/config")).data;
  },
  async session() {
    return (await http.get<AuthSession>("/auth/session")).data;
  },
  async register(data: RegisterData) {
    return (await http.post<{ message: string }>("/auth/register", data)).data;
  },
  async login(data: LoginData) {
    await http.post("/auth/login", data);
    return this.session();
  },
  async logout() {
    await http.post("/auth/logout", {});
  },
  async activity() {
    await http.post("/auth/activity", {});
  },
  async recover(email: string) {
    return (await http.post<{ message: string }>("/auth/recover", { email }))
      .data;
  },
  async resend(email: string) {
    return (await http.post<{ message: string }>("/auth/resend", { email }))
      .data;
  },
  async confirm(tokenHash: string, type: "signup" | "recovery") {
    return (
      await http.post<{ message?: string; recovery?: boolean }>(
        "/auth/confirm",
        { tokenHash, type },
      )
    ).data;
  },
  async resetPassword(password: string) {
    return (
      await http.post<{ message: string }>("/auth/password", { password })
    ).data;
  },
  async google() {
    window.location.assign(
      (await http.post<{ url: string }>("/auth/google", {})).data.url,
    );
  },
  async challenge(phone?: string) {
    return (
      await http.post<{ factorId: string; challengeId: string }>(
        "/auth/mfa/challenge",
        phone ? { phone } : {},
      )
    ).data;
  },
  async verify(data: { factorId: string; challengeId: string; code: string }) {
    await http.post("/auth/mfa/verify", data);
    return this.session();
  },
};
