import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

describe('Contract: Blueprints, graphs in the JSON of Flowprint made into shaders, passes, code and flows', function () {
	var blueprints;
	var graphics;
	var math;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints', 'service:Renderer', 'service:Meshes', 'service:Math', 'service:Noise', 'service:BlueprintShaders']);

		blueprints = Elemenx.Service('Blueprints');
		graphics = Elemenx.Service('Renderer');
		math = Elemenx.Service('Math');
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

	/*
	 * Blueprints is of ElemenxCommon: the kinds of shaders are of BlueprintShaders, a Service of a Library over it, made
	 * as a graph of such a kind is first met, so an Application calls nothing first.
	 */
	it('makes its Service of shaders as a graph of shaders is met: the kinds of shaders and their blocks come with it', function () {
		var fresh = Elemenx.Application('BlueprintsShadersFresh', {}).$Service('Blueprints');
		var code = fresh.Create('generator');
		var made;

		expect(fresh.NodeOf('Number').Graphs).toEqual(['generator', 'flow']);

		fresh.Link(code, [fresh.Add(code, 'Number', {properties: {Value: 2}}).id, 'Value'], [fresh.Add(code, 'Result').id, 'Value']);

		expect(fresh.Compile(code).Run()).toEqual({Value: 2});
		expect(fresh.NodeOf('Number').Graphs).toEqual(['generator', 'flow']);

		/* A file of a pass, as it comes. */
		made = fresh.Compile({version: 1, type: 'pass', blocks: [{id: 'o', type: 'Output'}], links: []});

		expect(made.Fragment).toContain('outColor = vec4(0.0, 0.0, 0.0, 1.0);');
		expect(fresh.Graphs()).toEqual(expect.arrayContaining(['generator', 'flow', 'pass', 'material', 'render', 'vertex']));
		expect(fresh.NodeOf('Number').Graphs).toEqual(['generator', 'flow', 'pass', 'material', 'vertex', 'water', 'sky', 'land', 'bake', 'render']);
		expect(typeof fresh.NodeOf('Add').GLSL).toBe('string');
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

	/* A GLSL block: code of its own in a graph, its pins named by its properties, its errors told on it. */
	it('runs the code of a GLSL block on its pins, makes the pins its properties name, and tells its errors on it', function () {
		var graph = blueprints.Create('pass');
		var color = blueprints.Add(graph, 'Color', {properties: {Color: '#ff0000'}});
		var gain = blueprints.Add(graph, 'Number', {properties: {Value: 0.5}});
		var code = blueprints.Add(graph, 'GLSL', {id: 'mix', properties: {Inputs: 'Tint: vec3, Gain: float', Outputs: 'Out: vec4', Code: 'uniform float uTime;\nOut = vec4(Tint * Gain + uTime * 0.0, 1.0);'}});
		var output = blueprints.Add(graph, 'Output');
		var made;
		var pixels;
		var renderer = graphics.Create(document.createElement('canvas'), {Antialias: false});
		var log = '';

		expect(code.pins.filter(function (pin) {
			return pin.kind === 'value';
		}).map(function (pin) {
			return pin.key + ':' + pin.type;
		})).toEqual(['Tint:vec3', 'Gain:float', 'Out:vec4']);

		blueprints.Link(graph, [color.id, 'RGB'], [code.id, 'Tint']);
		blueprints.Link(graph, [gain.id, 'Value'], [code.id, 'Gain']);
		blueprints.Link(graph, [code.id, 'Out'], [output.id, 'Color']);

		made = blueprints.Compile(stored(graph));

		expect(made.Fragment).toContain('#line 1 1003');
		expect(made.Uniforms.map(function (uniform) {
			return uniform.Name;
		})).toContain('uTime');

		pixels = draw(made.Fragment, made.Values({}, {Time: 1}), 2);

		expect(Math.abs(pixels[0] - 127.5)).toBeLessThan(1.5);
		expect([pixels[1], pixels[2]]).toEqual([0, 0]);

		/* Other pins named: the gone one goes with its link, the one kept keeps its link and takes its new type. */
		code.properties.filter(function (property) {
			return property.key === 'Inputs';
		})[0].value = 'Tint: vec4';

		blueprints.Pins(code);

		expect(blueprints.Prune(graph).length).toBe(1);
		expect(blueprints.Pin(code, 'Tint', false).type).toBe('vec4');
		expect(blueprints.Pin(code, 'Gain', false)).toBe(null);
		expect(graph.links.length).toBe(2);

		/* An error of its code is on the block, at its line there. */
		code.properties.filter(function (property) {
			return property.key === 'Code';
		})[0].value = 'Out = vec4(Tint);\nOut = nothing;';

		made = blueprints.Compile(stored(graph));

		try {
			renderer.Program(graphics.Shaders.Quad, made.Fragment);
		}
		catch (error) {
			log = error.message;
		}

		renderer.Destroy();

		expect(Elemenx.Service('BlueprintShaders').Errors(made, log).filter(function (one) {
			return one.Block === 'mix';
		})[0]).toMatchObject({Block: 'mix', Line: 2});
	});

	/* A vertex graph moves the corners of a shape: blueprintVertex, of blocks or written by hand. */
	it('makes a vertex graph a function that moves a corner and its normal, of blocks or of GLSL written by hand', function () {
		var graph = blueprints.Create('vertex', {parameters: [{key: 'Lift', type: 'float', value: 2}]});
		var world = blueprints.Add(graph, 'World');
		var lift = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Lift'}});
		var up = blueprints.Add(graph, 'Combine');
		var add = blueprints.Add(graph, 'Add');
		var end = blueprints.Add(graph, 'Vertex');
		var made;
		var written;

		blueprints.Link(graph, [lift.id, 'Value'], [up.id, 'Y']);
		blueprints.Link(graph, [world.id, 'World'], [add.id, 'A']);
		blueprints.Link(graph, [up.id, 'XYZ'], [add.id, 'B']);
		blueprints.Link(graph, [add.id, 'Out'], [end.id, 'World']);

		made = blueprints.Compile(stored(graph));

		expect(made.Type).toBe('vertex');
		expect(made.Function.indexOf('void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {')).toBe(0);
		expect(made.Function).toContain('world = ');
		expect(made.Function).toContain('bent = bent;');
		expect(made.Values({Lift: 3})).toEqual({uParameter_Lift: 3});
		expect(blueprints.Nodes('vertex')).toEqual(expect.arrayContaining(['World', 'Position', 'Normal', 'UV', 'Sway', 'Phase', 'Size', 'Wind', 'Time', 'Noise', 'GLSL', 'Vertex']));
		expect(blueprints.Nodes('vertex')).not.toContain('Texture');

		written = blueprints.Compile({type: 'vertex', glsl: 'uniform float uParameter_Sway; // = 0.2\nuniform float uTime;\n\nvoid blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\tworld.x += sin(uTime) * uParameter_Sway * position.y;\n}'});

		expect(written.Parameters).toEqual([{key: 'Sway', type: 'float', value: 0.2}]);
		expect(written.Values({}, {Time: 1})).toEqual({uParameter_Sway: 0.2, uTime: 1});
		expect(function () {
			blueprints.Compile({type: 'vertex', glsl: 'void main() {}'});
		}).toThrow('Elemenx Blueprints: a vertex written by hand has no blueprintVertex');
	});

	/* A shader written by hand is a graph made: its uniforms, parameters, textures and parts of shaders read from its text. */
	it('makes a material and a pass written by hand of their GLSL, and draws the pass', function () {
		var material = blueprints.Compile({type: 'material', glsl: '// needs: Noise\nuniform vec3 uParameter_Tint; // = #ff8000\nuniform float uParameter_Gain; // = 0.5\nuniform float uTime;\nuniform sampler2D uTexture_Rust;\n\nvec3 rusted (vec2 uv) {\n\treturn texture(uTexture_Rust, uv).rgb;\n}\n\nvoid blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {\n\tcolor = rusted(uv) * uParameter_Tint * uParameter_Gain + noise3(position) * 0.0 + uTime * 0.0;\n}'});
		var pass = blueprints.Compile({type: 'pass', glsl: 'uniform float uParameter_Red; // = 1\n\nvoid main() {\n\toutColor = vec4(uParameter_Red, 0.0, 0.0, 1.0);\n}'});
		var whole = '#version 300 es\nprecision highp float;\nin vec2 vQuad;\nout vec4 outColor;\nuniform float uParameter_Blue;\nvoid main() {\n\toutColor = vec4(0.0, 0.0, uParameter_Blue, 1.0);\n}';
		var pixels;

		expect(material.Type).toBe('material');
		expect(material.Needs).toEqual(['Noise']);
		expect(material.Textures).toEqual([{Name: 'Rust', Uniform: 'uTexture_Rust'}]);
		expect(material.Parameters).toEqual([{key: 'Tint', type: 'vec3', value: '#ff8000'}, {key: 'Gain', type: 'float', value: 0.5}]);
		expect(material.Values({Gain: 2}, {Time: 3})).toEqual({uParameter_Tint: [1, 128 / 255, 0], uParameter_Gain: 2, uTime: 3});
		expect(material.Function.indexOf('vec3 rusted (vec2 uv)')).toBe(0);
		expect(material.Function).not.toContain('uniform');
		expect(material.Source).toContain('uniform sampler2D uTexture_Rust;');
		expect(material.Source).toContain('float noise3(');

		pixels = draw(pass.Fragment, pass.Values(), 2);

		expect([pixels[0], pixels[1], pixels[2]]).toEqual([255, 0, 0]);

		/* Another text is another graph; the same text is made once, the parameters a record gives over those of its text. */
		expect(blueprints.Compile({type: 'material', glsl: material.Function.replace(/^vec3 rusted[\s\S]*?\n}\n\n/, '')}).Hash).not.toBe(material.Hash);
		expect(blueprints.Compile({type: 'pass', glsl: 'uniform float uParameter_Red; // = 1\n\nvoid main() {\n\toutColor = vec4(uParameter_Red, 0.0, 0.0, 1.0);\n}', parameters: [{key: 'Red', type: 'float', value: 0.25}]})).toBe(pass);
		expect(pass.Values()).toEqual({uParameter_Red: 0.25});

		/* A whole fragment shader is kept as it is; its uniforms still read. */
		expect(blueprints.Compile({type: 'pass', glsl: whole}).Fragment).toBe(whole);
		expect(draw(whole, blueprints.Compile({type: 'pass', glsl: whole}).Values({Blue: 1}), 2)[2]).toBe(255);

		/* A pass written by hand is baked like one of blocks. */
		expect(blueprints.Compile(stored(blueprints.Bake({type: 'pass', glsl: whole}))).Fragment).toBe(whole);

		expect(function () {
			blueprints.Compile({type: 'pass', glsl: 'float nothing;'});
		}).toThrow('Elemenx Blueprints: a pass written by hand has no main');
		expect(function () {
			blueprints.Compile({type: 'material', glsl: 'void main() {}'});
		}).toThrow('Elemenx Blueprints: a material written by hand has no blueprintSurface');
		expect(function () {
			blueprints.Compile({type: 'generator', glsl: 'void main() {}'});
		}).toThrow('Elemenx Blueprints: a generator graph is not written by hand');
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
		var noise = math.Noise();

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
	/* A noise of any algorithm by its spec: the same in a graph that runs as code and in a shader of the card. */
	it('reads a noise of the Noise Service by the spec of its block, in a generator and in a pass, the same numbers', function () {
		var properties = {Type: 'worley', Seed: 'cells', Fractal: 'fbm', Octaves: 3, Cell: 'edge', Warp: 0.5};
		var spec = blueprints.NoiseOf(properties);
		var sampler = Elemenx.Service('Noise').Make(spec);
		var graph = blueprints.Create('generator');
		var input = blueprints.Add(graph, 'Input', {properties: {Name: 'At'}});
		var noise = blueprints.Add(graph, 'NoiseSpec', {properties: properties});
		var result = blueprints.Add(graph, 'Result', {properties: {Key: 'Value'}});
		var pass = blueprints.Create('pass');
		var point = blueprints.Add(pass, 'Vector', {properties: {Size: 3, X: 1.3, Y: 2.7, Z: 0.4}});
		var shaded = blueprints.Add(pass, 'NoiseSpec', {properties: properties});
		var output = blueprints.Add(pass, 'Output');
		var made;
		var pixels;

		blueprints.Link(graph, [input.id, 'Value'], [noise.id, 'Position']);
		blueprints.Link(graph, [noise.id, 'Value'], [result.id, 'Value']);
		blueprints.Link(pass, [point.id, 'Value'], [shaded.id, 'Position']);
		blueprints.Link(pass, [shaded.id, 'Value'], [output.id, 'Color']);

		expect(spec).toMatchObject({Type: 'worley', Seed: 'cells', Cell: {Return: 'edge'}, Warp: {Amount: 0.5}});
		expect(blueprints.Compile(stored(graph)).Run({}, {At: [1, 2, 3]}).Value).toBe(sampler.At(1, 2, 3));

		made = blueprints.Compile(stored(pass));

		expect(made.Fragment).toContain('float enx_worley3(');

		pixels = draw(made.Fragment, made.Values({}), 2);

		expect(Math.abs(pixels[0] / 255 - sampler.At(1.3, 2.7, 0.4))).toBeLessThan(1.5 / 255);
	});
	/* A generator as JavaScript: what a ground reads at every point of its heights, with no walk of the blocks each time. */
	it('makes a generator JavaScript that gives the very values of its Run, many times faster; a graph with a block of no code gives null', function () {
		var graph = blueprints.Create('generator', {parameters: [{key: 'Gain', type: 'float', value: 2}]});
		var at = blueprints.Add(graph, 'Input', {properties: {Name: 'At'}});
		var split = blueprints.Add(graph, 'Split');
		var fbm = blueprints.Add(graph, 'Fbm', {properties: {Octaves: 5}});
		var cells = blueprints.Add(graph, 'NoiseSpec', {properties: {Type: 'worley', Seed: 'c', Fractal: 'fbm', Octaves: 2, Cell: 'edge'}});
		var gain = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Gain'}});
		var times = blueprints.Add(graph, 'Multiply');
		var mix = blueprints.Add(graph, 'Mix');
		var smooth = blueprints.Add(graph, 'Smoothstep');
		var remap = blueprints.Add(graph, 'Remap');
		var combine = blueprints.Add(graph, 'Combine');
		var length = blueprints.Add(graph, 'Length');
		var sine = blueprints.Add(graph, 'Sin');
		var compare = blueprints.Add(graph, 'Compare', {properties: {Operator: '>'}});
		var color = blueprints.Add(graph, 'Color', {properties: {Color: '#336699'}});
		var height = blueprints.Add(graph, 'Result', {properties: {Key: 'Height'}});
		var tint = blueprints.Add(graph, 'Result', {properties: {Key: 'Tint'}});
		var high = blueprints.Add(graph, 'Result', {properties: {Key: 'High'}});
		var size = blueprints.Add(graph, 'Result', {properties: {Key: 'Size'}});
		var made;
		var code;
		var started;
		var slow;
		var fast;
		var i;

		blueprints.Link(graph, [at.id, 'Value'], [fbm.id, 'Position']);
		blueprints.Link(graph, [at.id, 'Value'], [cells.id, 'Position']);
		blueprints.Link(graph, [at.id, 'Value'], [split.id, 'Vector']);
		blueprints.Link(graph, [fbm.id, 'Value'], [times.id, 'A']);
		blueprints.Link(graph, [gain.id, 'Value'], [times.id, 'B']);
		blueprints.Link(graph, [times.id, 'Out'], [mix.id, 'A']);
		blueprints.Link(graph, [cells.id, 'Value'], [mix.id, 'B']);
		blueprints.Link(graph, [split.id, 'X'], [mix.id, 'T']);
		blueprints.Link(graph, [mix.id, 'Out'], [smooth.id, 'X']);
		blueprints.Link(graph, [smooth.id, 'Out'], [remap.id, 'X']);
		blueprints.Link(graph, [remap.id, 'Out'], [height.id, 'Value']);
		blueprints.Link(graph, [split.id, 'Y'], [combine.id, 'X']);
		blueprints.Link(graph, [sine.id, 'Out'], [combine.id, 'Y']);
		blueprints.Link(graph, [split.id, 'Z'], [sine.id, 'X']);
		blueprints.Link(graph, [combine.id, 'XYZ'], [length.id, 'X']);
		blueprints.Link(graph, [length.id, 'Out'], [size.id, 'Value']);
		blueprints.Link(graph, [fbm.id, 'Value'], [compare.id, 'A']);
		blueprints.Link(graph, [cells.id, 'Value'], [compare.id, 'B']);
		blueprints.Link(graph, [compare.id, 'Out'], [high.id, 'Value']);
		blueprints.Link(graph, [color.id, 'RGB'], [tint.id, 'Value']);

		made = blueprints.Compile(stored(graph));
		code = blueprints.Code(stored(graph));

		expect(code.Keys.sort()).toEqual(['Height', 'High', 'Size', 'Tint']);

		for (i = 0; i < 200; i++) {
			var point = {At: [Math.sin(i) * 40, Math.cos(i * 1.7) * 9, i * 0.37 - 20]};

			expect(code.Run({Gain: 1 + i % 3}, point)).toEqual(made.Run({Gain: 1 + i % 3}, point));
		}

		expect(code.Run({}, {At: [1, 2, 3]})).toEqual(made.Run({}, {At: [1, 2, 3]}));

		/* The same, faster: no walk of the blocks, no objects of their values (a graph of numbers alone, where the walk is the cost). */
		var sums = blueprints.Create('generator');
		var input = blueprints.Add(sums, 'Input', {properties: {Name: 'At'}});
		var parts = blueprints.Add(sums, 'Split');
		var last = [parts.id, 'X'];
		var j;

		blueprints.Link(sums, [input.id, 'Value'], [parts.id, 'Vector']);

		for (j = 0; j < 12; j++) {
			var step = blueprints.Add(sums, j % 2 ? 'Multiply' : 'Add');

			blueprints.Link(sums, last, [step.id, 'A']);
			blueprints.Link(sums, [parts.id, j % 3 ? 'Y' : 'Z'], [step.id, 'B']);

			last = [step.id, 'Out'];
		}

		var end = blueprints.Add(sums, 'Result');

		blueprints.Link(sums, last, [end.id, 'Value']);

		made = blueprints.Compile(stored(sums));
		code = blueprints.Code(stored(sums));

		expect(code.Run({}, {At: [1.5, 0.5, 2]})).toEqual(made.Run({}, {At: [1.5, 0.5, 2]}));

		/*
		 * Regression: timed cold, under load the first loop paid for the warming of the engine; timed one after the other, a
		 * load that came between them fell on one alone. Warmed, the two in turn each round, the best of each.
		 */
		function once (run) {
			var k;

			started = performance.now();

			for (k = 0; k < 20000; k++)
				run({}, {At: [k * 0.1, 0.5, k * 0.2]});

			return performance.now() - started;
		}

		var round;

		slow = Infinity;
		fast = Infinity;

		for (round = 0; round < 6; round++) {
			var a = once(made.Run);
			var b = once(code.Run);

			/* The first round warms. */
			if (round) {
				slow = Math.min(slow, a);
				fast = Math.min(fast, b);
			}
		}

		expect(fast * 5).toBeLessThan(slow);

		/* A block of no code: no code of the graph. */
		var other = blueprints.Create('generator');
		var object = blueprints.Add(other, 'Input', {properties: {Name: 'Thing'}});
		var field = blueprints.Add(other, 'Field', {properties: {Path: 'a.b'}});
		var out = blueprints.Add(other, 'Result');

		blueprints.Link(other, [object.id, 'Value'], [field.id, 'Object']);
		blueprints.Link(other, [field.id, 'Value'], [out.id, 'Value']);

		expect(blueprints.Code(stored(other))).toBe(null);
	});

	/* A formula in a generator made JavaScript too (the rules of planets read it at each point): the values of its interpreter. */
	it('makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part', function () {
		var graph = blueprints.Create('generator');
		var at = blueprints.Add(graph, 'Input', {properties: {Name: 'At'}});
		var height = blueprints.Add(graph, 'Input', {properties: {Name: 'Height'}});
		var formula = blueprints.Add(graph, 'Formula', {properties: {Expression: 'clamp(mix(Height, At[0] * 2, 0.25) + pow(abs(At[1]), 1.5) - (At[2] > 0 ? 3 : -4) / 2, -50, 50) + round(hypot(At[0], At[1]))'}});
		var each = blueprints.Add(graph, 'Formula', {properties: {Expression: '-At * 2 + vec3(1, 2, 3)'}});
		var result = blueprints.Add(graph, 'Result', {properties: {Key: 'Value'}});
		var list = blueprints.Add(graph, 'Result', {properties: {Key: 'List'}});
		var made;
		var code;
		var i;

		blueprints.Link(graph, [at.id, 'Value'], [formula.id, 'At']);
		blueprints.Link(graph, [height.id, 'Value'], [formula.id, 'Height']);
		blueprints.Link(graph, [at.id, 'Value'], [each.id, 'At']);
		blueprints.Link(graph, [formula.id, 'Value'], [result.id, 'Value']);
		blueprints.Link(graph, [each.id, 'Value'], [list.id, 'Value']);

		made = blueprints.Compile(stored(graph));
		code = blueprints.Code(stored(graph));

		expect(code).not.toBe(null);

		for (i = 0; i < 100; i++) {
			var point = {At: [Math.sin(i) * 30, Math.cos(i * 1.3) * 7, i * 0.4 - 20], Height: i * 3 - 100};

			expect(code.Run({}, point)).toEqual(made.Run({}, point));
		}
	});

	/* A minus before a name, a bracket or a call; a parameter not given is the value of the graph, in the code as block by block. */
	it('reads a minus before a name, a bracket or a call, and the parameters a run is not given as those of the graph', function () {
		var graph = blueprints.Create('generator', {parameters: [{key: 'Most', type: 'float', value: 4}]});
		var a = blueprints.Add(graph, 'Input', {properties: {Name: 'A'}});
		var most = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Most', Type: 'float'}});
		var formula = blueprints.Add(graph, 'Formula', {properties: {Expression: 'max(-Most, -(A < 0 ? -1 : 1) * abs(A) * 2 + -min(A, 1))'}});
		var result = blueprints.Add(graph, 'Result', {properties: {Key: 'Value'}});
		var made;
		var code;

		blueprints.Link(graph, [a.id, 'Value'], [formula.id, 'A']);
		blueprints.Link(graph, [most.id, 'Value'], [formula.id, 'Most']);
		blueprints.Link(graph, [formula.id, 'Value'], [result.id, 'Value']);

		made = blueprints.Compile(stored(graph));
		code = blueprints.Code(stored(graph));

		expect(blueprints.FormulaValue(blueprints.Formula('-2 * -(3 - 5) + -abs(-1)').Tree, {})).toBe(-5);
		expect(made.Run({}, {A: 1}).Value).toBe(-3);
		expect(code.Run({}, {A: 1}).Value).toBe(-3);
		expect(code.Run({}, {A: -0.5}).Value).toBeCloseTo(1.5, 6);
		expect(code.Run({}, {A: 10}).Value).toBe(-4);
		expect(made.Run({Most: 30}, {A: 10}).Value).toBe(-21);
		expect(code.Run({Most: 30}, {A: 10}).Value).toBe(-21);
	});
});

describe('Contract: the graphs of the Libraries as resources, made for their options', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints', 'service:SceneSower', 'service:SceneTerrainGenerator', 'service:SceneWorld', 'service:SceneMaterials', 'service:SceneTextures', 'service:SceneRoads', 'service:SceneBiomes', 'service:Noise', 'service:Math', 'service:Random', 'service:Workers']);
	});

	it('fills the parameters of a graph by key and the {Key} of the texts of its properties', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('generator', {parameters: [{key: 'Size', type: 'float', value: 1}, {key: 'Other', type: 'float', value: 2}]});
		var noise = blueprints.Add(graph, 'NoiseSpec', {properties: {Type: 'value', Seed: '{Seed}-wet {Missing}'}});

		expect(blueprints.Fill(graph, {Size: 5, Other: null, Seed: 'hill'})).toBe(graph);
		expect(graph.parameters.map(function (parameter) {
			return parameter.value;
		})).toEqual([5, 2]);
		expect(blueprints.Find(graph, noise.id).properties.filter(function (property) {
			return property.key === 'Seed';
		})[0].value).toBe('hill-wet {Missing}');
	});

	/* The graphs a Library built of code: now its resources, which an Application may give in their place. */
	it('reads the graphs of the library from its resources, one of the same name of an Application in their place', function () {
		var sower = Elemenx.Service('SceneSower');
		var kept = Elemenx.Resources('Blueprints', 'ElemenxGraphics/scatter');
		var graph = sower.LibraryScatter({ID: 'pines', MaxSlope: 0.5, Clumps: 3});

		expect(Elemenx.Resources('Blueprints')).toEqual(expect.arrayContaining(['ElemenxGraphics/water', 'ElemenxGraphics/wind', 'ElemenxGraphics/grass', 'ElemenxGraphics/land', 'ElemenxGraphics/sky', 'ElemenxGraphics/picture', 'ElemenxGraphics/relief', 'ElemenxGraphics/scatter']));
		expect(graph.name).toBe('Scatter');
		expect(graph.parameters.filter(function (parameter) {
			return parameter.key === 'MaxSlope' || parameter.key === 'Clumps';
		}).map(function (parameter) {
			return parameter.value;
		})).toEqual([0.5, 1]);
		expect(JSON.stringify(graph)).toContain('"value":"pines"');

		try {
			Elemenx.Resources('Blueprints', 'ElemenxGraphics/scatter', {name: 'Mine', type: 'generator', parameters: [], blocks: [], links: []});

			expect(sower.LibraryScatter({}).name).toBe('Mine');
		}
		finally {
			Elemenx.Resources('Blueprints', 'ElemenxGraphics/scatter', kept);
		}
	});

	/* The world of options was a chain built in code: now the template of a resource, its steps turned on as they are told. */
	it('makes the world of options of the template of its resource, a step for each item of a list, the others turned off', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = Elemenx.Service('SceneWorld').Library({Size: 300, Tunnels: [{Radius: 3}, {Radius: 4}], Scatters: [{ID: 'pines'}]});
		var on = graph.blocks.filter(function (block) {
			return block.enabled !== false;
		}).map(function (block) {
			return block.id;
		}).sort();

		expect(on).toEqual(['climate', 'ground', 'relief', 'scatter', 'terrain', 'tunnel', 'tunnel-2']);
		expect(blueprints.Check(graph)).toEqual([]);
		expect(blueprints.Properties(blueprints.Find(graph, 'tunnel-2')).Radius).toBe(4);
		expect(graph.links.filter(function (link) {
			return link.p1 === 'tunnel-out-Land';
		})[0].p2).toBe('tunnel-2-in-Land');
		expect(graph.links.filter(function (link) {
			return link.p1 === 'tunnel-2-out-Land';
		})[0].p2).toBe('caves-in-Land');
	});

	/* Regression: a block turned off gave its first input to every output: a step of roads turned off gave its land as its things. */
	it('passes on what comes to a block turned off by the name and the type of each output', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = Elemenx.Service('SceneWorld').Library({Size: 300});
		var plan = blueprints.Plan(graph);

		expect(blueprints.Passed(plan, 'roads')).toEqual({Land: 'Land', Things: null});
		expect(blueprints.Passed(plan, 'scatter')).toEqual({Things: 'Under'});
		expect(blueprints.Passed(plan, 'planet')).toEqual({Land: 'Land'});
	});

	/* The materials and the textures were code of their Services: now graphs of a block GLSL each, in the resources. */
	it('defines the materials and the textures of their resources, one of an Application in the place of one of them', function () {
		var materials = Elemenx.Service('SceneMaterials');
		var textures = Elemenx.Service('SceneTextures');
		var kept = Elemenx.Resources('Blueprints', 'ElemenxGraphics/materials/sand');
		var mine = JSON.parse(JSON.stringify(kept));

		expect(materials.Names().slice(0, 3)).toEqual(['lawn', 'soil', 'gravel']);
		expect(materials.Get('lawn')).toMatchObject({Title: 'Lawn', Group: 'ground', Land: true, Texture: 'lawn'});
		expect(materials.Get('sand').Code).toContain('ripple');
		expect(textures.Get('lawn').Params.Density).toEqual({Value: 1, Min: 0.4, Max: 1.6, Title: 'Density'});
		expect(textures.Get('paving').Rows).toBe(true);
		expect(textures.Get('lawn').Code).toContain('// Its midrib');

		mine.blocks[0].properties[0].value = '	r = 0.5;';

		try {
			Elemenx.Resources('Blueprints', 'ElemenxGraphics/materials/sand', mine);

			materials.Library();

			expect(materials.Get('sand').Code).toBe('	r = 0.5;');
		}
		finally {
			Elemenx.Resources('Blueprints', 'ElemenxGraphics/materials/sand', kept);

			materials.Library();
		}
	});

	/* The surfaces and the types of roads were data written in the code: now data of the resources. */
	it('defines the surfaces and the types of roads of their resources, in their order, one of an Application in the place of one', function () {
		var roads = Elemenx.Service('SceneRoads');
		var kept = Elemenx.Resources('Data', 'ElemenxGraphics/road-types/lane');

		expect(roads.Type('road')).toMatchObject({Title: 'Road', Group: 'road', Speed: 90});
		expect(roads.Type('road').Order).toBe(undefined);

		try {
			Elemenx.Resources('Data', 'ElemenxGraphics/road-types/lane', Object.assign({}, kept, {Speed: 33}));

			roads.Library();

			expect(roads.Type('lane').Speed).toBe(33);
		}
		finally {
			Elemenx.Resources('Data', 'ElemenxGraphics/road-types/lane', kept);

			roads.Library();
		}
	});

	/* The lands were data written in the code: now data of the resources. */
	it('reads the lands of their resources, in their order', function () {
		var biomes = Elemenx.Service('SceneBiomes');

		expect(biomes.Names()).toEqual(['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'alien', 'rainforest', 'semidesert', 'steppe', 'scorched-plains', 'scorched-highlands', 'hydrocarbon-dunes', 'hydrocarbon-shores', 'dust-plains', 'dust-highlands', 'frozen-plains', 'frozen-ridges', 'barren-maria', 'barren-highlands']);
		expect(biomes.Get('taiga').Ground.Materials).toEqual({Low: 'soil', Sand: 'gravel'});
		expect(biomes.Get('taiga').Order).toBe(undefined);
	});

	it('has a Curve of keys over a number: straight, smooth through them or held between them, round a loop or held at its ends', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var keys = [[0, 0], [1, 10], [2, 0], [3, 10]];
		var graph = blueprints.Create('generator');
		var x;
		var curve;
		var result;

		/* Between the keys, as each way says. */
		expect(blueprints.CurveAt(keys, 0.5, 'linear', 0)).toBeCloseTo(5, 9);
		expect(blueprints.CurveAt(keys, 0.5, 'step', 0)).toBe(0);
		expect(blueprints.CurveAt(keys, 1, 'smooth', 0)).toBeCloseTo(10, 9);
		expect(blueprints.CurveAt(keys, 1.5, 'smooth', 0)).toBeCloseTo(5, 9);

		/* Held at its ends, or round its loop (the last key going on into the first). */
		expect(blueprints.CurveAt(keys, -4, 'smooth', 0)).toBe(0);
		expect(blueprints.CurveAt(keys, 9, 'smooth', 0)).toBe(10);
		expect(blueprints.CurveAt(keys, 4.5, 'linear', 4)).toBeCloseTo(5, 9);
		expect(blueprints.CurveAt(keys, 3.5, 'linear', 4)).toBeCloseTo(5, 9);
		expect(blueprints.CurveAt(keys, -0.5, 'linear', 4)).toBeCloseTo(5, 9);

		/* Its keys written as JSON, in any order. */
		expect(blueprints.CurveAt('[[1, 10], [0, 0]]', 0.25, 'linear', 0)).toBeCloseTo(2.5, 9);

		/* A block of a graph of code: X in, Value out. */
		x = blueprints.Add(graph, 'Input', {properties: {Name: 'T'}});
		curve = blueprints.Add(graph, 'Curve', {properties: {Keys: keys, Smooth: 'linear', Loop: 0}});
		result = blueprints.Add(graph, 'Result', {properties: {Key: 'Value'}});

		blueprints.Link(graph, [x.id, 'Value'], [curve.id, 'X']);
		blueprints.Link(graph, [curve.id, 'Value'], [result.id, 'Value']);

		expect(blueprints.Compile(JSON.parse(blueprints.Write(graph))).Run({}, {T: 2.5}).Value).toBeCloseTo(5, 9);
	});

	/*
	 * Regression: a block of a file that names none of its properties read each as nothing (its numbers 0 in a shader: the
	 * planet graph of the library drew a planet burned white). Now each it does not name is as its type has it by default.
	 */
	it('reads a property a block of a file does not name as its type has it by default', function () {
		var blueprints = Elemenx.Service('Blueprints');

		blueprints.Node('TimesOfDefault', {Graphs: ['generator'], Properties: [{Key: 'Times', Type: 'number', Value: 3}, {Key: 'Plus', Type: 'number', Value: 1}], Inputs: [{Key: 'X', Type: 'float'}], Outputs: [{Key: 'Out', Type: 'float'}], Compute: function (inputs, properties) {
			return {Out: (Number(inputs.X) || 0) * properties.Times + properties.Plus};
		}});

		var graph = blueprints.Read({version: 1, type: 'generator', parameters: [], blocks: [
			{id: 'two', type: 'Number', x: 0, y: 0, properties: [{key: 'Value', value: 2}]},
			{id: 'times', type: 'TimesOfDefault', x: 200, y: 0, properties: [{key: 'Plus', value: 10}]},
			{id: 'result', type: 'Result', x: 400, y: 0, properties: []}
		], links: [
			{id: 'a', p1: 'two-out-Value', p2: 'times-in-X', kind: 'value'},
			{id: 'b', p1: 'times-out-Out', p2: 'result-in-Value', kind: 'value'}
		]});

		expect(blueprints.Compile(graph).Run().Value).toBe(16);
	});

	/*
	 * Contract: a behaviour graph (Agent): a tree of an agent from its Root, its Utility choosing the child of the greatest
	 * Score (a Response of what it knows), keeping it Commit seconds, leaving it for one worth Switch times as much; its tasks
	 * are what the application gives (Tasks), a task left told (Abort). Nothing of a game: a board of numbers and names.
	 */
	it('runs a tree of behaviour: a utility of scores choosing what to do, kept a while, the tasks of the application, the one left told', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('behaviour');
		var root = blueprints.Add(graph, 'Root', {x: 0, y: 0});
		var utility = blueprints.Add(graph, 'Utility', {x: 200, y: 0, properties: {Commit: 0.5, Switch: 1.2}});
		var attack = blueprints.Add(graph, 'Steps', {x: 400, y: 0});
		var aim = blueprints.Add(graph, 'Task', {x: 600, y: 0, properties: {Name: 'aim'}});
		var fire = blueprints.Add(graph, 'Task', {x: 600, y: 100, properties: {Name: 'fire'}});
		var flee = blueprints.Add(graph, 'Task', {x: 400, y: 200, properties: {Name: 'flee'}});
		var patrol = blueprints.Add(graph, 'Task', {x: 400, y: 300, properties: {Name: 'patrol'}});
		var threat = blueprints.Add(graph, 'Input', {x: 0, y: 400, properties: {Name: 'Threat'}});
		var damage = blueprints.Add(graph, 'Input', {x: 0, y: 500, properties: {Name: 'Damage'}});
		var low = blueprints.Add(graph, 'Number', {x: 0, y: 600, properties: {Value: 0.1}});
		var steep = blueprints.Add(graph, 'Response', {x: 200, y: 500, properties: {Shape: 'step', Shift: 0.5}});
		var calls = [];
		var left = [];
		var agent;
		var tick;

		blueprints.Link(graph, [root.id, 'Children'], [utility.id, 'In']);
		[attack, flee, patrol].forEach(function (child) {
			blueprints.Link(graph, [utility.id, 'Children'], [child.id, 'In']);
		});
		[fire, aim].forEach(function (child) {
			blueprints.Link(graph, [attack.id, 'Children'], [child.id, 'In']);
		});
		blueprints.Link(graph, [threat.id, 'Value'], [attack.id, 'Score']);
		blueprints.Link(graph, [damage.id, 'Value'], [steep.id, 'X']);
		blueprints.Link(graph, [steep.id, 'Out'], [flee.id, 'Score']);
		blueprints.Link(graph, [low.id, 'Value'], [patrol.id, 'Score']);

		function stored (one) {
			return JSON.parse(blueprints.Write(one));
		}

		expect(blueprints.Check(stored(graph))).toEqual([]);
		expect(blueprints.Nodes('behaviour')).toEqual(expect.arrayContaining(['Root', 'Selector', 'Steps', 'Parallel', 'Utility', 'Condition', 'Invert', 'Cooldown', 'Limit', 'Loop', 'Wait', 'Remember', 'Task', 'Response', 'Formula', 'Input']));

		agent = blueprints.Agent(stored(graph), {Agent: 'ship-1', Tasks: {
			aim: function (request) {
				calls.push('aim:' + request.Agent + (request.First ? ':first' : ''));

				return request.Board.Aimed ? 'success' : 'running';
			},
			fire: function () {
				calls.push('fire');

				return true;
			},
			flee: function () {
				calls.push('flee');

				return 'running';
			},
			patrol: function () {
				calls.push('patrol');

				return 'running';
			}
		}, Abort: function (request) {
			left.push(request.Name);
		}});

		/* Nothing near: the patrol, the least worth but above none. */
		tick = agent.Tick({Threat: 0, Damage: 0}, 0.1);

		expect(tick.Status).toBe('running');
		expect(calls).toEqual(['patrol']);
		expect(tick.Running).toEqual([root.id, utility.id, patrol.id]);
		expect(agent.Scores(utility.id)).toEqual([{ID: patrol.id, Score: 0.1}]);

		/* A threat within the Commit of the patrol: kept; past it, the attack (aim: its children in the order they stand, aim above fire), the patrol left and told. */
		calls = [];

		agent.Tick({Threat: 0.6, Damage: 0}, 0.1);

		expect(calls).toEqual(['patrol']);

		calls = [];
		tick = agent.Tick({Threat: 0.6, Damage: 0}, 0.5);

		expect(calls).toEqual(['aim:ship-1:first']);
		expect(left).toEqual(['patrol']);
		expect(tick.Running).toEqual([root.id, utility.id, attack.id, aim.id]);

		/* Hurt at once: the attack is kept (Commit 0.5 s); then the flight from it, worth more than 1.2 times as much. */
		calls = [];

		agent.Tick({Threat: 0.6, Damage: 0.9}, 0.1);

		expect(calls).toEqual(['aim:ship-1']);

		calls = [];

		agent.Tick({Threat: 0.6, Damage: 0.9}, 0.5);

		expect(calls).toEqual(['flee']);
		expect(left).toEqual(['patrol', 'aim']);

		/* Not hurt, aimed: the attack again, its steps one after another in one tick. */
		calls = [];
		tick = agent.Tick({Threat: 0.6, Damage: 0, Aimed: true}, 0.1);

		expect(calls).toEqual(['aim:ship-1:first', 'fire']);
		expect(tick.Status).toBe('success');

		agent.Stop();

		expect(function () {
			blueprints.Agent(blueprints.Create('flow'));
		}).toThrow('Elemenx Blueprints: Agent runs a behaviour graph, not a flow graph');
	});

	/* Contract: the other blocks of a tree: Selector, Condition, Invert, Cooldown, Limit, Loop, Wait, Remember, Parallel. */
	it('runs the blocks of a tree: a selector, a condition, a cooldown, a limit, a loop, a wait, what it remembers', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('behaviour');
		var root = blueprints.Add(graph, 'Root');
		var selector = blueprints.Add(graph, 'Selector', {x: 200});
		var condition = blueprints.Add(graph, 'Condition', {x: 400, y: 0});
		var cooldown = blueprints.Add(graph, 'Cooldown', {x: 600, y: 0, properties: {Seconds: 1}});
		var shout = blueprints.Add(graph, 'Task', {x: 800, y: 0, properties: {Name: 'shout'}});
		var parallel = blueprints.Add(graph, 'Parallel', {x: 400, y: 100, properties: {Need: 'one'}});
		var limit = blueprints.Add(graph, 'Limit', {x: 600, y: 100, properties: {Seconds: 0.25}});
		var wait = blueprints.Add(graph, 'Wait', {x: 800, y: 100});
		var loop = blueprints.Add(graph, 'Loop', {x: 600, y: 200, properties: {Count: 2}});
		var remember = blueprints.Add(graph, 'Remember', {x: 800, y: 200, properties: {Name: 'Seen'}});
		var invert = blueprints.Add(graph, 'Invert', {x: 400, y: 300});
		var near = blueprints.Add(graph, 'Input', {x: 0, y: 400, properties: {Name: 'Near'}});
		var seconds = blueprints.Add(graph, 'Number', {x: 0, y: 500, properties: {Value: 0.2}});
		var told = [];
		var board = {Near: true};
		var agent;

		blueprints.Link(graph, [root.id, 'Children'], [selector.id, 'In']);
		[condition, parallel, invert].forEach(function (child) {
			blueprints.Link(graph, [selector.id, 'Children'], [child.id, 'In']);
		});
		blueprints.Link(graph, [condition.id, 'Children'], [cooldown.id, 'In']);
		blueprints.Link(graph, [cooldown.id, 'Children'], [shout.id, 'In']);
		blueprints.Link(graph, [parallel.id, 'Children'], [limit.id, 'In']);
		blueprints.Link(graph, [parallel.id, 'Children'], [loop.id, 'In']);
		blueprints.Link(graph, [limit.id, 'Children'], [wait.id, 'In']);
		blueprints.Link(graph, [loop.id, 'Children'], [remember.id, 'In']);
		blueprints.Link(graph, [near.id, 'Value'], [condition.id, 'Test']);
		blueprints.Link(graph, [near.id, 'Value'], [remember.id, 'Value']);
		blueprints.Link(graph, [seconds.id, 'Value'], [wait.id, 'Seconds']);

		expect(blueprints.Check(graph)).toEqual([]);

		agent = blueprints.Agent(graph, {Tasks: {shout: function () {
			told.push('shout');

			return true;
		}}});

		/* Near: the shout, then its cooldown (a second) lets the selector go on. */
		expect(agent.Tick(board, 0.1).Status).toBe('success');
		expect(told).toEqual(['shout']);

		/* Cooling: the parallel (one of its two will do): the loop remembers twice, the wait of 0.2 s within its limit. */
		expect(agent.Tick(board, 0.1).Status).toBe('running');
		expect(board.Seen).toBe(true);
		expect(agent.Tick(board, 0.1).Status).toBe('success');

		/* Far: no shout (its condition fails), the wait past its limit; the loop begun again (done twice), what it remembers now. */
		board.Near = false;
		told = [];

		expect(agent.Tick(board, 2).Status).toBe('running');
		expect(told).toEqual([]);
		expect(board.Seen).toBe(false);
	});

	/* Contract: Response, the curves of a score of 0 to 1. */
	it('gives the responses of a score: linear, power, logistic and step, inverted, kept to 0 to 1', function () {
		var blueprints = Elemenx.Service('Blueprints');

		function response (properties, x) {
			var graph = blueprints.Create('generator');
			var input = blueprints.Add(graph, 'Input', {properties: {Name: 'X'}});
			var curve = blueprints.Add(graph, 'Response', {properties: properties});
			var result = blueprints.Add(graph, 'Result', {properties: {Key: 'Value'}});

			blueprints.Link(graph, [input.id, 'Value'], [curve.id, 'X']);
			blueprints.Link(graph, [curve.id, 'Out'], [result.id, 'Value']);

			return blueprints.Compile(graph).Run({}, {X: x}).Value;
		}

		expect(response({Shape: 'linear', Slope: 2, Shift: -0.5}, 0.5)).toBeCloseTo(0.5, 6);
		expect(response({Shape: 'linear', Slope: 2}, 0.9)).toBe(1);
		expect(response({Shape: 'power', Exponent: 2}, 0.5)).toBeCloseTo(0.25, 6);
		expect(response({Shape: 'logistic', Shift: 0.5, Steep: 10}, 0.5)).toBeCloseTo(0.5, 6);
		expect(response({Shape: 'step', Shift: 0.3}, 0.2)).toBe(0);
		expect(response({Shape: 'step', Shift: 0.3, Invert: true}, 0.2)).toBe(1);
		expect(response({Shape: 'linear'}, 3)).toBe(1);
	});
});
