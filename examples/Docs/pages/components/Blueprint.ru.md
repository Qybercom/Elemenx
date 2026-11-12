<!-- generated -->
# Blueprint

Редактор блупринта (граф сервиса Blueprints в JSON Flowprint) на холсте Board: блоки с пинами, связи между ними, палитра типов блоков и параметры графа. Value — граф (объект или текст файла); без него — пустой граф типа Type. Событие change отдаёт граф после каждого действия, select — выбранное, problems — то, что находит Check. ReadOnly показывает граф без правки. Методы: Graph(), Write(), Add(type, x, y), Remove(id), Select(id), SelectMany(ids), Selected(), Chosen(), Undo(), Redo(), Copy(), Paste(), Group(ids, title), Ungroup(id), RemoveGroup(id, content), Comment(id, text), Check(), Compile(options), Arrange(), Fit().

Выбор нескольких блоков: Shift или Ctrl с нажатием добавляет блок или убирает его, Shift с перетаскиванием по пустому месту рисует рамку выбора, Ctrl+A выбирает все. Перетаскивание заголовка одного блока двигает все выбранные, Delete удаляет их.

История: Ctrl+Z и Ctrl+Y (или Ctrl+Shift+Z) отменяют и возвращают каждое изменение (Undo(), Redo()). Ctrl+C, Ctrl+V и Ctrl+D копируют, вставляют и дублируют выбранные блоки вместе со связями между ними (Copy(), Paste()), в том числе между двумя Blueprint на странице.

Группы — ключ groups графа: [{id, title, color, members (ID блоков и групп), comment}]. Группа — рамка вокруг участников с заголовком; группа может быть участником другой группы. Ctrl+G группирует выбранное (Group(ids, title)). Перетаскивание заголовка двигает рамку со всем содержимым, нажатие на заголовок выбирает группу:
- Delete убирает только рамку, участники переходят во внешнюю группу;
- Shift+Delete убирает её вместе с содержимым (RemoveGroup(id, content));
- Ctrl+Shift+G расформировывает (Ungroup(id)).
Двойное нажатие на заголовок переименовывает группу; color (#rrggbb) — цвет рамки.

Комментарии блоков, связей и групп (поле comment Flowprint, Markdown) показываются так, как задаёт Comments:
- caption (по умолчанию) — строка мелким приглушённым шрифтом под блоком, у группы — под заголовком внутри рамки, у связи — у её середины;
- icon — метка с текстом во всплывающей подсказке;
- hidden — не показываются.
Двойное нажатие на заголовок блока или на комментарий открывает правку (Ctrl+Enter сохраняет, Escape отменяет); из кода — Comment(id, text). Событие select сообщает {Block, Link, Group, Blocks}.

EditCheck (action, target) решает, что можно читателю; false запрещает действие, а событие denied сообщает {Action, ...цель}:
- add {Type}, remove {Blocks, Link, Group, Content}, paste {};
- link {From, To} (пины), unlink {Pin};
- edit {Block, Property}, move {Blocks};
- group {Blocks}, ungroup {Group}, rename {Group}, comment {Target};
- parameter {Change (add, remove, set), Index, Field}.
Отказанное остаётся как было. ReadOnly работает раньше EditCheck: то, что он и так запрещает, не спрашивается; методы, вызванные из кода, тоже.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Type` | `'flow'` |
| `Palette` | `true` |
| `ReadOnly` | `false` |
| `EditCheck` | `null` |
| `Errors` | `null` |
| `Comments` | `'caption'` |
| `Label` | `''` |

## События

- `problems`
- `denied`
- `select`
- `change`

## Методы

- `Graph()`
- `Write()`
- `Add(type, x, y)`
- `Remove(id)`
- `Select(id)`
- `SelectMany(ids)`
- `Selected()`
- `Chosen()`
- `Undo()`
- `Redo()`
- `Copy()`
- `Paste()`
- `Group(ids, title)`
- `Ungroup(id)`
- `RemoveGroup(id, content)`
- `Comment(id, text)`
- `Check()`
- `Compile(options)`
- `Fit()`
- `Arrange()`

## Тесты

- [burns an effect of a Blueprint, its parameters the values of its layers, one graph for many effects](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L147) — `tests/regression/library-effect-blueprints.test.js`
- [burns nothing of a Blueprint that cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L190) — `tests/regression/library-effect-blueprints.test.js`
- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L73) — `tests/regression/library-material-blueprints.test.js`
- [draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L199) — `tests/regression/library-material-blueprints.test.js`
- [draws a material as it is when its Blueprint cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L264) — `tests/regression/library-material-blueprints.test.js`
- [shows the parameters of the Blueprint of an effect, sets them on it, and edits its graph under the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L241) — `tests/regression/library-scene-editor.test.js`
- [tells a wind, a ground and a pass of its own that do not compile, draws the ones of the library, and goes on](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-shader-errors.test.js#L26) — `tests/regression/library-shader-errors.test.js`
- [marks on a block of a Blueprint the errors its owner gives it, with their lines](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-shader-errors.test.js#L126) — `tests/regression/library-shader-errors.test.js`
- [shows the blocks where they stand with their pins, the links between the pins, and the file it keeps](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L79) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`
- [draws a link by a drag from a pin to another, takes the place of the one there, and takes one away let go on nothing](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L115) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`
- [fits all of its blocks into the view, not the corner of its canvas (regression: it fitted a canvas 1 pixel large)](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L158) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`
- [moves a block by its head, and the links follow it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L188) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`

+10 ещё в тех же файлах
