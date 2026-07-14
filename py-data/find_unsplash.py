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