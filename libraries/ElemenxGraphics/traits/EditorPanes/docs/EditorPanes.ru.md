EditorPanes: панели редактора нужной ширины — край панели перетаскивается (*resizable), ширина запоминается в браузере для каждого редактора по его PanesKey.

- PaneWidth(name, fallback) — ширина панели в CSS ('220px'), запомненная или заданная по умолчанию.
- PaneResized(name, event) — запомнить ширину, на которой закончилось перетаскивание края (событие resizeend директивы *resizable).

Используют SceneEditor, PlanetEditor, ModelEditor и WorldEditor.
