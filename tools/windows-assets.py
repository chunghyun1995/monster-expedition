"""Create required MSIX icon sizes from the game's existing icon."""
import sys
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
dest=Path(sys.argv[1]);dest.mkdir(parents=True,exist_ok=True)
src=Image.open(root/'godot/icon.png').convert('RGBA')
for name,size in [('Square44x44Logo',44),('Square150x150Logo',150),('StoreLogo',50)]:
    src.resize((size,size),Image.Resampling.LANCZOS).save(dest/(name+'.png'))
