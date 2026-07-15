import os
import json
import requests


# --------------------------------------------------
# Unsplash API Key aus GitHub Secret
# --------------------------------------------------

API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]


# --------------------------------------------------
# Dateien
# --------------------------------------------------

INPUT_FILE = "py-data/images_found.json"

OUTPUT_FILE = "py-data/images_metadata.json"



# --------------------------------------------------
# Bilder laden
# --------------------------------------------------

with open(
    INPUT_FILE,
    "r",
    encoding="utf-8"
) as f:

    images = json.load(f)



results = []



# --------------------------------------------------
# Unsplash Daten abrufen
# --------------------------------------------------

for image in images:


    image_url = image["image_url"]


    print("")
    print("--------------------------")
    print("Bearbeite:")
    print(image_url)



    # --------------------------------------------------
    # Unsplash ID aus CDN URL holen
    # --------------------------------------------------

    filename = image_url.split("/")[-1]

    photo_id = filename



    # --------------------------------------------------
    # API Anfrage
    # --------------------------------------------------

    response = requests.get(

        f"https://api.unsplash.com/photos/{photo_id}",

        params={
            "client_id": API_KEY
        }

    )



    entry = {


        "source": image["source"],

        "file": image["file"],

        "image_url": image_url,


        "photographer": "",

        "profile": "",

        "unsplash_page": "",


        "description": "",

        "alt_description": "",


        "alt_text": "",


        "thumbnail": "",


        "status": "needs_review"

    }



    if response.status_code == 200:


        data = response.json()



        entry["photographer"] = (
            data["user"]["name"]
        )


        entry["profile"] = (
            data["user"]["links"]["html"]
        )


        entry["unsplash_page"] = (
            data["links"]["html"]
        )


        entry["description"] = (
            data.get("description") or ""
        )


        entry["alt_description"] = (
            data.get("alt_description") or ""
        )


        entry["thumbnail"] = (
            data["urls"]["thumb"]
        )



        print(
            "Fotograf:",
            entry["photographer"]
        )


        print(
            "Alt:",
            entry["alt_description"]
        )



    else:


        print(
            "API Fehler:",
            response.status_code
        )


        print(
            "ID:",
            photo_id
        )



    results.append(entry)



# --------------------------------------------------
# JSON speichern
# --------------------------------------------------

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as f:


    json.dump(

        results,

        f,

        indent=2,

        ensure_ascii=False

    )



print("")
print("==========================")
print("Fertig")
print(
    "Einträge:",
    len(results)
)

print(
    "Gespeichert:",
    OUTPUT_FILE
)