from pathlib import Path
import json
import os
import requests


# ==================================================
# Pfade
# ==================================================

ROOT = Path(__file__).resolve().parents[2]


INPUT = (
    ROOT
    / "image-credits"
    / "py-data"
    / "data"
    / "images_found.json"
)


OUTPUT = (
    ROOT
    / "image-credits"
    / "py-data"
    / "data"
    / "images_metadata.json"
)


# ==================================================
# Unsplash API
# ==================================================

API_KEY = os.environ.get(
    "UNSPLASH_ACCESS_KEY"
)


if not API_KEY:
    raise Exception(
        "UNSPLASH_ACCESS_KEY fehlt"
    )


headers = {

    "Authorization":
        f"Client-ID {API_KEY}"

}


# ==================================================
# Unsplash ID aus URL holen
# ==================================================

def extract_photo_id(url):

    """
    Beispiel:

    https://images.unsplash.com/photo-1567244401854-5f3a2619804d

    """

    return url.split("/")[-1]



# ==================================================
# Daten laden
# ==================================================

with open(
    INPUT,
    "r",
    encoding="utf-8"
) as f:

    images = json.load(f)



results = []


# ==================================================
# Metadaten holen
# ==================================================

for image in images:


    url = image["image_url"]


    print("")
    print("--------------------------")
    print("Verarbeite:")
    print(url)


    photo_id = extract_photo_id(url)


    # --------------------------------------------------
    # API Suche
    # --------------------------------------------------

    response = requests.get(

        "https://api.unsplash.com/search/photos",

        headers=headers,

        params={
            "query": photo_id,
            "per_page": 1
        }

    )


    if response.status_code != 200:

        print(
            "API Fehler:",
            response.status_code
        )

        image["status"] = "api_error"

        results.append(image)

        continue



    data = response.json()



    if not data["results"]:

        print(
            "Kein Treffer"
        )

        image["status"] = "not_found"

        results.append(image)

        continue



    photo = data["results"][0]


    user = photo["user"]



    image.update({

        "photographer":
            user["name"],

        "profile":
            user["links"]["html"],

        "unsplash_page":
            photo["links"]["html"],

        "description":
            photo.get("description"),

        "alt_description":
            photo.get("alt_description"),

        "thumbnail":
            photo["urls"]["small"],

        "status":
            "completed"

    })


    results.append(image)



# ==================================================
# Speichern
# ==================================================

OUTPUT.parent.mkdir(
    parents=True,
    exist_ok=True
)


with open(
    OUTPUT,
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
print("Metadaten gespeichert:")
print(OUTPUT)
print("==========================")