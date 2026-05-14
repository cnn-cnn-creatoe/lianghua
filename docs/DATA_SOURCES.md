# 数据源与参考项目

本文件记录 v1.0.0 阶段纳入调研和前端设计的数据源、回测、TradingView 与 UI 参考项目。`reference-repos/` 中保留的是源码快照，便于查看接口实现和后续二次封装。

## A 股行情与基础数据

| 项目 | 用途 | 当前接入状态 |
| --- | --- | --- |
| `a-stock-data` | 腾讯财经、东方财富、同花顺、百度股市通等公开接口参考 | 已用于 A 股行情适配层设计 |
| `adata` | A 股实时行情、股票列表、基础信息、市场数据 | 已作为实时数据能力补充参考 |
| `Ashare` | 轻量 A 股行情获取 | 已作为备选行情接口参考 |
| `tdx2db` | 通达信数据导入、本地数据库落库 | 已用于数据导入模块规划 |

## 回测与策略研究

| 项目 | 用途 | 当前接入状态 |
| --- | --- | --- |
| `stock-quant` | 股票量化分析、策略测试、任务组织 | 已用于回测测试界面和后续服务端规划 |
| `awesome-systematic-trading` | 系统化交易资料索引 | 作为策略研究和软件选择资料库 |

## TradingView 与跨市场能力

| 项目 | 用途 | 当前接入状态 |
| --- | --- | --- |
| `TradingView-API` | TradingView 数据接口参考 | 后续扩展 K 线和指标数据 |
| `tradingViewWikiCn` | TradingView / Pine Script 中文资料 | 策略说明和脚本研究参考 |
| `TradingView-data-scraper` | TradingView 数据抓取参考 | 后续跨市场数据抓取参考 |
| `TradingView-Machine-Learning-GUI-TreborNamor` | TradingView + 机器学习 GUI 参考 | 后续策略实验参考 |
| `PineTS` | Pine Script 运行/兼容思路 | 后续指标策略引擎参考 |
| `python-tradingview-ta` | TradingView 技术分析封装 | 后续指标信号参考 |
| `lightweight-charts-python` | K 线图和行情可视化参考 | 后续图表能力参考 |
| `awesome-tradingview` | TradingView 生态资料索引 | 资料库 |

## UI / UX 设计参考

| 项目 | 用途 | 当前接入状态 |
| --- | --- | --- |
| `frontend-design` | Claude frontend design、ui-ux-pro-max 等设计参考 | 已用于当前量化前端视觉和布局方向 |

## 当前前端数据策略

- 页面不直接拼接第三方接口，统一走 `quant-ui/src/services/ashareData.ts`。
- 数据请求失败、字段缺失或接口限流时，保留本地示例数据，页面显示降级状态。
- 当前只展示公开行情和研究信息，不做交易、下单、账户、登录、券商 API 对接。
- 后续如果要稳定实时刷新，建议增加后端服务层，统一处理缓存、限流、字段归一化和本地历史数据落库。
