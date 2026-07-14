import os
import re

# Dateien, die nicht gescannt werden sollen
if "credits" in file.lower():
    continue

# Unsplash-URLs finden
pattern = r'https://images\.unsplash\.com/([^"\']+)'

# Bereits gefundene Bilder speichern
seen_images = set()

# Gefundene Bilder sammeln
found = []

for root, dirs, files in os.walk("."):
    for file in files:

        # Nur HTML-Dateien
        if not file.endswith(".html"):
            continue

        # Ausgeschlossene Dateien überspringen
        if file in EXCLUDED_FILES:
            continue

        path = os.path.join(root, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            matches = re.findall(pattern, content)

            for image in matches:

                # Query-Parameter entfernen
                image_id = image.split("?")[0]

                # Duplikate vermeiden
                if image_id in seen_images:
                    continue

                seen_images.add(image_id)

                found.append({
                    "file": path,
                    "image_id": image_id
                })

        except Exception as e:
            print(f"Fehler beim Lesen von {path}: {e}")

# Ausgabe
for item in found:
    print("Datei:", item["file"])
    print("Unsplash ID:", item["image_id"])
    print("---")

print(f"Einzigartige Bilder gefunden: {len(found)}")