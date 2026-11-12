/*
 * Cosmos: what lies far behind a system. Cosmos of a Scene (a Kind, or {Kind, Seed, Colors, and what it is filled with}) makes a
 * backdrop of a seed: clouds of gas torn by their own currents, lanes of dust before them, clusters of stars, the disc and the
 * bulge of a galaxy. It is baked once into a cube, a face a frame so that no frame stops, and read at every frame; the
 * same seed is always the same sky. Colors are up to four, from the deep of the gas to its bright; a seed chooses them when none are told.
 *
 * All of it is one generator. A Kind (nebula, pillars, galaxy, galaxies, cluster, void; CosmosKinds() tells what each holds) is only a
 * set of amounts, and any of them can be told on top of it, so one sky holds what it likes: Gas, Dust, Stars and Pillars (0 to 1), Band
 * (the band of the galaxy we are in), Galaxies (how many far ones, up to 16), Clusters (how many globular ones, up to 12), Beacon (the
 * young stars that light the gas), Bursts (how many places where rays of light go out through the gas, up to 8). Pillars stand in a ring of dark cloud round the whole sky, in one to three groups, each by its own stars;
 * they are clouds of dust with light through them, or with Style 'drawn' shapes with drawn edges, for a sky that is a picture.
 *
 * Before it a few sparks and puffs of dust go round the eye, each in a box that wraps round it, so a view that flies past sees
 * them pass: that is what shows it moves against a sky that stays. What the backdrop is lends its color to the shade of bodies.
 *
 * On a ground the same cube is the band of the galaxy over a night: it turns with the stars, and what hides them hides it.
 */
Elemenx.Trait('SceneCosmos', {
	Cosmos: '',

	/* The kinds of a backdrop, what each is filled with (a Palettes of its own: the pairs a seed chooses from). */
	CosmosTable: function () {
		return {
			nebula: {Gas: 1, Dust: 0.7, Stars: 0.6, Band: 0, Knots: 3, Beacon: 1, Galaxies: 1, Clusters: 0, Pillars: 0, Bursts: 1},
			pillars: {Gas: 0.25, Dust: 0.3, Stars: 0.6, Band: 0, Knots: 2, Beacon: 0, Galaxies: 0, Clusters: 0, Pillars: 1, Bursts: 0, Palettes: [['#0a0705', '#8a4c1c', '#2a8cc0', '#ffe2a0'], ['#07090e', '#8c3016', '#3a5cd0', '#ffcc94'], ['#0c0714', '#6a2a70', '#c0449c', '#ffd8e8'], ['#050b0b', '#70601f', '#1aa090', '#fff0b8']]},
			galaxy: {Gas: 0, Dust: 1, Stars: 1, Band: 1, Knots: 0, Beacon: 0, Galaxies: 1, Clusters: 0, Pillars: 0, Bursts: 0},
			galaxies: {Gas: 0.04, Dust: 0.1, Stars: 0.35, Band: 0, Knots: 0, Beacon: 0, Galaxies: 16, Clusters: 0, Pillars: 0, Bursts: 0},
			cluster: {Gas: 0.08, Dust: 0.1, Stars: 0.8, Band: 0, Knots: 0, Beacon: 0, Galaxies: 0, Clusters: 4, Pillars: 0, Bursts: 0},
			void: {Gas: 0.1, Dust: 0.1, Stars: 0.25, Band: 0, Knots: 1, Beacon: 0, Galaxies: 2, Clusters: 0, Pillars: 0, Bursts: 1}
		};
	},

	/* The kinds and what each is filled with: data, there with no WebGL too. */
	CosmosKinds: function () {
		var kinds = this.CosmosTable();
		var told = {};

		Object.keys(kinds).forEach(function (name) {
			var kind = kinds[name];

			told[name] = {Gas: kind.Gas, Dust: kind.Dust, Stars: kind.Stars, Band: kind.Band, Galaxies: kind.Galaxies, Clusters: kind.Clusters, Pillars: kind.Pillars, Beacon: kind.Beacon, Bursts: kind.Bursts};
		});

		return told;
	},

	CosmosStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var graphics = this.$Service('Renderer');
		var math = this.$Service('Math');
		var shaders = this.CosmosShaders(graphics);
		var space = {Key: '', Cube: null, Next: null, Program: null};
		var night = {Key: '', Cube: null, Next: null};
		var programs = {};
		var motes = null;
		var quad = null;

		/* Pairs of the deep and the bright of a gas, of what a seed may choose. */
		var palettes = [
			['#2a1a08', '#7a5420', '#d8a048', '#fff2c8'],
			['#14202c', '#46627c', '#a8bccc', '#f4f8ff'],
			['#10203a', '#3a5a4a', '#c8a050', '#fff0cc'],
			['#2a0e08', '#8a3418', '#e08a30', '#ffe6b0'],
			['#1c0b33', '#5a2a8c', '#c8589c', '#ffe0e8'],
			['#0a1830', '#1e5a8c', '#30b0b8', '#e8fff8']
		];
		var kinds = this.CosmosTable();

		function given (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function color (value) {
			var text = String(value).replace('#', '');

			return [parseInt(text.slice(0, 2), 16) / 255, parseInt(text.slice(2, 4), 16) / 255, parseInt(text.slice(4, 6), 16) / 255];
		}

		function hash (text) {
			var made = 7;
			var i;

			for (i = 0; i < text.length; i++)
				made = (made * 31 + text.charCodeAt(i)) % 2147483647;

			return made;
		}

		/* What is asked for, in full: everything of it comes of the seed, but what is told. */
		function settings (asked) {
			var told = typeof asked === 'string' ? {Kind: asked} : asked || {};
			var kind = kinds[told.Kind] ? told.Kind : 'nebula';
			var plain = kinds[kind];
			var seed = String(told.Seed === undefined ? self.Seed || 'cosmos' : told.Seed);
			var number = hash(seed + kind);
			var random = number;
			var knots = [];
			var galaxies = [];
			var planes = [];
			var shaped = [];
			var shapes = [];
			var clusters = Math.min(12, Math.max(0, Math.round(given(told.Clusters, plain.Clusters))));
			var far2 = Math.min(16, Math.max(0, Math.round(given(told.Galaxies, plain.Galaxies))));
			var rays = Math.min(8, Math.max(0, Math.round(given(told.Bursts, plain.Bursts))));
			var bursts = [];
			var i;

			function next () {
				random = (random * 16807) % 2147483647;

				return random / 2147483647;
			}

			next();

			var choice = plain.Palettes || palettes;
			var colors = (told.Colors || choice[number % choice.length]).slice(0, 4).map(color);
			var pole = told.Pole ? math.Vectors.Normalize(told.Pole) : math.Vectors.Normalize([next() - 0.5, (next() - 0.5) * 0.3 + 0.75, next() - 0.5]);
			var shine = math.Vectors.Normalize([next() - 0.5, (next() - 0.5) * 0.5, next() - 0.5]);

			while (colors.length < 4)
				colors.push(colors[colors.length - 1]);

			for (i = 0; i < 12; i++) {
				var way = math.Vectors.Normalize([next() - 0.5, next() - 0.5, next() - 0.5]);
				var knot = 0.08 + next() * 0.22;
				var swarm = i - plain.Knots;
				var great = swarm === 0 && clusters < 6 ? 0.55 + next() * 0.3 : 0.1 + next() * 0.14;

				/* The first are knots of the gas; below 0 are the clusters that come after them. */
				knots.push(way[0], way[1], way[2], i < plain.Knots ? knot : swarm < clusters ? -great : 0);
			}

			/* Galaxies far off: where each is seen, how large, and the way its disc looks. */
			/* One large at most: the rest lie farther off, as the sky has them. */
			for (i = 0; i < 16; i++) {
				var place = math.Vectors.Normalize([Math.cos(i * 2.4 + 0.4), (next() - 0.5) * 0.9 - 0.2, Math.sin(i * 2.4 + 0.4)]);
				var turned = math.Vectors.Normalize([next() - 0.5, next() - 0.5, next() - 0.5]);
				var far = far2 < 6 ? 0.05 + next() * 0.07 : i === 0 ? 0.3 + next() * 0.14 : i < 4 ? 0.08 + next() * 0.07 : 0.015 + next() * 0.04;

				galaxies.push(place[0], place[1], place[2], i < far2 ? far : 0);
				planes.push(turned[0], turned[1], turned[2], next() * 3);
			}

			/*
			 * Pillars: how many, how thick, how high and how bent is all of the seed, and fingers and globules by them. They stand in up to
			 * three groups round the ring of the sky, each with the stars that light it.
			 */
			var stood = [];
			var tilt = (next() - 0.5) * 1.2;
			var main = 1 + Math.floor(next() * 5);
			var groups = 1 + Math.floor(next() * 3);
			var middles = [0, 2.1 + next() * 0.7, -2.1 - next() * 0.7];
			var highest = [{X: 0, Top: -2}, {X: middles[1], Top: -2}, {X: middles[2], Top: -2}];
			var lamps = [];

			for (i = 0; i < main; i++) {
				var group = i % groups;
				var column = {X: middles[group] + (main > 1 ? (next() - 0.5) * 1.5 : (next() - 0.5) * 0.7), Top: -0.5 + next() * 1.45, Wide: 0.045 + next() * next() * 0.24};

				stood.push(column);
				shaped.push(column.X, column.Top, column.Wide, (next() - 0.5) * 0.9);
				shapes.push((next() - 0.5) * 0.55, 0.6 + next() * 2.4, -1.75, 0.35 + next());

				if (column.Top > highest[group].Top)
					highest[group] = column;
			}

			for (i = main; i < 12; i++) {
				var near = stood[Math.floor(next() * stood.length)];
				var finger = i % 3 !== 0;
				var top = finger ? near.Top + (next() - 0.65) * 0.3 : near.Top - 0.15 - next() * 0.5;
				var thin = finger ? near.Wide * (0.16 + next() * 0.34) : 0.012 + next() * 0.035;

				var aside = finger ? near.X + (next() - 0.5) * near.Wide * 2.6 : near.X + (next() < 0.5 ? -1 : 1) * (near.Wide * 1.6 + 0.04 + next() * 0.24);

				shaped.push(aside, top, thin, (next() - 0.5) * 0.3);
				shapes.push((next() - 0.5) * 0.1, 0.5 + next(), top - (finger ? 0.2 + next() * 0.45 : 0.05 + next() * 0.16), 0.5 + next() * 0.8);
			}

			highest.forEach(function (column) {
				lamps.push(column.X + (next() - 0.5) * 1.5, Math.max(column.Top, -0.4) + 0.45 + next() * 0.6, 0.45 + next() * 0.45);
			});

			/* Where rays go out, and how far: of a seed of their own, so that more of them leaves those that were. */
			var sown = hash(seed + 'rays');

			function sow () {
				sown = (sown * 16807) % 2147483647;

				return sown / 2147483647;
			}

			for (i = 0; i < 8; i++) {
				var out = math.Vectors.Normalize([sow() - 0.5, (sow() - 0.5) * 0.7, sow() - 0.5]);
				var wide2 = 0.3 + sow() * 0.45;

				bursts.push(out[0], out[1], out[2], i < rays ? wide2 : 0);
			}

			return {Kind: kind, Key: JSON.stringify([kind, seed, colors, told.Gas, told.Dust, told.Stars, told.Pillars, told.Band, far2, clusters, told.Beacon, told.Style, rays]), Uniforms: {uBursts: bursts, uDrawn: told.Style === 'drawn' ? 1 : 0, uSeed: number % 977 / 9.7, uColors: [].concat(colors[0], colors[1], colors[2], colors[3]), uGas: given(told.Gas, plain.Gas), uDust: given(told.Dust, plain.Dust), uStars: given(told.Stars, plain.Stars), uDisc: given(told.Band, plain.Band), uPole: pole, uKnots: knots, uShine: shine, uBeacon: given(told.Beacon, plain.Beacon), uPillars: given(told.Pillars, plain.Pillars), uGlobular: clusters ? 1 : 0, uColumns: shaped, uShapes: shapes, uLamps: lamps, uTilt: tilt, uLampReach: 1.5 + next() * 0.9, uWall: 0.25 + next() * 0.75, uGalaxies: galaxies, uPlanes: planes}};
		}

		/* Pillars are most of what the card has to compile: a sky without them does not wait for them. */
		function program (pillars) {
			var name = pillars ? 'Program' : 'Plain';

			space[name] = space[name] || renderer.Program(graphics.Shaders.Quad, pillars ? shaders.Bake : shaders.Bake.replace('vec4 standing(vec3 d, vec3 s) {', 'vec4 standing(vec3 d, vec3 s) {\n\treturn vec4(0.0);'), true);

			return space[name];
		}

		/*
		 * A part more of what is being made: a face a frame, a strip of one if it is very large. The sky made before stays until
		 * the new one is whole.
		 */
		function bake (holder, made, size) {
			var key = made.Key + size;
			var rows = made.Uniforms.uPillars > 0 ? size / 16 : size > 1024 ? 8 : 1;
			var next = holder.Next;

			if (holder.Key === key) return;

			/* This shader is the slowest of all: the card makes it behind the scene, and the sky comes when it is done. */
			if (scene.Looping && !renderer.Ready(program(made.Uniforms.uPillars > 0))) return;

			if (!next || next.Key !== key) {
				if (next)
					next.Cube.Destroy();

				next = holder.Next = {Key: key, Cube: renderer.Cube(size), Face: 0, Row: 0};
			}

			renderer.Bake(next.Cube, program(made.Uniforms.uPillars > 0), Object.assign({uTexel: 2 / size}, made.Uniforms), next.Face, [next.Row, rows]);

			next.Row++;

			if (next.Row === rows) {
				next.Row = 0;
				next.Face++;
			}

			if (next.Face < 6) return;

			if (holder.Cube)
				holder.Cube.Destroy();

			holder.Key = key;
			holder.Cube = next.Cube;
			holder.Next = null;
		}

		function size () {
			var level = self.Graphics().Level;

			return level === 'low' ? 256 : level === 'medium' ? 512 : level === 'high' ? 1024 : 2048;
		}

		function backdrop (holder, matrix, turn, strength) {
			quad = quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			programs.Far = programs.Far || renderer.Program(graphics.Shaders.Quad, shaders.Far);

			engine.DrawReady(quad, programs.Far, {uInverse: math.Invert(matrix), uCube: holder.Cube, uTurn: turn, uStrength: strength}, {Depth: false, DepthWrite: false, Cull: 'none'});
		}

		/* The sparks and the puffs round the eye. */
		function moteMesh () {
			var positions = [];
			var colors = [];
			var random = 5;
			var i;

			function next () {
				random = (random * 16807) % 2147483647;

				return random / 2147483647;
			}

			for (i = 0; i < 1500; i++) {
				var big = i % 12 === 0;

				positions.push(next(), next(), next());
				colors.push(next(), next(), next(), big ? 0.6 + next() * 0.4 : next() * 0.3);
			}

			return renderer.Points(positions, {aColor: {Size: 4, Data: colors}});
		}

		/* The backdrop of a system, baked as far as it is, and what the shade of bodies takes of it. */
		engine.CosmosDraw = function (matrix, view) {
			var eye = scene.Eye || [0, 0, 0];

			if (!self.Cosmos) {
				scene.CosmosShade = null;

				return;
			}

			var made = settings(self.Cosmos);

			if (!space.Cube) return;

			backdrop(space, matrix, [1, 0, 0, 0, 1, 0, 0, 0, 1], 1);

			var colors = made.Uniforms.uColors;

			scene.CosmosShade = [colors[3] * 0.03, colors[4] * 0.03, colors[5] * 0.03];

			programs.Motes = programs.Motes || renderer.Program(shaders.MoteVertex, shaders.Mote);
			motes = motes || moteMesh();

			var box = Math.max(1e-6, scene.Distance * 5);

			engine.DrawReady(motes, programs.Motes, {uViewProjection: view, uPlace: [eye[0] / box % 1, eye[1] / box % 1, eye[2] / box % 1], uBox: box, uRatio: renderer.Ratio, uTint: [colors[6], colors[7], colors[8]], uHigh: [colors[9], colors[10], colors[11]]}, {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});
		};

		/* Before the frame is drawn into its picture: a face a frame of what is being made. */
		engine.CosmosBake = function () {
			var ground = scene.Ground;

			if (self.Cosmos)
				bake(space, settings(self.Cosmos), size());

			if (ground && ground.StarLimit < 0.45 && ground.GalaxyLight > 0)
				bake(night, settings({Kind: 'galaxy', Seed: 'night', Stars: 0.7, Pole: [0.72, 0.62, 0.3]}), 1024);

			/* The other skies asked for of late, smaller: they are seen through a mouth. */
			Object.keys(others).forEach(function (key) {
				var holder = others[key];

				var made = settings(holder.Wanted);

				if (scene.Seconds - holder.Asked > 5 && holder.Asked !== undefined) return;

				/* Never waited for: its program is made behind the scene, the mouth shows its plain stars till then. */
				if (!renderer.Ready(program(made.Uniforms.uPillars > 0))) return;

				bake(holder, made, Math.min(512, size()));
			});
		};

		/* The band of the galaxy over a night: Galaxy of a sun, 0 for none. */
		engine.CosmosNight = function (matrix, ground, turn, strength) {
			var seen = strength * Math.max(0, 1 - ground.StarLimit * 2.2);
			if (seen < 0.01 || !night.Cube) return;

			backdrop(night, matrix, turn, seen);
		};

		/*
		 * A way far at once, over the far sky (Travel of a ship): the stars drawn out round the point it goes to, a tunnel of
		 * light round it, a flash, behind what is nearer than Depth (of the screen; the far end by default): the ship stays before it.
		 * warp {Axis (where it goes), Flow (how far the stars went), Stretch, Tunnel, Flash (0 to 1), Tint, Depth}.
		 */
		engine.CosmosWarp = function (matrix, warp) {
			var uniforms;

			if (!warp || warp.Stretch < 0.002 && warp.Tunnel < 0.002 && warp.Flash < 0.002) return;

			quad = quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			programs.Warp = programs.Warp || renderer.Program(shaders.WarpVertex, shaders.Warp);

			uniforms = {uInverse: math.Invert(matrix), uAxis: math.Vectors.Normalize(warp.Axis), uFlow: warp.Flow, uStretch: warp.Stretch, uTunnel: warp.Tunnel, uFlash: warp.Flash, uTint: warp.Tint || [0.35, 0.6, 1], uDepth: warp.Depth === undefined ? 0.99999 : warp.Depth, uPart: 0};

			/* The tunnel hides what is behind it; the stars and the flash are light added over it. Neither touches how glossy the picture is. */
			engine.DrawReady(quad, programs.Warp, uniforms, {DepthWrite: false, Blend: 'over', Cull: 'none'});

			uniforms.uPart = 1;

			engine.DrawReady(quad, programs.Warp, uniforms, {DepthWrite: false, Blend: 'add', Cull: 'none'});
		};

		/* The cube of the sky of the system, once baked (what bent light reads, SceneDeepSpace); null before it is. */
		engine.CosmosCube = function () {
			return self.Cosmos && space.Cube ? space.Cube : null;
		};

		/*
		 * The cube of another sky (the far side of a wormhole: a Kind or {Kind, Seed}), baked a face a frame while it is asked
		 * for, under a key of its own; null till it is whole.
		 */
		var others = {};

		engine.CosmosCubeOf = function (given, key) {
			var holder = others[key] = others[key] || {Key: '', Cube: null, Next: null};

			holder.Wanted = typeof given === 'string' ? {Kind: given, Seed: key} : given;
			holder.Asked = scene.Seconds;

			return holder.Cube;
		};

		engine.CosmosReady = function () {
			return !!self.Cosmos && space.Key === settings(self.Cosmos).Key + size();
		};
	},

	CosmosShaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\nprecision highp int;\n';

		return {
			Bake: head + [
				'in vec2 vQuad;',
				'uniform float uSeed;',
				'uniform vec3 uColors[4];',
				'uniform float uGas;',
				'uniform float uDust;',
				'uniform float uStars;',
				'uniform float uDisc;',
				'uniform vec3 uPole;',
				'uniform vec4 uKnots[12];',
				'uniform vec3 uShine;',
				'uniform float uBeacon;',
				'uniform float uTexel;',
				'uniform float uGlobular;',
				'uniform float uPillars;',
				'uniform vec4 uColumns[12];',
				'uniform vec4 uShapes[12];',
				'uniform vec3 uLamps[3];',
				'uniform float uTilt;',
				'uniform float uDrawn;',
				'uniform float uLampReach;',
				'uniform float uWall;',
				'uniform vec4 uGalaxies[16];',
				'uniform vec4 uPlanes[16];',
				'uniform vec4 uBursts[8];',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Cube,
				'float hash(vec3 p) {',
				'	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);',
				'}',
				/*
				 * Stars as points, of a size in texels of the cube, so many thousand a steradian. They are sown over the flat face: cells
				 * in space would cut the sphere in rings. A cell holds one at most, anywhere in it, and nothing of a star leaves it. Most are
				 * faint, a few bright, the bright ones oftener warm.
				 */
				'vec3 starTint(float warm) {',
				'	return mix(vec3(1.0, 0.76, 0.52), vec3(0.74, 0.85, 1.0), smoothstep(0.15, 0.75, warm));',
				'}',
				'vec3 stars(float size, float many, float layer) {',
				'	float scale = 0.25 / (uTexel * size);',
				'	vec2 p = vQuad * scale + layer * 0.37;',
				'	vec3 cell = vec3(floor(p), float(uFace) * 3.1 + layer * 5.3);',
				'	if (hash(cell + uSeed) > min(0.75, many * 1000.0 / (scale * scale * 1.9))) return vec3(0.0);',
				'	vec2 at = cell.xy + 0.25 + vec2(hash(cell + 1.0), hash(cell + 2.0)) * 0.5;',
				'	float off = length(p - at) / 0.25;',
				'	float power = hash(cell + 5.0);',
				'	return starTint(hash(cell + 4.0) + power * 0.2) * exp(-off * off * 4.0) * (0.16 + 1.5 * power * power * power);',
				'}',
				/* The few great ones, near: a point, a halo, and the four rays a mirror on its arms gives them. */
				'vec3 flares(vec3 d, float many) {',
				'	vec3 p = d * 34.0;',
				'	vec3 cell = floor(p);',
				'	if (hash(cell + uSeed + 11.0) > many) return vec3(0.0);',
				'	vec3 at = cell + 0.5 + (vec3(hash(cell + 12.0), hash(cell + 13.0), hash(cell + 14.0)) - 0.5) * 0.2;',
				'	vec3 way = normalize(at);',
				'	vec3 across = normalize(cross(way, vec3(0.2, 1.0, 0.1)));',
				'	vec2 q = vec2(dot(d - way, across), dot(d - way, cross(way, across)));',
				'	float size = min(uTexel, 0.0016) * (0.8 + hash(cell + 15.0) * 1.2);',
				'	float r = length(q) / size;',
				'	float rays = exp(-abs(q.x) / (size * 0.6)) * exp(-abs(q.y) / (size * 15.0)) + exp(-abs(q.y) / (size * 0.6)) * exp(-abs(q.x) / (size * 15.0));',
				'	return starTint(hash(cell + 16.0)) * (exp(-r * r * 0.5) * 2.2 + exp(-r * 0.4) * 0.22 + rays * 0.75) * smoothstep(0.5, 0.25, length(p - at));',
				'}',
				/*
				 * A galaxy far off, of its seed: elliptical, lenticular, irregular, or a disc of two to six arms, wound tight or wide, whole or
				 * in shreds, a bar in some. The arms follow a logarithmic spiral; dust runs along their inner edges, young stars and pink
				 * knots burn on them, and all of it stands in the soft light of what the eye cannot part.
				 */
				'vec3 galaxy(vec3 d, vec4 place, vec4 plane) {',
				'	vec3 at = place.xyz;',
				'	float off = dot(d, at);',
				'	if (off < 0.5) return vec3(0.0);',
				'	vec3 sky = d / off - at;',
				'	vec3 n = normalize(plane.xyz);',
				'	vec3 lengthway = normalize(cross(n, at));',
				'	vec3 breadth = cross(at, lengthway);',
				'	float open = max(abs(dot(n, at)), 0.1);',
				'	vec2 p = vec2(dot(sky, lengthway), dot(sky, breadth) / open) / place.w;',
				'	float r = length(p);',
				'	if (r > 1.9) return vec3(0.0);',
				'	float kind = fract(plane.w * 7.3);',
				'	float fall = smoothstep(1.9, 1.1, r);',
				'	vec3 old = vec3(1.0, 0.85, 0.64);',
				'	float halo = exp(-r * 2.1) * 0.2 * fall;',
				'	float sersic = min(exp(-7.67 * (pow(max(r, 0.003) / 0.12, 0.25) - 1.0)) * 0.42, 1.3);',
				'	if (kind < 0.16) {',
				'		vec2 long2 = p * vec2(1.0, 1.0 + fract(plane.w * 5.1) * 1.6);',
				'		float rr = length(long2);',
				'		return old * (min(exp(-7.67 * (pow(max(rr, 0.003) / 0.34, 0.25) - 1.0)) * 0.4, 1.3) + exp(-rr * 2.0) * 0.14) * smoothstep(1.9, 0.9, rr);',
				'	}',
				'	if (kind < 0.27) return old * (sersic + exp(-r * 3.4) * 0.36 * smoothstep(1.2, 0.5, r) + halo);',
				'	if (kind < 0.38) {',
				'		float bits = smoothstep(0.42, 0.72, fbm3(vec3(p * 3.4, plane.w * 4.0), 5));',
				'		float bright = smoothstep(0.58, 0.72, fbm3(vec3(p * 13.0, plane.w * 2.0), 4));',
				'		float round2 = exp(-r * r * 2.6) * fall;',
				'		return (vec3(0.6, 0.72, 1.0) * bits * 0.55 + vec3(1.0, 0.36, 0.5) * bits * bright * 0.8 + old * 0.1) * round2 + vec3(0.6, 0.66, 0.8) * round2 * 0.1;',
				'	}',
				'	float arms = floor(2.0 + pow(fract(plane.w * 11.7), 2.0) * 4.99);',
				'	float bent = (fbm3(vec3(p * 2.6, plane.w * 3.0), 3) - 0.5) * 2.1;',
				'	float phase = arms * atan(p.y, p.x) - 2.0 * (1.6 + fract(plane.w * 3.1) * 3.4) * log(r + 0.05) * max(arms * 0.5, 1.0) + bent + plane.w * 9.0;',
				'	float ridge = pow(0.5 + 0.5 * cos(phase), 5.0);',
				'	float wide = pow(0.5 + 0.5 * cos(phase), 1.5);',
				'	float lane = pow(0.5 + 0.5 * cos(phase + 0.85), 10.0);',
				'	float reach = smoothstep(0.05, 0.22, r) * exp(-r * 2.1) * smoothstep(1.4, 0.8, r);',
				'	float clumps = fbm3(vec3(p * 16.0, plane.w * 3.0), 4);',
				'	if (fract(plane.w * 5.3) < 0.25) ridge *= smoothstep(0.38, 0.62, fbm3(vec3(p * 7.0, plane.w * 6.0), 4)) * 1.6;',
				'	float knot = smoothstep(0.56, 0.7, fbm3(vec3(p * 30.0, plane.w * 5.0), 3));',
				'	vec3 cell = floor(vec3(p * 260.0, plane.w));',
				'	float sown = step(hash(cell), ridge * reach * 1.8) * hash(cell + 2.0) * smoothstep(0.5, 0.1, length(fract(p * 260.0) - 0.5));',
				'	vec2 axial = vec2(p.x * cos(plane.w) + p.y * sin(plane.w), p.y * cos(plane.w) - p.x * sin(plane.w));',
				'	float bar = step(fract(plane.w * 2.3), 0.4) * exp(-axial.x * axial.x * 12.0 - axial.y * axial.y * 340.0);',
				'	vec3 color = vec3(0.56, 0.68, 1.0) * (ridge * reach * (0.8 + clumps * 2.0) + wide * reach * 0.5 + sown * 0.8) + vec3(0.66, 0.68, 0.76) * exp(-r * 2.8) * smoothstep(1.4, 0.7, r) * 0.26;',
				'	color += vec3(1.0, 0.3, 0.46) * knot * ridge * reach * 1.1;',
				'	color *= 1.0 - lane * smoothstep(0.1, 0.3, r) * smoothstep(1.1, 0.4, r) * 0.8;',
				'	color += old * (sersic + bar * 0.5 + exp(-r * r * 16.0) * 0.45) + vec3(0.7, 0.72, 0.85) * halo;',
				'	float across = dot(sky, breadth) / place.w;',
				'	color *= 1.0 - (1.0 - open) * 0.9 * exp(-across * across * 900.0) * smoothstep(1.3, 0.2, r);',
				'	return color * fall;',
				'}',
				/* The band of a galaxy from within: faint old stars by the million, a warm bulge, red clouds, and dark rifts over all. */
				'vec3 band(vec3 d, vec3 s) {',
				'	float high = dot(d, uPole);',
				'	vec3 middle = normalize(cross(uPole, vec3(0.3, 1.0, 0.2)));',
				'	vec3 aside = cross(uPole, middle);',
				'	float along = atan(dot(d, aside), dot(d, middle));',
				'	float wide = 0.17 + 0.11 * exp(-along * along * 2.0);',
				'	float wave = (fbm3(d * 2.2 + s, 4) - 0.5) * 0.24;',
				'	float y = (high + wave) / wide;',
				'	float body = exp(-y * y) * (0.32 + 0.68 * exp(-along * along * 0.7));',
				'	float bulge = exp(-(along * along / 0.28 + y * y * 0.45));',
				'	float grain = 0.55 + 0.9 * fbm3(d * 26.0 + s, 3);',
				'	float clouds = smoothstep(0.42, 0.72, fbm3(d * 5.0 + s + 3.0, 5));',
				'	vec3 color = vec3(0.42, 0.4, 0.5) * body * grain * 0.55;',
				'	color += vec3(1.0, 0.76, 0.55) * bulge * grain * 0.6;',
				'	color += vec3(0.62, 0.3, 0.32) * clouds * body * 0.32;',
				'	color += vec3(0.8, 0.28, 0.46) * smoothstep(0.66, 0.8, fbm3(d * 13.0 + s + 8.0, 4)) * body * 0.2;',
				/* Rifts of dust run along its middle, and branch. */
				'	vec3 bent = d + (vec3(fbm3(d * 3.0 + s + 1.0, 4), fbm3(d * 3.0 + s + 2.0, 4), fbm3(d * 3.0 + s + 4.0, 4)) - 0.5) * 0.5;',
				'	float rift = smoothstep(0.38, 0.62, ridge3(bent * 3.6 + s + 17.0, 5)) * exp(-y * y * 3.2) * (0.5 + 0.5 * exp(-y * y * 14.0));',
				'	color *= 1.0 - clamp(rift, 0.0, 1.0) * 0.92 * uDust;',
				'	return color + vec3(0.06, 0.065, 0.085) * (1.0 - abs(high)) * 0.35;',
				'}',
				/*
				 * Pillars of dust in lit gas. Each has a place, a size, a lean, a bend and a foot of its own; fingers and small globules
				 * stand by them. columns says how deep in them a place lies, 0 outside, and which of them it is by how it glows.
				 */
				'float columnGlow = 1.0;',
				/* A place on the ring as it lies in space: what is sown there meets itself all the way round. */
				'vec3 ringAt(vec3 p) {',
				'	float a = p.x * 0.75;',
				'	float r = 1.333 + p.z;',
				'	return vec3(sin(a) * r, p.y, cos(a) * r);',
				'}',
				'float beltOf(float x, float y) {',
				'	return clamp((-0.92 + 0.13 * sin(x * 3.0 + uSeed) + 0.08 * sin(x * 6.0 + uSeed * 2.0) + 0.05 * sin(x * 15.0 + uSeed * 3.0) - y) * 2.2, 0.0, 1.0) * uWall * smoothstep(-3.0, -2.0, y);',
				'}',
				'float columns(vec2 q) {',
				'	float most = 0.0;',
				'	columnGlow = 1.0;',
				'	for (int i = 0; i < 12; i++) {',
				'		vec4 c = uColumns[i];',
				'		vec4 k = uShapes[i];',
				'		if (c.z <= 0.0 || q.y > c.y || q.y < k.z) continue;',
				'		float down = (c.y - q.y) / (c.y - k.z);',
				'		float wide = c.z * (0.72 + k.y * down * down + 0.22 * sin(down * 7.0 + float(i) * 2.1));',
				'		wide *= sqrt(clamp((c.y - q.y) / (c.z * 1.3), 0.0, 1.0));',
				'		float x = c.x + c.w * down + k.x * sin(down * 3.1416);',
				'		float deep = clamp(1.0 - abs(q.x - x) / max(wide, 0.001), 0.0, 1.0);',
				'		if (k.z > -1.4) deep *= smoothstep(0.0, 0.2, 1.0 - down);',
				'		if (deep > most) columnGlow = k.w;',
				'		most = 1.0 - (1.0 - most) * (1.0 - deep);',
				'	}',
				'	return 1.0 - (1.0 - most) * (1.0 - beltOf(q.x, q.y));',
				'}',
				/* The same in three dimensions: each is round, and dust eats at all of it, so it has no edge but a thinning. */
				'float body3(vec3 p) {',
				'	float most = 0.0;',
				'	for (int i = 0; i < 12; i++) {',
				'		vec4 c = uColumns[i];',
				'		vec4 k = uShapes[i];',
				'		if (c.z <= 0.0 || p.y > c.y || p.y < k.z) continue;',
				'		float down = (c.y - p.y) / (c.y - k.z);',
				'		float wide = c.z * (0.72 + k.y * down * down + 0.22 * sin(down * 7.0 + float(i) * 2.1));',
				'		wide *= sqrt(clamp((c.y - p.y) / (c.z * 1.3), 0.0, 1.0));',
				'		float x = c.x + c.w * down + k.x * sin(down * 3.1416);',
				/* It reaches a little past its shape: only noise says where it ends there. */
				'		float deep = clamp((wide + 0.08 - length(vec2(p.x - x, p.z))) / (0.09 + wide * 0.9), 0.0, 1.0);',
				'		if (k.z > -1.4) deep *= smoothstep(0.0, 0.2, 1.0 - down);',
				'		most = 1.0 - (1.0 - most) * (1.0 - deep);',
				'	}',
				'	return 1.0 - (1.0 - most) * (1.0 - beltOf(p.x, p.y) * smoothstep(0.75, 0.3, abs(p.z)));',
				'}',
				'float puff(vec3 p, vec3 s) {',
				'	float near3 = body3(p);',
				'	if (near3 <= 0.0) return 0.0;',
				'	vec3 r = ringAt(p);',
				'	float big = fbm3(r * 3.4 + s, 5) - 0.5;',
				'	float small = fbm3(r * 11.0 + s + 4.0, 4) - 0.5;',
				/* No drawn edge: where the noise goes under the shape, the shape ends, in billows and shreds of its own. */
				'	return clamp((near3 * 1.4 - 0.1 + big * 1.15 + small * 0.6) * 0.8, 0.0, 1.0);',
				'}',
				'float puffLight(vec3 p, vec3 s) {',
				'	float near3 = body3(p);',
				'	return clamp((near3 * 1.4 - 0.1 + (fbm3(ringAt(p) * 3.4 + s, 3) - 0.5) * 1.15) * 0.8, 0.0, 1.0);',
				'}',
				/*
				 * The same as a cloud of dust. How much of each stands at a place falls off smoothly all the way, with no fold and no end to it;
				 * where the dust stops only the noise says: large billows, the cauliflower of their tops, and fine shreds on them.
				 */
				'float cloud3(vec3 p) {',
				'	float most = 0.0;',
				'	for (int i = 0; i < 12; i++) {',
				'		vec4 c = uColumns[i];',
				'		vec4 k = uShapes[i];',
				'		if (c.z <= 0.0) continue;',
				'		float span = max(c.y - k.z, 0.01);',
				'		float down = (c.y - p.y) / span;',
				'		float inside = clamp(down, 0.0, 1.0);',
				'		float wide = c.z * (0.72 + k.y * inside * inside + 0.22 * sin(inside * 7.0 + float(i) * 2.1));',
				'		wide *= sqrt(clamp(inside * span / (c.z * 1.3) + 0.12, 0.0, 1.0));',
				'		float x = c.x + c.w * inside + k.x * sin(inside * 3.1416);',
				'		float off = length(vec2(p.x - x, p.z)) / max(wide * 1.55, 0.04);',
				'		float deep = exp(-off * off) * smoothstep(-0.16, 0.1, c.y - p.y);',
				'		if (k.z > -1.4) deep *= smoothstep(0.0, 0.25, 1.0 - down);',
				'		most = 1.0 - (1.0 - most) * (1.0 - deep);',
				'	}',
				'	return 1.0 - (1.0 - most) * (1.0 - beltOf(p.x, p.y) * smoothstep(0.75, 0.3, abs(p.z)));',
				'}',
				/* Where a place stands in the shape: the shape itself is pushed about by large slow currents and by lumps on them. */
				'vec3 stirred(vec3 p, vec3 r, vec3 s, float lumps) {',
				'	vec3 slow = vec3(fbm3(r * 1.5 + s, 3), fbm3(r * 1.5 + s + 3.1, 3), fbm3(r * 1.5 + s + 7.7, 3)) - 0.5;',
				'	vec3 small = lumps > 0.5 ? vec3(fbm3(r * 5.0 + s + 2.0, 3), fbm3(r * 5.0 + s + 5.3, 3), fbm3(r * 5.0 + s + 8.9, 3)) - 0.5 : vec3(0.0);',
				'	return p + slow * 0.55 + small * 0.2;',
				'}',
				'float billow(vec3 p, vec3 s) {',
				'	vec3 r = ringAt(p);',
				'	float near3 = cloud3(stirred(p, r, s, 1.0));',
				'	if (near3 < 0.004) return 0.0;',
				'	float reach = smoothstep(0.0, 0.3, near3);',
				'	float noise = (fbm3(r * 3.0 + s, 6) - 0.5) * 1.5 + (ridge3(r * 7.0 + s + 4.0, 5) - 0.5) * 0.7 + (fbm3(r * 24.0 + s + 9.0, 4) - 0.5) * 0.45;',
				'	return clamp((near3 - 0.34 + noise * reach) * 1.9, 0.0, 1.0);',
				'}',
				'float billowLight(vec3 p, vec3 s) {',
				'	vec3 r = ringAt(p);',
				'	float near3 = cloud3(stirred(p, r, s, 0.0));',
				'	if (near3 < 0.004) return 0.0;',
				'	return clamp((near3 - 0.34 + (fbm3(r * 3.0 + s, 4) - 0.5) * 1.5 * smoothstep(0.0, 0.3, near3)) * 1.9, 0.0, 1.0);',
				'}',
				/* What stands round a place on the flat, for the haze round it. */
				'float shapeAt(vec2 q) {',
				'	return uDrawn > 0.5 ? columns(q) : cloud3(vec3(q, 0.0));',
				'}',
				/*
				 * It stands in the light of young stars, and it is a cloud: the eye goes through it step by step, and from each step a short
				 * ray goes to the stars through what stands between. So a head burns on its side of the light, thin dust glows through, the
				 * body goes down into brown and the dark, and no line runs round it. The gas between shines blue by the stars and goes through green to gold away from them.
				 */
				'vec3 standingGlow = vec3(0.0);',
				'vec4 standing(vec3 d, vec3 s) {',
				'	vec3 at = normalize(uKnots[0].xyz);',
				'	vec3 aside = normalize(cross(at, vec3(0.0, 1.0, 0.0)));',
				'	vec3 tall = cross(aside, at) * cos(uTilt) + aside * sin(uTilt);',
				'	float up = dot(d, tall);',
				/* A ring round the whole sky: there is no side of it that ends. */
				'	vec2 p = vec2(atan(dot(d, cross(at, tall)), dot(d, at)), up / sqrt(max(1.0 - up * up, 0.00001))) / 0.75;',
				'	vec3 r2 = ringAt(vec3(p, 0.0));',
				'	vec2 q = p + (vec2(fbm3(r2 * 2.2 + vec3(0.0, 0.0, 1.0) + s, 5), fbm3(r2 * 2.2 + vec3(0.0, 0.0, 5.0) + s, 5)) - 0.5) * mix(0.12, 0.24, uDrawn);',
				'	float fine = fbm3(r2 * 9.0 + vec3(0.0, 0.0, 2.0) + s, 4);',
				'	q += (vec2(fine, fbm3(r2 * 9.0 + vec3(0.0, 0.0, 7.0) + s, 4)) - 0.5) * 0.09 * uDrawn;',
				'	q += (vec2(fbm3(r2 * 30.0 + vec3(0.0, 0.0, 4.0) + s, 3), fbm3(r2 * 30.0 + vec3(0.0, 0.0, 8.0) + s, 3)) - 0.5) * 0.028 * uDrawn;',
				'	columns(q);',
				'	float glowOf = max(columnGlow, 0.7);',
				'	float fade = smoothstep(3.2, 2.3, abs(p.y));',
				/* Of the groups, the stars this place stands by: going round the ring, from one to the next with no line between. */
				'	vec3 lamp = vec3(0.0);',
				'	float lampWeight = 0.0;',
				'	for (int i = 0; i < 3; i++) {',
				'		float apart = mod(uLamps[i].x - q.x + 4.18879, 8.37758) - 4.18879;',
				'		float weight = exp(-apart * apart * 1.1) + 0.0001;',
				'		lamp += vec3(q.x + apart, uLamps[i].yz) * weight;',
				'		lampWeight += weight;',
				'	}',
				'	lamp /= lampWeight;',
				'	vec3 toLamp = lamp - vec3(q, 0.0);',
				'	float dist = length(toLamp);',
				'	vec3 l = toLamp / dist;',
				'	float reach = exp(-dist * dist * 2.4 / (uLampReach * uLampReach));',
				/* The gas behind: a cavity the stars have blown, its walls streaked along their light. */
				'	float angle = atan(toLamp.y, toLamp.x);',
				'	float streak = mix(0.5, fbm3(vec3(cos(angle) * 3.4, sin(angle) * 3.4, dist * 2.4) + s, 5), smoothstep(0.1, 0.7, dist));',
				'	float cloud = fbm3(r2 * 1.9 + vec3(0.0, 0.0, 9.0) + s, 6) * (0.45 + 1.1 * fbm3(r2 * 6.0 + vec3(0.0, 0.0, 12.0) + s, 5));',
				'	float near2 = exp(-dist * dist * 1.5 / (uLampReach * uLampReach));',
				/* Round each stands a haze of what the light has torn from it. */
				'	float mist = (shapeAt(q + vec2(0.1, 0.03)) + shapeAt(q - vec2(0.1, 0.03)) + shapeAt(q + vec2(0.03, -0.1)) + shapeAt(q - vec2(0.03, -0.1))) * 0.25;',
				'	vec3 cavity = mix(uColors[1] * 0.75, mix(uColors[1] * 0.3 + uColors[2] * 0.5, uColors[2] * 1.15, smoothstep(0.3, 0.75, near2)), smoothstep(0.04, 0.3, near2));',
				'	float wisp = shapeAt(q - l.xy * 0.05) * 0.55 + shapeAt(q - l.xy * 0.12) * 0.28;',
				'	standingGlow = cavity * (0.05 + 1.5 * cloud * cloud + near2 * 0.1) * (0.6 + 0.8 * streak) + uColors[3] * wisp * reach * streak * 0.3;',
				'	standingGlow += (uColors[1] * 0.5 + uColors[2] * 0.14) * mist * (0.35 + 0.8 * cloud) * (0.3 + reach);',
				/* Stars that strike a tip show in the air round it: the dust stays dust, what shines is the gas their light goes through. */
				'	standingGlow += (uColors[2] * 0.8 + uColors[3] * 0.25) * (1.0 - uDrawn) * wisp * reach * (0.5 + streak) * 0.9;',
				'	standingGlow *= fade;',
				'	float skip = columns(q) + columns(q + vec2(0.16, 0.0)) + columns(q - vec2(0.16, 0.0)) + columns(q + vec2(0.0, 0.16)) + columns(q - vec2(0.0, 0.16));',
				'	if (uDrawn > 0.5 && skip <= 0.0) return vec4(0.0);',
				'	vec3 sum = vec3(0.0);',
				'	float seen = 0.0;',
				'	int count = uDrawn > 0.5 ? 40 : 72;',
				'	float step1 = 1.5 / float(count);',
				'	for (int i = 0; i < count && seen < 0.985; i++) {',
				'		vec3 at3 = vec3(q, 0.75 - float(i) * step1);',
				'		float thick3 = uDrawn > 0.5 ? puff(at3, s) : billow(at3, s);',
				'		if (thick3 > 0.01) {',
				'			vec3 ray3 = normalize(lamp - at3);',
				'			float taken = 0.0;',
				'			float far3 = distance(lamp, at3);',
				'			float a;',
				'			vec3 own = uColors[0] * 0.5 + uColors[1] * (0.03 + 0.09 * sqrt(reach));',
				'			if (uDrawn > 0.5) {',
				'				for (int j = 1; j <= 3; j++) taken += puffLight(at3 + ray3 * float(j) * 0.085, s);',
				'				float light = exp(-taken * 1.5) * exp(-far3 * far3 * 2.4 / (uLampReach * uLampReach)) * glowOf * (0.65 + 0.7 * fine);',
				/* What is thin takes the color of the gas it lies in: only what has body burns pale, so it has no rim drawn round it. */
				'				own += mix(uColors[1] * 1.3, uColors[3], smoothstep(0.25, 0.8, light) * smoothstep(0.25, 0.75, thick3)) * light * (1.1 + 1.9 * smoothstep(0.1, 0.6, thick3));',
				'				a = (1.0 - exp(-pow(thick3, 1.7) * step1 * 13.0)) * (1.0 - seen);',
				'			}',
				/*
				 * Dust: light comes through it by two ways, what gets through straight and what is scattered on deeper, so a side away from the
				 * stars goes dark by degrees and a tip towards them burns pale. What is thin glows with the gas it stands in.
				 */
				'			else {',
				'				for (int j = 1; j <= 6; j++) taken += billowLight(at3 + ray3 * float(j * j) * 0.012, s) * (0.5 + float(j) * 0.25);',
				'				float through = exp(-taken * 0.75) * 0.72 + exp(-taken * 0.12) * 0.28;',
				'				float light = through * exp(-far3 * far3 * 2.0 / (uLampReach * uLampReach));',
				'				own += mix(uColors[1] * 1.15, mix(uColors[1], uColors[3], 0.42), smoothstep(0.1, 1.0, light)) * min(light, 0.62) * 2.6;',
				'				a = (1.0 - exp(-thick3 * step1 * 15.0)) * (1.0 - seen);',
				'			}',
				'			sum += own * a;',
				'			seen += a;',
				'		}',
				'	}',
				'	if (seen < 0.002) return vec4(0.0);',
				/* The last of it goes into the air by degrees. */
				'	return vec4((1.0 - exp(-sum / seen * 1.5)) * 0.95, mix(seen, smoothstep(0.0, 0.85, seen), uDrawn) * fade);',
				'}',
				/*
				 * Rays out of a place in the gas: beams and gaps round it, each going out from the middle and fading, as the light of what hides there
				 * gets through what stands about it.
				 */
				'vec3 burst(vec3 d, vec4 at, vec3 s, float seed, inout vec3 color) {',
				'	float reach = acos(clamp(dot(d, at.xyz), -1.0, 1.0)) / at.w;',
				'	if (reach > 3.0) return vec3(0.0);',
				'	vec3 a = normalize(cross(at.xyz, vec3(0.2, 1.0, 0.1)));',
				'	vec3 b = cross(at.xyz, a);',
				/* The currents of the gas bend them a little, the more the farther out. */
				'	float angle = atan(dot(d, b), dot(d, a)) + (fbm3(d * 3.0 + s + seed, 4) - 0.5) * min(reach, 1.5) * 1.1;',
				'	float ray = fbm3(vec3(cos(angle) * 3.4, sin(angle) * 3.4, seed) + s, 5);',
				'	float fine = fbm3(vec3(cos(angle) * 11.0, sin(angle) * 11.0, seed + 3.0) + s, 4);',
				'	float beams = smoothstep(0.36, 0.72, ray) * (0.55 + 0.9 * fine);',
				'	float fall = exp(-reach * 1.5) * smoothstep(3.0, 1.5, reach);',
				/* It is the gas that shows it: darker between the beams, lit along them, and quiet. */
				'	color *= 1.0 - (1.0 - smoothstep(0.3, 0.6, ray)) * fall * 0.55;',
				'	return mix(uColors[1], uColors[2], smoothstep(0.0, 0.8, fall)) * beams * fall * 0.42 + uColors[2] * exp(-reach * reach * 40.0) * 0.16;',
				'}',
				/* How thick the gas is: billows bent by currents, with the torn edges of a finer noise. */
				'float thick(vec3 d, vec3 s) {',
				'	vec3 warp = vec3(fbm3(d * 1.7 + s, 4), fbm3(d * 1.7 + s + 5.2, 4), fbm3(d * 1.7 + s + 9.1, 4)) - 0.5;',
				'	vec3 bent = d + warp * 1.25;',
				'	float big = fbm3(bent * 1.5 + s + 2.0, 6);',
				'	float torn = ridge3(bent * 3.4 + s + 7.0, 5);',
				'	return clamp(big * 1.5 + torn * 0.32 - 0.36, 0.0, 1.0);',
				'}',
				'void main() {',
				'	vec3 d = cubeDirection(uFace, vQuad);',
				'	vec3 s = vec3(uSeed, uSeed * 0.7, uSeed * 1.3);',
				/*
				 * The light of the sky: one great star behind the gas. The gas is lit by how much of it lies towards that star, so
				 * it has sides that shine and sides in shade, and it glows through where it is thin and near.
				 */
				'	float gas = thick(d, s);',
				'	float towards = thick(normalize(d + uShine * 0.12), s);',
				'	float towards2 = thick(normalize(d + uShine * 0.3), s);',
				'	float lit = exp(-max(towards * 1.6 + towards2 * 1.1 - gas * 1.5, 0.0) * 1.9);',
				'	float near = max(dot(d, uShine), 0.0);',
				'	float core = pow(near, 6.0) * 0.45 + pow(near, 30.0) * 0.5;',
				'	float reach = 0.2 + pow(near * 0.5 + 0.5, 4.0) * 1.1;',
				'	float knots = 0.0;',
				'	for (int i = 0; i < 12; i++) {',
				'		if (uKnots[i].w > 0.0) {',
				'			float off = acos(clamp(dot(d, uKnots[i].xyz), -1.0, 1.0)) / uKnots[i].w;',
				'			knots += exp(-off * off * 1.4);',
				'		}',
				'	}',
				/* A galaxy seen from within: a band round its pole, its bulge towards its middle. */
				'	float high = dot(d, uPole);',
				'	vec3 middle = normalize(cross(uPole, vec3(0.3, 1.0, 0.2)));',
				'	float wideBand = exp(-high * high * 22.0) * (0.45 + 0.55 * pow(dot(d, middle) * 0.5 + 0.5, 2.0));',
				'	float disc = wideBand * uDisc;',
				'	float body = max(gas * uGas, 0.0) + knots * 0.22 * gas * uGas;',
				/* The sky is never quite black: the far gas goes on behind all of it, in its deep color. */
				'	vec3 color = uColors[0] * (0.3 + 0.9 * fbm3(d * 0.9 + s + 31.0, 4)) * (0.35 + uGas * 0.9);',
				'	float glow = (body * body * 1.3 + body * 0.35) * (0.3 + lit * reach * 2.4) + core * (0.4 + gas * 0.9) * uGas;',
				'	float tone = clamp(glow * 0.62, 0.0, 1.0);',
				'	vec3 gasColor = mix(uColors[1], uColors[2], smoothstep(0.12, 0.55, tone));',
				'	gasColor = mix(gasColor, uColors[3], smoothstep(0.7, 1.0, tone) * 0.55);',
				/* Gas holds its color: its light rolls off, it does not run into white. */
				'	color += gasColor * (1.0 - exp(-glow * 1.15)) * 0.8;',
				/* Dust stands before the gas: thick dark lanes that eat its light, torn at their edges; in a galaxy along its middle. */
				'	float lanes = smoothstep(0.5, 0.72, fbm3(d * 3.1 + s + 13.0, 6) + (gas - 0.5) * 0.2);',
				'	float dust = max(lanes, uDisc * exp(-high * high * 90.0) * smoothstep(0.3, 0.6, gas + 0.1)) * uDust;',
				'	color *= 1.0 - clamp(dust * 0.82, 0.0, 0.9);',
				'	if (uDisc > 0.0) color += band(d, s) * uDisc;',
				'	for (int i = 0; i < 8; i++) {',
				'		if (uBursts[i].w > 0.0) color += burst(d, uBursts[i], s, float(i) * 7.1, color) * (1.0 - clamp(dust, 0.0, 0.9) * 0.6);',
				'	}',
				/* What lies beyond shows through what is near only as far as that lets it: the band of the galaxy we are in, gas, dust. */
				'	float veil = exp(-disc * 5.0 - uDisc * exp(-high * high * 7.0) * 3.0 - clamp(gas * uGas, 0.0, 1.0) * 2.2 - dust * 2.5);',
				'	for (int i = 0; i < 16; i++) {',
				'		if (uGalaxies[i].w > 0.0) color += galaxy(d, uGalaxies[i], uPlanes[i]) * veil;',
				'	}',
				'	if (uPillars > 0.0) {',
				'		vec4 stood = standing(d, s);',
				'		color += standingGlow * uPillars;',
				'		color = mix(color, stood.rgb, stood.a * uPillars);',
				'	}',
				/* The stars: many and faint, more where gas gathers, a few bright, and the great one with its glare. */
				'	float many = (1.6 + knots * 9.0 + disc * 26.0) * uStars * (1.0 - clamp(dust, 0.0, 0.9) * 0.7);',
				'	color += stars(1.1, many, 1.0) * 0.9 + stars(0.8, many * 3.0, 2.0) * 0.6;',
				'	color += flares(d, 0.006 * uStars);',
				/* What lights the gas is no sun of its own: a cloud of young stars, each a point. */
				'	float young = pow(near, 900.0) * uBeacon;',
				'	if (young > 0.001) color += stars(1.2, young * 240.0, 3.0) * 1.3 + flares(d, young * 0.5);',
				/* A globular cluster: stars by the ten thousand, thick to the middle, where they run together. */
				'	if (uGlobular > 0.0) {',
				'		float swarm = 0.0;',
				'		for (int i = 0; i < 12; i++) {',
				'			if (uKnots[i].w < 0.0) {',
				'				float off = acos(clamp(dot(d, uKnots[i].xyz), -1.0, 1.0)) / -uKnots[i].w;',
				'				swarm += smoothstep(1.0, 0.25, off) / (1.0 + off * off / 0.03);',
				'			}',
				'		}',
				'		color += (stars(1.05, swarm * 240.0, 4.0) * 1.5 + stars(0.8, swarm * 520.0, 5.0) + stars(0.7, swarm * 700.0, 6.0) * 0.8) * uGlobular * 1.1;',
				'		color += vec3(0.76, 0.8, 0.8) * pow(swarm, 1.7) * 0.34 * uGlobular;',
				'	}',
				'	outColor = vec4(color + (hash(d * 311.0) - 0.5) / 255.0, 1.0);',
				'}'
			].join('\n'),

			/* The whole view at a depth (uDepth, of the screen): only where nothing nearer was drawn. */
			WarpVertex: head + [
				'in vec3 aPosition;',
				'uniform float uDepth;',
				'out vec2 vQuad;',
				'void main() {',
				'	vQuad = aPosition.xy;',
				'	gl_Position = vec4(aPosition.xy, uDepth, 1.0);',
				'}'
			].join('\n'),

			/*
			 * A way far at once, round its axis: a ray is where it lies round the axis (an angle) and how far from it (the log of the
			 * tangent of half of that, so the stars go out from the point ahead at an even pace). Stars lie in cells of both, each
			 * drawn out along its way as far as Stretch says, flowing out by Flow; the tunnel is noise on the same two, rings that go
			 * out, a bright core where it leads. uPart 0 is the tunnel (and the dark it lays over the sky), 1 the light added.
			 */
			Warp: head + [
				'in vec2 vQuad;',
				'uniform mat4 uInverse;',
				'uniform vec3 uAxis;',
				'uniform float uFlow;',
				'uniform float uStretch;',
				'uniform float uTunnel;',
				'uniform float uFlash;',
				'uniform vec3 uTint;',
				'uniform float uPart;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				'float cellHash(vec3 p) {',
				'	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);',
				'}',
				'vec3 streaks(float turn, float off, float far, float sectors, float cell, float pace, float seed, float density) {',
				'	float a = turn * sectors;',
				'	float q = far - uFlow * pace;',
				'	float column = floor(a);',
				'	float row = floor(q / cell);',
				'	float h1 = cellHash(vec3(mod(column, sectors), row, seed));',
				'	if (h1 > density) return vec3(0.0);',
				'	float h2 = cellHash(vec3(mod(column, sectors), row, seed + 1.7));',
				'	float h3 = cellHash(vec3(mod(column, sectors), row, seed + 3.1));',
				'	float span = cell * (0.04 + 0.86 * uStretch);',
				'	float start = row * cell + h2 * (cell - span);',
				'	float along = (q - start) / span;',
				'	if (along < 0.0 || along > 1.0) return vec3(0.0);',
				/* Across, in radians of the view: as thin near the point ahead as far from it. */
				'	float across = abs(a - column - 0.2 - h3 * 0.6) / sectors * 6.28318 * off;',
				'	float width = 0.0011 + 0.0016 * h3;',
				'	float line = exp(-across * across / (width * width));',
				'	float body = smoothstep(0.0, 0.5, along) * (1.0 - smoothstep(0.93, 1.0, along));',
				'	vec3 color = mix(vec3(0.62, 0.76, 1.0), vec3(1.0, 0.97, 0.92), h3);',
				'	return color * line * body * (0.6 + 2.2 * h2 * h2);',
				'}',
				'void main() {',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(vQuad, -1.0, 1.0);',
				'	vec3 ray = normalize(far.xyz / far.w - close.xyz / close.w);',
				'	vec3 axis = normalize(uAxis);',
				'	vec3 u = normalize(cross(axis, abs(axis.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));',
				'	vec3 v = cross(axis, u);',
				'	float angle = acos(clamp(dot(ray, axis), -1.0, 1.0));',
				'	float turn = atan(dot(ray, v), dot(ray, u)) / 6.28318 + 0.5;',
				'	float off = sin(angle);',
				'	float out1 = log(max(tan(min(angle, 3.1) * 0.5), 1e-4));',
				'	float ahead = exp(-angle * angle * 40.0);',
				'	if (uPart < 0.5) {',
				'		float ring = 3.0;',
				'		vec3 swirl = vec3(cos(turn * 6.28318) * ring, sin(turn * 6.28318) * ring, out1 * 2.2 - uFlow * 2.6);',
				'		float n = fbm3(swirl, 4);',
				'		float m = fbm3(swirl * vec3(0.5, 0.5, 0.35) + vec3(7.1, 2.3, 0.0), 3);',
				'		float bands = pow(0.5 + 0.5 * sin(out1 * 9.0 - uFlow * 11.0 + m * 7.0), 6.0);',
				'		float wall = smoothstep(0.03, 0.5, angle) * (1.0 - smoothstep(1.7, 2.4, angle));',
				'		vec3 deep = uTint * 0.05;',
				'		vec3 bright = mix(uTint * 0.9, vec3(1.0, 0.95, 1.0) * 1.4, smoothstep(0.66, 0.9, n));',
				'		vec3 tunnel = mix(deep, bright, smoothstep(0.45, 0.85, n) * wall) + uTint * bands * wall * 0.35 + vec3(0.9, 0.95, 1.0) * exp(-angle * angle * 120.0) * 1.2;',
				'		float hidden = clamp(uTunnel * 0.94 + uStretch * 0.45 * (1.0 - uTunnel), 0.0, 1.0);',
				'		outColor = vec4(hidden > 0.0 ? tunnel * uTunnel * 0.94 / hidden : vec3(0.0), hidden);',
				'		return;',
				'	}',
				/* Few stars right ahead, where they all start, and none behind. */
				'	float seen = smoothstep(0.02, 0.18, angle) * (1.0 - smoothstep(1.9, 2.6, angle));',
				'	vec3 light = (streaks(turn, off, out1, 240.0, 0.32, 1.0, 0.0, 0.2) + streaks(turn, off, out1, 150.0, 0.5, 0.62, 9.0, 0.14) * 0.7) * seen * (0.3 + 1.0 * uStretch) * smoothstep(0.0, 0.05, uStretch);',
				'	light += vec3(0.75, 0.88, 1.0) * ahead * 0.8 * uStretch;',
				'	light += vec3(0.85, 0.92, 1.0) * uFlash * (0.25 + 1.8 * exp(-angle * angle * 6.0));',
				'	outColor = vec4(light, 1.0);',
				'}'
			].join('\n'),

			Far: head + [
				'in vec2 vQuad;',
				'uniform mat4 uInverse;',
				'uniform samplerCube uCube;',
				'uniform mat3 uTurn;',
				'uniform float uStrength;',
				'out vec4 outColor;',
				'void main() {',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(vQuad, -1.0, 1.0);',
				'	vec3 ray = normalize(far.xyz / far.w - close.xyz / close.w);',
				'	outColor = vec4(texture(uCube, transpose(uTurn) * ray).rgb * uStrength, 1.0);',
				'}'
			].join('\n'),

			MoteVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uPlace;',
				'uniform float uBox;',
				'uniform float uRatio;',
				'uniform vec3 uTint;',
				'uniform vec3 uHigh;',
				'out vec4 vColor;',
				'void main() {',
				'	vec3 at = (fract(aPosition - uPlace) - 0.5) * uBox;',
				'	gl_Position = uViewProjection * vec4(at, 1.0);',
				'	float near = length(at) / uBox;',
				'	float big = step(0.59, aColor.a);',
				'	float seen = smoothstep(0.5, 0.25, near) * smoothstep(0.015, 0.06, near);',
				'	vColor = vec4(mix(mix(vec3(0.9), uHigh, aColor.r), uTint, big), seen * mix(0.5, 0.05, big));',
				'	gl_PointSize = clamp(mix(1.1, 90.0, big * aColor.a) * uRatio * (big > 0.5 ? 1.0 / max(near * 8.0, 0.4) : 1.0), 1.0, 160.0);',
				'}'
			].join('\n'),

			Mote: head + [
				'in vec4 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	float far = length(gl_PointCoord - vec2(0.5)) * 2.0;',
				'	outColor = vec4(vColor.rgb, vColor.a * pow(max(1.0 - far, 0.0), 2.0));',
				'}'
			].join('\n')
		};
	}
});
