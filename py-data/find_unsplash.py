import os
import re

pattern = r'https://images\.unsplash\.com/([^"\']+)'

found = []

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)

            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            matches = re.findall(pattern, content)

            for image in matches:
                found.append({
                    "file": path,
                    "image": image
                })

for item in found:
    print("Datei:", item["file"])
    print("Bild:", item["image"])
    print("---")

print("Gefundene Bilder:", len(found))