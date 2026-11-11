# DNAutos Vistorias

Consulta veicular por placa com frontend React/Vite e backend Express. Integrações preparadas para Supabase, Mercado Pago e ANYCAR.

A Tabela FIPE é gratuita e pública: funciona sem login, banco ou configuração dos pagamentos. Somente a consulta por placa exige conta e pagamento prévio de R$ 50,00. Inicie frontend e backend com npm run dev:all para usar a FIPE localmente.

## Organização

```text
frontend/                 Aplicação Web e configurações Vite/TypeScript/Tailwind
  src/                    Componentes, hooks, serviços HTTP e tipos da interface
  public/                 Imagens e ícones públicos
backend/
  src/config/             Ambiente e parâmetros do servidor
  src/contracts/          Tipos de domínio usados pela API
  src/database/           Cliente PostgreSQL e transações
  src/http/               Montagem de rotas e middlewares globais
  src/modules/            Auth, conta, checkout, veículo, FIPE e manutenção
  src/integrations/       Adaptadores ANYCAR, Mercado Pago, Supabase e FIPE
  src/shared/             Validação, criptografia e erros compartilhados
  tests/                  Testes de API, segurança e regras de negócio
deploy/                   Compose, proxy HTTPS e ambiente da hospedagem
supabase/                 Migrations e privilégios do banco
tests/browser/            Testes que atravessam frontend e API
tests/production/         Validação do servidor compilado e arquivos públicos
scripts/                  Verificação de imports e geração do guia PDF
docs/                     Arquitetura, integração, deploy e evidências de testes
output/pdf/               Guia de integração e hospedagem
```

A raiz coordena as aplicações. Cada pacote possui seu próprio package.json e lockfile. O frontend não importa código privado do backend. As URLs públicas da API continuam em /api.

## Instalar e executar

Use Node.js 24. Na raiz:

```text
npm ci
npm run setup
```

Copie frontend/.env.example para frontend/.env e backend/.env.example para backend/.env. Somente variáveis públicas VITE_* pertencem ao frontend; credenciais permanecem no backend.

```text
npm run dev:all
```

Abra http://localhost:5110. npm run dev e npm run dev:backend iniciam cada aplicação separadamente. As vendas permanecem desativadas até os serviços e o contrato ANYCAR serem homologados.

## Verificação

- npm run check:imports: caminhos locais, diferenças de maiúsculas/minúsculas e separação frontend/backend.
- npm run build:all: compila ambas as aplicações.
- npm test: rotas, segurança e regras de negócio.
- npm run test:browser: fluxo no navegador, incluindo a API local.
- npm run test:production: execute após build:all para validar o mesmo processo servindo frontend/dist e /api.
- npm run audit: auditoria dos três pacotes.
- npm --prefix backend run doctor: diagnóstico dos serviços configurados.

O Playwright usa Edge no Windows conforme playwright.config.ts. Os testes de provedores usam respostas simuladas, sem pagamentos reais.

## Hospedagem e documentação

vercel.json aponta Vite para frontend/ e Express para backend/. Dockerfile/Compose publicam os dois no mesmo processo e domínio; a saída Web é frontend/dist e a API é backend/dist. npm start inicia a versão compilada; SERVE_FRONTEND=true habilita os arquivos Web.

- [Guia PDF](output/pdf/guia-integracao-deploy-dnautos.pdf)
- [Integração e deploy](docs/GUIA_INTEGRACAO_DEPLOY.md)
- [Arquitetura e segurança](docs/ARQUITETURA_SEGURANCA.md)
- [Interface Liquid Glass](docs/INTERFACE.md)
- [Verificação e limitações](docs/VERIFICACAO.md)
- [Contrato ANYCAR](ANYCAR_SETUP.md)

Cada compra custa R$ 50,00 e pertence a uma placa. O preço e a liberação são conferidos no servidor. Sessões expiram após 30 minutos sem atividade. Pedidos de estorno geram protocolo e dependem de processamento operacional no gateway.
