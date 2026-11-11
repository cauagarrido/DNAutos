# Backend DNAutos

Express/TypeScript com Supabase Auth e PostgreSQL privado. Veja o [guia completo](../docs/GUIA_INTEGRACAO_DEPLOY.md).

Use Node 24. Na raiz do repositório, execute npm ci e npm run setup; copie backend/.env.example para backend/.env e configure os serviços. npm run dev:backend inicia a API pela raiz. Dentro de backend/, npm run dev, npm run build e npm start executam os comandos próprios do servidor. Não há SQLite nem autenticação local de produção.

## Endpoints
- /api/auth: register, login, session, activity, logout, recover, resend, confirm, password, google, callback e mfa/challenge/verify.
- POST /api/checkout: body {plate} e Idempotency-Key UUID. O servidor define o preço.
- GET /api/checkout/status/:orderId: estado da compra do usuário.
- POST /api/checkout/webhook: assinatura Mercado Pago e verificação da Payments API.
- POST /api/vehicle/orders/:orderId/report: consulta autenticada com compra aprovada.
- GET /api/account/orders: histórico paginado de compras.
- POST /api/account/support: protocolo de erro/estorno.
- GET /api/maintenance/reconcile: manutenção com Bearer CRON_SECRET.
- /api/health e /api/config: estado público sem segredos.

Todas as mutações do navegador exigem Origin exata, JSON e X-App-Request: 1. Somente o webhook usa assinatura do provedor como autenticação. O cron usa segredo próprio. Autenticação não aceita Bearer do navegador.

npm test verifica lógica e SQL em PostgreSQL embarcado com provedores simulados. npm run doctor verifica configuração e conexão reais, sem imprimir segredos.

SERVE_FRONTEND=true permite servir frontend/dist no mesmo processo Node. Vercel exporta a aplicação Express separadamente. Nada assíncrono é deixado rodando depois de enviar a resposta.
