Пути по карте: по сетке клеток или по своему графу.

- Grid(width, height, cost) возвращает сетку клеток, у каждой своя цена входа (по умолчанию 1; Infinity — преграда). Grid(rows, legend) строит её из строк текста: '.' стоит 1, '#' — преграда, цифра — её цена, legend {символ: цена} добавляет свои. У сетки: Width, Height, Get(x, y) (Infinity за её краем), Set(x, y, cost), Block(x, y), Free(x, y), Passable(x, y), Clone().
- Path(grid, from, to, options): самый дешёвый путь от {X, Y} до {X, Y} (A*), [{X, Y}] от начала до цели, или null. Options: Diagonal (true — восемь направлений), Corners (false — без шага по диагонали мимо закрытой стороны), Nearest (true — до достижимой клетки, ближайшей к цели, когда цель недостижима: юнит, посланный в здание), Limit (сколько клеток осмотреть самое большее). Цены — 1 и больше.
- Distances(grid, targets, options): цена пути от каждой клетки до ближайшей из целей (Дейкстра), список из Width * Height чисел (Infinity — пути нет).
- Flow(grid, targets, options): поле потока к целям, для многих юнитов сразу: {Distances, Next(x, y) (следующая клетка или null), Direction(x, y) ({X, Y} шага: -1, 0 или 1)}.
- Search({Start, Goal, Key, Neighbors, Heuristic, Limit}): A* на своём графе (без Heuristic — Дейкстра): Goal(node) истинно у цели (или это сама цель, сравниваемая по Key), Key(node) — её текст, Neighbors(node) — [{Node, Cost}]; возвращает {Path: [узлы], Cost} или null.
- Smooth(grid, path): путь без клеток, которые он проходит по прямой: только его углы.
