import axios from 'axios';
import { User, RegisterData, LoginData } from '../types/auth';
import { API_BASE_URL } from './config';
const STORAGE_KEY = 'benzcheck_session';
type Session = { user: User; token: string };
function load(): Session | null {
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return data?.token && data?.user ? data : null; } catch { return null; }
}
function save(session: Session) { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); }
export const authService = {
  async register(data: RegisterData): Promise<User> {
    try { const res = await axios.post<Session>(`${API_BASE_URL}/auth/register`, data); save(res.data); return res.data.user; }
    catch (e: any) { throw new Error(e.response?.data?.message || 'Não foi possível criar sua conta.'); }
  },
  async login(data: LoginData): Promise<User> {
    try { const res = await axios.post<Session>(`${API_BASE_URL}/auth/login`, data); save(res.data); return res.data.user; }
    catch (e: any) { throw new Error(e.response?.data?.message || 'Não foi possível entrar.'); }
  },
  logout() { localStorage.removeItem(STORAGE_KEY); },
  getCurrentUser(): User | null { return load()?.user ?? null; },
  getToken(): string | null { return load()?.token ?? null; },
  isAuthenticated() { return !!load()?.token; },
};
