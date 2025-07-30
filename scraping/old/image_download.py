import os
import csv
import requests

# Create images folder if it doesn't exist
os.makedirs("images", exist_ok=True)

with open("museum_list.csv", newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row['Name']
        img_url = row['Image_URL']

        if not img_url:
            continue

        # Sanitize filename (basic)
        filename = name.lower().replace(" ", "_").replace("/", "-")
        filepath = f"images/{filename}.jpg"

        try:
            print(f"⬇️ Downloading {name}...")
            r = requests.get(img_url, timeout=10)
            with open(filepath, "wb") as img_file:
                img_file.write(r.content)
        except Exception as e:
            print(f"⚠️ Failed to download image for {name}: {e}")

print("✅ All images downloaded.")