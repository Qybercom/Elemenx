/*
 * Probes: the light that bounces, worked out round the eye of a Scene with a ground, at high and ultra (Graphics().Probes).
 *
 * What stands round the eye, 64 metres a side and 32 high, is laid in voxels of a metre: slabs of a metre drawn along each
 * of the three axes in their colors (a floor in a slab across y, a wall in one across x or z), a few slabs a frame, then
 * joined (Merge). Each voxel is lit (Lit): the sun as far as the voxels let it to it, the lamps, and what the probes already
 * gather there, so light goes on bouncing frame after frame. A grid of probes two metres apart (32 by 16 by 32) sends 32
 * rays each through the voxels (Rays), from a free voxel of its block (a probe in a wall is moved out of it), a part of them each frame, each frame other ways: what a ray meets gives its light,
 * what meets nothing the sky. The probes keep what came to them from all round (Reduce: spherical harmonics of the first
 * band, mixed with what they had). Each voxel then gets what its eight probes round it give as far as they see it (Volume),
 * and each surface reads that of the voxels by it (aroundLight of Renderer): its programs pay nothing for it. A room is dark but
 * for its window, under a roof it is dim, a wall by a sunny meadow is green below. A probe in a wall takes what its
 * neighbours have. What walks (models with a skeleton) is not laid: it gets light, it gives none.
 *
 * For what mirrors (Mirror of SceneLighting) a map of what is round the eye is drawn too: a ray from the eye through the
 * voxels for each texel of an octahedral map (Around), its mipmaps the blur of what is rough, the sky where it met nothing.
 *
 * The grid follows the eye by 16 metres; while it is laid again the last one is used, then the probes are moved with it.
 * scene.Tuned.Probes false turns it off (to see the picture without it).
 */
Elemenx.Trait('SceneProbes', {
	ProbesStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var graphics = this.$Service('Renderer');
		var vectors = this.$Service('Math').Vectors;
		var shaders = this.ProbesShaders(graphics);
		var size = [64, 32, 64];
		var count = [32, 16, 32];
		var rays = 32;
		var state = null;
		var waited = 0;
		var options = {Depth: false, DepthWrite: false, Cull: 'none'};

		function make () {
			state = {
				Programs: {
					Merge: renderer.Program(graphics.Shaders.Quad, shaders.Merge),
					Lit: renderer.Program(graphics.Shaders.Quad, shaders.Lit),
					Rays: renderer.Program(graphics.Shaders.Quad, shaders.Rays),
					Reduce: renderer.Program(graphics.Shaders.Quad, shaders.Reduce),
					Around: renderer.Program(graphics.Shaders.Quad, shaders.Around),
					Volume: renderer.Program(graphics.Shaders.Quad, shaders.Volume)
				},
				/* The slabs along y, x and z, as they are drawn; the joined voxels, and lit. */
				Slabs: [renderer.Target(512, 256), renderer.Target(512, 256), renderer.Target(512, 256)],
				Grid: renderer.Target(512, 256),
				Lit: [renderer.Target(512, 256, {Float: true, Colors: 3}), renderer.Target(512, 256, {Float: true, Colors: 3})],
				Rays: renderer.Target(512, 256, {Float: true}),
				/* What is round the eye, an octahedral map, for what mirrors (Mirror of SceneLighting). */
				Around: renderer.Target(128, 128, {Float: true, Mipmaps: true}),
				/* What each voxel gets round it, of the probes that see it: what the surfaces read (four blocks: red, green, blue, free). */
				Volume: renderer.Target(512, 1024, {Float: true}),
				/* The probes, twice: read the last, write the next; and what each was (in a wall, its age). */
				Probes: [renderer.Target(count[0] * count[1], count[2] * 3, {Float: true, Colors: 2}), renderer.Target(count[0] * count[1], count[2] * 3, {Float: true, Colors: 2})],
				Read: 0,
				Laying: null,
				Laid: null,
				Phase: 0,
				Frame: 0,
				Stands: '',
				Shift: [0, 0, 0],
				Fresh: true
			};

			[state.Probes[0], state.Probes[1]].forEach(function (target) {
				target.Begin();

				renderer.Clear([0, 0, 0, 0]);

				target.End();
			});

			if (!scene.PostQuad)
				scene.PostQuad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		}

		/* The corner of the grid for an eye: by whole 16 metres across (8 up), the eye 24 to 40 in from its sides and 10 to 18 up from its floor. */
		function cornerOf (eye) {
			return [Math.floor((eye[0] - 24) / 16) * 16, Math.floor((eye[1] - 10) / 8) * 8, Math.floor((eye[2] - 24) / 16) * 16];
		}

		/*
		 * The view of a slab: its axis (0 y, 1 x, 2 z) and its number; the place relative to the eye goes to its tile in the
		 * texture of that axis, the slab a metre deep (all else is clipped). [matrix, viewport].
		 */
		function slab (axis, index, corner) {
			var eye = scene.Eye;
			var m = new Array(16).fill(0);
			var col = index % 8;
			var row = Math.floor(index / 8);

			m[15] = 1;

			if (axis === 0) {
				m[0] = 2 / size[0];
				m[12] = 2 * (eye[0] - corner[0]) / size[0] - 1;
				m[9] = 2 / size[2];
				m[13] = 2 * (eye[2] - corner[2]) / size[2] - 1;
				m[6] = 2;
				m[14] = 2 * (eye[1] - corner[1] - index) - 1;

				return [m, [col * 64, row * 64, 64, 64]];
			}

			m[5] = 2 / size[1];
			m[13] = 2 * (eye[1] - corner[1]) / size[1] - 1;

			if (axis === 1) {
				m[8] = 2 / size[2];
				m[12] = 2 * (eye[2] - corner[2]) / size[2] - 1;
				m[2] = 2;
				m[14] = 2 * (eye[0] - corner[0] - index) - 1;
			}
			else {
				m[0] = 2 / size[0];
				m[12] = 2 * (eye[0] - corner[0]) / size[0] - 1;
				m[10] = 2;
				m[14] = 2 * (eye[2] - corner[2] - index) - 1;
			}

			return [m, [col * 64, row * 32, 64, 32]];
		}

		/* A few slabs more of the grid being laid; when all are, it is joined and taken. */
		function lay (each) {
			var laying = state.Laying;
			var target;
			var made;
			var done = 0;

			while (done < each && laying.Next < laying.Order.length) {
				var step = laying.Order[laying.Next];

				target = state.Slabs[step[0]];
				made = slab(step[0], step[1], laying.Corner);

				target.Begin();

				gl.enable(gl.SCISSOR_TEST);
				gl.scissor(made[1][0], made[1][1], made[1][2], made[1][3]);

				renderer.Viewport(made[1][0], made[1][1], made[1][2], made[1][3]);
				renderer.Clear([0, 0, 0, 0]);

				scene.Voxels(made[0]);

				gl.disable(gl.SCISSOR_TEST);

				target.End();

				laying.Next++;

				done++;
			}

			if (laying.Next < laying.Order.length) return;

			pass(state.Grid, state.Programs.Merge, {uY: state.Slabs[0].Textures[0], uX: state.Slabs[1].Textures[0], uZ: state.Slabs[2].Textures[0]});

			/* The probes move with the grid by whole steps of theirs. */
			state.Shift = state.Laid ? [(laying.Corner[0] - state.Laid.Corner[0]) / 2, (laying.Corner[1] - state.Laid.Corner[1]) / 2, (laying.Corner[2] - state.Laid.Corner[2]) / 2] : [0, 0, 0];
			state.Fresh = !state.Laid;
			state.Laid = {Corner: laying.Corner, Time: scene.Seconds};
			state.Laying = null;
		}

		function pass (target, program, uniforms) {
			target.Begin();

			renderer.Draw(scene.PostQuad, program, uniforms, options);

			target.End();
		}

		/* A turn of the rays of a frame: a quaternion of three random numbers, as a matrix. */
		function turn () {
			var u = Math.random();
			var v = Math.random() * Math.PI * 2;
			var w = Math.random() * Math.PI * 2;
			var a = Math.sqrt(1 - u);
			var b = Math.sqrt(u);
			var x = a * Math.sin(v);
			var y = a * Math.cos(v);
			var z = b * Math.sin(w);
			var q = b * Math.cos(w);

			return [1 - 2 * (y * y + z * z), 2 * (x * y + z * q), 2 * (x * z - y * q), 2 * (x * y - z * q), 1 - 2 * (x * x + z * z), 2 * (y * z + x * q), 2 * (x * z + y * q), 2 * (y * z - x * q), 1 - 2 * (x * x + y * y)];
		}

		/*
		 * A frame of the light of probes, with the lights of the frame (shade: the shadows, the lamps): the uniforms that give
		 * each surface what comes round it, or none.
		 */
		engine.ProbeLight = function (shade) {
			var set = self.Graphics ? self.Graphics() : {};
			var ground = scene.Ground;
			var each = set.Probes || 0;
			var subset = set.ProbeSubset || 8;
			var stands;
			var corner;
			var read;
			var write;
			var spin;
			var sky;
			var common;
			var lit;
			var full;

			if (!each || !ground || !scene.Voxels || scene.Camera.Ortho || scene.Tuned && scene.Tuned.Probes === false) return {uProbeOn: 0};

			/* Its programs made once the scene has drawn a while: a scene of a few frames (a preview, a test) never pays for them. */
			if (!state && ++waited < 30) return {uProbeOn: 0};

			if (!state)
				make();

			state.Frame++;

			/*
			 * What stands, and the squares of the ground once they are all made: laid while they were still coming, the grid had
			 * no ground till ten seconds were gone (Regression: under load, a ground missing from the voxels). Not while they
			 * come: laid again at each, the light the probes gather changed from frame to frame.
			 */
			if (scene.Ground && scene.Ground.Nodes && !scene.Ground.Missing)
				state.GroundKey = Object.keys(scene.Ground.Nodes).length;

			stands = (self.Sown ? self.Sown().Things : 0) + ':' + scene.Order.length + ':' + (state.GroundKey || 0);
			corner = cornerOf(scene.Eye);

			/* Laid again when the eye went into the next 16 metres, when what stands changed, and every ten seconds. */
			if (!state.Laying && (!state.Laid || String(corner) !== String(state.Laid.Corner) || state.Stands !== stands || scene.Seconds - state.Laid.Time > 10)) {
				state.Stands = stands;
				state.Laying = {Corner: corner, Next: 0, Order: []};

				[[0, size[1]], [1, size[0]], [2, size[2]]].forEach(function (axis) {
					var i;

					for (i = 0; i < axis[1]; i++)
						state.Laying.Order.push([axis[0], i]);
				});
			}

			if (state.Laying)
				lay(each);

			if (!state.Laid)
				return {uProbeOn: 0};

			read = state.Probes[state.Read];
			write = state.Probes[1 - state.Read];
			sky = {uSkyLight: ground.SkyLight, uFloorLight: ground.FloorLight};
			spin = turn();
			common = {uProbe: state.Volume.Textures[0], uProbeBox: vectors.Subtract(state.Laid.Corner, scene.Eye).concat([1]), uProbeCount: size};
			full = state.Fresh || state.Shift.some(function (part) {
				return part !== 0;
			});

			/* The voxels lit: the sun through them, the lamps, what the probes gather (once they have some). */
			[0, 1].forEach(function (faces) {
				pass(state.Lit[faces], state.Programs.Lit, Object.assign({}, shade, common, {uFaces: faces, uGrid: state.Grid.Textures[0], uCorner: vectors.Subtract(state.Laid.Corner, scene.Eye), uSun: ground.Sun, uSunColor: ground.SunColor, uSunUp: ground.Sun[1] > 0 ? 1 : 0, uProbeOn: state.Fresh ? 0 : 1}));
			});

			lit = {uLit: state.Lit[0].Textures[0], uLit1: state.Lit[0].Textures[1], uLit2: state.Lit[0].Textures[2], uLit3: state.Lit[1].Textures[0], uLit4: state.Lit[1].Textures[1], uLit5: state.Lit[1].Textures[2]};

			pass(state.Rays, state.Programs.Rays, Object.assign({}, lit, {uTurn: spin, uPhase: state.Phase, uSubset: subset, uRays: rays}, sky));

			/* What is round the eye, for the mirrors, every other frame. */
			if (state.Frame % 2 === 0)
				pass(state.Around, state.Programs.Around, Object.assign({}, lit, {uEye: vectors.Subtract(scene.Eye, state.Laid.Corner), uSide: 128}));

			state.AroundOn = true;

			pass(write, state.Programs.Reduce, {uRays: state.Rays.Textures[0], uOld: read.Textures[0], uOldInfo: read.Textures[1], uTurn: spin, uPhase: state.Phase, uSubset: subset, uRayCount: rays, uShift: state.Shift, uFresh: state.Fresh ? 1 : 0});

			/* What each voxel gets of the probes: a row of its layers a frame, all of them when the grid is new or moved. */
			pass(state.Volume, state.Programs.Volume, {uGrid: state.Grid.Textures[0], uProbes: write.Textures[0], uRow: full ? -1 : state.Frame % 4});

			state.Shift = [0, 0, 0];
			state.Fresh = false;
			state.Phase = (state.Phase + 1) % subset;
			state.Read = 1 - state.Read;

			return Object.assign(common, {uProbeOn: 1});
		};

		/* What the probes hold, for a test: {Corner, Count, Spacing, Data (RGBA floats of uProbe), Info, Around (RGBA floats of the octahedral map round the eye, 128 a side)} or null. */
		/* What is round the eye for the mirrors: {Texture (octahedral, mipmapped; alpha: something there), On}. */
		engine.ProbeAround = function () {
			return state && state.AroundOn && !(scene.Tuned && scene.Tuned.Probes === false) ? {Texture: state.Around.Textures[0], On: true} : {Texture: null, On: false};
		};

		engine.ProbesRead = function () {
			var target;
			var data;
			var info;
			var around;

			if (!state || !state.Laid) return null;

			target = state.Probes[state.Read];
			data = new Float32Array(target.Width * target.Height * 4);
			info = new Float32Array(target.Width * target.Height * 4);

			target.Begin();

			gl.readBuffer(gl.COLOR_ATTACHMENT0);
			gl.readPixels(0, 0, target.Width, target.Height, gl.RGBA, gl.FLOAT, data);
			gl.readBuffer(gl.COLOR_ATTACHMENT1);
			gl.readPixels(0, 0, target.Width, target.Height, gl.RGBA, gl.FLOAT, info);
			gl.readBuffer(gl.COLOR_ATTACHMENT0);

			target.End();

			around = new Float32Array(128 * 128 * 4);

			state.Around.Begin();

			gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.FLOAT, around);

			state.Around.End();

			return {Corner: state.Laid.Corner.slice(), Count: count.slice(), Spacing: 2, Width: target.Width, Data: data, Info: info, Around: around, Laying: !!state.Laying};
		};

		/* The joined voxels, for a test: RGBA bytes of the grid (512 by 256: the layers of y, 8 a row, each 64 by 64 of x by z). */
		engine.VoxelsRead = function () {
			var data;

			if (!state || !state.Laid) return null;

			data = new Uint8Array(512 * 256 * 4);

			state.Grid.Begin();

			gl.readPixels(0, 0, 512, 256, gl.RGBA, gl.UNSIGNED_BYTE, data);

			state.Grid.End();

			return {Corner: state.Laid.Corner.slice(), Data: data};
		};
	},

	ProbesShaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
		/* A voxel and its texel of the joined grid: the layers of y, 8 a row, each 64 by 64 of x by z. */
		var grid = [
			'ivec2 gridTexel(ivec3 v) {',
			'	return ivec2((v.y % 8) * 64 + v.x, (v.y / 8) * 64 + v.z);',
			'}',
			'float solid(sampler2D map, ivec3 v) {',
			'	if (any(lessThan(v, ivec3(0))) || any(greaterThanEqual(v, ivec3(64, 32, 64)))) return 0.0;',
			'	return texelFetch(map, gridTexel(v), 0).a;',
			'}',
			/* The ways of a probe: points of a Fibonacci spiral over the sphere, turned by the turn of the frame. */
			'vec3 rayWay(int index, int total, mat3 turn) {',
			'	float y = 1.0 - (float(index) + 0.5) * 2.0 / float(total);',
			'	float r = sqrt(max(0.0, 1.0 - y * y));',
			'	float a = float(index) * 2.39996323;',
			'	return turn * vec3(cos(a) * r, y, sin(a) * r);',
			'}'
		].join('\n');
		/*
		 * A ray through the voxels by their walls (Amanatides and Woo), from a point of the grid (voxels) along a way: what it
		 * meets, [the light of the face it came in by, how far], nothing in the grid: alpha -1. The faces lit: uLit to uLit5
		 * (+x, -x, +y, -y, +z, -z; alpha of uLit: solid).
		 */
		var march = [
			'uniform sampler2D uLit;',
			'uniform sampler2D uLit1;',
			'uniform sampler2D uLit2;',
			'uniform sampler2D uLit3;',
			'uniform sampler2D uLit4;',
			'uniform sampler2D uLit5;',
			'vec4 march(vec3 from, vec3 way) {',
			'	ivec3 cell = ivec3(floor(from));',
			'	ivec3 stepping = ivec3(sign(way));',
			'	vec3 delta = abs(1.0 / max(abs(way), vec3(1e-5)));',
			'	vec3 next = (vec3(cell) + max(vec3(stepping), vec3(0.0)) - from) / way;',
			'	next = vec3(way.x == 0.0 ? 1e9 : next.x, way.y == 0.0 ? 1e9 : next.y, way.z == 0.0 ? 1e9 : next.z);',
			'	float t = 0.0;',
			'	int face = 0;',
			'	for (int i = 0; i < 160; i++) {',
			'		if (next.x < next.y && next.x < next.z) {',
			'			t = next.x;',
			'			next.x += delta.x;',
			'			cell.x += stepping.x;',
			'			face = stepping.x > 0 ? 1 : 0;',
			'		}',
			'		else if (next.y < next.z) {',
			'			t = next.y;',
			'			next.y += delta.y;',
			'			cell.y += stepping.y;',
			'			face = stepping.y > 0 ? 3 : 2;',
			'		}',
			'		else {',
			'			t = next.z;',
			'			next.z += delta.z;',
			'			cell.z += stepping.z;',
			'			face = stepping.z > 0 ? 5 : 4;',
			'		}',
			'		if (any(lessThan(cell, ivec3(0))) || any(greaterThanEqual(cell, ivec3(64, 32, 64)))) break;',
			'		ivec2 at = gridTexel(cell);',
			'		if (texelFetch(uLit, at, 0).a > 0.5) return vec4(face == 0 ? texelFetch(uLit, at, 0).rgb : face == 1 ? texelFetch(uLit1, at, 0).rgb : face == 2 ? texelFetch(uLit2, at, 0).rgb : face == 3 ? texelFetch(uLit3, at, 0).rgb : face == 4 ? texelFetch(uLit4, at, 0).rgb : texelFetch(uLit5, at, 0).rgb, t);',
			'	}',
			'	return vec4(0.0, 0.0, 0.0, -1.0);',
			'}'
		].join('\n');

		return {
			/* The slabs of the three axes joined: a voxel is there if any saw it, of the mean of their colors. */
			Merge: head + [
				'uniform sampler2D uY;',
				'uniform sampler2D uX;',
				'uniform sampler2D uZ;',
				'out vec4 outColor;',
				'void main() {',
				'	ivec2 f = ivec2(gl_FragCoord.xy);',
				'	int y = (f.y / 64) * 8 + f.x / 64;',
				'	int x = f.x % 64;',
				'	int z = f.y % 64;',
				'	vec4 a = texelFetch(uY, f, 0);',
				'	vec4 b = texelFetch(uX, ivec2((x % 8) * 64 + z, (x / 8) * 32 + y), 0);',
				'	vec4 c = texelFetch(uZ, ivec2((z % 8) * 64 + x, (z / 8) * 32 + y), 0);',
				'	float w = a.a + b.a + c.a;',
				'	outColor = w > 0.0 ? vec4((a.rgb * a.a + b.rgb * b.a + c.rgb * c.a) / w, 1.0) : vec4(0.0);',
				'}'
			].join('\n'),

			/*
			 * The faces of a voxel lit, three a pass (uFaces 0: +x, -x, +y; 1: -y, +z, -z), each by itself: none where the voxel
			 * beside covers it, the sun if nothing of the grid stands between it and the face, the lamps, and what the probes
			 * gather on that side; its color times all that. A thin wall is lit outside and dark inside. Alpha: the voxel is solid.
			 */
			Lit: head + [
				'uniform sampler2D uGrid;',
				'uniform vec3 uCorner;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform float uSunUp;',
				'uniform float uFaces;',
				'layout(location = 0) out vec4 outFirst;',
				'layout(location = 1) out vec4 outSecond;',
				'layout(location = 2) out vec4 outThird;',
				graphics.Chunks.Shadow,
				grid,
				'vec3 faceLight(ivec3 v, vec3 albedo, int face, vec3 place) {',
				'	vec3 n = face == 0 ? vec3(1.0, 0.0, 0.0) : face == 1 ? vec3(-1.0, 0.0, 0.0) : face == 2 ? vec3(0.0, 1.0, 0.0) : face == 3 ? vec3(0.0, -1.0, 0.0) : face == 4 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 0.0, -1.0);',
				'	if (solid(uGrid, v + ivec3(n)) > 0.5) return vec3(0.0);',
				'	float seen = uSunUp * step(0.0, dot(n, uSun));',
				'	vec3 at = vec3(v) + 0.5 + n * 0.75;',
				'	for (int i = 0; i < 48 && seen > 0.0; i++) {',
				'		ivec3 p = ivec3(floor(at + uSun * float(i)));',
				'		if (any(lessThan(p, ivec3(0))) || any(greaterThanEqual(p, ivec3(64, 32, 64)))) break;',
				'		if (texelFetch(uGrid, gridTexel(p), 0).a > 0.5) seen = 0.0;',
				'	}',
				'	vec3 light = uSunColor * 1.35 * max(dot(n, uSun), 0.0) * seen + localLight(place + n * 0.5, n);',
				'	if (uProbeOn > 0.5) {',
				'		float weight;',
				'		light += probeLight(place + n * 0.5, n, weight) * weight * 0.9;',
				'	}',
				'	return albedo * light;',
				'}',
				'void main() {',
				'	ivec2 f = ivec2(gl_FragCoord.xy);',
				'	ivec3 v = ivec3(f.x % 64, (f.y / 64) * 8 + f.x / 64, f.y % 64);',
				'	vec4 c = texelFetch(uGrid, f, 0);',
				'	if (c.a < 0.5) {',
				'		outFirst = vec4(0.0);',
				'		outSecond = vec4(0.0);',
				'		outThird = vec4(0.0);',
				'		return;',
				'	}',
				'	vec3 place = uCorner + vec3(v) + 0.5;',
				'	int first = int(uFaces) * 3;',
				'	outFirst = vec4(faceLight(v, c.rgb, first, place), 1.0);',
				'	outSecond = vec4(faceLight(v, c.rgb, first + 1, place), 1.0);',
				'	outThird = vec4(faceLight(v, c.rgb, first + 2, place), 1.0);',
				'}'
			].join('\n'),

			/*
			 * The rays of the probes of this frame (those whose row of z is of the phase): a texel for each ray of each probe,
			 * through the voxels by their walls (Amanatides and Woo); what it meets, the light of the face it came in by and how far
			 * ([light, metres]),
			 * nothing the sky of its way (far: 10000), started in a wall (-1).
			 */
			Rays: head + [
				'uniform mat3 uTurn;',
				'uniform float uPhase;',
				'uniform float uSubset;',
				'uniform float uRays;',
				'uniform vec3 uSkyLight;',
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				grid,
				march,
				'void main() {',
				'	ivec2 f = ivec2(gl_FragCoord.xy);',
				'	int total = int(uRays);',
				'	int k = (f.y / total) * int(uSubset) + int(uPhase);',
				'	if (k >= 32) {',
				'		outColor = vec4(0.0);',
				'		return;',
				'	}',
				/* From a voxel of its block of two by two by two that is free (as DDGI moves a probe out of a wall); none free: in a wall. */
				'	ivec3 block = ivec3(f.x % 32, f.x / 32, k) * 2;',
				'	ivec3 cell = ivec3(-1);',
				'	for (int c = 0; c < 8; c++) {',
				'		ivec3 v = block + ivec3(c & 1, (c >> 1) & 1, (c >> 2) & 1);',
				'		if (solid(uLit, v) < 0.5) {',
				'			cell = v;',
				'			break;',
				'		}',
				'	}',
				'	if (cell.x < 0) {',
				'		outColor = vec4(0.0, 0.0, 0.0, -1.0);',
				'		return;',
				'	}',
				'	vec3 way = rayWay(f.y % total, total, uTurn);',
				'	vec4 hit = march(vec3(cell) + 0.5, way);',
				'	outColor = hit.a >= 0.0 ? hit : vec4(mix(uFloorLight, uSkyLight, way.y * 0.5 + 0.5), 10000.0);',
				'}'
			].join('\n'),

			/*
			 * What each voxel gets round it (the surfaces read it, at no cost of their own): of the eight probes round its middle,
			 * each as near as it is and as far as the voxels between let it see it (two points of the way, read smooth); a voxel
			 * that is solid none. Four blocks: the harmonics of red, green, blue, and the free part (1 or 0). uRow: the row of
			 * layers (of 8) made this frame, -1 all of them.
			 */
			Volume: head + [
				'uniform sampler2D uGrid;',
				'uniform sampler2D uProbes;',
				'uniform float uRow;',
				'out vec4 outColor;',
				grid,
				/* How solid the voxels are at a point (in voxels), read smooth: 0 out of the grid. */
				'float solidAt(vec3 c) {',
				'	if (any(lessThan(c, vec3(0.0))) || any(greaterThanEqual(c, vec3(64.0, 32.0, 64.0)))) return 0.0;',
				'	vec2 at = clamp(c.xz, vec2(0.5), vec2(63.5));',
				'	float y = clamp(c.y - 0.5, 0.0, 30.999);',
				'	float layer = floor(y);',
				'	vec2 low = (at + vec2(mod(layer, 8.0) * 64.0, floor(layer / 8.0) * 64.0)) / vec2(512.0, 256.0);',
				'	vec2 high = (at + vec2(mod(layer + 1.0, 8.0) * 64.0, floor((layer + 1.0) / 8.0) * 64.0)) / vec2(512.0, 256.0);',
				'	return mix(textureLod(uGrid, low, 0.0).a, textureLod(uGrid, high, 0.0).a, y - layer);',
				'}',
				'void main() {',
				'	ivec2 f = ivec2(gl_FragCoord.xy);',
				'	int block = f.y / 256;',
				'	int inside = f.y - block * 256;',
				'	int row = inside / 64;',
				'	if (uRow >= 0.0 && float(row) != uRow) discard;',
				'	ivec3 v = ivec3(f.x % 64, row * 8 + f.x / 64, inside % 64);',
				'	float solid = texelFetch(uGrid, ivec2(f.x, inside), 0).a;',
				'	if (block == 3) {',
				'		outColor = vec4(1.0 - step(0.5, solid), 0.0, 0.0, 1.0);',
				'		return;',
				'	}',
				'	if (solid > 0.5) {',
				'		outColor = vec4(0.0);',
				'		return;',
				'	}',
				'	vec3 here = vec3(v) + 0.5;',
				'	vec3 g = (here - 1.0) / 2.0;',
				'	vec3 base = floor(clamp(g, vec3(0.0), vec3(30.999, 14.999, 30.999)));',
				'	vec3 part = clamp(g - base, 0.0, 1.0);',
				'	vec4 sum = vec4(0.0);',
				'	float total = 0.0;',
				'	for (int i = 0; i < 8; i++) {',
				'		vec3 corner = vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1));',
				'		vec3 q = base + corner;',
				'		vec3 near = mix(1.0 - part, part, corner);',
				'		vec3 to = q * 2.0 + 1.0 - here;',
				'		float clear = (1.0 - solidAt(here + to * 0.33)) * (1.0 - solidAt(here + to * 0.66));',
				'		float w = near.x * near.y * near.z * (clear * clear + 0.002);',
				'		sum += texelFetch(uProbes, ivec2(int(q.x) + int(q.y) * 32, int(q.z) + block * 32), 0) * w;',
				'		total += w;',
				'	}',
				'	outColor = sum / max(total, 0.0001);',
				'}'
			].join('\n'),

			/*
			 * What is round the eye, for what mirrors it and is not on the screen (Mirror of SceneLighting): a ray from the eye
			 * through the voxels for each texel of an octahedral map (uEye: the eye in voxels); what it meets, the light of the
			 * face it came in by (alpha 1), nothing: none (alpha 0, the mirror puts its sky there). Its mipmaps are the blur of
			 * what is rough.
			 */
			Around: head + [
				'uniform vec3 uEye;',
				'uniform float uSide;',
				'out vec4 outColor;',
				grid,
				march,
				'void main() {',
				'	vec2 o = gl_FragCoord.xy / uSide * 2.0 - 1.0;',
				'	vec3 way = vec3(o.x, 1.0 - abs(o.x) - abs(o.y), o.y);',
				'	if (way.y < 0.0) way.xz = (1.0 - abs(way.zx)) * vec2(way.x >= 0.0 ? 1.0 : -1.0, way.z >= 0.0 ? 1.0 : -1.0);',
				'	vec4 hit = march(uEye, normalize(way));',
				'	outColor = hit.a >= 0.0 ? vec4(hit.rgb, 1.0) : vec4(0.0);',
				'}'
			].join('\n'),

			/*
			 * The probes again: those of this phase from their rays (spherical harmonics of the first band, one of red, green and
			 * blue in each third of the texture), mixed with what they had, faster while they are young; a probe in a wall takes
			 * the mean of its neighbours that are not. The rest as they were, moved with the grid (uShift: probes). Info: [the
			 * part of its rays that started in a wall, its age, the mean way to what its rays met].
			 */
			Reduce: head + [
				'uniform sampler2D uRays;',
				'uniform sampler2D uOld;',
				'uniform sampler2D uOldInfo;',
				'uniform mat3 uTurn;',
				'uniform float uPhase;',
				'uniform float uSubset;',
				'uniform float uRayCount;',
				'uniform vec3 uShift;',
				'uniform float uFresh;',
				'layout(location = 0) out vec4 outColor;',
				'layout(location = 1) out vec4 outInfo;',
				grid,
				'ivec2 probeTexel(ivec3 p, int channel) {',
				'	return ivec2(p.x + p.y * 32, p.z + channel * 32);',
				'}',
				'bool inside(ivec3 p) {',
				'	return all(greaterThanEqual(p, ivec3(0))) && all(lessThan(p, ivec3(32, 16, 32)));',
				'}',
				'void main() {',
				'	ivec2 f = ivec2(gl_FragCoord.xy);',
				'	int channel = f.y / 32;',
				'	ivec3 p = ivec3(f.x % 32, f.x / 32, f.y % 32);',
				'	ivec3 was = p + ivec3(uShift);',
				'	bool kept = uFresh < 0.5 && inside(was);',
				'	vec4 old = kept ? texelFetch(uOld, probeTexel(was, channel), 0) : vec4(0.0);',
				'	vec4 oldInfo = kept ? texelFetch(uOldInfo, probeTexel(was, 0), 0) : vec4(0.0);',
				'	if (p.z % int(uSubset) != int(uPhase)) {',
				'		outColor = old;',
				'		outInfo = oldInfo;',
				'		return;',
				'	}',
				'	int total = int(uRayCount);',
				'	int row = (p.z / int(uSubset)) * total;',
				'	vec4 sum = vec4(0.0);',
				'	float walled = 0.0;',
				'	float far = 0.0;',
				'	float met = 0.0;',
				'	for (int r = 0; r < 64; r++) {',
				'		if (r >= total) break;',
				'		vec4 ray = texelFetch(uRays, ivec2(f.x, row + r), 0);',
				'		if (ray.a < 0.0) {',
				'			walled += 1.0;',
				'			continue;',
				'		}',
				'		vec3 way = rayWay(r, total, uTurn);',
				'		float light = channel == 0 ? ray.r : channel == 1 ? ray.g : ray.b;',
				'		sum += light * vec4(0.282095, 0.488603 * way.y, 0.488603 * way.z, 0.488603 * way.x);',
				'		if (ray.a < 9999.0) {',
				'			far += ray.a;',
				'			met += 1.0;',
				'		}',
				'	}',
				'	float open = float(total) - walled;',
				'	vec4 made = open > 0.0 ? sum * 12.566371 / open : vec4(0.0);',
				'	float part = walled / float(total);',
				/* In a wall: what the neighbours not in one had. */
				'	if (part > 0.3) {',
				'		vec4 near = vec4(0.0);',
				'		float found = 0.0;',
				'		for (int i = 0; i < 6; i++) {',
				'			ivec3 d = i == 0 ? ivec3(1, 0, 0) : i == 1 ? ivec3(-1, 0, 0) : i == 2 ? ivec3(0, 1, 0) : i == 3 ? ivec3(0, -1, 0) : i == 4 ? ivec3(0, 0, 1) : ivec3(0, 0, -1);',
				'			ivec3 q = was + d;',
				'			if (!kept || !inside(q)) continue;',
				'			vec4 info = texelFetch(uOldInfo, probeTexel(q, 0), 0);',
				'			if (info.x > 0.3 || info.y < 1.0) continue;',
				'			near += texelFetch(uOld, probeTexel(q, channel), 0);',
				'			found += 1.0;',
				'		}',
				'		made = found > 0.0 ? near / found : old;',
				'	}',
				'	float age = min(oldInfo.y + 1.0, 60.0);',
				'	outColor = kept ? mix(old, made, max(1.0 / age, 0.12)) : made;',
				'	outInfo = vec4(part, age, met > 0.0 ? far / met : 64.0, 1.0);',
				'}'
			].join('\n')
		};
	}
});
