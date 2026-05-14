import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  CirclePlay,
  Clock3,
  Command,
  Download,
  Eye,
  Filter,
  GitBranch,
  LayoutGrid,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal
} from "lucide-react";
import { useAshareDashboard } from "./hooks/useAshareDashboard";
import { markets, navItems, quickActions, type MarketKey, type MarketProfile } from "./data";
import {
  backtestCases,
  backtestMetrics,
  backtestWorkflow,
  dataImportSources,
  getBacktestReadiness,
  repositoryFindings
} from "./researchIntegrations";
import type { AshareDashboard, AshareQuote, DashboardRow, Tone } from "./services/ashareData";

type MetricLike = {
  label?: string;
  name?: string;
  value: string;
  meta?: string;
  tone?: Tone;
};

function toneClass(tone: string = "neutral") {
  return `tone-${tone}`;
}

function toneForNumber(value: number): Tone {
  if (value > 0) return "red";
  if (value < 0) return "green";
  return "neutral";
}

function formatPrice(value: number, digits = 2) {
  if (!Number.isFinite(value) || value === 0) return "--";
  return value.toFixed(digits);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function formatYi(value: number) {
  if (!Number.isFinite(value) || value === 0) return "--";
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: 1 })} 亿`;
}

function sourceName(source: AshareQuote["source"]) {
  const names: Record<AshareQuote["source"], string> = {
    Tencent: "腾讯财经",
    Eastmoney: "东方财富",
    Sina: "新浪实时（adata）",
    Fallback: "示例数据"
  };
  return names[source];
}

function dashboardStatusText(dashboard: AshareDashboard) {
  if (dashboard.sources.length === 0 || dashboard.sources.every((source) => source.status === "fallback")) {
    return "接口失败保留示例数据";
  }
  if (dashboard.sources.some((source) => source.status === "fallback")) {
    return "部分实时，异常源保留示例数据";
  }
  return "公开接口实时更新";
}

function PageHeader({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children ? <div className="page-actions">{children}</div> : null}
    </section>
  );
}

function PanelTitle({
  eyebrow,
  title,
  children
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ dashboard, loading }: { dashboard: AshareDashboard; loading: boolean }) {
  return (
    <div className="status-cluster">
      <span className={loading ? "status-pill loading" : "status-pill"}>
        <RefreshCw size={14} />
        {loading ? "刷新中" : dashboardStatusText(dashboard)}
      </span>
      <span className="status-pill muted">
        <Clock3 size={14} />
        {dashboard.lastUpdated}
      </span>
    </div>
  );
}

function MiniChart({ market }: { market: MarketProfile }) {
  const stroke = market.chartColor;
  return (
    <div className="chart-shell" aria-label={`${market.label} 行情趋势图`}>
      <svg viewBox="0 0 760 260" role="img" aria-label="模拟行情走势">
        <defs>
          <linearGradient id={`area-${market.key}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.34" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 24 202 C 82 186 98 118 158 134 C 208 148 236 216 294 182 C 356 144 360 86 424 104 C 482 120 494 170 554 132 C 612 96 642 78 736 58"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 24 202 C 82 186 98 118 158 134 C 208 148 236 216 294 182 C 356 144 360 86 424 104 C 482 120 494 170 554 132 C 612 96 642 78 736 58 L 736 238 L 24 238 Z"
          fill={`url(#area-${market.key})`}
        />
        <g className="chart-points">
          <circle cx="158" cy="134" r="5" />
          <circle cx="424" cy="104" r="5" />
          <circle cx="736" cy="58" r="5" />
        </g>
      </svg>
      <div className="chart-controls">
        <button>1分</button>
        <button>5分</button>
        <button className="active">日线</button>
        <button>周线</button>
        <button>月线</button>
      </div>
    </div>
  );
}

function MetricStrip({ rows }: { rows: MetricLike[] }) {
  return (
    <section className="metric-strip" aria-label="核心指标">
      {rows.map((metric) => (
        <div className="metric" key={metric.label ?? metric.name}>
          <span>{metric.label ?? metric.name}</span>
          <strong className={toneClass(metric.tone)}>{metric.value}</strong>
          {metric.meta ? <small>{metric.meta}</small> : null}
        </div>
      ))}
    </section>
  );
}

function RowList({ rows, compact = false }: { rows: DashboardRow[]; compact?: boolean }) {
  return (
    <div className={compact ? "row-list compact" : "row-list"}>
      {rows.map((row) => (
        <div className="data-row" key={`${row.name}-${row.value}`}>
          <div>
            <strong>{row.name}</strong>
            <span>{row.meta}</span>
          </div>
          <b className={toneClass(row.tone)}>{row.value}</b>
        </div>
      ))}
    </div>
  );
}

function MarketHeatmap({ rows }: { rows: DashboardRow[] }) {
  return (
    <div className="heatmap">
      {rows.map((item) => (
        <div className={`heat-tile ${toneClass(item.tone)}`} key={item.name}>
          <strong>{item.name}</strong>
          <span>{item.value}</span>
          <small>{item.meta}</small>
        </div>
      ))}
    </div>
  );
}

function IndexPanel({ dashboard, market }: { dashboard: AshareDashboard; market: MarketProfile }) {
  return (
    <section className="panel market-panel">
      <PanelTitle eyebrow="指数概览" title="主要指数">
        <button className="ghost-button" aria-label="A 股指数范围">
          A 股
          <ChevronDown size={15} />
        </button>
      </PanelTitle>
      <div className="index-grid">
        {dashboard.indices.map((index) => (
          <article className="index-card" key={index.symbol}>
            <span>{index.code}</span>
            <strong>{index.name}</strong>
            <b className={toneClass(toneForNumber(index.changePct))}>{formatPercent(index.changePct)}</b>
            <small>{formatPrice(index.price)} / 成交 {formatYi(index.amountWan / 10000)}</small>
          </article>
        ))}
      </div>
      <MiniChart market={market} />
    </section>
  );
}

function StockDetailPanel({ dashboard }: { dashboard: AshareDashboard }) {
  const stock = dashboard.selectedStock;
  const concepts = dashboard.conceptBlocks.filter((block) => block.type !== "region").slice(0, 8);
  const latestFlow = dashboard.fundFlow[0];

  return (
    <section className="panel watch-panel">
      <PanelTitle eyebrow="个股画像" title="股票详情">
        <button className="icon-button" aria-label="查看分支线索">
          <GitBranch size={17} />
        </button>
      </PanelTitle>
      <div className="stock-detail">
        <div className="stock-title">
          <div>
            <strong>{stock.name}</strong>
            <span>
              {stock.code} / {sourceName(stock.source)}
            </span>
          </div>
          <b className={toneClass(toneForNumber(stock.changePct))}>{formatPercent(stock.changePct)}</b>
        </div>
        <div className="detail-grid">
          <span>
            现价 <b>{formatPrice(stock.price)}</b>
          </span>
          <span>
            成交额 <b>{formatYi(stock.amountWan / 10000)}</b>
          </span>
          <span>
            换手率 <b>{formatPercent(stock.turnoverPct).replace("+", "")}</b>
          </span>
          <span>
            市盈率 <b>{formatPrice(stock.peTtm)}</b>
          </span>
          <span>
            市净率 <b>{formatPrice(stock.pb)}</b>
          </span>
          <span>
            总市值 <b>{formatYi(stock.mcapYi)}</b>
          </span>
          <span>
            涨停价 <b>{formatPrice(stock.limitUp)}</b>
          </span>
          <span>
            跌停价 <b>{formatPrice(stock.limitDown)}</b>
          </span>
        </div>
        <div className="tag-row">
          {concepts.map((block) => (
            <span key={`${block.type}-${block.name}`}>{block.name}</span>
          ))}
        </div>
        {latestFlow ? (
          <p className="panel-note">
            资金流：主力 {latestFlow.mainIn || "--"}，超大单 {latestFlow.superNetIn || "--"}，日期{" "}
            {latestFlow.date || "--"}。
          </p>
        ) : (
          <p className="panel-note">资金流数据为空，保留行情和板块信息。</p>
        )}
      </div>
    </section>
  );
}

function QuoteTable({
  quotes,
  selectedCode,
  onSelectStock
}: {
  quotes: AshareQuote[];
  selectedCode: string;
  onSelectStock: (code: string) => void;
}) {
  return (
    <section className="panel quote-panel">
      <PanelTitle eyebrow="公开行情" title="实时行情列表">
        <span className="table-count">{quotes.length} 只</span>
      </PanelTitle>
      <div className="table-wrap">
        <table className="quote-table">
          <thead>
            <tr>
              <th>股票</th>
              <th>现价</th>
              <th>涨跌幅</th>
              <th>成交额</th>
              <th>换手</th>
              <th>市盈率</th>
              <th>市净率</th>
            </tr>
          </thead>
          <tbody>
            {quotes.slice(0, 14).map((quote, index) => (
              <tr key={`${quote.symbol}-${quote.code}-${index}`} className={selectedCode === quote.code ? "selected" : ""}>
                <td>
                  <button className="table-link" onClick={() => onSelectStock(quote.code)}>
                    <strong>{quote.name}</strong>
                    <span>{quote.code}</span>
                  </button>
                </td>
                <td>{formatPrice(quote.price)}</td>
                <td className={toneClass(toneForNumber(quote.changePct))}>{formatPercent(quote.changePct)}</td>
                <td>{formatYi(quote.amountWan / 10000)}</td>
                <td>{formatPercent(quote.turnoverPct).replace("+", "")}</td>
                <td>{formatPrice(quote.peTtm)}</td>
                <td>{formatPrice(quote.pb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HotStocksPanel({ dashboard }: { dashboard: AshareDashboard }) {
  return (
    <section className="panel heat-panel">
      <PanelTitle eyebrow="题材归因" title="A 股截面热力" />
      <MarketHeatmap rows={dashboard.heatmap} />
      <div className="mini-list">
        {dashboard.hotStocks.slice(0, 5).map((stock) => (
          <article key={`${stock.code}-${stock.name}`}>
            <strong>{stock.name}</strong>
            <span className={toneClass(toneForNumber(stock.changePct))}>{formatPercent(stock.changePct)}</span>
            <p>{stock.reason || "题材归因待更新"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DragonTigerPanel({ dashboard }: { dashboard: AshareDashboard }) {
  return (
    <section className="panel strategy-panel">
      <PanelTitle eyebrow="东方财富数据中心" title="龙虎榜与资金线索">
        <button className="ghost-button">
          <Filter size={16} />
          净买入排序
        </button>
      </PanelTitle>
      <div className="strategy-table dragon-table" role="table" aria-label="龙虎榜线索">
        <div className="strategy-row header" role="row">
          <span>股票</span>
          <span>涨跌幅</span>
          <span>净买入</span>
          <span>买入</span>
          <span>卖出</span>
          <span>上榜原因</span>
        </div>
        {dashboard.dragonTiger.slice(0, 8).map((row) => (
          <div className="strategy-row" role="row" key={`${row.code}-${row.reason}`}>
            <strong>{row.name}</strong>
            <span className={toneClass(toneForNumber(row.changePct))}>{formatPercent(row.changePct)}</span>
            <span className={toneClass(toneForNumber(row.netBuyWan))}>{formatYi(row.netBuyWan / 10000)}</span>
            <span>{formatYi(row.buyWan / 10000)}</span>
            <span>{formatYi(row.sellWan / 10000)}</span>
            <span>{row.reason || "盘后更新"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function InterfacePanel({ dashboard }: { dashboard: AshareDashboard }) {
  return (
    <section className="panel interface-panel">
      <PanelTitle eyebrow="a-stock-data 接口映射" title="接口需求梳理" />
      <div className="interface-table">
        {dashboard.interfaceSummary.map((item) => (
          <article key={item.name}>
            <strong>{item.category}</strong>
            <span>
              {item.name} / {item.source}
            </span>
            <p>{item.capability}</p>
            <b>{item.frontendStatus}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function AgentPanel({ market }: { market: MarketProfile }) {
  return (
    <section className="panel ai-panel">
      <PanelTitle eyebrow="多智能体投研" title="AI 投研小组">
        <button className="icon-button" aria-label="刷新 AI 投研">
          <RefreshCw size={17} />
        </button>
      </PanelTitle>
      <div className="agents">
        {market.agents.map((agent) => (
          <article className="agent" key={agent.role}>
            <div className={`agent-mark ${toneClass(agent.tone)}`} />
            <div>
              <strong>{agent.role}</strong>
              <span>{agent.stance}</span>
              <p>{agent.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StrategyTable({ market }: { market: MarketProfile }) {
  return (
    <section className="panel strategy-panel">
      <PanelTitle eyebrow="策略研究" title="策略库与回测排行">
        <button className="ghost-button">
          <Filter size={16} />
          筛选
        </button>
      </PanelTitle>
      <div className="strategy-table" role="table" aria-label="策略表现">
        <div className="strategy-row header" role="row">
          <span>策略</span>
          <span>市场</span>
          <span>状态</span>
          <span>收益</span>
          <span>回撤</span>
          <span>胜率</span>
        </div>
        {market.strategies.map((strategy) => (
          <div className="strategy-row" role="row" key={strategy.name}>
            <strong>{strategy.name}</strong>
            <span>{strategy.market}</span>
            <span>{strategy.status}</span>
            <span className="tone-green">{strategy.returnValue}</span>
            <span className="tone-red">{strategy.drawdown}</span>
            <span>{strategy.winRate}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommandPanel({ market }: { market: MarketProfile }) {
  return (
    <section className="panel command-panel">
      <PanelTitle eyebrow="自然语言流程" title="自然语言策略入口">
        <button className="primary-button">
          <CirclePlay size={16} />
          生成回测
        </button>
      </PanelTitle>
      <div className="prompt-box">
        <Command size={18} />
        <span>{market.commandExamples[0]}</span>
      </div>
      <div className="prompt-suggestions">
        {market.commandExamples.slice(1).map((prompt) => (
          <button key={prompt}>{prompt}</button>
        ))}
      </div>
    </section>
  );
}

function BacktestSummary({ market }: { market: MarketProfile }) {
  return (
    <section className="panel backtest-panel">
      <PanelTitle eyebrow="回测结果" title="回测实验室">
        <button className="icon-button" aria-label="导出回测数据">
          <Download size={17} />
        </button>
      </PanelTitle>
      <div className="backtest-grid">
        {market.backtest.map((metric) => (
          <div className="backtest-stat" key={metric.label}>
            <span>{metric.label}</span>
            <strong className={toneClass(metric.tone)}>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="drawdown-bar">
        <span style={{ width: market.key === "ashare" ? "72%" : "54%" }} />
      </div>
      <p className="panel-note">当前只展示研究和回测结果，不接入实盘委托。</p>
    </section>
  );
}

function RepositoryFindingPanel() {
  return (
    <section className="panel interface-panel">
      <PanelTitle eyebrow="已拉取 GitHub 仓库" title="开源能力梳理" />
      <div className="integration-grid">
        {repositoryFindings.map((item) => (
          <article className="integration-card" key={item.repo}>
            <strong>{item.repo}</strong>
            <span>{item.role}</span>
            <p>{item.frontendUse}</p>
            <div className="tag-row">
              {item.capabilities.slice(0, 4).map((capability) => (
                <span key={capability}>{capability}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DataImportPanel() {
  return (
    <section className="panel interface-panel">
      <PanelTitle eyebrow="tdx2db / Ashare" title="本地数据导入" />
      <div className="import-summary">
        <span>DuckDB</span>
        <span>通达信日线</span>
        <span>分钟线补充</span>
        <span>前复权视图</span>
      </div>
      <div className="integration-grid">
        {dataImportSources.map((source) => (
          <article className="integration-card" key={source.name}>
            <div className="card-title-row">
              <strong>{source.name}</strong>
              <b className={toneClass(source.tone)}>
                {source.status === "ready" ? "可接入" : source.status === "planned" ? "待后端" : "手动"}
              </b>
            </div>
            <span>{source.input}</span>
            <p>{source.note}</p>
            <code>{source.command}</code>
            <div className="tag-row">
              {source.outputs.map((output) => (
                <span key={output}>{output}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BacktestWorkflowPanel() {
  return (
    <section className="panel">
      <PanelTitle eyebrow="导入到回测" title="回测测试流程" />
      <div className="workflow-list">
        {backtestWorkflow.map((step, index) => (
          <article className="workflow-step" key={step.title}>
            <span className={toneClass(step.tone)}>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
            <b className={toneClass(step.tone)}>{step.status}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function BacktestCasePanel() {
  const readiness = getBacktestReadiness();

  return (
    <section className="panel interface-panel">
      <PanelTitle eyebrow="stock-quant" title="回测测试中心">
        <span className="table-count">{readiness.executionMode}</span>
      </PanelTitle>
      <div className="import-summary">
        <span>stock-quant</span>
        <span>EnhancedVolumeStrategy</span>
        <span>{readiness.readyImports} 个导入源可接入</span>
        <span>{readiness.backtestCases} 套测试</span>
      </div>
      <div className="integration-grid">
        {backtestCases.map((testCase) => (
          <article className="integration-card" key={testCase.name}>
            <div className="card-title-row">
              <strong>{testCase.name}</strong>
              <b className={toneClass(testCase.tone)}>{testCase.tradingEnabled ? "可交易" : "只回测"}</b>
            </div>
            <span>引擎：{testCase.engine}</span>
            <p>策略：{testCase.strategy}</p>
            <div className="detail-grid compact">
              <span>
                数据 <b>{testCase.dataSource}</b>
              </span>
              <span>
                股票池 <b>{testCase.universe}</b>
              </span>
              <span>
                区间 <b>{testCase.period}</b>
              </span>
              <span>
                输出 <b>{testCase.expectedOutput}</b>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CryptoPanel({ market }: { market: MarketProfile }) {
  return (
    <section className="panel market-panel">
      <PanelTitle eyebrow="行情与信号" title={`${market.label} 行情总览`}>
        <button className="ghost-button" aria-label="切换加密资产范围">
          现货与合约
          <ChevronDown size={15} />
        </button>
      </PanelTitle>
      <MiniChart market={market} />
    </section>
  );
}

function AsharePage({
  activePage,
  dashboard,
  loading,
  market,
  onRefresh,
  selectedCode,
  onSelectStock
}: {
  activePage: string;
  dashboard: AshareDashboard;
  loading: boolean;
  market: MarketProfile;
  onRefresh: () => void;
  selectedCode: string;
  onSelectStock: (code: string) => void;
}) {
  if (activePage === "行情雷达") {
    return (
      <div className="page-stack">
        <PageHeader title="行情雷达" description="集中观察指数、题材热度、强势股和多只股票的实时行情。">
          <StatusPill dashboard={dashboard} loading={loading} />
        </PageHeader>
        <div className="clean-grid">
          <section className="panel">
            <PanelTitle eyebrow="盘中扫描" title="实时雷达" />
            <RowList rows={dashboard.radar} compact />
          </section>
          <HotStocksPanel dashboard={dashboard} />
          <QuoteTable quotes={dashboard.quotes} selectedCode={selectedCode} onSelectStock={onSelectStock} />
        </div>
      </div>
    );
  }

  if (activePage === "策略库") {
    return (
      <div className="page-stack">
        <PageHeader title="策略库" description="先沉淀策略假设、样本筛选和回测入口，暂不做下单能力。" />
        <div className="clean-grid two">
          <StrategyTable market={market} />
          <CommandPanel market={market} />
        </div>
      </div>
    );
  }

  if (activePage === "回测实验室") {
    return (
      <div className="page-stack">
        <PageHeader title="回测实验室" description="接入 stock-quant 的回测测试思路，先做研究回测、数据质量和结果展示，不接入下单。" />
        <MetricStrip rows={backtestMetrics} />
        <div className="clean-grid two">
          <BacktestSummary market={market} />
          <BacktestWorkflowPanel />
        </div>
        <div className="clean-grid">
          <BacktestCasePanel />
          <section className="panel">
            <PanelTitle eyebrow="样本说明" title="回测边界" />
            <RowList rows={market.risk.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
          </section>
        </div>
      </div>
    );
  }

  if (activePage === "AI 投研") {
    return (
      <div className="page-stack">
        <PageHeader title="AI 投研" description="按技术面、情绪、风控和回测角色组织研究结论。" />
        <div className="clean-grid two">
          <AgentPanel market={market} />
          <CommandPanel market={market} />
        </div>
      </div>
    );
  }

  if (activePage === "组合风控") {
    return (
      <div className="page-stack">
        <PageHeader title="组合风控" description="把仓位、集中度、跳空风险等约束放到单独页面，避免总览拥挤。" />
        <div className="clean-grid two">
          <section className="panel risk-panel">
            <PanelTitle eyebrow="组合约束" title="风控规则" />
            <RowList rows={market.risk.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
          </section>
          <StockDetailPanel dashboard={dashboard} />
        </div>
      </div>
    );
  }

  if (activePage === "数据中心") {
    return (
      <div className="page-stack">
        <PageHeader title="数据中心" description="梳理公开实时行情、本地历史数据导入和后续回测数据流。">
          <button className="primary-button" onClick={onRefresh}>
            <RefreshCw size={17} />
            刷新公开行情
          </button>
        </PageHeader>
        <div className="clean-grid">
          <section className="panel data-panel">
            <PanelTitle eyebrow="数据适配层" title="数据源状态" />
            <RowList rows={dashboard.dataSources} compact />
          </section>
          <InterfacePanel dashboard={dashboard} />
          <DataImportPanel />
          <RepositoryFindingPanel />
        </div>
      </div>
    );
  }

  if (activePage === "复盘报告") {
    return (
      <div className="page-stack">
        <PageHeader title="复盘报告" description="把龙虎榜、强势股原因和资金线索集中到盘后复盘页面。" />
        <div className="clean-grid">
          <DragonTigerPanel dashboard={dashboard} />
          <HotStocksPanel dashboard={dashboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="A 股数据总览"
        description="按 a-stock-data 的接口分层接入公开行情，展示指数、股票列表、个股详情和关键概览。"
      >
        <StatusPill dashboard={dashboard} loading={loading} />
        <button className="primary-button" onClick={onRefresh}>
          <RefreshCw size={17} />
          刷新公开行情
        </button>
      </PageHeader>

      <MetricStrip rows={dashboard.metrics} />

      <div className="clean-grid overview-grid">
        <IndexPanel dashboard={dashboard} market={market} />
        <StockDetailPanel dashboard={dashboard} />
        <QuoteTable quotes={dashboard.quotes} selectedCode={selectedCode} onSelectStock={onSelectStock} />
      </div>
    </div>
  );
}

function CryptoPage({ activePage, market }: { activePage: string; market: MarketProfile }) {
  if (activePage === "策略库") {
    return (
      <div className="page-stack">
        <PageHeader title="加密货币策略库" description="展示突破、资金费率和预测市场分歧策略，当前仅用于研究。" />
        <div className="clean-grid two">
          <StrategyTable market={market} />
          <CommandPanel market={market} />
        </div>
      </div>
    );
  }

  if (activePage === "回测实验室") {
    return (
      <div className="page-stack">
        <PageHeader title="加密货币回测实验室" description="保留回测结果和风险边界，不接交易所账户。" />
        <div className="clean-grid two">
          <BacktestSummary market={market} />
          <section className="panel">
            <PanelTitle eyebrow="组合约束" title="风险提示" />
            <RowList rows={market.risk.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
          </section>
        </div>
      </div>
    );
  }

  if (activePage === "AI 投研") {
    return (
      <div className="page-stack">
        <PageHeader title="加密货币 AI 投研" description="按趋势、情绪、杠杆温度和预测市场分歧组织研究结论。" />
        <div className="clean-grid two">
          <AgentPanel market={market} />
          <CommandPanel market={market} />
        </div>
      </div>
    );
  }

  if (activePage === "组合风控") {
    return (
      <div className="page-stack">
        <PageHeader title="加密货币组合风控" description="关注杠杆、相关性和事件风险，避免把研究界面做成交易终端。" />
        <section className="panel risk-panel">
          <PanelTitle eyebrow="组合约束" title="风控规则" />
          <RowList rows={market.risk.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
        </section>
      </div>
    );
  }

  if (activePage === "数据中心") {
    return (
      <div className="page-stack">
        <PageHeader title="加密货币数据中心" description="后续可接交易所行情、图表指标和预测市场数据。" />
        <section className="panel data-panel">
          <PanelTitle eyebrow="数据源" title="数据源状态" />
          <RowList rows={market.dataSources.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
        </section>
      </div>
    );
  }

  if (activePage === "复盘报告") {
    return (
      <div className="page-stack">
        <PageHeader title="加密货币复盘报告" description="聚合行情截面、资金费率和策略观察，后续可加入链上数据。" />
        <div className="clean-grid two">
          <section className="panel heat-panel">
            <PanelTitle eyebrow="资产截面" title="加密货币截面热力" />
            <MarketHeatmap rows={market.heatmap.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
          </section>
          <section className="panel">
            <PanelTitle eyebrow="盘后线索" title="信号观察" />
            <RowList rows={market.ticker.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader title="加密货币数据总览" description={market.description}>
        <button className="ghost-button">
          <SlidersHorizontal size={17} />
          自定义模块
        </button>
        <button className="primary-button">
          <Eye size={17} />
          打开今日仪表盘
        </button>
      </PageHeader>
      <MetricStrip rows={market.metrics} />
      <div className="clean-grid overview-grid">
        <CryptoPanel market={market} />
        <section className="panel watch-panel">
          <PanelTitle eyebrow="观察池" title="信号观察" />
          <RowList rows={market.ticker.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
        </section>
        <section className="panel heat-panel">
          <PanelTitle eyebrow="资产截面" title="加密货币截面热力" />
          <MarketHeatmap rows={market.heatmap.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
        </section>
      </div>
    </div>
  );
}

function App() {
  const [selectedMarket, setSelectedMarket] = useState<MarketKey>("ashare");
  const [activePage, setActivePage] = useState(navItems[0]?.label ?? "总览");
  const [selectedAshareCode, setSelectedAshareCode] = useState("300750");
  const market = markets[selectedMarket];
  const ashare = useAshareDashboard(selectedAshareCode);

  function selectMarket(nextMarket: MarketKey) {
    setSelectedMarket(nextMarket);
    setActivePage("总览");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand-block">
          <div className="brand-mark">量</div>
          <div>
            <h1>量化工坊</h1>
            <span>双市场量化研究终端</span>
          </div>
        </div>

        <div className="market-toggle" aria-label="市场切换">
          <button className={selectedMarket === "ashare" ? "active ashare" : ""} onClick={() => selectMarket("ashare")}>
            A 股
          </button>
          <button className={selectedMarket === "crypto" ? "active crypto" : ""} onClick={() => selectMarket("crypto")}>
            加密货币
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map(({ label, Icon }) => (
            <button className={activePage === label ? "active" : ""} key={label} onClick={() => setActivePage(label)}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="quick-panel">
          <span className="eyebrow">快捷工具</span>
          {quickActions.map(({ label, Icon }) => (
            <button key={label}>
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search size={17} />
            <span>搜索股票、币种、策略、回测或报告</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="视图布局">
              <LayoutGrid size={18} />
            </button>
            <button className="icon-button" aria-label="参数设置">
              <Settings2 size={18} />
            </button>
            <button className="icon-button alert" aria-label="通知">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {selectedMarket === "ashare" ? (
          <AsharePage
            activePage={activePage}
            dashboard={ashare.data}
            loading={ashare.loading}
            market={market}
            onRefresh={ashare.refresh}
            selectedCode={selectedAshareCode}
            onSelectStock={setSelectedAshareCode}
          />
        ) : (
          <CryptoPage activePage={activePage} market={market} />
        )}
      </section>
    </main>
  );
}

export default App;
