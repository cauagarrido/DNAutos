import React from 'react';
import { FullVehicleReport } from '../../types/vehicle';
import {
  X,
  History,
  Car,
  Trash2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/Button';

interface MyQueriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: FullVehicleReport[];
  onSelectReport: (report: FullVehicleReport) => void;
  onClearHistory: () => void;
}

export const MyQueriesDrawer: React.FC<MyQueriesDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectReport,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="glass-panel h-full w-screen max-w-md border-l border-white/80 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-white/70 flex items-center justify-between bg-white/35">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-50 text-[#F06400] ring-1 ring-orange-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1320]">Minhas Consultas</h3>
                <p className="text-xs text-slate-500">{history.length} relatório(s) salvo(s)</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of Consultations */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-3">
                <Car className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">Nenhuma consulta realizada ainda</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  Assim que você consultar uma placa e desbloquear o relatório, ele ficará disponível aqui para acesso ilimitado.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-4 rounded-2xl transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#003399] text-white text-xs font-black tracking-widest rounded uppercase">
                      {item.basicInfo.plate}
                    </span>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.risks.overallRiskLevel === 'safe'
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : (item.risks.overallRiskLevel === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20')
                    }`}>
                      Score {item.risks.riskScore == null ? 'não informado' : `${item.risks.riskScore}/100`}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#E65B00] transition-colors">
                      {item.basicInfo.brand} {item.basicInfo.model}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(item.consultedAt)}
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs justify-between group-hover:bg-orange-600 group-hover:text-white transition-colors"
                    onClick={() => {
                      onSelectReport(item);
                      onClose();
                    }}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Ver Relatório Completo
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Footer with Clear History Button */}
          {history.length > 0 && (
            <div className="p-4 border-t border-white/70 bg-white/35">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                onClick={onClearHistory}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Limpar Histórico Local
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
