import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

describe('Contract: Blueprints, graphs in the JSON of Flowprint made into shaders, passes, code and flows', function () {
	var blueprints;
	var graphics;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints', 'service:Graphics3D']);

		blueprints = Elemenx.Service('Blueprints');
		graphics = Elemenx.Service('Graphics3D');
	});

	/* A graph goes through a file as it would. */
	function stored (graph) {
		return JSON.parse(blueprints.Write(graph));
	}

	/* The picture of a pass of size by size pixels, read back: [r, g, b, a] of 0 to 255 at each pixel. */
	function draw (fragment, uniforms, size) {
		var renderer = graphics.Create(document.createElement('canvas'), {Antialias: false});
		var program = renderer.Program(graphics.Shaders.Quad, fragment);
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var data = new Uint8Array(size * size * 4);
		var gl = renderer.GL;

		renderer.Resize(size, size, 1);
		renderer.Draw(quad, program, uniforms, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, data);

		renderer.Destroy();

		return data;
	}

	it('reads a file of Flowprint as it is: version 1, keys of pins from their ids, a link drawn backwards turned, the rest kept', function () {
		var file = {
			blocks: [
				{id: 'a', x: 10, y: 20, properties: [{key: 'Value', value: 2}], enabled: true, comment: 'two', extra: 'kept', type: 'Number', pins: [{id: 'a-out-Value', content: 'Value', direction: {in: false, out: true}, place: 'body', kind: 'value', enabled: true, comment: ''}]},
				{id: 'b', x: 200, y: 20, properties: [], enabled: true, comment: '', type: 'Result', pins: [{id: 'b-in-Value', content: 'Value', direction: {in: true, out: false}, place: 'body', kind: 'value', enabled: true, comment: ''}]},
				{id: 'c', x: 0, y: 0, properties: [], enabled: true, comment: '', pins: []}
			],
			links: [{id: 'l', x1: 0, y1: 0, x2: 0, y2: 0, p1: 'b-in-Value', p2: 'a-out-Value', kind: 'value', enabled: true, comment: ''}]
		};
		var graph = blueprints.Read(JSON.stringify(file));

		expect(graph.version).toBe(1);
		expect(graph.blocks[0].pins[0].key).toBe('Value');
		expect(graph.blocks[0].extra).toBe('kept');
		expect([graph.links[0].p1, graph.links[0].p2]).toEqual(['a-out-Value', 'b-in-Value']);

		/* The block of Flowprint with no type is Generic: it runs as nothing, so the graph is wrong to make. */
		expect(blueprints.Check(Object.assign(stored(graph), {type: 'generator'})).map(function (problem) {
			return problem.Message;
		})).toEqual(['block c has no type']);

		expect(function () {
			blueprints.Read({version: 2, blocks: [], links: []});
		}).toThrow('Elemenx Blueprints: version 2 is newer than 1');
	});

	it('makes a pass a fragment shader whose parameters are uniforms, and draws it', function () {
		var graph = blueprints.Create('pass', {parameters: [{key: 'Gain', type: 'float', value: 1}, {key: 'Tint', type: 'vec3', value: '#ff8000'}]});
		var uv = blueprints.Add(graph, 'UV');
		var split = blueprints.Add(graph, 'Split');
		var gain = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Gain'}});
		var tint = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Tint', Type: 'vec3'}});
		var times = blueprints.Add(graph, 'Multiply');
		var colored = blueprints.Add(graph, 'Multiply');
		var output = blueprints.Add(graph, 'Output');
		var made;
		var pixels;

		blueprints.Link(graph, [uv.id, 'UV'], [split.id, 'Vector']);
		blueprints.Link(graph, [split.id, 'X'], [times.id, 'A']);
		blueprints.Link(graph, [gain.id, 'Value'], [times.id, 'B']);
		blueprints.Link(graph, [tint.id, 'Value'], [colored.id, 'A']);
		blueprints.Link(graph, [times.id, 'Out'], [colored.id, 'B']);
		blueprints.Link(graph, [colored.id, 'Out'], [output.id, 'Color']);

		made = blueprints.Compile(stored(graph));

		expect(made.Type).toBe('pass');
		expect(made.Uniforms.map(function (uniform) {
			return uniform.Name;
		})).toEqual(['uParameter_Gain', 'uParameter_Tint']);
		expect(made.Values({Gain: 0.5})).toEqual({uParameter_Gain: 0.5, uParameter_Tint: [1, 128 / 255, 0]});

		/* Red grows from left to right as the x of the picture by the gain; green is half of it, blue none. */
		pixels = draw(made.Fragment, made.Values({Gain: 1, Tint: [1, 0.5, 0]}), 4);

		expect(pixels[0]).toBeLessThan(pixels[3 * 4]);
		expect(pixels[3 * 4]).toBeGreaterThan(200);
		expect(Math.abs(pixels[3 * 4 + 1] - pixels[3 * 4] / 2)).toBeLessThan(3);
		expect(pixels[3 * 4 + 2]).toBe(0);
		expect(pixels[3 * 4 + 3]).toBe(255);

		/* A parameter changed is only another uniform: the very same shader. */
		pixels = draw(made.Fragment, made.Values({Gain: 0}), 4);

		expect(pixels[3 * 4]).toBe(0);
	});

	it('makes a graph once, whatever where its blocks stand; what it is made of makes it again', function () {
		var graph = blueprints.Create('pass');
		var number = blueprints.Add(graph, 'Number', {properties: {Value: 0.25}});
		var output = blueprints.Add(graph, 'Output');
		var first;

		blueprints.Link(graph, [number.id, 'Value'], [output.id, 'Color']);

		first = blueprints.Compile(graph);
		number.x = 400;

		expect(blueprints.Compile(graph)).toBe(first);

		number.properties[0].value = 0.75;

		expect(blueprints.Compile(graph)).not.toBe(first);
		expect(blueprints.Compile(graph).Fragment).toContain('0.75');
		expect(draw(blueprints.Compile(graph).Fragment, {}, 1)[0]).toBe(191);
	});

	it('makes nothing again when only the value of a parameter changes: the uniform and the code take the new one', function () {
		var graph = blueprints.Create('pass', {parameters: [{key: 'Gain', type: 'float', value: 0.2}]});
		var gain = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Gain'}});
		var output = blueprints.Add(graph, 'Output');
		var code = blueprints.Create('generator', {parameters: [{key: 'Gain', type: 'float', value: 1}]});
		var first;
		var made;

		blueprints.Link(graph, [gain.id, 'Value'], [output.id, 'Color']);
		blueprints.Link(code, [blueprints.Add(code, 'Parameter', {properties: {Key: 'Gain'}}).id, 'Value'], [blueprints.Add(code, 'Result').id, 'Value']);

		first = blueprints.Compile(graph);

		/* Regression: the value was part of the hash, so a slider of a parameter compiled the shader again at each step. */
		graph.parameters[0].value = 0.6;

		expect(blueprints.Compile(graph)).toBe(first);
		expect(first.Values()).toEqual({uParameter_Gain: 0.6});

		made = blueprints.Compile(code);
		code.parameters[0].value = 5;

		expect(blueprints.Compile(code)).toBe(made);
		expect(made.Run()).toEqual({Value: 5});
		expect(made.Run({Gain: 7})).toEqual({Value: 7});
	});

	it('tells what is wrong with a graph, and makes none of it', function () {
		var graph = blueprints.Create('pass');
		var a = blueprints.Add(graph, 'Add');
		var b = blueprints.Add(graph, 'Add');
		var texture = blueprints.Add(graph, 'Number');
		var problems;
		var error;

		blueprints.Link(graph, [a.id, 'Out'], [b.id, 'A']);
		blueprints.Link(graph, [b.id, 'Out'], [a.id, 'A']);
		blueprints.Link(graph, [texture.id, 'Value'], [b.id, 'A']);

		graph.blocks.push({id: 'odd', type: 'Event', x: 0, y: 0, properties: [], enabled: true, comment: '', pins: []});
		graph.links.push({id: 'lost', p1: 'nowhere', p2: a.id + '-in-B', kind: 'value', enabled: true});

		problems = blueprints.Check(graph).map(function (problem) {
			return problem.Message;
		});

		expect(problems).toEqual(expect.arrayContaining([
			'a block Event does not stand in a pass graph',
			'link lost joins a pin that is not there',
			'input A of block ' + b.id + ' has two links',
			'a pass graph has no Output'
		]));
		expect(problems.some(function (message) {
			return message.indexOf('a circle of values') === 0;
		})).toBe(true);

		try {
			blueprints.Compile(graph);
		}
		catch (caught) {
			error = caught;
		}

		expect(error.message).toBe('Elemenx Blueprints: ' + problems[0]);
		expect(error.Problems.length).toBe(problems.length);

		/* A picture into a number does not go. */
		graph = blueprints.Create('render');
		a = blueprints.Add(graph, 'Present');
		b = blueprints.Add(graph, 'Number');

		blueprints.Link(graph, [b.id, 'Value'], [a.id, 'Color']);

		expect(blueprints.Check(graph)[0].Message).toMatch(/gives float to texture/);

		/* A picture is no number of any width, and no text either: only any takes it. */
		expect([blueprints.Fits('texture', 'same'), blueprints.Fits('texture', 'text'), blueprints.Fits('texture', 'any'), blueprints.Fits('vec3', 'same')]).toEqual([false, false, true, true]);
	});

	it('lets a block switched off pass what comes to it', function () {
		var graph = blueprints.Create('generator');
		var number = blueprints.Add(graph, 'Number', {properties: {Value: 3}});
		var negated = blueprints.Add(graph, 'OneMinus');
		var result = blueprints.Add(graph, 'Result');

		blueprints.Link(graph, [number.id, 'Value'], [negated.id, 'X']);
		blueprints.Link(graph, [negated.id, 'Out'], [result.id, 'Value']);

		expect(blueprints.Compile(graph).Run()).toEqual({Value: -2});

		negated.enabled = false;

		expect(blueprints.Compile(graph).Run()).toEqual({Value: 3});
	});

	it('bakes a pass and a material into JSON made again with no block at all; a graph of code is not baked', function () {
		var graph = blueprints.Create('material', {parameters: [{key: 'Wet', type: 'float', value: 0.3}]});
		var wet = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Wet'}});
		var dry = blueprints.Add(graph, 'OneMinus');
		var noise = blueprints.Add(graph, 'Fbm', {properties: {Octaves: 3}});
		var position = blueprints.Add(graph, 'Position');
		var surface = blueprints.Add(graph, 'Surface');
		var baked;
		var made;
		var renderer;
		var flow;

		blueprints.Link(graph, [wet.id, 'Value'], [dry.id, 'X']);
		blueprints.Link(graph, [dry.id, 'Out'], [surface.id, 'Rough']);
		blueprints.Link(graph, [position.id, 'Position'], [noise.id, 'Position']);
		blueprints.Link(graph, [noise.id, 'Value'], [surface.id, 'Metal']);

		baked = JSON.parse(JSON.stringify(blueprints.Bake(graph)));
		made = blueprints.Compile(baked);

		expect(baked.type).toBe('material');
		expect(made.Source).toBe(blueprints.Compile(graph).Source);
		expect(made.Values({})).toEqual({uParameter_Wet: 0.3});
		expect(made.Source).toContain('void blueprintSurface(');

		/* The function goes into a shader of the card as it is. */
		renderer = graphics.Create(document.createElement('canvas'), {Antialias: false});

		expect(function () {
			renderer.Program(graphics.Shaders.Quad, '#version 300 es\nprecision highp float;\nin vec2 vQuad;\nout vec4 outColor;\n' + made.Source + '\nvoid main() {\n\tvec3 color = vec3(1.0);\n\tfloat alpha = 1.0;\n\tfloat rough = 0.5;\n\tfloat metal = 0.0;\n\tvec3 emission = vec3(0.0);\n\tvec3 bent = vec3(0.0, 1.0, 0.0);\n\tblueprintSurface(vec3(vQuad, 0.0), vec3(0.0, 1.0, 0.0), vQuad, color, alpha, rough, metal, emission, bent);\n\toutColor = vec4(color * rough, alpha);\n}');
		}).not.toThrow();

		renderer.Destroy();

		flow = blueprints.Create('flow');

		expect(function () {
			blueprints.Bake(flow);
		}).toThrow('Elemenx Blueprints: a flow graph is not baked: its blocks run as code');
	});

	it('runs a generator of numbers with the very noise of the shaders, its parameters and inputs given', function () {
		var graph = blueprints.Create('generator', {parameters: [{key: 'Scale', type: 'float', value: 2}]});
		var input = blueprints.Add(graph, 'Input', {properties: {Name: 'At'}});
		var scale = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Scale'}});
		var fbm = blueprints.Add(graph, 'Fbm', {properties: {Octaves: 5}});
		var height = blueprints.Add(graph, 'Result', {properties: {Key: 'Height'}});
		var twice = blueprints.Add(graph, 'Multiply');
		var double = blueprints.Add(graph, 'Result', {properties: {Key: 'Double'}});
		var made;
		var noise = graphics.Noise();

		blueprints.Link(graph, [input.id, 'Value'], [fbm.id, 'Position']);
		blueprints.Link(graph, [scale.id, 'Value'], [fbm.id, 'Scale']);
		blueprints.Link(graph, [fbm.id, 'Value'], [height.id, 'Value']);
		blueprints.Link(graph, [input.id, 'Value'], [twice.id, 'A']);
		blueprints.Link(graph, [scale.id, 'Value'], [twice.id, 'B']);
		blueprints.Link(graph, [twice.id, 'Out'], [double.id, 'Value']);

		made = blueprints.Compile(stored(graph));

		expect(made.Run({}, {At: [1, 2, 3]})).toEqual({Height: noise.Fbm(2, 4, 6, 5), Double: [2, 4, 6]});
		expect(made.Run({Scale: 0.5}, {At: [1, 2, 3]}).Height).toBe(noise.Fbm(0.5, 1, 1.5, 5));
	});

	it('runs a flow: events, branches, variables, loops, delays, actions of the context and what it tells', function () {
		var graph = blueprints.Create('flow');
		var start = blueprints.Add(graph, 'Event', {properties: {Name: 'Hit'}});
		var damage = blueprints.Add(graph, 'Field', {properties: {Path: 'Damage'}});
		var big = blueprints.Add(graph, 'Compare', {properties: {Operator: '>'}});
		var three = blueprints.Add(graph, 'Number', {properties: {Value: 3}});
		var branch = blueprints.Add(graph, 'Branch');
		var loop = blueprints.Add(graph, 'For');
		var total = blueprints.Add(graph, 'Get', {properties: {Name: 'Total'}});
		var add = blueprints.Add(graph, 'Add');
		var keep = blueprints.Add(graph, 'Set', {properties: {Name: 'Total'}});
		var wait = blueprints.Add(graph, 'Delay');
		var tell = blueprints.Add(graph, 'Emit', {properties: {Name: 'Hurt'}});
		var log = blueprints.Add(graph, 'Action', {properties: {Name: 'Log'}});
		var logged = [];
		var told = [];
		var timers = [];
		var instance;
		var finished = null;

		blueprints.Link(graph, [start.id, 'Payload'], [damage.id, 'Object']);
		blueprints.Link(graph, [damage.id, 'Value'], [big.id, 'A']);
		blueprints.Link(graph, [three.id, 'Value'], [big.id, 'B']);
		blueprints.Link(graph, [big.id, 'Out'], [branch.id, 'Condition']);
		blueprints.Link(graph, [start.id, 'Then'], [branch.id, 'In']);

		/* Big: the damage is added up by a loop, then told after a while. */
		blueprints.Link(graph, [branch.id, 'True'], [loop.id, 'In']);
		blueprints.Link(graph, [damage.id, 'Value'], [loop.id, 'To']);
		blueprints.Link(graph, [loop.id, 'Body'], [keep.id, 'In']);
		blueprints.Link(graph, [total.id, 'Value'], [add.id, 'A']);
		blueprints.Link(graph, [loop.id, 'Index'], [add.id, 'B']);
		blueprints.Link(graph, [add.id, 'Out'], [keep.id, 'Value']);
		blueprints.Link(graph, [loop.id, 'Done'], [wait.id, 'In']);
		blueprints.Link(graph, [wait.id, 'Then'], [tell.id, 'In']);
		blueprints.Link(graph, [total.id, 'Value'], [tell.id, 'Value']);

		/* Small: only written down by an action of the context. */
		blueprints.Link(graph, [branch.id, 'False'], [log.id, 'In']);
		blueprints.Link(graph, [damage.id, 'Value'], [log.id, 'Value']);

		instance = blueprints.Start(stored(graph), {
			Actions: {
				Log: function (value, done) {
					logged.push(value);

					done(null, true);
				}
			},
			Timer: function (seconds, run) {
				timers.push([seconds, run]);
			}
		});

		instance.On('Hurt', function (value) {
			told.push(value);
		});

		instance.Emit('Hit', {Damage: 2}, function (error) {
			finished = error;
		});

		expect(logged).toEqual([2]);
		expect(finished).toBe(null);

		instance.Variables.Total = 0;
		finished = 'waiting';

		instance.Emit('Hit', {Damage: 5}, function (error) {
			finished = error;
		});

		/* 0 + 1 + 2 + 3 + 4, and nothing told before the delay ends. */
		expect(instance.Variables.Total).toBe(10);
		expect(told).toEqual([]);
		expect(finished).toBe('waiting');
		expect(timers.map(function (timer) {
			return timer[0];
		})).toEqual([1]);

		timers[0][1]();

		expect(told).toEqual([10]);
		expect(finished).toBe(null);

		/* Stopped, it runs no more. */
		instance.Stop();
		instance.Emit('Hit', {Damage: 1});

		expect(logged).toEqual([2]);
	});

	it('runs the ways of a Sequence in order, each to its end, and stops a flow that never ends', function () {
		var graph = blueprints.Create('flow');
		var start = blueprints.Add(graph, 'Event', {properties: {Name: 'Go'}});
		var sequence = blueprints.Add(graph, 'Sequence');
		var one = blueprints.Add(graph, 'Emit', {properties: {Name: 'Said'}});
		var two = blueprints.Add(graph, 'Emit', {properties: {Name: 'Said'}});
		var three = blueprints.Add(graph, 'Emit', {properties: {Name: 'Said'}});
		var text = blueprints.Add(graph, 'Text', {properties: {Value: 'a'}});
		var other = blueprints.Add(graph, 'Text', {properties: {Value: 'b'}});
		var last = blueprints.Add(graph, 'Text', {properties: {Value: 'c'}});
		var said = [];
		var instance;
		var endless;
		var error = null;

		blueprints.Link(graph, [start.id, 'Then'], [sequence.id, 'In']);
		blueprints.Link(graph, [sequence.id, 'First'], [one.id, 'In']);
		blueprints.Link(graph, [sequence.id, 'Second'], [three.id, 'In']);
		blueprints.Link(graph, [one.id, 'Then'], [two.id, 'In']);
		blueprints.Link(graph, [text.id, 'Value'], [one.id, 'Value']);
		blueprints.Link(graph, [other.id, 'Value'], [two.id, 'Value']);
		blueprints.Link(graph, [last.id, 'Value'], [three.id, 'Value']);

		instance = blueprints.Start(graph, {});

		instance.On('Said', function (value) {
			said.push(value);
		});
		instance.Emit('Go');

		expect(said).toEqual(['a', 'b', 'c']);

		/* A flow round and round with no wait. */
		graph = blueprints.Create('flow');
		start = blueprints.Add(graph, 'Event', {properties: {Name: 'Go'}});
		one = blueprints.Add(graph, 'Emit', {properties: {Name: 'Again'}});

		blueprints.Link(graph, [start.id, 'Then'], [one.id, 'In']);
		blueprints.Link(graph, [one.id, 'Then'], [one.id, 'In']);

		endless = blueprints.Start(graph, {});

		endless.Emit('Go', null, function (caught) {
			error = caught;
		});

		expect(error.message).toBe('Elemenx Blueprints: a flow ran more than 100000 steps at once');
	});

	it('lets an application add types of blocks and kinds of graphs; the library lists its own', function () {
		var graph;
		var made;
		var present;
		var blend;
		var sky;
		var ground;
		var log = [];

		expect(blueprints.Graphs()).toEqual(expect.arrayContaining(['pass', 'material', 'render', 'generator', 'flow']));
		expect(blueprints.Nodes('pass')).toContain('Texture');
		expect(blueprints.Nodes('pass')).not.toContain('Event');
		expect(blueprints.NodeOf('Mix').Inputs.length).toBe(3);

		blueprints.Node('Square', {Graphs: ['pass', 'generator'], Inputs: [{Key: 'X', Type: 'same', Value: 0}], Outputs: [{Key: 'Out', Type: 'same'}], GLSL: '{X} * {X}', Compute: function (inputs) {
			return {Out: inputs.X * inputs.X};
		}});

		graph = blueprints.Create('generator');

		blueprints.Link(graph, [blueprints.Add(graph, 'Number', {properties: {Value: 7}}).id, 'Value'], [blueprints.Add(graph, 'Square').id, 'X']);
		blueprints.Link(graph, [graph.blocks[1].id, 'Out'], [blueprints.Add(graph, 'Result').id, 'Value']);

		made = blueprints.Compile(graph);

		expect(made.Run()).toEqual({Value: 49});

		/* A render graph runs the passes of its blocks in order, each given what the ones before gave. */
		blueprints.Node('Fill', {Graphs: ['render'], Properties: [{Key: 'Name', Type: 'text', Value: ''}], Outputs: [{Key: 'Color', Type: 'texture'}], Pass: function (context, inputs, properties) {
			context.Log.push('fill ' + properties.Name);

			return {Color: properties.Name};
		}});
		blueprints.Node('Blend', {Graphs: ['render'], Inputs: [{Key: 'A', Type: 'texture'}, {Key: 'B', Type: 'texture'}], Outputs: [{Key: 'Color', Type: 'texture'}], Pass: function (context, inputs) {
			context.Log.push('blend');

			return {Color: inputs.A + '+' + inputs.B};
		}});

		graph = blueprints.Create('render');
		present = blueprints.Add(graph, 'Present');
		blend = blueprints.Add(graph, 'Blend');
		sky = blueprints.Add(graph, 'Fill', {properties: {Name: 'sky'}});
		ground = blueprints.Add(graph, 'Fill', {properties: {Name: 'ground'}});

		blueprints.Link(graph, [sky.id, 'Color'], [blend.id, 'A']);
		blueprints.Link(graph, [ground.id, 'Color'], [blend.id, 'B']);
		blueprints.Link(graph, [blend.id, 'Color'], [present.id, 'Color']);

		made = blueprints.Compile(graph);

		expect(made.Run({Log: log})).toBe('sky+ground');
		expect(log).toEqual(['fill sky', 'fill ground', 'blend']);

		/* What each texture is read by last: after that pass its target may be used again. */
		expect(made.Passes.filter(function (pass) {
			return pass.ID === sky.id;
		})[0].Last).toBe(made.Passes.map(function (pass) {
			return pass.ID;
		}).indexOf(blend.id));
	});
});
