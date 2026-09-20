from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/pring-pongas-identidade-visual.png')
target = Path('/home/ubuntu/pring-pongas/client/src/assets/pring-pongas-identidade-visual.webp')
target.parent.mkdir(parents=True, exist_ok=True)
image = Image.open(source).convert('RGB')
max_width = 1600
if image.width > max_width:
    height = round(image.height * max_width / image.width)
    image = image.resize((max_width, height), Image.Resampling.LANCZOS)
image.save(target, 'WEBP', quality=82, method=6)
print(f'{target} {target.stat().st_size} bytes {image.width}x{image.height}')
