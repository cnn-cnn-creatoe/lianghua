# v1.0.1 - AkShare 实时行情与回测实验室

`v1.0.1` 将 `lianghua` 从静态研究界面推进到可运行的本地研究终端：A 股支持本地 AkShare 行情服务，K 线可以跟随选中股票刷新，回测实验室可以把自然语言策略转成 Python 回测代码并显示结果。

## 新增能力

- 新增 `quant-ui/server/akshare_api.py`，提供本地 HTTP API：
  - `GET /quotes`
  - `GET /kline`
  - `POST /backtest`
- A 股行情优先显示 AkShare 本地行情，价格按 8 秒周期刷新。
- A 股 K 线优先使用 AkShare 分钟线与日线，失败时回退到公开源或示例数据。
- 回测实验室支持自然语言策略输入、代码生成、历史回测指标和交易记录展示。
- 美股 / 加密工作台保留 TradingView 风格界面，并接入 Binance 公共 K 线。
- README 与数据源文档补充密钥说明：当前版本不需要也不保存任何 API key。

## 不包含

- 不包含真实交易、下单、撤单、转账、券商账户或交易所账户接入。
- 不保存 API key、Secret、账户密码或个人交易凭证。
- 不构成投资建议，所有策略与回测结果都需要自行验证。

## 运行方式

```bash
cd quant-ui
npm install
pip install akshare pandas requests
```

启动本地数据服务：

```bash
npm run api
```

启动前端：

```bash
npm run dev
```

访问：

```text
http://127.0.0.1:5173/
```

## 验证

```bash
npm test -- --run
npm run build
python -m py_compile server/akshare_api.py
```
