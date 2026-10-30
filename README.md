# DNAutos Vistorias

Plataforma de consulta de histórico veicular com interface DNAutos, autenticação, checkout e histórico de consultas por conta.

## Executar localmente

1. Copie `backend/.env.example` para `backend/.env` e gere um segredo longo para `JWT_SECRET`.
2. Preencha as credenciais empresariais da AnyCar e as credenciais/preço do Mercado Pago quando estiverem disponíveis.
3. Copie `.env.example` para `.env` na raiz.
4. Na raiz, rode `npm run dev:all`.

O banco SQLite é criado em `backend/data/benzcheck.sqlite` para desenvolvimento local. Para usar o arquivo isolado de testes no PowerShell, execute dentro de `backend`: `$env:DATABASE_PATH='./data/benzcheck-test.sqlite'; npm run dev`. Em produção, use a variável `DATABASE_URL` com uma conexão Postgres persistente.

## Deploy automático na Vercel

O `vercel.json` configura o frontend Vite e a API Express como Services na mesma origem (`/` e `/api`). Na importação do GitHub, escolha **Import multi-service project** e confirme o preset **Services**. O projeto Vercel precisa ter acesso ao recurso Services (Beta).

Antes de usar produção, conecte um Postgres pelo Vercel Marketplace (por exemplo, Neon) e disponibilize a variável `DATABASE_URL` pooled para o backend. O SQLite local é mantido para desenvolvimento. Em Preview sem `DATABASE_URL`, é criado um SQLite temporário em `/tmp/dnautos-preview.sqlite`, somente para testes; ele pode ser apagado e não é compartilhado entre instâncias. Production recusa iniciar sem `DATABASE_URL`. Dados existentes em `backend/data/benzcheck.sqlite` não são copiados automaticamente para o novo banco.

Cadastre as variáveis de `backend/.env.example` no ambiente do backend na Vercel. Em produção, são necessárias pelo menos `DATABASE_URL`, `JWT_SECRET`, `REPORT_PRICE`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `FIPE_API_URL` e `FIPE_API_KEY`. Após assinar a AnyCar, inclua `ANYCAR_API_URL`, `ANYCAR_API_KEY` e `ANYCAR_REPORT_TYPES`. Defina `PUBLIC_APP_URL` e `PUBLIC_API_URL` com o domínio da implantação. Conecte o projeto ao GitHub e escolha a branch de produção; commits nessa branch acionam novos deploys.

A variável pública opcional `VITE_API_URL` pode ficar vazia: em produção o frontend chama `/api` no mesmo domínio. Segredos e `DATABASE_URL` devem ficar apenas no backend.

## Fluxo de consulta

1. O cliente cria uma conta ou entra.
2. Informa a placa e o backend cria uma preferência de pagamento no Mercado Pago.
3. O Mercado Pago chama o webhook; o backend consulta o status diretamente no gateway e valida o valor.
4. Só um pagamento aprovado gera o token de acesso temporário ao relatório.
5. A resposta AnyCar é normalizada para os cartões atuais e a resposta original fica disponível em “Dados complementares”.
6. Relatórios são guardados por conta e aparecem em Minhas Consultas.

## Integrações pendentes de credenciais

Depois de assinar o plano empresarial, siga o [guia passo a passo para conectar a AnyCar](ANYCAR_SETUP.md). Ele explica quais dados solicitar ao fornecedor, como configurar o backend e como validar a resposta real antes de publicar.

O backend está estruturado para a API REST empresarial AnyCar (`POST /api/consultar`, header `x-api-key`) e aceita um ou mais tipos de consulta configurados em `ANYCAR_REPORT_TYPES`. Configure apenas tipos cobertos pelo contrato e crédito empresarial contratado; cada chamada pode ter cobrança própria. O schema público dá exemplos de dados cadastrais, FIPE, leilão, sinistro e gravame, mas o contrato/OpenAPI e a composição exata do relatório da conta são necessários para fechar o mapeamento de produção.

Para pagamento, foi escolhido Mercado Pago Checkout Pro: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `REPORT_PRICE`, `PUBLIC_APP_URL` e `PUBLIC_API_URL` precisam ser configurados. O gateway só aceita o valor definido pelo backend; não é enviado pelo navegador.

Veja `backend/.env.example` para a lista das variáveis. Sem essas configurações, checkout e consulta retornam erro explícito de configuração e nenhuma cobrança ou dado fictício é apresentado.
