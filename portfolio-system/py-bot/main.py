import os
import json
import urllib.request
from datetime import datetime

# -------------------------------------------------------------------
# DEIN MUSTERDEPOT (Startkapital: Exakt 5.000 € Gesamt)
# -------------------------------------------------------------------
START_CASH = 2000.0

TEST_DEPOT = {
    "MSCI World (EUNL.DE)": {"ticker": "EUNL.DE", "shares": 10.0},
    "Clean Energy (INRG.L)": {"ticker": "INRG.L", "shares": 1.1},
    "Vanguard All-World (VWCE.DE)": {"ticker": "VWCE.DE", "shares": 6.0}
}

def live_kurs_holen(ticker):
    """Holt den aktuellen Kurs live von Yahoo Finance"""
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            daten = json.loads(response.read().decode())
            result = daten["quoteResponse"]["result"]
            if result:
                preis = float(result[0]["regularMarketPrice"])
                if ticker == "INRG.L":
                    preis = preis / 100 * 1.2  # Grobe Umrechnung Pence in Euro
                return preis
    except Exception as e:
        print(f"Fehler beim Laden von {ticker}: {e}")
    return 0.0

def musterdepot_berechnen():
    print("🔄 Starte Live-Kurs-Abfrage für das 5.000 € Musterdepot...")
    
    gesamt_wert_assets = 0.0
    heute = datetime.now().strftime("%Y-%m-%d")
    
    # Hier speichern wir die Einzelwerte für den Chart
    chart_eintrag = {
        "date": heute,
        "Cash": START_CASH
    }

    for name, info in TEST_DEPOT.items():
        ticker = info["ticker"]
        shares = info["shares"]
        
        preis = live_kurs_holen(ticker)
        wert = shares * preis
        gesamt_wert_assets += wert
        
        # Den aktuellen Wert dieses spezifischen ETFs für den Chart sichern
        chart_eintrag[name] = round(wert, 2)
        print(f"  -> {name}: {shares} Stück à {preis:.2f}€ = {wert:.2f}€")

    # Gesamtsumme hinzufügen
    chart_eintrag["Total"] = round(START_CASH + gesamt_wert_assets, 2)

    # 1. Daten für das KI-Skript bereitstellen
    export_daten = {
        "cash_euro": START_CASH,
        "risk_assets_euro": gesamt_wert_assets
    }
    os.makedirs("py-data", exist_ok=True)
    with open("py-data/ist_portfolio.json", "w") as f:
        json.dump(export_daten, f, indent=4)

    # 2. Verlauf für den Chart auf der Webseite speichern
    historie_path = "py-data/portfolio_history.json"
    historie_daten = []
    
    if os.path.exists(historie_path):
        try:
            with open(historie_path, "r") as f:
                historie_daten = json.load(f)
        except:
            historie_daten = []

    # Wenn am selben Tag schon ein Eintrag da ist, überschreiben, sonst neu anhängen
    if historie_daten and historie_daten[-1].get("date") == heute:
        historie_daten[-1] = chart_eintrag
    else:
        historie_daten.append(chart_eintrag)

    with open(historie_path, "w") as f:
        json.dump(historie_daten, f, indent=4)
        
    print("\n" + " CHART-DATEN AKTUALISIERT ".center(40, "="))
    print(f"Gespeichert in 'portfolio_history.json':\n{json.dumps(chart_eintrag, indent=2)}")
    print("=" * 40 + "\n")

if __name__ == "__main__":
    musterdepot_berechnen()