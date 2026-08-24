import os
import glob

replacements = {
    '#000000': '#101010',
    '#0A0A0A': '#101010',
    '#1A1A1A': '#101010',
    '#222222': '#101010',
    '#111111': '#101010',
    '#E5E5E5': '#E4DFDF',
    '#FFFFFF': '#E4DFDF',
    '--bg-base:       #101010;': '--bg-base:       #101010;',
    '--bg-surface:    #101010;': '--bg-surface:    #101010;',
    '--bg-card:       #101010;': '--bg-card:       #101010;',
    '--bg-elevated:   #101010;': '--bg-elevated:   #101010;',
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
