<!-- generated -->
# CutsceneEditor

Редактор катсцен сцены (SceneCinema) на шкале времени (Timeline): каждая дорожка — своя полоса, её ключи и пункты — отрезки на ней. Их можно перетаскивать по времени, а титр, субтитр и облёт — ещё и растягивать за края. Плейхед — момент, который показывает сцена: нажатие на шкалу переходит туда. Справа — поля выбранного (числа читаются как числа, JSON — как JSON).

Value — катсцены по имени ({Имя: {Tracks, Restore, Skip, Loop}}, как Cutscenes сцены); change выдаёт их после каждой правки. Scene — сцена (компонент), где они играют: «Смотреть» играет катсцену с плейхеда, «Записать» играет её с начала как видео и отдаёт файл (событие record {Name, Video}). Target — объект, к которому по умолчанию относятся движение, склейка и клип (выделение редактора). «Добавить…» ставит ключ или пункт выбранного типа на плейхед (в дорожку этого типа, её создаёт при необходимости). «Камера из вида» просит камеру там, где сейчас вид сцены (событие camera {Props}). «Ключ из вида» ставит ключ движения Target в текущей точке вида на плейхеде.

Методы: Cutscene() (редактируемая), Add(type), Remove(), Preview(seconds), Play(), Stop(), Record().

В SceneEditor он открывается кнопкой «Катсцены» на панели инструментов и стоит под видом, на месте графов. Каждая правка — один шаг отмены. Виды camera и screen есть в палитре.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Scene` | `null` |
| `Target` | `''` |
| `Label` | `''` |

## События

- `change`
- `camera`
- `record`

## Методы

- `Cutscene()`
- `Add(type)`
- `Remove()`
- `Preview(seconds)`
- `Play()`
- `Stop()`
- `Record()`

## Тесты

- [creates a cutscene, adds what a film has at the playhead as ranges of its lanes, moves them, edits their fields, takes them away](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js#L53) — `libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js`
- [shows the Scene at the moment the playhead is at, keys the move of its target where the view is, asks for a camera there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js#L111) — `libraries/ElemenxGraphics/components/CutsceneEditor/CutsceneEditor.test.js`
