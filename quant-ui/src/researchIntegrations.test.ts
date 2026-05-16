import { describe, expect, it } from "vitest";
import { markets } from "./data";
import { backtestCases, dataImportSources, getBacktestReadiness, repositoryFindings } from "./researchIntegrations";

describe("research integrations", () => {
  it("summarizes imported backtest and data repositories", () => {
    expect(repositoryFindings.map((item) => item.repo)).toEqual([
      "stock-quant",
      "tdx2db",
      "Ashare",
      "akshare",
      "efinance",
      "efinance-go",
      "TradingAgents-CN",
      "Vibe-Trading",
      "FinceptTerminal",
      "freqtrade",
      "vnpy"
    ]);
    expect(repositoryFindings.find((item) => item.repo === "stock-quant")?.capabilities).toContain("本地 CSV 回测");
    expect(repositoryFindings.find((item) => item.repo === "freqtrade")?.capabilities).toContain("Dry-run");
    expect(repositoryFindings.find((item) => item.repo === "vnpy")?.capabilities).toContain("Paper Account");
    expect(repositoryFindings.find((item) => item.repo === "efinance")?.capabilities).toContain("日 K/分钟 K");
    expect(dataImportSources.find((item) => item.name === "tdx2db")?.outputs).toContain("v_stock_qfq");
    expect(dataImportSources.find((item) => item.name === "Ashare")?.outputs).toContain("DataFrame");
    expect(dataImportSources.find((item) => item.name === "Eastmoney push2his")?.outputs).toContain("1m/5m/15m/30m/60m");
  });

  it("provides runnable research backtest cases without enabling trading", () => {
    expect(backtestCases).toHaveLength(3);
    expect(backtestCases[0]).toMatchObject({
      engine: "stock-quant",
      strategy: "EnhancedVolumeStrategy",
      tradingEnabled: false
    });

    const readiness = getBacktestReadiness();

    expect(readiness.readyImports).toBe(3);
    expect(readiness.backtestCases).toBe(3);
    expect(readiness.executionMode).toBe("研究回测，不接入下单");
  });

  it("keeps static simulated trading data separate from real trading", () => {
    expect(Object.keys(markets)).toEqual(["ashare", "global"]);
    expect(markets.global.label).toBe("美股 / 加密");
    expect(markets.global.assets.some((asset) => asset.assetType === "us")).toBe(true);
    expect(markets.global.assets.some((asset) => asset.assetType === "crypto")).toBe(true);
    expect(markets.ashare.paperOrders.every((order) => order.tradingEnabled === false)).toBe(true);
    expect(markets.global.paperOrders.every((order) => order.tradingEnabled === false)).toBe(true);
    expect(markets.global.researchReferences.map((item) => item.name)).toContain("Vibe-Trading");
  });
});
