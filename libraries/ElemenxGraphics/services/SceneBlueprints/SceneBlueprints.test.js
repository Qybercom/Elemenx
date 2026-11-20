import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (props) {
	var ready = null;
	var component = Elemenx.Component(unique('ShaderGraphHost'), {$Template: '<div style="width: 200px; height: 120px"><Scene Paused="true" Quality="medium" Labels="false" [graphs]="Graphs" (ready)="Ready">' +
		'<SceneObject ID="sun" Kind="sun" Time="12" Latitude="45" />' +
	'</Scene></div>', Graphs: props || null, Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	/* Regression: run with the other suites of scenes (all on one card) a Scene was now and then ready later than 8 s. */
	expect(await waitFor(function () {
		return ready;
	}, 30000)).toBeTruthy();

	ready.Scene().Loop.Stop();

	return ready;
}

/* A graph of the library, a copy, the property of its block of that id set. */
function changed (name, id, key, value) {
	var graph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + name)));

	graph.blocks.forEach(function (block) {
		if (block.id !== id) return;

		block.properties.forEach(function (property) {
			if (property.key === key)
				property.value = value;
		});
	});

	return graph;
}

/* The faces of a cube read back: RGBA bytes of each. */
function faces (renderer, cube) {
	var gl = renderer.GL;
	var target = gl.createFramebuffer();
	var all = [];
	var face;

	gl.bindFramebuffer(gl.FRAMEBUFFER, target);

	for (face = 0; face < 6; face++) {
		var pixels = new Uint8Array(cube.Size * cube.Size * 4);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, cube.Handle, 0);
		gl.readPixels(0, 0, cube.Size, cube.Size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

		all.push(pixels);
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.deleteFramebuffer(target);

	return all;
}

describe('Contract: the shader graphs of a Scene (C13 phase 5): the bake of a body, the shape of a lightning, the weather of surfaces', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Blueprints', 'service:SceneBlueprints', 'service:BlueprintShaders', 'service:SceneTerrainGenerator', 'service:Math', 'service:Renderer', 'service:SceneForecast', 'service:GalaxyData', 'service:Noise']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		vi.restoreAllMocks();
	});

	/*
	 * Regression: the land of a body of noise was written twice, in the shader that bakes its picture and in the page that
	 * makes its ground, and the shader put craters under a sea the ground had not. One graph now: its land read in the page.
	 */
	it('makes the land of a body in the page of the graph that bakes its picture, the same numbers as before, no craters under a sea', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var noise = Elemenx.Service('Math').Noise();
		var vectors = Elemenx.Service('Math').Vectors;

		function smooth (a, b, x) {
			var t = Math.max(0, Math.min(1, (x - a) / (b - a)));

			return t * t * (3 - 2 * t);
		}

		[['rocky', 0], ['terran', 0.6], ['moon', 0], ['rocky', 0.4], ['ice', 0]].forEach(function (one) {
			var seed = 4.3;
			var ocean = one[1];
			var cratered = ['rocky', 'desert', 'dwarf', 'moon'].indexOf(one[0]) !== -1;
			var field = terrain.Sphere({Radius: 100, Seed: seed, Ocean: ocean, Type: one[0]});
			var i;

			for (i = 0; i < 300; i++) {
				var p = vectors.Normalize([Math.sin(i * 12.9898) * 2 - 1, Math.sin(i * 78.233) * 2 - 1, Math.sin(i * 37.719) * 2 - 1]);
				var q = [p[0] * 2.2 + seed, p[1] * 2.2 + seed * 0.7, p[2] * 2.2 + seed * 1.3];
				var h = noise.Fbm(q[0], q[1], q[2], 6);
				var value = ocean > 0 ? (h - ocean * 0.55 - 0.2) / Math.max(0.05, 0.8 - ocean * 0.55) : h;

				if (cratered && !(ocean > 0))
					value += (smooth(0.86, 0.96, noise.Ridge(q[0] * 2.6 + 9, q[1] * 2.6 + 9, q[2] * 2.6 + 9, 3)) - 0.4) * 0.18;

				expect(Math.abs(value - field.Land(p))).toBeLessThan(1e-12);
			}
		});

		/* What comes to BakeLand alone, as a generator; a graph of its own (BakeSource) the land of it. */
		var land = Elemenx.Service('SceneBlueprints').BakeLandGraph(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/bake'));
		var own = terrain.BakeCodeOf(changed('shader/bake', 'bake-height', 'Octaves', 2));
		var plain = terrain.Sphere({Radius: 100, Seed: 1, Type: 'rocky'});
		var mine = terrain.Sphere({Radius: 100, Seed: 1, Type: 'rocky', BakeSource: own});

		expect(land.type).toBe('generator');
		expect(land.blocks.map(function (block) {
			return block.type;
		})).not.toContain('BakeRocky');
		expect(own.Inputs).toEqual(expect.arrayContaining(['PX', 'PY', 'PZ', 'Seed', 'Ocean', 'Cratered']));
		expect(mine.Land([0.3, 0.5, 0.8])).not.toBe(plain.Land([0.3, 0.5, 0.8]));
		expect(Elemenx.Service('SceneBlueprints').BakeLandGraph({version: 1, type: 'bake', blocks: [], links: []})).toBe(null);
	});

	/* The picture of a body of noise baked by its graph (blueprintBake): a land of colors, seas, caps, clouds. */
	it('bakes a body of noise by its graph: its Input blocks the uniforms of the bake, Formula and Ridge in it, a sea where the land is under 0', async function () {
		var scene = await mount();
		var graphics = Elemenx.Service('Renderer');
		var renderer = scene.Engine().Renderer;
		var gl = renderer.GL;
		var made = Elemenx.Service('Blueprints').Compile(scene.LibraryBake());
		var program = renderer.Program(graphics.Shaders.Quad, scene.Baked(scene.Shaders(graphics)).Bake);
		var land = renderer.Cube(16);
		var sky = renderer.Cube(16);
		var uniforms = {uKind: 1, uColors: [0.2, 0.5, 0.1, 0.3, 0.6, 0.2, 0.5, 0.4, 0.3, 0.9, 0.9, 0.9], uWater: [0.0, 0.0, 1.0], uOcean: 0.6, uIce: 0, uClouds: 1, uSeed: 2};
		var ground;
		var clouds;
		var blue = 0;

		expect(made.Type).toBe('bake');
		['void blueprintBake(vec3 p, inout vec4 surface, inout vec4 sky)', 'fbm3(', 'ridge3(', 'uSeed', 'uOcean', '(uKind == 0 ? 1.0 : 0.0)', 'f_bf'].forEach(function (part) {
			expect(made.Function).toContain(part);
		});
		expect(Elemenx.Service('Blueprints').Nodes('bake')).toEqual(expect.arrayContaining(['BakeLand', 'BakeRocky', 'BakeIcy', 'BakeLava', 'BakeGas', 'BakeKind', 'BakeIce', 'BakeClouds', 'BakeEnd', 'Input', 'Formula', 'Ridge']));

		expect(await waitFor(function () {
			return renderer.Ready(program);
		}, 60000)).toBe(true);

		renderer.Bake(land, program, Object.assign({uLayer: 0}, uniforms));
		renderer.Bake(sky, program, Object.assign({uLayer: 1}, uniforms));

		ground = faces(renderer, land);
		clouds = faces(renderer, sky);

		ground.forEach(function (face) {
			var i;

			for (i = 0; i < face.length; i += 4) {
				if (face[i + 2] > 100 && face[i] < 40)
					blue++;
			}
		});

		/* Its seas of the water given, its clouds all of the sky (Clouds 1) here and there. */
		expect(blue).toBeGreaterThan(50);
		expect(Math.max.apply(null, Array.from(clouds[2]).filter(function (value, index) {
			return index % 4 === 0;
		}))).toBeGreaterThan(200);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		/* An input a kind does not have is told. */
		expect(function () {
			Elemenx.Service('Blueprints').Compile(changed('shader/bake', 'bake-input-seed', 'Name', 'Nothing'));
		}).toThrow('Elemenx Blueprints: a graph bake has no input Nothing');

		land.Destroy();
		sky.Destroy();
	}, 90000);

	/* A formula of a shader is a function of GLSL of its numbers, made once for the same formula and types. */
	it('makes a generator of numbers a function of GLSL once (NumericGLSL, FormulaGLSL), a part of the shaders of Renderer', function () {
		var shaders = Elemenx.Service('BlueprintShaders');
		var one = shaders.FormulaGLSL('A * 2 + B', {A: 'vec3', B: 'float'});
		var again = shaders.FormulaGLSL('A * 2 + B', {A: 'vec3', B: 'float'});
		var bolt = shaders.NumericGLSL(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/bolt'), {});

		expect(again).toBe(one);
		expect(one.Type).toBe('vec3');
		expect(one.Inputs.map(function (input) {
			return input.Type;
		})).toEqual(['vec3', 'float']);
		expect(Elemenx.Service('Renderer').Chunks[one.Need]).toContain('#ifndef ENX_' + one.Name);
		expect(bolt.Type).toBe('vec2');
		expect(bolt.Keys).toEqual(['X', 'Z']);
	});

	/*
	 * Regression: a bolt of a storm was a broken line of its own numbers (a random of the page), the one of an effect a
	 * wave of sines: one shape now, a graph (shader/bolt), the jags of its steps in the page and in a shader alike.
	 */
	it('gives the lightnings of a storm and of an effect one shape of a graph: its jags, its branch, its own of BoltGraph or Graphs', async function () {
		var blueprints = Elemenx.Service('SceneBlueprints');
		var shape = blueprints.Bolt();
		var renderer = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var program;
		var scene;
		var i;

		expect(blueprints.Bolt()).toBe(shape);
		expect([shape.Steps, shape.Wide, shape.Fork, shape.ForkSteps, shape.ForkDown, shape.ForkWide]).toEqual([14, 0.09, 5, 6, 0.8, 1.2]);

		for (i = 0; i < 14; i++) {
			var jag = shape.Jag(i, 7);

			expect(jag[0]).toBeGreaterThanOrEqual(-0.5);
			expect(jag[0]).toBeLessThanOrEqual(0.5);
			expect(jag).toEqual(shape.Jag(i, 7));
		}

		expect(shape.Jag(3, 7)).not.toEqual(shape.Jag(3, 8));

		program = renderer.Program('#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 1.0); }', '#version 300 es\nprecision highp float;\nout vec4 outColor;\n' + shape.GLSL + '\nvoid main() { outColor = vec4(bolt_jag(2.0, 7.0), 0.0, 1.0); }');

		expect(renderer.GL.getProgramParameter(program.Handle, renderer.GL.LINK_STATUS)).toBe(true);

		scene = await mount({'shader/bolt': changed('shader/bolt', 'bolt-x', 'Expression', 'fract(sin(Step * 3.1 + Seed) * 437.5) - 0.5')});

		expect(scene.BoltShape().Jag(1, 2)[0]).toBeCloseTo((function () {
			var x = Math.sin(1 * 3.1 + 2) * 437.5;

			return x - Math.floor(x) - 0.5;
		})(), 9);

		/* One that cannot be made is told, the one of the library drawn. */
		vi.spyOn(console, 'warn').mockImplementation(function () {});

		scene.BoltGraph = '{"version": 1, "type": "generator", "blocks": [], "links": []}';
		scene.BoltMade = null;

		expect(scene.BoltShape().Steps).toBe(14);
		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Elemenx Scene: the BoltGraph cannot be made'));
	}, 60000);

	/*
	 * The weather of the surfaces of things (Pbr, Solid) of one graph: the leaves of the year, snow, pools, a beam.
	 * Regression: its puddles took a parameter named flat, a word of GLSL, and no thing of a scene was drawn.
	 */
	it('puts what the weather does to things in their shaders of one graph (WeatherGraph), its numbers its properties', async function () {
		var graphics = Elemenx.Service('Renderer');
		var scene = await mount({'shader/weather': changed('shader/weather', 'weather-snow-things', 'Low', 0.123)});
		var renderer = scene.Engine().Renderer;
		var shaders = scene.Weathered(scene.Shaders(graphics));
		var programs = [renderer.Program(shaders.Instanced, shaders.Pbr), renderer.Program(shaders.Instanced, shaders.Solid)];

		expect(Elemenx.Service('Blueprints').Nodes('weather')).toEqual(expect.arrayContaining(['WeatherSeason', 'WeatherSnow', 'WeatherDissolve', 'WeatherPuddles', 'WeatherEnd']));
		['void weather_season(', 'float weather_snow_things(', 'float weather_dissolve(', 'float weather_puddles(', 'smoothstep(0.123, 0.75,'].forEach(function (part) {
			expect(shaders.Pbr).toContain(part);
		});
		['float weather_snow_solid(', 'float weather_snow_plants(', 'weather_season(color,'].forEach(function (part) {
			expect(shaders.Solid).toContain(part);
		});
		expect(shaders.Pbr).not.toContain('void blueprintWeather() {}');

		programs.forEach(function (program) {
			expect(renderer.GL.getProgramParameter(program.Handle, renderer.GL.LINK_STATUS)).toBe(true);
		});
	}, 60000);

	/*
	 * The air between the eye and what it sees of one graph (AirGraph): the haze of a globe and of a scene, the fog of the
	 * pass Air, the eye under the sea; each shader takes the functions it asks for (#define ENX_AIR_<FOR>) alone.
	 * Regression: the haze was written in the things and the ground of a globe, the land and the water each its own.
	 */
	it('puts the air of one graph (AirGraph) in the shaders that ask for it, each its own functions', async function () {
		var graphics = Elemenx.Service('Renderer');
		var scene = await mount({'shader/air': changed('shader/air', 'air-ground', 'Whiten', 0.123)});
		var renderer = scene.Engine().Renderer;
		var shaders = scene.Aired(scene.Landed(scene.Watered(scene.Shaders(graphics))));
		var lit = scene.Aired(scene.LightingShaders(graphics));

		expect(Elemenx.Service('Blueprints').Nodes('air')).toEqual(expect.arrayContaining(['AirHaze', 'AirFog', 'AirUnder', 'AirEnd']));
		expect(shaders.Land).toContain('air_haze_ground(');
		expect(shaders.Land).toContain('mix(uAir.rgb, vec3(1.0), 0.123)');
		expect(shaders.Sea).toContain('air_horizon_ground(');
		expect(shaders.Things).toContain('#define ENX_AIR_GLOBE');
		expect(shaders.Things).toContain('float air_haze_globe(vec3 world)');
		expect(lit.Air).toContain('float air_fog(vec3 place, float far, vec3 way)');
		expect(lit.Air).toContain('vec3 air_under(vec3 color, vec3 place, float depth)');

		[renderer.Program(shaders.ThingsVertex, shaders.Things), renderer.Program(graphics.Shaders.Quad, lit.Air)].forEach(function (program) {
			expect(renderer.GL.getProgramParameter(program.Handle, renderer.GL.LINK_STATUS)).toBe(true);
		});
	}, 60000);

	/*
	 * The clouds of one graph (CloudsGraph): their cover of the weather of a planet for its globe, the shadows on its ground
	 * and round the eye over it, and the layer of a scene. Regression: the cover of the globe (cloudSeen) and of the clouds
	 * round the eye (shellThick) were the same loop written twice.
	 */
	it('puts the clouds of one graph (CloudsGraph) in the globe, its ground, the shell round the eye and the layer of a scene', async function () {
		var graphics = Elemenx.Service('Renderer');
		var scene = await mount({'shader/clouds': changed('shader/clouds', 'clouds-globe', 'Cirrus', 0.31)});
		var renderer = scene.Engine().Renderer;
		var shaders = scene.Clouded(scene.Aired(scene.Shaders(graphics)));
		var lit = scene.Clouded(scene.Aired(scene.LightingShaders(graphics)));

		expect(Elemenx.Service('Blueprints').Nodes('clouds')).toEqual(expect.arrayContaining(['CloudCover', 'CloudGlobe', 'CloudShell', 'CloudLayer', 'CloudsEnd']));
		expect(shaders.Planet).toContain('float clouds_cover(vec3 k, float cover, float heap, float foot, float narrow)');
		expect(shaders.Planet).toContain('smoothstep(0.45, 0.75, streak) * 0.31');
		expect(shaders.Ground).toContain('float cloudAt(vec3 p, float foot)');
		expect(lit.Clouds).toContain('float shellThick(vec3 q, float foot, float detail)');
		expect(lit.Clouds).toContain('clouds_cover(k, w.r, heap, foot, narrow)');
		expect(lit.CloudMap).toContain('float thick(vec3 p, float fine)');

		[renderer.Program(shaders.Lit, shaders.Planet), renderer.Program(graphics.Shaders.Quad, lit.Clouds), renderer.Program(graphics.Shaders.Quad, lit.CloudMap)].forEach(function (program) {
			expect(renderer.GL.getProgramParameter(program.Handle, renderer.GL.LINK_STATUS)).toBe(true);
		});
	}, 60000);

	/*
	 * The weather of a planet, a graph of numbers of the blocks of SceneForecast: its shader (NumericGLSL) and the page
	 * (NumericCode) give the same map, as near as floats of 32 bits hold it.
	 */
	it('makes the weather of a planet a graph of numbers: its shader and the page give the same cover, kind, cirrus and rain', function () {
		var graphics = Elemenx.Service('Renderer');
		var blueprints = Elemenx.Service('Blueprints');
		var graph = Elemenx.Service('SceneBlueprints').LibraryForecast();
		var made = Elemenx.Service('BlueprintShaders').NumericGLSL(graph, {});
		var code = blueprints.NumericCode(graph, {});
		var renderer = graphics.Create(document.createElement('canvas'), {Antialias: false});
		var gl = renderer.GL;
		var names = {PX: 'uP.x', PY: 'uP.y', PZ: 'uP.z', Days: 'uDays', Seed: '41.0', RadiusKm: '6371.0', Cells: '3.0', SunX: '0.6', SunY: '0.2', SunZ: '0.7746', Cloudiness: 'uCloudiness', Moist: 'uCl.r', Warm: 'uCl.g', Ground: 'uCl.b', Climb: 'uCl.a'};
		var program;
		var target = renderer.Target(1, 1, {Float: true});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixels = new Float32Array(4);
		var rained = 0;
		var i;

		expect(blueprints.Numeric(graph, {}).Diagnostics).toEqual([]);
		expect(blueprints.Nodes('generator')).toEqual(expect.arrayContaining(['ForecastStorms', 'ForecastFronts', 'ForecastHeaps', 'ForecastCirrus', 'ForecastRain', 'ForecastShroud']));

		gl.getExtension('EXT_color_buffer_float');

		program = renderer.Program('#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }', [
			'#version 300 es',
			'precision highp float;',
			'precision highp int;',
			'uniform vec3 uP;',
			'uniform vec4 uCl;',
			'uniform float uDays;',
			'uniform float uCloudiness;',
			'out vec4 outColor;',
			graphics.Chunks.Noise,
			graphics.Chunks[made.Need],
			'void main() { outColor = ' + made.Name + '(' + made.Inputs.map(function (one) {
				return names[one.Name];
			}).join(', ') + '); }'
		].join('\n'));

		for (i = 0; i < 24; i++) {
			var v = [Math.sin(i * 1.3), Math.cos(i * 2.1) * 0.9, Math.sin(i * 0.7 + 2)];
			var l = Math.hypot(v[0], v[1], v[2]);
			var p = [v[0] / l, v[1] / l, v[2] / l];
			var cl = [(i % 9) / 8, (i % 5) / 4, (i % 3) / 2 * 0.6, (i % 4) / 3];
			var cloudiness = [0.5, 0.2, 0.9, 1][i % 4];
			var js;

			target.Begin();

			renderer.Draw(quad, program, {uP: p, uCl: cl, uDays: 3.3 + i * 0.77, uCloudiness: cloudiness}, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixels);

			target.End();

			js = code.Run({}, {PX: p[0], PY: p[1], PZ: p[2], Days: 3.3 + i * 0.77, Seed: 41, RadiusKm: 6371, Cells: 3, SunX: 0.6, SunY: 0.2, SunZ: 0.7746, Cloudiness: cloudiness, Moist: cl[0], Warm: cl[1], Ground: cl[2], Climb: cl[3]});

			expect(Math.abs(js.Cover - pixels[0])).toBeLessThan(0.01);
			expect(Math.abs(js.Kind - pixels[1])).toBeLessThan(0.01);
			expect(Math.abs(js.Cirrus - pixels[2])).toBeLessThan(0.01);
			expect(Math.abs(js.Rain - pixels[3])).toBeLessThan(0.01);

			if (js.Rain > 0.3)
				rained++;
		}

		expect(rained).toBeGreaterThan(0);

		/*
		 * The cells of its winds (of its envelope: 3 of the Earth, 0 taken for 3): a planet that turns fast has more belts, its
		 * air drawn another way.
		 */
		var forecast = Elemenx.Service('SceneForecast');
		var at = [0.3, 0.55, 0.78];

		expect(forecast.Air(at, 4.2, 41, 6371, 2.6, 14, 0.06, 0)).toEqual(forecast.Air(at, 4.2, 41, 6371, 2.6, 14, 0.06, 3));
		expect(forecast.Air(at, 4.2, 41, 6371, 2.6, 14, 0.06, 9)).not.toEqual(forecast.Air(at, 4.2, 41, 6371, 2.6, 14, 0.06, 3));
		expect(forecast.Code().wx_zonal(0.7, 6371, 3)).toBeGreaterThan(0);
		expect(forecast.Code().wx_zonal(0.7, 6371, 9)).not.toBeCloseTo(forecast.Code().wx_zonal(0.7, 6371, 3), 3);
	});

	/*
	 * A block of numbers of another Library (Numeric of its definition): its outputs of the IR, the functions of its Kernel
	 * in the module once however many of its blocks a graph has; Compute the same of it in the page.
	 */
	it('takes blocks of numbers of other Libraries into a graph of numbers (Numeric of a definition, its Kernel once)', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Read({version: 1, type: 'generator', parameters: [], blocks: [
			{id: 'x', type: 'Input', x: 0, y: 0, properties: [{key: 'Name', value: 'S'}]},
			{id: 'a', type: 'ForecastCirrus', x: 0, y: 0, properties: [{key: 'Low', value: 0.1}, {key: 'High', value: 0.9}]},
			{id: 'b', type: 'ForecastCirrus', x: 0, y: 0, properties: [{key: 'Low', value: 0.2}, {key: 'High', value: 0.6}]},
			{id: 'r', type: 'Result', x: 0, y: 0, properties: [{key: 'Key', value: 'A'}]},
			{id: 's', type: 'Result', x: 0, y: 0, properties: [{key: 'Key', value: 'B'}]}
		], links: [
			{id: 'l1', p1: 'x-out-Value', p2: 'a-in-Streams', kind: 'value'},
			{id: 'l2', p1: 'x-out-Value', p2: 'b-in-Streams', kind: 'value'},
			{id: 'l3', p1: 'a-out-Cirrus', p2: 'r-in-Value', kind: 'value'},
			{id: 'l4', p1: 'b-out-Cirrus', p2: 's-in-Value', kind: 'value'}
		]});
		var made = blueprints.Numeric(graph, {});
		var code = blueprints.NumericCode(graph, {});
		var forecast = Elemenx.Service('SceneForecast');
		var names = made.Module.Functions.map(function (one) {
			return one.Name;
		});

		expect(made.Diagnostics).toEqual([]);
		expect(names.filter(function (name) {
			return name === 'wx_cirrus';
		}).length).toBe(1);
		/* Only what it calls: the noise wx_cirrus does not read stays out (regression: the whole Kernel came, a minute to make a shader). */
		expect(names).not.toContain('n_value0');
		expect(names).not.toContain('n_worley');
		expect(code.Run({}, {S: 0.5}).A).toBeCloseTo(forecast.Cirrus(0.5, 0, 0, 0.1, 0.9), 12);
		expect(code.Run({}, {S: 0.5}).B).toBeCloseTo(forecast.Cirrus(0.5, 0, 0, 0.2, 0.6), 12);
		expect(blueprints.Compile(graph).Run({}, {S: 0.5}).A).toBeCloseTo(forecast.Cirrus(0.5, 0, 0, 0.1, 0.9), 12);
	});

	/*
	 * Regression: the arms of a galaxy were drawn three times over (its stars of a noise of their own, its picture of
	 * another, the galaxies far off of a third): its stars stood off the arms of its picture. One graph now (shader/galaxy,
	 * of GalaxyData.Kernel): the page and a shader read the very same arms, and a graph of its own moves them all.
	 */
	it('gives the arms of a galaxy of one graph to its stars and to its shaders alike, and a graph of its own moves them', function () {
		var galaxies = Elemenx.Service('GalaxyData');
		var scene = Elemenx.Service('SceneBlueprints');
		var data = galaxies.Make({Seed: 'arms', Kind: 'spiral'});
		var m = data.Manifest;
		var made = scene.Galaxy();
		var code = galaxies.Code();
		var seed = galaxies.SeedNumber(m);
		var renderer = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = renderer.GL;
		var list = [];
		var i;

		expect(gl.getExtension('EXT_color_buffer_float')).toBeTruthy();
		expect(made.GLSL).toContain('vec4 galaxy_spiral(vec2 p');
		expect(made.GLSL).not.toContain('f_n_worley');

		/* Places off its very middle (there it has no arms: 1). */
		for (i = 1; i <= 64; i++)
			list.push([Math.sin(i * 12.9898) * 40, Math.sin(i * 78.233) * 40]);

		list.forEach(function (p) {
			var turn = code.gx_turn(p[0], p[1], m.Radius / 4500, m.Pitch * Math.PI / 180, m.Phase * Math.PI / 180);
			var bend = code.gx_bend(p[0], p[1], m.Radius / 1000, seed, 0.5);
			var wave = code.gx_wave(turn, bend, m.Arms, 0);
			var of = made.Of(m, p[0], p[1], 0, seed);

			expect(of[0]).toBeCloseTo(turn, 10);
			expect(of[2]).toBeCloseTo(wave, 10);
			expect(of[3]).toBeCloseTo(code.gx_arm(wave, 0.3, 1.7, 2.2), 10);
			expect(galaxies.Arm(m, p[0] * 1000, p[1] * 1000, 0, data)).toBeCloseTo(of[3], 10);
		});

		/* The same arms in a shader: the wave of each place (a cosine of an angle: within a few thousandths of the page). */
		var program = renderer.Program('#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }', [
			'#version 300 es',
			'precision highp float;',
			'uniform vec2 uPoints[64];',
			'uniform vec4 uShape;',
			'uniform vec2 uArms;',
			'out vec4 outColor;',
			Elemenx.Service('Renderer').Chunks.Noise,
			Elemenx.Service('Noise').GLSLChunk(['enx_gradient3']),
			made.GLSL,
			'void main() { outColor = galaxy_spiral(uPoints[int(gl_FragCoord.x)], uShape.x, uShape.y, uShape.z, uShape.w, uArms.x, uArms.y, 0.0); }'
		].join('\n'));
		var target = renderer.Target(64, 1, {Float: true});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixels = new Float32Array(64 * 4);

		target.Begin();

		renderer.Draw(quad, program, {uPoints: [].concat.apply([], list), uShape: [m.Radius / 4500, m.Radius / 1000, m.Pitch * Math.PI / 180, m.Phase * Math.PI / 180], uArms: [m.Arms, seed]}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 64, 1, gl.RGBA, gl.FLOAT, pixels);

		target.End();

		list.forEach(function (p, index) {
			expect(Math.abs(pixels[index * 4 + 2] - made.Of(m, p[0], p[1], 0, seed)[2])).toBeLessThan(5e-3);
		});

		/* A graph of its own (no bend at all): its stars lie on its arms, kept by the galaxy for that graph. */
		var own = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/galaxy')));
		var bent = own.blocks.filter(function (block) {
			return block.type === 'GalaxyBend';
		})[0];

		bent.properties[0].value = 0;

		Object.defineProperty(data, 'Graph', {value: own, writable: true, configurable: true, enumerable: false});

		expect(galaxies.Spiral(data)).toBe(galaxies.Spiral(data));
		expect(galaxies.Spiral(data)).not.toBe(made);
		expect(galaxies.Arm(m, list[3][0] * 1000, list[3][1] * 1000, 0, data)).toBeCloseTo(code.gx_arm(code.gx_wave(code.gx_turn(list[3][0], list[3][1], m.Radius / 4500, m.Pitch * Math.PI / 180, m.Phase * Math.PI / 180), 0, m.Arms, 0), 0.3, 1.7, 2.2), 10);
		expect(JSON.stringify(data)).not.toContain('GalaxyBend');
	});

	/* The sky far behind a system is a graph of its parts: the library one each of them in its order, one of its own without some. */
	it('makes the sky far behind a system of a graph of its parts, and one of its own leaves out what it has not', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var library = Elemenx.Service('SceneBlueprints').LibraryCosmos();
		var made = blueprints.Compile(library);
		var own = JSON.parse(JSON.stringify(library));
		var calls = ['cosmosGas(', 'cosmosPlane(', 'cosmosGlow(', 'cosmosDust(', 'cosmosBand(', 'cosmosBursts(', 'cosmosGalaxies(', 'cosmosPillars(', 'cosmosStars(', 'cosmosBeacon(', 'cosmosClusters('];

		expect(made.Type).toBe('cosmos');
		expect(made.Function).toContain('void blueprintCosmos(vec3 d, vec3 s, inout vec3 color) {');

		calls.reduce(function (at, call) {
			expect(made.Function.indexOf(call)).toBeGreaterThan(at);

			return made.Function.indexOf(call);
		}, -1);

		/* Without its galaxies far off: the stars take the color of the pillars. */
		own.blocks = own.blocks.filter(function (block) {
			return block.type !== 'CosmosGalaxies';
		});
		own.links = own.links.filter(function (link) {
			return link.p1.indexOf('galaxies-') !== 0 && link.p2.indexOf('galaxies-') !== 0;
		}).concat([{id: 'own', p1: 'bursts-out-Color', p2: 'pillars-in-Color', kind: 'value'}]);

		expect(blueprints.Compile(own).Function).not.toContain('cosmosGalaxies(');

		var space = await mount({'shader/cosmos': own});
		var engine = space.Engine();
		var inner = space.Scene();
		var now = performance.now() + 100;

		space.Cosmos = {Kind: 'galaxies', Seed: 'own'};

		for (var i = 0; i < 60 && !engine.CosmosReady(); i++) {
			inner.Rest = 0;

			engine.Frame(now += 100);
		}

		expect(engine.CosmosReady()).toBe(true);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
	});

	/*
	 * Regression: the ring was one main of the Ring shader, its gap one at 0.62. Of a graph with that one gap it is the
	 * ring of before to the float; the library has more gaps, each thinner where it lies.
	 */
	it('draws a ring of a graph of its bands, gaps, colors and light, of one gap the ring of before', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graphics = Elemenx.Service('Renderer');
		var library = Elemenx.Service('SceneBlueprints').LibraryRing();
		var made = blueprints.Compile(library);
		var one = JSON.parse(JSON.stringify(library));
		var hook = 'void blueprintRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}';
		var before = [
			'void main() {',
			'	float r = vUV.x;',
			'	float wide = noise3(vec3(r * 22.0, uSeed, 0.5));',
			'	float fine = noise3(vec3(r * 140.0, uSeed, 3.5));',
			'	float gap = 1.0 - (1.0 - smoothstep(0.0, 0.015, abs(r - 0.62))) * 0.9;',
			'	float alpha = (0.2 + 0.55 * wide + 0.25 * fine) * smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(0.92, 1.0, r)) * gap;',
			'	vec3 albedo = mix(mix(uColors[0], uColors[1], wide), mix(uColors[2], uColors[3], fine), fine * 0.6);',
			'	vec3 n = normalize(vNormal);',
			'	vec3 total = uAmbient;',
			'	for (int i = 0; i < 4; i++) {',
			'		if (i >= uLightCount) break;',
			'		vec3 toLight = normalize(uLightPositions[i] - vWorld);',
			'		total += uLightColors[i] * (0.35 + 0.65 * abs(dot(n, toLight))) * shadow(vWorld, uLightPositions[i]);',
			'	}',
			'	outColor = vec4(albedo * total, alpha);',
			'}'
		].join('\n');

		expect(made.Type).toBe('ring');
		expect(made.Function).toContain(hook.replace(' {}', ' {'));
		expect(made.Function.split('abs(b1_R - ').length - 1).toBe(3);

		one.blocks = one.blocks.filter(function (block) {
			return block.id !== 'inner' && block.id !== 'narrow';
		});
		one.links = one.links.filter(function (link) {
			return !/^(inner|narrow)-/.test(link.p1) && !/^(inner|narrow)-/.test(link.p2);
		}).concat([{id: 'own', p1: 'gap-out-Density', p2: 'end-in-Alpha', kind: 'value'}]);

		var space = await mount(null);
		var shaders = space.Shaders(graphics);
		var old = shaders.Ring.slice(0, shaders.Ring.indexOf(hook)) + before;
		var ofOne = space.Install({Ring: shaders.Ring}, hook, blueprints.Compile(one)).Ring;
		var ofLibrary = space.Install({Ring: space.Shaders(graphics).Ring}, hook, made).Ring;
		var renderer = graphics.Create(document.createElement('canvas'), {Antialias: false});
		var gl = renderer.GL;

		expect(gl.getExtension('EXT_color_buffer_float')).toBeTruthy();

		/* Across a ring, 256 points of it: its colors and how much of it there is. */
		function drawn (fragment) {
			var program = renderer.Program([
				'#version 300 es',
				'in vec3 aPosition;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec2 vUV;',
				'void main() { vUV = vec2(aPosition.x * 0.5 + 0.5, 0.0); vWorld = vec3(aPosition.x, 0.0, 5.0); vNormal = vec3(0.0, 1.0, 0.0); gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
			].join('\n'), fragment);
			var target = renderer.Target(256, 1, {Float: true});
			var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
			var pixels = new Float32Array(256 * 4);

			target.Begin();

			renderer.Draw(quad, program, {uColors: [0.8, 0.7, 0.5, 0.6, 0.5, 0.4, 0.9, 0.85, 0.7, 0.5, 0.45, 0.4], uSeed: 3.7, uAmbient: [1, 1, 1], uLightCount: 0}, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 256, 1, gl.RGBA, gl.FLOAT, pixels);

			target.End();

			return pixels;
		}

		var was = drawn(old);
		var now = drawn(ofOne);
		var more = drawn(ofLibrary);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		for (var i = 0; i < was.length; i++)
			expect(Math.abs(now[i] - was[i])).toBeLessThan(1e-5);

		/* A pixel over the narrow gap (0.86) and over the soft one (0.24): thinner there of the library, as before elsewhere. */
		expect(more[220 * 4 + 3]).toBeLessThan(was[220 * 4 + 3] * 0.5);
		expect(more[61 * 4 + 3]).toBeLessThan(was[61 * 4 + 3] * 0.7);
		expect(Math.abs(more[140 * 4 + 3] - was[140 * 4 + 3])).toBeLessThan(1e-5);
		expect(was[140 * 4 + 3]).toBeGreaterThan(0.05);
	});

	/*
	 * Regression: the planet graph of the library was written with no properties of its blocks, and each of their numbers
	 * was 0 in the shader (no rim, no relief, no glow, a highlight of all its face): a planet burned white.
	 */
	it('draws a globe of a graph of its parts, the shadow of its ring of the ring graph on it, a graph of its own drawn too', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var library = Elemenx.Service('SceneBlueprints').LibraryPlanet();
		var made = blueprints.Compile(library);
		var own = JSON.parse(JSON.stringify(library));
		var calls = ['texture(uGround,', 'lighting(', 'cloudSeen(', 'planetRing(', 'texture(uLights,', 'uAtmosphere.rgb * pow(', 'uHighlight.rgb * pow('];
		var warned = vi.spyOn(console, 'warn');

		expect(made.Type).toBe('planet');
		expect(made.Function).toContain('void blueprintPlanet(vec3 n, vec3 v, vec3 p, inout vec3 color, inout float alpha) {');

		calls.reduce(function (at, call) {
			expect(made.Function.indexOf(call)).toBeGreaterThan(at);

			return made.Function.indexOf(call);
		}, -1);

		expect(made.Function).toContain('0.0), 3.0) * uAtmosphere.a');
		expect(made.Function).toContain('* 8.0));');
		expect(made.Function).toContain(' * 1.6;');
		expect(made.Function).not.toContain('0.0), 0.0)');

		/* The tops of a giant near (PlanetGas): of a giant only, its bands read where a flow pushes them, its billows lean its light. */
		expect(blueprints.Nodes('planet')).toContain('PlanetGas');
		expect(made.Function).toContain('if (uKind == 4 && uCloudsOnly < 0.5) {');
		expect(made.Function).toMatch(/texture\(uGround, g\d+_moved\)/);
		expect(made.Function).toMatch(/_lit = normalize\(g\d+_lit - g\d+_tilt \* 6\.0 \* 0\.8/);

		library.blocks.forEach(function (block) {
			expect(block.properties.every(function (property) {
				return Number(property.value) !== 0;
			})).toBe(true);
		});

		/* Its own: no shadow of a ring, no lights at night. */
		own.blocks = own.blocks.filter(function (block) {
			return block.id !== 'ring' && block.id !== 'lights';
		});
		own.links = own.links.filter(function (link) {
			return !/^(ring|lights)-/.test(link.p1) && !/^(ring|lights)-/.test(link.p2);
		}).concat([{id: 'own', p1: 'shade-out-Color', p2: 'mix-in-Color', kind: 'value'}]);

		expect(blueprints.Compile(own).Function).not.toContain('planetRing(');

		var ready = null;
		var component = Elemenx.Component(unique('PlanetGraphHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="medium" Labels="false" [graphs]="Graphs" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star" Mass="1">' +
				'<SceneObject ID="saturn" Kind="planet" Surface-Type="gas" Radius="58232" Distance="1" Tilt="26.7">' +
					'<SceneObject ID="rings" Kind="ring" Inner="1.24" Outer="2.27" />' +
				'</SceneObject>' +
			'</SceneObject>' +
		'</Scene></div>', Graphs: {'shader/planet': own}, Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		expect(await waitFor(function () {
			return ready;
		}, 8000)).toBeTruthy();

		var engine = ready.Engine();
		var renderer = engine.Renderer;
		var shaders = ready.Globed(ready.Shaders(Elemenx.Service('Renderer')));
		var now = performance.now() + 100;

		ready.Scene().Loop.Stop();

		/* The ring in the Planet shader of its color and seed of its own, the planet of its own graph. */
		expect(shaders.Planet).toContain('void planetRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {');
		expect(shaders.Planet).toContain('uRingSeed');
		expect(shaders.Planet).not.toMatch(/\buSeed\b/);
		expect(shaders.Planet).not.toContain('g7_ring');

		ready.FocusOn('saturn');

		expect(await waitFor(function () {
			engine.Frame(now += 100, true);

			return renderer.Progress().Needed === 0;
		}, 60000)).toBe(true);

		engine.Frame(now += 100, true);

		expect(renderer.GL.getError()).toBe(renderer.GL.NO_ERROR);
		expect(warned.mock.calls.filter(function (call) {
			return /planet|ring/i.test(String(call[0]));
		})).toEqual([]);

		warned.mockRestore();
	});

	/*
	 * The ground of a globe near was one main of the Ground shader of a Scene; now its parts are blocks of a graph (the kind
	 * ground), each number a property of its block, the tiles near a function of the shader a ground near puts its
	 * materials in (groundLaid), the shadow of a ring the alpha of the ring graph alone (its light reads what a ground has not).
	 */
	it('draws the ground of a globe of a graph of its parts, the shadow of a ring on it of the alpha of the ring graph', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var library = Elemenx.Service('SceneBlueprints').LibraryGround();
		var made = blueprints.Compile(library);
		var own = JSON.parse(JSON.stringify(library));
		var calls = ['enx_fvalue3(', 'textureGrad(uColorMap,', 'fbm3(', 'dwelling(', 'textureGrad(uSnowMap,', 'textureGrad(uUseMap,', 'groundLaid(', 'groundRing(', 'sunShadow(', 'cloudUnder(', 'reflect(', 'texture(uLights,', 'cloudAt(', 'air_haze_globe('];
		var warned = vi.spyOn(console, 'warn');

		expect(made.Type).toBe('ground');
		expect(made.Function).toContain('void blueprintGround(inout vec3 color) {');

		calls.reduce(function (at, call) {
			expect(made.Function.indexOf(call)).toBeGreaterThan(at);

			return made.Function.indexOf(call);
		}, -1);

		/* Its numbers of their properties: the dark of its woods, the light of its sky, the glints of its water. */
		expect(made.Function).toContain('vec3(0.42, 0.56, 0.4)');
		expect(made.Function).toContain('uAir.a * 0.42 * smoothstep(-0.25, 0.3,');
		expect(made.Function).toContain('mix(0.9, 7.0,');

		library.blocks.forEach(function (block) {
			expect(block.properties.every(function (property) {
				return Number(property.value) !== 0 || property.key === 'DayFrom';
			})).toBe(true);
		});

		/* Its own: no shadow of a ring, no woods. */
		own.blocks = own.blocks.filter(function (block) {
			return block.id !== 'ring' && block.id !== 'woods';
		});
		own.links = own.links.filter(function (link) {
			return !/^(ring|woods)-/.test(link.p1) && !/^(ring|woods)-/.test(link.p2);
		}).concat([{id: 'own', p1: 'mottle-out-Albedo', p2: 'fields-in-Albedo', kind: 'value'}]);

		expect(blueprints.Compile(own).Function).not.toContain('groundRing(');

		var ready = null;
		var component = Elemenx.Component(unique('GroundGraphHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="medium" Labels="false" [graphs]="Graphs" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star" Mass="1">' +
				'<SceneObject ID="terra" Kind="planet" Surface-Type="terran" Radius="6371" Distance="1">' +
					'<SceneObject ID="rings" Kind="ring" Inner="1.4" Outer="2.2" />' +
				'</SceneObject>' +
			'</SceneObject>' +
		'</Scene></div>', Graphs: {'shader/ground': own}, Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		expect(await waitFor(function () {
			return ready;
		}, 8000)).toBeTruthy();

		var renderer = ready.Engine().Renderer;
		var chain = function () {
			return ready.Globed(ready.Forecasted(ready.Clouded(ready.Aired(ready.Weathered(ready.Baked(ready.Landed(ready.Skied(ready.Watered(ready.Winded(ready.Shaders(Elemenx.Service('Renderer'))))))))))));
		};
		var shaders = chain();
		var ring = shaders.Ground.slice(shaders.Ground.indexOf('void groundRing('), shaders.Ground.indexOf('void blueprintGround('));

		ready.Scene().Loop.Stop();

		/* The ring of the ground: its gaps and bands of its seed of its own, none of its light (no shadow(), no lights there). */
		expect(ring).toContain('noise3(');
		expect(ring).toContain('uRingSeed');
		expect(ring).not.toMatch(/\buSeed\b/);
		expect(ring).not.toContain('shadow(');
		expect(ring).not.toContain('uLightCount');
		expect(shaders.Ground).not.toContain('groundRing(clamp(');
		expect(shaders.Ground).toContain('void groundLaid(inout vec3 albedo, inout vec3 n, vec3 smoothed, vec3 near, float foot, float green, float wooded, float snow, float water, float cover, vec2 pictureSoft) {');
		expect(renderer.Check(shaders.GroundVertex, shaders.Ground)).toBeFalsy();

		/* The library ground: the shadow of the ring in it, the whole compiles. */

		ready.GroundMade = blueprints.Compile(library);
		shaders = chain();

		expect(shaders.Ground).toContain('groundRing(clamp(');
		expect(renderer.Check(shaders.GroundVertex, shaders.Ground)).toBeFalsy();
		expect(warned.mock.calls.filter(function (call) {
			return /ground|ring/i.test(String(call[0]));
		})).toEqual([]);

		warned.mockRestore();
	});

	/*
	 * Regression: the surface of a star was one main of the Star shader of a Scene, its corona, prominences and flares one
	 * of the Corona of SceneDeepSpace, its graph (the kind star) only the numbers of each frame. Now its parts are blocks of
	 * the same graph, the library one the very pixels of before; a star of its own graph draws its own.
	 */
	it('draws the surface and the crown of a star of its star graph, the library one the very pixels of before', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graphics = Elemenx.Service('Renderer');
		var library = Elemenx.Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/star'));
		var made = blueprints.Compile(library);
		var sunHook = 'void blueprintSun(vec3 n, vec3 v, vec3 p, inout vec3 color) {}';
		var crownHook = 'void blueprintCrown(float r, float angle, float u, inout vec3 color) {}';
		var sunBefore = [
			'void main() {',
			'	vec3 n = normalize(vNormal);',
			'	vec3 v = normalize(uCamera - vWorld);',
			'	vec3 p = normalize(vLocal);',
			'	float cells = fbm3(p * uCells + vec3(0.0, uTime * 0.08, uSeed), 4);',
			'	float belt = smoothstep(0.08, 0.2, abs(p.y)) * (1.0 - smoothstep(0.45, 0.62, abs(p.y)));',
			'	float field = fbm3(p * 2.6 + vec3(uSeed, uTime * 0.01, 0.0), 3);',
			'	float spots = smoothstep(0.66, 0.74, field) * belt * (1.0 - uBands);',
			'	float bands = 0.5 + 0.5 * sin(p.y * 15.0 + fbm3(p * vec3(1.5, 7.0, 1.5) + vec3(uSeed, 0.0, uTime * 0.02), 3) * 4.0);',
			'	float faculae = (smoothstep(0.58, 0.66, field) - spots) * belt;',
			'	float limb = pow(max(dot(n, v), 0.0), 0.45);',
			'	vec3 color = pow(uColor, vec3(2.2)) * mix(1.0, 0.55 + 0.75 * bands, uBands) * (0.7 + 0.6 * mix(cells, 0.5, uBands * 0.7)) * (0.5 + 0.6 * limb) * (1.0 - spots * 0.55) * (1.0 + faculae * 0.35 * (1.0 - limb));',
			'	float warm = 1.0 - clamp(uColor.b / max(uColor.r, 1e-3), 0.0, 1.0);',
			'	color = mix(color, color * vec3(1.0, 0.5, 0.72) * 0.5, uBands);',
			'	outColor = vec4(mix(color, vec3(1.0), 0.28 * limb * (1.0 - warm) * (1.0 - warm)) * mix(2.4, 1.1, clamp(warm * 1.5, 0.0, 1.0)), 1.0);',
			'}'
		].join('\n');
		var crownBefore = [
			'void main() {',
			'	float r = length(vQuad) * 4.0;',
			'	if (r < 0.985 || r > 4.0) discard;',
			'	float angle = atan(vQuad.y, vQuad.x);',
			'	float u = r - 1.0;',
			'	float streamers = 0.55 + 0.45 * wave(angle * 3.0 + uSeed) * wave(angle * 7.0 - uSeed + uTime * 0.02);',
			'	vec3 color = uColor * exp(-u * 2.6) * streamers * 0.55 * uParts.x * (1.0 - smoothstep(2.5, 4.0, r));',
			'	vec3 red = vec3(1.0, 0.36, 0.3);',
			'	for (int i = 0; i < 8; i++) {',
			'		float k = float(i);',
			'		if (k >= ceil(uShape.x)) break;',
			'		float whole = clamp(uShape.x - k, 0.0, 1.0);',
			'		float at = hash(uSeed + k * 7.3) * 6.2832 - 3.1416;',
			'		float wide = 0.08 + 0.1 * hash(uSeed + k * 3.1);',
			'		float high = min(2.4, (0.12 + 0.3 * hash(uSeed + k * 5.7)) * uShape.y * (0.85 + 0.15 * sin(uPhase * 0.4 + k)));',
			'		float t = (mod(angle - at + 3.1416, 6.2832) - 3.1416) / wide;',
			'		if (abs(t) < 1.2) {',
			'			float arch = high * sqrt(max(0.0, 1.0 - t * t));',
			'			float d = abs(u - arch);',
			'			float strands = 1.0 - 0.4 * clamp(uShape.w, 0.0, 2.5) * (1.0 - wave(t * 9.0 + uPhase * 0.5 + k * 13.0));',
			'			float body = exp(-d * 22.0) * 0.8 + exp(-d * 70.0) * 0.6 + step(u, arch) * smoothstep(0.0, arch, u) * 0.25;',
			'			color += mix(red, uColor, 0.25) * uTint * body * max(strands, 0.0) * smoothstep(1.2, 0.85, abs(t)) * 1.3 * uParts.y * whole;',
			'		}',
			'	}',
			'	float round = floor(uTime / 23.0 + uSeed);',
			'	float since = mod(uTime + uSeed * 23.0, 23.0);',
			'	float where = hash(round) * 6.2832 - 3.1416;',
			'	float off = mod(angle - where + 3.1416, 6.2832) - 3.1416;',
			'	float burst = smoothstep(0.0, 0.6, since) * exp(-since * 0.8);',
			'	color += vec3(1.0, 0.95, 0.85) * exp(-off * off * 120.0 - u * u * 18.0) * burst * 6.0 * uParts.z;',
			'	outColor = vec4(color, 1.0);',
			'}'
		].join('\n');

		expect(made.Type).toBe('star');
		expect(made.Look({}, 3)).toEqual(expect.objectContaining({Count: expect.any(Number), Tint: expect.any(Array)}));
		expect(made.Surface.Function).toContain('void blueprintSun(vec3 n, vec3 v, vec3 p, inout vec3 color) {');
		expect(made.Crown.Function).toContain('void blueprintCrown(float r, float angle, float u, inout vec3 color) {');

		var space = await mount(null);
		var shaders = space.Shaders(graphics);
		var deep = space.DeepSpaceShaders('#version 300 es\nprecision highp float;\n');
		var renderer = graphics.Create(document.createElement('canvas'), {Antialias: false});
		var gl = renderer.GL;
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});

		expect(gl.getExtension('EXT_color_buffer_float')).toBeTruthy();

		/* 32 by 32 of a fragment over the screen, of what the vertex gives (a sphere seen from the front, a quad of a crown). */
		function drawn (vertex, fragment, values) {
			var program = renderer.Program(vertex, fragment);
			var target = renderer.Target(32, 32, {Float: true});
			var pixels = new Float32Array(32 * 32 * 4);

			target.Begin();

			renderer.Draw(quad, program, values, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 32, 32, gl.RGBA, gl.FLOAT, pixels);

			target.End();

			return pixels;
		}

		var sphere = [
			'#version 300 es',
			'in vec3 aPosition;',
			'out vec3 vWorld;',
			'out vec3 vNormal;',
			'out vec3 vLocal;',
			'void main() { vec2 q = aPosition.xy; float z = sqrt(max(0.0, 1.0 - dot(q, q))); vLocal = vec3(q, z); vNormal = vLocal; vWorld = vLocal; gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n');
		var flat = [
			'#version 300 es',
			'in vec3 aPosition;',
			'out vec3 vAt;',
			'out vec2 vQuad;',
			'void main() { vQuad = aPosition.xy * 0.26; vAt = vec3(vQuad, 0.0); gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n');
		var surfaceValues = {uCamera: [0, 0, 4], uColor: [1, 0.85, 0.6], uSeed: 7.3, uTime: 41, uCells: 6, uBands: 0};
		var crownValues = {uColor: [1, 0.9, 0.7], uSeed: 3.1, uTime: 30, uParts: [1, 1, 1, 0], uShape: [5, 1, 3, 1], uTint: [1, 0.9, 0.8], uPhase: 12};
		var sunWas = drawn(sphere, shaders.Star.slice(0, shaders.Star.indexOf(sunHook)) + sunBefore, surfaceValues);
		var sunNow = drawn(sphere, space.Install({Star: shaders.Star}, sunHook, made.Surface).Star, surfaceValues);
		var crownWas = drawn(flat, deep.Corona.slice(0, deep.Corona.indexOf(crownHook)) + crownBefore, crownValues);
		var crownNow = drawn(flat, space.Install({Corona: deep.Corona}, crownHook, made.Crown).Corona, crownValues);
		var beamHook = 'void blueprintBeam(vec2 beam, inout vec3 color) {}';
		var along = [
			'#version 300 es',
			'in vec3 aPosition;',
			'out vec2 vBeam;',
			'void main() { vBeam = vec2(aPosition.x, aPosition.y * 0.5 + 0.5); gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n');
		var beamValues = {uColor: [0.6, 0.7, 1], uStrength: 1.5};
		var beamWas = drawn(along, deep.Beam.slice(0, deep.Beam.indexOf(beamHook)) + [
			'void main() {',
			'	float across = exp(-vBeam.x * vBeam.x * 7.0);',
			'	float along = pow(1.0 - vBeam.y, 1.7) * smoothstep(0.0, 0.015, vBeam.y);',
			'	outColor = vec4(mix(uColor, vec3(1.0), 0.4) * across * along * uStrength * 1.3, 1.0);',
			'}'
		].join('\n'), beamValues);
		var beamNow = drawn(along, space.Install({Beam: deep.Beam}, beamHook, made.Beam).Beam, beamValues);
		var lit = 0;

		expect(gl.getError()).toBe(gl.NO_ERROR);

		for (var j = 0; j < beamWas.length; j++)
			expect(Math.abs(beamNow[j] - beamWas[j])).toBeLessThan(1e-4);

		for (var i = 0; i < sunWas.length; i++) {
			expect(Math.abs(sunNow[i] - sunWas[i])).toBeLessThan(1e-4);
			expect(Math.abs(crownNow[i] - crownWas[i])).toBeLessThan(1e-4);

			if (crownWas[i] > 0.01)
				lit++;
		}

		expect(lit).toBeGreaterThan(100);

		/* A star of its own graph: no spots, its crown of a corona alone. */
		var own = JSON.parse(JSON.stringify(library));

		own.blocks = own.blocks.filter(function (block) {
			return block.id !== 'sun-spots' && block.id !== 'crown-prominences' && block.id !== 'crown-flare';
		});
		own.links = own.links.filter(function (link) {
			return !/^(sun-spots|crown-prominences|crown-flare)-/.test(link.p1) && !/^(sun-spots|crown-prominences|crown-flare)-/.test(link.p2);
		}).concat([{id: 'own', p1: 'crown-corona-out-Color', p2: 'crown-end-in-Color', kind: 'value'}]);

		var mine = blueprints.Compile(own);

		expect(mine.Surface.Function).not.toContain('smoothstep(0.66, 0.74');
		expect(mine.Crown.Function).not.toContain('for (int i = 0; i < 8; i++)');

		/* An old graph of its numbers alone: its parts of the library. */
		var numbers = JSON.parse(JSON.stringify(library));

		numbers.blocks = numbers.blocks.filter(function (block) {
			return !/^(sun|crown)-/.test(block.id);
		});
		numbers.links = numbers.links.filter(function (link) {
			return !/^(sun|crown)-/.test(link.p1) && !/^(sun|crown)-/.test(link.p2);
		});

		expect(blueprints.Compile(numbers).Surface).toBe(null);
		expect(blueprints.Compile(numbers).Look({}, 3).Count).toBeGreaterThan(0);
	});
});
