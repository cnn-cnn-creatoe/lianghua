import { useCallback, useEffect, useState } from "react";
import { fallbackAshareDashboard, loadAshareDashboard, type AshareDashboard } from "../services/ashareData";

export type AshareDashboardState = {
  data: AshareDashboard;
  loading: boolean;
  error?: string;
};

export function useAshareDashboard(selectedCode: string) {
  const [state, setState] = useState<AshareDashboardState>({
    data: fallbackAshareDashboard,
    loading: true
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: undefined }));
    try {
      const data = await loadAshareDashboard(fetch, selectedCode);
      setState({ data, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({
        data: fallbackAshareDashboard,
        loading: false,
        error: message
      });
    }
  }, [selectedCode]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return {
    ...state,
    refresh
  };
}
