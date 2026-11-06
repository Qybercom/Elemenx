/*
 * The library of materials of a Scene: what a surface is made of, drawn by its own pattern of GLSL in metres of the world
 * (no picture: it never repeats, it is sharp as near as the eye comes, and fades to its color where it is too small to see).
 * A material changes the color of a surface (its tint: the color it is given stays its color), its roughness, its metal and
 * its height (metres: the light bends on it). The ground of a Scene is drawn of them (each part of a palette: Sand, Low,
 * High, Rock, Snow, Deep, Road, and what a sketch lays: a road, a beach), a road by the materials of its surfaces, a model by
 * the Pattern of a material of it.
 * - Names(group), Has(name), Get(name), Define(name, material): a material is {Title, Group (ground, road, build or other),
 *   Land (true: the ground may be made of it), Code (the body of a function of GLSL over q (vec2, metres along the surface),
 *   px (float, metres a pixel covers), c (inout vec3: its color), r (inout float: its roughness), m (inout float: its metal)
 *   and h (inout float: its height, metres); helpers enx_mh (a hash of a vec2), enx_mh2, enx_mn (value noise), enx_mf (its
 *   octaves), enx_mc (cells: f1, f2 and two hashes of the nearest) and enx_ms (px, size: 1 where features of size are seen,
 *   0 where they are too small))}. Built in: lawn, soil (moss, leaves, pebbles), gravel (sandy, colored grains), clay
 *   (clods, pits), sand, rock, snow, dirt; asphalt (fresh, grainy), terrazzo (speckled grey), concrete, paving, cobbles,
 *   ballast; brick, stone, plaster, wood, metal, glass, fabric.
 * - Chunk(names): the GLSL of those materials and enx_material(id, q, px, c, r, m, h) drawing the one of index id of names;
 *   enx_bump(position, normal, h) bends a normal by a height (of the derivatives of the screen: called where all pixels go).
 * - Land(names): the GLSL of the materials of a ground (up to 8, its slots) in the shader of the land: landMaterials(place,
 *   px, color, height), each by the weight of it at the corners (vMaterials, vMaterials2), drawn once where it weighs.
 * - LandNames(): the materials a ground may be made of.
 * - Surface(name): a material written by hand for a Blueprint of a material of a model (Blueprints, type material): the
 *   pattern on its body, in metres of it, on the side its normal faces most.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneMaterials', {
	$Meta: {
		Description: 'The library of materials of a Scene: patterns of GLSL in metres of the world, for the ground, roads and models.',
		Methods: ['Names(group)', 'Has(name)', 'Get(name)', 'Define(name, material)', 'Chunk(names)', 'Land(names)', 'LandNames()', 'Surface(name)']
	},

	/* The library once, kept in the service itself: each use of the service sees the materials defined by any. */
	$OnCreate: function () {
		if (!Object.keys(this.Defined).length)
			this.Library();
	},

	Defined: {},

	Names: function (group) {
		var self = this;

		return Object.keys(this.Defined).filter(function (name) {
			return !group || self.Defined[name].Group === group;
		});
	},

	Has: function (name) {
		return !!this.Defined[name];
	},

	Get: function (name) {
		return this.Defined[name] || null;
	},

	Define: function (name, material) {
		if (!name || !material || typeof material.Code !== 'string')
			throw new Error('Elemenx SceneMaterials: a material needs a name and its Code');

		this.Defined[name] = Object.assign({Title: name, Group: 'other', Land: false}, material);

		Object.keys(this.Chunks).forEach(function (key) {
			delete this.Chunks[key];
		}, this);

		return this.Defined[name];
	},

	/* The GLSL of what every material calls. */
	Helpers: [
		'float enx_mh(vec2 p) {',
		'	vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
		'	p3 += dot(p3, p3.yzx + 33.33);',
		'	return fract((p3.x + p3.y) * p3.z);',
		'}',
		'vec2 enx_mh2(vec2 p) {',
		'	vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));',
		'	p3 += dot(p3, p3.yzx + 33.33);',
		'	return fract((p3.xx + p3.yz) * p3.zy);',
		'}',
		'float enx_mn(vec2 p) {',
		'	vec2 i = floor(p);',
		'	vec2 f = fract(p);',
		'	vec2 u = f * f * (3.0 - 2.0 * f);',
		'	return mix(mix(enx_mh(i), enx_mh(i + vec2(1.0, 0.0)), u.x), mix(enx_mh(i + vec2(0.0, 1.0)), enx_mh(i + vec2(1.0, 1.0)), u.x), u.y);',
		'}',
		'float enx_mf(vec2 p, int octaves) {',
		'	float sum = 0.0;',
		'	float amount = 0.5;',
		'	float whole = 0.0;',
		'	for (int i = 0; i < 6; i++) {',
		'		if (i >= octaves) break;',
		'		sum += amount * enx_mn(p);',
		'		whole += amount;',
		'		p = p * 2.03 + vec2(17.1, 5.3);',
		'		amount *= 0.5;',
		'	}',
		'	return sum / whole;',
		'}',
		'vec4 enx_mc(vec2 p, float jitter) {',
		'	vec2 i = floor(p);',
		'	vec2 f = fract(p);',
		'	float f1 = 8.0;',
		'	float f2 = 8.0;',
		'	vec2 near = i;',
		'	for (int y = -1; y <= 1; y++) {',
		'		for (int x = -1; x <= 1; x++) {',
		'			vec2 g = vec2(float(x), float(y));',
		'			vec2 r = g + enx_mh2(i + g) * jitter - f;',
		'			float d = dot(r, r);',
		'			if (d < f1) { f2 = f1; f1 = d; near = i + g; }',
		'			else if (d < f2) f2 = d;',
		'		}',
		'	}',
		'	return vec4(sqrt(f1), sqrt(f2), enx_mh(near), enx_mh(near + vec2(7.3, 1.9)));',
		'}',
		'float enx_ms(float px, float size) {',
		'	return 1.0 - smoothstep(size * 0.15, size * 0.5, px);',
		'}',
		'vec3 enx_bump(vec3 position, vec3 normal, float h) {',
		'	vec3 dx = dFdx(position);',
		'	vec3 dy = dFdy(position);',
		'	vec3 r1 = cross(dy, normal);',
		'	vec3 r2 = cross(normal, dx);',
		'	float det = dot(dx, r1);',
		'	if (abs(det) < 1e-12) return normal;',
		'	vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);',
		'	return normalize(abs(det) * normal - grad);',
		'}'
	].join('\n'),

	Chunks: {},

	/* The GLSL of materials by name and of enx_material choosing one of them by its index (unknown names: nothing). */
	Chunk: function (names) {
		var key = names.join(',');
		var lines;

		if (this.Chunks[key])
			return this.Chunks[key];

		lines = [this.Helpers, this.Functions(names)];

		lines.push('void enx_material(float id, vec2 q, float px, inout vec3 c, inout float r, inout float m, inout float h) {');

		names.forEach(function (name, index) {
			lines.push('\t' + (index ? 'else ' : '') + 'if (id < ' + (index + 0.5) + ') enx_mat' + index + '(q, px, c, r, m, h);');
		});

		lines.push('}');

		this.Chunks[key] = lines.join('\n');

		return this.Chunks[key];
	},

	/* The functions enx_mat0... of materials by name, in their order. */
	Functions: function (names) {
		var self = this;

		return names.map(function (name, index) {
			var material = self.Defined[name];

			return ['void enx_mat' + index + '(vec2 q, float px, inout vec3 c, inout float r, inout float m, inout float h) {', material ? material.Code : '', '}'].join('\n');
		}).join('\n');
	},

	/*
	 * The materials of a ground in the shader of the land (its helpers there already): landMaterials(place, px, color,
	 * height), each of its 8 slots (names) by its weight of the corners (vMaterials, vMaterials2), each drawn once where it
	 * weighs anything; none: as it is.
	 */
	Land: function (names) {
		var lines = [this.Functions(names), 'void landMaterials(vec3 place, float px, inout vec3 color, inout float height) {', '\tvec3 sum = vec3(0.0);', '\tfloat total = 0.0;', '\tfloat high = 0.0;', '\tfloat w;'];

		names.slice(0, 8).forEach(function (name, index) {
			lines.push('\tw = ' + (index < 4 ? 'vMaterials' : 'vMaterials2') + '.' + 'xyzw'.charAt(index % 4) + ';');
			lines.push('\tif (w > 0.02) { vec3 c = color; float r = 1.0; float m = 0.0; float h = 0.0; enx_mat' + index + '(place.xz, px, c, r, m, h); sum += c * w; high += h * w; total += w; }');
		});

		lines.push('\tif (total <= 0.0) return;', '\tcolor = mix(color, sum / total, min(1.0, total));', '\theight = high / max(total, 1.0);', '}');

		return lines.join('\n');
	},

	LandNames: function () {
		var self = this;

		return Object.keys(this.Defined).filter(function (name) {
			return self.Defined[name].Land;
		});
	},

	/* A material of a model: its pattern on its body (vBody, metres of it), along the side its normal faces most. */
	Surface: function (name) {
		var material = this.Defined[name];
		if (!material) return null;

		return [
			this.Helpers,
			'void enx_pattern(vec2 q, float px, inout vec3 c, inout float r, inout float m, inout float h) {',
			material.Code,
			'}',
			'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {',
			'	vec3 side = abs(vBodyNormal);',
			'	vec2 q = side.y > max(side.x, side.z) ? vBody.xz : side.x > side.z ? vBody.zy : vBody.xy;',
			'	float px = length(fwidth(q));',
			'	float h = 0.0;',
			'	enx_pattern(q, px, color, rough, metal, h);',
			'	bent = enx_bump(position, bent, h);',
			'}'
		].join('\n');
	},

	/* The materials of the library. */
	Library: function () {
		var self = this;

		function define (name, group, land, code) {
			self.Define(name, {Title: name.charAt(0).toUpperCase() + name.slice(1), Group: group, Land: land, Code: code.join('\n')});
		}

		/* Ground. A lawn seen from over it: blades two ways in two tones, patches lighter and darker. */
		define('lawn', 'ground', true, [
			'	float s = enx_ms(px, 0.02);',
			'	vec2 d = q + vec2(enx_mn(q * 3.0), enx_mn(q * 3.0 + 9.1)) * 0.6;',
			'	float blades = enx_mn(vec2(d.x * 90.0, d.y * 18.0)) * 0.6 + enx_mn(vec2(d.x * 25.0 + 4.0, d.y * 130.0)) * 0.4;',
			'	float spot = enx_mf(q * 0.8, 3);',
			'	c *= mix(vec3(1.0), mix(vec3(0.7, 0.8, 0.6), vec3(1.2, 1.14, 0.95), blades), s) * (0.84 + spot * 0.32);',
			'	h += (blades - 0.5) * 0.01 * s;',
			'	r = 0.95;'
		]);

		/* Soil under trees: its grain, patches of moss, fallen leaves and pebbles. */
		define('soil', 'ground', true, [
			'	float s1 = enx_ms(px, 0.03);',
			'	float s2 = enx_ms(px, 0.08);',
			'	float grain = enx_mf(q * 18.0, 3);',
			'	c *= 0.8 + grain * 0.4 * s1 + (1.0 - s1) * 0.2;',
			'	float moss = smoothstep(0.52, 0.62, enx_mf(q * 1.3 + 3.0, 4) + (enx_mn(q * 14.0) - 0.5) * 0.15 * s1);',
			'	c = mix(c, vec3(0.28, 0.36, 0.14) * (0.8 + enx_mn(q * 30.0) * 0.4 * s1), moss * 0.85);',
			'	h += moss * 0.006 + grain * 0.004 * s1;',
			'	vec4 l = enx_mc(q * 9.0, 0.9);',
			'	float leaf = step(0.72, l.z) * smoothstep(0.32, 0.18, l.x) * s2 * (1.0 - moss * 0.7);',
			'	c = mix(c, mix(vec3(0.55, 0.3, 0.1), vec3(0.75, 0.55, 0.18), l.w), leaf);',
			'	h += leaf * 0.003;',
			'	vec4 p = enx_mc(q * 6.0 + 31.0, 1.0);',
			'	float pebble = step(0.85, p.z) * smoothstep(0.3, 0.15, p.x) * s2;',
			'	c = mix(c, vec3(0.5, 0.48, 0.44) * (0.75 + p.w * 0.5), pebble);',
			'	h += pebble * smoothstep(0.3, 0.0, p.x) * 0.015;',
			'	r = mix(0.95, 0.8, pebble);'
		]);

		/* Sandy gravel: grains of white, rust, grey and ochre in sand. */
		define('gravel', 'ground', true, [
			'	float s = enx_ms(px, 0.012);',
			'	vec4 g = enx_mc(q * 70.0, 1.0);',
			'	float grain = smoothstep(0.5, 0.25, g.x) * s;',
			'	vec3 tint = g.z < 0.25 ? vec3(1.25, 1.2, 1.12) : g.z < 0.45 ? vec3(1.1, 0.78, 0.62) : g.z < 0.7 ? vec3(0.78, 0.78, 0.8) : vec3(1.05, 0.92, 0.7);',
			'	c *= mix(vec3(1.0), tint * (0.8 + g.w * 0.4), grain) * (0.9 + enx_mf(q * 2.0, 2) * 0.2);',
			'	h += grain * smoothstep(0.5, 0.0, g.x) * 0.004;',
			'	r = 0.9;'
		]);

		/* Clay: clods, pits and thin cracks between them. */
		define('clay', 'ground', true, [
			'	float s = enx_ms(px, 0.04);',
			'	vec4 k = enx_mc(q * 7.0, 1.0);',
			'	float clod = smoothstep(0.55, 0.1, k.x) * step(0.45, k.z) * s;',
			'	float pit = smoothstep(0.62, 0.72, enx_mf(q * 4.0 + 5.0, 3)) * s;',
			'	float crack = (1.0 - smoothstep(0.0, 0.04, k.y - k.x)) * step(k.z, 0.45) * s * 0.6;',
			'	c *= (0.85 + enx_mf(q * 1.5, 3) * 0.3) * (1.0 + clod * 0.12 - pit * 0.3 - crack * 0.35);',
			'	h += clod * 0.02 - pit * 0.015 - crack * 0.006;',
			'	r = 0.88;'
		]);

		/* Sand: fine grain, ripples of the wind. */
		define('sand', 'ground', true, [
			'	float s = enx_ms(px, 0.01);',
			'	float fine = enx_mn(q * 120.0) - 0.5;',
			'	float ripple = sin((q.x * 0.8 + q.y * 0.6 + enx_mf(q * 0.3, 3) * 6.0) * 9.0);',
			'	c *= (0.94 + fine * 0.16 * s + ripple * 0.03 * enx_ms(px, 0.3)) * (0.96 + enx_mn(q * 30.0) * 0.08 * enx_ms(px, 0.03));',
			'	h += ripple * 0.008 * enx_ms(px, 0.3) + fine * 0.001 * s;',
			'	r = 0.92;'
		]);

		/* Rock: its crust, its grain and spots of lichen. */
		define('rock', 'ground', true, [
			'	float s = enx_ms(px, 0.05);',
			'	float f = enx_mf(q * 1.2, 5);',
			'	float fine = enx_mn(q * 25.0);',
			'	c *= 0.75 + f * 0.45 + (fine - 0.5) * 0.15 * s;',
			'	float lichen = step(0.82, enx_mn(q * 6.0 + 2.0)) * s;',
			'	c = mix(c, vec3(0.62, 0.62, 0.42), lichen * 0.5);',
			'	h += f * 0.08 + fine * 0.004 * s;',
			'	r = 0.85;'
		]);

		define('snow', 'ground', true, [
			'	float f = enx_mf(q * 0.7, 3);',
			'	c *= 1.0 + (f - 0.5) * 0.08;',
			'	h += f * 0.05;',
			'	r = 0.6;'
		]);

		/* Dirt of a way: trodden soil, pebbles. */
		define('dirt', 'road', true, [
			'	float s = enx_ms(px, 0.03);',
			'	float grain = enx_mf(q * 16.0, 3);',
			'	c *= 0.82 + grain * 0.36 * s + (1.0 - s) * 0.18;',
			'	vec4 p = enx_mc(q * 8.0 + 13.0, 1.0);',
			'	float pebble = step(0.8, p.z) * smoothstep(0.3, 0.12, p.x) * enx_ms(px, 0.06);',
			'	c = mix(c, vec3(0.55, 0.52, 0.47) * (0.8 + p.w * 0.4), pebble);',
			'	h += grain * 0.004 * s + pebble * 0.008;',
			'	r = 0.92;'
		]);

		/* Roads. Fresh asphalt: dark, its aggregate in grains, a bit of straw now and then. */
		define('asphalt', 'road', true, [
			'	float s = enx_ms(px, 0.011);',
			'	vec4 g = enx_mc(q * 90.0, 1.0);',
			'	float stone = smoothstep(0.55, 0.2, g.x) * s;',
			'	float mid = enx_mf(q * 14.0, 3) - 0.5;',
			'	float worn = enx_mf(vec2(q.x * 0.08, q.y * 0.9), 3);',
			'	c *= 1.0 + (g.z - 0.5) * 0.5 * stone + mid * 0.3 * enx_ms(px, 0.05) + (enx_mf(q * 0.4, 3) - 0.5) * 0.22 + (worn - 0.5) * 0.18;',
			'	float straw = step(0.985, g.w) * stone;',
			'	c = mix(c, vec3(0.55, 0.47, 0.32), straw * 0.7);',
			'	h += stone * 0.002 + g.z * 0.001 * s;',
			'	r = 0.86 - stone * 0.08;'
		]);

		/* Grey speckled asphalt: white flecks and dark ones in a fine aggregate. */
		define('terrazzo', 'road', true, [
			'	float s = enx_ms(px, 0.008);',
			'	vec4 g = enx_mc(q * 110.0, 1.0);',
			'	float fleck = smoothstep(0.45, 0.3, g.x) * s;',
			'	c *= 1.0 + (enx_mf(q * 0.5, 3) - 0.5) * 0.15 + (enx_mf(q * 14.0, 3) - 0.5) * 0.25 * enx_ms(px, 0.05);',
			'	c = mix(c, g.z > 0.7 ? vec3(0.85, 0.85, 0.82) : g.z < 0.25 ? c * 0.55 : c * (0.9 + g.w * 0.2), fleck);',
			'	h += fleck * 0.0015;',
			'	r = 0.8;'
		]);

		/* Concrete: blotches, pores, seams every 4 metres. */
		define('concrete', 'road', true, [
			'	float s = enx_ms(px, 0.01);',
			'	c *= 0.92 + enx_mf(q * 0.7, 4) * 0.16;',
			'	vec4 p = enx_mc(q * 60.0, 1.0);',
			'	float pore = smoothstep(0.12, 0.05, p.x) * step(0.7, p.z) * s;',
			'	c *= 1.0 - pore * 0.35;',
			'	h -= pore * 0.002;',
			'	vec2 j = abs(fract(q / 4.0 + 0.5) - 0.5) * 4.0;',
			'	float seam = (1.0 - smoothstep(0.004, 0.012, min(j.x, j.y))) * enx_ms(px, 0.08);',
			'	c *= 1.0 - seam * 0.4;',
			'	h -= seam * 0.004;',
			'	r = 0.85;'
		]);

		/* Paving slabs of half a metre, rows offset, each of its own tone. */
		define('paving', 'road', true, [
			'	vec2 t = q / 0.5;',
			'	t.x += mod(floor(t.y), 2.0) * 0.5;',
			'	vec2 id = floor(t);',
			'	vec2 f = fract(t);',
			'	vec2 e = min(f, 1.0 - f) * 0.5;',
			'	float joint = (1.0 - smoothstep(0.003, 0.008, min(e.x, e.y))) * enx_ms(px, 0.05);',
			'	float tone = enx_mh(id);',
			'	c *= (0.88 + tone * 0.24) * (0.95 + enx_mn(q * 40.0) * 0.1 * enx_ms(px, 0.02)) * (1.0 - joint * 0.45);',
			'	h += (1.0 - joint) * 0.004 + (tone - 0.5) * 0.002 * (1.0 - joint);',
			'	r = 0.85;'
		]);

		/* Cobbles: rounded stones of their own tones, dark joints. */
		define('cobbles', 'road', true, [
			'	vec4 k = enx_mc(q * 7.0, 0.8);',
			'	float seen = enx_ms(px, 0.1);',
			'	float stone = smoothstep(0.0, 0.12, k.y - k.x);',
			'	c *= mix(0.55, 0.85 + k.z * 0.3, mix(1.0, stone, seen));',
			'	h += stone * 0.02 * seen;',
			'	r = mix(0.9, 0.7, stone);'
		]);

		/* Ballast of a railway: coarse grey stones. */
		define('ballast', 'road', true, [
			'	vec4 k = enx_mc(q * 22.0, 1.0);',
			'	float seen = enx_ms(px, 0.04);',
			'	float stone = smoothstep(0.0, 0.25, k.y - k.x);',
			'	c *= mix(1.0, (0.6 + k.z * 0.6) * mix(0.5, 1.0, stone), seen);',
			'	h += stone * 0.025 * seen;',
			'	r = 0.9;'
		]);

		/* Building. Brick in a running bond, its mortar light. */
		define('brick', 'build', false, [
			'	vec2 b = vec2(0.24, 0.075);',
			'	vec2 t = q / b;',
			'	t.x += mod(floor(t.y), 2.0) * 0.5;',
			'	vec2 id = floor(t);',
			'	vec2 f = fract(t) * b;',
			'	float e = min(min(f.x, b.x - f.x), min(f.y, b.y - f.y));',
			'	float mortar = (1.0 - smoothstep(0.004, 0.007, e)) * enx_ms(px, 0.06);',
			'	float tone = enx_mh(id + 3.1);',
			'	vec3 brick = c * (0.8 + tone * 0.35) * (0.92 + enx_mn(q * 60.0) * 0.16 * enx_ms(px, 0.02));',
			'	c = mix(brick, vec3(0.72, 0.7, 0.66), mortar);',
			'	h += (1.0 - mortar) * 0.006;',
			'	r = mix(0.85, 0.95, mortar);'
		]);

		/* Stone blocks in rows of their own lengths. */
		define('stone', 'build', false, [
			'	float row = floor(q.y / 0.3);',
			'	vec2 t = vec2(q.x / 0.55 + enx_mh(vec2(row, 1.7)), q.y / 0.3);',
			'	vec2 id = floor(t);',
			'	vec2 f = fract(t) * vec2(0.55, 0.3);',
			'	float e = min(min(f.x, 0.55 - f.x), min(f.y, 0.3 - f.y));',
			'	float joint = (1.0 - smoothstep(0.006, 0.012, e)) * enx_ms(px, 0.08);',
			'	float surface = enx_mf(q * 6.0, 4);',
			'	c *= (0.82 + enx_mh(id + row) * 0.3) * (0.9 + surface * 0.2) * (1.0 - joint * 0.35);',
			'	h += (1.0 - joint) * 0.01 + surface * 0.004;',
			'	r = 0.9;'
		]);

		/* Plaster: fine stucco, streaks down from the rain. */
		define('plaster', 'build', false, [
			'	float s = enx_ms(px, 0.012);',
			'	float fine = enx_mn(q * 90.0);',
			'	float streak = enx_mn(vec2(q.x * 12.0, q.y * 0.4));',
			'	c *= (0.92 + enx_mf(q * 4.0, 4) * 0.14 + (fine - 0.5) * 0.06 * s + (enx_mn(q * 20.0) - 0.5) * 0.08 * enx_ms(px, 0.05)) * (1.0 - smoothstep(0.6, 0.9, streak) * 0.08);',
			'	h += fine * 0.0015 * s;',
			'	r = 0.92;'
		]);

		/* Planks: their grain, each its own tone, gaps between them. */
		define('wood', 'build', false, [
			'	float w = 0.16;',
			'	float row = floor(q.y / w);',
			'	float f = fract(q.y / w) * w;',
			'	float gap = (1.0 - smoothstep(0.002, 0.005, min(f, w - f))) * enx_ms(px, 0.04);',
			'	float tone = enx_mh(vec2(row, 2.0));',
			'	float grain = sin((q.y + enx_mf(vec2(q.x * 0.6, q.y * 9.0) + row, 3) * 0.08) * 260.0) * 0.5 + 0.5;',
			'	c *= (0.8 + tone * 0.35) * (0.88 + grain * 0.2 * enx_ms(px, 0.006)) * (1.0 - gap * 0.6);',
			'	h += (1.0 - gap) * 0.003 + grain * 0.0005;',
			'	r = 0.75;'
		]);

		/* Brushed metal. */
		define('metal', 'build', false, [
			'	float s = enx_ms(px, 0.004);',
			'	c *= 0.95 + enx_mn(vec2(q.x * 2.0, q.y * 300.0)) * 0.1 * s;',
			'	r *= 0.85 + enx_mn(vec2(q.x * 1.5, q.y * 200.0)) * 0.3 * s;'
		]);

		/* Glass: smooth, smudged a little. */
		define('glass', 'build', false, [
			'	r *= 0.9 + enx_mf(q * 3.0, 3) * 0.3;'
		]);

		/* Fabric: a weave of threads. */
		define('fabric', 'other', false, [
			'	float s = enx_ms(px, 0.004);',
			'	float a = sin(q.x * 900.0);',
			'	float b = sin(q.y * 900.0);',
			'	c *= 1.0 + (step(0.0, a * b) - 0.5) * 0.15 * s + (enx_mf(q * 5.0, 3) - 0.5) * 0.1 + (enx_mn(vec2(q.x * 40.0, q.y * 3.0)) - 0.5) * 0.12 * enx_ms(px, 0.05);',
			'	h += abs(a * b) * 0.0003 * s;',
			'	r = 0.95;'
		]);
	}
});
