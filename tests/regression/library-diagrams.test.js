import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('DiagramsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* The boxes of the nodes drawn in a page: their rectangles on the screen, by data-id. */
function boxes (root, selector) {
	var found = {};

	root.querySelectorAll(selector).forEach(function (node) {
		found[node.getAttribute('data-id')] = node.getBoundingClientRect();
	});

	return found;
}

function overlap (a, b) {
	return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/* The Diagrams Service reads a subset of the language of Mermaid and draws it in SVG; the Diagram Component shows it. */
describe('Contract: the Diagrams Service and the Diagram Component', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Diagram', 'Markdown', 'service:Diagrams', 'service:RichText']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('reads a flowchart: shapes, links with their texts, chains, groups, classes', function () {
		var diagrams = Elemenx.Service('Diagrams');
		var model = diagrams.Parse('flowchart LR\n  A([Start]) -->|go| B{Ready?}\n  B -. no .-> A\n  B ==> C[(Store)] & D((End))\n  subgraph S [The store]\n    C\n  end\n  classDef warn fill:#fde2e1\n  class D warn\n  %% a comment');

		expect(diagrams.Types()).toEqual(['flowchart', 'sequence', 'state', 'er', 'gantt', 'class', 'mindmap']);
		expect(model.Type).toBe('flowchart');
		expect(model.Direction).toBe('LR');
		expect(model.Order).toEqual(['A', 'B', 'C', 'D']);
		expect(model.Nodes.A.Shape).toBe('stadium');
		expect(model.Nodes.B.Shape).toBe('diamond');
		expect(model.Nodes.C.Shape).toBe('cylinder');
		expect(model.Nodes.D.Shape).toBe('circle');
		expect(model.Nodes.D.Classes).toEqual(['warn']);
		expect(model.Edges.map(function (edge) {
			return [edge.From, edge.To, edge.Line, edge.Text];
		})).toEqual([['A', 'B', 'solid', 'go'], ['B', 'A', 'dotted', 'no'], ['B', 'C', 'thick', ''], ['B', 'D', 'thick', '']]);
		expect(model.Groups[0]).toMatchObject({ID: 'S', Title: 'The store', Members: ['C']});
	});

	it('reads the other types: a sequence, states, ER, Gantt, classes and a mind map', function () {
		var diagrams = Elemenx.Service('Diagrams');
		var sequence = diagrams.Parse('sequenceDiagram\n  actor U as User\n  U->>+A: Hello\n  A-->>-U: Hi\n  loop Each minute\n    A->>A: Think\n  end');
		var state = diagrams.Parse('stateDiagram-v2\n  [*] --> Still\n  Still --> Moving : push\n  state Moving {\n    [*] --> Slow\n  }\n  state check <<choice>>\n  Moving --> [*]');
		var er = diagrams.Parse('erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER }|..|| ITEM : has\n  CUSTOMER {\n    string name PK "the name"\n  }');
		var gantt = diagrams.Parse('gantt\n  dateFormat YYYY-MM-DD\n  section One\n    First : a1, 2024-01-01, 3d\n    Second : after a1, 2d\n    Third : crit, 1w\n    Done : milestone, 2024-01-20, 0d');
		var classes = diagrams.Parse('classDiagram\n  class Animal {\n    <<abstract>>\n    +int age\n    +run()$\n  }\n  Animal <|-- Duck\n  Duck "1" *-- "2" Wing : has\n  Duck : +quack() void');
		var mind = diagrams.Parse('mindmap\n  root((Root))\n    One\n      a[Square]\n    Two\n      b))Bang((');

		expect(sequence.Participants.map(function (one) {
			return [one.ID, one.Label, one.Kind];
		})).toEqual([['U', 'User', 'actor'], ['A', 'A', 'participant']]);

		expect(state.Root.Order.filter(function (id) {
			return id.charAt(0) !== '\u0000';
		})).toEqual(['Still', 'Moving', 'check']);
		expect(state.Root.States.Moving.Kind).toBe('composite');
		expect(state.Root.States.Moving.Scope.Order).toContain('Slow');
		expect(state.Root.States.check.Kind).toBe('choice');
		expect(state.Root.Transitions[1]).toMatchObject({From: 'Still', To: 'Moving', Text: 'push'});

		expect(er.Relations).toEqual([
			{From: 'CUSTOMER', To: 'ORDER', Tail: 'one', Head: 'zeroMany', Identifying: true, Text: 'places'},
			{From: 'ORDER', To: 'ITEM', Tail: 'many', Head: 'one', Identifying: false, Text: 'has'}
		]);
		expect(er.Entities.CUSTOMER.Attributes).toEqual([{Type: 'string', Name: 'name', Keys: ['PK'], Comment: 'the name'}]);

		/* after an id, after the task before, a milestone; the times in UTC. */
		expect(gantt.Tasks.map(function (task) {
			return [task.Name, new Date(task.Start).toISOString().substring(0, 10), new Date(task.End).toISOString().substring(0, 10)];
		})).toEqual([['First', '2024-01-01', '2024-01-04'], ['Second', '2024-01-04', '2024-01-06'], ['Third', '2024-01-06', '2024-01-13'], ['Done', '2024-01-20', '2024-01-20']]);
		expect(gantt.Tasks[2].Crit).toBe(true);
		expect(gantt.Tasks[3].Milestone).toBe(true);

		expect(classes.Classes.Animal).toMatchObject({Stereotype: '<<abstract>>', Attributes: [{Text: '+int age', Static: false, Abstract: false}], Methods: [{Text: '+run()', Static: true, Abstract: false}]});
		expect(classes.Classes.Duck.Methods[0].Text).toBe('+quack() void');
		expect(classes.Relations).toEqual([
			{From: 'Animal', To: 'Duck', Tail: 'triangle', Head: '', Dashed: false, FromCount: '', ToCount: '', Text: ''},
			{From: 'Duck', To: 'Wing', Tail: 'diamond', Head: '', Dashed: false, FromCount: '1', ToCount: '2', Text: 'has'}
		]);

		expect(mind.Root).toMatchObject({Text: 'Root', Shape: 'circle'});
		expect(mind.Root.Children.map(function (child) {
			return [child.Text, child.Children[0].Text, child.Children[0].Shape];
		})).toEqual([['One', 'Square', 'rect'], ['Two', 'Bang', 'bang']]);
	});

	it('fails on a line it cannot read with its number, and on a broken structure', function () {
		var diagrams = Elemenx.Service('Diagrams');

		function failure (text) {
			try {
				diagrams.Parse(text);
			}
			catch (error) {
				return [error.Line, error.message];
			}

			return null;
		}

		expect(failure('pie\n  "A" : 1')).toEqual([1, 'Elemenx Diagrams: line 1: a diagram starts with its type: flowchart, sequenceDiagram, stateDiagram-v2, erDiagram, gantt, classDiagram or mindmap']);
		expect(failure('erDiagram\n  A ||--o{ B : ok\n  A <> B')[0]).toBe(3);
		expect(failure('gantt\n  dateFormat YYYY-MM-DD\n  One : 2024-13-xx, 3d')[1]).toContain('line 3: the start 2024-13-xx is not a date');
		expect(failure('gantt\n  One : after nothing, 3d')[1]).toContain('no task has the id nothing');
		expect(failure('stateDiagram-v2\n  state A {\n    B --> C')[1]).toContain('a state of states has no }');
		expect(failure('classDiagram\n  class A {\n    +x')[1]).toContain('the class A has no }');
		expect(failure('mindmap\n  One\n  Two')[1]).toContain('line 3: a mind map has one root');
	});

	it('draws each type in SVG: its parts scoped by its id, its nodes apart', function () {
		var diagrams = Elemenx.Service('Diagrams');
		var host = document.getElementById('mount');
		var texts = {
			flowchart: 'flowchart TD\n  A --> B\n  A --> C\n  B --> D\n  C --> D\n  E --> F',
			sequence: 'sequenceDiagram\n  A->>B: Hi\n  Note over A,B: both',
			state: 'stateDiagram-v2\n  [*] --> A\n  A --> B : go\n  B --> A : back\n  B --> [*]',
			er: 'erDiagram\n  A ||--o{ B : has\n  B {\n    int id PK\n  }',
			gantt: 'gantt\n  title Plan\n  dateFormat YYYY-MM-DD\n  section S\n    One : 2024-01-01, 3d\n    Two : 2d',
			class: 'classDiagram\n  A <|-- B\n  A <|-- C\n  class A {\n    +run()\n  }',
			mindmap: 'mindmap\n  Root\n    One\n    Two\n    Three'
		};

		Object.keys(texts).forEach(function (type) {
			var svg = diagrams.SVG(texts[type], {Id: 'test-' + type});

			expect(svg.indexOf('<svg xmlns="http://www.w3.org/2000/svg" id="test-' + type + '" class="elemenx-diagram-' + type + '"')).toBe(0);
			expect(svg).toContain('<style>#test-' + type + ' .n{');
			expect(svg).not.toContain('NaN');

			host.innerHTML = svg;

			expect(host.querySelector('svg').getBoundingClientRect().width).toBeGreaterThan(50);
		});

		/* No two nodes of a flowchart on one another, its parts not linked side by side. */
		host.innerHTML = diagrams.SVG(texts.flowchart, {Id: 'apart'});

		var found = boxes(host, 'g.node');
		var ids = Object.keys(found);

		expect(ids).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);

		ids.forEach(function (a, i) {
			ids.slice(i + 1).forEach(function (b) {
				expect(overlap(found[a], found[b])).toBe(false);
			});
		});

		/* Two transitions between the same states, one each way, do not lie on one another: their labels neither. */
		host.innerHTML = diagrams.SVG(texts.state, {Id: 'twice'});

		var labels = host.querySelectorAll('rect.l');

		expect(labels.length).toBe(2);
		expect(overlap(labels[0].getBoundingClientRect(), labels[1].getBoundingClientRect())).toBe(false);

		host.innerHTML = '';
	});

	it('shows its Value or its body, follows its changes, tells what it cannot read, and gives an SVG and a PNG', async function () {
		var errors = [];
		var made = null;
		var host = mount('<div><Diagram [value]="Text" (ready)="Ready" (error)="Failed" /><Diagram>\n\t\t\tflowchart LR\n\t\t\t  X --> Y\n\t\t</Diagram></div>', {
			Text: 'flowchart LR\n  A[One] --> B[Two]',
			Ready: function (instance) {
				if (!made)
					made = instance;
			},
			Failed: function (error) {
				errors.push(error);
			}
		});
		var root;
		var url;

		root = await waitFor(function () {
			var element = host.$Element();

			return element.querySelectorAll('.elemenx-diagram svg').length === 2 ? element : null;
		});

		var drawings = root.querySelectorAll('.elemenx-diagram');

		expect(drawings[0].getAttribute('role')).toBe('img');
		expect(drawings[0].getAttribute('aria-label')).toBe('Diagram');
		expect(drawings[0].querySelector('g.node[data-id="A"] text').textContent).toBe('One');
		expect(drawings[1].querySelector('g.node[data-id="X"]')).toBeTruthy();

		expect(made.SVG().indexOf('<svg')).toBe(0);
		expect(made.SVG()).toContain('>Two</text>');

		url = await new Promise(function (resolve, reject) {
			made.Png(1, function (error, value) {
				if (error) reject(error);
				else resolve(value);
			});
		});

		expect(url.indexOf('data:image/png;base64,')).toBe(0);

		host.Text = 'flowchart LR\n  A --> B\n  A ->';

		await waitFor(function () {
			return errors.length;
		});

		expect(errors[0].Line).toBe(3);
		expect(drawings[0].querySelector('.elemenx-diagram-error').textContent).toBe(errors[0].message);

		host.Text = 'sequenceDiagram\n  A->>B: Hi';

		await tick();

		expect(drawings[0].querySelector('svg.elemenx-diagram-sequence')).toBeTruthy();
		expect(errors.length).toBe(1);
	});

	it('is as wide as its place, a wide diagram scrolling inside it: it does not widen a column of a grid (a phone)', async function () {
		var host = mount('<div style="display: grid; grid-template-columns: 1fr; width: 200px"><div style="display: flex; flex-direction: column; align-items: flex-start"><Diagram [value]="Text" /></div></div>', {Text: 'flowchart LR\n  A[A long first step] --> B[A long second step] --> C[A long third step]'});
		var diagram = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-diagram svg') ? host.$Element().querySelector('.elemenx-diagram') : null;
		});

		expect(host.$Element().firstElementChild.firstElementChild.getBoundingClientRect().width).toBe(200);
		expect(diagram.getBoundingClientRect().width).toBe(200);
	});

	it('is the plugin of a ```mermaid fence in Markdown', async function () {
		var host = mount('<div><Markdown [value]="Text" /></div>', {Text: '# Flow\n\n```mermaid\nflowchart LR\n  A --> B\n```\n'});
		var svg;

		svg = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-rich-plugin .elemenx-diagram svg.elemenx-diagram-flowchart');
		});

		expect(svg.querySelector('g.node[data-id="B"]')).toBeTruthy();
	});
});
