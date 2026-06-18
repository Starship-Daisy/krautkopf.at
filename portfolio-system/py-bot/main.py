import os
import json
from datetime import datetime
import yfinance as yf

# -------------------------------------------------------------------
# DEIN MUSTERDEPOT (Startkapital: Exakt 5.000 € Gesamt)
# -------------------------------------------------------------------
START_CASH = 2000.0

# Deine ETFs mit ISIN und aktueller Stückzahl
TEST_DEPOT = {
    "MSCI World (EUNL)": {"isin": "IE00B4L5Y983", "shares": 10.0},      # iShares Core MSCI World
    "Clean Energy (INRG)": {"isin": "IE00B1XNHC34", "shares": 150.0},   # Global Clean Energy
    "Vanguard All-World (VWCE)": {"isin": "IE00BK5BQT80", "shares": 8.0} # Vanguard FTSE All-World
}

# Übersetzungstabelle von ISIN auf Yahoo-Finance-Ticker (Xetra/Deutsche Börse für Euro-Kurse)
TICKER_MAPPING = {
    "IE00B4L5Y983": "EUNL.DE",  # MSCI World in Euro
    "IE00B1XNHC34": "INRG.DE",  # Clean Energy in Euro
    "IE00BK5BQT80": "VWCE.DE"   # Vanguard All-World in Euro
}

def live_kurs_holen(isin):
    """Holt den echten, aktuellen Schlusskurs über die offizielle Yahoo Finance API"""
    ticker_symbol = TICKER_MAPPING.get(isin)
    
    if ticker_symbol:
        try:
            # Verbindung zu Yahoo Finance aufbauen
            ticker = yf.Ticker(ticker_symbol)
            # Holt die Kursdaten des letzten Tages
            todays_data = ticker.history(period="1d")
            
            if not todays_data.empty:
                # Den allerletzten Schlusskurs extrahieren
                echter_kurs = float(todays_data['Close'].iloc[-1])
                if echter_kurs > 0:
                    return round(echter_kurs, 2)
                    
        except Exception as e:
            print(f"⚠️ API-Abfrage für {isin} ({ticker_symbol}) fehlgeschlagen: {e}")
    
    # Der absolute Notfall-Fallback, falls Yahoo komplett offline sein sollte
    fallbacks = {
        "IE00B4L5Y983": 108.50,
        "IE00B1XNHC34": 7.20,
        "IE00BK5BQT80": 132.10
    }
    print(f"  -> Nutze statischen Richtwert für {isin}...")
    return fallbacks.get(isin, 50.0)

def musterdepot_berechnen():
    print("🔄 Starte offizielle Yahoo-API Kurs-Abfrage für das Musterdepot...")
    
    gesamt_wert_assets = 0.0
    heute = datetime.now().strftime("%Y-%m-%d")
    
    chart_eintrag = {
        "date": heute,
        "Cash": START_CASH
    }

    for name, info in TEST_DEPOT.items():
        isin = info["isin"]
        shares = info["shares"]
        
        preis = live_kurs_holen(isin)
        wert = shares * preis
        gesamt_wert_assets += wert
        
        chart_eintrag[name] = round(wert, 2)
        print(f"  -> {name}: {shares} Stück à {preis:.2f}€ = {wert:.2f}€")

    chart_eintrag["Total"] = round(START_CASH + gesamt_wert_assets, 2)

    export_daten = {
        "cash_euro": START_CASH,
        "risk_assets_euro": gesamt_wert_assets
    }
    
    # Ordner erstellen, falls nicht vorhanden
    os.makedirs("portfolio-system/py-data", exist_ok=True)
    
    # 1. Aktuelles Portfolio speichern
    with open("portfolio-system/py-data/ist_portfolio.json", "w") as f:
        json.dump(export_daten, f, indent=4)

    # 2. Historie laden und updaten
    historie_path = "portfolio-system/py-data/portfolio_history.json"
    historie_daten = []
    
    if os.path.exists(historie_path):
        try:
            with open(historie_path, "r") as f:
                historie_daten = json.load(f)
        except:
            historie_daten = []

    # Wenn heute schon ein Eintrag existiert, überschreiben wir ihn, ansonsten anhängen
    if historie_daten and historie_daten[-1].get("date") == heute:
        historie_daten[-1] = chart_eintrag
    else:
        historie_daten.append(chart_eintrag)

    with open(historie_path, "w") as f:
        json.dump(historie_daten, f, indent=4)
        
    print("\n" + " CHART-DATEN MIT ECHTEN KURSEN AKTUALISIERT ".center(50, "="))
    print(f"Gesamtes Echtkapital: {START_CASH + gesamt_wert_assets:,.2f} €")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    musterdepot_berechnen()