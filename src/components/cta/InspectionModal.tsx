import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { vehicleApi } from '../../services/api';
import {
  Wrench,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plate: string;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  plate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'São Paulo',
    state: 'SP',
    preferredDate: '',
    inspectionType: 'Cautelar Completa' as const,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await vehicleApi.requestInspectionBooking({
        plate,
        ...formData,
      });

      setProtocol(res.protocol);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProtocol(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Agendar Vistoria Cautelar Presencial</h3>
            <p className="text-xs text-slate-400 font-normal">Mais de 1.200 unidades em todo o Brasil</p>
          </div>
        </div>
      }
    >
      {protocol ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-white">Solicitação Recebida com Sucesso!</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Nosso especialista entrará em contato via WhatsApp nas próximas 2 horas para confirmar o melhor horário e endereço do posto de atendimento.
          </p>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 inline-block font-mono text-sm">
            <span className="text-slate-400 text-xs block font-sans">Protocolo de Agendamento:</span>
            <strong className="text-blue-400 text-base">{protocol}</strong>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="md" onClick={handleClose}>
              Concluir e Voltar ao Relatório
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>Condição especial DNAutos aplicada à vistoria física da placa <strong>{plate}</strong>.</span>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Seu Nome Completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João da Silva"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">WhatsApp / Telefone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Cidade de Atendimento</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Data Preferencial</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Tipo de Laudo</label>
            <select
              value={formData.inspectionType}
              onChange={(e: any) => setFormData({ ...formData, inspectionType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Cautelar Completa">Vistoria Cautelar Completa (Estrutura + Pintura + Motor)</option>
              <option value="Transferência Detran">Laudo de Transferência Oficial DETRAN (ECV)</option>
              <option value="Pré-Compra Premium">Combo Pré-Compra Premium (Cautelar + Test Drive Técnico)</option>
            </select>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full text-sm"
              isLoading={isLoading}
            >
              Solicitar Agendamento com Desconto
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};
