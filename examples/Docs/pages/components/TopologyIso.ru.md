<!-- generated -->
# TopologyIso

Topology в 3D (вид isometric компонента Topology или отдельно): узлы — фигуры на полу из клеток, вид сверху под углом, который можно поворачивать. Рисуется на canvas, поэтому тысячи узлов остаются плавными; для клавиатуры и экранных дикторов есть скрытый список узлов.

Nodes — [{ID, Label, Kind, Shape, Color, Size, Icon, Status, Active, Load, X, Y, Comment}]:
- Kind — тип из TopologyKinds: форма, цвет, размер, значок и то, как показывается нагрузка; Shape, Color, Size, Icon переопределяют его;
- Status (ok, warning, error, off) — цвет площадки под узлом;
- Active — свечение вокруг основания; без него узел немного приглушён;
- Load (от 0 до 1) — нагрузка, как её показывает тип: заполнение, пульсация, высота или дуга;
- X и Y — клетка узла; без них узел раскладывается сам (Layout);
- Comment — Markdown.

Links — [{From, To, Label, Status, Kind (dashed — пунктир), Load (скорость бегущих штрихов, толщина и цвет), Comment}]. Groups — [{ID, Title, Color, Members (ID узлов и групп), Collapsed, Comment}]: зоны на полу вокруг участников, группы могут быть вложенными. Свёрнутая группа — один узел из всех её участников: худший статус, активна, если активен хоть один, нагрузка — средняя; связи участников становятся её связями.

Управление:
- Angle (45) и Tilt (35) задают поворот и наклон вида;
- перетаскивание правой кнопкой (или с Alt) поворачивает и наклоняет, Q и E поворачивают на четверть, колесо приближает к указателю, перетаскивание пола сдвигает вид, 0 вписывает всё;
- нажатие выбирает узел, связь или группу (по заголовку) и подсвечивает связанное — событие select {Node, Link, Group};
- перетаскиваемый узел встаёт в клетку, где его отпустили (move {Node, X, Y}); группа, перетаскиваемая за заголовок, двигается вместе с участниками;
- двойное нажатие (или Enter) открывает узел (open {Node}) либо сворачивает и разворачивает группу (toggle {Group, Collapsed});
- view {Angle, Tilt, Zoom} сообщает о повороте, наклоне и масштабе.

Comments задаёт показ комментариев: caption (по умолчанию: приглушённая строка Markdown под именем), icon (метка, текст во всплывающей подсказке) или hidden.

Группа раскладывается целиком, вложенные группы — внутри неё, поэтому зона группы содержит только своих участников.

Поиск, путь, легенда, мини-карта:
- Search подсвечивает узлы, в имени, ID, типе или комментарии которых есть текст, остальные приглушаются; Find(text) возвращает их ID, Show(id) подводит к узлу камеру;
- Legend показывает в углу типы узлов с цветом и количеством; нажатие на тип подсвечивает его узлы, повторное — снимает подсветку;
- Minimap показывает пол сверху в углу, вид — рамкой; нажатие или перетаскивание по мини-карте переносит вид;
- Shift с нажатием на второй узел (при выбранном первом) подсвечивает кратчайший путь между ними — Path(from, to), событие path {From, To, Nodes, Links}; Escape снимает его.

Права: ReadOnly запрещает перетаскивание и сворачивание групп нажатием; EditCheck (action, target) возвращает false для запрещённого: move {Node}, group {Group} (перетаскивание группы за заголовок), toggle {Group}. Отказ сообщается событием denied {Action, Node или Group}. Методы, вызванные из кода, не проверяются.

Snapshot() сохраняет вид, перетащенные узлы и свёрнутые группы, Restore(snapshot) возвращает их.

При мелком масштабе узлы рисуются простыми блоками, а связи — неподвижными линиями: так тысяча узлов укладывается в кадр.

Методы: Arrange(layout), Fit(), Select(id) (узел, link:<номер> или group:<ID>), Selected(), Places() ({ID: {X, Y}} в клетках), Rotate(degrees), Update(id, changes) (что показывает узел или связь link:<номер>, без новой раскладки), Toggle(group), ToScreen(id) ({X, Y} на странице), Picture() (PNG как data URL), Find(text), Show(id), Path(from, to), Snapshot(), Restore(snapshot).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Nodes` | `[]` |
| `Links` | `[]` |
| `Groups` | `[]` |
| `Angle` | `45` |
| `Tilt` | `35` |
| `Comments` | `'caption'` |
| `Search` | `''` |
| `Legend` | `false` |
| `Minimap` | `false` |
| `ReadOnly` | `false` |
| `EditCheck` | `null` |
| `Label` | `''` |

## События

- `path`
- `denied`
- `move`
- `open`
- `view`
- `select`
- `toggle`

## Методы

- `Arrange(layout)`
- `Find(text)`
- `Path(from, to)`
- `Show(id)`
- `Snapshot()`
- `Restore(snapshot)`
- `Select(id)`
- `Selected()`
- `Places()`
- `Rotate(degrees)`
- `Update(id, changes)`
- `Toggle(id)`
- `Fit()`
- `ToScreen(id)`
- `Picture()`

## Тесты

- [draws its nodes on the canvas and lists them for a screen reader, a button each](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L73) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [is the view of a Topology with View isometric](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L85) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [selects a node pressed, telling it in select](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L94) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [turns: Rotate moves the nodes on the screen, a quarter at a time, and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L116) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [moves a node dragged by whole cells and tells it in move](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L141) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [folds a group into one node of its members, its links its own, and unfolds it; nested groups fold with the outer one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L169) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [changes what a node carries with Update, laid out as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L207) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [glows round the foot of an active node; an inactive one has no glow](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L229) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [fits what it shows once it has a size, when it was hidden at first](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L242) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [draws a thousand nodes in a hundred groups in a frame of the screen or so](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L259) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [lays out a group in one piece: the zones of two groups linked across hold none of the other](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L313) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [finds nodes by a text in their name, ID, kind or comment; Search lights them and dims the others; Show brings one in view](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L362) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`

+7 ещё в тех же файлах
