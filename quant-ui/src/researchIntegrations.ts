import type { Tone } from "./services/ashareData";

export type RepositoryFinding = {
  repo: string;
  role: string;
  localPath: string;
  capabilities: string[];
  frontendUse: string;
};

export type DataImportSource = {
  name: string;
  status: "ready" | "planned" | "manual";
  input: string;
  outputs: string[];
  command: string;
  note: string;
  tone: Tone;
};

export type BacktestCase = {
  name: string;
  engine: string;
  strategy: string;
  dataSource: string;
  universe: string;
  period: string;
  expectedOutput: string;
  tradingEnabled: boolean;
  tone: Tone;
};

export type WorkflowStep = {
  title: string;
  detail: string;
  status: string;
  tone: Tone;
};

export const repositoryFindings: RepositoryFinding[] = [
  {
    repo: "stock-quant",
    role: "本地回测引擎参考",
    localPath: "reference-repos/stock-quant",
    capabilities: ["本地 CSV 回测", "EnhancedVolumeStrategy", "批量股票回测", "HTML/日志/信号结果输出"],
    frontendUse: "作为回测测试中心的信息架构参考，前端先展示测试用例和结果，不直接执行 Python。"
  },
  {
    repo: "tdx2db",
    role: "通达信历史数据入库",
    localPath: "reference-repos/tdx2db",
    capabilities: ["通达信 .day 导入", "DuckDB/ClickHouse", "1 分钟线", "前复权/后复权视图"],
    frontendUse: "作为本地历史数据导入方案，后续可由后端执行命令并把数据表暴露给回测模块。"
  },
  {
    repo: "Ashare",
    role: "轻量行情补充源",
    localPath: "reference-repos/Ashare",
    capabilities: ["get_price()", "日线/周线/月线", "1m/5m/15m/30m/60m", "DataFrame 输出"],
    frontendUse: "作为少量股票历史行情和分钟线补充源，适合快速研究和回测样本补齐。"
  }
];

export const dataImportSources: DataImportSource[] = [
  {
    name: "tdx2db",
    status: "ready",
    input: "通达信日线 .day / 可选 1 分钟线",
    outputs: ["raw_kline_daily", "raw_kline_1min", "v_stock_qfq", "v_stock_hfq"],
    command: "tdx2db init --dburi duckdb://./tdx.db --dayfiledir ./vipdoc",
    note: "适合做 A 股历史回测主库，前端目前展示导入方案，实际执行需要后端任务。",
    tone: "blue"
  },
  {
    name: "Ashare",
    status: "ready",
    input: "股票代码 + 周期 + count/end_date",
    outputs: ["DataFrame", "open", "close", "high", "low", "volume"],
    command: "get_price('sh600519', frequency='1d', count=120)",
    note: "适合快速补齐小样本历史数据和分钟线数据，作为 tdx2db 的轻量补充。",
    tone: "green"
  },
  {
    name: "stock-quant CSV",
    status: "planned",
    input: "date,open,high,low,close,volume,amount,stock_code,stock_name,market",
    outputs: ["回测输入 CSV", "策略信号", "HTML 回测报告"],
    command: "run_backtest_enhanced_volume_strategy(csv_path, EnhancedVolumeStrategy, init_cash)",
    note: "用于对接 stock-quant 的现有回测函数，当前前端只展示测试任务。",
    tone: "amber"
  }
];

export const backtestWorkflow: WorkflowStep[] = [
  {
    title: "导入历史数据",
    detail: "优先用 tdx2db 建 DuckDB 历史库，Ashare 作为小样本补充。",
    status: "已设计",
    tone: "blue"
  },
  {
    title: "生成回测样本",
    detail: "统一整理成 stock-quant CSV 字段，保留复权口径和市场标识。",
    status: "待后端",
    tone: "amber"
  },
  {
    title: "运行回测测试",
    detail: "调用 stock-quant 的 EnhancedVolumeStrategy 单股/批量回测。",
    status: "前端展示",
    tone: "green"
  },
  {
    title: "输出研究报告",
    detail: "展示收益、回撤、胜率、交易次数、信号列表和数据质量。",
    status: "已上屏",
    tone: "green"
  }
];

export const backtestCases: BacktestCase[] = [
  {
    name: "单股量价增强回测",
    engine: "stock-quant",
    strategy: "EnhancedVolumeStrategy",
    dataSource: "tdx2db v_stock_qfq",
    universe: "宁德时代 / 贵州茅台 / 中国平安",
    period: "近 3 年日线",
    expectedOutput: "收益曲线、交易信号、持仓记录、资金曲线",
    tradingEnabled: false,
    tone: "blue"
  },
  {
    name: "A 股批量股票池回测",
    engine: "stock-quant",
    strategy: "EnhancedVolumeStrategy",
    dataSource: "tdx2db DuckDB",
    universe: "沪深京 A 股候选池",
    period: "近 180 个交易日",
    expectedOutput: "策略排行、最大回撤、胜率、样本覆盖率",
    tradingEnabled: false,
    tone: "green"
  },
  {
    name: "分钟线快速验证",
    engine: "Ashare + stock-quant",
    strategy: "量价信号回放",
    dataSource: "Ashare 15m / tdx2db raw_kline_1min",
    universe: "强势股观察池",
    period: "近 20 个交易日",
    expectedOutput: "信号触发时间、滑点敏感性、数据缺口提示",
    tradingEnabled: false,
    tone: "amber"
  }
];

export const backtestMetrics = [
  { label: "回测测试", value: "3 套", tone: "blue" as const },
  { label: "导入来源", value: "3 个", tone: "green" as const },
  { label: "执行模式", value: "研究", tone: "amber" as const },
  { label: "下单能力", value: "未接入", tone: "green" as const }
];

export function getBacktestReadiness() {
  return {
    readyImports: dataImportSources.filter((source) => source.status === "ready").length,
    backtestCases: backtestCases.length,
    executionMode: "研究回测，不接入下单"
  };
}
