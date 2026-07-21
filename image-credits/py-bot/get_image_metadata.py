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
# Datei laden
# ==================================================

print("")
print("==========================")
print("Unsplash Metadata Bot")
print("==========================")
print("")


if not INPUT.exists():

    raise Exception(
        f"Eingabedatei nicht gefunden: {INPUT}"
    )


with open(
    INPUT,
    "r",
    encoding="utf-8"
) as f:

    images = json.load(f)



print(
    "Gefundene Bilder:",
    len(images)
)



for image in images:

    print(
        image["image_url"]
    )


print("")



# ==================================================
# Verarbeitung
# ==================================================

results = []


for image in images:


    image_url = image["image_url"]


    print("--------------------------")
    print("Verarbeite:")
    print(image_url)



    # Unsplash liefert die Metadaten
    # über die Download-URL nicht direkt.
    #
    # Wir verwenden deshalb die Source API.


    response = requests.get(

        "https://api.unsplash.com/photos",

        headers=headers,

        params={

            "query":
                image_url

        }

    )



    print(
        "API Status:",
        response.status_code
    )



    if response.status_code != 200:


        image["status"] = "api_error"


        results.append(image)


        continue



    data = response.json()



    # Falls API keine Daten liefert

    if not data:


        image["status"] = "not_found"


        results.append(image)


        continue



    photo = data[0]


    user = photo.get(
        "user",
        {}
    )



    image.update({

        "photographer":
            user.get("name", ""),

        "profile":
            user.get(
                "links",
                {}
            ).get(
                "html",
                ""
            ),

        "unsplash_page":
            photo.get(
                "links",
                {}
            ).get(
                "html",
                ""
            ),

        "description":
            photo.get(
                "description",
                ""
            ),

        "alt_description":
            photo.get(
                "alt_description",
                ""
            ),

        "thumbnail":
            photo.get(
                "urls",
                {}
            ).get(
                "small",
                ""
            ),

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
print(
    "Gespeichert:",
    OUTPUT
)
print("==========================")