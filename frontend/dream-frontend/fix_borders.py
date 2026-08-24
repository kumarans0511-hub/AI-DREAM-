import os
import glob

replacements = {
    '#E0E0E0': '#333333',
    '#555555': '#444444',
    '--border:         #101010;': '--border:         #333333;',
}

files = glob.glob('src/**/*.jsx', recursive=True) + glob.glob('src/**/*.js', recursive=True) + glob.glob('src/**/*.css', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        content = content.replace(old.lower(), new.lower())
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

print("Done.")
