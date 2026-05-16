export type KlineInterval = "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1w" | "1M";

export type KlineMarket = "ashare" | "binance";

export type KlinePoint = {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type RealtimeKline = {
  symbol: string;
  name: string;
  market: KlineMarket;
  interval: KlineInterval;
  source: string;
  status: "live" | "fallback";
  points: KlinePoint[];
  updatedAt: string;
  error?: string;
};

type Fetcher = typeof fetch;

export const klineIntervals: KlineInterval[] = ["1m", "5m", "15m", "30m", "60m", "1d", "1w", "1M"];

function numberOrZero(value: unknown): number {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text || text === "-" || text === "--") {
    return 0;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function parseChinaTimestamp(time: string): number {
  const normalized = time.includes(" ") ? `${time.replace(" ", "T")}:00+08:00` : `${time}T15:00:00+08:00`;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function toDateLabel(timestamp: number, interval: KlineInterval): string {
  const date = new Date(timestamp);
  if (interval === "1d" || interval === "1w" || interval === "1M") {
    return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  }
  return date.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

export function toEastmoneySecid(code: string): string {
  const pureCode = code.trim().replace(/\D/g, "").slice(-6);
  const market = pureCode.startsWith("6") || pureCode.startsWith("9") ? "1" : "0";
  return `${market}.${pureCode}`;
}

export function toEastmoneyKlt(interval: KlineInterval): string {
  const values: Record<KlineInterval, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "60m": "60",
    "1d": "101",
    "1w": "102",
    "1M": "103"
  };
  return values[interval];
}

export function toBinanceInterval(interval: KlineInterval): string {
  if (interval === "60m") {
    return "1h";
  }
  return interval;
}

export function parseEastmoneyKlines(payload: unknown, interval: KlineInterval): KlinePoint[] {
  const data = (payload as { data?: { klines?: string[] } }).data;
  return (data?.klines ?? [])
    .map((row) => {
      const [time, open, close, high, low, volume] = row.split(",");
      return {
        time,
        timestamp: parseChinaTimestamp(time),
        open: numberOrZero(open),
        high: numberOrZero(high),
        low: numberOrZero(low),
        close: numberOrZero(close),
        volume: numberOrZero(volume)
      };
    })
    .filter((point) => point.open > 0 && point.high > 0 && point.low > 0 && point.close > 0)
    .map((point) => ({
      ...point,
      time: interval === "1d" || interval === "1w" || interval === "1M" ? point.time.slice(5) : point.time.slice(5)
    }));
}

export function parseAkshareKlines(payload: unknown, interval: KlineInterval): KlinePoint[] {
  const rows = (payload as { points?: Record<string, unknown>[] }).points ?? [];
  return rows
    .map((row) => {
      const timestamp = numberOrZero(row.timestamp);
      const rawTime = String(row.time ?? "");
      const fallbackTimestamp = rawTime ? Date.parse(rawTime.replace(" ", "T")) : Date.now();
      const resolvedTimestamp = timestamp || (Number.isFinite(fallbackTimestamp) ? fallbackTimestamp : Date.now());
      return {
        time: rawTime && rawTime.length > 10
          ? rawTime.slice(5, 16)
          : rawTime
            ? rawTime.slice(5)
            : toDateLabel(resolvedTimestamp, interval),
        timestamp: resolvedTimestamp,
        open: numberOrZero(row.open),
        high: numberOrZero(row.high),
        low: numberOrZero(row.low),
        close: numberOrZero(row.close),
        volume: numberOrZero(row.volume)
      };
    })
    .filter((point) => point.open > 0 && point.high > 0 && point.low > 0 && point.close > 0);
}

export function parseBinanceKlines(rows: unknown, interval: KlineInterval): KlinePoint[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => {
      if (!Array.isArray(row)) {
        return undefined;
      }
      const timestamp = numberOrZero(row[0]);
      return {
        time: toDateLabel(timestamp, interval),
        timestamp,
        open: numberOrZero(row[1]),
        high: numberOrZero(row[2]),
        low: numberOrZero(row[3]),
        close: numberOrZero(row[4]),
        volume: numberOrZero(row[5])
      };
    })
    .filter((point): point is KlinePoint => Boolean(point && point.open > 0 && point.high > 0 && point.low > 0 && point.close > 0));
}

async function fetchJson(fetcher: Fetcher, url: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function sliceLatest(points: KlinePoint[], limit: number): KlinePoint[] {
  return points.slice(Math.max(0, points.length - limit));
}

function buildFallbackPoints(symbol: string, interval: KlineInterval, market: KlineMarket, limit: number): KlinePoint[] {
  const base = market === "binance" ? (symbol.startsWith("ETH") ? 3800 : symbol.startsWith("SOL") ? 170 : 79000) : 100;
  const stepMs = interval === "1d" ? 86400000 : interval === "1w" ? 604800000 : interval === "1M" ? 2592000000 : Number(interval.replace("m", "")) * 60000;
  const start = Date.now() - stepMs * limit;
  return Array.from({ length: limit }, (_, index) => {
    const wave = Math.sin(index / 4) * base * 0.008;
    const drift = index * base * 0.00035;
    const open = base + wave + drift;
    const close = open + Math.cos(index / 3) * base * 0.004;
    const high = Math.max(open, close) + base * 0.006;
    const low = Math.min(open, close) - base * 0.006;
    const timestamp = start + stepMs * index;
    return {
      time: toDateLabel(timestamp, interval),
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(800 + index * 12 + Math.abs(Math.sin(index)) * 500)
    };
  });
}

export async function loadAshareKlines(
  fetcher: Fetcher,
  code: string,
  name: string,
  interval: KlineInterval,
  limit = 120
): Promise<RealtimeKline> {
  const errors: string[] = [];
  const akshareParams = new URLSearchParams({
    symbol: code.replace(/\D/g, "").slice(-6),
    interval,
    limit: String(limit)
  });
  try {
    const payload = await fetchJson(fetcher, `/api/akshare/kline?${akshareParams}`);
    const points = sliceLatest(parseAkshareKlines(payload, interval), limit);
    if (!points.length) {
      throw new Error("empty AkShare kline payload");
    }
    return {
      symbol: code,
      name,
      market: "ashare",
      interval,
      source: String((payload as { source?: string }).source ?? "AkShare K 线"),
      status: "live",
      points,
      updatedAt: nowLabel()
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const params = new URLSearchParams({
    secid: toEastmoneySecid(code),
    fields1: "f1,f2,f3,f4,f5,f6",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    klt: toEastmoneyKlt(interval),
    fqt: "1",
    beg: "0",
    end: "20500101",
    lmt: String(limit)
  });
  try {
    const payload = await fetchJson(fetcher, `/api/eastmoney-his/api/qt/stock/kline/get?${params}`);
    const points = sliceLatest(parseEastmoneyKlines(payload, interval), limit);
    if (!points.length) {
      throw new Error("empty Eastmoney kline payload");
    }
    return {
      symbol: code,
      name,
      market: "ashare",
      interval,
      source: "东方财富 push2his K 线",
      status: "live",
      points,
      updatedAt: nowLabel()
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    return {
      symbol: code,
      name,
      market: "ashare",
      interval,
      source: "东方财富 push2his K 线",
      status: "fallback",
      points: buildFallbackPoints(code, interval, "ashare", Math.min(limit, 80)),
      updatedAt: nowLabel(),
      error: errors.join(" / ")
    };
  }
}

export async function loadBinanceKlines(
  fetcher: Fetcher,
  symbol: string,
  name: string,
  interval: KlineInterval,
  limit = 120
): Promise<RealtimeKline> {
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval: toBinanceInterval(interval),
    limit: String(Math.min(limit, 1000))
  });
  const candidates = [
    { url: `/api/binance-data/api/v3/klines?${params}`, source: "Binance Vision Spot Klines" },
    { url: `/api/binance/api/v3/klines?${params}`, source: "Binance Spot API Klines" }
  ];
  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      const payload = await fetchJson(fetcher, candidate.url);
      const points = sliceLatest(parseBinanceKlines(payload, interval), limit);
      if (!points.length) {
        throw new Error("empty Binance kline payload");
      }
      return {
        symbol: symbol.toUpperCase(),
        name,
        market: "binance",
        interval,
        source: candidate.source,
        status: "live",
        points,
        updatedAt: nowLabel()
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    symbol: symbol.toUpperCase(),
    name,
    market: "binance",
    interval,
    source: "Binance Spot API Klines",
    status: "fallback",
    points: buildFallbackPoints(symbol, interval, "binance", Math.min(limit, 80)),
    updatedAt: nowLabel(),
    error: errors.join(" / ")
  };
}
