import type { Tone } from "./ashareData";

export type BacktestMetric = {
  label: string;
  value: string;
  tone: Tone;
};

export type BacktestTrade = {
  date: string;
  side: "BUY" | "SELL";
  price: number;
  shares: number;
  reason: string;
};

export type EquityPoint = {
  date: string;
  equity: number;
  close: number;
};

export type BacktestResult = {
  status: "live" | "fallback";
  symbol: string;
  name: string;
  source: string;
  strategyName: string;
  strategyText: string;
  code: string;
  dataRows: number;
  updatedAt: string;
  metrics: BacktestMetric[];
  trades: BacktestTrade[];
  equity: EquityPoint[];
  summary: {
    finalEquity: number;
    initialCash: number;
    tradeCount: number;
    benchmarkReturn: string;
  };
  error?: string;
};

export type BacktestInput = {
  symbol: string;
  name: string;
  strategyText: string;
  startDate?: string;
  endDate?: string;
  initialCash?: number;
};

type Fetcher = typeof fetch;

function nowLabel() {
  return new Date().toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function generatedFallbackCode(input: BacktestInput) {
  return `# Local fallback strategy template
import akshare as ak

def run_strategy():
    df = ak.stock_zh_a_daily(symbol="${input.symbol}", start_date="${input.startDate ?? "20250101"}", end_date="${input.endDate ?? "20260516"}", adjust="qfq")
    df["ma5"] = df["close"].rolling(5).mean()
    df["ma20"] = df["close"].rolling(20).mean()
    df["signal"] = (df["close"] > df["ma5"]) & (df["ma5"] > df["ma20"])
    return df[["date", "close", "signal"]]

# ${input.strategyText}`;
}

export function fallbackBacktestResult(input: BacktestInput, error?: string): BacktestResult {
  return {
    status: "fallback",
    symbol: input.symbol,
    name: input.name,
    source: "本地模板回退",
    strategyName: "双均线量价策略",
    strategyText: input.strategyText,
    code: generatedFallbackCode(input),
    dataRows: 0,
    updatedAt: nowLabel(),
    metrics: [
      { label: "总收益", value: "--", tone: "neutral" },
      { label: "年化收益", value: "--", tone: "neutral" },
      { label: "最大回撤", value: "--", tone: "neutral" },
      { label: "胜率", value: "--", tone: "neutral" }
    ],
    trades: [],
    equity: [],
    summary: {
      finalEquity: input.initialCash ?? 100000,
      initialCash: input.initialCash ?? 100000,
      tradeCount: 0,
      benchmarkReturn: "--"
    },
    error
  };
}

export async function runAshareBacktest(fetcher: Fetcher, input: BacktestInput): Promise<BacktestResult> {
  try {
    const response = await fetcher("/api/akshare/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initialCash: 100000,
        ...input
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as BacktestResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fallbackBacktestResult(input, message);
  }
}
