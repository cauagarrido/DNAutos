import { useState, useEffect, useCallback, useRef } from "react";
import { vehicleApi } from "../services/api";
import { FipeVehicleData, VehicleKind } from "../services/fipeService";
import { buildReportFromFipe } from "../utils/fipeReportBuilder";
import { FullVehicleReport } from "../types/vehicle";
import { useAuth } from "./useAuth";
import { errorMessage } from "../services/http";
export type QueryStep = "SEARCH" | "REPORT";
export function useVehicleQuery() {
  const { isAuthenticated, user } = useAuth();
  const accountId = isAuthenticated ? user?.id : null;
  const account = useRef({ id: accountId, generation: 0 });
  if (account.current.id !== accountId) {
    account.current = {
      id: accountId,
      generation: account.current.generation + 1,
    };
  }
  const [step, setStep] = useState<QueryStep>("SEARCH"),
    [plate, setPlate] = useState("");
  const [fullReport, setFullReport] = useState<FullVehicleReport | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false),
    [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [history, setHistory] = useState<FullVehicleReport[]>([]);
  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }
    const generation = account.current.generation;
    const reports = await vehicleApi.getAccountHistory();
    if (generation === account.current.generation) setHistory(reports);
  }, [isAuthenticated, user?.id]);
  useEffect(() => {
    let active = true;
    setHistory([]);
    setFullReport(null);
    setStep("SEARCH");
    setIsHistoryDrawerOpen(false);
    setIsLoading(false);
    setError(null);
    if (isAuthenticated)
      void vehicleApi
        .getAccountHistory()
        .then((data) => {
          if (active) setHistory(data);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);
  const handleSearch = useCallback(
    async (orderId: string) => {
      const generation = account.current.generation;
      setIsLoading(true);
      setError(null);
      try {
        const report = await vehicleApi.getFullReport(orderId);
        // A response from the previous account must never repopulate the screen after logout.
        if (generation !== account.current.generation) return false;
        setPlate(report.basicInfo.plate);
        setFullReport(report);
        setStep("REPORT");
        void refreshHistory().catch(() => {});
        window.scrollTo({ top: 0, behavior: "smooth" });
        return true;
      } catch (err) {
        if (generation === account.current.generation)
          setError(errorMessage(err));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshHistory],
  );
  const handleFipeReport = useCallback(
    (data: FipeVehicleData, tipo: VehicleKind) => {
      setFullReport(buildReportFromFipe(data, tipo));
      setStep("REPORT");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );
  const handleSelectReportFromHistory = (report: FullVehicleReport) => {
    setFullReport(report);
    setStep("REPORT");
    setIsHistoryDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleResetToSearch = useCallback(() => {
    setStep("SEARCH");
    setFullReport(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return {
    step,
    plate,
    setPlate,
    fullReport,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isLoading,
    history,
    error,
    handleSearch,
    handleFipeReport,
    handleSelectReportFromHistory,
    refreshHistory,
    handleResetToSearch,
  };
}
