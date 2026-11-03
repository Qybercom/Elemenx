/*
 * The editor of a blueprint (the Blueprints Service: a graph in the JSON of Flowprint) on a Board: blocks with their pins,
 * links drawn between them, the types of blocks of its graph to add (Palette) and its parameters, set from outside it.
 * Value is the graph (an object or the text of its file); without one it is an empty graph of Type. change emits the graph
 * after each action, select {Block, Link} (their ids, or null), problems what Check finds (each block it names is marked
 * wrong, with its message as its title).
 * A drag of the head of a block moves it; a drag from a pin to another draws a link (an input takes one link of values,
 * an output of flow goes one way: a new link takes the place of the old one); a drag from an input with a link, let go
 * on no pin, takes the link away. A press on a link selects it; Delete removes the block or the link selected. The
 * properties of a block are edited in it. ReadOnly shows the graph alone: blocks still move, nothing else changes.
 * Methods: Graph(), Write() (the text of its file), Add(type, x, y), Remove(id), Select(id), Selected(), Check(),
 * Compile(options), Arrange() (the blocks in columns, each after what it reads; a graph whose blocks all stand at 0, 0
 * is arranged when shown) and Fit().
 */
Elemenx.Component('Blueprint', {
	$TemplateURL: 'Blueprint.html',
	$StyleURL: 'Blueprint.css',
	$Meta: {
		Group: 'codes',
		Icon: 'share-2',
		Description: 'The editor of a blueprint in the JSON of Flowprint: blocks, pins and links on a canvas, the types to add and the parameters of the graph.',
		Events: {
			change: 'The graph changed: the graph.',
			select: 'The selection changed: {Block, Link}, their ids or null.',
			problems: 'What is wrong with the graph: [{Block, Pin, Link, Message}].'
		},
		Methods: ['Graph()', 'Write()', 'Add(type, x, y)', 'Remove(id)', 'Select(id)', 'Selected()', 'Check()', 'Compile(options)', 'Arrange()', 'Fit()'],
		Props: {
			Value: 'The graph: an object or the text of its file.',
			Type: {Options: ['flow', 'pass', 'material', 'render', 'generator'], Description: 'The type of the graph made when there is no Value.'},
			Palette: 'Shows the types of blocks to add and the parameters (true by default).',
			ReadOnly: 'Shows the graph alone: blocks still move, nothing else changes.',
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Type: 'generator', Value: {version: 1, type: 'generator', parameters: [{key: 'Scale', type: 'float', value: 2}], blocks: [{id: 'n', type: 'Number', x: 40, y: 40, properties: [{key: 'Value', value: 3}]}, {id: 's', type: 'Parameter', x: 40, y: 160, properties: [{key: 'Key', value: 'Scale'}, {key: 'Type', value: 'float'}]}, {id: 'm', type: 'Multiply', x: 280, y: 90, properties: []}, {id: 'r', type: 'Result', x: 500, y: 100, properties: [{key: 'Key', value: 'Value'}]}], links: [{id: 'a', p1: 'n-out-Value', p2: 'm-in-A'}, {id: 'b', p1: 's-out-Value', p2: 'm-in-B'}, {id: 'c', p1: 'm-out-Out', p2: 'r-in-Value'}]}}
	},
	Value: null,
	Type: 'flow',
	Palette: true,
	ReadOnly: false,
	Label: '',

	/* What the template renders: the filter of the palette, the kind of the graph and its parameters. */
	Filter: '',
	Kind: 'flow',
	Parameters: [],
	ParameterTypes: ['float', 'vec2', 'vec3', 'vec4', 'int', 'bool', 'text', 'any'],

	$OnCreate: function () {
		var own = {Graph: null, Emitted: '', Selected: null, Link: null, Drag: null, Svg: null, Draft: null, Canvas: null, Problems: []};

		this.Own = function () {
			return own;
		};

		this.Load(this.Value);
	},

	/* The canvas is in the content of the Board: a Board whose template comes later brings it later. */
	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var root = this.$Element();

		if (root.querySelector('.elemenx-blueprint-canvas')) {
			this.Attach(root.querySelector('.elemenx-blueprint-canvas'));

			return;
		}

		own.Waiting = new MutationObserver(function () {
			var canvas = root.querySelector('.elemenx-blueprint-canvas');
			if (!canvas) return;

			own.Waiting.disconnect();
			own.Waiting = null;

			self.Attach(canvas);
		});

		own.Waiting.observe(root, {childList: true, subtree: true});
	},

	Attach: function (canvas) {
		var self = this;
		var own = this.Own();
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		svg.setAttribute('class', 'elemenx-blueprint-links');

		canvas.appendChild(svg);

		own.Canvas = canvas;
		own.Svg = svg;

		canvas.addEventListener('pointerdown', function (event) {
			self.Down(event);
		});

		canvas.addEventListener('pointermove', function (event) {
			self.Move(event);
		});

		canvas.addEventListener('pointerup', function (event) {
			self.Up(event);
		});

		canvas.addEventListener('pointercancel', function (event) {
			self.Up(event);
		});

		canvas.addEventListener('change', function (event) {
			self.Edited(event);
		});

		this.Render();

		/* What is wrong with the graph given is told at once, so its owner knows it before any change. */
		this.$Emit('problems', own.Problems);

		if (own.Graph.blocks.length > 1 && own.Graph.blocks.every(function (block) {
			return !block.x && !block.y;
		}))
			this.Arrange();
	},

	$OnProps: function (changed) {
		var own = this.Own();

		if ('Value' in changed && this.Value && (typeof this.Value === 'string' ? this.Value : JSON.stringify(this.Value)) !== own.Emitted) {
			this.Load(this.Value);
			this.Render();
		}

		if ('Type' in changed && !this.Value) {
			this.Load(null);
			this.Render();
		}
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Sizes)
			own.Sizes.disconnect();

		if (own.Waiting)
			own.Waiting.disconnect();
	},

	Blueprints: function () {
		return this.$Service('Blueprints');
	},

	Locked: function () {
		return this.ReadOnly === true || this.ReadOnly === 'true';
	},

	/* A graph given: read as a copy (its text is what was given), or an empty one of Type. */
	Load: function (value) {
		var own = this.Own();
		var blueprints = this.Blueprints();

		if (value) own.Graph = blueprints.Read(typeof value === 'string' ? value : JSON.parse(JSON.stringify(value)));
		else own.Graph = blueprints.Create(this.Type || 'flow');

		own.Emitted = typeof value === 'string' ? value : value ? JSON.stringify(value) : '';
		own.Selected = null;
		own.Link = null;
		own.Problems = blueprints.Check(own.Graph);

		this.Kind = own.Graph.type;

		this.Refresh();
	},

	Refresh: function () {
		var own = this.Own();

		this.Parameters = own.Graph.parameters.map(function (parameter, index) {
			return Object.assign({Index: index}, parameter);
		});
	},

	Groups: function (kind, filter) {
		var blueprints = this.Blueprints();
		var groups = {};
		var text = String(filter || '').toLowerCase();

		blueprints.Nodes(kind).forEach(function (type) {
			var group = blueprints.NodeOf(type).Group || 'other';

			if (text && type.toLowerCase().indexOf(text) === -1) return;

			(groups[group] = groups[group] || []).push(type);
		});

		return Object.keys(groups).map(function (name) {
			return {Name: name, Types: groups[name]};
		});
	},

	ValueText: function (value) {
		return Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);
	},

	Filtered: function (event) {
		this.Filter = event && event.target ? event.target.value : '';
	},

	/* A type of the palette: a block of it in the middle of the view. */
	Picked: function (type) {
		var board = this.$Ref('Board', true);
		var box = board ? board.Viewport().getBoundingClientRect() : null;
		var middle = box ? board.ToWorld(box.left + box.width / 2, box.top + box.height / 2) : {X: 40, Y: 40};

		this.Select(this.Add(type, Math.round(middle.X - 80), Math.round(middle.Y - 30)).id);
	},

	/* The graph */

	Graph: function () {
		return this.Own().Graph;
	},

	Write: function () {
		return this.Blueprints().Write(this.Own().Graph);
	},

	Add: function (type, x, y) {
		var block = this.Blueprints().Add(this.Own().Graph, type, {x: x || 0, y: y || 0});

		this.Render();
		this.Changed();

		return block;
	},

	Remove: function (id) {
		var own = this.Own();

		this.Blueprints().Remove(own.Graph, id);

		if (own.Selected === id)
			own.Selected = null;

		if (own.Link === id)
			own.Link = null;

		this.Render();
		this.Changed();
	},

	Select: function (id) {
		var own = this.Own();
		var graph = own.Graph;
		var block = this.Blueprints().Find(graph, id);
		var link = block ? null : graph.links.filter(function (one) {
			return one.id === id;
		})[0];

		own.Selected = block ? id : null;
		own.Link = link ? id : null;

		this.Marks();
		this.$Emit('select', {Block: own.Selected, Link: own.Link});
	},

	Selected: function () {
		var own = this.Own();

		return {Block: own.Selected, Link: own.Link};
	},

	Check: function () {
		return this.Blueprints().Check(this.Own().Graph);
	},

	Compile: function (options) {
		return this.Blueprints().Compile(this.Own().Graph, options);
	},

	/* The canvas as large as its blocks first: the Board fits what is placed in its content, and the canvas is what is placed. */
	Fit: function () {
		var board = this.$Ref('Board', true);
		var canvas = this.Own().Canvas;
		var right = 1;
		var bottom = 1;

		if (canvas) {
			Array.prototype.forEach.call(canvas.querySelectorAll('.elemenx-blueprint-block'), function (block) {
				right = Math.max(right, block.offsetLeft + block.offsetWidth);
				bottom = Math.max(bottom, block.offsetTop + block.offsetHeight);
			});

			canvas.style.width = right + 'px';
			canvas.style.height = bottom + 'px';
		}

		if (board)
			board.FitContent(40);
	},

	/* In columns by the longest way to each block; in a column by the order of the graph. */
	Arrange: function () {
		var own = this.Own();
		var graph = own.Graph;
		var blueprints = this.Blueprints();
		var depth = {};
		var columns = [];
		var changed = true;
		var guard = 0;
		var ends = graph.links.map(function (link) {
			var one = blueprints.PinById(graph, link.p1);
			var two = blueprints.PinById(graph, link.p2);

			return one && two ? [one.Block.id, two.Block.id] : null;
		}).filter(Boolean);

		graph.blocks.forEach(function (block) {
			depth[block.id] = 0;
		});

		while (changed && guard < graph.blocks.length + 1) {
			changed = false;
			guard++;

			ends.forEach(function (end) {
				if (end[0] !== end[1] && depth[end[1]] < depth[end[0]] + 1) {
					depth[end[1]] = depth[end[0]] + 1;
					changed = true;
				}
			});
		}

		graph.blocks.forEach(function (block) {
			(columns[depth[block.id]] = columns[depth[block.id]] || []).push(block);
		});

		columns.forEach(function (column, index) {
			var y = 40;

			(column || []).forEach(function (block) {
				var element = own.Canvas ? own.Canvas.querySelector('[data-id="' + block.id + '"]') : null;

				block.x = 40 + index * 260;
				block.y = y;
				y += (element ? element.offsetHeight : 120) + 40;
			});
		});

		this.Render();
		this.Changed();
	},

	/* After a change: the problems marked, the parameters shown again, the graph emitted. */
	Changed: function () {
		var own = this.Own();

		own.Problems = this.Check();
		own.Emitted = this.Write();

		this.Refresh();
		this.Marks();
		this.$Emit('problems', own.Problems);
		this.$Emit('change', own.Graph);
	},

	AddParameter: function () {
		var graph = this.Own().Graph;
		var keys = graph.parameters.map(function (parameter) {
			return parameter.key;
		});
		var n = graph.parameters.length + 1;

		while (keys.indexOf('Parameter' + n) !== -1)
			n++;

		graph.parameters.push({key: 'Parameter' + n, type: 'float', value: 0});

		this.Changed();
	},

	RemoveParameter: function (index) {
		this.Own().Graph.parameters.splice(index, 1);

		this.Changed();
	},

	/* A field of a parameter: its value read by its type (numbers by commas for a vector). */
	SetParameter: function (index, field, event) {
		var parameter = this.Own().Graph.parameters[index];
		var text = event && event.target ? event.target.value : '';
		var size;

		if (!parameter) return;

		if (field === 'value') {
			size = this.Blueprints().Sizes[parameter.type || 'float'];

			if (parameter.type === 'bool') parameter.value = text === 'true';
			else if (size > 1 && !/^#/.test(text)) parameter.value = text.split(',').map(Number);
			else if (size) parameter.value = /^#/.test(text) ? text : Number(text) || 0;
			else parameter.value = text;
		}
		else {
			parameter[field] = text;
		}

		this.Changed();
	},

	/* Drawing */

	Render: function () {
		var own = this.Own();
		var self = this;

		if (!own.Canvas) return;

		/* The links follow the blocks as they take their sizes (their style, their fonts, the page they come into). */
		if (!own.Sizes) {
			own.Sizes = new ResizeObserver(function () {
				self.Wire();
			});
		}

		own.Sizes.disconnect();

		Array.prototype.slice.call(own.Canvas.querySelectorAll('.elemenx-blueprint-block')).forEach(function (element) {
			element.remove();
		});

		own.Graph.blocks.forEach(function (block) {
			var element = self.BlockElement(block);

			own.Canvas.appendChild(element);
			own.Sizes.observe(element);
		});

		this.Marks();
		this.Wire();
	},

	BlockElement: function (block) {
		var self = this;
		var blueprints = this.Blueprints();
		var node = blueprints.NodeOf(block.type);
		var locked = this.Locked();
		var element = document.createElement('div');
		var head = document.createElement('div');
		var title = document.createElement('span');
		var body = document.createElement('div');
		var inputs = document.createElement('div');
		var outputs = document.createElement('div');
		var properties = document.createElement('div');
		var flowIn = document.createElement('span');
		var flowOut = document.createElement('span');
		var values = blueprints.Properties(block);

		element.className = 'elemenx-blueprint-block group-' + (node && node.Group || 'other');

		element.setAttribute('data-id', block.id);

		element.style.left = (Number(block.x) || 0) + 'px';
		element.style.top = (Number(block.y) || 0) + 'px';

		head.className = 'elemenx-blueprint-head';
		title.className = 'elemenx-blueprint-title';
		title.textContent = node && node.Title || block.type || 'Generic';
		flowIn.className = 'elemenx-blueprint-flows in';
		flowOut.className = 'elemenx-blueprint-flows out';
		body.className = 'elemenx-blueprint-body';
		inputs.className = 'elemenx-blueprint-inputs';
		outputs.className = 'elemenx-blueprint-outputs';
		properties.className = 'elemenx-blueprint-properties';

		(block.pins || []).forEach(function (pin) {
			var out = !!(pin.direction && pin.direction.out);
			var port = document.createElement('span');
			var dot = document.createElement('span');
			var name = document.createElement('span');
			var flows = (pin.kind || 'value') === 'flow';

			port.className = 'elemenx-blueprint-port ' + (out ? 'out' : 'in');
			dot.className = 'elemenx-blueprint-pin';

			dot.setAttribute('data-pin', pin.id);
			dot.setAttribute('data-kind', pin.kind || 'value');
			dot.setAttribute('data-type', pin.type || 'any');
			dot.setAttribute('title', (pin.content || pin.key) + ': ' + (pin.type || pin.kind || 'any'));

			name.className = 'elemenx-blueprint-pin-name';
			name.textContent = flows && (pin.key === 'In' || pin.key === 'Then') ? '' : pin.content || pin.key;

			if (out) {
				port.appendChild(name);
				port.appendChild(dot);
			}
			else {
				port.appendChild(dot);
				port.appendChild(name);
			}

			if (flows) (out ? flowOut : flowIn).appendChild(port);
			else (out ? outputs : inputs).appendChild(port);
		});

		head.appendChild(flowIn);
		head.appendChild(title);
		head.appendChild(flowOut);

		((node && node.Properties) || []).forEach(function (property) {
			var label = document.createElement('label');
			var name = document.createElement('span');
			var field = property.Type === 'select' ? document.createElement('select') : document.createElement('input');
			var value = values[property.Key];

			label.className = 'elemenx-blueprint-property';
			name.textContent = property.Key;

			field.setAttribute('data-property', property.Key);

			field.disabled = locked;

			if (property.Type === 'select') {
				(property.Options || []).forEach(function (option) {
					var item = document.createElement('option');

					item.value = String(option);
					item.textContent = String(option);
					item.selected = String(option) === String(value);

					field.appendChild(item);
				});
			}
			else if (property.Type === 'bool') {
				field.type = 'checkbox';
				field.checked = value === true || value === 'true';
			}
			else {
				field.type = property.Type === 'number' ? 'number' : property.Type === 'color' ? 'color' : 'text';
				field.value = self.Shown(value);

				if (property.Min != null)
					field.min = property.Min;

				if (property.Max != null)
					field.max = property.Max;

				if (property.Type === 'number')
					field.step = 'any';
			}

			label.appendChild(name);
			label.appendChild(field);
			properties.appendChild(label);
		});

		body.appendChild(inputs);
		body.appendChild(outputs);
		element.appendChild(head);
		element.appendChild(body);

		if (properties.childNodes.length)
			element.appendChild(properties);

		return element;
	},

	/* A value of a property in its field: numbers of a list by commas, an object as JSON. */
	Shown: function (value) {
		if (value == null) return '';

		if (Array.isArray(value) && value.every(function (part) {
			return typeof part === 'number';
		})) return value.join(', ');

		return typeof value === 'object' ? JSON.stringify(value) : String(value);
	},

	/* A field of an object: its JSON, or the text as it is while it is not JSON yet. */
	Parsed: function (text) {
		try {
			return text === '' ? null : JSON.parse(text);
		}
		catch (error) {
			return text;
		}
	},

	/* The selection, the blocks switched off and the ones with problems. */
	Marks: function () {
		var own = this.Own();
		var wrong = {};

		if (!own.Canvas) return;

		own.Problems.forEach(function (problem) {
			if (problem.Block)
				wrong[problem.Block] = (wrong[problem.Block] ? wrong[problem.Block] + '\n' : '') + problem.Message;
		});

		own.Graph.blocks.forEach(function (block) {
			var element = own.Canvas.querySelector('[data-id="' + block.id + '"]');
			if (!element) return;

			element.classList.toggle('selected', own.Selected === block.id);
			element.classList.toggle('off', block.enabled === false);
			element.classList.toggle('wrong', !!wrong[block.id]);

			if (wrong[block.id]) element.setAttribute('title', wrong[block.id]);
			else element.removeAttribute('title');
		});

		Array.prototype.slice.call(own.Svg.querySelectorAll('path[data-link]')).forEach(function (path) {
			path.classList.toggle('selected', path.getAttribute('data-link') === own.Link);
		});
	},

	/* The middle of a pin in the coordinates of the canvas (of the world of the board). */
	PinPoint: function (id) {
		var own = this.Own();
		var dot = own.Canvas.querySelector('[data-pin="' + id.replace(/"/g, '\\"') + '"]');
		var board = this.$Ref('Board', true);
		var zoom = board ? Number(board.Zoom) || 1 : 1;
		var box;
		var origin;

		if (!dot)
			return null;

		box = dot.getBoundingClientRect();
		origin = own.Canvas.getBoundingClientRect();

		return {X: (box.left + box.width / 2 - origin.left) / zoom, Y: (box.top + box.height / 2 - origin.top) / zoom};
	},

	Curve: function (a, b) {
		var bend = Math.max(40, Math.abs(b.X - a.X) / 2);

		return 'M ' + a.X + ' ' + a.Y + ' C ' + (a.X + bend) + ' ' + a.Y + ' ' + (b.X - bend) + ' ' + b.Y + ' ' + b.X + ' ' + b.Y;
	},

	/* The links again where their pins are now (their ends kept in the graph, as Flowprint keeps them). */
	Wire: function () {
		var own = this.Own();
		var self = this;
		var blueprints = this.Blueprints();

		if (!own.Svg) return;

		while (own.Svg.firstChild)
			own.Svg.removeChild(own.Svg.firstChild);

		own.Graph.links.forEach(function (link) {
			var a = self.PinPoint(link.p1);
			var b = self.PinPoint(link.p2);
			var from = blueprints.PinById(own.Graph, link.p1);
			var path;

			if (!a || !b) return;

			link.x1 = Math.round(a.X);
			link.y1 = Math.round(a.Y);
			link.x2 = Math.round(b.X);
			link.y2 = Math.round(b.Y);

			path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

			path.setAttribute('d', self.Curve(a, b));
			path.setAttribute('data-link', link.id);
			path.setAttribute('data-kind', link.kind || 'value');
			path.setAttribute('data-type', from ? from.Pin.type || 'any' : 'any');
			path.setAttribute('class', 'elemenx-blueprint-link' + (link.enabled === false ? ' off' : '') + (own.Link === link.id ? ' selected' : ''));

			own.Svg.appendChild(path);
		});

		if (own.Draft) {
			own.Draft.Path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

			own.Draft.Path.setAttribute('class', 'elemenx-blueprint-link draft');

			own.Svg.appendChild(own.Draft.Path);
		}
	},

	/* Pointers */

	Down: function (event) {
		var own = this.Own();
		var graph = own.Graph;
		var pin = event.target.closest ? event.target.closest('.elemenx-blueprint-pin') : null;
		var head = event.target.closest ? event.target.closest('.elemenx-blueprint-head') : null;
		var element = event.target.closest ? event.target.closest('.elemenx-blueprint-block') : null;
		var link = event.target.getAttribute && event.target.getAttribute('data-link');
		var block = element ? this.Blueprints().Find(graph, element.getAttribute('data-id')) : null;
		var board = this.$Ref('Board', true);
		var typing = /^(INPUT|SELECT|TEXTAREA|OPTION)$/.test(event.target.tagName);
		var found;

		if (event.button !== 0) return;

		/* The keys go to the board, so Delete reaches the editor; a field of a property keeps its own. */
		if (board && !typing)
			board.Viewport().focus({preventScroll: true});

		if (pin && !this.Locked()) {
			found = this.Blueprints().PinById(graph, pin.getAttribute('data-pin'));

			event.preventDefault();
			event.stopPropagation();

			own.Draft = {Pin: found.Pin, Block: found.Block, Point: this.PinPoint(found.Pin.id), Pointer: event.pointerId};

			own.Canvas.setPointerCapture(event.pointerId);

			this.Wire();
			this.Move(event);

			return;
		}

		if (link) {
			this.Select(link);

			return;
		}

		if (!block) {
			if (own.Selected || own.Link)
				this.Select(null);

			return;
		}

		if (own.Selected !== block.id)
			this.Select(block.id);

		if (head) {
			event.preventDefault();

			own.Drag = {Block: block, Element: element, X: Number(block.x) || 0, Y: Number(block.y) || 0, ClientX: event.clientX, ClientY: event.clientY, Moved: false};

			own.Canvas.setPointerCapture(event.pointerId);
		}
	},

	Move: function (event) {
		var own = this.Own();
		var board = this.$Ref('Board', true);
		var zoom = board ? Number(board.Zoom) || 1 : 1;
		var drag = own.Drag;
		var world;

		if (drag) {
			drag.Block.x = Math.round(drag.X + (event.clientX - drag.ClientX) / zoom);
			drag.Block.y = Math.round(drag.Y + (event.clientY - drag.ClientY) / zoom);
			drag.Moved = true;
			drag.Element.style.left = drag.Block.x + 'px';
			drag.Element.style.top = drag.Block.y + 'px';

			this.Wire();

			return;
		}

		if (!own.Draft || !own.Draft.Path) return;

		world = board ? board.ToWorld(event.clientX, event.clientY) : {X: event.offsetX, Y: event.offsetY};

		if (own.Draft.Pin.direction && own.Draft.Pin.direction.out) own.Draft.Path.setAttribute('d', this.Curve(own.Draft.Point, world));
		else own.Draft.Path.setAttribute('d', this.Curve(world, own.Draft.Point));
	},

	Up: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var draft = own.Draft;
		var target;
		var other;

		own.Drag = null;
		own.Draft = null;

		if (drag) {
			if (drag.Moved)
				this.Changed();

			return;
		}

		if (!draft) return;

		target = document.elementFromPoint(event.clientX, event.clientY);
		target = target && target.closest ? target.closest('.elemenx-blueprint-pin') : null;
		other = target ? this.Blueprints().PinById(own.Graph, target.getAttribute('data-pin')) : null;

		if (other && other.Block !== draft.Block) this.Join(draft, other);
		else if (!other && draft.Pin.direction && draft.Pin.direction.in) this.Detach(draft.Pin.id);
		else this.Wire();
	},

	/* A link of two pins, out to in; what it takes the place of goes. */
	Join: function (draft, other) {
		var own = this.Own();
		var graph = own.Graph;
		var out = draft.Pin.direction && draft.Pin.direction.out;
		var from = out ? draft.Pin : other.Pin;
		var to = out ? other.Pin : draft.Pin;
		var flows = (from.kind || 'value') === 'flow';

		if (!!(from.direction && from.direction.out) === !!(to.direction && to.direction.out) || (from.kind || 'value') !== (to.kind || 'value')) {
			this.Wire();

			return;
		}

		graph.links = graph.links.filter(function (link) {
			return flows ? link.p1 !== from.id : link.p2 !== to.id;
		});

		this.Blueprints().Link(graph, from.id, to.id);

		this.Wire();
		this.Changed();
	},

	Detach: function (id) {
		var graph = this.Own().Graph;
		var count = graph.links.length;

		graph.links = graph.links.filter(function (link) {
			return link.p2 !== id;
		});

		this.Wire();

		if (graph.links.length !== count)
			this.Changed();
	},

	/* A property edited in a block: its value read by its type; the pins of the block follow it (the type of a Parameter). */
	Edited: function (event) {
		var own = this.Own();
		var field = event.target;
		var key = field.getAttribute && field.getAttribute('data-property');
		var element = field.closest ? field.closest('.elemenx-blueprint-block') : null;
		var blueprints = this.Blueprints();
		var block = element ? blueprints.Find(own.Graph, element.getAttribute('data-id')) : null;
		var node = block ? blueprints.NodeOf(block.type) : null;
		var property = node ? (node.Properties || []).filter(function (one) {
			return one.Key === key;
		})[0] : null;
		var value;
		var kept;
		var fresh;

		if (!block || !key || this.Locked()) return;

		if (field.type === 'checkbox') value = field.checked;
		else if (property && property.Type === 'number') value = field.value === '' ? '' : Number(field.value) || 0;
		else if (property && property.Type === 'select' && typeof (property.Options || [])[0] === 'number') value = Number(field.value);
		else if (property && property.Type === 'object') value = this.Parsed(field.value);
		else value = field.value;

		kept = block.properties.filter(function (one) {
			return one.key === key;
		})[0];

		if (kept) kept.value = value;
		else block.properties.push({key: key, value: value});

		if (typeof node.Outputs === 'function') {
			node.Outputs(blueprints.Properties(block)).forEach(function (output) {
				var pin = blueprints.Pin(block, output.Key, true);
				if (pin)
					pin.type = output.Type;
			});

			blueprints.Pins(block);

			fresh = this.BlockElement(block);

			element.replaceWith(fresh);

			if (own.Sizes)
				own.Sizes.observe(fresh);

			this.Marks();
			this.Wire();
		}

		this.Changed();
	},

	Key: function (event) {
		var own = this.Own();
		var typing = event.target && /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName);
		if (typing || this.Locked()) return;
		if (event.key !== 'Delete' && event.key !== 'Backspace') return;
		if (!own.Selected && !own.Link) return;

		event.preventDefault();

		this.Remove(own.Selected || own.Link);
	}
});
