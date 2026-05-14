# 参考源码快照

本目录保存 v1.0.0 阶段为量化软件调研、数据源接入和前端设计拉取的开源项目快照。它们用于学习接口、数据结构、图表、回测和 UI 设计方式，不代表当前前端已经完整集成所有能力。

## A 股数据与回测

- `a-stock-data`：A 股公开行情接口参考。
- `adata`：A 股实时行情、股票基础信息和市场数据参考。
- `Ashare`：轻量 A 股行情接口参考。
- `tdx2db`：通达信数据导入和本地落库参考。
- `stock-quant`：回测、策略测试和量化任务组织参考。

## TradingView 与技术分析

- `TradingView-API`
- `tradingViewWikiCn`
- `TradingView-data-scraper`
- `TradingView-Machine-Learning-GUI-TreborNamor`
- `PineTS`
- `python-tradingview-ta`
- `lightweight-charts-python`
- `awesome-tradingview`
- `awesome-systematic-trading`
- `tradingview-pinescript-indicators`
- `tvscreener`
- `0xrushi-tradingview-scraper`
- `mnwato-tradingview-scraper`
- `charting-library-examples`

## 设计参考

- `frontend-design`：包含 Claude frontend design、ui-ux-pro-max 等设计参考项目。

## 说明

这些目录是第三方项目的源码快照。后续如果需要持续同步上游，建议改为 Git submodule 或在文档中记录固定 commit；当前版本为了便于整体发布和离线查看，按普通目录纳入仓库。
