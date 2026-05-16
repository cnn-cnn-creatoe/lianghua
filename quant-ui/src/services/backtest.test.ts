import { describe, expect, it, vi } from "vitest";
import { generatedFallbackCode, runAshareBacktest } from "./backtest";

function jsonResponse(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload)
  } as Response);
}

describe("A-share backtest service", () => {
  it("posts natural-language strategy text to the local AkShare backtest API", async () => {
    const fetcher = vi.fn().mockImplementation(() =>
      jsonResponse({
        status: "live",
        symbol: "300750",
        name: "宁德时代",
        source: "AkShare stock_zh_a_daily qfq",
        strategyName: "双均线量价策略",
        strategyText: "5日均线上穿20日均线，成交量放大",
        code: "# generated",
        dataRows: 300,
        updatedAt: "05-16 12:00:00",
        metrics: [{ label: "总收益", value: "+10.00%", tone: "red" }],
        trades: [],
        equity: [],
        summary: {
          finalEquity: 110000,
          initialCash: 100000,
          tradeCount: 0,
          benchmarkReturn: "+5.00%"
        }
      })
    );

    const result = await runAshareBacktest(fetcher as unknown as typeof fetch, {
      symbol: "300750",
      name: "宁德时代",
      strategyText: "5日均线上穿20日均线，成交量放大",
      startDate: "20250101",
      endDate: "20260516"
    });

    expect(fetcher).toHaveBeenCalledWith(
      "/api/akshare/backtest",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(result.status).toBe("live");
    expect(result.source).toContain("AkShare");
    expect(result.code).toBe("# generated");
  });

  it("returns executable fallback code when the local API is unavailable", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));

    const result = await runAshareBacktest(fetcher as unknown as typeof fetch, {
      symbol: "300750",
      name: "宁德时代",
      strategyText: "5日均线上穿20日均线，成交量放大",
      startDate: "20250101",
      endDate: "20260516"
    });

    expect(result.status).toBe("fallback");
    expect(result.code).toContain("ak.stock_zh_a_daily");
    expect(result.error).toContain("offline");
  });

  it("includes the selected symbol and strategy prompt in generated fallback code", () => {
    const code = generatedFallbackCode({
      symbol: "600519",
      name: "贵州茅台",
      strategyText: "突破20日新高买入"
    });

    expect(code).toContain('symbol="600519"');
    expect(code).toContain("突破20日新高买入");
  });
});
