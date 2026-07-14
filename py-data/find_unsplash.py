import os
import re
import json
import requests


API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]


# Findet alle direkt eingebundenen Unsplash-Bilder
pattern = r'https://images\.unsplash\.com/([^"\']+)'


seen_images = set()
found = []


for root, dirs, files in os.walk("."):

    for file in files:

        # Nur HTML-Dateien prüfen
        if not file.endswith(".html"):
            continue

        # Credits-Seite nicht scannen
        if "credits" in file.lower():
            continue


        path = os.path.join(root, file)


        with open(path, "r", encoding="utf-8") as f:
            content = f.read()


        images = re.findall(pattern, content)


        for image in images:

            # Nur die Unsplash-ID extrahieren
            image_id = image.split("?")[0]


            # Doppelte Bilder vermeiden
            if image_id in seen_images:
                continue


            seen_images.add(image_id)


            print("")
            print("Datei:", path)
            print("Bild:", image_id)


            # Direkter Abruf über Unsplash-ID
            response = requests.get(
                f"https://api.unsplash.com/photos/{image_id}",
                params={
                    "client_id": API_KEY
                }
            )


            if response.status_code == 200:

                photo = response.json()


                item = {
                    "file": path,
                    "image_id": image_id,
                    "photographer": photo["user"]["name"],
                    "profile": photo["user"]["links"]["html"],
                    "image_url": photo["links"]["html"],
                    "thumbnail": photo["urls"]["thumb"]
                }


                found.append(item)


                print("Fotograf:", item["photographer"])
                print("Profil:", item["profile"])


            else:

                print("Unsplash Fehler:", response.status_code)

                found.append({
                    "file": path,
                    "image_id": image_id,
                    "photographer": "nicht gefunden",
                    "profile": "",
                    "image_url": "",
                    "thumbnail": ""
                })


            print("---")



# JSON speichern

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
print("Einzigartige Bilder:", len(seen_images))
print("Gespeichert:", output_file)