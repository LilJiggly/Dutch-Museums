import json
import csv
import pandas as pd
from datetime import datetime
from difflib import SequenceMatcher

def similarity(a, b):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def find_best_match(target_name, candidate_names, threshold=0.8):
    """Find the best matching museum name"""
    best_match = None
    best_score = 0
    
    for candidate in candidate_names:
        score = similarity(target_name, candidate)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = candidate
    
    return best_match, best_score

def merge_wednesday_hours(main_data_file, wednesday_csv_file, output_file=None):
    """Merge Wednesday hours into the main museum data"""
    
    print(f"🔄 Loading main museum data from: {main_data_file}")
    
    # Load main museum data
    if main_data_file.endswith('.json'):
        with open(main_data_file, 'r', encoding='utf-8') as f:
            main_data = json.load(f)
    elif main_data_file.endswith('.csv'):
        main_data = pd.read_csv(main_data_file).to_dict('records')
    else:
        raise ValueError("Main data file must be JSON or CSV")
    
    print(f"📊 Loaded {len(main_data)} museums from main data")
    
    # Load Wednesday hours data
    print(f"🔄 Loading Wednesday hours from: {wednesday_csv_file}")
    wednesday_df = pd.read_csv(wednesday_csv_file)
    wednesday_data = wednesday_df.to_dict('records')
    
    print(f"📊 Loaded {len(wednesday_data)} Wednesday hour records")
    
    # Create mapping of museum names from main data
    main_names = []
    for museum in main_data:
        name = museum.get('Name') or museum.get('museum_name') or museum.get('name', '')
        main_names.append(name)
    
    # Track merge statistics
    exact_matches = 0
    fuzzy_matches = 0
    no_matches = 0
    updated_museums = []
    unmatched_wednesday = []
    
    print(f"\n🎯 Starting merge process...")
    
    # Process each Wednesday record
    for wed_record in wednesday_data:
        wed_name = wed_record['museum_name']
        wed_hours = wed_record['wednesday_hours']
        
        # Skip error records
        if wed_hours in ['Scraping error', 'Time unknown']:
            continue
        
        # Try exact match first
        matched = False
        for i, museum in enumerate(main_data):
            main_name = museum.get('Name') or museum.get('museum_name') or museum.get('name', '')
            
            if main_name.lower() == wed_name.lower():
                # Exact match found
                museum['Opening_Wednesday'] = wed_hours
                updated_museums.append({
                    'main_name': main_name,
                    'wed_name': wed_name,
                    'hours': wed_hours,
                    'match_type': 'exact'
                })
                exact_matches += 1
                matched = True
                break
        
        if not matched:
            # Try fuzzy matching
            best_match, score = find_best_match(wed_name, main_names, threshold=0.85)
            
            if best_match:
                # Find the museum with this name and update it
                for museum in main_data:
                    main_name = museum.get('Name') or museum.get('museum_name') or museum.get('name', '')
                    if main_name == best_match:
                        museum['Opening_Wednesday'] = wed_hours
                        updated_museums.append({
                            'main_name': main_name,
                            'wed_name': wed_name,
                            'hours': wed_hours,
                            'match_type': f'fuzzy ({score:.2f})'
                        })
                        fuzzy_matches += 1
                        matched = True
                        break
        
        if not matched:
            unmatched_wednesday.append({
                'name': wed_name,
                'hours': wed_hours,
                'url': wed_record.get('url', '')
            })
            no_matches += 1
    
    # Generate output filename if not provided
    if not output_file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if main_data_file.endswith('.json'):
            output_file = f"data/museum_data_with_wednesday_{timestamp}.json"
        else:
            output_file = f"data/museum_data_with_wednesday_{timestamp}.csv"
    
    # Save merged data
    print(f"\n💾 Saving merged data to: {output_file}")
    
    if output_file.endswith('.json'):
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(main_data, f, ensure_ascii=False, indent=2)
    else:
        df = pd.DataFrame(main_data)
        df.to_csv(output_file, index=False, encoding='utf-8')
    
    # Save merge report
    report_file = f"data/merge_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(f"Wednesday Hours Merge Report\n")
        f.write(f"Generated: {datetime.now()}\n")
        f.write(f"=" * 50 + "\n\n")
        
        f.write(f"SUMMARY:\n")
        f.write(f"  Main data museums: {len(main_data)}\n")
        f.write(f"  Wednesday records: {len(wednesday_data)}\n")
        f.write(f"  Exact matches: {exact_matches}\n")
        f.write(f"  Fuzzy matches: {fuzzy_matches}\n")
        f.write(f"  No matches: {no_matches}\n")
        f.write(f"  Total updated: {exact_matches + fuzzy_matches}\n\n")
        
        f.write(f"SUCCESSFUL MATCHES:\n")
        for match in updated_museums:
            f.write(f"  {match['match_type'].upper()}: '{match['main_name']}' <- '{match['wed_name']}' = {match['hours']}\n")
        
        if unmatched_wednesday:
            f.write(f"\nUNMATCHED WEDNESDAY RECORDS:\n")
            for unmatched in unmatched_wednesday:
                f.write(f"  '{unmatched['name']}' = {unmatched['hours']}\n")
    
    # Print summary
    print(f"\n🎉 Merge Complete!")
    print(f"📊 Merge Summary:")
    print(f"   ✅ Exact matches: {exact_matches}")
    print(f"   🔍 Fuzzy matches: {fuzzy_matches}")
    print(f"   ❌ No matches: {no_matches}")
    print(f"   📈 Total updated: {exact_matches + fuzzy_matches}")
    print(f"   📁 Output file: {output_file}")
    print(f"   📝 Report file: {report_file}")
    
    return output_file, report_file

def main():
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python merge_wednesday_hours.py <main_data_file> <wednesday_csv_file> [output_file]")
        print("\nExample:")
        print("  python merge_wednesday_hours.py data/museum_details_full.json data/wednesday_hours_merge_20241231_120000.csv")
        return
    
    main_data_file = sys.argv[1]
    wednesday_csv_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        merge_wednesday_hours(main_data_file, wednesday_csv_file, output_file)
    except Exception as e:
        print(f"❌ Error during merge: {e}")

if __name__ == "__main__":
    main()