import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import { errorMessage } from "../../services/http";
import { Modal } from "../ui/Modal";

export type EmailLink = { tokenHash: string; type: "signup" | "recovery" };
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  emailLink: EmailLink | null;
  onLinkConsumed: () => void;
}
const input =
  "glass-control w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-100";
const button =
  "w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50";
export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  emailLink,
  onLinkConsumed,
}: Props) {
  const { login, register, session, refresh, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState(""),
    [code, setCode] = useState(""),
    [challenge, setChallenge] = useState<{
      factorId: string;
      challengeId: string;
    } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [message, setMessage] = useState<string | null>(null),
    [show, setShow] = useState(false);
  const mfa =
      !!session?.mfaRequired && (!session.recovery || !!session.factorId),
    recovery = !!session?.recovery;
  const complete = () => {
    setPassword("");
    setConfirmPassword("");
    setChallenge(null);
    setCode("");
    onSuccess?.();
    onClose();
  };
  const execute = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await work();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void execute(async () => {
      if (emailLink) {
        const result = await authService.confirm(
          emailLink.tokenHash,
          emailLink.type,
        );
        onLinkConsumed();
        setMessage(
          result.message || "E-mail verificado. Escolha sua nova senha.",
        );
        await refresh();
        return;
      }
      if (mfa) {
        if (!challenge) {
          setChallenge(
            await authService.challenge(
              session?.needsEnrollment && !session.factorId ? phone : undefined,
            ),
          );
          setMessage(
            "Código enviado. Confira seu celular ou aplicativo autenticador.",
          );
          return;
        }
        const next = await authService.verify({ ...challenge, code });
        await refresh();
        if (!next.recovery && !next.mfaRequired) complete();
        else {
          setChallenge(null);
          setCode("");
        }
        return;
      }
      if (recovery) {
        if (password !== confirmPassword)
          throw new Error("As senhas não coincidem.");
        const result = await authService.resetPassword(password);
        await refresh();
        setPassword("");
        setConfirmPassword("");
        setMode("login");
        setMessage(result.message);
        return;
      }
      if (mode === "recover") {
        setMessage((await authService.recover(email)).message);
        return;
      }
      if (mode === "register") {
        if (password !== confirmPassword)
          throw new Error("As senhas não coincidem.");
        setMessage((await register({ email, password })).message);
        setPassword("");
        setConfirmPassword("");
        return;
      }
      const next = await login({ email, password });
      setPassword("");
      if (!next.mfaRequired) complete();
    });
  };
  const close = () => {
    if (busy) return;
    if (session && (session.mfaRequired || session.recovery)) void logout();
    if (emailLink) onLinkConsumed();
    setPassword("");
    setCode("");
    setChallenge(null);
    onClose();
  };
  const title = emailLink
    ? "Verificar e-mail"
    : mfa
      ? "Verificação de segurança"
      : recovery
        ? "Redefinir senha"
        : mode === "register"
          ? "Criar conta"
          : mode === "recover"
            ? "Recuperar acesso"
            : "Entrar na sua conta";
  return (
    <Modal isOpen={isOpen} onClose={close} title={title}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}
        {emailLink ? (
          <p className="text-sm text-slate-600">
            Confirme para validar o link de{" "}
            {emailLink.type === "recovery"
              ? "recuperação de acesso"
              : "cadastro"}{" "}
            recebido por e-mail.
          </p>
        ) : mfa ? (
          <>
            <p className="text-sm text-slate-600">
              {session?.needsEnrollment && !session.factorId
                ? "Cadastre seu celular para proteger a conta. O código por SMS será necessário para acessar as compras."
                : "Confirme seu segundo fator para continuar."}
            </p>
            {!challenge && session?.needsEnrollment && !session.factorId && (
              <label className="block text-sm">
                Celular com DDI
                <input
                  className={input}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+5511999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="\+[1-9][0-9]{7,14}"
                  required
                />
              </label>
            )}
            {challenge && (
              <label className="block text-sm">
                Código de segurança
                <input
                  className={input}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6,8}"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </label>
            )}
          </>
        ) : (
          <>
            {!recovery && (
              <label className="block text-sm">
                E-mail
                <input
                  className={input}
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            )}
            {(recovery || mode !== "recover") && (
              <>
                <label className="block text-sm">
                  Senha
                  <input
                    className={input}
                    type={show ? "text" : "password"}
                    autoComplete={
                      recovery || mode === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={recovery || mode === "register" ? 12 : 1}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                {(recovery || mode === "register") && (
                  <>
                    <p className="text-xs text-slate-500">
                      Use de 12 a 72 caracteres. Prefira uma frase longa e
                      exclusiva.
                    </p>
                    <label className="block text-sm">
                      Confirmar senha
                      <input
                        className={input}
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={72}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </label>
                  </>
                )}
                <label className="flex gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={show}
                    onChange={(e) => setShow(e.target.checked)}
                  />
                  Mostrar senha
                </label>
              </>
            )}
          </>
        )}
        <button disabled={busy} className={button} type="submit">
          {busy
            ? "Aguarde…"
            : emailLink
              ? "Confirmar link"
              : mfa
                ? challenge
                  ? "Validar código"
                  : "Enviar código"
                : recovery
                  ? "Salvar nova senha"
                  : mode === "register"
                    ? "Cadastrar e confirmar e-mail"
                    : mode === "recover"
                      ? "Enviar link por e-mail"
                      : "Entrar"}
        </button>
        {mfa && challenge && (
          <button
            type="button"
            disabled={busy}
            className="w-full text-sm text-orange-700"
            onClick={() => {
              setChallenge(null);
              setCode("");
            }}
          >
            Enviar outro código
          </button>
        )}
        {!emailLink && !session && (
          <div className="space-y-3 border-t pt-4 text-center">
            <button
              type="button"
              disabled={busy}
              className="w-full rounded-xl border p-3 text-sm font-semibold"
              onClick={() => void execute(() => authService.google())}
            >
              Continuar com Google
            </button>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-orange-700">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setError(null);
                  setMessage(null);
                  setPassword("");
                }}
              >
                {" "}
                {mode === "register" ? "Já tenho conta" : "Criar conta"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMode(mode === "recover" ? "login" : "recover");
                  setError(null);
                  setPassword("");
                }}
              >
                {mode === "recover"
                  ? "Voltar ao login"
                  : "Esqueci a senha / desbloquear"}
              </button>
              <button
                type="button"
                disabled={busy || !email}
                onClick={() =>
                  void execute(async () =>
                    setMessage((await authService.resend(email)).message),
                  )
                }
              >
                Reenviar confirmação
              </button>
            </div>
          </div>
        )}
        <p className="text-center text-xs text-slate-500">
          A sessão expira após 30 minutos sem atividade.
        </p>
      </form>
    </Modal>
  );
}
