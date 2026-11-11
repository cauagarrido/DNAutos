# Integração ANYCAR

O backend está preparado para um provedor de consultas pagas, mas o contrato ANYCAR ainda não foi fornecido.

O transporte provisório em backend/src/integrations/anycar/anycar.client.ts pressupõe POST /api/consultar, x-api-key, body {tipo,placa} e resposta {status,dados}. Não trate essas suposições como contrato confirmado.

1. Obtenha documentação, credenciais, tipos, limites, cobrança e amostras anonimizadas do produto.
2. Compare e ajuste o transporte e toReport ao contrato real.
3. Configure URL HTTPS, chave e apenas os produtos autorizados.
4. Teste com placa autorizada e confira o consumo no fornecedor.
5. Preserve campos desconhecidos como não informados; não deduza gravidade, regularidade ou origem da informação.
6. Revise dados pessoais e mapeie somente campos necessários. Não exiba a resposta bruta.
7. Só então use ANYCAR_CONTRACT_VERIFIED=true. CHECKOUT_ENABLED=true é uma liberação separada, após homologar autenticação/pagamento/atendimento.

Uma chamada com resultado incerto vai para análise; não é repetida automaticamente. Conciliar com o fornecedor antes de permitir outra tentativa evita cobranças duplicadas. Uma consulta pode incluir vários tipos e consumir mais de um crédito ANYCAR.

Veja o [guia de integração e deploy](docs/GUIA_INTEGRACAO_DEPLOY.md), especialmente as etapas 7, 8, 14 e 15.
