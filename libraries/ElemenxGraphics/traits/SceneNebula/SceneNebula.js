/*
 * SceneNebula: the clouds of gas and dust of space, each an object of the kind nebula (trait Nebula) a Scene draws as
 * a volume: a ray through its ball, from outside or from within, the light it gives added, what is behind dimmed as far
 * as its dust hides it (the blend premultiplied of Renderer).
 * - Nebula: Type (hii: a cloud where stars are born, red of hydrogen at its edges, blue-green in its hot heart, torn by
 *   dark lanes; planetary: the shell a dying star puffed off, a ring in two lobes; remnant: what a supernova threw out, a
 *   thin shell of threads, of its Subtype: Ia round and even, red and white; II torn and lopsided, green, red and blue;
 *   Ib and Ic in knots with no hydrogen, blue-green and violet; dark: dust that hides what is behind it), Radius (light
 *   years), Seed, Density (how thick its gas and dust are, 1), Glow (how bright, 1), Colors ('#outer, #inner': its own),
 *   Blueprint (its look as a graph of the kind nebula of SceneBlueprints, run each frame: it breathes, turns, spreads,
 *   its tints, how torn its shape is; Scene.LibraryNebula() the one of the library), Parameters (of its graph).
 * Its shape is made once into a block of 128³ (64³ at low quality; its slices side by side in one texture, of its Type,
 * Subtype, Seed, Density and the shape of its graph), a band of rows a frame (a stage of the loading: nebulae), and read
 * along the rays at every frame: the noise is not worked out again for each step of each pixel. Seen near, a fine grain
 * of its own over it (Detail of its graph), the steps of each pixel begun a little apart (no rings).
 * NebulaLook(id) gives what it is drawn with ({Type, Subtype, Colors, Dust, Glow, Turn, Grow, Detail, Shape, Side,
 * Baked}); its Info (Describe, the card) its kind and its size; the inspector of SceneEditor offers its Type and Subtype
 * to choose (engine.Options).
 */
Elemenx.Trait('SceneNebula', {
	NebulaStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var self = this;
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var head = '#version 300 es\nprecision highp float;\n';
		var types = ['hii', 'planetary', 'remnant', 'dark'];
		var subtypes = ['Ia', 'II', 'Ib', 'Ic'];
		var programs = null;
		var quad = null;
		var blocks = {};
		var looks = {Graphs: typeof WeakMap === 'function' ? new WeakMap() : null, Texts: {}};

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function trait (object, name) {
			return object && object.Traits ? object.Traits[name] || null : null;
		}

		function colorOf (text, fallback) {
			var hex = String(text || '').trim().replace('#', '');

			return /^[0-9a-f]{6}$/i.test(hex) ? [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255] : fallback;
		}

		function tinted (color, tint) {
			var by = tint || [1, 1, 1];

			return [color[0] * by[0], color[1] * by[1], color[2] * by[2]];
		}

		function level () {
			return self.Graphics ? self.Graphics().Level : 'medium';
		}

		/* The side of the block of its shape: 128 (64 at low quality), its slices in columns of 16 (8). */
		function sideOf () {
			return level() === 'low' ? 64 : 128;
		}

		/* What its graph gives (compiled once, of the graph or its text); null without one or one that cannot be made. */
		function graphOf (object, nebula) {
			var graph = nebula.Blueprint;
			var made;

			if (!graph)
				return null;

			made = typeof graph === 'string' ? looks.Texts[graph] : looks.Graphs ? looks.Graphs.get(graph) : undefined;

			if (made === undefined) {
				try {
					made = self.$Service('Blueprints').Compile(typeof graph === 'string' ? JSON.parse(graph) : graph);
				}
				catch (error) {
					made = null;

					engine.Told('nebula', object.Name || object.ID, [{Block: null, Line: 0, Message: error.message}], error.message, 'Elemenx Scene: the Blueprint of a nebula cannot be made: ' + error.message);
				}

				if (typeof graph === 'string') looks.Texts[graph] = made;
				else if (looks.Graphs) looks.Graphs.set(graph, made);
			}

			return made && made.Look ? made : null;
		}

		/*
		 * What a nebula is drawn with: the colors of its kind (its own Colors over them, tinted as its graph says), how its dust
		 * dims, how bright it is, how far it is turned and spread now, its fine grain; the shape of its graph (at its time 0)
		 * in the key of its block.
		 */
		function lookOf (object) {
			var nebula = trait(object, 'Nebula');
			var type = types.indexOf(nebula.Type) !== -1 ? nebula.Type : 'hii';
			var subtype = subtypes.indexOf(nebula.Subtype) !== -1 ? nebula.Subtype : type === 'remnant' ? 'II' : '';
			var palette = {
				hii: [[1, 0.24, 0.34], [0.32, 0.86, 0.82], 2.2],
				planetary: [[0.95, 0.3, 0.38], [0.36, 0.8, 1], 0.6],
				remnant: {Ia: [[1, 0.38, 0.32], [0.86, 0.9, 1], 0.4], II: [[1, 0.3, 0.26], [0.36, 1, 0.6], 0.8], Ib: [[0.62, 0.42, 1], [0.32, 0.92, 0.86], 0.7], Ic: [[0.7, 0.36, 1], [0.4, 0.75, 1], 0.7]}[subtype],
				dark: [[0.16, 0.09, 0.06], [0.3, 0.18, 0.1], 9]
			}[type];
			var colors = String(nebula.Colors || '').split(',');
			var made = graphOf(object, nebula);
			var plain = {Glow: 1, Density: 1, Turn: 0, Grow: 1, Detail: 1, Outer: [1, 1, 1], Inner: [1, 1, 1], Turbulence: 1, Thickness: 1, Hollow: 1};
			var now = made ? made.Look(nebula.Parameters || {}, scene.Seconds % 100000) || plain : plain;
			var shape = made ? made.Look(nebula.Parameters || {}, 0) || plain : plain;
			var side = sideOf();
			var form = [Math.max(0, number(shape.Turbulence, 1)), Math.max(0.1, number(shape.Thickness, 1)), Math.max(0, number(shape.Hollow, 1))];

			return {
				Type: type,
				Subtype: subtype,
				Colors: [tinted(colorOf(colors[0], palette[0]), now.Outer), tinted(colorOf(colors[1], palette[1]), now.Inner)],
				Dust: palette[2] * number(nebula.Density, 1) * Math.max(0, number(now.Density, 1)),
				Glow: number(nebula.Glow, 1) * Math.max(0, number(now.Glow, 1)),
				Turn: number(now.Turn, 0) * Math.PI / 180,
				Grow: Math.max(0.05, number(now.Grow, 1)),
				Detail: Math.max(0, number(now.Detail, 1)),
				Shape: form,
				Side: side,
				Key: [type, subtype, nebula.Seed || object.ID, number(nebula.Density, 1), form.join(','), side].join(':')
			};
		}

		/* The block of its shape, made once of what makes it (none made again while the look stays): its slices in columns. */
		function blockOf (object, look) {
			var nebula = trait(object, 'Nebula');
			var block = blocks[object.ID];
			var columns = look.Side === 128 ? 16 : 8;

			if (block && block.Key === look.Key) return block;

			if (block)
				block.Target.Destroy();

			block = blocks[object.ID] = {Key: look.Key, Side: look.Side, Columns: columns, Width: look.Side * columns, Height: look.Side * look.Side / columns, Row: 0, Done: false};
			block.Target = renderer.Target(block.Width, block.Height, {});
			block.Seed = self.$Service('Random').Sequence(String(nebula.Seed || object.ID))() * 1000;

			return block;
		}

		/*
		 * A band of its rows (some 260 000 texels): the card is never busy long with it. Regression: all of a block of 64³ at
		 * once; of 128³ (eight times as many) it would have held a frame up for a long while.
		 */
		function bake (block, look) {
			var rows = Math.max(1, Math.min(block.Height - block.Row, Math.floor(262144 / block.Width)));
			var done;

			block.Target.Begin();

			if (!block.Row) {
				renderer.Viewport(0, 0, block.Width, block.Height);
				renderer.Clear([0, 0, 0, 0]);
			}

			renderer.Viewport(0, block.Row, block.Width, rows);

			done = engine.DrawReady(quad, programs.Bake, {uType: types.indexOf(look.Type), uSubtype: Math.max(0, subtypes.indexOf(look.Subtype)), uSeed: block.Seed, uDensity: Math.min(3, look.Dust / 2), uSide: block.Side, uColumns: block.Columns, uShape: look.Shape}, {Depth: false, DepthWrite: false, Cull: 'none'});

			block.Target.End();

			/* Regression of its kind (SceneGalaxy): a draw skipped while its program is made is no rows. */
			if (done === false) return;

			block.Row += rows;
			block.Done = block.Row >= block.Height;
		}

		function made () {
			programs = programs || {Bake: renderer.Program(self.$Service('Renderer').Shaders.Quad, self.NebulaBakeShader(head, self.$Service('Renderer').Chunks.Noise)), March: renderer.Program(self.NebulaVertex(head), self.NebulaShader(head))};
			quad = quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		}

		function nebulae () {
			return scene.Active.filter(function (object) {
				return !!trait(object, 'Nebula') && !object.Hidden;
			});
		}

		/* The Type and the Subtype of a nebula to choose in an inspector (SceneEditor). */
		engine.Options = engine.Options || {};
		engine.Options['Nebula:Type'] = types.slice();
		engine.Options['Nebula:Subtype'] = [''].concat(subtypes);

		engine.NebulaLook = function (id) {
			var object = scene.Objects[id];
			var look;

			if (!trait(object, 'Nebula')) return null;

			look = lookOf(object);
			look.Baked = !!(blocks[id] && blocks[id].Done && blocks[id].Key === look.Key);

			return look;
		};

		/* The card of a nebula: its kind and how far across it is. */
		engine.NebulaInfo = function (object) {
			var nebula = trait(object, 'Nebula');
			var look = lookOf(object);

			return {Kind: 'nebula', Type: look.Type, Subtype: look.Subtype, Radius: number(nebula.Radius, 2), Rows: [['type', look.Type + (look.Subtype ? ' ' + look.Subtype : ''), ''], ['radius', number(nebula.Radius, 2), 'ly']]};
		};

		/* Asked for when the scene starts (engine.Warm), waited for with the rest: none is made in the play. */
		(engine.Warms = engine.Warms || []).push(function (setting) {
			if (setting !== 'space' || !renderer || !nebulae().length) return;

			made();
		});

		/* The blocks of the shapes of its nebulae till they are made: a stage of the loading. */
		(engine.Bakes = engine.Bakes || []).push(function () {
			var stage = {Name: 'nebulae', Done: 0, Total: 0};

			if (!renderer || scene.Ground) return null;

			nebulae().forEach(function (object) {
				var look = lookOf(object);
				var block = blocks[object.ID];
				var height = look.Side * look.Side / (look.Side === 128 ? 16 : 8);

				stage.Total += height;
				stage.Done += block && block.Key === look.Key ? Math.min(block.Row, height) : 0;
			});

			return stage.Total ? stage : null;
		});

		/* In the part of the depth its middle is in, after all that stands: each nebula through its ball. */
		engine.NebulaDraw = function (matrix, later, planes) {
			var steps = {low: 40, medium: 64, high: 80, ultra: 96}[level()] || 64;
			var tall = 2 * Math.tan(scene.Camera.Fov * Math.PI / 360) / Math.max(1, scene.Height);

			if (!renderer || scene.Ground || !nebulae().length) return;

			made();

			nebulae().forEach(function (object) {
				var far;
				var radius;
				var inside;
				var look;
				var block;

				if (!object.World) return;

				/* Its shape a band of rows a frame, seen or not (the loading waits for it). */
				look = lookOf(object);
				block = blockOf(object, look);

				if (!block.Done) {
					bake(block, look);

					if (block.Done)
						scene.Rest = 0;
				}

				far = vectors.Distance(object.World, scene.Camera.Position);
				radius = object.Size * look.Grow;
				inside = far < radius * 1.02;

				if (planes && !inside && (far < planes[0] || far >= planes[1])) return;

				/* Within it: once, in the far part (the one drawn first), so what is near stands over it. */
				if (planes && inside && planes[1] < scene.Camera.Far * 0.999) return;

				/* Before the halos of the stars: they shine through it. */
				later.unshift(function () {
					var eye = scene.Eye || [0, 0, 0];
					var center = vectors.Subtract(object.World, eye);
					var front = vectors.Scale(vectors.Normalize(center), Math.max(0, vectors.Length(center) - radius));
					var depth = -1;
					var pixels = inside ? 1e9 : radius / Math.max(1e-9, far * tall);
					var at;

					if (!block.Done) return;

					/* The quad at the depth of its nearest point: what stands before the nebula hides it, what is in it does not. */
					if (!inside) {
						at = [matrix[0] * front[0] + matrix[4] * front[1] + matrix[8] * front[2] + matrix[12], matrix[2] * front[0] + matrix[6] * front[1] + matrix[10] * front[2] + matrix[14], matrix[3] * front[0] + matrix[7] * front[1] + matrix[11] * front[2] + matrix[15]];
						depth = at[2] > 1e-9 ? Math.max(-1, Math.min(0.9999, at[1] / at[2])) : -1;
					}

					/* Its fine grain only as it is seen near (some hundreds of pixels across and more): far, it would only shimmer. */
					engine.DrawReady(quad, programs.March, {uDepth: depth, uInverse: math.Invert(matrix), uViewport: [renderer.Width, renderer.Height], uCenter: center, uRadius: radius, uBlock: block.Target.Textures[0], uSide: block.Side, uColumns: block.Columns, uTurn: look.Turn, uFine: look.Detail * Math.max(0, Math.min(1, (pixels - 250) / 900)), uColorA: look.Colors[0], uColorB: look.Colors[1], uDust: look.Dust, uGlow: look.Glow, uDark: look.Type === 'dark' ? 1 : 0, uSteps: steps}, {Blend: 'premultiplied', Depth: !inside, DepthWrite: false, Cull: 'none'});
				});
			});
		};

		engine.NebulaForget = function () {
			Object.keys(blocks).forEach(function (id) {
				blocks[id].Target.Destroy();
			});

			blocks = {};
		};
	},

	/* The quad over the whole view at a depth given (uDepth, of the nearest point of the nebula). */
	NebulaVertex: function (head) {
		return head + [
			'in vec3 aPosition;',
			'uniform float uDepth;',
			'out vec2 vQuad;',
			'void main() {',
			'	vQuad = aPosition.xy;',
			'	gl_Position = vec4(aPosition.xy, uDepth, 1.0);',
			'}'
		].join('\n');
	},

	/*
	 * The shape of a nebula in a block of 64³, eight by eight slices of 64x64 in one texture: r its glowing gas, g where
	 * between its outer color and its inner one, b its dust. p runs over -1 to 1 in each way, its ball the one of radius 1.
	 */
	NebulaBakeShader: function (head, noise) {
		return head + [
			'in vec2 vQuad;',
			'uniform int uType;',
			'uniform int uSubtype;',
			'uniform float uSeed;',
			'uniform float uDensity;',
			'uniform float uSide;',
			'uniform float uColumns;',
			/* The shape of its graph: how torn, how thick its shell, how wide the hollow in its heart (1 as it is). */
			'uniform vec3 uShape;',
			'out vec4 outColor;',
			noise,
			'void main() {',
			/* Of where the texel is in the block, not of the quad (a band of rows is drawn at a time). */
			'	vec2 texel = floor(gl_FragCoord.xy);',
			'	vec2 tile = floor(texel / uSide);',
			'	vec3 cell = vec3(mod(texel, uSide), tile.y * uColumns + tile.x);',
			'	vec3 p = (cell + 0.5) / uSide * 2.0 - 1.0;',
			'	vec3 s = vec3(uSeed, uSeed * 0.61, uSeed * 1.37);',
			'	float r = length(p);',
			'	float torn = uShape.x;',
			'	float thick = uShape.y;',
			'	float hollow = uShape.z;',
			'	float gas = 0.0;',
			'	float inner = 0.0;',
			'	float dust = 0.0;',
			'	if (uType == 0) {',
			/* A cloud where stars are born: torn edges, a hollow its young stars blew in its middle, dark lanes across. */
			'		vec3 q = p + (vec3(fbm3(p * 1.3 + s, 3), fbm3(p * 1.3 + s + 7.1, 3), fbm3(p * 1.3 + s + 3.3, 3)) - 0.5) * 0.7 * torn;',
			'		float body = fbm3(q * 2.4 + s, 5);',
			'		float fall = smoothstep(1.0, 0.35, length(q));',
			'		gas = max(0.0, body - 0.36) * 2.8 * fall * smoothstep(0.02 * hollow, 0.22 * hollow, r);',
			'		inner = clamp(1.25 - length(q) * 1.7, 0.0, 1.0);',
			'		dust = smoothstep(0.55, 0.72, ridge3(q * 3.2 + s * 1.7, 4)) * fall * 1.2 + gas * 0.25;',
			'	}',
			'	else if (uType == 1) {',
			/* A shell puffed off in two lobes along its axis (y), its rim brightest, a faint glow within, knots in its rim. */
			'		vec3 e = p / vec3(0.62, 0.95, 0.62);',
			'		float knots = fbm3(p * 5.0 + s, 4);',
			'		float shell = length(e) + (knots - 0.5) * 0.18 * torn - 0.68;',
			'		float waist = 1.0 - 0.55 * exp(-p.y * p.y * 30.0);',
			'		gas = exp(-shell * shell * 160.0 / (thick * thick)) * (0.55 + 0.9 * knots) * waist * 1.6 + exp(-r * r * 9.0) * 0.35;',
			'		inner = clamp(1.0 - length(e) * 1.25, 0.0, 1.0);',
			'		dust = exp(-shell * shell * 220.0) * 0.12;',
			'	}',
			'	else if (uType == 2) {',
			/* What a supernova threw: a thin shell of threads; Ia round and even, II torn and lopsided, Ib and Ic in knots. */
			'		float lopsided = (uSubtype == 0 ? 0.08 : 0.32) * torn;',
			'		vec3 q = p + (vec3(fbm3(p * 1.6 + s, 3), fbm3(p * 1.6 + s + 5.0, 3), fbm3(p * 1.6 + s + 9.0, 3)) - 0.5) * lopsided * 2.0;',
			'		float threads = ridge3(q * (uSubtype == 0 ? 7.0 : 5.0) + s, 5);',
			'		float shell = length(q) - (uSubtype == 0 ? 0.82 : 0.72);',
			'		float thin = (uSubtype == 0 ? 90.0 : 45.0) / (thick * thick);',
			'		gas = exp(-shell * shell * thin) * pow(threads, 3.0) * 1.0;',
			'		if (uSubtype >= 2) gas *= smoothstep(0.5, 0.7, fbm3(q * 6.0 + s, 3)) * 4.3;',
			'		inner = clamp(fbm3(q * 3.0 + s + 2.0, 3) * 1.6 - 0.5, 0.0, 1.0);',
			/* A core-collapse leaves a pulsar: the blue glow of its wind in the middle of II, Ib and Ic. */
			'		if (uSubtype >= 1) { gas += exp(-r * r * 60.0) * 0.6 * fbm3(p * 9.0 + s, 3); inner = max(inner, exp(-r * r * 40.0)); }',
			'		dust = gas * 0.1;',
			'	}',
			'	else {',
			/* Dust that hides what is behind: a cloud thick in its heart, wisps at its edge. */
			'		vec3 q = p + (vec3(fbm3(p * 1.4 + s, 3), fbm3(p * 1.4 + s + 6.0, 3), fbm3(p * 1.4 + s + 2.0, 3)) - 0.5) * 0.8 * torn;',
			'		dust = max(0.0, fbm3(q * 2.6 + s, 5) - 0.36) * 3.0 * smoothstep(1.0, 0.25, length(q));',
			'		gas = dust * 0.05;',
			'		inner = 0.0;',
			'	}',
			'	float edge = smoothstep(1.0, 0.92, r);',
			'	outColor = vec4(clamp(gas * edge, 0.0, 1.0), clamp(inner, 0.0, 1.0), clamp(dust * edge * uDensity, 0.0, 1.0), 1.0);',
			'}'
		].join('\n');
	},

	/*
	 * A ray of the eye through the ball of a nebula (uCenter from the eye, uRadius), from where it comes in (or the eye, in
	 * it) to where it goes out, in steps through its block: the light of its gas added as far as the dust before lets it
	 * through, its dust dimming what is behind (alpha). A dark one gives almost no light.
	 */
	NebulaShader: function (head) {
		return head + [
			'in vec2 vQuad;',
			'uniform mat4 uInverse;',
			'uniform vec3 uCenter;',
			'uniform float uRadius;',
			'uniform sampler2D uBlock;',
			'uniform vec3 uColorA;',
			'uniform vec3 uColorB;',
			'uniform float uDust;',
			'uniform float uGlow;',
			'uniform float uDark;',
			'uniform int uSteps;',
			'uniform float uSide;',
			'uniform float uColumns;',
			/* How far it is turned round its axis (y), and how much fine grain it shows (0 far, up to its Detail near). */
			'uniform float uTurn;',
			'uniform float uFine;',
			'out vec4 outColor;',
			/* The block read at a point of -1 to 1: two slices, each smooth, the one between them mixed. */
			'vec4 block(vec3 p) {',
			'	float last = uSide - 1.0;',
			'	vec2 size = vec2(uSide * uColumns, uSide * uSide / uColumns);',
			'	vec3 u = clamp(p * 0.5 + 0.5, 0.0, 1.0) * last;',
			'	float z0 = floor(u.z);',
			'	float z1 = min(last, z0 + 1.0);',
			'	vec2 inTile = clamp(u.xy, 0.5, last - 0.5) + 0.5;',
			'	vec2 a = (vec2(mod(z0, uColumns), floor(z0 / uColumns)) * uSide + inTile) / size;',
			'	vec2 b = (vec2(mod(z1, uColumns), floor(z1 / uColumns)) * uSide + inTile) / size;',
			'	return mix(texture(uBlock, a), texture(uBlock, b), u.z - z0);',
			'}',
			/* A value noise of its own, finer than its block: the grain seen near. */
			'float hash13(vec3 p) {',
			'	p = fract(p * 0.1031);',
			'	p += dot(p, p.zyx + 31.32);',
			'	return fract((p.x + p.y) * p.z);',
			'}',
			'float grain(vec3 p) {',
			'	vec3 i = floor(p);',
			'	vec3 f = fract(p);',
			'	f = f * f * (3.0 - 2.0 * f);',
			'	return mix(mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
			'}',
			'void main() {',
			'	vec4 near = uInverse * vec4(vQuad, -1.0, 1.0);',
			'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
			'	vec3 o = near.xyz / near.w;',
			'	vec3 d = normalize(far.xyz / far.w - o);',
			'	vec3 oc = o - uCenter;',
			'	float b = dot(oc, d);',
			'	float c = dot(oc, oc) - uRadius * uRadius;',
			'	float h = b * b - c;',
			'	if (h <= 0.0) discard;',
			'	h = sqrt(h);',
			'	float t0 = max(-b - h, 0.0);',
			'	float t1 = -b + h;',
			'	if (t1 <= t0) discard;',
			'	float steps = float(uSteps);',
			'	float dt = (t1 - t0) / steps;',
			'	float dn = dt / uRadius;',
			'	vec3 light = vec3(0.0);',
			'	float pass = 1.0;',
			/* Its steps begun a little apart from pixel to pixel: a fine grain, not rings. */
			'	float start = hash13(vec3(gl_FragCoord.xy, 7.0));',
			'	float c0 = cos(uTurn);',
			'	float s0 = sin(uTurn);',
			'	for (int i = 0; i < 96; i++) {',
			'		if (i >= uSteps || pass < 0.01) break;',
			'		vec3 p = (o + d * (t0 + (float(i) + start) * dt) - uCenter) / uRadius;',
			'		p = vec3(c0 * p.x + s0 * p.z, p.y, -s0 * p.x + c0 * p.z);',
			'		vec4 v = block(p);',
			/* Near: its gas and dust broken finer than its block holds. */
			'		if (uFine > 0.001) {',
			'			float g = grain(p * 22.0) * 0.6 + grain(p * 47.0 + 3.1) * 0.4;',
			'			v.r *= mix(1.0, 0.25 + 1.5 * g, min(1.0, uFine));',
			'			v.b *= mix(1.0, 0.3 + 1.4 * grain(p * 31.0 + 9.7), min(1.0, uFine));',
			'		}',
			'		vec3 color = mix(uColorA, uColorB, v.g);',
			'		float absorb = (v.b * uDust * 0.7 + v.r * 0.12) * dn * 1.3;',
			'		light += pass * color * v.r * dn * 2.6 * uGlow * (1.0 - uDark * 0.95);',
			'		pass *= exp(-absorb);',
			'	}',
			'	outColor = vec4(light, 1.0 - pass);',
			'}'
		].join('\n');
	}
});
