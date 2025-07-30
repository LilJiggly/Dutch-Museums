import json
import requests
import os
import time
from urllib.parse import urlparse

# Create images directory if it doesn't exist
os.makedirs("images", exist_ok=True)

# Load the full museum data
with open("data/museum_details_full.json", "r", encoding="utf-8") as f:
    museums = json.load(f)

print(f"🖼️ Found {len(museums)} museums to download images for")

def download_image(url, filename):
    """Download image from URL and save to filename"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"  ❌ Failed to download {url}: {e}")
        return False

def get_placeholder_image():
    """Create a simple placeholder image URL"""
    return "https://via.placeholder.com/400x300/cccccc/666666?text=Museum+Image"

# We need to scrape the actual image URLs from the museum pages
# For now, let's create a simple placeholder downloader
downloaded = 0
failed = 0

for i, museum in enumerate(museums, 1):
    name = museum.get("Name", "")
    image_path = museum.get("Image", "")
    
    if not image_path or not name:
        continue
    
    # Extract just the filename from the path
    filename = os.path.basename(image_path)
    full_path = f"images/{filename}"
    
    # Skip if image already exists
    if os.path.exists(full_path):
        continue
    
    print(f"🔄 ({i}/{len(museums)}) Downloading placeholder for: {name}")
    
    # For now, download a placeholder image
    placeholder_url = get_placeholder_image()
    
    if download_image(placeholder_url, full_path):
        downloaded += 1
        print(f"  ✅ Downloaded: {filename}")
    else:
        failed += 1
    
    # Be nice to the server
    time.sleep(0.5)
    
    # Progress update every 50 images
    if i % 50 == 0:
        print(f"📈 Progress: {i}/{len(museums)} processed ({downloaded} downloaded, {failed} failed)")

print(f"\n✅ Image download complete!")
print(f"📊 Downloaded: {downloaded} images")
print(f"❌ Failed: {failed} images")