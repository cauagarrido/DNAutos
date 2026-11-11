import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { authService } from "../services/authService";
import {
  AuthSession,
  PublicConfig,
  RegisterData,
  LoginData,
} from "../types/auth";
import { errorMessage } from "../services/http";
interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthSession["user"] | null;
  session: AuthSession | null;
  config: PublicConfig | null;
  loading: boolean;
  login: (data: LoginData) => Promise<AuthSession>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
  authError: string | null;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null),
    [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true),
    [authError, setAuthError] = useState<string | null>(null);
  const lastActivity = useRef(Date.now()),
    lastHeartbeat = useRef(0);
  const refresh = useCallback(async () => {
    try {
      const next = await authService.session();
      setSession(next);
      lastActivity.current = Date.now();
      return next;
    } catch {
      setSession(null);
      return null;
    }
  }, []);
  useEffect(() => {
    // Remove credentials/reports left by the previous localStorage implementation.
    try {
      localStorage.removeItem("benzcheck_session");
      localStorage.removeItem("benzcheck_history");
    } catch {
      // Authentication still works when the browser disables local storage.
    }
    let active = true;
    void authService
      .config()
      .then(async (value) => {
        if (!active) return;
        setConfig(value);
        if (value.authAvailable) await refresh();
      })
      .catch(() => {
        if (active)
          setAuthError(
            "Não foi possível conectar. Tente novamente mais tarde.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    const expired = () => {
      setSession(null);
      setAuthError("Sua sessão expirou. Entre novamente.");
    };
    window.addEventListener("benz:session-expired", expired);
    return () => window.removeEventListener("benz:session-expired", expired);
  }, []);
  useEffect(() => {
    if (!session) return;
    const activity = () => {
      const now = Date.now();
      lastActivity.current = now;
      if (now - lastHeartbeat.current > 60_000) {
        lastHeartbeat.current = now;
        void authService.activity().catch(() => {});
      }
    };
    // Polling the payment status does not renew idle sessions. Only real user input does.
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) =>
      window.addEventListener(event, activity, { passive: true }),
    );
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= 30 * 60_000) {
        setSession(null);
        setAuthError("Sessão encerrada após 30 minutos sem atividade.");
      }
    }, 10000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, activity));
      window.clearInterval(timer);
    };
  }, [session]);
  const login = useCallback(async (data: LoginData) => {
    const next = await authService.login(data);
    setSession(next);
    setAuthError(null);
    lastActivity.current = Date.now();
    return next;
  }, []);
  const register = useCallback(
    (data: RegisterData) => authService.register(data),
    [],
  );
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setSession(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(
        errorMessage(error, "Não foi possível sair. Tente novamente."),
      );
    }
  }, []);
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session && !session.mfaRequired && !session.recovery,
        user: session?.user ?? null,
        session,
        config,
        loading,
        login,
        register,
        logout,
        refresh,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
