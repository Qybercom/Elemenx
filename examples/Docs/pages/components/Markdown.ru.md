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
