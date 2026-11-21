<!-- generated -->
# EditorPanes

EditorPanes: панели редактора нужной ширины — край панели перетаскивается (*resizable), ширина запоминается в браузере для каждого редактора по его PanesKey.

- PaneWidth(name, fallback) — ширина панели в CSS ('220px'), запомненная или заданная по умолчанию.
- PaneResized(name, event) — запомнить ширину, на которой закончилось перетаскивание края (событие resizeend директивы *resizable).

Трейт библиотеки ElemenxUI. Используют SceneEditor, PlanetEditor, ModelEditor, WorldEditor, FloraEditor, CutsceneEditor, TextureLab (ElemenxGraphics) и Blueprint (ElemenxUI).

## Методы

- `PaneWidth(name, fallback)`
- `PaneResized(name, event)`
