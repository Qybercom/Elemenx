<!-- generated -->
# Diagram

Диаграмма, записанная текстом (сервис Diagrams, подмножество языка Mermaid): блок-схема, последовательность, состояния, сущности (ER), диаграмма Ганта, классы или карта мыслей — по первой строке. Без Value текст — содержимое тега (<Diagram>flowchart LR ...</Diagram>), без общего отступа его строк. Текст, который не удаётся прочитать, показывает причину и отправляет error (его Line — номер строки). В странице она берёт цвета темы; SVG() возвращает её как текст SVG (со своими цветами, вне страницы), Png(scale, callback) — как data URL картинки PNG, Download(name, format) сохраняет её как name.png или name.svg; ready отдаёт сам компонент, чтобы их вызывать.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Label` | `''` |

## События

- `error`
- `ready`

## Слоты

по умолчанию

## Методы

- `SVG()`
- `Png(scale, callback)`
- `Download(name, format, callback)`

## Пример

```example
<div class="docs-stack">
	<div class="docs-row">
		<Select Label="Type" [value]="Type" [options]="Types" (change)="Chosen" />
		<Button Label="PNG" Icon="download" (click)="SavePng" />
		<Button Label="SVG" Icon="download" (click)="SaveSvg" />
	</div>
	<TextArea Label="Text" Rows="8" [value]="Text" (input)="Typed" />
	<Diagram [value]="Text" (ready)="Made" (error)="Failed" />
	<p class="elemenx-text small" [class.danger]="!!Problem">{{Problem || 'Change the text: the diagram follows it; a line it cannot read is named by its number.'}}</p>
</div>
<script>
(function () {
	var diagram = null;
	var samples = {
		flowchart: 'flowchart LR\n  A([Order]) --> B{Paid?}\n  B -->|yes| C[[Pack]]\n  B -. no .-> D>Remind]\n  C ==> E[(Shipped)]\n  D --> B',
		sequence: 'sequenceDiagram\n  actor U as User\n  participant S as Shop\n  U->>+S: Places an order\n  S-->>-U: The number\n  loop Each day\n    S->>S: Checks the stock\n  end\n  Note over U,S: Paid on delivery',
		state: 'stateDiagram-v2\n  [*] --> Draft\n  Draft --> Review : send\n  Review --> Draft : changes\n  state Review {\n    [*] --> Reading\n    Reading --> Voting\n  }\n  Review --> Published : approve\n  Published --> [*]',
		er: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE : contains\n  PRODUCT ||--o{ LINE : "is in"\n  ORDER {\n    int id PK\n    date placed\n    int customer FK\n  }',
		gantt: 'gantt\n  title Release\n  dateFormat YYYY-MM-DD\n  section Build\n    Design : d, 2026-01-05, 5d\n    Code : c, after d, 10d\n  section Ship\n    Test : crit, after c, 4d\n    Release : milestone, 2026-01-30, 0d',
		class: 'classDiagram\n  class Shape {\n    <<abstract>>\n    +area() double*\n  }\n  Shape <|-- Circle\n  Shape <|-- Square\n  Circle : +double radius\n  Square : +double side\n  Canvas "1" o-- "*" Shape : draws',
		mindmap: 'mindmap\n  root((Elemenx))\n    Components\n      Diagram\n      Chart\n    Services\n      Diagrams\n      RichText\n    Tools\n      CLI\n      Editors'
	};

	return {
		Type: 'flowchart',
		Text: samples.flowchart,
		Problem: '',
		Types: Object.keys(samples).map(function (name) {
			return {Value: name, Label: name};
		}),

		/* ready gives the Diagram itself: its methods save the picture. */
		Made: function (instance) {
			diagram = instance;
		},

		Chosen: function (value) {
			this.Type = value;
			this.Text = samples[value];
			this.Problem = '';
		},

		Typed: function (value) {
			this.Text = value;
			this.Problem = '';
		},

		Failed: function (error) {
			this.Problem = 'Line ' + error.Line + ' cannot be read: the diagram says why.';
		},

		SavePng: function () {
			diagram.Download('diagram-' + this.Type, 'png');
		},

		SaveSvg: function () {
			diagram.Download('diagram-' + this.Type, 'svg');
		}
	};
})()
</script>
```

## Тесты

- [reads a flowchart: shapes, links with their texts, chains, groups, classes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L48) — `tests/regression/library-diagrams.test.js`
- [reads the other types: a sequence, states, ER, Gantt, classes and a mind map](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L67) — `tests/regression/library-diagrams.test.js`
- [fails on a line it cannot read with its number, and on a broken structure](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L114) — `tests/regression/library-diagrams.test.js`
- [draws each type in SVG: its parts scoped by its id, its nodes apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L137) — `tests/regression/library-diagrams.test.js`
- [shows its Value or its body, follows its changes, tells what it cannot read, and gives an SVG and a PNG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L187) — `tests/regression/library-diagrams.test.js`
- [is as wide as its place, a wide diagram scrolling inside it: it does not widen a column of a grid (a phone)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L245) — `tests/regression/library-diagrams.test.js`
- [is the plugin of a ```mermaid fence in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L255) — `tests/regression/library-diagrams.test.js`
