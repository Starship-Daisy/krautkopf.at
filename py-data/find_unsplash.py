import os
import re

import requests

API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]


# Sucht nach direkten Unsplash-Bild-URLs
pattern = r'https://images\.unsplash\.com/([^"\']+)'

# Hier speichern wir bereits gefundene Bilder
seen_images = set()

# Ergebnisse
found = []

# Alle Dateien im Repository durchsuchen
for root, dirs, files in os.walk("."):

    for file in files:

        # Nur HTML-Dateien prüfen
        if not file.endswith(".html"):
            continue

        # Credits-Seiten ignorieren
        if "credits" in file.lower():
            continue

        path = os.path.join(root, file)

        # HTML-Datei lesen
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Unsplash URLs finden
        matches = re.findall(pattern, content)

        for image in matches:

            # Parameter entfernen (?q=80&w=...)
            image_id = image.split("?")[0]

            # Doppelte Bilder ignorieren
            if image_id in seen_images:
                continue

            seen_images.add(image_id)

        found.append({
            "file": path,
            "image_id": image_id
            })

            # Unsplash Daten abrufen
        response = requests.get(
        f"https://api.unsplash.com/photos/{image_id}",
        params={
        "client_id": API_KEY
    })

if response.status_code == 200:
    data = response.json()

    print("Fotograf:", data["user"]["name"])
    print("Profil:", data["user"]["links"]["html"])
    print("Bild:", data["links"]["html"])
    print("---")

else:
    print("Fehler bei Unsplash:", response.status_code)


# Ausgabe
print("")
print("=== Gefundene Unsplash Bilder ===")
print("")

for item in found:
    print("Datei:", item["file"])
    print("Unsplash ID:", item["image_id"])
    print("---")

print("")
print("Einzigartige Bilder gefunden:", len(found))