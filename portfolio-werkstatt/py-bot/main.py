import yfinance as yf
from datetime import datetime
import json

# ETFs
ETFS = {
    "DepotA": "ESG.DE",
    "DepotB": "INRG.L",
    "DepotC": "VWCE.DE"
}

START_CAPITAL = 500

def get_price(ticker):
    data = yf.Ticker(ticker)
    return data.history(period="1d")["Close"].iloc[-1]

portfolio = {
    "date": str(datetime.now().date()),
    "depots": {}
}

for name, ticker in ETFS.items():

    price = get_price(ticker)

    # echte Stückzahl beim Kauf
    shares = START_CAPITAL / price

    # aktueller Wert
    value = shares * price

    portfolio["depots"][name] = {
        "ticker": ticker,
        "buy_price": price,
        "shares": shares,
        "current_price": price,
        "value": value,
        "profit": value - START_CAPITAL
    }

# speichern
with open("py-data/portfolio.json", "w") as f:
    json.dump(portfolio, f, indent=2)

print(portfolio)