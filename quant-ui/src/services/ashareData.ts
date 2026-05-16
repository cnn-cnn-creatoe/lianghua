export type Tone = "red" | "green" | "blue" | "amber" | "neutral";

export type AshareQuote = {
  symbol: string;
  code: string;
  name: string;
  price: number;
  previousClose: number;
  open: number;
  changeAmount: number;
  changePct: number;
  high: number;
  low: number;
  amountWan: number;
  turnoverPct: number;
  peTtm: number;
  amplitudePct: number;
  mcapYi: number;
  floatMcapYi: number;
  pb: number;
  limitUp: number;
  limitDown: number;
  volRatio: number;
  peStatic: number;
  source: "AkShare" | "Tencent" | "Eastmoney" | "Sina" | "Fallback";
};

export type HotStock = {
  code: string;
  name: string;
  reason: string;
  close: number;
  changePct: number;
  turnoverPct: number;
  amount: string;
};

export type ConceptBlock = {
  type: "industry" | "concept" | "region";
  name: string;
  changePct: string;
  desc: string;
};

export type FundFlowPoint = {
  date: string;
  close: string;
  changePct: string;
  mainIn: string;
  superNetIn: string;
  largeNetIn: string;
};

export type DragonTigerStock = {
  code: string;
  name: string;
  reason: string;
  close: number;
  changePct: number;
  netBuyWan: number;
  buyWan: number;
  sellWan: number;
  turnoverPct: number;
};

export type DashboardRow = {
  name: string;
  value: string;
  meta: string;
  tone: Tone;
};

export type InterfaceSummary = {
  name: string;
  category: string;
  source: string;
  capability: string;
  frontendStatus: string;
};

export type SourceStatus = "live" | "fallback";

export type SourceResult<T> = {
  source: string;
  status: SourceStatus;
  data: T;
  error?: string;
  updatedAt: string;
};

export type AshareDashboard = {
  lastUpdated: string;
  statusLabel: string;
  indices: AshareQuote[];
  quotes: AshareQuote[];
  selectedStock: AshareQuote;
  hotStocks: HotStock[];
  conceptBlocks: ConceptBlock[];
  fundFlow: FundFlowPoint[];
  dragonTiger: DragonTigerStock[];
  metrics: DashboardRow[];
  radar: DashboardRow[];
  heatmap: DashboardRow[];
  dataSources: DashboardRow[];
  interfaceSummary: InterfaceSummary[];
  sources: SourceResult<unknown>[];
};

type Fetcher = typeof fetch;

const INDEX_SYMBOLS = ["sh000001", "sz399001", "sz399006"];
const WATCH_SYMBOLS = [
  "600519",
  "000858",
  "300750",
  "601318",
  "688017",
  "002475",
  "300476",
  "600905",
  "000001",
  "000333",
  "002230",
  "002594",
  "600036",
  "600887",
  "601899",
  "601919",
  "603259",
  "603986",
  "688981",
  "920445"
];
const DEFAULT_SELECTED_CODE = "300750";

function numberOrZero(value: unknown): number {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text || text === "-" || text === "--") {
    return 0;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSignedPercent(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function toneForChange(value: number): Tone {
  if (value > 0) {
    return "red";
  }
  if (value < 0) {
    return "green";
  }
  return "neutral";
}

function compactDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function dashedDate(date = new Date()): string {
  const compact = compactDate(date);
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function nowLabel(): string {
  return new Date().toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function isIndexQuote(quote: AshareQuote): boolean {
  return INDEX_SYMBOLS.includes(quote.symbol);
}

function uniqueItems<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function uniqueQuotes(quotes: AshareQuote[]): AshareQuote[] {
  const seen = new Set<string>();
  const result: AshareQuote[] = [];
  for (const quote of quotes) {
    const key = `${quote.symbol}-${quote.code}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(quote);
  }
  return result;
}

function withTimeout(fetcher: Fetcher, timeoutMs = 8000): Fetcher {
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    return fetcher(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
  }) as Fetcher;
}

function makeFallbackQuote(
  symbol: string,
  code: string,
  name: string,
  price: number,
  changePct: number,
  options: Partial<AshareQuote> = {}
): AshareQuote {
  const previousClose = options.previousClose ?? Number((price / (1 + changePct / 100)).toFixed(2));
  return {
    symbol,
    code,
    name,
    price,
    previousClose,
    open: options.open ?? previousClose,
    changeAmount: options.changeAmount ?? Number((price - previousClose).toFixed(2)),
    changePct,
    high: options.high ?? Number((price * 1.018).toFixed(2)),
    low: options.low ?? Number((price * 0.982).toFixed(2)),
    amountWan: options.amountWan ?? 860000,
    turnoverPct: options.turnoverPct ?? 2.8,
    peTtm: options.peTtm ?? 28.6,
    amplitudePct: options.amplitudePct ?? 3.2,
    mcapYi: options.mcapYi ?? 1200,
    floatMcapYi: options.floatMcapYi ?? 980,
    pb: options.pb ?? 4.3,
    limitUp: options.limitUp ?? Number((previousClose * 1.1).toFixed(2)),
    limitDown: options.limitDown ?? Number((previousClose * 0.9).toFixed(2)),
    volRatio: options.volRatio ?? 1.15,
    peStatic: options.peStatic ?? 31.2,
    source: "Fallback"
  };
}

export const fallbackAshareDashboard: AshareDashboard = {
  lastUpdated: nowLabel(),
  statusLabel: "接口失败保留示例数据",
  indices: [
    makeFallbackQuote("sh000001", "000001", "上证指数", 3128.42, 0.42, { amountWan: 42000000 }),
    makeFallbackQuote("sz399001", "399001", "深证成指", 9821.31, 0.78, { amountWan: 58000000 }),
    makeFallbackQuote("sz399006", "399006", "创业板指", 1912.64, -0.31, { amountWan: 25000000 })
  ],
  quotes: [
    makeFallbackQuote("sh600519", "600519", "贵州茅台", 1698.5, 0.38, {
      peTtm: 26.4,
      pb: 8.2,
      mcapYi: 21342,
      amountWan: 232000
    }),
    makeFallbackQuote("sz000858", "000858", "五粮液", 154.22, -0.64, {
      peTtm: 19.8,
      pb: 4.9,
      mcapYi: 5986,
      amountWan: 186000
    }),
    makeFallbackQuote("sz300750", "300750", "宁德时代", 214.36, 2.18, {
      peTtm: 23.1,
      pb: 5.6,
      mcapYi: 9432,
      amountWan: 412000
    }),
    makeFallbackQuote("sh601318", "601318", "中国平安", 49.28, 1.12, {
      peTtm: 8.9,
      pb: 0.94,
      mcapYi: 9015,
      amountWan: 256000
    }),
    makeFallbackQuote("sh688017", "688017", "绿的谐波", 224.12, 4.24, {
      peTtm: 300.45,
      pb: 11.51,
      mcapYi: 410.88,
      amountWan: 187040
    })
  ],
  selectedStock: makeFallbackQuote("sz300750", "300750", "宁德时代", 214.36, 2.18, {
    peTtm: 23.1,
    pb: 5.6,
    mcapYi: 9432,
    amountWan: 412000
  }),
  hotStocks: [
    { code: "300750", name: "宁德时代", reason: "动力电池 + 储能 + 业绩修复", close: 214.36, changePct: 2.18, turnoverPct: 1.9, amount: "41.2 亿" },
    { code: "688017", name: "绿的谐波", reason: "机器人 + 减速器 + 高端制造", close: 224.12, changePct: 4.24, turnoverPct: 4.55, amount: "18.7 亿" },
    { code: "002475", name: "立讯精密", reason: "AI 终端 + 消费电子 + 苹果链", close: 37.18, changePct: 3.08, turnoverPct: 2.6, amount: "29.4 亿" }
  ],
  conceptBlocks: [
    { type: "industry", name: "电池", changePct: "+2.36%", desc: "申万行业归属" },
    { type: "concept", name: "固态电池", changePct: "+4.82%", desc: "题材热度高" },
    { type: "concept", name: "储能", changePct: "+2.41%", desc: "资金持续跟踪" },
    { type: "region", name: "福建", changePct: "+0.65%", desc: "地域归属" }
  ],
  fundFlow: [
    { date: "2026-05-14", close: "214.36", changePct: "+2.18%", mainIn: "18420", superNetIn: "9200", largeNetIn: "6110" },
    { date: "2026-05-13", close: "209.78", changePct: "-0.74%", mainIn: "-5260", superNetIn: "-2100", largeNetIn: "-1800" },
    { date: "2026-05-12", close: "211.34", changePct: "+1.22%", mainIn: "7400", superNetIn: "3900", largeNetIn: "2200" }
  ],
  dragonTiger: [
    { code: "688017", name: "绿的谐波", reason: "有价格涨跌幅限制的日收盘价格涨幅达到15%", close: 224.12, changePct: 4.24, netBuyWan: 8260, buyWan: 18430, sellWan: 10170, turnoverPct: 4.55 },
    { code: "002475", name: "立讯精密", reason: "日换手率达到20%的前五只证券", close: 37.18, changePct: 3.08, netBuyWan: 5320, buyWan: 14300, sellWan: 8980, turnoverPct: 8.12 }
  ],
  metrics: [],
  radar: [],
  heatmap: [],
  dataSources: [],
  interfaceSummary: [],
  sources: []
};

export function toTencentSymbol(code: string): string {
  const normalized = code.trim().toLowerCase().replace(".", "");
  if (/^(sh|sz|bj)\d{6}$/.test(normalized)) {
    return normalized;
  }
  const pureCode = normalized.replace(/\D/g, "").slice(-6);
  if (pureCode.startsWith("6") || pureCode.startsWith("9")) {
    return `sh${pureCode}`;
  }
  if (pureCode.startsWith("8")) {
    return `bj${pureCode}`;
  }
  return `sz${pureCode}`;
}

function toSinaSymbol(code: string): string {
  return `s_${toTencentSymbol(code)}`;
}

export function parseTencentQuotes(text: string): AshareQuote[] {
  const rows: AshareQuote[] = [];
  const matches = text.matchAll(/v_([^=]+)="([^"]*)"/g);

  for (const match of matches) {
    const symbol = match[1].toLowerCase();
    const values = match[2].split("~");
    if (values.length < 49) {
      continue;
    }

    const code = values[2] || symbol.slice(2);
    rows.push({
      symbol,
      code,
      name: values[1] || code,
      price: numberOrZero(values[3]),
      previousClose: numberOrZero(values[4]),
      open: numberOrZero(values[5]),
      changeAmount: numberOrZero(values[31]),
      changePct: numberOrZero(values[32]),
      high: numberOrZero(values[33]),
      low: numberOrZero(values[34]),
      amountWan: numberOrZero(values[37]),
      turnoverPct: numberOrZero(values[38]),
      peTtm: numberOrZero(values[39]),
      amplitudePct: numberOrZero(values[43]),
      mcapYi: numberOrZero(values[44]),
      floatMcapYi: numberOrZero(values[45]),
      pb: numberOrZero(values[46]),
      limitUp: numberOrZero(values[47]),
      limitDown: numberOrZero(values[48]),
      volRatio: numberOrZero(values[49]),
      peStatic: numberOrZero(values[52]),
      source: "Tencent"
    });
  }

  return rows;
}

export function parseSinaQuotes(text: string): AshareQuote[] {
  const rows: AshareQuote[] = [];
  const matches = text.matchAll(/hq_str_s_((?:sh|sz|bj)(\d{6}))="([^"]*)"/g);

  for (const match of matches) {
    const symbol = match[1].toLowerCase();
    const code = match[2];
    const values = match[3].split(",");
    if (values.length < 6) {
      continue;
    }

    const price = numberOrZero(values[1]);
    const changeAmount = numberOrZero(values[2]);
    const changePct = numberOrZero(values[3]);
    const previousClose = Number((price - changeAmount).toFixed(3));
    const limitRate = code.startsWith("3") || code.startsWith("68") || code.startsWith("8") || code.startsWith("9")
      ? 0.2
      : 0.1;

    rows.push({
      symbol,
      code,
      name: values[0] || code,
      price,
      previousClose,
      open: previousClose,
      changeAmount,
      changePct,
      high: price,
      low: price,
      amountWan: numberOrZero(values[5]),
      turnoverPct: 0,
      peTtm: 0,
      amplitudePct: 0,
      mcapYi: 0,
      floatMcapYi: 0,
      pb: 0,
      limitUp: Number((previousClose * (1 + limitRate)).toFixed(2)),
      limitDown: Number((previousClose * (1 - limitRate)).toFixed(2)),
      volRatio: 0,
      peStatic: 0,
      source: "Sina"
    });
  }

  return rows;
}

export async function safeLoad<T>(
  source: string,
  loader: () => Promise<T>,
  fallback: T
): Promise<SourceResult<T>> {
  const updatedAt = nowLabel();
  try {
    const data = await loader();
    const emptyArray = Array.isArray(data) && data.length === 0;
    if (emptyArray) {
      throw new Error("empty response");
    }
    return { source, status: "live", data, updatedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { source, status: "fallback", data: fallback, error: message, updatedAt };
  }
}

async function decodeResponse(response: Response, encoding: "utf-8" | "gbk" = "utf-8"): Promise<string> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  if (encoding === "gbk") {
    try {
      return new TextDecoder("gbk").decode(buffer);
    } catch {
      return new TextDecoder("utf-8").decode(buffer);
    }
  }
  return new TextDecoder("utf-8").decode(buffer);
}

async function fetchJson(fetcher: Fetcher, url: string): Promise<unknown> {
  const response = await fetcher(url);
  const text = await decodeResponse(response);
  return JSON.parse(text);
}

function parseAkshareQuotes(payload: unknown): AshareQuote[] {
  const rows = (payload as { quotes?: Record<string, unknown>[] }).quotes ?? [];
  return rows.map((item) => {
    const code = String(item.code ?? item.symbol ?? "").replace(/\D/g, "").slice(-6);
    const previousClose = numberOrZero(item.previousClose);
    const price = numberOrZero(item.price);
    return {
      symbol: toTencentSymbol(code),
      code,
      name: String(item.name ?? code),
      price,
      previousClose,
      open: numberOrZero(item.open) || previousClose,
      changeAmount: numberOrZero(item.changeAmount) || Number((price - previousClose).toFixed(3)),
      changePct: numberOrZero(item.changePct),
      high: numberOrZero(item.high) || price,
      low: numberOrZero(item.low) || price,
      amountWan: numberOrZero(item.amountWan),
      turnoverPct: numberOrZero(item.turnoverPct),
      peTtm: numberOrZero(item.peTtm),
      amplitudePct: numberOrZero(item.amplitudePct),
      mcapYi: numberOrZero(item.mcapYi),
      floatMcapYi: numberOrZero(item.floatMcapYi),
      pb: numberOrZero(item.pb),
      limitUp: numberOrZero(item.limitUp),
      limitDown: numberOrZero(item.limitDown),
      volRatio: numberOrZero(item.volRatio),
      peStatic: numberOrZero(item.peStatic),
      source: "AkShare" as const
    };
  }).filter((quote) => quote.code.length === 6 && quote.price > 0);
}

async function fetchAkshareQuotes(fetcher: Fetcher, codes: string[]): Promise<AshareQuote[]> {
  const symbols = uniqueItems(codes.map((code) => code.replace(/\D/g, "").slice(-6)).filter(Boolean)).join(",");
  const payload = await fetchJson(fetcher, `/api/akshare/quotes?symbols=${encodeURIComponent(symbols)}`);
  const rows = parseAkshareQuotes(payload);
  if (!rows.length) {
    throw new Error("AkShare quote payload is empty");
  }
  return rows;
}

async function fetchTencentQuotes(fetcher: Fetcher, codes: string[]): Promise<AshareQuote[]> {
  const symbols = codes.map(toTencentSymbol).join(",");
  const response = await fetcher(`/api/tencent/q=${symbols}`);
  const text = await decodeResponse(response, "gbk");
  const rows = parseTencentQuotes(text);
  if (!rows.length) {
    throw new Error("Tencent quote payload is empty");
  }
  return rows;
}

async function fetchSinaCurrentQuotes(fetcher: Fetcher, codes: string[]): Promise<AshareQuote[]> {
  const symbols = codes.map(toSinaSymbol).join(",");
  const response = await fetcher(`/api/sina/list=${symbols}`);
  const text = await decodeResponse(response, "gbk");
  const rows = parseSinaQuotes(text);
  if (!rows.length) {
    throw new Error("Sina realtime payload is empty");
  }
  return rows;
}

async function fetchEastmoneyMarketList(fetcher: Fetcher): Promise<AshareQuote[]> {
  const params = new URLSearchParams({
    pn: "1",
    pz: "30",
    po: "1",
    np: "1",
    fltt: "2",
    invt: "2",
    fid: "f3",
    fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
    fields: "f12,f14,f2,f3,f4,f5,f6,f8,f9,f10,f15,f16,f17,f18,f20,f21,f23"
  });
  const payload = await fetchJson(fetcher, `/api/eastmoney-push2/api/qt/clist/get?${params}`);
  const diff = (payload as { data?: { diff?: Record<string, unknown>[] } }).data?.diff ?? [];

  return diff.map((item) => {
    const code = String(item.f12 ?? "");
    const symbol = toTencentSymbol(code);
    return {
      symbol,
      code,
      name: String(item.f14 ?? code),
      price: numberOrZero(item.f2),
      previousClose: numberOrZero(item.f18),
      open: numberOrZero(item.f17),
      changeAmount: numberOrZero(item.f4),
      changePct: numberOrZero(item.f3),
      high: numberOrZero(item.f15),
      low: numberOrZero(item.f16),
      amountWan: numberOrZero(item.f6) / 10000,
      turnoverPct: numberOrZero(item.f8),
      peTtm: numberOrZero(item.f9),
      amplitudePct: 0,
      mcapYi: numberOrZero(item.f20) / 100000000,
      floatMcapYi: numberOrZero(item.f21) / 100000000,
      pb: numberOrZero(item.f23),
      limitUp: 0,
      limitDown: 0,
      volRatio: numberOrZero(item.f10),
      peStatic: numberOrZero(item.f9),
      source: "Eastmoney"
    };
  });
}

async function fetchThsHotStocks(fetcher: Fetcher): Promise<HotStock[]> {
  const date = dashedDate();
  const response = await fetcher(
    `/api/ths/event/api/getharden/date/${date}/orderby/date/orderway/desc/charset/GBK/`
  );
  const text = await decodeResponse(response, "gbk");
  const payload = JSON.parse(text) as { errocode?: number; errormsg?: string; data?: Record<string, unknown>[] };
  if (payload.errocode && payload.errocode !== 0) {
    throw new Error(payload.errormsg || "THS hot stock error");
  }

  return (payload.data ?? []).slice(0, 20).map((item) => ({
    code: String(item.code ?? ""),
    name: String(item.name ?? ""),
    reason: String(item.reason ?? "题材归因待更新"),
    close: numberOrZero(item.close),
    changePct: numberOrZero(item.zhangfu),
    turnoverPct: numberOrZero(item.huanshou),
    amount: String(item.chengjiaoe ?? "")
  }));
}

async function fetchBaiduConceptBlocks(fetcher: Fetcher, code: string): Promise<ConceptBlock[]> {
  const params = new URLSearchParams({
    code,
    market: "ab",
    typeCode: "all",
    finClientType: "pc"
  });
  const payload = (await fetchJson(fetcher, `/api/baidu/api/getrelatedblock?${params}`)) as {
    ResultCode?: string | number;
    Result?: { type?: string; list?: Record<string, unknown>[] }[];
  };
  if (String(payload.ResultCode ?? "-1") !== "0") {
    throw new Error("Baidu concept response is not successful");
  }

  const blocks: ConceptBlock[] = [];
  for (const block of payload.Result ?? []) {
    const typeText = block.type ?? "";
    const type: ConceptBlock["type"] = typeText.includes("行业")
      ? "industry"
      : typeText.includes("地域")
        ? "region"
        : "concept";
    for (const item of block.list ?? []) {
      blocks.push({
        type,
        name: String(item.name ?? ""),
        changePct: String(item.increase ?? ""),
        desc: String(item.desc ?? "")
      });
    }
  }
  return blocks;
}

async function fetchBaiduFundFlow(fetcher: Fetcher, code: string): Promise<FundFlowPoint[]> {
  const params = new URLSearchParams({
    code,
    market: "ab",
    pn: "0",
    rn: "20",
    finClientType: "pc"
  });
  const payload = (await fetchJson(fetcher, `/api/baidu/vapi/v1/fundsortlist?${params}`)) as {
    ResultCode?: string | number;
    Result?: { list?: Record<string, unknown>[] };
  };
  if (String(payload.ResultCode ?? "-1") !== "0") {
    throw new Error("Baidu fund flow response is not successful");
  }

  return (payload.Result?.list ?? []).slice(0, 8).map((item) => ({
    date: String(item.showtime ?? ""),
    close: String(item.closepx ?? ""),
    changePct: String(item.ratio ?? ""),
    mainIn: String(item.extMainIn ?? ""),
    superNetIn: String(item.superNetIn ?? ""),
    largeNetIn: String(item.largeNetIn ?? "")
  }));
}

async function fetchDailyDragonTiger(fetcher: Fetcher): Promise<DragonTigerStock[]> {
  const tradeDate = dashedDate();
  const params = new URLSearchParams({
    reportName: "RPT_DAILYBILLBOARD_DETAILSNEW",
    columns: "ALL",
    filter: `(TRADE_DATE>='${tradeDate}')(TRADE_DATE<='${tradeDate}')`,
    pageNumber: "1",
    pageSize: "500",
    sortTypes: "-1",
    sortColumns: "BILLBOARD_NET_AMT",
    source: "WEB",
    client: "WEB"
  });
  const payload = (await fetchJson(fetcher, `/api/eastmoney/api/data/v1/get?${params}`)) as {
    success?: boolean;
    result?: { data?: Record<string, unknown>[] };
  };
  if (!payload.success || !payload.result?.data?.length) {
    throw new Error("Daily dragon tiger board is empty");
  }

  return payload.result.data.slice(0, 12).map((row) => ({
    code: String(row.SECURITY_CODE ?? ""),
    name: String(row.SECURITY_NAME_ABBR ?? ""),
    reason: String(row.EXPLANATION ?? ""),
    close: numberOrZero(row.CLOSE_PRICE),
    changePct: numberOrZero(row.CHANGE_RATE),
    netBuyWan: numberOrZero(row.BILLBOARD_NET_AMT) / 10000,
    buyWan: numberOrZero(row.BILLBOARD_BUY_AMT) / 10000,
    sellWan: numberOrZero(row.BILLBOARD_SELL_AMT) / 10000,
    turnoverPct: numberOrZero(row.TURNOVERRATE)
  }));
}

function buildInterfaceSummary(): InterfaceSummary[] {
  return [
    {
      name: "Tencent Finance quote",
      category: "行情数据接口",
      source: "a-stock-data 1.2",
      capability: "实时价、涨跌幅、成交额、PE/PB、市值、涨跌停价",
      frontendStatus: "已接入"
    },
    {
      name: "adata stock.market.list_market_current",
      category: "实时行情接口",
      source: "adata / 新浪财经",
      capability: "多个股票最新价、涨跌额、涨跌幅、成交量、成交额，作为公开实时行情补充源",
      frontendStatus: "已接入"
    },
    {
      name: "Eastmoney push2 clist",
      category: "股票列表/基础信息",
      source: "公开行情补充",
      capability: "多只股票实时行情列表、成交额、换手率、估值字段",
      frontendStatus: "已接入"
    },
    {
      name: "Eastmoney push2his kline",
      category: "分钟/日/周/月 K 线",
      source: "efinance / 东财公开接口",
      capability: "个股 1m、5m、15m、30m、60m、日线、周线、月线 OHLCV，点击股票后实时刷新",
      frontendStatus: "已接入"
    },
    {
      name: "THS hot reason",
      category: "板块/题材信号",
      source: "a-stock-data 6.1",
      capability: "当日强势股、题材归因、涨幅、换手率",
      frontendStatus: "已接入"
    },
    {
      name: "Baidu concept blocks",
      category: "指数或板块相关",
      source: "a-stock-data 6.3",
      capability: "行业、概念、地域归属与当日涨跌幅",
      frontendStatus: "已接入"
    },
    {
      name: "Baidu fund flow",
      category: "其他展示接口",
      source: "a-stock-data 6.4",
      capability: "个股主力、超大单、大单资金流向",
      frontendStatus: "已接入"
    },
    {
      name: "Daily dragon tiger",
      category: "其他展示接口",
      source: "a-stock-data 6.8",
      capability: "全市场龙虎榜、上榜原因、净买入、换手率",
      frontendStatus: "已接入"
    },
    {
      name: "mootdx / akshare",
      category: "后端扩展接口",
      source: "a-stock-data 1.1 / 3 / 4 / 5 / 6.7",
      capability: "K 线、盘口、逐笔、新闻、公告、行业对比、基础信息",
      frontendStatus: "需后端封装"
    }
  ];
}

function buildMetrics(quotes: AshareQuote[], hotStocks: HotStock[], sources: SourceResult<unknown>[]): DashboardRow[] {
  const upCount = quotes.filter((quote) => quote.changePct > 0).length;
  const strongCount = quotes.filter((quote) => quote.changePct >= 5).length || hotStocks.length;
  const fallbackCount = sources.filter((source) => source.status === "fallback").length;

  return [
    { name: "行情股票", value: `${quotes.length}`, meta: "实时行情列表样本", tone: "blue" },
    { name: "上涨家数", value: `${upCount}`, meta: "当前列表内涨跌统计", tone: upCount >= quotes.length / 2 ? "red" : "green" },
    { name: "强势候选", value: `${strongCount}`, meta: "涨幅大于 5% 或同花顺强势股", tone: "red" },
    {
      name: "数据状态",
      value: fallbackCount ? "混合" : "实时",
      meta: fallbackCount ? `${fallbackCount} 个源使用示例回退` : "公开接口实时返回",
      tone: fallbackCount ? "amber" : "green"
    }
  ];
}

function buildRadar(indices: AshareQuote[], dragonTiger: DragonTigerStock[], hotStocks: HotStock[]): DashboardRow[] {
  const rows = indices.slice(0, 3).map((index) => ({
    name: index.name,
    value: formatSignedPercent(index.changePct),
    meta: `现价 ${index.price.toFixed(2)} / 成交 ${Math.round(index.amountWan / 10000)} 亿`,
    tone: toneForChange(index.changePct)
  }));
  rows.push({
    name: "龙虎榜记录",
    value: `${dragonTiger.length}`,
    meta: "东财 datacenter 当日全市场",
    tone: dragonTiger.length ? "amber" : "neutral"
  });
  rows.push({
    name: "题材归因",
    value: `${hotStocks.length}`,
    meta: "同花顺热点强势股",
    tone: hotStocks.length ? "red" : "neutral"
  });
  return rows;
}

function buildHeatmap(blocks: ConceptBlock[], fallbackBlocks: ConceptBlock[]): DashboardRow[] {
  const source = blocks.length ? blocks : fallbackBlocks;
  return source.slice(0, 6).map((block) => {
    const change = numberOrZero(block.changePct.replace("%", ""));
    return {
      name: block.name,
      value: block.changePct || "--",
      meta: block.type === "industry" ? "行业" : block.type === "region" ? "地域" : "概念",
      tone: toneForChange(change)
    };
  });
}

function buildDataSourceRows(sources: SourceResult<unknown>[]): DashboardRow[] {
  return sources.map((source) => ({
    name: source.source,
    value: source.status === "live" ? "实时" : "示例回退",
    meta: source.error ? `失败原因：${source.error}` : `更新 ${source.updatedAt}`,
    tone: source.status === "live" ? "green" : "amber"
  }));
}

export async function loadAshareDashboard(
  fetcher: Fetcher = fetch,
  selectedCode = DEFAULT_SELECTED_CODE
): Promise<AshareDashboard> {
  const timedFetcher = withTimeout(fetcher);
  const allTencentCodes = uniqueItems([...INDEX_SYMBOLS, ...WATCH_SYMBOLS, selectedCode]);
  const allStockCodes = uniqueItems([...WATCH_SYMBOLS, selectedCode]);
  const [akshareResult, quoteResult, sinaResult, marketListResult, hotResult, conceptResult, fundResult, dragonResult] = await Promise.all([
    safeLoad("AkShare 本地实时行情", () => fetchAkshareQuotes(timedFetcher, allStockCodes), [] as AshareQuote[]),
    safeLoad(
      "腾讯财经实时行情",
      () => fetchTencentQuotes(timedFetcher, allTencentCodes),
      [...fallbackAshareDashboard.indices, ...fallbackAshareDashboard.quotes]
    ),
    safeLoad("新浪实时行情（adata）", () => fetchSinaCurrentQuotes(timedFetcher, allTencentCodes), [] as AshareQuote[]),
    safeLoad("东财股票行情列表", () => fetchEastmoneyMarketList(timedFetcher), fallbackAshareDashboard.quotes),
    safeLoad("同花顺强势股题材", () => fetchThsHotStocks(timedFetcher), fallbackAshareDashboard.hotStocks),
    safeLoad(
      "百度概念板块",
      () => fetchBaiduConceptBlocks(timedFetcher, selectedCode),
      fallbackAshareDashboard.conceptBlocks
    ),
    safeLoad("百度资金流向", () => fetchBaiduFundFlow(timedFetcher, selectedCode), fallbackAshareDashboard.fundFlow),
    safeLoad("东财全市场龙虎榜", () => fetchDailyDragonTiger(timedFetcher), fallbackAshareDashboard.dragonTiger)
  ]);

  const sources: SourceResult<unknown>[] = [
    akshareResult,
    quoteResult,
    sinaResult,
    marketListResult,
    hotResult,
    conceptResult,
    fundResult,
    dragonResult
  ];
  const indices = uniqueQuotes(quoteResult.data.filter(isIndexQuote));
  const akshareQuotes = uniqueQuotes(akshareResult.status === "live" ? akshareResult.data : []);
  const directQuotes = quoteResult.status === "live"
    ? uniqueQuotes(quoteResult.data.filter((quote) => !isIndexQuote(quote)))
    : [];
  const sinaQuotes = uniqueQuotes(sinaResult.data);
  const marketQuotes = uniqueQuotes(marketListResult.status === "live" ? marketListResult.data : []);
  const quotes = uniqueQuotes(
    [...akshareQuotes, ...marketQuotes, ...directQuotes, ...sinaQuotes].length
      ? [...akshareQuotes, ...marketQuotes, ...directQuotes, ...sinaQuotes]
      : fallbackAshareDashboard.quotes
  );
  const selectedStock =
    akshareQuotes.find((quote) => quote.code === selectedCode) ??
    directQuotes.find((quote) => quote.code === selectedCode) ??
    sinaQuotes.find((quote) => quote.code === selectedCode) ??
    quotes.find((quote) => quote.code === selectedCode) ??
    quotes[0] ??
    fallbackAshareDashboard.selectedStock;

  const liveStatusCount = sources.filter((source) => source.status === "live").length;
  const statusLabel =
    liveStatusCount === sources.length
      ? "公开接口实时更新"
      : liveStatusCount > 0
        ? "部分实时，异常源保留示例数据"
        : "接口失败保留示例数据";

  return {
    lastUpdated: nowLabel(),
    statusLabel,
    indices: indices.length ? indices : fallbackAshareDashboard.indices,
    quotes,
    selectedStock,
    hotStocks: hotResult.data,
    conceptBlocks: conceptResult.data,
    fundFlow: fundResult.data,
    dragonTiger: dragonResult.data,
    metrics: buildMetrics(quotes, hotResult.data, sources),
    radar: buildRadar(indices.length ? indices : fallbackAshareDashboard.indices, dragonResult.data, hotResult.data),
    heatmap: buildHeatmap(conceptResult.data, fallbackAshareDashboard.conceptBlocks),
    dataSources: buildDataSourceRows(sources),
    interfaceSummary: buildInterfaceSummary(),
    sources
  };
}
