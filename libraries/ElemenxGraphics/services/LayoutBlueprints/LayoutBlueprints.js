/*
 * LayoutBlueprints: layouts made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a
 * graph or block): where the streets, lots and walls of a settlement go. A graph of the kind layout ends at Layout, what it
 * gives a plan of a settlement {ID, Kind, Streets: [{Points, Width, Road (a type of road), Closed}], Lots: [{X, Z, Turn,
 * Width, Depth, Class, District}], Walls: [[[x, z]...]], Gates: [{X, Z, Turn}], Towers: [{X, Z}]} (Plan of it). Its blocks are
 * its stages, each an algorithm of code told by its properties, a layout in and a layout out (what is laid so far, and
 * its numbers: its middle, how far it reaches, the way of its longest side, its random numbers, which go on from where the
 * stage before left them, so a graph draws them as one code did). A graph of it is made code (Blueprints.Code, each block a
 * call of this Service): it runs in a page and in a worker that carries this Service.
 * - Make(graph, parameters, inputs): runs one (an object, its JSON, or the name of a resource) and gives its plan.
 * - Code(graph): its code ({Source, Run, Keys}: Run(parameters, inputs) gives {Layout}); Source is what a worker makes Run of.
 * - Area(item, others, kind, sizes, properties): where a settlement lies, its first layout: item {ID, Points, Kind,
 *   Density, Seed, Street, Block, Layout, Slope, Contour, Walls} of a sketch, others the other items of it, kind its row of
 *   SceneTerrainGenerator.SettlementKinds, sizes(name) the [Width, Depth] of a building of a class (null: none); Layout
 *   the name of its layout (of it, else of its kind; districts with less than Districts metres round its middle, 450,
 *   radial, and a radial one of less than Radial, 180, grid).
 * - Next(layout): a copy of a layout a stage changes. Plan(layout): its plan. Drawing(graph, parameters): what it gives,
 *   to be seen (BlueprintPreview), of a sample ({Lines: [{Points, Width, Class}], Boxes: [{X, Z, Width, Depth, Turn, Class}]}).
 * - Its blocks (and the functions of this Service of the same names, of (layout, properties)): Area (Item, Others, Kind,
 *   Sizes; Least and Share: the step of its streets of its kind, at least Least metres, at most Share of its reach), Drawn
 *   (the streets drawn in it, street items of the sketch: no stage of streets after it lays its own), Grid, Main, Road,
 *   Radial and Districts (its streets as each lays them, their numbers its properties), Lots, Walls, and Layout, the end;
 *   of a village on a ground (SceneBiomes.Village): Site (Field, X, Y, Seed, Radius: its place, or the nearest level and dry
 *   one), Houses (Count, Shapes: round its middle on a spiral, a way to each) and Out (the road out of it); of an
 *   interchange (SceneRoads.Interchanges: its frame {One, RoadA, RoadB, WayA, WayB, HalfA, HalfB, Sine, Quadrants, Ramps,
 *   Lasts, ID, At, Ramp, JunctionOn, Dot, Sign}, its ramps made by its Ramp): Diamond (Ring: a roundabout), Cloverleaf,
 *   Stack and Trumpet, their numbers their properties, Places the metres from the crossing along the roads no tunnel may be.
 * The library's layouts (ElemenxGraphics/layout/<name>): grid, main, road, radial, districts (SceneTerrainGenerator.SettlementPlan
 * runs the one of the layout of a settlement), village (SceneBiomes.Village), diamond, roundabout, cloverleaf, stack and
 * trumpet (SceneRoads.Interchanges). The same functions run in Node.
 */
Elemenx.Service('LayoutBlueprints', {
	$Meta: {
		Description: 'Layouts made of graphs of Blueprints: the streets, lots and walls of settlements, each stage an algorithm told by its properties.',
		Methods: ['Make(graph, parameters, inputs)', 'Code(graph)', 'Area(item, others, kind, sizes, properties)', 'Next(layout)', 'Plan(layout)', 'Drawing(graph, parameters)']
	},

	$Provides: {
		Blueprints: {Graphs: ['layout'], Nodes: ['Layout', 'Area', 'Drawn', 'Grid', 'Main', 'Road', 'Radial', 'Districts', 'Lots', 'Walls', 'Site', 'Houses', 'Out', 'Diamond', 'Cloverleaf', 'Stack', 'Trumpet']}
	},

	$OnCreate: function () {
		this.Blocks();
	},

	/* What a worker carries of it (Workers.Source): its stages, a layout a worker runs. */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	Make: function (graph, parameters, inputs) {
		return this.Code(graph).Run(parameters || {}, inputs || {}).Layout;
	},

	Code: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var given = typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : typeof graph === 'string' ? JSON.parse(graph) : graph;
		if (!given || !Array.isArray(given.blocks))
			throw new Error('Elemenx LayoutBlueprints: no graph of a layout ' + (typeof graph === 'string' ? graph : ''));

		var read = blueprints.Read(given);
		if (read.type !== 'layout')
			throw new Error('Elemenx LayoutBlueprints: not a graph of a layout but of ' + read.type);

		var code = blueprints.Code(read);
		if (!code)
			throw new Error('Elemenx LayoutBlueprints: a block of the layout graph has no code');

		return code;
	},

	Area: function (item, others, kind, sizes, properties) {
		var told = properties || {};
		var table = kind || this.$Service('SceneTerrainGenerator').SettlementKinds[item.Kind] || this.$Service('SceneTerrainGenerator').SettlementKinds.village;
		var points = item.Points;
		var text = String(item.Seed === undefined ? item.ID : item.Seed);
		var seed = 0;
		var center = [0, 0];
		var longest = 0;
		var angle = 0;
		var reach = 0;
		var plan = {ID: item.ID, Name: item.Kind || 'village', Item: item, Others: others || [], Table: table, Sizes: typeof sizes === 'function' ? sizes : function () {
			return null;
		}, Points: points, Density: item.Density === undefined ? 0.85 : Number(item.Density), Random: 0, Empty: false, Drawn: false, Streets: [], Fronts: [], Plazas: [], Lots: [], Walls: [], Gates: [], Towers: []};
		var i;

		/* Its numbers of its seed one after another (as Random.Sequence of its Seed, else of its ID, makes them). */
		for (i = 0; i < text.length; i++)
			seed = (seed * 31 + text.charCodeAt(i)) >>> 0;

		plan.Random = seed;

		if (!points || points.length < 3) {
			plan.Empty = true;

			return plan;
		}

		points.forEach(function (point, index) {
			var next = points[(index + 1) % points.length];
			var length = Math.hypot(next[0] - point[0], next[1] - point[1]);

			center = [center[0] + point[0] / points.length, center[1] + point[1] / points.length];

			if (length > longest) {
				longest = length;
				angle = Math.atan2(next[1] - point[1], next[0] - point[0]);
			}
		});

		points.forEach(function (point) {
			reach = Math.max(reach, Math.hypot(point[0] - center[0], point[1] - center[1]));
		});

		plan.Center = center;
		plan.Reach = reach;
		plan.Angle = angle;
		plan.Width = Math.max(3, Number(item.Street) || table.Street);
		plan.Along = [Math.cos(angle), Math.sin(angle)];
		plan.Across = [-plan.Along[1], plan.Along[0]];
		/* The step of its streets: of its kind, but a small one has a few blocks all the same. */
		plan.Block = Math.max(told.Least === undefined ? 15 : Number(told.Least), Number(item.Block) || Math.min(table.Block, reach * (told.Share === undefined ? 0.45 : Number(told.Share))));
		/* On a hillside (Slope over 3%) its streets go along the level of it (Contour, radians) where they can. */
		plan.Sloped = Number(item.Slope) > 0.03 && isFinite(Number(item.Contour)) && item.Contour !== null && item.Contour !== '';
		plan.Layout = String(item.Layout || table.Layout || (table.Grid ? 'grid' : 'main'));

		/* Too small for its layout: districts of a city need some 450 m round its middle, an old centre with its ring 180 m. */
		if (plan.Layout === 'districts' && reach < (told.Districts === undefined ? 450 : Number(told.Districts)))
			plan.Layout = 'radial';

		if (plan.Layout === 'radial' && reach < (told.Radial === undefined ? 180 : Number(told.Radial)))
			plan.Layout = 'grid';

		return plan;
	},

	Next: function (layout) {
		var made = Object.assign({}, layout);

		['Streets', 'Fronts', 'Plazas', 'Lots', 'Walls', 'Gates', 'Towers'].forEach(function (key) {
			made[key] = (layout && layout[key] || []).slice();
		});

		return made;
	},

	Plan: function (layout) {
		return {ID: layout.ID, Kind: layout.Name, Streets: layout.Streets, Lots: layout.Lots, Walls: layout.Walls, Gates: layout.Gates, Towers: layout.Towers};
	},

	/*
	 * What a graph of a layout gives, to be seen (BlueprintPreview), run on a sample: a city of 500 m round (Area), a village on
	 * a ground of hills (Site), a cross of a motorway and a road of its form (Diamond, Cloverleaf, Stack, Trumpet: the network
	 * of SceneRoads with it); {Lines: [{Points [[x, z]...], Width, Class}], Boxes: [{X, Z, Width, Depth, Turn, Class}]}.
	 */
	Drawing: function (graph, parameters) {
		var blueprints = this.$Service('Blueprints');
		var terrain = this.$Service('SceneTerrainGenerator');
		var read = blueprints.Read(typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : graph);
		var types = read.blocks.filter(function (block) {
			return block.enabled !== false;
		}).map(function (block) {
			return block.type;
		});
		var drawing = {Lines: [], Boxes: []};
		var form = ['Diamond', 'Cloverleaf', 'Stack', 'Trumpet'].filter(function (type) {
			return types.indexOf(type) !== -1;
		})[0];
		var made;
		var points = [];
		var i;

		if (form) {
			var block = read.blocks.filter(function (one) {
				return one.type === form;
			})[0];
			var ring = blueprints.Properties(block).Ring;
			var name = form === 'Diamond' ? ring === true || ring === 'true' ? 'roundabout' : 'diamond' : form.toLowerCase();
			var other = {diamond: 'road', roundabout: 'road', cloverleaf: 'highway', stack: 'motorway', trumpet: 'road'}[name];
			var settings = {Height: function () {
				return 0;
			}, Interchange: {}};

			settings.Interchange[name] = read;
			made = this.$Service('SceneRoads').Network([{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: other, Points: name === 'trumpet' ? [[0, -800], [0, 0]] : [[0, -1000], [0, 1000]]}], [{ID: 'preview', X: 0, Z: 0, Kind: name}], settings);

			made.Roads.forEach(function (road) {
				drawing.Lines.push({Points: road.Points.map(function (point) {
					return [point.X, point.Z];
				}), Width: road.Width, Class: road.Ramp ? 'ramp' : road.TypeName || 'road'});
			});

			return drawing;
		}

		if (types.indexOf('Site') !== -1) {
			made = this.Make(read, parameters || {}, {Field: terrain.Flat({Size: 400, Height: 20, Water: 0, Seed: 'preview'}), X: 0, Y: 0, Seed: 'preview', Radius: 40, Count: 12, Shapes: null});

			(made.Roads || []).forEach(function (road) {
				drawing.Lines.push({Points: road, Width: 3, Class: 'path'});
			});

			(made.Objects || []).forEach(function (one) {
				drawing.Boxes.push({X: one.X, Z: one.Y, Width: one.Size, Depth: one.Size, Turn: 0, Class: one.Kind});
			});

			return drawing;
		}

		for (i = 0; i < 24; i++)
			points.push([Math.cos(i / 24 * Math.PI * 2) * 500 * (1 + 0.08 * Math.sin(i * 1.7)), Math.sin(i / 24 * Math.PI * 2) * 500]);

		made = this.Plan(this.Make(read, parameters || {}, {Item: {ID: 'preview', Type: 'settlement', Kind: 'city', Seed: 'preview', Points: points}, Others: [], Kind: terrain.SettlementKinds.city, Sizes: function (name) {
			return terrain.SettlementSizes[name] || null;
		}}));

		drawing.Lines.push({Points: points.concat([points[0]]), Width: 1, Class: 'edge'});

		made.Streets.forEach(function (street) {
			drawing.Lines.push({Points: street.Closed ? street.Points.concat([street.Points[0]]) : street.Points, Width: street.Width, Class: street.Road || 'street'});
		});

		made.Walls.forEach(function (wall) {
			drawing.Lines.push({Points: wall, Width: 3, Class: 'wall'});
		});

		made.Lots.forEach(function (lot) {
			drawing.Boxes.push({X: lot.X, Z: lot.Z, Width: lot.Width, Depth: lot.Depth, Turn: lot.Turn, Class: lot.Class});
		});

		return drawing;
	},

	/* The functions its stages share, of a plan: its random numbers go on from where the stage before left them. */
	Helpers: function (plan) {
		var points = plan.Points;
		var width = plan.Width;
		var center = plan.Center;
		var reach = plan.Reach;

		function random () {
			plan.Random = (plan.Random * 1664525 + 1013904223) >>> 0;

			return plan.Random / 4294967296;
		}

		function inside (polygon, x, z) {
			var within = false;
			var a;
			var b;

			for (a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
				if (polygon[a][1] > z !== polygon[b][1] > z && x < (polygon[b][0] - polygon[a][0]) * (z - polygon[a][1]) / (polygon[b][1] - polygon[a][1]) + polygon[a][0])
					within = !within;
			}

			return within;
		}

		/* The point of a line nearest to x, z: [x, z, distance]. */
		function nearest (line, x, z) {
			var best = [x, z, Infinity];
			var a;

			for (a = 0; a + 1 < line.length; a++) {
				var dx = line[a + 1][0] - line[a][0];
				var dz = line[a + 1][1] - line[a][1];
				var t = Math.max(0, Math.min(1, ((x - line[a][0]) * dx + (z - line[a][1]) * dz) / (dx * dx + dz * dz || 1)));
				var p = [line[a][0] + dx * t, line[a][1] + dz * t];
				var d = Math.hypot(p[0] - x, p[1] - z);
				if (d < best[2])
					best = [p[0], p[1], d];
			}

			return best;
		}

		function distance (line, x, z) {
			return nearest(line, x, z)[2];
		}

		/* How far a point is from the edge of the settlement. */
		function edge (x, z) {
			return distance(points.concat([points[0]]), x, z);
		}

		/* A line clipped to the settlement: the runs of it inside, by steps of four metres. */
		function clip (from, to) {
			var length = Math.hypot(to[0] - from[0], to[1] - from[1]);
			var steps = Math.max(1, Math.ceil(length / 4));
			var runs = [];
			var run = null;
			var s;

			for (s = 0; s <= steps; s++) {
				var p = [from[0] + (to[0] - from[0]) * s / steps, from[1] + (to[1] - from[1]) * s / steps];

				if (inside(points, p[0], p[1])) {
					run = run || [p, p];
					run[1] = p;
				}
				else if (run) {
					runs.push(run);
					run = null;
				}
			}

			if (run)
				runs.push(run);

			/* None along its very edge: the lots of it would be out of it. */
			return runs.filter(function (one) {
				var middle = [(one[0][0] + one[1][0]) / 2, (one[0][1] + one[1][1]) / 2];

				return Math.hypot(one[1][0] - one[0][0], one[1][1] - one[0][1]) > 8 && edge(middle[0], middle[1]) > width;
			});
		}


		function lengthOf (line) {
			var total = 0;
			var a;

			for (a = 1; a < line.length; a++)
				total += Math.hypot(line[a][0] - line[a - 1][0], line[a][1] - line[a - 1][1]);

			return total;
		}

		/* The point of a line so many metres along it, and its way there: {At [x, z], Way [x, z]}. */
		function pointAt (line, metres) {
			var left = metres;
			var a;

			for (a = 0; a + 1 < line.length; a++) {
				var dx = line[a + 1][0] - line[a][0];
				var dz = line[a + 1][1] - line[a][1];
				var length = Math.hypot(dx, dz);

				if (length > 1e-9 && (left <= length || a + 2 === line.length)) {
					var t = Math.min(1, left / length);

					return {At: [line[a][0] + dx * t, line[a][1] + dz * t], Way: [dx / length, dz / length]};
				}

				left -= length;
			}

			return {At: line[line.length - 1], Way: [1, 0]};
		}

		/* A curve through the points of a line (Catmull-Rom), a point every step metres. */
		function smooth (line, step) {
			var made = [line[0]];
			var a;

			for (a = 0; a + 1 < line.length; a++) {
				var p0 = line[Math.max(0, a - 1)];
				var p1 = line[a];
				var p2 = line[a + 1];
				var p3 = line[Math.min(line.length - 1, a + 2)];
				var count = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
				var c;

				for (c = 1; c <= count; c++) {
					var t = c / count;
					var t2 = t * t;
					var t3 = t2 * t;

					made.push([0, 1].map(function (axis) {
						return 0.5 * (2 * p1[axis] + (p2[axis] - p0[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 + (3 * p1[axis] - p0[axis] - 3 * p2[axis] + p3[axis]) * t3);
					}));
				}
			}

			return made;
		}

		/* A line from one point to another wandering aside by up to amount metres, a point every 8 m; fixed: at its start still; turns: how often (1). */
		function wander (from, to, amount, phase, fixed, turns) {
			var length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
			var count = Math.max(2, Math.ceil(length / 8));
			var aside = [-(to[1] - from[1]) / length, (to[0] - from[0]) / length];
			var made = [];
			var c;

			for (c = 0; c <= count; c++) {
				var t = c / count;
				var w = t * (turns || 1);
				var off = amount * (0.65 * Math.sin(phase + 2.6 * w) + 0.35 * Math.sin(phase * 1.7 + 6.1 * w)) * (fixed ? Math.min(1, t * 3) : 1);

				made.push([from[0] + (to[0] - from[0]) * t + aside[0] * off, from[1] + (to[1] - from[1]) * t + aside[1] * off]);
			}

			return made;
		}

		/*
		 * A line cut to the settlement (and to where keep(x, z) tells), every 2 m: the runs of it inside, longer than 8 m and
		 * not along its very edge; a straight line as its two ends, any other a point every 8 m. Closed: a ring, whole (Closed
		 * of its run) if all of it is in.
		 */
		function runs (line, keep, closed) {
			var path = closed ? line.concat([line[0]]) : line;
			var found = [];
			var run = null;
			var every = [];
			var a;

			for (a = 0; a + 1 < path.length; a++) {
				var steps = Math.max(1, Math.ceil(Math.hypot(path[a + 1][0] - path[a][0], path[a + 1][1] - path[a][1]) / 2));
				var s;

				for (s = a ? 1 : 0; s <= steps; s++)
					every.push([path[a][0] + (path[a + 1][0] - path[a][0]) * s / steps, path[a][1] + (path[a + 1][1] - path[a][1]) * s / steps]);
			}

			every.forEach(function (p) {
				if (inside(points, p[0], p[1]) && (!keep || keep(p[0], p[1]))) {
					run = run || [];

					run.push(p);
				}
				else if (run) {
					found.push(run);
					run = null;
				}
			});

			if (run)
				found.push(run);

			if (closed && found.length === 1 && found[0].length === every.length) {
				var whole = found[0].filter(function (p, index) {
					return index % 4 === 0 && index < every.length - 1;
				});

				whole.Closed = true;

				return [whole];
			}

			return found.filter(function (one) {
				var middle = one[Math.floor(one.length / 2)];

				return lengthOf(one) > 8 && edge(middle[0], middle[1]) > width;
			}).map(function (one) {
				if (line.length === 2 && !closed)
					return [one[0], one[one.length - 1]];

				return one.filter(function (p, index) {
					return index % 4 === 0 || index === one.length - 1;
				});
			});
		}

		/* A ring round its middle of so many points, its radius wobbling by a part of it. */
		function circle (radius, count, wobble, phase) {
			var made = [];
			var c;

			for (c = 0; c < count; c++) {
				var turn = c / count * Math.PI * 2;
				var far = radius * (1 + wobble * Math.sin(phase + turn * 3) * Math.cos(phase * 0.7 + turn * 2));

				made.push([center[0] + Math.cos(turn) * far, center[1] + Math.sin(turn) * far]);
			}

			return made;
		}

		/* A street of it: Road, the type of road it is (an avenue...), Closed, a ring. */
		function street (line, wide, road, closed) {
			var made = {Points: line, Width: wide};

			if (road)
				made.Road = road;

			if (closed)
				made.Closed = true;

			plan.Streets.push(made);
		}

		/* A grid of streets turned so, a step apart, where keep(x, z) tells: each line only as long as the circle it lies in. */
		function grid (turn, step, wide, keep) {
			var u = [Math.cos(turn), Math.sin(turn)];
			var v = [-u[1], u[0]];
			var k;

			for (k = -Math.floor(reach / step); k <= Math.floor(reach / step); k++) {
				var half = Math.sqrt(Math.max(0, reach * reach - k * step * k * step)) + 2;

				[[u, v], [v, u]].forEach(function (axes) {
					var o = [center[0] + axes[1][0] * k * step, center[1] + axes[1][1] * k * step];

					runs([[o[0] - axes[0][0] * half, o[1] - axes[0][1] * half], [o[0] + axes[0][0] * half, o[1] + axes[0][1] * half]], keep).forEach(function (run) {
						street(run, wide);
					});
				});
			}
		}

		return {inside: inside, nearest: nearest, distance: distance, edge: edge, clip: clip, lengthOf: lengthOf, pointAt: pointAt, smooth: smooth, wander: wander, runs: runs, circle: circle, street: street, grid: grid, random: random};
	},

	/* The streets drawn in it (street items of the sketch through it): its own streets of no stage after it. */
	Drawn: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty) return plan;

		var h = this.Helpers(plan);
		var inside = h.inside;
		var points = plan.Points;
		var width = plan.Width;
		var others = plan.Others;

		/* The streets drawn in it, else its own. */
		var drawn = others.filter(function (other) {
			return other.Type === 'street' && other.Points && other.Points.some(function (point) {
				return inside(points, point[0], point[1]);
			});
		});

		if (drawn.length) {
			plan.Drawn = true;
			/* Road: the type of road it is drawn as (SceneRoads; else of the kind of the settlement). */
			plan.Streets = drawn.map(function (other) {
				var street = {Points: other.Points, Width: Number(other.Width) || width};

				if (other.Road)
					street.Road = other.Road;

				return street;
			});
		}

		return plan;
	},

	/* A grid along its longest side, a block apart, its middle streets Middle times as wide. */
	Grid: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty || plan.Drawn) return plan;

		var h = this.Helpers(plan);
		var clip = h.clip;
		var center = plan.Center;
		var reach = plan.Reach;
		var width = plan.Width;
		var block = plan.Block;
		var along = plan.Along;
		var across = plan.Across;

		var k;

		for (k = -Math.ceil(reach / block); k <= Math.ceil(reach / block); k++) {
			[[along, across], [across, along]].forEach(function (axes) {
				var o = [center[0] + axes[1][0] * k * block, center[1] + axes[1][1] * k * block];

				clip([o[0] - axes[0][0] * reach, o[1] - axes[0][1] * reach], [o[0] + axes[0][0] * reach, o[1] + axes[0][1] * reach]).forEach(function (run) {
					plan.Streets.push({Points: run, Width: k === 0 ? width * Number(properties.Middle) : width});
				});
			});
		}

		return plan;
	},

	/* A main street along its longest side and lanes off it, to one side and the other by turns (Spacing, Length of a block, Lane: their width). */
	Main: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty || plan.Drawn) return plan;

		var h = this.Helpers(plan);
		var clip = h.clip;
		var center = plan.Center;
		var reach = plan.Reach;
		var width = plan.Width;
		var block = plan.Block;
		var along = plan.Along;
		var across = plan.Across;

		clip([center[0] - along[0] * reach, center[1] - along[1] * reach], [center[0] + along[0] * reach, center[1] + along[1] * reach]).forEach(function (run) {
			plan.Streets.push({Points: run, Width: width});
		});

		/* Lanes off the main street, to one side and the other by turns. */
		var lane;

		for (lane = -Math.floor(reach / block * 2); lane <= Math.floor(reach / block * 2); lane++) {
			var side = lane % 2 ? 1 : -1;
			var root = [center[0] + along[0] * lane * block * Number(properties.Spacing), center[1] + along[1] * lane * block * Number(properties.Spacing)];

			if (!lane) continue;

			clip(root, [root[0] + across[0] * side * block * Number(properties.Length), root[1] + across[1] * side * block * Number(properties.Length)]).forEach(function (run) {
				plan.Streets.push({Points: run, Width: width * Number(properties.Lane)});
			});
		}

		return plan;
	},

	/* A village along its road (or a main street of its own, bent: Wander, Turns), lanes off it (Spacing of a block); terraces on a hillside. */
	Road: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty || plan.Drawn) return plan;

		var h = this.Helpers(plan);
		var lengthOf = h.lengthOf;
		var pointAt = h.pointAt;
		var smooth = h.smooth;
		var wander = h.wander;
		var runs = h.runs;
		var street = h.street;
		var random = h.random;
		var center = plan.Center;
		var reach = plan.Reach;
		var width = plan.Width;
		var block = plan.Block;
		var angle = plan.Angle;
		var sloped = plan.Sloped;
		var item = plan.Item;
		var others = plan.Others;
		var fronts = plan.Fronts;

		/*
		 * A village along its road: a road of the sketch through it, its houses on both sides of it (else a main street of
		 * its own, bent as a way across the country is, along the level of a hillside); lanes off it to one side and the
		 * other by turns, out and along the level on a hillside.
		 */
		var level = sloped ? Number(item.Contour) : angle;
		var spine = [Math.cos(level), Math.sin(level)];
		var spines = [];

		others.forEach(function (other) {
			if (other.Type !== 'road' || !other.Points || other.Points.length < 2 || String(other.Road || '').indexOf('street-' + item.ID + '-') === 0) return;

			runs(other.Points.map(function (point) {
				return [point[0], point[1]];
			})).forEach(function (run) {
				fronts.push({Points: run, Width: Number(other.Width) || 6});
				spines.push(run);
			});
		});

		if (!spines.length) {
			runs(wander([center[0] - spine[0] * reach * 1.3, center[1] - spine[1] * reach * 1.3], [center[0] + spine[0] * reach * 1.3, center[1] + spine[1] * reach * 1.3], reach * Number(properties.Wander), random() * 6, false, Number(properties.Turns))).forEach(function (run) {
				street(run, width);

				spines.push(run);
			});
		}

		/*
		 * On a hillside, terraces: a street along the level each side of the main one, a block apart (its line moved aside),
		 * joined to it by short ways now and then; elsewhere lanes off it to one side and the other by turns, a little bent.
		 */
		var turnLane = 0;

		spines.forEach(function (line) {
			var total = lengthOf(line);
			var at;

			if (sloped) {
				[1, -1].forEach(function (out) {
					var moved = line.map(function (point, index) {
						var way = pointAt(line, lengthOf(line.slice(0, index + 1))).Way;

						return [point[0] - way[1] * out * block * 0.55, point[1] + way[0] * out * block * 0.55];
					});

					runs(smooth(moved, 8)).forEach(function (run) {
						street(run, width * 0.75);
					});
				});

				for (at = block * 0.6; at < total - block * 0.3; at += block * 1.3) {
					var joint = pointAt(line, at);
					var to = turnLane % 2 ? 1 : -1;

					turnLane++;

					runs([joint.At, [joint.At[0] - joint.Way[1] * to * block * 0.6, joint.At[1] + joint.Way[0] * to * block * 0.6]]).slice(0, 1).forEach(function (run) {
						street(run, width * 0.6);
					});
				}

				return;
			}

			for (at = block * 0.5; at < total - block * 0.3; at += block * Number(properties.Spacing)) {
				var place = pointAt(line, at);
				var out = turnLane % 2 ? 1 : -1;
				var normal = [-place.Way[1] * out, place.Way[0] * out];
				var lean = (random() - 0.5) * 0.5;
				var way = [normal[0] * Math.cos(lean) - normal[1] * Math.sin(lean), normal[0] * Math.sin(lean) + normal[1] * Math.cos(lean)];

				turnLane++;

				runs(wander(place.At, [place.At[0] + way[0] * block * 1.1, place.At[1] + way[1] * block * 1.1], 5, random() * 6, true)).slice(0, 1).forEach(function (run) {
					street(run, width * 0.75);
				});
			}
		});

		return plan;
	},

	/* A town of an old centre: a market (Market of its reach, Least metres), Rays streets out, a ring round the old town (Old of its reach), a grid past it. */
	Radial: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty || plan.Drawn) return plan;

		var h = this.Helpers(plan);
		var wander = h.wander;
		var runs = h.runs;
		var circle = h.circle;
		var street = h.street;
		var grid = h.grid;
		var random = h.random;
		var center = plan.Center;
		var reach = plan.Reach;
		var width = plan.Width;
		var block = plan.Block;
		var angle = plan.Angle;
		var sloped = plan.Sloped;
		var item = plan.Item;
		var plazas = plan.Plazas;

		/*
		 * A town of an old centre: a market square in its middle, streets out of it every way, a ring round the old town
		 * and a crooked one inside it; past the ring a grid (along the level of a hillside), its streets ending on the ring.
		 */
		var market = Math.max(Number(properties.Least), reach * Number(properties.Market));
		var old = reach * Number(properties.Old);
		var rays = Number(properties.Rays);
		var grain = sloped ? Number(item.Contour) : angle;
		var ray;

		/* The market and the street round it, the streets out of it starting on that. */
		plazas.push(circle(market, 12, 0, 0));

		runs(circle(market, 16, 0, 0), null, true).forEach(function (run) {
			street(run, width * 0.8, '', run.Closed);
		});

		runs(circle(old, 32, 0, 0), null, true).forEach(function (run) {
			street(run, width, '', run.Closed);
		});
		runs(circle(old * 0.58, 14, 0.12, random() * 6), null, true).forEach(function (run) {
			street(run, width * 0.75, '', run.Closed);
		});

		for (ray = 0; ray < rays; ray++) {
			var heading = angle + ray * Math.PI * 2 / rays + (random() - 0.5) * 0.3;
			var out2 = [Math.cos(heading), Math.sin(heading)];

			runs(wander([center[0] + out2[0] * market, center[1] + out2[1] * market], [center[0] + out2[0] * reach * 1.3, center[1] + out2[1] * reach * 1.3], reach * 0.035, random() * 6, true)).forEach(function (run) {
				street(run, width);
			});
		}

		grid(grain, block, width, function (x, z) {
			return Math.hypot(x - center[0], z - center[1]) > old - 1;
		});

		return plan;
	},

	/* A city of districts: a plaza, avenues out (Sectors, Avenue metres wide), a boulevard round its core (Core, Boulevard) and an avenue round its middle (Middle), a grid in each district. */
	Districts: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty || plan.Drawn) return plan;

		var h = this.Helpers(plan);
		var runs = h.runs;
		var circle = h.circle;
		var street = h.street;
		var grid = h.grid;
		var random = h.random;
		var center = plan.Center;
		var reach = plan.Reach;
		var width = plan.Width;
		var block = plan.Block;
		var angle = plan.Angle;
		var plazas = plan.Plazas;

		/*
		 * A city of districts: a square in its middle, avenues out of it (straight, every other one an avenue of a median), a
		 * boulevard round its core and an avenue round its middle; a grid in the core, and in each district between two
		 * avenues out a grid of its own, turned its own way, its streets ending on the avenues round them.
		 */
		var plaza = Math.max(Number(properties.Least), reach * Number(properties.Plaza));
		var core = reach * Number(properties.Core);
		var middle = reach * Number(properties.Middle);
		var sectors = Number(properties.Sectors);
		var avenue = Number(properties.Avenue);
		var s;

		plazas.push(circle(plaza, 12, 0, 0));

		runs(circle(plaza, 16, 0, 0), null, true).forEach(function (run) {
			street(run, width, '', run.Closed);
		});

		runs(circle(core, 32, 0, 0), null, true).forEach(function (run) {
			street(run, Number(properties.Boulevard), 'boulevard', run.Closed);
		});
		runs(circle(middle, 40, 0, 0), null, true).forEach(function (run) {
			street(run, avenue, 'avenue', run.Closed);
		});

		var headings = [];

		for (s = 0; s < sectors; s++) {
			headings.push(angle + s * Math.PI * 2 / sectors);

			runs([[center[0] + Math.cos(headings[s]) * plaza, center[1] + Math.sin(headings[s]) * plaza], [center[0] + Math.cos(headings[s]) * reach * 1.3, center[1] + Math.sin(headings[s]) * reach * 1.3]]).forEach(function (run) {
				street(run, s % 2 ? avenue : width * 1.3, s % 2 ? 'avenue' : '');
			});
		}

		grid(angle, block * 0.7, width, function (x, z) {
			var far = Math.hypot(x - center[0], z - center[1]);

			return far > plaza + 1 && far < core + 1;
		});

		headings.forEach(function (heading, index) {
			var next = headings[(index + 1) % sectors];
			var a = [Math.cos(heading), Math.sin(heading)];
			var b = [Math.cos(next), Math.sin(next)];

			[[core, middle], [middle, Infinity]].forEach(function (band) {
				grid(heading + Math.PI / sectors + (random() - 0.5) * 0.7, block, width, function (x, z) {
					var dx = x - center[0];
					var dz = z - center[1];
					var far = Math.hypot(dx, dz);

					/* Between the two avenues out (a metre over them, so its streets end on them) and the two round. */
					return a[0] * dz - a[1] * dx >= -1 && b[0] * dz - b[1] * dx <= 1 && far >= band[0] - 1 && far <= band[1] + 1 && (a[0] + b[0]) * dx + (a[1] + b[1]) * dz > 0;
				});
			});
		});

		return plan;
	},

	/* Lots along both sides of its streets and of the roads its houses line: a building of its place each, its front to the street (Start, Gap, Setback, Spacing, Step, Skip in metres). */
	Lots: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty) return plan;

		var h = this.Helpers(plan);
		var inside = h.inside;
		var distance = h.distance;
		var lengthOf = h.lengthOf;
		var pointAt = h.pointAt;
		var random = h.random;
		var points = plan.Points;
		var center = plan.Center;
		var reach = plan.Reach;
		var item = plan.Item;
		var others = plan.Others;
		var kind = plan.Table;
		var fronts = plan.Fronts;
		var plazas = plan.Plazas;

		var districtsOf = this.$Service('SceneTerrainGenerator').SettlementDistricts;

		var squares = others.filter(function (other) {
			return other.Type === 'square' && other.Points && other.Points.length > 2;
		});

		squares = squares.concat(plazas.map(function (one) {
			return {Points: one};
		}));

		/*
		 * The other ways of the sketch through it (roads, streets not its own, rivers, railways): no lot stands on them. Its own
		 * streets made roads of the scene (SceneScatter: road street-<its ID>-<n>) and where only they meet are its streets.
		 */
		function own (other) {
			var mine = 'street-' + item.ID + '-';
			if (String(other.Road || '').indexOf(mine) === 0) return true;

			return !!(other.Roads && other.Roads.length) && other.Roads.every(function (road) {
				return String(road).indexOf(mine) === 0;
			});
		}

		var ways = others.filter(function (other) {
			return other !== item && (other.Type === 'road' || other.Type === 'street' || other.Type === 'river' || other.Type === 'railway' || other.Type === 'canyon') && other.Points && other.Points.length > 1 && !own(other);
		});
		var districts = others.filter(function (other) {
			return other.Type === 'district' && other.Points && other.Points.length > 2;
		});

		function classes (x, z) {
			var district = districts.filter(function (other) {
				return inside(other.Points, x, z);
			})[0];
			var near = Math.hypot(x - center[0], z - center[1]) / Math.max(1, reach);

			if (district)
				return {District: district.Kind || 'residential', Weights: districtsOf[district.Kind] || districtsOf.residential};

			return {District: '', Weights: kind.Core && near < 0.35 ? kind.Core : kind.Classes};
		}

		function pick (weights) {
			var names = Object.keys(weights);
			var total = names.reduce(function (sum, name) {
				return sum + weights[name];
			}, 0);
			var roll = random() * total;
			var n;

			for (n = 0; n < names.length; n++) {
				roll -= weights[names[n]];

				if (roll <= 0)
					return names[n];
			}

			return names[names.length - 1];
		}

		/* The lines of its streets (a ring closed) and their bounds, for the lots to be kept off them quickly. */
		var lines = plan.Streets.map(function (one) {
			return one.Closed ? one.Points.concat([one.Points[0]]) : one.Points;
		});
		var boxes = lines.map(function (line) {
			return line.reduce(function (box, point) {
				return [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.max(box[2], point[0]), Math.max(box[3], point[1])];
			}, [Infinity, Infinity, -Infinity, -Infinity]);
		});

		/*
		 * Lots along both sides of each street and of each road its houses line: a building of its place, its front to the
		 * street, a little set back; along a curve or a ring by its way at each lot.
		 */
		plan.Streets.concat(fronts).forEach(function (street) {
			var line = street.Closed ? street.Points.concat([street.Points[0]]) : street.Points;
			var length = lengthOf(line);

			[1, -1].forEach(function (side) {
				var walked = Number(properties.Start);

				while (walked < length - Number(properties.Start)) {
					var place = pointAt(line, walked);
					var unit = place.Way;
					var at = place.At;
					var probe = classes(at[0], at[1]);
					var name = pick(probe.Weights);
					var size = name ? plan.Sizes(name) : null;
					var normal = [-unit[1] * side, unit[0] * side];
					var x;
					var z;
					var free;

					if (!size) {
						walked += Number(properties.Skip);

						continue;
					}

					/* A lot left empty, as the density tells. */
					if (random() >= plan.Density) {
						walked += size[0] + Number(properties.Gap);

						continue;
					}

					x = at[0] + unit[0] * size[0] / 2 + normal[0] * (street.Width / 2 + Number(properties.Setback) + size[1] / 2);
					z = at[1] + unit[1] * size[0] / 2 + normal[1] * (street.Width / 2 + Number(properties.Setback) + size[1] / 2);

					/* All of it inside the settlement, off its squares, its streets and the other lots. */
					free = [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(function (corner) {
						return inside(points, x + unit[0] * corner[0] * size[0] / 2 + normal[0] * corner[1] * size[1] / 2, z + unit[1] * corner[0] * size[0] / 2 + normal[1] * corner[1] * size[1] / 2);
					}) && !squares.some(function (other) {
						return inside(other.Points, x, z);
					}) && plan.Streets.every(function (other, index) {
						var room = other.Width / 2 + Math.min(size[0], size[1]) / 2;
						var box = boxes[index];
						if (x < box[0] - room || x > box[2] + room || z < box[1] - room || z > box[3] + room) return true;

						return distance(lines[index], x, z) > room;
					}) && plan.Lots.every(function (lot) {
						return Math.hypot(lot.X - x, lot.Z - z) > (Math.max(lot.Width, lot.Depth) + Math.max(size[0], size[1])) * Number(properties.Spacing);
					}) && ways.every(function (other) {
						var room = (Number(other.Width) || 6) / 2 + (Number(other.Shoulder) || 1.5);

						/* Its middle, its corners and the middles of its sides all off the way. */
						return [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].every(function (corner) {
							return distance(other.Points, x + unit[0] * corner[0] * size[0] / 2 + normal[0] * corner[1] * size[1] / 2, z + unit[1] * corner[0] * size[0] / 2 + normal[1] * corner[1] * size[1] / 2) > room;
						});
					});

					/* No room for it: a few metres on, maybe a smaller one fits there. */
					if (!free) {
						walked += Number(properties.Step);

						continue;
					}

					plan.Lots.push({X: x, Z: z, Turn: Math.atan2(-normal[0], -normal[1]), Width: size[0], Depth: size[1], Class: name, District: probe.District});

					walked += size[0] + Number(properties.Gap);
				}
			});
		});

		return plan;
	},

	/* A fort (Walls of its kind or of it): walls round it, a tower at each corner, a gate where a street goes out (within Gate metres). */
	Walls: function (layout, properties) {
		var plan = this.Next(layout);
		if (plan.Empty) return plan;

		var h = this.Helpers(plan);
		var nearest = h.nearest;
		var points = plan.Points;
		var item = plan.Item;
		var kind = plan.Table;

		if (kind.Walls || item.Walls) {
			var ring = points.concat([points[0]]);

			plan.Walls.push(ring);

			points.forEach(function (point) {
				plan.Towers.push({X: point[0], Z: point[1]});
			});

			plan.Streets.forEach(function (street) {
				var line = street.Points;
				var last = line.length - 1;

				[[line[0], line[1]], [line[last], line[last - 1]]].forEach(function (end) {
					var on = nearest(ring, end[0][0], end[0][1]);
					if (on[2] < Number(properties.Gate))
						plan.Gates.push({X: on[0], Z: on[1], Turn: Math.atan2(end[0][0] - end[1][0], end[0][1] - end[1][1])});
				});
			});
		}

		return plan;
	},

	/*
	 * Where a village lies on a ground (field: SceneTerrainGenerator.Flat): at X, Y if it is level and dry there (SceneBiomes.Level,
	 * Reach metres round), else at the nearest such place, ring by ring (Rings of them, Step metres apart, Turns round each);
	 * its first layout {Field, Center, Found, Radius, Objects, Roads}, its numbers of Random.Seeded of its Seed.
	 */
	Site: function (field, x, y, seed, radius, properties) {
		var biomes = this.$Service('SceneBiomes');
		var told = properties || {};
		var rings = told.Rings === undefined ? 24 : Number(told.Rings);
		var turns = told.Turns === undefined ? 16 : Number(told.Turns);
		var step = told.Step === undefined ? 16 : Number(told.Step);
		var near = told.Reach === undefined ? 8 : Number(told.Reach);
		var round = Number(radius) || 30;
		var center = {X: Number(x) || 0, Z: Number(y) || 0};
		var half = field.Size / 2 - round - 8;
		var found = biomes.Level(field, center.X, center.Z, near);
		var source = String(seed === undefined || seed === null || seed === '' ? 'village' : seed);
		var value = 2166136261;
		var turn;
		var ring;
		var i;

		for (i = 0; i < source.length; i++)
			value = Math.imul(value ^ source.charCodeAt(i), 16777619);

		for (ring = 1; ring < rings && !found; ring++) {
			for (turn = 0; turn < turns && !found; turn++) {
				var px = center.X + Math.cos(turn / turns * Math.PI * 2) * ring * step;
				var pz = center.Z + Math.sin(turn / turns * Math.PI * 2) * ring * step;

				if (Math.abs(px) < half && Math.abs(pz) < half && biomes.Level(field, px, pz, near)) {
					center = {X: px, Z: pz};
					found = true;
				}
			}
		}

		return {Field: field, Center: center, Found: found, Radius: round, Random: value, Objects: [], Roads: [], Streets: [], Fronts: [], Plazas: [], Lots: [], Walls: [], Gates: [], Towers: []};
	},

	/* The next number of a village (Random.Seeded: what goes on from where the stage before left it). */
	Seeded: function (plan) {
		plan.Random = Math.imul(plan.Random ^ plan.Random >>> 15, 2246822519) + 1 | 0;

		return (plan.Random >>> 0) / 4294967296;
	},

	/*
	 * Its houses round its middle on a spiral (Turn radians apart, Jitter), out to Radius (Inner of it the nearest), each of one of
	 * its Shapes (the first of them first; Sizes {shape: metres}, else Size), on level ground off the others (Spacing of their
	 * sizes), Tries times as many tries as Count; a way from the middle to each.
	 */
	Houses: function (layout, count, shapes, properties) {
		var self = this;
		var biomes = this.$Service('SceneBiomes');
		var plan = this.Next(layout);
		var told = properties || {};
		var houses = Number(count) || 8;
		var kinds = Array.isArray(shapes) && shapes.length ? shapes : ['house', 'house', 'house', 'barracks', 'windmill', 'tower'];
		var sizes = told.Sizes && typeof told.Sizes === 'object' ? told.Sizes : {barracks: 12, windmill: 11, tower: 9};
		var spiral = told.Turn === undefined ? 2.39996 : Number(told.Turn);
		var jitter = told.Jitter === undefined ? 0.5 : Number(told.Jitter);
		var inner = told.Inner === undefined ? 0.35 : Number(told.Inner);
		var spacing = told.Spacing === undefined ? 0.6 : Number(told.Spacing);
		var center = plan.Center;
		var radius = plan.Radius;
		var i;

		if (!plan.Found) return plan;

		plan.Objects = plan.Objects || [];
		plan.Roads = (plan.Roads || []).slice();

		for (i = 0; i < houses * (told.Tries === undefined ? 6 : Number(told.Tries)) && plan.Objects.length < houses; i++) {
			var angle = i * spiral + self.Seeded(plan) * jitter;
			var far = radius * (inner + (1 - inner) * Math.sqrt((plan.Objects.length + self.Seeded(plan)) / houses));
			var hx = center.X + Math.cos(angle) * far;
			var hz = center.Z + Math.sin(angle) * far;
			var name = kinds[plan.Objects.length ? Math.floor(self.Seeded(plan) * kinds.length) : 0];
			var size = sizes[name] || (told.Size === undefined ? 8 : Number(told.Size));
			if (!biomes.Level(plan.Field, hx, hz, size * 0.55) || plan.Objects.some(function (other) {
				return Math.abs(other.X - hx) < (other.Size + size) * spacing && Math.abs(other.Y - hz) < (other.Size + size) * spacing;
			})) continue;

			plan.Objects = plan.Objects.concat([{Kind: name, X: Math.round(hx), Y: Math.round(hz), Size: size, Blocks: true}]);

			plan.Roads.push([[center.X, center.Z], [hx, hz]]);
		}

		return plan;
	},

	/* The road out of it, away from the middle of the ground (Jitter radians either way), Far times its radius, along the ground (MaxSlope). */
	Out: function (layout, properties) {
		var plan = this.Next(layout);
		var told = properties || {};
		var center = plan.Center;
		var away;
		var out;

		if (!plan.Found) return plan;

		away = Math.atan2(-center.Z, -center.X) + (this.Seeded(plan) - 0.5) * (told.Jitter === undefined ? 1 : Number(told.Jitter));
		out = plan.Field.Path({X: center.X, Z: center.Z}, {X: center.X + Math.cos(away) * plan.Radius * (told.Far === undefined ? 2.4 : Number(told.Far)), Z: center.Z + Math.sin(away) * plan.Radius * (told.Far === undefined ? 2.4 : Number(told.Far))}, {MaxSlope: told.MaxSlope === undefined ? 0.4 : Number(told.MaxSlope)});

		plan.Roads = (plan.Roads || []).slice();

		if (out) {
			plan.Roads.push(out.map(function (point) {
				return [point.X, point.Z];
			}));
		}

		return plan;
	},


	/* A diamond (Ring: a roundabout): a ramp in each quadrant, off the motorway Along metres from the crossing (Bend before it, Out aside), onto the other road at a junction each side (Gap aside of it, Margin past the edge of the motorway). */
	Diamond: function (layout, properties) {
		var frame = layout;
		if (!frame || !frame.One) return frame;

		var one = frame.One;
		var A = frame.RoadA;
		var B = frame.RoadB;
		var halfA = frame.HalfA;
		var halfB = frame.HalfB;
		var sine = frame.Sine;
		var quadrants = frame.Quadrants;
		var ramps = frame.Ramps;
		var lasts = frame.Lasts;
		var id = frame.ID;
		var at = frame.At;
		var ramp = frame.Ramp;
		var junctionOn = frame.JunctionOn;

		var reach = (halfA + Number(properties.Margin)) / sine;
		var ends = {};

		quadrants.forEach(function (q, index) {
			var mA = one.AtA + q.SA * Number(properties.Along);
			var mB = one.AtB + q.SB * reach;
			var start = at(A, mA, q.OnA * (halfA - Number(properties.Edge)));
			var bend = at(A, mA - q.SA * Number(properties.Bend), q.OnA * (halfA + Number(properties.Out)));
			var near = at(B, mB, q.OnB * (halfB + Number(properties.Gap)));
			var end = at(B, mB, 0);

			ramps.push(ramp(id + '-ramp-' + index, [start, {X: bend.X, Z: bend.Z}, {X: near.X, Z: near.Z}, end], id));

			ends[q.SB] = end;
		});

		Object.keys(ends).forEach(function (side) {
			lasts[side] = junctionOn(id + '-' + (side < 0 ? 'a' : 'b'), ends[side], properties.Ring === true || properties.Ring === 'true');
		});

		return frame;
	},

	/* A cloverleaf: a loop of Radius in each quadrant (Margin off the roads), three quarters of a turn, and an outer ramp round it (Far, Corner). */
	Cloverleaf: function (layout, properties) {
		var frame = layout;
		if (!frame || !frame.One) return frame;

		var one = frame.One;
		var A = frame.RoadA;
		var B = frame.RoadB;
		var a = frame.WayA;
		var b = frame.WayB;
		var halfA = frame.HalfA;
		var halfB = frame.HalfB;
		var sine = frame.Sine;
		var quadrants = frame.Quadrants;
		var ramps = frame.Ramps;
		var id = frame.ID;
		var at = frame.At;
		var ramp = frame.Ramp;

		var radius = Number(properties.Radius);

		quadrants.forEach(function (q, index) {
			/* Its loop: round a middle in the quadrant, from the edge of A to the edge of B, three quarters of a turn. */
			var middleA = (halfB + radius + Number(properties.Margin)) / sine;
			var middleB = (halfA + radius + Number(properties.Margin)) / sine;
			var c = at(A, one.AtA, 0);
			var middle = {X: c.X + q.SA * a[0] * middleA + q.SB * b[0] * middleB, Z: c.Z + q.SA * a[1] * middleA + q.SB * b[1] * middleB};
			var from = at(A, one.AtA + q.SA * middleA, q.OnA * (halfA - Number(properties.Edge)));
			var to = at(B, one.AtB + q.SB * middleB, q.OnB * (halfB - Number(properties.Edge)));
			var start = Math.atan2(from.Z - middle.Z, from.X - middle.X);
			var stop = Math.atan2(to.Z - middle.Z, to.X - middle.X);
			var turn = stop - start;
			var knots = [from];
			var k;

			/* The long way round: three quarters of a turn, not one. */
			while (turn <= 0) turn += Math.PI * 2;

			if (turn < Math.PI)
				turn -= Math.PI * 2;

			for (k = 1; k < 10; k++) {
				var angle = start + turn * k / 10;

				knots.push({X: middle.X + Math.cos(angle) * radius, Z: middle.Z + Math.sin(angle) * radius});
			}

			knots.push(to);
			ramps.push(ramp(id + '-loop-' + index, knots, id));

			/* Its outer ramp: round the loop, from farther along A to farther along B. */
			var far = 2 * radius + Number(properties.Far);
			var out = Math.hypot(middle.X - c.X, middle.Z - c.Z) || 1;
			var corner = {X: middle.X + (middle.X - c.X) / out * (radius + Number(properties.Corner)), Z: middle.Z + (middle.Z - c.Z) / out * (radius + Number(properties.Corner))};
			var outer = [at(A, one.AtA + q.SA * (far + middleA), q.OnA * (halfA - Number(properties.Edge))), at(A, one.AtA + q.SA * (far * 0.6 + middleA), q.OnA * (halfA + 12)), corner, at(B, one.AtB + q.SB * (far * 0.6 + middleB), q.OnB * (halfB + 12)), at(B, one.AtB + q.SB * (far + middleB), q.OnB * (halfB - Number(properties.Edge)))];

			ramps.push(ramp(id + '-ramp-' + index, outer.map(function (knot, place) {
				return place === 0 || place === outer.length - 1 ? knot : {X: knot.X, Z: knot.Z};
			}), id));
		});

		return frame;
	},

	/* A stack: those that turn right in their quadrant, low; those that turn left over the middle, each on a level of its own (Level metres apart), off and onto the roads Reach metres from it (Extra for the highest). */
	Stack: function (layout, properties) {
		var frame = layout;
		if (!frame || !frame.One) return frame;

		var one = frame.One;
		var A = frame.RoadA;
		var B = frame.RoadB;
		var a = frame.WayA;
		var b = frame.WayB;
		var halfA = frame.HalfA;
		var halfB = frame.HalfB;
		var quadrants = frame.Quadrants;
		var ramps = frame.Ramps;
		var id = frame.ID;
		var at = frame.At;
		var ramp = frame.Ramp;

		var top = Math.max(at(A, one.AtA, 0).Y, at(B, one.AtB, 0).Y);

		quadrants.forEach(function (q, index) {
			var c = at(A, one.AtA, 0);
			/* The higher a ramp, the farther it starts: no steeper than a ramp may climb. */
			var reach = Number(properties.Reach) + (index === 2 ? Number(properties.Extra) : 0);
			var start = at(A, one.AtA + q.SA * reach, q.OnA * (halfA - Number(properties.Edge)));
			var end = at(B, one.AtB + q.SB * reach, q.OnB * (halfB - Number(properties.Edge)));
			/* Two levels over the upper road: the two that turn left cross one over the other at the middle. */
			var lift = top + Number(properties.Level) * (index === 1 ? 1 : 2);
			var knots;

			/* Turning right: in its quadrant, low; turning left: over the middle on a level of its own. */
			if (index === 0 || index === 3) {
				knots = [start, {X: c.X + q.SA * a[0] * 70 + q.SB * b[0] * 70, Z: c.Z + q.SA * a[1] * 70 + q.SB * b[1] * 70}, end];
			}
			else {
				knots = [start, {X: c.X + q.SA * a[0] * 90 - q.SB * b[0] * 30, Z: c.Z + q.SA * a[1] * 90 - q.SB * b[1] * 30, Y: lift}, {X: c.X - q.SA * a[0] * 30 + q.SB * b[0] * 90, Z: c.Z - q.SA * a[1] * 30 + q.SB * b[1] * 90, Y: lift}, end];
			}

			ramps.push(ramp(id + '-ramp-' + index, knots, id));
		});

		return frame;
	},

	/* A trumpet where a road ends on a motorway: the road cut back (Back metres from it), a loop of Loop on the far side, the ramps Side metres aside of the road, Over metres over the motorway. */
	Trumpet: function (layout, properties) {
		var frame = layout;
		if (!frame || !frame.One) return frame;

		var one = frame.One;
		var A = frame.RoadA;
		var B = frame.RoadB;
		var halfA = frame.HalfA;
		var ramps = frame.Ramps;
		var lasts = frame.Lasts;
		var id = frame.ID;
		var at = frame.At;
		var ramp = frame.Ramp;
		var junctionOn = frame.JunctionOn;
		var dot = frame.Dot;
		var sign = frame.Sign;

		/* The road cut back from the motorway; its end where the ramps part. */
		var back = halfA + Number(properties.Back);
		var total = B.Points[B.Points.length - 1].Along;
		var keep = one.End > 0 ? total - back : back;

		B.Points = B.Points.filter(function (point) {
			return one.End > 0 ? point.Along <= keep : point.Along >= keep;
		});

		if (one.End < 0) {
			B.Points.forEach(function (point) {
				point.Along -= keep;
			});
		}

		B.Spans = (B.Spans || []).map(function (span) {
			return Object.assign({}, span, one.End < 0 ? {From: span.From - keep, To: span.To - keep} : {To: Math.min(span.To, keep)});
		}).filter(function (span) {
			return span.To > span.From && span.To > 0;
		});

		var head = at(B, one.End > 0 ? B.Points[B.Points.length - 1].Along : 0, 0);
		var c2 = at(A, one.AtA, 0);
		var nearSide = sign(dot([head.X - c2.X, head.Z - c2.Z], c2.Left));
		var over = c2.Y + Number(properties.Over);
		var loop = Number(properties.Loop);
		var side = halfA + Number(properties.Side);
		var turn;

		/* A point by the motorway: u metres along it from the crossing, v aside of it, towards the road (v over 0) or away. */
		var uv = function (u, v, y) {
			var made = at(A, one.AtA + u, nearSide * v);

			return y === undefined ? {X: made.X, Z: made.Z} : {X: made.X, Z: made.Z, Y: y};
		};

		/*
		 * The loop on the far side: off the far carriageway, three quarters of a turn round a middle away from the motorway,
		 * then straight across over it, 8 m aside of the road, into the head of the road.
		 */
		var knots2 = [at(A, one.AtA + 8 - loop + 130, -nearSide * (halfA - 3)), uv(8 - loop + 55, -(halfA + 8))];

		for (turn = 0; turn <= 6; turn++) {
			var angle2 = Math.PI / 2 + Math.PI * 1.5 * turn / 6;

			knots2.push(uv(8 - loop + Math.cos(angle2) * loop, -(side + loop) + Math.sin(angle2) * loop));
		}

		knots2.push(uv(8, 0, over), uv(8, side), head);

		/* Near side: off it and onto it straight; far side, onto it: over the motorway 8 m the other side of the road, then out along it. */
		ramps.push(ramp(id + '-ramp-0', [at(A, one.AtA - 205, nearSide * (halfA - 3)), uv(-125, side), head], id));
		ramps.push(ramp(id + '-ramp-1', [head, uv(125, side), at(A, one.AtA + 205, nearSide * (halfA - 3))], id));
		ramps.push(ramp(id + '-ramp-2', [head, uv(-8, side), uv(-8, 0, over), uv(-30, -(side + 6)), uv(-115, -(halfA + 8)), at(A, one.AtA - 215, -nearSide * (halfA - 3))], id));
		ramps.push(ramp(id + '-loop-3', knots2, id));

		lasts.head = junctionOn(id + '-head', head, true);

		return frame;
	},
	Blocks: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var kinds = ['layout'];
		var lay = {Key: 'Layout', Type: 'layout'};

		/* A stage: the function of this Service of its name, of the layout and its properties, as code and walked. */
		function stage (name, comment, properties) {
			blueprints.Node(name, {Graphs: kinds, Group: 'layout', Comment: comment, Properties: properties, Inputs: [lay], Outputs: [lay],
				Compute: function (inputs, told) {
					return {Layout: self[name](inputs.Layout, told)};
				},
				Code: function (context) {
					return {Layout: 'B.$Service("LayoutBlueprints").' + name + '(' + context.Inputs.Layout + ', ' + JSON.stringify(context.Properties) + ')'};
				}
			});
		}

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		blueprints.Graph('layout', {
			End: 'Layout',
			Uses: ['generator'],
			Coded: 'Layout',
			Compile: function (plan) {
				return {
					Layout: function (parameters, inputs) {
						return self.Make(plan.Graph, parameters, inputs);
					}
				};
			}
		});

		blueprints.Node('Layout', {Graphs: kinds, Group: 'output', Comment: 'What the graph gives: the plan of a settlement', Inputs: [lay], Outputs: []});

		blueprints.Node('Area', {Graphs: kinds, Group: 'layout', Comment: 'Where a settlement lies: its first layout', Properties: [number('Least', 15), number('Share', 0.45), number('Districts', 450), number('Radial', 180)], Inputs: [{Key: 'Item', Type: 'any'}, {Key: 'Others', Type: 'any'}, {Key: 'Kind', Type: 'any'}, {Key: 'Sizes', Type: 'any'}], Outputs: [lay],
			Compute: function (inputs, told) {
				return {Layout: self.Area(inputs.Item, inputs.Others, inputs.Kind, inputs.Sizes, told)};
			},
			Code: function (context) {
				var inputs = context.Inputs;

				return {Layout: 'B.$Service("LayoutBlueprints").Area(' + [inputs.Item, inputs.Others, inputs.Kind, inputs.Sizes].join(', ') + ', ' + JSON.stringify(context.Properties) + ')'};
			}
		});

		stage('Drawn', 'The streets drawn in it: none of its own after it', []);
		stage('Grid', 'A grid of streets along its longest side', [number('Middle', 1.3)]);
		stage('Main', 'A main street along it and lanes off it', [number('Spacing', 0.5), number('Length', 0.9), number('Lane', 0.75)]);
		stage('Road', 'A village along its road, lanes off it; terraces on a hillside', [number('Wander', 0.16), number('Turns', 2.2), number('Spacing', 0.55)]);
		stage('Radial', 'A town of an old centre: a market, streets out of it, a ring round the old town, a grid past it', [number('Market', 0.08), number('Least', 12), number('Old', 0.4), number('Rays', 6)]);
		stage('Districts', 'A city of districts: avenues out and round, a grid of its own in each', [number('Plaza', 0.06), number('Least', 16), number('Core', 0.3), number('Middle', 0.62), number('Sectors', 6), number('Avenue', 26), number('Boulevard', 20)]);
		stage('Lots', 'Lots along its streets: a building of its place each, its front to the street', [number('Start', 4), number('Gap', 3), number('Setback', 2), number('Spacing', 0.42), number('Step', 4), number('Skip', 12)]);
		stage('Walls', 'A fort: walls round it, towers, gates where its streets go out', [number('Gate', 6)]);

		blueprints.Node('Site', {Graphs: kinds, Group: 'layout', Comment: 'Where a village lies: its place, or the nearest level and dry one', Properties: [number('Rings', 24), number('Turns', 16), number('Step', 16), number('Reach', 8)], Inputs: [{Key: 'Field', Type: 'any'}, {Key: 'X', Type: 'float', Value: 0}, {Key: 'Y', Type: 'float', Value: 0}, {Key: 'Seed', Type: 'any', Value: 'village'}, {Key: 'Radius', Type: 'float', Value: 30}], Outputs: [lay],
			Compute: function (inputs, told) {
				return {Layout: self.Site(inputs.Field, inputs.X, inputs.Y, inputs.Seed, inputs.Radius, told)};
			},
			Code: function (context) {
				var inputs = context.Inputs;

				return {Layout: 'B.$Service("LayoutBlueprints").Site(' + [inputs.Field, inputs.X, inputs.Y, inputs.Seed, inputs.Radius].join(', ') + ', ' + JSON.stringify(context.Properties) + ')'};
			}
		});

		blueprints.Node('Houses', {Graphs: kinds, Group: 'layout', Comment: 'The houses of a village on a spiral round its middle, a way to each', Properties: [number('Turn', 2.39996), number('Jitter', 0.5), number('Inner', 0.35), number('Spacing', 0.6), number('Tries', 6), number('Size', 8), {Key: 'Sizes', Type: 'object', Value: {barracks: 12, windmill: 11, tower: 9}}], Inputs: [lay, {Key: 'Count', Type: 'float', Value: 8}, {Key: 'Shapes', Type: 'any'}], Outputs: [lay],
			Compute: function (inputs, told) {
				return {Layout: self.Houses(inputs.Layout, inputs.Count, inputs.Shapes, told)};
			},
			Code: function (context) {
				var inputs = context.Inputs;

				return {Layout: 'B.$Service("LayoutBlueprints").Houses(' + [inputs.Layout, inputs.Count, inputs.Shapes || 'undefined'].join(', ') + ', ' + JSON.stringify(context.Properties) + ')'};
			}
		});

		stage('Out', 'The road out of a village, away from the middle of the ground', [number('Jitter', 1), number('Far', 2.4), number('MaxSlope', 0.4)]);

		/* The forms of interchanges (SceneRoads.Interchanges): Places, the metres from the crossing along the roads that are no tunnel. */
		stage('Diamond', 'A diamond or a roundabout: a ramp in each quadrant, a junction each side', [number('Along', 260), number('Bend', 70), number('Out', 10), number('Gap', 22), number('Margin', 45), number('Edge', 3), {Key: 'Ring', Type: 'bool', Value: false}, {Key: 'Places', Type: 'text', Value: '-260, 260'}]);
		stage('Cloverleaf', 'A cloverleaf: a loop in each quadrant and an outer ramp round it', [number('Radius', 45), number('Margin', 12), number('Far', 90), number('Corner', 22), number('Edge', 3), {Key: 'Places', Type: 'text', Value: '-260, -70, 70, 260'}]);
		stage('Stack', 'A stack: right turns low, left turns over the middle, a level each', [number('Reach', 320), number('Extra', 110), number('Level', 7.5), number('Edge', 3), {Key: 'Places', Type: 'text', Value: '-430, -320, 320, 430'}]);
		stage('Trumpet', 'A trumpet where a road ends on a motorway: the road cut back, a loop on the far side', [number('Back', 150), number('Over', 7.2), number('Loop', 40), number('Side', 14), {Key: 'Places', Type: 'text', Value: '-215, -205, 98, 205'}]);
	}
});
