import { useCallback, useEffect, useState } from "react";
import {
  loadAshareKlines,
  loadBinanceKlines,
  type KlineInterval,
  type KlineMarket,
  type RealtimeKline
} from "../services/marketKline";

export type KlineTarget = {
  market: KlineMarket;
  symbol: string;
  name: string;
};

export type RealtimeKlineState = {
  data?: RealtimeKline;
  loading: boolean;
  error?: string;
};

export function useRealtimeKline(
  target: KlineTarget,
  interval: KlineInterval,
  options: { enabled?: boolean; limit?: number; refreshMs?: number } = {}
) {
  const { enabled = true, limit = 120, refreshMs = 15000 } = options;
  const [state, setState] = useState<RealtimeKlineState>({ loading: enabled });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setState((current) => ({ ...current, loading: true, error: undefined }));
    const loader = target.market === "ashare" ? loadAshareKlines : loadBinanceKlines;
    const data = await loader(fetch, target.symbol, target.name, interval, limit);
    setState({
      data,
      loading: false,
      error: data.status === "fallback" ? data.error : undefined
    });
  }, [enabled, interval, limit, target.market, target.name, target.symbol]);

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [enabled, refresh, refreshMs]);

  return {
    ...state,
    refresh
  };
}
