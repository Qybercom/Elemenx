<!-- generated -->
# SceneTriggers

SceneTriggers: места сцены, где что-то происходит, — в игре, экскурсии, плане здания или любом другом мире. Объект вида trigger (трейт Trigger) — фигура на земле: Shape circle (Radius вокруг его X и Y), area (Points [[x, z]...]) или line (Points, Width); пусто — область из трёх точек и больше, линия из двух, иначе круг. Height (0 — любая) — как высоко над землёй он достаёт. В него входят пешеходы, транспорт и герой (Kinds: виды того, что учитывается вместо них, с их базовыми видами), его команды Team, если она есть. Сцена генерирует enter, когда кто-то входит, и leave, когда выходит или удаляется, с {Trigger, ID, Object}: Trigger — сам триггер, Trigger(id) сцены ({ID, Inside(), Action(name, data), Enable(on)}): Inside() говорит, кто в нём, обработчик отправляет ему действие, и сцена генерирует action ({Trigger, Name, Data}). Once: срабатывает только первый enter; Enabled false его выключает.

Триггер с Blueprint (граф потока сервиса Blueprints) выполняет его: блоки Event enter и leave запускаются с {Trigger, Object} (ID), действие запускает блок Event со своим именем с {Trigger, Data}; блоки Action вызывают действия, которые сцене дал TriggerActions({Name: function (value, done)}). О графе, который не удалось собрать, сообщается один раз. Действие achievement есть само: значение — ID достижения сервиса Achievements (открывает его) или {ID, Amount} (прибавляет к прогрессу). Achievement у триггера с тем же значением делает это при входе, без графа.

Объект вида zone (трейт Zone: Points или Radius вокруг его X и Y, Tags, Team) — место правил, о которых спрашивает игра: ZonesAt(x, z) возвращает [{ID, Name, Tags, Team}] зон в этом месте — safe, pvp, no-build или любой свой тег.

Триггеры и зоны рисуются и в эскизе земли (Terrain: trigger, triggerpoint, triggerline, zone).

## Методы

- `Trigger(id)`
- `TriggerActions(actions)`
- `ZonesAt(x, z)`

## Тесты

- [takes the base a Component names in $Extends and the Traits of the project into the bundle, the Traits as their own type](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/build-inheritance.test.js#L52) — `tests/regression/build-inheritance.test.js`
