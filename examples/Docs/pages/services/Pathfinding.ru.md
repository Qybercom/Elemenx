<!-- generated -->
# Pathfinding

Пути по карте. Grid(width, height, cost) — сетка клеток с ценой входа (1; Infinity — преграда), или Grid(rows, legend) из строк текста (. — 1, # — преграда, цифра — цена, legend {символ: цена}): Get, Set, Block, Free, Passable, Clone. Path(grid, from, to, options) — самый дешёвый путь (A*), [{X, Y}] или null: Diagonal (true), Corners (false — без диагонали мимо закрытой стороны), Nearest (до ближайшей к цели достижимой клетки), Limit. Distances(grid, targets, options) — цена каждой клетки до ближайшей цели (Дейкстра); Flow(grid, targets, options) — поле потока для многих юнитов сразу: Next(x, y), Direction(x, y). Search({Start, Goal, Key, Neighbors, Heuristic, Limit}) — A* на своём графе ({Path, Cost}); Smooth(grid, path) — только углы пути.

## Методы

- `Grid(width, height, cost)`
- `Path(grid, from, to, options)`
- `Distances(grid, targets, options)`
- `Flow(grid, targets, options)`
- `Search(options)`
- `Smooth(grid, path)`
