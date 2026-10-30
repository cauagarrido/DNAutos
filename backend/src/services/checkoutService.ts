import axios from 'axios';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { db } from './database';
import { env } from '../config/env';
import { signReportToken } from './reportToken';

export class CheckoutService {
  static async create(plate: string, userId: string) {
    if (!env.mercadoPagoAccessToken || !env.reportPrice || env.reportPrice <= 0) {
      const e = new Error('Checkout ainda não configurado: informe o preço final e as credenciais do Mercado Pago.') as Error & { status: number }; e.status = 503; throw e;
    }
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z0-9]{7}$/.test(clean)) throw new Error('Placa inválida.');
    const id = randomUUID(); const expires = new Date(Date.now() + 30 * 60_000).toISOString();
    const response = await axios.post('https://api.mercadopago.com/checkout/preferences', {
      items: [{ id: 'consulta-completa', title: `Consulta veicular ${clean}`, quantity: 1, currency_id: 'BRL', unit_price: env.reportPrice }],
      external_reference: id,
      notification_url: `${env.publicApiUrl.replace(/\/$/, '')}/api/checkout/webhook`,
      back_urls: { success: `${env.publicAppUrl}/?pagamento=sucesso&paymentId=${id}`, pending: `${env.publicAppUrl}/?pagamento=pendente&paymentId=${id}`, failure: `${env.publicAppUrl}/?pagamento=falhou&paymentId=${id}` },
      auto_return: 'approved',
    }, { headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` } });
    db.prepare('INSERT INTO payments (id,user_id,plate,amount,status,mp_preference_id,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, userId, clean, Math.round(env.reportPrice * 100), 'pending', response.data.id, new Date().toISOString(), expires);
    return { paymentId: id, checkoutUrl: response.data.init_point, amount: env.reportPrice, plate: clean, expiresAt: expires };
  }

  static status(id: string, userId: string) {
    const row = db.prepare('SELECT id,plate,status,report_token FROM payments WHERE id=? AND user_id=?').get(id, userId) as any;
    if (!row) { const e = new Error('Pagamento não encontrado.') as Error & { status: number }; e.status = 404; throw e; }
    return { paymentId: row.id, plate: row.plate, status: row.status, isPaid: row.status === 'approved', reportToken: row.report_token ?? undefined };
  }

  static verifyWebhookSignature(dataId: string, requestId: string, signature: string) {
    if (!env.mercadoPagoWebhookSecret) return false;
    const parts = Object.fromEntries(signature.split(',').map((x) => x.split('=').map((v) => v.trim())));
    if (!parts.ts || !parts.v1) return false;
    const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
    const expected = createHmac('sha256', env.mercadoPagoWebhookSecret).update(manifest).digest();
    const actual = Buffer.from(parts.v1, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  static async processWebhook(dataId: string) {
    if (!env.mercadoPagoAccessToken) return;
    const payment = (await axios.get(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` } })).data;
    const ref = payment.external_reference as string | undefined;
    if (!ref) return;
    const row = db.prepare('SELECT * FROM payments WHERE id=?').get(ref) as any;
    if (!row || Number(payment.transaction_amount) !== row.amount / 100) return;
    const status = payment.status === 'approved' ? 'approved' : payment.status === 'rejected' ? 'rejected' : 'pending';
    const token = status === 'approved' ? signReportToken({ userId: row.user_id, paymentId: row.id, plate: row.plate }, 30 * 60) : null;
    db.prepare('UPDATE payments SET status=?, mp_payment_id=?, report_token=? WHERE id=?').run(status, String(dataId), token, ref);
  }
}
