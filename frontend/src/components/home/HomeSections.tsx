import {
  ArrowDownRight,
  ArrowRight,
  BookOpenCheck,
  CarFront,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  FileCheck2,
  Gavel,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { LiquidGlass } from "../ui/LiquidGlass";

const features = [
  {
    icon: BookOpenCheck,
    number: "01",
    title: "O passado importa.",
    tag: "Histórico veicular",
    description:
      "Registros que ajudam a entender a trajetória de um veículo e a fazer perguntas melhores.",
  },
  {
    icon: FileCheck2,
    number: "02",
    title: "Documentos em foco.",
    tag: "Situação documental",
    description:
      "Débitos e restrições, quando informados pelo provedor, para uma negociação mais consciente.",
  },
  {
    icon: Gavel,
    number: "03",
    title: "Atenção aos detalhes.",
    tag: "Leilão e sinistro",
    description:
      "Informações sobre ocorrências que podem fazer diferença na sua decisão de compra.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "04",
    title: "Valor em perspectiva.",
    tag: "Tabela FIPE",
    description:
      "Uma referência de preço para comparar com o valor anunciado e planejar os próximos passos.",
  },
];
const questions = [
  [
    "Quanto custa uma consulta?",
    "A Tabela FIPE é gratuita e não exige login. Apenas a consulta por placa exige uma conta e custa R$ 50,00 por veículo. Você confere a placa e o valor antes de seguir para o pagamento.",
  ],
  [
    "Como recebo o meu relatório?",
    "Depois da confirmação do pagamento, a compra fica disponível no seu histórico. Acesse “Minhas consultas” e selecione “Realizar consulta paga”. O relatório concluído fica salvo na sua conta.",
  ],
  [
    "O que acontece se uma informação não estiver disponível?",
    "A disponibilidade depende dos dados retornados pelo provedor para aquela placa. Uma informação ausente é apresentada como não informada; isso não significa que o veículo esteja livre de ocorrências.",
  ],
  [
    "Posso pagar com Pix ou cartão?",
    "O pagamento acontece no ambiente do Mercado Pago. Os meios disponíveis, incluindo Pix e cartões, são apresentados pelo gateway para cada transação.",
  ],
  [
    "Preciso de ajuda ou quero solicitar um estorno. E agora?",
    "Use o botão “Ajuda e estorno” ou abra uma solicitação no histórico de compras. Você recebe um protocolo para acompanhamento. A devolução depende de análise e confirmação no Mercado Pago.",
  ],
];
export function HomeSections() {
  return (
    <>
      <section
        className="trust-band page-container"
        aria-label="Informações da consulta"
      >
        <span className="trust-band-intro">Clareza em cada etapa.</span>
        <span>
          <KeyRound size={17} aria-hidden="true" /> Conta com verificação de
          segurança
        </span>
        <span>
          <CreditCard size={17} aria-hidden="true" /> Pagamento antes da
          consulta
        </span>
        <span>
          <ShieldCheck size={17} aria-hidden="true" /> Compras salvas na sua
          conta
        </span>
      </section>

      <section
        id="servicos"
        className="features-section page-container"
        aria-labelledby="features-heading"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">MAIS CONTEXTO. MELHORES ESCOLHAS.</span>
            <h2 id="features-heading">
              Uma placa.
              <br />
              Um novo ponto de vista.
            </h2>
          </div>
          <p>
            Olhe além da primeira impressão.
            <br />
            Reúna as informações que ajudam você a decidir.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, ...feature }) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-top">
                <span className="feature-icon">
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <span className="feature-tag">{feature.tag}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
        <p className="section-disclaimer">
          A cobertura e a disponibilidade das informações variam conforme o
          veículo e os dados do provedor.
        </p>
      </section>

      <section
        id="como-funciona"
        className="steps-section page-container"
        aria-labelledby="steps-heading"
      >
        <LiquidGlass className="steps-panel">
          <div className="steps-intro">
            <span className="eyebrow">DO PRIMEIRO CLIQUE À DECISÃO</span>
            <h2 id="steps-heading">
              Simples para você.
              <br />
              Cuidadoso em cada etapa.
            </h2>
            <a href="#consultar" className="text-link">
              Começar minha consulta <ArrowRight size={16} aria-hidden="true" />
            </a>
            <div className="steps-decoration" aria-hidden="true">
              <CarFront size={55} strokeWidth={1} />
              <ArrowDownRight size={27} />
            </div>
          </div>
          <ol className="steps-list">
            {[
              [
                "Crie sua conta",
                "Use seu e-mail e confirme o acesso para manter suas compras protegidas.",
              ],
              [
                "Informe a placa e confirme a compra",
                "Confira o veículo escolhido e pague R$ 50,00 no Mercado Pago.",
              ],
              [
                "Consulte e volte quando precisar",
                "Após a confirmação, realize a consulta e acesse o relatório pelo histórico.",
              ],
            ].map(([title, description], index) => (
              <li key={title}>
                <span className="step-number">0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </LiquidGlass>
      </section>

      <section
        id="duvidas"
        className="faq-section page-container"
        aria-labelledby="faq-heading"
      >
        <div className="faq-intro">
          <span className="eyebrow">BOM SABER ANTES DE COMEÇAR</span>
          <h2 id="faq-heading">
            Mais clareza.
            <br />
            Menos dúvidas.
          </h2>
          <p>As respostas para seguir com tranquilidade.</p>
          <span className="faq-symbol" aria-hidden="true">
            <CircleHelp size={34} strokeWidth={1.5} />
          </span>
        </div>
        <div className="faq-list">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span className="faq-toggle" aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
