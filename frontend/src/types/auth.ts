export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
export interface RegisterData {
  email: string;
  password: string;
}
export interface LoginData {
  email: string;
  password: string;
}
export interface AuthSession {
  user: User;
  mfaRequired: boolean;
  needsEnrollment: boolean;
  factorId?: string;
  recovery: boolean;
}
export interface PublicConfig {
  authAvailable: boolean;
  checkoutAvailable: boolean;
  priceCents: number;
  supportUrl: string | null;
  requirePhoneMfa: boolean;
}
