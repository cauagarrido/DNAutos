# Verificação da implementação

Data: 11/11/2026. Nenhum serviço real foi criado nem publicado.

| Verificação | Evidência local | Alcance |
| --- | --- | --- |
| Build frontend/backend | npm run build:all passou em Node.js 24.22.2 | TypeScript, Vite e Express |
| Backend | 25 testes passaram em Node.js 24 | PGlite/PostgreSQL embarcado; provedores simulados |
| Navegador | 2 cenários Playwright/Edge passaram | API local indisponível + sessão/compra simuladas na fronteira HTTP |
| Dependências | Zero vulnerabilidades reportadas por npm audit nos dois pacotes | Fotografia do registry; não é garantia contra falhas desconhecidas |
| Vercel | vercel.json validado contra o schema oficial: zero erros | Validação estrutural; não equivale a deploy |
| PDF | 17 páginas renderizadas e inspecionadas | Sem alertas de overflow/glyphs; revisão visual realizada |

Os testes do backend cobrem preço/constraint, validação de entrada, CSRF, assinatura e timestamp, moeda/recebedor/ambiente, duplicidade, estorno/replay, acesso por proprietário, única execução do provedor, falhas incertas, cookies, inatividade, heartbeat, logout, bloqueio após cinco erros e recuperação restrita.

Também cobrem MFA existente, primeiro enrollment, vínculo do challenge, PKCE/callback, indisponibilidade temporária do Auth, RLS, privilégios do runtime e normalização conservadora de dados ANYCAR.

O navegador verifica cadastro com e-mail/senha, mensagem de serviços indisponíveis, preço de R$ 50,00, compra aprovada, suporte e solicitação de estorno. O fluxo simulado não envia pagamentos reais.

## Reproduzir
- npm run build:all
- npm test
- npx playwright test
- npm audit
- npm audit --prefix backend
- npm --prefix backend run doctor (espera falhar enquanto faltarem configurações)

O Playwright usa Edge no Windows; configure o navegador adequado em outras plataformas. Para recriar o PDF, instale scripts/requirements-pdf.txt e execute python scripts/generate_guide_pdf.py. O gerador usa Arial no Windows ou DejaVu no Linux.

## Homologação ainda necessária
Supabase real: migration, runtime role, certificados/pooler, advisors, SMTP, links, Google, SMS, limites e restauração. PGlite não comprova locks distribuídos ou conectividade de um cluster remoto.

Mercado Pago real: conta/credenciais, collector, Pix/QR, meios de cartão disponibilizados, assinatura real, entrega/reenvio, recusa, devolução e contestação. Respostas locais simuladas não confirmam habilitação comercial.

ANYCAR real: contrato, URL/método/autenticação, produtos, schema, faturamento, limites, idempotência e conciliação. O adaptador provisório pode precisar de ajustes. As vendas continuam desativadas até homologação.

Docker não está disponível nesta máquina. Dockerfile/Compose precisam de build e validação na VPS/homologação. Não houve deploy Vercel/Hostinger/HostGator, cadastro de domínio ou teste de webhook público.
