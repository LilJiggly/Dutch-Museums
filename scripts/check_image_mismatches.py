import json
import os
import re

def clean_filename(name):
    """Clean filename using the same logic as before"""
    clean_name = name.lower()
    clean_name = re.sub(r'[&|,\'"(){}[\]]', '', clean_name)  # Remove these chars
    clean_name = re.sub(r'[/\\-]', '_', clean_name)  # Replace with underscore
    clean_name = re.sub(r'[^\w\s_]', '', clean_name)  # Remove any remaining special chars
    clean_name = re.sub(r'\s+', '_', clean_name)  # Replace spaces with underscores
    clean_name = re.sub(r'_+', '_', clean_name)  # Replace multiple underscores with single
    clean_name = clean_name.strip('_')  # Remove leading/trailing underscores
    return clean_name

# Load JSON data
print("📖 Loading museum data...")
with open("data/museum_details_full.json", "r", encoding="utf-8") as f:
    museums = json.load(f)

# Get list of actual image files
print("🖼️ Scanning image files...")
image_files = set()
if os.path.exists("images"):
    for file in os.listdir("images"):
        if file.lower().endswith('.jpg'):
            image_files.add(file)

print(f"Found {len(image_files)} image files")

# Check for mismatches
mismatches = []
missing_images = []
fixed_count = 0

print("\n🔍 Checking for mismatches...")

for museum in museums:
    name = museum.get("Name", "")
    current_image_path = museum.get("Image", "")
    
    if not current_image_path or not name:
        continue
    
    # Extract current filename
    current_filename = os.path.basename(current_image_path)
    
    # Check if current filename exists
    if current_filename not in image_files:
        # Generate what the clean filename should be
        clean_name = clean_filename(name)
        expected_filename = clean_name + ".jpg"
        
        if expected_filename in image_files:
            # Found a mismatch that can be fixed
            mismatches.append({
                'museum': name,
                'current': current_filename,
                'expected': expected_filename,
                'fixable': True
            })
            
            # Fix it
            museum["Image"] = f"images/{expected_filename}"
            fixed_count += 1
        else:
            # Image is completely missing
            missing_images.append({
                'museum': name,
                'current': current_filename,
                'expected': expected_filename
            })
            mismatches.append({
                'museum': name,
                'current': current_filename,
                'expected': expected_filename,
                'fixable': False
            })

# Show results
print(f"\n📊 Results:")
print(f"   Total museums: {len(museums)}")
print(f"   Mismatches found: {len(mismatches)}")
print(f"   Fixed automatically: {fixed_count}")
print(f"   Missing images: {len(missing_images)}")

if mismatches:
    print(f"\n❌ Image Mismatches:")
    for mismatch in mismatches[:10]:  # Show first 10
        status = "✅ FIXED" if mismatch['fixable'] else "❌ MISSING"
        print(f"   {status} {mismatch['museum']}")
        print(f"      Current:  {mismatch['current']}")
        print(f"      Expected: {mismatch['expected']}")
        print()
    
    if len(mismatches) > 10:
        print(f"   ... and {len(mismatches) - 10} more")

# Save fixed JSON if we made changes
if fixed_count > 0:
    print(f"\n💾 Saving {fixed_count} fixes to JSON...")
    with open("data/museum_details_full.json", "w", encoding="utf-8") as f:
        json.dump(museums, f, indent=2, ensure_ascii=False)
    print("✅ JSON updated with correct image paths")

if missing_images:
    print(f"\n⚠️ Missing Images (need to be created or found):")
    for missing in missing_images[:5]:
        print(f"   {missing['museum']} -> {missing['expected']}")
    if len(missing_images) > 5:
        print(f"   ... and {len(missing_images) - 5} more")

print(f"\n🎯 Summary: {fixed_count} images fixed, {len(missing_images)} still missing")