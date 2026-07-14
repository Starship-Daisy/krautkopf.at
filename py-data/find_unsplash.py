import os
import re
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
            print("Unsplash ID:", image_id)

            response = requests.get(
                f"https://api.unsplash.com/photos/{image_id}",
                params={
                    "client_id": API_KEY
                }
            )

            if response.status_code == 200:
                data = response.json()

                print("Fotograf:", data["user"]["name"])
                print("Profil:", data["user"]["links"]["html"])
                print("Bild:", data["links"]["html"])

            else:
                print("Unsplash Fehler:", response.status_code)

            print("---")


print("")
print("Fertig.")
print("Einzigartige Bilder gefunden:", len(seen_images))