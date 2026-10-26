<!-- generated -->
# GameMaps

The maps of GameWorld: its own JSON, or a map of Tiled (.tmj), made into one form.

- Normalize(map) returns the map GameWorld draws: {Width, Height, Projection (orthogonal or isometric), TileWidth, TileHeight, Terrain: {key: {Name, Color, Cost, Opaque, Image, SourceX, SourceY, SourceWidth, SourceHeight}}, Layers: [{Name, Cells (Width * Height keys of Terrain, null where empty)}], Objects: [{ID, Kind, X, Y, Width, Height, Team, ...}]}. A layer of the JSON gives Rows (lines of text, a character a key of Terrain: '.' grass, '~' water...) or Data (the keys, row by row).
- FromTiled(data, base) reads a map of Tiled: its tile layers (each tile a key of Terrain, drawn with the picture of its tileset; the properties cost and opaque of a tile, Color for a picture missing), its object layers (the class or type of an object its Kind: unit, building or anything else, its properties its fields) and its orientation. base: the URL the pictures of the tilesets are relative to.
- Load(url, callback): fetches a map (JSON of its own or of Tiled) and calls back (error, map).

Positions are in cells: X across, Y down (on an isometric map, along its two edges).

## Methods

- `Normalize(map)`
- `FromTiled(data, base)`
- `Load(url, callback)`
