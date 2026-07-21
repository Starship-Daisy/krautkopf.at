from pathlib import Path
import re
import json


# ==================================================
# Projektpfade
# ==================================================

ROOT = Path(__file__).resolve().parents[2]

HTML_DIR = ROOT

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


patterns = {

    "unsplash":
        r'https://images\.unsplash\.com/[^"\']+'

}


found = []

seen = set()


# ==================================================
# HTML-Dateien durchsuchen
# ==================================================

for path in HTML_DIR.rglob("*.html"):


    if path.name.lower() in excluded_files:
        continue


    html = path.read_text(
        encoding="utf-8"
    )


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

                "file": str(
                    path.relative_to(ROOT)
                ),

                "image_url": clean_url,

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
            print("Quelle:", source)
            print("URL:", clean_url)



# ==================================================
# JSON speichern
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
print("Gespeichert:", OUTPUT)