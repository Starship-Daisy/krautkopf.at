from pathlib import Path
import re
import json


# ==================================================
# Pfade
# ==================================================

ROOT = Path(__file__).resolve().parents[2]

HTML_DIR = ROOT / "01_html"

OUTPUT = (
    ROOT
    / "image-credits"
    / "py-data"
    / "data"
    / "images_found.json"
)


# ==================================================
# Einstellungen
# ==================================================

excluded_files = [
    "credits.html",
    "_credits.html"
]


# ==================================================
# Speicher
# ==================================================

found = []

seen = set()


# ==================================================
# Regex
# ==================================================

# Unsplash Bild-URL
image_pattern = (
    r'https://images\.unsplash\.com/[^"\'> ]+'
)


# Kommentar:
# <!-- unsplash:F3Dde_9thd8 -->

id_pattern = (
    r'<!--\s*unsplash:([A-Za-z0-9_-]+)\s*-->'
)


# ==================================================
# Start
# ==================================================

print("")
print("==========================")
print("Unsplash Image Scanner")
print("==========================")
print("")


# ==================================================
# HTML durchsuchen
# ==================================================

for html_file in HTML_DIR.rglob("*.html"):


    if html_file.name.lower() in excluded_files:
        continue



    content = html_file.read_text(
        encoding="utf-8"
    )



    # alle Unsplash IDs aus Kommentaren holen

    ids = re.findall(
        id_pattern,
        content
    )


    photo_id = ""


    if ids:

        photo_id = ids[0]



    # alle Bilder finden

    images = re.findall(
        image_pattern,
        content
    )



    for image_url in images:


        clean_url = image_url.split("?")[0]



        if clean_url in seen:
            continue



        seen.add(clean_url)



        entry = {

            "source": "unsplash",

            "file": str(
                html_file.relative_to(ROOT)
            ),

            "image_url": clean_url,

            "photo_id": photo_id,

            "photographer": "",

            "profile": "",

            "unsplash_page": "",

            "description": "",

            "alt_description": "",

            "thumbnail": "",

            "alt_text": "",

            "status": "needs_review"

        }



        found.append(entry)



        print("")
        print("--------------------------")
        print("Bild gefunden")
        print("Datei:", entry["file"])
        print("URL:", clean_url)
        print("Unsplash ID:", photo_id)



# ==================================================
# JSON schreiben
# ==================================================

OUTPUT.parent.mkdir(
    parents=True,
    exist_ok=True
)



OUTPUT.write_text(

    json.dumps(
        found,
        indent=2,
        ensure_ascii=False
    ),

    encoding="utf-8"

)



print("")
print("==========================")
print("Fertig")
print("Gefundene Bilder:", len(found))
print("Gespeichert:")
print(OUTPUT)
print("==========================")