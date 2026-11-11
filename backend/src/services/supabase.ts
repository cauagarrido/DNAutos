import { createClient } from "@supabase/supabase-js";
import { env, authConfigured } from "../config/env";
import { HttpError } from "../utils/security";
// Per-request clients prevent tokens leaking between users.
export function authClient(storage?: Record<string, string>, pkce = false) {
  if (!authConfigured())
    throw new HttpError(503, "Autenticação ainda não configurada.");
  return createClient(env.supabaseUrl, env.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: !!storage,
      flowType: pkce ? "pkce" : "implicit",
      ...(storage
        ? {
            storage: {
              getItem: (key: string) => storage[key] ?? null,
              setItem: (key: string, value: string) => {
                storage[key] = value;
              },
              removeItem: (key: string) => {
                delete storage[key];
              },
            },
          }
        : {}),
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }),
    },
  });
}
