/*
 * Scatter: what fills a ground in masses, with no object of its own for each thing. A SceneObject of a kind with the
 * trait Scatter (forest, grove, thicket, rocks, or one of your own) sows models over a ground by its rules: Shapes (the
 * names of models), Density (a hundred square units), Size (the smallest and the largest, in sizes of the model),
 * MinHeight, MaxHeight, MaxSlope, Cover (0 to 1: how much of the ground its patches take, 1 all of it), Patch (the size
 * of its patches), Clumps (0 to 1: thick in groves of the size of Patch and thin between them), Seed, Blocks (no way
 * through them). A SceneObject of a kind with the trait Grass (grass) grows blades in the vertex shader round the view:
 * Density, Height, Spread (0 to 1: how unlike in height one blade is to the next, a lawn 0.05, a wild meadow 0.6; 0.45),
 * Clumps (0 to 1: tufts and glades of the size of Patch, 24), Color, MaxHeight, MaxSlope; with Shapes (a model of grass, a file
 * too) it sows that model, thick, up to Reach from the eye. Reach holds for any rule; Grid (a size) lays Shapes as tiles,
 * one a cell, turned by quarters, the way to build a land out of ready pieces.
 *
 * The Biomes of the World of a ground (lands by their climate, SceneWorld) bring the colors, the rules and the grass of
 * each, each rule growing only in its own land (Biome of a rule), mingled where they meet; a SceneObject of kind village lays out houses and their roads at its X and Y (Houses, Radius, Seed), and what
 * is sown keeps away from them.
 *
 * The things live in squares of the ground, typed arrays made in workers (SceneSower), the nearest first. Each square in view
 * gives its things to the stream of their model and level: near the whole model, farther two simpler ones (SceneModels.Levels),
 * far a picture baked from all sides that is lit as the model is (Renderer.Target). The streams are made again only
 * when the view moved, so a still view costs no work, and a few draws show them all.
 *
 * Methods: Sown() ({Things, Squares, Waiting (the squares not sown yet, those in a worker among them), Draws, Blades}), SownNear(x, z, radius) (what is sown round a point: [{Model, X, Y, Z,
 * Size, Turn, Key}]), ChangeSown(key, changes) (a thing sown changed by hand, made so again each time it is sown: {Remove,
 * Model, X, Z, Turn, Size}; null forgets the change; kept in Save), UnlinkSown(key) (a thing sown made an object of the
 * scene of its own, kind thing, where it stood: its ID; it is sown no more).
 */
Elemenx.Trait('SceneScatter', {
	/* What is sown before ScatterStart gives its own (a scene with no WebGL never sows): nothing. */
	Sown: function () {
		return {Things: 0, Squares: 0, Waiting: 0, Draws: 0, Copies: 0, Blades: 0};
	},

	SownNear: function () {
		return [];
	},

	ChangeSown: function () {
		return false;
	},

	UnlinkSown: function () {
		return null;
	},

	ScatterStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var graphics = this.$Service('Renderer');
		var meshes = this.$Service('Meshes');
		var math = this.$Service('Math');
		var library = this.$Service('SceneModels');
		var vectors = math.Vectors;
		var shaders = this.Grassed(this.Winded(this.ScatterShaders(graphics)));
		var size = 48;
		var steps = [[62, 74], [140, 165], [270, 310]];
		var state = {Sown: Math.random().toString(36).slice(2, 8), Generation: 0, Running: 0, Flying: 0, Kept: {}, Houses: [], Settled: '', Surfaces: {}, Facades: {}, Buildings: {}, Key: '', Squares: [], Waiting: [], Streams: {}, Meshes: {}, Baked: {}, Blocked: {}, Things: 0, Moved: true, Eye: null, Look: null, Grass: null, Field: null, Programs: null, Edits: {}, Places: {}, Tiles: {}, Chosen: [], Shapes: {}, Geometries: {}, Making: 0, Heights: {}};

		/*
		 * The proxies of tiles (SceneProxies), as Voxy draws a far land: a tile is a square of 48 m times 2, 4, 8... of the
		 * ground, all its things one simpler shape, each corner snapped to a grid of Cells cells across it. A tile is drawn
		 * so where that grid is finer on the screen than Error pixels (each cell of it as small as that), its squares then
		 * left out; nearer, its four tiles, down to the squares and their copies. A proxy is made in a worker the first time
		 * it is wanted, once all its squares are sown; till then the squares stand for it.
		 */
		var tiles = {Cells: 48, Error: 2.5, Making: 2};

		this.Sown = function () {
			return {Things: state.Things, Squares: state.Squares.length, Waiting: state.Waiting.length + state.Flying, Draws: Object.keys(state.Streams).filter(function (key) {
				return state.Streams[key].Count;
			}).length + state.Chosen.length, Copies: Object.keys(state.Streams).reduce(function (sum, key) {
				return sum + state.Streams[key].Count;
			}, 0), Blades: state.Grass ? state.Grass.Blades : 0, Tiles: state.Chosen.length, Proxies: Object.keys(state.Tiles).filter(function (key) {
				return state.Tiles[key].Mesh;
			}).length, Cached: state.Cached || 0};
		};

		/*
		 * A surface that fades as a level gives way to the next: a pattern of holes that grows, so nothing pops. vFade is how
		 * far it came in and how much of it is left: the one that comes keeps exactly the points the one that goes lost.
		 */
		function dithered (fragment) {
			var at = fragment.lastIndexOf('void main() {');

			return fragment.slice(0, at) + 'in vec2 vFade;\nuniform float uDither;\nvoid main() {\n\tfloat hole = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uDither * 0.618034);\n\tif (hole >= vFade.y || hole < 1.0 - vFade.x) discard;' + fragment.slice(at + 13);
		}

		/*
		 * A building far away: its simpler shape colored by its facades baked once (facade), each face by the side it looks
		 * to (four sides and the roof, in the space of the model), so its windows stay where they were and it is never a
		 * picture turned to the eye. Where the picture has nothing (a face the bake did not see), its own color.
		 */
		function faced (fragment) {
			var at = fragment.lastIndexOf('void main() {');

			return fragment.slice(0, at) + [
				'in vec3 vBodyNormal;',
				'uniform sampler2D uFacade;',
				'uniform vec3 uBoxMin;',
				'uniform vec3 uBoxMax;',
				'vec3 facadeColor(vec3 p, vec3 normal, vec3 own) {',
				'	vec3 a = abs(normal);',
				'	vec3 t = clamp((p - uBoxMin) / max(uBoxMax - uBoxMin, vec3(1e-4)), 0.001, 0.999);',
				'	vec2 uv;',
				'	float cell;',
				'	if (a.y > a.x && a.y > a.z) {',
				'		uv = t.xz;',
				'		cell = 4.0;',
				'	}',
				'	else if (a.x > a.z) {',
				'		uv = t.zy;',
				'		cell = normal.x > 0.0 ? 0.0 : 1.0;',
				'	}',
				'	else {',
				'		uv = t.xy;',
				'		cell = normal.z > 0.0 ? 2.0 : 3.0;',
				'	}',
				'	vec4 baked = texture(uFacade, (vec2(mod(cell, 3.0), floor(cell / 3.0)) + uv) / vec2(3.0, 2.0));',
				'	return baked.a > 0.5 ? baked.rgb : min(own, vec3(1.0));',
				'}'
			].join('\n') + '\n' + fragment.slice(at).replace('vec3 color = pow(min(vColor, vec3(1.0)), vec3(2.2));', 'vec3 color = pow(facadeColor(vLocal, normalize(vBodyNormal), vColor), vec3(2.2));');
		}

		/* Whether a model is a building: far away it is drawn of its facades, not of a picture. */
		function building (key) {
			var name = key.split('~')[0];
			var info;

			if (state.Buildings[name] === undefined) {
				info = library.Info(name);
				state.Buildings[name] = !!info && (info.Group === 'buildings' || info.Type === 'building');
			}

			return state.Buildings[name];
		}

		/*
		 * The facades of a building, baked once: a view of it in parallel rays from each side and from over it, 256 texels
		 * each, three across and two down (+x, -x, +z, -z, the roof), each cell as large as its box seen from there.
		 */
		function facade (key) {
			var parts = key.split('~');
			var side = 256;
			var whole;
			var mesh;
			var target;
			var min = [Infinity, Infinity, Infinity];
			var max = [-Infinity, -Infinity, -Infinity];
			var size;
			var i;

			if (state.Facades[key])
				return state.Facades[key];

			whole = library.Whole(library.Make(parts[0], {Variant: Number(parts[1])}));

			for (i = 0; i < whole.Positions.length; i += 3) {
				min = [Math.min(min[0], whole.Positions[i]), Math.min(min[1], whole.Positions[i + 1]), Math.min(min[2], whole.Positions[i + 2])];
				max = [Math.max(max[0], whole.Positions[i]), Math.max(max[1], whole.Positions[i + 1]), Math.max(max[2], whole.Positions[i + 2])];
			}

			size = [Math.max(1e-4, max[0] - min[0]), Math.max(1e-4, max[1] - min[1]), Math.max(1e-4, max[2] - min[2])];
			target = renderer.Target(side * 3, side * 2, {Colors: 2, Depth: true});
			mesh = renderer.Mesh(whole);

			target.Begin();

			renderer.Clear([0, 0, 0, 0]);

			/* Each view: across (b) and up (c) of its cell, and the way it looks along (a, sign: from that side). */
			[[0, 1, 2, 1], [0, -1, 2, 1], [2, 1, 0, 1], [2, -1, 0, 1], [1, 1, 0, 2]].forEach(function (view, cell) {
				var a = view[0];
				var sign = view[1];
				var b = view[2];
				var c = view[3];
				var matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

				/* Column-major: clip x of b, clip y of c, depth of a (nearest to the side it is seen from, the least). */
				matrix[b * 4] = 2 / size[b];
				matrix[12] += -2 * min[b] / size[b] - 1;
				matrix[c * 4 + 1] = 2 / size[c];
				matrix[13] += -2 * min[c] / size[c] - 1;
				matrix[a * 4 + 2] = -sign * 2 / size[a];
				matrix[14] += sign * (1 + 2 * min[a] / size[a]) + (sign > 0 ? 0 : -2);

				renderer.Viewport(cell % 3 * side, Math.floor(cell / 3) * side, side, side);
				renderer.Draw(mesh, programs().Bake, {uViewProjection: matrix}, {Cull: 'none'});
			});

			target.End();

			mesh.Destroy();

			state.Facades[key] = {Target: target, Min: min, Max: max};

			return state.Facades[key];
		}

		engine.ScatterWarm = function () {
			programs();
		};

		function programs () {
			/* A GrassGraph of its own that does not compile is told (the event shader) and gives way to the one of the library. */
			if (!state.Programs && self.GrassGraph && self.GrassMade && !engine.Checked('grass', 'GrassGraph', self.GrassMade, shaders.GrassVertex, shaders.Grass)) {
				self.GrassMade = self.Made(null, 'vertex', 'GrassGraph', self.LibraryGrass.bind(self));
				shaders = self.Grassed(self.Winded(self.ScatterShaders(graphics)));
			}

			if (!state.Programs) {
				state.Programs = {
					Many: renderer.Program(shaders.Vertex, engine.Leveled(dithered(self.Shaders(graphics).Solid))),
					Files: renderer.Program(shaders.Vertex, engine.Leveled(dithered(self.Shaders(graphics).Pbr))),
					Depth: renderer.Program(shaders.Vertex, self.Shaders(graphics).Depth),
					/* The shadow of what is cut by the alpha of its picture (leaves): only where there is a leaf. */
					DepthCut: renderer.Program(shaders.Vertex, shaders.DepthCut),
					Bake: renderer.Program(shaders.BakeVertex, shaders.Bake),
					BakeCut: renderer.Program(shaders.BakeCutVertex, shaders.BakeCut),
					Picture: renderer.Program(shaders.PictureVertex, engine.Leveled(dithered(shaders.Picture))),
					Facade: renderer.Program(shaders.Vertex, engine.Leveled(dithered(faced(self.Shaders(graphics).Solid)))),
					Grass: renderer.Program(shaders.GrassVertex, shaders.Grass)
				};
			}

			return state.Programs;
		}

		function rules () {
			var given = scene.Roots.filter(function (object) {
				return object.Traits.Scatter || object.Traits.Grass && (object.Values.Shapes || object.Traits.Grass.Shapes);
			}).map(function (object) {
				/* Grass of models: thick, and only round the eye. */
				return object.Traits.Scatter ? Object.assign({ID: object.ID}, object.Traits.Scatter, object.Values) : Object.assign({ID: object.ID, Reach: 40, Blocks: false}, object.Traits.Grass, {Density: Number(object.Traits.Grass.Density) * 60}, object.Values);
			});

			/* Its plants in the style of the scene (PlantStyle: SceneFlora's once they came; sown again then, the rules changed). */
			return given.concat(lands()).concat(sketched().Rules).map(function (rule) {
				return rule.Shapes && engine.PlantShape ? Object.assign({}, rule, {Shapes: [].concat(rule.Shapes).map(engine.PlantShape)}) : rule;
			});
		}

		/* The grass of a ground of lands by their climate: of the first of them that has one; it grows only in those that have it. */
		function landsGrass () {
			var field = scene.Ground && scene.Ground.Field;
			var registry = self.$Service('SceneBiomes');
			var found = null;

			(field && field.Biomes && field.Options && field.Options.Biomes || []).some(function (entry) {
				var known = registry.Get(typeof entry === 'string' ? entry : entry.Biome || entry.Name);

				found = typeof entry === 'object' && entry.Grass || known && known.Grass || null;

				return !!found;
			});

			return found;
		}

		/* The rules of the lands of a ground by their climate (Biomes): each grows only in its own land (Biome). */
		function lands () {
			var field = scene.Ground && scene.Ground.Field;
			var list = field && field.Biomes && field.Options && field.Options.Biomes || [];
			var registry = self.$Service('SceneBiomes');

			return [].concat.apply([], list.map(function (entry) {
				var name = typeof entry === 'string' ? entry : entry.Biome || entry.Name;
				var known = registry.Get(name);
				var scatter = typeof entry === 'object' && entry.Scatter || known && known.Scatter || [];

				return scatter.map(function (rule, index) {
					return Object.assign({ID: 'land-' + name + '-' + index}, rule, {Biome: name});
				});
			}));
		}

		/*
		 * What the sketch of the ground places: a rule of each area of growth (the shapes of its kind in its area, as thick as its
		 * Density, as easy to go through as its Passability, from 0 none to 1 all), of each field or orchard (in rows), of each line
		 * of things (a piece every Spacing, along its way), the places nothing grows (clearings, masks, roads, rivers, lakes) and
		 * its markers. Made again only when the sketch changes.
		 */
		var presets = {
			forest: {Shapes: ['pine', 'pine', 'oak', 'birch', 'bush', 'stump'], Density: 2.5, Clumps: 0.3, Passability: 0.6},
			meadow: {Shapes: ['fern', 'bush', 'mushroom'], Density: 0.25, Size: [0.6, 1.2], Passability: 1},
			bushes: {Shapes: ['bush', 'bush', 'fern'], Density: 4, Size: [0.7, 1.3], Passability: 0.7},
			thicket: {Shapes: ['bush', 'fern', 'bush', 'oak'], Density: 10, Size: [0.8, 1.4], Passability: 0.1},
			jungle: {Shapes: ['jungle', 'jungle', 'palm', 'fern', 'bush'], Density: 5, Passability: 0.3},
			sequoia: {Shapes: ['sequoia', 'sequoia', 'fern', 'pine'], Density: 0.35, Passability: 0.8},
			fields: {Shapes: ['wheat'], Spacing: 1, Gap: 1.4, Size: [0.9, 1.1], Passability: 1},
			orchard: {Shapes: ['oak'], Spacing: 6, Gap: 6, Size: [0.45, 0.6], Passability: 0.9},
			row: {Shapes: ['fence'], Spacing: 4, Passability: 0},
			fence: {Shapes: ['fence'], Spacing: 2, Passability: 0, Fit: true},
			hedge: {Shapes: ['hedge'], Spacing: 1.8, Passability: 0, Fit: true},
			wall: {Shapes: ['stone-wall'], Spacing: 1.9, Passability: 0, Fit: true},
			powerline: {Shapes: ['pole'], Spacing: 40, Passability: 1}
		};

		function sketched () {
			var field = scene.Ground && scene.Ground.Field;
			/* The sketch the ground is made of: the one of its World and the roads of the scene over it. */
			var sketch = field && field.Options && field.Options.Sketch || null;
			var terrain = self.$Service('SceneTerrainGenerator');
			var text;
			var made;

			/* Pipes laid on the ground (ScenePiping): nothing grows under them; a pipe laid out again, its count tells. */
			var laid = scene.Piping ? scene.Piping.Made : 0;
			var pipes = [];

			/* Asked for each place a thing may grow: the same sketch in the same scene is what it was. */
			if (state.Sketched && state.SketchOf === sketch && state.SketchVersion === scene.Version && state.PipesLaid === laid) return state.Sketched;

			pipes = (engine.Pipes ? engine.Pipes() : []).filter(function (pipe) {
				return pipe.Laid === 'ground';
			}).map(function (pipe) {
				return {Points: pipe.Points.map(function (point) {
					return [Math.round(point.X * 100) / 100, Math.round(point.Z * 100) / 100];
				}), Reach: pipe.Radius + 0.2};
			});
			text = (sketch ? JSON.stringify(sketch) : '') + (pipes.length ? JSON.stringify(pipes) : '');
			state.SketchOf = sketch;
			state.SketchVersion = scene.Version;
			state.PipesLaid = laid;

			if (state.SketchText === text && state.Sketched) return state.Sketched;

			made = {Rules: [], Areas: [], Lines: [], Markers: []};

			(sketch && sketch.Layers || []).forEach(function (layer) {
				if (layer.Visible === false || layer.Visible === 'false') return;

				(layer.Items || []).forEach(function (item) {
					var kind = terrain.SketchTypes[item.Type];
					var preset = presets[item.Type];
					var rule;

					if (item.Visible === false) return;

					/* Where nothing grows: clearings and masks, and the beds of roads, rivers and lakes. */
					if ((item.Type === 'clearing' || item.Type === 'mask' || item.Type === 'lake') && item.Points && item.Points.length > 2)
						made.Areas.push(item.Points);

					if ((item.Type === 'road' || item.Type === 'street' || item.Type === 'railway' || item.Type === 'river') && item.Points && item.Points.length > 1)
						made.Lines.push({Points: item.Points, Reach: (Number(item.Width) || 6) / 2 + (item.Type === 'river' ? Number(item.Bank === undefined ? 6 : item.Bank) * 0.5 : 1)});

					if (item.Type === 'marker' && item.At || games[item.Type] && (item.At || item.Points))
						made.Markers.push(item);

					if (!preset) return;

					rule = Object.assign({ID: 'sketch-' + item.ID, Seed: item.ID, Cover: 1, MinHeight: 0.2, MaxSlope: kind === 'line' ? 2 : 0.6}, preset);

					['Shapes', 'Density', 'Size', 'Passability', 'Clumps', 'Spacing', 'Gap', 'Way', 'MinHeight', 'MaxSlope', 'Seed'].forEach(function (key) {
						if (item[key] !== undefined && item[key] !== '')
							rule[key] = item[key];
					});

					/* Shapes told as words: 'bench, bin'. */
					if (typeof rule.Shapes === 'string')
						rule.Shapes = rule.Shapes.split(',').map(function (name) {
							return name.trim();
						}).filter(Boolean);

					if (kind === 'area') rule.Area = item.Points;
					else rule.Line = item.Points;

					if (item.Type === 'fields' || item.Type === 'orchard')
						rule.Rows = true;

					made.Rules.push(rule);
				});
			});

			settlements(made);

			pipes.forEach(function (line) {
				made.Lines.push(line);
			});

			state.SketchText = text;
			state.Sketched = made;

			return made;
		}

		/*
		 * The settlements of the sketch (their plans, laid out by Terrain): their buildings, models of Buildings of the class and the
		 * size of each lot, four of each size; their walls, a piece every 6 metres but where a gate is; their gates and towers; the
		 * wheat of their fields; and the walls of towns drawn on their own.
		 */
		function settlements (made) {
			var field = scene.Ground && scene.Ground.Field;
			var plans = field && field.Sketch && field.Sketch.Settlements ? field.Sketch.Settlements() : [];
			var buildings = self.$Service('SceneBuildingGenerator');
			var sketch = field && field.Options && field.Options.Sketch;
			var lit = {};

			/* Nothing grows on the streets a settlement laid out itself: they are in no layer of the sketch. */
			plans.forEach(function (plan) {
				(plan.Streets || []).forEach(function (street) {
					if (street.Points && street.Points.length > 1)
						made.Lines.push({Points: street.Points, Reach: (Number(street.Width) || 6) / 2 + 1.5});
				});
			});

			(sketch && sketch.Layers || []).forEach(function (layer) {
				(layer.Items || []).forEach(function (item) {
					if (item.Type === 'settlement')
						lit[item.ID] = Number(item.Lit) || 0;

					/* A wall drawn alone: its pieces and a tower at each of its corners; open at its Gates ([{X, Z, Radius, Turn, Model}]), a gate in those that name one. */
					if (item.Type === 'citywall' && item.Points && item.Points.length > 1) {
						made.Rules.push({ID: 'sketch-' + item.ID, Shapes: ['city-wall'], Line: item.Points, Spacing: 6, Fit: true, Passability: 0, Cover: 1, MinHeight: -100, Gates: item.Gates || []});
						made.Rules.push({ID: 'sketch-' + item.ID + '/towers', Fixed: item.Points.map(function (point) {
							return {X: point[0], Z: point[1], Model: 'wall-tower'};
						}), Passability: 0});
						made.Rules.push({ID: 'sketch-' + item.ID + '/gates', Passability: 1, Fixed: (item.Gates || []).filter(function (gate) {
							return gate.Model;
						}).map(function (gate) {
							return {X: gate.X, Z: gate.Z, Turn: gate.Turn || 0, Model: gate.Model};
						})});
					}

					/* A landmark: an object of the scene, as a marker is. */
					if (item.Type === 'landmark' && item.At)
						made.Markers.push(Object.assign({}, item, {Role: 'landmark'}));

					/* The fields of a district grow wheat in rows. */
					if (item.Type === 'district' && item.Kind === 'fields' && item.Points && item.Points.length > 2)
						made.Rules.push({ID: 'sketch-' + item.ID, Shapes: ['wheat'], Area: item.Points, Rows: true, Spacing: 1, Gap: 1.4, Size: [0.9, 1.1], Passability: 1, Cover: 1, MinHeight: 0.2, MaxSlope: 0.6});
				});
			});

			plans.forEach(function (plan, index) {
				var id = 'settlement-' + index;
				var gates = plan.Gates;

				made.Rules.push({ID: id, Passability: 0, Fixed: plan.Lots.map(function (lot, number) {
					var variant = number % 4;
					var name = 'settle-' + lot.Class + '-' + Math.round(lot.Width) + 'x' + Math.round(lot.Depth) + '-' + Math.round((lit[plan.ID] || 0) * 10) + '-' + variant;
					if (!library.Has(name))
						buildings.Define(name, Object.assign(buildings.Random({Class: lot.Class}, name), {Width: lot.Width, Depth: lot.Depth, Lit: lit[plan.ID] || 0}));

					return {X: lot.X, Z: lot.Z, Turn: lot.Turn, Model: name, Size: library.Info(name).Size, Width: lot.Width, Depth: lot.Depth};
				})});

				plan.Walls.forEach(function (ring, number) {
					made.Rules.push({ID: id + '/wall-' + number, Shapes: ['city-wall'], Line: ring, Spacing: 6, Fit: true, Passability: 0, Cover: 1, MinHeight: -100, Gates: gates});
				});

				made.Rules.push({ID: id + '/towers', Passability: 0, Fixed: plan.Towers.map(function (tower) {
					return {X: tower.X, Z: tower.Z, Model: 'wall-tower'};
				})});

				/* A gate turned along its wall, and a way through it. */
				made.Rules.push({ID: id + '/gates', Passability: 1, Fixed: gates.map(function (gate) {
					var best = {Far: Infinity, Turn: 0};

					plan.Walls.forEach(function (ring) {
						var n;

						for (n = 0; n + 1 < ring.length; n++) {
							var dx = ring[n + 1][0] - ring[n][0];
							var dz = ring[n + 1][1] - ring[n][1];
							var t = Math.max(0, Math.min(1, ((gate.X - ring[n][0]) * dx + (gate.Z - ring[n][1]) * dz) / (dx * dx + dz * dz || 1)));
							var far = Math.hypot(ring[n][0] + dx * t - gate.X, ring[n][1] + dz * t - gate.Z);
							if (far < best.Far)
								best = {Far: far, Turn: Math.atan2(-dz, dx)};
						}
					});

					return {X: gate.X, Z: gate.Z, Turn: best.Turn, Model: 'gate'};
				})});
			});
		}

		/* The villages of the ground, once: their houses are objects of the scene, their roads are on the ground. */
		function settle (field) {
			var villages = scene.Roots.filter(function (object) {
				return object.Traits.Settlement;
			});
			var key = villages.map(function (object) {
				return JSON.stringify([object.ID, object.Traits.Settlement, object.Values]);
			}).join('|') + field.Size + field.Top + ':' + (self.RoadsState ? self.RoadsState.Version : 0);
			var made = [];
			var roads = [];

			if (state.Settled === key) return;

			state.Settled = key;
			state.Kept = {};

			state.Houses.forEach(function (id) {
				self.Remove(id);
			});

			state.Houses = [];

			villages.forEach(function (object) {
				var plan = self.$Service('SceneBiomes').Village(field, Object.assign({}, object.Traits.Settlement, object.Values, {Seed: object.Values.Seed === undefined ? object.ID : object.Values.Seed}));

				plan.Objects.forEach(function (house, index) {
					var id = object.ID + '/house-' + index;
					var size = house.Size;

					/* No house on a road of the scene. */
					if (self.RoadsState && self.$Service('SceneRoads').Under(self.RoadsState.Made, house.X, house.Y)) return;

					/* Made of its village: marked so, never saved, made again of it. */
					made.push({ID: id, Kind: house.Kind, Name: house.Kind.charAt(0).toUpperCase() + house.Kind.slice(1), X: house.X, Y: house.Y, Size: size, Generated: object.ID, Traits: {Model: {Size: size}}});
					state.Houses.push(id);

					keep(house.X, house.Y, size * 0.8);
				});

				roads = roads.concat(plan.Roads);
			});

			field.Roads = roads.length ? roads : null;

			if (roads.length || made.length) {
				Object.keys(scene.Ground.Nodes).forEach(function (name) {
					scene.Ground.Nodes[name].Mesh.Destroy();

					delete scene.Ground.Nodes[name];
				});

				state.Key = '';
			}

			if (made.length) {
				window.setTimeout(function () {
					self.Add(made);
				}, 0);
			}
		}

		/* The triggers and zones of a sketch, objects of the scene of their kind (the trait Triggers), by the shape of each type. */
		var games = {trigger: 'area', triggerpoint: 'circle', triggerline: 'line', zone: 'area'};

		function game (item, id) {
			var points = item.Points || [];
			var at = item.At || points.reduce(function (sum, point) {
				return [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length];
			}, [0, 0]);
			var spec = {ID: id, Kind: item.Type === 'zone' ? 'zone' : 'trigger', Name: item.Name || item.Type, X: Number(at[0]) || 0, Y: Number(at[1]) || 0};
			var keys = item.Type === 'zone' ? ['Points', 'Tags', 'Team'] : ['Points', 'Radius', 'Width', 'Height', 'Team', 'Kinds', 'Once', 'Enabled', 'Achievement', 'Blueprint', 'Parameters'];

			if (item.Type !== 'zone')
				spec.Shape = games[item.Type];

			keys.forEach(function (key) {
				if (item[key] !== undefined && item[key] !== '' && !(key === 'Points' && games[item.Type] === 'circle'))
					spec[key] = item[key];
			});

			return spec;
		}

		/*
		 * The markers of the sketch, objects of the scene of kind marker (its Role, Team, Name: what a game looks for, as where a
		 * hero or enemies come), with what shows of their role: a camp its tent and its fire, ruins their stones, a cave the
		 * boulders of its mouth, a spring its mist; its triggers and zones.
		 */
		/*
		 * A place off the ways (roads, streets, railways, rivers of the sketch): a thing of a size on one of them is moved aside,
		 * out of its edge, and told in the console; [x, z] as it was when none is there.
		 */
		function aside (x, z, size, name) {
			var lines = sketched().Lines;
			var at = [x, z];
			var moved = false;
			var round;

			for (round = 0; round < 3; round++) {
				lines.forEach(function (line) {
					var i;

					for (i = 0; i + 1 < line.Points.length; i++) {
						var a = line.Points[i];
						var b = line.Points[i + 1];
						var dx = b[0] - a[0];
						var dz = b[1] - a[1];
						var long = dx * dx + dz * dz;
						var t = long ? Math.max(0, Math.min(1, ((at[0] - a[0]) * dx + (at[1] - a[1]) * dz) / long)) : 0;
						var px = at[0] - (a[0] + dx * t);
						var pz = at[1] - (a[1] + dz * t);
						var far = Math.sqrt(px * px + pz * pz);
						var wanted = line.Reach + size / 2 + 2;
						var side;

						if (far >= wanted) continue;

						/* Out along the side it is on (on the very line, the left of its way). */
						side = far > 0.01 ? [px / far, pz / far] : [-dz / Math.sqrt(long || 1), dx / Math.sqrt(long || 1)];
						at = [at[0] + side[0] * (wanted - far), at[1] + side[1] * (wanted - far)];
						moved = true;
					}
				});
			}

			if (moved && window.console)
				window.console.warn('Elemenx Scene: ' + (name || 'a landmark') + ' stood on a way, moved aside to ' + Math.round(at[0]) + ', ' + Math.round(at[1]));

			return at;
		}

		function mark () {
			var markers = sketched().Markers;
			var key = JSON.stringify(markers);
			var made = [];

			if (state.MarkKey === key) return;

			state.MarkKey = key;

			(state.Marked || []).forEach(function (id) {
				self.Remove(id);
			});

			state.Marked = [];

			markers.forEach(function (item) {
				var id = 'sketch-' + item.ID;

				if (games[item.Type]) {
					made.push(game(item, id));

					return;
				}

				var x = Number(item.At[0]) || 0;
				var z = Number(item.At[1]) || 0;
				var role = item.Role || 'spawn';

				/* A landmark is a building of the scene, its own model, never on a way; a marker an object a game finds. */
				if (role === 'landmark') {
					var off = aside(x, z, Number(item.Size) || (library.Info(item.Model || 'temple') || {Size: 10}).Size, item.Name || item.Model);

					x = off[0];
					z = off[1];
				}

				if (role === 'landmark') made.push({ID: id, Kind: 'house', Name: item.Name || item.Model || 'temple', X: x, Y: z, Model: item.Model || 'temple', Size: Number(item.Size) || (library.Info(item.Model || 'temple') || {Size: 10}).Size, Facing: Number(item.Facing) || 0});
				else made.push({ID: id, Kind: 'marker', Name: item.Name || role, X: x, Y: z, Role: role, Team: item.Team || ''});

				if (role === 'camp')
					made.push({ID: id + '/tent', Kind: 'thing', X: x + 3, Y: z + 1, Model: 'tent', Size: 3, Facing: 200}, {ID: id + '/fire', Kind: 'effect', Type: 'campfire', X: x, Y: z});

				if (role === 'ruins')
					made.push({ID: id + '/ruin', Kind: 'thing', X: x, Y: z, Model: 'ruin', Size: 6});

				if (role === 'spring')
					made.push({ID: id + '/mist', Kind: 'effect', Type: 'steam', Size: 0.4, X: x, Y: z});

				if (role === 'cave') {
					[[-3, 0], [3, 0], [0, -2.5]].forEach(function (at, index) {
						made.push({ID: id + '/rock-' + index, Kind: 'thing', X: x + at[0], Y: z + at[1], Model: 'boulder', Size: 5});
					});
				}
			});

			state.Marked = made.map(function (spec) {
				return spec.ID;
			});

			if (made.length) {
				window.setTimeout(function () {
					self.Add(made);
				}, 0);
			}
		}

		/* The cells of 4 by 4 that nothing is sown on. */
		function keep (x, z, reach) {
			var cx;
			var cz;

			for (cz = Math.floor((z - reach) / 4); cz <= Math.floor((z + reach) / 4); cz++) {
				for (cx = Math.floor((x - reach) / 4); cx <= Math.floor((x + reach) / 4); cx++)
					state.Kept[cx + ':' + cz] = true;
			}
		}

		/* Two keys of parts (lists of texts) alike, part by part. */
		function same (a, b) {
			return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(function (part, index) {
				return part === b[index];
			});
		}

		/* Everything sown goes when the ground or the rules changed. */
		function prepare () {
			var ground = scene.Ground;
			var given = rules();
			var key;
			var half;
			var x;
			var z;

			if (ground && !ground.Field.Whole) {
				settle(ground.Field);

				mark();
			}

			/*
			 * What a sketch sows is told by its text: its lots are many, and the key is made every frame. Its parts are compared
			 * one by one (same): the key of the ground is a megabyte and more, a text of all of them made each frame cost
			 * milliseconds.
			 */
			key = ground ? [ground.Key, JSON.stringify(given.slice(0, given.length - sketched().Rules.length)), state.SketchText || '', JSON.stringify(state.Edits)] : [''];

			if (same(key, state.Key)) return;

			state.Key = key;
			state.Generation = (state.Generation || 0) + 1;
			state.Running = 0;
			state.Flying = 0;
			state.Squares = [];
			state.Places = {};
			state.Heights = {};
			state.Chosen = [];
			state.Making = 0;

			Object.keys(state.Tiles).forEach(function (name) {
				if (state.Tiles[name].Mesh)
					state.Tiles[name].Mesh.Destroy();
			});

			state.Tiles = {};
			state.Waiting = [];
			state.Blocked = {};
			state.Things = 0;
			state.Moved = true;

			if (!ground || ground.Field.Whole || !given.length) return;

			half = ground.Field.Size / 2;

			for (z = -half; z < half; z += size) {
				for (x = -half; x < half; x += size)
					state.Waiting.push({X: x, Z: z, Lists: {}});
			}
		}

		/*
		 * What the jobs of the sowing of a generation share (a context of SceneSower.Sow), made once: the ground (its options, its
		 * field made once by each worker; in the page, the field itself), the rules, what keeps the ground free, the models of the
		 * shapes (their sizes and the Keys of their variants).
		 */
		function context (ground, inline) {
			var table = {};
			var made;
			var list;

			if (state.Context && state.Context.Generation === state.Generation && state.Context.Inline === inline) return state.Context.Data;

			made = sketched();
			list = self.$Service('SceneSower').Compile(rules());

			/* The models of the rules, and those things sown were changed to by hand. */
			list.concat([{Shapes: Object.keys(state.Edits).map(function (key) {
				return state.Edits[key].Model;
			}).filter(Boolean)}]).forEach(function (rule) {
				[].concat(rule.Shapes || (rule.Fixed ? [] : 'pine'), (rule.Fixed || []).map(function (one) {
					return one.Model;
				})).forEach(function (name) {
					var info = table[name] === undefined ? library.Info(name) : null;
					var keys = [];
					var v;

					if (table[name] !== undefined) return;

					if (!info) {
						table[name] = null;

						return;
					}

					for (v = 0; v < 16; v++)
						keys.push(library.Make(name, {Variant: v}).Key);

					table[name] = {Size: info.Size, Keys: keys};
				});
			});

			state.Context = {Generation: state.Generation, Inline: inline, Shared: false, Data: {Key: state.Sown + ':' + state.Generation, Options: inline ? null : ground.Field.Options, Field: inline ? ground.Field : null, Roads: ground.Field.Roads || null, Kept: Object.keys(state.Kept), Rules: list, Free: {Areas: made.Areas, Lines: made.Lines}, Models: table, Size: size, Edits: state.Edits}};

			return state.Context.Data;
		}

		/* The squares of a job, as SceneSower takes them. */
		function placed (squares) {
			return squares.map(function (square) {
				return {X: square.X, Z: square.Z};
			});
		}

		/* What a job sowed: its squares among the others, the way through them stopped where it stops it. */
		function sown (result) {
			result.Squares.forEach(function (square) {
				state.Squares.push(square);

				state.Places[square.X + ':' + square.Z] = square;
			});

			result.Blocked.forEach(function (cell) {
				state.Blocked[cell] = true;
			});

			state.Things += result.Things;
			state.Fresh = true;
		}

		/*
		 * A job of a few squares to a worker; what it sows of a ground made before (another generation) is let go, and the squares of
		 * a worker that failed are sown in the page.
		 */
		function send (pool, sower, batch) {
			var generation = state.Generation;

			state.Running++;
			state.Flying += batch.length;

			pool.Run('SceneSower', 'Sow', [{Context: 'sow:' + state.Sown, Squares: placed(batch)}], function (error, result) {
				/* A job of another generation: what counts the jobs of this one started again. */
				if (generation !== state.Generation) return;

				state.Running--;
				state.Flying -= batch.length;

				sown(error ? sower.Sow({Context: context(scene.Ground, true), Squares: placed(batch)}) : result);
			});
		}

		/*
		 * What is sown, the nearest squares first: in the workers of SceneSower, a few squares a job and two jobs a worker, the
		 * context of the generation sent to each worker once (Share), so a job carries its squares alone and the view is never
		 * held up; with no worker, a few squares a frame in the page.
		 */
		function grow () {
			var ground = scene.Ground;
			var started = performance.now();
			var eye = scene.Eye;
			var sower = self.$Service('SceneSower');
			var pool = sower.Work();
			var inline = pool.Inline();
			if (!state.Waiting.length || !inline && state.Running >= 8) return;

			/* What is sown from files, once they came. */
			if (rules().some(function (rule) {
				return [].concat(rule.Shapes || []).some(function (name) {
					return engine.Known(name) && !library.Ready(name);
				});
			})) return;

			state.Waiting.sort(function (a, b) {
				return Math.abs(b.X - eye[0]) + Math.abs(b.Z - eye[2]) - Math.abs(a.X - eye[0]) - Math.abs(a.Z - eye[2]);
			});

			if (inline) {
				while (state.Waiting.length && performance.now() - started < 4)
					sown(sower.Sow({Context: context(ground, true), Squares: placed([state.Waiting.pop()])}));

				return;
			}

			context(ground, false);

			if (!state.Context.Shared) {
				pool.Share('sow:' + state.Sown, state.Context.Data);

				state.Context.Shared = true;
			}

			while (state.Waiting.length && state.Running < 8)
				send(pool, sower, state.Waiting.splice(Math.max(0, state.Waiting.length - 6), 6));
		}

		/* The six planes of a view, each [a, b, c, d] of the side a point is in when a x + b y + c z + d > 0. */
		function planes (m) {
			return [[m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]], [m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]], [m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]], [m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]], [m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]]].map(function (plane) {
				var length = Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2]) || 1;

				return plane.map(function (value) {
					return value / length;
				});
			});
		}

		function stream (key, level) {
			var name = key + '@' + level;
			if (!state.Streams[name])
				state.Streams[name] = {Key: key, Level: level, Count: 0, Capacity: 0, Places: null, Extra: null};

			return state.Streams[name];
		}

		/*
		 * The copies of a list in the range of a level (from, to: as far as the shader shows them, by their size on the screen:
		 * nearer the lodScale times their Detail). Regression: the copies of a whole square went into each level they might
		 * be in (48 m and the half of it more), a plant of 20 000 triangles run for each, 17 million triangles a frame.
		 */
		function appendNear (target, list, eye, nearer, from, to) {
			var i;

			/* Room for all of them; then written straight in, no list made each frame. */
			append(target, {Places: list.Places.subarray(0, 0), Extra: list.Extra.subarray(0, 0), Count: 0, Room: list.Count});

			for (i = 0; i < list.Count; i++) {
				var x = list.Places[i * 4] - eye[0];
				var y = list.Places[i * 4 + 1] - eye[1];
				var z = list.Places[i * 4 + 2] - eye[2];
				var far = Math.sqrt(x * x + y * y + z * z) * nearer / Math.max(list.Places[i * 4 + 3], 1.5);
				if (far <= from || far >= to) continue;

				target.Places.set(list.Places.subarray(i * 4, i * 4 + 4), target.Count * 4);
				target.Extra.set(list.Extra.subarray(i * 4, i * 4 + 4), target.Count * 4);

				target.Count++;
			}
		}

		function append (target, list) {
			var capacity = target.Capacity;
			var places;
			var extra;

			/* Room: as many as it may yet be given (appendNear). */
			while (target.Count + Math.max(list.Count, list.Room || 0) > capacity)
				capacity = Math.max(1024, capacity * 2);

			if (capacity !== target.Capacity) {
				places = new Float32Array(capacity * 4);
				extra = new Float32Array(capacity * 4);

				if (target.Places) {
					places.set(target.Places);
					extra.set(target.Extra);
				}

				target.Places = places;
				target.Extra = extra;
				target.Capacity = capacity;
			}

			target.Places.set(list.Places, target.Count * 4);
			target.Extra.set(list.Extra, target.Count * 4);

			target.Count += list.Count;
		}

		function levels (key) {
			var parts = key.split('~');

			if (!state.Meshes[key]) {
				var whole = library.Whole(library.Make(parts[0], {Variant: Number(parts[1])}));
				/* A building has a fourth, the shape of the third again: the copies of the farthest of its own. */
				var made = building(key) ? [whole, whole, whole, whole] : [whole, whole, whole];

				state.Geometries[key] = made;
				state.Meshes[key] = made.map(function (geometry) {
					return renderer.Mesh(geometry);
				});

				simplified(key, whole);
			}

			return state.Meshes[key];
		}

		/*
		 * The two simpler levels of a model (SceneModels.Levels: cells of a fifteenth and a fifth of it) made in a worker; till
		 * they come its whole shape stands for them, and then each mesh is given its shape in place (Update), its copies kept.
		 * Regression: made in the page, each model new to the view held a frame up (60 ms a frame for seconds after a flight).
		 */
		function simplified (key, whole) {
			var meshes = state.Meshes[key];
			var radius = library.Bounds(whole).Radius;
			var pool = self.$Service('Workers').Pool('SceneLevels', {Math: true, Meshes: true}, 1);
			var done = 0;
			var shapes = [];

			[radius / 15, radius / 5].forEach(function (cell, level) {
				pool.Run('Meshes', 'Simplify', [whole, cell], function (error, shape) {
					if (state.Meshes[key] !== meshes || renderer.Lost) return;

					shapes[level] = error || !shape ? whole : shape;
					done++;

					if (done < 2) return;

					state.Geometries[key] = [whole, shapes[0], shapes[1]].concat(meshes.length > 3 ? [shapes[1]] : []);

					/* In place: the copies each mesh holds stay, no stream is made again. */
					meshes.forEach(function (mesh, at) {
						if (at)
							mesh.Update(state.Geometries[key][at]);
					});
				});
			});
		}

		/* Whether far tiles are drawn as proxies: the Proxies of the Scene, true unless told false. */
		function proxied () {
			return self.Proxies !== false && self.Proxies !== 'false';
		}

		/*
		 * The data of a model a proxy is made of (SceneProxies.Shape), of its whole shape: its simplest level is snapped to a
		 * grid of a tenth of its size already, a tower of 300 m to cells of 30 (it was gone from a far city). Sent to each
		 * worker once.
		 */
		function shaped (key, pool) {
			var name = 'proxy:' + state.Sown + ':' + key;
			var made;

			if (state.Shapes[key])
				return pool.Inline() ? state.Shapes[key] : name;

			levels(key);

			made = self.$Service('SceneProxies').Shape(state.Geometries[key][0]);
			state.Shapes[key] = made;

			if (!pool.Inline())
				pool.Share(name, made);

			return pool.Inline() ? made : name;
		}

		/* The proxy of a tile made, once all its squares are sown: in a worker, or in the page with none. */
		function make (tile) {
			var proxies = self.$Service('SceneProxies');
			var pool = proxies.Work();
			var generation = state.Generation;
			var lists = [];
			var shapes = {};
			var squares = [];
			var x;
			var z;

			for (z = tile.Z; z < tile.Z + tile.Size; z += size) {
				for (x = tile.X; x < tile.X + tile.Size; x += size) {
					/* Past the ground: no square there. */
					if (x >= scene.Ground.Field.Size / 2 || z >= scene.Ground.Field.Size / 2) continue;

					if (!state.Places[x + ':' + z]) return;

					squares.push(state.Places[x + ':' + z]);
				}
			}

			squares.forEach(function (square) {
				Object.keys(square.Lists).forEach(function (key) {
					/* What grows only round the eye is never far. */
					var list = square.Lists[key];
					if (list.Reach || !list.Count) return;

					shapes[key] = shaped(key, pool);

					lists.push({Shape: key, Places: list.Places.slice(0, list.Count * 4), Extra: list.Extra.slice(0, list.Count * 4), Count: list.Count});
				});
			});

			tile.Stills = stilled(tile, pool, shapes, lists);
			tile.StillOf = scene.StillLists;
			tile.Making = true;
			state.Making++;

			var cache = self.$Service('SceneCache');
			var key = cacheKey(tile, lists);

			function made (result) {
				tile.Mesh = renderer.Mesh(result);
				tile.Triangles = result.Triangles;
				tile.Used = performance.now();

				tile.Mesh.Instance({aInstance: {Size: 4, Data: new Float32Array([tile.Origin[0], tile.Origin[1], tile.Origin[2], 1])}, aInstance2: {Size: 4, Data: new Float32Array([0, 1, 1, 1])}}, 1);

				state.Fresh = true;
			}

			/* Made lately in this page, or kept from a visit before (SceneCache): at once; else made in a worker, and kept for the next. */
			var hot = cache.Peek('proxies', key);

			if (hot && hot.Box) {
				state.Making--;
				state.Cached = (state.Cached || 0) + 1;

				made(self.$Service('SceneProxies').Unpack(hot));

				return;
			}

			cache.Get('proxies', key, function (error, kept) {
				if (generation !== state.Generation) return;

				if (kept && kept.Positions && kept.Box) {
					state.Making--;
					state.Cached = (state.Cached || 0) + 1;

					made(self.$Service('SceneProxies').Unpack(kept));

					return;
				}

				pool.Run('SceneProxies', 'Merge', [{Shapes: shapes, Lists: lists, Origin: tile.Origin, Cell: tile.Size / tiles.Cells}], function (error, result) {
					if (generation !== state.Generation) return;

					state.Making--;

					if (error || !result) return;

					made(result);

					if (Number(self.CacheSize) > 0 && cache.Limit !== Number(self.CacheSize))
						cache.SetLimit(Number(self.CacheSize));

					if (self.CacheSize !== 0 && self.CacheSize !== '0')
						cache.Put('proxies', key, self.$Service('SceneProxies').Pack(result));
				});
			});
		}

		/* A number of a text (FNV-1a), as a word of 8 letters. */
		function digest (text, seed) {
			var value = seed === undefined ? 2166136261 : seed;
			var i;

			for (i = 0; i < text.length; i++)
				value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;

			return value;
		}

		/*
		 * The key a proxy of a tile is kept under (SceneCache): the ground and its rules (their key, summed once a generation),
		 * the tile, and what it is made of: each shape by its size and a sample of its numbers, each copy of what stands still by
		 * its box. A model changed in the library, a house moved: another key, never an old proxy.
		 */
		function cacheKey (tile, lists) {
			var sum;

			if (state.CacheBase === undefined || state.CacheOf !== state.Generation) {
				state.CacheBase = digest(String(self.$Service('SceneProxies').Merge) + String(self.$Service('SceneProxies').Faces) + String(self.$Service('SceneProxies').Pack), digest((state.Key || []).join('\n')));
				state.CacheOf = state.Generation;
			}

			sum = digest(tile.Key, state.CacheBase);

			lists.forEach(function (list) {
				var shape = state.Shapes[list.Shape];
				var p = shape ? shape.Positions : [];
				var i;
				var sample = 0;

				for (i = 0; i < p.length; i += 97)
					sample += p[i];

				sum = digest(list.Shape + ':' + list.Count + ':' + p.length + ':' + sample.toFixed(3) + ':' + (list.Matrices ? Array.prototype.join.call(list.Matrices.subarray(9, 12), ',') : ''), sum);
			});

			return tile.Key + ':' + sum.toString(36);
		}

		/*
		 * The meshes of the tiles not drawn for a minute let go (the card holds them no more): back in view, a proxy comes from
		 * the cache of the browser at once.
		 */
		function sweep () {
			var now = performance.now();
			if (now - (state.Swept || 0) < 5000) return;

			state.Swept = now;

			Object.keys(state.Tiles).forEach(function (name) {
				var tile = state.Tiles[name];
				if (!tile.Mesh || now - (tile.Used || 0) < 60000) return;

				tile.Mesh.Destroy();
				tile.Mesh = null;
				tile.Making = false;
			});
		}

		/*
		 * The models of the scene that stand still (its StillLists: a house, a lamp, a statue of a gallery) wholly in a tile,
		 * into its proxy as what is sown is: each copy as its matrix stands it, of the colors of its material (its pictures
		 * of a file as their mean, SceneModels.Painted). Far away they are one draw with the rest of the tile, in every pass,
		 * not one each (hundreds in a world of galleries). What moves, has a skeleton or is seen through stays as it is.
		 * Gives the names of the lists it took.
		 */
		function stilled (tile, pool, shapes, lists) {
			var still = scene.StillLists || {};
			var taken = [];

			Object.keys(still).forEach(function (name) {
				var list = still[name];
				var box = list.Box;
				var key = 'still:' + name;
				var matrices;
				var tints;
				var i;

				if (!list.Count || !box || !list.Geometry || !list.Geometry.Positions || list.Skinned || list.MirrorKey || list.Material && (list.Material.Transmission || list.Material.Alpha === 'BLEND')) return;

				if (box[0] < tile.X || box[3] > tile.X + tile.Size || box[2] < tile.Z || box[5] > tile.Z + tile.Size) return;

				if (!state.Shapes[key]) {
					state.Shapes[key] = self.$Service('SceneProxies').Shape(list.Material ? library.Painted(Object.assign({}, list.Geometry, {Colors: null}), list.Material, list.Asset || {Images: []}) : list.Geometry);

					if (!pool.Inline())
						pool.Share('proxy:' + state.Sown + ':' + key, state.Shapes[key]);
				}

				shapes[key] = pool.Inline() ? state.Shapes[key] : 'proxy:' + state.Sown + ':' + key;
				matrices = new Float32Array(list.Count * 12);
				tints = new Float32Array(list.Count * 3);

				for (i = 0; i < list.Count; i++) {
					matrices.set([list.X[i * 4], list.X[i * 4 + 1], list.X[i * 4 + 2], list.Y[i * 4], list.Y[i * 4 + 1], list.Y[i * 4 + 2], list.Z[i * 4], list.Z[i * 4 + 1], list.Z[i * 4 + 2], list.Places[i * 4], list.Places[i * 4 + 1], list.Places[i * 4 + 2]], i * 12);
					tints.set([list.Tints[i * 4], list.Tints[i * 4 + 1], list.Tints[i * 4 + 2]], i * 3);
				}

				lists.push({Shape: key, Matrices: matrices, Tints: tints, Count: list.Count});
				taken.push(name);
			});

			return taken;
		}

		/*
		 * The still lists of the scene the chosen tiles drew: Covered, the passes of the scene draw them not (Scene, seen).
		 * names null: none.
		 */
		function cover (names) {
			var still = scene.StillLists || {};

			(state.Covered || []).forEach(function (name) {
				if (still[name])
					still[name].Covered = false;
			});

			state.Covered = (names || []).filter(function (name) {
				return still[name];
			});

			state.Covered.forEach(function (name) {
				still[name].Covered = true;
			});
		}

		/*
		 * The tiles drawn as proxies now, from the largest down: a tile far enough (its grid under Error pixels on the
		 * screen from its nearest point) is drawn whole when its proxy is made (else it is asked for, and its squares stand
		 * for it); nearer, its four. Gives the keys of the squares the chosen tiles hold.
		 */
		function choose (eye, quality, view) {
			var field = scene.Ground.Field;
			var half = field.Size / 2;
			var height = renderer.Height / Math.max(1, renderer.Ratio || 1);
			var focal = height / (2 * Math.tan((scene.Camera.Fov || 50) * Math.PI / 360));
			var top = Math.max(1, Math.ceil(Math.log(field.Size / size) / Math.LN2));
			var covered = {};
			var count = Math.ceil(field.Size / (size * Math.pow(2, top)));
			var stills = [];
			var ix;
			var iz;

			state.Chosen = [];

			function visit (level, x0, z0) {
				var extent = size * Math.pow(2, level);
				var dx = Math.max(x0 - eye[0], 0, eye[0] - x0 - extent);
				var dz = Math.max(z0 - eye[2], 0, eye[2] - z0 - extent);
				var key = level + ':' + x0 + ':' + z0;
				var tile;
				var x;
				var z;

				if (x0 >= half || z0 >= half || !level) return;

				/* Out of view: nothing of it is drawn, as large or as small. */
				if (!inView(view, x0 + extent / 2, z0 + extent / 2, extent)) return;

				if (Math.sqrt(dx * dx + dz * dz + eye[1] * eye[1]) * tiles.Error > extent / tiles.Cells * focal * quality) {
					tile = state.Tiles[key] = state.Tiles[key] || {Key: key, Level: level, X: x0, Z: z0, Size: extent, Origin: [x0 + extent / 2, 0, z0 + extent / 2]};

					/* What stands still changed (a model added, one gone): its proxy is made again, the squares and models stand for it till then. */
					if (tile.Mesh && tile.StillOf !== scene.StillLists) {
						tile.Mesh.Destroy();
						tile.Mesh = null;
						tile.Making = false;
					}

					if (tile.Mesh) {
						tile.Used = performance.now();
						stills = stills.concat(tile.Stills || []);

						/* A tile of nothing (a lake, a road) holds its squares, and has no draw. */
						if (tile.Triangles)
							state.Chosen.push(tile);

						for (z = z0; z < z0 + extent; z += size) {
							for (x = x0; x < x0 + extent; x += size)
								covered[x + ':' + z] = true;
						}

						return;
					}

					/*
					 * Regression (load): proxies were made while the ground was still sown, in workers of their own beside those
					 * of the sowing, in every scene of a page: the sowing came late and slow. They wait for it now, two at a time.
					 */
					if (!tile.Making && state.Making < tiles.Making && !state.Waiting.length && !state.Flying)
						make(tile);
				}

				visit(level - 1, x0, z0);
				visit(level - 1, x0 + extent / 2, z0);
				visit(level - 1, x0, z0 + extent / 2);
				visit(level - 1, x0 + extent / 2, z0 + extent / 2);
			}

			for (iz = 0; iz < count; iz++) {
				for (ix = 0; ix < count; ix++)
					visit(top, -half + ix * size * Math.pow(2, top), -half + iz * size * Math.pow(2, top));
			}

			cover(stills);

			sweep();

			return covered;
		}

		/*
		 * Whether a tile is in what planes see (planes of a view, the points relative to the eye): round its middle at the
		 * height of the ground there, as far as its corners and 200 m over and under them (a hill in it, a tower on it).
		 */
		function inView (view, x, z, extent) {
			var eye = scene.Eye;
			var round = extent * 0.71 + 200;
			/* The height of the ground in the middle of a tile, found once: each frame asks it of every tile, in every slice of the shadow. */
			var key = x + ':' + z;
			var y = (state.Heights[key] === undefined ? state.Heights[key] = scene.Ground.Field.Height(x, z) : state.Heights[key]) - eye[1];

			return view.every(function (plane) {
				return plane[0] * (x - eye[0]) + plane[1] * y + plane[2] * (z - eye[2]) + plane[3] > -round;
			});
		}

		/* The streams of what is in view now, and each its copies for the draws. */
		function gather (matrix) {
			var view = planes(matrix);
			var eye = scene.Eye;
			var reach = scene.Camera.Ortho ? 0 : 1;
			var quality = self.ScatterReach ? self.ScatterReach() : 1;
			var radius = size * 0.75 + 12;
			var margin = reach ? size * 0.75 + 8 : 0;
			var lod = lodScale();
			/* In parallel rays (a map from over it) there are no far tiles: all of it is as far. */
			var covered = reach && proxied() ? choose(eye, quality, view) : {};

			Object.keys(state.Streams).forEach(function (name) {
				state.Streams[name].Count = 0;
			});

			if (!reach || !proxied()) {
				state.Chosen = [];

				cover(null);
			}

			state.Squares.forEach(function (square) {
				if (covered[square.X + ':' + square.Z]) return;

				var x = square.Center[0] - eye[0];
				var y = square.Center[1] - eye[1];
				var z = square.Center[2] - eye[2];
				/* As far round its middle as its tallest thing reaches: a tower whose top is in view is drawn, its square's middle out of it. */
				var round = radius + tallest(square);
				var inside = view.every(function (plane) {
					return plane[0] * x + plane[1] * y + plane[2] * z + plane[3] > -round;
				});
				var distance = reach ? Math.sqrt(x * x + y * y + z * z) : scene.Camera.Ortho;
				var level;

				if (!inside) return;

				/* In parallel rays a whole view is at one level. */
				level = steps.filter(function (border) {
					return distance >= border[1] * quality;
				}).length;

				/*
				 * What a square holds is as far as its middle and up to half of it more or less: it goes in every level one
				 * of its things can be seen at, and the shaders choose by the distance of each.
				 */
				[0, 1, 2, 3].forEach(function (one) {
					var from = one ? steps[one - 1][0] * quality : -Infinity;
					var to = one < 3 ? steps[one][1] * quality : Infinity;

					if (!reach && one !== level) return;

					Object.keys(square.Lists).forEach(function (key) {
						var list = square.Lists[key];
						var sizes;
						var nearer;

						/* What grows only round the eye is not asked for farther. */
						if (reach && list.Reach && distance - margin > list.Reach) return;

						/* In each level its copies may be in by their sizes on the screen: the smallest come into it first, the largest last. */
						if (reach) {
							sizes = sizesOf(list);
							nearer = lod * detail(key);

							if ((distance + margin) * nearer / Math.max(sizes[0], 1.5) <= from || Math.max(0, distance - margin) * nearer / Math.max(sizes[1], 1.5) >= to) return;
						}

						/* A heavy model (Detail): only its copies of this level, not all of its square (their corners all run). */
						if (reach && detail(key) > 1) appendNear(stream(key, one), list, eye, nearer, from, to);
						else append(stream(key, one), list);
					});
				});
			});

			Object.keys(state.Streams).forEach(function (name) {
				var each = state.Streams[name];
				var data;

				/* A stream asked for none of its copies kept (appendNear) has no arrays yet. */
				if (!each.Count) return;

				data = {aInstance: {Size: 4, Data: each.Places.subarray(0, each.Count * 4)}, aInstance2: {Size: 4, Data: each.Extra.subarray(0, each.Count * 4)}};

				if (each.Level < 3 && surfaces(each.Key, each.Level)) {
					surfaces(each.Key, each.Level).forEach(function (one) {
						one.Mesh.Instance(data, each.Count);
					});

					return;
				}

				(each.Level === 3 && !building(each.Key) ? picture(each.Key).Quad : levels(each.Key)[each.Level]).Instance(data, each.Count);
			});
		}

		/*
		 * The surfaces of a model of a file, each with its material: near the eye it is drawn with its pictures. A level past
		 * the nearest has them too when its asset tells its own simpler levels (Lods: a plant of SceneFlora, its leaves cards
		 * cut by their alpha that a simpler shape of its corners would make plates of); else none (its simpler shape, colored).
		 */
		function surfaces (key, level) {
			var parts = key.split('~');
			var model = library.Make(parts[0], {Variant: Number(parts[1])});
			var at = level || 0;
			var id = at ? key + '#' + at : key;
			var lods;
			var rest;

			if (!model.Asset) return null;

			lods = model.Asset.Lods;

			if (at && !(lods && lods[at - 1])) return null;

			if (!state.Surfaces[id] && !at) {
				state.Surfaces[id] = library.Surfaces(model).map(function (one) {
					return Object.assign(one, {Mesh: renderer.Mesh(one.Geometry)});
				});
			}

			/* In the space of the model, as its nearest (the place of its node in it: 1 tall). */
			if (!state.Surfaces[id]) {
				rest = model.Pieces[0] ? model.Pieces[0].Rest : null;

				state.Surfaces[id] = lods[at - 1].map(function (primitive) {
					var geometry = meshes.Merge([{Geometry: primitive.Geometry, Matrix: rest}]);

					return {Material: model.Asset.Materials[primitive.Material], Asset: model.Asset, Soft: 0, Geometry: geometry, Mesh: renderer.Mesh(geometry)};
				});
			}

			return state.Surfaces[id];
		}

		/* Whether a model is drawn of its pictures at every level but the farthest (its asset tells its simpler levels). */
		function textured (key) {
			return !!surfaces(key, 1);
		}

		/*
		 * How many times nearer its levels come than those of a thing as large (its asset's Detail: a plant of SceneFlora is
		 * tens of thousands of triangles near, its simpler levels a fifth and a twentieth of that); 1 for all else.
		 */
		function detail (key) {
			var parts;

			/* Known once for each model (asked for each list of each square at each level, each frame). */
			state.Details = state.Details || {};

			if (state.Details[key] === undefined) {
				parts = key.split('~');
				state.Details[key] = textured(key) ? Number(library.Make(parts[0], {Variant: Number(parts[1])}).Asset.Detail) || 1 : 1;
			}

			return state.Details[key];
		}

		/*
		 * How far a thing is by its size on the screen (uLod): the distances of the levels are those of a thing of 4 metres
		 * on a screen 750 pixels to the focus (700 high at 50 degrees); a thing ten times as large is as small on the screen
		 * ten times as far, a screen of more pixels shows it fine farther. Each copy divides it by its own size.
		 */
		function lodScale () {
			var height = renderer.Height / Math.max(1, renderer.Ratio || 1);
			var focal = height / (2 * Math.tan((scene.Camera.Fov || 50) * Math.PI / 360));

			return 4 * 750 / Math.max(100, focal);
		}

		/* How far over the ground of a square its tallest thing reaches, past what the square's own reach holds. */
		function tallest (square) {
			if (square.Tallest === undefined) {
				square.Tallest = 0;

				Object.keys(square.Lists).forEach(function (key) {
					square.Tallest = Math.max(square.Tallest, sizesOf(square.Lists[key])[1] - 12);
				});
			}

			return square.Tallest;
		}

		/* The sizes of the copies of a list ([smallest, largest]), found once. */
		function sizesOf (list) {
			var i;

			if (list.Sizes && list.Sizes[2] === list.Count) return list.Sizes;

			list.Sizes = [Infinity, 0, list.Count];

			for (i = 0; i < list.Count; i++) {
				list.Sizes[0] = Math.min(list.Sizes[0], list.Places[i * 4 + 3]);
				list.Sizes[1] = Math.max(list.Sizes[1], list.Places[i * 4 + 3]);
			}

			return list.Sizes;
		}

		/* Where a level is seen: it comes in between the first two distances, and goes between the last two. */
		/*
		 * narrow: its bands of fading two fifths as wide, at their far ends (a plant of SceneFlora: two levels of thousands of
		 * cards drawn in the dither of the band at once were a hatching of the crowns where the view stands still).
		 */
		function fadeOf (level, narrow) {
			var quality = self.ScatterReach ? self.ScatterReach() : 1;
			var from = level ? steps[level - 1] : [-2, -1];
			var to = level < 3 ? steps[level] : [1e8, 2e8];

			if (narrow) {
				from = level ? [from[1] - (from[1] - from[0]) * 0.4, from[1]] : from;
				to = level < 3 ? [to[1] - (to[1] - to[0]) * 0.4, to[1]] : to;
			}

			return scene.Camera.Ortho ? [-2, -1, 1e8, 2e8] : [from[0] * quality, from[1] * quality, to[0] * quality, to[1] * quality];
		}

		/* A picture of a model from all sides: a grid of views of the half of a ball above it, colors and normals. */
		function picture (key) {
			var parts = key.split('~');
			var cells = 6;
			var side = 96;
			var model;
			var whole;
			var bounds;
			var target;
			var mesh;
			var cut;
			var column;
			var row;

			if (state.Baked[key])
				return state.Baked[key];

			model = library.Make(parts[0], {Variant: Number(parts[1])});
			whole = library.Whole(model);
			bounds = library.Bounds(whole);
			target = renderer.Target(cells * side, cells * side, {Colors: 2, Depth: true});
			mesh = renderer.Mesh(whole);
			/* Of its pictures (a plant of SceneFlora): its simpler level, its leaves cut by their alpha, as near it is drawn. */
			cut = textured(key) ? surfaces(key, 1).map(function (each) {
				return {Mesh: renderer.Mesh(each.Geometry), Values: engine.Surface(each)};
			}) : null;

			target.Begin();

			renderer.Clear([0, 0, 0, 0]);

			for (row = 0; row < cells; row++) {
				for (column = 0; column < cells; column++) {
					var a = [(column + 0.5) / cells * 2 - 1, (row + 0.5) / cells * 2 - 1];
					var o = [(a[0] + a[1]) / 2, (a[0] - a[1]) / 2];
					var direction = vectors.Normalize([o[0], Math.max(0.02, 1 - Math.abs(o[0]) - Math.abs(o[1])), o[1]]);
					var center = [0, bounds.Middle, 0];
					var up = Math.abs(direction[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0];
					var eye = vectors.Add(center, vectors.Scale(direction, bounds.Radius * 3));
					var matrix = math.Multiply(math.Orthographic(-bounds.Radius, bounds.Radius, -bounds.Radius, bounds.Radius, 0.01, bounds.Radius * 6), math.LookAt(eye, center, up));

					renderer.Viewport(column * side, row * side, side, side);

					if (cut) {
						cut.forEach(function (each) {
							renderer.Draw(each.Mesh, programs().BakeCut, Object.assign({uViewProjection: matrix}, each.Values), {Cull: 'none'});
						});
					}
					else {
						renderer.Draw(mesh, programs().Bake, {uViewProjection: matrix}, {Cull: 'none'});
					}
				}
			}

			target.End();

			mesh.Destroy();

			(cut || []).forEach(function (each) {
				each.Mesh.Destroy();
			});

			state.Baked[key] = {Target: target, Quad: renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]}), Radius: bounds.Radius, Middle: bounds.Middle, Cells: cells};

			return state.Baked[key];
		}

		/* The blades of a square of the ground: at their roots, with what the vertex shader makes them of. */
		function bladesMesh (count, extent) {
			var geometry = meshes.Geometry();
			var random = library.Random('grass:' + count);
			var i;
			var row;

			for (i = 0; i < count; i++) {
				var x = random(0, extent);
				var z = random(0, extent);
				var angle = random(0, Math.PI * 2);
				var seed = random(0, 1);
				var base = geometry.Positions.length / 3;

				[[-1, 0], [1, 0], [-0.7, 0.45], [0.7, 0.45], [0, 1]].forEach(function (corner) {
					geometry.Positions.push(x, corner[1], z);
					geometry.Normals.push(corner[0], angle, seed);
					geometry.UVs.push(0, 0);
				});

				for (row = 0; row < 3; row++)
					geometry.Indices.push(base + row, base + row + 1, base + row + 2);
			}

			return renderer.Mesh(geometry);
		}

		/*
		 * What the shader of the blades reads of the ground: its height, and where it may grow (made a row at a time); grass
		 * grows up to where the rock or the snow of the ground begins (MaxHeight of the rule otherwise). Free: where it may
		 * not, finer (a metre a texel, up to 2048): the roads and their shoulders, the rivers and their banks, the clearings,
		 * the lakes and the masks of the sketch, made by a worker.
		 */
		/*
		 * Where the tunnels of roads cut the ground away under the sky: the parts of them whose vault is over the ground (a hill
		 * lower than it), lines kept bare as a road is. Regression: grass grew there at the height of the ground before the cut,
		 * inside the lining of the tunnel.
		 */
		function tunnelled (field) {
			var lines = [];

			/* Once for a field: it is made again when what is cut out of it changes. Regression: made again at every look, slow. */
			if (field.Tunnelled)
				return field.Tunnelled;

			/* Of a ground with no volume made yet, the tunnels of the roads alone; their points are [x, z, y]. */
			if (!field.Volume) {
				(engine.RoadsCarves ? engine.RoadsCarves() : []).forEach(function (carve) {
					var reach = (carve.Width || carve.Radius * 2) / 2 + 1;
					var top = (carve.Height || carve.Radius * 2) / 2 + 0.5;
					var piece = [];

					carve.Points.concat([null]).forEach(function (point) {
						if (point && field.Height(point[0], point[1]) < point[2] + top) {
							piece.push([point[0], point[1]]);

							return;
						}

						if (piece.length > 1)
							lines.push({Points: piece, Reach: reach});

						piece = [];
					});
				});

				return lines;
			}

			/*
			 * The tunnels (of the roads too) and passages of the ground where they open to the sky: no grass over their holes.
			 * Regression: grass grew over the mouth of a passage, in the air. Their points are [x, y, z].
			 */
			field.Volume.Carves.forEach(function (one) {
				var bores = one.Type === 'tunnel' ? [one] : one.Type === 'passages' ? one.Tunnels : [];

				bores.forEach(function (bore) {
					var reach = (bore.Width > 0 ? bore.Width : bore.Radius * 2) / 2 + 1;
					var top = (bore.Width > 0 ? bore.Height : bore.Radius * 2) / 2 + 0.5;
					var piece = [];
					var fine = [];

					/* Every 6 m along it at most: its points may be far apart (a way from a node to the next). */
					bore.Points.forEach(function (point, index) {
						var next = bore.Points[index + 1];
						var steps = next ? Math.max(1, Math.ceil(Math.hypot(next[0] - point[0], next[2] - point[2]) / 6)) : 1;
						var k;

						for (k = 0; k < steps; k++)
							fine.push(next ? [point[0] + (next[0] - point[0]) * k / steps, point[1] + (next[1] - point[1]) * k / steps, point[2] + (next[2] - point[2]) * k / steps] : point);
					});

					fine.concat([null]).forEach(function (point) {
						if (point && field.Height(point[0], point[2]) < point[1] + top) {
							piece.push([point[0], point[2]]);

							return;
						}

						if (piece.length)
							lines.push({Points: piece.length > 1 ? piece : [piece[0], [piece[0][0] + 0.01, piece[0][1]]], Reach: reach});

						piece = [];
					});
				});
			});

			field.Tunnelled = lines;

			return lines;
		}

		function fieldOf (rule) {
			var ground = scene.Ground;
			var field = ground.Field;
			var side = 256;
			var made = sketched();
			var key = [ground.Key, JSON.stringify(rule), state.SketchText || ''];
			var grass = state.Grass;
			var started = performance.now();
			var half = field.Size / 2;
			var step = field.Size / (side - 1);
			var top = rule.MaxHeight === undefined || rule.MaxHeight === '' ? Math.min(field.Rock === undefined ? field.Top * 0.45 : field.Rock, field.Snow === undefined ? Infinity : field.Snow) : Number(rule.MaxHeight);
			var steep = rule.MaxSlope === undefined ? 0.28 : Number(rule.MaxSlope);
			var fine = Math.max(2, Math.min(2048, Math.ceil(field.Size) + 1));
			var cut = tunnelled(field);
			var row;
			var x;

			key.push(JSON.stringify(cut));

			if (!grass || !same(grass.Key, key)) {
				if (grass && grass.Texture)
					grass.Texture.Destroy();

				if (grass && grass.Free)
					grass.Free.Destroy();

				grass = state.Grass = {Key: key, Data: new Float32Array(side * side * 4), Row: 0, Side: side, Texture: null, Free: null, Blades: 0, Near: bladesMesh(1300, 7), Far: bladesMesh(330, 7), Patches: null};

				/* What is kept bare: nothing to make when nothing is. */
				if (made.Lines.length || made.Areas.length || cut.length) {
					grass.Freeing = true;

					self.$Service('SceneTerrainGenerator').Work().Run('SceneTerrainGenerator', 'Free', [field.Size, fine, made.Lines.concat(cut), made.Areas], function (error, data) {
						if (state.Grass !== grass) return;

						grass.Freeing = false;

						if (!error)
							grass.Free = renderer.Texture({Width: fine, Height: fine, Data: data}, {Single: true});
					});
				}

				/* Of a ground of noise a worker makes it all; the rows below are of another ground, or of one it failed. */
				if (field.Options) {
					grass.Row = side;
					grass.Waiting = true;

					self.$Service('SceneTerrainGenerator').Work().Run('SceneTerrainGenerator', 'Grid', [field.Options, side, top, steep], function (error, data) {
						if (state.Grass !== grass) return;

						grass.Waiting = false;

						if (error) grass.Row = 0;
						else grass.Data = data;
					});
				}
			}

			while (grass.Row < side && performance.now() - started < 3) {
				row = grass.Row++;

				for (x = 0; x < side; x++) {
					var px = x * step - half;
					var pz = row * step - half;
					var height = field.Height(px, pz);
					var at = (row * side + x) * 4;

					grass.Data[at] = height;
					grass.Data[at + 1] = height > 1 && height < top && field.Slope(px, pz) < steep && self.$Service('SceneTerrainGenerator').Grassy(field, px, pz) ? 1 : 0;
				}
			}

			if (grass.Row === side && !grass.Waiting && !grass.Texture)
				grass.Texture = renderer.Texture({Width: side, Height: side, Data: grass.Data}, {Float: true, Nearest: true});

			/* A white texel: where nothing is kept bare. */
			if (!grass.Free && !grass.Freeing)
				grass.Free = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255])}, {Single: true});

			return grass;
		}

		/* The height of the ground at a point, of the grid of the grass: no noise in a frame. */
		function heightOf (grass, field, x, z) {
			var last = grass.Side - 1;
			var u = Math.max(0, Math.min(last, (x / field.Size + 0.5) * last));
			var v = Math.max(0, Math.min(last, (z / field.Size + 0.5) * last));
			var column = Math.min(last - 1, Math.floor(u));
			var row = Math.min(last - 1, Math.floor(v));
			var data = grass.Data;
			var at = (row * grass.Side + column) * 4;
			var up = at + grass.Side * 4;
			var below = data[at] + (data[at + 4] - data[at]) * (u - column);
			var above = data[up] + (data[up + 4] - data[up]) * (u - column);

			return below + (above - below) * (v - row);
		}

		function drawGrass (uniforms, matrix) {
			var ground = scene.Ground;
			var rule = scene.Roots.filter(function (object) {
				return object.Traits.Grass;
			}).map(function (object) {
				return Object.assign({}, object.Traits.Grass, object.Values);
			})[0] || landsGrass();
			var grass;
			var view;
			var eye = scene.Eye;
			var target = scene.Target || eye;
			var extent = 7;
			var near = [];
			var far = [];
			var patches = 22;
			var middleX;
			var middleZ;
			var x;
			var z;

			if (!rule || rule.Shapes || !ground || ground.Field.Whole || self.Graphics().Grass === false) {
				if (state.Grass)
					state.Grass.Blades = 0;

				return;
			}

			grass = fieldOf(rule);

			if (!grass.Texture || !grass.Free) return;

			view = planes(matrix);
			middleX = Math.round(target[0] / extent) * extent;
			middleZ = Math.round(target[2] / extent) * extent;

			for (z = -patches; z <= patches; z++) {
				for (x = -patches; x <= patches; x++) {
					var px = middleX + x * extent;
					var pz = middleZ + z * extent;
					var dx = px + extent / 2 - eye[0];
					var dy = heightOf(grass, ground.Field, px, pz) - eye[1];
					var dz = pz + extent / 2 - eye[2];
					var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
					var reach = patches * extent;
					if (x * x + z * z > patches * patches || distance > reach * 2) continue;

					if (!view.every(function (plane) {
						return plane[0] * dx + plane[1] * dy + plane[2] * dz + plane[3] > -extent * 2;
					})) continue;

					(distance < reach * 0.42 ? near : far).push(px, pz, 0, 0);
				}
			}

			grass.Near.Instance({aInstance: {Size: 4, Data: new Float32Array(near)}}, near.length / 4);
			grass.Far.Instance({aInstance: {Size: 4, Data: new Float32Array(far)}}, far.length / 4);

			grass.Blades = near.length / 4 * 1300 + far.length / 4 * 330;

			[[grass.Near, near], [grass.Far, far]].forEach(function (each) {
				if (each[1].length) {
					/* The season on the grass: burnt in summer, brown in autumn, low and white under the snow of winter. */
					var season = ground.Season || {Dry: 0, Turn: 0, Snow: 0};
					var snow = engine.Snowed ? engine.Snowed() : 0;
					var seasoned = function (color, tip) {
						var dry = Math.min(1, season.Dry * tip + season.Turn * 0.6);
						var made = [color[0] + (0.72 * tip + 0.3 - color[0]) * dry * 0.6, color[1] + (0.6 * tip + 0.25 - color[1]) * dry * 0.45, color[2] + (0.25 - color[2]) * dry * 0.5];

						return [made[0] + (0.86 - made[0]) * snow * 0.8, made[1] + (0.9 - made[1]) * snow * 0.8, made[2] + (0.95 - made[2]) * snow * 0.8];
					};

					renderer.Draw(each[0], programs().Grass, Object.assign(Object.create(uniforms), {uOrigin: vectors.Subtract([0, 0, 0], eye), uField: grass.Texture, uFree: grass.Free, uFieldSize: [ground.Field.Size, grass.Side], uBlade: [(Number(rule.Height) || 0.7) * (1 - snow * 0.85), Number(rule.Density) || 1, each[0] === grass.Far ? 2.2 : 1, patches * extent * 0.95], uClump: [Math.max(0, Math.min(1, Number(rule.Clumps) || 0)), Number(rule.Patch) || 24, rule.Spread === undefined || rule.Spread === '' ? 0.45 : Math.max(0, Math.min(1, Number(rule.Spread)))], uRoot: seasoned(engine.Paint(rule.Root || '#2f5a22'), 0.5), uTip: seasoned(engine.Paint(rule.Color || '#7fae4a'), 1), uSun: ground.Sun, uSunColor: ground.SunColor, uEye: target}), {Cull: 'none'});
				}
			});
		}

		/* Before anything is drawn of a frame: what came, and the streams when the view moved. */
		/* How many squares within reach (metres) of the eye are still to be sown, those sown now among them (Preparing of the scene). */
		engine.ScatterPending = function (reach) {
			var eye = scene.Eye || [0, 0, 0];

			return state.Flying + state.Waiting.filter(function (square) {
				return Math.hypot(square.X + size / 2 - eye[0], square.Z + size / 2 - eye[2]) < reach + size;
			}).length;
		};

		/* How much of what grows within reach (metres) of the eye is sown: {Done, Total} squares (the loading of the scene). */
		engine.ScatterProgress = function (reach) {
			var eye = scene.Eye || [0, 0, 0];
			var left = engine.ScatterPending(reach);
			var sown = state.Squares.filter(function (square) {
				return Math.hypot(square.X + size / 2 - eye[0], square.Z + size / 2 - eye[2]) < reach + size;
			}).length;

			return {Done: sown, Total: sown + left};
		};

		engine.ScatterFrame = function (matrix) {
			var eye = scene.Eye;
			var look = matrix[2] + matrix[6] * 3 + matrix[10] * 7;

			prepare();

			grow();

			if (!state.Squares.length) return;

			/* Proxies turned on or off: the streams made again at once. */
			if (state.Proxied !== proxied()) {
				state.Proxied = proxied();
				state.Moved = true;
			}

			/*
			 * Squares sown and proxies made since (Fresh) are taken in at most each 400 ms. Regression: each that came made all
			 * the streams again at once, every frame of the seconds a ground is sown and its tiles made (a frame of 40 to 130 ms
			 * instead of 16 for some 12 seconds after a page opened).
			 */
			var fresh = state.Fresh && performance.now() - (state.Gathered || 0) > 400;

			if (state.Moved || fresh || !state.Eye || vectors.Distance(state.Eye, eye) > 6 || Math.abs(state.Look - look) > 0.04) {
				state.Moved = false;
				state.Fresh = false;
				state.Gathered = performance.now();
				state.Eye = eye.slice();
				state.Look = look;

				gather(matrix);
			}
		};

		function each (callback) {
			Object.keys(state.Streams).forEach(function (name) {
				var one = state.Streams[name];
				if (one.Count)
					callback(one);
			});
		}

		/* All that is sown, seen by a program of its own: for the map of the light of a field. */
		engine.ScatterAll = function (matrix, fragment, view) {
			if (!state.Top)
				state.Top = renderer.Program(shaders.Vertex, fragment);

			Object.keys(state.Streams).forEach(function (name) {
				state.Streams[name].Count = 0;
			});

			state.Squares.forEach(function (square) {
				Object.keys(square.Lists).forEach(function (key) {
					append(stream(key, 2), square.Lists[key]);
				});
			});

			each(function (one) {
				var mesh = levels(one.Key)[2];

				mesh.Instance({aInstance: {Size: 4, Data: one.Places.subarray(0, one.Count * 4)}, aInstance2: {Size: 4, Data: one.Extra.subarray(0, one.Count * 4)}}, one.Count);

				renderer.Draw(mesh, state.Top, Object.assign({uViewProjection: matrix, uOrigin: [0, 0, 0], uWind: 0, uSway: 0, uFade: [-2, -1, 1e8, 2e8]}, self.WindValues(scene.Seconds)), {Cull: 'none'});
			});

			gather(view);
		};

		engine.ScatterShadow = function (matrix) {
			var origin = vectors.Subtract([0, 0, 0], scene.Eye);

			var view = planes(matrix);

			state.Chosen.forEach(function (tile) {
				/* A tile the shadow of this slice does not reach casts none into it. */
				if (!inView(view, tile.Origin[0], tile.Origin[2], tile.Size)) return;

				renderer.Draw(tile.Mesh, programs().Depth, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: 0, uSway: 0, uFade: [-2, -1, 1e8, 2e8], uLod: 0}, self.WindValues(scene.Seconds)), {Cull: 'none'});
			});

			/*
			 * Each stream by the shape that holds its copies (gather put them there): the near ones drawn by the simpler shape of
			 * the next level had the copies of that level, and the trees near the eye cast no shadow where the levels do not
			 * overlap (at ultra: farther apart).
			 */
			each(function (one) {
				/*
				 * Of its pictures (a plant of SceneFlora): its surfaces cast it, its leaves by their alpha. Regression: the near
				 * level of a model of a file cast no shadow, a plant of cards a shadow of plates or none.
				 */
				if (one.Level < 3 && textured(one.Key)) {
					surfaces(one.Key, one.Level).forEach(function (each) {
						var cut = engine.Surface(each).uCutoff > 0;

						renderer.Draw(each.Mesh, cut ? programs().DepthCut : programs().Depth, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: scene.Gust || 0, uSway: library.Make(one.Key.split('~')[0], {Variant: Number(one.Key.split('~')[1])}).Sway, uFade: fadeOf(one.Level, true), uLod: scene.Camera.Ortho ? 0 : lodScale() * detail(one.Key), uFlutter: cut ? library.Make(one.Key.split('~')[0], {Variant: Number(one.Key.split('~')[1])}).Sway || 0 : 0, uFlutterTime: scene.Seconds % 1000}, cut ? engine.Surface(each) : null, self.WindValues(scene.Seconds)), {Cull: 'none'});
					});

					return;
				}

				if (one.Level === 3 && !building(one.Key) || one.Level === 0 && surfaces(one.Key)) return;

				renderer.Draw(levels(one.Key)[one.Level], programs().Depth, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: scene.Gust || 0, uSway: 0, uFade: fadeOf(one.Level), uLod: scene.Camera.Ortho ? 0 : lodScale()}, self.WindValues(scene.Seconds)), {Cull: 'none'});
			});
		};

		/*
		 * What is sown in the box of the grid of voxels (scene.VoxelBox of SceneProbes), made once for each box: the copies in
		 * it, a stream of each model by its simpler shape (a mesh of its own: the streams of the view keep theirs).
		 * Regression: each slab of a metre drew all that is sown near the eye, every model of every level, three million
		 * triangles a frame for the 64 metres the voxels hold.
		 */
		function voxelStreams (box) {
			var key = box.join(',') + ':' + state.Generation + ':' + state.Squares.length;
			var made = {};

			if (state.VoxelKey === key) return state.VoxelStreams;

			state.Squares.forEach(function (square) {
				if (square.X > box[3] || square.X + size < box[0] || square.Z > box[5] || square.Z + size < box[2]) return;

				Object.keys(square.Lists).forEach(function (name) {
					var list = square.Lists[name];
					var i;
					var x;
					var z;
					var reach;

					for (i = 0; i < list.Count; i++) {
						x = list.Places[i * 4];
						z = list.Places[i * 4 + 2];
						reach = list.Places[i * 4 + 3] * 2;

						if (x < box[0] - reach || x > box[3] + reach || z < box[2] - reach || z > box[5] + reach) continue;

						made[name] = made[name] || {Key: name, Count: 0, Capacity: 0, Places: null, Extra: null};

						append(made[name], {Places: list.Places.subarray(i * 4, i * 4 + 4), Extra: list.Extra.subarray(i * 4, i * 4 + 4), Count: 1});
					}
				});
			});

			state.VoxelMeshes = state.VoxelMeshes || {};

			Object.keys(made).forEach(function (name) {
				var one = made[name];
				/* A plant of its pictures (SceneFlora): the bark of its simpler level, its leaves no walls in the voxels. */
				var bark = textured(name) ? surfaces(name, 1).filter(function (each) {
					return each.Material.Alpha !== 'MASK';
				})[0] : null;
				if (!bark)
					levels(name);

				state.VoxelMeshes[name] = state.VoxelMeshes[name] || renderer.Mesh(bark ? bark.Geometry : state.Geometries[name][1]);

				state.VoxelMeshes[name].Instance({aInstance: {Size: 4, Data: one.Places.subarray(0, one.Count * 4)}, aInstance2: {Size: 4, Data: one.Extra.subarray(0, one.Count * 4)}}, one.Count);
			});

			state.VoxelKey = key;
			state.VoxelStreams = made;

			return made;
		}

		/* The same copies in their colors, for a slab of the voxels of the light of probes (SceneProbes; fragment: Voxel of the Scene). */
		engine.ScatterVoxels = function (matrix, fragment) {
			var origin = vectors.Subtract([0, 0, 0], scene.Eye);
			var streams;

			if (!state.Voxel)
				state.Voxel = renderer.Program(shaders.Vertex, fragment);

			/* Of the box of the grid: what is in it, by its simpler shape, at no level of the view (uLod 0, no fade). */
			if (scene.VoxelBox) {
				streams = voxelStreams(scene.VoxelBox);

				Object.keys(streams).forEach(function (name) {
					if (!streams[name].Count) return;

					renderer.Draw(state.VoxelMeshes[name], state.Voxel, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: 0, uSway: 0, uFade: [-2, -1, 1e8, 2e8], uLod: 0}, self.WindValues(scene.Seconds)), {Cull: 'none', Depth: false, DepthWrite: false});
				});

				return;
			}

			each(function (one) {
				/* The far levels are past the voxels (some 45 m round the eye). */
				if (one.Level >= 2) return;

				/*
				 * A plant of its pictures (SceneFlora): its trunk and branches only. Regression: its simpler shape of corners, its
				 * leaves cards as walls, filled the voxels of a wood: no light of the sky under it, the ground black.
				 */
				if (textured(one.Key)) {
					surfaces(one.Key, one.Level).forEach(function (each) {
						if (each.Material.Alpha === 'MASK') return;

						renderer.Draw(each.Mesh, state.Voxel, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: 0, uSway: 0, uFade: fadeOf(one.Level, true), uLod: scene.Camera.Ortho ? 0 : lodScale() * detail(one.Key)}, self.WindValues(scene.Seconds)), {Cull: 'none', Depth: false, DepthWrite: false});
					});

					return;
				}

				if (one.Level === 0 && surfaces(one.Key)) return;

				renderer.Draw(levels(one.Key)[one.Level], state.Voxel, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: 0, uSway: 0, uFade: fadeOf(one.Level), uLod: scene.Camera.Ortho ? 0 : lodScale()}, self.WindValues(scene.Seconds)), {Cull: 'none', Depth: false, DepthWrite: false});
			});
		};

		engine.ScatterDraw = function (uniforms, matrix) {
			var origin = vectors.Subtract([0, 0, 0], scene.Eye);
			var ground = scene.Ground;
			var dither = engine.PostStep ? engine.PostStep() : 0;
			var lod = scene.Camera.Ortho ? 0 : lodScale();
			var files;
			var many;
			var far;

			if (!ground) return;

			/* The uniforms of a program made once a frame, what differs set for each draw: no copy of them all for each. */
			files = Object.assign(Object.create(uniforms), {uOrigin: origin, uWind: scene.Gust || 0, uFade: fadeOf(0), uDither: dither, uLod: lod, uLevel: engine.LevelColor('near', 0)});
			many = Object.assign(Object.create(uniforms), {uOrigin: origin, uWind: scene.Gust || 0, uShine: 8, uSpecular: 0.05, uRough: 0.5, uDither: dither, uLod: lod});
			far = Object.assign(Object.create(uniforms), {uOrigin: origin, uFade: fadeOf(3), uDither: dither, uLod: lod, uSun: ground.Sun, uSunColor: ground.SunColor, uParallel: scene.Camera.Ortho ? vectors.Normalize(vectors.Subtract(scene.Camera.Position, scene.Camera.Target)).concat([1]) : [0, 0, 0, 0]});

			/* The far tiles, each one draw of all its things (uLod 0: no level of a copy chooses it away). */
			state.Chosen.forEach(function (tile) {
				renderer.Draw(tile.Mesh, programs().Many, Object.assign(Object.create(uniforms), {uOrigin: origin, uWind: 0, uSway: 0, uSoft: 0, uShine: 8, uSpecular: 0.05, uRough: 0.5, uDither: dither, uLod: 0, uFade: [-2, -1, 1e8, 2e8], uLevel: engine.LevelColor('proxy', tile.Level)}), {Cull: 'back'});
			});

			each(function (one) {
				var parts = one.Key.split('~');
				var made = library.Make(parts[0], {Variant: Number(parts[1])});
				var baked;

				if (one.Level < 3 && surfaces(one.Key, one.Level)) {
					surfaces(one.Key, one.Level).forEach(function (each) {
						files.uSway = made.Sway;
						files.uSoftness = each.Soft;
						files.uFade = fadeOf(one.Level, textured(one.Key));
						/* Its leaves flutter (a plant of its pictures); set at each draw, the program keeps what it was last given. */
						files.uFlutter = textured(one.Key) && each.Material.Alpha === 'MASK' ? made.Sway || 0 : 0;
						files.uFlutterTime = scene.Seconds % 1000;
						files.uLevel = engine.LevelColor('near', one.Level);
						files.uLod = lod * detail(one.Key);

						renderer.Draw(each.Mesh, programs().Files, Object.assign(files, engine.Surface(each), engine.SeasonValues ? engine.SeasonValues(parts[0]) : null), {Cull: each.Material.DoubleSided ? 'none' : 'back'});
					});

					return;
				}

				/* A building past its nearest: its simpler shape with its facades. */
				if (one.Level > 0 && building(one.Key)) {
					var faces = facade(one.Key);

					many.uSway = 0;
					many.uSoft = 0;
					many.uFade = fadeOf(one.Level);
					many.uLevel = engine.LevelColor('near', one.Level);
					many.uFacade = faces.Target.Textures[0];
					many.uBoxMin = faces.Min;
					many.uBoxMax = faces.Max;

					renderer.Draw(levels(one.Key)[one.Level], programs().Facade, many, {Cull: 'back'});

					return;
				}

				if (one.Level < 3) {
					many.uSway = made.Sway;
					many.uSoft = made.Sway ? 0.9 : 0;
					many.uFade = fadeOf(one.Level);
					many.uLevel = engine.LevelColor('near', one.Level);

					if (engine.SeasonValues)
						Object.assign(many, engine.SeasonValues(parts[0]));

					renderer.Draw(levels(one.Key)[one.Level], programs().Many, many, {Cull: 'back'});

					return;
				}

				baked = picture(one.Key);

				far.uLevel = engine.LevelColor('near', 3);
				far.uFade = fadeOf(3, textured(one.Key));
				far.uLod = lod * detail(one.Key);
				far.uColors = baked.Target.Textures[0];
				far.uNormals = baked.Target.Textures[1];
				far.uCells = baked.Cells;
				far.uRadius = baked.Radius;
				far.uMiddle = baked.Middle;

				renderer.Draw(baked.Quad, programs().Picture, far, {Cull: 'none'});
			});

			drawGrass(uniforms, matrix);
		};

		engine.ScatterBlocked = function (x, z) {
			var cellX = Math.floor(x / 2);
			var cellZ = Math.floor(z / 2);

			return !!state.Blocked[cellX + ':' + cellZ];
		};

		/* A thing sown changed by hand (changes: {Remove, Model, X, Z, Turn, Size}, merged; null forgets it): sown again so. */
		this.ChangeSown = function (key, changes) {
			if (!key)
				return false;

			if (changes === null) delete state.Edits[key];
			else state.Edits[key] = Object.assign({}, state.Edits[key] || {}, changes);

			return true;
		};

		/* A thing sown made an object of the scene (kind thing) where it stands, as large and turned as it is: its ID; it is sown no more. */
		this.UnlinkSown = function (key) {
			var found = null;
			var id;

			state.Squares.some(function (square) {
				return Object.keys(square.Lists).some(function (name) {
					var list = square.Lists[name];
					var at = list.Keys ? list.Keys.indexOf(key) : -1;
					if (at < 0)
						return false;

					found = {Model: name.split('~')[0], X: list.Places[at * 4], Z: list.Places[at * 4 + 2], Size: list.Places[at * 4 + 3], Turn: list.Extra[at * 4]};

					return true;
				});
			});

			if (!found)
				return null;

			id = 'sown-' + key.replace(/[^A-Za-z0-9-]/g, '-');

			self.Add('thing', {ID: id, Model: found.Model, X: Math.round(found.X * 100) / 100, Y: Math.round(found.Z * 100) / 100, Size: Math.round(found.Size * 1000) / 1000, Facing: Math.round(found.Turn * 180 / Math.PI * 100) / 100});

			this.ChangeSown(key, {Remove: true});

			return id;
		};

		/*
		 * The lamps of the things sown round a point within reach (a street lamp, the window of a kiosk: the Lamps of their
		 * models), where each thing stands, as large and turned as it is; made once a frame.
		 */
		engine.ScatterLamps = function (from, reach) {
			var lamps = [];
			var key = scene.Seconds + ':' + from.join(',') + ':' + reach + ':' + state.Squares.length;
			if (state.LampKey === key) return state.Lamps;

			state.Squares.forEach(function (square) {
				if (square.X > from[0] + reach || square.Z > from[2] + reach || square.X + size < from[0] - reach || square.Z + size < from[2] - reach) return;

				Object.keys(square.Lists).forEach(function (name) {
					var parts = name.split('~');
					var list = square.Lists[name];
					var made;
					var i;

					if (!library.Has(parts[0])) return;

					made = library.Make(parts[0], {Variant: Number(parts[1]) || 0});

					if (!made || !made.Lamps || !made.Lamps.length) return;

					for (i = 0; i < list.Count; i++) {
						var x = list.Places[i * 4];
						var y = list.Places[i * 4 + 1];
						var z = list.Places[i * 4 + 2];
						var large = list.Places[i * 4 + 3];
						var turn = list.Extra[i * 4];
						var c = Math.cos(turn);
						var s = Math.sin(turn);

						if (Math.abs(x - from[0]) > reach || Math.abs(z - from[2]) > reach) continue;

						made.Lamps.forEach(function (lamp) {
							var p = lamp.Place;
							var aim = lamp.Aim;

							lamps.push({Object: {Seed: i}, Built: true, At: [x + (p[0] * c + p[2] * s) * large, y + p[1] * large, z + (-p[0] * s + p[2] * c) * large], Settings: {Color: lamp.Color, Power: lamp.Power, Radius: lamp.Radius * large, Spot: lamp.Spot, Aim: aim ? [aim[0] * c + aim[2] * s, aim[1], -aim[0] * s + aim[2] * c] : null, Night: lamp.Night}});
						});
					}
				});
			});

			state.LampKey = key;
			state.Lamps = lamps;

			return lamps;
		};

		/* The changes of things sown by hand, to save; given, they replace them (a game loaded). */
		engine.SownEdits = function (edits) {
			if (edits !== undefined)
				state.Edits = JSON.parse(JSON.stringify(edits || {}));

			return JSON.parse(JSON.stringify(state.Edits));
		};

		/* What is sown round a point, of the squares made so far: [{Model, X, Y, Z, Size, Turn, Key}], the nearest first. */
		this.SownNear = function (x, z, radius) {
			var found = [];

			state.Squares.forEach(function (square) {
				if (square.X > x + radius || square.Z > z + radius || square.X + size < x - radius || square.Z + size < z - radius) return;

				Object.keys(square.Lists).forEach(function (key) {
					var list = square.Lists[key];
					var i;

					for (i = 0; i < list.Count; i++) {
						var px = list.Places[i * 4];
						var pz = list.Places[i * 4 + 2];
						var far = Math.hypot(px - x, pz - z);
						if (far <= radius)
							found.push({Model: key.split('~')[0], X: px, Y: list.Places[i * 4 + 1], Z: pz, Size: list.Places[i * 4 + 3], Turn: list.Extra[i * 4], Key: list.Keys ? list.Keys[i] : '', Far: far});
					}
				});
			});

			return found.sort(function (a, b) {
				return a.Far - b.Far;
			}).map(function (one) {
				delete one.Far;

				return one;
			});
		};
	},

	/* The shaders of what is sown. */
	ScatterShaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\n';

		return {
			Vertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'in vec2 aUV;',
				'in vec4 aInstance;',
				'in vec4 aInstance2;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform float uWind;',
				'uniform float uSway;',
				'uniform vec4 uFade;',
				'uniform float uLod;',
				/* How much its leaves flutter (a plant of SceneFlora: its Sway; 0 none) and the seconds of the scene for it. */
				'uniform float uFlutter;',
				'uniform float uFlutterTime;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vLocal;',
				'out vec3 vColor;',
				'out vec2 vUV;',
				'out vec3 vTint;',
				'out vec2 vFade;',
				/* What is sown is as wet as the weather, none of its own; it stands up, turned only round the up. */
				'out vec3 vBody;',
				'out vec3 vBodyNormal;',
				'out vec3 vDown;',
				'out vec2 vWet;',
				/* The wind: the vertex graph of the wind of the scene (WindGraph) in this place, run before the Vertex of a material. */
				'void blueprintWind(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				'void main() {',
				'	vWet = vec2(0.0);',
				'	vBody = aPosition * aInstance.w;',
				'	vBodyNormal = aNormal;',
				'	vDown = vec3(0.0, -1.0, 0.0);',
				'	float c = cos(aInstance2.x);',
				'	float s = sin(aInstance2.x);',
				'	vec3 p = aPosition * aInstance.w;',
				'	vec3 world = aInstance.xyz + uOrigin + vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x);',
				'	float phase = aInstance.x * 0.13 + aInstance.z * 0.17;',
				'	vec3 bent = vec3(c * aNormal.x + s * aNormal.z, aNormal.y, c * aNormal.z - s * aNormal.x);',
				'	blueprintWind(aPosition, aNormal, aUV, uSway, phase, aInstance.w, world, bent);',
				/*
				 * Its leaves flutter: quick, small (some centimetres at the top of a tree of 20 m, none at its foot), each part of its
				 * crown of its own beat, more in a gust; the bend of the whole of it is the wind's above.
				 */
				'	if (uFlutter > 0.0) {',
				'		vec3 cell = floor(aPosition * 12.0);',
				'		float seed = fract(sin(dot(cell + aInstance.xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453) * 6.2832;',
				'		float beat = uFlutterTime * (5.0 + uWind * 4.0);',
				'		world += vec3(sin(beat + seed), 0.6 * sin(beat * 1.3 + seed * 2.0), cos(beat * 0.9 + seed)) * uFlutter * aInstance.w * 0.004 * clamp(aPosition.y, 0.0, 1.0) * (0.5 + uWind);',
				'	}',
				'	vWorld = world;',
				'	vNormal = bent;',
				'	vLocal = aPosition;',
				'	vColor = aColor * aInstance2.yzw;',
				'	vUV = aUV;',
				'	vTint = aInstance2.yzw;',
				'	float far = length(aInstance.xyz + uOrigin) * (uLod > 0.0 ? uLod / max(aInstance.w, 1.5) : 1.0);',
				'	vFade = vec2(smoothstep(uFade.x, uFade.y, far), 1.0 - smoothstep(uFade.z, uFade.w, far));',
				'	gl_Position = vFade.x > 0.0 && vFade.y > 0.0 ? uViewProjection * vec4(world, 1.0) : vec4(0.0, 0.0, 2.0, 1.0);',
				'}'
			].join('\n'),

			BakeVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'uniform mat4 uViewProjection;',
				'out vec3 vNormal;',
				'out vec3 vColor;',
				'void main() {',
				'	vNormal = aNormal;',
				'	vColor = aColor;',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			/* The shadow of a surface cut by the alpha of its picture. */
			DepthCut: head + [
				'in vec2 vUV;',
				'uniform sampler2D uColorMap;',
				'uniform vec4 uBaseColor;',
				'uniform float uCutoff;',
				'void main() {',
				'	if ((uBaseColor * texture(uColorMap, vUV)).a < uCutoff) discard;',
				'}'
			].join('\n'),

			BakeCutVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'uniform mat4 uViewProjection;',
				'out vec3 vNormal;',
				'out vec2 vUV;',
				'void main() {',
				'	vNormal = aNormal;',
				'	vUV = aUV;',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			/* A surface of a picture baked for the far copies: its color of its picture, none where it is cut. */
			BakeCut: head + [
				'in vec3 vNormal;',
				'in vec2 vUV;',
				'uniform sampler2D uColorMap;',
				'uniform vec4 uBaseColor;',
				'uniform float uCutoff;',
				'layout(location = 0) out vec4 outColor;',
				'layout(location = 1) out vec4 outNormal;',
				'void main() {',
				'	vec4 base = uBaseColor * texture(uColorMap, vUV);',
				'	if (base.a < max(uCutoff, 0.01)) discard;',
				'	outColor = vec4(min(base.rgb, vec3(1.0)), 1.0);',
				'	outNormal = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);',
				'}'
			].join('\n'),

			Bake: head + [
				'in vec3 vNormal;',
				'in vec3 vColor;',
				'layout(location = 0) out vec4 outColor;',
				'layout(location = 1) out vec4 outNormal;',
				'void main() {',
				'	outColor = vec4(min(vColor, vec3(1.0)), 1.0);',
				'	outNormal = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);',
				'}'
			].join('\n'),

			PictureVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aInstance;',
				'in vec4 aInstance2;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform float uCells;',
				'uniform float uRadius;',
				'uniform float uMiddle;',
				'uniform vec4 uParallel;',
				'uniform vec4 uFade;',
				'uniform float uLod;',
				'out vec2 vUV;',
				'out vec3 vTint;',
				'out vec3 vWorld;',
				'out vec2 vTurn;',
				'out vec2 vFade;',
				'void main() {',
				'	vec3 center = aInstance.xyz + uOrigin + vec3(0.0, uMiddle * aInstance.w, 0.0);',
				'	vec3 to = uParallel.w > 0.5 ? uParallel.xyz : normalize(-center);',
				'	float c = cos(aInstance2.x);',
				'	float s = sin(aInstance2.x);',
				'	vec3 v = vec3(c * to.x - s * to.z, max(to.y, 0.02), s * to.x + c * to.z);',
				'	vec2 o = v.xz / (abs(v.x) + abs(v.y) + abs(v.z));',
				'	vec2 grid = clamp(vec2(o.x + o.y, o.x - o.y) * 0.5 + 0.5, 0.0, 0.999);',
				'	vec2 cell = floor(grid * uCells);',
				'	vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), to));',
				'	vec3 up = cross(to, right);',
				'	vec3 world = center + (right * aPosition.x + up * aPosition.y) * uRadius * aInstance.w;',
				'	vUV = (cell + aPosition.xy * 0.5 + 0.5) / uCells;',
				'	vTint = aInstance2.yzw;',
				'	vWorld = world;',
				'	vTurn = vec2(c, s);',
				'	float far = length(aInstance.xyz + uOrigin) * (uLod > 0.0 ? uLod / max(aInstance.w, 1.5) : 1.0);',
				'	vFade = vec2(smoothstep(uFade.x, uFade.y, far), 1.0 - smoothstep(uFade.z, uFade.w, far));',
				'	gl_Position = vFade.x > 0.0 && vFade.y > 0.0 ? uViewProjection * vec4(world, 1.0) : vec4(0.0, 0.0, 2.0, 1.0);',
				'}'
			].join('\n'),

			Picture: head + [
				'in vec2 vUV;',
				'in vec3 vTint;',
				'in vec3 vWorld;',
				'in vec2 vTurn;',
				'uniform sampler2D uColors;',
				'uniform sampler2D uNormals;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSkyLight;',
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				graphics.Chunks.Shadow,
				'void main() {',
				'	vec4 color = texture(uColors, vUV);',
				'	if (color.a < 0.5) discard;',
				'	vec3 n = texture(uNormals, vUV).xyz * 2.0 - 1.0;',
				'	n = normalize(vec3(vTurn.x * n.x + vTurn.y * n.z, n.y, vTurn.x * n.z - vTurn.y * n.x));',
				'	float light = max(dot(n, uSun), 0.0) * sunShadow(vWorld, n);',
				'	vec3 albedo = pow(color.rgb * vTint, vec3(2.2));',
				'	outColor = vec4(pow(albedo * (uSunColor * light * 1.35 + aroundLight(vWorld, n, mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5))), vec3(1.0 / 2.2)), 1.0);',
				'}'
			].join('\n'),

			GrassVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec4 aInstance;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform vec3 uEye;',
				'uniform float uWind;',
				'uniform sampler2D uField;',
				'uniform sampler2D uFree;',
				'uniform vec2 uFieldSize;',
				'uniform vec4 uBlade;',
				'uniform vec3 uClump;',
				'out vec3 vWorld;',
				'out float vAlong;',
				'out float vTone;',
				'out float vWave;',
				'out float vDry;',
				'void blueprintGrass(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				/* A value noise of the place: the tufts of the grass. */
				'float tuftNoise(vec2 p) {',
				'	vec2 i = mod(floor(p), 289.0);',
				'	vec2 f = fract(p);',
				'	f = f * f * (3.0 - 2.0 * f);',
				'	return mix(mix(fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5), fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5), f.x), mix(fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5), fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5), f.x), f.y);',
				'}',
				'vec2 ground(vec2 place) {',
				'	vec2 at = (place / uFieldSize.x + 0.5) * (uFieldSize.y - 1.0);',
				'	ivec2 cell = ivec2(floor(at));',
				'	vec2 t = at - vec2(cell);',
				'	vec2 a = mix(texelFetch(uField, cell, 0).xy, texelFetch(uField, cell + ivec2(1, 0), 0).xy, t.x);',
				'	vec2 b = mix(texelFetch(uField, cell + ivec2(0, 1), 0).xy, texelFetch(uField, cell + ivec2(1, 1), 0).xy, t.x);',
				'	return mix(a, b, t.y);',
				'}',
				'void main() {',
				'	vec2 place = aInstance.xy + aPosition.xz;',
				'	vec2 land = ground(place);',
				'	float along = aPosition.y;',
				'	float seed = aNormal.z;',
				'	float fade = 1.0 - smoothstep(uBlade.w * 0.7, uBlade.w, distance(place, uEye.xz));',
				/* Clumps: the ground thick with grass in places and bare between them, by a noise of Patch; Spread: how unlike one blade is to the next. */
				'	vec2 cellOf = place / max(1.0, uClump.y);',
				'	vec2 i = floor(cellOf);',
				'	vec2 f = cellOf - i;',
				'	f = f * f * (3.0 - 2.0 * f);',
				'	float n = mix(mix(fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5), fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5), f.x), mix(fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5), fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5), f.x), f.y);',
				'	float thick = mix(1.0, smoothstep(0.3, 0.7, n), uClump.x);',
				'	float own = fract(seed * 7.31 + 0.13);',
				/* Tufts half a metre across and the patches of a few metres they gather in: taller, shorter, greener, drier, so no lawn is a carpet. */
				'	float tuft = tuftNoise(place / 0.55) * 0.6 + tuftNoise(place / 2.7 + 13.1) * 0.4;',
				'	float dry = tuftNoise(place / 3.9 + 41.7);',
				'	float shape = 0.55 + 0.9 * tuft;',
				/* Where the ground is kept bare (a road, a river, a clearing), a metre a texel: its texels are at its edges. */
				'	vec2 freeSide = vec2(textureSize(uFree, 0));',
				'	float free = texture(uFree, ((place / uFieldSize.x + 0.5) * (freeSide - 1.0) + 0.5) / freeSide).r;',
				'	float tall = uBlade.x * shape * (1.0 + (own - 0.5) * 2.0 * uClump.z) * mix(1.0, 0.6 + 0.6 * thick, uClump.x) * smoothstep(0.35, 0.8, land.y) * smoothstep(0.1, 0.9, free) * fade * step(seed, uBlade.y * thick);',
				'	vec2 side = vec2(cos(aNormal.y), sin(aNormal.y));',
				'	vec3 world = vec3(place.x, land.x, place.y) + uOrigin;',
				/* The wind is waves over the field, one for all the blades of a place; a blade of its own stirs only near the eye. */
				'	float far = length(world);',
				'	float near = 1.0 - smoothstep(uBlade.w * 0.12, uBlade.w * 0.45, far);',
				'	vec3 bent = vec3(0.0);',
				'	world.xz += side * aNormal.x * 0.035 * uBlade.z;',
				'	blueprintGrass(vec3(place.x, along, place.y), vec3(side.x, 0.0, side.y), vec2(near, uBlade.w), 1.0, seed, tall, world, bent);',
				'	world.y += along * tall * step(0.01, tall);',
				'	vWorld = world;',
				'	vAlong = along;',
				'	vTone = (0.85 + seed * 0.3 * near + 0.15 * (1.0 - near)) * (0.88 + 0.24 * tuft);',
				'	vDry = smoothstep(0.55, 0.85, dry) * 0.6;',
				'	vWave = bent.x;',
				/* A blade with no height, under water or on a rock, is not a sliver on the ground: it is not there. */
				'	gl_Position = tall > 0.01 ? uViewProjection * vec4(world, 1.0) : vec4(0.0, 0.0, 2.0, 1.0);',
				'}'
			].join('\n'),

			Grass: head + [
				'in vec3 vWorld;',
				'in float vAlong;',
				'in float vTone;',
				'in float vWave;',
				'in float vDry;',
				'uniform vec3 uRoot;',
				'uniform vec3 uTip;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSkyLight;',
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				graphics.Chunks.Shadow,
				'void main() {',
				'	float light = max(uSun.y, 0.0) * sunLit(vWorld, vec3(0.0, 1.0, 0.0));',
				/* What bends in the wind shows its pale side: from afar the wind is a slow sheen. */
				/* A patch gone dry: its tips straw. */
				'	vec3 tip = mix(uTip, uTip * vec3(1.25, 1.05, 0.55), vDry);',
				'	vec3 color = pow(mix(uRoot, tip, vAlong) * vTone * (1.0 + vWave * 0.05 * vAlong), vec3(2.2));',
				'	float through = 1.0 + vAlong * 0.6;',
				'	outColor = vec4(pow(color * (uSunColor * light * 1.35 * through + aroundSoft(vWorld, vec3(0.0, 1.0, 0.0), mix(uFloorLight, uSkyLight, 0.5 + vAlong * 0.5)) * (0.4 + vAlong * 0.6) + localLight(vWorld, vec3(0.0, 1.0, 0.0))), vec3(1.0 / 2.2)), 1.0);',
				'}'
			].join('\n')
		};
	}
});
