import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";
import App from "./App";

describe("QuantForge shell", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  it("renders the dual-market quant workspace", () => {
    render(<App />);

    expect(screen.getByText("量化工坊")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A 股" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "加密货币" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A 股数据总览" })).toBeInTheDocument();
  });

  it("renders A-share live data surfaces", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "A 股数据总览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "主要指数" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "实时行情列表" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "股票详情" })).toBeInTheDocument();
    expect(screen.getByText("接口失败保留示例数据")).toBeInTheDocument();
  });

  it("switches sidebar pages instead of keeping every module on one screen", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "A 股数据总览" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "数据中心" }));
    expect(screen.getByRole("heading", { name: "数据中心" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "接口需求梳理" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A 股数据总览" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "复盘报告" }));
    expect(screen.getByRole("heading", { name: "复盘报告" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "龙虎榜与资金线索" })).toBeInTheDocument();
  });

  it("shows the A-share backtest lab based on imported open-source projects", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "A 股数据总览" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "回测实验室" }));
    expect(screen.getByRole("heading", { name: "回测测试中心" })).toBeInTheDocument();
    expect(screen.getAllByText("stock-quant").length).toBeGreaterThan(0);
    expect(screen.getAllByText("EnhancedVolumeStrategy").length).toBeGreaterThan(0);
    expect(screen.getByText("研究回测，不接入下单")).toBeInTheDocument();
  });

  it("shows the local data import plan in the data center", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "A 股数据总览" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "数据中心" }));
    expect(screen.getByRole("heading", { name: "本地数据导入" })).toBeInTheDocument();
    expect(screen.getAllByText("tdx2db").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ashare").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DuckDB").length).toBeGreaterThan(0);
  });

  it("uses Chinese labels for visible shell and section text", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "A 股数据总览" })).toBeInTheDocument();
    expect(screen.queryByText("QuantForge")).not.toBeInTheDocument();
    expect(screen.queryByText("Crypto")).not.toBeInTheDocument();
    expect(screen.queryByText("Market overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Stock detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Realtime quotes")).not.toBeInTheDocument();
  });
});
