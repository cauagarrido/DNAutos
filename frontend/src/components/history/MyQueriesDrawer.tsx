import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { vehicleApi, Purchase } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { errorMessage } from "../../services/http";
import { FolderClock } from "lucide-react";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrder: (id: string) => Promise<void>;
}
const labels: Record<string, string> = {
  pending: "Aguardando pagamento",
  approved: "Pago",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Estornado",
  charged_back: "Contestação",
  in_mediation: "Em análise",
};
export function MyQueriesDrawer({
  isOpen,
  onClose,
  onOpenOrder,
}: Props) {
  const { config, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Purchase[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null),
    [nextOffset, setNextOffset] = useState<number | null>(null);
  const [supportOrder, setSupportOrder] = useState<Purchase | null>(null),
    [kind, setKind] = useState<"refund" | "error">("error"),
    [message, setMessage] = useState(""),
    [protocol, setProtocol] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setOrders([]);
    setProtocol(null);
    setSupportOrder(null);
    setError(null);
    setNextOffset(null);
    if (!isAuthenticated) return;
    setLoading(true);
    void vehicleApi
      .getPurchases()
      .then((data) => {
        if (active) {
          setOrders(data.orders);
          setNextOffset(data.nextOffset);
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated]);
  const more = async () => {
    if (nextOffset === null) return;
    setLoading(true);
    try {
      const data = await vehicleApi.getPurchases(nextOffset);
      setOrders((prev) => [...prev, ...data.orders]);
      setNextOffset(data.nextOffset);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supportOrder) return;
    setLoading(true);
    setError(null);
    try {
      const result = await vehicleApi.requestSupport(
        supportOrder.id,
        kind,
        message,
      );
      setProtocol(result.protocol);
      setMessage("");
      setOrders((prev) =>
        prev.map((item) =>
          item.id === supportOrder.id && kind === "refund"
            ? { ...item, refundRequested: true }
            : item,
        ),
      );
      setSupportOrder(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de compras"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {!isAuthenticated && (
          <p className="text-sm">
            Entre na sua conta para acessar suas compras e consultas.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {protocol && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm">
            Solicitação registrada. Protocolo:{" "}
            <strong className="break-all">{protocol}</strong>. Acompanhe pelo
            contato direto. O estorno depende de análise e confirmação no
            gateway.
          </p>
        )}
        {isAuthenticated && orders.length === 0 && !loading && (
          <div className="history-empty">
            <span className="auth-intro-icon">
              <FolderClock size={24} aria-hidden="true" />
            </span>
            <h3>Suas próximas descobertas ficam aqui.</h3>
            <p>
              Depois de comprar uma consulta, acompanhe o pagamento e acesse seu
              relatório neste espaço.
            </p>
          </div>
        )}
        {orders.map((order) => (
          <article className="purchase-card space-y-3" key={order.id}>
            <div className="flex justify-between gap-3">
              <strong className="tracking-widest text-lg">{order.plate}</strong>
              <span className="text-sm">
                {(order.amountCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              <span
                className={`purchase-status ${order.status === "approved" ? "is-approved" : ""}`}
              >
                {labels[order.status] || order.status}
              </span>
              {" · "}
              {new Date(order.createdAt).toLocaleString("pt-BR")}
            </p>
            <p className="break-all text-xs text-slate-500">
              Compra {order.id}
            </p>
            {order.status === "approved" && (
              <p className="text-xs">
                {order.refundRequested
                  ? "Estorno solicitado. A consulta está pausada."
                  : order.reportState === "complete"
                    ? "Relatório disponível"
                    : order.reportState === "available"
                      ? "Consulta disponível para esta placa"
                      : order.reportState === "processing"
                        ? "Consulta em processamento"
                        : "Consulta em análise. Fale com o suporte."}
              </p>
            )}
            {order.status === "approved" &&
              !order.refundRequested &&
              ["available", "complete"].includes(order.reportState) && (
                <button
                  className="liquid-button w-full"
                  disabled={loading}
                  onClick={() => {
                    setLoading(true);
                    void onOpenOrder(order.id)
                      .catch((err) => setError(errorMessage(err)))
                      .finally(() => setLoading(false));
                  }}
                >
                  {order.reportState === "complete"
                    ? "Abrir relatório"
                    : "Realizar consulta paga"}
                </button>
              )}
            {order.checkoutUrl && (
              <a
                className="block rounded-xl border p-3 text-center text-sm"
                href={order.checkoutUrl}
              >
                Continuar pagamento no Mercado Pago
              </a>
            )}
            <button
              className="text-xs font-semibold text-orange-700"
              disabled={loading}
              onClick={() => {
                setSupportOrder(order);
                setKind("error");
                setMessage("");
                setError(null);
              }}
            >
              Ajuda / solicitar estorno
            </button>
          </article>
        ))}
        {loading && (
          <p role="status" className="text-sm">
            Aguarde…
          </p>
        )}
        {nextOffset !== null && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void more()}
            className="google-auth-button"
          >
            Carregar mais compras
          </button>
        )}
        {supportOrder && (
          <form
            className="purchase-card space-y-3"
            onSubmit={(event) => void submit(event)}
          >
            <p className="text-sm font-bold">
              Atendimento - {supportOrder.plate}
            </p>
            <label className="block text-xs" htmlFor="support-kind">
              Motivo
            </label>
            <select
              id="support-kind"
              className="glass-control mt-1 w-full rounded-xl p-3"
              value={kind}
              onChange={(e) => setKind(e.target.value as "refund" | "error")}
            >
              <option value="error">Erro na consulta ou pagamento</option>
              <option value="refund">Desisti / solicitar estorno</option>
            </select>
            <label className="block text-xs">
              Descreva o ocorrido
              <textarea
                className="glass-control mt-1 w-full rounded-xl p-3"
                minLength={10}
                maxLength={2000}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button disabled={loading} className="liquid-button w-full">
              Registrar solicitação
            </button>
            <button
              type="button"
              className="text-xs"
              onClick={() => setSupportOrder(null)}
            >
              Cancelar
            </button>
          </form>
        )}
        {config?.supportUrl ? (
          <a
            href={config.supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-slate-900 p-3 text-center text-sm font-bold text-white"
          >
            Contato direto com o suporte
          </a>
        ) : (
          <p className="text-xs text-slate-500">
            O canal de atendimento será disponibilizado antes da abertura das
            vendas.
          </p>
        )}
      </div>
    </Modal>
  );
}
