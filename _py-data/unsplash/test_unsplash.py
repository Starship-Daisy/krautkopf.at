import requests

ACCESS_KEY = "DEIN_ACCESS_KEY"

url = "https://api.unsplash.com/photos/random"

response = requests.get(
    url,
    params={"client_id": ACCESS_KEY}
)

data = response.json()

print("ID:", data["id"])
print("Fotograf:", data["user"]["name"])
print("Profil:", data["user"]["links"]["html"])
print("Bild:", data["links"]["html"])
print("Thumb:", data["urls"]["thumb"])