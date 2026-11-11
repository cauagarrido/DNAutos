import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
interface FooterProps {
  onNavigateSection?: (id: string) => void;
}
export function Footer({ onNavigateSection }: FooterProps) {
  const { config } = useAuth();
  return (
    <footer className="site-footer no-print">
      <div className="page-container">
        <div className="footer-main">
          <div className="footer-brand">
            <img
              src="/dnautos-logo.png"
              alt="DNAutos Vistorias"
              width="170"
              height="57"
            />
            <p>
              Mais informação para
              <br />
              escolher seu próximo destino.
            </p>
          </div>
          <div className="footer-navigation">
            <span className="eyebrow">EXPLORE</span>
            <button
              type="button"
              onClick={() => onNavigateSection?.("como-funciona")}
            >
              Como funciona <ArrowUpRight size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection?.("servicos")}
            >
              O que você consulta <ArrowUpRight size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection?.("duvidas")}
            >
              Dúvidas frequentes <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="footer-note">
            <ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" />
            <strong>Uma decisão merece cuidado.</strong>
            <p>
              Consulte, compare e complemente sua análise com uma vistoria
              presencial.
            </p>
            {config?.supportUrl && (
              <a
                href={config.supportUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fale com a gente <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} DNAutos Vistorias</span>
          <span>Informação. Confiança. Transparência.</span>
          <span className="footer-location">
            <span className="status-dot" /> Feito para você decidir melhor.
          </span>
        </div>
      </div>
    </footer>
  );
}
