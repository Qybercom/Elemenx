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
 * it, cracks, stones; neutral, a ground tints its beds by their height).
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

		function define (name, group, metres, params, code) {
			self.Define(name, {Title: name, Group: group, Metres: metres, Size: 1024, Params: params, Code: code.join('\n')});
		}

		/*
		 * A lawn seen from over it, as a photograph of one: blades crowded in layers, the lower ones in the shade of those over
		 * them, light tips, tufts lighter and darker, blades gone dry and a few fallen leaves.
		 */
		define('lawn', 'ground', 0.8, {
			Density: {Value: 1, Min: 0.4, Max: 1.6, Title: 'Density'},
			Length: {Value: 1, Min: 0.5, Max: 2, Title: 'Length'},
			Dry: {Value: 0.04, Min: 0, Max: 0.6, Title: 'Dry blades'},
			Leaves: {Value: 0.25, Min: 0, Max: 1, Title: 'Fallen leaves'},
			Tufts: {Value: 0.3, Min: 0, Max: 1, Title: 'Tufts'}
		}, [
			'	float tuft = tex_fbm(uv, 3.0, 4, seed + 1.0);',
			'	float tint = tex_fbm(uv, 5.0, 3, seed + 2.0);',
			'	c = vec3(0.012, 0.03, 0.006);',
			'	h = 0.0;',
			'	ao = 0.35;',
			'	r = 0.9;',
			'	for (int layer = 0; layer < 7; layer++) {',
			'		float k = float(layer) / 6.0;',
			'		float cells = floor(46.0 * p_Density + float(layer) * 3.0);',
			'		vec4 b = tex_blades(uv, cells, 1.9 * p_Length * (0.8 + 0.4 * tuft), 0.13, tint * 6.2831853, 1.0, seed + float(layer) * 7.0);',
			'		if (b.x <= 0.0) continue;',
			'		float dry = step(1.0 - p_Dry, fract(b.z * 7.13));',
			'		vec3 deep = mix(vec3(0.025, 0.09, 0.012), vec3(0.04, 0.12, 0.015), b.z);',
			'		vec3 lit = mix(vec3(0.1, 0.32, 0.03), vec3(0.16, 0.42, 0.04), b.z);',
			'		vec3 tip = mix(vec3(0.32, 0.6, 0.08), vec3(0.45, 0.68, 0.14), b.z);',
			'		vec3 blade = tex_ramp(clamp(k * 0.75 + b.y * 0.35, 0.0, 1.0), deep, lit, tip);',
			/* Its midrib: lighter along its middle, darker at its edges, as a blade turned to the light. */
			'		blade *= 0.82 + 0.3 * (1.0 - abs(b.w));',
			'		blade = mix(blade, vec3(0.42, 0.36, 0.14) * (0.6 + 0.5 * b.y + 0.3 * k), dry * 0.85);',
			'		blade *= mix(1.0, 0.72 + 0.56 * tuft, p_Tufts);',
			'		c = mix(c, blade, b.x);',
			'		h = mix(h, (float(layer) + 0.4 + 0.6 * (1.0 - b.y)) / 7.0, b.x);',
			'		ao = mix(ao, 0.45 + 0.55 * k, b.x);',
			'		r = mix(r, 0.75 - dry * 0.1, b.x);',
			'	}',
			/* Fallen leaves, over the blades: an oval along its own way, its vein darker, brown to orange. */
			'	vec2 lp = uv * 9.0;',
			'	for (int y = -1; y <= 1; y++) {',
			'		for (int x = -1; x <= 1; x++) {',
			'			vec2 cell = floor(lp) + vec2(float(x), float(y));',
			'			if (tex_hash(cell, 9.0, seed + 40.0) >= p_Leaves * 0.3) continue;',
			'			vec2 mid = cell + tex_hash2(cell, 9.0, seed + 41.0);',
			'			float a = tex_hash(cell, 9.0, seed + 42.0) * 6.2831853;',
			'			vec2 d = vec2(cos(a), sin(a));',
			'			vec2 q = lp - mid;',
			'			float size = 0.1 + 0.08 * tex_hash(cell, 9.0, seed + 43.0);',
			'			vec2 e = vec2(dot(q, d), dot(q, vec2(-d.y, d.x))) / vec2(size, size * 0.55);',
			'			float oval = length(e);',
			'			float edge = 1.0 - smoothstep(0.9, 1.0, oval);',
			'			if (edge <= 0.0) continue;',
			'			vec3 brown = mix(vec3(0.3, 0.12, 0.04), vec3(0.62, 0.3, 0.08), tex_hash(cell, 9.0, seed + 44.0));',
			'			brown *= 1.0 - (1.0 - smoothstep(0.0, 0.08, abs(e.y))) * 0.35 * step(-1.0, e.x);',
			'			c = mix(c, brown * (0.85 + 0.25 * (1.0 - oval)), edge);',
			'			h = mix(h, 1.0, edge);',
			'			ao = mix(ao, 1.0, edge);',
			'			r = mix(r, 0.6, edge);',
			'		}',
			'	}'
		]);

		/*
		 * Soil with grass on it here and there (Cover: how much of it), as by a path or a lot left alone: sandy grey soil,
		 * its grains and pebbles, patches of short grass and rosettes of weeds.
		 */
		define('grassy-soil', 'ground', 2, {
			Cover: {Value: 0.55, Min: 0, Max: 1, Title: 'Cover'},
			Weeds: {Value: 0.5, Min: 0, Max: 1, Title: 'Weeds'},
			Pebbles: {Value: 0.4, Min: 0, Max: 1, Title: 'Pebbles'}
		}, [
			'	float grain = tex_noise(uv * 512.0, 512.0, seed + 1.0);',
			'	float clod = tex_fbm(uv, 12.0, 4, seed + 2.0);',
			'	c = mix(vec3(0.36, 0.31, 0.24), vec3(0.5, 0.44, 0.34), clod) * (0.86 + 0.28 * grain);',
			'	h = clod * 0.25;',
			'	r = 0.95;',
			'	ao = 0.85 + 0.15 * clod;',
			/* Pebbles: cells of a few centimetres, a few of them showing. */
			'	vec2 warp = vec2(tex_noise(uv * 90.0, 90.0, seed + 12.0), tex_noise(uv * 90.0, 90.0, seed + 13.0)) - 0.5;',
			'	vec4 peb = tex_cells(uv + warp * 0.004, 55.0, seed + 3.0);',
			'	float pebSize = 0.12 + 0.3 * fract(peb.z * 13.7);',
			'	float stone = (1.0 - smoothstep(pebSize - 0.04, pebSize + 0.02, peb.x)) * step(1.0 - p_Pebbles * 0.25, peb.z);',
			'	vec3 pebColor = mix(mix(vec3(0.33, 0.3, 0.27), vec3(0.58, 0.55, 0.5), peb.w), vec3(0.5, 0.36, 0.26), step(0.8, fract(peb.w * 7.1)));',
			'	c = mix(c, pebColor * (0.75 + 0.45 * (1.0 - peb.x / pebSize)), stone);',
			'	h = mix(h, 0.3 + 0.25 * (1.0 - peb.x / pebSize), stone);',
			/* Where grass is: its mask, with fringes. */
			'	float mask = tex_fbm(uv, 4.0, 5, seed + 4.0);',
			'	float grow = smoothstep(1.0 - p_Cover - 0.06, 1.0 - p_Cover + 0.06, mask + (tex_noise(uv * 64.0, 64.0, seed + 5.0) - 0.5) * 0.12);',
			'	for (int layer = 0; layer < 4; layer++) {',
			'		float k = float(layer) / 3.0;',
			'		vec4 b = tex_blades(uv, 70.0 + float(layer) * 6.0, 1.6, 0.14, k * 2.0, 1.0, seed + 10.0 + float(layer) * 7.0);',
			'		float here = b.x * grow * step(0.15 + 0.5 * (1.0 - grow), fract(b.z * 3.7 + k));',
			'		vec3 blade = tex_ramp(clamp(k * 0.6 + b.y * 0.5, 0.0, 1.0), vec3(0.06, 0.14, 0.03), vec3(0.2, 0.38, 0.08), vec3(0.42, 0.55, 0.18));',
			'		blade = mix(blade, vec3(0.5, 0.46, 0.3), step(0.8, fract(b.z * 11.0)) * 0.7);',
			'		c = mix(c, blade, here);',
			'		h = mix(h, 0.28 + 0.04 * float(layer) + 0.04 * (1.0 - b.y), here);',
			'		ao = mix(ao, 0.6 + 0.4 * k, here);',
			'		r = mix(r, 0.8, here);',
			'	}',
			/* Rosettes of weeds: leaves round a middle, broad and light green. */
			'	vec4 ros = tex_cells(uv, 14.0, seed + 6.0);',
			'	if (ros.z < p_Weeds * 0.7 * (0.4 + 0.6 * grow)) {',
			'		vec2 p = uv * 14.0;',
			'		vec2 centre = floor(p) + tex_hash2(floor(p), 14.0, seed + 6.0);',
			'		float best = 0.0;',
			'		for (int y = -1; y <= 1; y++) {',
			'			for (int x = -1; x <= 1; x++) {',
			'				vec2 cell = floor(p) + vec2(float(x), float(y));',
			'				vec2 mid = cell + tex_hash2(cell, 14.0, seed + 6.0);',
			'				if (tex_hash(cell, 14.0, seed + 6.0 + 3.1) >= p_Weeds * 0.7 * (0.4 + 0.6 * grow)) continue;',
			'				vec2 q = p - mid;',
			'				float a = atan(q.y, q.x);',
			'				float count = 5.0 + floor(tex_hash(cell, 14.0, seed + 8.0) * 5.0);',
			'				float petal = pow(abs(sin(a * count * 0.5 + tex_hash(cell, 14.0, seed + 9.0) * 6.2831853)), 1.4);',
			'				float reach = 0.24 + 0.2 * tex_hash(cell, 14.0, seed + 10.0);',
			'				float along = length(q) / reach;',
			'				float leafy = (1.0 - smoothstep(petal * (1.0 - along * 0.6) - 0.08, petal * (1.0 - along * 0.6), 0.25 + along * 0.35)) * step(along, 1.0);',
			'				best = max(best, leafy * (0.55 + 0.45 * along));',
			'			}',
			'		}',
			'		c = mix(c, mix(vec3(0.1, 0.22, 0.05), vec3(0.3, 0.46, 0.12), best), step(0.01, best));',
			'		h = mix(h, 0.3 + 0.15 * best, step(0.01, best));',
			'		ao = mix(ao, 0.75 + 0.25 * best, step(0.01, best));',
			'	}'
		]);

		/*
		 * Asphalt: the stones of its aggregate in a dark binder, some polished light by the wheels, fine pores, patches worn
		 * lighter, cracks sealed with tar and stains of oil.
		 */
		define('asphalt', 'road', 2, {
			Wear: {Value: 0.25, Min: 0, Max: 1, Title: 'Wear'},
			Cracks: {Value: 0, Min: 0, Max: 1, Title: 'Sealed cracks'},
			Stains: {Value: 0.3, Min: 0, Max: 1, Title: 'Stains'}
		}, [
			'	vec4 agg = tex_cells(uv, 260.0, seed + 1.0);',
			'	vec4 fine = tex_cells(uv, 640.0, seed + 11.0);',
			'	float binder = smoothstep(0.12, 0.3, agg.y - agg.x) * step(0.35, agg.w);',
			'	float sand = smoothstep(0.1, 0.25, fine.y - fine.x) * step(0.5, fine.w) * (1.0 - binder);',
			'	float pore = step(0.93, tex_noise(uv * 700.0, 700.0, seed + 2.0));',
			'	vec3 stone = mix(vec3(0.13, 0.13, 0.13), vec3(0.34, 0.33, 0.31), agg.z * agg.z) * mix(vec3(1.0), vec3(1.1, 1.0, 0.9), step(0.85, agg.w));',
			'	c = mix(vec3(0.045, 0.045, 0.05), stone, binder);',
			'	c = mix(c, vec3(0.16, 0.155, 0.15) * (0.7 + 0.6 * fine.z), sand * 0.8);',
			'	h = binder * (0.4 + 0.3 * agg.z);',
			'	r = mix(0.95, 0.82, binder);',
			'	ao = mix(0.6, 1.0, binder);',
			'	c *= 1.0 - pore * 0.6;',
			'	h -= pore * 0.2;',
			/* Worn by the wheels: lighter and smoother in patches. */
			'	float worn = tex_fbm(uv, 6.0, 4, seed + 3.0);',
			'	float w = smoothstep(0.45, 0.75, worn) * p_Wear;',
			'	c = mix(c, c * 1.35 + 0.03, w);',
			'	r -= w * 0.1;',
			/* Cracks sealed with tar: thin dark lines of large cells, shining a little. */
			'	vec4 big = tex_cells(uv + vec2(tex_noise(uv * 24.0, 24.0, seed + 4.0), tex_noise(uv * 24.0, 24.0, seed + 5.0)) * 0.02, 3.0, seed + 6.0);',
			'	float crack = (1.0 - smoothstep(0.012, 0.03, big.y - big.x)) * step(1.0 - p_Cracks, big.z);',
			'	c = mix(c, vec3(0.03, 0.03, 0.035), crack);',
			'	r = mix(r, 0.45, crack);',
			'	h = mix(h, 0.55, crack);',
			/* Stains of oil: dark soft spots. */
			'	float stain = smoothstep(0.62, 0.8, tex_fbm(uv, 4.0, 4, seed + 7.0)) * p_Stains;',
			'	c *= 1.0 - stain * 0.45;',
			'	r -= stain * 0.2;'
		]);

		/*
		 * Paving of concrete blocks, 20 by 10 cm, laid across the way (uv.y along it) in rows, each row half a block on from
		 * the last: their edges bevelled, sand in the joints and moss in some, each block a tone of its own, worn and stained
		 * in patches.
		 */
		define('paving', 'road', 1, {
			Tones: {Value: 0.35, Min: 0, Max: 1, Title: 'Tones'},
			Moss: {Value: 0.2, Min: 0, Max: 1, Title: 'Moss in the joints'},
			Wear: {Value: 0.3, Min: 0, Max: 1, Title: 'Wear'}
		}, [
			'	vec2 g = uv * vec2(5.0, 10.0);',
			'	float row = floor(g.y);',
			'	g.x += mod(row, 2.0) * 0.5;',
			'	vec2 cell = vec2(mod(floor(g.x), 5.0), row);',
			'	vec2 f = fract(g);',
			'	vec2 e = min(f, 1.0 - f) * vec2(0.2, 0.1);',
			'	float edge = min(e.x, e.y);',
			'	float joint = 1.0 - smoothstep(0.0025, 0.0045, edge);',
			'	float bevel = smoothstep(0.002, 0.008, edge);',
			'	float id = tex_hash(cell, 100.0, seed + 1.0);',
			'	float id2 = tex_hash(cell, 100.0, seed + 2.0);',
			'	float grain = tex_noise(uv * 400.0, 400.0, seed + 3.0) * 0.6 + tex_noise(uv * 130.0, 130.0, seed + 4.0) * 0.4;',
			'	vec3 block = mix(vec3(0.5, 0.49, 0.47), mix(vec3(0.42, 0.4, 0.38), vec3(0.58, 0.5, 0.44), id2), p_Tones * step(0.5, id)) * (0.88 + 0.2 * id);',
			'	c = block * (0.86 + 0.24 * grain);',
			'	h = 0.55 * bevel + grain * 0.04;',
			'	r = 0.9 - 0.06 * id;',
			'	ao = mix(0.55, 1.0, bevel);',
			/* The joints: sand, and moss in some of them. */
			'	float moss = smoothstep(0.55, 0.75, tex_fbm(uv, 4.0, 4, seed + 5.0)) * p_Moss;',
			'	vec3 fill = mix(vec3(0.11, 0.1, 0.085), vec3(0.08, 0.12, 0.04), moss);',
			'	c = mix(c, fill * (0.7 + 0.5 * grain), joint);',
			'	r = mix(r, 1.0, joint);',
			/* Worn lighter where most feet go, stained darker in spots. */
			'	float worn = smoothstep(0.45, 0.8, tex_fbm(uv, 3.0, 4, seed + 6.0)) * p_Wear;',
			'	c = mix(c, c * 1.15 + 0.02, worn * (1.0 - joint));',
			'	float stain = smoothstep(0.65, 0.85, tex_fbm(uv, 5.0, 4, seed + 7.0)) * p_Wear;',
			'	c *= 1.0 - stain * 0.3;'
		]);

		/* Laid in rows: drawn as it is, no hexagons shifted over it. */
		this.Defined.paving.Rows = true;

		/*
		 * A dirt road, earth trodden hard: its grains and clods, small stones pressed into it and some loose on it, a fine
		 * crust cracked where it dried, darker damp hollows and a little dust lighter over the rest.
		 */
		define('dirt', 'road', 2, {
			Stones: {Value: 0.5, Min: 0, Max: 1, Title: 'Stones'},
			Cracks: {Value: 0.3, Min: 0, Max: 1, Title: 'Dry cracks'},
			Damp: {Value: 0.3, Min: 0, Max: 1, Title: 'Damp hollows'}
		}, [
			'	float grain = tex_noise(uv * 520.0, 520.0, seed + 1.0) * 0.5 + tex_noise(uv * 170.0, 170.0, seed + 2.0) * 0.3 + tex_noise(uv * 48.0, 48.0, seed + 3.0) * 0.2;',
			'	float lumps = tex_fbm(uv, 12.0, 4, seed + 4.0);',
			'	vec3 earth = mix(vec3(0.36, 0.28, 0.2), vec3(0.52, 0.42, 0.31), lumps);',
			'	c = earth * (0.8 + 0.4 * grain);',
			'	h = 0.4 + lumps * 0.25 + grain * 0.08;',
			'	r = 0.95;',
			'	ao = 0.8 + 0.2 * lumps;',
			/* Hollows: darker, damp. */
			'	float hollow = smoothstep(0.62, 0.8, 1.0 - tex_fbm(uv, 3.0, 4, seed + 5.0)) * p_Damp;',
			'	c *= 1.0 - hollow * 0.35;',
			'	r -= hollow * 0.25;',
			'	h -= hollow * 0.15;',
			/* The crust cracked where it dried: thin dark lines of cells, only where it is dry. */
			'	vec4 cr = tex_cells(uv + (vec2(tex_noise(uv * 40.0, 40.0, seed + 6.0), tex_noise(uv * 40.0, 40.0, seed + 7.0)) - 0.5) * 0.02, 14.0, seed + 8.0);',
			'	float crack = (1.0 - smoothstep(0.004, 0.012, cr.y - cr.x)) * p_Cracks * (1.0 - hollow) * step(0.3, cr.z);',
			'	c *= 1.0 - crack * 0.45;',
			'	h -= crack * 0.12;',
			/* Stones: pressed in, grey and ochre, a light rim where the sun catches them. */
			'	vec4 st = tex_cells(uv + (vec2(tex_noise(uv * 90.0, 90.0, seed + 9.0), tex_noise(uv * 90.0, 90.0, seed + 10.0)) - 0.5) * 0.01, 40.0, seed + 11.0);',
			'	float size = 0.15 + 0.3 * fract(st.z * 13.7);',
			'	float stone = (1.0 - smoothstep(size - 0.04, size + 0.01, st.x)) * step(1.0 - p_Stones * 0.5, st.z);',
			'	vec3 rock = mix(vec3(0.42, 0.4, 0.37), vec3(0.6, 0.5, 0.36), st.w) * (0.8 + 0.35 * (1.0 - st.x / size));',
			'	c = mix(c, rock, stone);',
			'	h = mix(h, 0.7 + 0.15 * (1.0 - st.x / size), stone);',
			'	r = mix(r, 0.75, stone);',
			'	ao = mix(ao, 1.0, stone) * (1.0 - (1.0 - stone) * smoothstep(size + 0.01, size + 0.08, st.x) * (1.0 - smoothstep(size + 0.08, size + 0.2, st.x)) * 0.3 * step(1.0 - p_Stones * 0.5, st.z));',
			/* Dust over the dry rest, lighter. */
			'	float dust = smoothstep(0.5, 0.75, tex_fbm(uv, 5.0, 3, seed + 12.0)) * (1.0 - hollow);',
			'	c = mix(c, c * 1.18 + vec3(0.03, 0.025, 0.015), dust * 0.6 * (1.0 - stone));'
		]);

		/*
		 * The face of a cliff of soft rock or of earth cut steep, seen from its side (uv.y up): beds laid one over another,
		 * the harder ones standing out with a shadow under them, gullies the rain cut down it, cracks, and pebbles in it. Its
		 * colors are neutral: a ground tints each bed by its height in the world, so no bed comes back with the tile.
		 */
		define('cliff', 'ground', 3, {
			Beds: {Value: 0.7, Min: 0, Max: 1, Title: 'Beds'},
			Flutes: {Value: 0.6, Min: 0, Max: 1, Title: 'Flutes'},
			Pebbles: {Value: 0.3, Min: 0, Max: 1, Title: 'Pebbles'}
		}, [
			'	float warp = (tex_fbm(vec2(uv.x, 0.5), 2.0, 3, seed + 1.0) - 0.5) * 0.08;',
			'	float y = uv.y + warp;',
			'	float beds = tex_noise(vec2(0.5, y * 7.0), 7.0, seed + 2.0) * 0.6 + tex_noise(vec2(0.5, y * 23.0), 23.0, seed + 3.0) * 0.4;',
			'	float hard = smoothstep(0.5, 0.62, beds) * p_Beds;',
			'	float ledge = smoothstep(0.5, 0.62, tex_noise(vec2(0.5, (y + 0.01) * 7.0), 7.0, seed + 2.0) * 0.6 + tex_noise(vec2(0.5, (y + 0.01) * 23.0), 23.0, seed + 3.0) * 0.4) * p_Beds;',
			'	float flute = tex_fbm(vec2(uv.x, uv.y * 0.12 + warp), 18.0, 3, seed + 4.0);',
			'	float groove = (1.0 - abs(flute * 2.0 - 1.0));',
			'	groove = pow(groove, 2.0) * p_Flutes * (1.0 - hard * 0.5);',
			'	float grain = tex_noise(uv * 300.0, 300.0, seed + 5.0) * 0.6 + tex_noise(uv * 90.0, 90.0, seed + 6.0) * 0.4;',
			'	vec3 tone = mix(vec3(0.48, 0.44, 0.39), vec3(0.86, 0.8, 0.7), smoothstep(0.25, 0.75, beds));',
			'	c = tone * (0.82 + 0.3 * grain);',
			'	h = 0.4 + hard * 0.35 - groove * 0.45 + grain * 0.08;',
			'	r = 0.95;',
			'	ao = 1.0 - groove * 0.45;',
			'	float under = max(0.0, ledge - hard);',
			'	c *= 1.0 - under * 0.6 - groove * 0.4;',
			/* Where it fell off lately: lighter, smoother spalls. */
			'	vec4 sp = tex_cells(uv + vec2(tex_noise(uv * 20.0, 20.0, seed + 12.0)) * 0.03, 9.0, seed + 13.0);',
			'	float spall = (1.0 - smoothstep(0.3, 0.45, sp.x)) * step(0.7, sp.z);',
			'	c = mix(c, c * 1.18 + 0.03, spall);',
			'	h += spall * 0.08;',
			'	ao *= 1.0 - under * 0.55;',
			'	vec4 pb = tex_cells(uv + (vec2(tex_noise(uv * 120.0, 120.0, seed + 10.0), tex_noise(uv * 120.0, 120.0, seed + 11.0)) - 0.5) * 0.012, 22.0, seed + 9.0);',
			'	float size = 0.12 + 0.28 * fract(pb.z * 17.3);',
			'	float stone = (1.0 - smoothstep(size - 0.03, size + 0.01, pb.x)) * step(1.0 - p_Pebbles * 0.35, pb.z);',
			'	vec3 rock = mix(vec3(0.38, 0.36, 0.33), vec3(0.6, 0.55, 0.47), pb.w) * (0.75 + 0.4 * (1.0 - pb.x / size));',
			'	c = mix(c, rock, stone);',
			'	h = mix(h, 0.62 + 0.08 * smoothstep(0.0, 0.6, 1.0 - pb.x / size), stone);',
			'	ao = mix(ao, 1.0, stone);'
		]);
	}
});
