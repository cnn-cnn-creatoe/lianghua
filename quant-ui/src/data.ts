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

export type MarketKey = "ashare" | "global";
export type Tone = "red" | "green" | "blue" | "amber" | "neutral";
export type AssetType = "ashare" | "us" | "crypto" | "index";

export type NavItem = {
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

export type Metric = {
  label: string;
  value: string;
  meta?: string;
  tone?: Tone;
};

export type Row = {
  name: string;
  value: string;
  meta: string;
  tone?: Tone;
};

export type Agent = {
  role: string;
  stance: string;
  detail: string;
  tone: Exclude<Tone, "neutral">;
};

export type AssetRow = {
  symbol: string;
  name: string;
  assetType: AssetType;
  price: string;
  change: string;
  volume: string;
  signal: string;
  tone: Tone;
};

export type StrategySimulation = {
  name: string;
  market: string;
  status: string;
  virtualReturn: string;
  drawdown: string;
  winRate: string;
  trigger: string;
  mode: string;
  tradingEnabled: false;
  tone: Tone;
};

export type PaperOrder = {
  symbol: string;
  name: string;
  side: "买入" | "卖出" | "做多" | "做空" | "观望";
  triggerPrice: string;
  simulatedPrice: string;
  status: string;
  riskReason: string;
  tradingEnabled: false;
  tone: Tone;
};

export type PaperPosition = {
  symbol: string;
  name: string;
  market: string;
  weight: string;
  cost: string;
  pnl: string;
  riskTag: string;
  tone: Tone;
};

export type ResearchReference = {
  name: string;
  url: string;
  capability: string;
  frontendUse: string;
  tone: Tone;
};

export type MarketProfile = {
  key: MarketKey;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  theme: "ashare" | "global";
  metrics: Metric[];
  ticker: Row[];
  radar: Row[];
  heatmap: Row[];
  agents: Agent[];
  strategies: StrategySimulation[];
  backtest: Metric[];
  risk: Row[];
  dataSources: Row[];
  commandExamples: string[];
  chartColor: string;
  assets: AssetRow[];
  paperOrders: PaperOrder[];
  paperPositions: PaperPosition[];
  researchReferences: ResearchReference[];
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
  { label: "模拟监控", Icon: Activity }
];

const sharedReferences: ResearchReference[] = [
  {
    name: "TradingAgents-CN",
    url: "https://github.com/hsliuping/TradingAgents-CN",
    capability: "中文多智能体投研、A 股数据、本地化报告",
    frontendUse: "沉淀 A 股分析师角色、研究进度和合规提示。",
    tone: "red"
  },
  {
    name: "TradingAgents",
    url: "https://github.com/TauricResearch/TradingAgents",
    capability: "基本面、情绪、新闻、技术、交易员、风控团队",
    frontendUse: "构建多角色辩论和策略结论流。",
    tone: "blue"
  },
  {
    name: "Vibe-Trading",
    url: "https://github.com/HKUDS/Vibe-Trading",
    capability: "Shadow Account、跨市场回测、run card、Pine/TDX 导出",
    frontendUse: "参考研究运行卡、影子账户和策略产物展示。",
    tone: "green"
  },
  {
    name: "FinceptTerminal",
    url: "https://github.com/Fincept-Corporation/FinceptTerminal",
    capability: "多资产终端、100+ 数据连接器、AI 代理、组合分析",
    frontendUse: "参考高密度终端布局、资产研究和数据连接器矩阵。",
    tone: "amber"
  },
  {
    name: "freqtrade",
    url: "https://github.com/freqtrade/freqtrade",
    capability: "加密 dry-run、回测、WebUI、策略优化",
    frontendUse: "参考加密纸面账户、策略队列和风控边界。",
    tone: "blue"
  },
  {
    name: "vnpy",
    url: "https://github.com/vnpy/vnpy",
    capability: "事件驱动、CTA 回测、仿真账户、风控与多接口",
    frontendUse: "参考 A 股仿真账户、策略引擎和风控面板。",
    tone: "green"
  }
];

export const markets: Record<MarketKey, MarketProfile> = {
  ashare: {
    key: "ashare",
    label: "A 股",
    eyebrow: "竞价 / 板块 / 龙虎榜 / 公告",
    title: "A 股研究与回测工作台",
    description:
      "覆盖竞价 1 进 2、打板扫板、板块强度、资金流、龙虎榜、公告和每日决策仪表盘。",
    theme: "ashare",
    chartColor: "#f97316",
    metrics: [
      { label: "今日候选", value: "36", meta: "竞价 + 板块强度过滤", tone: "red" },
      { label: "强势板块", value: "8", meta: "涨停扩散与中军放量", tone: "amber" },
      { label: "模拟订单", value: "5", meta: "全部为静态研究单", tone: "blue" },
      { label: "下单能力", value: "未接入", meta: "无券商、无账户、无委托", tone: "green" }
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
    assets: [
      { symbol: "300750", name: "宁德时代", assetType: "ashare", price: "214.36", change: "+2.18%", volume: "41.2 亿", signal: "固态电池中军", tone: "red" },
      { symbol: "688017", name: "绿的谐波", assetType: "ashare", price: "224.12", change: "+4.24%", volume: "18.7 亿", signal: "机器人高弹性", tone: "red" },
      { symbol: "002475", name: "立讯精密", assetType: "ashare", price: "38.42", change: "+1.63%", volume: "22.8 亿", signal: "消费电子回流", tone: "amber" },
      { symbol: "600519", name: "贵州茅台", assetType: "ashare", price: "1698.50", change: "+0.38%", volume: "23.2 亿", signal: "权重稳定器", tone: "neutral" },
      { symbol: "600905", name: "三峡能源", assetType: "ashare", price: "4.45", change: "-0.45%", volume: "3.3 亿", signal: "资金观望", tone: "green" }
    ],
    agents: [
      { role: "技术分析师", stance: "谨慎看多", detail: "竞价量能有效，但高标分歧扩大。", tone: "red" },
      { role: "情绪分析师", stance: "偏热", detail: "涨停扩散后需要控制炸板风险。", tone: "amber" },
      { role: "风控专家", stance: "降低仓位", detail: "连板高度上行，失败交易尾部风险增大。", tone: "green" },
      { role: "回测专家", stance: "样本充足", detail: "竞价 1 进 2 可按板块强度分层。", tone: "blue" }
    ],
    strategies: [
      {
        name: "竞价 1进2",
        market: "A 股",
        status: "模拟运行",
        virtualReturn: "+18.4%",
        drawdown: "-6.8%",
        winRate: "58%",
        trigger: "昨日首板、竞价额 > 3000 万、板块热度前 5",
        mode: "研究回测",
        tradingEnabled: false,
        tone: "red"
      },
      {
        name: "打板/扫板过滤",
        market: "A 股",
        status: "观察",
        virtualReturn: "+9.7%",
        drawdown: "-4.1%",
        winRate: "61%",
        trigger: "封单强度 > 2.4、炸板率 < 25%、换手不超阈值",
        mode: "静态模拟",
        tradingEnabled: false,
        tone: "amber"
      },
      {
        name: "强势板块后排",
        market: "A 股",
        status: "草案",
        virtualReturn: "+6.3%",
        drawdown: "-5.2%",
        winRate: "53%",
        trigger: "龙头 2 连板、后排放量突破 5 日均线",
        mode: "样本验证",
        tradingEnabled: false,
        tone: "blue"
      }
    ],
    paperOrders: [
      { symbol: "300750", name: "宁德时代", side: "买入", triggerPrice: "212.80", simulatedPrice: "214.36", status: "模拟成交", riskReason: "仓位 8%，未触发集中度上限", tradingEnabled: false, tone: "red" },
      { symbol: "688017", name: "绿的谐波", side: "观望", triggerPrice: "226.00", simulatedPrice: "--", status: "风控拦截", riskReason: "机器人板块集中度偏高", tradingEnabled: false, tone: "amber" },
      { symbol: "002475", name: "立讯精密", side: "买入", triggerPrice: "38.10", simulatedPrice: "38.42", status: "模拟成交", riskReason: "消费电子低位补涨，单票暴露可控", tradingEnabled: false, tone: "blue" },
      { symbol: "600905", name: "三峡能源", side: "卖出", triggerPrice: "4.48", simulatedPrice: "4.45", status: "模拟止损", riskReason: "量能未确认，退出观察", tradingEnabled: false, tone: "green" }
    ],
    paperPositions: [
      { symbol: "300750", name: "宁德时代", market: "A 股", weight: "8.0%", cost: "212.80", pnl: "+0.73%", riskTag: "中军持仓", tone: "red" },
      { symbol: "002475", name: "立讯精密", market: "A 股", weight: "6.5%", cost: "38.10", pnl: "+0.84%", riskTag: "低位补涨", tone: "blue" },
      { symbol: "600519", name: "贵州茅台", market: "A 股", weight: "5.0%", cost: "1692.00", pnl: "+0.38%", riskTag: "防守权重", tone: "neutral" }
    ],
    backtest: [
      { label: "年化收益", value: "42.6%", meta: "静态样本", tone: "red" },
      { label: "最大回撤", value: "-12.6%", meta: "竞价冲高回落段", tone: "green" },
      { label: "样本数", value: "1,284", meta: "近三年交易日", tone: "neutral" },
      { label: "盈亏比", value: "1.42", meta: "含模拟滑点", tone: "blue" }
    ],
    risk: [
      { name: "单策略暴露", value: "24%", meta: "低于 30% 上限", tone: "green" },
      { name: "同板块集中度", value: "42%", meta: "固态电池偏高", tone: "amber" },
      { name: "隔夜跳空风险", value: "中", meta: "次日溢价回测", tone: "amber" },
      { name: "真实下单状态", value: "关闭", meta: "仅静态模拟，不触达券商接口", tone: "green" }
    ],
    dataSources: [
      { name: "a-stock-data", value: "在线", meta: "行情/资金/龙虎榜", tone: "green" },
      { name: "Eastmoney push2his", value: "已接入", meta: "1m/5m/15m/30m/60m/日周月 K 线", tone: "green" },
      { name: "AKShare", value: "在线", meta: "历史行情/公告/研报", tone: "green" },
      { name: "TradingView", value: "视觉参考", meta: "图表和指标布局，不接交易", tone: "blue" },
      { name: "模拟交易账本", value: "前端静态", meta: "不保存账户、不发送委托", tone: "amber" }
    ],
    commandExamples: [
      "扫描明天竞价 1 进 2 候选，按板块强度排序",
      "回测打板过滤策略过去 180 个交易日的胜率和回撤",
      "生成今日 A 股决策仪表盘，包含入场和退出条件"
    ],
    researchReferences: sharedReferences
  },
  global: {
    key: "global",
    label: "美股 / 加密",
    eyebrow: "US Equities / Crypto / Funding / Macro",
    title: "美股与加密资产研究终端",
    description:
      "把美股科技股、核心指数、BTC/ETH/SOL、资金费率、预测市场和策略模拟放在同一张全球资产工作台。",
    theme: "global",
    chartColor: "#38bdf8",
    metrics: [
      { label: "全球信号", value: "29", meta: "美股 14 / 加密 15", tone: "blue" },
      { label: "高分机会", value: "7", meta: "突破、回踩、资金费率分歧", tone: "green" },
      { label: "模拟订单", value: "6", meta: "paper-only，不连交易所", tone: "amber" },
      { label: "下单能力", value: "未接入", meta: "无券商、无交易所 API", tone: "green" }
    ],
    ticker: [
      { name: "NASDAQ 100", value: "+1.1%", meta: "AI 权重回流", tone: "green" },
      { name: "NVDA 动量", value: "82", meta: "成交额扩张", tone: "blue" },
      { name: "BTC 突破", value: "88", meta: "4H 动量增强", tone: "blue" },
      { name: "ETH/BTC", value: "转强", meta: "相对强度上穿 20D", tone: "green" },
      { name: "资金费率", value: "0.018%", meta: "杠杆温和", tone: "amber" }
    ],
    radar: [
      { name: "SPY 24h", value: "+0.7%", meta: "宏观风险回落", tone: "green" },
      { name: "QQQ 24h", value: "+1.2%", meta: "科技股强于大盘", tone: "green" },
      { name: "BTC 24h", value: "+2.4%", meta: "站上短期均线", tone: "blue" },
      { name: "合约持仓", value: "+7.2%", meta: "杠杆升温但未过热", tone: "amber" }
    ],
    heatmap: [
      { name: "AI 美股", value: "+2.8%", meta: "NVDA / AMD / MSFT", tone: "green" },
      { name: "MegaCap", value: "+1.4%", meta: "权重同步", tone: "green" },
      { name: "BTC", value: "+2.4%", meta: "趋势突破", tone: "blue" },
      { name: "ETH", value: "+1.8%", meta: "强于 BTC", tone: "green" },
      { name: "SOL", value: "-0.7%", meta: "震荡回踩", tone: "red" },
      { name: "DeFi", value: "+0.9%", meta: "轮动补涨", tone: "green" }
    ],
    assets: [
      { symbol: "QQQ", name: "纳指 100 ETF", assetType: "index", price: "478.20", change: "+1.12%", volume: "72.4M", signal: "科技权重回流", tone: "green" },
      { symbol: "NVDA", name: "NVIDIA", assetType: "us", price: "1048.90", change: "+3.26%", volume: "48.1M", signal: "AI 动量核心", tone: "green" },
      { symbol: "MSFT", name: "Microsoft", assetType: "us", price: "431.80", change: "+0.82%", volume: "22.6M", signal: "防守成长", tone: "blue" },
      { symbol: "BTCUSDT", name: "Bitcoin", assetType: "crypto", price: "68,420", change: "+2.40%", volume: "31.8B", signal: "4H 突破", tone: "blue" },
      { symbol: "ETHUSDT", name: "Ethereum", assetType: "crypto", price: "3,780", change: "+1.80%", volume: "16.4B", signal: "相对强度改善", tone: "green" },
      { symbol: "SOLUSDT", name: "Solana", assetType: "crypto", price: "169.40", change: "-0.70%", volume: "3.1B", signal: "等待回踩确认", tone: "red" }
    ],
    agents: [
      { role: "美股技术分析师", stance: "看多科技权重", detail: "QQQ 放量突破，NVDA 仍是主驱动。", tone: "blue" },
      { role: "加密趋势分析师", stance: "看多 BTC", detail: "BTC 站上 4H 区间上沿，回踩确认更优。", tone: "green" },
      { role: "情绪分析师", stance: "谨慎乐观", detail: "社媒热度上升，但追涨拥挤度同步升温。", tone: "amber" },
      { role: "风控专家", stance: "限制杠杆", detail: "资金费率抬升，美股与加密相关性提高。", tone: "green" }
    ],
    strategies: [
      {
        name: "QQQ / BTC 双动量",
        market: "美股 / 加密",
        status: "模拟运行",
        virtualReturn: "+11.8%",
        drawdown: "-4.9%",
        winRate: "56%",
        trigger: "QQQ 站上 20D 且 BTC 4H 突破区间",
        mode: "跨市场组合",
        tradingEnabled: false,
        tone: "blue"
      },
      {
        name: "NVDA 趋势回踩",
        market: "美股",
        status: "观察",
        virtualReturn: "+7.4%",
        drawdown: "-3.3%",
        winRate: "59%",
        trigger: "回踩 8EMA 后成交额重新放大",
        mode: "静态模拟",
        tradingEnabled: false,
        tone: "green"
      },
      {
        name: "资金费率反转",
        market: "加密货币",
        status: "验证中",
        virtualReturn: "+4.1%",
        drawdown: "-2.9%",
        winRate: "57%",
        trigger: "资金费率过热但价格未创新高",
        mode: "dry-run 参考",
        tradingEnabled: false,
        tone: "amber"
      },
      {
        name: "Polymarket 赔率分歧",
        market: "预测市场",
        status: "观察",
        virtualReturn: "N/A",
        drawdown: "N/A",
        winRate: "样本中",
        trigger: "事件概率与新闻情绪偏离超过 12%",
        mode: "研究记录",
        tradingEnabled: false,
        tone: "blue"
      }
    ],
    paperOrders: [
      { symbol: "NVDA", name: "NVIDIA", side: "做多", triggerPrice: "1032.00", simulatedPrice: "1048.90", status: "模拟成交", riskReason: "单票权重 9%，低于科技股上限", tradingEnabled: false, tone: "green" },
      { symbol: "QQQ", name: "纳指 100 ETF", side: "买入", triggerPrice: "475.00", simulatedPrice: "478.20", status: "模拟成交", riskReason: "用于组合 beta 暴露，不触达券商", tradingEnabled: false, tone: "blue" },
      { symbol: "BTCUSDT", name: "Bitcoin", side: "做多", triggerPrice: "67,800", simulatedPrice: "68,420", status: "模拟成交", riskReason: "资金费率未过热，仅纸面账户", tradingEnabled: false, tone: "blue" },
      { symbol: "SOLUSDT", name: "Solana", side: "观望", triggerPrice: "172.00", simulatedPrice: "--", status: "风控拦截", riskReason: "回踩未确认，相关性暴露偏高", tradingEnabled: false, tone: "red" }
    ],
    paperPositions: [
      { symbol: "QQQ", name: "纳指 100 ETF", market: "美股", weight: "12.0%", cost: "475.00", pnl: "+0.67%", riskTag: "指数 beta", tone: "blue" },
      { symbol: "NVDA", name: "NVIDIA", market: "美股", weight: "9.0%", cost: "1032.00", pnl: "+1.64%", riskTag: "AI 动量", tone: "green" },
      { symbol: "BTCUSDT", name: "Bitcoin", market: "加密", weight: "10.0%", cost: "67,800", pnl: "+0.91%", riskTag: "4H 突破", tone: "blue" },
      { symbol: "ETHUSDT", name: "Ethereum", market: "加密", weight: "6.0%", cost: "3,720", pnl: "+1.61%", riskTag: "相对强度", tone: "green" }
    ],
    backtest: [
      { label: "30日收益", value: "+8.9%", meta: "美股 + 加密组合", tone: "green" },
      { label: "最大回撤", value: "-4.8%", meta: "BTC 回踩段", tone: "red" },
      { label: "模拟交易", value: "214", meta: "全部 paper-only", tone: "neutral" },
      { label: "夏普", value: "1.28", meta: "静态样本", tone: "blue" }
    ],
    risk: [
      { name: "杠杆温度", value: "中", meta: "资金费率未过热", tone: "green" },
      { name: "相关性暴露", value: "0.82", meta: "QQQ/BTC 同向提高", tone: "amber" },
      { name: "事件风险", value: "高", meta: "宏观数据窗口", tone: "red" },
      { name: "真实下单状态", value: "关闭", meta: "仅静态模拟，不触达券商或交易所", tone: "green" }
    ],
    dataSources: [
      { name: "Binance Spot Klines", value: "已接入", meta: "BTC/ETH/SOL 多周期 K 线，无需 API key", tone: "green" },
      { name: "Yahoo / Polygon", value: "待接入", meta: "美股延迟行情和财务数据", tone: "blue" },
      { name: "CCXT / 交易所", value: "预留", meta: "后续可扩展更多交易所公开行情", tone: "blue" },
      { name: "TradingView", value: "视觉参考", meta: "图表布局、指标层和资产切换", tone: "green" },
      { name: "模拟账本", value: "前端静态", meta: "不保存密钥、不发送委托", tone: "amber" }
    ],
    commandExamples: [
      "用 QQQ 与 BTC 双动量做 30 天静态模拟",
      "找出资金费率过热但价格未突破的币种",
      "分析 NVDA 和 BTC 同涨时组合相关性风险"
    ],
    researchReferences: sharedReferences
  }
};
