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
 *   ballast; brick, stone, plaster, wood, metal, glass, fabric. They are resources, material graphs of a block GLSL each
 *   (blueprints/materials, ElemenxGraphics/materials/<name>): an Application gives one of that name in its place.
 * - Chunk(names): the GLSL of those materials and enx_material(id, q, px, c, r, m, h) drawing the one of index id of names;
 *   enx_bump(position, normal, h) bends a normal by a height (of the derivatives of the screen: called where all pixels go).
 * - Land(names): the GLSL of the materials of a ground (up to 12, its slots) in the shader of the land: landMaterials(place,
 *   px, color, height), each by the weight of it at the corners (vMaterials, vMaterials2, vMaterials3), drawn once where it weighs.
 * - LandNames(): the materials a ground may be made of. Texture of a material names a texture of SceneTextures: on a
 *   ground it is its tile baked (sharp near, smooth far, no repeat), Textured(names) the textures of a ground in the order of
 *   its layers (SceneTextures.Array), its Code what a model of it draws.
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
	 * height), each of its 12 slots (names) by its weight of the corners (vMaterials to vMaterials3), each drawn once where it
	 * weighs anything; none: as it is.
	 */
	Land: function (names) {
		var self = this;
		var textured = this.Textured(names);
		var count = Math.min(names.length, 12);
		var lines = [this.Functions(names), this.LandSlope, this.LandRag];
		var i;

		/* The tiles of the materials of a texture (SceneTextures): the layers of uLandColor and uLandSurface, in the order of Textured. */
		if (textured.length)
			lines.push('precision highp sampler2DArray;', this.$Service('SceneTextures').Chunk(true), this.LandTexture, this.LandCliff);

		/* A pattern of code lies on the ground from over it, on a slope from its side: none is drawn out down a hillside. */
		lines.push('void landMaterials(vec3 place, float px, inout vec3 color, inout float height) {', '\tlandSlope = landSteeper(place);', '\tvec3 slope = landSlope;', '\tvec2 side = slope.y > 0.72 ? place.xz : abs(slope.x) > abs(slope.z) ? place.zy : place.xy;', '\tvec3 sum = vec3(0.0);', '\tfloat total = 0.0;', '\tfloat high = 0.0;', '\tfloat cover = 0.0;', '\tfloat top = -1.0;', '\tfloat w;');

		/*
		 * Where two materials meet (a weight that changes within a few metres: the edge of a road, a beach), a ragged edge of
		 * the place, not a smear of both: each one's weight lifted or lowered by a noise of its own (landRag), and only what
		 * comes near the highest drawn. Where they mingle over tens of metres (low and high ground), they blend as they are.
		 */
		lines.push('\tfloat edge = 0.0;', '\tfloat metre = max(length(fwidth(place.xz)), 1e-4);');

		for (i = 0; i < count; i++)
			lines.push('\tfloat o' + i + ' = ' + ['vMaterials', 'vMaterials2', 'vMaterials3'][Math.floor(i / 4)] + '.' + 'xyzw'.charAt(i % 4) + ';', '\tfloat e' + i + ' = o' + i + ';', '\tcover += o' + i + ';', '\tedge = max(edge, length(vec2(dFdx(o' + i + '), dFdy(o' + i + '))) / metre);');

		lines.push('\tedge = smoothstep(0.04, 0.15, edge);');

		for (i = 0; i < count; i++)
			lines.push('\tif (o' + i + ' > 0.02) { e' + i + ' += landRag(place.xz, ' + i + '.0) * edge; top = max(top, e' + i + '); }', '\telse e' + i + ' = -9.0;');

		names.slice(0, 12).forEach(function (name, index) {
			var material = self.Defined[name];
			var layer = material && material.Texture ? textured.indexOf(material.Texture) : -1;
			var textures = layer >= 0 ? self.$Service('SceneTextures') : null;

			lines.push('\tw = mix(o' + index + ', max(e' + index + ' - top + 0.18, 0.0), edge);');

			if (layer >= 0) {
				lines.push('\tif (w > 0.02) { vec3 c; float h; float lit; landTexture(' + layer + '.0, ' + Number(textures.Get(material.Texture).Metres).toFixed(4) + ', ' + (textures.Get(material.Texture).Rows ? '-1.0' : '1.0') + ', place, c, h, lit); c *= landTint(color) * mix(1.0, lit, 0.6); sum += c * w; high += h * 0.03 * w; total += w; }');

				return;
			}

			lines.push('\tif (w > 0.02) { vec3 c = color; float r = 1.0; float m = 0.0; float h = 0.0; enx_mat' + index + '(side, px, c, r, m, h); sum += c * w; high += h * w; total += w; }');
		});

		lines.push('\tif (total > 0.0) {', '\t\tcolor = mix(color, sum / total, min(1.0, cover));', '\t\theight = high / total * min(1.0, cover);', '\t}');

		/* What is steep: the face of a cliff, its beds of the height in the world; under it, at a gentler slope, scree. */
		if (textured.indexOf('cliff') !== -1)
			lines.push('\tlandCliff(' + textured.indexOf('cliff') + '.0, ' + Number(this.$Service('SceneTextures').Get('cliff').Metres).toFixed(4) + ', ' + textured.indexOf('dirt') + '.0, ' + Number(this.$Service('SceneTextures').Get('dirt').Metres).toFixed(4) + ', place, color, height);');

		lines.push('}');

		return lines.join('\n');
	},

	/*
	 * The textures (SceneTextures) of the materials of a ground, each once, in the order of its slots, then cliff (the face of
	 * what is steep): the layers of its tiles.
	 */
	Textured: function (names) {
		var self = this;
		var found = [];

		(names || []).slice(0, 12).forEach(function (name) {
			var material = self.Defined[name];
			if (material && material.Texture && self.$Service('SceneTextures').Has(material.Texture) && found.indexOf(material.Texture) === -1)
				found.push(material.Texture);
		});

		/* Earth for what is fairly steep (scree, the bank of a cut), then the face of a cliff for what is steep, on any ground: the last layers. */
		['dirt', 'cliff'].forEach(function (name) {
			if ((names || []).length && self.$Service('SceneTextures').Has(name) && found.indexOf(name) === -1)
				found.push(name);
		});

		return found;
	},

	/*
	 * A tile of a material on the ground: seen from over it on what is level, from its side on a slope (three ways of the
	 * place, weighed by the normal: no smear down a cliff), its color tinted a little by the color of the ground there.
	 */
	/*
	 * How steep the ground is at a point: its normal, or that of its triangle where that is steeper. A wall of a cliff is a
	 * row of upright triangles whose upper corners have normals that look up (of the level top over them): by those alone
	 * a wedge of each would be level, its pattern laid from over it and drawn out down the wall. Its triangle (of the
	 * derivatives of the place on the screen) is taken once, where all pixels go (landSlope, in landMaterials).
	 */
	LandSlope: [
		'vec3 landSlope = vec3(0.0, 1.0, 0.0);',
		'vec3 landSteeper(vec3 place) {',
		'	vec3 soft = normalize(vNormal);',
		/* A skirt under the edge of a square (its normals half as long): the ground over it, never a wall. */
		'	if (dot(vNormal, vNormal) < 0.56) return soft;',
		'	vec3 face = cross(dFdx(place), dFdy(place));',
		'	if (dot(face, face) < 1e-12) return soft;',
		'	face = normalize(face);',
		'	face *= sign(face.y + 1e-6);',
		'	return abs(face.y) < soft.y - 0.05 ? face : soft;',
		'}'
	].join('\n'),

	/*
	 * A noise of the place for each material of a ground (its slot, n): metres and tens of centimetres, from -0.3 to 0.3;
	 * where materials meet, the one it lifts most there shows (landMaterials), so the edge of a lawn is torn as one is.
	 */
	LandRag: [
		'float landRagNoise(vec2 p) {',
		'	vec2 i = mod(floor(p), 289.0);',
		'	vec2 f = fract(p);',
		'	vec2 u = f * f * (3.0 - 2.0 * f);',
		'	float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);',
		'	float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);',
		'	float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);',
		'	float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);',
		'	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
		'}',
		'float landRag(vec2 place, float n) {',
		'	vec2 o = vec2(n * 17.31, n * 9.73);',
		'	return (landRagNoise(place / 2.3 + o) * 0.55 + landRagNoise(place / 0.7 + o * 1.7) * 0.3 + landRagNoise(place / 0.2 + o * 2.3) * 0.15 - 0.5) * 0.6;',
		'}'
	].join('\n'),

	LandTexture: [
		'uniform sampler2DArray uLandColor;',
		'uniform sampler2DArray uLandSurface;',
		'vec3 landTint(vec3 color) {',
		'	vec3 tint = color / max(max(color.r, max(color.g, color.b)), 0.01);',
		'	return mix(vec3(1.0), tint, 0.35) * 1.08;',
		'}',
		'void landTexture(float layer, float metres, float spin, vec3 place, out vec3 c, out float h, out float lit) {',
		'	vec3 n = abs(landSlope);',
		/* Sharp between the three ways: a slope takes the side, hardly anything of what lies over it drawn out down it. */
		'	vec3 k = pow(n, vec3(8.0));',
		'	k /= k.x + k.y + k.z;',
		'	vec3 a;',
		'	float r;',
		'	vec3 bent;',
		'	float hh;',
		'	float l;',
		'	float used = 0.0;',
		'	c = vec3(0.0);',
		'	h = 0.0;',
		'	lit = 0.0;',
		'	if (k.y > 0.03) { tex_sample_layer(uLandColor, uLandSurface, layer, place.xz, metres, spin, a, r, bent, hh, l); c += a * k.y; h += hh * k.y; lit += l * k.y; used += k.y; }',
		'	if (k.x > 0.03) { tex_sample_layer(uLandColor, uLandSurface, layer, place.zy, metres, spin, a, r, bent, hh, l); c += a * k.x; h += hh * k.x; lit += l * k.x; used += k.x; }',
		'	if (k.z > 0.03) { tex_sample_layer(uLandColor, uLandSurface, layer, place.xy, metres, spin, a, r, bent, hh, l); c += a * k.z; h += hh * k.z; lit += l * k.z; used += k.z; }',
		'	c /= max(used, 1e-4);',
		'	h /= max(used, 1e-4);',
		'	lit /= max(used, 1e-4);',
		'}'
	].join('\n'),

	/*
	 * The face of a cliff where the ground is steep: the tile cliff from its two sides (none from over it: nothing smears down
	 * it), each bed tinted by its height in the world (sandy, ochre, grey, red, brown, a few metres each, warped along it),
	 * a bed of soil under the grass at its top edge; where it gets gentler below, scree of the same rock.
	 */
	LandCliff: [
		'float cliffHash(float n) {',
		'	return fract(sin(n * 127.1) * 43758.5453);',
		'}',
		'float cliffNoise(vec2 p) {',
		'	vec2 i = floor(p);',
		'	vec2 f = fract(p);',
		'	vec2 u = f * f * (3.0 - 2.0 * f);',
		'	float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);',
		'	float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);',
		'	float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);',
		'	float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);',
		'	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
		'}',
		'vec3 cliffBed(float y, float region) {',
		'	float i = floor(y);',
		'	vec3 base = mix(mix(vec3(0.74, 0.66, 0.54), vec3(0.7, 0.56, 0.42), smoothstep(0.3, 0.6, region)), vec3(0.6, 0.58, 0.55), smoothstep(0.6, 0.9, region));',
		'	float t = cliffHash(i + floor(region * 7.0) * 31.0);',
		'	float t2 = cliffHash(i + 1.0 + floor(region * 7.0) * 31.0);',
		'	vec3 a = base * (0.82 + 0.3 * t) * mix(vec3(1.0), vec3(1.06, 0.95, 0.86), step(0.82, t));',
		'	vec3 b = base * (0.82 + 0.3 * t2) * mix(vec3(1.0), vec3(1.06, 0.95, 0.86), step(0.82, t2));',
		'	return mix(a, b, smoothstep(0.75, 1.0, fract(y)));',
		'}',
		'void landCliff(float layer, float metres, float earth, float earthMetres, vec3 place, inout vec3 color, inout float height) {',
		'	vec3 n = landSlope;',
		'	float steep = 1.0 - smoothstep(0.42, 0.62, n.y);',
		'	float scree = (1.0 - smoothstep(0.62, 0.9, n.y)) * (1.0 - steep);',
		'	if (steep < 0.01 && scree < 0.01) return;',
		'	vec3 a;',
		'	float r;',
		'	vec3 bent;',
		'	float hh;',
		'	float l;',
		'	vec3 c = vec3(0.0);',
		'	float h = 0.0;',
		'	float lit = 0.0;',
		'	vec2 k = pow(abs(n.xz), vec2(4.0));',
		'	k /= max(k.x + k.y, 1e-4);',
		'	if (k.x > 0.03) { tex_sample_layer(uLandColor, uLandSurface, layer, vec2(place.z, place.y), metres, 0.0, a, r, bent, hh, l); c += a * k.x; h += hh * k.x; lit += l * k.x; }',
		'	if (k.y > 0.03) { tex_sample_layer(uLandColor, uLandSurface, layer, vec2(place.x, place.y), metres, 0.0, a, r, bent, hh, l); c += a * k.y; h += hh * k.y; lit += l * k.y; }',
		'	float used = max(step(0.03, k.x) * k.x + step(0.03, k.y) * k.y, 1e-4);',
		'	c /= used;',
		'	h /= used;',
		'	lit /= used;',
		'	float region = cliffNoise(place.xz / 260.0);',
		'	float warp = (cliffNoise(place.xz / 40.0) - 0.5) * 4.0 + (cliffNoise(place.xz / 9.0) - 0.5) * 0.8;',
		'	float thick = 1.6 + 2.2 * cliffNoise(vec2(floor((place.y + warp) / 6.0), region * 9.0));',
		'	vec3 bed = cliffBed((place.y + warp) / thick, region);',
		'	vec3 face = c * bed * 1.25 * mix(1.0, lit, 0.7);',
		/* The grit of the scree: stones of a few sizes, the finest as near as the eye comes. */
		'	vec2 sp = n.y > 0.75 ? place.xz : abs(n.x) > abs(n.z) ? place.zy : place.xy;',
		'	float bits = cliffNoise(sp * 6.0) * 0.4 + cliffNoise(sp * 23.0) * 0.3 + cliffNoise(sp * 71.0) * 0.3 * (1.0 - smoothstep(0.01, 0.04, length(fwidth(sp))));',
		'	vec3 loose = cliffBed((place.y + warp + 1.7) / thick, region) * (0.45 + 0.6 * bits) * vec3(0.92, 0.9, 0.86);',
		/* The earth of the scree and of a bank: the tile of dirt as the slope faces, tinted by the beds over it. */
		'	if (scree > 0.01) {',
		'		vec3 dc;',
		'		float dh;',
		'		float dl;',
		'		landTexture(earth, earthMetres, 1.0, place, dc, dh, dl);',
		'		loose = dc * landTint(loose) * 1.1 * mix(1.0, dl, 0.6) * (0.85 + 0.3 * bits);',
		'	}',
		'	color = mix(color, face, steep);',
		'	color = mix(color, loose, scree * 0.75);',
		'	height = mix(height, h * 0.08, steep);',
		'}'
	].join('\n'),

	LandNames: function () {
		var self = this;

		return Object.keys(this.Defined).filter(function (name) {
			return self.Defined[name].Land;
		});
	},

	/*
	 * A material of a model: its pattern on its body (vBody, metres of it), along the side its normal faces most; along:
	 * by its UV in units of 4 m instead (a band of a road: across and along it), so what is laid in rows turns with the
	 * road. A material with a Texture draws its tile baked (SceneTextures), its mean the color of the material: the tile is
	 * bound in the places of the emissive and the normal maps of the model (SurfaceTextures), which such a material has
	 * none of, for a shader of a model has no unit of a texture left.
	 */
	Surface: function (name, along) {
		var material = this.Defined[name];
		var textures = this.$Service('SceneTextures');
		var recipe = material && material.Texture && textures.Has(material.Texture) ? textures.Get(material.Texture) : null;
		var place = along ? '	vec2 q = uv * 4.0;' : '	vec3 side = abs(vBodyNormal);\n	vec2 q = side.y > max(side.x, side.z) ? vBody.xz : side.x > side.z ? vBody.zy : vBody.xy;';

		if (!material) return null;

		if (recipe)
			return [
				this.Helpers,
				'#define uTileColor uEmissiveMap',
				'#define uTileSurface uNormalMap',
				textures.Chunk(false),
				along && material.Texture === 'asphalt' ? this.RoadWear : '',
				'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {',
				place,
				'	vec3 a;',
				'	float r;',
				'	vec3 n;',
				'	float h;',
				'	float lit;',
				'	tex_sample(uTileColor, uTileSurface, q, ' + Number(recipe.Metres).toFixed(4) + ', ' + (recipe.Rows ? '-1.0' : '1.0') + ', a, r, n, h, lit);',
				'	vec3 mean = pow(textureLod(uTileColor, vec2(0.5), 20.0).rgb, vec3(2.2));',
				'	color *= a / max(mean, vec3(0.01)) * mix(1.0, lit, 0.6);',
				along && material.Texture === 'asphalt' ? '	roadWear(q, length(fwidth(q)), color, r, h);' : '',
				'	rough = r;',
				'	bent = enx_bump(position, bent, h * 0.006);',
				'}'
			].join('\n');

		return [
			this.Helpers,
			'void enx_pattern(vec2 q, float px, inout vec3 c, inout float r, inout float m, inout float h) {',
			material.Code,
			'}',
			'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {',
			place,
			'	float px = length(fwidth(q));',
			'	float h = 0.0;',
			'	enx_pattern(q, px, color, rough, metal, h);',
			'	bent = enx_bump(position, bent, h);',
			'}'
		].join('\n');
	},

	/*
	 * What years do to the asphalt of a road, larger than its tile, by the place on the road (q: across it and along it,
	 * metres): cracks across it, every so many metres, some sealed with tar; a crack along it over a stretch; patches laid
	 * over where it was mended, darker and smoother, their seams sealed. Thin lines fade where a pixel is wider than them.
	 */
	RoadWear: [
		'float roadHash(vec2 p) {',
		'	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
		'}',
		'void roadWear(vec2 q, float px, inout vec3 c, inout float r, inout float h) {',
		'	float seen = 1.0 - smoothstep(0.04, 0.16, px);',
		/* Across: one crack in most stretches of 9 m, wandering over the width. */
		'	float cell = floor(q.y / 9.0);',
		'	float y0 = (cell + 0.15 + 0.7 * roadHash(vec2(cell, 7.7))) * 9.0;',
		'	float wave = (enx_mn(vec2(q.x * 0.6, cell * 3.1)) - 0.5) * 0.6 + (enx_mn(vec2(q.x * 7.0, cell)) - 0.5) * 0.06;',
		'	float sealed = step(0.5, roadHash(vec2(cell, 2.9)));',
		'	float wide = mix(0.006, 0.025, sealed);',
		'	float across = (1.0 - smoothstep(wide, wide + px, abs(q.y - y0 - wave))) * step(0.25, roadHash(vec2(cell, 3.1)));',
		/* Along: over a part of some stretches of 60 m, at an offset of its own. */
		'	float run = floor(q.y / 60.0);',
		'	float at = fract(q.y / 60.0);',
		'	float x0 = (roadHash(vec2(run, 1.3)) - 0.5) * 5.0 + (enx_mn(vec2(q.y * 0.35, run)) - 0.5) * 0.4;',
		'	float along = (1.0 - smoothstep(0.005, 0.005 + px, abs(q.x - x0))) * step(0.5, roadHash(vec2(run, 9.1))) * step(roadHash(vec2(run, 2.2)) * 0.5, at) * step(at, 0.5 + 0.5 * roadHash(vec2(run, 5.5)));',
		'	float crack = max(across, along) * seen;',
		'	c = mix(c, vec3(0.02, 0.02, 0.022), crack * 0.9);',
		'	r = mix(r, mix(0.9, 0.45, sealed), crack);',
		'	h = mix(h, mix(0.0, 0.6, sealed), crack);',
		/* Patches: some cells of 3.5 by 30 m have one, a box of a metre or two across and a few metres along. */
		'	vec2 pc = vec2(floor(q.x / 3.5), floor(q.y / 30.0));',
		'	if (roadHash(pc + 11.0) > 0.65) {',
		'		vec2 lo = vec2(pc.x * 3.5 + 0.2 + roadHash(pc + 1.0) * 0.9, pc.y * 30.0 + 2.0 + roadHash(pc + 2.0) * 14.0);',
		'		vec2 size = vec2(1.1 + roadHash(pc + 3.0) * 1.3, 1.5 + roadHash(pc + 4.0) * 10.0);',
		'		vec2 d = min(q - lo, lo + size - q);',
		'		float inside = min(d.x, d.y);',
		'		float mended = smoothstep(-px, px, inside);',
		'		float seam = (1.0 - smoothstep(0.012, 0.012 + px, abs(inside))) * seen;',
		'		c = mix(c, c * 0.7, mended);',
		'		r = mix(r, r - 0.06, mended);',
		'		c = mix(c, vec3(0.025), seam * 0.8);',
		'	}',
		'}'
	].join('\n'),

	/* The tiles a model of a material with a Texture draws (Surface): the uniforms they are bound to; none: null. */
	SurfaceTextures: function (renderer, name) {
		var material = this.Defined[name];
		var baked;

		if (!material || !material.Texture || !this.$Service('SceneTextures').Has(material.Texture)) return null;

		baked = this.$Service('SceneTextures').Bake(renderer, material.Texture);

		return baked ? {uEmissiveMap: baked.Color, uNormalMap: baked.Surface, uEmissive: [0, 0, 0], uNormalScale: 0} : null;
	},

	/* The materials of the library. */
	Library: function () {
		var self = this;
		var prefix = 'ElemenxGraphics/materials/';

		/*
		 * Its materials: the material graphs of its resources (blueprints/materials, named ElemenxGraphics/materials/<name>),
		 * each its block GLSL (pattern: the body of its function) and what it is (material: Title, Group, Land, Texture, its
		 * Order among them); one an Application gives of that name takes its place.
		 */
		Elemenx.Resources('Blueprints').filter(function (name) {
			return name.indexOf(prefix) === 0;
		}).map(function (name) {
			return Elemenx.Resources('Blueprints', name);
		}).sort(function (a, b) {
			return (a.material && a.material.Order || 0) - (b.material && b.material.Order || 0);
		}).forEach(function (graph) {
			var pattern = graph.blocks.filter(function (block) {
				return block.type === 'GLSL';
			})[0];
			var code = pattern ? pattern.properties.filter(function (property) {
				return property.key === 'Code';
			})[0] : null;
			var meta = graph.material || {};

			self.Define(graph.name, Object.assign({Title: meta.Title || graph.name, Group: meta.Group || 'other', Land: !!meta.Land}, meta.Texture ? {Texture: meta.Texture} : {}, {Code: code ? String(code.value) : ''}));
		});
	}
});
