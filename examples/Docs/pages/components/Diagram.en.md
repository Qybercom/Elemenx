<!-- generated -->
# Diagram

A diagram written as text (the Diagrams Service, a subset of the language of Mermaid): a flowchart, a sequence, the states, the entities (ER), a Gantt chart, the classes or a mind map, by its first line. Without Value the text is the body of the element (<Diagram>flowchart LR ...</Diagram>), without the indentation its lines share. A text it cannot read shows the reason and emits error (its Line is the number of the line). In a page it takes the colors of the theme; SVG() returns it as the text of an SVG (its own colors, out of a page), Png(scale, callback) as a data URL of a PNG, Download(name, format) saves it as name.png or name.svg; ready gives the component itself, to call them.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Label` | `''` |

## Events

- `error`: The text cannot be read: the error, its Line the number of the line.
- `ready`: It is made: the component itself, to call Download, Png or SVG.

## Slots

default

## Methods

- `SVG()`
- `Png(scale, callback)`
- `Download(name, format, callback)`

## Example

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
			this.Problem = error.message;
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
