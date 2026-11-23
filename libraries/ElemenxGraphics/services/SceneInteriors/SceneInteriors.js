/*
 * SceneInteriors: the inside of a ship (or of any vehicle), so that a character may walk in it, laid out by its class and
 * fitted into its hull: what is inside is as large as what is outside, no room stands out of it (resources/interiors/
 * classes: Deck, Colors, Drop (the kinds of rooms left out first where the hull is short), Classes [{Name, Most (the
 * longest ship of the class, metres), Gear (how high its legs hold it over the ground parked), Entry (ramp, canopy), Rooms
 * [{Kind (cockpit, bridge, command, corridor, lift, common, quarters, armory, gunnery, engine, cargo, hangar), Length,
 * Width, Seats (the roles of its consoles), Reactors (its reactors stand there), Ramp (a hatch in its floor opens on a ramp
 * down to the ground)}], Turrets [{Place (top, belly), Along (-0.5 at its tail to 0.5 at its nose), Weapon, Arc, Low,
 * High}]: the turrets of the class, of SceneTactics; a ship's own are its Interior.Turrets}]).
 *
 * - ClassOf(length) is the class of a ship that long (fighter, small, medium, large, capital: the first whose Most it is
 *   not longer than); GearOf(ship) how high its legs hold it parked (metres).
 * - Hull(pieces, options) measures a hull ([{Positions, Indices}] in the frame of its inside: metres, x to its right, y up
 *   from the ground under it, its nose along +z): over a grid of columns (Cell, metres; of its length else), the lowest
 *   and the highest of its skin in each ({Cell, X, Z, NX, NZ, Bottom, Top, Low, High}).
 * - Plan(ship, hull) lays its rooms out nose first along +z: with a hull, at the height and along the stretch of it where
 *   most room is, each as wide as it is there, shortened (and the rooms of Drop left out) where it is short, lengthened
 *   where it is long (Fitted); without one, as the class has them. {Class, Entry, Fitted, Floor, Height, Rooms [{Kind, Low,
 *   High}], Doors [{At, Width}], Seats [{ID, Role, At, Console, Exit, Room, Controls}], Ramp ({Low, High, Top, Bottom,
 *   Hatch} of a ramp from a hatch in the floor down to the ground; null for a canopy), Free (the boxes one may be in: the
 *   rooms within their walls, the doorways, the way down the ramp), Opening (the box of the hull cut away over the ramp), Well (the boxes of the walls round the way down through the hull),
 *   Lamps [{At, Color, Power, Radius}], Legs [[x, z, top]], Gear, Length, Width}. Ship: {Length (metres), Interior: {Class,
 *   Rooms (over those of the class; Windows of a room: true or false, else a cockpit and a bridge have them), Model},
 *   Reactors (how many: of its Power)}.
 * - WindowsOf(plan): the glass across the nose wall of each room with windows (none past a door): [{Low, High}], metres of
 *   the inside. What is outside is seen through it (SceneAboard cuts the hull forward of it while the eye is inside).
 * - Solid(plan, hull, point, radius): whether a ball (of radius metres, at a point of the frame of the inside) is in what
 *   is solid of the ship: its hull, its walls, its floors and ceilings; not in its rooms, its doorways, the way down its
 *   ramp. What the view (and a walker) of the scene keeps out of.
 * - Parts(plan, tools) are its pieces for SceneModels: a floor (a hatch cut in it over the ramp), walls round each room with
 *   a doorway to the next (the nose wall of a room with windows its glass, seen through), the well of the ramp, a console,
 *   a seat and a lit screen for each seat, reactors glowing, lamps; Ceiling(plan, tools)
 *   its ceilings (a model of their own: a view cut away leaves them out); Ramp(plan, tools) the ramp and the legs.
 * - Define(models, ship, hull) defines the models of its inside, ceiling and ramp once ({Inside, Ceiling, Ramp, Plan}).
 *
 * Regression: the rooms were laid out by the class alone, larger than the hull of a ship, open at the top; the hull was
 * not drawn while one was inside and the sky lit them as a house with no roof.
 */
Elemenx.Service('SceneInteriors', {
	$Meta: {
		Description: 'The inside of a ship to walk in: rooms laid out by its class (cockpit, bridge, corridor, engine room, cargo, hangar) fitted into its hull, consoles for its roles, a hatch and a ramp, its legs.',
		Methods: ['ClassOf(length)', 'GearOf(ship)', 'Hull(pieces, options)', 'Plan(ship, hull)', 'Solid(plan, hull, point, radius)', 'Parts(plan, tools)', 'Ceiling(plan, tools)', 'Ramp(plan, tools)', 'Define(models, ship, hull)']
	},

	$OnCreate: function () {
		this.Table = Object.assign({Deck: {}, Colors: {}, Drop: [], Classes: []}, Elemenx.Resources('Data', 'ElemenxGraphics/interiors/classes') || {});
	},

	ClassOf: function (length) {
		var classes = this.Table.Classes || [];
		var found = classes.filter(function (one) {
			return Number(length) <= Number(one.Most);
		})[0];

		return found || classes[classes.length - 1] || {Name: 'small', Entry: 'ramp', Rooms: []};
	},

	GearOf: function (ship) {
		return Number(this.kindOf(ship || {}).Gear) || 0;
	},

	/* The class of a ship: its own (Interior.Class), else of its length. */
	kindOf: function (ship) {
		var own = ship.Interior || {};
		var kind = own.Class ? (this.Table.Classes || []).filter(function (one) {
			return one.Name === own.Class;
		})[0] : null;

		return kind || this.ClassOf(Number(ship.Length) || 30);
	},

	Hull: function (pieces, options) {
		var given = options || {};
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];
		var cell;
		var nx;
		var nz;
		var bottom;
		var top;
		var i;

		pieces.forEach(function (piece) {
			var positions = piece.Positions;

			for (var at = 0; at < positions.length; at += 3)
				for (var axis = 0; axis < 3; axis++) {
					low[axis] = Math.min(low[axis], positions[at + axis]);
					high[axis] = Math.max(high[axis], positions[at + axis]);
				}
		});

		if (!isFinite(low[0])) return null;

		cell = Number(given.Cell) || Math.max(0.2, Math.min(2, (high[2] - low[2]) / 160));
		nx = Math.max(1, Math.ceil((high[0] - low[0]) / cell));
		nz = Math.max(1, Math.ceil((high[2] - low[2]) / cell));
		bottom = new Float32Array(nx * nz);
		top = new Float32Array(nx * nz);

		for (i = 0; i < nx * nz; i++) {
			bottom[i] = Infinity;
			top[i] = -Infinity;
		}

		/* Each triangle over the middles of the columns under it: the height of it there, the lowest and the highest kept. */
		pieces.forEach(function (piece) {
			var p = piece.Positions;
			var list = piece.Indices;
			var count = list ? list.length : p.length / 3;
			var t;

			for (t = 0; t + 2 < count; t += 3) {
				var a = (list ? list[t] : t) * 3;
				var b = (list ? list[t + 1] : t + 1) * 3;
				var c = (list ? list[t + 2] : t + 2) * 3;
				var ax = p[a];
				var az = p[a + 2];
				var bx = p[b];
				var bz = p[b + 2];
				var cx = p[c];
				var cz = p[c + 2];
				var area = (bx - ax) * (cz - az) - (cx - ax) * (bz - az);
				if (Math.abs(area) < 1e-9) continue;

				var i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - low[0]) / cell - 0.5));
				var i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, bx, cx) - low[0]) / cell - 0.5));
				var k0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - low[2]) / cell - 0.5));
				var k1 = Math.min(nz - 1, Math.ceil((Math.max(az, bz, cz) - low[2]) / cell - 0.5));

				for (var k = k0; k <= k1; k++) {
					var z = low[2] + (k + 0.5) * cell;

					for (var column = i0; column <= i1; column++) {
						var x = low[0] + (column + 0.5) * cell;
						var u = ((bx - x) * (cz - z) - (cx - x) * (bz - z)) / area;
						var v = ((cx - x) * (az - z) - (ax - x) * (cz - z)) / area;
						var w = 1 - u - v;
						if (u < -1e-6 || v < -1e-6 || w < -1e-6) continue;

						var y = u * p[a + 1] + v * p[b + 1] + w * p[c + 1];
						var index = k * nx + column;
						if (y < bottom[index])
							bottom[index] = y;

						if (y > top[index])
							top[index] = y;
					}
				}
			}
		});

		return {Cell: cell, X: low[0], Z: low[2], NX: nx, NZ: nz, Bottom: bottom, Top: top, Low: low, High: high};
	},

	Plan: function (ship, hull) {
		var given = ship || {};
		var own = given.Interior || {};
		var table = this.Table;
		var deck = Object.assign({Floor: 1.6, Slab: 0.2, Wall: 0.2, Height: 3.2, Door: 1.6, DoorHeight: 2.3, Ramp: 3, Skin: 0.3, Slope: 0.45, Lamp: 6}, table.Deck || {});
		var chosen = this.kindOf(given);
		var canopy = (own.Entry || chosen.Entry) === 'canopy';
		var rooms = (own.Rooms || chosen.Rooms || []).map(function (room) {
			return Object.assign({}, room, {Length: Number(room.Length) || 4, Width: Number(room.Width) || 3});
		});
		var reactors = Math.max(1, Math.min(4, Number(given.Reactors) || 1));
		var plan = {Class: chosen.Name, Entry: own.Entry || chosen.Entry || 'ramp', Fitted: false, Rooms: [], Doors: [], Seats: [], Ramp: null, Free: [], Opening: null, Well: [], Lamps: [], Legs: [], Gear: Number(chosen.Gear) || 0, Reactors: reactors, Deck: deck, Colors: table.Colors || {}};
		var counts = {};
		var widths;
		var lengths;
		var fit = hull ? this.fit(hull, deck, canopy) : null;
		var floor = deck.Floor;
		var height = deck.Height;
		var front;
		var z;

		/* In a hull: the rooms along where it holds most of them, as many as there is length for. */
		if (fit) {
			var span = fit.Front - fit.Back;
			var drop = (table.Drop || []).slice();
			var least = function (room) {
				return Math.max(canopy ? 1.6 : 2.5, room.Length * 0.6);
			};
			var sum = function (list, of) {
				return list.reduce(function (total, room) {
					return total + of(room);
				}, 0);
			};

			/* Rooms left out before the rest are squeezed by more than a fifth. */
			while (sum(rooms, function (room) {
				return Math.max(least(room), room.Length * 0.8);
			}) > span && drop.length) {
				var gone = drop.shift();

				rooms = rooms.filter(function (room, index) {
					return index === 0 || room.Kind !== gone || room.Ramp || room.Reactors;
				});
			}

			/* Too short for all that is left: its cockpit alone, as long as the hull holds. */
			if (sum(rooms, least) > span) {
				rooms = [Object.assign({}, rooms[0], {Length: span, Ramp: false})];
				plan.Entry = 'canopy';
			}

			var wanted = sum(rooms, function (room) {
				return room.Length;
			});
			var shortest = sum(rooms, least);
			var grow = wanted <= span ? Math.min(2.5, span / wanted) : 1;
			var share = wanted > span ? (span - shortest) / Math.max(1e-6, wanted - shortest) : 0;

			lengths = rooms.map(function (room) {
				return wanted <= span ? room.Length * grow : least(room) + (room.Length - least(room)) * share;
			});

			floor = fit.Floor;
			height = fit.Height;
			plan.Skin = fit.Skin;
			front = fit.Front;
			plan.Fitted = true;

			/* Each as wide as the hull is all along it (its class's width, more in a long hull; a corridor, a lift as they are). */
			z = front;
			widths = rooms.map(function (room, index) {
				var made = Math.min(fit.WidthAt(z - lengths[index], z), room.Width * (room.Kind === 'corridor' || room.Kind === 'lift' ? 1 : Math.max(1, grow)));

				z -= lengths[index];

				return made;
			});
		}
		else {
			lengths = rooms.map(function (room) {
				return room.Length;
			});
			widths = rooms.map(function (room) {
				return room.Width;
			});
			front = lengths.reduce(function (total, one) {
				return total + one;
			}, 0) / 2;
		}

		if (!rooms.length || hull && !fit)
			return Object.assign(plan, {Fitted: !!hull, Floor: floor, Height: height, Length: 0, Width: 0});

		plan.Floor = floor;
		plan.Height = height;

		/* Nose first: the first room at the front (+z), each after it further back. */
		z = front;

		rooms.forEach(function (room, index) {
			var length = lengths[index];
			var width = widths[index];
			var made = {Kind: room.Kind || 'room', Low: [-width / 2, floor, z - length], High: [width / 2, floor + height, z], Ramp: !!room.Ramp && plan.Entry === 'ramp', Reactors: !!room.Reactors, Index: index, Windows: room.Windows};
			var seats = room.Seats || [];

			seats.forEach(function (role, at) {
				var x = (at - (seats.length - 1) / 2) * Math.min(1.8, (width - 1) / Math.max(1, seats.length));
				var ahead = z - deck.Wall - 0.4;

				counts[role] = (counts[role] || 0) + 1;

				plan.Seats.push({
					ID: role + (counts[role] > 1 ? '-' + counts[role] : ''),
					Role: role,
					Console: [x, floor, ahead - 0.25],
					At: [x, floor + 0.5, ahead - 1.1],
					Exit: [x, floor, ahead - 1.9],
					Room: index,
					Controls: role === 'pilot'
				});
			});

			plan.Rooms.push(made);

			/* Within its walls, one may be. */
			plan.Free.push({Low: [made.Low[0] + deck.Wall, floor, made.Low[2] + deck.Wall], High: [made.High[0] - deck.Wall, floor + height, made.High[2] - deck.Wall]});

			/* Its lamps along its ceiling, one each Lamp metres. */
			var lamps = Math.max(1, Math.round(length / deck.Lamp));

			for (var l = 0; l < lamps; l++)
				plan.Lamps.push({At: [0, floor + height - 0.2, z - length * (l + 0.5) / lamps], Color: plan.Colors.Lamp || [2.4, 2.3, 2.1], Power: 0.5, Radius: Math.max(4, Math.min(14, Math.max(width, length / lamps) * 1.3))});

			/* A doorway to the room before it: through both walls. */
			if (index > 0) {
				var door = Math.min(deck.Door, width - deck.Wall * 2, plan.Rooms[index - 1].High[0] * 2 - deck.Wall * 2);

				plan.Doors.push({At: [0, floor, z], Width: door});
				plan.Free.push({Low: [-door / 2, floor, z - deck.Wall - 0.9], High: [door / 2, floor + Math.min(deck.DoorHeight, height), z + deck.Wall + 0.9]});
			}

			z -= length;
		});

		/*
		 * The ramp: down from a hatch in the floor of the room that opens on one, toward the tail, to the ground under it (as
		 * steep as Slope); the hull over the way down cut away (Opening), so that a walker goes up it into the room.
		 */
		plan.Rooms.forEach(function (room) {
			if (!room.Ramp || plan.Ramp) return;

			var half = Math.min(deck.Ramp, room.High[0] * 2 - deck.Wall * 2 - 0.4) / 2;
			var run = Math.max(1.5, floor / deck.Slope);
			var inside = Math.min(room.High[2] - room.Low[2] - deck.Wall - 0.8, run);
			var upper = room.Low[2] + deck.Wall + inside;
			var lower = upper - run;

			plan.Ramp = {Low: [-half, 0, lower], High: [half, floor, upper], Top: [0, floor, upper], Bottom: [0, 0, lower], Hatch: {Low: [-half, floor - deck.Slab, Math.max(room.Low[2], lower)], High: [half, floor, upper]}};
			plan.Opening = {Low: [-half - 0.2, -1, lower - 0.5], High: [half + 0.2, floor, upper + 0.05]};

			plan.Free.push({Low: [-half, -1, lower - 1.5], High: [half, floor + Math.min(deck.DoorHeight, height), upper]});
		});

		plan.Well = hull && plan.Ramp ? this.well(plan, hull) : [];

		/* Its legs, where its belly is, a quarter in from its ends and its sides. */
		if (hull && plan.Gear) {
			[[-0.25, 0.25], [0.25, 0.25], [-0.25, 0.75], [0.25, 0.75]].forEach(function (where) {
				var x = (hull.Low[0] + hull.High[0]) / 2 + (hull.High[0] - hull.Low[0]) * where[0];
				var zz = hull.Low[2] + (hull.High[2] - hull.Low[2]) * where[1];
				var belly = this.columnOf(hull, x, zz);
				if (belly >= 0 && isFinite(hull.Bottom[belly]))
					plan.Legs.push([x, zz, hull.Bottom[belly]]);
			}, this);
		}

		plan.Length = front - z;
		plan.Width = Math.max.apply(null, widths);

		return plan;
	},

	/*
	 * The well of the way down through a hull: walls at its sides and its front from its belly up to the floor, and a ceiling
	 * over the part of it behind the hatch where a head passes under it; from the way up (and from under the ship) the inside of
	 * the hull is not seen. [{Low, High}] boxes. Regression: the view going up the ramp looked into the hull round it.
	 */
	well: function (plan, hull) {
		var self = this;
		var deck = plan.Deck;
		var ramp = plan.Ramp;
		var wall = deck.Wall;
		var top = plan.Floor - deck.Slab;
		var half = ramp.High[0];
		var run = ramp.High[2] - ramp.Low[2];
		var step = Math.max(0.5, hull.Cell);
		var boxes = [];
		var from;

		/* The lowest of the belly over x from z to z (Infinity where no hull is). */
		function belly (x, z0, z1) {
			var low = Infinity;

			for (var z = z0; z <= z1 + 1e-6; z += hull.Cell / 2) {
				var column = self.columnOf(hull, x, Math.min(z, z1));
				if (column >= 0)
					low = Math.min(low, hull.Bottom[column]);
			}

			return low;
		}

		for (from = ramp.Low[2]; from < ramp.High[2] - 1e-6; from += step) {
			var to = Math.min(ramp.High[2], from + step);
			/* The ramp at the far end of the step, and a head over it. */
			var head = (to - ramp.Low[2]) / run * plan.Floor + 2.2;
			var over = Math.min(belly(-half, from, to), belly(0, from, to), belly(half, from, to));

			[-1, 1].forEach(function (side) {
				var x = side * (half + wall / 2 + 0.05);
				var bottom = belly(x, from, to);
				if (bottom < top)
					boxes.push({Low: [x - wall / 2, bottom - 0.1, from], High: [x + wall / 2, top, to]});
			});

			if (to <= ramp.Hatch.Low[2] + 1e-6 && head < top - deck.Slab && over < top)
				boxes.push({Low: [-half - wall - 0.05, top - deck.Slab, from], High: [half + wall + 0.05, top, to]});
		}

		/* Its front, under the floor where the ramp comes up into the room. */
		var front = Math.min(belly(-half, ramp.High[2], ramp.High[2] + wall), belly(half, ramp.High[2], ramp.High[2] + wall));
		if (front < top)
			boxes.push({Low: [-half - wall - 0.05, front - 0.1, ramp.High[2]], High: [half + wall + 0.05, top, ramp.High[2] + wall]});

		return boxes;
	},

	/* The column of a hull over (x, z); -1 out of it. */
	columnOf: function (hull, x, z) {
		var i = Math.floor((x - hull.X) / hull.Cell);
		var k = Math.floor((z - hull.Z) / hull.Cell);

		return i < 0 || k < 0 || i >= hull.NX || k >= hull.NZ ? -1 : k * hull.NX + i;
	},

	/*
	 * Where in a hull most room is: of a floor and a height of rooms (as tall as a deck, lower where it must be; a cockpit as
	 * low as one sits), the rows of columns along its length where the hull holds them over its skin on both sides of its
	 * middle, the longest stretch of them, the most of floor by height (a floor high over the ground less: its ramp long).
	 * {Floor, Height, Back, Front, WidthAt(from, to)}; null where nothing fits.
	 */
	fit: function (hull, deck, canopy) {
		var cell = hull.Cell;
		/* A cockpit is a shell of its own under its canopy: a thinner skin round it. */
		var skin = canopy ? Math.min(0.12, deck.Skin) : deck.Skin;
		var slab = deck.Slab;
		var middle = Math.max(0, Math.min(hull.NX - 1, Math.floor(-hull.X / cell)));
		var narrowest = canopy ? 0.9 : 2.4;
		var heights = canopy ? [1.6, 1.4, 1.2, 1.0] : [deck.Height, 2.9, 2.6, 2.3];
		var lowest = Infinity;
		var highest = -Infinity;
		var best = null;
		var i;

		for (i = 0; i < hull.Bottom.length; i++)
			if (isFinite(hull.Bottom[i])) {
				lowest = Math.min(lowest, hull.Bottom[i]);
				highest = Math.max(highest, hull.Top[i]);
			}

		if (!isFinite(lowest)) return null;

		/* How far out from its middle a row holds a room of that floor and height, to both sides. */
		function halfOf (k, floor, height) {
			var steps = 0;

			function holds (column) {
				var index = k * hull.NX + column;

				return column >= 0 && column < hull.NX && hull.Bottom[index] <= floor - slab - skin && hull.Top[index] >= floor + height + skin;
			}

			while (holds(middle + steps) && holds(middle - steps))
				steps++;

			/* To the near edge of the first column that does not hold, on the nearer side, less the skin. */
			return steps ? Math.max(0, Math.min(hull.X + (middle + steps) * cell, -(hull.X + (middle - steps + 1) * cell)) - skin) : 0;
		}

		heights.forEach(function (height) {
			for (var floor = lowest + skin + slab; floor + height + skin <= highest; floor += 0.25) {
				var halves = [];
				var start = -1;
				var area = 0;
				var k;

				for (k = 0; k <= hull.NZ; k++) {
					var half = k < hull.NZ ? halfOf(k, floor, height) : 0;

					halves.push(half);

					if (half * 2 >= narrowest) {
						if (start < 0) {
							start = k;
							area = 0;
						}

						area += half * 2 * cell;

						continue;
					}

					if (start >= 0) {
						var score = area * height / (1 + 0.08 * Math.max(0, floor));
						if (!best || score > best.Score)
							best = {Score: score, Floor: floor, Height: height, From: start, To: k - 1, Halves: halves.slice()};
					}

					start = -1;
				}
			}
		});

		if (!best)
			return null;

		var back = hull.Z + best.From * cell + skin;
		var front = hull.Z + (best.To + 1) * cell - skin;

		return {
			Skin: skin,
			Floor: best.Floor,
			Height: best.Height,
			Back: back,
			Front: front,
			/* How wide a room may be from z to z: the narrowest of the rows along it. */
			WidthAt: function (from, to) {
				var k0 = Math.max(best.From, Math.floor((from - hull.Z) / cell));
				var k1 = Math.min(best.To, Math.floor((to - hull.Z) / cell));
				var narrow = Infinity;

				for (var k = k0; k <= k1; k++)
					narrow = Math.min(narrow, best.Halves[k] * 2);

				return isFinite(narrow) ? Math.max(narrowest, narrow) : narrowest;
			}
		};
	},

	Solid: function (plan, hull, point, radius) {
		var r = Number(radius) || 0;
		var x = point[0];
		var y = point[1];
		var z = point[2];
		var self = this;
		var i;

		for (i = 0; i < plan.Free.length; i++) {
			var box = plan.Free[i];
			if (x > box.Low[0] + r && x < box.High[0] - r && y > box.Low[1] + r && y < box.High[1] - r && z > box.Low[2] + r && z < box.High[2] - r) return false;
		}

		/* Of a hull: in its skin (over the lowest of it, under the highest) at the ball or round it, unless cut away. */
		if (hull) {
			return [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(function (off) {
				var column = self.columnOf(hull, x + off[0], z + off[1]);
				var opening = plan.Opening;

				if (column < 0 || !(y >= hull.Bottom[column] - r && y <= hull.Top[column] + r)) return false;

				return !(opening && x + off[0] > opening.Low[0] && x + off[0] < opening.High[0] && y > opening.Low[1] && y < opening.High[1] && z + off[1] > opening.Low[2] && z + off[1] < opening.High[2]);
			});
		}

		/* Of no hull: its rooms within their walls, floor and ceiling. */
		return plan.Rooms.some(function (room) {
			return x > room.Low[0] - r && x < room.High[0] + r && y > room.Low[1] - plan.Deck.Slab - r && y < room.High[1] + plan.Deck.Slab + r && z > room.Low[2] - r && z < room.High[2] + r;
		});
	},

	/*
	 * The windows of a plan: the glass across the nose wall of a room with windows (a cockpit, a bridge; Windows of the room
	 * says otherwise), what is outside seen through it: [{Low, High}] of the glass, in metres of the inside.
	 */
	WindowsOf: function (plan) {
		var deck = plan.Deck;
		var height = plan.Height;
		var floor = plan.Floor;

		return plan.Rooms.filter(function (room) {
			var windows = room.Windows === undefined ? room.Kind === 'cockpit' || room.Kind === 'bridge' : !!room.Windows;

			return windows && !plan.Doors.some(function (one) {
				return Math.abs(one.At[2] - room.High[2]) < 1e-6;
			});
		}).map(function (room) {
			var low = room.Low[0] + deck.Wall;
			var high = room.High[0] - deck.Wall;
			var post = Math.min(0.3, (high - low) * 0.08);
			var z = room.High[2] - deck.Wall / 2;

			return {Low: [low + post, floor + Math.min(1, height * 0.35), z - 0.015], High: [high - post, floor + height - Math.min(0.35, height * 0.15), z + 0.015]};
		});
	},

	Parts: function (plan, tools) {
		var deck = plan.Deck;
		var colors = plan.Colors;
		var parts = [];
		var height = plan.Height;
		var floor = plan.Floor;
		var hatch = plan.Ramp ? plan.Ramp.Hatch : null;

		function color (name, fallback) {
			return colors[name] || fallback;
		}

		/* A slab from x0 to x1 and z0 to z1 (its top at y). */
		function slab (x0, x1, z0, z1, y, name) {
			if (x1 - x0 > 0.01 && z1 - z0 > 0.01)
				parts.push(tools.Box(x1 - x0, deck.Slab, z1 - z0, [(x0 + x1) / 2, y - deck.Slab / 2, (z0 + z1) / 2], color(name)));
		}

		/* A wall across a room (x from low to high, its middle at z), a doorway of width door in its middle (0: none). */
		function across (low, high, z, door) {
			var y = floor + height / 2;
			var half = door / 2;
			var top = Math.min(deck.DoorHeight, height);

			if (!door) {
				parts.push(tools.Box(high - low, height, deck.Wall, [(low + high) / 2, y, z], color('Wall')));

				return;
			}

			if (-half - low > 0.01)
				parts.push(tools.Box(-half - low, height, deck.Wall, [(low - half) / 2, y, z], color('Wall')));

			if (high - half > 0.01)
				parts.push(tools.Box(high - half, height, deck.Wall, [(high + half) / 2, y, z], color('Wall')));

			/* Over the doorway, a lintel. */
			if (height - top > 0.01)
				parts.push(tools.Box(door, height - top, deck.Wall, [0, floor + top + (height - top) / 2, z], color('Trim')));
		}

		/*
		 * The nose wall of a room with windows (a cockpit, a bridge; Windows of the room says otherwise): a band of glass across
		 * it from a sill to under its ceiling, posts at its sides, what is outside seen through it.
		 */
		function glazed (low, high, z, glass) {
			var sill = glass.Low[1];
			var top = glass.High[1];
			var post = glass.Low[0] - low;
			var y = floor + height / 2;

			parts.push(tools.Box(high - low, sill - floor, deck.Wall, [(low + high) / 2, (floor + sill) / 2, z], color('Wall')));
			parts.push(tools.Box(high - low, floor + height - top, deck.Wall, [(low + high) / 2, (top + floor + height) / 2, z], color('Trim')));
			parts.push(tools.Box(post, height, deck.Wall, [low + post / 2, y, z], color('Trim')));
			parts.push(tools.Box(post, height, deck.Wall, [high - post / 2, y, z], color('Trim')));
			parts.push(Object.assign(tools.Box(glass.High[0] - glass.Low[0], top - sill, 0.03, [(glass.Low[0] + glass.High[0]) / 2, (sill + top) / 2, z], color('Glass', [0.55, 0.7, 0.8])), {Glass: true}));
		}

		var windows = this.WindowsOf(plan);

		plan.Rooms.forEach(function (room) {
			var low = room.Low;
			var high = room.High;
			var length = high[2] - low[2];
			var glass = windows.filter(function (one) {
				return Math.abs(one.High[2] - 0.015 - (high[2] - deck.Wall / 2)) < 1e-6 && one.Low[0] > low[0] && one.High[0] < high[0];
			})[0];
			var middle = (low[2] + high[2]) / 2;
			var before = plan.Doors.filter(function (one) {
				return Math.abs(one.At[2] - high[2]) < 1e-6;
			})[0];
			var after = plan.Doors.filter(function (one) {
				return Math.abs(one.At[2] - low[2]) < 1e-6;
			})[0];

			/* Its floor, round the hatch where the ramp comes up. */
			if (room.Ramp && hatch) {
				slab(low[0], hatch.Low[0], low[2], high[2], floor, 'Floor');
				slab(hatch.High[0], high[0], low[2], high[2], floor, 'Floor');
				slab(hatch.Low[0], hatch.High[0], hatch.High[2], high[2], floor, 'Floor');
				slab(hatch.Low[0], hatch.High[0], low[2], hatch.Low[2], floor, 'Floor');
			}
			else {
				slab(low[0], high[0], low[2], high[2], floor, 'Floor');
			}

			/* Its sides, inside its bounds. */
			parts.push(tools.Box(deck.Wall, height, length, [low[0] + deck.Wall / 2, floor + height / 2, middle], color('Wall')));
			parts.push(tools.Box(deck.Wall, height, length, [high[0] - deck.Wall / 2, floor + height / 2, middle], color('Wall')));

			/* Its front and its back: a doorway to the room before and after it, closed at the nose and at the tail. */
			if (glass) glazed(low[0] + deck.Wall, high[0] - deck.Wall, high[2] - deck.Wall / 2, glass);
			else across(low[0] + deck.Wall, high[0] - deck.Wall, high[2] - deck.Wall / 2, before ? before.Width : 0);

			across(low[0] + deck.Wall, high[0] - deck.Wall, low[2] + deck.Wall / 2, after ? after.Width : 0);

			/* Its reactors, glowing columns along its middle. */
			if (room.Reactors) {
				var width = high[0] - low[0];
				var count = plan.Reactors;
				var r;

				for (r = 0; r < count; r++)
					parts.push(tools.Cylinder(Math.min(1, width / (count * 3)), Math.min(1, width / (count * 3)), height * 0.8, [(r - (count - 1) / 2) * width / (count + 1), floor + height * 0.4, middle], color('Reactor'), null, 12));
			}
		});

		/* The well of the way down through the hull. */
		plan.Well.forEach(function (box) {
			parts.push(tools.Box(box.High[0] - box.Low[0], box.High[1] - box.Low[1], box.High[2] - box.Low[2], [(box.Low[0] + box.High[0]) / 2, (box.Low[1] + box.High[1]) / 2, (box.Low[2] + box.High[2]) / 2], color('Trim')));
		});

		/* Its lamps: panels under the ceiling, lit. */
		plan.Lamps.forEach(function (lamp) {
			parts.push(tools.Box(1.2, 0.05, 0.4, [lamp.At[0], floor + height - 0.03, lamp.At[2]], color('Lamp')));
		});

		/* A console, a seat and its lit screen for each seat. */
		plan.Seats.forEach(function (seat) {
			parts.push(tools.Box(1.1, 1, 0.5, [seat.Console[0], seat.Console[1] + 0.5, seat.Console[2]], color('Console')));
			parts.push(tools.Box(0.9, 0.5, 0.05, [seat.Console[0], seat.Console[1] + 1.25, seat.Console[2] - 0.05], color('Screen')));
			parts.push(tools.Box(0.6, 0.45, 0.6, [seat.At[0], seat.At[1] - 0.25, seat.At[2]], color('Seat')));
			parts.push(tools.Box(0.6, 0.8, 0.12, [seat.At[0], seat.At[1] + 0.35, seat.At[2] - 0.3], color('Seat')));
		});

		return parts.length ? [tools.Piece('inside', parts)] : [];
	},

	Ceiling: function (plan, tools) {
		var parts = [];
		var deck = plan.Deck;

		plan.Rooms.forEach(function (room) {
			parts.push(tools.Box(room.High[0] - room.Low[0], deck.Slab, room.High[2] - room.Low[2], [(room.Low[0] + room.High[0]) / 2, room.High[1] + deck.Slab / 2, (room.Low[2] + room.High[2]) / 2], plan.Colors.Ceiling || [0.42, 0.45, 0.5]));
		});

		return parts.length ? [tools.Piece('ceiling', parts)] : [];
	},

	Ramp: function (plan, tools) {
		var ramp = plan.Ramp;
		var parts = [];
		var rise;
		var run;
		var tilt;

		if (ramp) {
			rise = ramp.High[1] - ramp.Low[1];
			run = ramp.High[2] - ramp.Low[2];
			/* Down toward the tail: its back end on the ground, its front at the deck (a turn about x lowers +z: so the other way). */
			tilt = -Math.atan2(rise, run) * 180 / Math.PI;

			parts.push(tools.Box(ramp.High[0] - ramp.Low[0], 0.15, Math.sqrt(rise * rise + run * run), [0, rise / 2 - 0.075, (ramp.Low[2] + ramp.High[2]) / 2], plan.Colors.Trim || [0.36, 0.39, 0.44], [tilt, 0, 0]));
		}

		/* Its legs: from the ground up into its belly, a foot under each. */
		plan.Legs.forEach(function (leg) {
			var thick = Math.max(0.15, Math.min(1.2, plan.Gear * 0.08));

			parts.push(tools.Cylinder(thick, thick, leg[2] + 0.3, [leg[0], (leg[2] + 0.3) / 2, leg[1]], plan.Colors.Gear || [0.3, 0.32, 0.35], null, 10));
			parts.push(tools.Cylinder(thick * 2.4, thick * 2.4, 0.2, [leg[0], 0.1, leg[1]], plan.Colors.Gear || [0.3, 0.32, 0.35], null, 14));
		});

		return parts.length ? [tools.Piece('ramp', parts)] : [];
	},

	Define: function (models, ship, hull) {
		var self = this;
		var plan = this.Plan(ship, hull);
		var shape = hull ? [Math.round(hull.Low[1] * 10), Math.round(hull.High[1] * 10), Math.round((hull.High[2] - hull.Low[2]) * 10), Math.round((hull.High[0] - hull.Low[0]) * 10), hull.NX, hull.NZ] : null;
		var key = 'interior:' + plan.Class + ':' + JSON.stringify([ship && ship.Interior || null, plan.Reactors, Math.round(Number(ship && ship.Length) || 0), shape]).replace(/[^A-Za-z0-9]+/g, '-');

		if (!plan.Rooms.length)
			return {Inside: '', Ceiling: '', Ramp: '', Plan: plan};

		if (!models.Has(key + ':inside'))
			models.Define(key + ':inside', {Group: 'interiors', Type: 'thing', Size: 1, Build: function (tools) {
				return self.Parts(plan, tools);
			}});

		if (!models.Has(key + ':ceiling'))
			models.Define(key + ':ceiling', {Group: 'interiors', Type: 'thing', Size: 1, Build: function (tools) {
				return self.Ceiling(plan, tools);
			}});

		if ((plan.Ramp || plan.Legs.length) && !models.Has(key + ':ramp'))
			models.Define(key + ':ramp', {Group: 'interiors', Type: 'thing', Size: 1, Build: function (tools) {
				return self.Ramp(plan, tools);
			}});

		return {Inside: key + ':inside', Ceiling: key + ':ceiling', Ramp: plan.Ramp || plan.Legs.length ? key + ':ramp' : '', Plan: plan};
	}
});
