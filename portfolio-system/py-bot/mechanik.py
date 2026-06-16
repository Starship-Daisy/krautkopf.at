import os
import json
import re
from datetime import datetime
from openai import OpenAI

# API-Client initialisieren (erwartet OPENAI_API_KEY in den GitHub Secrets)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ==========================================
# DEFINITION DER DREI PERSONAS & PROMPTS
# ==========================================
PROMPT_PERSONA_1 = """Du bist Persona 1: Der risikoaffine Krypto- und Tech-Investor. 
Deine Strategie basiert auf maximalem Wachstum. Analysiere die aktuelle Marktlage aus deiner Sicht 
und mache einen konkreten Vorschlag für die Aktien-/Kryptoquote (0-100%)."""

PROMPT_PERSONA_2 = """Du bist Persona 2: Der konservative Value-Investor (Typ Warren Buffett). 
Du hast die Analyse von Persona 1 gehört. Kritisiere sie konstruktiv aus Sicht des Risikomanagements 
und bringe deine eigene prozentuale Empfehlung ein."""

PROMPT_PERSONA_3 = """Du bist Persona 3: Der pragmatische Mediator und Makro-Ökonom. 
Du hast die Argumente von Persona 1 (Wachstum) und Persona 2 (Sicherheit) gehört. 
Deine Aufgabe ist es, die Diskussion zusammenzufassen und eine finale, bindende Entscheidung 
für die Portfolio-Ausrichtung (0-100%) zu treffen.

WICHTIG: Du MUSST deine finale Prozentzahl am Ende deiner Antwort exakt in diesem JSON-Format ausgeben:
[[STRATEGY_SCORE: X]]
(Ersetze X durch eine Zahl zwischen 0 und 100, z.B. [[STRATEGY_SCORE: 65]])"""

def diskussion_fuehren():
    print("Starte KI-Aufsichtsratssitzung...")
    
    # 1. Persona 1 generiert ihre Analyse
    response_1 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": PROMPT_PERSONA_1}]
    )
    analysis_1 = response_1.choices[0].message.content
    print("\n--- Persona 1 spricht ---")
    print(analysis_1[:200] + "...") # Gekürzte Ausgabe für das GitHub-Log

    # 2. Persona 2 reagiert auf Persona 1
    response_2 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": PROMPT_PERSONA_2},
            {"role": "user", "content": f"Hier ist der Vorschlag von Persona 1:\n{analysis_1}"}
        ]
    )
    analysis_2 = response_2.choices[0].message.content
    print("\n--- Persona 2 spricht ---")
    print(analysis_2[:200] + "...")

    # 3. Persona 3 vermittelt und entscheidet
    response_3 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": PROMPT_PERSONA_3},
            {"role": "user", "content": f"Hier ist die Debatte:\n\nP1: {analysis_1}\n\nP2: {analysis_2}"}
        ]
    )
    final_decision = response_3.choices[0].message.content
    print("\n--- Persona 3 (Entscheidung) ---")
    print(final_decision)
    
    return final_decision

def score_extrahieren(text):
    # Sucht nach dem Muster [[STRATEGY_SCORE: X]] im Text
    match = re.search(r"\[\[STRATEGY_SCORE:\s*(\d+)\]\]", text)
    if match:
        return int(match.group(1))
    else:
        print("WARNUNG: Kein Score im Text gefunden. Setze Standardwert 50.")
        return 50

def daten_speichern(score):
    json_path = "py-data/strategy_history.json"
    
    # Ordner erstellen, falls er nicht existiert
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    # Bestehende Daten laden
    if os.path.exists(json_path):
        try:
            with open(json_path, "r") as f:
                data = json.load(f)
        except json.JSONDecodeError:
            data = []
    else:
        data = []
        
    # Neuen Datenpunkt hinzufügen
    heute = datetime.now().strftime("%Y-%m-%d")
    data.append({
        "date": heute,
        "score": score
    })
    
    # Datei speichern
    with open(json_path, "w") as f:
        json.dump(data, f, indent=4)
    print(f"\nErfolgreich gespeichert: {heute} -> Score: {score}")

if __name__ == "__main__":
    ki_text = diskussion_fuehren()
    score = score_extrahieren(ki_text)
    daten_speichern(score)