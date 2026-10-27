<!-- generated -->
# CodeEditor

Редактор исходного кода: настоящая <textarea> (ввод, IME, отмена браузера, экранные читалки и мобильные клавиатуры работают как в любом поле) поверх слоя, рисующего текст с подсветкой сервиса Syntax. Своей панели инструментов нет: элементы управления приложения вызывают его методы (событие ready даёт редактор).

- Value, Language (язык сервиса Syntax), LineNumbers, Wrap, TabSize, Spaces (отступы пробелами, а не табуляцией), Pairs (закрывает скобки и кавычки), ActiveLine, ReadOnly, Disabled, Invalid, Placeholder, Name, Label; Rows (видимые строки) или AutoSize (растёт с текстом).
- Markers: [{Line, Column, EndLine, EndColumn, Severity, Message}] подчёркивают текст (строки и столбцы с 1; без Column — вся строка; без конца — слово). Severity: error, warning или info. Указатель над маркером показывает его сообщение.
- Complete(context, callback) предлагает дополнения при вводе слова (и по Ctrl+Space): context — {Text, Offset, Line, Column, Word, Before, Language, Explicit}; callback(error, items), items — [{Label, Insert, Detail, Kind}] или строки. Показываются варианты, начинающиеся со слова; Enter или Tab вставляют выбранный.
- Hint(context, callback) показывает подсказку для текста под указателем: callback(error, text).
- Клавиши: Tab и Shift+Tab — отступ вправо и влево (Escape, затем Tab — выход из редактора), Enter сохраняет отступ, Mod+/ комментирует строки, Mod+] и Mod+[ — отступы, Ctrl+Space — дополнение, Mod+F ищет и Mod+R (или Mod+H) заменяет в собственной панели поиска (FindBar над углом; FindBar: false оставляет поиск странице).
- Методы: Focus(), Selection() ({Start, End, Text}), Select(start, end), Insert(text), Replace(start, end, text), Position(offset) ({Line, Column}), Offset(line, column), GoTo(line, column), Undo(), Redo(), Indent(), Outdent(), Comment(), Find(query, {Case, Word, RegExp}) (возвращает число совпадений и выделяет следующее), FindNext(), FindPrevious(), ReplaceCurrent(text), ReplaceAll(text), ClearFind(), Print(options, callback) (сервис Print).
- Режим сравнения: с Original (прежний текст) и Diff 'unified' (одна колонка; также true) или 'split' (два текста рядом) редактор показывает, чем Value отличается от Original, только для чтения: удалённые и добавленные строки в своих цветах, изменённые слова внутри строки помечены, номера строк обоих текстов, подсветка как при редактировании; неизменённые участки сворачиваются до Context строк (3) вокруг изменений, нажатие на свёрнутое раскрывает его. DiffStats() возвращает {Added, Removed}; NextChange() и PreviousChange() прокручивают к изменению.
- События: input и change (Value), cursor ({Line, Column, Start, End}), ready (редактор).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Language` | `'text'` |
| `LineNumbers` | `true` |
| `Wrap` | `false` |
| `TabSize` | `4` |
| `Spaces` | `false` |
| `Pairs` | `true` |
| `ActiveLine` | `true` |
| `ReadOnly` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Placeholder` | `''` |
| `Name` | `null` |
| `Label` | `''` |
| `Rows` | `12` |
| `AutoSize` | `false` |
| `Markers` | `[]` |
| `Complete` | `null` |
| `Hint` | `null` |
| `Original` | `null` |
| `Diff` | `false` |
| `Context` | `3` |
| `FindBar` | `true` |

## События

- `ready`: Редактор готов: сам компонент, чтобы вызывать его методы.
- `cursor`: Курсор или выделение сдвинулись: {Line, Column, Start, End}.
- `input`: Код изменился при вводе: Value.
- `change`: Код зафиксирован при уходе фокуса: Value.
- `complete`: Принято дополнение: выбранный пункт.

## Методы

- `Indent()`
- `Outdent()`
- `Comment()`
- `Focus()`
- `Selection()`
- `Select(start, end)`
- `Insert(text)`
- `Replace(start, end, text)`
- `Position(offset)`
- `Offset(line, column)`
- `GoTo(line, column)`
- `Undo()`
- `Redo()`
- `Find(query, options)`
- `FindNext()`
- `FindPrevious()`
- `ReplaceCurrent(text)`
- `ReplaceAll(text)`
- `ClearFind()`
- `Print(options, callback)`
- `DiffStats()`
- `NextChange()`
- `PreviousChange()`

## Пример

```example
<RadioGroup Variant="segmented" [options]="[{Value: 'javascript', Label: 'JavaScript'}, {Value: 'python', Label: 'Python'}, {Value: 'sql', Label: 'SQL'}]" [value]="Language" (change)="Chose" />
<CodeEditor [language]="Language" [value]="Code" LineNumbers="true" Rows="8" Pairs="true" (input)="Typed" (cursor)="Moved" />
<p class="elemenx-text small muted">{{Code.length}} characters · {{Cursor}} · Mod+F finds, Mod+H replaces, Mod+/ comments a line.</p>
<script>
({
	Language: 'javascript',
	Cursor: '',
	Code: "/* A counter. */\nfunction count (limit) {\n\tvar total = 0;\n\n\tfor (var i = 0; i < limit; i++)\n\t\ttotal += i;\n\n\treturn total;\n}\n",
	Samples: {
		javascript: "/* A counter. */\nfunction count (limit) {\n\tvar total = 0;\n\n\tfor (var i = 0; i < limit; i++)\n\t\ttotal += i;\n\n\treturn total;\n}\n",
		python: "def count(limit):\n\t\"\"\"A counter.\"\"\"\n\treturn sum(range(limit))  # the total\n",
		sql: "SELECT name, COUNT(*) AS orders\nFROM users\nGROUP BY name;\n"
	},

	Chose: function (value) {
		this.Language = value;
		this.Code = this.Samples[value];
	},

	Typed: function (value) {
		this.Code = value;
	},

	Moved: function (cursor) {
		this.Cursor = 'line ' + cursor.Line + ', column ' + cursor.Column;
	}
})
</script>
```
