from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
import csv
import json
import time

from webdriver_manager.chrome import ChromeDriverManager

# Setup headless browser
options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

BASE_URL = "https://www.museum.nl"
LISTING_URL = f"{BASE_URL}/en/see-and-do/museums?mv-PageIndex=25"

print("🔄 Loading page...")
driver.get(LISTING_URL)
time.sleep(5)  # wait for JavaScript to load everything

soup = BeautifulSoup(driver.page_source, "html.parser")
driver.quit()

csv_rows = []
detail_urls = []

cards = soup.select(".see-and-do-card")
print(f"🔍 Found {len(cards)} museum cards")

for card in cards:
    name_elem = card.select_one(".typography.heading-3")
    name = name_elem.get_text(strip=True) if name_elem else ""

    city_elem = card.select_one(".typography.buttons-and-labels")
    city = city_elem.get_text(strip=True) if city_elem else ""

    img_elem = card.select_one(".see-and-do-card_img img")
    img_url = img_elem['src'] if img_elem and img_elem.has_attr('src') else ""
    if img_url.startswith("/"):
        img_url = BASE_URL + img_url

    link_elem = card.select_one("a")
    detail_url = BASE_URL + link_elem['href'] if link_elem and link_elem.has_attr('href') else ""
    if detail_url:
        detail_urls.append(detail_url)

    csv_rows.append([name, city, img_url])

# Save to CSV
with open("museum_list.csv", "w", newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "City", "Image_URL"])
    writer.writerows(csv_rows)

# Save URLs to JSON
with open("detail_urls.json", "w", encoding='utf-8') as f:
    json.dump(detail_urls, f, indent=2)

print(f"✅ Saved {len(csv_rows)} museums to CSV.")