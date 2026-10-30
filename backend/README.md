# DNAutos Vistorias — Backend

Express + TypeScript API for account login, paid vehicle reports, AnyCar integration, and account history.

## Local setup

1. Copy `.env.example` to `.env` and set a long random `JWT_SECRET`.
2. Add the AnyCar business credentials and only the report types included in the contract.
3. Add Mercado Pago credentials, a webhook secret, public HTTPS URLs, and the chosen `REPORT_PRICE`.
4. From the repository root, run `npm run dev:all`.

The built-in SQLite database is stored in `backend/data/benzcheck.sqlite` by default. Use persistent storage and backups in production; multi-instance deployments should use PostgreSQL.

## Main endpoints

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/auth/reports` and `DELETE /api/auth/reports` (session token required)
- `POST /api/checkout` and `GET /api/checkout/status/:paymentId` (session token required)
- `POST /api/checkout/webhook` (Mercado Pago signature checked; payment verified with gateway)
- `GET /api/vehicle/report/:plate` (temporary report token required)
- `GET /api/fipe/*` (FIPE calls go through backend)

## AnyCar contract

The adapter uses the public REST shape `POST {ANYCAR_API_URL}/api/consultar`, the `x-api-key` header, and a `{ tipo, placa }` body. Set `ANYCAR_REPORT_TYPES` to one type or a comma-separated list included in the signed plan. The provider responses are preserved in `providerData` and shown in the report. Final field-by-field mapping depends on the account's OpenAPI contract and its actual response samples.
