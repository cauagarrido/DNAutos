import axios from "axios";
import { API_BASE_URL } from "./config";
export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json", "X-App-Request": "1" },
});
http.interceptors.response.use(
  (value) => value,
  (error) => {
    if (
      error.response?.status === 401 &&
      !["/auth/login", "/auth/session"].some((path) =>
        error.config?.url?.includes(path),
      )
    )
      window.dispatchEvent(new Event("benz:session-expired"));
    return Promise.reject(error);
  },
);
export function errorMessage(
  error: unknown,
  fallback = "Não foi possível concluir. Tente novamente.",
) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message || fallback
    : error instanceof Error
      ? error.message
      : fallback;
}
