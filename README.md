# DNAutos Vistorias

Plataforma de consulta de histórico veicular com interface DNAutos, autenticação, checkout e histórico de consultas por conta.

## Executar localmente

1. Copie `backend/.env.example` para `backend/.env` e gere um segredo longo para `JWT_SECRET`.
2. Preencha as credenciais empresariais da AnyCar e as credenciais/preço do Mercado Pago quando estiverem disponíveis.
3. Copie `.env.example` para `.env` na raiz.
4. Na raiz, rode `npm run dev:all`.

O banco SQLite é criado em `backend/data/benzcheck.sqlite`. Em produção, configure `DATABASE_PATH` para armazenamento persistente, faça backup e proteja o disco. Uma implantação com múltiplas instâncias deve migrar esta camada para PostgreSQL.

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
