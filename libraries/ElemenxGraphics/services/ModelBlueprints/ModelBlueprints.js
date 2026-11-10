/*
 * ModelBlueprints: models made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a
 * graph or block). A graph of the kind model ends at Model: what it gives is a recipe of data of SceneModels, {Parts,
 * Pieces}, which Models assembles into its pieces as it does any recipe of data; a recipe with Graph is made of one
 * (SceneModels.Define(name, {Graph, Parameters, Type, Size...}).
 *
 * Parts are lists of parts {Shape (box, cylinder, ball, blob, wedge, lathe), At, Size, Turn (degrees round y, then x,
 * then z), Color, Piece, Top, Segments, Rough, Points}, in the units of the model (1 tall). Its blocks take them in
 * and give them out, so a function graph (a generator of the resources, called by Call, Repeat or Map) may give a
 * window, a floor or a branch, and Join puts the lists together:
 * - Box, Cylinder (Radius, Top: the part of it at its top, Height), Ball, Blob (Rough), Wedge and Lathe (Points [[r,
 *   y]...]): one part each, of its inputs (At, Size, Turn, Color).
 * - Tube: a path of points [[x, y, z]...] made a tube, Radius at its start, Tip (its part of it at its end), a ball at
 *   each joint so it bends without gaps: a branch, a pipe, a rail.
 * - Join (Count inputs: lists, or lists of lists, as a Repeat gives, all made one list), Move (By), Spin (Degrees
 *   round y, round Around), Grow (Factor: places and sizes), Mirrored (the parts and their copies on the other side of
 *   X), Paint (Color), Piece (the parts become of the piece ID), Instances (the parts again at each of Points).
 * - Pivot: a piece declared {ID, Parent, Pivot, Team}: what moves, round what, under what; a list of them.
 * - Model: the end, its Parts and its Pieces.
 * - Recipe(graph, parameters, inputs) runs a graph of the kind model (an object, its JSON, or the name of one of the
 *   resources): {Parts, Pieces}; inputs reach its Input blocks (Seed, Variant: what Models gives it). It runs its code:
 *   Compiled(graph) makes it once JavaScript (Elemenx.Compilers: blueprint, ir, js; each block its IR, the parts and their
 *   changes functions of the IR), the very parts of the graph run, many times faster; a graph of no code runs as it is.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('ModelBlueprints', {
	$Meta: {
		Description: 'Models made of graphs of Blueprints: parts, their places, mirrors and pieces, as a recipe of data of SceneModels.',
		Methods: ['Recipe(graph, parameters, inputs)', 'Compiled(graph)']
	},

	$Provides: {
		Blueprints: {Graphs: ['model'], Nodes: ['Box', 'Cylinder', 'Ball', 'Blob', 'Wedge', 'Lathe', 'Tube', 'Join', 'Move', 'Spin', 'Grow', 'Mirrored', 'Paint', 'Clad', 'Piece', 'Instances', 'Pivot', 'Model']}
	},

	$OnCreate: function () {
		this.Blocks();
	},

	/* A part made of its fields, each list a copy. */
	Part: function (fields) {
		return JSON.parse(JSON.stringify(fields));
	},

	/* The parts of a value: a list of parts, a list of such lists (what Repeat gives), one part, or nothing. */
	Parts: function (value) {
		var self = this;
		var list = [];

		if (!value)
			return list;

		if (!Array.isArray(value))
			return value.Shape ? [value] : value.Parts ? self.Parts(value.Parts) : list;

		value.forEach(function (item) {
			list = list.concat(Array.isArray(item) || item && !item.Shape ? self.Parts(item) : item ? [item] : []);
		});

		return list;
	},

	Recipe: function (graph, parameters, inputs) {
		var blueprints = this.$Service('Blueprints');
		var given = typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : typeof graph === 'string' ? JSON.parse(graph) : graph;
		if (!given || !Array.isArray(given.blocks))
			throw new Error('Elemenx ModelBlueprints: no graph of a model ' + (typeof graph === 'string' ? graph : ''));

		var compiled = this.Compiled(given);

		/* Its code made once (blueprint to js): the very parts of the graph run, many times faster; a graph of no code runs as it is. */
		if (compiled) {
			var made = compiled(parameters || {}, inputs || {});

			return {Parts: made.Parts || [], Pieces: made.Pieces || []};
		}

		return blueprints.Calling(function () {
			return blueprints.Compile(given).Make(parameters || {}, inputs || {});
		});
	},

	/*
	 * The IR of the blocks of models: each part a record, the parts a list; what changes them functions of the module
	 * (m_flat, m_with, m_move, m_spin, m_grow, m_mirror, m_paint, m_piece, m_instances, m_tube, m_concat) made of the IR,
	 * so a graph of a model is code as any graph (Elemenx.Compilers, blueprint to js), the very parts of its run.
	 */
	IR: function () {
		var ir = {};
		var fields = ['Shape', 'At', 'Size', 'Turn', 'Color', 'Material', 'Piece', 'Top', 'Segments', 'Rough', 'Points'];

		function c (value) {
			return {Op: 'const', Value: value, Type: typeof value === 'string' ? 'text' : typeof value === 'boolean' ? 'bool' : Array.isArray(value) ? 'list' : 'float'};
		}

		function v (name) {
			return {Op: 'var', Name: name};
		}

		function call (name) {
			return {Op: 'call', Name: name, Args: Array.prototype.slice.call(arguments, 1)};
		}

		function e (op, a, b) {
			return call('each', c(op), a, b === undefined ? c(0) : b);
		}

		function at (list, index) {
			return {Op: 'index', List: list, At: c(index)};
		}

		function get (record, key, fallback) {
			return fallback === undefined ? call('get', record, c(key)) : call('get', record, c(key), fallback);
		}

		function list (items) {
			return {Op: 'list', Items: items};
		}

		function vec (a, b, d) {
			return list([a, b, d]);
		}

		function record (values) {
			return {Op: 'record', Fields: values};
		}

		function let_ (name, value) {
			return {Op: 'let', Name: name, Type: 'any', Value: value};
		}

		function fn (name, params, body) {
			return {Name: name, Params: params.map(function (param) {
				return {Name: param, Type: 'any'};
			}), Returns: 'any', Body: body};
		}

		/* A part as it was, but for what is given ({field: expression}). */
		function changed (part, values) {
			var made = {};

			fields.forEach(function (field) {
				made[field] = Object.prototype.hasOwnProperty.call(values, field) ? values[field] : get(part, field);
			});

			return record(made);
		}

		/* For each part of the parts p: what body gives of it, pushed to out; then out. */
		function parts (name, params, body) {
			return fn(name, ['parts'].concat(params), [
				let_('out', list([])),
				{Op: 'each', Var: 'p', Type: 'any', List: call('m_flat', v('parts')), Body: body},
				{Op: 'return', Value: v('out')}
			]);
		}

		ir.m_flat = fn('m_flat', ['value'], [
			let_('out', list([])),
			{Op: 'if', Test: call('isList', v('value')), Then: [
				{Op: 'each', Var: 'item', Type: 'any', List: v('value'), Body: [
					{Op: 'if', Test: {Op: 'bin', Operator: '||', A: call('isList', v('item')), B: {Op: 'bin', Operator: '&&', A: call('has', v('item'), c('Parts')), B: {Op: 'un', Operator: '!', A: call('has', v('item'), c('Shape'))}}}, Then: [
						{Op: 'each', Var: 'one', Type: 'any', List: call('m_flat', v('item')), Body: [{Op: 'push', List: v('out'), Value: v('one')}]}
					], Else: [
						{Op: 'if', Test: call('has', v('item'), c('Shape')), Then: [{Op: 'push', List: v('out'), Value: v('item')}]}
					]}
				]}
			], Else: [
				{Op: 'if', Test: call('has', v('value'), c('Shape')), Then: [{Op: 'push', List: v('out'), Value: v('value')}], Else: [
					{Op: 'if', Test: call('has', v('value'), c('Parts')), Then: [{Op: 'set', Name: 'out', Value: call('m_flat', get(v('value'), 'Parts'))}]}
				]}
			]},
			{Op: 'return', Value: v('out')}
		]);

		ir.m_move = parts('m_move', ['by'], [
			let_('a', get(v('p'), 'At', c([0, 0, 0]))),
			let_('points', get(v('p'), 'Points')),
			{Op: 'if', Test: {Op: 'bin', Operator: '&&', A: call('isList', v('points')), B: {Op: 'bin', Operator: '!=', A: get(v('p'), 'Shape'), B: c('lathe')}}, Then: [
				{Op: 'set', Name: 'points', Value: list([])},
				{Op: 'each', Var: 'q', Type: 'any', List: get(v('p'), 'Points'), Body: [{Op: 'push', List: v('points'), Value: vec(e('add', at(v('q'), 0), at(v('by'), 0)), e('add', at(v('q'), 1), at(v('by'), 1)), e('add', at(v('q'), 2), at(v('by'), 2)))}]}
			]},
			{Op: 'push', List: v('out'), Value: changed(v('p'), {At: vec(e('add', at(v('a'), 0), at(v('by'), 0)), e('add', at(v('a'), 1), at(v('by'), 1)), e('add', at(v('a'), 2), at(v('by'), 2))), Points: v('points')})}
		]);

		ir.m_spin = parts('m_spin', ['degrees', 'around'], [
			let_('angle', e('mul', v('degrees'), c(Math.PI / 180))),
			let_('cs', call('cos', v('angle'))),
			let_('sn', call('sin', v('angle'))),
			let_('a', get(v('p'), 'At', c([0, 0, 0]))),
			let_('x', e('sub', at(v('a'), 0), at(v('around'), 0))),
			let_('z', e('sub', at(v('a'), 2), at(v('around'), 2))),
			let_('t', get(v('p'), 'Turn', c([0, 0, 0]))),
			{Op: 'push', List: v('out'), Value: changed(v('p'), {
				At: vec(e('add', e('add', at(v('around'), 0), e('mul', v('x'), v('cs'))), e('mul', v('z'), v('sn'))), at(v('a'), 1), e('add', e('sub', at(v('around'), 2), e('mul', v('x'), v('sn'))), e('mul', v('z'), v('cs')))),
				Turn: vec(at(v('t'), 0), e('add', at(v('t'), 1), v('degrees')), at(v('t'), 2))
			})}
		]);

		ir.m_grow = parts('m_grow', ['k'], [
			let_('a', get(v('p'), 'At', c([0, 0, 0]))),
			let_('s', get(v('p'), 'Size', c([1, 1, 1]))),
			{Op: 'push', List: v('out'), Value: changed(v('p'), {
				At: vec(e('mul', at(v('a'), 0), at(v('k'), 0)), e('mul', at(v('a'), 1), at(v('k'), 1)), e('mul', at(v('a'), 2), at(v('k'), 2))),
				Size: vec(e('mul', at(v('s'), 0), at(v('k'), 0)), e('mul', at(v('s'), 1), at(v('k'), 1)), e('mul', at(v('s'), 2), at(v('k'), 2)))
			})}
		]);

		ir.m_mirror = fn('m_mirror', ['parts'], [
			let_('all', call('m_flat', v('parts'))),
			let_('out', list([])),
			{Op: 'each', Var: 'p', Type: 'any', List: v('all'), Body: [{Op: 'push', List: v('out'), Value: changed(v('p'), {})}]},
			{Op: 'each', Var: 'p', Type: 'any', List: v('all'), Body: [
				let_('a', get(v('p'), 'At', c([0, 0, 0]))),
				let_('t', get(v('p'), 'Turn', c([0, 0, 0]))),
				let_('id', get(v('p'), 'Piece', c(''))),
				let_('piece', get(v('p'), 'Piece')),
				{Op: 'if', Test: call('ends', v('id'), c('-l')), Then: [{Op: 'set', Name: 'piece', Value: {Op: 'bin', Operator: '+', A: call('cut', v('id'), c(2)), B: c('-r')}}], Else: [
					{Op: 'if', Test: call('ends', v('id'), c('-r')), Then: [{Op: 'set', Name: 'piece', Value: {Op: 'bin', Operator: '+', A: call('cut', v('id'), c(2)), B: c('-l')}}]}
				]},
				{Op: 'push', List: v('out'), Value: changed(v('p'), {At: vec(e('sub', c(0), at(v('a'), 0)), at(v('a'), 1), at(v('a'), 2)), Turn: vec(at(v('t'), 0), e('sub', c(0), at(v('t'), 1)), e('sub', c(0), at(v('t'), 2))), Piece: v('piece')})}
			]},
			{Op: 'return', Value: v('out')}
		]);

		ir.m_paint = parts('m_paint', ['color'], [{Op: 'push', List: v('out'), Value: changed(v('p'), {Color: vec(at(v('color'), 0), at(v('color'), 1), at(v('color'), 2))})}]);

		ir.m_piece = parts('m_piece', ['id'], [{Op: 'push', List: v('out'), Value: changed(v('p'), {Piece: call('text', v('id'))})}]);

		ir.m_instances = fn('m_instances', ['parts', 'points'], [
			let_('all', call('m_flat', v('parts'))),
			let_('out', list([])),
			{Op: 'if', Test: call('isList', v('points')), Then: [
				{Op: 'each', Var: 'point', Type: 'any', List: v('points'), Body: [
					{Op: 'if', Test: call('isList', v('point')), Then: [
						{Op: 'each', Var: 'p', Type: 'any', List: v('all'), Body: [
							let_('a', get(v('p'), 'At', c([0, 0, 0]))),
							{Op: 'push', List: v('out'), Value: changed(v('p'), {At: vec(e('add', at(v('a'), 0), at(v('point'), 0)), e('add', at(v('a'), 1), at(v('point'), 1)), e('add', at(v('a'), 2), at(v('point'), 2)))})}
						]}
					]}
				]}
			]},
			{Op: 'return', Value: v('out')}
		]);

		ir.m_concat = fn('m_concat', ['under', 'item'], [
			let_('out', list([])),
			{Op: 'if', Test: call('isList', v('under')), Then: [{Op: 'each', Var: 'one', Type: 'any', List: v('under'), Body: [{Op: 'push', List: v('out'), Value: v('one')}]}]},
			{Op: 'push', List: v('out'), Value: v('item')},
			{Op: 'return', Value: v('out')}
		]);

		/* A tube: a cylinder from each point to the next, a ball at each joint, as the block Tube runs. */
		ir.m_clad = parts('m_clad', ['material'], [{Op: 'push', List: v('out'), Value: changed(v('p'), {Material: v('material')})}]);

		ir.m_tube = fn('m_tube', ['given', 'radius', 'tip', 'color', 'segments', 'material'], [
			let_('points', list([])),
			{Op: 'if', Test: call('isList', v('given')), Then: [{Op: 'each', Var: 'q', Type: 'any', List: v('given'), Body: [{Op: 'if', Test: call('isList', v('q')), Then: [{Op: 'push', List: v('points'), Value: v('q')}]}]}]},
			let_('out', list([])),
			let_('total', c(0)),
			let_('walked', c(0)),
			{Op: 'loop', Var: 'i', From: c(1), To: {Op: 'length', List: v('points')}, Body: [
				let_('pa', {Op: 'index', List: v('points'), At: e('sub', v('i'), c(1))}),
				let_('pb', {Op: 'index', List: v('points'), At: v('i')}),
				{Op: 'set', Name: 'total', Value: e('add', v('total'), call('sqrt', e('add', e('add', e('pow', e('sub', at(v('pb'), 0), at(v('pa'), 0)), c(2)), e('pow', e('sub', at(v('pb'), 1), at(v('pa'), 1)), c(2))), e('pow', e('sub', at(v('pb'), 2), at(v('pa'), 2)), c(2)))))}
			]},
			{Op: 'loop', Var: 'i', From: c(1), To: {Op: 'length', List: v('points')}, Body: [
				let_('pa', {Op: 'index', List: v('points'), At: e('sub', v('i'), c(1))}),
				let_('pb', {Op: 'index', List: v('points'), At: v('i')}),
				let_('dx', e('sub', at(v('pb'), 0), at(v('pa'), 0))),
				let_('dy', e('sub', at(v('pb'), 1), at(v('pa'), 1))),
				let_('dz', e('sub', at(v('pb'), 2), at(v('pa'), 2))),
				let_('length', call('sqrt', e('add', e('add', e('mul', v('dx'), v('dx')), e('mul', v('dy'), v('dy'))), e('mul', v('dz'), v('dz'))))),
				{Op: 'if', Test: {Op: 'bin', Operator: '>', A: v('length'), B: c(0)}, Then: [
					let_('from', e('mul', v('radius'), e('add', c(1), e('mul', e('sub', v('tip'), c(1)), {Op: 'select', Test: {Op: 'bin', Operator: '>', A: v('total'), B: c(0)}, A: e('div', v('walked'), v('total')), B: c(0)})))),
					{Op: 'set', Name: 'walked', Value: e('add', v('walked'), v('length'))},
					let_('to', e('mul', v('radius'), e('add', c(1), e('mul', e('sub', v('tip'), c(1)), {Op: 'select', Test: {Op: 'bin', Operator: '>', A: v('total'), B: c(0)}, A: e('div', v('walked'), v('total')), B: c(0)})))),
					{Op: 'push', List: v('out'), Value: record({Shape: c('cylinder'), At: vec(e('div', e('add', at(v('pa'), 0), at(v('pb'), 0)), c(2)), e('div', e('add', at(v('pa'), 1), at(v('pb'), 1)), c(2)), e('div', e('add', at(v('pa'), 2), at(v('pb'), 2)), c(2))), Size: vec(e('mul', v('from'), c(2)), v('length'), e('mul', v('from'), c(2))), Top: {Op: 'select', Test: {Op: 'bin', Operator: '!=', A: v('from'), B: c(0)}, A: e('div', v('to'), v('from')), B: c(1)}, Turn: vec(e('div', call('acos', e('max', c(-1), e('min', c(1), e('div', v('dy'), v('length'))))), c(Math.PI / 180)), e('div', call('atan2', v('dx'), v('dz')), c(Math.PI / 180)), c(0)), Color: v('color'), Material: v('material'), Segments: v('segments')})},
					{Op: 'if', Test: {Op: 'bin', Operator: '<', A: v('i'), B: e('sub', {Op: 'length', List: v('points')}, c(1))}, Then: [
						{Op: 'push', List: v('out'), Value: record({Shape: c('ball'), At: v('pb'), Size: vec(e('mul', v('to'), c(2)), e('mul', v('to'), c(2)), e('mul', v('to'), c(2))), Turn: c([0, 0, 0]), Color: v('color'), Material: v('material')})}
					]}
				]}
			]},
			{Op: 'return', Value: v('out')}
		]);

		return {Functions: ir, Call: call, Const: c, List: list, Record: record, Each: e};
	},

	/*
	 * The function of the code of a graph of a model (Elemenx.Compilers: blueprint, ir, js), made once for its text and
	 * the graphs it calls; null when it has a block of no IR (it is run as it is then).
	 */
	Compiled: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var key = JSON.stringify(graph);
		var found = null;

		this.Codes = this.Codes || {};

		if (Object.prototype.hasOwnProperty.call(this.Codes, key)) return this.Codes[key];

		if (typeof Elemenx !== 'undefined' && Elemenx.Compilers) {
			blueprints.Calling(function () {
				Elemenx.Compilers.Run({From: 'blueprint', To: 'js', Value: graph, Options: {Name: 'model'}}, function (error, result) {
					if (!error)
						found = Elemenx.Compilers.Load(result.Value).g_model;
				});
			});
		}

		this.Codes[key] = found || null;

		return this.Codes[key];
	},

	Blocks: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var kinds = ['model', 'generator'];
		var place = [{Key: 'At', Type: 'vec3', Value: [0, 0.5, 0]}, {Key: 'Turn', Type: 'vec3', Value: 0}, {Key: 'Color', Type: 'vec3', Value: [0.78, 0.78, 0.78]}, {Key: 'Material', Type: 'text', Value: ''}];
		var degrees = Math.PI / 180;

		function one (fields) {
			return {Parts: [self.Part(fields)]};
		}

		function each (list, change) {
			return {Parts: self.Parts(list).map(function (part) {
				var made = self.Part(part);

				change(made);

				return made;
			})};
		}

		blueprints.Graph('model', {
			End: 'Model',
			Uses: ['generator'],
			Compile: function (plan) {
				return {
					Make: function (parameters, inputs) {
						var run = {Outputs: {}, Parameters: parameters || {}, Inputs: inputs || {}, Memo: true, Graph: {parameters: this && this.Parameters || plan.Graph.parameters}};
						var end = plan.Order.filter(function (id) {
							return plan.Blocks[id].type === 'Model' && plan.Blocks[id].enabled !== false;
						})[0];
						var made = end ? blueprints.Gather(plan, end, run, 0) : {};

						return {Parts: self.Parts(made.Parts), Pieces: Array.isArray(made.Pieces) ? made.Pieces : made.Pieces ? [made.Pieces] : []};
					}
				};
			}
		});

		blueprints.Node('Box', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Size', Type: 'vec3', Value: 1}].concat(place), Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return one({Shape: 'box', At: inputs.At, Size: inputs.Size, Turn: inputs.Turn, Color: inputs.Color, Material: inputs.Material});
			}
		});

		blueprints.Node('Cylinder', {Graphs: kinds, Group: 'shape', Properties: [{Key: 'Segments', Type: 'number', Value: 12}], Inputs: [{Key: 'Radius', Type: 'float', Value: 0.5}, {Key: 'Top', Type: 'float', Value: 1}, {Key: 'Height', Type: 'float', Value: 1}].concat(place), Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs, properties) {
				return one({Shape: 'cylinder', At: inputs.At, Size: [inputs.Radius * 2, inputs.Height, inputs.Radius * 2], Top: inputs.Top, Turn: inputs.Turn, Color: inputs.Color, Material: inputs.Material, Segments: Number(properties.Segments) || 12});
			}
		});

		blueprints.Node('Ball', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Size', Type: 'vec3', Value: 1}].concat(place), Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return one({Shape: 'ball', At: inputs.At, Size: inputs.Size, Turn: inputs.Turn, Color: inputs.Color, Material: inputs.Material});
			}
		});

		blueprints.Node('Blob', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Size', Type: 'vec3', Value: 1}, {Key: 'Rough', Type: 'float', Value: 0.6}].concat(place), Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return one({Shape: 'blob', At: inputs.At, Size: inputs.Size, Rough: inputs.Rough, Turn: inputs.Turn, Color: inputs.Color, Material: inputs.Material});
			}
		});

		blueprints.Node('Wedge', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Size', Type: 'vec3', Value: 1}].concat(place), Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return one({Shape: 'wedge', At: inputs.At, Size: inputs.Size, Turn: inputs.Turn, Color: inputs.Color, Material: inputs.Material});
			}
		});

		blueprints.Node('Lathe', {Graphs: kinds, Group: 'shape', Properties: [{Key: 'Segments', Type: 'number', Value: 12}], Inputs: [{Key: 'Points', Type: 'any'}, {Key: 'Size', Type: 'vec3', Value: 1}].concat(place), Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs, properties) {
				return one({Shape: 'lathe', Points: Array.isArray(inputs.Points) ? inputs.Points : [], At: inputs.At, Size: inputs.Size, Turn: inputs.Turn, Color: inputs.Color, Material: inputs.Material, Segments: Number(properties.Segments) || 12});
			}
		});

		/* A tube along a path: a cylinder from each point to the next, as thick as it is along it, a ball at each joint. */
		blueprints.Node('Tube', {Graphs: kinds, Group: 'shape', Properties: [{Key: 'Segments', Type: 'number', Value: 8}], Inputs: [{Key: 'Points', Type: 'any'}, {Key: 'Radius', Type: 'float', Value: 0.1}, {Key: 'Tip', Type: 'float', Value: 1}, {Key: 'Color', Type: 'vec3', Value: [0.78, 0.78, 0.78]}, {Key: 'Material', Type: 'text', Value: ''}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs, properties) {
				var points = (Array.isArray(inputs.Points) ? inputs.Points : []).filter(Array.isArray);
				var parts = [];
				var total = 0;
				var walked = 0;
				var i;

				function radius (along) {
					return inputs.Radius * (1 + (inputs.Tip - 1) * (total ? along / total : 0));
				}

				for (i = 1; i < points.length; i++)
					total += Math.sqrt(Math.pow(points[i][0] - points[i - 1][0], 2) + Math.pow(points[i][1] - points[i - 1][1], 2) + Math.pow(points[i][2] - points[i - 1][2], 2));

				for (i = 1; i < points.length; i++) {
					var a = points[i - 1];
					var b = points[i];
					var d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
					var length = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
					var from;
					var to;

					if (!length) continue;

					from = radius(walked);
					walked += length;
					to = radius(walked);

					/* Its axis, y of a cylinder, turned to the way: round x by how far from up, then round y to its side. */
					parts.push(self.Part({Shape: 'cylinder', At: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], Size: [from * 2, length, from * 2], Top: from ? to / from : 1, Turn: [Math.acos(Math.max(-1, Math.min(1, d[1] / length))) / degrees, Math.atan2(d[0], d[2]) / degrees, 0], Color: inputs.Color, Material: inputs.Material, Segments: Number(properties.Segments) || 8}));

					if (i < points.length - 1)
						parts.push(self.Part({Shape: 'ball', At: b, Size: [to * 2, to * 2, to * 2], Turn: [0, 0, 0], Color: inputs.Color, Material: inputs.Material}));
				}

				return {Parts: parts};
			}
		});

		/* All its inputs made one list of parts, as many as Count. */
		blueprints.Node('Join', {Graphs: kinds, Group: 'shape', Properties: [{Key: 'Count', Type: 'number', Value: 2}],
			Inputs: function (properties) {
				var list = [];
				var i;

				for (i = 1; i <= Math.max(0, Math.min(32, Math.floor(Number(properties.Count) || 0))); i++)
					list.push({Key: 'Parts' + i, Type: 'any'});

				return list;
			},
			Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return {Parts: self.Parts(Object.keys(inputs).sort(function (a, b) {
					return Number(a.substring(5)) - Number(b.substring(5));
				}).map(function (key) {
					return inputs[key];
				}))};
			}
		});

		blueprints.Node('Move', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'By', Type: 'vec3', Value: 0}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return each(inputs.Parts, function (part) {
					var at = part.At || [0, 0, 0];

					part.At = [at[0] + inputs.By[0], at[1] + inputs.By[1], at[2] + inputs.By[2]];

					(part.Points && part.Shape !== 'lathe' ? part.Points : []).forEach(function (point, index) {
						part.Points[index] = [point[0] + inputs.By[0], point[1] + inputs.By[1], point[2] + inputs.By[2]];
					});
				});
			}
		});

		/* Round y by Degrees, round the point Around: the place of each part and its own turn round y. */
		blueprints.Node('Spin', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'Degrees', Type: 'float', Value: 0}, {Key: 'Around', Type: 'vec3', Value: 0}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				var angle = inputs.Degrees * degrees;
				var c = Math.cos(angle);
				var s = Math.sin(angle);

				return each(inputs.Parts, function (part) {
					var at = part.At || [0, 0, 0];
					var x = at[0] - inputs.Around[0];
					var z = at[2] - inputs.Around[2];
					var turn = part.Turn || [0, 0, 0];

					part.At = [inputs.Around[0] + x * c + z * s, at[1], inputs.Around[2] - x * s + z * c];
					part.Turn = [turn[0], turn[1] + inputs.Degrees, turn[2]];
				});
			}
		});

		blueprints.Node('Grow', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'Factor', Type: 'vec3', Value: 1}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				var k = inputs.Factor;

				return each(inputs.Parts, function (part) {
					var at = part.At || [0, 0, 0];
					var size = part.Size || [1, 1, 1];

					part.At = [at[0] * k[0], at[1] * k[1], at[2] * k[2]];
					part.Size = [size[0] * k[0], size[1] * k[1], size[2] * k[2]];
				});
			}
		});

		/* The parts and their copies on the other side of X; a piece of a side (-l, -r) gives its copy to the other. */
		blueprints.Node('Mirrored', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				var parts = self.Parts(inputs.Parts);

				return {Parts: parts.map(self.Part).concat(parts.map(function (part) {
					var made = self.Part(part);
					var at = made.At || [0, 0, 0];
					var turn = made.Turn || [0, 0, 0];
					var id = made.Piece || '';

					made.At = [-at[0], at[1], at[2]];
					made.Turn = [turn[0], -turn[1], -turn[2]];

					if (/-l$/.test(id)) made.Piece = id.slice(0, -2) + '-r';
					else if (/-r$/.test(id)) made.Piece = id.slice(0, -2) + '-l';

					return made;
				}))};
			}
		});

		blueprints.Node('Paint', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'Color', Type: 'vec3', Value: [0.78, 0.78, 0.78]}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return each(inputs.Parts, function (part) {
					part.Color = inputs.Color.slice(0, 3);
				});
			}
		});

		/* The parts of a material of SceneMaterials (its name), drawn by its pattern, their colors its tint. */
		blueprints.Node('Clad', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'Material', Type: 'text', Value: ''}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				return each(inputs.Parts, function (part) {
					part.Material = inputs.Material;
				});
			}
		});

		blueprints.Node('Piece', {Graphs: kinds, Group: 'shape', Properties: [{Key: 'ID', Type: 'text', Value: 'body'}], Inputs: [{Key: 'Parts', Type: 'any'}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs, properties) {
				return each(inputs.Parts, function (part) {
					part.Piece = String(properties.ID || 'body');
				});
			}
		});

		/* The parts again at each of the points: the leaves of a tree, the lamps of a street. */
		blueprints.Node('Instances', {Graphs: kinds, Group: 'shape', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'Points', Type: 'any'}], Outputs: [{Key: 'Parts', Type: 'any'}],
			Compute: function (inputs) {
				var parts = self.Parts(inputs.Parts);
				var made = [];

				(Array.isArray(inputs.Points) ? inputs.Points : []).filter(Array.isArray).forEach(function (point) {
					parts.forEach(function (part) {
						var copy = self.Part(part);
						var at = copy.At || [0, 0, 0];

						copy.At = [at[0] + point[0], at[1] + point[1], at[2] + point[2]];

						made.push(copy);
					});
				});

				return {Parts: made};
			}
		});

		blueprints.Node('Pivot', {Graphs: kinds, Group: 'shape', Properties: [{Key: 'ID', Type: 'text', Value: 'body'}, {Key: 'Parent', Type: 'text', Value: ''}, {Key: 'Team', Type: 'bool', Value: false}], Inputs: [{Key: 'Under', Type: 'any'}, {Key: 'Pivot', Type: 'vec3', Value: 0}], Outputs: [{Key: 'Pieces', Type: 'any'}],
			Compute: function (inputs, properties) {
				return {Pieces: (Array.isArray(inputs.Under) ? inputs.Under : []).concat([{ID: String(properties.ID || 'body'), Parent: String(properties.Parent || ''), Pivot: inputs.Pivot, Team: !!properties.Team}])};
			}
		});

		blueprints.Node('Model', {Graphs: ['model'], Group: 'output', Inputs: [{Key: 'Parts', Type: 'any'}, {Key: 'Pieces', Type: 'any'}], Outputs: []});

		this.BlockIR();
	},

	/* What each block of models is in the IR (IR of Blueprints, the end Model its IREnd), the functions of parts it calls added with it. */
	BlockIR: function () {
		var blueprints = this.$Service('Blueprints');
		var made = this.IR();
		var functions = made.Functions;
		var call = made.Call;
		var c = made.Const;
		var list = made.List;
		var record = made.Record;
		var e = made.Each;
		var needs = {m_move: ['m_flat'], m_spin: ['m_flat'], m_grow: ['m_flat'], m_mirror: ['m_flat'], m_paint: ['m_flat'], m_clad: ['m_flat'], m_piece: ['m_flat'], m_instances: ['m_flat']};

		/* A function of parts by its name, what it calls with it. */
		function use (context, name) {
			(needs[name] || []).forEach(function (other) {
				use(context, other);
			});

			return context.Helper(name, function () {
				return JSON.parse(JSON.stringify(functions[name]));
			});
		}

		function shape (kind, fields) {
			return function (inputs, properties) {
				var values = {Shape: c(kind)};

				Object.keys(fields).forEach(function (key) {
					values[key] = fields[key](inputs, properties);
				});

				return {Parts: list([record(values)])};
			};
		}

		function input (key) {
			return function (inputs) {
				return inputs[key];
			};
		}

		function segments (inputs, properties) {
			return c(Number(properties.Segments) || 12);
		}

		var blocks = {
			Box: shape('box', {At: input('At'), Size: input('Size'), Turn: input('Turn'), Color: input('Color'), Material: input('Material')}),
			Cylinder: shape('cylinder', {At: input('At'), Size: function (inputs) {
				return list([e('mul', inputs.Radius, c(2)), inputs.Height, e('mul', inputs.Radius, c(2))]);
			}, Top: input('Top'), Turn: input('Turn'), Color: input('Color'), Material: input('Material'), Segments: segments}),
			Ball: shape('ball', {At: input('At'), Size: input('Size'), Turn: input('Turn'), Color: input('Color'), Material: input('Material')}),
			Blob: shape('blob', {At: input('At'), Size: input('Size'), Rough: input('Rough'), Turn: input('Turn'), Color: input('Color'), Material: input('Material')}),
			Wedge: shape('wedge', {At: input('At'), Size: input('Size'), Turn: input('Turn'), Color: input('Color'), Material: input('Material')}),
			Lathe: shape('lathe', {Points: function (inputs) {
				return {Op: 'select', Test: call('isList', inputs.Points), A: inputs.Points, B: list([])};
			}, At: input('At'), Size: input('Size'), Turn: input('Turn'), Color: input('Color'), Material: input('Material'), Segments: segments}),
			Tube: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_tube'), inputs.Points, inputs.Radius, inputs.Tip, inputs.Color, c(Number(properties.Segments) || 8), inputs.Material)};
			},
			Join: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_flat'), list(Object.keys(inputs).sort(function (a, b) {
					return Number(a.substring(5)) - Number(b.substring(5));
				}).map(function (key) {
					return inputs[key];
				})))};
			},
			Move: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_move'), inputs.Parts, inputs.By)};
			},
			Spin: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_spin'), inputs.Parts, inputs.Degrees, inputs.Around)};
			},
			Grow: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_grow'), inputs.Parts, inputs.Factor)};
			},
			Mirrored: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_mirror'), inputs.Parts)};
			},
			Clad: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_clad'), inputs.Parts, inputs.Material)};
			},
			Paint: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_paint'), inputs.Parts, inputs.Color)};
			},
			Piece: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_piece'), inputs.Parts, c(String(properties.ID || 'body')))};
			},
			Instances: function (inputs, properties, context) {
				return {Parts: call(use(context, 'm_instances'), inputs.Parts, inputs.Points)};
			},
			Pivot: function (inputs, properties, context) {
				return {Pieces: call(use(context, 'm_concat'), inputs.Under, record({ID: c(String(properties.ID || 'body')), Parent: c(String(properties.Parent || '')), Pivot: inputs.Pivot, Team: c(!!properties.Team)}))};
			}
		};

		Object.keys(blocks).forEach(function (type) {
			blueprints.NodeOf(type).IR = blocks[type];
		});

		blueprints.NodeOf('Model').IREnd = function (inputs, properties, context) {
			return {
				Parts: call(use(context, 'm_flat'), inputs.Parts),
				Pieces: {Op: 'select', Test: call('isList', inputs.Pieces), A: inputs.Pieces, B: {Op: 'select', Test: inputs.Pieces, A: list([inputs.Pieces]), B: list([])}}
			};
		};
	}
});
