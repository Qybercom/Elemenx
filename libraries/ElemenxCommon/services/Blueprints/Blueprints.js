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
 *   each Result by its Key), flow (events and actions, run by Start) and behaviour (a tree of an agent, run by Agent). The kinds of shaders are of the Service
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
 *   pins a type has are added where they are missing); Write(graph) gives it as the text of a file. Fill(graph,
 *   values) sets the values of its parameters by key and puts each value in the place of its {Key} in the texts of the
 *   properties of its blocks (a graph of a resource made for the options it is asked with); it returns the graph, what it
 *   was filled with kept (filled): the graphs it calls are filled with it too. Inlined(graph): the graph with the graphs
 *   its Call blocks call in their places (a generator of numbers, Numeric, is one function of no calls).
 * - A generator graph of the resources (group Blueprints) is a function: its Input blocks what it is given, its Result
 *   blocks what it gives. Call runs one (its pins those of the graph), Repeat runs it Count times ({Index, Count}), Map
 *   for each item of a list ({Item, Index}), Reduce for each ({Item, Index, Sum}, from Initial, its result Sum); what
 *   else the graph takes they pass on as given; Take keeps one result of each. A graph may call itself, as deep as 256
 *   calls (a Repeat of Count 0 ends it). List, Count and Item make and read lists, Random(Seed, Key) a number of 0 to 1
 *   of them (Hash2), Chain(Seed, Index) the index-th number of a chain of a seed (Chain), Select one of two, Table the row of a key (Rows, Default). Invoke(name, inputs) runs one.
 * - IR(graph, {Name}) gives the graph in the IR of Elemenx.Compilers ({Module, Diagnostics}: a block of no IR, as noise yet,
 *   is told), each graph a function (P, I) of a record of its results; the kind blueprint goes to ir by it (blueprint-ir),
 *   and on to js or cpp. A block of a Service tells its own: IR(inputs, properties, context) of its definition (context
 *   Helper(name, define): a function of the IR the module gets once), and the end of a kind other than Result its IREnd.
 * - Numeric(graph, values, types, keys) gives a generator of numbers as one typed function of the IR (g_main), its parameters
 *   fixed (values, the graph's own else), its inputs its parameters (float, or of types {name: type}), its results its
 *   result (one, or two to four numbers as a vector; keys: only those), its noise of the Kernel of Noise: {Module, Inputs, Keys, Returns,
 *   Diagnostics}, a block of no numbers told. Lists of numbers in it (floats: a Parameter of Type floats, an input of that
 *   type): Item (its index within it), Count, Nearest; a Reduce of such a list of a known length (a Parameter of 64 items at
 *   most) unrolled, its graph once for each item (Inlined); an Item and a Count of a list known are numbers themselves, so
 *   wasm, which holds no list of its own, runs it. NumericCode(graph, values, types) makes it js as Code does ({Source, Run,
 *   Keys, Numeric}, made once; null when it is not of numbers), Wasm(numeric) wasm of it (batch:g_main).
 * - Check(graph) lists what is wrong ([{Block, Pin, Link, Message}]): a type not known or not for this graph, a link
 *   of pins not there or of kinds that do not go together, two links to one input, a circle of values, a graph with
 *   no end. Order(graph) gives the blocks so each one comes after what it reads.
 * - Compile(graph, options) makes it (an error, with its list in Problems, when Check finds anything): the same graph
 *   is made once (Hash: what makes it, not where its blocks are). Of a pass {Type, Hash, Fragment, Uniforms
 *   [{Name, Type}], Textures [{Name, Uniform}], Parameters, Values(parameters, extra)}: Values gives the uniforms of
 *   the parameters (by key, else their value) and of extra (Time, Pixel, Textures by name). Of a material the same
 *   with Source (the function blueprintSurface) in place of Fragment. Of a render {Passes, Run(context, parameters)}; of a behaviour {Agent(context)};
 *   of a generator {Run(parameters, inputs)}; of a flow {Start(context)}. Code(graph) makes a generator JavaScript: {Source
 *   (the body of a function of (B, M, N): Blueprints, Math, Noise), Run (the same values as the Run of Compile, with no
 *   walk of its blocks: a ground reads it at every point), Keys}, null when a block of it has no code; a worker makes
 *   Run of Source with its own Services. A graph written by hand, {type, glsl (its
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
 * Remap, Curve (a value of keys over a number, time most often: its Keys [[x, value]...], Smooth linear, smooth or step,
 * Loop a length after which it begins again; CurveAt(keys, x, smooth, loop) the same in code), Dot, Length, Normalize,
 * Split, Combine, Noise, Fbm, Ridge, NoiseSpec (a noise of the Noise Service by its spec: Warp, WarpScale, WarpOctaves;
 *   Jitter of its cells; its inputs Octaves and Seed, a number as Math.SeedOffset gives it, when linked, instead of its
 *   properties), When (its Value when Test holds, else Else: what only its
 *   Value needs is made only then), Line, Area, Level, Grid, TunnelWall, PassageWalls, Fall, Nearest, Painted, Strokes, River and Edits (of
 * the Geometry Service: of a line, an area or points given as a list of numbers, floats), Result, Compare, And, Or, Not, Field, Get, Set, Event,
 * Branch, Sequence, For, Delay, Action, Emit, Response (a curve of 0 to 1: linear, power, logistic, step), and of a tree of
 * behaviour Root, Selector, Steps, Parallel, Utility, Condition, Invert, Cooldown, Limit, Loop, Wait, Remember and Task; BlueprintShaders adds UV, Pixel, Position, Normal, Texture, Output,
 * Surface and Present, and the GLSL of the numbers.
 * Errors start with 'Elemenx Blueprints:'. The same functions run in Node: they read no page.
 */
Elemenx.Service('Blueprints', {
	$Meta: {
		Description: 'Graphs of blocks in the JSON of Flowprint, made into code and flows of actions (and into shaders by BlueprintShaders).',
		Methods: ['Node(type, definition)', 'Nodes(graph)', 'NodeOf(type)', 'Graph(type, definition)', 'Graphs()', 'Create(type, options)', 'Block(type, options)', 'Add(graph, type, options)', 'Link(graph, from, to)', 'Remove(graph, id)', 'Pin(block, key, out)', 'Read(json)', 'Write(graph)', 'Fill(graph, values)', 'Inlined(graph)', 'Check(graph)', 'Order(graph)', 'Compile(graph, options)', 'Code(graph)', 'Source(names)', 'Bake(graph)', 'Start(graph, context)', 'Agent(graph, context)', 'IR(graph, options)', 'Invoke(name, inputs)', 'Hash2(a, b)', 'Chain(seed, index)', 'CurveAt(keys, x, smooth, loop)', 'Numeric(graph, values, types, keys)', 'NumericCode(graph, values, types, keys)', 'Wasm(numeric)']
	},

	Version: 1,
	Steps: 100000,

	/* How many numbers each type of GLSL holds. */
	Sizes: {float: 1, vec2: 2, vec3: 3, vec4: 4, int: 1, bool: 1},

	/* What a worker carries of it (Workers.Source): its numbers and its casts, to run a generator made JavaScript (Code). */
	/* What a worker carries of this Service besides its methods: its constants. */
	Carried: ['Version', 'Steps', 'Sizes'],

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	$OnCreate: function () {
		this.Types = {};
		this.Makers = {};
		this.Made = {};
		this.Counter = 0;

		this.Library();

		/* A graph of blocks is a kind of code of Elemenx.Compilers: blueprint into the IR, by IR(graph) (its Value or its JSON). */
		if (typeof Elemenx !== 'undefined' && Elemenx.Compilers && Elemenx.Compilers.Names().indexOf('blueprint-ir') === -1) {
			var self = this;

			Elemenx.Compilers.Define('blueprint-ir', {From: 'blueprint', To: 'ir', Compile: function (job, done) {
				var made = self.IR(job.Value || JSON.parse(job.Files[0].Text), job.Options);

				done(null, {Value: made.Module, Diagnostics: made.Diagnostics, Entry: made.Module.Entry});
			}});
		}
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

	/*
	 * The properties of a block: those it has, the others of its type as they are by default. Regression: a block of a file
	 * that named none of them read each as nothing, its numbers 0 in a shader (a planet burned white).
	 */
	Properties: function (block) {
		var properties = {};
		var node = this.Types[block.type];

		(block.properties || []).forEach(function (property) {
			properties[property.key] = property.value;
		});

		if (node && Array.isArray(node.Properties))
			node.Properties.forEach(function (property) {
				if (property && property.Key && !Object.prototype.hasOwnProperty.call(properties, property.Key) && property.Value !== undefined)
					properties[property.Key] = property.Value;
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

	Fill: function (graph, values) {
		var given = values || {};
		var filled = Object.assign({}, graph.filled || {});

		function own (key) {
			return Object.prototype.hasOwnProperty.call(given, key) && given[key] !== undefined && given[key] !== null;
		}

		/*
		 * What it was filled with kept (filled): the graphs it calls (Call, Repeat, Map, Reduce) are filled with it too, of the
		 * same seed and values of their parameters of the same names. Regression: a graph called read its {Seed} as it is.
		 */
		Object.keys(given).forEach(function (key) {
			if (own(key))
				filled[key] = given[key];
		});

		if (Object.keys(filled).length)
			graph.filled = filled;

		(graph.parameters || []).forEach(function (parameter) {
			if (own(parameter.key))
				parameter.value = given[parameter.key];
		});

		graph.blocks.forEach(function (block) {
			(block.properties || []).forEach(function (property) {
				if (typeof property.value !== 'string') return;

				property.value = property.value.replace(/\{(\w+)\}/g, function (whole, key) {
					return own(key) ? String(given[key]) : whole;
				});
			});
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
		var parts = [graph.type, graph.parameters.map(function (parameter) {
			return [parameter.key, parameter.type];
		}), graph.blocks.map(function (block) {
			return [block.id, block.type, block.properties, block.enabled !== false, (block.pins || []).map(function (pin) {
				return [pin.id, pin.key, pin.kind, pin.type];
			})];
		}), graph.links.map(function (link) {
			return [link.p1, link.p2, link.enabled !== false];
		})];
		var text;

		/* What it was filled with, its called graphs filled of it (Fill): of none, the hash it always had. */
		if (graph.filled && Object.keys(graph.filled).length)
			parts.push(graph.filled);

		text = JSON.stringify(parts);

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

		/* A generator with the graphs it calls in their places (Inlined), filled as it is: run as its Code is. */
		if (graph.type === 'generator')
			graph = this.Inlined(graph);

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
	/*
	 * The value of a curve of keys ([[x, value]...], or their text as JSON) at x: between the keys round it straight
	 * (linear), on a curve of Catmull-Rom through them (smooth, by default) or held till the next (step); with Loop above
	 * 0, x taken round that length (the keys of 0 to Loop, the last going on into the first), else held at the ends.
	 */
	CurveAt: function (given, x, smooth, loop) {
		var keys = typeof given === 'string' ? JSON.parse(given || '[]') : given || [];
		var count;
		var at;
		var i;
		var a;
		var b;
		var before;
		var after;
		var span;
		var t;

		keys = keys.filter(function (key) {
			return Array.isArray(key) && key.length > 1;
		}).map(function (key) {
			return [Number(key[0]) || 0, Number(key[1]) || 0];
		}).sort(function (one, other) {
			return one[0] - other[0];
		});
		count = keys.length;

		if (!count) return 0;

		if (count === 1)
			return keys[0][1];

		at = loop > 0 ? (x % loop + loop) % loop : x;

		if (!(loop > 0) && at <= keys[0][0]) return keys[0][1];

		if (!(loop > 0) && at >= keys[count - 1][0]) return keys[count - 1][1];

		/* The key before x (round the loop: the last, before the first one). */
		i = count - 1;

		while (i >= 0 && keys[i][0] > at)
			i--;

		a = i < 0 ? [keys[count - 1][0] - loop, keys[count - 1][1]] : keys[i];
		b = i + 1 < count ? keys[i + 1] : [keys[0][0] + loop, keys[0][1]];
		span = b[0] - a[0];
		t = span > 0 ? (at - a[0]) / span : 0;

		if (smooth === 'step') return a[1];

		if (smooth === 'linear')
			return a[1] + (b[1] - a[1]) * t;

		before = i - 1 >= 0 ? keys[i - 1][1] : loop > 0 ? keys[(i - 1 + count * 2) % count][1] : a[1];
		after = i + 2 < count ? keys[i + 2][1] : loop > 0 ? keys[(i + 2) % count][1] : b[1];

		return 0.5 * (2 * a[1] + (b[1] - before) * t + (2 * before - 5 * a[1] + 4 * b[1] - after) * t * t + (3 * a[1] - before - 3 * b[1] + after) * t * t * t);
	},

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
		var passed = this.Passed(plan, id);
		var made = {};

		Object.keys(passed).forEach(function (key) {
			made[key] = passed[key] ? inputs[passed[key]] : undefined;
		});

		return made;
	},

	/*
	 * What a block turned off passes on: to each output the input of its name, else the first input of its type that is
	 * linked; an output of a type some input has, none of them linked, nothing; else the first input linked. Regression:
	 * each output took the first input, and a step of roads turned off gave its land as its things.
	 */
	Passed: function (plan, id) {
		var node = plan.Nodes[id];
		var block = plan.Blocks[id];
		var linked = Object.keys(plan.From[id] || {});
		var declared = this.Inputs(node, block) || [];
		var made = {};

		(this.Outputs(node, block) || []).forEach(function (output) {
			var typed = declared.filter(function (input) {
				return input.Type === output.Type;
			}).map(function (input) {
				return input.Key;
			});
			var same = linked.indexOf(output.Key) !== -1 ? output.Key : linked.filter(function (key) {
				return typed.indexOf(key) !== -1;
			})[0];

			made[output.Key] = same || (typed.length ? null : linked[0] || null);
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

	/* Blueprints: generators as JavaScript */

	/*
	 * A generator graph as JavaScript: the same values as its Run, with no walk of its blocks at each call, so a ground
	 * reads it at every point of its heights. {Source (the body of a function of (B, M, N): Blueprints, Math and Noise,
	 * giving a function (parameters, inputs) of its results), Run (that function, made here), Keys (of its results)}; null
	 * when a block of it has no code (an action, a field of an object): such a graph runs by Run of Compile alone.
	 */
	Code: function (graph) {
		var self = this;
		var plan;
		var needed = {};
		var names = {};
		var prelude = [];
		var lines = [];
		var results = [];
		var keys = [];
		var made;
		var failed = false;
		var defaults = {};
		var problems;
		var error;
		var source;
		var run;
		var hash;

		/* The graphs it calls in their places (Inlined), filled as it is. */
		graph = this.Read(graph);

		if (graph.type !== 'generator')
			throw new Error('Elemenx Blueprints: Code makes a generator, not a ' + graph.type + ' graph');

		graph = this.Inlined(graph);

		problems = this.Check(graph);

		if (problems.length) {
			error = new Error('Elemenx Blueprints: ' + problems[0].Message);
			error.Problems = problems;

			throw error;
		}

		(graph.parameters || []).forEach(function (parameter) {
			defaults[parameter.key] = parameter.value;
		});

		/* Made once for the same blocks and the same values of its parameters. */
		hash = this.Hash(graph) + JSON.stringify(defaults);
		this.CodeMade = this.CodeMade || {};

		if (this.CodeMade[hash] !== undefined) return this.CodeMade[hash];

		plan = this.Plan(graph);

		/* What the results read, through their links back. */
		function need (id) {
			if (needed[id]) return;

			needed[id] = true;

			Object.keys(plan.From[id]).forEach(function (key) {
				need(plan.From[id][key].Block);
			});
		}

		plan.Order.forEach(function (id) {
			if (plan.Blocks[id].type === 'Result' && plan.Blocks[id].enabled !== false)
				need(id);
		});

		plan.Order.forEach(function (id, index) {
			var block = plan.Blocks[id];
			var node = plan.Nodes[id];
			var properties = self.Properties(block);
			var inputs = {};
			var outputs;
			var code;
			var passed;

			if (!needed[id] || failed) return;

			names[id] = {};

			(self.Inputs(node, block) || []).forEach(function (input) {
				var from = plan.From[id][input.Key];

				if (from) inputs[input.Key] = 'C(' + names[from.Block][from.Key] + ', ' + JSON.stringify(from.Type || null) + ', ' + JSON.stringify(input.Type || null) + ')';
				else inputs[input.Key] = input.Value === undefined ? 'undefined' : JSON.stringify(self.Cast(input.Value, null, input.Type));
			});

			outputs = self.Outputs(node, block) || [];

			if (block.type === 'Result') {
				if (block.enabled !== false) {
					results.push(JSON.stringify(properties.Key || 'Value') + ': ' + inputs.Value);
					keys.push(properties.Key || 'Value');
				}

				return;
			}

			/* A block turned off gives what comes to its inputs (Passed). */
			if (block.enabled === false) {
				passed = self.Passed(plan, id);
				code = {};

				outputs.forEach(function (output) {
					code[output.Key] = passed[output.Key] ? inputs[passed[output.Key]] : 'undefined';
				});
			}
			/* A block of no input and no outside (a number, a vector, a color) is its value. */
			else if (!(self.Inputs(node, block) || []).length && ['Parameter', 'Time', 'Input'].indexOf(block.type) === -1 && typeof node.Compute === 'function') {
				made = node.Compute.call(self, {}, properties, {Graph: graph, Parameters: {}, Inputs: {}}) || {};
				code = {};

				outputs.forEach(function (output) {
					code[output.Key] = JSON.stringify(made[output.Key] === undefined ? null : made[output.Key]);
				});
			}
			else {
				code = self.CodeOf(block.type, {Inputs: inputs, Properties: properties, Index: index, Defaults: defaults, Prelude: function (line) {
					prelude.push(line);
				}});
			}

			if (!code) {
				failed = true;

				return;
			}

			outputs.forEach(function (output) {
				var name = 'v' + index + '_' + String(output.Key).replace(/[^A-Za-z0-9_]/g, '_');

				names[id][output.Key] = name;

				lines.push('\t\tvar ' + name + ' = ' + (code[output.Key] === undefined ? 'undefined' : code[output.Key]) + ';');
			});
		});

		if (failed) {
			this.CodeMade[hash] = null;

			return null;
		}

		source = [
			'var C = function (value, from, to) { return B.Cast(value, from, to); };',
			'var E = function (a, b, f) { return B.Each(a, b, f); };',
			'var D = ' + JSON.stringify(defaults) + ';',
			'var own = Object.prototype.hasOwnProperty;'
		].concat(prelude).concat([
			'return function (P, I) {',
			'\t\tP = P || {};',
			'\t\tI = I || {};'
		]).concat(lines).concat([
			'\t\treturn {' + results.join(', ') + '};',
			'};'
		]).join('\n');

		/* The source is made of the blocks of the graph alone, its texts written as JSON. */
		run = new Function('B', 'M', 'N', source)(this, this.$Service ? this.$Service('Math') : null, this.$Service ? this.$Service('Noise') : null);

		this.CodeMade[hash] = {Source: source, Run: run, Keys: keys};

		return this.CodeMade[hash];
	},

	/* The code of a block of numbers: {Output: an expression of its inputs (expressions too)}; null for one with none. */
	CodeOf: function (type, context) {
		var inputs = context.Inputs;
		var properties = context.Properties;
		var index = context.Index;
		var binary = {Add: 'function (a, b) { return a + b; }', Subtract: 'function (a, b) { return a - b; }', Multiply: 'function (a, b) { return a * b; }', Divide: 'function (a, b) { return b ? a / b : 0; }', Min: 'Math.min', Max: 'Math.max', Pow: 'B.Math().pow', Step: 'function (edge, x) { return x < edge ? 0 : 1; }'};
		var unary = {Sin: 'B.Math().sin', Cos: 'B.Math().cos', Abs: 'Math.abs', Floor: 'Math.floor', Exp: 'B.Math().exp', Fract: 'function (x) { return x - Math.floor(x); }', Sqrt: 'function (x) { return Math.sqrt(Math.max(0, x)); }', OneMinus: 'function (x) { return 1 - x; }', Saturate: 'function (x) { return Math.max(0, Math.min(1, x)); }'};
		var key;
		var spec;

		if (binary[type]) {
			context.Prelude('var f' + index + ' = ' + binary[type] + ';');

			return {Out: 'E(' + inputs.A + ', ' + inputs.B + ', f' + index + ')'};
		}

		if (unary[type]) {
			context.Prelude('var f' + index + ' = ' + unary[type] + ';');

			return {Out: 'E(' + inputs.X + ', 0, f' + index + ')'};
		}

		switch (type) {
			case 'Parameter':
				key = JSON.stringify(properties.Key);

				return {Value: '(own.call(P, ' + key + ') ? P[' + key + '] : D[' + key + '])'};
			case 'Time':
				return {Seconds: '(Number(I.Time) || 0)'};
			case 'Input':
				return {Value: 'I[' + JSON.stringify(properties.Name) + ']'};
			case 'Mix':
				return {Out: '(function (t) { return E(' + inputs.A + ', ' + inputs.B + ', function (a, b) { return a + (b - a) * t; }); })(' + inputs.T + ')'};
			case 'Clamp':
				return {Out: '(function (low, high) { return E(' + inputs.X + ', 0, function (x) { return Math.max(low, Math.min(high, x)); }); })(' + inputs.Low + ', ' + inputs.High + ')'};
			case 'Smoothstep':
				return {Out: '(function (low, high) { return E(' + inputs.X + ', 0, function (x) { var t = Math.max(0, Math.min(1, (x - low) / ((high - low) || 1))); return t * t * (3 - 2 * t); }); })(' + inputs.Low + ', ' + inputs.High + ')'};
			case 'Remap':
				return {Out: '(function (a, b, c, d) { return E(' + inputs.X + ', 0, function (x) { return c + (x - a) / ((b - a) || 1) * (d - c); }); })(' + inputs.FromLow + ', ' + inputs.FromHigh + ', ' + inputs.ToLow + ', ' + inputs.ToHigh + ')'};
			case 'Dot':
				return {Out: '(function (parts) { return Array.isArray(parts) ? parts.reduce(function (sum, part) { return sum + part; }, 0) : parts; })(E(' + inputs.A + ', ' + inputs.B + ', function (a, b) { return a * b; }))'};
			case 'Length':
				return {Out: '(function (x) { var list = Array.isArray(x) ? x : [x]; return Math.sqrt(list.reduce(function (sum, part) { return sum + part * part; }, 0)); })(' + inputs.X + ')'};
			case 'Normalize':
				return {Out: '(function (x) { var list = Array.isArray(x) ? x : [x]; var length = Math.sqrt(list.reduce(function (sum, part) { return sum + part * part; }, 0)) || 1; return Array.isArray(x) ? list.map(function (part) { return part / length; }) : x / length; })(' + inputs.X + ')'};
			case 'Split':
				context.Prelude('var s' + index + ' = null;');

				return {X: '(s' + index + ' = ' + inputs.Vector + ' || [0, 0, 0, 0])[0]', Y: 's' + index + '[1]', Z: 's' + index + '[2]', W: 's' + index + '[3]'};
			case 'Combine':
				return {XYZW: '[' + inputs.X + ', ' + inputs.Y + ', ' + inputs.Z + ', ' + inputs.W + ']', XYZ: '[' + inputs.X + ', ' + inputs.Y + ', ' + inputs.Z + ']', XY: '[' + inputs.X + ', ' + inputs.Y + ']'};
			case 'Noise':
				context.Prelude('var noise = noise || M.Noise();');

				return {Value: '(function (p, s) { return noise.Value(p[0] * s, p[1] * s, p[2] * s); })(' + inputs.Position + ', ' + inputs.Scale + ')'};
			case 'Fbm':
				context.Prelude('var noise = noise || M.Noise();');

				return {Value: '(function (p, s) { return noise.Fbm(p[0] * s, p[1] * s, p[2] * s, ' + Math.max(1, Math.round(Number(properties.Octaves) || 4)) + '); })(' + inputs.Position + ', ' + inputs.Scale + ')'};
			case 'NoiseSpec':
				spec = this.NoiseOf(properties);

				context.Prelude('var s' + index + ' = ' + JSON.stringify(spec) + ', n' + index + ' = {};');

				/* Of its octaves (Octaves) when they are given, a noise made once for each number of them. */
				return {Value: '(function (p, s, o, d) { var k = Math.round(Number(o)) || 0; var spec = k ? Object.assign({}, s' + index + ', {Octaves: k}) : s' + index + '; if (Number(d)) return N.Read(Object.assign(N.Whole(spec), {Seed: Number(d)}), p[0] * s, p[1] * s, p[2] * s); return (n' + index + '[k] || (n' + index + '[k] = N.Make(spec))).At(p[0] * s, p[1] * s, p[2] * s); })(' + inputs.Position + ', ' + inputs.Scale + ', ' + (inputs.Octaves || 0) + ', ' + (inputs.Seed || 0) + ')'};
			case 'Formula':
				return {Value: this.FormulaCode(this.Formula(properties.Expression).Tree, inputs)};
			case 'Compare':
				key = {'!=': '!==', '<': '<', '<=': '<=', '>': '>', '>=': '>='}[properties.Operator] || '===';

				return {Out: '(' + inputs.A + ' ' + key + ' ' + inputs.B + ')'};
			case 'And':
				return {Out: '!!(' + inputs.A + ' && ' + inputs.B + ')'};
			case 'Or':
				return {Out: '!!(' + inputs.A + ' || ' + inputs.B + ')'};
			case 'Not':
				return {Out: '!' + inputs.X};
			case 'Chain':
				return {Value: 'B.Chain(' + inputs.Seed + ', ' + inputs.Index + ')'};
			default:
				return null;
		}
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

	/* Blueprints: behaviour */

	/*
	 * Agent(graph, context): one that does as a behaviour graph says, a tree of its blocks from its Root, each tick from the
	 * top (a branch of more weight takes over from the one running). Statuses: success, failure, running. Its Tick(board,
	 * elapsed) walks the tree with board (what it knows: the Input blocks read it, a Remember block writes it) and gives {Status,
	 * Running (the blocks of the way running now, the root first), Leaves}; Stop() stops what runs. context: Tasks ({Name:
	 * function (request) giving a status, or true / false: what a Task block of that Name does}; request {Name, Value, Block, Memory (of that block and agent),
	 * First (begun now), Elapsed, Time, Board, Agent}), Abort (function (request) when a running task is left), Agent (what
	 * the tasks are told of whom they act for), Parameters. Nothing of a game or of a scene: an application gives what its
	 * tasks do.
	 */
	Agent: function (graph, context) {
		var made = this.Compile(graph);
		if (made.Type !== 'behaviour')
			throw new Error('Elemenx Blueprints: Agent runs a behaviour graph, not a ' + made.Type + ' graph');

		return made.Agent(context);
	},

	Behaviour: function (plan, context, defaults) {
		var self = this;
		var given = context || {};
		var memory = {};
		var time = 0;
		var ticks = 0;
		var running = [];
		var leaves = {};
		var root = plan.Order.filter(function (id) {
			return plan.Blocks[id].type === 'Root' && plan.Blocks[id].enabled !== false;
		})[0];
		var agent = {Running: [], Memory: memory, Context: given};
		var run;
		var board;
		var seen;
		var now;

		/* The children of a block, in the order they stand (top first, then left). */
		function children (id) {
			return (plan.Next[id].Children || []).filter(function (child) {
				return plan.Blocks[child].enabled !== false;
			}).sort(function (a, b) {
				return plan.Blocks[a].y - plan.Blocks[b].y || plan.Blocks[a].x - plan.Blocks[b].x;
			});
		}

		/* What a block remembers; fresh when it was not on the way last tick (left, then come to again). */
		function memoryOf (id) {
			var kept = memory[id];

			if (!kept || kept.Tick < ticks - 1) kept = memory[id] = {Tick: ticks, Fresh: true};
			else kept.Fresh = false;

			kept.Tick = ticks;

			return kept;
		}

		function inputsOf (id) {
			return self.Gather(plan, id, run);
		}

		function status (value) {
			if (value === true || value === 'success') return 'success';

			return value === 'running' ? 'running' : 'failure';
		}

		/* A task left running (a branch of more weight took over): told to stop. */
		function abort (id) {
			var block = plan.Blocks[id];
			var name = String(self.Properties(block).Name || '');

			delete leaves[id];

			if (typeof given.Abort === 'function')
				given.Abort({Name: name, Block: id, Memory: memory[id] || {}, Board: board, Agent: given.Agent});

			delete memory[id];
		}

		function tick (id) {
			var block = plan.Blocks[id];
			var properties = self.Properties(block);
			var kept = memoryOf(id);
			var list = children(id);
			var result = 'failure';
			var inputs;
			var i;
			var one;
			var action;
			var scores;
			var best;

			seen.push(id);

			switch (block.type) {
				case 'Root':
					result = list.length ? tick(list[0]) : 'success';

					break;

				case 'Selector':
					for (i = 0; i < list.length; i++) {
						one = tick(list[i]);

						if (one !== 'failure') {
							result = one;

							break;
						}
					}

					break;

				case 'Steps':
					if (kept.Fresh)
						kept.Index = 0;

					result = 'success';

					for (i = kept.Index; i < list.length; i++) {
						one = tick(list[i]);

						if (one === 'running') {
							kept.Index = i;
							result = 'running';

							break;
						}

						if (one === 'failure') {
							kept.Index = 0;
							result = 'failure';

							break;
						}
					}

					if (result === 'success')
						kept.Index = 0;

					break;

				case 'Parallel':
					scores = list.map(tick);
					result = properties.Need === 'one' ? scores.indexOf('success') !== -1 ? 'success' : scores.indexOf('running') !== -1 ? 'running' : 'failure' : scores.indexOf('failure') !== -1 ? 'failure' : scores.indexOf('running') !== -1 ? 'running' : 'success';

					break;

				/*
				 * Of its children the one of the greatest Score (a Formula, a Response: what the child is worth now; none above 0:
				 * failure), kept at least Commit seconds once chosen, then left for one worth Switch times as much.
				 */
				case 'Utility':
					scores = list.map(function (child) {
						return {ID: child, Score: Number(inputsOf(child).Score) || 0};
					}).filter(function (one) {
						return one.Score > 0;
					});
					best = scores.reduce(function (top, one) {
						return !top || one.Score > top.Score ? one : top;
					}, null);
					one = kept.Fresh ? null : scores.filter(function (each) {
						return each.ID === kept.Chosen;
					})[0];

					if (one && best && best.ID !== one.ID && (time - kept.Since < Number(properties.Commit || 0) || best.Score < one.Score * Number(properties.Switch || 1.2)))
						best = one;

					if (!best) {
						kept.Chosen = '';

						break;
					}

					if (best.ID !== kept.Chosen) {
						kept.Chosen = best.ID;
						kept.Since = time;
					}

					kept.Scores = scores;
					result = tick(best.ID);

					if (result !== 'running')
						kept.Chosen = '';

					break;

				case 'Condition':
					inputs = inputsOf(id);
					result = inputs.Test ? list.length ? tick(list[0]) : 'success' : 'failure';

					break;

				case 'Invert':
					one = list.length ? tick(list[0]) : 'success';
					result = one === 'running' ? 'running' : one === 'success' ? 'failure' : 'success';

					break;

				case 'Cooldown':
					if (time < (kept.Ready || 0)) break;

					result = list.length ? tick(list[0]) : 'success';

					if (result !== 'running')
						kept.Ready = time + Number(properties.Seconds || 0);

					break;

				case 'Limit':
					if (kept.Fresh)
						kept.Since = time;

					result = time - kept.Since > Number(properties.Seconds || 0) ? 'failure' : list.length ? tick(list[0]) : 'running';

					break;

				case 'Loop':
					if (kept.Fresh)
						kept.Done = 0;

					one = list.length ? tick(list[0]) : 'success';

					if (one === 'failure') break;

					if (one === 'success')
						kept.Done++;

					result = Number(properties.Count || 0) > 0 && kept.Done >= Number(properties.Count) ? 'success' : 'running';

					/* Done its Count: a success, begun again when it is come to next. */
					if (result === 'success')
						kept.Done = 0;

					break;

				case 'Wait':
					if (kept.Fresh)
						kept.Until = time + Number(inputsOf(id).Seconds || 0);

					result = time >= kept.Until ? 'success' : 'running';

					break;

				case 'Remember':
					board[String(properties.Name || '')] = inputsOf(id).Value;
					result = 'success';

					break;

				case 'Task':
					action = given.Tasks && given.Tasks[String(properties.Name || '')];
					inputs = inputsOf(id);
					leaves[id] = true;
					result = typeof action === 'function' ? status(action({Name: String(properties.Name || ''), Value: inputs.Value, Block: id, Memory: kept, First: !!kept.Fresh, Elapsed: now, Time: time, Board: board, Agent: given.Agent})) : 'failure';

					if (result !== 'running')
						delete leaves[id];

					break;

				default:
					result = 'failure';
			}

			return result;
		}

		agent.Tick = function (known, elapsed) {
			var was = leaves;
			var result;

			if (!root)
				return {Status: 'failure', Running: [], Leaves: []};

			now = Math.max(0, Number(elapsed) || 0);
			time += now;
			ticks++;
			board = known || {};
			seen = [];
			leaves = {};
			run = {Outputs: {}, Parameters: given.Parameters || {}, Inputs: board, Context: given, Memo: true, Graph: {parameters: defaults || plan.Graph.parameters}};

			result = tick(root);

			/* What ran last tick and runs no more is stopped. */
			Object.keys(was).forEach(function (id) {
				if (!leaves[id]) {
					leaves[id] = true;

					abort(id);
				}
			});

			running = seen.filter(function (id) {
				var kept = memory[id];

				return !!kept && kept.Tick === ticks;
			});
			agent.Running = running;

			return {Status: result, Running: running.slice(), Leaves: Object.keys(leaves)};
		};

		agent.Stop = function () {
			Object.keys(leaves).forEach(abort);

			leaves = {};
		};

		/* The score each child of a Utility block had at the last tick ([{ID, Score}]): to show why it chose. */
		agent.Scores = function (id) {
			return memory[id] && memory[id].Scores ? memory[id].Scores.slice() : [];
		};

		return agent;
	},

	/* The properties of a block of a spec of noise (NoiseSpec), and the spec of their values. */
	NoiseProperties: function () {
		return [
			{Key: 'Type', Type: 'select', Options: ['value', 'perlin', 'simplex', 'worley', 'white'], Value: 'perlin'},
			{Key: 'Seed', Type: 'text', Value: ''},
			{Key: 'Fractal', Type: 'select', Options: ['none', 'fbm', 'ridged', 'billow'], Value: 'fbm'},
			{Key: 'Octaves', Type: 'number', Value: 4, Min: 1, Max: 10},
			{Key: 'Gain', Type: 'number', Value: 0.5, Min: 0, Max: 1},
			{Key: 'Cell', Type: 'select', Options: ['f1', 'f2', 'edge', 'cell'], Value: 'f1'},
			{Key: 'Distance', Type: 'select', Options: ['euclid', 'manhattan', 'chebyshev'], Value: 'euclid'},
			{Key: 'Jitter', Type: 'number', Value: 1, Min: 0, Max: 1},
			{Key: 'Warp', Type: 'number', Value: 0, Min: 0, Max: 4},
			{Key: 'WarpScale', Type: 'number', Value: 1, Min: 0.05, Max: 8},
			{Key: 'WarpOctaves', Type: 'number', Value: 2, Min: 1, Max: 6},
			{Key: 'Tile', Type: 'number', Value: 0, Min: 0, Max: 64}
		];
	},

	NoiseOf: function (properties) {
		var given = properties || {};
		var tile = Number(given.Tile) || 0;

		return {Type: given.Type || 'perlin', Seed: given.Seed || '', Fractal: given.Fractal || 'fbm', Octaves: Number(given.Octaves) || 4, Gain: given.Gain === undefined ? 0.5 : Number(given.Gain), Cell: {Return: given.Cell || 'f1', Distance: given.Distance || 'euclid', Jitter: given.Jitter === undefined || given.Jitter === null || given.Jitter === '' ? 1 : Number(given.Jitter)}, Warp: Number(given.Warp) ? {Amount: Number(given.Warp), Scale: Number(given.WarpScale) || 1, Octaves: Number(given.WarpOctaves) || 2} : null, Tile: tile ? [tile, tile, tile] : null};
	},

	/* Blueprints: functions and the IR */

	/*
	 * An expression of a block Formula read: {Tree, Names (its inputs: the names it reads, in their order)}, or an error.
	 * Numbers, texts ('a' or "a"), names, true, false, PI; [a, b] lists; a[i]; f(a, b); - and !; * / %; + -; < <= > >=;
	 * == !=; &&; ||; a ? b : c. Its functions: min, max, pow, step, floor, abs, sqrt, sin, cos, fract, exp, acos, asin,
	 * saturate, clamp, mix, smoothstep (of numbers: (x - a) / (b - a) cut to 0..1, s * s * (3 - 2 * s)), round, atan2, hypot,
	 * ceil, count, vec2, vec3, vec4, text. Regression: none, it is new.
	 */
	Formula: function (text) {
		var source = String(text === undefined || text === null ? '' : text);
		var tokens = [];
		var at = 0;
		var names = [];
		var found = /\s*(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+|[A-Za-z_]\w*|'[^']*'|"[^"]*"|==|!=|<=|>=|&&|\|\||[-+*\/%<>!?:,()[\]])/g;
		var match;
		var tree;

		this.Formulas = this.Formulas || {};

		if (Object.prototype.hasOwnProperty.call(this.Formulas, source)) return this.Formulas[source];

		while (found.lastIndex < source.length) {
			var before = found.lastIndex;

			match = found.exec(source);

			if (!match || match.index !== before) {
				if (/^\s*$/.test(source.slice(before))) break;

				throw new Error('Elemenx Blueprints: cannot read the formula ' + source + ' at ' + before);
			}

			tokens.push(match[1]);
		}

		function peek () {
			return tokens[at];
		}

		function take (expected) {
			var token = tokens[at];
			if (expected !== undefined && token !== expected)
				throw new Error('Elemenx Blueprints: the formula ' + source + ' expects ' + expected + ' at ' + (token === undefined ? 'its end' : token));

			at++;

			return token;
		}

		function binary (operators, next) {
			return function () {
				var left = next();

				while (operators.indexOf(peek()) !== -1)
					left = {Op: 'bin', Operator: take(), A: left, B: next()};

				return left;
			};
		}

		function primary () {
			var token = take();
			var items;
			var node;

			if (token === undefined)
				throw new Error('Elemenx Blueprints: the formula ' + source + ' ends too soon');

			if (token === '(') {
				node = choice();

				take(')');
			}
			else if (token === '[') {
				items = [];

				while (peek() !== ']') {
					items.push(choice());

					if (peek() === ',')
						take();
				}

				take(']');

				node = {Op: 'list', Items: items};
			}
			else if (/^[\d.]/.test(token)) {
				node = {Op: 'const', Value: Number(token)};
			}
			else if (/^['"]/.test(token)) {
				node = {Op: 'const', Value: token.slice(1, -1)};
			}
			else if (token === 'true' || token === 'false') {
				node = {Op: 'const', Value: token === 'true'};
			}
			else if (token === 'PI') {
				node = {Op: 'const', Value: Math.PI};
			}
			else if (peek() === '(') {
				take('(');

				items = [];

				while (peek() !== ')') {
					items.push(choice());

					if (peek() === ',')
						take();
				}

				take(')');

				node = {Op: 'call', Name: token, Args: items};
			}
			else if (/^[A-Za-z_]/.test(token)) {
				if (names.indexOf(token) === -1)
					names.push(token);

				node = {Op: 'var', Name: token};
			}
			else {
				throw new Error('Elemenx Blueprints: the formula ' + source + ' has ' + token + ' out of place');
			}

			while (peek() === '[') {
				take('[');

				node = {Op: 'index', List: node, At: choice()};

				take(']');
			}

			return node;
		}

		function unary () {
			if (peek() === '-' || peek() === '!')
				return {Op: 'un', Operator: take(), A: unary()};

			return primary();
		}

		var product = binary(['*', '/', '%'], unary);
		var sum = binary(['+', '-'], product);
		var order = binary(['<', '<=', '>', '>='], sum);
		var equal = binary(['==', '!='], order);
		var both = binary(['&&'], equal);
		var either = binary(['||'], both);

		function choice () {
			var test = either();
			var a;

			if (peek() !== '?') return test;

			take('?');

			a = choice();

			take(':');

			return {Op: 'select', Test: test, A: a, B: choice()};
		}

		tree = choice();

		if (at < tokens.length)
			throw new Error('Elemenx Blueprints: the formula ' + source + ' has ' + tokens[at] + ' out of place');

		this.Formulas[source] = {Tree: tree, Names: names};

		return this.Formulas[source];
	},

	/* The functions of a formula, each of numbers or of lists of them part by part (Each), as the IR has them. */
	FormulaCalls: {
		min: 'min', max: 'max', pow: 'pow', step: 'step', floor: 'floor', abs: 'abs', sqrt: 'sqrt', sin: 'sin', cos: 'cos', fract: 'fract', exp: 'exp', acos: 'acos', asin: 'asin', saturate: 'saturate'
	},

	/* The operators and the functions of numbers of a formula, part by part of lists (Each): its value and its code alike. */
	FormulaOps: {'+': function (a, b) {
		return a + b;
	}, '-': function (a, b) {
		return a - b;
	}, '*': function (a, b) {
		return a * b;
	}, '/': function (a, b) {
		return b ? a / b : 0;
	}},

	/*
	 * The functions of Math its blocks and formulas turn by (sin, cos, exp, pow, atan2, round...): the own ones of the compiled
	 * code (Elemenx.Compilers.Math), so a graph run block by block, its Code and its IR give the very same numbers; the
	 * browser's where there is none (a worker). Regression: the interpreter of a graph turned by the browser's, its code by
	 * the own ones, and a building of the graph and of its code stood a last bit apart.
	 */
	Math: function () {
		return typeof Elemenx !== 'undefined' && Elemenx.Compilers && Elemenx.Compilers.Math ? Elemenx.Compilers.Math() : Math;
	},

	/* smoothstep(a, b, x) of a formula: the share of x between a and b cut to 0..1, s * s * (3 - 2 * s). */
	FormulaSmooth: function (a, b, x) {
		var s = Math.max(0, Math.min(1, (x - a) / (b - a)));

		return s * s * (3 - 2 * s);
	},

	FormulaSingles: {min: Math.min, max: Math.max, pow: Math.pow, step: function (e, x) {
		return x < e ? 0 : 1;
	}, floor: Math.floor, abs: Math.abs, sqrt: function (x) {
		return Math.sqrt(Math.max(0, x));
	}, sin: Math.sin, cos: Math.cos, fract: function (x) {
		return x - Math.floor(x);
	}, exp: Math.exp, acos: Math.acos, asin: Math.asin, saturate: function (x) {
		return Math.max(0, Math.min(1, x));
	}},

	/*
	 * The tree of a formula as JavaScript (Code of a generator): an expression of the expressions given for its names, as
	 * FormulaValue reckons it, with no walk of its tree at each call. Its functions are written into it: the code runs in a
	 * worker too, where B is no more than its methods.
	 */
	FormulaCode: function (tree, inputs) {
		var self = this;
		var ops = {'+': 'function (a, b) { return a + b; }', '-': 'function (a, b) { return a - b; }', '*': 'function (a, b) { return a * b; }', '/': 'function (a, b) { return b ? a / b : 0; }'};
		var singles = {min: 'Math.min', max: 'Math.max', pow: 'B.Math().pow', step: 'function (e, x) { return x < e ? 0 : 1; }', floor: 'Math.floor', abs: 'Math.abs', sqrt: 'function (x) { return Math.sqrt(Math.max(0, x)); }', sin: 'B.Math().sin', cos: 'B.Math().cos', fract: 'function (x) { return x - Math.floor(x); }', exp: 'B.Math().exp', acos: 'B.Math().acos', asin: 'B.Math().asin', saturate: 'function (x) { return Math.max(0, Math.min(1, x)); }'};

		function code (node) {
			var args;

			if (node.Op === 'const')
				return JSON.stringify(node.Value);

			if (node.Op === 'var')
				return '(' + (inputs[node.Name] === undefined ? 'undefined' : inputs[node.Name]) + ')';

			if (node.Op === 'list')
				return '[' + node.Items.map(code).join(', ') + ']';

			if (node.Op === 'index')
				return '(function (l, i) { return l == null ? undefined : l[Math.floor(Number(i) || 0)]; })(' + code(node.List) + ', ' + code(node.At) + ')';

			if (node.Op === 'select')
				return '(' + code(node.Test) + ' ? ' + code(node.A) + ' : ' + code(node.B) + ')';

			if (node.Op === 'un')
				return node.Operator === '!' ? '!(' + code(node.A) + ')' : 'E(' + code(node.A) + ', 0, function (x) { return -x; })';

			if (node.Op === 'call') {
				args = node.Args.map(code);

				if (Object.prototype.hasOwnProperty.call(self.FormulaSingles, node.Name))
					return 'E(' + args[0] + ', ' + (args[1] === undefined ? '0' : args[1]) + ', ' + singles[node.Name] + ')';

				switch (node.Name) {
					case 'clamp':
						return 'E(' + args[1] + ', E(' + args[2] + ', ' + args[0] + ', Math.min), Math.max)';
					case 'mix':
						return 'E(' + args[0] + ', E(E(' + args[1] + ', ' + args[0] + ', ' + ops['-'] + '), ' + args[2] + ', ' + ops['*'] + '), ' + ops['+'] + ')';
					case 'smoothstep':
						return '(function (a, b, x) { var s = Math.max(0, Math.min(1, (x - a) / (b - a))); return s * s * (3 - 2 * s); })(Number(' + args[0] + ') || 0, Number(' + args[1] + ') || 0, Number(' + args[2] + ') || 0)';
					case 'round':
						return 'B.Math().round(Number(' + args[0] + ') || 0)';
					case 'atan2':
						return 'B.Math().atan2(Number(' + args[0] + ') || 0, Number(' + args[1] + ') || 0)';
					case 'hypot':
						return 'Math.sqrt(B.Math().pow(Number(' + args[0] + ') || 0, 2) + B.Math().pow(Number(' + args[1] + ') || 0, 2))';
					case 'ceil':
						return 'Math.ceil(Number(' + args[0] + ') || 0)';
					case 'count':
						return '((' + args[0] + ') && (' + args[0] + ').length || 0)';
					case 'vec2':
					case 'vec3':
					case 'vec4':
						return '[' + args.slice(0, Number(node.Name.charAt(3))).join(', ') + ']';
					case 'text':
						return 'String(' + args[0] + ')';
					default:
						throw new Error('Elemenx Blueprints: no function ' + node.Name + ' in a formula');
				}
			}

			if (self.FormulaOps[node.Operator])
				return 'E(' + code(node.A) + ', ' + code(node.B) + ', ' + ops[node.Operator] + ')';

			return '(' + code(node.A) + ' ' + ({'==': '===', '!=': '!=='}[node.Operator] || node.Operator) + ' ' + code(node.B) + ')';
		}

		return code(tree);
	},

	/* The value of the tree of a formula with the values of its names. */
	FormulaValue: function (tree, values) {
		var self = this;
		var ops = this.FormulaOps;
		var own = this.Math();
		/* Of the own Math, as the code of a graph computes them (Math). */
		var singles = Object.assign({}, this.FormulaSingles, {sin: own.sin, cos: own.cos, exp: own.exp, pow: own.pow, acos: own.acos, asin: own.asin});

		function value (node) {
			var args;
			var a;
			var b;

			if (node.Op === 'const') return node.Value;

			if (node.Op === 'var')
				return values[node.Name];

			if (node.Op === 'list')
				return node.Items.map(value);

			if (node.Op === 'index') {
				a = value(node.List);

				return a == null ? undefined : a[Math.floor(Number(value(node.At)) || 0)];
			}

			if (node.Op === 'select')
				return value(node.Test) ? value(node.A) : value(node.B);

			if (node.Op === 'un')
				return node.Operator === '!' ? !value(node.A) : self.Each(value(node.A), 0, function (x) {
					return -x;
				});

			if (node.Op === 'call') {
				args = node.Args.map(value);

				if (Object.prototype.hasOwnProperty.call(singles, node.Name))
					return self.Each(args[0], args[1] === undefined ? 0 : args[1], singles[node.Name]);

				switch (node.Name) {
					case 'clamp':
						return self.Each(args[1], self.Each(args[2], args[0], Math.min), Math.max);
					case 'mix':
						return self.Each(args[0], self.Each(self.Each(args[1], args[0], ops['-']), args[2], ops['*']), ops['+']);
					case 'smoothstep':
						return self.FormulaSmooth(Number(args[0]) || 0, Number(args[1]) || 0, Number(args[2]) || 0);
					case 'round':
						return own.round(Number(args[0]) || 0);
					case 'atan2':
						return own.atan2(Number(args[0]) || 0, Number(args[1]) || 0);
					case 'hypot':
						return Math.sqrt(own.pow(Number(args[0]) || 0, 2) + own.pow(Number(args[1]) || 0, 2));
					case 'ceil':
						return Math.ceil(Number(args[0]) || 0);
					case 'count':
						return args[0] && args[0].length || 0;
					case 'vec2':
					case 'vec3':
					case 'vec4':
						return args.slice(0, Number(node.Name.charAt(3)));
					case 'text':
						return String(args[0]);
					default:
						throw new Error('Elemenx Blueprints: no function ' + node.Name + ' in a formula');
				}
			}

			a = value(node.A);
			b = value(node.B);

			if (ops[node.Operator])
				return self.Each(a, b, ops[node.Operator]);

			switch (node.Operator) {
				case '%':
					return a % b;
				case '<':
					return a < b;
				case '<=':
					return a <= b;
				case '>':
					return a > b;
				case '>=':
					return a >= b;
				case '==':
					return a === b;
				case '!=':
					return a !== b;
				case '&&':
					return a && b;
				default:
					return a || b;
			}
		}

		return value(tree);
	},

	/* The tree of a formula in the IR, its names the expressions given for them. */
	FormulaIR: function (tree, inputs) {
		var self = this;
		var each = {'+': 'add', '-': 'sub', '*': 'mul', '/': 'div'};

		function c (value) {
			return {Op: 'const', Value: value, Type: typeof value === 'string' ? 'text' : typeof value === 'boolean' ? 'bool' : 'float'};
		}

		function call (name) {
			return {Op: 'call', Name: name, Args: Array.prototype.slice.call(arguments, 1)};
		}

		function ir (node) {
			var args;

			if (node.Op === 'const') return c(node.Value);

			if (node.Op === 'var')
				return inputs[node.Name] || c(0);

			if (node.Op === 'list')
				return {Op: 'list', Items: node.Items.map(ir)};

			if (node.Op === 'index')
				return {Op: 'index', List: ir(node.List), At: call('floor', ir(node.At))};

			if (node.Op === 'select')
				return {Op: 'select', Test: ir(node.Test), A: ir(node.A), B: ir(node.B)};

			if (node.Op === 'un')
				return node.Operator === '!' ? {Op: 'un', Operator: '!', A: ir(node.A)} : call('each', c('sub'), c(0), ir(node.A));

			if (node.Op === 'call') {
				args = node.Args.map(ir);

				if (Object.prototype.hasOwnProperty.call(self.FormulaCalls, node.Name))
					return call('each', c(self.FormulaCalls[node.Name]), args[0], args[1] || c(0));

				switch (node.Name) {
					case 'clamp':
						return call('each', c('max'), args[1], call('each', c('min'), args[2], args[0]));
					case 'mix':
						return call('each', c('add'), args[0], call('each', c('mul'), call('each', c('sub'), args[1], args[0]), args[2]));
					case 'smoothstep':
						return call('smoothstep', call('cast', args[0], c('float')), call('cast', args[1], c('float')), call('cast', args[2], c('float')));
					case 'round':
					case 'ceil':
						return call(node.Name, call('cast', args[0], c('float')));
					case 'atan2':
						return call('atan2', call('cast', args[0], c('float')), call('cast', args[1], c('float')));
					case 'hypot':
						return call('sqrt', call('each', c('add'), call('each', c('mul'), args[0], args[0]), call('each', c('mul'), args[1], args[1])));
					case 'count':
						return {Op: 'length', List: args[0]};
					case 'vec2':
					case 'vec3':
					case 'vec4':
						return {Op: 'list', Items: args.slice(0, Number(node.Name.charAt(3)))};
					case 'text':
						return call('text', args[0]);
					default:
						throw new Error('Elemenx Blueprints: no function ' + node.Name + ' in a formula');
				}
			}

			if (each[node.Operator])
				return call('each', c(each[node.Operator]), ir(node.A), ir(node.B));

			return {Op: 'bin', Operator: node.Operator, A: ir(node.A), B: ir(node.B)};
		}

		return ir(tree);
	},


	/*
	 * The graph a block calls (Call, Repeat, Map, Reduce): a generator graph of the resources (group Blueprints) of that
	 * name, or null. It is a function: its Input blocks what it is given, its Result blocks what it gives.
	 */
	Callee: function (name) {
		var graph;

		/* While a graph runs, each it calls is read once (Calls): a window of a tower is called a thousand times. */
		if (this.Calls && Object.prototype.hasOwnProperty.call(this.Calls, name)) return this.Calls[name].Graph;

		graph = name && typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Blueprints', String(name)) : null;
		graph = graph && Array.isArray(graph.blocks) ? graph : null;

		if (this.Calls)
			this.Calls[name] = {Graph: graph};

		return graph;
	},

	/*
	 * Runs work in which the graphs called are read once each (Calls), then forgotten: a resource changed after it is read
	 * again. Within work of this kind already, it only runs it.
	 */
	Calling: function (work) {
		if (this.Calls) return work();

		this.Calls = {};

		try {
			return work();
		}
		finally {
			this.Calls = null;
		}
	},

	/* The names of the Input blocks and the keys of the Result blocks of a graph that is called: the pins of what calls it. */
	Signature: function (name) {
		var graph = this.Callee(name);
		var made = {Inputs: [], Results: []};

		if (this.Calls && this.Calls[name] && this.Calls[name].Signature) return this.Calls[name].Signature;

		(graph ? graph.blocks : []).forEach(function (block) {
			var key = (block.properties || []).filter(function (property) {
				return property.key === (block.type === 'Input' ? 'Name' : 'Key');
			})[0];
			if (block.type === 'Input' && key && made.Inputs.indexOf(key.value) === -1)
				made.Inputs.push(key.value);

			if (block.type === 'Result' && block.enabled !== false)
				made.Results.push(key ? key.value : 'Value');
		});

		if (this.Calls && this.Calls[name])
			this.Calls[name].Signature = made;

		return made;
	},

	/*
	 * Runs the graph of a name as a function with inputs ({name: value}): {key: value} of its results. One that calls
	 * itself goes as deep as 256 calls, then an error. Regression: none, it is new.
	 */
	Invoke: function (name, inputs) {
		var graph = this.Callee(name);
		var made;

		if (!graph)
			throw new Error('Elemenx Blueprints: no graph ' + name + ' to call');

		this.Depth = (this.Depth || 0) + 1;

		try {
			if (this.Depth > 256)
				throw new Error('Elemenx Blueprints: ' + name + ' goes deeper than 256');

			made = this.Calls && this.Calls[name] && this.Calls[name].Made || this.Compile(graph);

			if (this.Calls && this.Calls[name])
				this.Calls[name].Made = made;

			return made.Run(null, inputs || {}) || {};
		}
		finally {
			this.Depth--;
		}
	},

	/* The inputs of a graph called by a block of a list besides those the block gives it: what it passes on as it is given. */
	Extras: function (name, taken) {
		return this.Signature(name).Inputs.filter(function (input) {
			return taken.indexOf(input) === -1;
		}).map(function (input) {
			return {Key: input, Type: 'any', Value: 0};
		});
	},

	/* What a block of a list takes of what its graph gives: the result of Take, or all of them ('' or none of that key). */
	Taken: function (results, take) {
		return take && Object.prototype.hasOwnProperty.call(results, take) ? results[take] : results;
	},

	/*
	 * The IR of a block of a generator graph: {Output: an expression of the IR} of its inputs (expressions too), or null
	 * for one that has none (noise yet: the graph is run as it is). context: Inputs, Properties, Types (of its inputs as
	 * they come), Statement(statement) (a statement before its outputs, for what loops), Temp(name) (a name of its own),
	 * Call(name) (the name of the function of a graph it calls, made too).
	 */
	IROf: function (type, context) {
		var inputs = context.Inputs;
		var properties = context.Properties;
		var each = {Add: 'add', Subtract: 'sub', Multiply: 'mul', Divide: 'div', Min: 'min', Max: 'max', Pow: 'pow', Step: 'step'};
		var single = {Sin: 'sin', Cos: 'cos', Abs: 'abs', Floor: 'floor', Fract: 'fract', Sqrt: 'sqrt', Exp: 'exp', Saturate: 'saturate'};
		var compare = {'==': '==', '!=': '!=', '<': '<', '<=': '<=', '>': '>', '>=': '>='};
		var list;
		var at;
		var made;
		var signature;

		function c (value) {
			return {Op: 'const', Value: value, Type: typeof value === 'string' ? 'text' : typeof value === 'boolean' ? 'bool' : Array.isArray(value) ? 'list' : 'float'};
		}

		function call (name) {
			return {Op: 'call', Name: name, Args: Array.prototype.slice.call(arguments, 1)};
		}

		function e (op, a, b) {
			return call('each', c(op), a, b || c(0));
		}

		function v (name) {
			return {Op: 'var', Name: name};
		}

		/* A graph called with a record of what it is given: its record of results. */
		/* A graph called with what it is given: the inputs the block passes on as they are, and record. */
		function invoke (record) {
			var fields = {};

			Object.keys(inputs).forEach(function (key) {
				if (['List', 'Count', 'Initial'].indexOf(key) === -1)
					fields[key] = inputs[key];
			});

			return call(context.Call(properties.Graph), {Op: 'record', Fields: {}}, {Op: 'record', Fields: Object.assign(fields, record)});
		}

		if (each[type])
			return {Out: e(each[type], inputs.A, inputs.B)};

		if (single[type])
			return {Out: e(single[type], inputs.X)};

		switch (type) {
			case 'Parameter':
				return {Value: call('get', v('P'), c(String(properties.Key)), c(context.Defaults[properties.Key] === undefined ? 0 : context.Defaults[properties.Key]))};
			case 'Input':
				return {Value: call('get', v('I'), c(String(properties.Name)))};
			case 'Time':
				return {Seconds: call('cast', call('get', v('I'), c('Time'), c(0)), c('float'))};
			case 'OneMinus':
				return {Out: e('sub', c(1), inputs.X)};
			case 'Mix':
				return {Out: e('add', inputs.A, e('mul', e('sub', inputs.B, inputs.A), inputs.T))};
			case 'Clamp':
				return {Out: e('max', inputs.Low, e('min', inputs.High, inputs.X))};
			case 'Smoothstep':
				at = context.Temp('t');

				context.Statement({Op: 'let', Name: at, Type: 'any', Value: e('saturate', e('div', e('sub', inputs.X, inputs.Low), {Op: 'select', Test: {Op: 'bin', Operator: '==', A: e('sub', inputs.High, inputs.Low), B: c(0)}, A: c(1), B: e('sub', inputs.High, inputs.Low)}))});

				return {Out: e('mul', e('mul', v(at), v(at)), e('sub', c(3), e('mul', c(2), v(at))))};
			case 'Combine':
				return {XYZW: {Op: 'list', Items: [inputs.X, inputs.Y, inputs.Z, inputs.W]}, XYZ: {Op: 'list', Items: [inputs.X, inputs.Y, inputs.Z]}, XY: {Op: 'list', Items: [inputs.X, inputs.Y]}};
			case 'Split':
				return {X: {Op: 'index', List: inputs.Vector, At: c(0)}, Y: {Op: 'index', List: inputs.Vector, At: c(1)}, Z: {Op: 'index', List: inputs.Vector, At: c(2)}, W: {Op: 'index', List: inputs.Vector, At: c(3)}};
			case 'Compare':
				return {Out: {Op: 'bin', Operator: compare[properties.Operator || '=='] || '==', A: inputs.A, B: inputs.B}};
			case 'And':
				return {Out: {Op: 'bin', Operator: '&&', A: inputs.A, B: inputs.B}};
			case 'Or':
				return {Out: {Op: 'bin', Operator: '||', A: inputs.A, B: inputs.B}};
			case 'Not':
				return {Out: {Op: 'un', Operator: '!', A: inputs.X}};
			case 'Select':
				return {Out: {Op: 'select', Test: inputs.Test, A: inputs.A, B: inputs.B}};
			case 'Formula':
				try {
					return {Value: this.FormulaIR(this.Formula(properties.Expression).Tree, inputs)};
				}
				catch (error) {
					return null;
				}
			case 'Field':
				made = inputs.Object;

				String(properties.Path || '').split('.').filter(Boolean).forEach(function (part) {
					made = call('get', made, /^\d+$/.test(part) ? c(Number(part)) : c(part));
				});

				return {Value: made};
			case 'List':
				return {List: {Op: 'list', Items: Object.keys(inputs).sort(function (a, b) {
					return Number(a.substring(4)) - Number(b.substring(4));
				}).map(function (key) {
					return inputs[key];
				})}};
			case 'Count':
				return {Count: {Op: 'length', List: inputs.List}};
			case 'Item':
				return {Value: {Op: 'index', List: inputs.List, At: call('floor', inputs.Index)}};
			case 'Random':
				return {Value: call('hash', inputs.Seed, inputs.Key)};
			case 'Table':
				made = properties.Default === undefined ? c(0) : c(properties.Default);

				Object.keys(properties.Rows || {}).reverse().forEach(function (key) {
					made = {Op: 'select', Test: {Op: 'bin', Operator: '==', A: call('text', inputs.Key), B: c(key)}, A: c(properties.Rows[key]), B: made};
				});

				return {Value: made};
			case 'Call':
				at = context.Temp('call');
				signature = this.Signature(properties.Graph);
				list = {};

				signature.Inputs.forEach(function (name) {
					list[name] = inputs[name] === undefined ? c(0) : inputs[name];
				});

				context.Statement({Op: 'let', Name: at, Type: 'record', Value: invoke(list)});

				made = {};

				signature.Results.forEach(function (key) {
					made[key] = call('get', v(at), c(key));
				});

				return made;
			case 'Repeat':
			case 'Map':
			case 'Reduce':
				list = context.Temp('list');
				at = context.Temp('i');
				made = context.Temp('made');

				context.Statement({Op: 'let', Name: list, Type: 'list', Value: type === 'Repeat' ? {Op: 'list', Items: []} : call('cast', inputs.List, c('any'))});

				if (type === 'Reduce') {
					context.Statement({Op: 'let', Name: made, Type: 'any', Value: inputs.Initial});
					context.Statement({Op: 'loop', Var: at, From: c(0), To: {Op: 'length', List: v(list)}, Body: [
						{Op: 'set', Name: made, Value: call('get', invoke({Item: {Op: 'index', List: v(list), At: v(at)}, Index: v(at), Sum: v(made)}), c('Sum'), v(made))}
					]});

					return {Sum: v(made)};
				}

				signature = context.Temp('one');

				context.Statement({Op: 'let', Name: made, Type: 'list', Value: {Op: 'list', Items: []}});
				context.Statement({Op: 'loop', Var: at, From: c(0), To: type === 'Repeat' ? call('floor', call('cast', inputs.Count, c('float'))) : {Op: 'length', List: v(list)}, Body: [
					{Op: 'let', Name: signature, Type: 'record', Value: invoke(type === 'Repeat' ? {Index: v(at), Count: inputs.Count} : {Item: {Op: 'index', List: v(list), At: v(at)}, Index: v(at)})},
					{Op: 'push', List: v(made), Value: properties.Take ? call('get', v(signature), c(properties.Take), v(signature)) : v(signature)}
				]});

				return {List: v(made)};
			default:
				/* A block of a Service of its own: its IR, if it tells one (IR(inputs, properties, context)). */
				return this.Types[type] && typeof this.Types[type].IR === 'function' ? this.Types[type].IR.call(this, inputs, properties, context) || null : null;
		}
	},

	/*
	 * A generator graph in the IR of Elemenx.Compilers: {Module: {Functions, Entry}, Diagnostics}. Each graph is a function
	 * (P: its parameters, I: what it is given) that gives a record of its results; the graphs it calls (Call, Repeat, Map,
	 * Reduce) are functions of the module too, one that calls itself too. A block of no IR is told in Diagnostics.
	 */
	IR: function (graph, options) {
		var self = this;
		var settings = options || {};
		var functions = [];
		var diagnostics = [];
		var made = {};
		var entry = settings.Name || graph.name || 'main';
		var helpers = {};

		/* A function of the module a block calls (a Service's own, made of the IR): added once, by its name. */
		function helper (name, define) {
			if (!Object.prototype.hasOwnProperty.call(helpers, name)) {
				helpers[name] = true;

				functions.push(define());
			}

			return name;
		}

		function make (source, name) {
			var plan;
			var body = [];
			var names = {};
			var needed = {};
			var defaults = {};
			var serial = 0;
			var results = {};

			var end;

			if (Object.prototype.hasOwnProperty.call(made, name)) return made[name];

			made[name] = 'g_' + name;
			/* Read first: a graph of the resources keeps no pins (Regression: its links were not found, and its code gave nothing). */
			plan = self.Plan(self.Read(JSON.parse(JSON.stringify(source))));
			end = self.Makers[source.type] && self.Makers[source.type].End || 'Result';

			(source.parameters || []).forEach(function (parameter) {
				defaults[parameter.key] = parameter.value;
			});

			/* Only what its results read. */
			function need (id) {
				if (needed[id]) return;

				needed[id] = true;

				Object.keys(plan.From[id] || {}).forEach(function (key) {
					need(plan.From[id][key].Block);
				});
			}

			/* Its results: of its Result blocks, or of the end of its kind (Model of a model: its IREnd). */
			plan.Order.forEach(function (id) {
				if ((plan.Blocks[id].type === 'Result' || plan.Blocks[id].type === end) && plan.Blocks[id].enabled !== false)
					need(id);
			});

			plan.Order.forEach(function (id, index) {
				var block = plan.Blocks[id];
				var node = plan.Nodes[id];
				var properties = self.Properties(block);
				var inputs = {};
				var outputs = node ? self.Outputs(node, block) || [] : [];
				var code;
				var passed;
				var constant;

				if (!needed[id] || !node) return;

				names[id] = {};

				(self.Inputs(node, block) || []).forEach(function (input) {
					var from = plan.From[id][input.Key];
					var value;

					if (from && names[from.Block] && names[from.Block][from.Key]) {
						value = {Op: 'var', Name: names[from.Block][from.Key]};

						inputs[input.Key] = !input.Type || input.Type === 'any' || input.Type === 'same' || input.Type === from.Type || input.Type === 'object' ? value : {Op: 'call', Name: 'cast', Args: [value, {Op: 'const', Value: input.Type, Type: 'text'}]};
					}
					else {
						constant = input.Value === undefined ? 0 : self.Cast(input.Value, null, input.Type);
						inputs[input.Key] = {Op: 'const', Value: constant, Type: typeof constant === 'string' ? 'text' : typeof constant === 'boolean' ? 'bool' : Array.isArray(constant) ? 'list' : 'float'};
					}
				});

				if (block.type === 'Result') {
					results[properties.Key || 'Value'] = inputs.Value;

					return;
				}

				if (block.type === end && typeof node.IREnd === 'function') {
					Object.assign(results, node.IREnd.call(self, inputs, properties, {Helper: helper}));

					return;
				}

				if (block.enabled === false) {
					passed = self.Passed(plan, id);
					code = {};

					outputs.forEach(function (output) {
						code[output.Key] = passed[output.Key] ? inputs[passed[output.Key]] : {Op: 'const', Value: 0, Type: 'float'};
					});
				}
				else if (!(self.Inputs(node, block) || []).length && ['Parameter', 'Time', 'Input', 'Random'].indexOf(block.type) === -1 && typeof node.Compute === 'function') {
					constant = node.Compute.call(self, {}, properties, {Graph: source, Parameters: {}, Inputs: {}}) || {};
					code = {};

					outputs.forEach(function (output) {
						var value = constant[output.Key] === undefined ? 0 : constant[output.Key];

						code[output.Key] = {Op: 'const', Value: value, Type: typeof value === 'string' ? 'text' : typeof value === 'boolean' ? 'bool' : Array.isArray(value) ? 'list' : 'float'};
					});
				}
				else {
					code = self.IROf(block.type, {Inputs: inputs, Properties: properties, Defaults: defaults, Helper: helper, Statement: function (statement) {
						body.push(statement);
					}, Temp: function (word) {
						serial++;

						return word + '_' + index + '_' + serial;
					}, Call: function (callee) {
						/* Filled as the graph that calls it was (Fill). */
						var graphOf = self.Callee(callee);
						if (graphOf && source.filled)
							graphOf = self.Fill(JSON.parse(JSON.stringify(graphOf)), source.filled);

						if (!graphOf) {
							diagnostics.push({File: name, Line: 0, Column: 0, Severity: 'error', Text: 'Elemenx Blueprints: no graph ' + callee + ' to call', Block: id});

							return 'g_missing';
						}

						make(graphOf, callee);

						return 'g_' + callee;
					}});
				}

				if (!code) {
					diagnostics.push({File: name, Line: 0, Column: 0, Severity: 'error', Text: 'Elemenx Blueprints: no IR for a block ' + block.type, Block: id});

					return;
				}

				outputs.forEach(function (output) {
					var variable = 'v' + index + '_' + String(output.Key).replace(/[^A-Za-z0-9_]/g, '_');

					names[id][output.Key] = variable;

					body.push({Op: 'let', Name: variable, Type: 'any', Value: code[output.Key] || {Op: 'const', Value: 0, Type: 'float'}});
				});
			});

			body.push({Op: 'return', Value: {Op: 'record', Fields: results}});

			functions.push({Name: 'g_' + name, Params: [{Name: 'P', Type: 'record'}, {Name: 'I', Type: 'record'}], Returns: 'record', Body: body});

			return made[name];
		}

		make(graph, entry);

		return {Module: {Functions: functions, Entry: 'g_' + entry}, Diagnostics: diagnostics};
	},

	/*
	 * A generator of numbers as a function of numbers of the IR, typed, for js and wasm alike: its parameters fixed to values
	 * (the graph's own for the rest), its inputs (Input blocks) the parameters of the function, float (or the Types given:
	 * {name: type}), its results (Result blocks, in their order) its result: one as it is, two to four numbers as a vector.
	 * Its noise is the Kernel of the Noise Service (NoiseSpec, and Noise and Fbm, those of Math.Noise). {Module (its function
	 * g_main and those of the noise), Inputs: [{Name, Type}], Keys (of its results), Returns, Diagnostics}: a block of no
	 * numbers (a text, a list, a graph called, an action) is told there; such a graph runs by Code, IR or Compile.
	 */
	/*
	 * A graph with the graphs its Call blocks call in their places (a generator of numbers is one function of no calls):
	 * their blocks under the ID of the call (call~block), what the call is given into their Input blocks, what reads the
	 * call out of their Result blocks; their parameters among those of the graph (a parameter it has keeps its value),
	 * filled as the graph is (Fill). Of a call of none of that name, the graph as it is (its Call is told then). The graph
	 * itself when it calls none; a graph that calls itself (through others too) called as it is, not put in its place
	 * (chain: the names of the graphs it is in); eight calls deep at most. values (of a generator of numbers, Numeric: its
	 * parameters as it is made): a Reduce of a list of numbers of a known length (a Parameter, or nothing linked: none)
	 * unrolled too, its graph once for each item (reduce~index~block), each given the Sum of the one before, Initial the
	 * first; 64 items at most.
	 */
	Inlined: function (graph, chain, values) {
		var self = this;
		var within = chain || [];
		var calls = graph.blocks.filter(function (block) {
			return ['Call', 'Reduce'].indexOf(block.type) !== -1 && block.enabled !== false && within.indexOf(self.Properties(block).Graph) === -1 && (block.type === 'Call' || values && length(block) !== null);
		});
		var serial = 0;
		var copy;

		/* How many items the list of a Reduce has, known as the graph is made: of the Parameter it comes of; null when not known. */
		function length (block) {
			var from = null;
			var made = null;

			graph.links.forEach(function (link) {
				if (link.p2 === block.id + '-in-List')
					from = link.p1.split('-out-')[0];
			});

			if (from === null) return 0;

			graph.blocks.forEach(function (one) {
				var key;
				var value;

				if (one.id !== from || one.type !== 'Parameter') return;

				key = self.Properties(one).Key;
				value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : (graph.parameters || []).filter(function (parameter) {
					return parameter.key === key;
				}).map(function (parameter) {
					return parameter.value;
				})[0];

				if (Array.isArray(value) && value.length <= 64 && value.every(function (item) {
					return typeof item === 'number';
				}))
					made = value.length;
			});

			return made;
		}

		if (!calls.length || within.length > 8) return graph;

		copy = JSON.parse(JSON.stringify(graph));

		/* A block of its own in the graph (a number, an item of a list), its ID under the call. */
		function added (id, type, properties) {
			copy.blocks.push({id: id, type: type, x: 0, y: 0, properties: Object.keys(properties).map(function (key) {
				return {key: key, value: properties[key]};
			})});

			return id + '-out-Value';
		}

		function link (from, to) {
			serial++;

			copy.links.push({id: 'inlined-link-' + serial, p1: from, p2: to, kind: 'value'});
		}

		/* The blocks of a graph called put in the graph under a prefix, fed by feeding ({input: pin}): what its results come of ({key: pin}). */
		function place (callee, prefix, feeding) {
			var inputs = {};
			var results = {};
			var given = {};
			var out = {};

			(copy.parameters || []).forEach(function (parameter) {
				given[parameter.key] = true;
			});

			(callee.parameters || []).forEach(function (parameter) {
				if (!given[parameter.key])
					copy.parameters.push(JSON.parse(JSON.stringify(parameter)));
			});

			callee.blocks.forEach(function (block) {
				var made;

				if (block.type === 'Input') {
					inputs[block.id] = self.Properties(block).Name;

					return;
				}

				if (block.type === 'Result') {
					results[block.id] = self.Properties(block).Key || 'Value';

					return;
				}

				made = JSON.parse(JSON.stringify(block));
				made.id = prefix + block.id;

				delete made.pins;

				copy.blocks.push(made);
			});

			function source (pin) {
				var from = pin.split('-out-')[0];
				if (Object.prototype.hasOwnProperty.call(inputs, from)) return feeding[inputs[from]] || null;

				return prefix + pin;
			}

			callee.links.forEach(function (one) {
				var to = one.p2.split('-in-')[0];
				var from = source(one.p1);

				if (Object.prototype.hasOwnProperty.call(results, to)) {
					out[results[to]] = from;

					return;
				}

				if (from)
					copy.links.push({id: prefix + one.id, p1: from, p2: prefix + one.p2, kind: one.kind});
			});

			return out;
		}

		calls.forEach(function (call) {
			var name = self.Properties(call).Graph;
			var callee = self.Callee(name);
			var feeding = {};
			var reading;
			var out = {};
			var count;
			var sum;
			var i;

			if (!callee) return;

			count = call.type === 'Reduce' ? length(call) : 0;
			callee = self.Read(JSON.parse(JSON.stringify(callee)));

			if (graph.filled)
				callee = self.Fill(callee, graph.filled);

			callee = self.Inlined(callee, within.concat([name]), values);

			copy.links.forEach(function (one) {
				if (one.p2.split('-in-')[0] === call.id)
					feeding[one.p2.slice(call.id.length + 4)] = one.p1;
			});

			reading = copy.links.filter(function (one) {
				return one.p1.split('-out-')[0] === call.id;
			});

			copy.blocks = copy.blocks.filter(function (block) {
				return block.id !== call.id;
			});
			copy.links = copy.links.filter(function (one) {
				return one.p1.split('-out-')[0] !== call.id && one.p2.split('-in-')[0] !== call.id;
			});

			if (call.type === 'Call') {
				out = place(callee, call.id + '~', feeding);
			}
			else {
				/* Each item: its Item of the list, its Index, the Sum of the one before (the first: Initial, else nought). */
				sum = feeding.Initial || added(call.id + '~initial', 'Number', {Value: 0});

				for (i = 0; i < count; i++) {
					var prefix = call.id + '~' + i + '~';
					var index = added(prefix + 'index', 'Number', {Value: i});
					var item = added(prefix + 'item', 'Item', {});
					var made;

					link(feeding.List, prefix + 'item-in-List');
					link(index, prefix + 'item-in-Index');

					made = place(callee, prefix, Object.assign({}, feeding, {Item: item, Index: index, Sum: sum}));
					sum = made.Sum || sum;
				}

				out = {Sum: sum};
			}

			reading.forEach(function (one) {
				var key = one.p1.slice(call.id.length + 5);
				if (out[key])
					copy.links.push({id: one.id, p1: out[key], p2: one.p2, kind: one.kind});
			});
		});

		copy.blocks.forEach(function (block) {
			delete block.pins;
		});

		return this.Read(copy);
	},

	Numeric: function (graph, values, types, keys) {
		var self = this;
		var given = values || {};
		var read = this.Inlined(this.Read(graph), null, given);
		var plan;
		var kinds = types || {};
		var defaults = {};
		var needed = {};
		var named = {};
		var owner = {};
		var body = [];
		var inputs = [];
		var results = [];
		var diagnostics = [];
		var helpers = {};
		var functions = [];
		var serial = 0;
		var noise = this.$Service('Noise');
		var vectors = {vec2: 2, vec3: 3, vec4: 4};

		function c (value, type) {
			return {Op: 'const', Value: value, Type: type};
		}

		function call (name) {
			return {Op: 'call', Name: name, Args: Array.prototype.slice.call(arguments, 1)};
		}

		function bin (operator, a, b) {
			return {Op: 'bin', Operator: operator, A: a, B: b};
		}

		/* A value of the graph as typed: {E (its expression), T (float, bool, vec2, vec3, vec4, floats: a list of numbers)}. */
		function constant (value, type) {
			if (type === 'floats' || Array.isArray(value) && (value.length < 2 || value.length > 4))
				return Array.isArray(value) && value.every(function (one) {
					return typeof one === 'number';
				}) ? {E: c(value.map(Number), 'floats'), T: 'floats'} : null;

			if (typeof value === 'boolean')
				return {E: c(value, 'bool'), T: 'bool'};

			if (Array.isArray(value) && value.length >= 2 && value.length <= 4 && value.every(function (one) {
				return typeof one === 'number';
			})) return {E: c(value.map(Number), 'vec' + value.length), T: 'vec' + value.length};

			if (typeof value === 'number' || value === undefined || value === null) return {E: c(Number(value) || 0, 'float'), T: 'float'};

			return null;
		}

		/* Kept in a variable of its type: an expression read more than once is made once. */
		function kept (value) {
			var name;

			if (value.E.Op === 'var' || value.E.Op === 'const') return value;

			serial++;
			name = 'k' + serial;

			body.push({Op: 'let', Name: name, Type: value.T, Value: value.E});

			return {E: {Op: 'var', Name: name}, T: value.T};
		}

		function size (type) {
			return vectors[type] || 1;
		}

		/* A value made of the size of another (a number for each part; the parts a vector has not, nought), as Each does. */
		function sized (value, count) {
			var parts = [];
			var at;

			if (size(value.T) === count && (count > 1 || value.T === 'float')) return value;

			if (count === 1)
				return {E: vectors[value.T] ? call('x', value.E) : value.T === 'bool' ? {Op: 'select', Test: value.E, A: c(1, 'float'), B: c(0, 'float')} : value.E, T: 'float'};

			value = kept(value.T === 'bool' ? sized(value, 1) : value);

			for (at = 0; at < count; at++)
				parts.push(vectors[value.T] ? at < size(value.T) ? call(['x', 'y', 'z', 'w'][at], value.E) : c(0, 'float') : value.E);

			return {E: call.apply(null, ['vec' + count].concat(parts)), T: 'vec' + count};
		}

		/* An operation of two by each number (Each of Add, Divide...): both of the size of the larger. */
		function each (a, b, work) {
			var count = Math.max(size(a.T), size(b.T));
			var x = sized(a, count);
			var y = sized(b, count);
			var parts = [];
			var at;

			if (count === 1)
				return {E: work(x.E, y.E), T: 'float'};

			x = kept(x);
			y = kept(y);

			for (at = 0; at < count; at++) {
				var part = ['x', 'y', 'z', 'w'][at];

				parts.push(work(call(part, x.E), call(part, y.E)));
			}

			return {E: call.apply(null, ['vec' + count].concat(parts)), T: 'vec' + count};
		}

		/* As each, of one. */
		function single (a, work) {
			return each(a, {E: c(0, 'float'), T: 'float'}, function (x) {
				return work(x);
			});
		}

		function divide (x, y) {
			/* b ? a / b : 0, as Each of Divide: the divisor once. */
			serial++;

			body.push({Op: 'let', Name: 'd' + serial, Type: 'float', Value: y});

			return {Op: 'select', Test: bin('!=', {Op: 'var', Name: 'd' + serial}, c(0, 'float')), A: bin('/', x, {Op: 'var', Name: 'd' + serial}), B: c(0, 'float')};
		}

		/* The functions of the Kernel of the Noise Service, once, as the noise of a block asks for them. */
		function noiseCall (numbers, point, scale, octaves) {
			var p = kept(sized(point, 3));
			var s = kept(sized(scale, 1));

			if (!helpers.noise) {
				helpers.noise = true;
				functions = functions.concat(noise.IR().Functions);
			}

			return {E: call.apply(null, ['n_read'].concat(numbers.map(function (one, index) {
				if (index === 2 && octaves) return octaves;
				if (one && one.E) return one.E;

				return c(typeof one === 'boolean' ? one : Number(one), typeof one === 'boolean' ? 'bool' : 'float');
			}), [bin('*', call('x', p.E), s.E), bin('*', call('y', p.E), s.E), bin('*', call('z', p.E), s.E)])), T: 'float'};
		}

		/* The functions of the Kernel of the Geometry Service, once, as a block of geometry asks for them. */
		function geometry (name, args) {
			if (!helpers.geometry) {
				helpers.geometry = true;
				functions = functions.concat(self.$Service('Geometry').IR().Functions);
			}

			return call.apply(null, [name].concat(args));
		}

		/* A value as a bool of the IR: a number not 0 is true, as js takes it. */
		function truth (value) {
			return value.T === 'bool' ? value.E : bin('!=', sized(value, 1).E, c(0, 'float'));
		}

		/*
		 * The item of a list of numbers at an index (Item): its whole part, within the list (of an empty list, nought); of a
		 * vector its part so (a list of two to four numbers is a vector), of a number the number.
		 */
		function item (list, index) {
			var at = kept(sized(index, 1));
			var count;
			var made;
			var k;

			/* Of a list and an index both known: the number itself (a Reduce unrolled reads no list: wasm holds none of its own). */
			if (list.T === 'floats' && list.E.Op === 'const' && at.E.Op === 'const')
				return {E: c(list.E.Value.length ? list.E.Value[Math.max(0, Math.min(list.E.Value.length - 1, Math.floor(at.E.Value)))] : 0, 'float'), T: 'float'};

			if (list.T === 'floats') {
				list = kept(list);
				count = kept({E: call('toFloat', {Op: 'length', List: list.E}), T: 'float'});

				return {E: {Op: 'select', Test: bin('>', count.E, c(0, 'float')), A: {Op: 'index', List: list.E, At: call('toInt', call('max', c(0, 'float'), call('min', bin('-', count.E, c(1, 'float')), call('floor', at.E))))}, B: c(0, 'float')}, T: 'float'};
			}

			if (!vectors[list.T])
				return sized(list, 1);

			list = kept(list);
			made = call(['x', 'y', 'z', 'w'][size(list.T) - 1], list.E);

			for (k = size(list.T) - 2; k >= 0; k--)
				made = {Op: 'select', Test: bin('<', at.E, c(k + 1, 'float')), A: call(['x', 'y', 'z', 'w'][k], list.E), B: made};

			return {E: made, T: 'float'};
		}

		/*
		 * A formula of the inputs of its block (Formula), of numbers: as FormulaValue computes it, part by part of a vector, b ? a / b
		 * : 0 of a division; null when a part of it is not of numbers (a text, a name it is not given).
		 */
		function formula (tree, input) {
			var calls = {min: 'min', max: 'max', pow: 'pow'};
			var singles = {floor: 'floor', abs: 'abs', sin: 'sin', cos: 'cos', fract: 'fract', exp: 'exp', acos: 'acos', asin: 'asin', round: 'round', ceil: 'ceil'};

			function value (node) {
				var args;
				var a;
				var b;
				var t;
				var n;

				if (!node)
					return null;

				if (node.Op === 'const')
					return typeof node.Value === 'number' || typeof node.Value === 'boolean' ? constant(node.Value) : null;

				if (node.Op === 'var')
					return input[node.Name] || null;

				if (node.Op === 'list') {
					args = node.Items.map(value);

					if (args.length < 2 || args.length > 4 || args.some(function (one) {
						return !one || vectors[one.T] || one.T === 'floats';
					})) return null;

					return {E: call.apply(null, ['vec' + args.length].concat(args.map(function (one) {
						return sized(one, 1).E;
					}))), T: 'vec' + args.length};
				}

				if (node.Op === 'index') {
					a = value(node.List);
					b = value(node.At);

					if (!a || !b) return null;

					if (a.T === 'floats')
						return {E: {Op: 'index', List: a.E, At: call('toInt', call('floor', sized(b, 1).E))}, T: 'float'};

					return vectors[a.T] && node.At.Op === 'const' ? {E: call(['x', 'y', 'z', 'w'][Math.floor(Number(node.At.Value)) || 0], a.E), T: 'float'} : null;
				}

				if (node.Op === 'select') {
					t = value(node.Test);
					a = value(node.A);
					b = value(node.B);

					if (!t || !a || !b) return null;

					n = Math.max(size(a.T), size(b.T));

					return {E: {Op: 'select', Test: truth(t), A: sized(a, n).E, B: sized(b, n).E}, T: n === 1 ? 'float' : 'vec' + n};
				}

				if (node.Op === 'un') {
					a = value(node.A);

					if (!a)
						return null;

					return node.Operator === '!' ? {E: {Op: 'un', Operator: '!', A: truth(a)}, T: 'bool'} : single(a, function (x) {
						return {Op: 'un', Operator: '-', A: x};
					});
				}

				if (node.Op === 'bin') {
					a = value(node.A);
					b = value(node.B);

					if (!a || !b) return null;

					if (['+', '-', '*'].indexOf(node.Operator) !== -1) {
						return each(a, b, function (x, y) {
							return bin(node.Operator, x, y);
						});
					}

					if (node.Operator === '/')
						return each(a, b, divide);

					if (['<', '<=', '>', '>=', '==', '!='].indexOf(node.Operator) !== -1)
						return {E: bin(node.Operator, sized(a, 1).E, sized(b, 1).E), T: 'bool'};

					return node.Operator === '&&' || node.Operator === '||' ? {E: bin(node.Operator, truth(a), truth(b)), T: 'bool'} : null;
				}

				if (node.Op !== 'call') return null;

				args = (node.Args || []).map(value);

				if (args.some(function (one) {
					return !one;
				})) return null;

				if (calls[node.Name]) {
					return each(args[0], args[1], function (x, y) {
						return call(calls[node.Name], x, y);
					});
				}

				if (singles[node.Name]) {
					return single(args[0], function (x) {
						return call(singles[node.Name], x);
					});
				}

				switch (node.Name) {
					case 'step':
						return each(args[0], args[1], function (e, x) {
							return {Op: 'select', Test: bin('<', x, e), A: c(0, 'float'), B: c(1, 'float')};
						});
					case 'sqrt':
						return single(args[0], function (x) {
							return call('sqrt', call('max', c(0, 'float'), x));
						});
					case 'saturate':
						return single(args[0], function (x) {
							return call('max', c(0, 'float'), call('min', c(1, 'float'), x));
						});
					/* Of numbers: its share between a and b cut to 0..1, s * s * (3 - 2 * s), as FormulaSmooth. */
					case 'smoothstep':
						t = kept(sized(args[0], 1));
						n = kept({E: bin('-', sized(args[1], 1).E, t.E), T: 'float'});
						n = kept({E: call('max', c(0, 'float'), call('min', c(1, 'float'), bin('/', bin('-', sized(args[2], 1).E, t.E), n.E))), T: 'float'});

						return {E: bin('*', bin('*', n.E, n.E), bin('-', c(3, 'float'), bin('*', c(2, 'float'), n.E))), T: 'float'};
					case 'clamp':
						return each(args[1], each(args[2], args[0], function (h, x) {
							return call('min', h, x);
						}), function (l, m) {
							return call('max', l, m);
						});
					case 'mix':
						t = kept(args[0]);

						return each(t, each(each(args[1], t, function (y, x) {
							return bin('-', y, x);
						}), args[2], function (d, k) {
							return bin('*', d, k);
						}), function (x, m) {
							return bin('+', x, m);
						});
					case 'atan2':
						return {E: call('atan2', sized(args[0], 1).E, sized(args[1], 1).E), T: 'float'};
					case 'hypot':
						return {E: call('sqrt', bin('+', call('pow', sized(args[0], 1).E, c(2, 'float')), call('pow', sized(args[1], 1).E, c(2, 'float')))), T: 'float'};
					case 'count':
						return args[0].T === 'floats' ? {E: call('toFloat', {Op: 'length', List: args[0].E}), T: 'float'} : {E: c(size(args[0].T), 'float'), T: 'float'};
					case 'vec2':
					case 'vec3':
					case 'vec4':
						return {E: call.apply(null, [node.Name].concat(args.slice(0, Number(node.Name.charAt(3))).map(function (one) {
							return sized(one, 1).E;
						}))), T: node.Name};
					default:
						return null;
				}
			}

			return value(tree);
		}

		/* The parts of a vector a block of geometry gives, by their names. */
		function parts (value, names) {
			var made = {};
			var t = kept(value);

			names.forEach(function (name, index) {
				made[name] = {E: call(['x', 'y', 'z', 'w'][index], t.E), T: 'float'};
			});

			return made;
		}

		function block (type, input, properties) {
			var mathEach = {Add: '+', Subtract: '-', Multiply: '*'};
			var binary = {Min: 'min', Max: 'max', Pow: 'pow'};
			var singles = {Sin: 'sin', Cos: 'cos', Abs: 'abs', Floor: 'floor', Exp: 'exp'};
			var whole;
			var t;

			if (mathEach[type]) {
				return {Out: each(input.A, input.B, function (x, y) {
					return bin(mathEach[type], x, y);
				})};
			}

			if (type === 'Divide')
				return {Out: each(input.A, input.B, divide)};

			if (binary[type]) {
				return {Out: each(input.A, input.B, function (x, y) {
					return call(binary[type], x, y);
				})};
			}

			if (type === 'Step') {
				return {Out: each(input.A, input.B, function (x, y) {
					return {Op: 'select', Test: bin('<', y, x), A: c(0, 'float'), B: c(1, 'float')};
				})};
			}

			if (singles[type]) {
				return {Out: single(input.X, function (x) {
					return call(singles[type], x);
				})};
			}

			switch (type) {
				case 'Fract':
					return {Out: single(input.X, function (x) {
						return call('fract', x);
					})};
				case 'Sqrt':
					return {Out: single(input.X, function (x) {
						return call('sqrt', call('max', c(0, 'float'), x));
					})};
				case 'OneMinus':
					return {Out: single(input.X, function (x) {
						return bin('-', c(1, 'float'), x);
					})};
				case 'Saturate':
					return {Out: single(input.X, function (x) {
						return call('max', c(0, 'float'), call('min', c(1, 'float'), x));
					})};
				case 'Mix':
					/* A + (B - A) * T, each by each, as its Each: T a number or a vector. */
					t = kept(input.A);

					return {Out: each(t, each(each(input.B, t, function (b, a) {
						return bin('-', b, a);
					}), input.T, function (d, k) {
						return bin('*', d, k);
					}), function (a, m) {
						return bin('+', a, m);
					})};
				case 'Clamp':
					return {Out: each(input.Low, each(input.High, input.X, function (h, x) {
						return call('min', h, x);
					}), function (l, m) {
						return call('max', l, m);
					})};
				case 'Smoothstep':
					t = kept(each(each(input.X, input.Low, function (x, l) {
						return bin('-', x, l);
					}), each(input.High, input.Low, function (h, l) {
						return bin('-', h, l);
					}), function (a, d) {
						serial++;

						body.push({Op: 'let', Name: 'd' + serial, Type: 'float', Value: d});

						return call('max', c(0, 'float'), call('min', c(1, 'float'), bin('/', a, {Op: 'select', Test: bin('==', {Op: 'var', Name: 'd' + serial}, c(0, 'float')), A: c(1, 'float'), B: {Op: 'var', Name: 'd' + serial}})));
					}));

					return {Out: each(t, t, function (a) {
						return bin('*', bin('*', a, a), bin('-', c(3, 'float'), bin('*', c(2, 'float'), a)));
					})};
				case 'Combine':
					return {
						XYZW: {E: call('vec4', sized(input.X, 1).E, sized(input.Y, 1).E, sized(input.Z, 1).E, sized(input.W, 1).E), T: 'vec4'},
						XYZ: {E: call('vec3', sized(input.X, 1).E, sized(input.Y, 1).E, sized(input.Z, 1).E), T: 'vec3'},
						XY: {E: call('vec2', sized(input.X, 1).E, sized(input.Y, 1).E), T: 'vec2'}
					};
				case 'Split':
					t = kept(input.Vector);

					return {X: sized(t, 1), Y: {E: vectors[t.T] ? call('y', t.E) : c(0, 'float'), T: 'float'}, Z: {E: size(t.T) > 2 ? call('z', t.E) : c(0, 'float'), T: 'float'}, W: {E: size(t.T) > 3 ? call('w', t.E) : c(0, 'float'), T: 'float'}};
				case 'Compare':
					return {Out: {E: bin({'==': '==', '!=': '!=', '<': '<', '<=': '<=', '>': '>', '>=': '>='}[properties.Operator || '=='] || '==', sized(input.A, 1).E, sized(input.B, 1).E), T: 'bool'}};
				case 'And':
				case 'Or':
					return {Out: {E: bin(type === 'And' ? '&&' : '||', input.A.E, input.B.E), T: 'bool'}};
				case 'Not':
					return {Out: {E: {Op: 'un', Operator: '!', A: input.X.E}, T: 'bool'}};
				case 'Select':
					t = Math.max(size(input.A.T), size(input.B.T));

					return {Out: {E: {Op: 'select', Test: input.Test.E, A: sized(input.A, t).E, B: sized(input.B, t).E}, T: t === 1 ? 'float' : 'vec' + t}};
				case 'Line':
					return input.Points.T === 'floats' ? parts({E: geometry('geo_line', [input.Points.E, sized(input.X, 1).E, sized(input.Z, 1).E]), T: 'vec4'}, ['Distance', 'T', 'Side', 'Segment']) : null;
				case 'Area':
					return input.Points.T === 'floats' ? parts({E: geometry('geo_area', [input.Points.E, sized(input.X, 1).E, sized(input.Z, 1).E]), T: 'vec2'}, ['Inside', 'Distance']) : null;
				case 'Level':
					return input.Points.T === 'floats' && input.Levels.T === 'floats' ? {Level: {E: geometry('geo_level', [input.Points.E, input.Levels.E, sized(input.X, 1).E, sized(input.Z, 1).E]), T: 'float'}} : null;
				case 'Formula':
					try {
						t = formula(self.Formula(properties.Expression).Tree, input);
					}
					catch (error) {
						t = null;
					}

					return t ? {Value: t} : null;
				case 'Grid':
					return input.Data.T === 'floats' ? parts({E: geometry('geo_grid', [input.Data.E, sized(input.Side, 1).E, sized(input.Radius, 1).E, sized(input.X, 1).E, sized(input.Z, 1).E]), T: 'vec2'}, ['Value', 'Inside']) : null;
				case 'TunnelWall':
					return input.Points.T === 'floats' ? parts({E: geometry('geo_tunnel', [input.Points.E].concat(['X', 'Y', 'Z', 'Radius', 'Flat', 'Width', 'Height', 'Corner'].map(function (key) {
						return sized(input[key], 1).E;
					}))), T: 'vec2'}, ['Distance', 'Axis']) : null;
				case 'PassageWalls':
					return input.Packed.T === 'floats' ? parts({E: geometry('geo_passages', [input.Packed.E].concat(['X', 'Y', 'Z', 'Blend', 'Crust', 'Ground'].map(function (key) {
						return sized(input[key], 1).E;
					}))), T: 'vec2'}, ['Distance', 'Floor']) : null;
				case 'Fall':
					return {Out: {E: geometry('geo_fall', [sized(input.Distance, 1).E, sized(input.Radius, 1).E]), T: 'float'}};
				case 'Nearest':
					return input.Points.T === 'floats' ? parts({E: geometry('geo_nearest', [input.Points.E, sized(input.X, 1).E, sized(input.Y, 1).E, sized(input.Z, 1).E]), T: 'vec4'}, ['Index', 'Near', 'Next', 'Other']) : null;
				case 'Edits':
					return input.Packed.T === 'floats' && input.Softs.T === 'floats' ? {Height: {E: geometry('geo_edits', [input.Packed.E, input.Softs.E].concat(['X', 'Y', 'Z', 'Height'].map(function (key) {
						return sized(input[key], 1).E;
					}))), T: 'float'}} : null;
				case 'River':
					return input.Packed.T === 'floats' ? parts({E: geometry('geo_river', [input.Packed.E].concat(['X', 'Y', 'Z', 'Radius', 'Width', 'Bend'].map(function (key) {
						return sized(input[key], 1).E;
					}))), T: 'vec3'}, ['Far', 'Flow', 'Level']) : null;
				case 'Strokes':
					return input.Packed.T === 'floats' ? {Value: {E: geometry('geo_strokes', [input.Packed.E, sized(input.X, 1).E, sized(input.Y, 1).E, sized(input.Z, 1).E]), T: 'float'}} : null;
				case 'Painted':
					return input.Packed.T === 'floats' ? {Value: {E: geometry('geo_painted', [input.Packed.E, sized(input.X, 1).E, sized(input.Y, 1).E, sized(input.Z, 1).E]), T: 'float'}} : null;
				/* An item of a list of numbers (its index cut to a whole one within it; of none, nought), of a vector its part. */
				case 'Item':
					return {Value: item(input.List, input.Index)};
				case 'Count':
					return {Count: input.List.T === 'floats' && input.List.E.Op === 'const' ? {E: c(input.List.E.Value.length, 'float'), T: 'float'} : input.List.T === 'floats' ? {E: call('toFloat', {Op: 'length', List: input.List.E}), T: 'float'} : {E: c(size(input.List.T), 'float'), T: 'float'}};
				case 'NoiseSpec':
					whole = noise.Numbers(noise.Whole(self.NoiseOf(properties)));

					/* Its octaves linked (not the nought of none): of their number, as Noise takes it (1 to 10, rounded); under a half, its property's. */
					if (input.Octaves && !(input.Octaves.E.Op === 'const' && !input.Octaves.E.Value)) {
						t = kept(sized(input.Octaves, 1));
						t = call('toInt', {Op: 'select', Test: bin('>=', t.E, c(0.5, 'float')), A: call('max', c(1, 'float'), call('min', c(10, 'float'), call('floor', bin('+', t.E, c(0.5, 'float'))))), B: c(Number(whole[2]), 'float')});
					}
					else {
						t = null;
					}

					/* Its seed linked (a number, as Math.SeedOffset gives it): in the place of the one of its property. */
					if (input.Seed && !(input.Seed.E.Op === 'const' && !input.Seed.E.Value))
						whole = whole.slice(0, 9).concat([kept(sized(input.Seed, 1))]).concat(whole.slice(10));

					return {Value: noiseCall(whole, input.Position, input.Scale, t)};
				case 'Noise':
				case 'Fbm':
				case 'Ridge':
					/* Math.Noise: the value noise of the Noise Service of no seed, its fbm (or ridged) of 2.03 and 0.5 (Value: of one octave). */
					whole = noise.Whole({Type: 'value', Fractal: type === 'Noise' ? 'none' : type === 'Ridge' ? 'ridged' : 'fbm', Octaves: type === 'Noise' ? 1 : Math.max(1, Math.round(Number(properties.Octaves) || 4)), Lacunarity: 2.03, Gain: 0.5});

					return {Value: noiseCall(noise.Numbers(whole), input.Position, input.Scale)};
				default:
					return null;
			}
		}

		if (read.type !== 'generator')
			return {Diagnostics: [{File: '', Line: 0, Column: 0, Severity: 'error', Text: 'Elemenx Blueprints: Numeric makes a generator, not a ' + read.type + ' graph'}]};

		plan = this.Plan(read);

		(read.parameters || []).forEach(function (parameter) {
			defaults[parameter.key] = parameter.value;
		});

		/* Whether an output of a block goes to one formula alone, read there once (its expression may stand in its place). */
		function once (id, key) {
			var readers = [];
			var count = 0;

			Object.keys(plan.From).forEach(function (reader) {
				Object.keys(plan.From[reader] || {}).forEach(function (input) {
					var from = plan.From[reader][input];
					if (needed[reader] && from.Block === id && from.Key === key)
						readers.push({Block: reader, Input: input});
				});
			});

			if (readers.length !== 1 || plan.Blocks[readers[0].Block].type !== 'Formula') return false;

			try {
				JSON.stringify(self.Formula(self.Properties(plan.Blocks[readers[0].Block]).Expression).Tree, function (name, value) {
					if (value && value.Op === 'var' && value.Name === readers[0].Input)
						count++;

					return value;
				});
			}
			catch (error) {
				return false;
			}

			return count === 1;
		}

		function need (id) {
			if (needed[id]) return;

			needed[id] = true;

			Object.keys(plan.From[id] || {}).forEach(function (key) {
				need(plan.From[id][key].Block);
			});
		}

		plan.Order.forEach(function (id) {
			if (plan.Blocks[id].type === 'Result' && plan.Blocks[id].enabled !== false && (!keys || keys.indexOf(self.Properties(plan.Blocks[id]).Key || 'Value') !== -1))
				need(id);
		});

		/*
		 * The block of When each block is made in: the innermost one whose Value alone needs it (none: the function itself).
		 * Neither an Input nor a Parameter: they are no statements, and the inputs keep their order.
		 */
		(function () {
			var readers = {};
			var sizes = {};

			Object.keys(plan.From).forEach(function (reader) {
				Object.keys(plan.From[reader] || {}).forEach(function (input) {
					var from = plan.From[reader][input];

					if (!needed[reader]) return;

					(readers[from.Block] = readers[from.Block] || []).push({Block: reader, Input: input});
				});
			});

			plan.Order.forEach(function (id) {
				var cone = {};
				var changed = true;
				var count = 0;

				if (!needed[id] || plan.Blocks[id].type !== 'When' || plan.Blocks[id].enabled === false || !(plan.From[id] || {}).Value) return;

				(function mark (block) {
					if (cone[block] !== undefined || ['Input', 'Parameter'].indexOf(plan.Blocks[block].type) !== -1) return;

					cone[block] = true;

					Object.keys(plan.From[block] || {}).forEach(function (key) {
						mark(plan.From[block][key].Block);
					});
				})(plan.From[id].Value.Block);

				while (changed) {
					changed = false;

					Object.keys(cone).forEach(function (block) {
						if (!cone[block]) return;

						if ((readers[block] || []).every(function (one) {
							return one.Block === id ? one.Input === 'Value' : cone[one.Block] === true;
						})) return;

						cone[block] = false;
						changed = true;
					});
				}

				Object.keys(cone).forEach(function (block) {
					if (cone[block])
						count++;
				});

				sizes[id] = count;

				Object.keys(cone).forEach(function (block) {
					if (cone[block] && (!owner[block] || sizes[owner[block]] > count))
						owner[block] = id;
				});
			});
		})();

		function make (id) {
			var node = plan.Nodes[id];
			var piece = plan.Blocks[id];
			var properties = this.Properties(piece);
			var input = {};
			var made;
			var failed = false;
			var outer = body;
			var inner = [];
			var n;
			var t;
			var name;
			var value;

			if (!needed[id] || !node || diagnostics.length) return;

			/* Of When: first what its Value alone needs, in a body of its own (its if). */
			if (piece.type === 'When' && piece.enabled !== false) {
				body = inner;

				plan.Order.forEach(function (one) {
					if (owner[one] === id)
						make.call(this, one);
				}, this);

				body = outer;
			}

			named[id] = {};

			(this.Inputs(node, piece) || []).forEach(function (one) {
				var from = plan.From[id][one.Key];

				if (from && named[from.Block] && named[from.Block][from.Key]) input[one.Key] = named[from.Block][from.Key];
				else input[one.Key] = constant(one.Value === undefined ? one.Type === 'floats' ? [] : 0 : self.Cast(one.Value, null, one.Type), one.Type) || (failed = true, null);
			});

			if (failed) {
				diagnostics.push({File: '', Line: 0, Column: 0, Severity: 'error', Text: 'Elemenx Blueprints: a value of ' + piece.type + ' is not of numbers', Block: id});

				return;
			}

			if (piece.type === 'Result') {
				results.push({Key: properties.Key || 'Value', Value: input.Value});

				return;
			}

			if (piece.type === 'Parameter') {
				made = {Value: constant(Object.prototype.hasOwnProperty.call(given, properties.Key) ? given[properties.Key] : defaults[properties.Key], kinds[properties.Key] || (properties.Type === 'floats' ? 'floats' : undefined))};
			}
			else if (piece.type === 'Input') {
				if (!inputs.some(function (one) {
					return one.Name === properties.Name;
				}))
					inputs.push({Name: String(properties.Name), Type: kinds[properties.Name] || 'float'});

				made = {Value: {E: {Op: 'var', Name: 'i_' + String(properties.Name).replace(/[^A-Za-z0-9_]/g, '_')}, T: kinds[properties.Name] || 'float'}};
			}
			else if (piece.enabled === false) {
				made = {};

				(this.Outputs(node, piece) || []).forEach(function (output) {
					var passed = self.Passed(plan, id)[output.Key];

					made[output.Key] = passed ? input[passed] : constant(0);
				});
			}
			else if (piece.type === 'When') {
				n = Math.max(size(input.Value.T), size(input.Else.T));
				t = n === 1 ? 'float' : 'vec' + n;
				serial++;
				name = 'w' + serial;

				body.push({Op: 'let', Name: name, Type: t, Value: sized(input.Else, n).E});

				body = inner;
				value = sized(input.Value, n).E;
				body = outer;

				body.push({Op: 'if', Test: truth(input.Test), Then: inner.concat([{Op: 'set', Name: name, Value: value}])});

				made = {Out: {E: {Op: 'var', Name: name}, T: t}};
			}
			/*
			 * A block of another Library of numbers (Numeric of its definition): its outputs of its inputs as expressions of the
			 * IR ({E, T}), the functions of a module of its own (Kernel of the kit: a Kernel of the kernel language) in the
			 * module once.
			 */
			else if (typeof node.Numeric === 'function') {
				made = node.Numeric.call(this, input, properties, {
					Call: call,
					Const: c,
					Binary: bin,
					Sized: sized,
					Parts: parts,
					Kernel: function (key, module) {
						if (!helpers['kernel:' + key]) {
							helpers['kernel:' + key] = true;
							functions = functions.concat(module.Functions.filter(function (one) {
								return !functions.some(function (had) {
									return had.Name === one.Name;
								});
							}));
						}
					}
				});
			}
			else if (!(this.Inputs(node, piece) || []).length && ['Time', 'Random'].indexOf(piece.type) === -1 && typeof node.Compute === 'function') {
				made = {};

				var computed = node.Compute.call(this, {}, properties, {Graph: read, Parameters: {}, Inputs: {}}) || {};

				(this.Outputs(node, piece) || []).forEach(function (output) {
					made[output.Key] = constant(computed[output.Key]);
				});
			}
			else {
				made = block(piece.type, input, properties);
			}

			if (!made || Object.keys(made).some(function (key) {
				return !made[key];
			})) {
				diagnostics.push({File: '', Line: 0, Column: 0, Severity: 'error', Text: 'Elemenx Blueprints: a block ' + piece.type + ' is not of numbers', Block: id});

				return;
			}

			/*
			 * Each output a variable of its type; one a formula reads once, and nothing else, its expression in its place: in a
			 * branch of ?: it is computed only when that branch is (a noise by the walls of a cave alone). Regression: the noises
			 * of a cave were computed at every point, the graph slower than the code it was made of.
			 */
			Object.keys(made).forEach(function (key) {
				named[id][key] = once(id, key) ? made[key] : kept(made[key]);
			});
		}

		plan.Order.forEach(function (id) {
			if (!owner[id])
				make.call(this, id);
		}, this);

		if (!diagnostics.length && (!results.length || results.length > 4 || results.length > 1 && results.some(function (one) {
			return one.Value.T !== 'float';
		})))
			diagnostics.push({File: '', Line: 0, Column: 0, Severity: 'error', Text: 'Elemenx Blueprints: a generator of numbers gives one to four numbers, or one vector'});

		if (diagnostics.length)
			return {Diagnostics: diagnostics};

		body.push({Op: 'return', Value: results.length === 1 ? results[0].Value.E : call.apply(null, ['vec' + results.length].concat(results.map(function (one) {
			return one.Value.E;
		})))});

		/* Each function once: the Kernels of blocks of other Libraries may hold those of the noise too. */
		var named = {};

		functions.forEach(function (one) {
			if (!named[one.Name])
				named[one.Name] = one;
		});

		/*
		 * Only what it calls, and what that calls. Regression: a block of a Kernel brought the whole noise it is written on
		 * (its worley, simplex, fractals...) into a shader that read one function of it: the shaders of a galaxy took a
		 * minute to make.
		 */
		var called = {};

		function walk (node) {
			if (!node || typeof node !== 'object') return;

			if (Array.isArray(node)) {
				node.forEach(walk);

				return;
			}

			if (node.Op === 'call' && named[node.Name] && !called[node.Name]) {
				called[node.Name] = true;

				walk(named[node.Name].Body);
			}

			Object.keys(node).forEach(function (key) {
				walk(node[key]);
			});
		}

		walk(body);

		return {
			Module: {Functions: [{Name: 'g_main', Params: inputs.map(function (one) {
				return {Name: 'i_' + one.Name.replace(/[^A-Za-z0-9_]/g, '_'), Type: one.Type};
			}), Returns: results.length === 1 ? results[0].Value.T : 'vec' + results.length, Body: body}].concat(Object.keys(named).filter(function (name) {
				return called[name];
			}).map(function (name) {
				return named[name];
			})), Entry: 'g_main'},
			Inputs: inputs,
			Keys: results.map(function (one) {
				return one.Key;
			}),
			Returns: results.length === 1 ? results[0].Value.T : 'vec' + results.length,
			Diagnostics: []
		};
	},

	/*
	 * A generator of numbers (Numeric) made js, its parameters fixed to values: {Source (the body of a function of (B, M, N),
	 * as Code gives it, so a worker makes it of the text: a function (parameters, inputs) of its results, its Main the
	 * function of the graph itself of its inputs in their order, of one result or a vector of them; the parameters are
	 * those it was made of), Run (that function), Keys, Numeric (what Numeric gave, for wasm: Wasm(made))}; null when it is
	 * not of numbers. Made once for the same graph and values. Regression: a ground of a graph of relief read its noise by
	 * its spec made a text at each point, 30 microseconds a height.
	 */
	NumericCode: function (graph, values, types, keys) {
		var read = this.Read(graph);
		/*
		 * Of the values of its parameters too (Hash leaves them out). Regression: two grounds of one seed and other scales had
		 * the function of the first, their heights wrong.
		 */
		var key = this.Hash(read) + JSON.stringify((read.parameters || []).map(function (parameter) {
			return [parameter.key, parameter.value];
		})) + JSON.stringify(values || {}) + JSON.stringify(types || {}) + JSON.stringify(keys || null);
		var made;
		var text = null;
		var source;
		var fields;

		this.NumericMade = this.NumericMade || {};

		if (this.NumericMade[key] !== undefined) return this.NumericMade[key];

		made = this.Numeric(graph, values, types, keys);
		this.NumericMade[key] = null;

		if (made.Diagnostics.length || typeof Elemenx === 'undefined' || !Elemenx.Compilers) return null;

		Elemenx.Compilers.Run({From: 'ir', To: 'js', Value: made.Module, Entry: 'generator'}, function (error, result) {
			if (!error)
				text = result.Value;
		});

		if (text === null) return null;

		fields = made.Keys.map(function (key, index) {
			return JSON.stringify(key) + ': ' + (made.Keys.length === 1 ? 'r' : 'r[' + index + ']');
		}).join(', ');

		source = 'var m = (function () {\n' + text + '\n})();\nvar run = function (P, I) {\n\tvar r = m.g_main(' + made.Inputs.map(function (one) {
			return 'I[' + JSON.stringify(one.Name) + ']';
		}).join(', ') + ');\n\n\treturn {' + fields + '};\n};\n\nrun.Main = m.g_main;\n\nreturn run;';

		this.NumericMade[key] = {Source: source, Run: new Function('B', 'M', 'N', source)(), Keys: made.Keys, Numeric: made};

		return this.NumericMade[key];
	},

	/*
	 * A generator of numbers as wasm (Numeric of NumericCode): {Bytes, Exports} for Elemenx.Compilers.Instance, its g_main
	 * in batches too (batch:g_main: its inputs, one run after another); null where wasm cannot be made.
	 */
	Wasm: function (made) {
		var bytes = null;

		if (!made || !made.Module || typeof Elemenx === 'undefined' || !Elemenx.Compilers || typeof WebAssembly === 'undefined') return null;

		if (made.Wasm !== undefined) return made.Wasm;

		Elemenx.Compilers.Run({From: 'ir', To: 'wasm', Value: made.Module, Entry: 'generator', Options: {Batch: ['g_main']}}, function (error, result) {
			if (!error)
				bytes = result.Value;
		});

		made.Wasm = bytes;

		return bytes;
	},

	/*
	 * The numbers of a seed one after another, the index-th of them (0 to 1, 0 the first): each the FNV-1a of the seed and
	 * the one before ('seed:state'), of five places; the same in any language (what the plates of a planet were made of).
	 */
	Chain: function (seed, index) {
		var key = String(seed);
		var at = Math.max(0, Math.floor(Number(index) || 0));
		var list;
		var state;

		this.Chains = this.Chains || {};
		list = this.Chains[key] = this.Chains[key] || {States: [2166136261], Values: []};

		while (list.Values.length <= at) {
			var text = key + ':' + list.States[list.States.length - 1];
			var value = 2166136261;
			var k;

			for (k = 0; k < text.length; k++)
				value = Math.imul(value ^ text.charCodeAt(k), 16777619);

			state = value >>> 0;

			list.States.push(state);
			list.Values.push((state % 100000) / 100000);
		}

		return list.Values[at];
	},

	/* A number 0 to 1 of two values (of text or numbers), the very one rt_hash(rt_key(a), rt_key(b)) of the IR in JavaScript gives. */
	Hash2: function (a, b) {
		function key (value) {
			var text;
			var hash = 0;
			var i;

			if (typeof value === 'number')
				return Math.round(value * 1000) | 0;

			text = String(value);

			for (i = 0; i < text.length; i++)
				hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;

			return hash;
		}

		var h = Math.imul(key(a) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(key(b) + 0x632be5ab, 0xc2b2ae35);

		h ^= h >>> 15;
		h = Math.imul(h, 0x2c1b3c6d);
		h ^= h >>> 12;

		return (h >>> 0) / 4294967296;
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

						return self.Calling(function () {
							plan.Order.forEach(function (id) {
								var block = plan.Blocks[id];
								if (block.type !== 'Result' || block.enabled === false) return;

								result[self.Properties(block).Key || 'Value'] = self.Gather(plan, id, run).Value;
							});

							return result;
						});
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

		/* A tree of behaviour from its Root (Agent): the blocks of numbers of a generator give its scores and its tests. */
		this.Graph('behaviour', {
			End: 'Root',
			Uses: ['generator'],
			Compile: function (plan) {
				return {
					Agent: function (context) {
						return self.Behaviour(plan, context, this.Parameters);
					}
				};
			}
		});

		/*
		 * The blocks of a tree of behaviour: each has a Score (what it is worth to a Utility over it: 1 by default) and an
		 * In; one that holds others has Children (linked to as many as it holds, in the order they stand, top first).
		 */
		var tree = ['behaviour'];
		var score = {Key: 'Score', Type: 'float', Value: 1};

		this.Node('Root', {Graphs: tree, Group: 'behaviour', Flow: {Out: ['Children']}, Inputs: []});
		this.Node('Selector', {Graphs: tree, Group: 'behaviour', Comment: 'The first child that does not fail', Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Steps', {Graphs: tree, Group: 'behaviour', Comment: 'Its children one after another, till one fails', Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Parallel', {Graphs: tree, Group: 'behaviour', Comment: 'All its children at once: done when all are (Need all) or one is (Need one)', Properties: [{Key: 'Need', Type: 'select', Options: ['all', 'one'], Value: 'all'}], Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Utility', {Graphs: tree, Group: 'behaviour', Comment: 'The child of the greatest Score, kept Commit seconds, left for one worth Switch times as much', Properties: [{Key: 'Commit', Type: 'number', Value: 1, Min: 0}, {Key: 'Switch', Type: 'number', Value: 1.2, Min: 1}], Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Condition', {Graphs: tree, Group: 'behaviour', Comment: 'Its child while Test holds, else fails', Flow: {In: ['In'], Out: ['Children']}, Inputs: [{Key: 'Test', Type: 'bool', Value: true}, score]});
		this.Node('Invert', {Graphs: tree, Group: 'behaviour', Comment: 'Its child, a success a failure and the other way', Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Cooldown', {Graphs: tree, Group: 'behaviour', Comment: 'Its child, then fails for Seconds', Properties: [{Key: 'Seconds', Type: 'number', Value: 1, Min: 0}], Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Limit', {Graphs: tree, Group: 'behaviour', Comment: 'Its child for Seconds at most, then fails', Properties: [{Key: 'Seconds', Type: 'number', Value: 5, Min: 0}], Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Loop', {Graphs: tree, Group: 'behaviour', Comment: 'Its child again and again (Count times; 0: for ever), till it fails', Properties: [{Key: 'Count', Type: 'number', Value: 0, Min: 0}], Flow: {In: ['In'], Out: ['Children']}, Inputs: [score]});
		this.Node('Wait', {Graphs: tree, Group: 'behaviour', Comment: 'Running for Seconds, then a success', Flow: {In: ['In']}, Inputs: [{Key: 'Seconds', Type: 'float', Value: 1}, score]});
		this.Node('Remember', {Graphs: tree, Group: 'behaviour', Comment: 'Writes Value into what the agent knows by Name', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Flow: {In: ['In']}, Inputs: [{Key: 'Value', Type: 'any'}, score]});
		this.Node('Task', {Graphs: tree, Group: 'behaviour', Comment: 'What the application does by Name', Properties: [{Key: 'Name', Type: 'text', Value: ''}], Flow: {In: ['In']}, Inputs: [{Key: 'Value', Type: 'any'}, score]});

		/*
		 * A response of a number of 0 to 1 (what a Score is made of, as in a utility of an agent): Shape linear (Slope X +
		 * Shift), power (X to the Exponent), logistic (an S round Shift, Steep its steepness), step (1 from Shift on), Invert
		 * one minus it; the end kept to 0 to 1.
		 */
		this.Node('Response', {Graphs: numeric, Group: 'math', Comment: 'A curve of a number of 0 to 1: linear, power, logistic or step', Properties: [{Key: 'Shape', Type: 'select', Options: ['linear', 'power', 'logistic', 'step'], Value: 'linear'}, {Key: 'Slope', Type: 'number', Value: 1}, {Key: 'Exponent', Type: 'number', Value: 2}, {Key: 'Shift', Type: 'number', Value: 0}, {Key: 'Steep', Type: 'number', Value: 10}, {Key: 'Invert', Type: 'bool', Value: false}], Inputs: [{Key: 'X', Type: 'float', Value: 0}], Outputs: [{Key: 'Out', Type: 'float'}],
			Compute: function (inputs, properties) {
				var x = Math.max(0, Math.min(1, Number(inputs.X) || 0));
				var shape = properties.Shape || 'linear';
				var shift = Number(properties.Shift) || 0;
				var out = shape === 'power' ? Math.pow(x, Number(properties.Exponent) || 1) : shape === 'logistic' ? 1 / (1 + Math.exp(-(Number(properties.Steep) || 10) * (x - (shift || 0.5)))) : shape === 'step' ? x >= shift ? 1 : 0 : x * (properties.Slope === undefined ? 1 : Number(properties.Slope)) + shift;

				out = Math.max(0, Math.min(1, out));

				return {Out: properties.Invert === true || properties.Invert === 'true' ? 1 - out : out};
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
		this.Node('Parameter', {Graphs: '*', Group: 'value', Properties: [{Key: 'Key', Type: 'text', Value: ''}, {Key: 'Type', Type: 'select', Options: ['float', 'vec2', 'vec3', 'vec4', 'bool', 'int', 'text', 'any', 'floats'], Value: 'float'}],
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

		[['Min', Math.min], ['Max', Math.max], ['Pow', function (a, b) {
			return self.Math().pow(a, b);
		}], ['Step', function (edge, x) {
			return x < edge ? 0 : 1;
		}]].forEach(function (one) {
			self.Node(one[0], {Graphs: numeric, Group: 'math', Inputs: [{Key: 'A', Type: 'same', Value: 0}, {Key: 'B', Type: 'same', Value: one[0] === 'Pow' ? 1 : 0}], Outputs: [{Key: 'Out', Type: 'same'}],
				Compute: function (inputs) {
					return {Out: self.Each(inputs.A, inputs.B, one[1])};
				}
			});
		});

		[['Sin', 'sin', function (x) {
			return self.Math().sin(x);
		}], ['Cos', 'cos', function (x) {
			return self.Math().cos(x);
		}], ['Abs', 'abs', Math.abs], ['Floor', 'floor', Math.floor], ['Fract', 'fract', function (x) {
			return x - Math.floor(x);
		}], ['Sqrt', 'sqrt', function (x) {
			return Math.sqrt(Math.max(0, x));
		}], ['Exp', 'exp', function (x) {
			return self.Math().exp(x);
		}], ['OneMinus', '1.0 - ', function (x) {
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

		/*
		 * Its Value when Test holds (a number not 0), else Else: what only its Value needs is computed only then (Numeric: inside
		 * an if), a detail finer than is asked skipped as the code skipped it.
		 */
		this.Node('When', {Graphs: numeric, Group: 'logic', Inputs: [{Key: 'Test', Type: 'float', Value: 0}, {Key: 'Value', Type: 'same', Value: 0}, {Key: 'Else', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'same'}],
			Compute: function (inputs) {
				return {Out: inputs.Test ? inputs.Value : inputs.Else};
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

		/* A value of keys over a number (time most often): an animation of a parameter drawn as a curve. */
		this.Node('Curve', {Graphs: numeric, Group: 'math', Properties: [{Key: 'Keys', Type: 'object', Value: [[0, 0], [1, 1]]}, {Key: 'Smooth', Type: 'select', Options: ['linear', 'smooth', 'step'], Value: 'smooth'}, {Key: 'Loop', Type: 'number', Value: 0}], Inputs: [{Key: 'X', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs, properties) {
				return {Value: self.CurveAt(properties.Keys, Number(inputs.X) || 0, properties.Smooth, Number(properties.Loop) || 0)};
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

		/* Ridges of the value noise (Math.Noise Ridge): the folds of mountains. */
		this.Node('Ridge', {Graphs: numeric, Group: 'noise', Properties: [{Key: 'Octaves', Type: 'number', Value: 4, Min: 1, Max: 8}], Inputs: [{Key: 'Position', Type: 'vec3', Value: 0}, {Key: 'Scale', Type: 'float', Value: 1}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs, properties) {
				var p = inputs.Position;

				return {Value: noiseOf().Ridge(p[0] * inputs.Scale, p[1] * inputs.Scale, p[2] * inputs.Scale, Math.max(1, Math.round(Number(properties.Octaves) || 4)))};
			}
		});

		/* A noise of any algorithm of the Noise Service, by its spec: the same as a ground, a texture or a shader made of it. */
		/* Octaves: linked, its number of octaves instead of its property's (one code for planets of other detail); 0, its property. */
		this.Node('NoiseSpec', {Graphs: numeric, Group: 'noise', Properties: self.NoiseProperties(), Inputs: [{Key: 'Position', Type: 'vec3', Value: 0}, {Key: 'Scale', Type: 'float', Value: 1}, {Key: 'Octaves', Type: 'float', Value: 0}, {Key: 'Seed', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs, properties) {
				var p = inputs.Position;
				var whole;
				var spec = Number(inputs.Octaves) ? Object.assign(self.NoiseOf(properties), {Octaves: Number(inputs.Octaves)}) : self.NoiseOf(properties);
				var key = JSON.stringify(spec);
				var samplers = self.Samplers = self.Samplers || {};

				/* Of a seed given as a number (as Math.SeedOffset gives it), in the place of the one of its property. */
				if (Number(inputs.Seed)) {
					whole = Object.assign(self.$Service('Noise').Whole(spec), {Seed: Number(inputs.Seed)});

					return {Value: self.$Service('Noise').Read(whole, p[0] * inputs.Scale, p[1] * inputs.Scale, p[2] * inputs.Scale)};
				}

				samplers[key] = samplers[key] || self.$Service('Noise').Make(spec);

				return {Value: samplers[key].At(p[0] * inputs.Scale, p[1] * inputs.Scale, p[2] * inputs.Scale)};
			}
		});

		/*
		 * Geometry: of a line, an area or points as lists of numbers (floats: x, z by twos; points of space by threes), the
		 * functions of the Geometry Service (its Kernel: the same in js, wasm and a shader).
		 */
		this.Node('Line', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Points', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Distance', Type: 'float'}, {Key: 'T', Type: 'float'}, {Key: 'Side', Type: 'float'}, {Key: 'Segment', Type: 'float'}],
			Compute: function (inputs) {
				return self.$Service('Geometry').Line(inputs.Points || [], Number(inputs.X) || 0, Number(inputs.Z) || 0);
			}
		});

		this.Node('Area', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Points', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Inside', Type: 'float'}, {Key: 'Distance', Type: 'float'}],
			Compute: function (inputs) {
				var made = self.$Service('Geometry').Area(inputs.Points || [], Number(inputs.X) || 0, Number(inputs.Z) || 0);

				return {Inside: made.Inside ? 1 : 0, Distance: made.Distance};
			}
		});

		this.Node('Level', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Points', Type: 'floats', Value: []}, {Key: 'Levels', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Level', Type: 'float'}],
			Compute: function (inputs) {
				return {Level: self.$Service('Geometry').Level(inputs.Points || [], inputs.Levels || [], Number(inputs.X) || 0, Number(inputs.Z) || 0)};
			}
		});

		this.Node('Grid', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Data', Type: 'floats', Value: []}, {Key: 'Side', Type: 'float', Value: 2}, {Key: 'Radius', Type: 'float', Value: 1}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}, {Key: 'Inside', Type: 'float'}],
			Compute: function (inputs) {
				var made = self.$Service('Geometry').Grid(inputs.Data || [], Number(inputs.Side) || 2, Number(inputs.Radius) || 0, Number(inputs.X) || 0, Number(inputs.Z) || 0);

				return {Value: made.Value, Inside: made.Inside ? 1 : 0};
			}
		});

		/* A tunnel round points of space (x, y, z by threes): how far from its wall (under 0 inside), the height of its axis there. */
		this.Node('TunnelWall', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Points', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}, {Key: 'Radius', Type: 'float', Value: 2}, {Key: 'Flat', Type: 'float', Value: 0}, {Key: 'Width', Type: 'float', Value: 0}, {Key: 'Height', Type: 'float', Value: 4}, {Key: 'Corner', Type: 'float', Value: 1}], Outputs: [{Key: 'Distance', Type: 'float'}, {Key: 'Axis', Type: 'float'}],
			Compute: function (inputs) {
				return self.$Service('Geometry').Tunnel(inputs.Points || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0, Number(inputs.Radius) || 0, Number(inputs.Flat) || 0, Number(inputs.Width) || 0, Number(inputs.Height) || 0, Number(inputs.Corner) || 0);
			}
		});

		/* A graph of passages packed as numbers (Geometry.Passages): how far from its walls, the floor of the nearest of its ways and halls. */
		this.Node('PassageWalls', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Packed', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}, {Key: 'Blend', Type: 'float', Value: 1}, {Key: 'Crust', Type: 'float', Value: -1}, {Key: 'Ground', Type: 'float', Value: 0}], Outputs: [{Key: 'Distance', Type: 'float'}, {Key: 'Floor', Type: 'float'}],
			Compute: function (inputs) {
				return self.$Service('Geometry').Passages(inputs.Packed || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0, Number(inputs.Blend) || 0, Number(inputs.Crust), Number(inputs.Ground) || 0);
			}
		});

		this.Node('Fall', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Distance', Type: 'float', Value: 0}, {Key: 'Radius', Type: 'float', Value: 1}], Outputs: [{Key: 'Out', Type: 'float'}],
			Compute: function (inputs) {
				return {Out: self.$Service('Geometry').Fall(Number(inputs.Distance) || 0, Number(inputs.Radius) || 0)};
			}
		});

		this.Node('Nearest', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Points', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Index', Type: 'float'}, {Key: 'Near', Type: 'float'}, {Key: 'Next', Type: 'float'}, {Key: 'Other', Type: 'float'}],
			Compute: function (inputs) {
				return self.$Service('Geometry').Nearest(inputs.Points || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0);
			}
		});

		/* A height as brushes along paths of directions packed as numbers leave it (Geometry.Edits), Softs the heights the smooth ones go to. */
		this.Node('Edits', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Packed', Type: 'floats', Value: []}, {Key: 'Softs', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}, {Key: 'Height', Type: 'float', Value: 0}], Outputs: [{Key: 'Height', Type: 'float'}],
			Compute: function (inputs) {
				return {Height: self.$Service('Geometry').Edits(inputs.Packed || [], inputs.Softs || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0, Number(inputs.Height) || 0)};
			}
		});

		/* The nearest river to a direction of its segments packed as numbers (Geometry.River): how far, its flow and its level there. */
		this.Node('River', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Packed', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}, {Key: 'Radius', Type: 'float', Value: 1}, {Key: 'Width', Type: 'float', Value: 0.015}, {Key: 'Bend', Type: 'float', Value: 11}], Outputs: [{Key: 'Far', Type: 'float'}, {Key: 'Flow', Type: 'float'}, {Key: 'Level', Type: 'float'}],
			Compute: function (inputs) {
				return self.$Service('Geometry').River(inputs.Packed || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0, Number(inputs.Radius) || 1, Number(inputs.Width) || 0, Number(inputs.Bend) || 0);
			}
		});

		/* Lines of directions on a sphere packed as numbers (Geometry.Strokes): what they give a direction, their sum. */
		this.Node('Strokes', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Packed', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs) {
				return {Value: self.$Service('Geometry').Strokes(inputs.Packed || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0)};
			}
		});

		/* Areas of directions on a sphere packed as numbers (Geometry.Painted): how much a direction is of them, their sum. */
		this.Node('Painted', {Graphs: numeric, Group: 'geometry', Inputs: [{Key: 'Packed', Type: 'floats', Value: []}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Z', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs) {
				return {Value: self.$Service('Geometry').Painted(inputs.Packed || [], Number(inputs.X) || 0, Number(inputs.Y) || 0, Number(inputs.Z) || 0)};
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

		/*
		 * Functions and lists: a generator graph of the resources is a function (its Input blocks what it is given, its
		 * Result blocks what it gives). Call runs one, its pins those of the graph; Repeat runs it Count times ({Index,
		 * Count}), Map for each item of a list ({Item, Index}), each a list of what it gives (Take: that result alone);
		 * Reduce for each item ({Item, Index, Sum}) its result Sum, from Initial. A graph may call itself.
		 */
		this.Node('Call', {Graphs: code, Group: 'function', Properties: [{Key: 'Graph', Type: 'text', Value: ''}],
			Inputs: function (properties) {
				return self.Signature(properties.Graph).Inputs.map(function (name) {
					return {Key: name, Type: 'any'};
				});
			},
			Outputs: function (properties) {
				return self.Signature(properties.Graph).Results.map(function (key) {
					return {Key: key, Type: 'any'};
				});
			},
			Compute: function (inputs, properties) {
				return self.Invoke(properties.Graph, inputs);
			}
		});

		this.Node('Repeat', {Graphs: code, Group: 'function', Properties: [{Key: 'Graph', Type: 'text', Value: ''}, {Key: 'Take', Type: 'text', Value: ''}], Inputs: function (properties) {
			return [{Key: 'Count', Type: 'float', Value: 1}].concat(self.Extras(properties.Graph, ['Index', 'Count']));
		}, Outputs: [{Key: 'List', Type: 'any'}],
		Compute: function (inputs, properties) {
			var list = [];
			var i;

			for (i = 0; i < Math.floor(Number(inputs.Count) || 0); i++)
				list.push(self.Taken(self.Invoke(properties.Graph, Object.assign({}, inputs, {Index: i, Count: inputs.Count})), properties.Take));

			return {List: list};
		}
		});

		this.Node('Map', {Graphs: code, Group: 'function', Properties: [{Key: 'Graph', Type: 'text', Value: ''}, {Key: 'Take', Type: 'text', Value: ''}], Inputs: function (properties) {
			return [{Key: 'List', Type: 'any'}].concat(self.Extras(properties.Graph, ['Item', 'Index', 'List']));
		}, Outputs: [{Key: 'List', Type: 'any'}],
		Compute: function (inputs, properties) {
			return {List: (Array.isArray(inputs.List) ? inputs.List : []).map(function (item, index) {
				return self.Taken(self.Invoke(properties.Graph, Object.assign({}, inputs, {Item: item, Index: index})), properties.Take);
			})};
		}
		});

		this.Node('Reduce', {Graphs: code, Group: 'function', Properties: [{Key: 'Graph', Type: 'text', Value: ''}], Inputs: function (properties) {
			return [{Key: 'List', Type: 'any'}, {Key: 'Initial', Type: 'any', Value: 0}].concat(self.Extras(properties.Graph, ['Item', 'Index', 'Sum', 'List', 'Initial']));
		}, Outputs: [{Key: 'Sum', Type: 'any'}],
		Compute: function (inputs, properties) {
			var sum = inputs.Initial;

			(Array.isArray(inputs.List) ? inputs.List : []).forEach(function (item, index) {
				var made = self.Invoke(properties.Graph, Object.assign({}, inputs, {Item: item, Index: index, Sum: sum}));

				sum = Object.prototype.hasOwnProperty.call(made, 'Sum') ? made.Sum : sum;
			});

			return {Sum: sum};
		}
		});

		/* A list of its inputs, as many as Count. */
		this.Node('List', {Graphs: code, Group: 'function', Properties: [{Key: 'Count', Type: 'number', Value: 2}],
			Inputs: function (properties) {
				var list = [];
				var i;

				for (i = 1; i <= Math.max(0, Math.min(32, Math.floor(Number(properties.Count) || 0))); i++)
					list.push({Key: 'Item' + i, Type: 'any', Value: 0});

				return list;
			},
			Outputs: [{Key: 'List', Type: 'any'}],
			Compute: function (inputs) {
				return {List: Object.keys(inputs).sort(function (a, b) {
					return Number(a.substring(4)) - Number(b.substring(4));
				}).map(function (key) {
					return inputs[key];
				})};
			}
		});

		this.Node('Count', {Graphs: code, Group: 'function', Inputs: [{Key: 'List', Type: 'any'}], Outputs: [{Key: 'Count', Type: 'float'}],
			Compute: function (inputs) {
				return {Count: inputs.List && inputs.List.length || 0};
			}
		});

		this.Node('Item', {Graphs: code, Group: 'function', Inputs: [{Key: 'List', Type: 'any'}, {Key: 'Index', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'any'}],
			Compute: function (inputs) {
				return {Value: inputs.List ? inputs.List[Math.floor(Number(inputs.Index) || 0)] : undefined};
			}
		});

		/*
		 * A number 0 to 1 of a seed and a key: the same for the same two, another for each other key (a part of a model, a
		 * window of a floor: Key its index). Seeds and keys of text or numbers.
		 */
		this.Node('Random', {Graphs: code, Group: 'function', Inputs: [{Key: 'Seed', Type: 'any', Value: 0}, {Key: 'Key', Type: 'any', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs) {
				return {Value: self.Hash2(inputs.Seed, inputs.Key)};
			}
		});

		/* The index-th number of a seed (Chain): of a chain of them, each of the one before. */
		this.Node('Chain', {Graphs: code, Group: 'function', Inputs: [{Key: 'Seed', Type: 'any', Value: 0}, {Key: 'Index', Type: 'float', Value: 0}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs) {
				return {Value: self.Chain(inputs.Seed, inputs.Index)};
			}
		});

		this.Node('Select', {Graphs: code, Group: 'logic', Inputs: [{Key: 'Test', Type: 'bool', Value: false}, {Key: 'A', Type: 'any'}, {Key: 'B', Type: 'any'}], Outputs: [{Key: 'Out', Type: 'any'}],
			Compute: function (inputs) {
				return {Out: inputs.Test ? inputs.A : inputs.B};
			}
		});

		/* A formula of its inputs, its names (Formula): (Index + 0.5) * FloorHeight, Roof == 'flat' ? 0 : Width / 2. */
		this.Node('Formula', {Graphs: code, Group: 'math', Properties: [{Key: 'Expression', Type: 'text', Value: 'A'}],
			Inputs: function (properties) {
				var names;

				try {
					names = self.Formula(properties.Expression).Names;
				}
				catch (error) {
					names = [];
				}

				return names.map(function (name) {
					return {Key: name, Type: 'any', Value: 0};
				});
			},
			Outputs: [{Key: 'Value', Type: 'any'}],
			Compute: function (inputs, properties) {
				return {Value: self.FormulaValue(self.Formula(properties.Expression).Tree, inputs)};
			}
		});

		/* A table of rules: the value of the row of the key (its text), else Default. */
		this.Node('Table', {Graphs: code, Group: 'logic', Properties: [{Key: 'Rows', Type: 'object', Value: {}}, {Key: 'Default', Type: 'any', Value: 0}], Inputs: [{Key: 'Key', Type: 'any'}], Outputs: [{Key: 'Value', Type: 'any'}],
			Compute: function (inputs, properties) {
				var rows = properties.Rows || {};
				var key = String(inputs.Key);

				return {Value: Object.prototype.hasOwnProperty.call(rows, key) ? rows[key] : properties.Default === undefined ? 0 : properties.Default};
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
