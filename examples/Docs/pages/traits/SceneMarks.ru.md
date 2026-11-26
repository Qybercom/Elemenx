<!-- generated -->
# SceneMarks

SceneMarks: элементы страницы над местами сцены, которые раскладываются заново на каждом кадре. Подписи объектов (Labels), рамки целей GameTargets и метки на карте галактики — тоже такие метки.

Mark(key, options) ставит метку (повторный вызов меняет её, null убирает), Unmark(key) убирает, MarksOnScreen() сообщает, где каждая: [{Key, X, Y, Shown, Why, Edge, Moved, Cluster, Count, Opacity}]. Why — почему метка не показана: off (вне вида), behind (за глазом), hidden (за телом или рельефом), far (слишком далеко), crowded (нет места), clustered (вошла в кластер), filtered (Shown вернул false).

Параметры:
- Element — сам элемент (любой компонент: карточка, полоска, график Chart или Sparkline, Meter). Он остаётся там, где стоит в странице, и двигается transform от левого верхнего угла сцены; удобнее всего слот hud, так делает SceneMark.
- Где: Object (ID объекта; над его серединой на Up его размеров, 1.15; Part — гнездо его модели, как его даёт Socket), Point ([x, y, z] мира) или At (функция, дающая такую точку). Offset [x, y, z] прибавляется к точке, Shift [x, y] — пиксели. Screen — функция, дающая точку [x, y] прямо на сцене, для вида со своей проекцией (так ставятся метки карты галактики). Align — что стоит на точке: bottom (низ, по умолчанию), top, center, left, right.
- Line: true — линия от точки к метке всегда, auto (по умолчанию) — когда метку пришлось сдвинуть, false — никогда.
- Occlude (true для объекта): метка прячется за телом (звездой, планетой, луной) и за рельефом (Visible). Тела проверяются 5 раз в секунду.
- Edge: когда точка вне вида или за глазом, метка стоит у края вида, рядом стрелка к точке (data-edge="true" на элементе).
- Declutter (true): метка сдвигается вверх, вниз или вбок ровно настолько, чтобы не лечь на уже разложенные (сначала большие Priority, потом ближние), и по возможности остаётся внутри вида; если места нет, она прячется или входит в свой Cluster.
- Cluster — имя: метки этого кластера, чьи точки ближе ClusterRadius пикселей (36) друг к другу, показываются как одна с бейджем +N. Нажатие на бейдж — событие сцены markcluster {Cluster, Keys}, вид летит к ним.
- Near и Far — метры: ближе Near метка видна целиком, на Far исчезает, между ними гаснет.
- Shown(mark) — своё правило игры (false прячет), Priority (0, может быть функцией).

## Методы

- `Mark(key, options)`
- `Unmark(key)`
- `MarksOnScreen()`

## Тесты

- [puts an element over its point, moves another off it with a line, and the names of the objects are marks too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L89) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [follows its object as it goes round its star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L136) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [hides one behind a body, one too far; one behind the eye shows at the edge with an arrow when it may](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L166) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [shows marks of a cluster near each other as one with a badge +N, a press on it told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L200) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [lays out what a SceneMark holds over its object, as its props say](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L228) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
