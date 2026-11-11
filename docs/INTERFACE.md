# Interface Liquid Glass

O frontend usa a linguagem visual apresentada em [Liquid Glass Design](https://liquidglassdesign.com/what-is-liquid-glass): superfícies translúcidas, reflexos, profundidade e controles flutuantes. A identidade DNAutos permanece no logotipo e nos detalhes em laranja.

## Organização

- `frontend/src/components/ui/LiquidGlass.tsx`: superfície reutilizável, filtro SVG de refração e iluminação por ponteiro com requestAnimationFrame. O efeito não provoca renderizações React a cada movimento.
- `frontend/src/index.css`: cores, materiais, tipografia, estados, modais e adaptações de tela.
- `frontend/src/components/hero/HeroSearch.tsx`: entrada por placa e abas acessíveis para FIPE.
- `frontend/src/components/home/HomeSections.tsx`: serviços, etapas da compra e perguntas frequentes.
- `frontend/src/components/layout/`: navegação e rodapé.

A transparência fica concentrada na navegação, formulário e modais. Textos e dados usam fundos mais opacos para preservar a leitura. A refração atua no fundo, sem deformar os textos. Nenhuma dependência de animação foi adicionada ao frontend.

## Responsividade e acessibilidade

O layout adapta colunas, navegação e espaçamentos. No celular, a imagem vira fundo do formulário para antecipar o acesso à consulta. Os modais possuem rolagem interna e os campos de autenticação usam pelo menos 16 px para evitar zoom automático em navegadores móveis.

Há link para pular a navegação, foco visível, abas operáveis por setas/Home/End, fechamento de menus e modais por Escape, contenção e restauração de foco nos modais e FAQ com elementos nativos. As preferências de movimento e transparência reduzidos são respeitadas. Navegadores sem backdrop-filter recebem superfícies opacas.

## Verificação

Execute `npm run test:browser` na raiz. Os testes cobrem larguras de 320, 390, 768 e 1440 px, ausência de overflow horizontal, navegação, formulários, teclado, movimento reduzido, análise automática com axe, FIPE e compra simulada. Capturas são geradas em `tmp/`, fora do Git.

O ambiente verificado usa Edge/Chromium. Ainda é necessário validar visualmente em aparelhos iOS/Safari e Android reais. A análise automática de acessibilidade não substitui avaliação manual com leitores de tela.

O redesign preserva os endpoints e as regras de autenticação, preço e liberação pelo servidor. Supabase, Mercado Pago e ANYCAR continuam dependentes de configuração e homologação reais.
