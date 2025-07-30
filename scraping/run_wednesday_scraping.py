#!/usr/bin/env python3
"""
Quick runner script for Wednesday hours scraping and merging
"""

import os
import sys
import subprocess
from datetime import datetime

def run_scraping():
    """Run the Wednesday hours scraping"""
    print("🚀 Starting Wednesday hours scraping...")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Run the scraping script
        result = subprocess.run([
            sys.executable, 
            "scraping/extract_wednesday_for_merge.py"
        ], check=True, capture_output=True, text=True)
        
        print("✅ Scraping completed successfully!")
        print(result.stdout)
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Scraping failed with error: {e}")
        print(f"Error output: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Python not found or scraping script missing")
        return False

def find_latest_wednesday_csv():
    """Find the most recent Wednesday hours CSV file"""
    data_dir = "data"
    wednesday_files = []
    
    if os.path.exists(data_dir):
        for filename in os.listdir(data_dir):
            if filename.startswith("wednesday_hours_merge_") and filename.endswith(".csv"):
                filepath = os.path.join(data_dir, filename)
                mtime = os.path.getmtime(filepath)
                wednesday_files.append((filepath, mtime))
    
    if wednesday_files:
        # Sort by modification time, newest first
        wednesday_files.sort(key=lambda x: x[1], reverse=True)
        return wednesday_files[0][0]
    
    return None

def run_merge():
    """Run the merge process"""
    print("\n🔄 Starting merge process...")
    
    # Find the main data file
    main_data_file = "data/museum_details_full.json"
    if not os.path.exists(main_data_file):
        print(f"❌ Main data file not found: {main_data_file}")
        return False
    
    # Find the latest Wednesday CSV
    wednesday_csv = find_latest_wednesday_csv()
    if not wednesday_csv:
        print("❌ No Wednesday hours CSV file found")
        return False
    
    print(f"📊 Using main data: {main_data_file}")
    print(f"📊 Using Wednesday data: {wednesday_csv}")
    
    try:
        # Run the merge script
        result = subprocess.run([
            sys.executable,
            "scraping/merge_wednesday_hours.py",
            main_data_file,
            wednesday_csv
        ], check=True, capture_output=True, text=True)
        
        print("✅ Merge completed successfully!")
        print(result.stdout)
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Merge failed with error: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    print("🎪 Wednesday Hours Scraping & Merge Tool")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "scrape":
            run_scraping()
        elif command == "merge":
            run_merge()
        elif command == "both":
            if run_scraping():
                print("\n" + "="*50)
                run_merge()
        else:
            print(f"❌ Unknown command: {command}")
            print("Available commands: scrape, merge, both")
    else:
        # Interactive mode
        print("What would you like to do?")
        print("1. Scrape Wednesday hours only")
        print("2. Merge existing Wednesday data")
        print("3. Scrape and merge (full process)")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            run_scraping()
        elif choice == "2":
            run_merge()
        elif choice == "3":
            if run_scraping():
                print("\n" + "="*50)
                run_merge()
        elif choice == "4":
            print("👋 Goodbye!")
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    main()