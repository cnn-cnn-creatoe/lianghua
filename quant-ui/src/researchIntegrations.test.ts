import { describe, expect, it } from "vitest";
import { backtestCases, dataImportSources, getBacktestReadiness, repositoryFindings } from "./researchIntegrations";

describe("research integrations", () => {
  it("summarizes imported backtest and data repositories", () => {
    expect(repositoryFindings.map((item) => item.repo)).toEqual(["stock-quant", "tdx2db", "Ashare"]);
    expect(repositoryFindings.find((item) => item.repo === "stock-quant")?.capabilities).toContain("本地 CSV 回测");
    expect(dataImportSources.find((item) => item.name === "tdx2db")?.outputs).toContain("v_stock_qfq");
    expect(dataImportSources.find((item) => item.name === "Ashare")?.outputs).toContain("DataFrame");
  });

  it("provides runnable research backtest cases without enabling trading", () => {
    expect(backtestCases).toHaveLength(3);
    expect(backtestCases[0]).toMatchObject({
      engine: "stock-quant",
      strategy: "EnhancedVolumeStrategy",
      tradingEnabled: false
    });

    const readiness = getBacktestReadiness();

    expect(readiness.readyImports).toBe(2);
    expect(readiness.backtestCases).toBe(3);
    expect(readiness.executionMode).toBe("研究回测，不接入下单");
  });
});
