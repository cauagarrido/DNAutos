import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { LiquidGlass } from "../ui/LiquidGlass";

interface NavbarProps {
  onOpenHistory?: () => void;
  historyCount?: number;
  onResetToHome: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenAuth?: () => void;
}
const links = [
  { id: "home", label: "Consultar" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "servicos", label: "O que você consulta" },
  { id: "duvidas", label: "Dúvidas" },
];
export function Navbar({
  onOpenHistory,
  historyCount = 0,
  onResetToHome,
  onNavigateSection,
  onOpenAuth,
}: NavbarProps) {
  const [userMenu, setUserMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const shell = useRef<HTMLElement>(null),
    userButton = useRef<HTMLButtonElement>(null),
    mobileButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!userMenu && !mobileMenu) return;
    const outside = (event: PointerEvent) => {
      if (!shell.current?.contains(event.target as Node)) {
        setUserMenu(false);
        setMobileMenu(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        (mobileMenu ? mobileButton : userButton).current?.focus();
        setUserMenu(false);
        setMobileMenu(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [userMenu, mobileMenu]);
  const navigate = (id: string) => {
    setMobileMenu(false);
    setUserMenu(false);
    if (id === "home") {
      onResetToHome();
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    } else onNavigateSection?.(id);
  };
  return (
    <header className="site-header no-print" ref={shell}>
      <LiquidGlass className="nav-shell">
        <button
          type="button"
          className="brand-home"
          onClick={() => navigate("home")}
          aria-label="DNAutos Vistorias — início"
        >
          <img
            src="/dnautos-logo.png"
            alt="DNAutos Vistorias"
            width="174"
            height="58"
          />
        </button>
        <nav className="desktop-navigation" aria-label="Navegação principal">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => navigate(link.id)}
              className={
                link.id === "home" ? "nav-link is-current" : "nav-link"
              }
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          {isAuthenticated && user ? (
            <div
              className="user-navigation"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node))
                  setUserMenu(false);
              }}
            >
              <button
                ref={userButton}
                type="button"
                className="user-trigger"
                aria-expanded={userMenu}
                aria-controls="user-navigation"
                onClick={() => {
                  setUserMenu(!userMenu);
                  setMobileMenu(false);
                }}
                aria-label={`Olá, ${user.name.split(" ")[0]}`}
              >
                <span className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="user-greeting">
                  Olá, {user.name.split(" ")[0]}
                </span>
                <ChevronDown size={13} aria-hidden="true" />
              </button>
              {userMenu && (
                <div className="glass-panel user-dropdown" id="user-navigation">
                  <span className="dropdown-caption">SUA CONTA</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenu(false);
                      onOpenHistory?.();
                    }}
                  >
                    <History size={17} aria-hidden="true" /> Minhas consultas (
                    {historyCount})
                  </button>
                  <button
                    type="button"
                    className="logout-action"
                    onClick={() => {
                      setUserMenu(false);
                      void logout();
                      onResetToHome();
                    }}
                  >
                    <LogOut size={17} aria-hidden="true" /> Sair da conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="history-trigger"
                onClick={onOpenHistory}
                aria-label="Minhas consultas"
              >
                <History size={18} aria-hidden="true" />
                <span>Minhas consultas</span>
              </button>
              <button
                type="button"
                className="nav-login"
                onClick={onOpenAuth}
                aria-label="Entrar / Criar conta"
              >
                <span>
                  Entrar <span className="login-extra">/ Criar conta</span>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </>
          )}
          <button
            ref={mobileButton}
            type="button"
            className="icon-button mobile-menu-trigger"
            aria-label={mobileMenu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenu}
            aria-controls="mobile-navigation"
            onClick={() => {
              setMobileMenu(!mobileMenu);
              setUserMenu(false);
            }}
          >
            {mobileMenu ? (
              <X size={19} aria-hidden="true" />
            ) : (
              <Menu size={19} aria-hidden="true" />
            )}
          </button>
        </div>
      </LiquidGlass>
      {mobileMenu && (
        <nav
          id="mobile-navigation"
          className="glass-panel mobile-navigation"
          aria-label="Navegação no celular"
        >
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => navigate(link.id)}
            >
              {link.label}
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenu(false);
              onOpenHistory?.();
            }}
          >
            Minhas consultas <History size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </header>
  );
}
