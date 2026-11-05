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
 * Size, Turn}]).
 */
Elemenx.Trait('SceneScatter', {
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
		var state = {Sown: Math.random().toString(36).slice(2, 8), Generation: 0, Running: 0, Flying: 0, Kept: {}, Houses: [], Settled: '', Surfaces: {}, Key: '', Squares: [], Waiting: [], Streams: {}, Meshes: {}, Baked: {}, Blocked: {}, Things: 0, Moved: true, Eye: null, Look: null, Grass: null, Field: null, Programs: null};

		this.Sown = function () {
			return {Things: state.Things, Squares: state.Squares.length, Waiting: state.Waiting.length + state.Flying, Draws: Object.keys(state.Streams).filter(function (key) {
				return state.Streams[key].Count;
			}).length, Copies: Object.keys(state.Streams).reduce(function (sum, key) {
				return sum + state.Streams[key].Count;
			}, 0), Blades: state.Grass ? state.Grass.Blades : 0};
		};

		/*
		 * A surface that fades as a level gives way to the next: a pattern of holes that grows, so nothing pops. vFade is how
		 * far it came in and how much of it is left: the one that comes keeps exactly the points the one that goes lost.
		 */
		function dithered (fragment) {
			var at = fragment.lastIndexOf('void main() {');

			return fragment.slice(0, at) + 'in vec2 vFade;\nuniform float uDither;\nvoid main() {\n\tfloat hole = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uDither * 0.618034);\n\tif (hole >= vFade.y || hole < 1.0 - vFade.x) discard;' + fragment.slice(at + 13);
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
					Many: renderer.Program(shaders.Vertex, dithered(self.Shaders(graphics).Solid)),
					Files: renderer.Program(shaders.Vertex, dithered(self.Shaders(graphics).Pbr)),
					Depth: renderer.Program(shaders.Vertex, self.Shaders(graphics).Depth),
					Bake: renderer.Program(shaders.BakeVertex, shaders.Bake),
					Picture: renderer.Program(shaders.PictureVertex, dithered(shaders.Picture)),
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

			return given.concat(lands()).concat(sketched().Rules);
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

			/* Asked for each place a thing may grow: the same sketch in the same scene is what it was. */
			if (state.Sketched && state.SketchOf === sketch && state.SketchVersion === scene.Version) return state.Sketched;

			text = sketch ? JSON.stringify(sketch) : '';
			state.SketchOf = sketch;
			state.SketchVersion = scene.Version;

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

					if ((item.Type === 'road' || item.Type === 'river') && item.Points && item.Points.length > 1)
						made.Lines.push({Points: item.Points, Reach: (Number(item.Width) || 6) / 2 + (item.Type === 'river' ? Number(item.Bank === undefined ? 6 : item.Bank) * 0.5 : 1)});

					if (item.Type === 'marker' && item.At || games[item.Type] && (item.At || item.Points))
						made.Markers.push(item);

					if (!preset) return;

					rule = Object.assign({ID: 'sketch-' + item.ID, Seed: item.ID, Cover: 1, MinHeight: 0.2, MaxSlope: kind === 'line' ? 2 : 0.6}, preset);

					['Shapes', 'Density', 'Size', 'Passability', 'Clumps', 'Spacing', 'Gap', 'Way', 'MaxSlope', 'Seed'].forEach(function (key) {
						if (item[key] !== undefined && item[key] !== '')
							rule[key] = item[key];
					});

					if (kind === 'area') rule.Area = item.Points;
					else rule.Line = item.Points;

					if (item.Type === 'fields' || item.Type === 'orchard')
						rule.Rows = true;

					made.Rules.push(rule);
				});
			});

			settlements(made);

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

			(sketch && sketch.Layers || []).forEach(function (layer) {
				(layer.Items || []).forEach(function (item) {
					if (item.Type === 'settlement')
						lit[item.ID] = Number(item.Lit) || 0;

					/* A wall drawn alone: its pieces and a tower at each of its corners. */
					if (item.Type === 'citywall' && item.Points && item.Points.length > 1) {
						made.Rules.push({ID: 'sketch-' + item.ID, Shapes: ['city-wall'], Line: item.Points, Spacing: 6, Fit: true, Passability: 0, Cover: 1, MinHeight: -100});
						made.Rules.push({ID: 'sketch-' + item.ID + '/towers', Fixed: item.Points.map(function (point) {
							return {X: point[0], Z: point[1], Model: 'wall-tower'};
						}), Passability: 0});
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

				/* A landmark is a building of the scene, its own model; a marker an object a game finds. */
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

			/* What a sketch sows is told by its text: its lots are many, and the key is made every frame. */
			key = ground ? ground.Key + JSON.stringify(given.slice(0, given.length - sketched().Rules.length)) + (state.SketchText || '') : '';

			if (key === state.Key) return;

			state.Key = key;
			state.Generation = (state.Generation || 0) + 1;
			state.Running = 0;
			state.Flying = 0;
			state.Squares = [];
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

			list.forEach(function (rule) {
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

			state.Context = {Generation: state.Generation, Inline: inline, Shared: false, Data: {Key: state.Sown + ':' + state.Generation, Options: inline ? null : ground.Field.Options, Field: inline ? ground.Field : null, Roads: ground.Field.Roads || null, Kept: Object.keys(state.Kept), Rules: list, Free: {Areas: made.Areas, Lines: made.Lines}, Models: table, Size: size}};

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
			});

			result.Blocked.forEach(function (cell) {
				state.Blocked[cell] = true;
			});

			state.Things += result.Things;
			state.Moved = true;
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

		function append (target, list) {
			var capacity = target.Capacity;
			var places;
			var extra;

			while (target.Count + list.Count > capacity)
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
				state.Meshes[key] = library.Levels(parts[0], {Variant: Number(parts[1])}).map(function (geometry) {
					return renderer.Mesh(geometry);
				});
			}

			return state.Meshes[key];
		}

		/* The streams of what is in view now, and each its copies for the draws. */
		function gather (matrix) {
			var view = planes(matrix);
			var eye = scene.Eye;
			var reach = scene.Camera.Ortho ? 0 : 1;
			var quality = self.ScatterReach ? self.ScatterReach() : 1;
			var radius = size * 0.75 + 12;
			var margin = reach ? size * 0.75 + 8 : 0;

			Object.keys(state.Streams).forEach(function (name) {
				state.Streams[name].Count = 0;
			});

			state.Squares.forEach(function (square) {
				var x = square.Center[0] - eye[0];
				var y = square.Center[1] - eye[1];
				var z = square.Center[2] - eye[2];
				var inside = view.every(function (plane) {
					return plane[0] * x + plane[1] * y + plane[2] * z + plane[3] > -radius;
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
					if (reach ? distance + margin <= from || distance - margin >= to : one !== level) return;

					Object.keys(square.Lists).forEach(function (key) {
						/* What grows only round the eye is not asked for farther. */
						if (reach && square.Lists[key].Reach && distance - margin > square.Lists[key].Reach) return;

						append(stream(key, one), square.Lists[key]);
					});
				});
			});

			Object.keys(state.Streams).forEach(function (name) {
				var each = state.Streams[name];
				var data = {aInstance: {Size: 4, Data: each.Places.subarray(0, each.Count * 4)}, aInstance2: {Size: 4, Data: each.Extra.subarray(0, each.Count * 4)}};

				if (!each.Count) return;

				if (each.Level === 0 && surfaces(each.Key)) {
					surfaces(each.Key).forEach(function (one) {
						one.Mesh.Instance(data, each.Count);
					});

					return;
				}

				(each.Level === 3 ? picture(each.Key).Quad : levels(each.Key)[each.Level]).Instance(data, each.Count);
			});
		}

		/* The surfaces of a model of a file, each with its material: near the eye it is drawn with its pictures. */
		function surfaces (key) {
			var parts = key.split('~');
			var model = library.Make(parts[0], {Variant: Number(parts[1])});
			if (!model.Asset) return null;

			if (!state.Surfaces[key]) {
				state.Surfaces[key] = library.Surfaces(model).map(function (one) {
					return Object.assign(one, {Mesh: renderer.Mesh(one.Geometry)});
				});
			}

			return state.Surfaces[key];
		}

		/* Where a level is seen: it comes in between the first two distances, and goes between the last two. */
		function fadeOf (level) {
			var quality = self.ScatterReach ? self.ScatterReach() : 1;
			var from = level ? steps[level - 1] : [-2, -1];
			var to = level < 3 ? steps[level] : [1e8, 2e8];

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
			var column;
			var row;

			if (state.Baked[key])
				return state.Baked[key];

			model = library.Make(parts[0], {Variant: Number(parts[1])});
			whole = library.Whole(model);
			bounds = library.Bounds(whole);
			target = renderer.Target(cells * side, cells * side, {Colors: 2, Depth: true});
			mesh = renderer.Mesh(whole);

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

					renderer.Draw(mesh, programs().Bake, {uViewProjection: matrix}, {Cull: 'none'});
				}
			}

			target.End();

			mesh.Destroy();

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
		function fieldOf (rule) {
			var ground = scene.Ground;
			var field = ground.Field;
			var side = 256;
			var made = sketched();
			var key = ground.Key + JSON.stringify(rule) + (state.SketchText || '');
			var grass = state.Grass;
			var started = performance.now();
			var half = field.Size / 2;
			var step = field.Size / (side - 1);
			var top = rule.MaxHeight === undefined || rule.MaxHeight === '' ? Math.min(field.Rock === undefined ? field.Top * 0.45 : field.Rock, field.Snow === undefined ? Infinity : field.Snow) : Number(rule.MaxHeight);
			var steep = rule.MaxSlope === undefined ? 0.28 : Number(rule.MaxSlope);
			var fine = Math.max(2, Math.min(2048, Math.ceil(field.Size) + 1));
			var row;
			var x;

			if (!grass || grass.Key !== key) {
				if (grass && grass.Texture)
					grass.Texture.Destroy();

				if (grass && grass.Free)
					grass.Free.Destroy();

				grass = state.Grass = {Key: key, Data: new Float32Array(side * side * 4), Row: 0, Side: side, Texture: null, Free: null, Blades: 0, Near: bladesMesh(1300, 7), Far: bladesMesh(330, 7), Patches: null};

				/* What is kept bare: nothing to make when nothing is. */
				if (made.Lines.length || made.Areas.length) {
					grass.Freeing = true;

					self.$Service('SceneTerrainGenerator').Work().Run('SceneTerrainGenerator', 'Free', [field.Size, fine, made.Lines, made.Areas], function (error, data) {
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
					renderer.Draw(each[0], programs().Grass, Object.assign({}, uniforms, {uOrigin: vectors.Subtract([0, 0, 0], eye), uField: grass.Texture, uFree: grass.Free, uFieldSize: [ground.Field.Size, grass.Side], uBlade: [Number(rule.Height) || 0.7, Number(rule.Density) || 1, each[0] === grass.Far ? 2.2 : 1, patches * extent * 0.95], uClump: [Math.max(0, Math.min(1, Number(rule.Clumps) || 0)), Number(rule.Patch) || 24, rule.Spread === undefined || rule.Spread === '' ? 0.45 : Math.max(0, Math.min(1, Number(rule.Spread)))], uRoot: engine.Paint(rule.Root || '#2f5a22').slice(0, 3), uTip: engine.Paint(rule.Color || '#7fae4a').slice(0, 3), uSun: ground.Sun, uSunColor: ground.SunColor, uEye: target}), {Cull: 'none'});
				}
			});
		}

		/* Before anything is drawn of a frame: what came, and the streams when the view moved. */
		engine.ScatterFrame = function (matrix) {
			var eye = scene.Eye;
			var look = matrix[2] + matrix[6] * 3 + matrix[10] * 7;

			prepare();

			grow();

			if (!state.Squares.length) return;

			if (state.Moved || !state.Eye || vectors.Distance(state.Eye, eye) > 6 || Math.abs(state.Look - look) > 0.04) {
				state.Moved = false;
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

			/*
			 * Each stream by the shape that holds its copies (gather put them there): the near ones drawn by the simpler shape of
			 * the next level had the copies of that level, and the trees near the eye cast no shadow where the levels do not
			 * overlap (at ultra: farther apart).
			 */
			each(function (one) {
				if (one.Level === 3 || one.Level === 0 && surfaces(one.Key)) return;

				renderer.Draw(levels(one.Key)[one.Level], programs().Depth, Object.assign({uViewProjection: matrix, uOrigin: origin, uWind: scene.Gust || 0, uSway: 0, uFade: fadeOf(one.Level)}, self.WindValues(scene.Seconds)), {Cull: 'none'});
			});
		};

		engine.ScatterDraw = function (uniforms, matrix) {
			var origin = vectors.Subtract([0, 0, 0], scene.Eye);
			var ground = scene.Ground;
			var dither = engine.PostStep ? engine.PostStep() : 0;
			var files;
			var many;
			var far;

			if (!ground) return;

			/* The uniforms of a program made once a frame, what differs set for each draw: no copy of them all for each. */
			files = Object.assign({}, uniforms, {uOrigin: origin, uWind: scene.Gust || 0, uFade: fadeOf(0), uDither: dither});
			many = Object.assign({}, uniforms, {uOrigin: origin, uWind: scene.Gust || 0, uShine: 8, uSpecular: 0.05, uRough: 0.5, uDither: dither});
			far = Object.assign({}, uniforms, {uOrigin: origin, uFade: fadeOf(3), uDither: dither, uSun: ground.Sun, uSunColor: ground.SunColor, uParallel: scene.Camera.Ortho ? vectors.Normalize(vectors.Subtract(scene.Camera.Position, scene.Camera.Target)).concat([1]) : [0, 0, 0, 0]});

			each(function (one) {
				var parts = one.Key.split('~');
				var made = library.Make(parts[0], {Variant: Number(parts[1])});
				var baked;

				if (one.Level === 0 && surfaces(one.Key)) {
					surfaces(one.Key).forEach(function (each) {
						files.uSway = made.Sway;
						files.uSoftness = each.Soft;

						renderer.Draw(each.Mesh, programs().Files, Object.assign(files, engine.Surface(each)), {Cull: each.Material.DoubleSided ? 'none' : 'back'});
					});

					return;
				}

				if (one.Level < 3) {
					many.uSway = made.Sway;
					many.uSoft = made.Sway ? 0.9 : 0;
					many.uFade = fadeOf(one.Level);

					renderer.Draw(levels(one.Key)[one.Level], programs().Many, many, {Cull: 'back'});

					return;
				}

				baked = picture(one.Key);

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

		/* What is sown round a point, of the squares made so far: [{Model, X, Y, Z, Size, Turn}], the nearest first. */
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
							found.push({Model: key.split('~')[0], X: px, Y: list.Places[i * 4 + 1], Z: pz, Size: list.Places[i * 4 + 3], Turn: list.Extra[i * 4], Far: far});
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
				'	vWorld = world;',
				'	vNormal = bent;',
				'	vLocal = aPosition;',
				'	vColor = aColor * aInstance2.yzw;',
				'	vUV = aUV;',
				'	vTint = aInstance2.yzw;',
				'	float far = length(aInstance.xyz + uOrigin);',
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
				'	float far = length(aInstance.xyz + uOrigin);',
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
				'	outColor = vec4(pow(albedo * (uSunColor * light * 1.35 + mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) + sunBounce(vWorld)), vec3(1.0 / 2.2)), 1.0);',
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
				'void blueprintGrass(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
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
				/* Where the ground is kept bare (a road, a river, a clearing), a metre a texel: its texels are at its edges. */
				'	vec2 freeSide = vec2(textureSize(uFree, 0));',
				'	float free = texture(uFree, ((place / uFieldSize.x + 0.5) * (freeSide - 1.0) + 0.5) / freeSide).r;',
				'	float tall = uBlade.x * (1.0 + (own - 0.5) * 2.0 * uClump.z) * mix(1.0, 0.6 + 0.6 * thick, uClump.x) * smoothstep(0.35, 0.8, land.y) * smoothstep(0.1, 0.9, free) * fade * step(seed, uBlade.y * thick);',
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
				'	vTone = 0.85 + seed * 0.3 * near + 0.15 * (1.0 - near);',
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
				'	vec3 color = pow(mix(uRoot, uTip, vAlong) * vTone * (1.0 + vWave * 0.05 * vAlong), vec3(2.2));',
				'	float through = 1.0 + vAlong * 0.6;',
				'	outColor = vec4(pow(color * (uSunColor * light * 1.35 * through + mix(uFloorLight, uSkyLight, 0.5 + vAlong * 0.5) * (0.4 + vAlong * 0.6) * skySeen(vWorld) + sunBounce(vWorld) + localLight(vWorld, vec3(0.0, 1.0, 0.0))), vec3(1.0 / 2.2)), 1.0);',
				'}'
			].join('\n')
		};
	}
});
