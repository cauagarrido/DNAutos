# Conectar a API empresarial da AnyCar

Este guia serve para ativar a integração depois da contratação. O backend já está preparado para enviar consultas pela placa, normalizar os campos conhecidos e conservar a resposta original da AnyCar no relatório.

> Use somente credenciais, tipos de consulta, ambiente e limites incluídos no contrato empresarial. Cada tipo solicitado pode ser uma chamada cobrada separadamente. Confirme isso com a AnyCar antes de habilitar vários tipos em produção.

## 1. Peça à AnyCar estes dados

Solicite ao contato comercial/técnico:

- URL base da API de produção e, se houver, URL do ambiente de testes.
- API key do ambiente de testes e da produção.
- Contrato OpenAPI/Swagger da sua conta e exemplos reais das respostas.
- Códigos `tipo` disponíveis no seu pacote para cadastral, FIPE, débitos, leilão, sinistro, gravame, restrições, roubo/furto, recall, frota/locadora, score e quilometragem.
- Preço/créditos por tipo, limite de chamadas, timeout e regra de reembolso quando a resposta vier vazia ou indisponível.

A documentação pública mostra o formato `POST /api/consultar`, `x-api-key` e um corpo com `tipo` e `placa`, além de exemplos de tipos como `veicular-dados-basicos`, `veicular-fipe`, `veicular-gravame`, `veicular-leilao-1` e `veicular-sinistro-1`. O contrato da sua conta é a referência final para a lista e o formato das respostas: [API empresarial AnyCar](https://anycar.com.br/para-empresas/api).

## 2. Prepare o ambiente local

No PowerShell, a partir da pasta do projeto:

```powershell
Copy-Item backend/.env.example backend/.env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copie o valor aleatório gerado para `JWT_SECRET` em `backend/.env`. O arquivo `.env` é ignorado pelo Git; não coloque chaves no frontend, em `src/`, no `.env.example` nem em prints compartilhados.

## 3. Configure a AnyCar

Edite `backend/.env` e preencha:

```dotenv
ANYCAR_API_URL=https://URL-BASE-FORNECIDA-PELA-ANYCAR
ANYCAR_API_KEY=CHAVE-DO-AMBIENTE-EM-USO
ANYCAR_REPORT_TYPES=veicular-dados-basicos,veicular-fipe,veicular-gravame,veicular-leilao-1,veicular-sinistro-1
```

- `ANYCAR_API_URL` deve conter a origem/base informada pela AnyCar; o backend acrescenta `/api/consultar`.
- `ANYCAR_API_KEY` fica somente no backend e é enviada no cabeçalho `x-api-key`.
- `ANYCAR_REPORT_TYPES` aceita um tipo ou uma lista separada por vírgulas. Troque o exemplo pelos códigos efetivamente liberados no seu contrato; inclua os demais tipos somente após confirmar preço e cobertura.

Se a AnyCar entregar um único tipo de relatório completo, ele também pode ser configurado sozinho em `ANYCAR_REPORT_TYPES`.

## 4. Configure login, preço e retorno do pagamento

Para permitir que o relatório pago seja exibido, configure também no mesmo `backend/.env`:

```dotenv
MERCADO_PAGO_ACCESS_TOKEN=TOKEN-PRIVADO-DA-APLICACAO
MERCADO_PAGO_WEBHOOK_SECRET=SEGREDO-DO-WEBHOOK
REPORT_PRICE=0
PUBLIC_APP_URL=https://SEU-DOMINIO
PUBLIC_API_URL=https://SUA-API-PUBLICA
CORS_ORIGIN=https://SEU-DOMINIO
```

Substitua `REPORT_PRICE=0` pelo preço aprovado para o cliente. O valor é definido no backend; o navegador não pode escolher o preço. Configure no painel do Mercado Pago o webhook HTTPS para:

```text
https://SUA-API-PUBLICA/api/checkout/webhook
```

Ative notificações de pagamentos e use o segredo de assinatura fornecido pelo Mercado Pago. Em desenvolvimento local, use as credenciais de teste e um endpoint HTTPS de teste que você controle; não use pagamento real para validar a integração.

## 5. Faça uma chamada de validação com o ambiente de testes

1. Confirme que `ANYCAR_API_URL` e `ANYCAR_API_KEY` apontam ambos para testes e que a placa/código de teste é fornecido pela AnyCar.
2. Inicie o projeto na raiz:

   ```powershell
   npm run dev:all
   ```

3. Crie uma conta de teste no site, informe a placa de teste e complete um pagamento de sandbox.
4. Confirme no log do backend que a consulta chegou à AnyCar, que o webhook confirmou o pagamento e que a API retornou dados.
5. No relatório, confira os cartões e abra **Dados complementares da consulta**. Compare esse JSON com o exemplo OpenAPI da conta, incluindo campos ausentes, valores nulos, enumerações e textos de “sem registro”.
6. Repita para cada tipo configurado e confira no painel empresarial os créditos consumidos.

Se não houver sandbox para a API AnyCar, peça à AnyCar uma placa de teste e autorização explícita para a chamada. A execução por placa pode consumir crédito.

## 6. Ajuste o mapeamento ao OpenAPI contratado

O adaptador atual normaliza os dados mais comuns em `backend/src/services/anycarService.ts` e mantém todas as respostas em `providerData`. Depois de comparar as amostras reais:

1. Atualize a leitura de cada tipo de resposta em `toReport()` no arquivo acima.
2. Preserve valores desconhecidos como **Não informado**. Não converta campo ausente em “sem ocorrência”, score `0` ou valor `R$ 0`.
3. Para campos que não têm cartão correspondente, adicione uma seção nomeada no relatório, usando `providerData.consultas` como fonte.
4. Confirme que o status “sem registro” vem explicitamente da API; a ausência de uma propriedade não prova ausência de ocorrência.
5. Rode `npm run build` na raiz e em `backend`.

## 7. Passe para produção

1. Troque as chaves de teste pelas de produção em `backend/.env` do servidor.
2. Confirme os tipos e custo máximo de uma consulta completa com a AnyCar.
3. Configure URLs HTTPS públicas e o webhook de produção no Mercado Pago.
4. Configure `REPORT_PRICE`, `JWT_SECRET`, `CORS_ORIGIN`, `PUBLIC_APP_URL` e `PUBLIC_API_URL` para produção.
5. Faça uma única consulta controlada e confira status no Mercado Pago, consumo no painel AnyCar, relatório, histórico da conta e logs do backend.
6. Configure armazenamento persistente e backup para `DATABASE_PATH`. A instalação atual usa SQLite em um único backend; múltiplas instâncias precisam compartilhar uma base PostgreSQL antes de escalar.

## Diagnóstico rápido

- **`Integração AnyCar ainda não configurada`**: faltam `ANYCAR_API_URL`, `ANYCAR_API_KEY` ou `ANYCAR_REPORT_TYPES` no `backend/.env`; reinicie o backend após alterar.
- **401/403 da AnyCar**: confira ambiente e API key correspondente.
- **404**: confirme a URL base e se o backend está apontando para o host de produção/testes correto.
- **Resposta sem `dados`**: compare o código `tipo` e o formato da resposta com o OpenAPI da conta.
- **Checkout informa que não está configurado**: confira token do Mercado Pago e `REPORT_PRICE > 0`.
- **Pagamento fica aguardando**: confirme HTTPS, evento de pagamento habilitado, URL do webhook e `MERCADO_PAGO_WEBHOOK_SECRET`.
- **Relatório ou campos em falta**: abra “Dados complementares da consulta” e ajuste `toReport()` com o formato real; não invente valores padrão.
