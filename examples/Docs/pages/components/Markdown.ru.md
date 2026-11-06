<!-- generated -->
# Markdown

Документ на Markdown для показа: Value читает сервис RichText (CommonMark с таблицами, зачёркиванием и блоками кода GitHub) и приводит к своей схеме, так что ничего в нём не выполняется. Код блока, где указан язык (```js), подсвечивается сервисом Syntax (Highlight, по умолчанию включено). Look: 'document' (по умолчанию) — как текст RichEditor (классы elemenx-document); 'interface' — с классами интерфейса библиотеки, как страница приложения: таблица — elemenx-table, список — elemenx-ul или elemenx-ol, цитата — elemenx-callout, ссылка — elemenx-link, код (блок или в строке) — elemenx-code, черта — elemenx-divider. Без Value текст берётся из тела элемента (<Markdown>## Заголовок</Markdown>) без общего отступа его строк; тело отслеживается при изменениях. Плагины сервиса RichText рисуют то, для чего в Markdown нет элемента: ```mermaid — Diagram, ```chart — Chart, ::: warning — выноску... (RichText.Extend добавляет свои).

Задачи: пункты списка, начинающиеся с [ ] или [x] (- [ ] купить молоко), становятся флажками. Tasks="readonly" (по умолчанию) только показывает их, Tasks="editable" позволяет отмечать. TaskCheck — функция пункта {Index, Checked, Text}: если она вернёт false, пункт останется как был и придёт событие taskdenied (например, отмечать может только владелец списка или администратор). Отметка записывает [x] или [ ] в текст и сообщает task ({Index, Checked, Text, Value}) и change ({Value}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Highlight` | `true` |
| `Look` | `'document'` |
| `Tasks` | `'readonly'` |
| `TaskCheck` | `null` |
| `Label` | `''` |

## События

- `taskdenied`
- `task`
- `change`

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="flex: 1 1 260px;"><TextArea [value]="Text" Rows="12" (input)="Typed" /></div>
	<div style="flex: 1 1 260px;">
		<RadioGroup Variant="segmented" Size="small" Label="Look" [options]="Looks" [value]="Look" (change)="Looked" />
		<Markdown [value]="Text" [look]="Look" />
	</div>
</div>
<script>
({
	Text: '## Release notes\n\nSome **bold**, some *italic*, ~~a strike~~ and a [link](https://example.com).\n\n- Faster lists\n- New icons\n\n| Size | Time |\n| --- | --- |\n| 1 000 | 4 ms |\n| 10 000 | 31 ms |\n\n```js\nvar app = Elemenx.Application({});\n```\n\n> Raw HTML is kept to the schema: nothing in it runs.\n',

	Look: 'document',
	Looks: [{Value: 'document', Label: 'document'}, {Value: 'interface', Label: 'interface'}],

	Looked: function (value) {
		this.Look = value;
	},

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```

## Тесты

- [describes the extensions once, in editors/extension.json, with a description in Markdown and a logo](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/editors-branding.test.js#L18) — `tests/regression/editors-branding.test.js`
- [is the plugin of a ```mermaid fence in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L255) — `tests/regression/library-diagrams.test.js`
- [draws a box for each task, ticked as written, only shown by default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/markdown-tasks.test.js#L32) — `tests/regression/markdown-tasks.test.js`
- [ticks a task when editable: writes it into the text and tells task and change; TaskCheck refuses whom it will](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/markdown-tasks.test.js#L48) — `tests/regression/markdown-tasks.test.js`
- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L203) — `tests/regression/rich-plugins.test.js`
- [reads a topology of nodes and links, their icons, statuses and details, and Markdown draws it by Topology](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L238) — `tests/regression/rich-plugins.test.js`
- [writes the text of a Markdown and the code of a CodeView as their body, edited in a field of many lines](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L1475) — `tests/examples/designer.spec.js`
- [Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1795) — `tests/examples/ui-kit.spec.js`

+5 ещё в тех же файлах
