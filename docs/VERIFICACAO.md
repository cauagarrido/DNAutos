# Verificação da implementação

Data: 11/11/2026. Nenhum serviço real foi criado nem publicado.

| Verificação | Evidência local | Alcance |
| --- | --- | --- |
| Build frontend/backend | npm run build:all passou em Node.js 24.22.2 | TypeScript, Vite e Express |
| Imports | 153 imports locais em 59 arquivos verificados | Caminhos, maiúsculas/minúsculas e fronteiras frontend/backend |
| Backend | 34 testes passaram em Node.js 24 | PGlite/PostgreSQL embarcado; provedores simulados, incluindo FIPE via servidor HTTP local |
| Processo compilado | 4 testes passaram em Node.js 24 | Frontend/dist, arquivos públicos, rotas /api, SPA, CSP e ausência de segredos no bundle |
| Navegador | 11 cenários Playwright/Edge passaram | Responsividade, teclado, formulários, FIPE gratuita, API indisponível e sessão/compra simuladas na fronteira HTTP |
| Acessibilidade automática | Zero violações axe nos critérios WCAG A/AA selecionados | Página inicial, modal de login e resultado FIPE; não substitui revisão manual |
| Dependências | Zero vulnerabilidades reportadas por npm run audit nos três pacotes | Fotografia do registry; não é garantia contra falhas desconhecidas |
| Vercel | vercel.json validado contra o schema oficial: zero erros | Validação estrutural; não equivale a deploy |
| PDF | 17 páginas renderizadas e inspecionadas | Sem alertas de overflow/glyphs; revisão visual realizada |

Os testes do backend cobrem preço/constraint, validação de entrada, CSRF, assinatura e timestamp, moeda/recebedor/ambiente, duplicidade, estorno/replay, acesso por proprietário, única execução do provedor, falhas incertas, cookies, inatividade, heartbeat, logout, bloqueio após cinco erros e recuperação restrita.

Também cobrem MFA existente, primeiro enrollment, vínculo do challenge, PKCE/callback, indisponibilidade temporária do Auth, RLS, privilégios do runtime e normalização conservadora de dados ANYCAR.

Na reorganização, foram adicionados testes para todas as rotas protegidas, JSON inválido, payload excessivo, origem/cabeçalho CSRF, tentativa de alterar IP por X-Forwarded-For, autorização do cron e quatro rotas FIPE com validação de parâmetros. JSON malformado agora retorna 400, payload excessivo retorna 413, parâmetros FIPE são validados antes da chamada e redirects externos do adaptador FIPE ficam desabilitados. O processo compilado aplica DENY/frame-ancestors none também ao frontend servido pelo Node.

O navegador verifica cadastro com e-mail/senha, mensagem de serviços indisponíveis, preço de R$ 50,00, compra aprovada, suporte e solicitação de estorno. O fluxo simulado não envia pagamentos reais.

O redesign Liquid Glass também foi inspecionado por capturas em 320, 390, 768 e 1440 px. Os testes verificam limites da tela, navegação mobile, FAQ, abas por teclado, preferência de movimento reduzido, foco/restauração do modal, campos legíveis no celular e seleção FIPE até o relatório e retorno. A renderização em Safari/iOS e aparelhos Android reais ainda precisa de homologação.

Na revisão de limpeza, todos os módulos de código foram encontrados no grafo das aplicações. Foram removidos imports, propriedades, callback e estilos sem uso, além de configurações Tailwind não utilizadas. O frontend agora exige noUnusedLocals e noUnusedParameters no build. Os 44 testes foram executados novamente após a limpeza. Capturas, resultados temporários, caches Vite e saídas compiladas podem ser recriados pelos comandos abaixo; execute build:all antes de start ou test:production.

A falha FIPE foi reproduzida no navegador e na API local: o limitador privado exigia AUTH_RATE_SECRET e banco, retornando 503 antes de consultar o provedor. O limitador público independente corrigiu essa dependência. Os quatro novos testes usam o cliente HTTP real contra um servidor FIPE local, sem banco ou credenciais, verificam isolamento das rotas pagas, entradas inválidas e limite/expiração/Retry-After sem confiar em X-Forwarded-For.

O teste de interface mantém /api/config pendente e comprova que a FIPE conclui sem login, diálogo de pagamento ou chamadas às APIs privadas. A tela de resultado é específica da FIPE e não inventa histórico ou situação de uma placa. Os 49 testes passaram após a correção. Como os servidores de desenvolvimento estavam em uso, o navegador foi verificado contra o processo compilado em uma porta isolada.

Também houve consulta real anônima pelo navegador local: marca, modelo, ano e valor retornaram 200 através da API v2 Parallelum. Em 11/11/2026, o exemplo Fiat 147 C/CL, 1985 Gasolina, código 001124-0, retornou R$ 4.845,00 com referência novembro/2026. Esse teste confirma o funcionamento naquele momento, sujeito à disponibilidade e às cotas do provedor. O mesmo navegador exigiu login ao tentar a consulta por placa.

## Reproduzir
- npm ci
- npm run setup
- npm run check:imports
- npm run build:all
- npm test
- npm run test:production
- npm run test:browser
- npm run audit
- npm --prefix backend run doctor (espera falhar enquanto faltarem configurações)

O Playwright usa Edge no Windows; configure o navegador adequado em outras plataformas. Para recriar o PDF, instale scripts/requirements-pdf.txt e execute python scripts/generate_guide_pdf.py. O gerador usa Arial no Windows ou DejaVu no Linux.

## Homologação ainda necessária
Supabase real: migration, runtime role, certificados/pooler, advisors, SMTP, links, Google, SMS, limites e restauração. PGlite não comprova locks distribuídos ou conectividade de um cluster remoto.

Mercado Pago real: conta/credenciais, collector, Pix/QR, meios de cartão disponibilizados, assinatura real, entrega/reenvio, recusa, devolução e contestação. Respostas locais simuladas não confirmam habilitação comercial.

ANYCAR real: contrato, URL/método/autenticação, produtos, schema, faturamento, limites, idempotência e conciliação. O adaptador provisório pode precisar de ajustes. As vendas continuam desativadas até homologação.

Docker não está disponível nesta máquina. Dockerfile/Compose precisam de build e validação na VPS/homologação. Não houve deploy Vercel/Hostinger/HostGator, cadastro de domínio ou teste de webhook público.
