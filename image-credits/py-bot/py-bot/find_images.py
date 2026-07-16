import os
import re
import json


found = []

seen = set()


# --------------------------------------------------
# Einstellungen
# --------------------------------------------------

excluded_files = [
    "credits.html",
    "_credits.html"
]


output = (
    "image-credits/"
    "py-data/"
    "data/"
    "images_found.json"
)


# --------------------------------------------------
# HTML-Dateien durchsuchen
# --------------------------------------------------

for root, dirs, files in os.walk("."):

    for file in files:


        if not file.endswith(".html"):
            continue


        # Credits-Seiten überspringen
        if file.lower() in excluded_files:
            continue


        path = os.path.join(root, file)


        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            html = f.read()



        # --------------------------------------------------
        # Bildquellen erkennen
        # --------------------------------------------------

        patterns = {

            "unsplash":
                r'https://images\.unsplash\.com/[^"\']+'

        }


        for source, pattern in patterns.items():


            images = re.findall(
                pattern,
                html
            )


            for url in images:


                clean_url = url.split("?")[0]


                if clean_url in seen:
                    continue


                seen.add(clean_url)



                entry = {

                    "source": source,

                    "file": path,

                    "image_url": clean_url,

                    "alt_text": "",

                    "status": "needs_review"

                }


                found.append(entry)



                print("")
                print("--------------------------")
                print("Bild gefunden")
                print("Datei:", path)
                print("Quelle:", source)
                print("URL:", clean_url)



# --------------------------------------------------
# Verzeichnis sicherstellen
# --------------------------------------------------

os.makedirs(
    os.path.dirname(output),
    exist_ok=True
)



# --------------------------------------------------
# JSON schreiben
# --------------------------------------------------

with open(
    output,
    "w",
    encoding="utf-8"
) as f:


    json.dump(
        found,
        f,
        indent=2,
        ensure_ascii=False
    )



print("")
print("==========================")
print("Fertig")
print("Gefundene Bilder:", len(found))
print("Gespeichert:", output)