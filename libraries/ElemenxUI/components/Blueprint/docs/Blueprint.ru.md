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
