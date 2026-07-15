import os
import re
import json


# Welche Bildquellen kennen wir?
SUPPORTED_SOURCES = [
    "unsplash"
]


found = []


# sucht alle HTML Dateien
for root, dirs, files in os.walk("."):

    for file in files:

        if not file.endswith(".html"):
            continue


        # credits.html auslassen
        if file.lower() == "credits.html":
            continue


        path = os.path.join(root, file)


        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            html = f.read()


        # Bilder mit Quelle finden
        pattern = r'<img[^>]+data-image-source="([^"]+)"[^>]+src="([^"]+)"'


        images = re.findall(
            pattern,
            html
        )


        for source, url in images:


            if source not in SUPPORTED_SOURCES:
                continue


            entry = {

                "file": path,

                "source": source,

                "image_url": url,

                "alt_text": ""

            }


            found.append(entry)


            print("")
            print("Bild gefunden:")
            print("Datei:", path)
            print("Quelle:", source)
            print("URL:", url)



# Ergebnis speichern

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
print("====================")
print("Fertig")
print("Gefundene Bilder:", len(found))
print("Datei:", output)