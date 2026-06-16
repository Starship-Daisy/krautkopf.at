import os
import json
import re
from datetime import datetime
from openai import OpenAI

# API-Client für OpenRouter initialisieren
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
)

# MODELL-AUSWAHL
MODEL_NAME = "anthropic/claude-3.5-sonnet"

# -------------------------------------------------------------------
# PERSONA-PROMPTS
# -------------------------------------------------------------------
P1_PROMPT = (
    "Du bist ein risikoaffiner Krypto- und Tech-Investor. Dein Fokus liegt auf "
    "disruptivem Wachstum und technologischen Trends. Analysiere kurz die aktuelle "
    "Marktlage aus deiner Sicht und schlage eine aggressive Ziel-Aktien/Kryptoquote vor."
)

P2_PROMPT = (
    "Du bist ein konservativer Value-Investor im Stile von Warren Buffett. "
    "Sicherheit, Cashflow und Fundamentaldaten sind dir wichtig. Du hörst jetzt die "
    "Meinung eines Tech-Investors. Kritisiere seine Sichtweise konstruktiv und "
    "bringe deine eigene, defensive Quote ein."
)

P3_PROMPT = (
    "Du bist ein pragmatischer Mediator und Makro-Ökonom. Du hast die Argumente "
    "des Tech-Investors (Wachstum) und des Value-Investors (Sicherheit) gehört. "
    "Deine Aufgabe ist es, einen finalen, bindenden Kompromiss für die Gesamt-Portfolioquote "
    "festzulegen (Zahl von 0 bis 100).\n\n"
    "REGELN FÜR DEINE ANTWORT:\n"
    "1. Halte deine Begründung extrem kurz (max. 3 Sätze).\n"
    "2. Beende deine Nachricht zwingend und ausnahmslos mit dem Tag: [[STRATEGY_SCORE: X]]\n"
    "   Ersetze X mit der finalen Prozentzahl, z.B. [[STRATEGY_SCORE: 65]]."
)

def diskussion_fuehren():
    print(f"Starte KI-Aufsichtsratssitzung via OpenRouter ({MODEL_NAME})...")
    
    extra_headers = {
        "HTTP-Referer": "https://krautkopf.at", 
        "X-Title": "Portfolio Mechanik Bot"
    }

    # SCHRITT 1: Persona 1 generiert These
    print("Rufe Persona 1 (Tech) ab...")
    res_1 = client.chat.completions.create(
        model=MODEL_NAME,
        extra_headers=extra_headers,
        messages=[{"role": "user", "content": P1_PROMPT}]
    )
    p1_text = res_1.choices[0].message.content
    print(f"\n[Persona 1 - Tech]: {p1_text}\n" + "-"*40)

    # SCHRITT 2: Persona 2 reagiert
    print("Rufe Persona 2 (Value) ab...")
    res_2 = client.chat.completions.create(
        model=MODEL_NAME,
        extra_headers=extra_headers,
        messages=[
            {"role": "system", "content": P2_PROMPT},
            {"role": "user", "content": f"Hier ist das Statement des Tech-Investors:\n\n{p1_text}"}
        ]
    )
    p2_text = res_2.choices[0].message.content
    print(f"\n[Persona 2 - Value]: {p2_text}\n" + "-"*40)

    # SCHRITT 3: Persona 3 entscheidet
    print("Rufe Persona 3 (Mediator) ab...")
    debatte = f"Zusammenfassung der Debatte:\n\nTech-Investor:\n{p1_text}\n\nValue-Investor:\n{p2_text}"
    res_3 = client.chat.completions.create(
        model=MODEL_NAME,
        extra_headers=extra_headers,
        messages=[
            {"role": "system", "content": P3_PROMPT},
            {"role": "user", "content": debatte}
        ]
    )
    p3_text = res_3.choices[0].message.content
    print(f"\n[Persona 3 - Entscheidung]:\n{p3_text}\n" + "="*40)
    
    return p3_text

def score_extrahieren(text):
    """Extrahiert die Zahl aus [[STRATEGY_SCORE: X]] per Regex"""
    match = re.search(r"\[\[STRATEGY_SCORE:\s*(\d+)\]\]", text)
    if match:
        score = int(match.group(1))
        if 0 <= score <= 100:
            return score
            
    print("WARNUNG: Striktes Format nicht gefunden. Starte Fallback-Suche...")
    zahlen = re.findall(r"\d+", text)
    if zahlen:
        last_num = int(zahlen[-1])
        if 0 <= last_num <= 100:
            return last_num
            
    return 50 

def daten_speichern(score):
    """Schreibt den Datenpunkt sauber in die strategy_history.json"""
    json_path = "py-data/strategy_history.json"
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    if os.path.exists(json_path):
        try:
            with open(json_path, "r") as f:
                data = json.load(f)
        except:
            data = []
    else:
        data = []
        
    heute = datetime.now().strftime("%Y-%m-%d")
    
    if data and data[-1].get("date") == heute:
        data[-1]["score"] = score
    else:
        data.append({"date": heute, "score": score})
    
    with open(json_path, "w") as f:
        json.dump(data, f, indent=4)
    print(f"Erfolg: {heute} -> Score {score}% im Verlauf gespeichert.")

if __name__ == "__main__":
    try:
        ki_antwort = diskussion_fuehren()
        finaler_score = score_extrahieren(ki_antwort) # Korrigierte Übergabe
        daten_speichern(finaler_score)
    except Exception as e:
        print(f"KRITISCHER FEHLER IM BOT-ABLAUF: {str(e)}")
        