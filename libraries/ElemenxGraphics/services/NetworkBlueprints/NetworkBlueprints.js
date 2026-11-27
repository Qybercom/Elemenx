/*
 * NetworkBlueprints: networks made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a
 * graph or block): rivers, roads, rails, tracks. A graph of the kind network ends at Network, what it gives a network:
 * {Nodes: [{ID, At, Kind, Rank}], Ways: [{ID, From, To, Points ([x, z] on a ground, [x, y, z] directions on a globe),
 * Class, Closed, Values ({name: a number, or a number for each point})}]}. Its blocks are its steps, each an algorithm of
 * code told by its properties and inputs, a network in and a network out; the blocks of numbers of a generator are there
 * for their numbers. A graph of it is made code (Blueprints.Code, each block a call of this Service): it runs in a page
 * and in a worker that carries this Service and those its blocks call (ScenePlanet, SceneTerrainGenerator, SceneRoads).
 * - Make(graph, parameters, inputs): runs one (an object, its JSON, or the name of a resource) and gives its network.
 * - Sample(graph): what it is run with to be seen ({name: value} of its Input blocks: Heights and Size of a small planet,
 *   Field a ground, Hubs a few towns, Passages and Trunks none).
 * - Code(graph): its code ({Source, Run, Keys}: Run(parameters, inputs) gives {Network}); Source is what a worker makes
 *   Run of (new Function('B', 'M', 'N', Source)(Blueprints, Math, Noise)).
 * - Its blocks (and the functions of this Service of the same names):
 *   Ways (List of lines, or of {Points, Class, ID, Values}, Class, Closed: a network of them), Merge (A, B: one after
 *   the other), Ring (Seed, Corners (0: 9 to 14 of the seed), Wild, Length, Squash: a closed way round a middle, its
 *   points nearer and farther, never crossing itself; Of random: the numbers of Random.Create; Values Draws: how many it
 *   drew), Fit (Length, Step: each closed way made that long, Places after the point), Connect (Hubs [{X, Z, Rank}],
 *   Passages ([x, z]: ways in from past the edge), Trunks (a network of the highways), Big (the rank of a town, 2), Gap
 *   (metres a highway is near, 30): its towns and cities joined by the shortest net of them (Prim), the biggest first,
 *   each smaller one to the nearest joined before it, a highway nearer than all joined taken; the passages each to the
 *   nearest), Route (Field: each way of none told along a ground by A* of SceneTerrainGenerator.RoadWay, MaxGrade,
 *   Bridge; Keep: one that cannot go stays straight, else it is dropped), Classify (Main, Minor, Paths: the class of each
 *   way of its rank: a highway of its own, Main between towns and cities, Minor to one, Paths else), Beside (Offset metres
 *   to the right, Rank, Class, On: a copy of each way of that rank or more beside it, Places after the point), Smooth
 *   (Rounds of Chaikin: its corners cut, its values along it; Sphere: its points kept on the unit ball), Round (Places of
 *   its points, Digits of its values) and Drainage (Heights, Size, Least: the rivers of a planet of the heights of its
 *   cells: ScenePlanet.DrainageWays, their Flow and Level along them).
 * The library's networks (ElemenxGraphics/network/<name>): rivers (of a planet: ScenePlanet.Drainage), roads (of a
 * world: the step Roads of SceneWorld), track (a race track: SceneRoadGenerator.Track). The same functions run in Node.
 */
Elemenx.Service('NetworkBlueprints', {
	$Meta: {
		Description: 'Networks made of graphs of Blueprints: rivers, roads, rails and tracks, each step an algorithm told by its properties.',
		Methods: ['Make(graph, parameters, inputs)', 'Code(graph)', 'Sample(graph)']
	},

	$Provides: {
		Blueprints: {Graphs: ['network'], Nodes: ['Network', 'Ways', 'Merge', 'Ring', 'Fit', 'Connect', 'Route', 'Classify', 'Beside', 'Smooth', 'Round', 'Drainage']}
	},

	$OnCreate: function () {
		this.Blocks();
	},

	/* What a worker carries of it (Workers.Source): its functions, the steps of a network a worker runs. */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	Make: function (graph, parameters, inputs) {
		var code = this.Code(graph);

		return code.Run(parameters || {}, inputs || {}).Network || this.Empty();
	},

	/* Its code, made once for the same graph (Blueprints.Code of it as a generator: its Network a Result). */
	Code: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var given = typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : typeof graph === 'string' ? JSON.parse(graph) : graph;
		if (!given || !Array.isArray(given.blocks))
			throw new Error('Elemenx NetworkBlueprints: no graph of a network ' + (typeof graph === 'string' ? graph : ''));

		var read = blueprints.Read(given);
		if (read.type !== 'network')
			throw new Error('Elemenx NetworkBlueprints: not a graph of a network but of ' + read.type);

		var code = blueprints.Code(read);
		if (!code)
			throw new Error('Elemenx NetworkBlueprints: a block of the network graph has no code');

		return code;
	},

	/*
	 * What a graph of it is run with to be seen (BlueprintPreview): for each of its Input blocks a value of a sample, of its
	 * name: Heights and Size (the cells of a small planet of the library, 64 by 64 a face), Field (a ground of hills 2 km
	 * across), Hubs (a city, two towns and two villages on it), Passages and Trunks (none).
	 */
	Sample: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var read = blueprints.Read(typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : graph);
		var names = read.blocks.filter(function (block) {
			return block.type === 'Input';
		}).map(function (block) {
			return blueprints.Properties(block).Name;
		});
		var made = {};

		/* Made once: a preview runs its graph again at each change of it. */
		var kept = this.Samples = this.Samples || {};

		if (names.indexOf('Heights') !== -1) {
			if (!kept.Heights) {
				var planets = this.$Service('ScenePlanet');
				var size = 64;
				var heights = new Float32Array(6 * size * size);
				var face;

				for (face = 0; face < 6; face++)
					heights.set(planets.Heights({Seed: 'preview', Ocean: 0.6}, face, size, 0, size).Data, face * size * size);

				kept.Heights = {Heights: heights, Size: size};
			}

			made.Heights = kept.Heights.Heights;
			made.Size = kept.Heights.Size;
		}

		if (names.indexOf('Field') !== -1)
			made.Field = kept.Field = kept.Field || this.$Service('SceneTerrainGenerator').Flat({Size: 2000, Height: 120, Water: 0, Seed: 'preview'});

		if (names.indexOf('Hubs') !== -1)
			made.Hubs = [{X: 0, Z: 0, Rank: 3}, {X: 600, Z: 400, Rank: 2}, {X: -550, Z: 500, Rank: 2}, {X: 450, Z: -600, Rank: 1}, {X: -650, Z: -450, Rank: 1}];

		if (names.indexOf('Passages') !== -1)
			made.Passages = [];

		if (names.indexOf('Trunks') !== -1)
			made.Trunks = [];

		return made;
	},

	Empty: function () {
		return {Nodes: [], Ways: []};
	},

	/* A copy of a network to change (its ways and nodes copied; their points kept, as each step makes them anew). */
	Copy: function (network) {
		var given = network && typeof network === 'object' ? network : this.Empty();

		return {Nodes: (given.Nodes || []).map(function (node) {
			return Object.assign({}, node);
		}), Ways: (given.Ways || []).map(function (way) {
			return Object.assign({}, way, {Values: Object.assign({}, way.Values || {})});
		})};
	},

	/* A place by its tens of metres: the name of a way of the places it joins. */
	Place: function (point) {
		return Math.round(point[0] / 10) + '_' + Math.round(point[1] / 10);
	},

	Ways: function (list, kind, closed) {
		return {Nodes: [], Ways: (Array.isArray(list) ? list : []).map(function (item, index) {
			var points = Array.isArray(item) ? item : item && item.Points || [];

			return {ID: item && item.ID || 'way-' + index, From: -1, To: -1, Points: points, Class: item && item.Class || kind || '', Closed: !!closed, Values: Object.assign({}, item && item.Values || {})};
		})};
	},

	Merge: function (a, b) {
		var first = this.Copy(a);
		var second = this.Copy(b);

		return {Nodes: first.Nodes.concat(second.Nodes), Ways: first.Ways.concat(second.Ways)};
	},

	/*
	 * A closed way round a middle (the knots of a race track): Corners of them (0: 9 to 14 of the seed) round a ball of a
	 * length round, each a little before or after its place and nearer or farther by Wild, Squash its depth (0.7 + Wild *
	 * 0.2 when not told). Its numbers are those of the seed one after another (Blueprints.Draw; of: random or astronomy).
	 */
	Ring: function (seed, corners, wild, length, squash, of) {
		var blueprints = this.$Service('Blueprints');
		var drawn = 0;
		var round = Number(length) > 0 ? Number(length) : 2400;
		var strays = wild === undefined || wild === null || wild === '' ? 0.55 : Number(wild);
		var flat = squash === undefined || squash === null || squash === '' ? 0.7 + strays * 0.2 : Number(squash);
		var radius = round / (Math.PI * 2);
		var count;
		var knots = [];
		var i;

		function random () {
			return blueprints.Draw(seed, drawn++, of || 'random');
		}

		count = Number(corners) > 2 ? Number(corners) : 9 + Math.floor(random() * 6);

		for (i = 0; i < count; i++) {
			var angle = (i + (random() - 0.5) * 0.5) / count * Math.PI * 2;
			var far = radius * (1 + (random() - 0.5) * strays * 1.3);

			knots.push([Math.cos(angle) * far, Math.sin(angle) * far * flat]);
		}

		return {Nodes: [], Ways: [{ID: 'ring', From: -1, To: -1, Points: knots, Class: '', Closed: true, Values: {Draws: drawn}}]};
	},

	/* Each closed way made Length long round (its line of SceneRoads, Step apart), its points to Places after the point; Values Fit: how much it was scaled. */
	Fit: function (network, length, step, places) {
		var roads = this.$Service('SceneRoads');
		var made = this.Copy(network);
		var scale = Math.pow(10, Number(places) || 0);

		made.Ways.forEach(function (way) {
			if (!way.Closed || way.Points.length < 2) return;

			var line = roads.Line(way.Points, {Closed: true, Step: Number(step) || 6});
			var total = line[line.length - 1].Along + Math.hypot(line[0].X - line[line.length - 1].X, line[0].Z - line[line.length - 1].Z);
			var fit = Number(length) / total;

			way.Points = way.Points.map(function (point) {
				return [Math.round(point[0] * fit * scale) / scale, Math.round(point[1] * fit * scale) / scale];
			});
			way.Values.Fit = fit;
		});

		return made;
	},

	/*
	 * The towns and cities of a world joined (the step Roads of SceneWorld): its highways (Trunks, their ways kept first), the
	 * first settlement to the highway near it, the others by the shortest net of them (Prim), the biggest first, a highway
	 * nearer than all joined taken, each smaller one to the nearest joined before it; the passages (Passages) each to the
	 * settlement nearest it. Each new way {ID: road-<from>-<to>, Points: [from, to], Values: {Rank, Big}}.
	 */
	Connect: function (hubs, passages, trunks, big, gap) {
		var self = this;
		var town = Number(big) || 2;
		var near = gap === undefined || gap === null ? 30 : Number(gap);
		var highways = this.Copy(trunks).Ways;
		var places = (hubs || []).map(function (hub) {
			return {X: Number(hub.X), Z: Number(hub.Z), Rank: Number(hub.Rank) || 1};
		});
		var ways = (passages || []).map(function (from) {
			return {From: from, Rank: 0};
		});
		var made = {Nodes: [], Ways: highways};
		var joined;

		/* The nearest point of a highway to a place, as a place of rank 2 the net may join; null with none. */
		function trunkNear (x, z) {
			var best = null;

			highways.forEach(function (way) {
				way.Points.forEach(function (point) {
					var d = Math.hypot(point[0] - x, point[1] - z);
					if (!best || d < best.D)
						best = {D: d, X: point[0], Z: point[1], Rank: 2};
				});
			});

			return best;
		}

		if (!places.length && !ways.length) return made;

		places.sort(function (a, b) {
			return b.Rank - a.Rank;
		});

		if (!places.length)
			places.push(trunkNear(0, 0) || {X: 0, Z: 0, Rank: 1});

		var reached = trunkNear(places[0].X, places[0].Z);
		if (reached && reached.D > near)
			ways.push({From: [places[0].X, places[0].Z], To: reached, Rank: Math.min(town, places[0].Rank), Big: town});

		joined = [places[0]];

		places.slice(1).forEach(function (hub) {
			var large = hub.Rank >= town;
			var best = null;

			places.forEach(function (one) {
				var trunk;

				if (joined.indexOf(one) !== -1 || large && one.Rank < town || !large && one !== hub) return;

				trunk = trunkNear(one.X, one.Z);

				if (trunk && (!best || trunk.D < best.D) && trunk.D > near)
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

		ways.forEach(function (way) {
			if (!way.To) {
				way.To = places.slice().sort(function (a, b) {
					return Math.hypot(a.X - way.From[0], a.Z - way.From[1]) - Math.hypot(b.X - way.From[0], b.Z - way.From[1]);
				})[0];

				way.Rank = 1;
				way.Big = way.To.Rank;
			}

			made.Ways.push({ID: 'road-' + self.Place(way.From) + '-' + self.Place([way.To.X, way.To.Z]), From: -1, To: -1, Points: [way.From, [way.To.X, way.To.Z]], Class: '', Closed: false, Values: {Rank: way.Rank, Big: way.Big}});
		});

		return made;
	},

	/* Each way not routed yet along the ground of a field (SceneTerrainGenerator.RoadWay); keep: one that cannot go stays. */
	Route: function (network, field, keep, grade, bridge) {
		var terrain = this.$Service('SceneTerrainGenerator');
		var made = this.Copy(network);
		var options = {};

		if (Number(grade) > 0)
			options.MaxGrade = Number(grade);

		if (Number(bridge) > 0)
			options.Bridge = Number(bridge);

		if (!field)
			return made;

		made.Ways = made.Ways.filter(function (way) {
			if (way.Values.Routed) return true;

			var points = terrain.RoadWay(field, way.Points[0], way.Points[way.Points.length - 1], options);

			way.Values.Routed = 1;

			if (points && (keep || points.length >= 2)) {
				way.Points = points;

				return true;
			}

			return !!keep;
		});

		return made;
	},

	/* The class of each way: a highway its own (Trunk: highway, else Main), else of its rank. */
	Classify: function (network, main, minor, paths) {
		var made = this.Copy(network);

		made.Ways.forEach(function (way) {
			var values = way.Values;

			if (values.Trunk) way.Class = values.Highway ? 'highway' : main || 'road';
			else way.Class = values.Rank >= 2 ? main || 'road' : values.Big >= 2 ? minor || 'country' : paths || 'gravel';
		});

		return made;
	},

	/* A copy of each way of rank or more beside it, offset metres to its right (a rail by a road), its ID of its class. */
	Beside: function (network, on, offset, rank, kind, places) {
		var made = this.Copy(network);
		var scale = Math.pow(10, Number(places) || 0);
		var ways = [];

		if (!on)
			return made;

		made.Ways.forEach(function (way) {
			ways.push(way);

			if (way.Values.Trunk || !(way.Values.Rank >= Number(rank))) return;

			var points = way.Points;

			ways.push({ID: String(way.ID).replace(/^[^-]*-/, kind + '-'), From: way.From, To: way.To, Class: kind, Closed: way.Closed, Values: Object.assign({}, way.Values, {Beside: 1}), Points: points.map(function (point, index) {
				var next = points[Math.min(points.length - 1, index + 1)];
				var back = points[Math.max(0, index - 1)];
				var dx = next[0] - back[0];
				var dz = next[1] - back[1];
				var length = Math.hypot(dx, dz) || 1;

				return [Math.round((point[0] - dz / length * offset) * scale) / scale, Math.round((point[1] + dx / length * offset) * scale) / scale];
			})});
		});

		made.Ways = ways;

		return made;
	},

	/*
	 * Each way smoothed off its grid (Chaikin, rounds of it): its corners cut at a quarter and three quarters, its values
	 * of each point along it the same; its ends kept. sphere: its points kept on the unit ball (directions of a globe).
	 */
	Smooth: function (network, rounds, sphere) {
		var made = this.Copy(network);
		var count = Math.max(0, Math.round(Number(rounds) || 0));

		function unit (p) {
			var length = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) || 1;

			return [p[0] / length, p[1] / length, p[2] / length];
		}

		made.Ways.forEach(function (way) {
			var keys = Object.keys(way.Values).filter(function (key) {
				return Array.isArray(way.Values[key]) && way.Values[key].length === way.Points.length;
			});
			var points = way.Points;
			var values = {};
			var round;

			keys.forEach(function (key) {
				values[key] = way.Values[key];
			});

			for (round = 0; round < count && points.length > 1; round++) {
				var p = [points[0]];
				var v = {};
				var k;

				keys.forEach(function (key) {
					v[key] = [values[key][0]];
				});

				for (k = 0; k + 1 < points.length; k++) {
					[0.25, 0.75].forEach(function (t) {
						var at = points[k].map(function (part, axis) {
							return part + (points[k + 1][axis] - part) * t;
						});

						p.push(sphere ? unit(at) : at);

						keys.forEach(function (key) {
							v[key].push(values[key][k] + (values[key][k + 1] - values[key][k]) * t);
						});
					});
				}

				p.push(points[points.length - 1]);

				keys.forEach(function (key) {
					v[key].push(values[key][values[key].length - 1]);
				});

				points = p;
				values = v;
			}

			way.Points = points;

			keys.forEach(function (key) {
				way.Values[key] = values[key];
			});
		});

		return made;
	},

	/* Its points to places after the point, its values (those along a way) to digits. */
	Round: function (network, places, digits) {
		var made = this.Copy(network);
		var scale = Math.pow(10, Number(places) || 0);
		var steps = Math.pow(10, Number(digits) || 0);

		made.Ways.forEach(function (way) {
			way.Points = way.Points.map(function (point) {
				return point.map(function (value) {
					return Math.round(value * scale) / scale;
				});
			});

			Object.keys(way.Values).forEach(function (key) {
				if (Array.isArray(way.Values[key]))
					way.Values[key] = way.Values[key].map(function (value) {
						return steps === 1 ? Math.round(value) : Math.round(value * steps) / steps;
					});
			});
		});

		return made;
	},

	Drainage: function (heights, size, least) {
		return this.$Service('ScenePlanet').DrainageWays(heights, Number(size), Number(least) || 40);
	},

	Blocks: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var network = ['network'];
		var net = {Key: 'Network', Type: 'network'};

		/* The code of a block: a call of the function of this Service of its name, of its inputs and properties in order. */
		function call (name, keys, told) {
			return function (context) {
				var made = {};

				made[told || 'Network'] = 'B.$Service("NetworkBlueprints").' + name + '(' + keys.map(function (key) {
					return key.charAt(0) === '@' ? JSON.stringify(context.Properties[key.slice(1)] === undefined ? null : context.Properties[key.slice(1)]) : context.Inputs[key] || 'undefined';
				}).join(', ') + ')';

				return made;
			};
		}

		/* What it computes when it is walked: the same function. */
		function compute (name, keys) {
			return function (inputs, properties) {
				return {Network: self[name].apply(self, keys.map(function (key) {
					return key.charAt(0) === '@' ? properties[key.slice(1)] : inputs[key];
				}))};
			};
		}

		function node (name, definition, keys) {
			blueprints.Node(name, Object.assign({Graphs: network, Group: 'network', Outputs: [net], Compute: compute(name, keys), Code: call(name, keys)}, definition));
		}

		blueprints.Graph('network', {
			End: 'Network',
			Uses: ['generator'],
			Coded: 'Network',
			Compile: function (plan) {
				return {
					Network: function (parameters, inputs) {
						return self.Make(plan.Graph, parameters, inputs);
					}
				};
			}
		});

		blueprints.Node('Network', {Graphs: network, Group: 'output', Comment: 'What the graph gives: its network', Inputs: [net], Outputs: []});

		node('Ways', {Comment: 'A network of lines', Properties: [{Key: 'Class', Type: 'text', Value: ''}, {Key: 'Closed', Type: 'bool', Value: false}], Inputs: [{Key: 'List', Type: 'any'}]}, ['List', '@Class', '@Closed']);
		node('Merge', {Comment: 'Two networks, one after the other', Inputs: [{Key: 'A', Type: 'network'}, {Key: 'B', Type: 'network'}]}, ['A', 'B']);
		node('Ring', {Comment: 'A closed way round a middle, nearer and farther: it never crosses itself', Properties: [{Key: 'Of', Type: 'select', Options: ['random', 'astronomy'], Value: 'random'}], Inputs: [{Key: 'Seed', Type: 'any', Value: 'track'}, {Key: 'Corners', Type: 'float', Value: 0}, {Key: 'Wild', Type: 'float', Value: 0.55}, {Key: 'Length', Type: 'float', Value: 2400}, {Key: 'Squash', Type: 'any'}]}, ['Seed', 'Corners', 'Wild', 'Length', 'Squash', '@Of']);
		node('Fit', {Comment: 'Each closed way made as long as told', Properties: [{Key: 'Step', Type: 'number', Value: 6}, {Key: 'Places', Type: 'number', Value: 2}], Inputs: [net, {Key: 'Length', Type: 'float', Value: 2400}]}, ['Network', 'Length', '@Step', '@Places']);
		node('Connect', {Comment: 'Towns and cities joined by the shortest net of them, the passages each to the nearest', Properties: [{Key: 'Big', Type: 'number', Value: 2}, {Key: 'Gap', Type: 'number', Value: 30}], Inputs: [{Key: 'Hubs', Type: 'any'}, {Key: 'Passages', Type: 'any'}, {Key: 'Trunks', Type: 'network'}]}, ['Hubs', 'Passages', 'Trunks', '@Big', '@Gap']);
		node('Route', {Comment: 'Each way along the ground (A*)', Properties: [{Key: 'Keep', Type: 'bool', Value: false}, {Key: 'MaxGrade', Type: 'number', Value: 0}, {Key: 'Bridge', Type: 'number', Value: 0}], Inputs: [net, {Key: 'Field', Type: 'any'}]}, ['Network', 'Field', '@Keep', '@MaxGrade', '@Bridge']);
		node('Classify', {Comment: 'The class of each way of its rank', Inputs: [net, {Key: 'Main', Type: 'text', Value: 'road'}, {Key: 'Minor', Type: 'text', Value: 'country'}, {Key: 'Paths', Type: 'text', Value: 'gravel'}]}, ['Network', 'Main', 'Minor', 'Paths']);
		node('Beside', {Comment: 'A copy of each way of a rank beside it (a rail by a road)', Properties: [{Key: 'Offset', Type: 'number', Value: 14}, {Key: 'Rank', Type: 'number', Value: 2}, {Key: 'Class', Type: 'text', Value: 'rail'}, {Key: 'Places', Type: 'number', Value: 1}], Inputs: [net, {Key: 'On', Type: 'bool', Value: true}]}, ['Network', 'On', '@Offset', '@Rank', '@Class', '@Places']);
		node('Smooth', {Comment: 'Each way smoothed (Chaikin), its values along it', Properties: [{Key: 'Rounds', Type: 'number', Value: 2}, {Key: 'Sphere', Type: 'bool', Value: false}], Inputs: [net]}, ['Network', '@Rounds', '@Sphere']);
		node('Round', {Comment: 'Its points and values rounded', Properties: [{Key: 'Places', Type: 'number', Value: 2}, {Key: 'Digits', Type: 'number', Value: 0}], Inputs: [net]}, ['Network', '@Places', '@Digits']);
		node('Drainage', {Comment: 'The rivers of a planet of the heights of its cells', Inputs: [{Key: 'Heights', Type: 'any'}, {Key: 'Size', Type: 'float', Value: 64}, {Key: 'Least', Type: 'float', Value: 40}]}, ['Heights', 'Size', 'Least']);
	}
});
