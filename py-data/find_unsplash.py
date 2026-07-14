import os
import re
import json
import requests


API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]


# findet alle Unsplash Bilder in HTML
pattern = r'https://images\.unsplash\.com/([^"\']+)'


seen = set()
found = []


for root, dirs, files in os.walk("."):

    for file in files:

        if not file.endswith(".html"):
            continue

        # Credits-Seite nicht durchsuchen
        if "credits" in file.lower():
            continue


        path = os.path.join(root, file)


        with open(path, "r", encoding="utf-8") as f:
            html = f.read()


        images = re.findall(pattern, html)


        for image in images:


            # nur die URL ohne Parameter
            image_url = "https://images.unsplash.com/" + image.split("?")[0]


            if image_url in seen:
                continue

            seen.add(image_url)


            print("")
            print("Datei:", path)
            print("Bild:", image_url)


            # Unsplash API: Bild direkt suchen
            response = requests.get(
                "https://api.unsplash.com/photos",
                params={
                    "client_id": API_KEY,
                    "query": image.split("?")[0]
                }
            )


            entry = {
                "file": path,
                "image_url": image_url,
                "photographer": "nicht gefunden",
                "profile": "",
                "thumbnail": ""
            }


            if response.status_code == 200:

                data = response.json()


                if len(data) > 0:

                    photo = data[0]

                    entry["photographer"] = photo["user"]["name"]
                    entry["profile"] = photo["user"]["links"]["html"]
                    entry["thumbnail"] = photo["urls"]["thumb"]

                    print("Fotograf:", entry["photographer"])
                    print("Profil:", entry["profile"])

                else:
                    print("Kein Treffer")


            else:
                print("API Fehler:", response.status_code)


            found.append(entry)

            print("---")



# JSON speichern

output = "py-data/unsplash_credits.json"


with open(output, "w", encoding="utf-8") as f:

    json.dump(
        found,
        f,
        indent=2,
        ensure_ascii=False
    )


print("")
print("Fertig.")
print("Bilder gefunden:", len(found))
print("Gespeichert:", output)