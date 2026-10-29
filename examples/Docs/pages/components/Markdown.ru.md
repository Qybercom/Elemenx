<!-- generated -->
# Markdown

Документ на Markdown для показа: Value читает сервис RichText (CommonMark с таблицами, зачёркиванием и блоками кода GitHub) и приводит к своей схеме, так что ничего в нём не выполняется. Код блока, где указан язык (```js), подсвечивается сервисом Syntax (Highlight, по умолчанию включено). Look: 'document' (по умолчанию) — как текст RichEditor (классы elemenx-document); 'interface' — с классами интерфейса библиотеки, как страница приложения: таблица — elemenx-table, список — elemenx-ul или elemenx-ol, цитата — elemenx-callout, ссылка — elemenx-link, код (блок или в строке) — elemenx-code, черта — elemenx-divider. Без Value текст берётся из тела элемента (<Markdown>## Заголовок</Markdown>) без общего отступа его строк; тело отслеживается при изменениях. Плагины сервиса RichText рисуют то, для чего в Markdown нет элемента: ```mermaid — Diagram, ```chart — Chart, ::: warning — выноску... (RichText.Extend добавляет свои).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Highlight` | `true` |
| `Look` | `'document'` |
| `Label` | `''` |

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
- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [reads the code of a fenced block of Markdown in the language it names](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L129) — `tests/regression/syntax.test.js`
- [writes the text of a Markdown and the code of a CodeView as their body, edited in a field of many lines](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1408) — `tests/examples/builder.spec.js`
- [Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1794) — `tests/examples/ui-kit.spec.js`
- [a Markdown document takes the classes of the interface with Look interface, and the look of a RichEditor by default](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1923) — `tests/examples/ui-kit.spec.js`
- [rich editor formats from the toolbar of the page and from its menu, makes blocks of Markdown and pastes through its schema](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6134) — `tests/examples/ui-kit.spec.js`
- [rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6251) — `tests/examples/ui-kit.spec.js`

+1 ещё в тех же файлах
