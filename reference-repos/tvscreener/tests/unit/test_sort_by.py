import unittest

from tvscreener import CryptoScreener, StockScreener
from tvscreener.field.crypto import CryptoField
from tvscreener.field.stock import StockField


class TestSortByReturnValue(unittest.TestCase):
    def test_sort_by_returns_crypto_screener_for_chaining(self):
        cs = CryptoScreener()
        result = cs.sort_by(CryptoField.VALUE_TRADED, ascending=False)
        self.assertIsInstance(result, CryptoScreener)
        self.assertEqual(result, cs)

    def test_sort_by_returns_stock_screener_for_chaining(self):
        ss = StockScreener()
        result = ss.sort_by(StockField.MARKET_CAPITALIZATION, ascending=False)
        self.assertIsInstance(result, StockScreener)
        self.assertEqual(result, ss)

    def test_sort_by_method_chaining(self):
        cs = CryptoScreener()
        result = cs.sort_by(CryptoField.VALUE_TRADED, ascending=False) \
                   .set_range(0, 10)
        self.assertIsInstance(result, CryptoScreener)
        self.assertEqual(result, cs)
