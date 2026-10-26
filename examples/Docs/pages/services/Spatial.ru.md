<!-- generated -->
# Spatial

Где что лежит на плоскости, с быстрым поиском (сетка корзин). Create({Cell}) возвращает индекс (Cell — 64, примерно размер вещей): Set(id, x, y, width, height) кладёт вещь или двигает её (0 на 0 — точка), Remove(id), Has(id), Get(id), Count(), Clear(), Each(callback), Rect(x, y, width, height, filter) — ID вещей, задевающих прямоугольник (рамка выделения), Radius(x, y, radius, filter) — ID в радиусе, ближние первыми (дальность башни), Nearest(x, y, max, filter) — {ID, Distance} или null. Distance(x, y, вещь) — от точки до вещи.

## Методы

- `Distance(x, y, thing)`
- `Create(options)`
