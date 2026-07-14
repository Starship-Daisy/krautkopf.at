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

        if not file.endswith(".html"):
            continue

        if "credits" in file.lower():
            continue

        path = os.path.join(root, file)

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        matches = re.findall(pattern, content)

        for image in matches:

            image_id = image.split("?")[0]

            if image_id in seen_images:
                continue

            seen_images.add(image_id)

            print("")
            print("Datei:", path)
            print("Bild:", image_id)

            # Unsplash Suche
            response = requests.get(
                "https://api.unsplash.com/search/photos",
                params={
                    "client_id": API_KEY,
                    "query": image_id
                }
            )

            if response.status_code == 200:

                data = response.json()

                if data["total"] > 0:

                    photo = data["results"][0]

                    photographer = photo["user"]["name"]
                    profile = photo["user"]["links"]["html"]
                    image_url = photo["links"]["html"]
                    thumbnail = photo["urls"]["thumb"]

                    print("Fotograf:", photographer)
                    print("Profil:", profile)

                    found.append({
                        "file": path,
                        "image_id": image_id,
                        "photographer": photographer,
                        "profile": profile,
                        "image_url": image_url,
                        "thumbnail": thumbnail
                    })

                else:

                    print("Kein Treffer gefunden")

            else:

                print("Unsplash Fehler:", response.status_code)

            print("---")


# JSON-Datei schreiben

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