# Lianghua 量化研究终端

`lianghua` 是一个面向 A 股、美股与加密货币的量化研究前端。当前定位是“研究 + 行情 + 回测 + 静态模拟交易”终端，不提供真实下单、券商账户、交易所账户、登录系统或实盘委托能力。

## v1.0.1 更新重点

- A 股接入本地 AkShare 服务：新增 `quant-ui/server/akshare_api.py`，提供实时行情、分钟/日线 K 线和历史回测接口。
- 实时价格刷新：A 股行情列表与个股详情会定时刷新，点击股票后同步更新实时 K 线。
- K 线数据源升级：A 股优先走 AkShare 分钟/日线数据，公开源异常时保留东方财富与本地示例回退；加密货币使用 Binance 公共 K 线。
- 回测实验室可运行：自然语言策略可以生成 AkShare Python 回测代码，并在页面展示历史回测指标、交易记录和代码片段。
- 市场结构调整：A 股为独立工作台，美股 / 加密为合并工作台，分别展示不同风格的行情、策略、风控与复盘内容。
- 安全边界补充：当前版本不需要、不保存、不提交任何 API key、交易所密钥、券商密钥或账户凭证。

## 项目结构

```text
.
├── quant-ui/              # React + Vite 前端工程
│   ├── server/            # 本地 AkShare API 服务
│   └── src/               # 页面、数据、K 线、回测与测试代码
├── reference-repos/       # A 股、TradingView、回测和 UI 设计相关开源项目快照
├── docs/                  # 数据源与发布说明
└── README.md
```

## 本地运行

安装前端依赖：

```bash
cd quant-ui
npm install
```

安装 A 股数据服务依赖：

```bash
pip install akshare pandas requests
```

启动本地 AkShare API：

```bash
npm run api
```

另开一个终端启动前端：

```bash
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:5173/
```

## 数据源说明

- A 股实时行情：通过本地服务聚合公开实时行情，前端显示为 AkShare 本地行情。
- A 股 K 线：使用 AkShare `stock_zh_a_minute` 和 `stock_zh_a_daily` 获取分钟线与历史日线。
- A 股回测：使用 AkShare 前复权日线数据生成策略指标、交易记录和收益回撤统计。
- 加密货币 K 线：使用 Binance 公共 Spot Kline 接口，不需要 API key。
- 参考项目：FinceptTerminal、AkShare、a-stock-data、Ashare、tdx2db、stock-quant、TradingView 相关项目等。

更完整的数据源说明见 [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)。

## 密钥与安全边界

当前版本没有真实交易功能，也不需要用户填写任何密钥。

- 不保存 API key、交易所密钥、券商密钥或账户密码。
- 不提供真实买入、卖出、撤单、转账或自动交易入口。
- `.env`、`.env.local` 等本地环境文件已在 `.gitignore` 中排除，后续如果接入私有数据源，也不要把密钥提交到仓库。
- 所有策略、信号、订单、持仓和 PnL 均为研究展示或静态模拟结果，不构成投资建议。

## 验证命令

```bash
cd quant-ui
npm test -- --run
npm run build
python -m py_compile server/akshare_api.py
```

## 发布记录

- `v1.0.1`：接入本地 AkShare API、实时 A 股 K 线、自然语言策略回测代码生成、A 股历史回测结果展示。
- `v1.0.0`：第一版量化研究终端，完成 A 股与加密货币研究界面、公开行情展示和数据源参考矩阵。
