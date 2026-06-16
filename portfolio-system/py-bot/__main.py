import yfinance as yf
from datetime import datetime
import json
import os

# HIER DEINE ANTEILE EINTRAGEN (Beispiel-Werte):
ETFS = {
    "DepotA": {"ticker": "ESG.DE", "shares": 12.5},
    "DepotB": {"ticker": "INRG.L", "shares": 45.2},
    "DepotC": {"ticker": "VWCE.DE", "shares": 4.8}
}

def get_price(ticker):
    try:
        data = yf.Ticker(ticker)
        return data.history(period="1d")["Close"].iloc[-1]
    except Exception as e:
        print(f"Fehler beim Laden von {ticker}: {e}")
        return 0

# Basis-Struktur für das aktuelle Portfolio
portfolio = {
    "date": str(datetime.now().date()),
    "depots": {}
}

# Schleife berechnet den aktuellen Wert basierend auf deinen Anteilen
for name, info in ETFS.items():
    ticker = info["ticker"]
    shares = info["shares"]
    
    # Aktuellen Preis live abfragen
    current_price = get_price(ticker)
    
    # Aktueller Gesamtwert = Anzahl der Anteile * aktueller Preis
    current_value = shares * current_price

    # Daten im Dictionary speichern
    portfolio["depots"][name] = {
        "ticker": ticker,
        "shares": shares,
        "current_price": current_price,
        "value": current_value
    }

# Ordner erstellen, falls er noch nicht existiert
os.makedirs("py-data", exist_ok=True)

# 1. Aktuelles Portfolio speichern (portfolio.json)
with open("py-data/portfolio.json", "w") as f:
    json.dump(portfolio, f, indent=2)

print("Aktuelles Portfolio gespeichert:", portfolio)


# ==========================================
# HISTORIE SPEICHERN (für den Chart)
# ==========================================
history_file = "py-data/history.json"

# Historie laden oder neu erstellen
if os.path.exists(history_file):
    with open(history_file, "r") as f:
        try:
            history = json.load(f)
        except:
            history = []
else:
    history = []

if not isinstance(history, list):
    history = []

# Neuer Eintrag für den Chart (holt die echten Werte aus der Schleife oben)
new_entry = {
    "date": str(datetime.now().date()),
    "DepotA": portfolio["depots"]["DepotA"]["value"],
    "DepotB": portfolio["depots"]["DepotB"]["value"],
    "DepotC": portfolio["depots"]["DepotC"]["value"]
}

history.append(new_entry)

print("DEBUG NEUER HISTORIE-EINTRAG:", new_entry)

# Historie abspeichern
with open(history_file, "w") as f:
    json.dump(history, f, indent=2)