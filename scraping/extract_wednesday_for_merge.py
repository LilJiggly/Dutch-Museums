import json
import csv
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from bs4 import BeautifulSoup
from webdriver_manager.chrome import ChromeDriverManager

def extract_wednesday_from_table(opening_section):
    """Extract Wednesday hours from the structured opening hours table"""
    if not opening_section:
        return None
    
    # Try table structure first
    table = opening_section.find('table')
    if table:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                day_cell = cells[0].get_text().strip().lower()
                hours_cell = cells[1].get_text().strip()
                
                # Skip header rows
                if day_cell in ['day', 'dag'] or hours_cell.lower() in ['opening hours', 'openingstijden']:
                    continue
                
                # Check if this row contains Wednesday
                if any(wed_word in day_cell for wed_word in ['wed', 'woensdag', 'wednesday']):
                    return hours_cell
                
                # Check for ranges that include Wednesday (like "Tue - Thu" or "Ma - Vr")
                if ' - ' in day_cell or ' t/m ' in day_cell:
                    # Handle different separators
                    separator = ' - ' if ' - ' in day_cell else ' t/m '
                    day_parts = [d.strip() for d in day_cell.split(separator)]
                    if len(day_parts) == 2:
                        start_day = day_parts[0].lower()
                        end_day = day_parts[1].lower()
                        
                        # Define day order for range checking
                        day_order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
                                   'ma', 'di', 'wo', 'do', 'vr', 'za', 'zo',
                                   'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                                   'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
                        
                        # Check if Wednesday is in the range
                        wed_variants = ['wed', 'wo', 'wednesday', 'woensdag']
                        start_variants = [d for d in day_order if any(s in start_day for s in [d])]
                        end_variants = [d for d in day_order if any(e in end_day for e in [d])]
                        
                        if start_variants and end_variants:
                            start_idx = day_order.index(start_variants[0])
                            end_idx = day_order.index(end_variants[0])
                            wed_indices = [day_order.index(w) for w in wed_variants if w in day_order]
                            
                            # Check if any Wednesday variant is in the range
                            for wed_idx in wed_indices:
                                if start_idx <= wed_idx <= end_idx:
                                    return hours_cell
    
    # Try list structure as fallback
    items = opening_section.find_all(['li', 'div', 'p'])
    for item in items:
        text = item.get_text().strip().lower()
        if any(wed_word in text for wed_word in ['wed', 'woensdag', 'wednesday']):
            # Extract the hours part
            if ':' in text:
                return text.split(':', 1)[1].strip()
    
    return None

def setup_driver():
    """Setup Chrome driver with optimal settings"""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

def main():
    # Load URLs
    try:
        with open("data/detail_urls.json", "r", encoding="utf-8") as f:
            urls = json.load(f)
    except FileNotFoundError:
        print("❌ Error: data/detail_urls.json not found")
        return
    
    print(f"🎯 Extracting Wednesday opening hours for {len(urls)} museums")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎪 This will create a CSV file ready for merging with existing data")
    
    driver = setup_driver()
    results = []
    errors = []
    
    try:
        for i, url in enumerate(urls, 1):
            try:
                print(f"🔄 ({i}/{len(urls)}) Processing: {url.split('/')[-1]}")
                
                driver.get(url)
                time.sleep(2)  # Wait for page load
                
                # Try to expand opening hours section
                try:
                    # Look for various expand buttons
                    expand_selectors = [
                        ".read-more-toggle",
                        "[data-toggle='collapse']",
                        ".expand-hours",
                        ".show-more"
                    ]
                    
                    for selector in expand_selectors:
                        try:
                            button = driver.find_element(By.CSS_SELECTOR, selector)
                            if button.is_displayed():
                                driver.execute_script("arguments[0].click();", button)
                                time.sleep(1)
                                break
                        except NoSuchElementException:
                            continue
                            
                except Exception as e:
                    pass  # Continue even if expand fails
                
                soup = BeautifulSoup(driver.page_source, "html.parser")

                # Get museum name
                name_elem = soup.select_one("h1")
                name = name_elem.get_text(strip=True) if name_elem else f"Unknown Museum {i}"
                
                # Extract Wednesday hours
                opening_section = soup.select_one("#openingHours")
                if not opening_section:
                    # Try alternative selectors
                    opening_section = soup.select_one(".opening-hours") or \
                                    soup.select_one(".openingstijden") or \
                                    soup.select_one("[class*='opening']") or \
                                    soup.select_one("[class*='hours']")
                
                wednesday_hours = extract_wednesday_from_table(opening_section)
                
                if not wednesday_hours:
                    wednesday_hours = "Time unknown"
                
                results.append({
                    "museum_name": name,
                    "wednesday_hours": wednesday_hours,
                    "url": url,
                    "scraped_at": datetime.now().isoformat()
                })
                
                if wednesday_hours != "Time unknown":
                    print(f"  ✅ Found: {name} - {wednesday_hours}")
                else:
                    print(f"  ⚠️  No hours: {name}")
                
                # Progress report every 25 museums
                if i % 25 == 0:
                    found_count = len([r for r in results if r["wednesday_hours"] != "Time unknown"])
                    print(f"📈 Progress: {i}/{len(urls)} ({found_count} found, {len(errors)} errors)")
                
            except Exception as e:
                error_msg = f"Error processing {url}: {str(e)}"
                errors.append(error_msg)
                print(f"  ❌ Error: {error_msg}")
                
                # Add placeholder result to maintain order
                results.append({
                    "museum_name": f"Error Museum {i}",
                    "wednesday_hours": "Scraping error",
                    "url": url,
                    "scraped_at": datetime.now().isoformat()
                })

    except KeyboardInterrupt:
        print("\n⚠️ Scraping interrupted by user")
    finally:
        driver.quit()

    # Save results to CSV for merging
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"data/wednesday_hours_merge_{timestamp}.csv"
    
    with open(csv_filename, "w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["museum_name", "wednesday_hours", "url", "scraped_at"])
        writer.writeheader()
        writer.writerows(results)

    # Save errors log
    if errors:
        error_filename = f"data/wednesday_scraping_errors_{timestamp}.txt"
        with open(error_filename, "w", encoding="utf-8") as f:
            f.write(f"Wednesday Scraping Errors - {datetime.now()}\n")
            f.write("=" * 50 + "\n\n")
            for error in errors:
                f.write(f"{error}\n")
        print(f"📝 Errors logged to: {error_filename}")

    # Summary
    found_count = len([r for r in results if r["wednesday_hours"] not in ["Time unknown", "Scraping error"]])
    error_count = len([r for r in results if r["wednesday_hours"] == "Scraping error"])
    unknown_count = len([r for r in results if r["wednesday_hours"] == "Time unknown"])
    
    print(f"\n🎉 Scraping Complete!")
    print(f"📊 Results Summary:")
    print(f"   ✅ Successfully found: {found_count}")
    print(f"   ⚠️  Time unknown: {unknown_count}")
    print(f"   ❌ Scraping errors: {error_count}")
    print(f"   📁 Total processed: {len(results)}")
    print(f"💾 Saved to: {csv_filename}")
    print(f"🔗 Ready for merging with existing museum data!")

if __name__ == "__main__":
    main()