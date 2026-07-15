import os
import json
import requests


# --------------------------------------------------
# Unsplash API Key
# --------------------------------------------------

API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]


# --------------------------------------------------
# Dateien
# --------------------------------------------------

INPUT_FILE = "py-data/images_found.json"

OUTPUT_FILE = "py-data/images_metadata.json"



# --------------------------------------------------
# Eingabe laden
# --------------------------------------------------

with open(
    INPUT_FILE,
    "r",
    encoding="utf-8"
) as f:

    images = json.load(f)



results = []



# --------------------------------------------------
# Unsplash API Funktionen
# --------------------------------------------------

def get_photo_data(photo_id):

    response = requests.get(

        f"https://api.unsplash.com/photos/{photo_id}",

        params={
            "client_id": API_KEY
        }

    )

    if response.status_code == 200:
        return response.json()

    return None



def search_photo(search_term):

    response = requests.get(

        "https://api.unsplash.com/search/photos",

        params={

            "client_id": API_KEY,

            "query": search_term,

            "per_page": 5

        }

    )


    if response.status_code != 200:
        return None


    data = response.json()


    if len(data["results"]) == 0:
        return None


    return data["results"][0]



# --------------------------------------------------
# Bilder verarbeiten
# --------------------------------------------------

for image in images:


    image_url = image["image_url"]


    print("")
    print("--------------------------")
    print("Bearbeite:")
    print(image_url)



    entry = {


        "source": "unsplash",

        "file": image["file"],

        "image_url": image_url,


        "unsplash_id": "",


        "photographer": "",

        "profile": "",

        "unsplash_page": "",


        "description": "",

        "alt_description": "",


        "alt_text": "",


        "thumbnail": "",


        "status": "needs_review"

    }



    photo = None



    # --------------------------------------------------
    # Möglichkeit 1:
    # zukünftige manuelle ID
    # --------------------------------------------------

    if "unsplash_id" in image and image["unsplash_id"]:


        print(
            "Nutze vorhandene ID:",
            image["unsplash_id"]
        )


        photo = get_photo_data(
            image["unsplash_id"]
        )



    # --------------------------------------------------
    # Möglichkeit 2:
    # Suche über CDN-Datei
    # --------------------------------------------------

    if photo is None:


        filename = image_url.split("/")[-1]


        print(
            "Suche:",
            filename
        )


        photo = search_photo(
            filename
        )



    # --------------------------------------------------
    # Daten übernehmen
    # --------------------------------------------------

    if photo:


        entry["unsplash_id"] = photo["id"]


        entry["photographer"] = (
            photo["user"]["name"]
        )


        entry["profile"] = (
            photo["user"]["links"]["html"]
        )


        entry["unsplash_page"] = (
            photo["links"]["html"]
        )


        entry["description"] = (
            photo.get("description") or ""
        )


        entry["alt_description"] = (
            photo.get("alt_description") or ""
        )


        entry["thumbnail"] = (
            photo["urls"]["thumb"]
        )



        print(
            "ID:",
            entry["unsplash_id"]
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
            "Kein Unsplash Treffer gefunden"
        )


        entry["status"] = "not_found"



    results.append(entry)



# --------------------------------------------------
# Ergebnis speichern
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