import os
import glob

replacements = {
    'bg-[#101010]': 'bg-[#141414]',
    'border-[#333333]': 'border-[#2A2A2A]',
    'border-[#444444]': 'border-[#3A3A3A]',
    'border: \'1px solid #333333\'': 'border: \'1px solid #2A2A2A\'',
    "background: '#101010'": "background: '#171717'",
    '#333333': '#2A2A2A',  # General border/hover color tweak
}

files = glob.glob('src/**/*.jsx', recursive=True) + glob.glob('src/**/*.js', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

print("Done.")
