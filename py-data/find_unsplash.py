import os
import re
import json
import requests

API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]

pattern = r'https://images\.unsplash\.com/([^"\']+)'

seen_images = set()

found = []

for root, dirs, files in os.walk("."):

    for file in files:

        # Nur HTML-Dateien
        if not file.endswith(".html"):
            continue

        # Credits-Seiten ignorieren
        if "credits" in file.lower():
            continue

        path = os.path.join(root, file)

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Unsplash URLs finden
        matches = re.findall(pattern, content)

        for image in matches:

            # Query-Parameter entfernen
            image_id = image.split("?")[0]

            # Duplikate vermeiden
            if image_id in seen_images:
                continue

            seen_images.add(image_id)

            print("")
            print("Datei:", path)
            print("Unsplash ID:", image_id)

            # Unsplash API abfragen
            response = requests.get(
                f"https://api.unsplash.com/photos/{image_id}",
                params={
                    "client_id": API_KEY
                }
            )

            if response.status_code == 200:

                data = response.json()

                photographer = data["user"]["name"]
                profile = data["user"]["links"]["html"]
                image_url = data["links"]["html"]
                thumbnail = data["urls"]["thumb"]

                print("Fotograf:", photographer)
                print("Profil:", profile)
                print("Bild:", image_url)

                found.append({
                    "file": path,
                    "image_id": image_id,
                    "photographer": photographer,
                    "profile": profile,
                    "image_url": image_url,
                    "thumbnail": thumbnail
                })

            else:

                print("Unsplash Fehler:", response.status_code)

                found.append({
                    "file": path,
                    "image_id": image_id,
                    "photographer": "unbekannt",
                    "profile": "",
                    "image_url": "",
                    "thumbnail": ""
                })

            print("---")


# JSON-Datei erzeugen
output_file = "py-data/unsplash_credits.json"

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(
        found,
        f,
        indent=2,
        ensure_ascii=False
    )


print("")
print("Fertig.")
print("Einzigartige Bilder gefunden:", len(seen_images))
print("Gespeichert:", output_file)