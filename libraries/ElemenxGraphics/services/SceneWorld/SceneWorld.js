/*
 * SceneWorld: the world of a ground as a graph of its steps, the one place a ground and what grows on it are told. A
 * graph of the kind world of Blueprints (declared in $Provides: Blueprints makes it when such a graph or one of its
 * blocks is met), its steps blocks with typed inputs and outputs: a land (type land, the options of a flat ground,
 * SceneTerrainGenerator.Flat) goes from step to step, and the things made on it (type things, objects of a Scene)
 * gather along a chain of their own; Terrain is the end, taking both (a World is the graph of a ground).
 * - Ground: the land, Size, Height, Water, Seed, Rock and Snow (numbers may come to its inputs).
 * - Planet: a place of a planet of ScenePlanet (Planet: its options; Latitude, Longitude, Turn): the land is the ground
 *   of its globe there, exactly: its coasts, heights, climate and lands (SceneTerrainGenerator.Site).
 * - Relief: its hills, Scale and Ridges, a graph of its own (Graph, a generator of Blueprints: X, Z to Height, Moisture,
 *   Temperature; LibraryRelief of SceneTerrainGenerator starts one) or a spec of the Noise Service (Noise).
 * - Climate: the numbers of its climate (Warmth, Lapse, Spread, Stretch: ClimateOf of SceneTerrainGenerator).
 * - Biomes: its lands by their climate (List: names of SceneBiomes, or {Biome, Ground, Grass, Climate, Scatter}).
 * - Sketch: a sketch over it (Sketch: {Layers}, as SceneEditor draws it).
 * - Border: the outline of a location (Points, Sides), what is past it (Beyond: far, cliff, void, sea, wall; Edge, Depth)
 *   and its passages (Passages of SceneLocations: roads, rivers and gates out of it).
 * - Tunnel (Points [[x, z, y]...], Radius, Flat, Depth), Caves (natural ways and halls of noise under the ground round X, Z
 *   within Radius: Top, Bottom, Scale, Width, Halls, Seed) and Overhangs (rock jutting out of steep slopes: Amount, Scale,
 *   Slope; X, Z and Radius for a place of them): the volume of the land, cut and grown (Carves of
 *   SceneTerrainGenerator.Volume); the squares of the ground they touch are made of its density.
 * - Footings: the ground gives way under what stands on it: a level place under each building, Margin metres round it,
 *   at the height there (Mode mean, low, high), the ground coming to it within Edge (the trait SceneFootings of a Scene).
 * - Roads: its settlements and the passages of its Border joined by roads along the ground (Main, Minor, Paths: the types
 *   of SceneRoads of each class; Rail: a railway beside the main ones), roads among its things.
 * - Settlement: a village laid on it (X, Y, Houses, Radius, Seed, Shapes), and Scatter: things sown over it by a rule
 *   (Kind, Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps, Seed, Blocks, Biome, and Graph, a
 *   rule of its own: LibraryScatter of SceneSower starts one). Each takes the things before it (Under) and gives them
 *   with its own.
 * A block turned off lets what comes to it through. Any Service may add steps of its own: blocks of the kind world,
 * declared to Blueprints in $Provides as these are, a land in and a land out, or things in and things out. The blocks of a
 * generator (numbers, parameters) are there too, for the numbers of the steps.
 * - Make(graph, parameters): {Ground (the options of its ground; null with no World or no land to it), Things (the specs
 *   of the objects it makes: {ID, Kind, Values}, their IDs of their order), Problems (what keeps the graph from running)},
 *   made once for the same graph and parameters.
 * - Library(options): the graph of a usual world of options (Size, Height, Water, Seed, Rock, Snow, Scale, Ridges, Noise,
 *   Relief, Planet ({Options, Latitude, Longitude, Turn}), Climate, Biomes, Sketch, Border (its properties), Tunnels and Caves (lists of the properties of such steps), Overhangs, Footings and Roads (true or their properties); and Settlements, Scatters: lists of the properties of such blocks): what an editor or
 *   a page starts from.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneWorld', {
	$Meta: {
		Description: 'The world of a ground as a graph of its steps: the land, its relief, climate, biomes and sketch, and what is made on it.',
		Methods: ['Make(graph, parameters)', 'Library(options)']
	},

	$Provides: {
		Blueprints: {Graphs: ['world'], Nodes: ['Ground', 'Planet', 'Relief', 'Climate', 'Biomes', 'Sketch', 'Border', 'Footings', 'Tunnel', 'Caves', 'Overhangs', 'Roads', 'Settlement', 'Scatter', 'Terrain']}
	},

	$OnCreate: function () {
		this.Steps();
	},

	/* The kind world and its blocks. */
	Steps: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');

		/* What comes to an input, else the property; none is left out. */
		function value (inputs, properties, key) {
			var told = inputs[key] !== undefined && inputs[key] !== null ? inputs[key] : properties[key];

			return told === undefined || told === null || told === '' ? undefined : told;
		}

		/* A land taken further: a copy of it with what a step sets. */
		function land (inputs, changes) {
			var made = Object.assign({}, inputs.Land || {});

			Object.keys(changes).forEach(function (key) {
				if (changes[key] === undefined) delete made[key];
				else made[key] = changes[key];
			});

			return {Land: made};
		}

		/* A list told as text ('pine, oak') or as a list. */
		function list (told) {
			if (Array.isArray(told)) return told;

			return typeof told === 'string' && told.trim() ? told.split(',').map(function (part) {
				return part.trim();
			}).filter(Boolean) : undefined;
		}

		/* The values of a thing: those told, none empty. */
		function values (properties, keys) {
			var made = {};

			keys.forEach(function (key) {
				var told = properties[key];
				if (told === undefined || told === null || told === '') return;

				made[key] = key === 'Shapes' ? list(told) : told;
			});

			return made;
		}

		blueprints.Graph('world', {
			End: 'Terrain',
			Uses: ['generator'],
			Compile: function (plan) {
				return {
					Make: function (parameters) {
						var run = {Outputs: {}, Parameters: parameters || {}, Inputs: {}, Memo: true, Graph: {parameters: this && this.Parameters || plan.Graph.parameters}};
						var end = plan.Order.filter(function (id) {
							return plan.Blocks[id].type === 'Terrain' && plan.Blocks[id].enabled !== false;
						})[0];
						var made = blueprints.Gather(plan, end, run, 0);

						return {Ground: made.Land || null, Things: made.Things || []};
					}
				};
			}
		});

		blueprints.Node('Ground', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Size', Type: 'number', Value: 1000}, {Key: 'Height', Type: 'number', Value: 60}, {Key: 'Water', Type: 'number', Value: 0.35}, {Key: 'Seed', Type: 'text', Value: 'ground'}, {Key: 'Rock', Type: 'text', Value: ''}, {Key: 'Snow', Type: 'text', Value: ''}],
			Inputs: [{Key: 'Size', Type: 'float'}, {Key: 'Height', Type: 'float'}, {Key: 'Water', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var made = {Size: Number(value(inputs, properties, 'Size')) || 1000, Height: Number(value(inputs, properties, 'Height') || 0), Water: Number(value(inputs, properties, 'Water') || 0), Seed: properties.Seed === undefined || properties.Seed === null ? 'ground' : properties.Seed};

				/* Rock and Snow: a part of its Height, false for none, nothing for the usual. */
				['Rock', 'Snow'].forEach(function (key) {
					var told = properties[key];

					if (told === false || told === 'false') made[key] = false;
					else if (told !== undefined && told !== null && told !== '') made[key] = Number(told);
				});

				return {Land: made};
			}
		});

		/* A place of a planet of ScenePlanet: the land is the ground of its globe there, its heights, climate and lands. */
		blueprints.Node('Planet', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Planet', Type: 'object', Value: null}, {Key: 'Latitude', Type: 'number', Value: 0}, {Key: 'Longitude', Type: 'number', Value: 0}, {Key: 'Turn', Type: 'number', Value: 0}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Latitude', Type: 'float'}, {Key: 'Longitude', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var planet = properties.Planet || {};

				return land(inputs, {Planet: {Options: planet, Latitude: Number(value(inputs, properties, 'Latitude')) || 0, Longitude: Number(value(inputs, properties, 'Longitude')) || 0, Turn: Number(properties.Turn) || 0}, Height: Number(planet.Relief) || 8000, Water: (Number(planet.Depth) || 6000) / ((Number(planet.Depth) || 6000) + (Number(planet.Relief) || 8000)), Seed: planet.Seed === undefined ? 'planet' : planet.Seed});
			}
		});

		blueprints.Node('Relief', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Scale', Type: 'number', Value: 180}, {Key: 'Ridges', Type: 'number', Value: 0.4}, {Key: 'Graph', Type: 'object', Value: null}, {Key: 'Noise', Type: 'object', Value: null}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Scale', Type: 'float'}, {Key: 'Ridges', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				return land(inputs, {Scale: Number(value(inputs, properties, 'Scale')) || 180, Ridges: Number(value(inputs, properties, 'Ridges') || 0), Relief: properties.Graph || undefined, Noise: properties.Noise || undefined, ReliefSource: undefined});
			}
		});

		blueprints.Node('Climate', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Warmth', Type: 'number', Value: 0.72}, {Key: 'Lapse', Type: 'number', Value: 0.7}, {Key: 'Spread', Type: 'number', Value: 0.7}, {Key: 'Stretch', Type: 'number', Value: 2.2}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Warmth', Type: 'float'}, {Key: 'Lapse', Type: 'float'}, {Key: 'Spread', Type: 'float'}, {Key: 'Stretch', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var climate = {};

				['Warmth', 'Lapse', 'Spread', 'Stretch'].forEach(function (key) {
					var told = value(inputs, properties, key);
					if (told !== undefined)
						climate[key] = Number(told);
				});

				return land(inputs, {Climate: climate});
			}
		});

		blueprints.Node('Biomes', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'List', Type: 'object', Value: ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']}],
			Inputs: [{Key: 'Land', Type: 'land'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var told = list(properties.List);

				return land(inputs, {Biomes: told && told.length ? told : undefined, BiomeList: undefined});
			}
		});

		blueprints.Node('Sketch', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Sketch', Type: 'object', Value: null}],
			Inputs: [{Key: 'Land', Type: 'land'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var sketch = properties.Sketch;

				return land(inputs, {Sketch: sketch && sketch.Layers && sketch.Layers.length ? sketch : undefined});
			}
		});

		/*
		 * The outline of a location (Points, Sides of ScenePlanet.CellPlace), what is past it (Beyond, Edge, Depth:
		 * SceneTerrainGenerator.Border) and its passages (Passages of SceneLocations): open ways out, each a road (a river
		 * of the kind river) from past its side to the middle; with Beyond wall a wall stands on the outline, open at each
		 * passage, a gate in those of the kind gate. Open: the sides it is not on (a location told beside them).
		 */
		blueprints.Node('Border', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Points', Type: 'object', Value: null}, {Key: 'Sides', Type: 'object', Value: null}, {Key: 'Beyond', Type: 'text', Value: 'far'}, {Key: 'Passages', Type: 'object', Value: null}, {Key: 'Open', Type: 'object', Value: null}, {Key: 'Edge', Type: 'number', Value: 40}, {Key: 'Depth', Type: 'text', Value: ''}],
			Inputs: [{Key: 'Land', Type: 'land'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var points = list(properties.Points) || [];
				var sides = list(properties.Sides) || [];
				var passages = list(properties.Passages) || [];
				var open = list(properties.Open) || [];
				var beyond = properties.Beyond || 'far';
				var edge = Number(properties.Edge) || 40;
				var border = {Points: points, Sides: sides, Beyond: beyond, Passages: passages, Open: open, Edge: edge};
				var before = (inputs.Land || {}).Sketch;
				var items = [];
				var gates = [];

				if (properties.Depth !== undefined && properties.Depth !== null && properties.Depth !== '')
					border.Depth = Number(properties.Depth);

				passages.forEach(function (passage, index) {
					var side = sides[passage.Side];
					var at = passage.At === undefined ? 0.5 : Number(passage.At);
					var width = Number(passage.Width) || 4;
					var x;
					var z;
					var dx;
					var dz;
					var length;
					var out;

					if (!side) return;

					x = side[0] + (side[2] - side[0]) * at;
					z = side[1] + (side[3] - side[1]) * at;
					length = Math.hypot(side[2] - side[0], side[3] - side[1]) || 1;
					dx = (side[2] - side[0]) / length;
					dz = (side[3] - side[1]) / length;

					/* Out of the location: the normal of its side away from its middle. */
					out = -dz * x + dx * z > 0 ? [-dz, dx] : [dz, -dx];

					items.push({ID: 'border-passage-' + index, Type: passage.Kind === 'river' ? 'river' : 'road', Width: width, Points: [[x + out[0] * edge * 3, z + out[1] * edge * 3], [x, z], [x * 0.6, z * 0.6], [0, 0]]});
					gates.push({Side: passage.Side, X: x, Z: z, Radius: width / 2 + 3, Turn: Math.atan2(-dz, dx), Model: passage.Kind === 'gate' ? 'gate' : ''});
				});

				/* A wall on each side but those open all along. */
				if (beyond === 'wall') {
					sides.forEach(function (side, index) {
						if (open.indexOf(index) === -1)
							items.push({ID: 'border-wall-' + index, Type: 'citywall', Points: [[side[0], side[1]], [side[2], side[3]]], Gates: gates.filter(function (gate) {
								return gate.Side === index;
							})});
					});
				}

				return land(inputs, {Border: border, Sketch: items.length ? {Layers: (before && before.Layers || []).concat([{ID: 'border', Name: 'Border', Items: items}])} : before});
			}
		});

		blueprints.Node('Footings', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Edge', Type: 'number', Value: 6}, {Key: 'Margin', Type: 'number', Value: 1}, {Key: 'Mode', Type: 'select', Options: ['mean', 'low', 'high'], Value: 'mean'}],
			Inputs: [{Key: 'Land', Type: 'land'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				return land(inputs, {Footings: {Edge: Number(properties.Edge), Margin: Number(properties.Margin), Mode: properties.Mode || 'mean'}});
			}
		});

		/* A carve of the volume of the land (SceneTerrainGenerator.Volume), one more on its list. */
		function carve (inputs, made) {
			return land(inputs, {Carves: ((inputs.Land || {}).Carves || []).concat([made])});
		}

		blueprints.Node('Tunnel', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Points', Type: 'object', Value: []}, {Key: 'Radius', Type: 'number', Value: 2.5}, {Key: 'Flat', Type: 'number', Value: 0.5}, {Key: 'Depth', Type: 'number', Value: 0}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Radius', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				return carve(inputs, {Type: 'tunnel', Points: list(properties.Points) || [], Radius: Number(value(inputs, properties, 'Radius')) || 2.5, Flat: Number(properties.Flat), Depth: Number(properties.Depth) || 0});
			}
		});

		blueprints.Node('Caves', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'X', Type: 'number', Value: 0}, {Key: 'Z', Type: 'number', Value: 0}, {Key: 'Radius', Type: 'number', Value: 100}, {Key: 'Top', Type: 'number', Value: 3}, {Key: 'Bottom', Type: 'number', Value: 40}, {Key: 'Scale', Type: 'number', Value: 24}, {Key: 'Width', Type: 'number', Value: 0.35}, {Key: 'Halls', Type: 'number', Value: 0.5}, {Key: 'Seed', Type: 'text', Value: ''}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Halls', Type: 'float'}, {Key: 'Width', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				return carve(inputs, {Type: 'caves', Center: [Number(properties.X) || 0, Number(properties.Z) || 0], Radius: Number(properties.Radius), Top: Number(properties.Top), Bottom: Number(properties.Bottom), Scale: Number(properties.Scale), Width: Number(value(inputs, properties, 'Width')), Halls: Number(value(inputs, properties, 'Halls')), Seed: properties.Seed || undefined});
			}
		});

		blueprints.Node('Overhangs', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Amount', Type: 'number', Value: 6}, {Key: 'Scale', Type: 'number', Value: 24}, {Key: 'Slope', Type: 'number', Value: 0.45}, {Key: 'X', Type: 'text', Value: ''}, {Key: 'Z', Type: 'text', Value: ''}, {Key: 'Radius', Type: 'text', Value: ''}, {Key: 'Seed', Type: 'text', Value: ''}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Amount', Type: 'float'}],
			Outputs: [{Key: 'Land', Type: 'land'}],
			Compute: function (inputs, properties) {
				var placed = properties.Radius !== '' && properties.Radius !== undefined && properties.Radius !== null;

				return carve(inputs, {Type: 'overhangs', Amount: Number(value(inputs, properties, 'Amount')), Scale: Number(properties.Scale), Slope: Number(properties.Slope), Center: placed ? [Number(properties.X) || 0, Number(properties.Z) || 0] : undefined, Radius: placed ? Number(properties.Radius) : undefined, Seed: properties.Seed || undefined});
			}
		});

		blueprints.Node('Settlement', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Name', Type: 'text', Value: ''}, {Key: 'X', Type: 'number', Value: 0}, {Key: 'Y', Type: 'number', Value: 0}, {Key: 'Houses', Type: 'number', Value: 8}, {Key: 'Radius', Type: 'number', Value: 30}, {Key: 'Seed', Type: 'text', Value: ''}, {Key: 'Shapes', Type: 'text', Value: ''}],
			Inputs: [{Key: 'Under', Type: 'things'}],
			Outputs: [{Key: 'Things', Type: 'things'}],
			Compute: function (inputs, properties) {
				return {Things: (inputs.Under || []).concat([{Kind: 'village', Values: values(properties, ['Name', 'X', 'Y', 'Houses', 'Radius', 'Seed', 'Shapes'])}])};
			}
		});

		blueprints.Node('Scatter', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Kind', Type: 'text', Value: 'forest'}, {Key: 'Name', Type: 'text', Value: ''}, {Key: 'Shapes', Type: 'text', Value: ''}, {Key: 'Density', Type: 'text', Value: ''}, {Key: 'Size', Type: 'object', Value: null}, {Key: 'MinHeight', Type: 'text', Value: ''}, {Key: 'MaxHeight', Type: 'text', Value: ''}, {Key: 'MaxSlope', Type: 'text', Value: ''}, {Key: 'Cover', Type: 'text', Value: ''}, {Key: 'Patch', Type: 'text', Value: ''}, {Key: 'Clumps', Type: 'text', Value: ''}, {Key: 'Seed', Type: 'text', Value: ''}, {Key: 'Blocks', Type: 'text', Value: ''}, {Key: 'Biome', Type: 'text', Value: ''}, {Key: 'Graph', Type: 'object', Value: null}],
			Inputs: [{Key: 'Under', Type: 'things'}],
			Outputs: [{Key: 'Things', Type: 'things'}],
			Compute: function (inputs, properties) {
				var made = values(properties, ['Name', 'Shapes', 'Size', 'Seed', 'Biome', 'Graph']);

				/* Its numbers as numbers, Blocks as a yes or a no. */
				['Density', 'MinHeight', 'MaxHeight', 'MaxSlope', 'Cover', 'Patch', 'Clumps'].forEach(function (key) {
					var told = properties[key];
					if (told !== undefined && told !== null && told !== '' && !isNaN(Number(told)))
						made[key] = Number(told);
				});

				if (properties.Blocks !== undefined && properties.Blocks !== null && properties.Blocks !== '')
					made.Blocks = properties.Blocks !== false && properties.Blocks !== 'false';

				return {Things: (inputs.Under || []).concat([{Kind: properties.Kind || 'forest', Values: made}])};
			}
		});

		/*
		 * The roads of the land: its settlements (items settlement of its sketch) joined by the shortest net of them, each
		 * passage out of it (Border) to the settlement nearest it, along the ground (SceneTerrainGenerator.RoadWay: round what
		 * is steep, over water by bridges). Main between towns and cities, Minor to a town, Paths to a village and out of it;
		 * with Rail a railway too between towns and cities. Roads of the kind road among the things; the straight passages of
		 * the Border go.
		 */
		blueprints.Node('Roads', {
			Graphs: ['world'],
			Group: 'world',
			Properties: [{Key: 'Main', Type: 'text', Value: 'road'}, {Key: 'Minor', Type: 'text', Value: 'country'}, {Key: 'Paths', Type: 'text', Value: 'gravel'}, {Key: 'Rail', Type: 'boolean', Value: false}],
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Under', Type: 'things'}],
			Outputs: [{Key: 'Land', Type: 'land'}, {Key: 'Things', Type: 'things'}],
			Compute: function (inputs, properties) {
				return self.Roads(inputs.Land, inputs.Under || [], properties);
			}
		});

		blueprints.Node('Terrain', {
			Graphs: ['world'],
			Group: 'world',
			Inputs: [{Key: 'Land', Type: 'land'}, {Key: 'Things', Type: 'things'}],
			Outputs: []
		});
	},

	/* The step Roads: {Land (the passages of its Border made roads of it), Things (and its roads)}. */
	Roads: function (land, under, properties) {
		var terrain = this.$Service('SceneTerrainGenerator');
		var rank = {city: 3, town: 2, village: 1, hamlet: 1, fort: 2};
		var hubs = [];
		var ways = [];
		var trunks = [];
		var things = under.slice();
		var layers;
		var field;
		var joined;

		/* A place by its tens of metres: the name of a road of the places it joins. */
		function place (point) {
			return Math.round(point[0] / 10) + '_' + Math.round(point[1] / 10);
		}

		if (!land)
			return {Land: land, Things: things};

		layers = (land.Sketch && land.Sketch.Layers || []).map(function (layer) {
			return Object.assign({}, layer, {Items: (layer.Items || []).slice()});
		});

		layers.forEach(function (layer) {
			layer.Items = layer.Items.filter(function (item) {
				var points = item.Points || [];
				var x = 0;
				var z = 0;

				if (item.Type === 'settlement' && points.length > 2) {
					points.forEach(function (point) {
						x += point[0] / points.length;
						z += point[1] / points.length;
					});

					hubs.push({X: x, Z: z, Rank: rank[item.Kind] || 1});
				}

				/* A highway of the planet through it: its way along the ground from where it comes in to where it leaves. */
				if (item.Type === 'road' && item.Trunk && points.length > 1) {
					trunks.push(item);

					return false;
				}

				/* A road of a passage: from past its side; the net takes it where it goes. */
				if (item.Type === 'road' && /^border-passage-/.test(item.ID || '') && points.length > 1) {
					ways.push({From: points[0], Rank: 0});

					return false;
				}

				return true;
			});
		});

		if (!hubs.length && !ways.length && !trunks.length) return {Land: land, Things: things};

		field = terrain.Flat(Object.assign({}, land, {Sketch: undefined}));

		/* The highways first: the settlements may come to them. */
		trunks = trunks.map(function (trunk) {
			var points = terrain.RoadWay(field, trunk.Points[0], trunk.Points[trunk.Points.length - 1]) || trunk.Points;

			things.push({ID: 'road-' + place(trunk.Points[0]) + '-' + place(trunk.Points[trunk.Points.length - 1]), Kind: 'road', Values: {Type: trunk.Class === 'highway' ? 'highway' : properties.Main || 'road', Points: points, Structures: true}});

			return points;
		});

		/* Settlements joined by the shortest net (Prim), the biggest first; the passages each to the nearest; with none, to the middle. */
		hubs.sort(function (a, b) {
			return b.Rank - a.Rank;
		});

		/* The nearest point of a highway to a place, as a place of rank 2 the net may join; null with none. */
		function trunkNear (x, z) {
			var best = null;

			trunks.forEach(function (points) {
				points.forEach(function (point) {
					var d = Math.hypot(point[0] - x, point[1] - z);
					if (!best || d < best.D)
						best = {D: d, X: point[0], Z: point[1], Rank: 2};
				});
			});

			return best;
		}

		if (!hubs.length && !ways.length)
			return {Land: land, Things: things};

		if (!hubs.length)
			hubs.push(trunkNear(0, 0) || {X: 0, Z: 0, Rank: 1});

		/* The first settlement to the highway near it. */
		var reached = trunkNear(hubs[0].X, hubs[0].Z);
		if (reached && reached.D > 30)
			ways.push({From: [hubs[0].X, hubs[0].Z], To: reached, Rank: Math.min(2, hubs[0].Rank), Big: 2});

		/* The towns and cities joined by the shortest net of them (Prim); each smaller one to the nearest joined before it. */
		joined = [hubs[0]];

		hubs.slice(1).forEach(function (hub) {
			var big = hub.Rank >= 2;
			var best = null;

			hubs.forEach(function (one) {
				var trunk;

				if (joined.indexOf(one) !== -1 || big && one.Rank < 2 || !big && one !== hub) return;

				/* A highway nearer than all joined: to it. */
				trunk = trunkNear(one.X, one.Z);

				if (trunk && (!best || trunk.D < best.D) && trunk.D > 30)
					best = {D: trunk.D, A: trunk, B: one};

				joined.forEach(function (other) {
					var d = Math.hypot(one.X - other.X, one.Z - other.Z);
					if (!best || d < best.D)
						best = {D: d, A: other, B: one};
				});
			});

			if (!best) return;

			joined.push(best.B);
			ways.push({From: [best.B.X, best.B.Z], To: best.A, Rank: Math.min(best.A.Rank, best.B.Rank), Big: Math.max(best.A.Rank, best.B.Rank)});
		});

		/* A passage to the settlement nearest it. */
		ways.forEach(function (way) {
			if (!way.To) {
				way.To = hubs.slice().sort(function (a, b) {
					return Math.hypot(a.X - way.From[0], a.Z - way.From[1]) - Math.hypot(b.X - way.From[0], b.Z - way.From[1]);
				})[0];

				way.Rank = 1;
				way.Big = way.To.Rank;
			}
		});

		ways.forEach(function (way) {
			var points = terrain.RoadWay(field, way.From, [way.To.X, way.To.Z]);
			var type = way.Rank >= 2 ? properties.Main || 'road' : way.Big >= 2 ? properties.Minor || 'country' : properties.Paths || 'gravel';

			if (!points || points.length < 2) return;

			things.push({ID: 'road-' + place(way.From) + '-' + place([way.To.X, way.To.Z]), Kind: 'road', Values: {Type: type, Points: points, Structures: true}});

			if (properties.Rail && way.Rank >= 2)
				things.push({ID: 'rail-' + place(way.From) + '-' + place([way.To.X, way.To.Z]), Kind: 'road', Values: {Type: 'rail', Points: points.map(function (point, index) {
					var next = points[Math.min(points.length - 1, index + 1)];
					var back = points[Math.max(0, index - 1)];
					var dx = next[0] - back[0];
					var dz = next[1] - back[1];
					var length = Math.hypot(dx, dz) || 1;

					/* Beside the road, 14 m off it. */
					return [Math.round((point[0] - dz / length * 14) * 10) / 10, Math.round((point[1] + dx / length * 14) * 10) / 10];
				}), Structures: true}});
		});

		return {Land: Object.assign({}, land, {Sketch: land.Sketch ? Object.assign({}, land.Sketch, {Layers: layers}) : land.Sketch}), Things: things};
	},

	Make: function (graph, parameters) {
		var blueprints = this.$Service('Blueprints');
		var cache = this.Worlds = this.Worlds || {};
		var read;
		var key;
		var made;

		if (!graph)
			return {Ground: null, Things: [], Problems: []};

		read = typeof graph === 'string' ? JSON.parse(graph) : graph;
		key = JSON.stringify([read, parameters || null]);

		if (cache[key])
			return cache[key];

		try {
			made = blueprints.Compile(read).Make(parameters || {});
			/* Their IDs by their order, or their own (a road: of the places it joins), so a change of one is kept when the rest change. */
			made = {Ground: made.Ground, Things: made.Things.map(function (thing, index) {
				return {ID: 'world-' + (thing.ID || index), Kind: thing.Kind, Values: thing.Values};
			}), Problems: []};
		}
		catch (error) {
			made = {Ground: null, Things: [], Problems: error.Problems || [{Message: error.message}]};
		}

		/* A few worlds kept: an editor makes a new one at each change. */
		if (Object.keys(cache).length > 32)
			this.Worlds = cache = {};

		cache[key] = made;

		return made;
	},

	Library: function (options) {
		var given = options || {};
		var blueprints = this.$Service('Blueprints');
		var graph = blueprints.Create('world', {name: 'World'});
		var land;
		var things = null;

		function add (type, properties) {
			return blueprints.Add(graph, type, {x: 0, y: 0, properties: properties || {}});
		}

		/* A step after the last one: what it takes from it, what it gives the next. */
		function step (type, properties, input, output, before) {
			var block = add(type, properties);

			if (before)
				blueprints.Link(graph, [before.id, output], [block.id, input]);

			return block;
		}

		function told (keys) {
			var made = {};

			keys.forEach(function (key) {
				if (given[key] !== undefined)
					made[key] = given[key];
			});

			return made;
		}

		land = step('Ground', told(['Size', 'Height', 'Water', 'Seed', 'Rock', 'Snow']));

		if (given.Planet)
			land = step('Planet', {Planet: given.Planet.Options || {}, Latitude: given.Planet.Latitude || 0, Longitude: given.Planet.Longitude || 0, Turn: given.Planet.Turn || 0}, 'Land', 'Land', land);

		land = step('Relief', Object.assign(told(['Scale', 'Ridges', 'Noise']), given.Relief ? {Graph: given.Relief} : {}), 'Land', 'Land', land);
		land = step('Climate', given.Climate || {}, 'Land', 'Land', land);

		if (given.Biomes)
			land = step('Biomes', {List: given.Biomes}, 'Land', 'Land', land);

		if (given.Sketch)
			land = step('Sketch', {Sketch: given.Sketch}, 'Land', 'Land', land);

		if (given.Border)
			land = step('Border', given.Border, 'Land', 'Land', land);

		(given.Tunnels || []).forEach(function (tunnel) {
			land = step('Tunnel', tunnel, 'Land', 'Land', land);
		});

		(given.Caves || []).forEach(function (caves) {
			land = step('Caves', caves, 'Land', 'Land', land);
		});

		if (given.Overhangs)
			land = step('Overhangs', given.Overhangs === true ? {} : given.Overhangs, 'Land', 'Land', land);

		if (given.Footings)
			land = step('Footings', given.Footings === true ? {} : given.Footings, 'Land', 'Land', land);

		/* Its roads: a land in and out, and the first of its things. */
		if (given.Roads) {
			var roads = step('Roads', given.Roads === true ? {} : given.Roads, 'Land', 'Land', land);

			land = roads;
			things = roads;
		}

		(given.Settlements || []).forEach(function (settlement) {
			things = step('Settlement', settlement, 'Under', 'Things', things);
		});

		(given.Scatters || []).forEach(function (scatter) {
			things = step('Scatter', scatter, 'Under', 'Things', things);
		});

		var end = add('Terrain');

		blueprints.Link(graph, [land.id, 'Land'], [end.id, 'Land']);

		if (things)
			blueprints.Link(graph, [things.id, 'Things'], [end.id, 'Things']);

		return graph;
	}
});
