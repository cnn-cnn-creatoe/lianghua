import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  Database,
  FileText,
  Gauge,
  Layers3,
  LineChart,
  Radar,
  ScrollText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { ComponentType } from "react";

export type MarketKey = "ashare" | "crypto";

export type NavItem = {
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

export type Metric = {
  label: string;
  value: string;
  tone?: "red" | "green" | "blue" | "amber" | "neutral";
};

export type Row = {
  name: string;
  value: string;
  meta: string;
  tone?: "red" | "green" | "blue" | "amber" | "neutral";
};

export type Agent = {
  role: string;
  stance: string;
  detail: string;
  tone: "red" | "green" | "blue" | "amber";
};

export type Strategy = {
  name: string;
  market: string;
  status: string;
  returnValue: string;
  drawdown: string;
  winRate: string;
};

export type MarketProfile = {
  key: MarketKey;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: Metric[];
  ticker: Row[];
  radar: Row[];
  heatmap: Row[];
  agents: Agent[];
  strategies: Strategy[];
  backtest: Metric[];
  risk: Row[];
  dataSources: Row[];
  commandExamples: string[];
  chartColor: string;
};

export const navItems: NavItem[] = [
  { label: "总览", Icon: Gauge },
  { label: "行情雷达", Icon: Radar },
  { label: "策略库", Icon: Layers3 },
  { label: "回测实验室", Icon: BarChart3 },
  { label: "AI 投研", Icon: BrainCircuit },
  { label: "组合风控", Icon: ShieldCheck },
  { label: "数据中心", Icon: Database },
  { label: "复盘报告", Icon: FileText }
];

export const quickActions: NavItem[] = [
  { label: "自然语言策略", Icon: Sparkles },
  { label: "多智能体辩论", Icon: Bot },
  { label: "行情截面", Icon: LineChart },
  { label: "研究日志", Icon: ScrollText },
  { label: "实时监控", Icon: Activity }
];

export const markets: Record<MarketKey, MarketProfile> = {
  ashare: {
    key: "ashare",
    label: "A 股",
    eyebrow: "竞价 / 板块 / 龙虎榜 / 公告",
    title: "A 股研究与回测工作台",
    description:
      "覆盖竞价 1 进 2、打板扫板、板块强度、资金流、龙虎榜、公告和每日决策仪表盘。",
    chartColor: "#ef4444",
    metrics: [
      { label: "今日候选", value: "36", tone: "red" },
      { label: "强势板块", value: "8", tone: "amber" },
      { label: "回测队列", value: "7", tone: "blue" },
      { label: "风控状态", value: "正常", tone: "green" }
    ],
    ticker: [
      { name: "竞价 1进2", value: "12 只", meta: "昨日首板 + 今日竞价", tone: "red" },
      { name: "打板观察池", value: "24 只", meta: "距涨停 < 1.2%", tone: "amber" },
      { name: "板块共振", value: "固态电池", meta: "涨停 9 / 炸板 2", tone: "red" },
      { name: "龙虎榜线索", value: "9 条", meta: "机构 + 游资席位", tone: "blue" },
      { name: "主力资金", value: "分歧", meta: "强势股净流入回落", tone: "green" }
    ],
    radar: [
      { name: "涨停家数", value: "74", meta: "较昨日 +18", tone: "red" },
      { name: "炸板率", value: "20.4%", meta: "可交易情绪偏热", tone: "amber" },
      { name: "连板高度", value: "5B", meta: "高标风险上升", tone: "red" },
      { name: "北向流向", value: "-12.8 亿", meta: "尾盘回流不足", tone: "green" }
    ],
    heatmap: [
      { name: "固态电池", value: "+4.8%", meta: "龙头加速", tone: "red" },
      { name: "机器人", value: "+3.1%", meta: "中军放量", tone: "red" },
      { name: "低空经济", value: "+2.4%", meta: "轮动补涨", tone: "amber" },
      { name: "算力", value: "-0.6%", meta: "高位分化", tone: "green" },
      { name: "地产链", value: "-1.2%", meta: "资金流出", tone: "green" }
    ],
    agents: [
      { role: "技术分析师", stance: "谨慎看多", detail: "竞价量能有效，但高标分歧扩大。", tone: "red" },
      { role: "情绪分析师", stance: "偏热", detail: "涨停扩散后需要控制炸板风险。", tone: "amber" },
      { role: "风控专家", stance: "降低仓位", detail: "连板高度上行，失败交易尾部风险增大。", tone: "green" },
      { role: "回测专家", stance: "样本充足", detail: "竞价 1 进 2 可按板块强度分层。", tone: "blue" }
    ],
    strategies: [
      { name: "竞价 1进2", market: "A 股", status: "验证中", returnValue: "+18.4%", drawdown: "-6.8%", winRate: "58%" },
      { name: "打板/扫板过滤", market: "A 股", status: "观察", returnValue: "+9.7%", drawdown: "-4.1%", winRate: "61%" },
      { name: "强势板块后排", market: "A 股", status: "草案", returnValue: "+6.3%", drawdown: "-5.2%", winRate: "53%" }
    ],
    backtest: [
      { label: "年化收益", value: "42.6%", tone: "red" },
      { label: "最大回撤", value: "-12.6%", tone: "green" },
      { label: "样本数", value: "1,284", tone: "neutral" },
      { label: "盈亏比", value: "1.42", tone: "blue" }
    ],
    risk: [
      { name: "单策略暴露", value: "24%", meta: "低于 30% 上限", tone: "green" },
      { name: "同板块集中度", value: "42%", meta: "固态电池偏高", tone: "amber" },
      { name: "隔夜跳空风险", value: "中", meta: "次日溢价回测", tone: "amber" }
    ],
    dataSources: [
      { name: "a-stock-data", value: "在线", meta: "行情/资金/龙虎榜", tone: "green" },
      { name: "AKShare", value: "在线", meta: "历史行情/公告/研报", tone: "green" },
      { name: "TradingView", value: "可选", meta: "图表与指标参考", tone: "blue" }
    ],
    commandExamples: [
      "扫描明天竞价 1 进 2 候选，按板块强度排序",
      "回测打板过滤策略过去 180 个交易日的胜率和回撤",
      "生成今日 A 股决策仪表盘，包含入场和退出条件"
    ]
  },
  crypto: {
    key: "crypto",
    label: "加密货币",
    eyebrow: "交易所 / 资金费率 / 预测市场",
    title: "加密资产研究与回测工作台",
    description:
      "覆盖 BTC/ETH/SOL 趋势突破、交易所行情、资金费率、预测市场、机器人观察和风险暴露。",
    chartColor: "#38bdf8",
    metrics: [
      { label: "信号数", value: "18", tone: "blue" },
      { label: "高分机会", value: "5", tone: "green" },
      { label: "回测队列", value: "4", tone: "amber" },
      { label: "风险状态", value: "中性", tone: "green" }
    ],
    ticker: [
      { name: "BTC 突破", value: "88", meta: "4H 动量增强", tone: "blue" },
      { name: "ETH 均值回归", value: "64", meta: "波动收敛", tone: "green" },
      { name: "SOL 动量", value: "72", meta: "成交额扩张", tone: "blue" },
      { name: "资金费率", value: "0.018%", meta: "杠杆温和", tone: "amber" },
      { name: "Polymarket 分歧", value: "5 个", meta: "概率偏离赔率", tone: "blue" }
    ],
    radar: [
      { name: "BTC 24h", value: "+2.4%", meta: "站上短期均线", tone: "green" },
      { name: "ETH 24h", value: "+1.8%", meta: "强于 BTC", tone: "green" },
      { name: "合约持仓", value: "+7.2%", meta: "杠杆升温", tone: "amber" },
      { name: "稳定币流入", value: "+3.6B", meta: "流动性改善", tone: "blue" }
    ],
    heatmap: [
      { name: "BTC", value: "+2.4%", meta: "趋势", tone: "green" },
      { name: "ETH", value: "+1.8%", meta: "强势", tone: "green" },
      { name: "SOL", value: "-0.7%", meta: "震荡", tone: "red" },
      { name: "AI 资产", value: "+4.1%", meta: "题材活跃", tone: "blue" },
      { name: "DeFi", value: "+0.9%", meta: "轮动", tone: "green" }
    ],
    agents: [
      { role: "技术分析师", stance: "看多 BTC", detail: "突破区间上沿，回踩确认更优。", tone: "blue" },
      { role: "情绪分析师", stance: "谨慎", detail: "社媒热度上升，但追涨拥挤。", tone: "amber" },
      { role: "风控专家", stance: "限制杠杆", detail: "资金费率抬升，不宜放大仓位。", tone: "green" },
      { role: "预测市场专家", stance: "观察分歧", detail: "Polymarket 赔率与新闻概率出现偏离。", tone: "blue" }
    ],
    strategies: [
      { name: "BTC 30日突破", market: "加密货币", status: "运行", returnValue: "+6.2%", drawdown: "-3.8%", winRate: "54%" },
      { name: "资金费率反转", market: "加密货币", status: "验证中", returnValue: "+4.1%", drawdown: "-2.9%", winRate: "57%" },
      { name: "Polymarket 赔率分歧", market: "预测市场", status: "观察", returnValue: "N/A", drawdown: "N/A", winRate: "样本中" }
    ],
    backtest: [
      { label: "30日收益", value: "+6.2%", tone: "green" },
      { label: "最大回撤", value: "-3.8%", tone: "red" },
      { label: "交易数", value: "214", tone: "neutral" },
      { label: "夏普", value: "1.16", tone: "blue" }
    ],
    risk: [
      { name: "杠杆温度", value: "中", meta: "资金费率未过热", tone: "green" },
      { name: "相关性暴露", value: "0.82", meta: "BTC/ETH 高相关", tone: "amber" },
      { name: "事件风险", value: "高", meta: "宏观数据窗口", tone: "red" }
    ],
    dataSources: [
      { name: "交易所行情", value: "待接入", meta: "现货/合约行情", tone: "blue" },
      { name: "图表行情", value: "参考", meta: "指标与图表", tone: "blue" },
      { name: "预测市场", value: "研究", meta: "赔率与概率分歧", tone: "amber" }
    ],
    commandExamples: [
      "帮我用突破策略回测 BTC 过去 30 天",
      "找出资金费率过热但价格未突破的币种",
      "分析 Polymarket 某事件赔率和新闻概率分歧"
    ]
  }
};
