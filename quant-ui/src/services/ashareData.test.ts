import { describe, expect, it, vi } from "vitest";
import {
  fallbackAshareDashboard,
  loadAshareDashboard,
  parseSinaQuotes,
  parseTencentQuotes,
  safeLoad,
  toTencentSymbol
} from "./ashareData";

describe("ashare data adapter", () => {
  it("normalizes A-share codes for Tencent Finance", () => {
    expect(toTencentSymbol("688017")).toBe("sh688017");
    expect(toTencentSymbol("000858")).toBe("sz000858");
    expect(toTencentSymbol("832000")).toBe("bj832000");
    expect(toTencentSymbol("sh000001")).toBe("sh000001");
  });

  it("parses Tencent quote payload into typed rows", () => {
    const text =
      'v_sh688017="51~绿的谐波~688017~224.12~215.01~214.10~1000~500~500~224.10~10~224.00~20~223.90~30~223.80~40~223.70~50~224.20~12~224.30~22~224.40~32~224.50~42~224.60~52~~20260514150000~9.11~4.24~229.62~214.10~224.12/1000/187040~1000~187040~4.55~300.45~~~~7.22~410.88~410.88~11.51~258.01~172.01~1.20~~~314.76";';

    const rows = parseTencentQuotes(text);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      code: "688017",
      name: "绿的谐波",
      price: 224.12,
      changePct: 4.24,
      peTtm: 300.45,
      pb: 11.51
    });
  });

  it("parses adata Sina realtime quote payload into typed rows", () => {
    const text = 'var hq_str_s_sh600905="三峡能源,4.450,-0.020,-0.448,74208,3312.3456";';

    const rows = parseSinaQuotes(text);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      code: "600905",
      name: "三峡能源",
      price: 4.45,
      changeAmount: -0.02,
      changePct: -0.448,
      amountWan: 3312.3456,
      source: "Sina"
    });
    expect(rows[0].previousClose).toBeCloseTo(4.47, 2);
  });

  it("uses adata Sina realtime quotes when richer sources fail", async () => {
    const fetcher = vi.fn((url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.startsWith("/api/sina/list=")) {
        return Promise.resolve(
          new Response('var hq_str_s_sh600905="SXNY,4.450,-0.020,-0.448,74208,3312.3456";')
        );
      }
      return Promise.reject(new Error("network down"));
    }) as typeof fetch;

    const dashboard = await loadAshareDashboard(fetcher, "600905");

    expect(dashboard.sources).toContainEqual(
      expect.objectContaining({
        source: "新浪实时行情（adata）",
        status: "live"
      })
    );
    expect(dashboard.quotes.some((quote) => quote.code === "600905" && quote.source === "Sina")).toBe(true);
  });

  it("returns fallback data when a source fails", async () => {
    const result = await safeLoad("腾讯财经", () => Promise.reject(new Error("offline")), [
      fallbackAshareDashboard.quotes[0]
    ]);

    expect(result.status).toBe("fallback");
    expect(result.data[0].name).toBe(fallbackAshareDashboard.quotes[0].name);
    expect(result.error).toContain("offline");
  });

  it("keeps the dashboard populated when all network calls fail", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));

    const dashboard = await loadAshareDashboard(fetcher);

    expect(dashboard.quotes.length).toBeGreaterThan(0);
    expect(dashboard.indices.length).toBeGreaterThan(0);
    expect(dashboard.sources.some((source) => source.status === "fallback")).toBe(true);
  });
});
