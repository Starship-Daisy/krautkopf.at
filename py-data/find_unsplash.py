import os
import re

pattern = r'https://images\.unsplash\.com/([^"\']+)'

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)

            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            matches = re.findall(pattern, content)

            for image in matches:
                print(path)
                print(image)
                print("---")