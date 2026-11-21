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
 *   octaves), enx_mnf and enx_mff (the same with wide, how much of p a pixel covers: what is finer than two pixels is their
 *   mean, 0.5), enx_mc (cells: f1, f2 and two hashes of the nearest) and enx_ms (px, size: 1 where features of size are
 *   seen, 0 where they are too small))}. Built in: lawn, soil (moss, leaves, pebbles), gravel (sandy, colored grains), clay
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
 * - Glsl(): its texts of GLSL of the ground and of roads (Helpers, LandSlope, LandRag, LandTexture, LandCliff, RoadWear), each
 *   of the block GLSL of its graph (blueprints/glsl/<name>), read again (an Application changed one).
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneMaterials', {
	$Meta: {
		Description: 'The library of materials of a Scene: patterns of GLSL in metres of the world, for the ground, roads and models.',
		Methods: ['Names(group)', 'Has(name)', 'Get(name)', 'Define(name, material)', 'Chunk(names)', 'Land(names)', 'LandNames()', 'Surface(name)', 'Glsl()']
	},

	/* The library once, kept in the service itself: each use of the service sees the materials defined by any. */
	$OnCreate: function () {
		this.Glsl();

		if (!Object.keys(this.Defined).length)
			this.Library();
	},

	/*
	 * Its GLSL of the ground and of roads, each field the block GLSL of a graph of the resources (blueprints/glsl/<name>,
	 * ElemenxGraphics/glsl/<name>: helpers, land-slope, land-rag, land-texture, land-cliff, road-wear): an Application gives
	 * one of that name in its place. Regression: texts of the code.
	 */
	GlslNames: {Helpers: 'helpers', LandSlope: 'land-slope', LandRag: 'land-rag', LandTexture: 'land-texture', LandCliff: 'land-cliff', RoadWear: 'road-wear'},

	Glsl: function () {
		var self = this;

		if (typeof Elemenx === 'undefined' || !Elemenx.Resources) return;

		Object.keys(this.GlslNames).forEach(function (field) {
			var graph = Elemenx.Resources('Blueprints', 'ElemenxGraphics/glsl/' + self.GlslNames[field]);
			var block = graph ? graph.blocks.filter(function (one) {
				return one.type === 'GLSL';
			})[0] : null;
			var code = block ? block.properties.filter(function (property) {
				return property.key === 'Code';
			})[0] : null;
			if (code)
				self[field] = String(code.value);
		});
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
	Helpers: '',

	Chunks: {},

	/* The GLSL of materials by name and of enx_material choosing one of them by its index (unknown names: nothing). */
	Chunk: function (names) {
		var key = names.join(',');
		var lines;

		if (this.Chunks[key])
			return this.Chunks[key];

		lines = [this.$Service('Noise').GLSLChunk(['enx_value2', 'enx_white', 'enx_white2']), this.Helpers, this.Functions(names)];

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
		var lines = [this.$Service('Noise').GLSLChunk(['enx_value2', 'enx_white', 'enx_white2']), this.Functions(names), this.LandSlope, this.LandRag];
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

		/* The slopes of the place on the screen for its tiles, taken here where all pixels go (SceneTextures tex_px, tex_grad). */
		if (textured.length)
			lines.push('\tlandDX = dFdx(place);', '\tlandDY = dFdy(place);', '\ttex_px_layer = length(fwidth(place));');

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
				lines.push('\tif (w > 0.02) { vec3 c; float h; float lit; landTexture(' + layer + '.0, ' + Number(textures.Get(material.Texture).Metres).toFixed(4) + ', ' + (textures.Get(material.Texture).Rows ? '-1.0' : '1.0') + ', place, c, h, lit); c = landColored(' + layer + '.0, c, color) * mix(1.0, lit, 0.6); sum += c * w; high += h * 0.03 * w; total += w; }');

				return;
			}

			lines.push('\tif (w > 0.02) { vec3 c = color; float r = 1.0; float m = 0.0; float h = 0.0; enx_mat' + index + '(side, px, c, r, m, h); sum += c * w; high += h * w; total += w; }');
		});

		lines.push('\tif (total > 0.0) {', '\t\tcolor = mix(color, sum / total, min(1.0, cover));', '\t\theight = high / total * min(1.0, cover);', '\t}');

		/* What is steep: the face of a cliff, its beds of the height in the world; under it, at a gentler slope, scree. */
		if (textured.indexOf('cliff') !== -1)
			lines.push('\tlandCliff(' + textured.indexOf('cliff') + '.0, ' + Number(this.$Service('SceneTextures').Get('cliff').Metres).toFixed(4) + ', ' + textured.indexOf('dirt') + '.0, ' + Number(this.$Service('SceneTextures').Get('dirt').Metres).toFixed(4) + ', place, color, height);');

		/* Under rock (a cave, a tunnel): its rock, from all three sides. */
		if (textured.indexOf('cave-rock') !== -1)
			lines.push('\tlandCave(' + textured.indexOf('cave-rock') + '.0, ' + Number(this.$Service('SceneTextures').Get('cave-rock').Metres).toFixed(4) + ', place, color, height);');

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

		/*
		 * Earth for what is fairly steep (scree, the bank of a cut), the face of a cliff for what is steep, then the rock of a
		 * cave for what is under rock (landUnder), on any ground: the last layers.
		 */
		['dirt', 'cliff', 'cave-rock'].forEach(function (name) {
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
	LandSlope: '',

	/*
	 * A noise of the place for each material of a ground (its slot, n): metres and tens of centimetres, from -0.3 to 0.3;
	 * where materials meet, the one it lifts most there shows (landMaterials), so the edge of a lawn is torn as one is.
	 */
	LandRag: '',

	LandTexture: '',

	/*
	 * The face of a cliff where the ground is steep: the tile cliff from its two sides (none from over it: nothing smears down
	 * it), each bed tinted by its height in the world (sandy, ochre, grey, red, brown, a few metres each, warped along it),
	 * a bed of soil under the grass at its top edge; where it gets gentler below, scree of the same rock.
	 */
	LandCliff: '',

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
				this.$Service('Noise').GLSLChunk(['enx_value2', 'enx_white', 'enx_white2']),
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
			this.$Service('Noise').GLSLChunk(['enx_value2', 'enx_white', 'enx_white2']),
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
	RoadWear: '',

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
