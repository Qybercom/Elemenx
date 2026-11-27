/*
 * CloudBlueprints: clouds of points made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets
 * such a graph or block). A graph of the kind cloud ends at Cloud and is run once for each of its points: its Input blocks
 * read Index (the point, 0 the first), Count and what it is given (a Seed most often), and Cloud takes what the point is:
 * Position (vec3), Color (vec4: r, g, b and its brightness), Size, Keep (false: the point is dropped) and a number for
 * each of its Fields (names: 'Distance, Spin'). Its Count (an input, else its property, up to a million) is read once, of
 * the point 0; Least (a distance) drops a point nearer than it to one kept before it, so they lie apart as a disc of
 * Poisson lays them. Its numbers are of the seed of Astronomy.Random by Draw (Seed, Index * the numbers a point draws + the
 * one it is): a graph draws what a code drawing them one after another drew.
 * - Points(graph, parameters, inputs): runs one (an object, its JSON, or the name of a resource): {Count (of the points
 *   kept), Positions (Float32Array, by threes), Colors (by fours), Sizes, Fields ({name: Float64Array})}; Positions,
 *   Colors and Sizes are there when the graph tells them. Made once for the same graph, parameters and inputs (the last
 *   32 kept). Its code is made of the graph (Blueprints.Code: no walk of its blocks for each point), else it runs as it is.
 * - Its blocks stand in any graph of numbers (a generator, and the kinds that use one):
 *   Sphere (U, V of 0 to 1: a point on a ball of Radius, as many on each part of it; Z of U from -1 to 1, the way round
 *   of V), Shell (the same within a ball from Inner to Outer, as many in each part of it: W the depth), Disc (U, V: a
 *   point on a flat ring from Inner to Outer, in X and Z), Spiral (U, V, Arm of a whole number: on one of Arms arms of a
 *   logarithmic spiral of Pitch degrees from Inner to Outer, Spread wide), Gauss (U, V: a number of a normal spread,
 *   Middle and Deviation), Plummer (U, Scale: how far a star of a cluster of the profile of Plummer is from its middle),
 *   Fibonacci (Index, Count: the points of a spiral of Fibonacci, as even as can be over a ball of Radius), Pick (Value of
 *   0 to 1: one of List, else of its Items, as Random.Pick takes one) and Blackbody (Temperature in kelvins: the color of a
 *   star of it, 0 to 1, as Astronomy.Color gives it).
 * The library's clouds (ElemenxGraphics/cloud/<name>): sky (the stars of space round the eye), night (of the night of a
 * ground), cluster (the swarm of a star cluster: Seed, Scale), belt (the rocks of a belt: Seed, Count, Inner, Outer, Tilt,
 * Round, Body, Factor, Rocks, Colors; Fields Distance, Eccentricity, Inclination, Node, Periapsis, Anomaly, AxisX, AxisY,
 * AxisZ, Spin). The same functions run in Node: they read no page.
 */
Elemenx.Service('CloudBlueprints', {
	$Meta: {
		Description: 'Clouds of points made of graphs of Blueprints: stars of a sky, swarms of clusters, rocks of belts; each point of the same graph.',
		Methods: ['Points(graph, parameters, inputs)']
	},

	$Provides: {
		Blueprints: {Graphs: ['cloud'], Nodes: ['Cloud', 'Sphere', 'Shell', 'Disc', 'Spiral', 'Gauss', 'Plummer', 'Fibonacci', 'Pick', 'Blackbody']}
	},

	/* How many points a cloud has at most. */
	Most: 1000000,

	$OnCreate: function () {
		this.Made = [];

		this.Blocks();
	},

	Points: function (graph, parameters, inputs) {
		var blueprints = this.$Service('Blueprints');
		var given = typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : typeof graph === 'string' ? JSON.parse(graph) : graph;
		if (!given || !Array.isArray(given.blocks))
			throw new Error('Elemenx CloudBlueprints: no graph of a cloud ' + (typeof graph === 'string' ? graph : ''));

		var read = blueprints.Read(given);
		var key = blueprints.Hash(read) + JSON.stringify([parameters || {}, inputs || {}]);
		var kept = this.Made.filter(function (one) {
			return one.Key === key;
		})[0];
		if (kept)
			return kept.Cloud;

		var cloud = this.Run(read, parameters || {}, inputs || {});

		this.Made.push({Key: key, Cloud: cloud});

		if (this.Made.length > 32)
			this.Made.shift();

		return cloud;
	},

	/*
	 * A graph of a cloud as a generator of numbers: its Cloud block made Result blocks, one for each input of it that a link
	 * reaches ({Graph, Told: the keys linked, End: the Cloud block}).
	 */
	Generator: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var copy = JSON.parse(JSON.stringify(graph));
		var end = copy.blocks.filter(function (block) {
			return block.type === 'Cloud' && block.enabled !== false;
		})[0];
		var told = [];

		if (!end)
			throw new Error('Elemenx CloudBlueprints: a cloud graph has no Cloud');

		var pins = {};

		(end.pins || []).forEach(function (pin) {
			pins[pin.id] = pin.key;
		});

		var links = copy.links.filter(function (link) {
			return pins[link.p2] !== undefined && link.enabled !== false;
		});

		copy.type = 'generator';

		blueprints.Remove(copy, end.id);

		links.forEach(function (link, index) {
			var result = blueprints.Add(copy, 'Result', {id: end.id + '-result-' + index, properties: {Key: pins[link.p2]}});

			blueprints.Link(copy, link.p1, [result.id, 'Value']);

			told.push(pins[link.p2]);
		});

		return {Graph: copy, Told: told, End: end};
	},

	Run: function (graph, parameters, inputs) {
		var blueprints = this.$Service('Blueprints');
		var made = this.Generator(graph);
		var properties = blueprints.Properties(made.End);
		var fields = this.Fields(properties.Fields);
		var code = blueprints.Code(made.Graph);
		var compiled = code ? null : blueprints.Compile(made.Graph);
		var told = {};
		var given = Object.assign({}, inputs, {Index: 0, Count: 0});
		var least = Math.max(0, Number(properties.Least) || 0);
		var grid = least > 0 ? {} : null;
		var positions = [];
		var colors = [];
		var sizes = [];
		var values = {};
		var kept = 0;
		var count;
		var point;
		var i;

		made.Told.forEach(function (key) {
			told[key] = true;
		});

		function one () {
			return code ? code.Run(parameters, given) : blueprints.Calling(function () {
				return compiled.Run(parameters, given);
			});
		}

		/* A point nearer than Least to one kept before it (the cells of a grid of Least round it). */
		function near (at) {
			var cell = [Math.floor(at[0] / least), Math.floor(at[1] / least), Math.floor(at[2] / least)];
			var x;
			var y;
			var z;

			for (x = -1; x <= 1; x++) {
				for (y = -1; y <= 1; y++) {
					for (z = -1; z <= 1; z++) {
						if ((grid[(cell[0] + x) + ',' + (cell[1] + y) + ',' + (cell[2] + z)] || []).some(function (other) {
							return Math.hypot(other[0] - at[0], other[1] - at[1], other[2] - at[2]) < least;
						})) return true;
					}
				}
			}

			(grid[cell.join(',')] = grid[cell.join(',')] || []).push(at);

			return false;
		}

		fields.forEach(function (name) {
			values[name] = [];
		});

		point = one();
		count = told.Count ? Number(point.Count) : Number(properties.Count);
		count = Math.max(0, Math.min(this.Most, Math.round(count) || 0));
		given.Count = count;

		for (i = 0; i < count; i++) {
			given.Index = i;
			point = one();

			if (told.Keep && !point.Keep) continue;

			var at = told.Position ? this.Vector(point.Position, 3) : null;
			if (grid && at && near(at)) continue;

			kept++;

			if (at)
				positions.push(at[0], at[1], at[2]);

			if (told.Color) {
				var color = this.Vector(point.Color, 4, 1);

				colors.push(color[0], color[1], color[2], color[3]);
			}

			if (told.Size)
				sizes.push(Number(point.Size) || 0);

			fields.forEach(function (name) {
				values[name].push(told[name] ? Number(point[name]) || 0 : 0);
			});
		}

		var cloud = {Count: kept, Positions: told.Position ? new Float32Array(positions) : null, Colors: told.Color ? new Float32Array(colors) : null, Sizes: told.Size ? new Float32Array(sizes) : null, Fields: {}};

		fields.forEach(function (name) {
			cloud.Fields[name] = new Float64Array(values[name]);
		});

		return cloud;
	},

	/* The names of the Fields of a Cloud ('Distance, Spin'), none of the keys it has of its own. */
	Fields: function (told) {
		var own = ['Count', 'Position', 'Color', 'Size', 'Keep'];

		return (Array.isArray(told) ? told : String(told || '').split(',')).map(function (name) {
			return String(name).trim();
		}).filter(function (name, index, list) {
			return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && own.indexOf(name) === -1 && list.indexOf(name) === index;
		});
	},

	/* A value as a vector of size numbers: a number fills it, what is missing is 0 (the last of four, fourth). */
	Vector: function (value, size, fourth) {
		var list = Array.isArray(value) || value && typeof value.length === 'number' ? Array.prototype.slice.call(value, 0, size) : [Number(value) || 0];

		while (list.length < size)
			list.push(list.length === 3 && fourth !== undefined ? fourth : !Array.isArray(value) && list.length < 3 ? list[0] : 0);

		return list.map(function (part) {
			return Number(part) || 0;
		});
	},

	/* The color of a star of a temperature (K) as Astronomy.Color tells it, each part 0 to 1 (its bytes over 255). */
	Blackbody: function (temperature) {
		var made = this.$Service('Astronomy').Blackbody(temperature);

		return [made[0], made[1], made[2]].map(function (part) {
			return Math.max(0, Math.min(255, Math.round(part))) / 255;
		});
	},

	/* The items of a text of them ('3200, 4500'): numbers where they are numbers. */
	Items: function (text) {
		return Array.isArray(text) ? text : String(text || '').split(',').map(function (part) {
			var trimmed = part.trim();

			return trimmed !== '' && !isNaN(Number(trimmed)) ? Number(trimmed) : trimmed;
		}).filter(function (part) {
			return part !== '';
		});
	},

	Blocks: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var numbers = ['generator'];
		var unit = function (key) {
			return {Key: key, Type: 'float', Value: 0.5};
		};

		blueprints.Graph('cloud', {
			End: 'Cloud',
			Uses: ['generator'],
			Compile: function (plan) {
				return {
					Points: function (parameters, inputs) {
						return self.Run(blueprints.Read(plan.Graph), parameters || {}, inputs || {});
					}
				};
			}
		});

		blueprints.Node('Cloud', {
			Graphs: ['cloud'],
			Group: 'output',
			Comment: 'What a point of the cloud is: its place, color, size and fields; Count of them',
			Properties: [{Key: 'Count', Type: 'number', Value: 1000, Min: 0}, {Key: 'Fields', Type: 'text', Value: ''}, {Key: 'Least', Type: 'number', Value: 0, Min: 0}],
			Inputs: function (properties) {
				return [{Key: 'Count', Type: 'float', Value: Number(properties.Count) || 0}, {Key: 'Position', Type: 'vec3', Value: [0, 0, 0]}, {Key: 'Color', Type: 'vec4', Value: [1, 1, 1, 1]}, {Key: 'Size', Type: 'float', Value: 1}, {Key: 'Keep', Type: 'bool', Value: true}].concat(self.Fields(properties.Fields).map(function (name) {
					return {Key: name, Type: 'float', Value: 0};
				}));
			},
			Outputs: []
		});

		blueprints.Node('Sphere', {Graphs: numbers, Group: 'cloud', Comment: 'A point on a ball, as many on each part of it', Inputs: [unit('U'), unit('V'), {Key: 'Radius', Type: 'float', Value: 1}], Outputs: [{Key: 'Point', Type: 'vec3'}],
			Compute: function (inputs) {
				return {Point: self.Sphere(inputs.U, inputs.V, inputs.Radius)};
			},
			Code: function (context) {
				return {Point: 'B.NodeOf("Sphere").Of(' + context.Inputs.U + ', ' + context.Inputs.V + ', ' + context.Inputs.Radius + ')'};
			},
			Of: function (u, v, radius) {
				return self.Sphere(u, v, radius);
			}
		});

		blueprints.Node('Shell', {Graphs: numbers, Group: 'cloud', Comment: 'A point within a ball from Inner to Outer, as many in each part of it', Inputs: [unit('U'), unit('V'), unit('W'), {Key: 'Inner', Type: 'float', Value: 0}, {Key: 'Outer', Type: 'float', Value: 1}], Outputs: [{Key: 'Point', Type: 'vec3'}],
			Compute: function (inputs) {
				return {Point: self.Shell(inputs.U, inputs.V, inputs.W, inputs.Inner, inputs.Outer)};
			},
			Code: function (context) {
				var i = context.Inputs;

				return {Point: 'B.NodeOf("Shell").Of(' + [i.U, i.V, i.W, i.Inner, i.Outer].join(', ') + ')'};
			},
			Of: function (u, v, w, inner, outer) {
				return self.Shell(u, v, w, inner, outer);
			}
		});

		blueprints.Node('Disc', {Graphs: numbers, Group: 'cloud', Comment: 'A point on a flat ring from Inner to Outer (X and Z), as many on each part of it', Inputs: [unit('U'), unit('V'), {Key: 'Inner', Type: 'float', Value: 0}, {Key: 'Outer', Type: 'float', Value: 1}], Outputs: [{Key: 'Point', Type: 'vec3'}],
			Compute: function (inputs) {
				return {Point: self.Disc(inputs.U, inputs.V, inputs.Inner, inputs.Outer)};
			},
			Code: function (context) {
				var i = context.Inputs;

				return {Point: 'B.NodeOf("Disc").Of(' + [i.U, i.V, i.Inner, i.Outer].join(', ') + ')'};
			},
			Of: function (u, v, inner, outer) {
				return self.Disc(u, v, inner, outer);
			}
		});

		blueprints.Node('Spiral', {Graphs: numbers, Group: 'cloud', Comment: 'A point on an arm of a logarithmic spiral', Properties: [{Key: 'Arms', Type: 'number', Value: 2, Min: 1}, {Key: 'Pitch', Type: 'number', Value: 14}], Inputs: [unit('U'), unit('V'), {Key: 'Arm', Type: 'float', Value: 0}, {Key: 'Inner', Type: 'float', Value: 0.1}, {Key: 'Outer', Type: 'float', Value: 1}, {Key: 'Spread', Type: 'float', Value: 0.1}], Outputs: [{Key: 'Point', Type: 'vec3'}],
			Compute: function (inputs, properties) {
				return {Point: self.Spiral(inputs.U, inputs.V, inputs.Arm, inputs.Inner, inputs.Outer, inputs.Spread, properties.Arms, properties.Pitch)};
			},
			Code: function (context) {
				var i = context.Inputs;

				return {Point: 'B.NodeOf("Spiral").Of(' + [i.U, i.V, i.Arm, i.Inner, i.Outer, i.Spread, JSON.stringify(Number(context.Properties.Arms) || 2), JSON.stringify(Number(context.Properties.Pitch) || 14)].join(', ') + ')'};
			},
			Of: function (u, v, arm, inner, outer, spread, arms, pitch) {
				return self.Spiral(u, v, arm, inner, outer, spread, arms, pitch);
			}
		});

		blueprints.Node('Gauss', {Graphs: numbers, Group: 'cloud', Comment: 'A number of a normal spread round Middle (Box and Muller)', Inputs: [unit('U'), unit('V'), {Key: 'Middle', Type: 'float', Value: 0}, {Key: 'Deviation', Type: 'float', Value: 1}], Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (inputs) {
				return {Value: self.Gauss(inputs.U, inputs.V, inputs.Middle, inputs.Deviation)};
			},
			Code: function (context) {
				var i = context.Inputs;

				return {Value: 'B.NodeOf("Gauss").Of(' + [i.U, i.V, i.Middle, i.Deviation].join(', ') + ')'};
			},
			Of: function (u, v, middle, deviation) {
				return self.Gauss(u, v, middle, deviation);
			}
		});

		blueprints.Node('Plummer', {Graphs: numbers, Group: 'cloud', Comment: 'How far a star of a cluster of the profile of Plummer is from its middle', Inputs: [unit('U'), {Key: 'Scale', Type: 'float', Value: 1}], Outputs: [{Key: 'Radius', Type: 'float'}],
			Compute: function (inputs) {
				return {Radius: self.Plummer(inputs.U, inputs.Scale)};
			},
			Code: function (context) {
				return {Radius: 'B.NodeOf("Plummer").Of(' + context.Inputs.U + ', ' + context.Inputs.Scale + ')'};
			},
			Of: function (u, scale) {
				return self.Plummer(u, scale);
			}
		});

		blueprints.Node('Fibonacci', {Graphs: numbers, Group: 'cloud', Comment: 'The points of a spiral of Fibonacci, as even as can be over a ball', Inputs: [{Key: 'Index', Type: 'float', Value: 0}, {Key: 'Count', Type: 'float', Value: 1}, {Key: 'Radius', Type: 'float', Value: 1}], Outputs: [{Key: 'Point', Type: 'vec3'}],
			Compute: function (inputs) {
				return {Point: self.Fibonacci(inputs.Index, inputs.Count, inputs.Radius)};
			},
			Code: function (context) {
				var i = context.Inputs;

				return {Point: 'B.NodeOf("Fibonacci").Of(' + [i.Index, i.Count, i.Radius].join(', ') + ')'};
			},
			Of: function (index, count, radius) {
				return self.Fibonacci(index, count, radius);
			}
		});

		blueprints.Node('Pick', {Graphs: numbers, Group: 'cloud', Comment: 'One of a list by a number of 0 to 1, as Random.Pick takes one', Properties: [{Key: 'Items', Type: 'text', Value: ''}], Inputs: [unit('Value'), {Key: 'List', Type: 'any'}], Outputs: [{Key: 'Out', Type: 'any'}],
			Compute: function (inputs, properties) {
				return {Out: self.Pick(inputs.List, properties.Items, inputs.Value)};
			},
			Code: function (context) {
				context.Prelude('var k' + context.Index + ' = ' + JSON.stringify(self.Items(context.Properties.Items)) + ';');

				return {Out: 'B.NodeOf("Pick").Of(' + (context.Inputs.List || 'undefined') + ', k' + context.Index + ', ' + context.Inputs.Value + ')'};
			},
			Of: function (list, items, value) {
				return self.Pick(list, items, value);
			}
		});

		blueprints.Node('Blackbody', {Graphs: numbers, Group: 'cloud', Comment: 'The color of a star of a temperature in kelvins', Inputs: [{Key: 'Temperature', Type: 'float', Value: 5772}], Outputs: [{Key: 'Color', Type: 'vec3'}],
			Compute: function (inputs) {
				return {Color: self.Blackbody(inputs.Temperature)};
			},
			Code: function (context) {
				return {Color: 'B.NodeOf("Blackbody").Of(' + context.Inputs.Temperature + ')'};
			},
			Of: function (temperature) {
				return self.Blackbody(temperature);
			}
		});
	},

	/* The functions of its blocks, of numbers as the code of a sky drew them (each the very order of its sums). */
	Sphere: function (u, v, radius) {
		var z = -1 + 2 * Number(u);
		var angle = Math.PI * 2 * Number(v);
		var round = Math.sqrt(1 - z * z);
		var r = Number(radius);

		return [Math.cos(angle) * round * r, z * r, Math.sin(angle) * round * r];
	},

	Shell: function (u, v, w, inner, outer) {
		var low = Math.pow(Math.max(0, Number(inner)), 3);
		var high = Math.pow(Math.max(0, Number(outer)), 3);
		var r = Math.cbrt(low + (high - low) * Number(w));

		return this.Sphere(u, v, r);
	},

	Disc: function (u, v, inner, outer) {
		var low = Number(inner) * Number(inner);
		var high = Number(outer) * Number(outer);
		var r = Math.sqrt(low + (high - low) * Number(u));
		var angle = Math.PI * 2 * Number(v);

		return [Math.cos(angle) * r, 0, Math.sin(angle) * r];
	},

	Spiral: function (u, v, arm, inner, outer, spread, arms, pitch) {
		var count = Math.max(1, Math.round(Number(arms) || 1));
		var r = Number(inner) + (Number(outer) - Number(inner)) * Number(u);
		var turn = Math.log(Math.max(1e-6, r) / Math.max(1e-6, Number(inner))) / Math.tan(Math.max(1, Math.min(89, Number(pitch) || 14)) * Math.PI / 180);
		var angle = (Math.floor(Number(arm) || 0) % count) * Math.PI * 2 / count + turn + (Number(v) - 0.5) * Number(spread) * Math.PI * 2;

		return [Math.cos(angle) * r, 0, Math.sin(angle) * r];
	},

	Gauss: function (u, v, middle, deviation) {
		return Number(middle) + Number(deviation) * Math.sqrt(-2 * Math.log(Math.max(1e-12, Number(u)))) * Math.cos(Math.PI * 2 * Number(v));
	},

	Plummer: function (u, scale) {
		return Number(scale) / Math.sqrt(Math.pow(Number(u), -2 / 3) - 1);
	},

	Fibonacci: function (index, count, radius) {
		var n = Math.max(1, Number(count) || 1);
		var y = 1 - (Number(index) + 0.5) / n * 2;
		var round = Math.sqrt(Math.max(0, 1 - y * y));
		var angle = Math.PI * (3 - Math.sqrt(5)) * Number(index);
		var r = Number(radius);

		return [Math.cos(angle) * round * r, y * r, Math.sin(angle) * round * r];
	},

	Pick: function (list, items, value) {
		var from = Array.isArray(list) && list.length ? list : this.Items(typeof list === 'string' && list.trim() ? list : items);

		return from.length ? from[Math.floor(Number(value) * from.length)] : 0;
	}
});
