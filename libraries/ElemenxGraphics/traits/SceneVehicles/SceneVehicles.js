/*
 * Vehicles: what is driven. An object with Vehicle {Kind, ...} under the keys (Control) goes by its kind: a car on the ground, a ship
 * in space. Their ways of moving are in Vehicles of the scene, by kind, and Vehicles({Kind: step}) adds more: step(hero, keys, elapsed).
 * How they move is the Physics service, in steps of its own: what shows is a blend of the last two, so nothing shakes at any pace.
 *
 * A car, besides the settings of Physics.Car: Yaw (the turn of its model, degrees), Heading, Seat ([x, y, z] of the eyes), Wheels (a word for what of its model, by the name of a node or of its material,
 * is a wheel). A car drives on the roads of the scene (kind road): the grip and drag of what is under each wheel, a strip, a kerb,
 * a junction or the ground. W gives gas, S brakes and goes back, A and D steer, Space is the brake, Shift lets the rear go for a drift, C is the hand brake. Wheels spin, the front ones
 * steer, and each goes up and down on its spring.
 *
 * A ship, besides those of Physics.Ship: Yaw, Facing ([x, y, z] it looks at first), Follow ([back, up] of the view, in its size), Around
 * (the ID of the body it goes by and must stay out of), From ([x, y, z] from that body, in its size); in real sizes (Scale real of the
 * Scene) Length (metres: how large it is), Speed (m/s, 3000, near the body) and Cruise (how many times faster far from it,
 * 1000, from 60 000 km over it, as the root of how high it is) in place of Top. The keys fly it: A and D or the
 * arrows turn it, R and F or the arrows up and down pitch it, Q and E roll, W and S set its speed, C and X lift it up and down, Shift
 * boosts, Space brings all of it to rest. The mouse only looks round it. Its Thrust goes to what burns on it. H takes it into warp and
 * J jumps (Travel(id, kind, options, callback)), with Warp and Jump of its Vehicle: {To, Length, Enter, Inside, Exit, Tint}.
 *
 * A boat, besides the settings of Physics.Boat (Power, Top, Turn, Length, Width, Draft, Plane, Lean): Yaw, Heading, Seat. It
 * floats on the sea of the ground, on its waves (SceneWaves), at its four ends; W gives it the motor, S goes astern, A and D
 * turn the rudder, Space stops it; it runs aground where the bed comes up under it. It leaves foam behind it (the effect
 * wake), more as it goes faster, and throws up water at its bow when it goes fast (spray). The model boat of SceneModels
 * is one.
 *
 * A car stays off the barriers of the roads by all its corners (Long and Wide: half of its length and width), and a vehicle of any kind
 * meets what stands in its way: another vehicle, a craft, a body, a wall of a location.
 *
 * Openings of a vehicle are what moves on it: {Name, Match (a word of the materials; with Nodes: true, of the nodes too), Low, High (the box of
 * it in its model) or Disc ({At, Axis, Radius, Depth}: round an axis, as a steering wheel), Both (the same on the other side), Way ([x, y, z]),
 * Reach, Open}, or, turning, Hinge ([x, y, z]), Axis, Angle (degrees at 1), Aside and AsideAngle (a second axis); a pair hinged on both
 * sides turns each its own way, and so does what such a pair carries (Follow and Both: the glass of each door). A piece moves with one
 * opening, the first that takes it. OpenPart(id, name, amount) moves it, by degrees, on a car or a ship (its hatches). They need not be parts of the file. What the driver moves
 * has a Drive: steer, gas, brake, hand, gear (its Gates, {R, N, D, 1, 2...: [ahead, aside]}; an automatic's R, N, D and a manual's H by
 * default), sequential, paddle, indicator, wipers (Period; they go while it rains, or as Wipers of the vehicle says); Sign 1 or -1
 * keeps one way of it, Follow names the opening it is carried by (a paddle on the wheel), Pace how fast it comes (a second). A car with
 * Gears has a gearbox (Physics.Gearbox): Shift auto, or manual with E up and Q down.
 *
 * Lamps of a car are its lights: {Kind (head, rear, brake, reverse, indicator), Match and Low, High, Disc, Nodes, Both as an opening
 * has them (their glass, each side apart), At (where the light comes from on the left, mirrored; the middle of the glass if not
 * told), Color, Glow (how bright the glass glows), Power, Radius, Spot, Aim}. L switches the lights (Lights of the vehicle: auto
 * by default, on at dusk, at night and in rain or fog), Z and X the indicators, which go off as the wheel comes back, both the
 * hazard lights. A wet road holds WetGrip (0.75) of its grip.
 *
 * The roles of the parts of a model (ModelRoles, set in the tab Roles of a ModelEditor) are openings, lamps and wheels of
 * their own on any object of the model, a vehicle or not (the door of a house, a lever, a fan, a lamp over a porch): the
 * parts each names (pieces of it, or the triangles of one a brush painted) cut out as those of an opening are, moving as its
 * Motion says (hinge, slide, spin, glow), after the role it Follows. Parts(id) lists those of an object, Part(id, role) is
 * one: Get(), Set(value) (the scene emits part); what it is set to comes by degrees, at its Pace.
 *
 * Mirrors and Screens of a vehicle are panes in its model, {At, Normal (where it faces), Up, Width, Height}: a mirror shows the world
 * reflected by its plane (Every frames apart, 2, each on a frame of its own, as finely as the screen in the part of it it covers;
 * Tint, Blur, Strength), in the shape of its glass where a model of a file has it there (the triangles on its plane, Depth
 * off it, 0.03, facing as it faces), a pane otherwise. Seen from the seat it is set as a driver sets it, what it shows level;
 * View 'camera' (by itself where the body of the car stands in the way of what it shows, a car with no rear window) shows
 * what a camera behind the car sees, straight back; View 'mirror' never does. Seat ([x, y, z], of the vehicle by default)
 * is where the eye looks into it from. A screen shows what an element of the
 * page shows (Source: the data-screen of an element in the screens slot of the scene, drawn every Every seconds into Pixels
 * [width, height]; Bright). Only those of the vehicle that is driven are drawn.
 *
 * Mounts of a vehicle of any kind are what it is built of, each where its model says, in its size: {Kind, At: [x, y, z], Aim: [x, y, z],
 * Size, On, Mouth} and Type with what an effect takes (an effect that burns on it; Twist, degrees round the aim, leans it; Mouth, [width, height] or a radius, in its model, is the opening
 * it comes out of: it fills it with light, the jet is as wide as it is, and an engine lights what is round it as it burns), or Model and Turn ([x, y, z] degrees; a model that stands on
 * it). Kind is free: engine goes with the thrust, and burns as an exhaust if no Type is told; a game names its weapons, shields and
 * holds as it likes, and asks MountsOf(id, kind) where they stand now. Pop of a mount is a burst there when a car lets go of the gas at speed:
 * true for backfire, or {Type, Size, Every} (the seconds at least between two).
 */
Elemenx.Trait('SceneVehicles', {
	VehiclesStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var physics = this.$Service('Physics');
		var library = this.$Service('SceneModels');
		var self = this;

		var roles = this.$Service('ModelRoles');

		function given (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/*
		 * What moves on an object and what glows on it (its rig): the settings of its vehicle with the roles of the parts of its
		 * model (ModelRoles) after them, or the roles alone on what is no vehicle (the door of a house, a lever); null for what
		 * has neither. Made again when the roles change, or the settings of the vehicle.
		 */
		engine.RigOf = function (object) {
			var vehicle = object.Values.Vehicle;
			var name = object.Values.Model || object.Traits && object.Traits.Model && object.Traits.Model.Shape || '';
			var version = roles.Version();
			var made;

			if (object.Rig && object.Rig.Version === version && object.Rig.Of === vehicle && object.Rig.Name === name) return object.Rig.Made;

			made = roles.Rig(name ? roles.Get(name) : []);

			if (vehicle) made = Object.assign({}, vehicle, {Openings: (vehicle.Openings || []).concat(made.Openings), Lamps: (vehicle.Lamps || []).concat(made.Lamps), RoleWheels: made.Wheels, Source: vehicle});
			else if (made.Openings.length || made.Lamps.length || made.Wheels.length) made = {Rigged: true, Openings: made.Openings, Lamps: made.Lamps, RoleWheels: made.Wheels};
			else made = null;

			object.Rig = {Version: version, Of: vehicle, Name: name, Made: made};

			return made;
		};

		/* What of a model is a wheel, and where the middle of each of the four lies. */
		function wheelsOf (model, settings) {
			var found = {};
			var asset = model.Asset;
			var yaw = given(settings.Yaw, 0) * Math.PI / 180;
			var word = new RegExp(settings.Wheels || 'wheel|tire|tyre|rim', 'i');
			var held = new RegExp(settings.Held || 'cal+ipe|brake', 'i');
			var groups = {};
			var hung = {};

			if (!asset)
				return found;

			/* Wheels a role names: the pieces cut for each (wheel:<index>), at its corner. */
			if (settings.RoleWheels && settings.RoleWheels.length) {
				settings.RoleWheels.forEach(function (wheel, index) {
					var key = String(wheel.Corner || 'FL').toUpperCase();
					var low = [Infinity, Infinity, Infinity];
					var high = [-Infinity, -Infinity, -Infinity];
					var pieces = model.Pieces.filter(function (piece) {
						return piece.Opening === 'wheel:' + index;
					});

					pieces.forEach(function (piece) {
						var indices = piece.Geometry.Indices;
						var i;

						for (i = 0; i < indices.length; i += 3) {
							var at = placeOf(piece, indices[i]);

							[0, 1, 2].forEach(function (axis) {
								low[axis] = Math.min(low[axis], at[axis]);
								high[axis] = Math.max(high[axis], at[axis]);
							});
						}
					});

					pieces.forEach(function (piece) {
						found[piece.ID] = {Middle: [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2], Front: key.charAt(0) === 'F', Corner: Math.max(0, ['FL', 'FR', 'RL', 'RR'].indexOf(key)), Held: !!wheel.Held};
					});
				});

				return found;
			}

			/* What is no vehicle has only the wheels of its roles. */
			if (settings.Rigged) return found;

			function named (index) {
				var node = asset.Nodes[index];

				return word.test(node.Name) || node.Parent !== -1 && node.Parent !== undefined && word.test(asset.Nodes[node.Parent].Name);
			}

			/* Asked for by a word of its own, a wheel may be known by its material. */
			function painted (piece) {
				return !!settings.Wheels && !!piece.Material && word.test(piece.Material.Name);
			}

			model.Pieces.forEach(function (piece) {
				var fixed = held.test(piece.Material ? piece.Material.Name : '') || piece.Node !== undefined && held.test(asset.Nodes[piece.Node].Name);
				if (piece.Node === undefined || !fixed && !named(piece.Node) && !painted(piece)) return;

				var p = piece.Geometry.Positions;
				var low = [Infinity, Infinity, Infinity];
				var high = [-Infinity, -Infinity, -Infinity];
				var i;

				for (i = 0; i < p.length; i += 30) {
					var at = math.Apply(piece.Rest, [p[i], p[i + 1], p[i + 2]]);

					[0, 1, 2].forEach(function (axis) {
						low[axis] = Math.min(low[axis], at[axis]);
						high[axis] = Math.max(high[axis], at[axis]);
					});
				}

				var middle = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
				var ahead = middle[0] * Math.sin(yaw) + middle[2] * Math.cos(yaw);
				var aside = middle[0] * Math.cos(yaw) - middle[2] * Math.sin(yaw);
				var key = (ahead > 0 ? 'F' : 'R') + (aside > 0 ? 'L' : 'R');

				/* What stops a wheel turns with it and rides with it, and does not spin: it hangs on the middle of the wheel. */
				if (fixed) {
					hung[key] = (hung[key] || []).concat([piece.ID]);

					return;
				}

				groups[key] = groups[key] || {Low: low.slice(), High: high.slice(), Pieces: []};

				[0, 1, 2].forEach(function (axis) {
					groups[key].Low[axis] = Math.min(groups[key].Low[axis], low[axis]);
					groups[key].High[axis] = Math.max(groups[key].High[axis], high[axis]);
				});

				groups[key].Pieces.push(piece.ID);
			});

			Object.keys(groups).forEach(function (key) {
				var group = groups[key];
				var middle = [(group.Low[0] + group.High[0]) / 2, (group.Low[1] + group.High[1]) / 2, (group.Low[2] + group.High[2]) / 2];

				group.Pieces.forEach(function (id) {
					found[id] = {Middle: middle, Front: key.charAt(0) === 'F', Corner: ['FL', 'FR', 'RL', 'RR'].indexOf(key)};
				});

				(hung[key] || []).forEach(function (id) {
					found[id] = {Middle: middle, Front: key.charAt(0) === 'F', Corner: ['FL', 'FR', 'RL', 'RR'].indexOf(key), Held: true};
				});
			});

			return found;
		}

		/* The turn of a wheel in the space of its model: it spins round its axle, a front one first steers, and it rides on its spring. */
		engine.WheelTurn = function (object, wheel) {
			var settings = object.Values.Vehicle;
			var state = object.Car || {Spin: 0, Steer: 0};
			var yaw = given(settings.Yaw, 0) * Math.PI / 180;
			var axle = [Math.cos(yaw), 0, -Math.sin(yaw)];
			var spin = wheel.Held ? math.Identity() : math.Rotation(axle, state.Spin);
			var turn = wheel.Front ? math.Multiply(math.Rotation([0, 1, 0], state.Steer * 0.5), spin) : spin;
			var m = wheel.Middle;

			var strokes = object.Strokes || [0, 0, 0, 0];
			var drop = (strokes[wheel.Corner] || 0) / (object.Size || 1);

			return math.Multiply(math.Translation(m[0], m[1] - drop, m[2]), math.Multiply(turn, math.Translation(-m[0], -m[1], -m[2])));
		};

		engine.WheelsOf = wheelsOf;

		/* Where a place of a piece stands in its model. */
		function placeOf (piece, index) {
			var seen = piece.Placed || piece.Geometry;
			var p = seen.Positions;

			/* A piece of a model of shapes is in the space of its model already. */
			return piece.Rest ? math.Apply(piece.Rest, [p[index * 3], p[index * 3 + 1], p[index * 3 + 2]]) : [p[index * 3], p[index * 3 + 1], p[index * 3 + 2]];
		}

		/* Whether a piece's node, or one of the three above it, is named by a word: files name the node of a part, not its mesh. */
		function nodeNamed (model, piece, word) {
			var nodes = model.Asset ? model.Asset.Nodes : null;
			var index = piece.Node;
			var i;

			for (i = 0; nodes && index !== undefined && index !== -1 && nodes[index] && i < 4; i++) {
				if (word.test(nodes[index].Name || '')) return true;

				index = nodes[index].Parent;
			}

			return false;
		}

		/*
		 * What moves of a model becomes pieces of its own, once: triangles inside the box or the disc, of the materials it names (or
		 * of the nodes, with Nodes: true).
		 */
		engine.OpeningsOf = function (model, vehicle) {
			model.Openings = model.Openings || {};

			/* The glass of a lamp is cut out as an opening is, each side apart, and stays where it is. */
			(vehicle.Openings || []).concat((vehicle.Lamps || []).map(function (lamp, index) {
				return Object.assign({}, lamp, {Name: 'lamp-' + index, Lamp: true, Hinge: null, Follow: null});
			}), (vehicle.RoleWheels || []).map(function (wheel, index) {
				return {Name: 'wheel:' + index, Parts: wheel.Parts, Wheel: true};
			})).forEach(function (opening) {
				var word = new RegExp(opening.Match || '.', 'i');
				var low = opening.Low || [-Infinity, -Infinity, -Infinity];
				var high = opening.High || [Infinity, Infinity, Infinity];

				if (model.Openings[opening.Name]) return;

				model.Openings[opening.Name] = true;

				var disc = opening.Disc;
				var axis = disc ? vectors.Normalize(disc.Axis || [0, 0, 1]) : null;
				var parts = opening.Parts || null;

				model.Pieces.slice().forEach(function (piece) {
					var indices = piece.Geometry.Indices;
					var kept = [];
					var sides = {1: [], '-1': []};
					var i;

					/* The part of a role that names this piece: all of it, or the vertices a brush painted. */
					var part = parts ? parts.filter(function (each) {
						return each.Piece === (piece.Origin || piece.ID);
					})[0] : null;

					/* In the box (Both: on either side, x as its size), or in the disc round an axis (a steering wheel): Disc {At, Axis, Radius, Depth}. */
					function inside (index) {
						var at;
						var off;
						var along;

						if (part)
							return !part.Vertices || roles.Within(part.Vertices, index);

						at = placeOf(piece, index);

						if (disc) {
							off = vectors.Subtract(at, disc.At || [0, 0, 0]);
							along = vectors.Dot(off, axis);

							return Math.abs(along) <= given(disc.Depth, 0.1) / 2 && vectors.Length(vectors.Subtract(off, vectors.Scale(axis, along))) <= given(disc.Radius, 0.2);
						}

						return [0, 1, 2].every(function (axis) {
							var value = opening.Both && axis === 0 ? Math.abs(at[0]) : at[axis];

							return value >= low[axis] && value <= high[axis];
						});
					}

					/* A piece moves with one opening: what one took, the next leaves. */
					if (piece.Opening || (parts ? !part : !word.test(piece.Material ? piece.Material.Name : '') && !(opening.Nodes && nodeNamed(model, piece, word)))) return;

					for (i = 0; i + 2 < indices.length; i += 3) {
						var whole = inside(indices[i]) && inside(indices[i + 1]) && inside(indices[i + 2]);
						var side = (opening.Hinge || opening.Follow || opening.Lamp) && opening.Both && placeOf(piece, indices[i])[0] < 0 ? '-1' : 1;

						(whole ? sides[side] : kept).push(indices[i], indices[i + 1], indices[i + 2]);
					}

					if (!sides[1].length && !sides['-1'].length) return;

					piece.Geometry = Object.assign({}, piece.Geometry, {Indices: kept});

					/* A piece all of which moves is no longer a piece of its own. */
					if (!kept.length)
						model.Pieces.splice(model.Pieces.indexOf(piece), 1);

					/* What turns on hinges on both sides is two pieces, the other one turning the other way; so is what such a pair carries (the glass of a door). */
					[1, -1].forEach(function (side) {
						if (sides[side].length)
							model.Pieces.push(Object.assign({}, piece, {ID: piece.ID + '-' + opening.Name + (side < 0 ? '-other' : ''), Origin: piece.Origin || piece.ID, Opening: opening.Name, Side: side, Geometry: Object.assign({}, piece.Geometry, {Indices: sides[side]})}));
					});
				});
			});

			/* Where the glass of each lamp lies, on each side: the light comes from there. */
			model.LampPlaces = model.LampPlaces || {};

			(vehicle.Lamps || []).forEach(function (lamp, index) {
				var name = 'lamp-' + index;
				var sums = {};

				if (model.LampPlaces[name]) return;

				model.Pieces.forEach(function (piece) {
					var side = piece.Side || 1;
					var indices = piece.Geometry.Indices;
					var i;

					if (piece.Opening !== name) return;

					sums[side] = sums[side] || [0, 0, 0, 0];

					for (i = 0; i < indices.length; i++)
						sums[side] = vectors.Add(sums[side].slice(0, 3), placeOf(piece, indices[i])).concat([sums[side][3] + 1]);
				});

				model.LampPlaces[name] = {};

				Object.keys(sums).forEach(function (side) {
					model.LampPlaces[name][side] = vectors.Scale(sums[side].slice(0, 3), 1 / sums[side][3]);
				});
			});

			vehicle.LampPlaces = model.LampPlaces;

			/* The settings of the vehicle say where its lamps are too, as they did before its rig had roles. */
			if (vehicle.Source)
				vehicle.Source.LampPlaces = model.LampPlaces;
		};

		/*
		 * The glass of each mirror of a vehicle cut out of its model, once: the triangles of any material on the plane of the
		 * mirror (Depth, 0.03, off it), within its pane and half as much again round it, facing where it faces. They become
		 * a piece of their own with the Mirror of their index, keeping the opening they were on (a mirror on a door goes with
		 * it). {Glass (whether any was found: else the mirror is drawn as its pane), Camera, Rear} for each, in
		 * vehicle.MirrorShapes: Camera whether it shows what is behind as a camera would, from behind the car (View 'camera';
		 * by itself when the body of the car stands where the eye looks into it, as the engine of a car with no rear window),
		 * and Rear how far the car reaches behind its plane, where such a camera stands.
		 */
		engine.MirrorsOf = function (model, vehicle) {
			var mirrors = vehicle.Mirrors || [];
			var made;

			/* A model made of shapes, not of a file, has no glass to cut: its mirrors are panes. */
			if (!model.Asset) return;

			model.MirrorShapes = model.MirrorShapes || {};

			/* Each mirror its plane, its axes and the way the eye looks into it, in the space of the model. */
			made = mirrors.map(function (mirror, index) {
				var n = vectors.Normalize(mirror.Normal || [0, 0, -1]);
				var right = vectors.Normalize(vectors.Cross(mirror.Up || [0, 1, 0], n));
				var at = mirror.At || [0, 0, 0];
				var seat = mirror.Seat || vehicle.Seat || vectors.Subtract(at, vectors.Scale(n, 0.6));
				var look = vectors.Normalize(vectors.Subtract(at, seat));

				return model.MirrorShapes[index] ? null : {Index: index, Mirror: mirror, N: n, Right: right, Up: vectors.Cross(n, right), At: at, Depth: given(mirror.Depth, 0.03), Reach: [given(mirror.Width, 0.2) * 0.75, given(mirror.Height, 0.1) * 0.75], Seen: vectors.Subtract(look, vectors.Scale(n, 2 * vectors.Dot(look, n))), Found: 0, Rear: 0, Walls: []};
			}).filter(Boolean);

			if (!made.length) return;

			/* Whether a corner lies on the glass of a mirror: on its plane, within its pane and half as much again. */
			function onGlass (one, p) {
				var x = p[0] - one.At[0];
				var y = p[1] - one.At[1];
				var z = p[2] - one.At[2];

				return Math.abs(x * one.N[0] + y * one.N[1] + z * one.N[2]) <= one.Depth && Math.abs(x * one.Right[0] + y * one.Right[1] + z * one.Right[2]) <= one.Reach[0] && Math.abs(x * one.Up[0] + y * one.Up[1] + z * one.Up[2]) <= one.Reach[1];
			}

			/* Whether a triangle may stand where the eye looks into a mirror: its ball reaches the way within 4.5 units ahead, 0.4 aside. */
			function along (one, a, b, c) {
				var middle = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
				var size = Math.max(vectors.Length(vectors.Subtract(a, middle)), vectors.Length(vectors.Subtract(b, middle)), vectors.Length(vectors.Subtract(c, middle)));
				var off = vectors.Subtract(middle, one.At);
				var ahead = vectors.Dot(off, one.Seen);

				return ahead > -size && ahead < 4.5 + size && vectors.Length(vectors.Subtract(off, vectors.Scale(one.Seen, ahead))) < 1 + size;
			}

			model.Pieces.slice().forEach(function (piece) {
				var indices = piece.Geometry.Indices;
				var kept = [];
				var cuts = made.map(function () {
					return [];
				});
				var glass = /glass|window/i.test(piece.Material ? piece.Material.Name || '' : '') || !!piece.Material && piece.Material.Alpha === 'BLEND';
				var i;

				if (piece.Mirror !== undefined) return;

				for (i = 0; i + 2 < indices.length; i += 3) {
					var a = placeOf(piece, indices[i]);
					var b = placeOf(piece, indices[i + 1]);
					var c = placeOf(piece, indices[i + 2]);
					var face = vectors.Normalize(vectors.Cross(vectors.Subtract(b, a), vectors.Subtract(c, a)));
					var taken = -1;
					var m;

					for (m = 0; m < made.length; m++) {
						var one = made[m];

						one.Rear = Math.max(one.Rear, (a[0] - one.At[0]) * one.N[0] + (a[1] - one.At[1]) * one.N[1] + (a[2] - one.At[2]) * one.N[2]);

						if (taken < 0 && vectors.Dot(face, one.N) > 0.5 && onGlass(one, a) && onGlass(one, b) && onGlass(one, c)) {
							taken = m;

							continue;
						}

						/* What the eye may meet looking into the mirror: the body, not its glass. */
						if (!glass && along(one, a, b, c))
							one.Walls.push([a, b, c]);
					}

					if (taken < 0) kept.push(indices[i], indices[i + 1], indices[i + 2]);
					else cuts[taken].push(indices[i], indices[i + 1], indices[i + 2]);
				}

				if (kept.length === indices.length) return;

				piece.Geometry = Object.assign({}, piece.Geometry, {Indices: kept});

				if (!kept.length)
					model.Pieces.splice(model.Pieces.indexOf(piece), 1);

				cuts.forEach(function (cut, m) {
					if (!cut.length) return;

					made[m].Found += cut.length / 3;

					model.Pieces.push(Object.assign({}, piece, {ID: piece.ID + '-mirror-' + made[m].Index, Mirror: made[m].Index, Geometry: Object.assign({}, piece.Geometry, {Indices: cut})}));
				});
			});

			made.forEach(function (one) {
				model.MirrorShapes[one.Index] = {Glass: one.Found > 0, Rear: one.Rear, Camera: one.Mirror.View === 'camera' || one.Mirror.View !== 'mirror' && blocked(one.At, one.Seen, one.Walls)};
			});

			vehicle.MirrorShapes = model.MirrorShapes;
		};

		/*
		 * Whether the body of a car stands in the way of what a mirror shows: of a fan of fifteen rays from the mirror round
		 * seen, the way the eye sees into it (0.2 aside, 0.1 up and down), seven tenths meet a triangle of walls within 4
		 * units. The flank of a car fills a part of what a side mirror shows, the engine behind the seats all of an inner one.
		 */
		function blocked (at, seen, walls) {
			var hits = 0;
			var side = vectors.Normalize(vectors.Cross(seen, [0, 1, 0]));
			var lift = vectors.Cross(side, seen);
			var fan = [];

			[-0.2, -0.1, 0, 0.1, 0.2].forEach(function (x) {
				[-0.1, 0, 0.1].forEach(function (y) {
					fan.push([x, y]);
				});
			});

			fan.forEach(function (aside) {
				var way = vectors.Normalize(vectors.Add(seen, vectors.Add(vectors.Scale(side, aside[0]), vectors.Scale(lift, aside[1]))));
				var from = vectors.Add(at, vectors.Scale(way, 0.03));
				var met = walls.some(function (triangle) {
					var e1 = vectors.Subtract(triangle[1], triangle[0]);
					var e2 = vectors.Subtract(triangle[2], triangle[0]);
					var p = vectors.Cross(way, e2);
					var det = vectors.Dot(e1, p);
					var t;
					var u;
					var v;
					var q;
					var s;

					if (Math.abs(det) < 1e-9) return false;

					s = vectors.Subtract(from, triangle[0]);
					u = vectors.Dot(s, p) / det;

					if (u < 0 || u > 1) return false;

					q = vectors.Cross(s, e1);
					v = vectors.Dot(way, q) / det;

					if (v < 0 || u + v > 1) return false;

					t = vectors.Dot(e2, q) / det;

					return t > 0 && t < 4;
				});
				if (met)
					hits++;
			});

			return hits >= fan.length * 0.7;
		}

		/* How far what moves has come, in the space of its model, or null. */
		engine.OpeningMove = function (object, piece) {
			var vehicle = engine.RigOf(object);
			var opening = vehicle && piece.Opening ? (vehicle.Openings || []).filter(function (each) {
				return each.Name === piece.Opening;
			})[0] : null;
			if (!opening) return null;

			return moved(object, vehicle, opening, piece.Side || 1, 0);
		};

		/* The move of one opening, after the one it Follows (a paddle goes round with the steering wheel it is on). */
		function moved (object, vehicle, opening, side, depth) {
			var state = object.Opens = object.Opens || {};
			var wanted = opening.Spin ? 0 : given(opening.Open, 0);
			var own;
			var way;
			var far;
			var parent = opening.Follow && depth < 4 ? (vehicle.Openings || []).filter(function (each) {
				return each.Name === opening.Follow;
			})[0] : null;

			state[opening.Name] = state[opening.Name] === undefined ? wanted : state[opening.Name];

			if (opening.Hinge) {
				own = hinged(opening, side, state[opening.Name], state[opening.Name + ':aside'] || 0);
			}
			else {
				way = opening.Way || [0, -1, 0];
				far = state[opening.Name] * given(opening.Reach, 1);
				own = math.Translation(way[0] * far, way[1] * far, way[2] * far);
			}

			return parent ? math.Multiply(moved(object, vehicle, parent, side, depth + 1), own) : own;
		}

		/*
		 * A turn round a hinge: Hinge, a point of the model, Axis, Angle (degrees as far as it goes, at 1); Aside and AsideAngle a second
		 * axis (a gear lever goes ahead and aside). On the other side of a pair the hinge and the turn are mirrored.
		 */
		function hinged (opening, side, amount, aside) {
			var degrees = Math.PI / 180;
			var hinge = opening.Hinge.slice();
			var axis = vectors.Normalize(opening.Axis || [0, 1, 0]);
			var across = opening.Aside ? vectors.Normalize(opening.Aside) : null;
			var turn;

			if (side < 0) {
				hinge[0] = -hinge[0];
				axis = [axis[0], -axis[1], -axis[2]];
				across = across ? [across[0], -across[1], -across[2]] : null;
			}

			turn = math.Rotation(axis, amount * given(opening.Angle, 90) * degrees);

			if (across)
				turn = math.Multiply(math.Rotation(across, aside * given(opening.AsideAngle, given(opening.Angle, 90)) * degrees), turn);

			return math.Multiply(math.Translation(hinge[0], hinge[1], hinge[2]), math.Multiply(turn, math.Translation(-hinge[0], -hinge[1], -hinge[2])));
		}

		/* Where a gear lever stands in each gear: [ahead, aside], 1 as far as it goes. An automatic has R, N and D; a manual an H. */
		var Gates = {
			auto: {R: [-1, 0], N: [0, 0], D: [1, 0]},
			manual: {R: [-1, 1.4], N: [0, 0], 1: [1, -1], 2: [-1, -1], 3: [1, 0], 4: [-1, 0], 5: [1, 1], 6: [-1, 1], 7: [1, 1.4]}
		};

		/*
		 * What drives a moving part of a car, if anything: steer (the wheel, -1 to 1), gas, brake and hand (0 to 1), gear ([ahead,
		 * aside] of its gate; sequential: a knock back up, ahead down), paddle (1 while it changes up, -1 down), indicator (-1 left,
		 * 1 right), wipers (they sweep while they are on). Null for what only opens as it is told. Sign 1 or -1 keeps only that way
		 * of it (the paddle of each side).
		 */
		function drivenOf (object, opening) {
			var car = object.Car || {};
			var held = object.Controls || {};
			var signals = object.Signals || {};
			var gates;
			var gate;

			switch (opening.Drive) {
				case 'steer':
					return [car.Steer || 0, 0];
				case 'gas':
				case 'brake':
				case 'hand':
					return [held[opening.Drive.charAt(0).toUpperCase() + opening.Drive.slice(1)] || 0, 0];
				case 'paddle':
					return [car.Shifting > 0 ? car.Shifted || 0 : 0, 0];
				case 'sequential':
					return [car.Shifting > 0 ? -(car.Shifted || 0) : 0, 0];
				case 'gear':
					gates = opening.Gates || Gates[object.Values.Vehicle.Shift === 'manual' ? 'manual' : 'auto'];
					gate = car.Gear === undefined || car.Gear === 0 ? 'N' : car.Gear < 0 ? 'R' : gates[car.Gear] ? String(car.Gear) : 'D';

					return (gates[gate] || [0, 0]).slice();
				case 'indicator':
					return [signals.Indicate || 0, 0];
				case 'wipers':
					return [signals.Wipers ? 0.5 - 0.5 * Math.cos((object.Swept || 0) * Math.PI * 2 / given(opening.Period, 1.3)) : 0, 0];
				default:
					return null;
			}
		}

		/* What moves comes to where it is told or driven: a door slowly, what a hand moves fast (Pace, a second). */
		function openingsStep (object, elapsed) {
			var rig = engine.RigOf(object);

			/* The time the wipers go by: the scene's, while they are on. */
			object.Swept = object.Signals && object.Signals.Wipers ? (object.Swept || 0) + elapsed : 0;

			((rig && rig.Openings) || []).forEach(function (opening) {
				var state = object.Opens = object.Opens || {};
				var driven = drivenOf(object, opening);
				var wanted = driven ? (opening.Sign ? Math.max(0, driven[0] * opening.Sign) : driven[0]) : given(opening.Open, 0);
				var now = state[opening.Name] === undefined ? wanted : state[opening.Name];
				var pace = elapsed * given(opening.Pace, driven ? 10 : 0.6);
				var aside = state[opening.Name + ':aside'] || 0;

				/* A spin goes round as fast as it is on (Spin turns a second at 1), and never comes back. */
				if (opening.Spin) {
					state[opening.Name + ':on'] = state[opening.Name + ':on'] === undefined ? wanted : state[opening.Name + ':on'] + Math.max(-elapsed, Math.min(elapsed, wanted - state[opening.Name + ':on']));
					state[opening.Name] = ((state[opening.Name] === undefined ? 0 : state[opening.Name]) + elapsed * opening.Spin * state[opening.Name + ':on']) % 1;

					return;
				}

				state[opening.Name] = opening.Drive === 'steer' || opening.Drive === 'wipers' ? wanted : now + Math.max(-pace, Math.min(pace, wanted - now));

				if (driven)
					state[opening.Name + ':aside'] = aside + Math.max(-pace, Math.min(pace, driven[1] - aside));
			});
		}

		/* How large a model is in its own space, once. */
		function boxOf (model) {
			var low = [Infinity, Infinity, Infinity];
			var high = [-Infinity, -Infinity, -Infinity];

			if (model.Box)
				return model.Box;

			model.Pieces.forEach(function (piece) {
				var count = piece.Geometry.Positions.length / 3;
				var step = Math.max(1, Math.floor(count / 400));
				var own = {Low: [Infinity, Infinity, Infinity], High: [-Infinity, -Infinity, -Infinity]};
				var i;

				for (i = 0; i < count; i += step) {
					var at = placeOf(piece, i);

					[0, 1, 2].forEach(function (axis) {
						own.Low[axis] = Math.min(own.Low[axis], at[axis]);
						own.High[axis] = Math.max(own.High[axis], at[axis]);
					});
				}

				/* A sheet a file lies on is nothing to fly into. */
				if (own.High[1] - own.Low[1] < (own.High[0] - own.Low[0] + own.High[2] - own.Low[2]) * 0.002) return;

				[0, 1, 2].forEach(function (axis) {
					low[axis] = Math.min(low[axis], own.Low[axis]);
					high[axis] = Math.max(high[axis], own.High[axis]);
				});
			});

			model.Box = {Low: low, High: high};

			return model.Box;
		}

		engine.BoxOf = boxOf;

		/* Whether a ball at a place of the world meets what an object is: the way out of it and how deep, or null. */
		function meeting (object, at, radius) {
			var traits = object.Traits || {};
			var name = object.Values.Model;
			var apart;
			var far;

			if (traits.Body || traits.Star) {
				apart = vectors.Subtract(at, object.World);
				far = vectors.Length(apart);

				return far < object.Size * 1.01 + radius ? {Normal: vectors.Scale(apart, 1 / (far || 1)), Depth: object.Size * 1.01 + radius - far} : null;
			}

			if (!name || !library.Has(name) || !library.Ready(name)) return null;

			var box = boxOf(library.Make(name));
			var turn = object.Turn || math.Identity();
			var size = object.Size || 1;
			var offset = vectors.Subtract(at, object.World);
			var local = [0, 1, 2].map(function (axis) {
				return (offset[0] * turn[axis * 4] + offset[1] * turn[axis * 4 + 1] + offset[2] * turn[axis * 4 + 2]) / size;
			});
			var reach = radius / size;
			var best = Infinity;
			var side = 0;
			var sign = 1;

			for (var axis = 0; axis < 3; axis++) {
				var below = local[axis] - box.Low[axis] + reach;
				var above = box.High[axis] + reach - local[axis];
				if (below <= 0 || above <= 0) return null;

				if (Math.min(below, above) < best) {
					best = Math.min(below, above);
					side = axis;
					sign = below < above ? -1 : 1;
				}
			}

			return {Normal: [turn[side * 4] * sign, turn[side * 4 + 1] * sign, turn[side * 4 + 2] * sign], Depth: best * size};
		}

		/* What a vehicle can meet: bodies and crafts by a ship, other vehicles by a car. */
		function others (hero, ground) {
			return scene.Order.filter(function (object) {
				var traits = object.Traits || {};

				return object !== hero && object.World && !object.Hidden && (ground ? object.Values.Vehicle : traits.Body || traits.Star || object.Values.Model);
			});
		}

		/* What is under a car: a road of the scene (SurfaceAt: its strip, a kerb, a junction), or the ground of the scene. */
		function surfaceOf (settings) {
			var field = scene.Ground.Field;
			var air = scene.Ground.Air || {};
			var roads = engine.Roads ? engine.Roads().length + engine.Junctions().length : 0;

			/* A wet road holds less: WetGrip of the grip is left where it is wet through. */
			var held = 1 - (1 - given(settings.WetGrip, 0.75)) * Math.max(0, Math.min(1, air.Wet || 0));

			return function (x, z) {
				var under = roads ? engine.SurfaceAt(x, z) : null;
				if (under && under.Road)
					return {Height: under.Height, Grip: under.Grip * held, Drag: under.Drag, Surface: under.Surface};

				return {Height: Math.max(0, field.Height(x, z)), Grip: held, Drag: 0};
			};
		}

		/* The four corners of a car against what stands in its way: the barrier of its track, the walls of a location, other vehicles. */
		function collide (hero, state, settings, long, wide, field, last) {
			var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];
			var side = [ahead[1], -ahead[0]];
			var corners = [[long, wide], [long, -wide], [-long, wide], [-long, -wide], [0, wide], [0, -wide]].map(function (corner) {
				return [ahead[0] * corner[0] + side[0] * corner[1], ahead[1] * corner[0] + side[1] * corner[1]];
			});

			/* The barriers of the roads, from either side: each corner through one is pushed back out of it. */
			if (engine.BarrierHit) {
				state.RoadHints = state.RoadHints || [];

				corners.forEach(function (corner) {
					var hit = engine.BarrierHit(state.X + corner[0], state.Z + corner[1], state.X, state.Z, state.RoadHints);
					if (hit)
						physics.Hit(state, hit.Normal, hit.Depth, corner, settings);
				});
			}

			if (field.Push) {
				var out = field.Push(state.X, state.Z, state.Y, wide, 0.4, 1.3);
				var dx = out[0] - state.X;
				var dz = out[1] - state.Z;
				var far = Math.hypot(dx, dz);
				if (far > 0)
					physics.Hit(state, [dx / far, dz / far], far, [-dx / far * wide, -dz / far * wide], settings);
			}
			else if (field.Blocked) {
				corners.forEach(function (corner) {
					var x = state.X + corner[0];
					var z = state.Z + corner[1];
					if (!field.Blocked(x, z, state.Y + 0.5) && !engine.ScatterBlocked(x, z)) return;

					var size = Math.hypot(corner[0], corner[1]) || 1;

					state.X = last.X;
					state.Z = last.Z;

					physics.Hit(state, [-corner[0] / size, -corner[1] / size], 0, corner, settings);
				});
			}

			others(hero, true).forEach(function (object) {
				corners.forEach(function (corner) {
					var met = meeting(object, [state.X + corner[0], state.Y + 0.4, state.Z + corner[1]], 0.1);
					if (met)
						physics.Hit(state, [met.Normal[0], met.Normal[2]], met.Depth, corner, settings);
				});
			});
		}

		/* The eyes of who sits in a car: they stand and look with the body, so a road that falls does not turn them to the sky; the mouse only adds to it. */
		engine.SeatView = function (hero, elapsed) {
			if (!hero.Body || !hero.Car) return null;

			var aside = scene.Yaw - (hero.Car.Heading + Math.PI);
			var turned2 = Math.atan2(Math.sin(aside), Math.cos(aside));
			var up = scene.Pitch - 0.02;
			var wanted = vectors.Normalize(math.Apply(hero.Body, [Math.sin(turned2) * Math.cos(up), -Math.sin(up), Math.cos(turned2) * Math.cos(up)]).map(function (value, index) {
				return value - math.Apply(hero.Body, [0, 0, 0])[index];
			}));

			scene.SeatLook = scene.SeatLook ? vectors.Normalize(vectors.Lerp(scene.SeatLook, wanted, 1 - Math.exp(-elapsed * 14))) : wanted;

			return {At: vectors.Add(hero.World, hero.Head || [0, hero.Size * 0.9, 0]), Ahead: scene.SeatLook};
		};

		/* What a car does when it lets go of the gas at speed: unburnt fuel goes off in its pipes. */
		function pops (hero, gas, pace) {
			var was = hero.Gassed;
			var moment = scene.Seconds;

			hero.Gassed = !!gas;

			if (!was || gas || pace < 14) return;

			engine.MountsOf(hero).forEach(function (mount) {
				var pop = mount.Mount.Pop;
				var told = typeof pop === 'object' && pop ? pop : {};
				if (!pop || mount.Mount.On === false || moment - (hero.Popped || -9) < given(told.Every, 0.4)) return;

				self.Burst(told.Type || 'backfire', mount.At, {Aim: mount.Aim, Size: given(told.Size, 0.5) * hero.Size});
			});

			hero.Popped = moment;
		}

		function car (hero, keys, elapsed) {
			var settings = hero.Values.Vehicle;
			var surface = surfaceOf(settings);
			var state = hero.Car;
			var field = scene.Ground.Field;
			var long = given(settings.Long, given(settings.Base, 2.7) / 2 + 0.95);
			var wide = given(settings.Wide, given(settings.Width, 1.6) / 2 + 0.12);

			if (!state) {
				var x = given(hero.Values.X, 0);
				var z = given(hero.Values.Y, 0);

				state = hero.Car = {X: x, Z: z, Heading: given(settings.Heading, 0), Forward: 0, Aside: 0, Rate: 0, Steer: 0, Y: surface(x, z).Height, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0, Strokes: [0, 0, 0, 0]};
				hero.Clock = {};
			}

			/* A pad drives as far as it leans: the left stick steers, the right trigger (or the stick ahead) gives gas, the left one brakes. */
			var pad = keys.Pad || {X: 0, Y: 0, Gas: 0, Brake: 0};
			var input = {Gas: keys.KeyW || keys.ArrowUp || Math.max(pad.Gas, pad.Y), Brake: keys.KeyS || keys.ArrowDown || Math.max(pad.Brake, -pad.Y), Steer: Math.max(-1, Math.min(1, (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - pad.X)), Stop: keys.Space, Drift: keys.ShiftLeft || keys.ShiftRight, Hand: keys.KeyC};
			var last = hero.Last || state;
			var up = !!keys.KeyE && !hero.Shifts;
			var down = !!keys.KeyQ && !hero.Shifts;

			/* E changes up and Q down, once a press, with a manual gearbox. */
			hero.Shifts = !!(keys.KeyE || keys.KeyQ);

			/* What the hands and the feet do, for what moves in the car; the wipers go while it rains. */
			hero.Controls = {Gas: typeof input.Gas === 'number' ? input.Gas : input.Gas ? 1 : 0, Brake: typeof input.Brake === 'number' ? input.Brake : input.Brake || input.Stop ? 1 : 0, Hand: input.Hand ? 1 : 0};

			signalsStep(hero, keys, settings, input, elapsed);

			var part = physics.Steps(hero.Clock, elapsed, 1 / 120, function (step) {
				last = {X: state.X, Z: state.Z, Y: state.Y, Heading: state.Heading, Pitch: state.Pitch, Roll: state.Roll, Strokes: state.Strokes ? state.Strokes.slice() : [0, 0, 0, 0]};

				input.ShiftUp = up;
				input.ShiftDown = down;
				up = false;
				down = false;

				physics.Car(state, input, surface, settings, step);

				collide(hero, state, settings, long, wide, field, last);
			});

			hero.Last = last;

			var seen = {X: physics.Blend(last.X, state.X, part), Z: physics.Blend(last.Z, state.Z, part), Y: physics.Blend(last.Y, state.Y, part), Heading: physics.Blend(last.Heading, state.Heading, part), Pitch: physics.Blend(last.Pitch, state.Pitch, part), Roll: physics.Blend(last.Roll, state.Roll, part)};
			var ahead = [Math.sin(seen.Heading), Math.cos(seen.Heading)];
			var turn = math.Multiply(math.Rotation([0, 1, 0], seen.Heading + given(settings.Yaw, 0) * Math.PI / 180), math.Multiply(math.Rotation([1, 0, 0], -seen.Pitch), math.Rotation([0, 0, 1], seen.Roll)));
			var pace = Math.abs(state.Forward);

			hero.Strokes = physics.Blend(last.Strokes || state.Strokes, state.Strokes, part);
			hero.Air = seen.Y;
			hero.Values.X = seen.X;
			hero.Values.Y = seen.Z;
			hero.Facing = seen.Heading;
			hero.Heading = [ahead[0], 0, ahead[1]];
			hero.Flight = {At: [seen.X, seen.Y, seen.Z], Turn: turn};
			hero.World = hero.Flight.At;
			hero.Turn = turn;
			hero.Thrust = (input.Gas ? 0.45 : 0.04) + 0.55 * Math.min(1, pace / given(settings.Top, 92)) * (input.Gas ? 1 : 0);
			hero.Head = settings.Seat ? math.Apply(turn, settings.Seat) : null;
			hero.Body = math.Multiply(math.Rotation([0, 1, 0], seen.Heading), math.Multiply(math.Rotation([1, 0, 0], -seen.Pitch), math.Rotation([0, 0, 1], seen.Roll)));

			pops(hero, input.Gas, pace);

			openingsStep(hero, elapsed);

			scene.Overrides[hero.ID] = scene.Overrides[hero.ID] || {};
			scene.Overrides[hero.ID].Values = Object.assign(scene.Overrides[hero.ID].Values || {}, {X: seen.X, Y: seen.Z});

			/* The view comes round behind it as it goes; a hand on the mouse holds it for a while. From the seat it looks ahead, but while the right button is held. */
			var seated = (scene.Inside || 0) > 0.5;

			if (pace > 1 && !scene.LookHeld && (seated || !scene.Drag && performance.now() - (scene.Looked || 0) > 1500)) {
				var behind = seen.Heading + Math.PI;
				var apart = Math.atan2(Math.sin(behind - scene.Yaw), Math.cos(behind - scene.Yaw));

				scene.Yaw += apart * Math.min(1, elapsed * (seated ? 5 : 7));

				if (seated)
					scene.Pitch += (0.02 - scene.Pitch) * Math.min(1, elapsed * 5);
			}
		}

		/*
		 * A boat on the sea of the ground (Physics.Boat on the waves of SceneWaves): W the motor, S astern, A and D the rudder,
		 * Space stops it. It leaves foam behind it as it goes (wake) and throws up water at its bow when it goes fast (spray).
		 */
		function boat (hero, keys, elapsed) {
			var settings = hero.Values.Vehicle;
			var ground = scene.Ground;
			var field = ground.Field;
			var waves = self.$Service('SceneWaves');
			var state = hero.Boat;
			var pad = keys.Pad || {X: 0, Y: 0, Gas: 0, Brake: 0};
			var input = {Gas: keys.KeyW || keys.ArrowUp ? 1 : Math.max(pad.Gas, pad.Y, 0), Brake: keys.KeyS || keys.ArrowDown ? 1 : Math.max(pad.Brake, -pad.Y, 0), Steer: Math.max(-1, Math.min(1, (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - pad.X)), Stop: keys.Space};
			var last;

			function sea (x, z) {
				return waves.At(ground.Waves, x, z, scene.Seconds);
			}

			function bed (x, z) {
				return field.Height(x, z);
			}

			if (!state) {
				var x = given(hero.Values.X, 0);
				var z = given(hero.Values.Y, 0);

				state = hero.Boat = {X: x, Z: z, Heading: given(settings.Heading, 0), Forward: 0, Aside: 0, Rate: 0, Y: sea(x, z).Height - given(settings.Draft, 0.35), Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Aground: false};
				hero.Clock = {};
			}

			last = hero.Last || state;

			hero.Controls = {Gas: input.Gas, Brake: input.Brake, Hand: 0};

			var part = physics.Steps(hero.Clock, elapsed, 1 / 120, function (step) {
				last = {X: state.X, Z: state.Z, Y: state.Y, Heading: state.Heading, Pitch: state.Pitch, Roll: state.Roll};

				physics.Boat(state, input, sea, bed, settings, step);
			});

			hero.Last = last;

			var seen = {X: physics.Blend(last.X, state.X, part), Z: physics.Blend(last.Z, state.Z, part), Y: physics.Blend(last.Y, state.Y, part), Heading: physics.Blend(last.Heading, state.Heading, part), Pitch: physics.Blend(last.Pitch, state.Pitch, part), Roll: physics.Blend(last.Roll, state.Roll, part)};
			var ahead = [Math.sin(seen.Heading), Math.cos(seen.Heading)];
			var turn = math.Multiply(math.Rotation([0, 1, 0], seen.Heading + given(settings.Yaw, 0) * Math.PI / 180), math.Multiply(math.Rotation([1, 0, 0], -seen.Pitch), math.Rotation([0, 0, 1], seen.Roll)));
			var pace = Math.abs(state.Forward);
			var half = given(settings.Length, 4.5) / 2;

			hero.Air = seen.Y;
			hero.Values.X = seen.X;
			hero.Values.Y = seen.Z;
			hero.Facing = seen.Heading;
			hero.Heading = [ahead[0], 0, ahead[1]];
			hero.Flight = {At: [seen.X, seen.Y, seen.Z], Turn: turn};
			hero.World = hero.Flight.At;
			hero.Turn = turn;
			hero.Thrust = input.Gas ? 0.3 + 0.7 * Math.min(1, pace / given(settings.Top, 16)) : 0.05;
			hero.Head = settings.Seat ? math.Apply(turn, settings.Seat) : null;
			hero.Body = math.Multiply(math.Rotation([0, 1, 0], seen.Heading), math.Multiply(math.Rotation([1, 0, 0], -seen.Pitch), math.Rotation([0, 0, 1], seen.Roll)));

			/* The foam behind it, more as it goes faster; the spray at its bow, fast. */
			hero.Waked = (hero.Waked || 0) + elapsed;

			if (pace > 1.5 && hero.Waked > Math.max(0.08, 0.5 - pace * 0.03)) {
				hero.Waked = 0;

				self.Burst('wake', [seen.X - ahead[0] * half, sea(seen.X - ahead[0] * half, seen.Z - ahead[1] * half).Height + 0.05, seen.Z - ahead[1] * half], {Size: Math.min(2, 0.5 + pace * 0.08)});

				hero.Sprayed = !hero.Sprayed;

				if (pace > 7 && hero.Sprayed)
					self.Burst('spray', [seen.X + ahead[0] * half * 0.8, seen.Y + 0.3, seen.Z + ahead[1] * half * 0.8], {Aim: [ahead[0] * 0.3, 1, ahead[1] * 0.3], Size: Math.min(1.5, pace * 0.08)});
			}

			openingsStep(hero, elapsed);

			scene.Overrides[hero.ID] = scene.Overrides[hero.ID] || {};
			scene.Overrides[hero.ID].Values = Object.assign(scene.Overrides[hero.ID].Values || {}, {X: seen.X, Y: seen.Z});

			/* The view comes round behind it as it goes, as behind a car. */
			var seated = (scene.Inside || 0) > 0.5;

			if (pace > 1 && !scene.LookHeld && (seated || !scene.Drag && performance.now() - (scene.Looked || 0) > 1500)) {
				var behind = seen.Heading + Math.PI;
				var apart = Math.atan2(Math.sin(behind - scene.Yaw), Math.cos(behind - scene.Yaw));

				scene.Yaw += apart * Math.min(1, elapsed * (seated ? 5 : 3));
			}
		}

		function ship (hero, keys, elapsed) {
			var settings = hero.Values.Vehicle;
			var around = settings.Around ? scene.Objects[settings.Around] : null;
			var state = hero.Ship;

			if (!state) {
				var first = vectors.Normalize(settings.Facing || [0, 0, 1]);
				var aside = vectors.Normalize(vectors.Cross([0, 1, 0], first));

				state = hero.Ship = {At: vectors.Scale(settings.From || [0, 0, 2], around ? around.Size : 1), Right: aside, Up: vectors.Cross(first, aside), Ahead: first, Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0.2};
				hero.Clock = {};
				scene.Yaw = 0;
				scene.Pitch = 0.16;
			}

			/* H goes into warp, J jumps: each once a press. */
			if (!hero.Travel && keys.KeyH && !hero.Pressed)
				engine.Travel(hero, 'warp');

			if (!hero.Travel && keys.KeyJ && !hero.Pressed)
				engine.Travel(hero, 'jump');

			hero.Pressed = !!(keys.KeyH || keys.KeyJ);

			/* Its hatches and doors open as they are told, as a car's do. */
			openingsStep(hero, elapsed);

			if (hero.Travel) {
				travelStep(hero, state, settings, around && around.World ? around.World : [0, 0, 0], elapsed);

				return;
			}

			/* A pad: the left stick turns and tilts, the right one rolls and lifts, the triggers the throttle. */
			var pad = keys.Pad || {X: 0, Y: 0, LookX: 0, LookY: 0, Gas: 0, Brake: 0};
			var input = {Yaw: Math.max(-1, Math.min(1, (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - pad.X)), Pitch: Math.max(-1, Math.min(1, (keys.KeyR || keys.ArrowDown ? 1 : 0) - (keys.KeyF || keys.ArrowUp ? 1 : 0) - pad.Y)), Roll: Math.max(-1, Math.min(1, (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0) + pad.LookX)), Throttle: Math.max(-1, Math.min(1, (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) + pad.Gas - pad.Brake)), Lift: Math.max(-1, Math.min(1, (keys.KeyC ? 1 : 0) - (keys.KeyX ? 1 : 0) + pad.LookY)), Boost: keys.ShiftLeft || keys.ShiftRight, Stop: keys.Space};
			var last = hero.Last || state;

			var part = physics.Steps(hero.Clock, elapsed, 1 / 120, function (step) {
				last = {At: state.At, Right: state.Right, Up: state.Up, Ahead: state.Ahead};

				physics.Ship(state, input, real(settings, around, state), step);

				/* A body is no place to fly through, nor is what flies by it. */
				var origin = around && around.World ? around.World : [0, 0, 0];

				others(hero, false).forEach(function (object) {
					var met = meeting(object, vectors.Add(origin, state.At), (hero.Size || 0) * 0.5);
					if (!met) return;

					state.At = vectors.Add(state.At, vectors.Scale(met.Normal, met.Depth));
					state.Way = physics.Bounce(state.Way, met.Normal, met.Depth, 0.3);
					state.Throttle *= 0.5;
				});
			});

			hero.Last = last;

			var from = physics.Blend(last.At, state.At, part);
			var right = vectors.Normalize(physics.Blend(last.Right, state.Right, part));
			var up = vectors.Normalize(physics.Blend(last.Up, state.Up, part));
			var ahead = vectors.Normalize(physics.Blend(last.Ahead, state.Ahead, part));
			var at = around && around.World ? vectors.Add(around.World, from) : from;

			hero.Thrust = Math.abs(state.Throttle) * (input.Boost ? 2 : 1);

			placeShip(hero, settings, at, right, up, ahead);
		}

		/*
		 * In real sizes a ship goes at Speed (m/s, 3000) near a body, and faster the farther from it, up to Cruise times as
		 * fast (1000: 3000 km/s) from 60 000 km over it, as the root of how high it is: over the top of the air a hundred km/s
		 * and more, as fast as a way down goes there; between bodies a way takes seconds to minutes, not days.
		 */
		function real (settings, around, state) {
			var metre = engine.Metre();
			var speed = given(settings.Speed, 3000);
			var high;

			if (!metre)
				return settings;

			high = around && around.Radius ? Math.max(0, (vectors.Length(state.At) / around.Size - 1) * around.Radius) : 60000;

			return Object.assign({}, settings, {Top: (speed + speed * (given(settings.Cruise, 1000) - 1) * Math.sqrt(Math.min(1, high / 60000))) * metre});
		}

		function placeShip (hero, settings, at, right, up, ahead) {
			hero.Seen = {Right: right, Up: up, Ahead: ahead};
			hero.Flight = {At: at, Turn: math.Multiply([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, ahead[0], ahead[1], ahead[2], 0, 0, 0, 0, 1], math.Rotation([0, 1, 0], given(settings.Yaw, 0) * Math.PI / 180))};
			hero.World = at;
			hero.Turn = hero.Flight.Turn;
		}

		function smooth (from, to, value) {
			var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

			return t * t * (3 - 2 * t);
		}

		/* What a way far at once goes to: an object far enough to go to, or none (it goes straight ahead). */
		function targetOf (hero, travel, from) {
			var target = travel.To ? scene.Objects[travel.To] : null;

			return target && target.World && target !== hero && vectors.Distance(target.World, from) > standOff(hero, target) * 1.5 ? target : null;
		}

		/* How far before what it goes to a ship comes out: the body whole in view, the ship before it. */
		function standOff (hero, target) {
			return (target.Size || 0) * 6 + (hero.Size || 0) * 40;
		}

		/* How far a ship goes straight ahead at once: as far as told, but never into a body or a ship on its way. */
		function clearAhead (hero, from, axis, distance) {
			var far = distance;

			others(hero, false).forEach(function (object) {
				var to = vectors.Subtract(object.World, from);
				var along = vectors.Dot(to, axis);
				var aside = vectors.Length(vectors.Subtract(to, vectors.Scale(axis, along)));
				if (along > 0 && aside < (object.Size || 0) * 1.3 + (hero.Size || 0) * 4)
					far = Math.min(far, Math.max(0, along - standOff(hero, object)));
			});

			return far;
		}

		/*
		 * What a car shows: L switches its lights on and off (Lights of its Vehicle: auto by default, on at dusk, at night and in
		 * rain or fog), Z and X show the way it turns and switch off as the wheel comes back, both together are the hazard lights; the
		 * wipers go while it rains. Signals {Lights, Indicate (-1 left, 1 right), Hazard, Wipers}.
		 */
		function signalsStep (hero, keys, settings, input, elapsed) {
			var air = scene.Ground.Air || {};
			var sun = scene.Ground.Sky || scene.Ground.Sun || [0, 1, 0];
			var signals = hero.Signals = hero.Signals || {Indicate: 0, Hazard: false};
			var pressed = hero.SignalKeys || {};
			var steer = input.Steer || 0;

			if (keys.KeyL && !pressed.KeyL)
				hero.LightsSet = !signals.Lights;

			if (keys.KeyZ && keys.KeyX && !(pressed.KeyZ && pressed.KeyX)) signals.Hazard = !signals.Hazard;
			else if (keys.KeyZ && !pressed.KeyZ) signals.Indicate = signals.Indicate === -1 ? 0 : -1;
			else if (keys.KeyX && !pressed.KeyX) signals.Indicate = signals.Indicate === 1 ? 0 : 1;

			/* Turned the way it shows and back, it stops showing it. */
			if (signals.Indicate && steer * -signals.Indicate > 0.6)
				hero.Turned = true;

			if (hero.Turned && Math.abs(steer) < 0.15) {
				signals.Indicate = 0;
				hero.Turned = false;
			}

			hero.SignalKeys = {KeyL: !!keys.KeyL, KeyZ: !!keys.KeyZ, KeyX: !!keys.KeyX};
			hero.Blink = signals.Indicate || signals.Hazard ? (hero.Blink || 0) + elapsed : 0;

			signals.Lights = hero.LightsSet !== undefined ? hero.LightsSet : settings.Lights === undefined || settings.Lights === 'auto' ? sun[1] < 0.17 || (air.Rain || 0) > 0.2 || (air.Fog || 0) > 0.3 : !!settings.Lights;
			signals.Wipers = settings.Wipers === undefined ? (air.Rain || 0) > 0.05 : !!settings.Wipers;
		}

		/* Where a way far at once ends: before what it goes to (as far again as it drifts on its way out), on its side, or as far ahead as it goes. */
		function goalOf (hero, travel) {
			var target = travel.Target ? scene.Objects[travel.Target] : null;
			var way;

			if (target && target.World) {
				way = vectors.Normalize(vectors.Subtract(target.World, travel.Start));

				return vectors.Subtract(target.World, vectors.Scale(way, standOff(hero, target) + travel.Drift));
			}

			return vectors.Add(travel.Start, vectors.Scale(travel.Axis, travel.Distance));
		}

		/* Turns a ship by a part of the way from where it looks to a way. */
		function aimShip (state, way, part) {
			var angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(state.Ahead, way)))) * part;
			var axis = vectors.Cross(state.Ahead, way);
			var turn;

			if (angle < 1e-5 || vectors.Length(axis) < 1e-6) return;

			turn = math.Rotation(vectors.Normalize(axis), angle);

			state.Ahead = vectors.Normalize(math.Apply(turn, state.Ahead));
			state.Up = vectors.Normalize(math.Apply(turn, state.Up));
			state.Right = vectors.Normalize(vectors.Cross(state.Up, state.Ahead));
			state.Up = vectors.Cross(state.Ahead, state.Right);
		}

		/*
		 * A step of a way far at once, in its three phases. Warp: it turns to where it goes, slows, its engines gather, the stars
		 * draw out and a tunnel opens with a flash; inside, it goes the whole way; out of it, a flash, the stars come back, and it
		 * slows from a speed of many times its top one. Jump: the afterburner gathers, a dash with the stars drawn out a little,
		 * and it slows back to its top speed. What the view shows of it is scene.Warp.
		 */
		function travelStep (hero, state, settings, origin, elapsed) {
			var travel = hero.Travel;
			var top = given(settings.Top, 1);
			var warp = travel.Kind === 'warp';
			var t;
			var world;
			var look = {Stretch: 0, Tunnel: 0, Flash: 0, Shake: 0, Wide: 0, Lag: 0, Pace: 0};

			travel.Time += elapsed;
			t = Math.min(1, travel.Time / Math.max(1e-3, travel.Lengths[travel.Phase]));
			world = vectors.Add(origin, state.At);

			if (travel.Phase === 'enter') {
				var target = targetOf(hero, travel, world);
				if (target)
					aimShip(state, vectors.Normalize(vectors.Subtract(target.World, world)), Math.min(1, elapsed * Math.max(2.5, 5 / travel.Lengths.enter)));

				state.Way = vectors.Lerp(state.Way, vectors.Scale(state.Ahead, top * (warp ? 0.15 : 0.6)), Math.min(1, elapsed * 2));
				state.At = vectors.Add(state.At, vectors.Scale(state.Way, elapsed));

				hero.Thrust = warp ? 0.3 + 2.7 * t * t : 1 + 2 * t;

				look = warp ? {Stretch: smooth(0.3, 1, t), Tunnel: smooth(0.8, 1, t) * 0.7, Flash: smooth(0.9, 1, t) * 0.9, Shake: t * 0.35, Wide: smooth(0.3, 1, t) * 0.3, Lag: t * 0.15, Pace: 0.15 + 2.5 * t * t} : {Stretch: t * 0.12, Tunnel: 0, Flash: 0, Shake: t * 0.3, Wide: -0.06 * t, Lag: t * 0.08, Pace: 0.15};

				if (t >= 1) {
					travel.Start = vectors.Add(origin, state.At);
					travel.Target = target ? target.ID : '';
					travel.Axis = state.Ahead.slice();
					travel.Distance = clearAhead(hero, travel.Start, travel.Axis, travel.Length * top);

					if (target)
						travel.Axis = vectors.Normalize(vectors.Subtract(goalOf(hero, travel), travel.Start));

					next(hero, travel, 'inside');
				}
			}
			else if (travel.Phase === 'inside') {
				var goal = goalOf(hero, travel);
				var e = smooth(0, 1, t);

				aimShip(state, travel.Target ? vectors.Normalize(vectors.Subtract(goal, travel.Start)) : travel.Axis, Math.min(1, elapsed * 4));

				state.At = vectors.Subtract(vectors.Lerp(travel.Start, goal, warp ? e : t * t * (3 - 2 * t)), origin);
				state.Way = vectors.Scale(state.Ahead, top * (warp ? 12 : 5));

				hero.Thrust = 3;

				look = warp ? {Stretch: 1, Tunnel: 1, Flash: Math.max(0, 1 - travel.Time / 0.4) * 0.9, Shake: 0.22, Wide: 0.3, Lag: 0.15, Pace: 4} : {Stretch: 0.5, Tunnel: 0, Flash: Math.max(0, 1 - travel.Time / 0.25) * 0.2, Shake: 0.55, Wide: 0.18, Lag: 0.08 + Math.sin(Math.PI * t) * 0.35, Pace: 2.4};

				if (t >= 1) {
					travel.Exit = goal;

					next(hero, travel, 'exit');
				}
			}
			else {
				var fast = top * (warp ? 12 : 5) * (1 - t) * (1 - t);

				state.Way = vectors.Scale(state.Ahead, top * Math.max(state.Throttle, 0.4) + fast);
				state.At = vectors.Add(state.At, vectors.Scale(state.Way, elapsed));

				hero.Thrust = Math.max(Math.abs(state.Throttle), 3 * (1 - t));

				look = warp ? {Stretch: 1 - smooth(0, 0.6, t), Tunnel: 1 - smooth(0, 0.18, t), Flash: Math.max(0, 1 - t / 0.25), Shake: 0.5 * (1 - t), Wide: 0.3 * (1 - smooth(0, 0.7, t)), Lag: -0.2 * (1 - t), Pace: 4 * (1 - t)} : {Stretch: 0.5 * (1 - smooth(0, 0.8, t)), Tunnel: 0, Flash: 0, Shake: 0.35 * (1 - t), Wide: 0.18 * (1 - smooth(0, 0.8, t)), Lag: -0.12 * (1 - t), Pace: 2.4 * (1 - t)};

				if (t >= 1) {
					state.Throttle = Math.max(state.Throttle, 0.4);
					state.Way = vectors.Scale(state.Ahead, top * state.Throttle);
					hero.Travel = null;
					scene.Warp = null;

					next(hero, travel, 'done');
				}
			}

			hero.Last = {At: state.At, Right: state.Right, Up: state.Up, Ahead: state.Ahead};

			placeShip(hero, settings, vectors.Add(origin, state.At), state.Right, state.Up, state.Ahead);

			if (hero.Travel) {
				travel.Flow += elapsed * look.Pace;

				scene.Warp = Object.assign(look, {Kind: travel.Kind, Phase: travel.Phase, ID: hero.ID, Axis: travel.Axis || state.Ahead.slice(), Flow: travel.Flow, Tint: travel.Tint});
			}
		}

		/* The next phase of a way far at once: told as an event, and to whom asked for it at its end. */
		function next (hero, travel, phase) {
			travel.Phase = phase;
			travel.Time = 0;

			self.$Emit('travel', {ID: hero.ID, Kind: travel.Kind, Phase: phase});

			if (phase === 'done' && travel.Callback)
				travel.Callback(null, {ID: hero.ID, Kind: travel.Kind, At: hero.World.slice()});
		}

		/*
		 * Sends a ship far at once: kind warp or jump; options {To (the ID of what it goes to), Length (how far, in seconds of its
		 * top speed, with no To), Enter, Inside, Exit (seconds), Tint}, over Warp or Jump of its Vehicle. False if it cannot go.
		 */
		engine.Travel = function (hero, kind, options, callback) {
			var settings = hero && hero.Values.Vehicle;
			var made;

			if (!settings || settings.Kind !== 'ship' || !hero.Ship || hero.Travel || (kind !== 'warp' && kind !== 'jump')) return false;

			made = Object.assign({}, kind === 'warp' ? {Enter: 2.4, Inside: 4, Exit: 1.8, Length: 600, Tint: '#5a9cff'} : {Enter: 0.7, Inside: 1.1, Exit: 1, Length: 30, Tint: '#ffb070'}, settings[kind === 'warp' ? 'Warp' : 'Jump'] || {}, options || {});

			hero.Travel = {Kind: kind, Phase: 'enter', Time: 0, Flow: 0, To: made.To || '', Length: given(made.Length, 0), Lengths: {enter: given(made.Enter, 1), inside: given(made.Inside, 1), exit: given(made.Exit, 1)}, Tint: engine.Paint(made.Tint).slice(0, 3), Callback: callback || null};

			/* Out of it, it goes on at many times its top speed, falling as the square of what is left: a third of that way. */
			hero.Travel.Drift = given(settings.Top, 1) * (kind === 'warp' ? 12 : 5) * hero.Travel.Lengths.exit / 3;

			self.$Emit('travel', {ID: hero.ID, Kind: kind, Phase: 'enter'});

			return true;
		};

		/*
		 * The view of a ship goes round it as the mouse says, from where it stands behind it: it stays with the ship, its own axes
		 * coming after those of the ship, and steers nothing.
		 */
		engine.ShipView = function (hero, elapsed) {
			var seen = hero.Seen;
			var settings = hero.Values.Vehicle;
			var camera = scene.Camera;
			var size = hero.Size || 1;
			var follow = settings.Follow || [3.2, 0.85];
			var step = Math.min(1, elapsed * 3);

			if (!seen)
				return false;

			scene.ShipFar = scene.ShipFar || scene.Wanted;

			var view = scene.ShipAxes = scene.ShipAxes ? {Right: vectors.Normalize(vectors.Lerp(scene.ShipAxes.Right, seen.Right, step)), Up: vectors.Normalize(vectors.Lerp(scene.ShipAxes.Up, seen.Up, step)), Ahead: vectors.Normalize(vectors.Lerp(scene.ShipAxes.Ahead, seen.Ahead, step))} : seen;
			var warp = scene.Warp && scene.Warp.ID === hero.ID && hero.Travel ? scene.Warp : null;
			var far = size * Math.hypot(follow[0], follow[1]) * scene.Wanted / scene.ShipFar * (1 + (warp ? warp.Lag : 0));
			/* Right of a ship is what lies on the left of the eye behind it: the mouse goes the way it goes on the ground. */
			var round = [-Math.sin(scene.Yaw) * Math.cos(scene.Pitch), Math.sin(scene.Pitch), -Math.cos(scene.Yaw) * Math.cos(scene.Pitch)];
			var way = vectors.Add(vectors.Add(vectors.Scale(view.Right, round[0]), vectors.Scale(view.Up, round[1])), vectors.Scale(view.Ahead, round[2]));
			var time = performance.now() / 1000;
			var shake = warp ? vectors.Scale(vectors.Add(vectors.Scale(view.Right, Math.sin(time * 61) + Math.sin(time * 37) * 0.5), vectors.Scale(view.Up, Math.sin(time * 53 + 1) + Math.sin(time * 29) * 0.5)), size * 0.012 * warp.Shake) : [0, 0, 0];

			/* A way far at once widens the view and shakes it; it comes back as it was when it ends. */
			if (warp && scene.WarpFov === undefined)
				scene.WarpFov = camera.Fov;

			if (scene.WarpFov !== undefined) {
				camera.Fov = scene.WarpFov * (1 + (warp ? warp.Wide : 0));

				if (!warp)
					delete scene.WarpFov;
			}

			scene.Target = hero.World.slice();
			camera.Position = vectors.Add(vectors.Add(hero.World, vectors.Scale(way, far)), shake);
			camera.Target = vectors.Add(hero.World, shake);
			camera.Up = view.Up.slice();

			return true;
		};

		/*
		 * The lamps of a car: head (on with its lights), rear (dim with its lights, bright as it brakes), brake, reverse, indicator
		 * (blinking on the side it shows, both sides for the hazard lights). Each a colour, how bright its glass glows, and the light
		 * it throws: {Color, Glow, Power, Radius, Spot, Aim}.
		 */
		var Lamps = {
			head: {Color: '#e6eeff', Glow: 6, Power: 5, Radius: 45, Spot: 60, Aim: [0, -0.06, 1]},
			rear: {Color: '#ff1a10', Glow: 4, Power: 0.8, Radius: 6, Spot: 0, Aim: [0, 0, -1]},
			brake: {Color: '#ff1a10', Glow: 4, Power: 0.8, Radius: 6, Spot: 0, Aim: [0, 0, -1]},
			reverse: {Color: '#ffffff', Glow: 3, Power: 1, Radius: 10, Spot: 100, Aim: [0, -0.2, -1]},
			indicator: {Color: '#ffa020', Glow: 5, Power: 0.7, Radius: 5, Spot: 0, Aim: [0, 0, 1]},
			glow: {Color: '#ffd9a0', Glow: 3, Power: 1, Radius: 8, Spot: 0, Aim: [0, -1, 0]}
		};

		/* How far a lamp of a car is lit now, 0 to 1, on its side (1 the left, as x goes, -1 the right). */
		function lampOn (object, lamp, side) {
			var signals = object.Signals || {};
			var held = object.Controls || {};
			var car = object.Car || {};
			var braking = (held.Brake || 0) > 0.05 && (car.Forward || 0) > -0.5 && car.Gear !== -1;
			var way = signals.Hazard ? side : -(signals.Indicate || 0);

			switch (lamp.Kind) {
				case 'head':
					return signals.Lights ? 1 : 0;
				case 'rear':
					return braking ? 1 : signals.Lights ? 0.3 : 0;
				case 'brake':
					return braking ? 1 : 0;
				case 'reverse':
					return car.Gear === -1 || car.Gear === undefined && (car.Forward || 0) < -0.3 ? 1 : 0;
				case 'indicator':
					return way === side && Math.floor((object.Blink || 0) / 0.36) % 2 === 0 ? 1 : 0;
				case 'glow':
					return lamp.Role ? given((object.Opens || {})['role:' + lamp.Role], given(lamp.Open, 0)) : given(lamp.Open, 1);
				default:
					return 0;
			}
		}

		function lampOf (object, index) {
			var rig = engine.RigOf(object);
			var lamp = ((rig && rig.Lamps) || [])[index];

			return lamp ? Object.assign({}, Lamps[lamp.Kind] || Lamps.head, lamp) : null;
		}

		/* The glow of the glass of a lamp, if it is lit: its colour as bright as it is. */
		engine.LampGlow = function (object, piece) {
			var vehicle = engine.RigOf(object);
			var lamp = vehicle && piece.Opening && piece.Opening.indexOf('lamp-') === 0 ? lampOf(object, Number(piece.Opening.slice(5))) : null;
			var amount = lamp ? lampOn(object, lamp, piece.Side || 1) : 0;

			return amount > 0 ? engine.Paint(lamp.Color).slice(0, 3).map(function (part) {
				return part * given(lamp.Glow, 4) * amount;
			}) : null;
		};

		/* The light the lamps of the cars throw, from the middle of each glass (At, if told, on the left, mirrored on the right). */
		engine.VehicleLamps = function () {
			var lamps = [];

			scene.Order.forEach(function (object) {
				var vehicle = object.Rig ? engine.RigOf(object) : null;
				if (!vehicle || !vehicle.Lamps || !vehicle.LampPlaces || !object.World || !object.Turn) return;

				var size = object.Scaled || [object.Size || 1, object.Size || 1, object.Size || 1];
				var base = math.Multiply(object.Turn, math.Scaling(size[0], size[1], size[2]));

				vehicle.Lamps.forEach(function (each, index) {
					var lamp = lampOf(object, index);
					var places = vehicle.LampPlaces['lamp-' + index] || {};

					[1, -1].forEach(function (side) {
						var amount = lampOn(object, lamp, side);
						var place = lamp.At ? [lamp.At[0] * side, lamp.At[1], lamp.At[2]] : places[side];
						var aim = lamp.Aim || [0, 0, 1];

						if (amount <= 0 || !place || lamp.Power <= 0) return;

						lamps.push({Object: object, Built: true, At: vectors.Add(object.World, math.Apply(base, place)), Settings: {Color: lamp.Color, Power: given(lamp.Power, 1) * amount, Radius: given(lamp.Radius, 10), Spot: given(lamp.Spot, 0), Aim: vectors.Subtract(math.Apply(object.Turn, aim), math.Apply(object.Turn, [0, 0, 0]))}});
					});
				});
			});

			return lamps;
		};

		/* Where the mounts of a vehicle stand now: of its model, so in its size and turned with it. */
		engine.MountsOf = function (object) {
			var vehicle = object.Values.Vehicle;
			var turn = object.Turn || math.Identity();
			var size = object.Size || 1;

			if (!vehicle || !vehicle.Mounts || !object.World) return [];

			return vehicle.Mounts.map(function (mount, index) {
				var at = vectors.Scale(mount.At || [0, 0, 0], size);
				var aim = mount.Aim || [0, 0, 1];

				return {Kind: mount.Kind || '', Index: index, Mount: mount, At: vectors.Add(object.World, math.Apply(turn, at)), Aim: vectors.Subtract(math.Apply(turn, aim), math.Apply(turn, [0, 0, 0]))};
			});
		};

		scene.Vehicles = {car: car, ship: ship, boat: boat};

		/* Where a ship stands and how it lies, of its axes: for what flies it otherwise (SceneLanding). */
		engine.PlaceShip = placeShip;

		/* Which roles of parts there are now: a scene settles again when they change. */
		engine.RigsVersion = function () {
			return roles.Version();
		};

		/* What moves of the objects that are not driven (a door of a house, a door of a parked car) comes to where it is set. */
		engine.RigsStep = function (elapsed) {
			scene.Order.forEach(function (object) {
				if (object.Rig && object.Rig.Made && object.Rig.Made.Openings.length && !(object.ID === scene.Hero && object.Values.Vehicle))
					openingsStep(object, elapsed);
			});
		};

		/* A step of what is driven; false if the hero is no vehicle. */
		engine.VehicleStep = function (hero, keys, elapsed) {
			var settings = hero.Values.Vehicle;
			var step = settings ? scene.Vehicles[settings.Kind] : null;
			if (!step)
				return false;

			step(hero, keys, elapsed);

			return true;
		};
	},

	/*
	 * The roles of the parts of an object (ModelRoles of its model): [{ID, Kind, Name, Value}], Value where each stands, 0 to
	 * 1 (a spin: how fast it goes, a lamp: how bright).
	 */
	Parts: function (id) {
		var object = this.Scene().Objects[id];
		var name = object ? object.Values.Model || object.Traits.Model && object.Traits.Model.Shape : '';
		var part = this.Part.bind(this);

		return name ? this.$Service('ModelRoles').Get(name).map(function (role) {
			return {ID: role.ID, Kind: role.Kind, Name: role.Name || '', Value: part(id, role.ID).Get()};
		}) : [];
	},

	/*
	 * A part of an object by its role: {ID, Role, Get(), Set(value)}: Set moves it there (0 as its model has it, 1 as far as it
	 * goes; a spin: how fast it goes; a lamp: how bright it is), by degrees as its Pace says, and the scene emits part ({ID,
	 * Role, Value}). What the parts it carries (Follow) follow comes with it. Null for a role the model has not.
	 */
	Part: function (id, role) {
		var self = this;
		var engine = this.Engine();
		var object = this.Scene().Objects[id];
		var rig = object ? engine.RigOf(object) : null;
		var name = 'role:' + role;
		var opening = rig ? (rig.Openings || []).filter(function (each) {
			return each.Name === name;
		})[0] : null;
		var lamp = rig && !opening ? (rig.Lamps || []).filter(function (each) {
			return each.Role === role;
		})[0] : null;
		if (!opening && !lamp) return null;

		return {
			ID: id,
			Role: role,
			Get: function () {
				var state = object.Opens || {};

				if (opening && opening.Spin)
					return Number(opening.Open) || 0;

				return state[name] === undefined ? Number((opening || lamp).Open) || 0 : state[name];
			},
			Set: function (value) {
				var amount = Number(value) || 0;

				if (opening) {
					opening.Open = amount;
				}
				else {
					lamp.Open = amount;
					object.Opens = object.Opens || {};
					object.Opens[name] = amount;
				}

				self.$Emit('part', {ID: id, Role: role, Value: amount});
			}
		};
	},

	/* Moves what opens on a vehicle, 0 as its model has it, 1 as far as it goes; it goes there by degrees. */
	OpenPart: function (id, name, amount) {
		var object = this.Scene().Objects[id];
		var vehicle = object ? this.Engine().RigOf(object) : null;

		((vehicle && vehicle.Openings) || []).forEach(function (opening) {
			if (opening.Name === name)
				opening.Open = amount;
		});
	},

	/*
	 * Sends a ship far at once: kind warp (into a tunnel of light and out of it) or jump (a dash on the afterburner); options {To,
	 * Length, Enter, Inside, Exit, Tint}. The travel event tells each phase, callback(error, {ID, Kind, At}) its end.
	 */
	Travel: function (id, kind, options, callback) {
		var object = this.Scene().Objects[id];
		if (!this.Engine().Travel(object, kind, options, callback) && callback)
			callback(new Error('Elemenx Scene: ' + id + ' cannot ' + kind + ' now'));
	},

	/* What a vehicle is built of, of a kind or all, where each stands now: [{Kind, At, Aim, Mount}]. */
	MountsOf: function (id, kind) {
		var engine = this.Engine();
		var object = this.Scene().Objects[id];

		return object ? engine.MountsOf(object).filter(function (one) {
			return !kind || one.Kind === kind;
		}) : [];
	},

	/* Adds kinds of vehicles: {Kind: function (hero, keys, elapsed)}. */
	Vehicles: function (kinds) {
		Object.assign(this.Scene().Vehicles, kinds);
	}
});
