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
import {
  markets,
  navItems,
  quickActions,
  type AssetRow,
  type MarketKey,
  type MarketProfile,
  type PaperOrder,
  type PaperPosition
} from "./data";
import { useRealtimeKline, type RealtimeKlineState } from "./hooks/useRealtimeKline";
import {
  backtestCases,
  backtestMetrics,
  backtestWorkflow,
  dataImportSources,
  getBacktestReadiness,
  repositoryFindings
} from "./researchIntegrations";
import type { AshareDashboard, AshareQuote, DashboardRow, Tone } from "./services/ashareData";
import { runAshareBacktest, type BacktestResult } from "./services/backtest";
import { klineIntervals, type KlineInterval, type RealtimeKline } from "./services/marketKline";

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

function formatVolume(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)} 亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`;
  return Math.round(value).toLocaleString("zh-CN");
}

function formatKlinePrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value >= 1000) return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(6);
}

function compactToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function sourceName(source: AshareQuote["source"]) {
  const names: Record<AshareQuote["source"], string> = {
    AkShare: "AkShare 本地行情",
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

function assetTypeLabel(asset: AssetRow) {
  const labels: Record<AssetRow["assetType"], string> = {
    ashare: "A 股",
    us: "美股",
    crypto: "加密",
    index: "指数"
  };
  return labels[asset.assetType];
}

function AssetCardContent({ asset }: { asset: AssetRow }) {
  return (
    <>
      <div className="card-title-row">
        <div>
          <strong>{asset.symbol}</strong>
          <span>{asset.name}</span>
        </div>
        <b className={toneClass(asset.tone)}>{asset.change}</b>
      </div>
      <div className="asset-price">{asset.price}</div>
      <div className="asset-meta">
        <span>{assetTypeLabel(asset)}</span>
        <span>{asset.volume}</span>
        <span>{asset.signal}</span>
      </div>
    </>
  );
}

function AssetTape({
  market,
  selectedSymbol,
  onSelectAsset,
  selectableAssetTypes
}: {
  market: MarketProfile;
  selectedSymbol?: string;
  onSelectAsset?: (asset: AssetRow) => void;
  selectableAssetTypes?: AssetRow["assetType"][];
}) {
  return (
    <section className="panel asset-panel">
      <PanelTitle eyebrow="资产截面" title={market.key === "ashare" ? "A 股观察池" : "美股 / 加密观察池"}>
        <span className="table-count">{market.assets.length} 个标的</span>
      </PanelTitle>
      <div className="asset-grid">
        {market.assets.map((asset) => {
          const selectable =
            Boolean(onSelectAsset) && (!selectableAssetTypes || selectableAssetTypes.includes(asset.assetType));
          const active = selectedSymbol === asset.symbol;
          if (selectable) {
            return (
              <button
                className={active ? "asset-card asset-card-button selected" : "asset-card asset-card-button"}
                key={asset.symbol}
                onClick={() => onSelectAsset?.(asset)}
                type="button"
                aria-pressed={active}
              >
                <AssetCardContent asset={asset} />
              </button>
            );
          }
          return (
            <article className="asset-card" key={asset.symbol}>
              <AssetCardContent asset={asset} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TradingViewChart({ market }: { market: MarketProfile }) {
  const isGlobal = market.key === "global";
  const candles = [
    { x: 44, high: 72, low: 190, open: 150, close: 112 },
    { x: 92, high: 88, low: 210, open: 118, close: 178 },
    { x: 140, high: 64, low: 176, open: 164, close: 92 },
    { x: 188, high: 104, low: 224, open: 116, close: 198 },
    { x: 236, high: 84, low: 180, open: 152, close: 104 },
    { x: 284, high: 70, low: 164, open: 130, close: 88 },
    { x: 332, high: 108, low: 212, open: 96, close: 184 },
    { x: 380, high: 76, low: 172, open: 150, close: 96 },
    { x: 428, high: 54, low: 150, open: 112, close: 72 },
    { x: 476, high: 68, low: 188, open: 80, close: 156 },
    { x: 524, high: 52, low: 146, open: 138, close: 82 },
    { x: 572, high: 44, low: 132, open: 92, close: 64 }
  ];

  return (
    <section className={isGlobal ? "panel market-panel terminal-chart global-chart" : "panel market-panel terminal-chart ashare-chart"}>
      <PanelTitle eyebrow={market.eyebrow} title={market.title}>
        <div className="chart-controls">
          <button>1H</button>
          <button>4H</button>
          <button className="active">1D</button>
          <button>1W</button>
        </div>
      </PanelTitle>
      <div className="chart-shell tv-shell" aria-label={`${market.label} 静态策略图表`}>
        <svg viewBox="0 0 640 260" role="img" aria-label="静态 K 线与策略信号">
          <defs>
            <linearGradient id={`tv-area-${market.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={market.chartColor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={market.chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 28 198 L 92 178 L 140 92 L 188 198 L 236 104 L 284 88 L 332 184 L 380 96 L 428 72 L 476 156 L 524 82 L 596 60 L 596 238 L 28 238 Z" fill={`url(#tv-area-${market.key})`} />
          <path d="M 28 198 L 92 178 L 140 92 L 188 198 L 236 104 L 284 88 L 332 184 L 380 96 L 428 72 L 476 156 L 524 82 L 596 60" fill="none" stroke={market.chartColor} strokeWidth="3" strokeLinecap="round" />
          {candles.map((candle, index) => {
            const up = candle.close < candle.open;
            const y = Math.min(candle.open, candle.close);
            const height = Math.max(8, Math.abs(candle.close - candle.open));
            return (
              <g key={`${candle.x}-${index}`} className={up ? "candle up" : "candle down"}>
                <line x1={candle.x} x2={candle.x} y1={candle.high} y2={candle.low} />
                <rect x={candle.x - 8} y={y} width="16" height={height} rx="2" />
              </g>
            );
          })}
          <g className="signal-layer">
            <circle cx="284" cy="88" r="7" />
            <text x="298" y="92">模拟买点</text>
            <circle cx="476" cy="156" r="7" />
            <text x="490" y="160">风控观察</text>
          </g>
        </svg>
        <div className="indicator-strip">
          <span>EMA 8/20</span>
          <span>RSI 62</span>
          <span>成交量放大</span>
          <span>{market.key === "global" ? "资金费率温和" : "板块共振"}</span>
        </div>
      </div>
    </section>
  );
}

type RealtimeKlineView = RealtimeKlineState & {
  interval: KlineInterval;
  onIntervalChange: (interval: KlineInterval) => void;
  onRefresh: () => void;
};

function RealtimeKlinePanel({ view }: { view: RealtimeKlineView }) {
  const data: RealtimeKline | undefined = view.data;
  const points = data?.points ?? [];
  const visiblePoints = points.slice(-90);
  const width = 720;
  const priceHeight = 230;
  const volumeTop = 252;
  const volumeHeight = 50;
  const svgHeight = 320;
  const minPrice = Math.min(...visiblePoints.map((point) => point.low));
  const maxPrice = Math.max(...visiblePoints.map((point) => point.high));
  const priceRange = Number.isFinite(maxPrice - minPrice) && maxPrice !== minPrice ? maxPrice - minPrice : 1;
  const maxVolume = Math.max(...visiblePoints.map((point) => point.volume), 1);
  const candleSlot = visiblePoints.length ? width / visiblePoints.length : width;
  const bodyWidth = Math.max(3, Math.min(10, candleSlot * 0.58));
  const latest = visiblePoints.at(-1);
  const first = visiblePoints.at(0);
  const change = latest && first ? ((latest.close - first.open) / first.open) * 100 : 0;
  const marketLabel = data?.market === "binance" ? "币安公开 API" : "A 股公开接口";
  const title = data ? `${data.name} 实时 K 线` : "实时 K 线";

  function y(price: number) {
    return 16 + ((maxPrice - price) / priceRange) * (priceHeight - 20);
  }

  return (
    <section className={data?.market === "binance" ? "panel realtime-kline-panel binance-kline" : "panel realtime-kline-panel ashare-realtime"}>
      <PanelTitle eyebrow={marketLabel} title={title}>
        <button className="ghost-button" onClick={view.onRefresh} type="button">
          <RefreshCw size={16} />
          刷新 K 线
        </button>
      </PanelTitle>
      <div className="kline-toolbar" aria-label="K 线周期切换">
        <div className="chart-controls">
          {klineIntervals.map((interval) => (
            <button
              className={view.interval === interval ? "active" : ""}
              key={interval}
              onClick={() => view.onIntervalChange(interval)}
              type="button"
            >
              {interval}
            </button>
          ))}
        </div>
        <div className="kline-status">
          <span className={data?.status === "live" ? "live-dot" : "fallback-dot"} />
          <b>{data?.status === "live" ? "实时刷新" : "示例回退"}</b>
          <span>{view.loading ? "请求中" : data?.updatedAt ?? "--"}</span>
        </div>
      </div>
      <div className="kline-summary">
        <span>
          标的 <b>{data?.symbol ?? "--"}</b>
        </span>
        <span>
          最新 <b>{latest ? formatKlinePrice(latest.close) : "--"}</b>
        </span>
        <span>
          区间涨跌 <b className={toneClass(data?.market === "binance" ? (change >= 0 ? "green" : "red") : toneForNumber(change))}>{formatPercent(change)}</b>
        </span>
        <span>
          成交量 <b>{latest ? formatVolume(latest.volume) : "--"}</b>
        </span>
      </div>
      <div className="chart-shell kline-shell" aria-label={`${title} 图表`}>
        <svg viewBox={`0 0 ${width} ${svgHeight}`} role="img" aria-label={`${title}，${view.interval} 周期`}>
          <defs>
            <linearGradient id={`kline-fill-${data?.market ?? "empty"}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => (
            <line className="grid-line" key={line} x1="0" x2={width} y1={24 + line * 58} y2={24 + line * 58} />
          ))}
          {visiblePoints.map((point, index) => {
            const x = candleSlot * index + candleSlot / 2;
            const openY = y(point.open);
            const closeY = y(point.close);
            const highY = y(point.high);
            const lowY = y(point.low);
            const up = point.close >= point.open;
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));
            const volumeBarHeight = Math.max(2, (point.volume / maxVolume) * volumeHeight);
            return (
              <g className={up ? "candle up" : "candle down"} key={`${point.timestamp}-${index}`}>
                <line x1={x} x2={x} y1={highY} y2={lowY} />
                <rect x={x - bodyWidth / 2} y={bodyY} width={bodyWidth} height={bodyHeight} rx="1.5" />
                <rect className="volume-bar" x={x - bodyWidth / 2} y={volumeTop + volumeHeight - volumeBarHeight} width={bodyWidth} height={volumeBarHeight} rx="1.5" />
              </g>
            );
          })}
          {latest ? (
            <g className="last-price-line">
              <line x1="0" x2={width} y1={y(latest.close)} y2={y(latest.close)} />
              <text x={width - 86} y={Math.max(18, y(latest.close) - 6)}>
                {formatKlinePrice(latest.close)}
              </text>
            </g>
          ) : null}
          <g className="axis-labels">
            <text x="8" y="18">{formatKlinePrice(maxPrice)}</text>
            <text x="8" y={priceHeight + 4}>{formatKlinePrice(minPrice)}</text>
            {visiblePoints.length ? <text x="8" y="316">{visiblePoints[0].time}</text> : null}
            {latest ? <text x={width - 82} y="316">{latest.time}</text> : null}
          </g>
        </svg>
        <div className="indicator-strip kline-source-strip">
          <span>{data?.source ?? "等待行情数据"}</span>
          <span>周期 {view.interval}</span>
          <span>仅行情展示</span>
          <span>不含真实下单</span>
        </div>
      </div>
      {view.error ? <p className="kline-error">接口异常：{view.error}</p> : null}
    </section>
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
      <PanelTitle eyebrow="策略研究" title="策略模拟队列">
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
          <span>虚拟收益</span>
          <span>回撤</span>
          <span>胜率</span>
        </div>
        {market.strategies.map((strategy) => (
          <div className="strategy-row" role="row" key={strategy.name}>
            <strong>{strategy.name}</strong>
            <span>{strategy.market}</span>
            <span>{strategy.status}</span>
            <span className="tone-green">{strategy.virtualReturn}</span>
            <span className="tone-red">{strategy.drawdown}</span>
            <span>{strategy.winRate}</span>
          </div>
        ))}
      </div>
      <div className="simulation-cards">
        {market.strategies.map((strategy) => (
          <article key={`${strategy.name}-trigger`}>
            <div className="card-title-row">
              <strong>{strategy.name}</strong>
              <b className={toneClass(strategy.tone)}>{strategy.mode}</b>
            </div>
            <p>{strategy.trigger}</p>
            <span>{strategy.tradingEnabled ? "可真实下单" : "只做静态模拟，不接真实交易"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function PaperOrderPanel({ orders }: { orders: PaperOrder[] }) {
  return (
    <section className="panel order-panel">
      <PanelTitle eyebrow="Paper-only" title="模拟策略交易">
        <span className="table-count">不接真实下单</span>
      </PanelTitle>
      <div className="order-list">
        {orders.map((order) => (
          <article className="order-item" key={`${order.symbol}-${order.side}`}>
            <div>
              <strong>{order.symbol}</strong>
              <span>{order.name}</span>
            </div>
            <b className={toneClass(order.tone)}>{order.side}</b>
            <span>{order.triggerPrice}</span>
            <span>{order.simulatedPrice}</span>
            <em>{order.status}</em>
            <p>{order.riskReason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PositionPanel({ positions }: { positions: PaperPosition[] }) {
  return (
    <section className="panel position-panel">
      <PanelTitle eyebrow="虚拟持仓" title="纸面账户 PnL" />
      <div className="position-grid">
        {positions.map((position) => (
          <article className="position-card" key={position.symbol}>
            <div className="card-title-row">
              <strong>{position.symbol}</strong>
              <b className={toneClass(position.tone)}>{position.pnl}</b>
            </div>
            <span>{position.name} / {position.market}</span>
            <div className="position-meta">
              <small>仓位 {position.weight}</small>
              <small>成本 {position.cost}</small>
              <small>{position.riskTag}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResearchReferencePanel({ market }: { market: MarketProfile }) {
  return (
    <section className="panel interface-panel">
      <PanelTitle eyebrow="GitHub Research" title="开源参考矩阵" />
      <div className="integration-grid reference-grid">
        {market.researchReferences.map((item) => (
          <article className="integration-card reference-card" key={item.name}>
            <div className="card-title-row">
              <strong>{item.name}</strong>
              <b className={toneClass(item.tone)}>参考</b>
            </div>
            <span>{item.capability}</span>
            <p>{item.frontendUse}</p>
            <a href={item.url} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function CommandPanel({
  market,
  strategyText,
  onStrategyTextChange,
  onRunBacktest,
  running,
  selectedName
}: {
  market: MarketProfile;
  strategyText?: string;
  onStrategyTextChange?: (value: string) => void;
  onRunBacktest?: () => void;
  running?: boolean;
  selectedName?: string;
}) {
  const interactive = Boolean(onStrategyTextChange && onRunBacktest);
  return (
    <section className="panel command-panel">
      <PanelTitle eyebrow="自然语言流程" title={interactive ? "策略代码生成器" : "自然语言策略入口"}>
        <button className="primary-button" disabled={running || !interactive} onClick={onRunBacktest} type="button">
          <CirclePlay size={16} />
          {running ? "回测中" : "生成回测"}
        </button>
      </PanelTitle>
      {interactive ? (
        <label className="strategy-editor">
          <span>{selectedName ? `当前标的：${selectedName}` : "策略描述"}</span>
          <textarea
            value={strategyText}
            onChange={(event) => onStrategyTextChange?.(event.target.value)}
            rows={5}
            aria-label="自然语言策略描述"
          />
        </label>
      ) : (
        <div className="prompt-box">
          <Command size={18} />
          <span>{market.commandExamples[0]}</span>
        </div>
      )}
      <div className="prompt-suggestions">
        {market.commandExamples.slice(1).map((prompt) => (
          <button key={prompt} onClick={() => onStrategyTextChange?.(prompt)} type="button">
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}

function BacktestSummary({ market, result }: { market: MarketProfile; result?: BacktestResult }) {
  const metrics = result?.metrics ?? market.backtest;
  return (
    <section className="panel backtest-panel">
      <PanelTitle eyebrow="回测结果" title="回测实验室">
        <button className="icon-button" aria-label="导出回测数据">
          <Download size={17} />
        </button>
      </PanelTitle>
      <div className="backtest-grid">
        {metrics.map((metric) => (
          <div className="backtest-stat" key={metric.label}>
            <span>{metric.label}</span>
            <strong className={toneClass(metric.tone)}>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="drawdown-bar">
        <span style={{ width: market.key === "ashare" ? "72%" : "54%" }} />
      </div>
      <p className="panel-note">
        {result
          ? `${result.source} / ${result.dataRows} 条历史数据 / ${result.updatedAt}`
          : "当前只展示研究和回测结果，不接入实盘委托。"}
      </p>
    </section>
  );
}

function GeneratedBacktestPanel({ result }: { result?: BacktestResult }) {
  return (
    <section className="panel generated-backtest-panel">
      <PanelTitle eyebrow="自然语言 -> 代码 -> 回测" title="生成的回测代码与结果">
        <span className="table-count">{result ? result.strategyName : "等待生成"}</span>
      </PanelTitle>
      {result ? (
        <>
          <div className="import-summary">
            <span>{result.name}</span>
            <span>{result.source}</span>
            <span>{result.summary.tradeCount} 笔交易</span>
            <span>基准 {result.summary.benchmarkReturn}</span>
          </div>
          <div className="backtest-result-grid">
            <div className="code-block">
              <strong>回测代码</strong>
              <pre><code>{result.code}</code></pre>
            </div>
            <div className="trade-list">
              <strong>最近交易</strong>
              {result.trades.length ? (
                result.trades.slice(-8).map((trade) => (
                  <div className="trade-row" key={`${trade.date}-${trade.side}-${trade.price}`}>
                    <span>{trade.date}</span>
                    <b className={trade.side === "BUY" ? "tone-red" : "tone-green"}>{trade.side}</b>
                    <span>{formatKlinePrice(trade.price)}</span>
                    <span>{trade.shares} 股</span>
                  </div>
                ))
              ) : (
                <p className="panel-note">还没有产生交易，或 AkShare API 暂不可用。</p>
              )}
              {result.error ? <p className="kline-error">回测 API 异常：{result.error}</p> : null}
            </div>
          </div>
        </>
      ) : (
        <p className="panel-note">在策略库或回测实验室输入自然语言策略，点击“生成回测”后会显示可执行 AkShare Python 代码和历史回测结果。</p>
      )}
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

function AsharePage({
  activePage,
  dashboard,
  loading,
  market,
  onRefresh,
  selectedCode,
  onSelectStock,
  klineView,
  strategyText,
  onStrategyTextChange,
  onRunBacktest,
  backtestRunning,
  backtestResult
}: {
  activePage: string;
  dashboard: AshareDashboard;
  loading: boolean;
  market: MarketProfile;
  onRefresh: () => void;
  selectedCode: string;
  onSelectStock: (code: string) => void;
  klineView: RealtimeKlineView;
  strategyText: string;
  onStrategyTextChange: (value: string) => void;
  onRunBacktest: () => void;
  backtestRunning: boolean;
  backtestResult?: BacktestResult;
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
          <RealtimeKlinePanel view={klineView} />
          <AssetTape
            market={market}
            selectedSymbol={selectedCode}
            onSelectAsset={(asset) => onSelectStock(asset.symbol)}
            selectableAssetTypes={["ashare"]}
          />
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
          <CommandPanel
            market={market}
            strategyText={strategyText}
            onStrategyTextChange={onStrategyTextChange}
            onRunBacktest={onRunBacktest}
            running={backtestRunning}
            selectedName={`${dashboard.selectedStock.name} ${selectedCode}`}
          />
          <GeneratedBacktestPanel result={backtestResult} />
          <PaperOrderPanel orders={market.paperOrders} />
          <PositionPanel positions={market.paperPositions} />
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
          <BacktestSummary market={market} result={backtestResult} />
          <CommandPanel
            market={market}
            strategyText={strategyText}
            onStrategyTextChange={onStrategyTextChange}
            onRunBacktest={onRunBacktest}
            running={backtestRunning}
            selectedName={`${dashboard.selectedStock.name} ${selectedCode}`}
          />
          <BacktestWorkflowPanel />
          <GeneratedBacktestPanel result={backtestResult} />
        </div>
        <div className="clean-grid">
          <BacktestCasePanel />
          <PaperOrderPanel orders={market.paperOrders} />
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
          <CommandPanel
            market={market}
            strategyText={strategyText}
            onStrategyTextChange={onStrategyTextChange}
            onRunBacktest={onRunBacktest}
            running={backtestRunning}
            selectedName={`${dashboard.selectedStock.name} ${selectedCode}`}
          />
          <StrategyTable market={market} />
          <PaperOrderPanel orders={market.paperOrders} />
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
          <PositionPanel positions={market.paperPositions} />
          <PaperOrderPanel orders={market.paperOrders} />
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
          <ResearchReferencePanel market={market} />
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
          <PaperOrderPanel orders={market.paperOrders} />
          <PositionPanel positions={market.paperPositions} />
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

      <MetricStrip rows={[...dashboard.metrics.slice(0, 2), ...market.metrics.slice(2)]} />

      <div className="clean-grid overview-grid">
        <IndexPanel dashboard={dashboard} market={market} />
        <StockDetailPanel dashboard={dashboard} />
        <RealtimeKlinePanel view={klineView} />
        <AssetTape
          market={market}
          selectedSymbol={selectedCode}
          onSelectAsset={(asset) => onSelectStock(asset.symbol)}
          selectableAssetTypes={["ashare"]}
        />
        <PaperOrderPanel orders={market.paperOrders} />
        <PositionPanel positions={market.paperPositions} />
        <QuoteTable quotes={dashboard.quotes} selectedCode={selectedCode} onSelectStock={onSelectStock} />
      </div>
    </div>
  );
}

function GlobalPage({
  activePage,
  market,
  selectedSymbol,
  onSelectAsset,
  klineView
}: {
  activePage: string;
  market: MarketProfile;
  selectedSymbol: string;
  onSelectAsset: (asset: AssetRow) => void;
  klineView: RealtimeKlineView;
}) {
  if (activePage === "行情雷达") {
    return (
      <div className="page-stack">
        <PageHeader title="美股 / 加密行情雷达" description="按美股指数、科技权重、BTC/ETH/SOL、资金费率和预测市场线索组织全球资产截面。" />
        <div className="clean-grid">
          <RealtimeKlinePanel view={klineView} />
          <section className="panel">
            <PanelTitle eyebrow="全球扫描" title="实时雷达" />
            <RowList rows={market.radar.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
          </section>
          <AssetTape
            market={market}
            selectedSymbol={selectedSymbol}
            onSelectAsset={onSelectAsset}
            selectableAssetTypes={["crypto"]}
          />
          <section className="panel heat-panel">
            <PanelTitle eyebrow="资产截面" title="美股 / 加密热力" />
            <MarketHeatmap rows={market.heatmap.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
          </section>
        </div>
      </div>
    );
  }

  if (activePage === "策略库") {
    return (
      <div className="page-stack">
        <PageHeader title="美股 / 加密策略库" description="展示科技股动量、BTC 突破、资金费率反转和预测市场分歧策略，当前仅用于静态模拟。" />
        <div className="clean-grid two">
          <StrategyTable market={market} />
          <CommandPanel market={market} />
          <PaperOrderPanel orders={market.paperOrders} />
          <PositionPanel positions={market.paperPositions} />
        </div>
      </div>
    );
  }

  if (activePage === "回测实验室") {
    return (
      <div className="page-stack">
        <PageHeader title="美股 / 加密回测实验室" description="保留跨市场回测结果、静态模拟订单和风险边界，不接券商或交易所账户。" />
        <MetricStrip rows={market.backtest} />
        <div className="clean-grid two">
          <BacktestSummary market={market} />
          <StrategyTable market={market} />
          <PaperOrderPanel orders={market.paperOrders} />
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
        <PageHeader title="美股 / 加密 AI 投研" description="按美股技术面、加密趋势、情绪、杠杆温度和预测市场分歧组织研究结论。" />
        <div className="clean-grid two">
          <AgentPanel market={market} />
          <CommandPanel market={market} />
          <StrategyTable market={market} />
          <PaperOrderPanel orders={market.paperOrders} />
        </div>
      </div>
    );
  }

  if (activePage === "组合风控") {
    return (
      <div className="page-stack">
        <PageHeader title="美股 / 加密组合风控" description="关注杠杆、相关性、宏观事件和跨市场同向暴露，避免把研究界面做成交易终端。" />
        <div className="clean-grid two">
          <section className="panel risk-panel">
            <PanelTitle eyebrow="组合约束" title="风控规则" />
            <RowList rows={market.risk.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
          </section>
          <PositionPanel positions={market.paperPositions} />
          <PaperOrderPanel orders={market.paperOrders} />
        </div>
      </div>
    );
  }

  if (activePage === "数据中心") {
    return (
      <div className="page-stack">
        <PageHeader title="美股 / 加密数据中心" description="预留美股延迟行情、交易所行情、图表指标、预测市场和模拟账本数据，不保存 API key。" />
        <div className="clean-grid">
          <section className="panel data-panel">
            <PanelTitle eyebrow="数据源" title="数据源状态" />
            <RowList rows={market.dataSources.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} compact />
          </section>
          <ResearchReferencePanel market={market} />
          <RepositoryFindingPanel />
        </div>
      </div>
    );
  }

  if (activePage === "复盘报告") {
    return (
      <div className="page-stack">
        <PageHeader title="美股 / 加密复盘报告" description="聚合美股科技权重、BTC/ETH/SOL 截面、资金费率和策略观察，后续可加入链上数据。" />
        <div className="clean-grid two">
          <section className="panel heat-panel">
            <PanelTitle eyebrow="资产截面" title="美股 / 加密截面热力" />
            <MarketHeatmap rows={market.heatmap.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
          </section>
          <section className="panel">
            <PanelTitle eyebrow="盘后线索" title="信号观察" />
            <RowList rows={market.ticker.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
          </section>
          <PaperOrderPanel orders={market.paperOrders} />
          <PositionPanel positions={market.paperPositions} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack global-workspace">
      <PageHeader title="美股 / 加密数据总览" description={market.description}>
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
        <RealtimeKlinePanel view={klineView} />
        <section className="panel watch-panel">
          <PanelTitle eyebrow="观察池" title="信号观察" />
          <RowList rows={market.ticker.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
        </section>
        <AssetTape
          market={market}
          selectedSymbol={selectedSymbol}
          onSelectAsset={onSelectAsset}
          selectableAssetTypes={["crypto"]}
        />
        <section className="panel heat-panel">
          <PanelTitle eyebrow="资产截面" title="美股 / 加密截面热力" />
          <MarketHeatmap rows={market.heatmap.map((row) => ({ ...row, tone: row.tone ?? "neutral" }))} />
        </section>
        <PaperOrderPanel orders={market.paperOrders} />
        <PositionPanel positions={market.paperPositions} />
      </div>
    </div>
  );
}

function App() {
  const [selectedMarket, setSelectedMarket] = useState<MarketKey>("ashare");
  const [activePage, setActivePage] = useState(navItems[0]?.label ?? "总览");
  const [selectedAshareCode, setSelectedAshareCode] = useState("300750");
  const [selectedGlobalSymbol, setSelectedGlobalSymbol] = useState("BTCUSDT");
  const [klineInterval, setKlineInterval] = useState<KlineInterval>("1m");
  const [strategyText, setStrategyText] = useState("5日均线上穿20日均线，成交量放大时买入，跌破5日均线或回撤7%卖出。");
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult>();
  const market = markets[selectedMarket];
  const ashare = useAshareDashboard(selectedAshareCode);
  const selectedGlobalAsset =
    markets.global.assets.find((asset) => asset.symbol === selectedGlobalSymbol) ??
    markets.global.assets.find((asset) => asset.assetType === "crypto") ??
    markets.global.assets[0];
  const ashareKline = useRealtimeKline(
    { market: "ashare", symbol: selectedAshareCode, name: ashare.data.selectedStock.name },
    klineInterval,
    { enabled: selectedMarket === "ashare", refreshMs: 8000 }
  );
  const globalKline = useRealtimeKline(
    { market: "binance", symbol: selectedGlobalAsset.symbol, name: selectedGlobalAsset.name },
    klineInterval,
    { enabled: selectedMarket === "global", refreshMs: 8000 }
  );

  function selectMarket(nextMarket: MarketKey) {
    setSelectedMarket(nextMarket);
    setActivePage("总览");
  }

  function selectGlobalAsset(asset: AssetRow) {
    if (asset.assetType === "crypto") {
      setSelectedGlobalSymbol(asset.symbol);
    }
  }

  async function runSelectedBacktest() {
    setBacktestRunning(true);
    try {
      const result = await runAshareBacktest(fetch, {
        symbol: selectedAshareCode,
        name: ashare.data.selectedStock.name,
        strategyText: strategyText.trim() || "5日均线上穿20日均线，成交量放大时买入，跌破5日均线或回撤7%卖出。",
        startDate: "20250101",
        endDate: compactToday(),
        initialCash: 100000
      });
      setBacktestResult(result);
    } finally {
      setBacktestRunning(false);
    }
  }

  return (
    <main className={selectedMarket === "global" ? "app-shell market-global" : "app-shell market-ashare"}>
      <aside className="sidebar" aria-label="主导航">
        <div className="brand-block">
          <div className="brand-mark">量</div>
          <div>
            <h1>量化工坊</h1>
            <span>研究 + 回测 + 静态模拟</span>
          </div>
        </div>

        <div className="market-toggle" aria-label="市场切换">
          <button className={selectedMarket === "ashare" ? "active ashare" : ""} onClick={() => selectMarket("ashare")}>
            A 股
          </button>
          <button className={selectedMarket === "global" ? "active global" : ""} onClick={() => selectMarket("global")}>
            美股 / 加密
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
            klineView={{
              ...ashareKline,
              interval: klineInterval,
              onIntervalChange: setKlineInterval,
              onRefresh: ashareKline.refresh
            }}
            strategyText={strategyText}
            onStrategyTextChange={setStrategyText}
            onRunBacktest={runSelectedBacktest}
            backtestRunning={backtestRunning}
            backtestResult={backtestResult}
          />
        ) : (
          <GlobalPage
            activePage={activePage}
            market={market}
            selectedSymbol={selectedGlobalAsset.symbol}
            onSelectAsset={selectGlobalAsset}
            klineView={{
              ...globalKline,
              interval: klineInterval,
              onIntervalChange: setKlineInterval,
              onRefresh: globalKline.refresh
            }}
          />
        )}
      </section>
    </main>
  );
}

export default App;
