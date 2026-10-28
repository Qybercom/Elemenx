<!-- generated -->
# Diagrams

Диаграммы, записанные текстом, на подмножестве языка Mermaid, нарисованные в SVG собственной раскладкой (без библиотек): в странице — цветами темы, в файле — своими.
- Types(): flowchart, sequence, state, er, gantt, class, mindmap.
- Parse(text): модель диаграммы, {Type, ...}; строка, которую не удаётся прочитать, выбрасывает Error с её номером (Line).
- SVG(text, options): рисунок своего размера (options.Id — имя его частей; FontSize 14).
Языки, по первой строке:
- flowchart TD|TB|BT|LR|RL (или graph): узлы id[текст], id(текст), id([текст]), id[[текст]], id[(текст)], id((текст)), id(((текст))), id{текст}, id{{текст}}, id>текст], id[/текст/], id[\текст\], id[/текст\], id[\текст/]; связи -->, ---, -.->, -.-, ==>, ===, --o, --x, <-->, ~~~ (больше чёрточек — длиннее связь), с текстом (-->|текст| или -- текст -->), цепочкой (A --> B --> C) и сразу нескольких (A & B --> C); subgraph id [заголовок] ... end; classDef имя fill:..; class a,b имя; id:::имя; style id fill:...
- sequenceDiagram: participant A as Alice, actor B; A->>B: текст (->> -->> -> --> -x --x -) --)), + и - после стрелки включают и выключают активацию, activate A, deactivate A; Note left of|right of|over A[,B]: текст; loop, alt / else, opt, par / and, critical, break, rect ... end; autonumber.
- stateDiagram-v2 (или stateDiagram): [*] --> A, A --> B : текст, state "Текст" as A, A : текст, state A { ... } (состояние из состояний), state X <<choice>>, <<fork>>, <<join>>, direction LR.
- erDiagram: A ||--o{ B : подпись (|o || }o }| и o| || o{ |{; -- идентифицирующая, .. нет), A { тип имя PK "комментарий" }.
- gantt: title, dateFormat YYYY-MM-DD, section Имя, Задача : [crit,] [done|active,] [id,] начало (дата или after id), конец (дата) или длительность (3d, 2w, 12h); milestone.
- classDiagram: class A { +name String \n +run(speed) void }, A : +член, <<interface>> A; A <|-- B, *--, o--, -->, --, ..>, ..|>, .., с "1" и "*" на концах и подписью после :.
- mindmap: дерево по отступам, его первая строка — корень; id[текст], id(текст), id((текст)), id))текст((, id)текст(, id{{текст}} или просто текст.

## Методы

- `Types()`
- `Parse(text)`
- `SVG(text, options)`

## Пример

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

## Тесты

- [reads a flowchart: shapes, links with their texts, chains, groups, classes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L48) — `tests/regression/library-diagrams.test.js`
- [reads the other types: a sequence, states, ER, Gantt, classes and a mind map](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L67) — `tests/regression/library-diagrams.test.js`
- [fails on a line it cannot read with its number, and on a broken structure](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L114) — `tests/regression/library-diagrams.test.js`
- [draws each type in SVG: its parts scoped by its id, its nodes apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L137) — `tests/regression/library-diagrams.test.js`
- [shows its Value or its body, follows its changes, tells what it cannot read, and gives an SVG and a PNG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L187) — `tests/regression/library-diagrams.test.js`
- [is as wide as its place, a wide diagram scrolling inside it: it does not widen a column of a grid (a phone)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L245) — `tests/regression/library-diagrams.test.js`
- [is the plugin of a ```mermaid fence in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L255) — `tests/regression/library-diagrams.test.js`
