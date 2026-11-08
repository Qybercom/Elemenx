import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import { Binary } from '../glb.mjs';

var owned = [];

async function mount (model) {
	var ready = null;
	var component = Elemenx.Component(unique('MaterialHost'), {$Template: '<div style="width: 240px; height: 160px"><Scene Paused="true" Quality="medium" Exposure="1" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" />' +
		'<SceneObject ID="sun" Kind="sun" Time="12" Latitude="45" />' +
		'<SceneObject ID="hero" Kind="unit" Model="' + model + '" Size="8" X="0" Y="0" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

/* A material graph: the surface given the glow of the parameter Glow, and rougher by Rough. */
function glowing (blueprints) {
	var graph = blueprints.Create('material', {parameters: [{key: 'Glow', type: 'vec3', value: [0, 0, 0]}, {key: 'Rough', type: 'float', value: 0.9}]});
	var glow = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Glow', Type: 'vec3'}});
	var rough = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Rough'}});
	var map = blueprints.Add(graph, 'Texture', {properties: {Name: 'Color'}});
	var surface = blueprints.Add(graph, 'Surface');
	var position = blueprints.Add(graph, 'Position');
	var noise = blueprints.Add(graph, 'Noise');

	/* The noise of the shaders, a part PBR has already: not declared twice. */
	blueprints.Link(graph, [position.id, 'Position'], [noise.id, 'Position']);
	blueprints.Link(graph, [noise.id, 'Value'], [surface.id, 'Metal']);
	blueprints.Link(graph, [glow.id, 'Value'], [surface.id, 'Emission']);
	blueprints.Link(graph, [rough.id, 'Value'], [surface.id, 'Rough']);
	blueprints.Link(graph, [map.id, 'RGB'], [surface.id, 'Color']);

	return graph;
}

describe('Contract: materials of models as material graphs of Blueprints, drawn by PBR with their surface', function () {
	var blueprints;
	var models;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Blueprints', 'service:SceneModels']);

		blueprints = Elemenx.Service('Blueprints');
		models = Elemenx.Service('SceneModels');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var made = [];
		var scene;
		var engine;
		var renderer;
		var program;
		var skin;
		var dark;
		var lit;
		var now = 1000;
		var i;

		models.Define('test-glowing', {URL: address, Type: 'unit', Materials: {Skin: {Blueprint: glowing(blueprints), Parameters: {Glow: [0, 0, 0]}}}});

		try {
			scene = await mount('test-glowing');
			engine = scene.Engine();
			renderer = engine.Renderer;
			program = renderer.Program;

			renderer.Program = function (vertex, fragment) {
				made.push(fragment);

				return program.apply(this, arguments);
			};

			/* The view set at once on the hero: no flight to wait for. */
			scene.SetViewpoint({Target: [0, 4, 0], Yaw: 0, Pitch: 0.3, Distance: 22});

			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				return models.Ready('test-glowing') && Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && Object.keys(scene.Scene().Lists || {}).some(function (name) {
					return /test-glowing/.test(name);
				});
			}, 20000);

			/*
			 * Regression: under load the program of the material was still made in the background, and the scene drew quiet frames
			 * of its loading in the meantime: wait until it is asked for and done.
			 */
			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				return renderer.Progress().Needed === 0 && made.some(function (fragment) {
					return fragment.indexOf('uParameter_Glow') !== -1;
				});
			}, 30000);

			/* The surface of the graph in the place of the empty one of PBR, and the map of the material read by the name Color. */
			expect(made.filter(function (fragment) {
				return fragment.indexOf('uParameter_Glow') !== -1;
			}).length).toBe(1);
			expect(made.join('\n')).toContain('#define uTexture_Color uColorMap');
			expect(renderer.GL.getError()).toBe(renderer.GL.NO_ERROR);

			skin = Object.keys(scene.Scene().Lists).map(function (name) {
				return scene.Scene().Lists[name].Material;
			}).filter(function (material) {
				return material && material.Name === 'Skin';
			})[0];

			/* How much redder than blue the hero is: the pixels of a box round where it stands on the screen, the view still. */
			async function red () {
				var gl = renderer.GL;
				var ratio = renderer.Ratio;
				var spot;
				var data = new Uint8Array(24 * 48 * 4);
				var sum = 0;
				var i;

				/* Regression: under load a frame of the loading drew nothing, and the box read black: a frame drawn, every program done. */
				await waitFor(function () {
					var painted = scene.Scene().Painted;

					scene.Scene().Rest = 0;

					engine.Frame(now += 33);

					return renderer.Progress().Needed === 0 && Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && scene.Scene().Painted > painted;
				}, 30000);

				/* Read in the same task as the frame is drawn: after it the page shows the canvas, and its buffer is empty. */
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				spot = engine.ToScreen('hero');

				gl.readPixels(Math.round(spot.X * ratio) - 12, Math.round(renderer.Height - spot.Y * ratio) - 4, 24, 48, gl.RGBA, gl.UNSIGNED_BYTE, data);

				for (i = 0; i < data.length; i += 4)
					sum += data[i] - data[i + 2];

				return sum;
			}

			for (i = 0; i < 90; i++) {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);
			}

			dark = await red();

			/* A glow of red: more red than blue wherever the skin shows; no program made again for it. */
			made.length = 0;
			skin.Parameters = {Glow: [20, 0, 0]};

			lit = await red();

			expect(lit).toBeGreaterThan(dark + 24 * 48 * 10);
			expect(made.filter(function (fragment) {
				return fragment.indexOf('uParameter_Glow') !== -1;
			})).toEqual([]);
		}
		finally {
			delete models.Recipes['test-glowing'];
		}
	}, 45000);

	it('draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var graph = blueprints.Create('material', {parameters: [{key: 'Tint', type: 'vec3', value: [0, 0, 1]}]});
		var tint = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Tint', Type: 'vec3'}});
		var surface = blueprints.Add(graph, 'Surface');
		var scene;
		var engine;
		var ground;
		var now = 1000;

		blueprints.Link(graph, [tint.id, 'Value'], [surface.id, 'Color']);

		models.Define('test-plain', {URL: address, Type: 'unit'});

		/* The color of the middle of the bottom of the view: the ground. */
		function color () {
			var renderer = engine.Renderer;
			var data = new Uint8Array(4);

			scene.Scene().Rest = 0;

			engine.Frame(now += 33);

			renderer.GL.readPixels(Math.round(renderer.Width / 2), 6, 1, 1, renderer.GL.RGBA, renderer.GL.UNSIGNED_BYTE, data);

			return [data[0], data[1], data[2]];
		}

		try {
			scene = await mount('test-plain');
			engine = scene.Engine();

			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				return engine.Renderer.Progress().Needed === 0 && Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && !!scene.Scene().Ground;
			}, 20000);

			ground = scene.Scene().Ground;

			scene.Change('land', {Blueprint: graph, Parameters: {Tint: [1, 0, 0]}});

			/* Its program made in the background first, as under load it takes a while. */
			await waitFor(function () {
				color();

				return engine.Renderer.Progress().Needed === 0;
			}, 30000);

			expect(color()[0]).toBeGreaterThan(color()[2] + 40);

			scene.Change('land', {Parameters: {Tint: [0, 0, 1]}});

			color();

			expect(color()[2]).toBeGreaterThan(color()[0] + 40);
			expect(scene.Scene().Ground).toBe(ground);
		}
		finally {
			delete models.Recipes['test-plain'];
		}
	}, 45000);

	it('draws a material as it is when its Blueprint cannot be made, and tells it once', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var graph = blueprints.Create('pass');
		var scene;
		var engine;
		var i;

		models.Define('test-broken', {URL: address, Type: 'unit', Materials: {Skin: {Blueprint: graph}}});

		try {
			scene = await mount('test-broken');
			engine = scene.Engine();

			await waitFor(function () {
				engine.Frame(performance.now());

				return models.Ready('test-broken') && Object.keys(scene.Scene().Lists || {}).some(function (name) {
					return /test-broken/.test(name);
				});
			}, 20000);

			for (i = 0; i < 3; i++)
				engine.Frame(performance.now());

			expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
			expect(warn.mock.calls.filter(function (call) {
				return String(call[0]).indexOf('Elemenx Scene: the Blueprint of material Skin cannot be made') === 0;
			}).length).toBe(1);
		}
		finally {
			warn.mockRestore();

			delete models.Recipes['test-broken'];
		}

	/* Regression: the wait for the model (20 s) was longer than the test was let run (15 s): under load it was cut off. */
	}, 45000);

	/* The water is a graph: the one of the library keeps the sums of the shader it came from, a WaterGraph takes its place. */
	it('draws its water by the water graph of the library made of blocks, or by a WaterGraph of its own', async function () {
		var ready = null;
		var code = 'color = vec3(0.1, 0.4, 0.2) + uSunColor * 0.0; alpha = 0.5;';
		var graphics = Elemenx.Service('Renderer');
		var component;
		var scene;
		var made;
		var shader;

		component = Elemenx.Component(unique('WaterHost'), {$Template: '<div style="width: 240px; height: 160px"><Scene Paused="true" Quality="medium" [waterGraph]="Water" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="6" Water="0.4" Seed="test" /></Scene></div>', Water: 'void blueprintWater(inout vec3 color, inout float alpha) {\n\t' + code + '\n}', Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		scene = ready;

		scene.Scene().Loop.Stop();

		/* The water of the library: a lake and a river, the sky and the sun, the depth, the foam, what is round it, the fog. */
		made = blueprints.Compile(JSON.parse(JSON.stringify(scene.LibraryWater())));

		expect(made.Type).toBe('water');
		['wavesAt(', 'uMirror > 0.5 ? 14 : 7', 'fract(', ' * 0.2);', 'uTime', 'reflectedSky(', 'pow(', '1400.0', 'mirrored(vWorld', 'vec3(0.05, 0.13, 0.11)', 'vec3(0.82, 0.86, 0.85)', '1.0 - exp(-length(vWorld) / uFog)', '0.86', '0.14'].forEach(function (part) {
			expect(made.Function).toContain(part);
		});

		/* One of its own in the shader of water, the one of the library not there. */
		shader = scene.Watered(scene.Shaders(graphics)).Sea;

		expect(scene.WaterMade.Function).toContain(code);
		expect(shader).toContain(code);
		expect(shader).not.toContain('1400.0');

		scene.Scene().Rest = 0;

		scene.Engine().Frame(performance.now() + 1000);

		expect(scene.Engine().Renderer.GL.getError()).toBe(scene.Engine().Renderer.GL.NO_ERROR);

		expect(blueprints.Nodes('water')).toEqual(expect.arrayContaining(['Place', 'View', 'Far', 'Flow', 'Sun', 'Time', 'Waves', 'WaterNormal', 'Fresnel', 'Glints', 'Sky', 'Body', 'Foam', 'Reflection', 'WaterFog', 'Mix', 'GLSL', 'Water']));
		expect(function () {
			blueprints.Compile({type: 'water', glsl: 'void main() {}'});
		}).toThrow('Elemenx Blueprints: a water written by hand has no blueprintWater');
	}, 60000);

	/* The sky and the land are graphs: the ones of the library keep the sums of the shaders they came from, a SkyGraph and a LandGraph take their places. */
	it('draws its sky and its land by the graphs of the library made of blocks, or by a SkyGraph and a LandGraph of its own', async function () {
		var ready = null;
		var sky = 'color = vec3(0.2, 0.3, 0.9) + uSun * 0.0; alpha = 1.0;';
		var land = 'color = vec3(0.3, 0.5, 0.2) + vPlace * 0.0; alpha = 1.0;';
		var graphics = Elemenx.Service('Renderer');
		var component;
		var scene;
		var made;
		var shaders;

		component = Elemenx.Component(unique('SkyHost'), {$Template: '<div style="width: 240px; height: 160px"><Scene Paused="true" Quality="medium" [skyGraph]="Sky" [landGraph]="Land" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="6" Water="0.2" Seed="test" /></Scene></div>', Sky: 'void blueprintSky(inout vec3 color, inout float alpha) {\n\t' + sky + '\n}', Land: 'void blueprintLand(inout vec3 color, inout float alpha) {\n\t' + land + '\n}', Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		scene = ready;

		scene.Scene().Loop.Stop();

		/* The sky of the library: the air, dusk, the halo of the sun, wisps, the cover, an eclipse, towns, a rainbow, the moon. */
		made = blueprints.Compile(JSON.parse(JSON.stringify(scene.LibrarySky())));

		expect(made.Type).toBe('sky');
		['uInverse * vec4(vQuad, 1.0, 1.0)', 'vec3(0.38, 0.55, 1.0)', 'vec3(1.0, 0.54, 0.2)', 'pow(', '500.0', 'vec3(0.85, 0.3, 0.42)', 'noise3(', 'uCover * 0.8', 'uEclipse', 'uGlowWay', 'uRainbow', 'uMoonGlow', 'uMoonSize', 'uSunRadius', '9.0'].forEach(function (part) {
			expect(made.Function).toContain(part);
		});

		/* The land of the library: the grain, the pools and their rings, wet and snow, its Blueprint, the light, the sheen, the haze. */
		made = blueprints.Compile(JSON.parse(JSON.stringify(scene.LibraryLand())));

		expect(made.Type).toBe('land');
		['noise3(', 'rings(', 'uRainDrops', 'uWet', 'uSnowed', 'blueprintSurface(', 'sunLit(', 'aroundLight(', 'localLight(', 'mix(28.0, 1400.0', '1.0 / 2.2', 'uFog', '0.45'].forEach(function (part) {
			expect(made.Function).toContain(part);
		});

		/* Their own in the shaders of the sky and of the land, the ones of the library not there. */
		shaders = scene.Landed(scene.Skied(scene.Shaders(graphics)));

		expect(scene.SkyMade.Function).toContain(sky);
		expect(scene.LandMade.Function).toContain(land);
		expect(shaders.Sky).toContain(sky);
		expect(shaders.Sky).not.toContain('0.99972');
		expect(shaders.Land).toContain(land);
		expect(shaders.Land).not.toContain('mix(28.0, 1400.0');

		scene.Scene().Rest = 0;

		scene.Engine().Frame(performance.now() + 1000);

		expect(scene.Engine().Renderer.GL.getError()).toBe(scene.Engine().Renderer.GL.NO_ERROR);

		expect(blueprints.Nodes('sky')).toEqual(expect.arrayContaining(['SkyRay', 'SkyDay', 'SkyAir', 'SkyDusk', 'SkyHalo', 'SkyPink', 'SkyWisps', 'SkyCover', 'SkyEclipse', 'SkyTowns', 'SkyRainbow', 'SkyMoonHaze', 'SkyMoon', 'SkyCompose', 'SkyEnd', 'Mix', 'GLSL']));
		expect(blueprints.Nodes('land')).toEqual(expect.arrayContaining(['LandPoint', 'LandGrain', 'LandPools', 'LandAlbedo', 'LandPaint', 'LandLight', 'LandSheen', 'LandCompose', 'LandEnd', 'Mix', 'GLSL']));
		expect(function () {
			blueprints.Compile({type: 'sky', glsl: 'void main() {}'});
		}).toThrow('Elemenx Blueprints: a sky written by hand has no blueprintSky');
		expect(function () {
			blueprints.Compile({type: 'land', glsl: 'void main() {}'});
		}).toThrow('Elemenx Blueprints: a land written by hand has no blueprintLand');
	}, 60000);

	/* The wind is a vertex graph: the one of the library keeps the sums of the shader it came from, a WindGraph takes its place. */
	it('sways by the wind of the library made of blocks, or by a WindGraph of its own in every shader that sways', async function () {
		var ready = null;
		var code = 'world.y += sway * phase * size * 0.0;';
		var graphics = Elemenx.Service('Renderer');
		var component;
		var scene;
		var made;
		var now = 1000;

		component = Elemenx.Component(unique('WindHost'), {$Template: '<div style="width: 240px; height: 160px"><Scene Paused="true" Quality="medium" [windGraph]="Wind" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" /></Scene></div>', Wind: 'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\t' + code + '\n}', Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		scene = ready;

		scene.Scene().Loop.Stop();

		/* The wind of the library: its blocks make the sums of the shader it came from. */
		made = blueprints.Compile(JSON.parse(JSON.stringify(scene.LibraryWind())));

		expect(made.Type).toBe('vertex');
		['sway', 'phase', 'size', 'uWind', '0.035', '1.3', '0.9', '1.7', 'sin(', 'cos('].forEach(function (part) {
			expect(made.Function).toContain(part);
		});

		/* A WindGraph of its own: in the shaders of copies, of skeletons and of what is sown, in place of the wind of the library. */
		expect(scene.WindMade.Function).toContain(code);

		['Instanced', 'Skinned'].forEach(function (name) {
			var text = scene.Winded(scene.Shaders(graphics))[name];

			expect(text).toContain('void blueprintWind(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\t' + code);
			expect(text).not.toContain('0.035');
		});

		expect(scene.Winded(scene.ScatterShaders(graphics)).Vertex).toContain(code);

		/* The programs of its frames are made of them and draw. */
		scene.Scene().Rest = 0;

		scene.Engine().Frame(now += 33);

		expect(scene.Engine().Renderer.GL.getError()).toBe(scene.Engine().Renderer.GL.NO_ERROR);
	}, 60000);

	/* The wind of the grass is a vertex graph too: the one of the library keeps the sums of its shader, a GrassGraph takes its place. */
	it('leans the grass by the wind of the library made of blocks, or by a GrassGraph of its own, and draws it', async function () {
		var ready = null;
		var code = 'world.y += phase * size * 0.0; bent.x = 0.25;';
		var graphics = Elemenx.Service('Renderer');
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var component;
		var scene;
		var made;
		var text;

		component = Elemenx.Component(unique('GrassHost'), {$Template: '<div style="width: 240px; height: 160px"><Scene Paused="true" Quality="medium" [grassGraph]="Grass" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" /><SceneObject ID="meadow" Kind="grass" Density="1" /></Scene></div>', Grass: 'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\t' + code + '\n}', Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		scene = ready;

		scene.Scene().Loop.Stop();

		/* The wind of the grass of the library: the wave over the field, the lean, the stir near the eye. */
		made = blueprints.Compile(JSON.parse(JSON.stringify(scene.LibraryGrass())));

		expect(made.Type).toBe('vertex');
		['uWind', '0.11', '0.07', '0.53', '0.13', '0.16', '2.6', '6.28', '9', 'sin(', 'cos(', 'phase', 'size', 'uv', 'normal'].forEach(function (part) {
			expect(made.Function).toContain(part);
		});

		/* A GrassGraph of its own in the shader of the grass alone; the wind of the rest is the one of the scene. */
		text = scene.Grassed(scene.Winded(scene.ScatterShaders(graphics)));

		expect(scene.GrassMade.Function).toContain(code);
		expect(text.GrassVertex).toContain('void blueprintGrass(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\t' + code);
		expect(text.GrassVertex).toContain('vWave = bent.x;');
		expect(text.Vertex).not.toContain(code);

		scene.Scene().Rest = 0;

		scene.Engine().Frame(performance.now() + 1000);

		expect(scene.Engine().Renderer.GL.getError()).toBe(scene.Engine().Renderer.GL.NO_ERROR);
		expect(warn.mock.calls.filter(function (call) {
			return /GrassGraph|cannot be made/.test(String(call[0]));
		})).toEqual([]);

		warn.mockRestore();
	}, 60000);

	/* The Vertex of a material moves the corners of its shape in every pass that draws it: the picture and its shadows. */
	it('moves the corners of a material by its Vertex in the picture and in the shadows, its uniforms given in each', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var code = 'world.y += uParameter_Lift * 0.0 + sin(uTime) * 0.0;';
		var vertex = 'uniform float uParameter_Lift; // = 1\nuniform float uTime;\n\nvoid blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\t' + code + '\n}';
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var programs = [];
		var given = [];
		var scene;
		var engine;
		var program;
		var draw;
		var now = 1000;

		models.Define('test-moving', {URL: address, Type: 'unit', Materials: {Skin: {Vertex: vertex, Parameters: {Lift: 3}}}});

		try {
			scene = await mount('test-moving');
			engine = scene.Engine();
			program = engine.Renderer.Program;
			draw = engine.Renderer.Draw;

			engine.Renderer.Program = function (vertexSource, fragment) {
				var made = program.apply(this, arguments);

				programs.push({Vertex: vertexSource, Fragment: fragment, Program: made});

				return made;
			};

			engine.Renderer.Draw = function (mesh, made, uniforms) {
				if (programs.some(function (one) {
					return one.Program === made && one.Vertex.indexOf(code) !== -1;
				}))
					given.push(uniforms);

				return draw.apply(this, arguments);
			};

			await waitFor(function () {
				engine.Frame(now += 33);

				return models.Ready('test-moving') && programs.some(function (one) {
					return one.Vertex.indexOf(code) !== -1 && /void main\(\) \{\}$/.test(one.Fragment.trim());
				}) && given.length > 1;
			}, 30000);

			/* In the picture (PBR) and in the depth of the shadows: the same corners moved. */
			expect(programs.filter(function (one) {
				return one.Vertex.indexOf(code) !== -1;
			}).map(function (one) {
				return /void main\(\) \{\}$/.test(one.Fragment.trim()) ? 'depth' : /blueprintSurface/.test(one.Fragment) ? 'pbr' : 'other';
			})).toEqual(expect.arrayContaining(['pbr', 'depth']));
			expect(given.every(function (uniforms) {
				return uniforms.uParameter_Lift === 3 && typeof uniforms.uTime === 'number';
			})).toBe(true);
			expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
			expect(warn.mock.calls.filter(function (call) {
				return String(call[0]).indexOf('Elemenx Scene:') === 0;
			})).toEqual([]);
		}
		finally {
			warn.mockRestore();

			delete models.Recipes['test-moving'];
		}
	});

	/* A shader is written by hand too: the text of a material in the Blueprint, or the URL of a file of it, read once. */
	it('draws a material written by hand, given as its text or as the URL of a file of GLSL that comes later', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var text = 'uniform float uParameter_Shine; // = 0.25\n\nvoid blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {\n\tmetal = uParameter_Shine;\n}';
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var made = [];
		var scene;
		var engine;
		var program;
		var now = 1000;

		models.Define('test-written', {URL: address, Type: 'unit', Materials: {Skin: {Blueprint: text}}});
		models.Define('test-file', {URL: address + '#file', Type: 'unit', Materials: {Skin: {Blueprint: '/shaders/glow.glsl'}}});

		try {
			scene = await mount('test-written');
			engine = scene.Engine();
			program = engine.Renderer.Program;

			engine.Renderer.Program = function (vertex, fragment) {
				made.push(fragment);

				return program.apply(this, arguments);
			};

			scene.Add('unit', {ID: 'other', Model: 'test-file', Size: 8, X: 12, Y: 0});

			await waitFor(function () {
				engine.Frame(now += 33);

				return models.Ready('test-written') && models.Ready('test-file') && made.some(function (fragment) {
					return fragment.indexOf('metal = uParameter_Shine;') !== -1;
				}) && made.some(function (fragment) {
					return fragment.indexOf('emission = uParameter_Glow * noise3(position);') !== -1;
				});
			}, 30000);

			expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
			expect(warn.mock.calls.filter(function (call) {
				return String(call[0]).indexOf('Elemenx Scene:') === 0;
			})).toEqual([]);
		}
		finally {
			warn.mockRestore();

			delete models.Recipes['test-written'];
			delete models.Recipes['test-file'];
		}
	});
});
