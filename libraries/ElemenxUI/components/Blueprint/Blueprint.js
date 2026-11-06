/*
 * The editor of a blueprint (the Blueprints Service: a graph in the JSON of Flowprint) on a Board: blocks with their pins,
 * links drawn between them, the types of blocks of its graph to add (Palette) and its parameters, set from outside it.
 * Value is the graph (an object or the text of its file); without one it is an empty graph of Type. change emits the graph
 * after each action, select {Block, Link} (their ids, or null), problems what Check finds (each block it names is marked
 * wrong, with its message as its title). Errors are the ones its owner found as it used the graph ([{Block, Line,
 * Message}]: the errors of a shader made of it, as a Scene tells them in its event shader): marked wrong the same way.
 * A drag of the head of a block moves it; a drag from a pin to another draws a link (an input takes one link of values,
 * an output of flow goes one way: a new link takes the place of the old one); a drag from an input with a link, let go
 * on no pin, takes the link away. A press on a link selects it; Delete removes the block or the link selected. The
 * properties of a block are edited in it. ReadOnly shows the graph alone: blocks still move, nothing else changes.
 * EditCheck (action, target), false for what the reader may not do: add {Type}, remove {Blocks, Link, Group, Content},
 * link {From, To}, unlink {Pin}, edit {Block, Property}, move {Blocks}, group {Blocks}, ungroup {Group}, rename {Group},
 * comment {Target}, paste {}, parameter {Change, Index, Field}; a refusal is told in denied {Action, ...its target}.
 * Methods: Graph(), Write() (the text of its file), Add(type, x, y), Remove(id), Select(id), Selected(), Check(),
 * Compile(options), Arrange() (the blocks in columns, each after what it reads; a graph whose blocks all stand at 0, 0
 * is arranged when shown) and Fit().
 *
 * Many blocks are chosen at once: Shift or Ctrl and a press adds one or takes it away, Shift and a drag on an empty place
 * frames them, Ctrl+A chooses all (SelectMany(ids), Chosen()); a drag of the head of one moves all that are chosen,
 * Delete removes them. Ctrl+Z and Ctrl+Y (Ctrl+Shift+Z) undo and redo every change (Undo(), Redo()); Ctrl+C, Ctrl+V and
 * Ctrl+D copy, paste and duplicate the chosen blocks with the links between them (Copy(), Paste()).
 * Groups (the key groups of the graph: [{id, title, color, members (the ids of blocks and of groups), comment}]): a frame
 * round its members with a title, nested in another as a member of it. Ctrl+G groups what is chosen (Group(ids, title)),
 * a drag of the title moves the frame with all in it, a press on it chooses the group: Delete takes the frame away and
 * leaves its members, Shift+Delete takes them too (RemoveGroup(id, content)), Ctrl+Shift+G does the same as Delete
 * (Ungroup(id)); a double press on its title renames it. Comments (comment of blocks, links and groups, in Markdown) are
 * shown as Comments says: caption (a line in a small muted text under a block, in a frame under its title, by the middle
 * of a link), icon (a mark with the text as its title) or hidden. A double press on the head of a block or on a comment
 * edits it (Comment(id, text) from code). select tells {Block, Link, Group, Blocks}.
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
			select: 'The selection changed: {Block, Link, Group} (their ids or null) and Blocks, all the blocks chosen.',
			problems: 'What is wrong with the graph: [{Block, Pin, Link, Message}].',
			denied: 'EditCheck refused what the reader did: {Action, ...its target}.'
		},
		Methods: ['Graph()', 'Write()', 'Add(type, x, y)', 'Remove(id)', 'Select(id)', 'SelectMany(ids)', 'Selected()', 'Chosen()', 'Undo()', 'Redo()', 'Copy()', 'Paste()', 'Group(ids, title)', 'Ungroup(id)', 'RemoveGroup(id, content)', 'Comment(id, text)', 'Check()', 'Compile(options)', 'Arrange()', 'Fit()'],
		Props: {
			Value: 'The graph: an object or the text of its file.',
			Type: {Options: ['flow', 'pass', 'material', 'render', 'generator'], Description: 'The type of the graph made when there is no Value.'},
			Palette: 'Shows the types of blocks to add and the parameters (true by default).',
			ReadOnly: 'Shows the graph alone: blocks still move, nothing else changes.',
			EditCheck: 'A function (action, target): false refuses what the reader would do (add, remove, link, unlink, edit, move, group, ungroup, rename, comment, paste, parameter).',
			Errors: 'What its owner found wrong as it used the graph: [{Block, Line, Message}] (a Scene tells them in its event shader), marked on the blocks.',
			Comments: {Options: ['caption', 'icon', 'hidden'], Description: 'How the comments of blocks, links and groups show: a muted line under them, a mark, or not at all.'},
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Type: 'generator', Value: {version: 1, type: 'generator', parameters: [{key: 'Scale', type: 'float', value: 2}], blocks: [{id: 'n', type: 'Number', x: 40, y: 40, properties: [{key: 'Value', value: 3}]}, {id: 's', type: 'Parameter', x: 40, y: 160, properties: [{key: 'Key', value: 'Scale'}, {key: 'Type', value: 'float'}]}, {id: 'm', type: 'Multiply', x: 280, y: 90, properties: []}, {id: 'r', type: 'Result', x: 500, y: 100, properties: [{key: 'Key', value: 'Value'}]}], links: [{id: 'a', p1: 'n-out-Value', p2: 'm-in-A'}, {id: 'b', p1: 's-out-Value', p2: 'm-in-B'}, {id: 'c', p1: 'm-out-Out', p2: 'r-in-Value'}]}}
	},
	Value: null,
	Type: 'flow',
	Palette: true,
	ReadOnly: false,
	EditCheck: null,
	Errors: null,
	Comments: 'caption',
	Label: '',

	/* What the template renders: the filter of the palette, the kind of the graph and its parameters. */
	Filter: '',
	Kind: 'flow',
	Parameters: [],
	ParameterTypes: ['float', 'vec2', 'vec3', 'vec4', 'int', 'bool', 'text', 'any'],

	$OnCreate: function () {
		var own = {Graph: null, Emitted: '', Selected: null, Link: null, Group: null, Chosen: [], Drag: null, Svg: null, Draft: null, Canvas: null, Problems: [], History: [], Future: [], Last: '', Clip: null};

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

		canvas.addEventListener('dblclick', function (event) {
			self.Double(event);
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

			/* A graph given anew with its blocks all at 0, 0 is laid out, as one given first is. */
			if (own.Graph.blocks.length > 1 && own.Graph.blocks.every(function (block) {
				return !block.x && !block.y;
			}))
				this.Arrange();
		}

		if ('Errors' in changed)
			this.Marks();

		if ('Comments' in changed)
			this.Render();

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

	/*
	 * May the reader do it (EditCheck (action, target): false refuses it, told in denied {Action, ...target})? Actions: add
	 * {Type}, remove {Blocks, Link, Group, Content}, link {From, To} (pins), unlink {Pin}, edit {Block, Property}, move
	 * {Blocks}, group {Blocks}, ungroup {Group}, rename {Group}, comment {Target}, paste {}, parameter {Change (add, remove,
	 * set), Index, Field}. What ReadOnly keeps from the reader is not asked. The methods called by code are not asked.
	 */
	Can: function (action, target) {
		var allowed = typeof this.EditCheck !== 'function' || this.EditCheck(action, Object.assign({}, target)) !== false;
		if (!allowed)
			this.$Emit('denied', Object.assign({Action: action}, target));

		return allowed;
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
		own.Group = null;
		own.Chosen = [];
		own.Problems = blueprints.Check(own.Graph);

		/* A graph given from outside starts a history of its own. */
		own.History = [];
		own.Future = [];
		own.Last = blueprints.Write(own.Graph);

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

		if (!this.Can('add', {Type: type})) return;

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

	/* A block, a link or a group (its frame alone: RemoveGroup(id, true) takes its members too). */
	Remove: function (id) {
		var own = this.Own();

		if (this.GroupOf(id)) {
			this.RemoveGroup(id, false);

			return;
		}

		this.Blueprints().Remove(own.Graph, id);
		this.Forget([id]);

		if (own.Selected === id)
			own.Selected = null;

		if (own.Link === id)
			own.Link = null;

		own.Chosen = own.Chosen.filter(function (one) {
			return one !== id;
		});

		this.Render();
		this.Changed();
	},

	/* A block, a link or a group chosen alone (null: none). */
	Select: function (id) {
		var own = this.Own();
		var graph = own.Graph;
		var block = id ? this.Blueprints().Find(graph, id) : null;
		var link = block || !id ? null : graph.links.filter(function (one) {
			return one.id === id;
		})[0];
		var group = block || link || !id ? null : this.GroupOf(id);

		own.Selected = block ? id : null;
		own.Link = link ? id : null;
		own.Group = group ? id : null;
		own.Chosen = block ? [id] : [];

		this.Told();
	},

	/* Many blocks chosen at once: the first of them the one selected. */
	SelectMany: function (ids) {
		var own = this.Own();
		var blueprints = this.Blueprints();

		own.Chosen = (ids || []).filter(function (id, index, list) {
			return !!blueprints.Find(own.Graph, id) && list.indexOf(id) === index;
		});
		own.Selected = own.Chosen[0] || null;
		own.Link = null;
		own.Group = null;

		this.Told();
	},

	Told: function () {
		var own = this.Own();

		this.Marks();
		this.$Emit('select', {Block: own.Selected, Link: own.Link, Group: own.Group, Blocks: own.Chosen.slice()});
	},

	Selected: function () {
		var own = this.Own();

		return {Block: own.Selected, Link: own.Link, Group: own.Group, Blocks: own.Chosen.slice()};
	},

	Chosen: function () {
		return this.Own().Chosen.slice();
	},

	/* History: each change kept as the text of the graph; undone and done again. */
	Undo: function () {
		var own = this.Own();
		if (!own.History.length) return false;

		own.Future.push(own.Last);

		this.Restore(own.History.pop());

		return true;
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length) return false;

		own.History.push(own.Last);

		this.Restore(own.Future.pop());

		return true;
	},

	/* A graph of the history back in place, told as a change but kept out of the history. */
	Restore: function (text) {
		var own = this.Own();
		var blueprints = this.Blueprints();

		own.Graph = blueprints.Read(text);
		own.Last = text;
		own.Selected = null;
		own.Link = null;
		own.Group = null;
		own.Chosen = [];

		this.Render();

		own.Problems = this.Check();
		own.Emitted = this.Write();

		this.Refresh();
		this.Marks();
		this.$Emit('problems', own.Problems);
		this.$Emit('change', own.Graph);
	},

	/* The chosen blocks and the links between them, kept to be pasted (here, or in another Blueprint of the page). */
	Copy: function () {
		var own = this.Own();
		var graph = own.Graph;
		var blueprints = this.Blueprints();
		var ids = own.Chosen.length ? own.Chosen : own.Selected ? [own.Selected] : [];
		var blocks = ids.map(function (id) {
			return blueprints.Find(graph, id);
		}).filter(Boolean);
		var pins = {};
		var clip;

		if (!blocks.length) return null;

		blocks.forEach(function (block) {
			(block.pins || []).forEach(function (pin) {
				pins[pin.id] = {Block: block.id, Key: pin.key};
			});
		});

		clip = {Blocks: JSON.parse(JSON.stringify(blocks)), Links: graph.links.filter(function (link) {
			return pins[link.p1] && pins[link.p2];
		}).map(function (link) {
			return {From: pins[link.p1], To: pins[link.p2], Comment: link.comment || ''};
		})};

		own.Clip = clip;
		blueprints.Clip = clip;

		return clip;
	},

	/* What was copied, as new blocks a little aside, chosen; the links between them made again. */
	Paste: function () {
		var own = this.Own();
		var graph = own.Graph;
		var blueprints = this.Blueprints();
		var clip = blueprints.Clip || own.Clip;
		var made = {};

		if (this.Locked() || !clip || !clip.Blocks.length) return [];

		clip.Blocks.forEach(function (block) {
			var fresh = blueprints.Add(graph, block.type, {x: (Number(block.x) || 0) + 32, y: (Number(block.y) || 0) + 32});

			fresh.properties = JSON.parse(JSON.stringify(block.properties || []));
			fresh.enabled = block.enabled !== false;
			fresh.comment = block.comment || '';

			blueprints.Pins(fresh);

			made[block.id] = fresh;
		});

		clip.Links.forEach(function (link) {
			var from = made[link.From.Block];
			var to = made[link.To.Block];
			var joined;

			if (!from || !to) return;

			try {
				joined = blueprints.Link(graph, [from.id, link.From.Key], [to.id, link.To.Key]);
				joined.comment = link.Comment || '';
			}
			catch (error) {
				/* A pin of the copy that is not there any more (the properties changed it): the link is left out. */
			}
		});

		/* A second paste goes further aside. */
		clip.Blocks.forEach(function (block) {
			block.x = (Number(block.x) || 0) + 32;
			block.y = (Number(block.y) || 0) + 32;
		});

		this.Render();
		this.Changed();

		this.SelectMany(Object.keys(made).map(function (id) {
			return made[id].id;
		}));

		return this.Chosen();
	},

	/* Groups */

	GroupList: function () {
		var graph = this.Own().Graph;
		if (!Array.isArray(graph.groups))
			graph.groups = [];

		return graph.groups;
	},

	GroupOf: function (id) {
		var groups = this.Own().Graph.groups || [];

		return groups.filter(function (group) {
			return group.id === id;
		})[0] || null;
	},

	/* The blocks of a group, of the groups in it too. */
	MembersOf: function (id, seen) {
		var self = this;
		var group = this.GroupOf(id);
		var blocks = [];
		var met = seen || {};
		if (!group || met[id]) return blocks;

		met[id] = true;

		(group.members || []).forEach(function (member) {
			if (self.GroupOf(member)) blocks = blocks.concat(self.MembersOf(member, met));
			else blocks.push(member);
		});

		return blocks;
	},

	/* The ids of the groups and blocks gone: taken out of every group; a group left empty goes too. */
	Forget: function (ids) {
		var graph = this.Own().Graph;
		var changed = true;

		if (!graph.groups) return;

		graph.groups.forEach(function (group) {
			group.members = (group.members || []).filter(function (member) {
				return ids.indexOf(member) === -1;
			});
		});

		while (changed) {
			changed = false;

			graph.groups = graph.groups.filter(function (group) {
				if (group.members.length) return true;

				ids.push(group.id);

				changed = true;

				return false;
			});

			if (changed) {
				graph.groups.forEach(function (group) {
					group.members = group.members.filter(function (member) {
						return ids.indexOf(member) === -1;
					});
				});
			}
		}
	},

	/*
	 * A group of blocks and groups (the chosen blocks, without ids): a group that holds all of them takes the new one in
	 * its place, so groups nest. The new group, or null for nothing to group.
	 */
	Group: function (ids, title) {
		var own = this.Own();
		var self = this;
		var members = (ids || (own.Group ? [own.Group] : own.Chosen)).filter(function (id) {
			return !!self.Blueprints().Find(own.Graph, id) || !!self.GroupOf(id);
		});
		var groups;
		var group;
		var n = 1;

		if (this.Locked() || !members.length) return null;

		groups = this.GroupList();

		while (this.GroupOf('group-' + n))
			n++;

		/* Each member leaves the group it was in: the new group stands there in its place. */
		groups.forEach(function (outer) {
			var had = outer.members.filter(function (member) {
				return members.indexOf(member) !== -1;
			});
			if (!had.length) return;

			outer.members = outer.members.filter(function (member) {
				return members.indexOf(member) === -1;
			});

			outer.members.push('group-' + n);
		});

		group = {id: 'group-' + n, title: title || Elemenx.Locale.Text('ui.blueprint.group', {n: n}), color: '', members: members, comment: ''};

		groups.push(group);

		this.Render();
		this.Changed();
		this.Select(group.id);

		return group;
	},

	/* A group undone: its members go to the group it was in (or to none). */
	Ungroup: function (id) {
		return this.RemoveGroup(id, false);
	},

	/* A group taken away: its frame alone (its members stay, in the group it was in), or with all in it (content). */
	RemoveGroup: function (id, content) {
		var own = this.Own();
		var self = this;
		var group = this.GroupOf(id);
		var blocks;

		if (!group || this.Locked()) return false;

		if (content) {
			blocks = this.MembersOf(id);

			blocks.forEach(function (block) {
				self.Blueprints().Remove(own.Graph, block);
			});

			this.Forget(blocks.concat([id]));
		}
		else {
			own.Graph.groups.forEach(function (outer) {
				if (outer.members.indexOf(id) === -1) return;

				outer.members = outer.members.filter(function (member) {
					return member !== id;
				}).concat(group.members);
			});

			own.Graph.groups = own.Graph.groups.filter(function (one) {
				return one !== group;
			});
		}

		if (own.Group === id)
			own.Group = null;

		own.Chosen = own.Chosen.filter(function (one) {
			return !!self.Blueprints().Find(own.Graph, one);
		});

		this.Render();
		this.Changed();
		this.Told();

		return true;
	},

	/* The comment of a block, a link or a group (Markdown); '' takes it away. */
	Comment: function (id, text) {
		var own = this.Own();
		var target = this.Blueprints().Find(own.Graph, id) || this.GroupOf(id) || own.Graph.links.filter(function (one) {
			return one.id === id;
		})[0];
		if (!target || this.Locked()) return false;

		target.comment = String(text == null ? '' : text);

		this.Render();
		this.Changed();

		return true;
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
				/* A block not laid out yet (its height 0) is taken as a usual one. */
				y += (element && element.offsetHeight || 120) + 40;
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

		/* The text before this change into the history; what was undone is gone. */
		if (own.Emitted !== own.Last) {
			own.History.push(own.Last);

			if (own.History.length > 100)
				own.History.shift();

			own.Last = own.Emitted;
			own.Future = [];
		}

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

		if (!this.Can('parameter', {Change: 'add'})) return;

		while (keys.indexOf('Parameter' + n) !== -1)
			n++;

		graph.parameters.push({key: 'Parameter' + n, type: 'float', value: 0});

		this.Changed();
	},

	RemoveParameter: function (index) {
		if (!this.Can('parameter', {Change: 'remove', Index: index})) return;

		this.Own().Graph.parameters.splice(index, 1);

		this.Changed();
	},

	/* A field of a parameter: its value read by its type (numbers by commas for a vector). */
	SetParameter: function (index, field, event) {
		var parameter = this.Own().Graph.parameters[index];
		var text = event && event.target ? event.target.value : '';
		var size;

		if (!parameter) return;

		/* Refused: the field shows what it was again. */
		if (!this.Can('parameter', {Change: 'set', Index: index, Field: field})) {
			if (event && event.target)
				event.target.value = field === 'value' ? this.ValueText(parameter.value) : parameter[field];

			return;
		}

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

		Array.prototype.slice.call(own.Canvas.querySelectorAll('.elemenx-blueprint-block, .elemenx-blueprint-frame, .elemenx-blueprint-link-comment')).forEach(function (element) {
			element.remove();
		});

		/* The frames of the groups under the blocks, the outer ones under the inner ones. */
		(own.Graph.groups || []).slice().sort(function (a, b) {
			return self.Depth(a.id) - self.Depth(b.id);
		}).forEach(function (group) {
			own.Canvas.appendChild(self.FrameElement(group));
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
			var field = document.createElement(property.Type === 'select' ? 'select' : property.Type === 'code' ? 'textarea' : 'input');
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
			else if (property.Type === 'code') {
				/* Code (GLSL of a block): lines of their own, kept as they are typed. */
				label.classList.add('code');

				field.value = value == null ? '' : String(value);
				field.rows = 5;
				field.spellcheck = false;

				field.setAttribute('wrap', 'off');
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

		this.CommentOn(element, block);

		return element;
	},

	/* How deep a group is: the groups it is in. */
	Depth: function (id) {
		var groups = this.Own().Graph.groups || [];
		var depth = 0;
		var current = id;
		var guard = 0;
		var outer;

		do {
			outer = groups.filter(function (group) {
				return (group.members || []).indexOf(current) !== -1;
			})[0];

			if (outer) {
				depth++;
				current = outer.id;
			}

			guard++;
		} while (outer && guard < 50);

		return depth;
	},

	/* The frame of a group: its title and its comment over its members, laid round them (Wire). */
	FrameElement: function (group) {
		var frame = document.createElement('div');
		var head = document.createElement('div');
		var title = document.createElement('span');

		frame.className = 'elemenx-blueprint-frame';

		frame.setAttribute('data-group', group.id);

		/* Its color, #rrggbb, as the channels the frame is drawn of. */
		if (/^#[0-9a-f]{6}$/i.test(group.color || ''))
			frame.style.setProperty('--elemenx-blueprint-frame-rgb', [1, 3, 5].map(function (at) {
				return parseInt(group.color.substr(at, 2), 16);
			}).join(', '));

		head.className = 'elemenx-blueprint-frame-head';
		title.className = 'elemenx-blueprint-frame-title';
		title.textContent = group.title || group.id;

		head.appendChild(title);
		frame.appendChild(head);

		this.CommentOn(head, group);

		return frame;
	},

	/* The comment of a block or a group, as Comments says: a muted line of Markdown under it, or a mark with its text. */
	CommentOn: function (element, owner) {
		var mode = this.Comments || 'caption';
		var text = String(owner.comment || '');
		var note;

		if (!text.trim() || mode === 'hidden') return;

		if (mode === 'icon') {
			note = document.createElement('span');
			note.className = 'elemenx-blueprint-comment-mark';
			note.textContent = '…';

			note.setAttribute('title', text);
			note.setAttribute('aria-label', text);
		}
		else {
			note = document.createElement('div');
			note.className = 'elemenx-blueprint-comment';
			note.innerHTML = this.$Service('RichText').FromMarkdown(text);
		}

		note.setAttribute('data-comment', owner.id);

		element.appendChild(note);
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

		/* What Check finds, and what the owner found as it used the graph (a line of the code of a GLSL block). */
		own.Problems.concat((this.Errors || []).map(function (error) {
			return {Block: error.Block, Message: (error.Line ? 'GLSL ' + error.Line + ': ' : '') + error.Message};
		})).forEach(function (problem) {
			if (problem.Block)
				wrong[problem.Block] = (wrong[problem.Block] ? wrong[problem.Block] + '\n' : '') + problem.Message;
		});

		own.Graph.blocks.forEach(function (block) {
			var element = own.Canvas.querySelector('[data-id="' + block.id + '"]');
			if (!element) return;

			element.classList.toggle('selected', own.Selected === block.id || own.Chosen.indexOf(block.id) !== -1);
			element.classList.toggle('off', block.enabled === false);
			element.classList.toggle('wrong', !!wrong[block.id]);

			if (wrong[block.id]) element.setAttribute('title', wrong[block.id]);
			else element.removeAttribute('title');
		});

		Array.prototype.slice.call(own.Svg.querySelectorAll('path[data-link]')).forEach(function (path) {
			path.classList.toggle('selected', path.getAttribute('data-link') === own.Link);
		});

		Array.prototype.slice.call(own.Canvas.querySelectorAll('.elemenx-blueprint-frame')).forEach(function (frame) {
			frame.classList.toggle('selected', frame.getAttribute('data-group') === own.Group);
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

		this.Frames();
		this.LinkComments();
	},

	/* The box of a block or of a group on the canvas: a group round its members, with room for its head over them. */
	BoxOf: function (id, seen) {
		var own = this.Own();
		var self = this;
		var group = this.GroupOf(id);
		var met = seen || {};
		var element;
		var box = null;
		var head;

		if (!group) {
			element = own.Canvas.querySelector('[data-id="' + String(id).replace(/"/g, '\\"') + '"]');

			return element ? {Left: element.offsetLeft, Top: element.offsetTop, Right: element.offsetLeft + element.offsetWidth, Bottom: element.offsetTop + element.offsetHeight + (element.querySelector('.elemenx-blueprint-comment') ? element.querySelector('.elemenx-blueprint-comment').offsetHeight + 4 : 0)} : null;
		}

		if (met[id])
			return null;

		met[id] = true;

		(group.members || []).forEach(function (member) {
			var one = self.BoxOf(member, met);
			if (!one) return;

			box = box ? {Left: Math.min(box.Left, one.Left), Top: Math.min(box.Top, one.Top), Right: Math.max(box.Right, one.Right), Bottom: Math.max(box.Bottom, one.Bottom)} : one;
		});

		if (!box)
			return null;

		element = own.Canvas.querySelector('[data-group="' + String(id).replace(/"/g, '\\"') + '"]');
		head = element ? element.querySelector('.elemenx-blueprint-frame-head') : null;

		return {Left: box.Left - 16, Top: box.Top - 16 - (head ? head.offsetHeight : 28), Right: box.Right + 16, Bottom: box.Bottom + 16};
	},

	/* Each frame round its members, where they are now. */
	Frames: function () {
		var own = this.Own();
		var self = this;

		if (!own.Canvas) return;

		Array.prototype.forEach.call(own.Canvas.querySelectorAll('.elemenx-blueprint-frame'), function (frame) {
			var box = self.BoxOf(frame.getAttribute('data-group'));
			if (!box) return;

			frame.style.left = box.Left + 'px';
			frame.style.top = box.Top + 'px';
			frame.style.width = box.Right - box.Left + 'px';
			frame.style.height = box.Bottom - box.Top + 'px';
		});
	},

	/* The comments of the links, by the middle of each. */
	LinkComments: function () {
		var own = this.Own();
		var self = this;
		var mode = this.Comments || 'caption';

		if (!own.Canvas) return;

		Array.prototype.slice.call(own.Canvas.querySelectorAll('.elemenx-blueprint-link-comment')).forEach(function (element) {
			element.remove();
		});

		if (mode === 'hidden') return;

		own.Graph.links.forEach(function (link) {
			var holder;

			if (!String(link.comment || '').trim() || link.x1 == null) return;

			holder = document.createElement('div');
			holder.className = 'elemenx-blueprint-link-comment';
			holder.style.left = Math.round((link.x1 + link.x2) / 2) + 'px';
			holder.style.top = Math.round((link.y1 + link.y2) / 2) + 'px';

			self.CommentOn(holder, link);

			own.Canvas.appendChild(holder);
		});
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
		var frameHead = event.target.closest && !element ? event.target.closest('.elemenx-blueprint-frame-head') : null;
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

		/* The head of a frame: the group chosen, and dragged with all in it. */
		if (frameHead) {
			event.preventDefault();
			event.stopPropagation();

			this.Select(frameHead.parentNode.getAttribute('data-group'));
			this.StartDrag(this.MembersOf(own.Group), event);

			return;
		}

		if (!block) {
			/* Shift and a drag on an empty place: a frame that chooses what it takes in. */
			if (event.shiftKey) {
				event.preventDefault();
				event.stopPropagation();

				own.Lasso = {Start: board ? board.ToWorld(event.clientX, event.clientY) : {X: event.offsetX, Y: event.offsetY}, Element: document.createElement('div')};
				own.Lasso.Element.className = 'elemenx-blueprint-lasso';

				own.Canvas.appendChild(own.Lasso.Element);
				own.Canvas.setPointerCapture(event.pointerId);

				return;
			}

			if (own.Selected || own.Link || own.Group || own.Chosen.length)
				this.Select(null);

			return;
		}

		/* Shift or Ctrl: one more chosen, or one less. */
		if (event.shiftKey || event.ctrlKey || event.metaKey) {
			if (own.Chosen.indexOf(block.id) === -1) this.SelectMany(own.Chosen.concat([block.id]));
			else this.SelectMany(own.Chosen.filter(function (one) {
				return one !== block.id;
			}));
		}
		else if (own.Chosen.indexOf(block.id) === -1) {
			this.Select(block.id);
		}

		if (head && own.Chosen.indexOf(block.id) !== -1) {
			event.preventDefault();

			this.StartDrag(own.Chosen, event);
		}
	},

	/* A drag of blocks (all the chosen, or the members of a group): where each was when it began. */
	StartDrag: function (ids, event) {
		var own = this.Own();
		var self = this;

		own.Drag = {Blocks: ids.map(function (id) {
			var block = self.Blueprints().Find(own.Graph, id);

			return block ? {Block: block, Element: own.Canvas.querySelector('[data-id="' + id.replace(/"/g, '\\"') + '"]'), X: Number(block.x) || 0, Y: Number(block.y) || 0} : null;
		}).filter(Boolean), ClientX: event.clientX, ClientY: event.clientY, Moved: false};

		own.Canvas.setPointerCapture(event.pointerId);
	},

	Move: function (event) {
		var own = this.Own();
		var board = this.$Ref('Board', true);
		var zoom = board ? Number(board.Zoom) || 1 : 1;
		var drag = own.Drag;
		var world;

		if (drag) {
			/* Moved at last: may it be? */
			if (!drag.Moved && !this.Can('move', {Blocks: drag.Blocks.map(function (one) {
				return one.Block.id;
			})})) {
				own.Drag = null;

				return;
			}

			drag.Blocks.forEach(function (one) {
				one.Block.x = Math.round(one.X + (event.clientX - drag.ClientX) / zoom);
				one.Block.y = Math.round(one.Y + (event.clientY - drag.ClientY) / zoom);

				if (one.Element) {
					one.Element.style.left = one.Block.x + 'px';
					one.Element.style.top = one.Block.y + 'px';
				}
			});

			drag.Moved = true;

			this.Wire();

			return;
		}

		if (own.Lasso) {
			world = board ? board.ToWorld(event.clientX, event.clientY) : {X: event.offsetX, Y: event.offsetY};
			own.Lasso.End = world;
			own.Lasso.Element.style.left = Math.min(own.Lasso.Start.X, world.X) + 'px';
			own.Lasso.Element.style.top = Math.min(own.Lasso.Start.Y, world.Y) + 'px';
			own.Lasso.Element.style.width = Math.abs(world.X - own.Lasso.Start.X) + 'px';
			own.Lasso.Element.style.height = Math.abs(world.Y - own.Lasso.Start.Y) + 'px';

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

		var lasso = own.Lasso;
		var self = this;

		own.Drag = null;
		own.Draft = null;
		own.Lasso = null;

		if (drag) {
			if (drag.Moved)
				this.Changed();

			return;
		}

		/* The blocks wholly in the frame drawn are chosen. */
		if (lasso) {
			lasso.Element.remove();

			if (lasso.End) {
				this.SelectMany(own.Graph.blocks.filter(function (block) {
					var box = self.BoxOf(block.id);

					return box && box.Left >= Math.min(lasso.Start.X, lasso.End.X) && box.Right <= Math.max(lasso.Start.X, lasso.End.X) && box.Top >= Math.min(lasso.Start.Y, lasso.End.Y) && box.Bottom <= Math.max(lasso.Start.Y, lasso.End.Y);
				}).map(function (block) {
					return block.id;
				}));
			}

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

		if (!this.Can('link', {From: from.id, To: to.id})) {
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

		if (!this.Can('unlink', {Pin: id})) {
			this.Wire();

			return;
		}

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

		/* Refused: the block is drawn as it was. */
		if (!this.Can('edit', {Block: block.id, Property: key})) {
			this.Render();

			return;
		}

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

		/* Pins that follow the properties (a Vector of another size, a block of GLSL): made again, the links to the gone ones dropped. */
		if (typeof node.Outputs === 'function' || typeof node.Inputs === 'function') {
			blueprints.Pins(block);
			blueprints.Prune(this.Graph());

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
		var self = this;
		var typing = event.target && /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName);
		var mod = event.ctrlKey || event.metaKey;
		var key = String(event.key || '').toLowerCase();
		var chosen;

		if (typing) return;

		/* What only reads: all chosen, and copied. */
		if (mod && key === 'a') {
			event.preventDefault();

			this.SelectMany(own.Graph.blocks.map(function (block) {
				return block.id;
			}));

			return;
		}

		if (mod && key === 'c') {
			if (this.Copy())
				event.preventDefault();

			return;
		}

		if (this.Locked()) return;

		if (mod && (key === 'z' && !event.shiftKey)) {
			event.preventDefault();

			this.Undo();

			return;
		}

		if (mod && (key === 'y' || key === 'z' && event.shiftKey)) {
			event.preventDefault();

			this.Redo();

			return;
		}

		if (mod && key === 'v') {
			event.preventDefault();

			if (this.Can('paste', {}))
				this.Paste();

			return;
		}

		if (mod && key === 'd') {
			event.preventDefault();

			if (this.Copy() && this.Can('paste', {}))
				this.Paste();

			return;
		}

		if (mod && key === 'g') {
			event.preventDefault();

			if (event.shiftKey && own.Group && this.Can('ungroup', {Group: own.Group})) this.Ungroup(own.Group);
			else if (!event.shiftKey && this.Can('group', {Blocks: own.Chosen.length ? own.Chosen.slice() : own.Selected ? [own.Selected] : []})) this.Group(null);

			return;
		}

		if (event.key !== 'Delete' && event.key !== 'Backspace') return;

		if (own.Group) {
			event.preventDefault();

			if (this.Can('remove', {Group: own.Group, Content: event.shiftKey}))
				this.RemoveGroup(own.Group, event.shiftKey);

			return;
		}

		chosen = own.Chosen.length ? own.Chosen.slice() : own.Selected ? [own.Selected] : [];

		if (!chosen.length && !own.Link) return;

		event.preventDefault();

		if (!this.Can('remove', chosen.length ? {Blocks: chosen} : {Link: own.Link})) return;

		if (!chosen.length) {
			this.Remove(own.Link);

			return;
		}

		chosen.forEach(function (id) {
			self.Blueprints().Remove(own.Graph, id);
		});

		this.Forget(chosen);

		own.Selected = null;
		own.Chosen = [];

		this.Render();
		this.Changed();
		this.Told();
	},

	/*
	 * A double press: on the head of a block or on a comment, its comment edited (Markdown; Ctrl+Enter or leaving keeps it,
	 * Escape drops it); on the title of a frame, the title of the group.
	 */
	Double: function (event) {
		var own = this.Own();
		var self = this;
		var title = event.target.closest ? event.target.closest('.elemenx-blueprint-frame-title') : null;
		var note = event.target.closest ? event.target.closest('[data-comment]') : null;
		var head = event.target.closest ? event.target.closest('.elemenx-blueprint-head') : null;
		var element = event.target.closest ? event.target.closest('.elemenx-blueprint-block') : null;
		var id = note ? note.getAttribute('data-comment') : head && element ? element.getAttribute('data-id') : null;
		var group;
		var target;
		var field;
		var done = false;

		if (this.Locked() || /^(INPUT|SELECT|TEXTAREA|OPTION)$/.test(event.target.tagName)) return;

		if (title) {
			group = this.GroupOf(title.parentNode.parentNode.getAttribute('data-group'));

			if (!this.Can('rename', {Group: group.id})) return;

			field = document.createElement('input');
			field.className = 'elemenx-blueprint-frame-rename';
			field.value = group.title || '';

			title.replaceWith(field);

			field.focus();
			field.select();

			field.addEventListener('keydown', function (key) {
				if (key.key === 'Enter')
					field.blur();

				if (key.key === 'Escape') {
					done = true;

					self.Render();
				}
			});

			field.addEventListener('blur', function () {
				if (done) return;

				done = true;
				group.title = field.value.trim() || group.title;

				self.Render();
				self.Changed();
			});

			return;
		}

		if (!id) return;

		target = this.Blueprints().Find(own.Graph, id) || this.GroupOf(id) || own.Graph.links.filter(function (one) {
			return one.id === id;
		})[0];

		if (!target || !this.Can('comment', {Target: id})) return;

		event.preventDefault();

		field = document.createElement('textarea');
		field.className = 'elemenx-blueprint-comment-editor';
		field.value = target.comment || '';
		field.rows = 3;

		field.setAttribute('aria-label', Elemenx.Locale.Text('ui.blueprint.comment'));

		(element || (note && note.parentNode) || own.Canvas).appendChild(field);
		field.focus();

		field.addEventListener('keydown', function (key) {
			key.stopPropagation();

			if (key.key === 'Enter' && (key.ctrlKey || key.metaKey))
				field.blur();

			if (key.key === 'Escape') {
				done = true;

				field.remove();
			}
		});

		field.addEventListener('blur', function () {
			if (done) return;

			done = true;

			self.Comment(id, field.value.trim());
		});
	}
});
