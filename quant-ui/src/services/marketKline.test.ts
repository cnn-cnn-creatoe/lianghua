import { describe, expect, it, vi } from "vitest";
import {
  loadAshareKlines,
  loadBinanceKlines,
  parseAkshareKlines,
  parseBinanceKlines,
  parseEastmoneyKlines,
  toBinanceInterval,
  toEastmoneyKlt,
  toEastmoneySecid
} from "./marketKline";

function jsonResponse(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload)
  } as Response);
}

describe("market kline services", () => {
  it("maps A-share symbols and intervals to Eastmoney params", () => {
    expect(toEastmoneySecid("300750")).toBe("0.300750");
    expect(toEastmoneySecid("600519")).toBe("1.600519");
    expect(toEastmoneyKlt("1m")).toBe("1");
    expect(toEastmoneyKlt("60m")).toBe("60");
    expect(toEastmoneyKlt("1M")).toBe("103");
  });

  it("maps Binance intervals to official kline values", () => {
    expect(toBinanceInterval("1m")).toBe("1m");
    expect(toBinanceInterval("60m")).toBe("1h");
    expect(toBinanceInterval("1w")).toBe("1w");
  });

  it("parses Eastmoney OHLCV kline rows", () => {
    const points = parseEastmoneyKlines(
      {
        data: {
          klines: ["2026-05-15 09:31,428.08,425.01,428.99,424.80,12586,537817576.00,0.98,-0.47,-1.99,0.03"]
        }
      },
      "1m"
    );

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      open: 428.08,
      high: 428.99,
      low: 424.8,
      close: 425.01,
      volume: 12586
    });
  });

  it("parses local AkShare OHLCV rows", () => {
    const points = parseAkshareKlines(
      {
        points: [
          {
            time: "2026-05-15 09:31:00",
            timestamp: 1778808660000,
            open: 428.08,
            high: 428.99,
            low: 424.8,
            close: 425.01,
            volume: 12586
          }
        ]
      },
      "1m"
    );

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      time: "05-15 09:31",
      open: 428.08,
      close: 425.01
    });
  });

  it("parses Binance OHLCV arrays", () => {
    const points = parseBinanceKlines(
      [[1778906880000, "79015.12000000", "79015.20000000", "79010.00000000", "79010.01000000", "1.07471000"]],
      "1m"
    );

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      open: 79015.12,
      high: 79015.2,
      low: 79010,
      close: 79010.01,
      volume: 1.07471
    });
  });

  it("loads A-share klines through the local AkShare proxy", async () => {
    const fetcher = vi.fn().mockImplementation(() =>
      jsonResponse({
        source: "AkShare stock_zh_a_minute 1m",
        points: [
          {
            time: "2026-05-15 09:31:00",
            timestamp: 1778808660000,
            open: 428.08,
            high: 428.99,
            low: 424.8,
            close: 425.01,
            volume: 12586
          },
          {
            time: "2026-05-15 09:32:00",
            timestamp: 1778808720000,
            open: 425.58,
            high: 427.77,
            low: 425.58,
            close: 427.77,
            volume: 4670
          }
        ]
      })
    );

    const data = await loadAshareKlines(fetcher as unknown as typeof fetch, "300750", "宁德时代", "1m", 2);

    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/akshare/kline?"));
    expect(data.status).toBe("live");
    expect(data.points).toHaveLength(2);
    expect(data.source).toContain("AkShare");
  });

  it("falls back to Eastmoney when local AkShare kline data is unavailable", async () => {
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error("akshare offline")))
      .mockImplementationOnce(() =>
        jsonResponse({
          data: {
            klines: [
              "2026-05-15 09:31,428.08,425.01,428.99,424.80,12586,537817576.00,0.98,-0.47,-1.99,0.03",
              "2026-05-15 09:32,425.58,427.77,427.77,425.58,4670,199247669.00,0.52,0.65,2.76,0.01"
            ]
          }
        })
      );

    const data = await loadAshareKlines(fetcher as unknown as typeof fetch, "300750", "宁德时代", "1m", 2);

    expect(fetcher).toHaveBeenNthCalledWith(1, expect.stringContaining("/api/akshare/kline?"));
    expect(fetcher).toHaveBeenNthCalledWith(2, expect.stringContaining("/api/eastmoney-his/api/qt/stock/kline/get?"));
    expect(data.status).toBe("live");
    expect(data.points).toHaveLength(2);
    expect(data.source).toContain("push2his");
  });

  it("loads Binance klines without a private API key", async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() =>
        jsonResponse([[1778906880000, "79015.12000000", "79015.20000000", "79010.00000000", "79010.01000000", "1.07471000"]])
      );

    const data = await loadBinanceKlines(fetcher as unknown as typeof fetch, "BTCUSDT", "Bitcoin", "1m", 1);

    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/binance-data/api/v3/klines?"));
    expect(data.status).toBe("live");
    expect(data.points[0].close).toBe(79010.01);
    expect(data.source).toContain("Binance");
  });
});
