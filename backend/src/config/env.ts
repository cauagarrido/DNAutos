import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  fipeApiUrl: process.env.FIPE_API_URL || 'https://fipe.api.br/api/v2',
  fipeApiKey: process.env.FIPE_API_KEY || '',
  anycarApiUrl: process.env.ANYCAR_API_URL || '',
  anycarApiKey: process.env.ANYCAR_API_KEY || '',
  anycarReportTypes: (process.env.ANYCAR_REPORT_TYPES || process.env.ANYCAR_REPORT_TYPE || '').split(',').map((type) => type.trim()).filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || '',
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/benzcheck.sqlite'),
  reportPrice: Number(process.env.REPORT_PRICE || '0'),
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  mercadoPagoWebhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
  publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
