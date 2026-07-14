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


        images = re.findall(pattern, content)


        for image in images:

            image_url_part = image.split("?")[0]

            if image_url_part in seen_images:
                continue

            seen_images.add(image_url_part)


            print("")
            print("Datei:", path)
            print("Bild:", image_url_part)


            # Suche über Unsplash API
            response = requests.get(
                "https://api.unsplash.com/search/photos",
                params={
                    "client_id": API_KEY,
                    "query": image_url_part
                }
            )


            if response.status_code == 200:

                data = response.json()


                if data["total"] > 0:

                    photo = data["results"][0]


                    item = {
                        "file": path,
                        "image_id": photo["id"],
                        "photographer": photo["user"]["name"],
                        "profile": photo["user"]["links"]["html"],
                        "image_url": photo["links"]["html"],
                        "thumbnail": photo["urls"]["thumb"]
                    }


                    found.append(item)


                    print("Unsplash ID:", photo["id"])
                    print("Fotograf:", item["photographer"])
                    print("Profil:", item["profile"])


                else:

                    print("Kein Treffer gefunden")


            else:

                print("Unsplash Fehler:", response.status_code)


            print("---")



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