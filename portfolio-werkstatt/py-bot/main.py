import yfinance as yf
from datetime import datetime
import json

# ETFs
ESG = "ESG.DE"
CLEAN = "INRG.L"
WORLD = "VWCE.DE"

def get_price(ticker):
    data = yf.Ticker(ticker)
    return data.history(period="1d")["Close"].iloc[-1]

# Preise holen
esg_price = get_price(ESG)
clean_price = get_price(CLEAN)
world_price = get_price(WORLD)

# Startwerte (500€ pro Depot)
start = 500

# einfache Simulation (1 ETF Anteil Logik vereinfacht)
portfolio = {
    "date": str(datetime.now().date()),
    "DepotA": start * (esg_price / esg_price),   # später echte Stückzahl
    "DepotB": start * (clean_price / clean_price),
    "DepotC": start * (world_price / world_price)
}

# speichern
with open("portfolio.json", "w") as f:
    json.dump(portfolio, f, indent=2)

print(portfolio)