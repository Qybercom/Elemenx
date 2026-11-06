Типы узлов Topology в 3D и фигуры, которыми они рисуются: что представляет собой узел, определяет, как он выглядит и как показывает нагрузку.

Define(kind, {Shape, Color, Size, Icon, Load, Active}) объявляет тип:
- Shape — фигура (см. ниже);
- Color — #rrggbb или токен темы: accent, info, success, warning, danger, muted;
- Size — размер, 1 — одна клетка;
- Icon — значок на верхней грани;
- Load — как показывается нагрузка (от 0 до 1): fill (уровень внутри, как у хранилища), pulse (свечение пульсирует быстрее и ярче), height (фигура растёт), ring (дуга вокруг основания), none или функция (context, node), которая рисует её сама;
- Active — как показывается активность: glow (свечение вокруг основания, по умолчанию) или функция.

Kind(kind) возвращает тип целиком; неизвестный тип рисуется как server. Kinds() — имена типов.

Shape(name, {Draw (context)}) объявляет фигуру. context: Canvas (2D), Project ([x, y, z] → [x, y] экрана; y вверх, клетка пола — 1), Prism (base [[x, z]...], bottom, top, color, alpha — призма с гранями, освещёнными так, как их видит камера), Disc (x, z, y, radius, color, alpha), Center [x, z], Size, Height, Color [r, g, b], Alpha. Shapes() — имена фигур. Встроенные: cube, cylinder, hex, stack, pyramid, sphere, cloud.

Встроенные типы: server, host, switch, router, firewall, database, storage, cluster, service, queue, cloud, internet, user, device.

Тип или фигура, которые объявляет Service ($Provides: {TopologyKinds: {Kinds: [...], Shapes: [...]}}), создаются, когда их запрашивают.
