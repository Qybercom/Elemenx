/*
 * SceneTextures: textures of materials made of code once and kept as pictures, as sharp as they are near and as smooth as they
 * are far: baked on the graphics card into tiles that repeat with no seam (every noise of a recipe has a whole number of its
 * cells across the tile), with their mipmaps and seen at a slant without a blur (anisotropic filtering).
 *
 * A recipe is {Title, Group (ground, road, build, other), Metres (the side of its tile in metres of the world), Size (texels
 * across, 1024), Rows (true: laid in rows, sampled as it is, with no hexagons), Params ({Name: {Value, Min, Max,
 * Title}}: what a lab or a game turns, uniforms p_<Name> of its code), Code}.
 * Code is the body of a function of GLSL over uv (vec2, 0 to 1 across the tile), px (float: a texel in uv) and seed
 * (float), writing c (vec3: the color, linear), r (roughness), h (height, 0 to 1) and ao (how much light reaches it, 0 to 1).
 * Its helpers repeat at the tile: tex_hash(cell, period, seed) and tex_hash2, tex_noise(p, period, seed) (value noise of
 * period cells), tex_fbm(uv, period, octaves, seed), tex_cells(uv, period, seed) ({f1, f2, id, id2} of the nearest cells),
 * tex_blades(uv, cells, length, width, way, spread, seed) ({cover, along, id, lean}: blades of grass seen from over them,
 * each from a root of a cell, as long as length in cells; along 0 at its root, 1 at its tip), tex_line(q, a, b) (the
 * distance to a segment) and tex_ramp(t, a, b, c) (three colors along t).
 *
 * - Define(name, recipe), Get(name), Has(name), Names(group).
 * - Bake(renderer, name, params): the tile on that renderer ({Color: albedo in sRGB with roughness in a, Surface: the normal
 *   xy, the height and the light reached, Metres, Size, Name}), made once for the same params (its own, Seed, and Size: the
 *   texels across, smaller for a quick look); Forget(renderer, name) drops it.
 * - Array(renderer, names, params): the tiles of names as the layers of two textures ({Color, Surface, Layers: {name: index},
 *   Metres: {name: metres}}), for a ground of many materials: one sampler each, however many materials; params {name:
 *   {param: value}}. Made again only when one of its tiles is.
 * - Chunk(layered): the GLSL of tex_sample(Color, Surface, place, metres, spin, ...) (spin 1: each hexagon turns the tile its
 *   own way, for what has no way of its own; 0: only shifted, for beds and flutes that must stay level and upright; below 0:
 *   the tile as it is, no hexagons, for blocks laid in rows) a ground samples a tile with: a grid of hexagons
 *   over the ground, each with the tile turned and shifted its own way, the three round a point blended by their heights
 *   (hex-tiling), and patches of metres of the place itself, so no repeat shows at any distance. Layered: tex_sample_layer
 *   (Color, Surface, layer, place, metres, ...) of the textures of Array.
 * - Source(name): the fragment shader that bakes a recipe (to read, or to check).
 * Built in: lawn (a dense lawn of blades, light and dark tufts, dry blades and fallen leaves as params say), grassy-soil
 * (sandy soil with patches of grass and rosettes of weeds, its Cover from 0 to 1), asphalt (stones of its aggregate in
 * the binder, worn patches, sealed cracks and stains), paving (concrete blocks in rows across the way, bevelled,
 * sand and moss in the joints, tones, wear), dirt (earth trodden hard: grains, stones, dry cracks, damp hollows, dust),
 * cliff (the face of a cliff of soft rock or earth seen from its side: beds and their ledges, flutes the rain cut down
 * it, cracks, stones; neutral, a ground tints its beds by their height). They are resources, texture graphs of a block
 * GLSL each and its Params as parameters (blueprints/textures, ElemenxGraphics/textures/<name>): an Application gives one
 * of that name in its place.
 */
Elemenx.Service('SceneTextures', {
	$Meta: {
		Description: 'Textures of materials made of code and baked once into tiles that repeat with no seam, with mipmaps and anisotropic filtering.',
		Methods: ['Define(name, recipe)', 'Get(name)', 'Has(name)', 'Names(group)', 'Bake(renderer, name, params)', 'Array(renderer, names, params)', 'Forget(renderer, name)', 'Chunk(layered)', 'Source(name)']
	},

	$OnCreate: function () {
		if (!this.Defined || !Object.keys(this.Defined).length)
			this.Library();
	},

	Defined: {},

	Define: function (name, recipe) {
		if (!name || !recipe || typeof recipe.Code !== 'string')
			throw new Error('Elemenx SceneTextures: a texture needs a name and its Code');

		this.Defined[name] = Object.assign({Title: name, Group: 'other', Metres: 1, Size: 1024, Params: {}}, recipe);

		return name;
	},

	Get: function (name) {
		return this.Defined[name] || null;
	},

	Has: function (name) {
		return !!this.Defined[name];
	},

	Names: function (group) {
		var self = this;

		return Object.keys(this.Defined).filter(function (name) {
			return !group || self.Defined[name].Group === group;
		});
	},

	/* The helpers of a recipe: each repeats at the tile, by a whole number of its cells across it. */
	Helpers: [
		'uint tex_pcg(uvec2 v) {',
		'	v = v * 1664525u + 1013904223u;',
		'	v.x += v.y * 1664525u;',
		'	v.y += v.x * 1664525u;',
		'	v = v ^ (v >> 16u);',
		'	v.x += v.y * 1664525u;',
		'	v.y += v.x * 1664525u;',
		'	v = v ^ (v >> 16u);',
		'	return v.x ^ v.y;',
		'}',
		'float tex_hash(vec2 cell, float period, float seed) {',
		'	vec2 c = mod(floor(cell), period);',
		'	return float(tex_pcg(uvec2(ivec2(c)) + uvec2(uint(seed * 977.0), uint(seed * 131.0) + 7u)) & 16777215u) / 16777215.0;',
		'}',
		'vec2 tex_hash2(vec2 cell, float period, float seed) {',
		'	return vec2(tex_hash(cell, period, seed), tex_hash(cell, period, seed + 17.31));',
		'}',
		'float tex_noise(vec2 p, float period, float seed) {',
		'	vec2 i = floor(p);',
		'	vec2 f = fract(p);',
		'	vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
		'	float a = tex_hash(i, period, seed);',
		'	float b = tex_hash(i + vec2(1.0, 0.0), period, seed);',
		'	float c = tex_hash(i + vec2(0.0, 1.0), period, seed);',
		'	float d = tex_hash(i + vec2(1.0, 1.0), period, seed);',
		'	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
		'}',
		/* Octaves of noise over the tile: period cells across it, twice as many each octave. */
		'float tex_fbm(vec2 uv, float period, int octaves, float seed) {',
		'	float sum = 0.0;',
		'	float weight = 0.5;',
		'	float total = 0.0;',
		'	float cells = period;',
		'	for (int i = 0; i < 8; i++) {',
		'		if (i >= octaves) break;',
		'		sum += tex_noise(uv * cells, cells, seed + float(i) * 13.7) * weight;',
		'		total += weight;',
		'		weight *= 0.5;',
		'		cells *= 2.0;',
		'	}',
		'	return sum / total;',
		'}',
		/* Cells round points, one a cell: the distance to the nearest and the next one, and two hashes of the nearest. */
		'vec4 tex_cells(vec2 uv, float period, float seed) {',
		'	vec2 p = uv * period;',
		'	vec2 i = floor(p);',
		'	float f1 = 8.0;',
		'	float f2 = 8.0;',
		'	vec2 near = vec2(0.0);',
		'	for (int y = -1; y <= 1; y++) {',
		'		for (int x = -1; x <= 1; x++) {',
		'			vec2 cell = i + vec2(float(x), float(y));',
		'			vec2 at = cell + tex_hash2(cell, period, seed);',
		'			float d = length(p - at);',
		'			if (d < f1) {',
		'				f2 = f1;',
		'				f1 = d;',
		'				near = cell;',
		'			}',
		'			else if (d < f2) f2 = d;',
		'		}',
		'	}',
		'	return vec4(f1, f2, tex_hash(near, period, seed + 3.1), tex_hash(near, period, seed + 5.7));',
		'}',
		'float tex_line(vec2 q, vec2 a, vec2 b) {',
		'	vec2 ab = b - a;',
		'	float t = clamp(dot(q - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);',
		'	return length(q - a - ab * t);',
		'}',
		'vec3 tex_ramp(float t, vec3 a, vec3 b, vec3 c) {',
		'	return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, t * 2.0 - 2.0 * 0.5);',
		'}',
		/*
		 * Blades of grass seen from over them: a root in each cell (cells across the tile), a blade along way (radians) turned
		 * by up to spread, length in cells, width in cells at its root, narrowing to its tip and bent a little. The one on top
		 * of all those over the point: {cover (0 to 1, smooth at its edge), along (0 root to 1 tip), id, lean}.
		 */
		'vec4 tex_blades(vec2 uv, float cells, float len, float width, float way, float spread, float seed) {',
		'	vec2 p = uv * cells;',
		'	vec2 i = floor(p);',
		'	vec4 best = vec4(0.0, 0.0, 0.0, 0.0);',
		'	float top = -1.0;',
		'	float soft = 1.5 / (1024.0 / cells);',
		'	for (int y = -2; y <= 2; y++) {',
		'		for (int x = -2; x <= 2; x++) {',
		'			vec2 cell = i + vec2(float(x), float(y));',
		'			vec2 h = tex_hash2(cell, cells, seed);',
		'			float h3 = tex_hash(cell, cells, seed + 9.13);',
		'			float h4 = tex_hash(cell, cells, seed + 21.7);',
		'			vec2 root = cell + h;',
		'			float a = way + (h3 - 0.5) * spread * 6.2831853;',
		'			float l = len * (0.55 + 0.9 * h4);',
		'			vec2 d = vec2(cos(a), sin(a));',
		'			vec2 side = vec2(-d.y, d.x);',
		'			vec2 q = p - root;',
		'			float t = dot(q, d) / l;',
		'			if (t < 0.0 || t > 1.0) continue;',
		'			float bend = (h3 - 0.5) * 0.12 * l * t * t;',
		'			float off = abs(dot(q, side) - bend);',
		'			float w = width * (0.6 + 0.8 * h.x) * (t < 0.7 ? 1.0 - t * 0.25 : (1.0 - t) / 0.3 * 0.825);',
		'			float cover = 1.0 - smoothstep(w - soft, w + soft, off);',
		'			float rank = h4 + t * 0.15;',
		'			if (cover > 0.01 && rank > top) {',
		'				top = rank;',
		'				best = vec4(cover, t, h3, (dot(q, side) - bend) / max(w, 1e-4));',
		'			}',
		'		}',
		'	}',
		'	return best;',
		'}'
	].join('\n'),

	/* The fragment shader that bakes a recipe: its color and roughness, its normal, height and light reached, in two outputs. */
	Source: function (name) {
		var recipe = this.Get(name);
		var params;

		if (!recipe) return '';

		params = Object.keys(recipe.Params || {}).map(function (key) {
			return 'uniform float p_' + key + ';';
		});

		return [
			'#version 300 es',
			'precision highp float;',
			'precision highp int;',
			'in vec2 vQuad;',
			'uniform float uSeed;',
			'uniform float uPixel;',
			'layout(location = 0) out vec4 outColor;',
			'layout(location = 1) out vec4 outSurface;'
		].concat(params, [
			this.Helpers,
			'void tex_recipe(vec2 uv, float px, float seed, inout vec3 c, inout float r, inout float h, inout float ao) {',
			recipe.Code,
			'}',
			'void main() {',
			'	vec2 uv = vQuad * 0.5 + 0.5;',
			'	vec3 c = vec3(0.5);',
			'	float r = 0.8;',
			'	float h = 0.0;',
			'	float ao = 1.0;',
			'	tex_recipe(uv, uPixel, uSeed, c, r, h, ao);',
			'	outColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)), clamp(r, 0.0, 1.0));',
			'	outSurface = vec4(0.5, 0.5, clamp(h, 0.0, 1.0), clamp(ao, 0.0, 1.0));',
			'}'
		]).join('\n');
	},

	/* The second pass of a bake: the normal of the height, across a texel each way; the tile wraps, so its edges match. */
	Normals: [
		'#version 300 es',
		'precision highp float;',
		'in vec2 vQuad;',
		'uniform sampler2D uHeight;',
		'uniform float uSize;',
		'out vec4 outSurface;',
		'float height(ivec2 at) {',
		'	int size = int(uSize);',
		'	return texelFetch(uHeight, ivec2((at.x + size) % size, (at.y + size) % size), 0).b;',
		'}',
		'void main() {',
		'	ivec2 at = ivec2(gl_FragCoord.xy);',
		'	vec4 here = texelFetch(uHeight, at, 0);',
		'	float dx = height(at + ivec2(1, 0)) - height(at - ivec2(1, 0));',
		'	float dy = height(at + ivec2(0, 1)) - height(at - ivec2(0, 1));',
		'	vec3 n = normalize(vec3(-dx, -dy, 2.0 / uSize * 120.0 * (uSize / 1024.0)));',
		'	outSurface = vec4(n.xy * 0.5 + 0.5, here.b, here.a);',
		'}'
	].join('\n'),

	/* The tiles baked, of each renderer: {key: {Key, Made}}. */
	Baked: typeof WeakMap === 'function' ? new WeakMap() : null,

	Bake: function (renderer, name, params) {
		var recipe = this.Get(name);
		var kept;
		var key;
		var values;
		var target;
		var gl;
		var slant;
		var size;

		if (!recipe || !renderer) return null;

		values = {};

		Object.keys(recipe.Params || {}).forEach(function (param) {
			var given = params && params[param] !== undefined && params[param] !== null && params[param] !== '' ? Number(params[param]) : Number(recipe.Params[param].Value);

			values[param] = isNaN(given) ? 0 : given;
		});

		size = Number(params && params.Size) || Number(recipe.Size) || 1024;
		key = name + ':' + JSON.stringify(values) + ':' + (params && params.Seed !== undefined ? params.Seed : 1) + ':' + size;
		kept = this.Baked ? this.Baked.get(renderer) : renderer.TexturesBaked;

		if (!kept) {
			kept = {};

			if (this.Baked) this.Baked.set(renderer, kept);
			else renderer.TexturesBaked = kept;
		}

		if (kept[name] && kept[name].Key === key) return kept[name].Made;

		if (kept[name])
			this.Forget(renderer, name);

		gl = renderer.GL;
		target = renderer.Target(size, size, {Colors: 2});

		var uniforms = {uSeed: params && params.Seed !== undefined ? Number(params.Seed) || 0 : 1, uPixel: 1 / size};

		Object.keys(values).forEach(function (param) {
			uniforms['p_' + param] = values[param];
		});

		target.Begin();

		kept.Quad = kept.Quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

		renderer.Draw(kept.Quad, renderer.Program(this.$Service('Renderer').Shaders.Quad, this.Source(name)), uniforms, {Depth: false, DepthWrite: false, Cull: 'none'});

		target.End();

		/* The normals of its height, in a target of their own. */
		var surface = renderer.Target(size, size, {});

		surface.Begin();

		renderer.Draw(kept.Quad, renderer.Program(this.$Service('Renderer').Shaders.Quad, this.Normals), {uHeight: target.Textures[1], uSize: size}, {Depth: false, DepthWrite: false, Cull: 'none'});

		surface.End();

		/* Tiles that repeat, with their mipmaps, sharp at a slant. */
		slant = gl.getExtension('EXT_texture_filter_anisotropic');

		[target.Textures[0], surface.Textures[0]].forEach(function (texture) {
			gl.bindTexture(gl.TEXTURE_2D, texture.Handle);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.generateMipmap(gl.TEXTURE_2D);

			if (slant)
				gl.texParameterf(gl.TEXTURE_2D, slant.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(slant.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
		});

		kept[name] = {Key: key, Made: {Key: key, Name: name, Color: target.Textures[0], Surface: surface.Textures[0], Metres: Number(recipe.Metres) || 1, Size: size, Target: target, Targets: [target, surface]}};

		return kept[name].Made;
	},

	Array: function (renderer, names, params) {
		var self = this;
		var kept = this.Baked ? this.Baked.get(renderer) : renderer && renderer.TexturesBaked;
		var made = (names || []).filter(function (name) {
			return self.Has(name);
		}).map(function (name) {
			return self.Bake(renderer, name, params && params[name]);
		});
		var key = made.map(function (one) {
			return one.Key;
		}).join('|');
		var gl;
		var size;
		var slant;
		var arrays;

		if (!made.length) return null;

		kept = this.Baked ? this.Baked.get(renderer) : renderer.TexturesBaked;

		if (kept.Arrays && kept.Arrays[key]) return kept.Arrays[key];

		gl = renderer.GL;
		size = made[0].Size;
		slant = gl.getExtension('EXT_texture_filter_anisotropic');
		arrays = {Key: key, Layers: {}, Metres: {}, Color: {Handle: gl.createTexture()}, Surface: {Handle: gl.createTexture()}};

		[arrays.Color, arrays.Surface].forEach(function (array, which) {
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, array.Handle);
			gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(size)) + 1, gl.RGBA8, size, size, made.length);

			made.forEach(function (one, layer) {
				var target = which ? one.Targets[1] : one.Targets[0];

				target.Begin();

				gl.readBuffer(gl.COLOR_ATTACHMENT0);
				gl.bindTexture(gl.TEXTURE_2D_ARRAY, array.Handle);
				gl.copyTexSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, 0, 0, Math.min(size, one.Size), Math.min(size, one.Size));

				target.End();
			});

			gl.bindTexture(gl.TEXTURE_2D_ARRAY, array.Handle);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.generateMipmap(gl.TEXTURE_2D_ARRAY);

			if (slant)
				gl.texParameterf(gl.TEXTURE_2D_ARRAY, slant.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(slant.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
		});

		made.forEach(function (one, layer) {
			arrays.Layers[one.Name] = layer;
			arrays.Metres[one.Name] = one.Metres;
		});

		/*
		 * Regression: only the last array was kept, the one before dropped without its textures given back. Two grounds of
		 * other materials asked in turn (a planet near and the ground of a location, as a ship hovers over it) made two
		 * arrays a frame (some 20 MB each), till the card had no memory left and lost the context. The last few are kept
		 * now, by their materials; one older than those is given back.
		 */
		kept.Arrays = kept.Arrays || {};
		kept.ArrayOrder = kept.ArrayOrder || [];
		kept.Arrays[key] = arrays;

		kept.ArrayOrder.push(key);

		while (kept.ArrayOrder.length > 6) {
			var old = kept.Arrays[kept.ArrayOrder.shift()];

			delete kept.Arrays[old.Key];

			gl.deleteTexture(old.Color.Handle);
			gl.deleteTexture(old.Surface.Handle);
		}

		return arrays;
	},

	Forget: function (renderer, name) {
		var kept = this.Baked ? this.Baked.get(renderer) : renderer && renderer.TexturesBaked;
		if (!kept || !kept[name]) return;

		kept[name].Made.Targets.forEach(function (target) {
			target.Destroy();
		});

		delete kept[name];
	},

	/*
	 * How a ground samples a tile: two layers of it, the second turned by about a third of a turn and shifted, blended by a
	 * noise of the place over a few metres, so the eye finds no grid of tiles. tex_sample(color, surface, place (metres on
	 * the ground), metres (the side of the tile)) gives {albedo (linear), roughness} in out values and the normal in a tangent
	 * of the ground (z up), its height and the light reached.
	 */
	Chunk: function (layered) {
		var lines = [
			'float tex_blend(vec2 place) {',
			'	vec2 i = floor(place);',
			'	vec2 f = fract(place);',
			'	vec2 u = f * f * (3.0 - 2.0 * f);',
			'	float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);',
			'	float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);',
			'	float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);',
			'	float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);',
			'	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
			'}',
			/* The corners of the triangle of a grid of hexagons a point is in, and its weights in them (Mikkelsen, hex-tiling). */
			'void tex_hexes(vec2 st, out vec3 w, out vec2 v1, out vec2 v2, out vec2 v3) {',
			'	vec2 skew = mat2(1.0, 0.0, -0.57735027, 1.15470054) * st * 3.4641016;',
			'	vec2 base = floor(skew);',
			'	vec3 t = vec3(fract(skew), 0.0);',
			'	t.z = 1.0 - t.x - t.y;',
			'	float s = step(0.0, -t.z);',
			'	float s2 = 2.0 * s - 1.0;',
			'	w = vec3(-t.z * s2, s - t.y * s2, s - t.x * s2);',
			'	v1 = base + vec2(s, s);',
			'	v2 = base + vec2(s, 1.0 - s);',
			'	v3 = base + vec2(1.0 - s, s);',
			'}',
			'vec2 tex_spot(vec2 v) {',
			'	return fract(sin(vec2(dot(v, vec2(127.1, 311.7)), dot(v, vec2(269.5, 183.3)))) * 43758.5453);',
			'}',
			/* One piece of the tile, as a hexagon has it: turned and shifted its own way, sampled with the slopes of the place. */
			'void tex_piece(sampler2D color, sampler2D surface, vec2 uv, vec2 dx, vec2 dy, vec2 v, float spin, out vec4 c, out vec4 s) {',
			'	vec2 r = tex_spot(v);',
			'	float a = r.x * 6.2831853 * spin;',
			'	mat2 turn = mat2(cos(a), -sin(a), sin(a), cos(a));',
			'	vec2 at = turn * uv + r * 7.31;',
			'	c = textureGrad(color, at, turn * dx, turn * dy);',
			'	s = textureGrad(surface, at, turn * dx, turn * dy);',
			'	vec2 n = transpose(turn) * (s.xy * 2.0 - 1.0);',
			'	s.xy = n * 0.5 + 0.5;',
			'}',
			/*
			 * How a ground samples a tile, so the eye finds no repeat at any distance: a grid of hexagons over the ground, each
			 * with the tile turned and shifted its own way, the three round a point blended by their heights (a blade over the
			 * other, not a ghost of both); and what is larger than a tile (lighter and darker patches of metres) of the place
			 * itself, never of the tile.
			 */
			'void tex_sample(sampler2D color, sampler2D surface, vec2 place, float metres, float spin, out vec3 albedo, out float rough, out vec3 normal, out float height, out float light) {',
			'	vec2 uv = place / metres;',
			'	vec2 dx = dFdx(uv);',
			'	vec2 dy = dFdy(uv);',
			'	vec4 c;',
			'	vec4 s;',
			/* Below 0: the tile as it is, for what is laid in rows (paving), which a hexagon shifted would break. */
			'	if (spin < 0.0) {',
			'		vec2 at = uv;',
			'		c = textureGrad(color, at, dx, dy);',
			'		s = textureGrad(surface, at, dx, dy);',
			'	}',
			'	else {',
			'		vec3 w;',
			'		vec2 v1;',
			'		vec2 v2;',
			'		vec2 v3;',
			'		tex_hexes(uv / 1.6, w, v1, v2, v3);',
			'		vec4 c1;',
			'		vec4 c2;',
			'		vec4 c3;',
			'		vec4 s1;',
			'		vec4 s2;',
			'		vec4 s3;',
			'		tex_piece(color, surface, uv, dx, dy, v1, spin, c1, s1);',
			'		tex_piece(color, surface, uv, dx, dy, v2, spin, c2, s2);',
			'		tex_piece(color, surface, uv, dx, dy, v3, spin, c3, s3);',
			'		vec3 k = pow(max(w, 0.0), vec3(8.0)) * exp(vec3(s1.b, s2.b, s3.b) * 5.0);',
			'		k /= k.x + k.y + k.z;',
			'		c = c1 * k.x + c2 * k.y + c3 * k.z;',
			'		s = s1 * k.x + s2 * k.y + s3 * k.z;',
			'	}',
			'	vec2 n = s.xy * 2.0 - 1.0;',
			/* Patches of the place: a few metres and tens of metres, lighter and darker, a little warmer where lighter. */
			'	float m = tex_blend(place / 4.3) * 0.5 + tex_blend(place / 13.7 + 3.1) * 0.35 + tex_blend(place / 37.0 + 7.7) * 0.15;',
			'	albedo = pow(c.rgb, vec3(2.2)) * (0.86 + 0.28 * m) * mix(vec3(0.97, 1.0, 1.04), vec3(1.04, 1.0, 0.94), m);',
			'	rough = c.a;',
			'	normal = normalize(vec3(n, sqrt(max(0.0, 1.0 - dot(n, n)))));',
			'	height = s.b;',
			'	light = s.a;',
			'}'
		];
		var text = lines.join('\n');

		/* The same, of the layers of a texture of Array: sampler2DArray, and the layer beside each place. */
		if (layered)
			text = text.replace(/void tex_piece\(sampler2D color, sampler2D surface,/, 'void tex_piece_layer(sampler2DArray color, sampler2DArray surface, float layer,').replace(/textureGrad\((color|surface), at,/g, 'textureGrad($1, vec3(at, layer),').replace(/void tex_sample\(sampler2D color, sampler2D surface,/, 'void tex_sample_layer(sampler2DArray color, sampler2DArray surface, float layer,').replace(/tex_piece\(color, surface,/g, 'tex_piece_layer(color, surface, layer,').replace(/(float tex_blend|void tex_hexes|vec2 tex_spot)\(/g, '$1_layer(').replace(/(tex_blend|tex_hexes|tex_spot)\(/g, '$1_layer(').replace(/_layer_layer\(/g, '_layer(');

		return text;
	},

	/* SceneTextures: the library */

	Library: function () {
		var self = this;
		var prefix = 'ElemenxGraphics/textures/';

		/*
		 * Its recipes: the texture graphs of its resources (blueprints/textures, named ElemenxGraphics/textures/<name>), each
		 * its block GLSL (pattern: the body of tex_recipe), its parameters the Params a lab turns and what it is (texture:
		 * Title, Group, Metres, Size, Rows, its Order among them); one an Application gives of that name takes its place.
		 */
		Elemenx.Resources('Blueprints').filter(function (name) {
			return name.indexOf(prefix) === 0;
		}).map(function (name) {
			return Elemenx.Resources('Blueprints', name);
		}).sort(function (a, b) {
			return (a.texture && a.texture.Order || 0) - (b.texture && b.texture.Order || 0);
		}).forEach(function (graph) {
			var pattern = graph.blocks.filter(function (block) {
				return block.type === 'GLSL';
			})[0];
			var code = pattern ? pattern.properties.filter(function (property) {
				return property.key === 'Code';
			})[0] : null;
			var meta = graph.texture || {};
			var params = {};

			(graph.parameters || []).forEach(function (parameter) {
				params[parameter.key] = {Value: parameter.value, Min: parameter.min, Max: parameter.max, Title: parameter.comment || parameter.key};
			});

			self.Define(graph.name, Object.assign({Title: meta.Title || graph.name, Group: meta.Group || 'other', Metres: meta.Metres || 1, Size: meta.Size || 1024, Params: params}, meta.Rows ? {Rows: true} : {}, {Code: code ? String(code.value) : ''}));
		});
	}
});
