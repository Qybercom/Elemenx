<!-- generated -->
# ScenePhysics

Rigid: твёрдые предметы на земле, которые падают, катятся, кувыркаются и опрокидываются, — по миру World сервиса Physics. Объект с трейтом Rigid ({Shape: box, sphere или capsule; Size [x, y, z], Radius, Height, Mass (0 — никогда не движется), Bounce, Friction, Rolling}) начинает в своих X и Y, на Lift над землёй, повёрнутым по Facing; дальше его двигает мир, и он лежит так, как упал. Пешеходы и герой — капсулы, которые мир сдвинуть не может (Radius 0.4, высота 1.8), они толкают то, во что упираются. Земля — это земля сцены.

Сцена генерирует touch ({ID, With (null — земля), At, Normal, Impulse}), когда два тела начинают касаться. Push(id, impulse, at) толкает тело (импульс [x, y, z] в Н·с в точке, по умолчанию в его середине), CastRay(from, direction, max) возвращает первое попадание вдоль луча {ID (null — земля), At, Normal, Distance} или null; RigidWorld() — сам World.

## Методы

- `Push(id, impulse, at)`
- `CastRay(from, direction, max)`
- `RigidWorld()`
