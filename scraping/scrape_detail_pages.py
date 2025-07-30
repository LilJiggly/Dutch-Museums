import json
import csv
import time
import re
from collections import OrderedDict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from bs4 import BeautifulSoup
from webdriver_manager.chrome import ChromeDriverManager

# --- Headless Browser Setup ---
options = Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920,1080")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Load all museum detail page URLs
with open("data/detail_urls.json", "r", encoding="utf-8") as f:
    urls = json.load(f)

print(f"🎯 Found {len(urls)} museums to scrape")
print(f"⏱️ Estimated time: {len(urls) * 4 // 60} minutes (assuming 4 seconds per museum)")

results = []

# --- Helper for day range expansion ---
day_aliases = {
    "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday",
    "thu": "Thursday", "fri": "Friday", "sat": "Saturday", "sun": "Sunday",
    "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
    "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday"
}

def expand_days(day_part):
    days = list(day_aliases.keys())[:7]  # Only use short forms for range detection
    parts = [p.strip().lower() for p in day_part.strip().split('-')]
    if len(parts) == 2:
        try:
            i1 = days.index(parts[0])
            i2 = days.index(parts[1])
            if i1 <= i2:
                return [day_aliases[d] for d in days[i1:i2+1]]
            else:
                return [day_aliases[d] for d in days[i1:] + days[:i2+1]]
        except ValueError:
            return []
    elif len(parts) == 1:
        return [day_aliases.get(parts[0], "")]
    return []

def parse_opening_hours(opening_section):
    """Parse opening hours from the section with better error handling"""
    opening_hours = OrderedDict()
    if not opening_section:
        return opening_hours
    
    try:
        # Method 1: Look for table structure (most common on this site)
        table = opening_section.find('table')
        if table:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    day_cell = cells[0].get_text().strip()
                    hours_cell = cells[1].get_text().strip()
                    
                    # Skip header rows
                    if day_cell.lower() in ['day'] or hours_cell.lower() in ['opening hours']:
                        continue
                    
                    # Parse day ranges and individual days
                    if day_cell and hours_cell:
                        # Handle ranges like "Thu - Sat", "Mon - Tue", "Fri - Tue"
                        if ' - ' in day_cell:
                            day_parts = [d.strip() for d in day_cell.split(' - ')]
                            if len(day_parts) == 2:
                                expanded_days = expand_days(f"{day_parts[0]}-{day_parts[1]}")
                                for day in expanded_days:
                                    if day:
                                        opening_hours[day] = hours_cell
                        else:
                            # Single day
                            day = day_aliases.get(day_cell.lower(), day_cell.title())
                            if day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                                opening_hours[day] = hours_cell
            
            return opening_hours
        
        # Method 2: Fallback to text parsing
        hours_text = opening_section.get_text()
        
        # Parse the text line by line
        for line in hours_text.splitlines():
            line = line.strip()
            if not line or "route" in line.lower() or "plan" in line.lower() or "overview" in line.lower():
                continue
                
            # Try different splitting patterns
            if ':' in line and not re.search(r'\d{1,2}:\d{2}', line):
                # Pattern: "Monday: 10:00 - 17:00" (but not time like "10:00")
                parts = line.split(':', 1)
                if len(parts) == 2:
                    day_part = parts[0].strip()
                    hours_part = parts[1].strip()
                    
                    # Handle day ranges and individual days
                    if '-' in day_part and not any(char.isdigit() for char in day_part):
                        expanded_days = expand_days(day_part)
                        for day in expanded_days:
                            if day:
                                opening_hours[day] = hours_part
                    else:
                        day = day_aliases.get(day_part.lower(), day_part.title())
                        if day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                            opening_hours[day] = hours_part
            
            # Try space separation for patterns like "Thu - Sat  12:00 - 17:00"
            elif re.search(r'(mon|tue|wed|thu|fri|sat|sun)', line.lower()):
                # Look for day patterns followed by times
                match = re.match(r'([a-zA-Z\s\-]+)\s+(\d{1,2}:\d{2}.*|closed)', line.lower())
                if match:
                    day_part = match.group(1).strip()
                    hours_part = match.group(2).strip()
                    
                    if ' - ' in day_part:
                        day_parts = [d.strip() for d in day_part.split(' - ')]
                        if len(day_parts) == 2:
                            expanded_days = expand_days(f"{day_parts[0]}-{day_parts[1]}")
                            for day in expanded_days:
                                if day:
                                    opening_hours[day] = hours_part
                    else:
                        day = day_aliases.get(day_part.lower(), day_part.title())
                        if day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                            opening_hours[day] = hours_part
                            
    except Exception as e:
        print(f"Error parsing opening hours: {e}")
    
    return opening_hours

# --- Scrape Loop ---
try:
    for i, url in enumerate(urls, 1):
        print(f"🔄 Visiting ({i}/{len(urls)}): {url}")
        
        try:
            driver.get(url)
            time.sleep(3)  # Increased wait time

            # Try to click read-more button if it exists
            try:
                button = driver.find_element(By.CLASS_NAME, "read-more-toggle")
                if button.is_displayed():
                    driver.execute_script("arguments[0].click();", button)
                    time.sleep(1)
            except NoSuchElementException:
                pass

            soup = BeautifulSoup(driver.page_source, "html.parser")

            # --- Basic Info ---
            name = soup.select_one("h1")
            name = name.get_text(strip=True) if name else ""

            meta = soup.select_one(".meta")
            meta = meta.get_text(strip=True) if meta else ""

            # --- Opening Hours with improved parsing ---
            opening_section = soup.select_one("#openingHours")
            if not opening_section:
                # Try alternative selectors
                opening_section = soup.select_one(".opening-hours, .openingHours, [class*='opening'], [class*='hours']")
            
            opening_hours = parse_opening_hours(opening_section)
            
            # --- Get current day's opening hours from practical info ---
            current_day_info = soup.select_one(".practical-info_blocks > *:first-child")
            if current_day_info:
                current_day_text = current_day_info.get_text(strip=True)
                print(f"  Current day info: {current_day_text}")
                
                # Try to detect which day is being shown
                detected_day = None
                day_keywords = {
                    'monday': 'Monday', 'maandag': 'Monday',
                    'tuesday': 'Tuesday', 'dinsdag': 'Tuesday', 
                    'wednesday': 'Wednesday', 'woensdag': 'Wednesday',
                    'thursday': 'Thursday', 'donderdag': 'Thursday',
                    'friday': 'Friday', 'vrijdag': 'Friday',
                    'saturday': 'Saturday', 'zaterdag': 'Saturday',
                    'sunday': 'Sunday', 'zondag': 'Sunday',
                    'today': None, 'vandaag': None  # Will use actual scraping day
                }
                
                for keyword, day in day_keywords.items():
                    if keyword in current_day_text.lower():
                        detected_day = day
                        break
                
                # If no specific day detected, assume it's showing today's info
                if not detected_day:
                    # Get current day of scraping
                    import datetime
                    scraping_day = datetime.datetime.now().strftime('%A')
                    detected_day = scraping_day
                
                # Extract opening hours from current day info
                if "closed" in current_day_text.lower() or "gesloten" in current_day_text.lower():
                    current_day_hours = "Closed"
                else:
                    # Try to extract time pattern
                    time_match = re.search(r'(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})', current_day_text)
                    if time_match:
                        current_day_hours = time_match.group(1)
                    else:
                        current_day_hours = "Time unknown"
                
                # Add the detected day's hours if missing from structured data
                if detected_day and detected_day not in opening_hours and current_day_hours != "Time unknown":
                    opening_hours[detected_day] = current_day_hours
                    print(f"  Added {detected_day} hours from current day info: {current_day_hours}")
            
            opening_hours = opening_hours
            
            # Log opening hours status
            if opening_section and opening_hours:
                print(f"  ✅ Opening hours parsed successfully")
            elif opening_section:
                print(f"  ⚠️ Opening hours section found but couldn't parse")
            else:
                print(f"  ⚠️ No opening hours section found")

            # --- Basic Details ---
            address_elem = soup.select_one(".practical-info address")
            address = address_elem.get_text(" ", strip=True).replace("Plan route", "").strip() if address_elem else ""

            maps_elem = soup.select_one(".practical-info address a[href]")
            maps_link = maps_elem['href'] if maps_elem else ""

            phone_elem = soup.select_one(".practical-info .icon-phone")
            phone = phone_elem.find_parent("p").get_text(strip=True) if phone_elem else ""

            # --- Clean Text Description ---
            desc_section = soup.select_one(".expander.read-more.text-block")
            formatted_description = ""
            if desc_section:
                blocks = []
                current_heading = None
                for elem in desc_section.find_all(['h3', 'p']):
                    text = elem.get_text(" ", strip=True)
                    if elem.name == "h3":
                        current_heading = text
                    elif elem.name == "p" and text:
                        if current_heading:
                            blocks.append(f"{current_heading}\n{text}")
                            current_heading = None
                        else:
                            blocks.append(text)
                formatted_description = "\n\n".join(blocks)

            # --- Museum Card + Facilities ---
            museum_card = "Yes" if soup.select_one(".museum-card-valid") else "No"

            facility_list = ""
            try:
                facility_items = soup.select(".summary-block_iconlist .visually-hidden")
                facilities = [item.get_text(strip=True) for item in facility_items]
                facility_list = ", ".join(facilities)
            except Exception:
                pass

            # --- Image Path ---
            # Clean filename: remove special chars, replace spaces with underscores
            clean_name = name.lower()
            clean_name = re.sub(r'[&|,\'"(){}[\]]', '', clean_name)  # Remove these chars
            clean_name = re.sub(r'[/\\-]', '_', clean_name)  # Replace with underscore
            clean_name = re.sub(r'[^\w\s_]', '', clean_name)  # Remove any remaining special chars
            clean_name = re.sub(r'\s+', '_', clean_name)  # Replace spaces with underscores
            clean_name = re.sub(r'_+', '_', clean_name)  # Replace multiple underscores with single
            clean_name = clean_name.strip('_')  # Remove leading/trailing underscores
            filename = clean_name + ".jpg"
            image_path = f"images/{filename}"

            # --- Add to Results with "Time unknown" for missing days ---
            results.append([
                name, meta,
                opening_hours.get("Monday", "Time unknown"),
                opening_hours.get("Tuesday", "Time unknown"),
                opening_hours.get("Wednesday", "Time unknown"),
                opening_hours.get("Thursday", "Time unknown"),
                opening_hours.get("Friday", "Time unknown"),
                opening_hours.get("Saturday", "Time unknown"),
                opening_hours.get("Sunday", "Time unknown"),
                address, maps_link, phone,
                formatted_description,
                museum_card, facility_list, image_path
            ])
            
            print(f"  ✅ Successfully scraped: {name}")
            
        except Exception as e:
            print(f"  ❌ Error scraping {url}: {e}")
            # Add empty row to maintain consistency
            results.append(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""])
        
        # Progress indicator every 50 museums
        if i % 50 == 0:
            successful = len([r for r in results if r[0]])
            print(f"📈 Progress: {i}/{len(urls)} completed ({successful} successful)")
            
except KeyboardInterrupt:
    print("\n⚠️ Scraping interrupted by user")
finally:
    # Always close the driver
    driver.quit()
    print("🔒 Browser closed")

# --- Save to CSV ---
if results:
    with open("data/museum_details_full.csv", "w", newline='', encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Name", "Open Today",
            "Opening_Monday", "Opening_Tuesday", "Opening_Wednesday",
            "Opening_Thursday", "Opening_Friday", "Opening_Saturday", "Opening_Sunday",
            "Address", "Google Maps", "Phone",
            "Description_Text", "Museum Card", "Facilities", "Image"
        ])
        writer.writerows(results)
    
    print(f"✅ Scraped {len(results)} museums with clean structure and saved to CSV.")
    print(f"📊 Success rate: {len([r for r in results if r[0]])} successful / {len(results)} total")
else:
    print("❌ No data was scraped successfully.")
