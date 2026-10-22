<!-- generated -->
# Markdown

Документ на Markdown для показа: Value читает сервис RichText (CommonMark с таблицами, зачёркиванием и блоками кода GitHub) и приводит к своей схеме, так что ничего в нём не выполняется. Код блока, где указан язык (```js), подсвечивается сервисом Syntax (Highlight, по умолчанию включено). Выглядит как текст RichEditor (классы elemenx-document).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Highlight` | `true` |
| `Label` | `''` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="flex: 1 1 260px;"><TextArea [value]="Text" Rows="12" (input)="Typed" /></div>
	<div style="flex: 1 1 260px;"><Markdown [value]="Text" /></div>
</div>
<script>
({
	Text: '## Release notes\n\nSome **bold**, some *italic*, ~~a strike~~ and a [link](https://example.com).\n\n- Faster lists\n- New icons\n\n| Size | Time |\n| --- | --- |\n| 1 000 | 4 ms |\n| 10 000 | 31 ms |\n\n```js\nvar app = Elemenx.Application({});\n```\n\n> Raw HTML is kept to the schema: nothing in it runs.\n',

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```
