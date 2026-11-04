/*
 * Blueprints: graphs of blocks joined by links, kept in the JSON of Flowprint (https://github.com/Qybercom/Flowprint),
 * and made into what runs: a shader, a list of passes of a picture, a function or a flow of actions.
 *
 * The JSON is the one of Flowprint, with its keys as they are, and a few more of the same kind:
 * {version, type (of the graph), name, parameters: [{key, type, value, min, max, comment}], blocks: [{id, type (of the
 * block), x, y, properties: [{key, value}], enabled, comment, pins: [{id, key, content, direction: {in, out}, place
 * (header or body), kind (flow or value), type (of its value), enabled, comment}]}], links: [{id, x1, y1, x2, y2, p1
 * (the pin it comes from), p2 (the pin it goes to), kind, enabled, comment}]}. A file of Flowprint without them reads
 * as version 1; a block without a type is Generic and runs as nothing. What is not known is kept as it is.
 *
 * Types of values: float, vec2, vec3, vec4, int, bool (numbers, and lists of them in code), texture (a picture),
 * text, object, any, and flow (the way an action goes on). The numbers go into each other (a float fills a vector, a
 * vector gives its first parts); a block of type same takes the widest of what comes to it.
 *
 * - Node(type, definition) adds a type of block or replaces it: {Graphs (where it may stand: a list of the types of
 *   graphs, or '*'), Title, Group, Comment, Inputs and Outputs ([{Key, Type, Value (what an input is when nothing
 *   comes to it), Default (the same as code of GLSL)}], or a function of the properties of a block giving them: the pins
 *   follow its properties, and Pins drops those it names no more), Flow ({In: [keys], Out: [keys]}), Properties ([{Key,
 *   Type (number, text, bool, color, select, vector, object, code: lines of code), Value, Options, Min, Max}]), and what
 *   it does in each kind of graph:
 *   GLSL (in a graph of shaders: a text with its inputs as {Key}, or function (context) giving {Output: code}, context.Lines to add lines
 *   before), Needs (parts of Renderer.Chunks it calls): the shaders, of BlueprintShaders), Compute (function (inputs, properties, context) giving
 *   {Output: value}), Run (an action of a flow, below) and Pass (a pass of a picture, below)}. Nodes(graph) lists the
 *   types that may stand in a graph of a type, NodeOf(type) gives one.
 * - Graph(type, {Compile(plan, options), End, Uses, Bake(made), Unbake(record), Text(glsl, options)}) adds a kind of
 *   graph (End: the type of block it ends at; Uses: kinds whose blocks stand in it too, as an effect takes the blocks of
 *   a generator; Bake and Unbake: what is made as JSON and back; Text: what is made of a text written by hand); Graphs() lists them. This library has generator (code of numbers that gives
 *   each Result by its Key) and flow (events and actions, run by Start). The kinds of shaders are of the Service
 *   BlueprintShaders (ElemenxUI), which defines them, with the GLSL of the blocks, as it is made: pass (a fragment
 *   shader over the whole picture, its Output a vec4), material (a function of GLSL that changes a surface, its
 *   Surface the color, alpha, roughness, metalness, glow and normal) and render (passes of a picture, each a block
 *   whose Pass(context, inputs, properties, block) gives its textures, ending at Present). A Service of any Library
 *   adds kinds and blocks the same way, and declares them in $Provides ({Blueprints: {Graphs: [...], Nodes: [...]}}):
 *   a graph of such a kind or a block of such a type (Read, Create, Check, Compile, Add, NodeOf), or a list of them
 *   (Nodes, Graphs), makes that Service first.
 * - Create(type, options) is an empty graph ({name, parameters}); Block(type, options) a block of a type with its pins
 *   ({id, x, y, properties: {key: value}}); Add(graph, type, options) puts one into a graph; Link(graph, from, to)
 *   joins an output to an input ([block id, key] or a pin id) and gives the link; Remove(graph, id) takes a block,
 *   with its links, or a link; Pin(block, key, out) finds a pin; Pins(block) makes the pins of a block as its type has
 *   them, and Prune(graph) takes away the links of pins that are there no more (it returns them).
 * - Read(json) reads a text or an object of JSON and gives the graph (a version newer than Version is an error; the
 *   pins a type has are added where they are missing); Write(graph) gives it as the text of a file.
 * - Check(graph) lists what is wrong ([{Block, Pin, Link, Message}]): a type not known or not for this graph, a link
 *   of pins not there or of kinds that do not go together, two links to one input, a circle of values, a graph with
 *   no end. Order(graph) gives the blocks so each one comes after what it reads.
 * - Compile(graph, options) makes it (an error, with its list in Problems, when Check finds anything): the same graph
 *   is made once (Hash: what makes it, not where its blocks are). Of a pass {Type, Hash, Fragment, Uniforms
 *   [{Name, Type}], Textures [{Name, Uniform}], Parameters, Values(parameters, extra)}: Values gives the uniforms of
 *   the parameters (by key, else their value) and of extra (Time, Pixel, Textures by name). Of a material the same
 *   with Source (the function blueprintSurface) in place of Fragment. Of a render {Passes, Run(context, parameters)};
 *   of a generator {Run(parameters, inputs)}; of a flow {Start(context)}. A graph written by hand, {type, glsl (its
 *   text), parameters (none: those of the text)}, is made by Text of its kind, once for the same text (a shader of
 *   BlueprintShaders: pass, material).
 * - Parameters of a graph are what is set from outside it: a block Parameter (its key) gives the value; in a shader
 *   it is a uniform, so changing it makes nothing again.
 * - Bake(graph) gives a pass or a material made, as JSON ({version, type, hash, parameters, baked}): Compile reads it
 *   back with no node at all. Graphs of code (render, generator, flow) are not baked: their blocks run as code.
 * - Start(graph, context) runs a flow: {Emit(name, payload, callback) (the events of that name start, the callback
 *   has (error) when all they started is done), On(name, handler) (what an Emit block tells; it returns what stops
 *   listening), Variables, Stop()}. context: Actions ({Name: function (value, done (error, result))}), Timer
 *   (function (seconds, run), setTimeout by default) and anything the blocks read. A block's Run(context) gets
 *   {Inputs, Properties, Block, Instance, Payload, Set(key, value) (its output), Later() (a function to go on with
 *   later: (key)) } and gives the key of the flow it goes on by, a list of them, or {Key, Values} (its outputs while that
 *   way runs: the Index of a For). More than Steps (100000) at once is an error: a flow that never ends.
 * The types of this library: Number, Vector, Color, Text, Bool, Parameter, Time, Input, Add, Subtract, Multiply,
 * Divide, Min, Max, Pow, Step, Sin, Cos, Abs, Floor, Fract, Sqrt, Exp, OneMinus, Saturate, Mix, Clamp, Smoothstep,
 * Remap, Dot, Length, Normalize, Split, Combine, Noise, Fbm, Result, Compare, And, Or, Not, Field, Get, Set, Event,
 * Branch, Sequence, For, Delay, Action, Emit; BlueprintShaders adds UV, Pixel, Position, Normal, Texture, Output,
 * Surface and Present, and the GLSL of the numbers.
 * Errors start with 'Elemenx Blueprints:'. The same functions run in Node: they read no page.
 */
Elemenx.Service('Blueprints', {
	$Meta: {
		Description: 'Graphs of blocks in the JSON of Flowprint, made into code and flows of actions (and into shaders by BlueprintShaders).',
		Methods: ['Node(type, definition)', 'Nodes(graph)', 'NodeOf(type)', 'Graph(type, definition)', 'Graphs()', 'Create(type, options)', 'Block(type, options)', 'Add(graph, type, options)', 'Link(graph, from, to)', 'Remove(graph, id)', 'Pin(block, key, out)', 'Read(json)', 'Write(graph)', 'Check(graph)', 'Order(graph)', 'Compile(graph, options)', 'Bake(graph)', 'Start(graph, context)']
	},

	Version: 1,
	Steps: 100000,

	/* How many numbers each type of GLSL holds. */
	Sizes: {float: 1, vec2: 2, vec3: 3, vec4: 4, int: 1, bool: 1},

	$OnCreate: function () {
		this.Types = {};
		this.Makers = {};
		this.Made = {};
		this.Counter = 0;

		this.Library();
	},

	Node: function (type, definition) {
		if (typeof type !== 'string' || !type || !definition || typeof definition !== 'object')
			throw new Error('Elemenx Blueprints: Node expects (type, definition)');

		this.Types[type] = definition;
		this.Made = {};

		return type;
	},

	Nodes: function (graph) {
		var self = this;

		this.Provide(graph);
		this.$Provide('Nodes');

		return Object.keys(this.Types).filter(function (type) {
			return !graph || self.Allowed(self.Types[type], graph);
		});
	},

	NodeOf: function (type) {
		if (!this.Types[type])
			this.$Provide('Nodes', type);

		return this.Types[type] || null;
	},

	Graph: function (type, definition) {
		if (typeof type !== 'string' || !type || !definition || typeof definition.Compile !== 'function')
			throw new Error('Elemenx Blueprints: Graph expects (type, {Compile})');

		this.Makers[type] = definition;
		this.Made = {};

		return type;
	},

	Graphs: function () {
		this.Provide();

		return Object.keys(this.Makers);
	},

	/* The Services that declare a kind of graph ($Provides), made before it is read: all of them with no type. */
	Provide: function (type) {
		if (!type) this.$Provide('Graphs');
		else if (!this.Makers[type]) this.$Provide('Graphs', type);
	},

	/* A type of block stands in the graphs it names, and in those of a kind that Uses one of them. */
	Allowed: function (node, graph) {
		var where = node.Graphs || '*';
		var uses = this.Makers[graph] && this.Makers[graph].Uses || [];

		if (where === '*' || where.indexOf(graph) !== -1 || where.indexOf('*') !== -1) return true;

		return uses.some(function (kind) {
			return where.indexOf(kind) !== -1;
		});
	},

	/* Blueprints: the JSON */

	Create: function (type, options) {
		options = options || {};

		this.Provide(type || 'flow');

		return {version: this.Version, type: type || 'flow', name: options.name || options.Name || '', parameters: (options.parameters || options.Parameters || []).slice(), blocks: [], links: []};
	},

	Id: function (what) {
		this.Counter++;

		return 'flowprint-' + what + '-' + Date.now().toString(36) + this.Counter.toString(36);
	},

	Block: function (type, options) {
		var node = this.NodeOf(type);
		var block;
		var given;

		options = options || {};
		given = options.properties || options.Properties || {};

		if (!node)
			throw new Error('Elemenx Blueprints: unknown type of block ' + type);

		block = {id: options.id || options.ID || this.Id('block'), type: type, x: Number(options.x || options.X) || 0, y: Number(options.y || options.Y) || 0, properties: [], enabled: true, comment: options.comment || '', pins: []};

		(node.Properties || []).forEach(function (property) {
			block.properties.push({key: property.Key, value: Object.prototype.hasOwnProperty.call(given, property.Key) ? given[property.Key] : property.Value});
		});

		Object.keys(given).forEach(function (key) {
			var known = block.properties.some(function (property) {
				return property.key === key;
			});
			if (!known)
				block.properties.push({key: key, value: given[key]});
		});

		this.Pins(block);

		return block;
	},

	/* The pins of a block as its type has them: those missing are added, the ones there keep what they have. */
	Pins: function (block) {
		var node = block.type ? this.NodeOf(block.type) : null;
		var pins = block.pins = block.pins || [];
		var self = this;

		pins.forEach(function (pin) {
			if (pin.key == null)
				pin.key = self.KeyOf(block, pin);
		});

		if (!node)
			return block;

		function ensure (key, out, kind, type, place) {
			var pin = self.Pin(block, key, out, kind);

			if (!pin) {
				pin = {id: block.id + '-' + (out ? 'out' : 'in') + '-' + key, key: key, content: key, direction: {in: !out, out: out}, place: place, kind: kind, type: type, enabled: true, comment: ''};

				pins.push(pin);
			}
			else if (!pin.type) {
				pin.type = type;
			}
		}

		((node.Flow || {}).In || []).forEach(function (key) {
			ensure(key, false, 'flow', 'flow', 'header');
		});

		((node.Flow || {}).Out || []).forEach(function (key) {
			ensure(key, true, 'flow', 'flow', 'header');
		});

		(this.Inputs(node, block) || []).forEach(function (input) {
			ensure(input.Key, false, 'value', input.Type, 'body');
		});

		(this.Outputs(node, block) || []).forEach(function (output) {
			ensure(output.Key, true, 'value', output.Type, 'body');
		});

		/* A type whose pins follow its properties (a function) has those only: a pin it names no more goes, its type follows. */
		[[node.Inputs, false], [node.Outputs, true]].forEach(function (side) {
			var listed;

			if (typeof side[0] !== 'function') return;

			listed = (side[1] ? self.Outputs(node, block) : self.Inputs(node, block)) || [];

			block.pins = pins = pins.filter(function (pin) {
				var found = listed.filter(function (one) {
					return one.Key === pin.key;
				})[0];

				if (pin.kind === 'flow' || !!(pin.direction && pin.direction.out) !== side[1]) return true;

				if (found)
					pin.type = found.Type;

				return !!found;
			});
		});

		return block;
	},

	/* The links of a graph whose pins are there no more (a block of GLSL that named other pins) go: they are what goes. */
	Prune: function (graph) {
		var ids = {};
		var gone = [];

		graph.blocks.forEach(function (block) {
			(block.pins || []).forEach(function (pin) {
				ids[pin.id] = true;
			});
		});

		graph.links = graph.links.filter(function (link) {
			var kept = ids[link.p1] && ids[link.p2];
			if (!kept)
				gone.push(link);

			return kept;
		});

		return gone;
	},

	/* The outputs of a block: a Parameter has the type of its parameter, the others what their type tells. */
	/* The pins of a type of block: a list, or a function of the properties of the block (a block of GLSL names its own). */
	Inputs: function (node, block) {
		return typeof node.Inputs === 'function' ? node.Inputs(this.Properties(block)) : node.Inputs;
	},

	Outputs: function (node, block) {
		return typeof node.Outputs === 'function' ? node.Outputs(this.Properties(block)) : node.Outputs;
	},

	/* The key of a pin of Flowprint that has none: what follows the id of its block, or its id. */
	KeyOf: function (block, pin) {
		var id = String(pin.id || '');
		var rest = id.indexOf(block.id) === 0 ? id.slice(block.id.length) : id;

		return rest.replace(/^-(in|out)-/, '').replace(/^[-_:]/, '') || id;
	},

	Pin: function (block, key, out, kind) {
		var pins = block.pins || [];
		var i;

		for (i = 0; i < pins.length; i++) {
			if (pins[i].key === key && !!(pins[i].direction && pins[i].direction.out) === !!out && (!kind || (pins[i].kind || 'value') === kind)) return pins[i];
		}

		return null;
	},

	Add: function (graph, type, options) {
		var block;

		this.Provide(graph && graph.type);

		block = this.Block(type, options);

		graph.blocks.push(block);

		return block;
	},

	/* An end of a link: a pin id, or [block id, key]; the output is looked for first at the start of a link. */
	End: function (graph, end, out) {
		var block;
		var pin;

		if (typeof end === 'string') return end;

		block = this.Find(graph, end[0]);
		pin = block ? this.Pin(block, end[1], out) || this.Pin(block, end[1], !out) : null;

		if (!pin)
			throw new Error('Elemenx Blueprints: no pin ' + end[1] + ' on block ' + end[0]);

		return pin.id;
	},

	Link: function (graph, from, to) {
		var p1 = this.End(graph, from, true);
		var p2 = this.End(graph, to, false);
		var start = this.PinById(graph, p1);
		var link = {id: this.Id('link'), x1: 0, y1: 0, x2: 0, y2: 0, p1: p1, p2: p2, kind: start ? start.Pin.kind || 'value' : 'value', enabled: true, comment: ''};

		graph.links.push(link);

		return link;
	},

	Remove: function (graph, id) {
		var block = this.Find(graph, id);
		var pins;

		if (block) {
			pins = (block.pins || []).map(function (pin) {
				return pin.id;
			});

			graph.blocks.splice(graph.blocks.indexOf(block), 1);

			graph.links = graph.links.filter(function (link) {
				return pins.indexOf(link.p1) === -1 && pins.indexOf(link.p2) === -1;
			});

			return true;
		}

		graph.links = graph.links.filter(function (link) {
			return link.id !== id;
		});

		return true;
	},

	Find: function (graph, id) {
		var i;

		for (i = 0; i < graph.blocks.length; i++) {
			if (graph.blocks[i].id === id) return graph.blocks[i];
		}

		return null;
	},

	PinById: function (graph, id) {
		var i;
		var j;
		var pins;

		for (i = 0; i < graph.blocks.length; i++) {
			pins = graph.blocks[i].pins || [];

			for (j = 0; j < pins.length; j++) {
				if (pins[j].id === id)
					return {Block: graph.blocks[i], Pin: pins[j]};
			}
		}

		return null;
	},

	Properties: function (block) {
		var properties = {};

		(block.properties || []).forEach(function (property) {
			properties[property.key] = property.value;
		});

		return properties;
	},

	Read: function (json) {
		var graph = typeof json === 'string' ? JSON.parse(json) : json;
		var self = this;

		if (!graph || typeof graph !== 'object' || !Array.isArray(graph.blocks) || !Array.isArray(graph.links))
			throw new Error('Elemenx Blueprints: a blueprint has blocks and links');

		graph.version = graph.version == null ? 1 : Number(graph.version);

		if (!(graph.version <= this.Version))
			throw new Error('Elemenx Blueprints: version ' + graph.version + ' is newer than ' + this.Version);

		graph.type = graph.type || 'flow';
		graph.parameters = graph.parameters || [];

		this.Provide(graph.type);

		graph.blocks.forEach(function (block) {
			block.properties = block.properties || [];
			block.enabled = block.enabled !== false;

			self.Pins(block);
		});

		graph.links.forEach(function (link) {
			var one = self.PinById(graph, link.p1);
			var two = self.PinById(graph, link.p2);
			var kept;

			link.enabled = link.enabled !== false;

			/* Drawn from an input to an output: the same link the other way. */
			if (one && two && one.Pin.direction && one.Pin.direction.in && two.Pin.direction && two.Pin.direction.out) {
				kept = link.p1;
				link.p1 = link.p2;
				link.p2 = kept;
			}
		});

		return graph;
	},

	Write: function (graph) {
		return JSON.stringify(graph, null, 2);
	},

	/* Blueprints: checks */

	/* What a graph is made of, read once: its blocks by id, where each input comes from, where each flow goes. */
	Plan: function (graph) {
		var self = this;
		var plan = {Graph: graph, Blocks: {}, Nodes: {}, From: {}, Next: {}, Problems: [], Order: []};

		graph.blocks.forEach(function (block) {
			var node = block.type ? self.NodeOf(block.type) : null;

			plan.Blocks[block.id] = block;
			plan.Nodes[block.id] = node || null;
			plan.From[block.id] = {};
			plan.Next[block.id] = {};

			if (!block.type) plan.Problems.push({Block: block.id, Message: 'block ' + block.id + ' has no type'});
			else if (!node) plan.Problems.push({Block: block.id, Message: 'unknown type of block ' + block.type});
			else if (!self.Allowed(node, graph.type)) plan.Problems.push({Block: block.id, Message: 'a block ' + block.type + ' does not stand in a ' + graph.type + ' graph'});
		});

		graph.links.forEach(function (link) {
			var one = self.PinById(graph, link.p1);
			var two = self.PinById(graph, link.p2);
			var kind;

			if (link.enabled === false) return;

			if (!one || !two) {
				plan.Problems.push({Link: link.id, Message: 'link ' + link.id + ' joins a pin that is not there'});

				return;
			}

			kind = one.Pin.kind || 'value';

			if (kind !== (two.Pin.kind || 'value')) {
				plan.Problems.push({Link: link.id, Message: 'link ' + link.id + ' joins a ' + kind + ' pin to a ' + (two.Pin.kind || 'value') + ' pin'});

				return;
			}

			if (kind === 'flow') {
				(plan.Next[one.Block.id][one.Pin.key] = plan.Next[one.Block.id][one.Pin.key] || []).push(two.Block.id);

				return;
			}

			if (plan.From[two.Block.id][two.Pin.key]) {
				plan.Problems.push({Block: two.Block.id, Pin: two.Pin.id, Message: 'input ' + two.Pin.key + ' of block ' + two.Block.id + ' has two links'});

				return;
			}

			if (!self.Fits(one.Pin.type, two.Pin.type)) {
				plan.Problems.push({Link: link.id, Message: 'link ' + link.id + ' gives ' + one.Pin.type + ' to ' + two.Pin.type});

				return;
			}

			plan.From[two.Block.id][two.Pin.key] = {Block: one.Block.id, Key: one.Pin.key, Type: one.Pin.type};
		});

		this.Sort(plan);

		return plan;
	},

	/* The blocks after what they read; a circle of values is a problem. */
	Sort: function (plan) {
		var state = {};
		var order = plan.Order;

		function visit (id, path) {
			var from;

			if (state[id] === 2) return true;

			if (state[id] === 1) {
				plan.Problems.push({Block: id, Message: 'a circle of values: ' + path.concat(id).join(', ')});

				return false;
			}

			state[id] = 1;
			from = plan.From[id];

			var ok = Object.keys(from).every(function (key) {
				return visit(from[key].Block, path.concat(id));
			});

			state[id] = 2;

			order.push(id);

			return ok;
		}

		Object.keys(plan.Blocks).forEach(function (id) {
			visit(id, []);
		});
	},

	Fits: function (from, to) {
		var numbers = this.Sizes;

		if (!from || !to || from === to) return true;
		if (from === 'flow' || to === 'flow') return false;
		if (from === 'any' || to === 'any') return true;
		if (from === 'texture' || to === 'texture') return false;
		if (from === 'same' || to === 'same') return true;
		if (numbers[from] && numbers[to]) return true;

		return to === 'object' || to === 'text';
	},

	Check: function (graph) {
		var plan;
		var definition;

		this.Provide(graph && graph.type);

		plan = this.Plan(graph);
		definition = this.Makers[graph.type];

		var problems = plan.Problems;

		var ended = definition && definition.End ? graph.blocks.some(function (block) {
			return block.type === definition.End && block.enabled !== false;
		}) : true;

		if (!definition) problems.push({Message: 'unknown type of graph ' + graph.type});
		else if (!ended) problems.push({Message: 'a ' + graph.type + ' graph has no ' + definition.End});

		return problems;
	},

	Order: function (graph) {
		var plan = this.Plan(graph);

		return plan.Order.map(function (id) {
			return plan.Blocks[id];
		});
	},

	/* Blueprints: making */

	/* What makes a graph what it is: not where its blocks stand, nor its comments, nor the values of its parameters. */
	Hash: function (graph) {
		var text = JSON.stringify([graph.type, graph.parameters.map(function (parameter) {
			return [parameter.key, parameter.type];
		}), graph.blocks.map(function (block) {
			return [block.id, block.type, block.properties, block.enabled !== false, (block.pins || []).map(function (pin) {
				return [pin.id, pin.key, pin.kind, pin.type];
			})];
		}), graph.links.map(function (link) {
			return [link.p1, link.p2, link.enabled !== false];
		})]);

		return this.Digest(text);
	},

	/* A short hash of a text: FNV-1a, with its length. */
	Digest: function (text) {
		var hash = 2166136261;
		var i;

		for (i = 0; i < text.length; i++) {
			hash ^= text.charCodeAt(i);
			hash = Math.imul(hash, 16777619) >>> 0;
		}

		return ('0000000' + hash.toString(16)).slice(-8) + text.length.toString(16);
	},

	/*
	 * A graph written by hand: {type, glsl (its text), parameters (none: those its kind finds in the text)}. Its kind
	 * makes it of the text (Text), once for the same text; a kind with no Text is not written by hand.
	 */
	Written: function (record, options) {
		var definition;
		var hash;
		var made;

		this.Provide(record.type);

		definition = this.Makers[record.type];

		if (!definition || typeof definition.Text !== 'function')
			throw new Error('Elemenx Blueprints: a ' + record.type + ' graph is not written by hand');

		hash = 'text' + this.Digest(record.type + '\n' + record.glsl);

		if (!this.Made[hash]) {
			made = definition.Text.call(this, record.glsl, options || {});
			made.Type = record.type;
			made.Hash = hash;
			made.Found = made.Parameters || [];

			this.Made[hash] = made;
		}

		made = this.Made[hash];

		return this.Defaults(made, Array.isArray(record.parameters) ? record.parameters : made.Found);
	},

	Compile: function (graph, options) {
		var definition;
		var problems;
		var error;
		var hash;
		var made;

		if (graph && graph.baked)
			return this.Unbake(graph);

		if (graph && typeof graph.glsl === 'string') return this.Written(graph, options);

		graph = this.Read(graph);
		definition = this.Makers[graph.type];
		hash = this.Hash(graph);

		/* Made already: only the values of its parameters may differ, and they are uniforms, or what code reads. */
		if (this.Made[hash])
			return this.Defaults(this.Made[hash], graph.parameters);

		problems = this.Check(graph);

		if (problems.length) {
			error = new Error('Elemenx Blueprints: ' + problems[0].Message);
			error.Problems = problems;

			throw error;
		}

		made = definition.Compile.call(this, this.Plan(graph), options || {});
		made.Type = graph.type;
		made.Hash = hash;

		this.Made[hash] = made;

		return this.Defaults(made, graph.parameters);
	},

	/* The values of the parameters of a graph as it is now: those of the uniforms of a shader, those code reads. */
	Defaults: function (made, parameters) {
		var values = {};

		parameters.forEach(function (parameter) {
			values[parameter.key] = parameter.value;
		});

		made.Parameters = parameters.map(function (parameter) {
			return Object.assign({}, parameter);
		});

		(made.Uniforms || []).forEach(function (uniform) {
			if (uniform.Key != null)
				uniform.Value = values[uniform.Key];
		});

		return made;
	},

	/* A graph made as JSON, by its kind (pass and material can). */
	Bake: function (graph) {
		var made = this.Compile(graph);
		var definition = this.Makers[made.Type];
		if (!definition.Bake)
			throw new Error('Elemenx Blueprints: a ' + made.Type + ' graph is not baked: its blocks run as code');

		return definition.Bake.call(this, made);
	},

	Unbake: function (record) {
		var definition;

		if (!(Number(record.version) <= this.Version))
			throw new Error('Elemenx Blueprints: version ' + record.version + ' is newer than ' + this.Version);

		this.Provide(record.type);

		definition = this.Makers[record.type];

		if (!definition || !definition.Unbake)
			throw new Error('Elemenx Blueprints: a ' + record.type + ' graph is not baked');

		return definition.Unbake.call(this, record);
	},

	/* Blueprints: code */

	/* A value as a list of size numbers: a number fills it, a color #rrggbb gives its parts from 0 to 1. */
	Numbers: function (value, size) {
		var list;
		var i;

		if (typeof value === 'string' && /^#[0-9a-f]{6,8}$/i.test(value)) {
			list = [];

			for (i = 1; i < value.length; i += 2)
				list.push(parseInt(value.slice(i, i + 2), 16) / 255);
		}
		else if (Array.isArray(value)) {
			list = value.map(Number);
		}
		else {
			list = [Number(value) || 0];

			while (list.length < size)
				list.push(list[0]);
		}

		while (list.length < size)
			list.push(size === 4 && list.length === 3 ? 1 : 0);

		return list.slice(0, size);
	},


	/* A value of code of a type: numbers by their size, lists by parts. */
	Cast: function (value, from, to) {
		var size = this.Sizes[to];
		var list;

		if (!to || to === 'any' || to === 'same' || to === from || to === 'object') return value;

		if (to === 'text')
			return value == null ? '' : String(value);

		if (to === 'bool')
			return Array.isArray(value) ? !!value[0] : !!value;

		if (!size)
			return value;

		if (typeof value === 'string' && !/^#/.test(value))
			return size === 1 ? Number(value) || 0 : this.Numbers(Number(value) || 0, size);

		list = this.Numbers(typeof value === 'boolean' ? (value ? 1 : 0) : value, size);

		return size === 1 ? list[0] : list;
	},

	/* Each part of a and b by f: numbers, or lists of them (a number goes with each part). */
	Each: function (a, b, f) {
		var length;
		var list = [];
		var i;

		if (!Array.isArray(a) && !Array.isArray(b)) return f(Number(a) || 0, Number(b) || 0);

		length = Math.max(Array.isArray(a) ? a.length : 0, Array.isArray(b) ? b.length : 0);

		for (i = 0; i < length; i++)
			list.push(f(Number(Array.isArray(a) ? a[i] : a) || 0, Number(Array.isArray(b) ? b[i] : b) || 0));

		return list;
	},

	/* The value of an output in code: of a block already run (outputs), else computed of its own inputs. */
	Pull: function (plan, id, key, run, depth) {
		var node = plan.Nodes[id];
		var block = plan.Blocks[id];
		var made;

		if (run.Outputs[id] && Object.prototype.hasOwnProperty.call(run.Outputs[id], key)) return run.Outputs[id][key];

		if (!node || typeof node.Compute !== 'function') return undefined;

		if (depth > 512)
			throw new Error('Elemenx Blueprints: values too deep at block ' + id);

		if (block.enabled === false) made = this.Bypass(plan, id, run, depth);
		else made = node.Compute.call(this, this.Gather(plan, id, run, depth + 1), this.Properties(block), run) || {};

		if (run.Memo)
			run.Outputs[id] = made;

		return made[key];
	},

	Bypass: function (plan, id, run, depth) {
		var inputs = this.Gather(plan, id, run, depth + 1);
		var made = {};
		var first = Object.keys(plan.From[id])[0];

		(this.Outputs(plan.Nodes[id], plan.Blocks[id]) || []).forEach(function (output) {
			made[output.Key] = first ? inputs[first] : undefined;
		});

		return made;
	},

	Gather: function (plan, id, run, depth) {
		var node = plan.Nodes[id];
		var inputs = {};
		var self = this;

		(this.Inputs(node, plan.Blocks[id]) || []).forEach(function (input) {
			var from = plan.From[id][input.Key];

			if (from) inputs[input.Key] = self.Cast(self.Pull(plan, from.Block, from.Key, run, depth || 0), from.Type, input.Type);
			else inputs[input.Key] = input.Value === undefined ? undefined : self.Cast(input.Value, null, input.Type);
		});

		return inputs;
	},

	/* Blueprints: flows */

	Start: function (graph, context) {
		var made = this.Compile(graph);
		if (made.Type !== 'flow')
			throw new Error('Elemenx Blueprints: Start runs a flow, not a ' + made.Type + ' graph');

		return made.Start(context);
	},

	Flow: function (plan, context, defaults) {
		var self = this;
		var listeners = {};
		var stopped = false;
		var instance = {Variables: {}, Context: context || {}};

		instance.On = function (name, handler) {
			(listeners[name] = listeners[name] || []).push(handler);

			return function () {
				listeners[name] = (listeners[name] || []).filter(function (one) {
					return one !== handler;
				});
			};
		};

		instance.Tell = function (name, value) {
			(listeners[name] || []).slice().forEach(function (handler) {
				handler(value);
			});
		};

		instance.Stop = function () {
			stopped = true;
			listeners = {};
		};

		instance.Emit = function (name, payload, callback) {
			var pending = 0;
			var failed = false;
			var run = {Outputs: {}, Instance: instance, Context: instance.Context, Variables: instance.Variables, Parameters: instance.Context.Parameters || {}, Graph: {parameters: defaults || plan.Graph.parameters}, Memo: false};
			var starts = plan.Order.filter(function (id) {
				var block = plan.Blocks[id];

				return block.type === 'Event' && block.enabled !== false && String(self.Properties(block).Name) === String(name);
			});

			function done (error) {
				if (failed) return;

				if (error) {
					failed = true;

					if (callback) callback(error);
					else throw error;

					return;
				}

				pending--;

				if (!pending && callback)
					callback(null);
			}

			/* Goes on from a block by its flow keys: the first key runs first and to its end (a stack). */
			function drain (stack) {
				var steps = 0;
				var item;

				while (stack.length && !stopped && !failed) {
					item = stack.pop();
					steps++;

					if (steps > self.Steps) {
						done(new Error('Elemenx Blueprints: a flow ran more than ' + self.Steps + ' steps at once'));

						return;
					}

					if (item.Values)
						run.Outputs[item.From] = Object.assign(run.Outputs[item.From] || {}, item.Values);

					if (item.Go) {
						push(stack, item.Go);

						continue;
					}

					step(item.Block, stack);
				}
			}

			function push (stack, targets) {
				var i;

				for (i = targets.length - 1; i >= 0; i--)
					stack.push({Block: targets[i]});
			}

			/* The ways a block goes on by: a key, a list of them, or {Key, Values}. */
			function follow (id, keys, stack) {
				var list = keys == null ? [] : Array.isArray(keys) ? keys : [keys];
				var i;

				for (i = list.length - 1; i >= 0; i--) {
					var key = typeof list[i] === 'object' ? list[i].Key : list[i];
					var values = typeof list[i] === 'object' ? list[i].Values : null;

					stack.push({From: id, Values: values, Go: plan.Next[id][key] || []});
				}
			}

			function step (id, stack) {
				var block = plan.Blocks[id];
				var node = plan.Nodes[id];
				var later = false;
				var keys;
				var flow;

				if (!node || block.enabled === false) {
					flow = (node && node.Flow && node.Flow.Out || [])[0];

					follow(id, flow, stack);

					return;
				}

				pending++;

				try {
					keys = node.Run.call(self, {
						Inputs: self.Gather(plan, id, run),
						Properties: self.Properties(block),
						Block: block,
						Instance: instance,
						Context: instance.Context,
						Variables: instance.Variables,
						Payload: payload,
						Set: function (key, value) {
							(run.Outputs[id] = run.Outputs[id] || {})[key] = value;
						},
						Later: function () {
							later = true;

							return function (key) {
								var after = [];

								if (stopped || failed) return;

								follow(id, key, after);

								drain(after);

								done(null);
							};
						}
					});
				}
				catch (error) {
					done(error);

					return;
				}

				if (later) return;

				follow(id, keys, stack);

				pending--;
			}

			if (stopped) {
				if (callback)
					callback(null);

				return;
			}

			pending++;

			starts.forEach(function (id) {
				var stack = [];

				run.Outputs[id] = {Payload: payload};

				follow(id, 'Then', stack);

				drain(stack);
			});

			done(null);
		};

		return instance;
	},

	/* Blueprints: the library */

	Library: function () {
		var self = this;
		var numeric = ['generator', 'flow'];
		var code = ['generator', 'flow'];
		var noise = null;

		function noiseOf () {
			noise = noise || self.$Service('Math').Noise();

			return noise;
		}

		/* The kinds of graphs. */
		this.Graph('generator', {
			End: 'Result',
			Compile: function (plan) {
				return {
					Run: function (parameters, inputs) {
						var run = {Outputs: {}, Parameters: parameters || {}, Inputs: inputs || {}, Memo: true, Graph: {parameters: this && this.Parameters || plan.Graph.parameters}};
						var result = {};

						plan.Order.forEach(function (id) {
							var block = plan.Blocks[id];
							if (block.type !== 'Result' || block.enabled === false) return;

							result[self.Properties(block).Key || 'Value'] = self.Gather(plan, id, run).Value;
						});

						return result;
					}
				};
			}
		});

		this.Graph('flow', {
			Compile: function (plan) {
				return {
					Start: function (context) {
						return self.Flow(plan, context, this.Parameters);
					}
				};
			}
		});

		/* Values given. */
		this.Node('Number', {Graphs: numeric, Group: 'value', Properties: [{Key: 'Value', Type: 'number', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs, properties) {
				return {Value: Number(properties.Value) || 0};
			}
		});

		this.Node('Vector', {Graphs: numeric, Group: 'value', Properties: [{Key: 'X', Type: 'number', Value: 0}, {Key: 'Y', Type: 'number', Value: 0}, {Key: 'Z', Type: 'number', Value: 0}, {Key: 'W', Type: 'number', Value: 0}, {Key: 'Size', Type: 'select', Options: [2, 3, 4], Value: 3}],
			Outputs: function (properties) {
				return [{Key: 'Value', Type: 'vec' + (Number(properties.Size) || 3)}];
			},
			Compute: function (inputs, properties) {
				return {Value: [Number(properties.X) || 0, Number(properties.Y) || 0, Number(properties.Z) || 0, Number(properties.W) || 0].slice(0, Number(properties.Size) || 3)};
			}
		});

		this.Node('Color', {Graphs: numeric, Group: 'value', Properties: [{Key: 'Color', Type: 'color', Value: '#ffffff'}, {Key: 'Alpha', Type: 'number', Value: 1, Min: 0, Max: 1}], Outputs: [{Key: 'RGB', Type: 'vec3'}, {Key: 'RGBA', Type: 'vec4'}],
			Compute: function (inputs, properties) {
				var rgb = self.Numbers(properties.Color, 3);

				return {RGB: rgb, RGBA: rgb.concat([properties.Alpha == null ? 1 : Number(properties.Alpha)])};
			}
		});

		this.Node('Text', {Graphs: code, Group: 'value', Properties: [{Key: 'Value', Type: 'text', Value: ''}], Outputs: [{Key: 'Value', Type: 'text'}],
			Compute: function (inputs, properties) {
				return {Value: properties.Value == null ? '' : String(properties.Value)};
			}
		});

		this.Node('Bool', {Graphs: numeric, Group: 'value', Properties: [{Key: 'Value', Type: 'bool', Value: false}], Outputs: [{Key: 'Value', Type: 'bool'}],
			Compute: function (inputs, properties) {
				return {Value: properties.Value === true || properties.Value === 'true'};
			}
		});

		/* A parameter of the graph: a uniform in a shader, a value given in code. */
		this.Node('Parameter', {Graphs: '*', Group: 'value', Properties: [{Key: 'Key', Type: 'text', Value: ''}, {Key: 'Type', Type: 'select', Options: ['float', 'vec2', 'vec3', 'vec4', 'bool', 'int', 'text', 'any'], Value: 'float'}],
			Outputs: function (properties) {
				return [{Key: 'Value', Type: properties.Type || 'float'}];
			},
			Compute: function (inputs, properties, run) {
				var given = run.Parameters || run.Context && run.Context.Parameters || {};
				var parameter = (run.Graph || {parameters: []}).parameters.filter(function (one) {
					return one.key === properties.Key;
				})[0];

				return {Value: Object.prototype.hasOwnProperty.call(given, properties.Key) ? given[properties.Key] : parameter ? parameter.value : undefined};
			}
		});

		this.Node('Time', {Graphs: numeric, Group: 'input', Outputs: [{Key: 'Seconds', Type: 'float'}],
			Compute: function (inputs, properties, run) {
				var context = run.Context || run.Inputs || {};

				return {Seconds: Number(context.Time) || 0};
			}
		});

		/* What a generator is given: its inputs by name. */
		this.Node('Input', {Graphs: code, Group: 'input', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Outputs: [{Key: 'Value', Type: 'any'}],
			Compute: function (inputs, properties, run) {
				var given = run.Inputs || run.Context || {};

				return {Value: given[properties.Name]};
			}
		});

		/* Numbers: operators and functions on numbers and on the parts of lists. */
		[['Add', '+', function (a, b) {
			return a + b;
		}], ['Subtract', '-', function (a, b) {
			return a - b;
		}], ['Multiply', '*', function (a, b) {
			return a * b;
		}], ['Divide', '/', function (a, b) {
			return b ? a / b : 0;
		}]].forEach(function (one) {
			self.Node(one[0], {Graphs: numeric, Group: 'math', Inputs: [{Key: 'A', Type: 'same', Value: one[0] === 'Multiply' || one[0] === 'Divide' ? 1 : 0}, {Key: 'B', Type: 'same', Value: one[0] === 'Multiply' || one[0] === 'Divide' ? 1 : 0}], Outputs: [{Key: 'Out', Type: 'same'}],
				Compute: function (inputs) {
					return {Out: self.Each(inputs.A, inputs.B, one[2])};
				}
			});
		});

		[['Min', Math.min], ['Max', Math.max], ['Pow', Math.pow], ['Step', function (edge, x) {
			return x < edge ? 0 : 1;
		}]].forEach(function (one) {
			self.Node(one[0], {Graphs: numeric, Group: 'math', Inputs: [{Key: 'A', Type: 'same', Value: 0}, {Key: 'B', Type: 'same', Value: one[0] === 'Pow' ? 1 : 0}], Outputs: [{Key: 'Out', Type: 'same'}],
				Compute: function (inputs) {
					return {Out: self.Each(inputs.A, inputs.B, one[1])};
				}
			});
		});

		[['Sin', 'sin', Math.sin], ['Cos', 'cos', Math.cos], ['Abs', 'abs', Math.abs], ['Floor', 'floor', Math.floor], ['Fract', 'fract', function (x) {
			return x - Math.floor(x);
		}], ['Sqrt', 'sqrt', function (x) {
			return Math.sqrt(Math.max(0, x));
		}], ['Exp', 'exp', Math.exp], ['OneMinus', '1.0 - ', function (x) {
			return 1 - x;
		}], ['Saturate', 'saturate', function (x) {
			return Math.max(0, Math.min(1, x));
		}]].forEach(function (one) {
			self.Node(one[0], {Graphs: numeric, Group: 'math', Inputs: [{Key: 'X', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'same'}],
				Compute: function (inputs) {
					return {Out: self.Each(inputs.X, 0, one[2])};
				}
			});
		});

		this.Node('Mix', {Graphs: numeric, Group: 'math', Inputs: [{Key: 'A', Type: 'same', Value: 0}, {Key: 'B', Type: 'same', Value: 1}, {Key: 'T', Type: 'float', Value: 0.5}], Outputs: [{Key: 'Out', Type: 'same'}],
			Compute: function (inputs) {
				return {Out: self.Each(inputs.A, inputs.B, function (a, b) {
					return a + (b - a) * inputs.T;
				})};
			}
		});

		this.Node('Clamp', {Graphs: numeric, Group: 'math', Inputs: [{Key: 'X', Type: 'same', Value: 0}, {Key: 'Low', Type: 'float', Value: 0}, {Key: 'High', Type: 'float', Value: 1}], Outputs: [{Key: 'Out', Type: 'same'}],
			Compute: function (inputs) {
				return {Out: self.Each(inputs.X, 0, function (x) {
					return Math.max(inputs.Low, Math.min(inputs.High, x));
				})};
			}
		});

		this.Node('Smoothstep', {Graphs: numeric, Group: 'math', Inputs: [{Key: 'Low', Type: 'float', Value: 0}, {Key: 'High', Type: 'float', Value: 1}, {Key: 'X', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'same'}],
			Compute: function (inputs) {
				return {Out: self.Each(inputs.X, 0, function (x) {
					var t = Math.max(0, Math.min(1, (x - inputs.Low) / ((inputs.High - inputs.Low) || 1)));

					return t * t * (3 - 2 * t);
				})};
			}
		});

		this.Node('Remap', {Graphs: numeric, Group: 'math', Inputs: [{Key: 'X', Type: 'same', Value: 0}, {Key: 'FromLow', Type: 'float', Value: 0}, {Key: 'FromHigh', Type: 'float', Value: 1}, {Key: 'ToLow', Type: 'float', Value: 0}, {Key: 'ToHigh', Type: 'float', Value: 1}], Outputs: [{Key: 'Out', Type: 'same'}],
			Compute: function (inputs) {
				return {Out: self.Each(inputs.X, 0, function (x) {
					return inputs.ToLow + (x - inputs.FromLow) / ((inputs.FromHigh - inputs.FromLow) || 1) * (inputs.ToHigh - inputs.ToLow);
				})};
			}
		});

		this.Node('Dot', {Graphs: numeric, Group: 'vector', Inputs: [{Key: 'A', Type: 'same', Value: 0}, {Key: 'B', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'float'}],
			Compute: function (inputs) {
				var parts = self.Each(inputs.A, inputs.B, function (a, b) {
					return a * b;
				});

				return {Out: Array.isArray(parts) ? parts.reduce(function (sum, part) {
					return sum + part;
				}, 0) : parts};
			}
		});

		this.Node('Length', {Graphs: numeric, Group: 'vector', Inputs: [{Key: 'X', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'float'}],
			Compute: function (inputs) {
				var list = Array.isArray(inputs.X) ? inputs.X : [inputs.X];

				return {Out: Math.sqrt(list.reduce(function (sum, part) {
					return sum + part * part;
				}, 0))};
			}
		});

		this.Node('Normalize', {Graphs: numeric, Group: 'vector', Inputs: [{Key: 'X', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'same'}],
			Compute: function (inputs) {
				var list = Array.isArray(inputs.X) ? inputs.X : [inputs.X];
				var length = Math.sqrt(list.reduce(function (sum, part) {
					return sum + part * part;
				}, 0)) || 1;

				return {Out: Array.isArray(inputs.X) ? list.map(function (part) {
					return part / length;
				}) : inputs.X / length};
			}
		});

		this.Node('Split', {Graphs: numeric, Group: 'vector', Inputs: [{Key: 'Vector', Type: 'vec4', Value: 0}], Outputs: [{Key: 'X', Type: 'float'}, {Key: 'Y', Type: 'float'}, {Key: 'Z', Type: 'float'}, {Key: 'W', Type: 'float'}],
			Compute: function (inputs) {
				var v = inputs.Vector || [0, 0, 0, 0];

				return {X: v[0], Y: v[1], Z: v[2], W: v[3]};
			}
		});

		this.Node('Combine', {Graphs: numeric, Group: 'vector', Inputs: [{Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}, {Key: 'W', Type: 'float', Value: 1}], Outputs: [{Key: 'XYZW', Type: 'vec4'}, {Key: 'XYZ', Type: 'vec3'}, {Key: 'XY', Type: 'vec2'}],
			Compute: function (inputs) {
				return {XYZW: [inputs.X, inputs.Y, inputs.Z, inputs.W], XYZ: [inputs.X, inputs.Y, inputs.Z], XY: [inputs.X, inputs.Y]};
			}
		});

		/* The noise of Math. */
		this.Node('Noise', {Graphs: numeric, Group: 'noise', Inputs: [{Key: 'Position', Type: 'vec3', Value: 0}, {Key: 'Scale', Type: 'float', Value: 1}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs) {
				var p = inputs.Position;

				return {Value: noiseOf().Value(p[0] * inputs.Scale, p[1] * inputs.Scale, p[2] * inputs.Scale)};
			}
		});

		this.Node('Fbm', {Graphs: numeric, Group: 'noise', Properties: [{Key: 'Octaves', Type: 'number', Value: 4, Min: 1, Max: 8}], Inputs: [{Key: 'Position', Type: 'vec3', Value: 0}, {Key: 'Scale', Type: 'float', Value: 1}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs, properties) {
				var p = inputs.Position;

				return {Value: noiseOf().Fbm(p[0] * inputs.Scale, p[1] * inputs.Scale, p[2] * inputs.Scale, Math.max(1, Math.round(Number(properties.Octaves) || 4)))};
			}
		});

		/* The ends of graphs. */
		this.Node('Result', {Graphs: ['generator'], Group: 'output', Properties: [{Key: 'Key', Type: 'text', Value: 'Value'}], Inputs: [{Key: 'Value', Type: 'any'}], Outputs: []});

		/* Logic: values of code. */
		this.Node('Compare', {Graphs: code, Group: 'logic', Properties: [{Key: 'Operator', Type: 'select', Options: ['==', '!=', '<', '<=', '>', '>='], Value: '=='}], Inputs: [{Key: 'A', Type: 'any'}, {Key: 'B', Type: 'any'}], Outputs: [{Key: 'Out', Type: 'bool'}],
			Compute: function (inputs, properties) {
				var a = inputs.A;
				var b = inputs.B;
				var operator = properties.Operator || '==';
				if (operator === '!=')
					return {Out: a !== b};

				if (operator === '<') return {Out: a < b};
				if (operator === '<=') return {Out: a <= b};
				if (operator === '>') return {Out: a > b};
				if (operator === '>=') return {Out: a >= b};

				return {Out: a === b};
			}
		});

		this.Node('And', {Graphs: code, Group: 'logic', Inputs: [{Key: 'A', Type: 'bool', Value: false}, {Key: 'B', Type: 'bool', Value: false}], Outputs: [{Key: 'Out', Type: 'bool'}],
			Compute: function (inputs) {
				return {Out: !!(inputs.A && inputs.B)};
			}
		});

		this.Node('Or', {Graphs: code, Group: 'logic', Inputs: [{Key: 'A', Type: 'bool', Value: false}, {Key: 'B', Type: 'bool', Value: false}], Outputs: [{Key: 'Out', Type: 'bool'}],
			Compute: function (inputs) {
				return {Out: !!(inputs.A || inputs.B)};
			}
		});

		this.Node('Not', {Graphs: code, Group: 'logic', Inputs: [{Key: 'X', Type: 'bool', Value: false}], Outputs: [{Key: 'Out', Type: 'bool'}],
			Compute: function (inputs) {
				return {Out: !inputs.X};
			}
		});

		/* A field of an object by its path: a.b.0 */
		this.Node('Field', {Graphs: code, Group: 'logic', Properties: [{Key: 'Path', Type: 'text', Value: ''}], Inputs: [{Key: 'Object', Type: 'any'}], Outputs: [{Key: 'Value', Type: 'any'}],
			Compute: function (inputs, properties) {
				var value = inputs.Object;

				String(properties.Path || '').split('.').filter(Boolean).forEach(function (part) {
					value = value == null ? undefined : value[part];
				});

				return {Value: value};
			}
		});

		this.Node('Get', {Graphs: ['flow'], Group: 'variable', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Outputs: [{Key: 'Value', Type: 'any'}],
			Compute: function (inputs, properties, run) {
				return {Value: run.Variables[properties.Name]};
			}
		});

		/* The flow: events and what follows them. */
		this.Node('Event', {Graphs: ['flow'], Group: 'flow', Properties: [{Key: 'Name', Type: 'text', Value: 'Start'}], Flow: {Out: ['Then']}, Outputs: [{Key: 'Payload', Type: 'any'}]});

		this.Node('Set', {Graphs: ['flow'], Group: 'variable', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Flow: {In: ['In'], Out: ['Then']}, Inputs: [{Key: 'Value', Type: 'any'}], Outputs: [{Key: 'Value', Type: 'any'}],
			Run: function (context) {
				context.Variables[context.Properties.Name] = context.Inputs.Value;

				context.Set('Value', context.Inputs.Value);

				return 'Then';
			}
		});

		this.Node('Branch', {Graphs: ['flow'], Group: 'flow', Flow: {In: ['In'], Out: ['True', 'False']}, Inputs: [{Key: 'Condition', Type: 'bool', Value: false}],
			Run: function (context) {
				return context.Inputs.Condition ? 'True' : 'False';
			}
		});

		this.Node('Sequence', {Graphs: ['flow'], Group: 'flow', Flow: {In: ['In'], Out: ['First', 'Second', 'Third']},
			Run: function () {
				return ['First', 'Second', 'Third'];
			}
		});

		this.Node('For', {Graphs: ['flow'], Group: 'flow', Flow: {In: ['In'], Out: ['Body', 'Done']}, Inputs: [{Key: 'From', Type: 'int', Value: 0}, {Key: 'To', Type: 'int', Value: 0}], Outputs: [{Key: 'Index', Type: 'int'}],
			Run: function (context) {
				var ways = [];
				var i;

				for (i = context.Inputs.From; i < context.Inputs.To; i++)
					ways.push({Key: 'Body', Values: {Index: i}});

				ways.push('Done');

				return ways;
			}
		});

		this.Node('Delay', {Graphs: ['flow'], Group: 'flow', Flow: {In: ['In'], Out: ['Then']}, Inputs: [{Key: 'Seconds', Type: 'float', Value: 1}],
			Run: function (context) {
				var next = context.Later();
				var timer = context.Context.Timer || function (seconds, run) {
					setTimeout(run, seconds * 1000);
				};

				timer(context.Inputs.Seconds, function () {
					next('Then');
				});
			}
		});

		/* An action of the context, by its name: Actions[Name](value, done (error, result)). */
		this.Node('Action', {Graphs: ['flow'], Group: 'flow', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Flow: {In: ['In'], Out: ['Then', 'Failed']}, Inputs: [{Key: 'Value', Type: 'any'}], Outputs: [{Key: 'Result', Type: 'any'}, {Key: 'Error', Type: 'any'}],
			Run: function (context) {
				var action = (context.Context.Actions || {})[context.Properties.Name];
				var next;
				var sync = true;
				var finished = null;

				if (typeof action !== 'function')
					throw new Error('Elemenx Blueprints: no action ' + context.Properties.Name);

				next = context.Later();

				action(context.Inputs.Value, function (error, result) {
					context.Set(error ? 'Error' : 'Result', error || result);

					if (sync) finished = error ? 'Failed' : 'Then';
					else next(error ? 'Failed' : 'Then');
				});

				sync = false;

				if (finished)
					next(finished);
			}
		});

		this.Node('Emit', {Graphs: ['flow'], Group: 'flow', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Flow: {In: ['In'], Out: ['Then']}, Inputs: [{Key: 'Value', Type: 'any'}],
			Run: function (context) {
				context.Instance.Tell(context.Properties.Name, context.Inputs.Value);

				return 'Then';
			}
		});
	}
});
