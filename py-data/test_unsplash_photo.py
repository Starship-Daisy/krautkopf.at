import os
import requests

API_KEY = os.environ["UNSPLASH_ACCESS_KEY"]

photo_id = "photo-1487023312653-e9014cce469c"

url = f"https://api.unsplash.com/photos/{photo_id}"

response = requests.get(
    url,
    params={
        "client_id": API_KEY
    }
)

print("Status:", response.status_code)

data = response.json()

print("Fotograf:", data["user"]["name"])
print("Profil:", data["user"]["links"]["html"])
print("Bild:", data["links"]["html"])
print("Thumbnail:", data["urls"]["thumb"])