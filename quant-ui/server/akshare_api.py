from __future__ import annotations

import json
import math
import os
import re
import sys
import time
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

os.environ.setdefault("NO_PROXY", "*")

import akshare as ak
import pandas as pd
import requests


HOST = "127.0.0.1"
PORT = int(os.environ.get("AKSHARE_API_PORT", "8765"))
DEFAULT_SYMBOLS = ["300750", "600519", "000858", "601318", "688017", "002475", "600905"]


def now_label() -> str:
    return datetime.now().strftime("%m-%d %H:%M:%S")


def pure_code(symbol: str) -> str:
    return re.sub(r"\D", "", symbol or "")[-6:]


def eastmoney_secid(symbol: str) -> str:
    code = pure_code(symbol)
    market = "1" if code.startswith(("6", "9")) else "0"
    return f"{market}.{code}"


def ak_symbol(symbol: str) -> str:
    code = pure_code(symbol)
    if code.startswith(("6", "9")):
        return f"sh{code}"
    if code.startswith(("8", "4")):
        return f"bj{code}"
    return f"sz{code}"


def safe_float(value: Any, scale: float = 1.0) -> float:
    try:
        if value is None:
            return 0.0
        result = float(value) / scale
        if math.isnan(result) or math.isinf(result):
            return 0.0
        return result
    except Exception:
        return 0.0


def safe_int(value: Any) -> int:
    try:
        result = int(float(value))
        return result if result > 0 else 0
    except Exception:
        return 0


def date_text(value: Any) -> str:
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    text = str(value)
    if " " in text:
        return text.split("+")[0]
    return text[:10]


def json_default(value: Any) -> Any:
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return str(value)


def send_json(handler: BaseHTTPRequestHandler, payload: dict[str, Any], status: int = 200) -> None:
    body = json.dumps(payload, ensure_ascii=False, default=json_default).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def quote_from_tencent(symbol: str) -> dict[str, Any]:
    code = pure_code(symbol)
    prefixed = ak_symbol(code)
    response = requests.get(
        f"https://qt.gtimg.cn/q={prefixed}",
        headers={"Referer": "https://gu.qq.com/"},
        timeout=8,
    )
    response.raise_for_status()
    text = response.content.decode("gbk", errors="ignore")
    match = re.search(r'v_[^=]+="([^"]*)"', text)
    if not match:
        raise ValueError(f"empty Tencent quote for {symbol}")
    values = match.group(1).split("~")
    if len(values) < 49:
        raise ValueError(f"invalid Tencent quote for {symbol}")
    code = values[2] or code
    price = safe_float(values[3])
    previous_close = safe_float(values[4])
    return {
        "symbol": code,
        "code": code,
        "name": values[1] or code,
        "price": price,
        "previousClose": previous_close,
        "open": safe_float(values[5]),
        "changeAmount": safe_float(values[31]),
        "changePct": safe_float(values[32]),
        "high": safe_float(values[33]),
        "low": safe_float(values[34]),
        "amountWan": safe_float(values[37]),
        "turnoverPct": safe_float(values[38]),
        "peTtm": safe_float(values[39]),
        "amplitudePct": safe_float(values[43]),
        "mcapYi": safe_float(values[44]),
        "floatMcapYi": safe_float(values[45]),
        "pb": safe_float(values[46]),
        "limitUp": safe_float(values[47]),
        "limitDown": safe_float(values[48]),
        "volRatio": safe_float(values[49]) if len(values) > 49 else 0,
        "peStatic": safe_float(values[52]) if len(values) > 52 else safe_float(values[39]),
        "source": "AkShare-compatible Tencent realtime quote",
    }


def quotes_from_tencent(symbols: list[str]) -> list[dict[str, Any]]:
    prefixed_symbols = [ak_symbol(symbol) for symbol in symbols if pure_code(symbol)]
    if not prefixed_symbols:
        return []
    response = requests.get(
        f"https://qt.gtimg.cn/q={','.join(prefixed_symbols)}",
        headers={"Referer": "https://gu.qq.com/"},
        timeout=8,
    )
    response.raise_for_status()
    text = response.content.decode("gbk", errors="ignore")
    rows: list[dict[str, Any]] = []
    for match in re.finditer(r'v_[^=]+="([^"]*)"', text):
        values = match.group(1).split("~")
        if len(values) < 49:
            continue
        code = values[2]
        price = safe_float(values[3])
        previous_close = safe_float(values[4])
        if not code or price <= 0:
            continue
        rows.append(
            {
                "symbol": code,
                "code": code,
                "name": values[1] or code,
                "price": price,
                "previousClose": previous_close,
                "open": safe_float(values[5]),
                "changeAmount": safe_float(values[31]),
                "changePct": safe_float(values[32]),
                "high": safe_float(values[33]),
                "low": safe_float(values[34]),
                "amountWan": safe_float(values[37]),
                "turnoverPct": safe_float(values[38]),
                "peTtm": safe_float(values[39]),
                "amplitudePct": safe_float(values[43]),
                "mcapYi": safe_float(values[44]),
                "floatMcapYi": safe_float(values[45]),
                "pb": safe_float(values[46]),
                "limitUp": safe_float(values[47]),
                "limitDown": safe_float(values[48]),
                "volRatio": safe_float(values[49]) if len(values) > 49 else 0,
                "peStatic": safe_float(values[52]) if len(values) > 52 else safe_float(values[39]),
                "source": "AkShare-compatible Tencent realtime quote",
            }
        )
    return rows


def load_quotes(symbols: list[str]) -> dict[str, Any]:
    rows = quotes_from_tencent(symbols)
    return {
        "status": "live",
        "source": "AkShare-compatible Tencent realtime quote",
        "updatedAt": now_label(),
        "quotes": rows,
    }


def normalise_kline_row(row: dict[str, Any], time_key: str) -> dict[str, Any]:
    raw_time = row.get(time_key)
    return {
        "time": date_text(raw_time),
        "timestamp": int(pd.Timestamp(raw_time).timestamp() * 1000)
        if not isinstance(raw_time, str)
        else int(pd.Timestamp(str(raw_time)).timestamp() * 1000),
        "open": safe_float(row.get("开盘", row.get("open"))),
        "high": safe_float(row.get("最高", row.get("high"))),
        "low": safe_float(row.get("最低", row.get("low"))),
        "close": safe_float(row.get("收盘", row.get("close"))),
        "volume": safe_float(row.get("成交量", row.get("volume"))),
        "amount": safe_float(row.get("成交额", row.get("amount"))),
    }


def load_kline(symbol: str, interval: str, limit: int) -> dict[str, Any]:
    code = pure_code(symbol)
    if interval in {"1m", "5m", "15m", "30m", "60m"}:
        period = interval.replace("m", "")
        df = ak.stock_zh_a_minute(symbol=ak_symbol(code), period=period, adjust="qfq")
        records = df.tail(limit).to_dict("records")
        points = [normalise_kline_row(row, "day") for row in records]
        source = f"AkShare stock_zh_a_minute {period}m"
    else:
        end = datetime.now().strftime("%Y%m%d")
        start = (datetime.now() - timedelta(days=1100)).strftime("%Y%m%d")
        df = ak.stock_zh_a_daily(symbol=ak_symbol(code), start_date=start, end_date=end, adjust="qfq")
        if interval in {"1w", "1M"}:
            df = df.copy()
            df["date"] = pd.to_datetime(df["date"])
            rule = "W-FRI" if interval == "1w" else "ME"
            df = (
                df.set_index("date")
                .resample(rule)
                .agg({"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum", "amount": "sum"})
                .dropna()
                .reset_index()
            )
        records = df.tail(limit).to_dict("records")
        points = [normalise_kline_row(row, "date") for row in records]
        source = "AkShare stock_zh_a_daily" if interval == "1d" else f"AkShare stock_zh_a_daily resample {interval}"
    return {
        "status": "live",
        "symbol": code,
        "source": source,
        "updatedAt": now_label(),
        "points": points,
    }


def strategy_params(text: str) -> dict[str, Any]:
    text = text or ""
    numbers = [int(item) for item in re.findall(r"\d+", text) if 3 <= int(item) <= 120]
    short_window = 5
    long_window = 20
    if len(numbers) >= 2:
        short_window = min(numbers[0], numbers[1])
        long_window = max(numbers[0], numbers[1])
    elif len(numbers) == 1 and "均线" in text:
        long_window = max(numbers[0], short_window + 5)
    breakout = "突破" in text or "新高" in text
    volume_factor = 1.2 if any(word in text for word in ["量", "成交", "放量"]) else 1.0
    return {
        "shortWindow": short_window,
        "longWindow": max(long_window, short_window + 3),
        "breakout": breakout,
        "volumeFactor": volume_factor,
        "strategyName": "通道突破量价策略" if breakout else "双均线量价策略",
    }


def generated_code(params: dict[str, Any], text: str) -> str:
    return f'''# Generated by local AkShare backtest service
import akshare as ak

def run_strategy(symbol, start_date, end_date, initial_cash=100000):
    df = ak.stock_zh_a_daily(symbol=symbol, start_date=start_date, end_date=end_date, adjust="qfq")
    df["ma_short"] = df["close"].rolling({params["shortWindow"]}).mean()
    df["ma_long"] = df["close"].rolling({params["longWindow"]}).mean()
    df["vol_ma"] = df["volume"].rolling({params["longWindow"]}).mean()
    cash, shares, entry_price = initial_cash, 0, 0
    trades = []
    for _, row in df.iterrows():
        close = float(row["close"])
        volume_ok = float(row["volume"]) >= float(row["vol_ma"] or 0) * {params["volumeFactor"]}
        trend_ok = close > float(row["ma_short"] or 0) > float(row["ma_long"] or 0)
        breakout_ok = {"True" if params["breakout"] else "False"} and close >= df.loc[:_, "high"].tail({params["longWindow"]}).max()
        buy_signal = shares == 0 and volume_ok and (trend_ok or breakout_ok)
        sell_signal = shares > 0 and (close < float(row["ma_short"] or 0) or close < entry_price * 0.93)
        if buy_signal:
            shares = int((cash * 0.95 / close) // 100) * 100
            cash -= shares * close * 1.0003
            entry_price = close
            trades.append((row["date"], "BUY", close, shares))
        elif sell_signal:
            cash += shares * close * 0.9987
            trades.append((row["date"], "SELL", close, shares))
            shares = 0
    return trades

# Natural language prompt:
# {text[:180]}
'''


def load_daily_history(symbol: str, start_date: str, end_date: str) -> list[dict[str, Any]]:
    df = ak.stock_zh_a_daily(symbol=ak_symbol(symbol), start_date=start_date, end_date=end_date, adjust="qfq")
    df = df.sort_values("date").reset_index(drop=True)
    return df.to_dict("records")


def row_value(row: dict[str, Any], chinese_key: str, english_key: str) -> Any:
    return row.get(chinese_key, row.get(english_key))


def run_backtest(body: dict[str, Any]) -> dict[str, Any]:
    symbol = pure_code(str(body.get("symbol") or "300750"))
    name = str(body.get("name") or symbol)
    text = str(body.get("strategyText") or "5日均线上穿20日均线，成交量放大时买入，跌破5日均线卖出")
    end = str(body.get("endDate") or datetime.now().strftime("%Y%m%d")).replace("-", "")
    start = str(body.get("startDate") or (datetime.now() - timedelta(days=720)).strftime("%Y%m%d")).replace("-", "")
    initial_cash = safe_float(body.get("initialCash") or 100000)
    params = strategy_params(text)
    rows = load_daily_history(symbol, start, end)
    if len(rows) < params["longWindow"] + 5:
        raise ValueError("not enough historical rows for backtest")

    cash = initial_cash
    shares = 0
    entry_price = 0.0
    entry_cost = 0.0
    trades: list[dict[str, Any]] = []
    equity_curve: list[dict[str, Any]] = []
    wins = 0
    completed = 0
    closes = [safe_float(row_value(row, "收盘", "close")) for row in rows]
    highs = [safe_float(row_value(row, "最高", "high")) for row in rows]
    volumes = [safe_float(row_value(row, "成交量", "volume")) for row in rows]

    for index, row in enumerate(rows):
        close = closes[index]
        if index < params["longWindow"] or close <= 0:
            equity_curve.append({"date": date_text(row_value(row, "日期", "date")), "equity": round(cash + shares * close, 2), "close": close})
            continue
        ma_short = sum(closes[index - params["shortWindow"] + 1 : index + 1]) / params["shortWindow"]
        ma_long = sum(closes[index - params["longWindow"] + 1 : index + 1]) / params["longWindow"]
        vol_ma = sum(volumes[index - params["longWindow"] + 1 : index + 1]) / params["longWindow"]
        channel_high = max(highs[index - params["longWindow"] : index])
        volume_ok = volumes[index] >= vol_ma * params["volumeFactor"]
        trend_ok = close > ma_short > ma_long
        breakout_ok = params["breakout"] and close >= channel_high
        buy_signal = shares == 0 and volume_ok and (trend_ok or breakout_ok)
        sell_signal = shares > 0 and (close < ma_short or close < entry_price * 0.93)

        if buy_signal:
            shares = int((cash * 0.95 / close) // 100) * 100
            if shares > 0:
                cost = shares * close * 1.0003
                cash -= cost
                entry_price = close
                entry_cost = cost
                trades.append({
                    "date": date_text(row_value(row, "日期", "date")),
                    "side": "BUY",
                    "price": round(close, 2),
                    "shares": shares,
                    "reason": "trend/volume signal",
                })
        elif sell_signal:
            proceeds = shares * close * 0.9987
            cash += proceeds
            completed += 1
            wins += 1 if proceeds > entry_cost else 0
            trades.append({
                "date": date_text(row_value(row, "日期", "date")),
                "side": "SELL",
                "price": round(close, 2),
                "shares": shares,
                "reason": "exit signal or stop loss",
            })
            shares = 0
            entry_cost = 0

        equity_curve.append({"date": date_text(row_value(row, "日期", "date")), "equity": round(cash + shares * close, 2), "close": close})

    final_equity = equity_curve[-1]["equity"]
    total_return = (final_equity / initial_cash - 1) * 100
    benchmark_return = (closes[-1] / closes[0] - 1) * 100 if closes[0] else 0
    peak = equity_curve[0]["equity"]
    max_drawdown = 0.0
    for point in equity_curve:
        peak = max(peak, point["equity"])
        if peak:
            max_drawdown = min(max_drawdown, (point["equity"] / peak - 1) * 100)
    days = max(1, len(rows))
    annual_return = ((final_equity / initial_cash) ** (252 / days) - 1) * 100
    win_rate = (wins / completed * 100) if completed else 0

    return {
        "status": "live",
        "symbol": symbol,
        "name": name,
        "source": "AkShare stock_zh_a_daily qfq",
        "strategyName": params["strategyName"],
        "strategyText": text,
        "code": generated_code(params, text),
        "dataRows": len(rows),
        "updatedAt": now_label(),
        "metrics": [
            {"label": "总收益", "value": f"{total_return:+.2f}%", "tone": "red" if total_return > 0 else "green"},
            {"label": "年化收益", "value": f"{annual_return:+.2f}%", "tone": "red" if annual_return > 0 else "green"},
            {"label": "最大回撤", "value": f"{max_drawdown:.2f}%", "tone": "green"},
            {"label": "胜率", "value": f"{win_rate:.1f}%", "tone": "blue"},
        ],
        "trades": trades[-12:],
        "equity": equity_curve[-120:],
        "summary": {
            "finalEquity": round(final_equity, 2),
            "initialCash": initial_cash,
            "tradeCount": len(trades),
            "benchmarkReturn": f"{benchmark_return:+.2f}%",
        },
    }


class AkshareHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        send_json(self, {"ok": True})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        try:
            if parsed.path == "/health":
                send_json(self, {"ok": True, "akshare": getattr(ak, "__version__", "unknown"), "updatedAt": now_label()})
            elif parsed.path == "/quotes":
                symbols = ",".join(params.get("symbols", [",".join(DEFAULT_SYMBOLS)])).split(",")
                send_json(self, load_quotes(symbols))
            elif parsed.path == "/kline":
                symbol = params.get("symbol", ["300750"])[0]
                interval = params.get("interval", ["1m"])[0]
                limit = min(500, max(20, safe_int(params.get("limit", ["120"])[0])))
                send_json(self, load_kline(symbol, interval, limit))
            else:
                send_json(self, {"error": "not found"}, 404)
        except Exception as exc:
            send_json(self, {"status": "error", "error": str(exc), "updatedAt": now_label()}, 500)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            length = int(self.headers.get("Content-Length") or "0")
            body = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            if parsed.path == "/backtest":
                send_json(self, run_backtest(body))
            else:
                send_json(self, {"error": "not found"}, 404)
        except Exception as exc:
            send_json(self, {"status": "error", "error": str(exc), "updatedAt": now_label()}, 500)

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write(f"[akshare-api] {self.address_string()} {fmt % args}\n")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), AkshareHandler)
    print(f"AkShare API listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
