const isProduction = Boolean((import.meta as any).env?.PROD);
export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || (isProduction ? '/api' : 'http://localhost:3000/api');
