import os
import re
import json


found = []

seen = set()


# --------------------------------------------------
# HTML-Dateien durchsuchen
# --------------------------------------------------

for root, dirs, files in os.walk("."):

    for file in files:

        if not file.endswith(".html"):
            continue


        # alle Credits-Seiten nicht durchsuchen
        if "credits" in file.lower():
            continue


        path = os.path.join(root, file)


        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            html = f.read()



        # --------------------------------------------------
        # Unsplash Bilder finden
        # --------------------------------------------------

        pattern = r'https://images\.unsplash\.com/[^"\']+'


        images = re.findall(
            pattern,
            html
        )


        for url in images:


            # URL ohne Parameter
            clean_url = url.split("?")[0]


            # doppelte Bilder vermeiden
            if clean_url in seen:
                continue


            seen.add(clean_url)



            entry = {

                "source": "unsplash",

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
            print("Quelle:", entry["source"])
            print("URL:", clean_url)



# --------------------------------------------------
# JSON schreiben
# --------------------------------------------------

output = "py-data/images_found.json"


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