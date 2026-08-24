import os
import glob

replacements = {
    '#FFFFFF': '#000000',
    '#FAFAFA': '#0A0A0A',
    '#F7F7F7': '#1A1A1A',
    '#F0F0F0': '#222222',
    '#E5E5E5': '#333333',
    '#CCCCCC': '#555555',
    '#111111': '#FFFFFF',
    '#333333': '#E0E0E0',
    '#666666': '#999999',
}

files = glob.glob('src/**/*.jsx', recursive=True) + glob.glob('src/**/*.js', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        content = content.replace(old.lower(), new)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

print("Done.")
