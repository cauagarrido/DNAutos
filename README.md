# DNAutos Vistorias

Consulta veicular por placa com React/Vite, Express e preparação para Supabase Auth/PostgreSQL, Mercado Pago Checkout Pro e ANYCAR.

## Executar
Use Node.js 24. Execute npm ci e npm ci --prefix backend, copie os dois .env.example para .env e configure os serviços conforme o guia. Depois execute npm run dev:all e abra http://localhost:5110.

As vendas ficam desativadas enquanto os serviços e o contrato ANYCAR não estiverem homologados. Não existem credenciais nem simulações de pagamento aprovadas em produção.

## Documentação
- [Guia completo em PDF](output/pdf/guia-integracao-deploy-dnautos.pdf)
- [Guia editável de integração e hospedagem](docs/GUIA_INTEGRACAO_DEPLOY.md)
- [Arquitetura e segurança](docs/ARQUITETURA_SEGURANCA.md)
- [Validação e limitações](docs/VERIFICACAO.md)
- [Integração ANYCAR](ANYCAR_SETUP.md)
- [Configuração do backend](backend/.env.example)

## Verificar
- npm run build:all
- npm test
- npx playwright test (configurado para Edge no Windows)
- npm --prefix backend run doctor (depende dos serviços configurados)

Frontend e API compartilham o domínio. vercel.json prepara os dois Services na Vercel. Dockerfile e deploy/compose.yaml preparam o processo completo para uma VPS; backend/.env nunca deve ser versionado.

O preço de uma consulta é R$ 50,00, validado no servidor e no banco. Cada compra libera uma placa. A senha pertence ao Supabase Auth; o navegador usa cookie HttpOnly e o backend expira sessões após 30 minutos sem atividade.

A solicitação de estorno gera um protocolo e exige atendimento operacional. O processamento da devolução ocorre no Mercado Pago e sua confirmação chega por webhook.
