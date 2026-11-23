/*
 * SceneTactics: what who sits in a vehicle does from its seat, by the role of the seat (Seats of SceneVehicles, the
 * consoles of a ship standing of SceneAboard). A mode owns the view (one at a time): '' the seat itself (at a console:
 * its screen), helm (pilot, copilot: the view round the vehicle from outside), turret (gunner, tactical: the view of a
 * turret of the vehicle, the pointer taken, the left button firing its weapon), radar (sensors, tactical: the view from
 * high over the vehicle, the pointer free, a press on what it knows makes that the target) and schematic (engineer: the
 * view round the vehicle cut open, its hull a ghost round its rooms, its shields as shells) and strategic (captain,
 * commander: as over the map of a strategy, round a point the keys carry: WASD and the arrows over the ground, R and F up
 * and down through space, Q and E turn it, the wheel brings it near; StrategyPoint(point) is that point). What is shown over a view
 * (GameTargets, GameRadar, GameFlight) goes with any mode.
 *
 * The roles no seat of a vehicle has fall to its seat of command (the captain, else the commander, the pilot, the
 * first): alone in a fighter its pilot has all of them. Tactics(id) lists the modes of an actor in its seat ('' first;
 * none when it sits nowhere); Tactic(kind) is the mode of the hero (one of its Tactics; none: as it is), the event
 * tactic ({Kind, Vehicle, Seat}) as it changes. At a turret 1 to 9 go to the turrets of the vehicle (it begins at the
 * one best turned to its target, on it). Escape gives the pointer of a turret back, then goes back to the seat. A mode
 * is left as the hero leaves its seat; leaving one keeps the vehicle as it was (its course, where its turrets look).
 *
 * Turrets(id) are the turrets of a vehicle: its Mounts of Kind turret ({At, Place, Weapon, Arc, Low, High}), else the
 * turret parts of its model (roles of Kind turret: their pivot), else those of the class of its inside (Turrets of a
 * class of SceneInteriors: Place top or belly, Along its length from -0.5 at its tail to 0.5 at its nose), each {ID,
 * At, Up, Weapon, Arc (degrees each side of the nose), Low, High (degrees of elevation), From (mount, role, class)}.
 * Who mans one turns it (Values.Aim {Yaw, Pitch} of the vehicle, degrees: its turret and barrel parts follow) within
 * its Arc, Low and High.
 *
 * Command(id) is whom an actor commands from its seat (none with no strategic view): {Kind (crew, fleet), Fleet, Vehicle,
 * Vehicles, Units: [{ID, Vehicle, Seated, Post}]}: the crew of its vehicle (who sits in it, and the walkers whose Crew is
 * its ID), or at the seat of a commander, or of command of a vehicle that is the Flagship of its fleet with no commander
 * aboard, every crew of its fleet (the vehicles of the same Fleet of their Vehicle). GameStrategy with Command seat orders
 * those of them on foot.
 *
 * Contacts(id) are what a vehicle knows round it (within the Range of its Sensors, km; 2 with none): vehicles, walkers,
 * what has a Team, places (NavPoint), blockers of warp (WarpBlocker), each {ID, Name, Kind (ship, vehicle, walker,
 * place, jammer, thing), Team, Hostile (of a team other than the vehicle's, its crew's or the Team of the scene), At,
 * Distance, Bearing (degrees from the nose, right positive), Elevation (degrees), Velocity (m/s), Target}. The target
 * of a vehicle is one for all its seats: SetTarget(id, target) (the event target {Vehicle, Target}), TargetOf(id).
 */
Elemenx.Trait('SceneTactics', {
	TacticsStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var interiors = this.$Service('SceneInteriors');
		/* The modes of each role. */
		var Modes = {pilot: ['helm'], copilot: ['helm'], gunner: ['turret'], tactical: ['turret', 'radar'], sensors: ['radar'], engineer: ['schematic'], captain: ['strategic'], commander: ['strategic']};
		var Order = ['', 'helm', 'turret', 'radar', 'schematic', 'strategic'];
		var tracks = {};

		scene.Tactic = '';

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function traitOf (object, name) {
			return object.Traits && object.Traits[name] || null;
		}

		function wrap (angle) {
			return Math.atan2(Math.sin(angle), Math.cos(angle));
		}

		/* The way a vehicle looks (its nose) and its up, in the scene. */
		function frameOf (object) {
			var turn = object.Turn || math.Rotation([0, 1, 0], number(object.Values.Yaw, 0) * Math.PI / 180);
			var origin = math.Apply(turn, [0, 0, 0]);

			return {Turn: turn, Ahead: vectors.Normalize(vectors.Subtract(math.Apply(turn, [0, 0, 1]), origin)), Up: vectors.Normalize(vectors.Subtract(math.Apply(turn, [0, 1, 0]), origin))};
		}

		/* The yaw of the view (Scene: it looks along [-sin(Yaw), ., -cos(Yaw)]) along a way. */
		function yawOf (way) {
			return Math.atan2(-way[0], -way[2]);
		}

		function lengthOf (object) {
			var settings = object.Values.Vehicle || {};

			return Math.max(2, number(settings.Length, object.Size || 4));
		}

		function teamOf (object) {
			return object ? String(object.Team || object.Values.Team || '') : '';
		}

		/* The seats of a vehicle: its Seats, else one of its kind. */
		function seatsOf (vehicle) {
			var settings = vehicle.Values.Vehicle || {};

			return settings.Seats && settings.Seats.length ? settings.Seats : [{ID: settings.Kind === 'ship' ? 'pilot' : 'driver', Role: settings.Kind === 'ship' ? 'pilot' : 'driver'}];
		}

		/* The seat of command of a vehicle: its captain, else its commander, its pilot, the first. */
		function seatOfCommand (seats) {
			return ['captain', 'commander', 'pilot'].map(function (role) {
				return seats.filter(function (one) {
					return one.Role === role;
				})[0];
			}).filter(Boolean)[0] || seats[0];
		}

		/* The modes of an actor in its seat: of its role, and of the roles no seat has at the seat of command. */
		function tacticsOf (id) {
			var context = engine.ActorContext ? engine.ActorContext(id) : null;
			var vehicle = context && context.Kind === 'seat' ? scene.Objects[context.Vehicle] : null;
			var seats;
			var seat;
			var wanted = {};

			if (!vehicle) return [];

			seats = seatsOf(vehicle);
			seat = seats.filter(function (one) {
				return one.ID === context.Seat;
			})[0] || {ID: context.Seat, Role: context.Role};

			(Modes[seat.Role] || []).forEach(function (mode) {
				wanted[mode] = true;
			});

			if (seatOfCommand(seats).ID === seat.ID)
				Object.keys(Modes).forEach(function (role) {
					if (seats.some(function (one) {
						return one.Role === role;
					})) return;

					Modes[role].forEach(function (mode) {
						wanted[mode] = true;
					});
				});

			if (wanted.turret && !turretsOf(vehicle).length)
				delete wanted.turret;

			return Order.filter(function (mode) {
				return mode === '' || wanted[mode];
			});
		}

		/* The fleet of a vehicle (Fleet of its Vehicle); '' for none. */
		function fleetOf (object) {
			var settings = object && object.Values.Vehicle;

			return settings && settings.Fleet ? String(settings.Fleet) : '';
		}

		/*
		 * Whom an actor in its seat commands (see Command): the crew of its vehicle, or at the seat of a commander (or of command
		 * of a Flagship with no commander aboard) every crew of the fleet of it; null with no strategic view.
		 */
		function commandOf (id) {
			var context = engine.ActorContext ? engine.ActorContext(id) : null;
			var vehicle = context && context.Kind === 'seat' ? scene.Objects[context.Vehicle] : null;
			var seats;
			var seat;
			var fleet;
			var whole;
			var vehicles;

			if (!vehicle || tacticsOf(id).indexOf('strategic') === -1) return null;

			seats = seatsOf(vehicle);
			seat = seats.filter(function (one) {
				return one.ID === context.Seat;
			})[0] || {ID: context.Seat, Role: context.Role};
			fleet = fleetOf(vehicle);
			whole = !!fleet && (seat.Role === 'commander' || !!vehicle.Values.Vehicle.Flagship && seatOfCommand(seats).ID === seat.ID && !seats.some(function (one) {
				return one.Role === 'commander';
			}));
			vehicles = whole ? scene.Order.filter(function (one) {
				return fleetOf(one) === fleet;
			}).map(function (one) {
				return one.ID;
			}) : [vehicle.ID];

			return {Kind: whole ? 'fleet' : 'crew', Fleet: fleet, Vehicle: vehicle.ID, Vehicles: vehicles, Units: scene.Order.filter(function (one) {
				var of = one.Aboard ? one.Aboard.Vehicle : one.Values.Crew;

				return one.ID !== id && !!of && vehicles.indexOf(String(of)) !== -1;
			}).map(function (one) {
				return {ID: one.ID, Vehicle: String(one.Aboard ? one.Aboard.Vehicle : one.Values.Crew), Seated: !!one.Aboard, Post: one.Aboard ? one.Aboard.Seat : ''};
			})};
		}

		/* A turret where it stands now: of its point and up in the frame of the vehicle. */
		function placed (object, frame, turret) {
			return Object.assign({}, turret, {At: vectors.Add(object.World, math.Apply(frame.Turn, turret.Local)), Up: turret.Below ? vectors.Scale(frame.Up, -1) : frame.Up});
		}

		/* The turrets of the class of an inside: its own (Interior.Turrets of the vehicle), else of its class (Plan.Class). */
		function classTurrets (settings, plan) {
			var kind = (interiors.Table.Classes || []).filter(function (one) {
				return one.Name === plan.Class;
			})[0];

			return settings.Interior && settings.Interior.Turrets || kind && kind.Turrets || [];
		}

		/* Its turrets: its Mounts of Kind turret, else the turret parts of its model, else those of the class of its inside. */
		function turretsOf (object) {
			var settings = object.Values.Vehicle || {};
			var frame;
			var size = object.Size || 1;
			var scale = object.Scaled || [size, size, size];
			var found = [];
			var rig = object.Rig && object.Rig.Made;
			var record;
			var plan;

			if (!object.World || !settings.Kind) return [];

			frame = frameOf(object);

			(settings.Mounts || []).forEach(function (mount, index) {
				var at = vectors.Scale(mount.At || [0, 0, 0], size);

				if (mount.Kind !== 'turret') return;

				found.push({ID: 'mount:' + index, Local: at, Below: mount.Place === 'belly', Weapon: mount.Weapon || 'plasma', Arc: number(mount.Arc, 180), Low: number(mount.Low, mount.Place === 'belly' ? -80 : -10), High: number(mount.High, mount.Place === 'belly' ? 10 : 80), From: 'mount'});
			});

			if (!found.length && rig)
				rig.Openings.forEach(function (opening) {
					if (opening.Drive !== 'aim-yaw' || !opening.Hinge) return;

					found.push({ID: opening.Name, Local: [opening.Hinge[0] * scale[0], opening.Hinge[1] * scale[1], opening.Hinge[2] * scale[2]], Below: false, Weapon: settings.Weapon || 'plasma', Arc: 180, Low: -10, High: 80, From: 'role'});
				});

			record = !found.length && scene.Interiors ? scene.Interiors[object.ID] : null;
			plan = record && record.Plan;

			/* Of its class: over its hull (or its rooms) at Along of its length; in the frame of its inside, which stands at At. */
			if (plan)
				classTurrets(settings, plan).forEach(function (one, index) {
					var length = lengthOf(object);
					var z = number(one.Along, 0) * length;
					var below = one.Place === 'belly';
					var hull = record.Hull;
					var column = hull ? Math.floor((0 - hull.X) / hull.Cell) + Math.floor((z - hull.Z) / hull.Cell) * hull.NX : -1;
					var top = hull && column >= 0 && isFinite(hull.Top[column]) ? hull.Top[column] : plan.Floor + plan.Height + plan.Deck.Slab;
					var bottom = hull && column >= 0 && isFinite(hull.Bottom[column]) ? hull.Bottom[column] : plan.Floor - plan.Deck.Slab;
					var local = [0, below ? bottom : top, z];
					var world = vectors.Add(record.At, math.Apply(record.Turn, local));

					found.push({ID: 'class:' + index, Local: math.Apply(math.Invert(frame.Turn), vectors.Subtract(world, object.World)), Below: below, Weapon: one.Weapon || settings.Weapon || 'plasma', Arc: number(one.Arc, 180), Low: number(one.Low, below ? -80 : -10), High: number(one.High, below ? 10 : 80), From: 'class'});
				});

			return found.map(function (turret) {
				return placed(object, frame, turret);
			});
		}

		/* The vehicle the hero sits in, and its seat. */
		function seatedOf () {
			var context = scene.Hero && engine.ActorContext ? engine.ActorContext(scene.Hero) : null;

			return context && context.Kind === 'seat' ? context : null;
		}

		/* The turret the hero mans: the one it chose of its vehicle (TurretIndex). */
		function heroTurret () {
			var context = seatedOf();
			var vehicle = context ? scene.Objects[context.Vehicle] : null;
			var list = vehicle && scene.Tactic === 'turret' ? turretsOf(vehicle) : [];

			return list.length ? {Vehicle: vehicle, Turret: list[Math.min(list.length - 1, scene.TurretIndex || 0)]} : null;
		}

		/* How far a turret is from turning to a point (degrees past its arc, its lowest and highest; 0 within them). */
		function pastReach (vehicle, turret, point) {
			var frame = frameOf(vehicle);
			var way = vectors.Normalize(vectors.Subtract(point, vectors.Add(turret.At, vectors.Scale(turret.Up, 0.9))));
			var turn = Math.abs(wrap(yawOf(way) - yawOf(frame.Ahead))) * 180 / Math.PI;
			var rise = Math.asin(Math.max(-1, Math.min(1, way[1]))) * 180 / Math.PI;

			return Math.max(0, turn - turret.Arc) + Math.max(0, turret.Low - rise) + Math.max(0, rise - turret.High);
		}

		/* The turret of a vehicle best turned to its target (the first with none). */
		function turretFor (vehicle) {
			var target = vehicle.Tactics && vehicle.Tactics.Target ? scene.Objects[vehicle.Tactics.Target] : null;
			var list = turretsOf(vehicle);
			var best = 0;

			if (!target || !target.World) return 0;

			list.forEach(function (turret, index) {
				if (pastReach(vehicle, turret, target.World) < pastReach(vehicle, list[best], target.World))
					best = index;
			});

			return best;
		}

		/* What a vehicle knows round it (see Contacts). */
		function contactsOf (id) {
			var object = scene.Objects[id];
			var sensors = object && object.Values.Vehicle && object.Values.Vehicle.Sensors;
			var range = number(sensors && sensors.Range, 2) * 1000;
			var own = teamOf(object) || teamOf(scene.Objects[scene.Hero]) || String(self.Team || '');
			var target = object && object.Tactics ? object.Tactics.Target : '';
			var frame;
			var list = [];

			if (!object || !object.World) return [];

			frame = frameOf(object);

			scene.Order.forEach(function (one) {
				var kind = traitOf(one, 'WarpBlocker') ? 'jammer' : traitOf(one, 'NavPoint') ? 'place' : one.Values.Vehicle ? one.Values.Vehicle.Kind === 'ship' ? 'ship' : 'vehicle' : traitOf(one, 'Walker') || one.Kind === 'unit' || one.Kind === 'walker' || one.Kind === 'character' ? 'walker' : teamOf(one) ? 'thing' : '';
				var way;
				var far;
				var ahead;
				var side;
				var track;

				if (!kind || one === object || one.ID === scene.Hero || one.Hidden || !one.World || !isFinite(one.World[0]) || !isFinite(one.World[2]) || one.Values.Aboard || one.Aboard) return;

				way = vectors.Subtract(one.World, object.World);
				far = vectors.Length(way);

				if (far > range) return;

				ahead = vectors.Dot(way, frame.Ahead);
				side = vectors.Dot(way, vectors.Normalize(vectors.Cross(frame.Ahead, frame.Up)));
				track = tracks[one.ID];

				list.push({ID: one.ID, Name: one.Name || one.ID, Kind: kind, Team: teamOf(one), Hostile: !!own && !!teamOf(one) && teamOf(one) !== own, At: one.World.slice(), Distance: far, Bearing: Math.atan2(side, ahead) * 180 / Math.PI, Elevation: Math.asin(Math.max(-1, Math.min(1, vectors.Dot(way, frame.Up) / Math.max(1e-6, far)))) * 180 / Math.PI, Velocity: track && track.Velocity ? track.Velocity.slice() : [0, 0, 0], Target: one.ID === target});
			});

			return list.sort(function (a, b) {
				return a.Distance - b.Distance;
			});
		}

		/* How fast what is round moves: of where it was a moment ago, calmed. */
		function trackAll (elapsed) {
			if (elapsed <= 0) return;

			scene.Order.forEach(function (one) {
				var track = tracks[one.ID];

				if (!one.World) return;

				if (track) {
					var now = vectors.Scale(vectors.Subtract(one.World, track.At), 1 / elapsed);

					track.Velocity = track.Velocity ? vectors.Lerp(track.Velocity, now, 1 - Math.exp(-elapsed * 6)) : now;
					track.At = one.World.slice();
				}
				else {
					tracks[one.ID] = {At: one.World.slice(), Velocity: null};
				}

				track = tracks[one.ID];
				track.Seen = scene.Seconds;
			});

			Object.keys(tracks).forEach(function (id) {
				if (!scene.Objects[id])
					delete tracks[id];
			});
		}

		/* The mode of the hero: one of its Tactics; the view set anew for it, the pointer of a turret given back as it goes. */
		engine.SetTactic = function (kind) {
			var context = seatedOf();
			var was = scene.Tactic;

			kind = kind || '';

			if (kind && (!context || tacticsOf(scene.Hero).indexOf(kind) === -1)) return was;

			if (kind === was) return was;

			scene.Tactic = kind;
			scene.TacticFresh = true;

			if (kind === 'turret')
				scene.TurretIndex = turretFor(scene.Objects[context.Vehicle]);

			if (was === 'turret' && self.Captured() && document.exitPointerLock)
				document.exitPointerLock();

			/* Back at the seat: the view of it is looked for anew. */
			scene.DeskOf = '';

			self.$Emit('tactic', {Kind: kind, Vehicle: context ? context.Vehicle : '', Seat: context ? context.Seat : ''});

			return kind;
		};

		/* The turret the hero mans, of the turrets of its vehicle (from 0); the view set anew at it. */
		engine.ChooseTurret = function (index) {
			var context = scene.Tactic === 'turret' ? seatedOf() : null;
			var list = context ? turretsOf(scene.Objects[context.Vehicle]) : [];
			if (index < 0 || index >= list.length) return false;

			scene.TurretIndex = index;
			scene.TacticFresh = true;

			return true;
		};

		engine.TacticsOf = tacticsOf;

		engine.CommandOf = commandOf;

		engine.TurretsOf = turretsOf;

		engine.ContactsOf = contactsOf;

		/* Whether the hull of a vehicle is cut away for the mode of the hero (schematic). */
		engine.TacticCut = function (id) {
			var context = scene.Tactic === 'schematic' ? seatedOf() : null;

			return !!context && context.Vehicle === id;
		};

		/*
		 * The view of the mode of the hero, over what the scene would show: true when it took the view. Set anew as a mode
		 * begins: a turret looks along the nose, the views round the vehicle from behind it.
		 */
		engine.TacticView = function (focus, camera) {
			var context = scene.Tactic ? seatedOf() : null;
			var vehicle = context ? scene.Objects[context.Vehicle] : null;
			var frame;
			var fresh = scene.TacticFresh;
			var length;
			var middle;
			var field = scene.Ground ? scene.Ground.Field : null;

			if (!vehicle || !vehicle.World) return false;

			scene.TacticFresh = false;
			frame = frameOf(vehicle);
			length = lengthOf(vehicle);

			if (scene.Tactic === 'turret') {
				var manned = heroTurret();
				var turret = manned ? manned.Turret : null;
				var nose;
				var rest;
				var turn;
				var rise;
				var way;
				var eye;

				if (!turret)
					return false;

				nose = yawOf(frame.Ahead);

				/* It begins on the target of the vehicle (if it can turn to it), else along the nose. */
				if (fresh) {
					var target = vehicle.Tactics && vehicle.Tactics.Target ? scene.Objects[vehicle.Tactics.Target] : null;
					var toward = target && target.World ? vectors.Normalize(vectors.Subtract([target.World[0], target.World[1] + (target.Size || 1) * 0.5, target.World[2]], vectors.Add(turret.At, vectors.Scale(turret.Up, 0.9)))) : null;

					scene.Yaw = toward ? yawOf(toward) : nose;
					scene.Pitch = toward ? -Math.asin(Math.max(-1, Math.min(1, toward[1]))) : turret.Below ? 0.15 : -0.05;
				}

				/* Within its arc round the nose, and between its lowest and its highest. */
				turn = Math.max(-turret.Arc, Math.min(turret.Arc, wrap(scene.Yaw - nose) * 180 / Math.PI));
				rise = Math.max(turret.Low, Math.min(turret.High, -scene.Pitch * 180 / Math.PI));
				scene.Yaw = nose + turn * Math.PI / 180;
				scene.Pitch = -rise * Math.PI / 180;
				way = [-Math.sin(scene.Yaw) * Math.cos(scene.Pitch), -Math.sin(scene.Pitch), -Math.cos(scene.Yaw) * Math.cos(scene.Pitch)];
				eye = vectors.Add(turret.At, vectors.Scale(turret.Up, 0.9));
				rest = vectors.Add(eye, vectors.Scale(way, 2.5));

				/* Its turret and barrel parts turn so (the drives aim-yaw and aim-pitch). */
				vehicle.Values.Aim = {Yaw: -turn, Pitch: rise};
				manned.Vehicle.TurretMuzzle = rest;
				camera.Position = eye;
				camera.Target = vectors.Add(eye, vectors.Scale(way, 10));
				camera.Up = [0, 1, 0];

				return true;
			}

			/*
			 * The strategic view: as over a map of a strategy, round a point of its own (StrategyAt) that the keys carry over the
			 * ground (or through space: R and F raise and lower it, Q and E turn the view). It begins over the vehicle.
			 */
			if (scene.Tactic === 'strategic') {
				if (fresh) {
					scene.StrategyAt = vehicle.World.slice();
					scene.StrategyRise = 0;
					scene.Yaw = yawOf(frame.Ahead);
					scene.Pitch = 0.95;
					scene.TacticReach = Math.max(60, length * 2.5);
				}

				scene.Pitch = Math.max(0.2, Math.min(1.5, scene.Pitch));

				camera.Orbit(scene.StrategyAt, scene.Yaw, scene.Pitch, scene.TacticReach);

				if (field && camera.Position[1] < Math.max(0, field.Height(camera.Position[0], camera.Position[2])) + 1)
					camera.Position[1] = Math.max(0, field.Height(camera.Position[0], camera.Position[2])) + 1;

				camera.Up = [0, 1, 0];

				return true;
			}

			/* Round the vehicle: from behind it (helm), from over it cut open (schematic), from high over it (radar). */
			middle = vectors.Add(vehicle.World, vectors.Scale(frame.Up, length * 0.05));

			if (fresh) {
				scene.Yaw = yawOf(frame.Ahead);
				scene.Pitch = {helm: 0.3, schematic: 0.75, radar: 1.35}[scene.Tactic] || 0.3;
				scene.TacticReach = {helm: length * 1.2 + 12, schematic: length * 0.95 + 8, radar: Math.max(60, length * 2.2)}[scene.Tactic] || length * 1.5;
			}

			scene.Pitch = Math.max(scene.Tactic === 'radar' ? 0.6 : -0.15, Math.min(1.45, scene.Pitch));

			camera.Orbit(middle, scene.Yaw, scene.Pitch, scene.TacticReach || length * 1.5);

			if (field && camera.Position[1] < Math.max(0, field.Height(camera.Position[0], camera.Position[2])) + 1)
				camera.Position[1] = Math.max(0, field.Height(camera.Position[0], camera.Position[2])) + 1;

			camera.Up = [0, 1, 0];

			return true;
		};

		/* The keys carry the point of the strategic view: along the ground as the view looks, up and down through space. */
		function strategyKeys (elapsed) {
			var keys = scene.Keys || {};
			var speed = (scene.TacticReach || 60) * 0.8 * elapsed;
			var forward = [-Math.sin(scene.Yaw), 0, -Math.cos(scene.Yaw)];
			var right = [Math.cos(scene.Yaw), 0, -Math.sin(scene.Yaw)];
			var field = scene.Ground ? scene.Ground.Field : null;
			var at = scene.StrategyAt;
			if (!at) return;

			if (keys.ArrowUp || keys.KeyW)
				at = vectors.Add(at, vectors.Scale(forward, speed));

			if (keys.ArrowDown || keys.KeyS)
				at = vectors.Add(at, vectors.Scale(forward, -speed));

			if (keys.ArrowRight || keys.KeyD)
				at = vectors.Add(at, vectors.Scale(right, speed));

			if (keys.ArrowLeft || keys.KeyA)
				at = vectors.Add(at, vectors.Scale(right, -speed));

			if (keys.KeyQ)
				scene.Yaw += elapsed * 1.2;

			if (keys.KeyE)
				scene.Yaw -= elapsed * 1.2;

			if (keys.KeyR)
				scene.StrategyRise = (scene.StrategyRise || 0) + speed;

			if (keys.KeyF)
				scene.StrategyRise = (scene.StrategyRise || 0) - speed;

			/* Over a ground: on it (and as high over it as raised); within it. In space: where it was raised to. */
			if (field) {
				at[0] = Math.max(-field.Size / 2, Math.min(field.Size / 2, at[0]));
				at[2] = Math.max(-field.Size / 2, Math.min(field.Size / 2, at[2]));
				scene.StrategyRise = Math.max(0, scene.StrategyRise || 0);
				at[1] = Math.max(0, field.Height(at[0], at[2])) + scene.StrategyRise;
			}
			else if (keys.KeyR || keys.KeyF) {
				at[1] = scene.StrategyAt[1] + (keys.KeyR ? speed : -speed);
			}

			scene.StrategyAt = at;
		}

		engine.TacticsStep = function (elapsed) {
			trackAll(elapsed);

			if (scene.Tactic === 'strategic')
				strategyKeys(elapsed);

			/* A mode it has no more (it stood up, the vehicle went): back to none. */
			if (scene.Tactic && tacticsOf(scene.Hero).indexOf(scene.Tactic) === -1)
				engine.SetTactic('');

			Object.keys(scene.Objects).forEach(function (id) {
				var object = scene.Objects[id];
				if (object.Tactics && object.Tactics.Target && !scene.Objects[object.Tactics.Target])
					object.Tactics.Target = '';
			});
		};

		/* The target of a vehicle, one for all its seats. */
		engine.SetTarget = function (id, target) {
			var object = scene.Objects[id];
			if (!object) return '';

			target = target && scene.Objects[target] ? target : '';
			object.Tactics = object.Tactics || {};

			if (object.Tactics.Target === target) return target;

			object.Tactics.Target = target;

			self.$Emit('target', {Vehicle: id, Target: target});

			return target;
		};

		/* Who shoots for the hero at a turret: {ID (the vehicle), Weapon, From (its muzzle: where its view looks out of it)}; null else. */
		engine.HeroTurret = function () {
			var manned = heroTurret();

			return manned && manned.Vehicle.TurretMuzzle ? {ID: manned.Vehicle.ID, Weapon: manned.Turret.Weapon, From: manned.Vehicle.TurretMuzzle.slice()} : null;
		};

		engine.TacticsPick = function (x, y) {
			var context = seatedOf();
			var id = engine.Pick ? engine.Pick(x, y) : null;
			if (!context || !id || id === context.Vehicle || !contactsOf(context.Vehicle).some(function (one) {
				return one.ID === id;
			})) return false;

			engine.SetTarget(context.Vehicle, id);

			return true;
		};
	},

	/* The mode of the hero in its seat ('' its seat, helm, turret, radar, schematic): set to one of its Tactics; the mode now. */
	Tactic: function (kind) {
		var engine = this.Engine();
		var scene = this.Scene();

		if (kind === undefined || !engine || !engine.SetTactic) return scene.Tactic || '';

		return engine.SetTactic(kind);
	},

	/* The modes of an actor in its seat ('' first), the hero by none; [] when it sits nowhere. */
	Tactics: function (id) {
		var engine = this.Engine();

		return engine && engine.TacticsOf ? engine.TacticsOf(id === undefined ? this.Scene().Hero : id) : [];
	},

	/* Whom an actor commands from its seat (the hero by none): see Command; null with no strategic view. */
	Command: function (id) {
		var engine = this.Engine();

		return engine && engine.CommandOf ? engine.CommandOf(id === undefined ? this.Scene().Hero : id) : null;
	},

	/* The point the strategic view goes round ([x, y, z]); set: it goes there. */
	StrategyPoint: function (point) {
		var scene = this.Scene();

		if (Array.isArray(point) && point.length === 3)
			scene.StrategyAt = point.slice();

		return scene.StrategyAt ? scene.StrategyAt.slice() : null;
	},

	/* The turrets of a vehicle: [{ID, At, Up, Weapon, Arc, Low, High, From}]. */
	Turrets: function (id) {
		var engine = this.Engine();
		var object = this.Scene().Objects[id];

		return engine && engine.TurretsOf && object ? engine.TurretsOf(object).map(function (one) {
			return {ID: one.ID, At: one.At.slice(), Up: one.Up.slice(), Weapon: one.Weapon, Arc: one.Arc, Low: one.Low, High: one.High, From: one.From};
		}) : [];
	},

	/* What a vehicle knows round it: see Contacts. */
	Contacts: function (id) {
		var engine = this.Engine();

		return engine && engine.ContactsOf ? engine.ContactsOf(id) : [];
	},

	/* The target of a vehicle, for all its seats: the ID it is now ('' for none). */
	SetTarget: function (id, target) {
		var engine = this.Engine();

		return engine && engine.SetTarget ? engine.SetTarget(id, target) : '';
	},

	TargetOf: function (id) {
		var object = this.Scene().Objects[id];

		return object && object.Tactics ? object.Tactics.Target || '' : '';
	},

	/*
	 * Keys of the hero in a mode: 1 to 9 at a turret go to that turret of the vehicle; Escape gives the pointer of a turret
	 * back first (the browser does), then goes back to the seat.
	 */
	TacticsKey: function (event) {
		var scene = this.Scene();
		var engine = this.Engine();
		var digit = /^Digit([1-9])$/.exec(event.code || '');
		if (digit && scene.Tactic === 'turret' && engine.ChooseTurret && engine.ChooseTurret(Number(digit[1]) - 1)) return true;

		if (event.code !== 'Escape' || !scene.Tactic || this.Captured()) return false;

		this.Tactic('');

		return true;
	},

	/* A press (not a drag) in a mode of the pointer free: what it is on, of what the vehicle knows, is its target. */
	TacticsPointer: function (kind, event) {
		var scene = this.Scene();
		var engine = this.Engine();
		var point;

		if (kind !== 'up' || !scene.Tactic || scene.Tactic === 'turret' || this.Dragging || !engine.TacticsPick) return false;

		point = engine.Local(event);

		return engine.TacticsPick(point.X, point.Y);
	}
});
