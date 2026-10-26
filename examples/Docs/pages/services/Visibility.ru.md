<!-- generated -->
# Visibility

Что видно на сетке (opaque — функция (x, y) или сетка Pathfinding, её преграды закрывают обзор). Line(x0, y0, x1, y1) — клетки прямой, Sight(opaque, x0, y0, x1, y1) — видит ли одна клетка другую, Field(opaque, x, y, radius) — поле зрения (shadowcasting: {Cells, Count, Has(x, y)}), Fog(width, height) — туман войны: каждая клетка неизвестна (0), разведана (1) или видна сейчас (2); Get, Seen, Explored, Show(field), Hide() (видимое снова разведанное — перед полями нового кадра), Reveal(opaque, x, y, radius), Reset().

## Методы

- `Line(x0, y0, x1, y1)`
- `Sight(opaque, x0, y0, x1, y1)`
- `Field(opaque, x, y, radius)`
- `Fog(width, height)`
