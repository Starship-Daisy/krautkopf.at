import os
import json
from datetime import datetime
import yfinance as yf

# -------------------------------------------------------------------
# DEPOT-KONFIGURATION
# -------------------------------------------------------------------
DEPOTS = {
    "DepotA": {"ticker": "CLIM.DE",  "shares": 12.5,  "name": "Global Green Bond (CLIM)"},
    "DepotB": {"ticker": "INRG.L",   "shares": 45.2,  "name": "Clean Energy (INRG)"},
    "DepotC": {"ticker": "VWCE.DE",  "shares": 4.8,   "name": "Vanguard All-World (VWCE)"},
    "DepotD": {"ticker": "PPFB.DE",  "shares": 11.0,  "name": "Gold ETC (PPFB)"},    # ~750€ bei ~68,71€/Stück
    "DepotE": {"ticker": "PPFD.DE",  "shares": 11.0,  "name": "Silber ETC (PPFD)"},  # ~750€ bei ~68,00€/Stück
}

DATA_DIR  = "portfolio-system/py-data"
PORT_PATH = f"{DATA_DIR}/portfolio.json"
HIST_PATH = f"{DATA_DIR}/history.json"

def live_kurs_holen(ticker):
    try:
        t = yf.Ticker(ticker)
        data = t.history(period="1d")
        if not data.empty:
            kurs = float(data['Close'].iloc[-1])
            if kurs > 0:
                return round(kurs, 6)
    except Exception as e:
        print(f"  ⚠️ Fehler bei {ticker}: {e}")
    # Fallback-Kurse (Stand 09/2026)
    fallbacks = {
        "CLIM.DE":  5.00,
        "INRG.L":   907.50,
        "VWCE.DE":  164.16,
        "PPFB.DE":  68.71,   # Gold ETC
        "PPFD.DE":  68.00,   # Silber ETC
    }
    print(f"  -> Nutze Fallback für {ticker}...")
    return fallbacks.get(ticker, 50.0)

def depots_berechnen():
    print("🔄 Starte Depot-Abfrage (A/B/C/D/E)...")
    heute = datetime.now().strftime("%Y-%m-%d")

    os.makedirs(DATA_DIR, exist_ok=True)

    portfolio_depots = {}
    history_eintrag  = {"date": heute}

    for depot_name, config in DEPOTS.items():
        ticker = config["ticker"]
        shares = config["shares"]
        label  = config.get("name", depot_name)

        preis = live_kurs_holen(ticker)
        wert  = round(shares * preis, 2)

        portfolio_depots[depot_name] = {
            "ticker":        ticker,
            "name":          label,
            "shares":        shares,
            "current_price": preis,
            "value":         wert
        }
        history_eintrag[depot_name] = wert

        print(f"  -> {label} ({ticker}): {shares} Stück à {preis:.2f}€ = {wert:.2f}€")

    # 1. portfolio.json schreiben
    with open(PORT_PATH, "w") as f:
        json.dump({"date": heute, "depots": portfolio_depots}, f, indent=2)

    # 2. history.json: heute überschreiben oder anhängen
    historie = []
    if os.path.exists(HIST_PATH):
        try:
            with open(HIST_PATH, "r") as f:
                historie = json.load(f)
        except:
            historie = []

    if historie and historie[-1].get("date") == heute:
        historie[-1] = history_eintrag
    else:
        historie.append(history_eintrag)

    with open(HIST_PATH, "w") as f:
        json.dump(historie, f, indent=2)

    gesamt = sum(d["value"] for d in portfolio_depots.values())
    print("\n" + " DEPOTS AKTUALISIERT ".center(50, "="))
    print(f"Gesamtwert aller Depots: {gesamt:,.2f} €")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    depots_berechnen()