import os

filepath = 'src/index.css'
with open(filepath, 'r') as f:
    content = f.read()

replacements = {
    '--bg-surface:    #101010;': '--bg-surface:    #171717;',
    '--bg-card:       #101010;': '--bg-card:       #141414;',
    '--bg-elevated:   #101010;': '--bg-elevated:   #1A1A1A;',
    '--border:         #333333;': '--border:         #2A2A2A;',
    '--border-hover:   #333333;': '--border-hover:   #3A3A3A;',
    'background: #101010;\n    color: var(--text-primary);\n    font-weight: 500;': 'background: #222222;\n    color: var(--text-primary);\n    font-weight: 500;',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated index.css")

