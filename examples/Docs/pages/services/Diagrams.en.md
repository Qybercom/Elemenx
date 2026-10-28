<!-- generated -->
# Diagrams

Diagrams written as text, in a subset of the language of Mermaid, drawn in SVG by a layout of their own (no library): the colors of the theme in a page, its own in a file.

- Types(): flowchart, sequence, state, er, gantt, class, mindmap.
- Parse(text): the model of a diagram, {Type, ...}; a line it cannot read throws an Error naming its line (Line).
- SVG(text, options): the drawing, its size its own (options.Id names its parts; FontSize 14).

The languages, by the first line:

- flowchart TD|TB|BT|LR|RL (or graph): nodes id[text], id(text), id([text]), id[[text]], id[(text)], id((text)), id(((text))), id{text}, id{{text}}, id>text], id[/text/], id[\text\], id[/text\], id[\text/]; links -->, ---, -.->, -.-, ==>, ===, --o, --x, <-->, ~~~ (more dashes: a longer link), with a text (-->|text| or -- text -->), chained (A --> B --> C) and of several (A & B --> C); subgraph id [title] ... end; classDef name fill:..; class a,b name; id:::name; style id fill:...
- sequenceDiagram: participant A as Alice, actor B; A->>B: text (->> -->> -> --> -x --x -) --)), + and - after the arrow activate and deactivate, activate A, deactivate A; Note left of|right of|over A[,B]: text; loop, alt / else, opt, par / and, critical, break, rect ... end; autonumber.
- stateDiagram-v2 (or stateDiagram): [*] --> A, A --> B : text, state "Text" as A, A : text, state A { ... } (a state of states), state X <<choice>>, <<fork>>, <<join>>, direction LR.
- erDiagram: A ||--o{ B : label (|o || }o }| and o| || o{ |{; -- identifying, .. not), A { type name PK "comment" }.
- gantt: title, dateFormat YYYY-MM-DD, section Name, Task : [crit,] [done|active,] [id,] start (a date or after id), end (a date) or duration (3d, 2w, 12h); milestone.
- classDiagram: class A { +name String \n +run(speed) void }, A : +member, <<interface>> A; A <|-- B, *--, o--, -->, --, ..>, ..|>, .., with "1" and "*" at the ends and a : label.
- mindmap: a tree by its indentation, its first line the root; id[text], id(text), id((text)), id))text((, id)text(, id{{text}} or a text alone.

## Methods

- `Types()`
- `Parse(text)`
- `SVG(text, options)`

## Example

```example
<p class="elemenx-text small">The model of a diagram, as Parse reads it, and its drawing.</p>
<span [property.innerHTML]="Drawing"></span>
<pre class="elemenx-code">{{Model}}</pre>
<script>
({
	Drawing: '',
	Model: '',

	$OnCreate: function () {
		var diagrams = this.$Service('Diagrams');
		var text = 'erDiagram\n  AUTHOR ||--o{ BOOK : writes\n  BOOK }o--|| SHELF : "stands on"';

		this.Drawing = diagrams.SVG(text, {FontSize: 13});
		this.Model = JSON.stringify(diagrams.Parse(text).Relations, null, 2);
	}
})
</script>
```

## Tests

- [reads a flowchart: shapes, links with their texts, chains, groups, classes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L48) — `tests/regression/library-diagrams.test.js`
- [reads the other types: a sequence, states, ER, Gantt, classes and a mind map](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L67) — `tests/regression/library-diagrams.test.js`
- [fails on a line it cannot read with its number, and on a broken structure](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L114) — `tests/regression/library-diagrams.test.js`
- [draws each type in SVG: its parts scoped by its id, its nodes apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L137) — `tests/regression/library-diagrams.test.js`
- [shows its Value or its body, follows its changes, tells what it cannot read, and gives an SVG and a PNG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L187) — `tests/regression/library-diagrams.test.js`
- [is as wide as its place, a wide diagram scrolling inside it: it does not widen a column of a grid (a phone)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L245) — `tests/regression/library-diagrams.test.js`
- [is the plugin of a ```mermaid fence in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L255) — `tests/regression/library-diagrams.test.js`
