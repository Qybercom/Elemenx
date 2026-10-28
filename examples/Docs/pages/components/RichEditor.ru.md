<!-- generated -->
# RichEditor

Визуальный редактор текста (WYSIWYG). Value — HTML документа, приведённый к схеме сервиса RichText (абзацы, заголовки, цитаты, код, списки, таблицы, изображения, ссылки и стили текста); вставка и перетаскивание проходят через неё же. Своей панели инструментов нет: элементы управления приложения вызывают Command, а маленькое меню над выделением даёт быстрые стили (Menu false его скрывает).

- Value, Placeholder, ReadOnly, Disabled, Label, Rows (наименьшая высота в строках) и MaxRows (наибольшая, дальше — прокрутка; 0 — растёт с текстом), Menu.
- Command(name, value): bold, italic, underline, strike, code; paragraph, heading (value 1–4), quote, codeblock; bullets, numbers, indent, outdent; link (value — адрес; пустой убирает ссылку), unlink; image (value — {Src, Alt} или адрес), table (value — {Rows, Columns}), row, column, row-delete, column-delete, table-delete; rule; clear; undo, redo; plugin (value — имя плагина сервиса RichText или {Name, Text, Attributes}: диаграмма, график, выноска..., по умолчанию — его данные Insert). Возвращает false для неизвестного имени или когда редактировать нельзя.
- Плагин в документе — один блок, в который не заходит курсор, нарисованный своим компонентом; двойное нажатие правит его текст на месте (его собственным редактором, если у него есть Edit), Mod+Enter или уход из него сохраняет текст, Escape оставляет как было.
- Markdown в начале абзаца создаёт блоки: от '# ' до '#### ' — заголовки, '- ' — список, '1. ' — нумерованный список, '> ' — цитата, '``` ' — код. Клавиши: Mod+B, Mod+I, Mod+U, Mod+E (код), Mod+K (событие link), Tab и Shift+Tab в списке меняют вложенность.
- Методы: Focus(), Formats() (что есть в выделении: {Bold, Italic, Underline, Strike, Code, Block, Level, List, Link, Table}), Insert(html), Markdown(), SetMarkdown(text), Text(), Print(options, callback), Find(query, {Case, Word, RegExp}) (возвращает число совпадений, помечает их сервисом Find и показывает то, что у курсора или после него), FindNext(), FindPrevious(), ReplaceCurrent(text), ReplaceAll(text), ClearFind().
- Mod+F открывает панель поиска (FindBar над углом), Mod+R (или Mod+H) — с полем замены; FindBar: false её отключает.
- События: input и change (Value), formats (Formats() при движении выделения), link ({Href, Text}: Mod+K, для диалога приложения), files (вставленные или перетащенные файлы: приложение загружает их и вставляет изображения через Command), ready (редактор).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Placeholder` | `''` |
| `ReadOnly` | `false` |
| `Disabled` | `false` |
| `Label` | `''` |
| `Rows` | `8` |
| `MaxRows` | `24` |
| `Menu` | `true` |
| `FindBar` | `true` |

## События

- `ready`: Редактор готов: сам компонент, чтобы вызывать Command.
- `input`: Документ изменился: его HTML.
- `formats`: Изменились стили у курсора: {Bold, Italic, Underline, Strike, Code, Block, Level, Quote, List, Link, Table}, чтобы подсветить кнопки панели.
- `link`: Нажата ссылка: {Href, Text}.
- `files`: Вставлены или брошены файлы: список File, чтобы приложение их загрузило.
- `change`: Документ зафиксирован при уходе фокуса: Value.

## Методы

- `Find(query, options)`
- `FindNext()`
- `FindPrevious()`
- `ReplaceCurrent(text)`
- `ReplaceAll(text)`
- `ClearFind()`
- `Formats()`
- `Command(name, value)`
- `Focus()`
- `Insert(html)`
- `Markdown()`
- `SetMarkdown(text)`
- `Text()`
- `Print(options, callback)`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Icon="bold" Title="Bold" Size="small" [pressed]="Formats.Bold" (click)="Bold" />
	<Button Icon="italic" Title="Italic" Size="small" [pressed]="Formats.Italic" (click)="Italic" />
	<Button Label="H2" Size="small" (click)="Heading" />
	<Button Icon="list" Title="A list" Size="small" (click)="Bullets" />
	<Button Icon="undo" Title="Undo" Size="small" (click)="Undo" />
	<Button Label="As Markdown" Size="small" (click)="Export" />
</div>
<RichEditor Rows="5" [value]="Html" (ready)="Ready" (formats)="Moved" (change)="Changed" />
<pre class="elemenx-code" *if="Output">{{Output}}</pre>
<script>
(function () {
	var editor = null;

	return {
		Html: '<h2>Notes</h2><p>Select some <strong>text</strong> to see the quick menu. Type <code>- </code> at the start of a line for a list.</p>',
		Formats: {},
		Output: '',

		Ready: function (instance) {
			editor = instance;
		},

		Moved: function (formats) {
			this.Formats = formats;
		},

		Changed: function (html) {
			this.Html = html;
		},

		Bold: function () {
			editor.Command('bold');
		},

		Italic: function () {
			editor.Command('italic');
		},

		Heading: function () {
			editor.Command('heading', 2);
		},

		Bullets: function () {
			editor.Command('bullets');
		},

		Undo: function () {
			editor.Command('undo');
		},

		Export: function () {
			this.Output = editor.Markdown();
		}
	};
})()
</script>
```

## Тесты

- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [a Markdown document takes the classes of the interface with Look interface, and the look of a RichEditor by default](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1923) — `tests/examples/ui-kit.spec.js`
