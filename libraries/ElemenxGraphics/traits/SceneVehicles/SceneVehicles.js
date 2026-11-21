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
 * J jumps as long as it is held (Travel(id, kind, options, callback)), with Warp and Jump of its Vehicle: {To, Step, Hold, Length,
 * Join, Relay, Well, Enter, Exit, Tint}; H again in warp comes out of it, [ and ] its step down and up (TravelStop, TravelStep).
 * A warp is a tunnel of its own (an ID; others may catch up with it: Join), out of normal space: nothing stops it but a
 * blocker of warp (the trait WarpBlocker of any object: Radius in its sizes, Active); it cannot start in the well of a body
 * (Well: how much of its pull at its surface; 0: anywhere), it never comes out in a body. Its speed is its step (Steps:
 * km/s; a relay, the trait WarpRelay {To, Step, Reach}, has its own); a jump goes in normal space, a body on its way stops
 * it. Each ship on its way tells the Ether (travel: {Kind, Phase, Step, Speed km/s, Tunnel, To, Left km, Reason, By, Passing:
 * [{ID, Name, Pass km, Seconds, Distance km}]}) once a frame; the event travel tells each phase, refused (Reason well,
 * blocked, relay), joined, and why it came out (Reason arrived, command, blocked, body, released, leader).
 * Aiming (Aim(id), AimAlign(on)): T takes what lies nearest the nose of the ship driven, G turns it there by itself; its
 * lead is where that will be when it gets there at its step of warp; marks over the view (.elemenx-scene-sight) and the
 * Ether aim tell it; H with no place of its own goes there.
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

			if (vehicle) made = Object.assign({}, vehicle, {Openings: (vehicle.Openings || []).concat(made.Openings), Lamps: (vehicle.Lamps || []).concat(made.Lamps), RoleWheels: made.Wheels, Sockets: made.Sockets, Emitters: made.Emitters, Colliders: made.Colliders, Source: vehicle});
			else if (made.Openings.length || made.Lamps.length || made.Wheels.length || made.Sockets.length || made.Emitters.length || made.Colliders.length) made = {Rigged: true, Openings: made.Openings, Lamps: made.Lamps, RoleWheels: made.Wheels, Sockets: made.Sockets, Emitters: made.Emitters, Colliders: made.Colliders};
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
			else if (opening.Stretch) {
				/* Longer along its way from its mount, as far as it is told (1: twice as long). */
				var mount = opening.Stretch.Pivot;
				var w = vectors.Normalize(opening.Stretch.Way);
				var k = Math.max(0.2, 1 + state[opening.Name]) - 1;
				var grow = [1 + k * w[0] * w[0], k * w[0] * w[1], k * w[0] * w[2], 0, k * w[1] * w[0], 1 + k * w[1] * w[1], k * w[1] * w[2], 0, k * w[2] * w[0], k * w[2] * w[1], 1 + k * w[2] * w[2], 0, 0, 0, 0, 1];

				own = math.Multiply(math.Translation(mount[0], mount[1], mount[2]), math.Multiply(grow, math.Translation(-mount[0], -mount[1], -mount[2])));
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

		/* Where a gear lever stands in each gear: [ahead, aside], 1 as far as it goes. An automatic has R, N and D; a manual an H (resources/vehicles/gates.json). */
		var Gates = Elemenx.Resources('Data', 'ElemenxGraphics/vehicles/gates') || {};

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
					return drivenMore(object, opening, car);
			}
		}

		var Corners = {FL: 0, FR: 1, RL: 2, RR: 3};

		/*
		 * What else drives a part, as far as it goes: the travel of the spring of its wheel (stroke, in Lengths of it), the
		 * steering of its wheel (wheel-steer, radians) and its roll (roll, turns), the speed and the rpm (0 to 1), the controls of
		 * what flies (pitch, yaw, roll-air: -1 to 1; throttle, flaps; airborne: 1 while it flies), the aim of the object (aim-yaw,
		 * aim-pitch: degrees of Aim), a shot (fire: 1 as it fires, then less), the wind and the time of day (wind; clock-hour,
		 * clock-minute: turns). Hinges of degrees (Angle 57.2958) take radians, of 360 turns.
		 */
		function drivenMore (object, opening, car) {
			var corner = Corners[opening.Corner] === undefined ? 0 : Corners[opening.Corner];
			var settings = object.Values.Vehicle || {};
			var ship = object.Ship || null;
			var spin = ship && ship.Spin || [0, 0, 0];
			var turn = given(settings.Turn, 1.5) || 1.5;
			var aim = object.Values.Aim || {};
			var hour = scene.Ground && scene.Ground.Hour !== undefined && scene.Ground.Hour !== null ? scene.Ground.Hour : 12;

			switch (opening.Drive) {
				case 'stroke':
					return [(object.Strokes || car.Strokes || [0, 0, 0, 0])[corner] / (object.Size || 1) / given(opening.Length, 0.3), 0];
				case 'wheel-steer':
					return [corner < 2 ? (car.Steer || 0) * 0.5 : 0, 0];
				case 'roll':
					return [(car.Spin || 0) / (Math.PI * 2), 0];
				case 'speed':
					return [Math.min(1, Math.abs(car.Forward || 0) / Math.max(1, given(settings.Top, physics.CarDefaults.Top))), 0];
				case 'rpm':
					return [Math.min(1, (car.Rpm || 0) / Math.max(1, given(settings.Redline, physics.CarDefaults.Redline))), 0];
				case 'pitch':
					return [Math.max(-1, Math.min(1, spin[0] / turn)), 0];
				case 'yaw':
					return [Math.max(-1, Math.min(1, spin[1] / turn)), 0];
				case 'roll-air':
					return [Math.max(-1, Math.min(1, spin[2] / turn)), 0];
				case 'throttle':
					return [ship ? Math.abs(ship.Throttle || 0) : (object.Controls || {}).Gas || 0, 0];
				case 'flaps':
					return [ship && Math.abs(ship.Throttle || 0) < 0.3 ? 1 : 0, 0];
				case 'airborne':
					return [ship && !object.Landed ? 1 : 0, 0];
				case 'aim-yaw':
					return [given(aim.Yaw, 0), 0];
				case 'aim-pitch':
					return [given(aim.Pitch, 0), 0];
				case 'fire':
					return [object.Values.Fired === undefined ? 0 : Math.exp(-Math.max(0, scene.Seconds - Number(object.Values.Fired)) * 12), 0];
				case 'wind':
					return [Math.max(0.1, scene.Gust || 0), 0];
				case 'clock-hour':
					return [(hour % 12) / 12, 0];
				case 'clock-minute':
					return [(hour * 60 % 60) / 60, 0];
				default:
					return null;
			}
		}

		/* Drives that are where they say at once: no pace. */
		var Instant = {steer: true, wipers: true, stroke: true, 'wheel-steer': true, roll: true, pitch: true, yaw: true, 'roll-air': true, 'aim-yaw': true, 'aim-pitch': true, fire: true, 'clock-hour': true, 'clock-minute': true};

		/* What moves comes to where it is told or driven: a door slowly, what a hand moves fast (Pace, a second). */
		function openingsStep (object, elapsed) {
			var rig = engine.RigOf(object);

			emitStep(object, rig, elapsed);

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

				state[opening.Name] = Instant[opening.Drive] || opening.Pace === 0 ? wanted : now + Math.max(-pace, Math.min(pace, wanted - now));

				if (driven)
					state[opening.Name + ':aside'] = aside + Math.max(-pace, Math.min(pace, driven[1] - aside));
			});
		}

		/* The middle of the parts of a role in the space of its model, once: where a socket or an emitter is when it has no At. */
		function middleOf (object, entry) {
			var name = object.Values.Model || object.Traits.Model && object.Traits.Model.Shape;
			var model;
			var sum = [0, 0, 0];
			var count = 0;

			if (entry.At)
				return entry.At;

			if (entry.Middle)
				return entry.Middle;

			if (!name || !library.Has(name) || !library.Ready(name)) return [0, 0, 0];

			model = library.Make(name);

			(entry.Parts || []).forEach(function (part) {
				var piece = model.Pieces.filter(function (each) {
					return each.ID === part.Piece;
				})[0];
				var n;
				var i;

				if (!piece) return;

				n = (piece.Placed || piece.Geometry).Positions.length / 3;

				for (i = 0; i < n; i += Math.max(1, Math.floor(n / 200))) {
					var p = placeOf(piece, i);

					sum = vectors.Add(sum, p);
					count++;
				}
			});

			entry.Middle = count ? vectors.Scale(sum, 1 / count) : [0, 0, 0];

			return entry.Middle;
		}

		/* A point of the model of an object in the world: as large and turned as the object. */
		function worldOf (object, point) {
			var settings = object.Traits.Model || {};
			var scale = object.Scaled || vectors.Scale(settings.Scale || [1, 1, 1], object.Size || 1);

			return vectors.Add(object.World || [0, 0, 0], math.Apply(object.Turn || math.Identity(), [point[0] * scale[0], point[1] * scale[1], point[2] * scale[2]]));
		}

		/* What a part gives off (Emitters: smoke of an exhaust, of a chimney): a burst every 1/Rate s while what drives it is on. */
		function emitStep (object, rig, elapsed) {
			if (!rig || !rig.Emitters || !rig.Emitters.length || !object.World || !self.Burst) return;

			object.Emitted = object.Emitted || {};

			rig.Emitters.forEach(function (emitter) {
				var on = emitter.Drive ? drivenOf(object, {Drive: emitter.Drive}) : [1, 0];
				var left = (object.Emitted[emitter.Role] || 0) + elapsed * emitter.Rate * Math.max(0.15, on ? Math.abs(on[0]) : 0);

				if (left < 1) {
					object.Emitted[emitter.Role] = left;

					return;
				}

				object.Emitted[emitter.Role] = left % 1;

				/* As many as the time asks, a few at most after a long step. */
				for (left = Math.min(8, Math.floor(left)); left > 0; left--)
					self.Burst(emitter.Effect, worldOf(object, middleOf(object, emitter)));
			});
		}

		/* Where a socket of an object is in the world (a role socket of its model by Name or ID): {At, Axis}, or null. */
		engine.SocketOf = function (object, name) {
			var rig = engine.RigOf(object);
			var socket = rig && rig.Sockets ? rig.Sockets.filter(function (each) {
				return each.Name === name || each.Role === name;
			})[0] : null;
			var axis;

			if (!socket || !object.World) return null;

			axis = math.Apply(object.Turn || math.Identity(), socket.Axis || [0, 1, 0]);

			return {At: worldOf(object, middleOf(object, socket)), Axis: vectors.Normalize(axis)};
		};

		/* The outlines in the world (x, z, turning either way) of the parts of an object with the role collider, and their bottom and top. */
		engine.RoleColliders = function (object) {
			var rig = engine.RigOf(object);
			var name = object.Values.Model || object.Traits.Model && object.Traits.Model.Shape;
			var model;
			var made = [];

			if (!rig || !rig.Colliders || !rig.Colliders.length || !object.World || !name || !library.Ready(name)) return made;

			model = library.Make(name);

			rig.Colliders.forEach(function (collider) {
				var points = [];
				var low = Infinity;
				var high = -Infinity;

				collider.Parts.forEach(function (part) {
					var piece = model.Pieces.filter(function (each) {
						return each.ID === part.Piece;
					})[0];
					var n;
					var i;

					if (!piece) return;

					n = (piece.Placed || piece.Geometry).Positions.length / 3;

					for (i = 0; i < n; i++) {
						var p = worldOf(object, placeOf(piece, i));

						points.push([p[0], p[2]]);

						low = Math.min(low, p[1]);
						high = Math.max(high, p[1]);
					}
				});

				if (points.length > 2)
					made.push({ID: object.ID + ':' + collider.Role, Points: points, Bottom: low, Top: high});
			});

			return made;
		};

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

		/*
		 * How far from its middle a body stops a ship: a giant of gas or of ices at its core (the Floor of its envelope: all over
		 * it is its air, gone through), any other at its surface (and a little over it).
		 */
		function solidOf (object) {
			var surface = (object.Traits || {}).Surface;
			var made;

			if (surface && self.$Service('ScenePlanet').Giant(surface.Type) && engine.EnvelopeOf && object.Radius) {
				made = engine.EnvelopeOf(object);

				if (made && isFinite(made.Floor) && made.Floor < 0)
					return object.Size * Math.max(0.01, 1 + made.Floor / object.Radius);
			}

			return object.Size * 1.01;
		}

		engine.SolidOf = solidOf;

		/* Whether a ball at a place of the world meets what an object is: the way out of it and how deep, or null. */
		function meeting (object, at, radius) {
			var traits = object.Traits || {};
			var name = object.Values.Model;
			var apart;
			var far;

			if (traits.Body || traits.Star) {
				apart = vectors.Subtract(at, object.World);
				far = vectors.Length(apart);

				var solid = solidOf(object);

				return far < solid + radius ? {Normal: vectors.Scale(apart, 1 / (far || 1)), Depth: solid + radius - far} : null;
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

			/* The colliders: each corner in one is pushed back out through its nearest side. */
			if (engine.ColliderHit) {
				corners.forEach(function (corner) {
					var hit = engine.ColliderHit(state.X + corner[0], state.Z + corner[1], state.Y + 0.4, 0);
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
			hero.Controls = {Gas: typeof input.Gas === 'number' ? input.Gas : input.Gas ? 1 : 0, Brake: Math.max(typeof input.Brake === 'number' ? input.Brake : input.Brake ? 1 : 0, input.Stop ? 1 : 0), Hand: input.Hand ? 1 : 0};

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

			/* On a wet road the wheels throw the water up behind them: more the faster and the wetter. */
			var wet = scene.Ground && scene.Ground.Air ? scene.Ground.Air.Wet || 0 : 0;

			hero.Splashed = (hero.Splashed || 0) + elapsed;

			if (wet > 0.25 && pace > 4 && hero.Splashed > Math.max(0.05, 0.22 - pace * 0.004)) {
				var aside = [ahead[1], -ahead[0]];

				hero.Splashed = 0;

				[-1, 1].forEach(function (side) {
					self.Burst('roadspray', [seen.X - ahead[0] * long * 0.85 + aside[0] * wide * side, seen.Y + 0.15, seen.Z - ahead[1] * long * 0.85 + aside[1] * wide * side], {Aim: [-ahead[0] * 0.7 + aside[0] * side * 0.2, 0.55, -ahead[1] * 0.7 + aside[1] * side * 0.2], Size: Math.min(1.2, 0.2 + pace * 0.02) * Math.min(1, wet * 1.5)});
				});
			}

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

		/* Where a ship is first, of its Vehicle: From (in sizes of what it is round), looking along Facing. */
		function shipState (hero, settings, around) {
			var first = vectors.Normalize(settings.Facing || [0, 0, 1]);
			var aside = vectors.Normalize(vectors.Cross([0, 1, 0], first));

			hero.Ship = {At: vectors.Scale(settings.From || [0, 0, 2], around ? around.Size : 1), Right: aside, Up: vectors.Cross(first, aside), Ahead: first, Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0.2};
			hero.Clock = {};

			return hero.Ship;
		}

		function ship (hero, keys, elapsed) {
			var settings = hero.Values.Vehicle;
			var around = settings.Around ? scene.Objects[settings.Around] : null;
			var state = hero.Ship;

			if (!state) {
				state = shipState(hero, settings, around);
				scene.Yaw = 0;
				scene.Pitch = 0.16;
			}

			/* H goes into warp, J jumps: each once a press. */
			if (!hero.Travel && keys.KeyH && !hero.Pressed) engine.Travel(hero, 'warp');
			else if (hero.Travel && hero.Travel.Kind === 'warp' && keys.KeyH && !hero.Pressed) engine.TravelStop(hero);

			if (!hero.Travel && keys.KeyJ && !hero.Pressed)
				engine.Travel(hero, 'jump', {Hold: true});

			hero.Pressed = !!(keys.KeyH || keys.KeyJ);

			/* Its hatches and doors open as they are told, as a car's do. */
			openingsStep(hero, elapsed);

			if (hero.Travel) {
				travelStep(hero, state, settings, around && around.World ? around.World : [0, 0, 0], elapsed, keys);

				return;
			}

			/*
			 * A pad: the left stick turns and tilts the ship as it leans (up the nose up, right to the right), the cross rolls (right
			 * and left) and lifts (up and down), the triggers set the throttle; the right stick turns the view (Scene). Regression:
			 * the left stick up put the nose down, and the right one rolled and lifted the ship.
			 */
			var pad = keys.Pad || {X: 0, Y: 0, LookX: 0, LookY: 0, Gas: 0, Brake: 0};
			var input = {Yaw: Math.max(-1, Math.min(1, (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - pad.X)), Pitch: Math.max(-1, Math.min(1, (keys.KeyR || keys.ArrowDown ? 1 : 0) - (keys.KeyF || keys.ArrowUp ? 1 : 0) + pad.Y)), Roll: Math.max(-1, Math.min(1, (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0) + (pad.DX || 0))), Throttle: Math.max(-1, Math.min(1, (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) + pad.Gas - pad.Brake)), Lift: Math.max(-1, Math.min(1, (keys.KeyC ? 1 : 0) - (keys.KeyX ? 1 : 0) + (pad.DY || 0))), Boost: keys.ShiftLeft || keys.ShiftRight, Stop: keys.Space};
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

				/* Into the mouth of a wormhole: out of the other one of its pair, going on the same way (SceneDeepSpace). */
				var passed = engine.DeepPass ? engine.DeepPass(hero, vectors.Add(origin, state.At)) : null;
				if (passed)
					state.At = vectors.Subtract(passed, origin);
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
		 * and more, as fast as a way down goes there; between bodies a way takes seconds to minutes, not days. Under the top of
		 * a giant (its air goes on down to its core) as deep as it is, as fast as so high over it. How high: over the body
		 * nearest (not only the one it flies round: out of a warp it is by another). Regression: out of a warp to a giant the
		 * ship went into it as fast as so far from the Earth it flew round.
		 */
		function real (settings, around, state) {
			var metre = engine.Metre();
			var speed = given(settings.Speed, 3000);
			var high;

			if (!metre)
				return settings;

			high = nearHeight(around && around.World ? vectors.Add(around.World, state.At) : state.At);
			high = isFinite(high) ? high : 60000;

			return Object.assign({}, settings, {Top: (speed + speed * (given(settings.Cruise, 1000) - 1) * Math.sqrt(Math.min(1, high / 60000))) * metre});
		}

		/* How fast a ship may go where it is now (of its Vehicle, as real sizes have it; scene units a second). */
		engine.ShipTop = function (hero) {
			var settings = hero && hero.Values.Vehicle;
			if (!settings || !hero.Ship) return 0;

			return given(real(settings, settings.Around ? scene.Objects[settings.Around] : null, hero.Ship).Top, 1);
		};

		/* How far (km, up or down) a place of the world is from the surface of the body nearest to it. */
		function nearHeight (at) {
			var least = Infinity;

			scene.Order.forEach(function (object) {
				if (!object.World || !object.Size || !object.Radius || !(object.Traits || {}).Body) return;

				least = Math.min(least, Math.abs((vectors.Distance(at, object.World) / object.Size - 1) * object.Radius));
			});

			return least;
		}

		function placeShip (hero, settings, at, right, up, ahead) {
			hero.Seen = {Right: right, Up: up, Ahead: ahead};
			hero.Flight = {At: at, Turn: math.Multiply([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, ahead[0], ahead[1], ahead[2], 0, 0, 0, 0, 1], math.Rotation([0, 1, 0], given(settings.Yaw, 0) * Math.PI / 180))};
			hero.World = at;
			hero.Turn = hero.Flight.Turn;
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

				return vectors.Subtract(target.World, vectors.Scale(way, standOff(hero, target) + driftOf(hero, travel, target)));
			}

			return null;
		}

		/*
		 * How far a ship goes on out of its way far at once, its speed falling as the square of what is left: a third of its
		 * many times its top a second over its Exit, never more than half how far it stands off what it went to, nor (straight
		 * ahead) than its speed then over its Exit. Regression: of a top of real sizes (thousands of km/s) it went on past the
		 * Moon it went to, its goal behind it.
		 */
		function driftOf (hero, travel, target) {
			if (target)
				return Math.min(travel.Drift, standOff(hero, target) * 0.5);

			return Math.min(travel.Drift, (travel.Speed || 0) * travel.Lengths.exit / 3);
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
		/* The numbers of a way far at once of the library (resources/vehicles/travel.json), under those of its Vehicle and those given. */
		function travelOf (settings, kind, options) {
			return Object.assign({}, (Elemenx.Resources('Data', 'ElemenxGraphics/vehicles/travel') || {})[kind] || {}, settings[kind === 'warp' ? 'Warp' : 'Jump'] || {}, options || {});
		}

		/* Units of the scene in a kilometre (of real sizes), else none (0). */
		function kilometre () {
			return engine.Metre ? engine.Metre() * 1000 : 0;
		}

		/*
		 * How fast a ship goes in a tunnel of warp at a step, in units of the scene a second: of Steps of its numbers (km/s, each
		 * ten times the last; past 6 the steps of relays); of no real sizes, 12 times its top at step 3, ten times a step.
		 */
		function stepSpeed (travel, top) {
			var steps = travel.Steps || [];
			var step = Math.max(1, Math.min(steps.length || 9, Math.round(travel.Step || 3)));

			if (kilometre() && steps.length)
				return steps[step - 1] * kilometre();

			return top * 12 * Math.pow(10, step - 3);
		}

		/*
		 * The body whose well a ship is too deep in to go into warp (Well: how much of the pull at its surface still holds a
		 * ship there; 0: none ever does): the deepest of them, or null.
		 */
		function wellOf (hero, well) {
			var deepest = null;

			if (!(well > 0)) return null;

			scene.Order.forEach(function (object) {
				var traits = object.Traits || {};
				var pull;

				if (object === hero || !object.World || !object.Size || !traits.Body && !traits.Star) return;

				pull = Math.pow(object.Size / Math.max(1e-9, vectors.Distance(object.World, hero.World)), 2);

				if (pull > well && (!deepest || pull > deepest.Pull))
					deepest = {Body: object, Pull: pull};
			});

			return deepest;
		}

		/* The blockers of warp (the trait WarpBlocker of any object: Radius in its sizes, Active): their middles and reach. */
		function blockers () {
			return scene.Order.filter(function (object) {
				var blocker = (object.Traits || {}).WarpBlocker;

				return blocker && blocker.Active !== false && blocker.Active !== 'false' && object.World;
			}).map(function (object) {
				return {ID: object.ID, At: object.World, Reach: given(object.Traits.WarpBlocker.Radius, 20) * (object.Size || 1)};
			});
		}

		function blockedAt (at) {
			return blockers().filter(function (blocker) {
				return vectors.Distance(blocker.At, at) < blocker.Reach;
			})[0] || null;
		}

		/* Where a way from a to b first comes into the reach of a blocker: {ID, Part (of the way, 0 to 1)}, or null. */
		function blockedOn (a, b) {
			var way = vectors.Subtract(b, a);
			var length = vectors.Dot(way, way);
			var best = null;

			if (length <= 0) return null;

			blockers().forEach(function (blocker) {
				var from = vectors.Subtract(a, blocker.At);
				var half = vectors.Dot(from, way);
				var c = vectors.Dot(from, from) - blocker.Reach * blocker.Reach;
				var disc = half * half - length * c;
				var part;

				if (c < 0 || disc < 0) return;

				part = (-half - Math.sqrt(disc)) / length;

				if (part >= 0 && part <= 1 && (!best || part < best.Part))
					best = {ID: blocker.ID, Part: part};
			});

			return best;
		}

		/* A point out of every body: on its way out of one it is in, as far from it as a ship stands off before it. */
		function outOfBodies (hero, point) {
			var out = point;

			scene.Order.forEach(function (object) {
				var traits = object.Traits || {};
				var apart;
				var far;

				if (object === hero || !object.World || !object.Size || !traits.Body && !traits.Star) return;

				apart = vectors.Subtract(out, object.World);
				far = vectors.Length(apart);

				if (far < object.Size * 1.2)
					out = vectors.Add(object.World, vectors.Scale(far > 1e-9 ? vectors.Scale(apart, 1 / far) : [0, 1, 0], object.Size + standOff(hero, object)));
			});

			return out;
		}

		/* The tunnels of warp of the scene by their IDs: {ID, Members (the IDs in it), Step, Permanent (of a relay)}. */
		function tunnels () {
			scene.Tunnels = scene.Tunnels || {};

			return scene.Tunnels;
		}

		function leaveTunnel (hero, travel) {
			var tunnel = travel.Tunnel ? tunnels()[travel.Tunnel] : null;
			if (!tunnel) return;

			tunnel.Members = tunnel.Members.filter(function (id) {
				return id !== hero.ID;
			});

			if (!tunnel.Members.length && !tunnel.Permanent)
				delete tunnels()[tunnel.ID];

			travel.Tunnel = '';
		}

		/*
		 * What a ship in warp goes by, the nearest first in time: each object near its way ahead (within a fifth of how far it
		 * is, or fifty of its sizes), how near it passes (km), in how many seconds, and how far it is now (km).
		 */
		function passing (hero, at, axis, speed) {
			var km = kilometre() || 1;

			return scene.Order.filter(function (object) {
				var traits = object.Traits || {};

				return object !== hero && object.World && !object.Hidden && (traits.Body || traits.Star || object.Values.Model || traits.WarpBlocker || traits.WarpRelay);
			}).map(function (object) {
				var to = vectors.Subtract(object.World, at);
				var along = vectors.Dot(to, axis);
				var aside = vectors.Length(vectors.Subtract(to, vectors.Scale(axis, along)));

				return {ID: object.ID, Name: object.Values.Name || object.ID, Along: along, Aside: aside, Size: object.Size || 0};
			}).filter(function (one) {
				return one.Along > 0 && one.Aside < Math.max(one.Size * 50, one.Along * 0.2);
			}).sort(function (a, b) {
				return a.Along - b.Along;
			}).slice(0, 6).map(function (one) {
				return {ID: one.ID, Name: one.Name, Pass: one.Aside / km, Seconds: speed > 0 ? one.Along / speed : Infinity, Distance: Math.hypot(one.Along, one.Aside) / km};
			});
		}

		/* What a ship on its way far at once tells (the Ether: travel, under its ID), once a frame while it goes. */
		function tellTravel (hero, travel, at, axis, ahead) {
			var slice = self.$Ether('travel');
			var km = kilometre() || 1;
			var goal = ahead || goalOf(hero, travel);
			var record = slice[hero.ID] = slice[hero.ID] || {};

			Object.assign(record, {Kind: travel.Kind, Phase: travel.Phase, Step: travel.Step, Speed: travel.Speed / km, Tunnel: travel.Tunnel || '', To: travel.Target || travel.To || '', Left: goal ? vectors.Distance(goal, at) / km : null, Light: travel.Kind === 'hyper' ? travel.Light : null, Reason: travel.Reason || '', By: travel.By || '', Passing: travel.Kind === 'warp' && travel.Phase === 'inside' ? passing(hero, at, axis, travel.Speed) : []});

			self.$Ether.Touch('travel', hero.ID);
		}

		/*
		 * How a warp or a jump looks (blueprints/vehicles/travel-look, or TravelLookGraph of the scene) in its phase (0 into
		 * it, 1 in it, 2 out of it), t of the phase, time in it: {Stretch, Tunnel, Flash, Shake, Wide, Lag, Pace}. Regression:
		 * curves of the code, three of each kind.
		 */
		function lookOf (phase, warp, t, time) {
			var graph = self.GraphOf('TravelLookGraph', 'vehicles/travel-look') || Elemenx.Resources('Blueprints', 'ElemenxGraphics/vehicles/travel-look');
			if (!scene.TravelLook || scene.TravelLook.Graph !== graph)
				scene.TravelLook = {Graph: graph, Code: self.$Service('Blueprints').Code(typeof graph === 'string' ? JSON.parse(graph) : JSON.parse(JSON.stringify(graph)))};

			return scene.TravelLook.Code.Run({}, {Phase: phase, Warp: warp ? 1 : 0, T: t || 0, Time: time || 0});
		}

		function travelStep (hero, state, settings, origin, elapsed, keys) {
			var travel = hero.Travel;
			/* Its top speed as it flies (of real sizes: its speed and its cruise by how high it is; else its Top). */
			var top = given(real(settings, settings.Around ? scene.Objects[settings.Around] : null, state).Top, 1);
			var warp = travel.Kind === 'warp' || travel.Kind === 'hyper';
			var t;
			var world;
			var look = {Stretch: 0, Tunnel: 0, Flash: 0, Shake: 0, Wide: 0, Lag: 0, Pace: 0};

			travel.Time += elapsed;
			t = travel.Phase === 'inside' ? 0 : Math.min(1, travel.Time / Math.max(1e-3, travel.Lengths[travel.Phase]));
			world = vectors.Add(origin, state.At);

			/* Its step of warp up and down on the way ([ and ]); H again, out of it where it is. */
			if (warp && travel.Phase === 'inside' && !travel.Relay) {
				if (keys.BracketRight && !travel.Keyed)
					travel.Step = Math.min(6, travel.Step + 1);

				if (keys.BracketLeft && !travel.Keyed)
					travel.Step = Math.max(1, travel.Step - 1);

				travel.Keyed = !!(keys.BracketRight || keys.BracketLeft);
			}

			if (travel.Phase === 'enter') {
				var target = travel.Kind === 'hyper' ? null : targetOf(hero, travel, world);
				if (target || travel.Way)
					aimShip(state, travel.Way || vectors.Normalize(vectors.Subtract(target.World, world)), Math.min(1, elapsed * Math.max(2.5, 5 / travel.Lengths.enter)));

				/* Into warp it turns at the speed it had, slower if that is more than a part of its top: never far on the way in. */
				state.Way = vectors.Lerp(state.Way, vectors.Scale(state.Ahead, warp ? Math.min(vectors.Length(state.Way), top * 0.15) : top * 0.6), Math.min(1, elapsed * 2));
				state.At = vectors.Add(state.At, vectors.Scale(state.Way, elapsed));

				hero.Thrust = warp ? 0.3 + 2.7 * t * t : 1 + 2 * t;

				look = lookOf(0, warp, t, travel.Time);

				if (t >= 1) {
					travel.Start = vectors.Add(origin, state.At);
					travel.Target = target ? target.ID : '';
					travel.Axis = travel.Way ? travel.Way.slice() : state.Ahead.slice();
					travel.Speed = vectors.Length(state.Way);

					/* A jump straight ahead of a length: to as far as told (seconds of its top speed); held, as long as it is held. */
					/* Of what it flies round (it goes on round its star): its goal with it. */
					if (!warp && !target && !travel.Hold)
						travel.Ahead = vectors.Add(state.At, vectors.Scale(travel.Axis, travel.Length * top));

					if (target)
						travel.Axis = vectors.Normalize(vectors.Subtract(goalOf(hero, travel), travel.Start));

					/* Its tunnel: of the relay it goes by (for good), else one of its own. */
					if (warp) {
						travel.Tunnel = travel.Relay ? 'relay:' + [travel.Relay, travel.To].sort().join('-') : 'tunnel-' + (scene.TunnelCount = (scene.TunnelCount || 0) + 1);
						tunnels()[travel.Tunnel] = tunnels()[travel.Tunnel] || {ID: travel.Tunnel, Members: [], Step: travel.Step, Permanent: !!travel.Relay};

						tunnels()[travel.Tunnel].Members.push(hero.ID);
					}

					next(hero, travel, 'inside');
				}
			}
			else if (travel.Phase === 'inside') {
				var goal = travel.Ahead ? vectors.Add(origin, travel.Ahead) : goalOf(hero, travel);
				var axis = goal && vectors.Distance(goal, world) > 1e-9 ? vectors.Normalize(vectors.Subtract(goal, world)) : travel.Axis;
				var left = goal ? vectors.Distance(goal, world) : Infinity;
				var aim = warp ? stepSpeed(travel, top) : top * given(travel.Pace, 5);
				var leader = travel.Leader ? scene.Objects[travel.Leader] : null;
				var end = '';
				var step;
				var to;
				var blocked;
				var clear;

				/* Up to the speed of its step over Ramp seconds, and down as it nears its goal (Brake: seconds of its way left at most). */
				travel.Speed += (aim - travel.Speed) * Math.min(1, elapsed / Math.max(0.05, travel.Ramp));

				if (isFinite(left))
					travel.Speed = Math.min(travel.Speed, Math.max(left / Math.max(0.05, travel.Brake), aim * 0.01));

				step = travel.Speed * elapsed;

				/* In normal space (a jump) a body on its way stops it before it. */
				if (!warp) {
					clear = clearAhead(hero, world, axis, Infinity);

					if (clear <= step) {
						step = clear;
						end = 'body';
					}
				}

				if (step >= left) {
					step = left;
					end = end || 'arrived';
				}

				to = vectors.Add(world, vectors.Scale(axis, step));

				/* In the tunnel of another it caught up with: as it goes, where it was beside it. */
				if (leader && leader.Travel && leader.Travel.Phase === 'inside' && leader.Travel.Tunnel === travel.Tunnel) {
					to = vectors.Add(leader.World, travel.Offset);
					axis = leader.Travel.Axis || axis;
					travel.Speed = leader.Travel.Speed;
				}
				else if (leader) {
					end = end || 'leader';
				}

				/* Catching up with the tunnel of another (Join: its ID): a step not lower, near its axis (Capture, km). */
				if (warp && travel.Join && !leader)
					joinTunnel(hero, travel, to);

				/* Of all of space only a blocker of warp stops a tunnel: at the edge of its reach. */
				if (warp) {
					blocked = blockedOn(world, to);

					if (blocked) {
						to = vectors.Add(world, vectors.Scale(vectors.Subtract(to, world), blocked.Part));
						end = 'blocked';
						travel.By = blocked.ID;
					}
				}

				/* Of light-years: as many as it goes a second (HyperSpeed, ramped as its speed is), arrived where none are left. */
				if (travel.Kind === 'hyper') {
					travel.Light = Math.max(0, travel.Light - travel.HyperSpeed * Math.min(1, travel.Speed / Math.max(1e-9, aim)) * elapsed);

					if (travel.Light <= 0)
						end = end || 'arrived';
				}

				if (travel.Stop)
					end = end || 'command';

				if (!warp && travel.Hold && !keys.KeyJ)
					end = end || 'released';

				aimShip(state, axis, Math.min(1, elapsed * 4));

				state.At = vectors.Subtract(to, origin);
				state.Way = vectors.Scale(state.Ahead, travel.Speed);
				travel.Axis = axis;

				hero.Thrust = 3;

				look = lookOf(1, warp, 0, travel.Time);

				if (end) {
					/* Never out in a body: a tunnel goes through them, its way out on their outside. */
					to = outOfBodies(hero, to);
					state.At = vectors.Subtract(to, origin);
					travel.Reason = end;
					travel.Exit = to;
					travel.Coast = driftOf(hero, travel, travel.Target ? scene.Objects[travel.Target] : null);

					leaveTunnel(hero, travel);

					next(hero, travel, 'exit');

					/* At the star it jumped to: its system, at once (the ship of a game made there again: event travel Phase arrived). */
					if (travel.Kind === 'hyper' && end === 'arrived' && self.EnterSystem)
						arrive(hero, travel);
				}
			}
			else {
				/* Its speed out falls as the square of what is left: over its Exit it goes as far as it was to drift (Coast). */
				var fast = (travel.Coast === undefined ? top * (warp ? 12 : 5) : travel.Coast * 3 / Math.max(1e-3, travel.Lengths.exit)) * (1 - t) * (1 - t);

				state.Way = vectors.Scale(state.Ahead, top * Math.max(state.Throttle, 0.4) + fast);
				state.At = vectors.Add(state.At, vectors.Scale(state.Way, elapsed));

				hero.Thrust = Math.max(Math.abs(state.Throttle), 3 * (1 - t));

				look = lookOf(2, warp, t, travel.Time);

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

			tellTravel(hero, travel, hero.World, travel.Axis || state.Ahead, travel.Ahead ? vectors.Add(origin, travel.Ahead) : null);

			if (hero.Travel) {
				travel.Flow += elapsed * look.Pace;

				scene.Warp = Object.assign(look, {Kind: travel.Kind, Phase: travel.Phase, ID: hero.ID, Axis: travel.Axis || state.Ahead.slice(), Flow: travel.Flow, Tint: travel.Tint});
			}
		}

		/*
		 * A ship in warp that would catch up with the tunnel of another (Join: its ID): once it is near the axis of one in it
		 * (Capture, km; a scene of no real sizes: its sizes) and goes at a step not lower than the tunnel's, it is in that tunnel,
		 * beside that one, as long as it goes.
		 */
		function joinTunnel (hero, travel, at) {
			var tunnel = tunnels()[travel.Join];
			var reach = travel.Capture * (kilometre() || hero.Size || 1);

			if (!tunnel || tunnel.ID === travel.Tunnel || travel.Step < tunnel.Step) return;

			tunnel.Members.some(function (id) {
				var other = scene.Objects[id];
				var way = other && other.Travel ? other.Travel.Axis : null;
				var to;
				var aside;

				if (!other || !way || other === hero || other.Travel.Phase !== 'inside') return false;

				to = vectors.Subtract(at, other.World);
				aside = vectors.Length(vectors.Subtract(to, vectors.Scale(way, vectors.Dot(to, way))));

				if (aside > reach) return false;

				leaveTunnel(hero, travel);

				travel.Tunnel = tunnel.ID;
				travel.Leader = id;
				travel.Offset = vectors.Subtract(at, other.World);
				travel.Target = other.Travel.Target;

				tunnel.Members.push(hero.ID);

				self.$Emit('travel', {ID: hero.ID, Kind: travel.Kind, Phase: 'joined', Tunnel: tunnel.ID, By: id});

				return true;
			});
		}

		/*
		 * Into the system of the star it jumped to, at the start of the next frame (TravelersStep): the scene is made again
		 * there, before its objects are placed. Regression: made again in the step of the ship, the same frame drew objects of no
		 * place yet, and threw.
		 */
		function arrive (hero, travel) {
			scene.Arriving = {ID: hero.ID, Travel: travel};
		}

		function arrived (id, travel) {
			self.EnterSystem(travel.Galaxy, function (error) {
				self.$Emit('travel', {ID: id, Kind: 'hyper', Phase: 'arrived', To: travel.To, Galaxy: travel.Galaxy, Error: error ? error.message : ''});

				if (travel.Callback)
					travel.Callback(error || null, {ID: id, Kind: 'hyper', Galaxy: travel.Galaxy, Reason: 'arrived'});
			}, {Now: true});
		}

		/* The next phase of a way far at once: told as an event (why it came out, what stopped it, its tunnel), and to whom asked for it at its end. */
		function next (hero, travel, phase) {
			travel.Phase = phase;
			travel.Time = 0;

			self.$Emit('travel', {ID: hero.ID, Kind: travel.Kind, Phase: phase, Reason: travel.Reason || '', By: travel.By || '', Tunnel: travel.Tunnel || ''});

			if (phase === 'done' && travel.Callback)
				travel.Callback(null, {ID: hero.ID, Kind: travel.Kind, At: hero.World.slice(), Reason: travel.Reason || ''});
		}

		/* A way far at once that cannot be: told (Phase refused, Reason: well, blocked or relay, By), kept for Travel to tell. */
		function refused (hero, kind, reason, by) {
			hero.Refused = {Kind: kind, Reason: reason, By: by};

			self.$Emit('travel', {ID: hero.ID, Kind: kind, Phase: 'refused', Reason: reason, By: by});

			return false;
		}

		/*
		 * Sends a ship far at once, kind warp (into a tunnel of its own, out of normal space: nothing there stops it but a
		 * blocker of warp) or jump (a dash in normal space: a body on its way stops it); options {To (the ID of what it goes
		 * to), Step (of warp, 1 to 6), Hold (a jump as long as J is held), Length (a jump straight ahead: seconds of its top
		 * speed), Join (the ID of a tunnel to catch up with), Relay (the ID of a relay it is by: to the one it is joined to),
		 * Well (how much of the pull of a body still holds it out of warp; 0: none), Enter, Exit (seconds), Tint}, over Warp
		 * or Jump of its Vehicle. False if it cannot go (refused: why).
		 */
		engine.Travel = function (hero, kind, options, callback) {
			var settings = hero && hero.Values.Vehicle;
			var made;
			var relay;
			var well;
			var blocker;

			if (hero)
				hero.Refused = null;

			if (!settings || settings.Kind !== 'ship' || hero.Travel || (kind !== 'warp' && kind !== 'jump')) return false;

			/* A ship no player drove yet: where its Vehicle puts it. */
			if (!hero.Ship)
				shipState(hero, settings, settings.Around ? scene.Objects[settings.Around] : null);

			made = travelOf(settings, kind, options);

			/* The ship driven goes to what it aims at, when it is told no place of its own. */
			if (hero.ID === scene.Hero && !(options && options.To) && scene.Aim && scene.Aim.Target && targetById(hero, scene.Aim.Target))
				made.To = scene.Aim.Target;

			/* To a star of the galaxy: an interstellar jump (hyper), out of its well far enough (HyperWell). */
			if (kind === 'warp' && /^star:/.test(String(made.To || ''))) return hyper(hero, settings, made, callback);

			relay = made.Relay ? scene.Objects[made.Relay] : null;

			/* By a relay: from within its reach to the one it is joined to, by a tunnel of the two and its step. */
			if (made.Relay && !(relay && relay.World && (relay.Traits || {}).WarpRelay && scene.Objects[relay.Traits.WarpRelay.To] && vectors.Distance(relay.World, hero.World) <= given(relay.Traits.WarpRelay.Reach, 30) * (relay.Size || 1))) return refused(hero, kind, 'relay', made.Relay);

			if (kind === 'warp' && !relay) {
				well = wellOf(hero, given(made.Well, 0.15));

				if (well)
					return refused(hero, kind, 'well', well.Body.ID);
			}

			blocker = kind === 'warp' ? blockedAt(hero.World) : null;

			if (blocker)
				return refused(hero, kind, 'blocked', blocker.ID);

			hero.Travel = {Kind: kind, Phase: 'enter', Time: 0, Flow: 0, Speed: 0, Gone: 0, To: relay ? relay.Traits.WarpRelay.To : made.To || '', Relay: relay ? relay.ID : '', Join: made.Join || '', Hold: !!made.Hold, Step: relay ? given(relay.Traits.WarpRelay.Step, 8) : given(made.Step, 3), Steps: made.Steps || [], Ramp: given(made.Ramp, 2), Brake: given(made.Brake, 1.2), Pace: given(made.Speed, 5), Capture: given(made.Capture, 50), Length: given(made.Length, 0), Lengths: {enter: given(made.Enter, 1), exit: given(made.Exit, 1)}, Tint: engine.Paint(made.Tint).slice(0, 3), Callback: callback || null};

			/* Out of it, it goes on at many times its top speed, falling as the square of what is left: a third of that way. */
			hero.Travel.Drift = given(real(settings, settings.Around ? scene.Objects[settings.Around] : null, hero.Ship).Top, 1) * (kind === 'warp' ? 12 : 5) * hero.Travel.Lengths.exit / 3;

			self.$Emit('travel', {ID: hero.ID, Kind: kind, Phase: 'enter'});

			return true;
		};

		/*
		 * The ships on a way far at once no player drives (a wing in the tunnel of its leader, a ship a game sent): each goes on
		 * as the one driven does, of no keys.
		 */
		engine.TravelersStep = function (elapsed) {
			var arriving = scene.Arriving;

			if (arriving) {
				scene.Arriving = null;

				arrived(arriving.ID, arriving.Travel);

				return;
			}

			/* The marks of aiming only over a ship driven in space. */
			var hero = scene.Hero ? scene.Objects[scene.Hero] : null;

			if (hero && hero.Ship && hero.Values.Vehicle && hero.Values.Vehicle.Kind === 'ship' && !scene.Ground && !scene.Surface) {
				/* What it aims at (T, G), its marks over the view: every frame, however it flies (in orbit too). */
				aimStep(hero, engine.PadKeys ? engine.PadKeys(scene.Keys || {}) : scene.Keys || {}, elapsed);
			}
			else if (scene.Aim) {
				engine.AimClear();
			}

			scene.Order.forEach(function (object) {
				var settings = object.Values.Vehicle;
				var around;

				if (!object.Travel || !object.Ship || object.ID === scene.Hero || !settings) return;

				around = settings.Around ? scene.Objects[settings.Around] : null;

				travelStep(object, object.Ship, settings, around && around.World ? around.World : [0, 0, 0], elapsed, {});
			});
		};

		/*
		 * An interstellar jump to a star near (To star:<ID>): a tunnel of warp out of the well of every body (HyperWell, of the
		 * pull at its surface: 0.0005), its way along the way to the star in the sky, at HyperSpeed light-years a second (2);
		 * as it comes there, the system of that star (EnterSystem at once), the ship out at its edge.
		 */
		function hyper (hero, settings, made, callback) {
			var star = targetById(hero, made.To);
			var well = wellOf(hero, given(made.HyperWell, 0.0005));
			var blocker = blockedAt(hero.World);

			if (!star)
				return refused(hero, 'warp', 'star', made.To);

			if (well)
				return refused(hero, 'warp', 'well', well.Body.ID);

			if (blocker)
				return refused(hero, 'warp', 'blocked', blocker.ID);

			hero.Travel = {Kind: 'hyper', Phase: 'enter', Time: 0, Flow: 0, Speed: 0, To: made.To, Galaxy: star.Galaxy, Light: star.Light, Way: star.Way, Step: given(made.Step, 3), Steps: made.Steps || [], Ramp: given(made.Ramp, 2), Brake: given(made.Brake, 1.2), Pace: 5, Capture: 0, Length: 0, Lengths: {enter: given(made.Enter, 1), exit: given(made.Exit, 1)}, HyperSpeed: given(made.HyperSpeed, 2), Tint: engine.Paint(made.HyperTint || '#b07cff').slice(0, 3), Callback: callback || null, Drift: 0};

			self.$Emit('travel', {ID: hero.ID, Kind: 'hyper', Phase: 'enter', To: made.To});

			return true;
		}

		/* Out of its way far at once where it is (a command of its own, or of the game). */
		engine.TravelStop = function (hero) {
			if (!hero || !hero.Travel) return false;

			hero.Travel.Stop = true;

			return true;
		};

		/*
		 * Aiming from a ship (scene.Aim {Target, Align}): T takes what lies nearest its nose (within 6 degrees or its disc), or
		 * lets it go; G turns the ship to it by itself (and lets it be). Its lead: where it will be when the ship gets there at
		 * its step of warp (its way now times how long, twice over). Ready: the nose on the lead within 2 degrees, out of the
		 * well of every body, out of the reach of a blocker of warp. H with no place of its own goes to what it aims at.
		 */
		function aimOf () {
			scene.Aim = scene.Aim || {Target: '', Align: false, Keys: {}, Past: {}, Seen: {}};

			return scene.Aim;
		}

		function candidates (hero) {
			return scene.Order.filter(function (object) {
				var traits = object.Traits || {};

				return object !== hero && object.World && !object.Hidden && (traits.Body || traits.Star || object.Values.Model || traits.WarpRelay || traits.WarpBlocker);
			}).concat(farStars(hero));
		}

		/*
		 * The stars near of the galaxy the system lies in (GalaxyNear of SceneGalaxy), each a target far along its way in the sky
		 * (ID star:<its ID>): what an interstellar jump goes to.
		 */
		function farStars (hero) {
			var far = (scene.Camera && scene.Camera.Far || 1e6) * 0.4;

			if (!self.GalaxyNear || !hero.World) return [];

			return self.GalaxyNear(30, 12).map(function (star) {
				return {ID: 'star:' + star.ID, Values: {Name: star.Name}, Traits: {}, World: vectors.Add(hero.World, vectors.Scale(star.Way, far)), Size: 0, Galaxy: star.ID, Light: star.Distance, Way: star.Way};
			});
		}

		/* An object of the scene, or a star near of the galaxy (star:<ID>), by its ID. */
		function targetById (hero, id) {
			if (scene.Objects[id])
				return scene.Objects[id];

			if (!/^star:/.test(String(id))) return null;

			return farStars(hero).filter(function (one) {
				return one.ID === id;
			})[0] || null;
		}

		/* What lies nearest a way from a ship: within 6 degrees of it, or its disc if larger. */
		function nearestTo (hero, way) {
			var best = null;

			candidates(hero).forEach(function (object) {
				var to = vectors.Subtract(object.World, hero.World);
				var far = vectors.Length(to);
				var angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(way, vectors.Scale(to, 1 / Math.max(1e-12, far))))));
				if (angle < Math.max(0.105, Math.atan((object.Size || 0) / Math.max(1e-12, far))) && (!best || angle < best.Angle))
					best = {ID: object.ID, Angle: angle};
			});

			return best ? best.ID : '';
		}

		function leadOf (hero, target, aim) {
			var settings = hero.Values.Vehicle;
			var way = aim.Way && aim.WayOf === target.ID ? aim.Way : [0, 0, 0];
			var speed = stepSpeed(travelOf(settings, 'warp'), given(real(settings, settings.Around ? scene.Objects[settings.Around] : null, hero.Ship).Top, 1));
			var at = target.World;
			var i;

			for (i = 0; i < 2; i++)
				at = vectors.Add(target.World, vectors.Scale(way, vectors.Distance(at, hero.World) / Math.max(1e-12, speed)));

			return at;
		}

		function aimStep (hero, keys, elapsed) {
			var aim = aimOf();
			var settings = hero.Values.Vehicle;
			var state = hero.Ship;
			var km = kilometre() || 1;
			var target;
			var record = {Target: '', Name: '', Distance: null, Angle: null, Lead: null, Aligned: false, Ready: false, Why: '', Align: aim.Align, Marks: []};
			var lead = null;
			var way;
			var angle;
			var well;
			var blocker;

			if (keys.KeyT && !aim.Keys.T)
				aim.Target = aim.Target && nearestTo(hero, state.Ahead) === aim.Target ? '' : nearestTo(hero, state.Ahead) || '';

			if (keys.KeyG && !aim.Keys.G)
				aim.Align = !aim.Align;

			aim.Keys = {T: !!keys.KeyT, G: !!keys.KeyG};
			target = aim.Target ? targetById(hero, aim.Target) : null;

			/* Gone: let go; not placed yet (the scene made again this frame): as if none, this frame. */
			if (aim.Target && !target)
				aim.Target = '';

			if (target && !target.World)
				target = null;

			if (target) {
				/*
				 * Its way a second to the ship, of where both were a frame before. Regression: of its way in the world (round its star
				 * with the ship) its lead was thousands of km off it.
				 */
				if (aim.Past[target.ID] && aim.Past[hero.ID] && elapsed > 0) {
					aim.Way = vectors.Scale(vectors.Subtract(vectors.Subtract(target.World, aim.Past[target.ID]), vectors.Subtract(hero.World, aim.Past[hero.ID])), 1 / elapsed);
					aim.WayOf = target.ID;
				}

				aim.Past = {};
				aim.Past[target.ID] = target.World.slice();
				aim.Past[hero.ID] = hero.World.slice();

				lead = leadOf(hero, target, aim);
				way = vectors.Normalize(vectors.Subtract(lead, hero.World));
				angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(state.Ahead, way)))) * 180 / Math.PI;
				well = wellOf(hero, target.Galaxy ? given(travelOf(settings, 'warp').HyperWell, 0.0005) : given(travelOf(settings, 'warp').Well, 0.15));
				blocker = blockedAt(hero.World);

				if (aim.Align && !hero.Travel) {
					aimShip(state, way, Math.min(1, elapsed * 1.5));

					state.Spin = [0, 0, 0];
				}

				record = {Target: target.ID, Name: target.Values.Name || target.ID, Distance: target.Galaxy ? target.Light * 9.4607e12 : vectors.Distance(target.World, hero.World) / km, Angle: angle, Lead: way, Aligned: angle < 2, Ready: angle < 2 && !well && !blocker && !hero.Travel, Why: hero.Travel ? 'travel' : well ? 'well' : blocker ? 'blocked' : angle >= 2 ? 'turn' : '', Align: aim.Align, Marks: []};
			}

			record.Marks = candidates(hero).map(function (object) {
				var to = vectors.Subtract(object.World, hero.World);
				var far = vectors.Length(to);

				return {ID: object.ID, Name: object.Values.Name || object.ID, Angle: Math.acos(Math.max(-1, Math.min(1, vectors.Dot(state.Ahead, vectors.Scale(to, 1 / Math.max(1e-12, far)))))) * 180 / Math.PI, Distance: far / km};
			}).filter(function (one) {
				return one.Angle < 25;
			}).sort(function (a, b) {
				return a.Angle - b.Angle;
			}).slice(0, 8);

			Object.assign(self.$Ether('aim'), record);

			self.$Ether.Touch('aim');

			drawAim(hero, target, lead, record);
		}

		/* A number of km for the eye: 1.2 Mkm, 384 000 km, 12.5 km. */
		function kmText (value) {
			if (value === null || value === undefined) return '';

			if (value >= 1e11)
				return (value / 9.4607e12).toFixed(1) + ' ly';

			if (value >= 1e7)
				return (value / 1.496e8).toFixed(2) + ' AU';

			if (value >= 1e6)
				return (value / 1e6).toFixed(1) + ' Mkm';

			return (value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1)) + ' km';
		}

		/*
		 * The marks of aiming over the view (.elemenx-scene-sight): the nose of the ship (where it points), a frame round what it
		 * aims at with its name, how far, how far to turn and whether it can go; the lead where it will be; an arrow at the
		 * edge to it when it is out of the view; small frames round what lies near the nose.
		 */
		function drawAim (hero, target, lead, record) {
			var root = self.$Element ? self.$Element().querySelector('.elemenx-scene-sight') : null;
			var camera = scene.Camera;
			var width = scene.Width;
			var height = scene.Height;
			var aim = aimOf();
			var used = {};

			if (!root) return;

			function part (key, kind) {
				var element = aim.Seen[key];

				if (!element) {
					element = aim.Seen[key] = root.ownerDocument.createElement('div');
					element.className = 'elemenx-scene-sight-' + kind;

					root.appendChild(element);
				}

				/* Its layer made again (the template of the scene drawn anew): in the one there is now. */
				if (element.parentNode !== root)
					root.appendChild(element);

				used[key] = true;
				element.hidden = false;

				return element;
			}

			function place (element, spot) {
				element.style.transform = 'translate(' + Math.round(spot.X) + 'px, ' + Math.round(spot.Y) + 'px) translate(-50%, -50%)';
			}

			var nose = camera.Project(vectors.Add(hero.World, vectors.Scale(hero.Ship.Ahead, Math.max(hero.Size * 400, 1e-6))), width, height);
			if (nose.Visible)
				place(part('nose', 'nose'), nose);

			record.Marks.forEach(function (mark) {
				var object = scene.Objects[mark.ID];
				var spot = object ? camera.Project(object.World, width, height) : null;
				if (!spot || !spot.Visible || mark.ID === record.Target) return;

				place(part('mark:' + mark.ID, 'mark'), spot);
			});

			if (target) {
				var spot = camera.Project(target.World, width, height);
				var frame;
				var arrow;
				var label;
				var dx;
				var dy;
				var scale;

				if (spot.Visible && spot.X >= 0 && spot.X <= width && spot.Y >= 0 && spot.Y <= height) {
					frame = part('target', 'target');

					frame.setAttribute('data-ready', String(record.Ready));

					place(frame, spot);

					label = part('label', 'label');
					label.textContent = record.Name + ' · ' + kmText(record.Distance) + ' · ' + record.Angle.toFixed(1) + '°' + (record.Ready ? ' · ready' : record.Why && record.Why !== 'turn' ? ' · ' + record.Why : '');
					label.style.transform = 'translate(' + Math.round(spot.X) + 'px, ' + Math.round(spot.Y + 36) + 'px) translate(-50%, 0)';
				}
				else {
					/* Out of the view: an arrow at its edge, the way to it from the middle. */
					dx = (spot.Visible ? spot.X : width - spot.X) - width / 2;
					dy = (spot.Visible ? spot.Y : height - spot.Y) - height / 2;
					scale = Math.min((width / 2 - 24) / Math.max(1e-6, Math.abs(dx)), (height / 2 - 24) / Math.max(1e-6, Math.abs(dy)));
					arrow = part('arrow', 'arrow');
					arrow.style.transform = 'translate(' + Math.round(width / 2 + dx * scale) + 'px, ' + Math.round(height / 2 + dy * scale) + 'px) translate(-50%, -50%) rotate(' + Math.atan2(dy, dx) + 'rad)';
					label = part('label', 'label');
					label.textContent = record.Name + ' · ' + kmText(record.Distance) + ' · ' + record.Angle.toFixed(0) + '°';
					label.style.transform = 'translate(' + Math.round(width / 2 + dx * scale * 0.86) + 'px, ' + Math.round(height / 2 + dy * scale * 0.86) + 'px) translate(-50%, -50%)';
				}

				var ahead = lead ? camera.Project(lead, width, height) : null;
				if (ahead && ahead.Visible && vectors.Distance(lead, target.World) > (target.Size || 0) * 0.5)
					place(part('lead', 'lead'), ahead);
			}

			Object.keys(aim.Seen).forEach(function (key) {
				if (!used[key])
					aim.Seen[key].hidden = true;
			});
		}

		engine.AimStep = aimStep;

		engine.AimClear = function () {
			var aim = aimOf();

			Object.keys(aim.Seen).forEach(function (key) {
				aim.Seen[key].hidden = true;
			});
		};

		/* Its step of warp on the way (1 to 6; a relay keeps its own). */
		engine.TravelStep = function (hero, step) {
			if (!hero || !hero.Travel || hero.Travel.Kind !== 'warp' || hero.Travel.Relay) return false;

			hero.Travel.Step = Math.max(1, Math.min(6, Math.round(Number(step) || 1)));

			return true;
		};

		/*
		 * The view of a ship goes round it as the mouse says, from where it stands behind it: it stays with the ship, its own axes
		 * coming after those of the ship, and steers nothing. In the first person (Person first of the Scene) from its seat (Seat of
		 * its Vehicle, in its own axes and its sizes; at its nose by default), along its way, the mouse turning the head: scene.Inside
		 * eases to 1 (what is on its glass shows, SceneGiants).
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

			scene.Inside = (scene.Inside || 0) + ((self.Person === 'first' ? 1 : 0) - (scene.Inside || 0)) * (1 - Math.exp(-elapsed * 10));
			scene.Target = hero.World.slice();

			if (self.Person === 'first') {
				var seat = settings.Seat || [0, 0.12, 0.62];
				var head = vectors.Add(vectors.Add(vectors.Scale(seen.Right, seat[0] * size), vectors.Scale(seen.Up, seat[1] * size)), vectors.Scale(seen.Ahead, seat[2] * size));
				var look = vectors.Add(vectors.Add(vectors.Scale(seen.Right, -Math.sin(scene.Yaw) * Math.cos(scene.Pitch - 0.16)), vectors.Scale(seen.Up, Math.sin(scene.Pitch - 0.16))), vectors.Scale(seen.Ahead, Math.cos(scene.Yaw) * Math.cos(scene.Pitch - 0.16)));

				camera.Position = vectors.Add(vectors.Add(hero.World, head), shake);
				camera.Target = vectors.Add(camera.Position, vectors.Scale(look, size * 10));
				camera.Up = seen.Up.slice();

				return true;
			}

			camera.Position = vectors.Add(vectors.Add(hero.World, vectors.Scale(way, far)), shake);
			camera.Target = vectors.Add(hero.World, shake);
			camera.Up = view.Up.slice();

			return true;
		};

		/*
		 * The lamps of a car: head (on with its lights), rear (dim with its lights, bright as it brakes), brake, reverse, indicator
		 * (blinking on the side it shows, both sides for the hazard lights). Each a colour, how bright its glass glows, and the light
		 * it throws: {Color, Glow, Power, Radius, Spot, Aim} (resources/vehicles/lamps.json).
		 */
		var Lamps = Elemenx.Resources('Data', 'ElemenxGraphics/vehicles/lamps') || {};

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
				if (object.Rig && object.Rig.Made && (object.Rig.Made.Openings.length || (object.Rig.Made.Emitters || []).length) && !(object.ID === scene.Hero && object.Values.Vehicle))
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
		var why = {well: 'in the well of ', blocked: 'by the blocker of warp ', relay: 'not by the relay '};

		if (!this.Engine().Travel(object, kind, options, callback) && callback)
			callback(new Error('Elemenx Scene: ' + id + ' cannot ' + kind + ' now' + (object && object.Refused ? ': ' + why[object.Refused.Reason] + object.Refused.By : '')));
	},

	/* Out of its way far at once where it is now: false when it is on none. */
	TravelStop: function (id) {
		return this.Engine().TravelStop(this.Scene().Objects[id]);
	},

	/*
	 * What the ship driven aims at: an ID, of an object or of a star near of the galaxy (star:<its ID>: a jump between stars; what it goes to in warp with no place of its own, its lead and marks over the
	 * view), '' for none. The Ether aim tells it once a frame: {Target, Name, Distance km, Angle (degrees to turn), Lead
	 * (the way to where it will be), Aligned, Ready, Why (turn, well, blocked, travel), Align, Marks: [{ID, Name, Angle,
	 * Distance}] near the nose}. T takes what lies nearest the nose, G turns to it by itself.
	 */
	Aim: function (id) {
		var scene = this.Scene();

		scene.Aim = scene.Aim || {Target: '', Align: false, Keys: {}, Past: {}, Seen: {}};
		/* An object of the scene, or a star near of the galaxy (star:<its ID>: GalaxyNear). */
		scene.Aim.Target = id && (scene.Objects[id] || /^star:/.test(String(id)) && this.GalaxyNear && this.GalaxyNear(30, 12).some(function (star) {
			return 'star:' + star.ID === id;
		})) ? id : '';

		return scene.Aim.Target;
	},

	/* The ship driven turns to what it aims at by itself (true), or not. */
	AimAlign: function (on) {
		var scene = this.Scene();

		scene.Aim = scene.Aim || {Target: '', Align: false, Keys: {}, Past: {}, Seen: {}};
		scene.Aim.Align = !!on;
	},

	/* Its step of warp on the way (1 to 6; a relay keeps its own): false when it is in no warp. */
	TravelStep: function (id, step) {
		return this.Engine().TravelStep(this.Scene().Objects[id], step);
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
