<!-- generated -->
# GameMaps

Карты GameWorld: свой JSON или карта Tiled (.tmj), приведённые к одному виду. Normalize(map) — {Width, Height, Projection, TileWidth, TileHeight, Terrain: {ключ: {Name, Color, Cost, Opaque, Image, SourceX, SourceY, SourceWidth, SourceHeight}}, Layers: [{Name, Rows или Data}], Objects: [{ID, Kind, X, Y, Width, Height, ...}]}, позиции в клетках. FromTiled(data, base) — слои тайлов с картинками их тайлсетов и свойствами тайла cost и opaque, слои объектов (class или type объекта — его Kind, свойства — его поля), ориентация; base — URL, от которого считаются картинки. Load(url, callback) — JSON любого из двух, (error, map).

## Методы

- `Normalize(map)`
- `FromTiled(data, base)`
- `Load(url, callback)`
