/*
 * Vehicles: what is driven. An object with Vehicle {Kind, ...} under the keys (Control) goes by its kind: a car on the ground, a ship
 * in space. Their ways of moving are in Vehicles of the scene, by kind, and Vehicles({Kind: step}) adds more: step(hero, keys, elapsed).
 * How they move is the Physics service, in steps of its own: what shows is a blend of the last two, so nothing shakes at any pace.
 *
 * A car, besides the settings of Physics.Car: Yaw (the turn of its model, degrees), Heading, Track (of the Tracks service: it drives on
 * its road, off it the grass slows it, the barrier stops it), Seat ([x, y, z] of the eyes), Wheels (a word for what of its model, by the name of a node or of its material,
 * is a wheel). W gives gas, S brakes and goes back, A and D steer, Space is the brake, Shift lets the rear go for a drift, C is the hand brake. Wheels spin, the front ones
 * steer, and each goes up and down on its spring.
 *
 * A ship, besides those of Physics.Ship: Yaw, Facing ([x, y, z] it looks at first), Follow ([back, up] of the view, in its size), Around
 * (the ID of the body it goes by and must stay out of), From ([x, y, z] from that body, in its size). The keys fly it: A and D or the
 * arrows turn it, R and F or the arrows up and down pitch it, Q and E roll, W and S set its speed, C and X lift it up and down, Shift
 * boosts, Space brings all of it to rest. The mouse only looks round it. Its Thrust goes to what burns on it.
 *
 * A car stays inside the barrier of its Track by all its corners (Long and Wide: half of its length and width), and a vehicle of any kind
 * meets what stands in its way: another vehicle, a craft, a body, a wall of a location.
 *
 * Openings of a vehicle are what moves on it: {Name, Match (a word of the materials), Low, High (the box of it in its model), Both (the same
 * on the other side), Way ([x, y, z]), Reach, Open}. OpenPart(id, name, amount) moves it, by degrees. They need not be parts of the file.
 *
 * Mounts of a vehicle of any kind are what it is built of, each where its model says, in its size: {Kind, At: [x, y, z], Aim: [x, y, z],
 * Size, On, Mouth} and Type with what an effect takes (an effect that burns on it; Twist, degrees round the aim, leans it; Mouth, [width, height] or a radius, in its model, is the opening
 * it comes out of: it fills it with light, the jet is as wide as it is, and an engine lights what is round it as it burns), or Model and Turn ([x, y, z] degrees; a model that stands on
 * it). Kind is free: engine goes with the thrust, and burns as an exhaust if no Type is told; a game names its weapons, shields and
 * holds as it likes, and asks MountsOf(id, kind) where they stand now. Pop of a mount is a burst there when a car lets go of the gas at speed:
 * true for backfire, or {Type, Size, Every} (the seconds at least between two).
 */
Elemenx.Trait('Vehicles', {
	VehiclesStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var graphics = this.$Service('Graphics3D');
		var vectors = graphics.Vectors;
		var tracks = this.$Service('Tracks');
		var physics = this.$Service('Physics');
		var library = this.$Service('Models');
		var self = this;

		function given (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

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
					var at = graphics.Apply(piece.Rest, [p[i], p[i + 1], p[i + 2]]);

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
			var spin = wheel.Held ? graphics.Identity() : graphics.Rotation(axle, state.Spin);
			var turn = wheel.Front ? graphics.Multiply(graphics.Rotation([0, 1, 0], state.Steer * 0.5), spin) : spin;
			var m = wheel.Middle;

			var strokes = object.Strokes || [0, 0, 0, 0];
			var drop = (strokes[wheel.Corner] || 0) / (object.Size || 1);

			return graphics.Multiply(graphics.Translation(m[0], m[1] - drop, m[2]), graphics.Multiply(turn, graphics.Translation(-m[0], -m[1], -m[2])));
		};

		engine.WheelsOf = wheelsOf;

		/* Where a place of a piece stands in its model. */
		function placeOf (piece, index) {
			var seen = piece.Placed || piece.Geometry;
			var p = seen.Positions;

			return graphics.Apply(piece.Rest, [p[index * 3], p[index * 3 + 1], p[index * 3 + 2]]);
		}

		/* What moves of a model becomes pieces of its own, once: triangles inside the box, of the materials it names. */
		engine.OpeningsOf = function (model, vehicle) {
			model.Openings = model.Openings || {};

			(vehicle.Openings || []).forEach(function (opening) {
				var word = new RegExp(opening.Match || '.', 'i');
				var low = opening.Low || [-Infinity, -Infinity, -Infinity];
				var high = opening.High || [Infinity, Infinity, Infinity];

				if (model.Openings[opening.Name]) return;

				model.Openings[opening.Name] = true;

				model.Pieces.slice().forEach(function (piece) {
					var indices = piece.Geometry.Indices;
					var kept = [];
					var taken = [];
					var i;

					function inside (index) {
						var at = placeOf(piece, index);

						return [0, 1, 2].every(function (axis) {
							var value = opening.Both && axis === 0 ? Math.abs(at[0]) : at[axis];

							return value >= low[axis] && value <= high[axis];
						});
					}

					if (!word.test(piece.Material ? piece.Material.Name : '')) return;

					for (i = 0; i + 2 < indices.length; i += 3)
						(inside(indices[i]) && inside(indices[i + 1]) && inside(indices[i + 2]) ? taken : kept).push(indices[i], indices[i + 1], indices[i + 2]);

					if (!taken.length) return;

					piece.Geometry = Object.assign({}, piece.Geometry, {Indices: kept});

					model.Pieces.push(Object.assign({}, piece, {ID: piece.ID + '-' + opening.Name, Opening: opening.Name, Geometry: Object.assign({}, piece.Geometry, {Indices: taken})}));
				});
			});
		};

		/* How far what moves has come, in the space of its model, or null. */
		engine.OpeningMove = function (object, piece) {
			var vehicle = object.Values.Vehicle;
			var opening = vehicle && piece.Opening ? (vehicle.Openings || []).filter(function (each) {
				return each.Name === piece.Opening;
			})[0] : null;
			if (!opening) return null;

			var state = object.Opens = object.Opens || {};
			var wanted = given(opening.Open, 0);

			state[opening.Name] = state[opening.Name] === undefined ? wanted : state[opening.Name];

			var way = opening.Way || [0, -1, 0];
			var far = state[opening.Name] * given(opening.Reach, 1);

			return graphics.Translation(way[0] * far, way[1] * far, way[2] * far);
		};

		function openingsStep (object, elapsed) {
			(object.Values.Vehicle.Openings || []).forEach(function (opening) {
				var state = object.Opens = object.Opens || {};
				var wanted = given(opening.Open, 0);
				var now = state[opening.Name] === undefined ? wanted : state[opening.Name];

				state[opening.Name] = now + Math.max(-elapsed * 0.6, Math.min(elapsed * 0.6, wanted - now));
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
			var turn = object.Turn || graphics.Identity();
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

				return object !== hero && object.World && (ground ? object.Values.Vehicle : traits.Body || traits.Star || object.Values.Model);
			});
		}

		/* What is under a car: the road of its track, or the ground of the scene. */
		function surfaceOf (settings, hero) {
			var field = scene.Ground.Field;

			if (settings.Track) {
				return function (x, z) {
					var under = tracks.Under(settings.Track, x, z, hero.Car ? hero.Car.Along : undefined);

					/* A location is lifted so that its lowest stands on the ground. */
					under.Height += field.Lift || 0;

					return under;
				};
			}

			return function (x, z) {
				return {Height: Math.max(0, field.Height(x, z)), Grip: 1, Drag: 0};
			};
		}

		/* The four corners of a car against what stands in its way: the barrier of its track, the walls of a location, other vehicles. */
		function collide (hero, state, settings, long, wide, field, last) {
			var track = settings.Track;
			var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];
			var side = [ahead[1], -ahead[0]];
			var corners = [[long, wide], [long, -wide], [-long, wide], [-long, -wide], [0, wide], [0, -wide]].map(function (corner) {
				return [ahead[0] * corner[0] + side[0] * corner[1], ahead[1] * corner[0] + side[1] * corner[1]];
			});

			if (track) {
				var wall = track.Width / 2 + track.Margin - 0.1;

				state.Along = tracks.Near(track, state.X, state.Z, state.Along).Along;

				corners.forEach(function (corner) {
					var near = tracks.Near(track, state.X + corner[0], state.Z + corner[1], state.Along);
					var over = Math.abs(near.Offset) - wall;

					if (over > 0) {
						var sign = near.Offset > 0 ? -1 : 1;

						physics.Hit(state, [near.Way[1] * sign, -near.Way[0] * sign], over, corner, settings);
					}
				});

				return;
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
			var wanted = vectors.Normalize(graphics.Apply(hero.Body, [Math.sin(turned2) * Math.cos(up), -Math.sin(up), Math.cos(turned2) * Math.cos(up)]).map(function (value, index) {
				return value - graphics.Apply(hero.Body, [0, 0, 0])[index];
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
			var surface = surfaceOf(settings, hero);
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

			var input = {Gas: keys.KeyW || keys.ArrowUp, Brake: keys.KeyS || keys.ArrowDown, Steer: (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0), Stop: keys.Space, Drift: keys.ShiftLeft || keys.ShiftRight, Hand: keys.KeyC};
			var last = hero.Last || state;

			var part = physics.Steps(hero.Clock, elapsed, 1 / 120, function (step) {
				last = {X: state.X, Z: state.Z, Y: state.Y, Heading: state.Heading, Pitch: state.Pitch, Roll: state.Roll, Strokes: state.Strokes ? state.Strokes.slice() : [0, 0, 0, 0]};

				physics.Car(state, input, surface, settings, step);

				collide(hero, state, settings, long, wide, field, last);
			});

			hero.Last = last;

			var seen = {X: physics.Blend(last.X, state.X, part), Z: physics.Blend(last.Z, state.Z, part), Y: physics.Blend(last.Y, state.Y, part), Heading: physics.Blend(last.Heading, state.Heading, part), Pitch: physics.Blend(last.Pitch, state.Pitch, part), Roll: physics.Blend(last.Roll, state.Roll, part)};
			var ahead = [Math.sin(seen.Heading), Math.cos(seen.Heading)];
			var turn = graphics.Multiply(graphics.Rotation([0, 1, 0], seen.Heading + given(settings.Yaw, 0) * Math.PI / 180), graphics.Multiply(graphics.Rotation([1, 0, 0], -seen.Pitch), graphics.Rotation([0, 0, 1], seen.Roll)));
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
			hero.Head = settings.Seat ? graphics.Apply(turn, settings.Seat) : null;
			hero.Body = graphics.Multiply(graphics.Rotation([0, 1, 0], seen.Heading), graphics.Multiply(graphics.Rotation([1, 0, 0], -seen.Pitch), graphics.Rotation([0, 0, 1], seen.Roll)));

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

			var input = {Yaw: (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0), Pitch: (keys.KeyR || keys.ArrowDown ? 1 : 0) - (keys.KeyF || keys.ArrowUp ? 1 : 0), Roll: (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0), Throttle: (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), Lift: (keys.KeyC ? 1 : 0) - (keys.KeyX ? 1 : 0), Boost: keys.ShiftLeft || keys.ShiftRight, Stop: keys.Space};
			var last = hero.Last || state;

			var part = physics.Steps(hero.Clock, elapsed, 1 / 120, function (step) {
				last = {At: state.At, Right: state.Right, Up: state.Up, Ahead: state.Ahead};

				physics.Ship(state, input, settings, step);

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
			hero.Seen = {Right: right, Up: up, Ahead: ahead};
			hero.Flight = {At: at, Turn: graphics.Multiply([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, ahead[0], ahead[1], ahead[2], 0, 0, 0, 0, 1], graphics.Rotation([0, 1, 0], given(settings.Yaw, 0) * Math.PI / 180))};
			hero.World = at;
			hero.Turn = hero.Flight.Turn;
		}

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
			var far = size * Math.hypot(follow[0], follow[1]) * scene.Wanted / scene.ShipFar;
			/* Right of a ship is what lies on the left of the eye behind it: the mouse goes the way it goes on the ground. */
			var round = [-Math.sin(scene.Yaw) * Math.cos(scene.Pitch), Math.sin(scene.Pitch), -Math.cos(scene.Yaw) * Math.cos(scene.Pitch)];
			var way = vectors.Add(vectors.Add(vectors.Scale(view.Right, round[0]), vectors.Scale(view.Up, round[1])), vectors.Scale(view.Ahead, round[2]));

			scene.Target = hero.World.slice();
			camera.Position = vectors.Add(hero.World, vectors.Scale(way, far));
			camera.Target = hero.World.slice();
			camera.Up = view.Up.slice();

			return true;
		};

		/* Where the mounts of a vehicle stand now: of its model, so in its size and turned with it. */
		engine.MountsOf = function (object) {
			var vehicle = object.Values.Vehicle;
			var turn = object.Turn || graphics.Identity();
			var size = object.Size || 1;

			if (!vehicle || !vehicle.Mounts || !object.World) return [];

			return vehicle.Mounts.map(function (mount, index) {
				var at = vectors.Scale(mount.At || [0, 0, 0], size);
				var aim = mount.Aim || [0, 0, 1];

				return {Kind: mount.Kind || '', Index: index, Mount: mount, At: vectors.Add(object.World, graphics.Apply(turn, at)), Aim: vectors.Subtract(graphics.Apply(turn, aim), graphics.Apply(turn, [0, 0, 0]))};
			});
		};

		scene.Vehicles = {car: car, ship: ship};

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

	/* Moves what opens on a vehicle, 0 as its model has it, 1 as far as it goes; it goes there by degrees. */
	OpenPart: function (id, name, amount) {
		var object = this.Scene().Objects[id];
		var vehicle = object ? object.Values.Vehicle : null;

		((vehicle && vehicle.Openings) || []).forEach(function (opening) {
			if (opening.Name === name)
				opening.Open = amount;
		});
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
