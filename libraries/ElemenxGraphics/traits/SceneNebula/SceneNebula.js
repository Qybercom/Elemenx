/*
 * SceneNebula: the clouds of gas and dust of space, each an object of the kind nebula (trait Nebula) a Scene draws as
 * a volume: a ray through its ball, from outside or from within, the light it gives added, what is behind dimmed as far
 * as its dust hides it (the blend premultiplied of Renderer).
 * - Nebula: Type (hii: a cloud where stars are born, red of hydrogen at its edges, blue-green in its hot heart, torn by
 *   dark lanes; planetary: the shell a dying star puffed off, a ring in two lobes; remnant: what a supernova threw out, a
 *   thin shell of threads, of its Subtype: Ia round and even, red and white; II torn and lopsided, green, red and blue;
 *   Ib and Ic in knots with no hydrogen, blue-green and violet; dark: dust that hides what is behind it), Radius (light
 *   years), Seed, Density (how thick its gas and dust are, 1), Glow (how bright, 1), Colors ('#outer, #inner': its own).
 * Its shape is made once into a block of 64³ (eight by eight slices of 64 in one texture, of its Type, Subtype, Seed and
 * Density) and read along the rays at every frame: the noise is not worked out again for each step of each pixel.
 * NebulaLook(id) gives what it is drawn with ({Type, Subtype, Colors, Dust, Glow, Baked}); its Info (Describe, the card)
 * its kind and its size.
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
		var programs = null;
		var quad = null;
		var blocks = {};

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

		/* What a nebula is drawn with: the colors of its kind (its own Colors over them), how its dust dims, how bright it is. */
		function lookOf (object) {
			var nebula = trait(object, 'Nebula');
			var type = ['hii', 'planetary', 'remnant', 'dark'].indexOf(nebula.Type) !== -1 ? nebula.Type : 'hii';
			var subtype = ['Ia', 'II', 'Ib', 'Ic'].indexOf(nebula.Subtype) !== -1 ? nebula.Subtype : type === 'remnant' ? 'II' : '';
			var palette = {
				hii: [[1, 0.24, 0.34], [0.32, 0.86, 0.82], 2.2],
				planetary: [[0.95, 0.3, 0.38], [0.36, 0.8, 1], 0.6],
				remnant: {Ia: [[1, 0.38, 0.32], [0.86, 0.9, 1], 0.4], II: [[1, 0.3, 0.26], [0.36, 1, 0.6], 0.8], Ib: [[0.62, 0.42, 1], [0.32, 0.92, 0.86], 0.7], Ic: [[0.7, 0.36, 1], [0.4, 0.75, 1], 0.7]}[subtype],
				dark: [[0.16, 0.09, 0.06], [0.3, 0.18, 0.1], 9]
			}[type];
			var colors = String(nebula.Colors || '').split(',');

			return {
				Type: type,
				Subtype: subtype,
				Colors: [colorOf(colors[0], palette[0]), colorOf(colors[1], palette[1])],
				Dust: palette[2] * number(nebula.Density, 1),
				Glow: number(nebula.Glow, 1),
				Key: [type, subtype, nebula.Seed || object.ID, number(nebula.Density, 1)].join(':')
			};
		}

		/* The block of its shape, made once of what makes it (none made again while the look stays). */
		function blockOf (object, look) {
			var nebula = trait(object, 'Nebula');
			var block = blocks[object.ID];
			if (block && block.Key === look.Key) return block;

			if (block)
				block.Target.Destroy();

			block = blocks[object.ID] = {Key: look.Key, Target: renderer.Target(512, 512, {}), Done: false};
			block.Seed = self.$Service('Random').Sequence(String(nebula.Seed || object.ID))() * 1000;

			return block;
		}

		function bake (block, look) {
			var done;

			block.Target.Begin();

			renderer.Viewport(0, 0, 512, 512);
			renderer.Clear([0, 0, 0, 0]);

			done = engine.DrawReady(quad, programs.Bake, {uType: ['hii', 'planetary', 'remnant', 'dark'].indexOf(look.Type), uSubtype: Math.max(0, ['Ia', 'II', 'Ib', 'Ic'].indexOf(look.Subtype)), uSeed: block.Seed, uDensity: Math.min(3, look.Dust / 2)}, {Depth: false, DepthWrite: false, Cull: 'none'});

			block.Target.End();

			/* Regression of its kind (SceneGalaxy): a draw skipped while its program is made is no block. */
			block.Done = done !== false;
		}

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

		/* In the part of the depth its middle is in, after all that stands: each nebula through its ball. */
		engine.NebulaDraw = function (matrix, later, planes) {
			var any = scene.Active.some(function (object) {
				return !!trait(object, 'Nebula');
			});
			if (!renderer || !any || scene.Ground) return;

			programs = programs || {Bake: renderer.Program(self.$Service('Renderer').Shaders.Quad, self.NebulaBakeShader(head, self.$Service('Renderer').Chunks.Noise)), March: renderer.Program(self.NebulaVertex(head), self.NebulaShader(head))};
			quad = quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			scene.Active.forEach(function (object) {
				var far;
				var radius;
				var inside;

				if (!trait(object, 'Nebula') || !object.World || object.Hidden) return;

				far = vectors.Distance(object.World, scene.Camera.Position);
				radius = object.Size;
				inside = far < radius * 1.02;

				if (planes && !inside && (far < planes[0] || far >= planes[1])) return;

				/* Within it: once, in the far part (the one drawn first), so what is near stands over it. */
				if (planes && inside && planes[1] < scene.Camera.Far * 0.999) return;

				/* Before the halos of the stars: they shine through it. */
				later.unshift(function () {
					var look = lookOf(object);
					var block = blockOf(object, look);
					var eye = scene.Eye || [0, 0, 0];
					var center = vectors.Subtract(object.World, eye);
					var front = vectors.Scale(vectors.Normalize(center), Math.max(0, vectors.Length(center) - radius));
					var depth = -1;
					var at;

					if (!block.Done) {
						bake(block, look);

						if (!block.Done) return;

						scene.Rest = 0;
					}

					/* The quad at the depth of its nearest point: what stands before the nebula hides it, what is in it does not. */
					if (!inside) {
						at = [matrix[0] * front[0] + matrix[4] * front[1] + matrix[8] * front[2] + matrix[12], matrix[2] * front[0] + matrix[6] * front[1] + matrix[10] * front[2] + matrix[14], matrix[3] * front[0] + matrix[7] * front[1] + matrix[11] * front[2] + matrix[15]];
						depth = at[2] > 1e-9 ? Math.max(-1, Math.min(0.9999, at[1] / at[2])) : -1;
					}

					engine.DrawReady(quad, programs.March, {uDepth: depth, uInverse: math.Invert(matrix), uViewport: [renderer.Width, renderer.Height], uCenter: center, uRadius: radius, uBlock: block.Target.Textures[0], uColorA: look.Colors[0], uColorB: look.Colors[1], uDust: look.Dust, uGlow: look.Glow, uDark: look.Type === 'dark' ? 1 : 0, uSteps: self.Quality === 'low' ? 40 : 64}, {Blend: 'premultiplied', Depth: !inside, DepthWrite: false, Cull: 'none'});
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
			'out vec4 outColor;',
			noise,
			'void main() {',
			'	vec2 texel = floor((vQuad * 0.5 + 0.5) * 512.0);',
			'	vec2 tile = floor(texel / 64.0);',
			'	vec3 cell = vec3(mod(texel, 64.0), tile.y * 8.0 + tile.x);',
			'	vec3 p = (cell + 0.5) / 64.0 * 2.0 - 1.0;',
			'	vec3 s = vec3(uSeed, uSeed * 0.61, uSeed * 1.37);',
			'	float r = length(p);',
			'	float gas = 0.0;',
			'	float inner = 0.0;',
			'	float dust = 0.0;',
			'	if (uType == 0) {',
			/* A cloud where stars are born: torn edges, a hollow its young stars blew in its middle, dark lanes across. */
			'		vec3 q = p + (vec3(fbm3(p * 1.3 + s, 3), fbm3(p * 1.3 + s + 7.1, 3), fbm3(p * 1.3 + s + 3.3, 3)) - 0.5) * 0.7;',
			'		float body = fbm3(q * 2.4 + s, 5);',
			'		float fall = smoothstep(1.0, 0.35, length(q));',
			'		gas = max(0.0, body - 0.36) * 2.8 * fall * smoothstep(0.02, 0.22, r);',
			'		inner = clamp(1.25 - length(q) * 1.7, 0.0, 1.0);',
			'		dust = smoothstep(0.55, 0.72, ridge3(q * 3.2 + s * 1.7, 4)) * fall * 1.2 + gas * 0.25;',
			'	}',
			'	else if (uType == 1) {',
			/* A shell puffed off in two lobes along its axis (y), its rim brightest, a faint glow within, knots in its rim. */
			'		vec3 e = p / vec3(0.62, 0.95, 0.62);',
			'		float knots = fbm3(p * 5.0 + s, 4);',
			'		float shell = length(e) + (knots - 0.5) * 0.18 - 0.68;',
			'		float waist = 1.0 - 0.55 * exp(-p.y * p.y * 30.0);',
			'		gas = exp(-shell * shell * 160.0) * (0.55 + 0.9 * knots) * waist * 1.6 + exp(-r * r * 9.0) * 0.35;',
			'		inner = clamp(1.0 - length(e) * 1.25, 0.0, 1.0);',
			'		dust = exp(-shell * shell * 220.0) * 0.12;',
			'	}',
			'	else if (uType == 2) {',
			/* What a supernova threw: a thin shell of threads; Ia round and even, II torn and lopsided, Ib and Ic in knots. */
			'		float lopsided = uSubtype == 0 ? 0.08 : 0.32;',
			'		vec3 q = p + (vec3(fbm3(p * 1.6 + s, 3), fbm3(p * 1.6 + s + 5.0, 3), fbm3(p * 1.6 + s + 9.0, 3)) - 0.5) * lopsided * 2.0;',
			'		float threads = ridge3(q * (uSubtype == 0 ? 7.0 : 5.0) + s, 5);',
			'		float shell = length(q) - (uSubtype == 0 ? 0.82 : 0.72);',
			'		float thin = uSubtype == 0 ? 90.0 : 45.0;',
			'		gas = exp(-shell * shell * thin) * pow(threads, 3.0) * 1.0;',
			'		if (uSubtype >= 2) gas *= smoothstep(0.5, 0.7, fbm3(q * 6.0 + s, 3)) * 4.3;',
			'		inner = clamp(fbm3(q * 3.0 + s + 2.0, 3) * 1.6 - 0.5, 0.0, 1.0);',
			/* A core-collapse leaves a pulsar: the blue glow of its wind in the middle of II, Ib and Ic. */
			'		if (uSubtype >= 1) { gas += exp(-r * r * 60.0) * 0.6 * fbm3(p * 9.0 + s, 3); inner = max(inner, exp(-r * r * 40.0)); }',
			'		dust = gas * 0.1;',
			'	}',
			'	else {',
			/* Dust that hides what is behind: a cloud thick in its heart, wisps at its edge. */
			'		vec3 q = p + (vec3(fbm3(p * 1.4 + s, 3), fbm3(p * 1.4 + s + 6.0, 3), fbm3(p * 1.4 + s + 2.0, 3)) - 0.5) * 0.8;',
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
			'out vec4 outColor;',
			/* The block read at a point of -1 to 1: two slices, each smooth, the one between them mixed. */
			'vec4 block(vec3 p) {',
			'	vec3 u = clamp(p * 0.5 + 0.5, 0.0, 1.0) * 63.0;',
			'	float z0 = floor(u.z);',
			'	float z1 = min(63.0, z0 + 1.0);',
			'	vec2 inTile = (clamp(u.xy, 0.5, 62.5) + 0.5) / 512.0;',
			'	vec2 a = (vec2(mod(z0, 8.0), floor(z0 / 8.0)) * 64.0) / 512.0 + inTile;',
			'	vec2 b = (vec2(mod(z1, 8.0), floor(z1 / 8.0)) * 64.0) / 512.0 + inTile;',
			'	return mix(texture(uBlock, a), texture(uBlock, b), u.z - z0);',
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
			'	for (int i = 0; i < 64; i++) {',
			'		if (i >= uSteps || pass < 0.01) break;',
			'		vec3 p = (o + d * (t0 + (float(i) + 0.5) * dt) - uCenter) / uRadius;',
			'		vec4 v = block(p);',
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
