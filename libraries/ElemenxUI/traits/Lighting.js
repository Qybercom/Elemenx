/*
 * Lighting: what a GameScene does with its light after it drew. It draws into a texture of floats, so a sun can be far
 * brighter than white, and makes the picture of it: the air between the eye and what it sees (Fog of the distance),
 * rays of the sun through what stands before it, the darkening of corners (ambient occlusion), the glow of what is too
 * bright (bloom), and a filmic curve (ACES) that keeps the colors of highlights.
 *
 * The bounce of the sun: the view of a map from the sun, in colors and a few times a second, is blurred into a texture
 * every surface reads, so a shadow on a meadow turns green and a wall by a sunny field is lit from below (one bounce, as
 * far as the shadows reach).
 *
 * Quality: low, medium, high or ultra; empty chooses by the graphics card and steps down while frames are late.
 * - low: no picture after the drawing, one shadow, the masses nearer.
 * - medium: bloom, the air, edges smoothed (4 samples).
 * - high: two shadow maps, rays, ambient occlusion at half size, the bounce, water that mirrors what is on the screen, and
 *   frames that add up (TAA: the view shakes by less than a pixel, and each frame is mixed with the last), so what is
 *   thin, as grass, does not shimmer.
 * - ultra: ambient occlusion at full size, the masses farther.
 *
 * Colors in the texture are encoded by a gamma of 2.2, as the shaders of the scene write them; the picture decodes them.
 */
Elemenx.Trait('Lighting', {
	Quality: '',

	LightingStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var graphics = this.$Service('Graphics3D');
		var shaders = this.LightingShaders(graphics);
		var state = {Width: 0, Height: 0, Level: '', Scene: null, Bloom: [], Dark: null, Soft: null, Programs: null, Late: 0, Frames: 0, Step: 0};
		var levels = ['low', 'medium', 'high', 'ultra'];
		var sets = {
			low: {Post: false, Cascades: 1, Bounce: false, Occlusion: 0, Rays: false, Samples: 0, Reach: 0.6},
			medium: {Post: true, Cascades: 1, Bounce: false, Occlusion: 0, Rays: false, Samples: 4, Reach: 0.8},
			high: {Post: true, Cascades: 2, Bounce: true, Occlusion: 0.5, Rays: true, Samples: 4, Reach: 1, Mirror: true, Frames: true},
			ultra: {Post: true, Cascades: 2, Bounce: true, Occlusion: 1, Rays: true, Samples: 4, Reach: 1.4, Mirror: true, Frames: true}
		};

		state.Floats = !!renderer.GL.getExtension('EXT_color_buffer_float');

		/* A guess by the name of the graphics card: the frames correct it. */
		function guess () {
			var gl = renderer.GL;
			var info = gl.getExtension('WEBGL_debug_renderer_info');
			var name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
			if (/Adreno|Mali|PowerVR|Apple A|Intel|UHD|SwiftShader|llvmpipe/i.test(name)) return 'medium';

			return 'high';
		}

		function level () {
			var wanted = String(self.Quality || '').toLowerCase();

			/* A picture needs a texture of floats to draw into. */
			if (!state.Floats) return 'low';

			if (sets[wanted]) return wanted;

			if (!state.Level)
				state.Level = guess();

			return state.Level;
		}

		this.Graphics = function () {
			return Object.assign({Level: level()}, sets[level()]);
		};

		this.ScatterReach = function () {
			return sets[level()].Reach;
		};

		function programs () {
			if (!state.Programs) {
				state.Programs = {
					Down: renderer.Program(graphics.Shaders.Quad, shaders.Down),
					Up: renderer.Program(graphics.Shaders.Quad, shaders.Up),
					Dark: renderer.Program(graphics.Shaders.Quad, shaders.Dark),
					Soft: renderer.Program(graphics.Shaders.Quad, shaders.Soft),
					Picture: renderer.Program(graphics.Shaders.Quad, shaders.Picture),
					Frames: renderer.Program(graphics.Shaders.Quad, shaders.Frames)
				};
			}

			return state.Programs;
		}

		function destroy () {
			[state.Scene, state.Dark, state.Soft, state.Now, state.Before].concat(state.Bloom).forEach(function (target) {
				if (target)
					target.Destroy();
			});

			state.Scene = null;
			state.Dark = null;
			state.Soft = null;
			state.Now = null;
			state.Before = null;
			state.Past = null;
			state.Bloom = [];
		}

		/* The textures, as large as the view, again when it changed. */
		function prepare (set) {
			var width = renderer.Width;
			var height = renderer.Height;
			var key = width + ':' + height + ':' + set.Samples + ':' + set.Occlusion;
			var i;

			if (state.Key === key) return;

			destroy();

			state.Key = key;
			state.Scene = renderer.Target(width, height, {Float: true, DepthTexture: true, Samples: set.Samples});

			for (i = 1; i <= 4; i++)
				state.Bloom.push(renderer.Target(Math.max(1, width >> i), Math.max(1, height >> i), {Float: true}));

			if (set.Occlusion) {
				state.Dark = renderer.Target(Math.max(1, Math.round(width * set.Occlusion)), Math.max(1, Math.round(height * set.Occlusion)));
				state.Soft = renderer.Target(state.Dark.Width, state.Dark.Height);
			}

			if (set.Frames) {
				state.Now = renderer.Target(width, height, {Float: true});
				state.Before = renderer.Target(width, height, {Float: true});
			}
		}

		/* A shake of less than a pixel of a view, another each frame: the steps of Halton's sequence. */
		function halton (index, base) {
			var result = 0;
			var fraction = 1 / base;
			var at = index;

			while (at > 0) {
				result += fraction * (at % base);
				at = Math.floor(at / base);
				fraction /= base;
			}

			return result;
		}

		engine.PostJitter = function (projection) {
			var set = sets[level()];
			var shaken = projection.slice();

			if (!set.Frames || !renderer.Width) return projection;

			state.Step = state.Step % 8 + 1;

			shaken[8] += (halton(state.Step, 2) - 0.5) * 2 / renderer.Width;
			shaken[9] += (halton(state.Step, 3) - 0.5) * 2 / renderer.Height;

			return shaken;
		};

		/* What was drawn so far, to read while the water is drawn over it. */
		engine.PostMiddle = function () {
			if (!sets[level()].Mirror) return null;

			state.Scene.End();
			state.Scene.Begin();

			return {Color: state.Scene.Textures[0], Depth: state.Scene.Depth};
		};

		/* Before anything of a frame is drawn: into the texture of floats. */
		engine.PostBegin = function () {
			var set = sets[level()];
			if (!set.Post) return false;

			prepare(set);

			state.Scene.Begin();

			return true;
		};

		function pass (target, program, uniforms) {
			if (target) target.Begin();
			else renderer.Viewport(0, 0, renderer.Width, renderer.Height);

			renderer.Draw(scene.PostQuad, program, uniforms, {Depth: false, DepthWrite: false, Cull: 'none'});

			if (target)
				target.End();
		}

		/*
		 * After all was drawn: the picture of it. view {Matrix (of the view, the eye at the origin), Sun, SunColor, Air, Fog
		 * (how thick the air is), Sky (true: there is a sky to see the sun in)}.
		 */
		engine.PostEnd = function (view) {
			var set = sets[level()];
			var run = programs();
			var inverse = graphics.Invert(view.Matrix);
			var color = state.Scene.Textures[0];
			var depth = state.Scene.Depth;
			var sun = view.Sun || [0, 1, 0];
			var spot = graphics.Apply(view.Matrix, sun);
			var rays = view.Sky && set.Rays && sun[1] > 0.02 ? 1 : 0;
			var i;

			state.Scene.End();

			if (!scene.PostQuad)
				scene.PostQuad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			/* This frame with the ones before it, where they are now. */
			if (set.Frames && view.Eye) {
				pass(state.Now, run.Frames, {uColor: color, uDepth: depth, uPast: state.Past ? state.Past.Textures[0] : color, uInverse: inverse, uMatrix: state.PastMatrix || view.Matrix, uMoved: state.PastEye ? graphics.Vectors.Subtract(view.Eye, state.PastEye) : [0, 0, 0], uMix: state.Past ? 0.88 : 0, uPixel: [1 / renderer.Width, 1 / renderer.Height]});

				color = state.Now.Textures[0];

				state.Past = state.Now;
				state.Now = state.Before;
				state.Before = state.Past;
				state.PastMatrix = view.Matrix;
				state.PastEye = view.Eye.slice();
			}

			pass(state.Bloom[0], run.Down, {uColor: color, uPixel: [1 / renderer.Width, 1 / renderer.Height], uThreshold: 1});

			for (i = 1; i < state.Bloom.length; i++)
				pass(state.Bloom[i], run.Down, {uColor: state.Bloom[i - 1].Textures[0], uPixel: [1 / state.Bloom[i - 1].Width, 1 / state.Bloom[i - 1].Height], uThreshold: 0});

			for (i = state.Bloom.length - 1; i > 0; i--)
				pass(state.Bloom[i - 1], run.Up, {uColor: state.Bloom[i].Textures[0], uPixel: [1 / state.Bloom[i].Width, 1 / state.Bloom[i].Height]});

			if (state.Dark && view.Sky) {
				pass(state.Dark, run.Dark, {uDepth: depth, uInverse: inverse, uMatrix: view.Matrix, uReach: view.Reach || 2, uSeed: scene.Frames = (scene.Frames || 0) + 1});
				pass(state.Soft, run.Soft, {uColor: state.Dark.Textures[0], uDepth: depth, uPixel: [1 / state.Dark.Width, 1 / state.Dark.Height]});
			}

			pass(null, run.Picture, {
				uColor: color,
				uDepth: depth,
				uBloom: state.Bloom[0].Textures[0],
				uDark: state.Dark && view.Sky ? state.Soft.Textures[0] : scene.White || color,
				uDarkOn: state.Dark && view.Sky ? 1 : 0,
				uInverse: inverse,
				uSun: sun,
				uSunColor: view.SunColor || [1, 1, 1],
				uAir: view.Air || [0, 0, 0, 0],
				uFog: view.Fog || 0,
				uRays: rays,
				uSpot: [spot[0] * 0.5 + 0.5, spot[1] * 0.5 + 0.5, spot[2]],
				uParallel: scene.Camera.Ortho ? 1 : 0
			});
		};

		/* Frames late for long: a level down, while nobody asked for one. */
		engine.PostTime = function (elapsed) {
			if (self.Quality || !elapsed) return;

			state.Late = elapsed > 0.03 ? state.Late + 1 : Math.max(0, state.Late - 1);

			if (state.Late > 90 && levels.indexOf(level()) > 0) {
				state.Level = levels[levels.indexOf(level()) - 1];
				state.Late = 0;
			}
		};

		engine.PostDestroy = destroy;
	},

	LightingShaders: function () {
		var head = '#version 300 es\nprecision highp float;\n';

		return {
			/* A step down: the mean of four, of what is too bright the first time. */
			Down: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform vec2 uPixel;',
				'uniform float uThreshold;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 c = vec3(0.0);',
				'	c += texture(uColor, uv + uPixel * vec2(-1.0, -1.0)).rgb;',
				'	c += texture(uColor, uv + uPixel * vec2(1.0, -1.0)).rgb;',
				'	c += texture(uColor, uv + uPixel * vec2(-1.0, 1.0)).rgb;',
				'	c += texture(uColor, uv + uPixel * vec2(1.0, 1.0)).rgb;',
				'	c *= 0.25;',
				'	if (uThreshold > 0.0) {',
				'		c = pow(max(c, vec3(0.0)), vec3(2.2));',
				'		float bright = max(c.r, max(c.g, c.b));',
				'		c *= smoothstep(uThreshold * 0.8, uThreshold * 1.6, bright);',
				'	}',
				'	outColor = vec4(min(c, vec3(40.0)), 1.0);',
				'}'
			].join('\n'),

			/* A step up: the glow of a smaller texture over the larger one. */
			Up: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 c = texture(uColor, uv).rgb * 4.0;',
				'	c += texture(uColor, uv + uPixel * vec2(1.0, 0.0)).rgb * 2.0 + texture(uColor, uv - uPixel * vec2(1.0, 0.0)).rgb * 2.0;',
				'	c += texture(uColor, uv + uPixel * vec2(0.0, 1.0)).rgb * 2.0 + texture(uColor, uv - uPixel * vec2(0.0, 1.0)).rgb * 2.0;',
				'	c += texture(uColor, uv + uPixel).rgb + texture(uColor, uv - uPixel).rgb + texture(uColor, uv + uPixel * vec2(1.0, -1.0)).rgb + texture(uColor, uv + uPixel * vec2(-1.0, 1.0)).rgb;',
				'	outColor = vec4(c / 16.0 * 0.85, 1.0);',
				'}'
			].join('\n'),

			/* A frame mixed with the last one, at the place each point was, and no farther from the colors round it. */
			Frames: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uPast;',
				'uniform mat4 uInverse;',
				'uniform mat4 uMatrix;',
				'uniform vec3 uMoved;',
				'uniform float uMix;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 color = texture(uColor, uv).rgb;',
				'	vec3 low = color;',
				'	vec3 high = color;',
				'	for (int y = -1; y <= 1; y++) {',
				'		for (int x = -1; x <= 1; x++) {',
				'			vec3 near = texture(uColor, uv + vec2(float(x), float(y)) * uPixel).rgb;',
				'			low = min(low, near);',
				'			high = max(high, near);',
				'		}',
				'	}',
				'	vec4 p = uInverse * vec4(vQuad, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	vec4 q = uMatrix * vec4(p.xyz / p.w + uMoved, 1.0);',
				'	vec2 before = q.xy / q.w * 0.5 + 0.5;',
				'	float inside = step(0.0, before.x) * step(0.0, before.y) * step(before.x, 1.0) * step(before.y, 1.0);',
				'	vec3 past = clamp(texture(uPast, before).rgb, low, high);',
				'	outColor = vec4(mix(color, past, uMix * inside), 1.0);',
				'}'
			].join('\n'),

			/* How much of the sky a point sees: a spiral of samples round it, of the depth. */
			Dark: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uDepth;',
				'uniform mat4 uInverse;',
				'uniform mat4 uMatrix;',
				'uniform float uReach;',
				'uniform float uSeed;',
				'out vec4 outColor;',
				'vec3 place(vec2 uv) {',
				'	vec4 p = uInverse * vec4(uv * 2.0 - 1.0, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	return p.xyz / p.w;',
				'}',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	float depth = texture(uDepth, uv).r;',
				'	if (depth >= 1.0) { outColor = vec4(1.0); return; }',
				'	vec3 p = place(uv);',
				'	vec3 n = normalize(cross(dFdx(p), dFdy(p)));',
				'	if (dot(n, p) > 0.0) n = -n;',
				'	float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
				'	float reach = uReach;',
				'	float dark = 0.0;',
				'	for (int i = 0; i < 10; i++) {',
				'		float t = (float(i) + 0.5) / 10.0;',
				'		float angle = t * 15.0 + noise * 6.2831853;',
				'		vec3 way = vec3(cos(angle), sin(angle), cos(angle * 1.7)) * sqrt(t) * reach;',
				'		if (dot(way, n) < 0.0) way = -way;',
				'		vec3 at = p + way + n * reach * 0.05;',
				'		vec4 s = uMatrix * vec4(at, 1.0);',
				'		vec2 suv = s.xy / s.w * 0.5 + 0.5;',
				'		if (suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) continue;',
				'		vec3 q = place(suv);',
				'		float near = length(q) + reach * 0.03 < length(at) ? 1.0 : 0.0;',
				'		dark += near * smoothstep(reach * 2.0, reach * 0.5, abs(length(q) - length(p)));',
				'	}',
				'	outColor = vec4(vec3(1.0 - dark / 10.0), 1.0);',
				'}'
			].join('\n'),

			/* The dark of a point with its neighbours that are as far: no noise, and edges stay. */
			Soft: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	float depth = texture(uDepth, uv).r;',
				'	float sum = 0.0;',
				'	float weight = 0.0;',
				'	for (int y = -2; y <= 2; y++) {',
				'		for (int x = -2; x <= 2; x++) {',
				'			vec2 at = uv + vec2(float(x), float(y)) * uPixel;',
				'			float w = exp(-abs(texture(uDepth, at).r - depth) * 800.0);',
				'			sum += texture(uColor, at).r * w;',
				'			weight += w;',
				'		}',
				'	}',
				'	outColor = vec4(vec3(sum / max(weight, 0.001)), 1.0);',
				'}'
			].join('\n'),

			Picture: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uBloom;',
				'uniform sampler2D uDark;',
				'uniform float uDarkOn;',
				'uniform mat4 uInverse;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform float uRays;',
				'uniform vec3 uSpot;',
				'uniform float uParallel;',
				'out vec4 outColor;',
				'vec3 aces(vec3 x) {',
				'	return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);',
				'}',
				'vec3 decoded(vec2 uv) {',
				'	return pow(max(texture(uColor, uv).rgb, vec3(0.0)), vec3(2.2));',
				'}',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 color = decoded(uv);',
				'	float depth = texture(uDepth, uv).r;',
				'	vec4 p = uInverse * vec4(vQuad, depth * 2.0 - 1.0, 1.0);',
				'	vec3 place = p.xyz / p.w;',
				'	if (uDarkOn > 0.5 && depth < 1.0) color *= mix(1.0, texture(uDark, uv).r, 0.85);',
				'	if (uFog > 0.0 && depth < 1.0 && uParallel < 0.5) {',
				'		float far = length(place);',
				'		vec3 way = place / far;',
				'		float air = 1.0 - exp(-far * uFog);',
				'		vec3 sky = pow(mix(uAir.rgb, vec3(1.0), 0.4), vec3(2.2)) * clamp(uSun.y * 2.5 + 0.2, 0.05, 1.0);',
				'		sky += uSunColor * pow(max(dot(way, uSun), 0.0), 8.0) * 0.6;',
				'		color = mix(color, sky, air);',
				'	}',
				'	if (uRays > 0.5 && uSpot.z < 1.0 && uParallel < 0.5) {',
				'		vec2 step = (uSpot.xy - uv) / 24.0;',
				'		vec2 at = uv;',
				'		float seen = 0.0;',
				'		for (int i = 0; i < 24; i++) {',
				'			at += step;',
				'			if (at.x > 0.0 && at.y > 0.0 && at.x < 1.0 && at.y < 1.0 && texture(uDepth, at).r >= 1.0) seen += 1.0 - float(i) / 24.0 * 0.4;',
				'		}',
				'		color += uSunColor * seen / 24.0 * 0.18 * smoothstep(0.0, 0.4, 1.0 - distance(uv, uSpot.xy));',
				'	}',
				'	color += texture(uBloom, uv).rgb * 0.5;',
				'	color = aces(color * 0.9);',
				'	float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) / 255.0;',
				'	outColor = vec4(pow(color, vec3(1.0 / 2.2)) + grain, 1.0);',
				'}'
			].join('\n')
		};
	}
});
