/*
 * SceneAboard: the inside of a ship standing on a ground, walked in (SceneInteriors: rooms by its class, fitted into its
 * hull). A ship stands when its Vehicle says Parked (on its legs: lifted by the Gear of its class, unless it has a Lift of
 * its own) or it has landed on the ground of a scene. Its hull is measured where it stands (SceneInteriors.Hull) and its
 * inside laid out in it: objects <ship>:inside, <ship>:ceiling and <ship>:ramp (the ramp and the legs) of their models,
 * turned as the hull is, and a lamp (<ship>:lamp:<n>) under each lamp of its ceilings. Its floors and walls
 * (SceneTerrainGenerator.FromModel) are what a character walks on there, as on a ground (the hooks InteriorFloor and
 * InteriorBlocks of the walk of a hero); what is solid of it (InteriorSolid: its hull, its walls, floors and ceilings, not
 * its rooms, doorways and the way down its ramp) is what a walker and the view keep out of; its hull is cut over its ramp
 * (HoleOf). Its seats are those of its consoles: G by a console sits there (SceneVehicles.BoardKey), G in the seat stands up
 * beside it; who sits there looks at the screen of its console (ConsoleView), a screen of the scene (<ship>:screen:<seat>)
 * over it showing the element of the page named for it (a data-screen console:<seat>, console:<role> or console:
 * GameConsole). The hull stays drawn round who is inside; with Cutaway of the scene it and the ceilings are not, while the
 * hero is inside. A ship in flight someone is in (flown, at a console, on foot) has its inside too, in space and in the
 * air of a location: made once in its own frame and carried with it (turned as it lies, a metre Unit units of the scene), no
 * ramp; G in the seat of its pilot stands the hero up there (Afoot of the scene), walking in its frame as the ship flies on
 * by itself, the view up its up. What is felt of how it moves (blueprints/aboard/forces, its coefficients the parameters of
 * the graph and the Forces of the Vehicle over them) carries a walker along the deck and shakes the view. In space G by its
 * airlock (the hatch in its floor, else over the seat of its pilot) lets one out of it (EVA): one floats in a suit by it, its
 * jets, its line and its stop of the graph of the suit (blueprints/aboard/suit), G by the airlock lets one in (event eva).
 * Interior(id) is
 * {Plan, Inside, Ramp, At, Yaw, Flying, Unit} of a ship standing or in flight, null else.
 */
Elemenx.Trait('SceneAboard', {
	AboardStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var meshes = this.$Service('Meshes');
		var terrain = this.$Service('SceneTerrainGenerator');
		var models = this.$Service('SceneModels');
		var interiors = this.$Service('SceneInteriors');
		var placed = scene.Interiors = scene.Interiors || {};
		var hulls = {};
		var looked = 0;

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function cutaway () {
			return self.Cutaway === true || self.Cutaway === 'true';
		}

		/* A ship that stands on the ground of the scene: Parked, or landed there. */
		function standing (object) {
			var settings = object.Values.Vehicle;
			if (!settings || settings.Kind !== 'ship' || !scene.Ground || scene.Surface || object.Hidden && !object.CutAway) return false;

			/* Down in a location (SceneLanding: its Flying landed), or parked on a ground at its X and Y. */
			if (object.Flying)
				return !!object.Flying.Landed && !!scene.Location && !!object.Flying.At;

			return !!settings.Parked && object.Values.X !== undefined;
		}

		/* The turn of a yaw (degrees) and a point of the inside (its metres) where it stands. */
		function turnOf (yaw) {
			return math.Rotation([0, 1, 0], yaw * Math.PI / 180);
		}

		/* Of an inside in flight its frame is the ship's: its Turn, a metre Unit units of the scene (in real sizes of space a metre is tiny). */
		function worldOf (record, point) {
			return vectors.Add(record.At, math.Apply(record.Turn, vectors.Scale(point, record.Unit || 1)));
		}

		/* A point of the scene in the frame of an inside (its metres). */
		function localOf (record, point) {
			return vectors.Scale(math.Apply(record.Back, vectors.Subtract(point, record.At)), 1 / (record.Unit || 1));
		}

		/* Who walks in a ship in flight, in its frame: {actor: {Vehicle, At (metres of its inside), Rise, Grounded}}, of the scene as Seated is. */
		var afoot = scene.Afoot = scene.Afoot || {};

		/* A metre in units of the scene where a ship flies: of real sizes in space, else 1. */
		function unitOf () {
			/* Over the surface of a body (SceneLanding) a kilometre is a unit. */
			if (scene.Surface) return 0.001;

			return !scene.Ground && engine.Metre && engine.Metre() || 1;
		}

		/* Whether a ship is drawn over the surface of a body now (SceneLanding: Surface of the scene), where it says. */
		function overSurface (object) {
			return !!scene.Surface && scene.Surface.Ship === object.ID && !!scene.Surface.ShipAt && !!scene.Surface.ShipTurn;
		}

		/*
		 * A ship in flight with an inside: one someone is in (flown, in a seat of it, on foot in it), in space or in the air of a
		 * location (not over the surface of a body: drawn of another frame). Its inside goes with it as it flies, turned as it is.
		 */
		function flying (object) {
			var settings = object.Values.Vehicle;
			if (!settings || settings.Kind !== 'ship' || settings.Interior === false || scene.Surface && !overSurface(object) || !object.World || !object.Turn || object.Away && !overSurface(object)) return false;

			return !!object.Pilot || Object.keys(object.Crew || {}).some(function (seat) {
				return !!object.Crew[seat];
			}) || Object.keys(afoot).some(function (id) {
				return afoot[id].Vehicle === object.ID;
			});
		}

		/* The frame of a ship in flight now: where it is, how it lies, how large a metre is. */
		function frame (object, record) {
			var surface = overSurface(object) ? scene.Surface : null;

			record.At = (surface ? surface.ShipAt : object.World).slice();
			record.Turn = surface ? surface.ShipTurn : object.Turn;
			record.Back = math.Invert(record.Turn) || math.Identity();
			record.Unit = unitOf();
		}

		/*
		 * The floors and walls of its inside and ramp, turned as it stands, round where it stands (asked of a point less At: its
		 * heights of its own, as FromModel has them). Regression: made where it stands, its heights were of its own floor still,
		 * and a ship on a hill had its floor at the foot of it.
		 */
		function fieldOf (record) {
			/* In flight in its own frame: who walks there walks in it (afoot). */
			var place = record.Local ? math.Identity() : record.Turn;
			var parts = [];

			[record.Inside, record.Ramp].forEach(function (name) {
				if (!name) return;

				models.Make(name).Pieces.forEach(function (piece) {
					var made = meshes.Transform(piece.Placed || piece.Geometry, math.Multiply(place, piece.Rest || math.Identity()));

					parts.push({Positions: made.Positions, Normals: made.Normals, Indices: made.Indices, Soft: false});
				});
			});

			return terrain.FromModel(parts, {});
		}

		/* The ground a ship stands on: the top floor of the ground there (of a location of floors over each other, the highest). */
		function groundOf (x, z) {
			var field = scene.Ground.Field;

			return Math.max(0, field.Height(x, z, 10000));
		}

		/* Whether a ship is drawn of a model; the model, once it has come (null before). */
		function modelled (object) {
			var name = object.Shape || object.Values.Model;

			return !!name && typeof name === 'string' && models.Has(name);
		}

		function hullModel (object) {
			var name = object.Shape || object.Values.Model;

			return modelled(object) && models.Ready(name) ? models.Make(name) : null;
		}

		/*
		 * Its hull measured in the frame of its inside (from where it is drawn: its World, Turn and scale; its nose the way its
		 * Turn looks), kept for as long as it stands so.
		 */
		function hullOf (object, record) {
			var made = hullModel(object);
			var settings = object.Traits && object.Traits.Model || {};
			var scale = object.Scaled || vectors.Scale(settings.Scale || [1, 1, 1], object.Size || 1);
			var key;
			var whole;

			if (!made || !object.World) return null;

			key = [made.Key, scale.map(function (value) {
				return Math.round(value * 1000);
			}).join(','), Math.round((object.World[1] - record.At[1]) * 100), record.Key].join('|');

			if (hulls[object.ID] && hulls[object.ID].Key === key) return hulls[object.ID].Hull;

			whole = math.Multiply(math.Scaling(1 / (record.Unit || 1), 1 / (record.Unit || 1), 1 / (record.Unit || 1)), math.Multiply(record.Back, math.Multiply(math.Translation(object.World[0] - record.At[0], object.World[1] - record.At[1], object.World[2] - record.At[2]), math.Multiply(object.Turn || math.Identity(), math.Scaling(scale[0], scale[1], scale[2])))));

			hulls[object.ID] = {Key: key, Hull: interiors.Hull(made.Pieces.map(function (piece) {
				var geometry = meshes.Transform(piece.Placed || piece.Geometry, math.Multiply(whole, piece.Rest || math.Identity()));

				return {Positions: geometry.Positions, Indices: geometry.Indices};
			}))};

			return hulls[object.ID].Hull;
		}

		/* Its legs: a ship parked stands on them, as high as the Gear of its class (unless it has a Lift of its own). */
		function legs (object) {
			var settings = object.Values.Vehicle;
			var gear;

			if (!settings.Parked || object.Flying || object.Values.Lift !== undefined && !object.Geared) return;

			gear = interiors.GearOf({Length: number(settings.Length, object.Size || 30), Interior: settings.Interior});

			if (object.Values.Lift !== gear) {
				object.Values.Lift = gear;
				object.Geared = true;
			}
		}

		/* Its inside put where it stands (made again as it moves), its seats those of its consoles. */
		function place (object) {
			var settings = object.Values.Vehicle;
			var field = scene.Ground.Field;
			var flying = object.Flying;
			var x = flying ? flying.At[0] : number(object.Values.X, 0);
			var z = flying ? flying.At[2] : number(object.Values.Y, 0);
			/* Its nose: the way its Turn looks (+z of its model); else of a ship flown its Heading, of one parked its Yaw. */
			var ahead = object.Turn ? math.Apply(object.Turn, [0, 0, 1]) : null;
			var yaw = ahead && Math.abs(ahead[0]) + Math.abs(ahead[2]) > 1e-6 ? Math.atan2(ahead[0], ahead[2]) * 180 / Math.PI : flying ? (number(flying.Heading, 0) + Math.PI) * 180 / Math.PI : number(object.Values.Yaw, 0);
			var power = object.Traits && object.Traits.Power;
			var key = [Math.round(x * 10), Math.round(z * 10), Math.round(yaw * 10), object.World ? Math.round(object.World[1] * 10) : 0].join(':');
			var record = placed[object.ID];
			var ship = {Length: number(settings.Length, object.Size || 30), Interior: settings.Interior, Reactors: power && power.Reactors ? power.Reactors.length : 1};
			var hull;
			var made;

			legs(object);

			if (record && record.Key === key) return record;

			record = {Key: key, ID: object.ID, At: [x, flying && flying.At[1] !== null ? flying.At[1] : groundOf(x, z), z], Yaw: yaw, Turn: turnOf(yaw), Back: turnOf(-yaw)};

			/* Its hull not come yet (nor where it stands): its inside waits for it. Of no model, its rooms are as its class has them. */
			hull = hullOf(object, record);

			if (!hull && modelled(object) || object.Geared && Math.abs(object.World[1] - record.At[1] - object.Values.Lift) > 0.05) {
				if (placed[object.ID])
					forget(object.ID);

				return null;
			}

			made = interiors.Define(models, ship, hull);

			if (!made.Plan.Rooms.length) {
				if (placed[object.ID])
					forget(object.ID);

				return null;
			}

			placed[object.ID] = Object.assign(record, {Plan: made.Plan, Hull: hull, Inside: made.Inside, Ceiling: made.Ceiling, Ramp: made.Ramp});
			record.Field = fieldOf(record);

			[['inside', made.Inside], ['ceiling', made.Ceiling], ['ramp', made.Ramp]].forEach(function (pair) {
				var id = object.ID + ':' + pair[0];
				if (self.Get(id))
					self.Remove(id);

				if (!pair[1]) return;

				/*
				 * Lifted to where the ship stands (a ship come down may stand over the ground under it: a pad, its legs), turned as it
				 * is (Facing). Regression: turned by a Yaw, which a thing on a ground does not read, it stood across a ship landed.
				 */
				self.Add('thing', {ID: id, Name: '', Parent: null, Model: pair[1], Size: 1, X: x, Y: z, Facing: yaw, Aboard: object.ID, Lift: Math.max(0, record.At[1] - Math.max(0, field.Height(x, z)))});
			});

			lamps(record);

			screens(record);

			/* Its seats: those of its consoles, inside (where they stand: SceneVehicles reads them of InteriorWorld). */
			settings.Seats = made.Plan.Seats.map(function (seat) {
				return {ID: seat.ID, Role: seat.Role, At: seat.At, Exit: seat.Exit, Console: seat.Console, Controls: !!seat.Controls && !settings.Parked, Inside: true};
			});

			return record;
		}

		/*
		 * Its inside going with a ship in flight (carry: made once, in its own frame), its parts where it is each step (follow);
		 * no ramp down (it is up while it flies), its seats those of its consoles, the one of the pilot flying it.
		 */
		function carry (object) {
			var settings = object.Values.Vehicle;
			var record = placed[object.ID];
			var key = 'flight:' + unitOf();
			var power = object.Traits && object.Traits.Power;
			var ship = {Length: number(settings.Length, object.Size || 30), Interior: settings.Interior, Reactors: power && power.Reactors ? power.Reactors.length : 1};
			var hull;
			var made;

			/*
			 * In flight all the way (space, over the surface of a body, the air of a location): the same inside, its frame the one of
			 * where the ship is now; its parts again if the scene made its objects again (a location came).
			 */
			if (record && record.Local) {
				record.Key = key;

				frame(object, record);

				parts(record, object);

				follow(record);

				return record;
			}

			if (record)
				forget(object.ID);

			record = {Key: key, ID: object.ID, Local: true, Yaw: 0};

			frame(object, record);

			/*
			 * Its hull measured where the scene has it, in its own units (over the surface of a body it is drawn elsewhere, of
			 * kilometres). Regression: measured in the frame of the surface, its rooms fitted into nothing.
			 */
			var turn = object.Turn || math.Identity();

			hull = hullOf(object, {Key: 'flight', At: object.World, Turn: turn, Back: math.Invert(turn) || math.Identity(), Unit: !scene.Ground && engine.Metre && engine.Metre() || 1});

			if (!hull && modelled(object)) return null;

			made = interiors.Define(models, ship, hull);

			if (!made.Plan.Rooms.length) return null;

			placed[object.ID] = Object.assign(record, {Plan: made.Plan, Hull: hull, Inside: made.Inside, Ceiling: made.Ceiling, Ramp: null});
			record.Field = fieldOf(record);

			[['inside', made.Inside], ['ceiling', made.Ceiling]].forEach(function (pair) {
				var id = object.ID + ':' + pair[0];
				if (self.Get(id))
					self.Remove(id);

				if (pair[1])
					self.Add('thing', {ID: id, Name: '', Parent: null, Model: pair[1], Size: 1, Aboard: object.ID});
			});

			lamps(record);

			settings.Seats = made.Plan.Seats.map(function (seat) {
				return {ID: seat.ID, Role: seat.Role, At: seat.At, Exit: seat.Exit, Console: seat.Console, Controls: !!seat.Controls, Inside: true};
			});

			follow(record);

			return record;
		}

		/* The parts of an inside in flight (its inside and ceiling things, its lamps), made again if they are not in the scene. */
		function parts (record, object) {
			[['inside', record.Inside], ['ceiling', record.Ceiling]].forEach(function (pair) {
				if (pair[1] && !scene.Objects[object.ID + ':' + pair[0]])
					self.Add('thing', {ID: object.ID + ':' + pair[0], Name: '', Parent: null, Model: pair[1], Size: 1, Aboard: object.ID});
			});

			if ((record.Lamps || []).some(function (id) {
				return !scene.Objects[id];
			}))
				lamps(record);
		}

		/* The parts of an inside in flight where the ship is now, turned as it lies, a metre as large as it is there. */
		function follow (record) {
			['inside', 'ceiling'].forEach(function (part) {
				var object = scene.Objects[record.ID + ':' + part];
				if (!object) return;

				object.World = record.At.slice();
				object.Position = object.World;
				object.Turn = record.Turn;
				object.Size = record.Unit;
			});

			/* The screens of its consoles, as it lies, as large as a metre is there. */
			record.Plan.Seats.forEach(function (seat) {
				var screen = scene.Objects[record.ID + ':screen:' + seat.ID];
				var at;

				if (!screen) return;

				at = worldOf(record, [seat.Console[0], seat.Console[1] + 1.25, seat.Console[2] - 0.085]);
				screen.Values.X = at[0];
				screen.Values.Y = at[2];
				screen.Values.Z = at[1];
				screen.PaneTurn = math.Multiply(record.Turn, math.Rotation([0, 1, 0], Math.PI));
				/* Its own sizes (over those of its trait, SceneScreens). Regression: of metres in space, it was kilometres wide. */
				screen.Values.Width = 0.9 * record.Unit;
				screen.Values.Height = 0.5 * record.Unit;

				if (screen.Traits && screen.Traits.Screen) {
					screen.Traits.Screen.Width = screen.Values.Width;
					screen.Traits.Screen.Height = screen.Values.Height;
				}
			});

			/* Its lamps under its ceilings, as it lies, as far as their light goes there. */
			(record.Lamps || []).forEach(function (id, index) {
				var light = scene.Objects[id];
				var lamp = record.Plan.Lamps[index];
				var settings = light && light.Traits && light.Traits.Light;
				var at;

				if (!settings || !lamp) return;

				/* From the ship as the scene has it (over the surface of a body it is elsewhere than drawn). */
				at = vectors.Subtract(worldOf(record, lamp.At), scene.Objects[record.ID].World);
				light.Values.X = at[0];
				light.Values.Y = at[2];
				settings.Height = at[1];
				settings.Radius = lamp.Radius * record.Unit;
			});
		}

		/*
		 * A lamp of the scene under each lamp of its ceilings, going with the ship (Follow: from where it stands, not from the
		 * ground under the lamp). Regression: in a location of a system the ground under a lamp was of another frame, and the
		 * lamps hung 18 m under the floor.
		 */
		function lamps (record) {
			var ship = scene.Objects[record.ID];

			unlamp(record.ID);

			record.Lamps = record.Plan.Lamps.map(function (lamp, index) {
				var at = worldOf(record, lamp.At);
				var id = record.ID + ':lamp:' + index;

				self.Add('light', {ID: id, Name: '', Parent: null, Follow: record.ID, X: at[0] - ship.World[0], Y: at[2] - ship.World[2], Height: at[1] - ship.World[1], Color: lamp.Color, Power: lamp.Power, Radius: lamp.Radius, Aboard: record.ID});

				return id;
			});
		}

		function unlamp (id) {
			Object.keys(scene.Objects).forEach(function (one) {
				if (one.indexOf(id + ':lamp:') === 0)
					self.Remove(one);
			});
		}

		/* The element of the page a console shows: a data-screen of the slot screens named console:<seat>, console:<role> or console. */
		function consoleOf (seat) {
			return ['console:' + seat.ID, 'console:' + seat.Role, 'console'].filter(function (name) {
				return !!engine.ScreenElement(name);
			})[0] || '';
		}

		/*
		 * A screen of the scene (<ship>:screen:<seat>) over the screen of each console the page holds an element for (consoleOf):
		 * that element shown there, the pointer (a mouse, a finger) working on it as on the element. None: the screen only glows.
		 */
		function screens (record) {
			var names = record.Plan.Seats.map(consoleOf);
			if (record.Screens === names.join('|')) return;

			unscreen(record.ID);

			record.Screens = names.join('|');

			record.Plan.Seats.forEach(function (seat, index) {
				var at = worldOf(record, [seat.Console[0], seat.Console[1] + 1.25, seat.Console[2] - 0.085]);

				if (!names[index]) return;

				/* Turned to the seat (back from the nose), on the face of the screen of the console. */
				self.Add('screen', {ID: record.ID + ':screen:' + seat.ID, Name: '', Parent: null, X: at[0], Y: at[2], Z: at[1], Yaw: record.Yaw + 180, Width: 0.9, Height: 0.5, Element: names[index], Interactive: true, Aboard: record.ID});
			});
		}

		function unscreen (id) {
			Object.keys(scene.Objects).forEach(function (one) {
				if (one.indexOf(id + ':screen:') === 0)
					self.Remove(one);
			});
		}

		/*
		 * The view of who sits at a console of a ship standing: {Eye (its eyes, over the seat), Screen (the middle of the screen
		 * of the console)}; null for an actor in no seat of one.
		 */
		engine.ConsoleView = function (actor) {
			var aboard = actor ? actor.Aboard : null;
			var record = aboard ? placed[aboard.Vehicle] : null;
			var seat = record ? record.Plan.Seats.filter(function (one) {
				return one.ID === aboard.Seat;
			})[0] : null;
			if (!seat)
				return null;

			return {Eye: worldOf(record, [seat.Console[0], seat.Console[1] + 1.2, seat.Console[2] - 1.05]), Screen: worldOf(record, [seat.Console[0], seat.Console[1] + 1.25, seat.Console[2] - 0.085])};
		};

		/* Where a point of the inside of a ship stands in the scene; null when it stands nowhere. */
		engine.InteriorWorld = function (object, point) {
			var record = object ? placed[object.ID] : null;

			return record ? worldOf(record, point || [0, 0, 0]) : null;
		};

		/* The floor of an inside under a point (x, z) near y; -Infinity where none is. */
		engine.InteriorFloor = function (x, z, y) {
			var best = -Infinity;

			Object.keys(placed).forEach(function (id) {
				var record = placed[id];
				var field = record.Field;
				var ox = x - record.At[0];
				var oz = z - record.At[2];
				var oy = y - record.At[1];

				if (record.Local) return;

				if (field && field.Stands(ox, oz, oy + 0.6))
					best = Math.max(best, field.Height(ox, oz, oy + 0.6) + record.At[1]);
			});

			return best;
		};

		/*
		 * Whether a ball (radius metres round a point of the scene) is in what is solid of a ship standing: its hull, its
		 * walls, floors and ceilings (not its rooms, doorways and the way down its ramp). Except: the id of a ship left out
		 * (the view round a ship it follows). Cut away (Cutaway, the hero inside), it holds no view: the view looks in from over it.
		 */
		engine.InteriorSolid = function (point, radius, except) {
			return Object.keys(placed).some(function (id) {
				var record = placed[id];
				var local;

				if (id === except) return false;

				local = localOf(record, point);

				if (scene.Objects[id] && scene.Objects[id].CutAway) return false;

				return interiors.Solid(record.Plan, record.Hull, local, radius / (record.Unit || 1));
			});
		};

		/* A wall of an inside, or its hull, where (x, z) is, at the height y of the feet of what walks: it stops it. */
		engine.InteriorBlocks = function (x, z, y) {
			return Object.keys(placed).some(function (id) {
				var record = placed[id];
				var top = record.At[1] + record.Plan.Floor + record.Plan.Height;

				if (record.Local) return false;

				if (record.Field && y > record.At[1] + 0.3 && y < top && !record.Field.CanStep(x - record.At[0], z - record.At[2], y - record.At[1])) return true;

				return interiors.Solid(record.Plan, record.Hull, localOf(record, [x, y + 0.6, z]), 0.25) || interiors.Solid(record.Plan, record.Hull, localOf(record, [x, y + 1.5, z]), 0.25);
			});
		};

		/*
		 * The hole cut in the hull of a ship over its ramp: {At (its middle, in the scene), Yaw (radians), Half (its half sizes)};
		 * null for none.
		 */
		engine.HoleOf = function (object) {
			var record = object ? placed[object.ID] : null;
			var opening = record && !record.Local && record.Plan.Opening;
			var glass;
			var front;
			var back;

			/*
			 * In flight, while the eye is in it: its window, from its glass forward out through its nose, wider than the glass as far
			 * as it goes (what is seen through it spreads), turned as the ship lies (Turn, of the scene into the box), as large as a
			 * metre is there. From outside the hull is whole.
			 */
			if (record && record.Local) {
				glass = interiors.WindowsOf(record.Plan)[0];

				if (!glass || !scene.Eye || engine.InsideOf(scene.Eye) !== record.ID) return null;

				front = Math.max(glass.High[2] + 1, record.Hull ? record.Hull.High[2] + 1 : glass.High[2] + 30);
				back = glass.High[2] + 0.05;

				return {At: worldOf(record, [(glass.Low[0] + glass.High[0]) / 2, (glass.Low[1] + glass.High[1]) / 2, (back + front) / 2]), Yaw: 0, Half: [((glass.High[0] - glass.Low[0]) / 2 + front - back) * record.Unit, ((glass.High[1] - glass.Low[1]) / 2 + front - back) * record.Unit, (front - back) / 2 * record.Unit], Turn: [record.Back[0], record.Back[1], record.Back[2], record.Back[4], record.Back[5], record.Back[6], record.Back[8], record.Back[9], record.Back[10]]};
			}

			if (!opening) return null;

			return {At: worldOf(record, [(opening.Low[0] + opening.High[0]) / 2, (opening.Low[1] + opening.High[1]) / 2, (opening.Low[2] + opening.High[2]) / 2]), Yaw: record.Yaw * Math.PI / 180, Half: [(opening.High[0] - opening.Low[0]) / 2, (opening.High[1] - opening.Low[1]) / 2, (opening.High[2] - opening.Low[2]) / 2]};
		};

		/* The seat of a console within reach of an actor on foot in an inside: {Vehicle, Seat}; null for none. */
		engine.NearestSeat = function (id) {
			var actor = scene.Objects[id];
			var best = null;
			/* Within reach of the seat from behind it, past the back of its chair. */
			var far = 2.3;

			if (!actor || !actor.World || actor.Aboard || afoot[id] && (afoot[id].Out || afoot[id].Cycle)) return null;

			/* In the frame of each inside (its metres): a ship in flight lies any way. */
			Object.keys(placed).forEach(function (ship) {
				var record = placed[ship];
				var object = scene.Objects[ship];
				var crew = object && object.Crew || {};
				var local = afoot[id] && afoot[id].Vehicle === ship ? afoot[id].At : localOf(record, actor.World);

				record.Plan.Seats.forEach(function (seat) {
					var apart = Math.hypot(seat.At[0] - local[0], seat.At[2] - local[2]);

					if (!crew[seat.ID] && apart < far && Math.abs(seat.At[1] - local[1]) < 1.5) {
						far = apart;
						best = {Vehicle: ship, Seat: seat.ID};
					}
				});
			});

			return best;
		};

		/* The ship whose rooms (within its walls, floors and ceilings) a point of the scene is in; '' for none. */
		engine.InsideOf = function (point) {
			var found = '';

			Object.keys(placed).forEach(function (id) {
				var record = placed[id];
				var local = localOf(record, point);
				if (!found && record.Plan.Rooms.some(function (box) {
					return local[0] > box.Low[0] && local[0] < box.High[0] && local[1] > box.Low[1] && local[1] < box.High[1] && local[2] > box.Low[2] && local[2] < box.High[2];
				}))
					found = id;
			});

			return found;
		};

		/*
		 * The box of the rooms of the ship standing nearest a point (within far metres), with their floors and ceilings: {At
		 * (its middle in the scene), Yaw (radians), Half, Leak (what of the day still comes in)}; null for none. Not with
		 * Cutaway while its hull is not drawn.
		 */
		engine.Indoor = function (point, far) {
			var best = null;
			var nearest = far;

			Object.keys(placed).forEach(function (id) {
				var record = placed[id];
				var rooms = record.Plan.Rooms;
				var slab = record.Plan.Deck.Slab;
				var low = [Infinity, record.Plan.Floor - slab, Infinity];
				var high = [-Infinity, record.Plan.Floor + record.Plan.Height + slab, -Infinity];
				var apart = vectors.Distance(point, record.At);
				if (record.Local || apart > nearest || scene.Objects[id] && scene.Objects[id].CutAway) return;

				rooms.forEach(function (room) {
					low[0] = Math.min(low[0], room.Low[0]);
					low[2] = Math.min(low[2], room.Low[2]);
					high[0] = Math.max(high[0], room.High[0]);
					high[2] = Math.max(high[2], room.High[2]);
				});

				nearest = apart;
				best = {At: worldOf(record, [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2]), Yaw: record.Yaw * Math.PI / 180, Half: [(high[0] - low[0]) / 2, (high[1] - low[1]) / 2, (high[2] - low[2]) / 2], Leak: 0.06};
			});

			return best;
		};

		/* A ship nobody flies goes on by itself as it went: its throttle, its turn (in space; a pilot of it is AI, later). */
		function coast (ship, elapsed) {
			/* One parked stands on its legs. */
			if (ship.Values.Vehicle.Parked) return;

			engine.VehicleStep(ship, {Pad: {X: 0, Y: 0, LookX: 0, LookY: 0, Gas: 0, Brake: 0, DX: 0, DY: 0}}, elapsed);

			if (ship.Flight && ship.Flight.At) {
				ship.World = ship.Flight.At.slice();
				ship.Turn = ship.Flight.Turn || ship.Turn;
			}
		}

		/*
		 * What who is in a ship in flight feels of how it moves (blueprints/aboard/forces; Graphs['aboard/forces'] of the scene in
		 * its place; its coefficients the parameters of the graph, those of the Forces of the Vehicle of the ship over them): of
		 * how it speeds up in its own frame (Ax, Ay, Az, m/s²), how fast it turns (Turn, rad/s), a hit on it (Hit 0 to 1, fading;
		 * HitX, HitZ the way it went) and a way far at once (Warp): {PushX, PushZ (m/s along its deck), ShakePitch, ShakeYaw,
		 * ShakeRoll (radians)}. A jump of its place (a passage, a frame made again) is no force.
		 */
		function forces (ship, record, elapsed) {
			var motion = record.Motion;
			var unit = record.Unit || 1;
			var travel = !!ship.Travel;
			var code = engine.GraphCode('', 'aboard/forces');
			var ahead = vectors.Normalize(math.Apply(record.Turn, [0, 0, 1]));
			var velocity;
			var accel;
			var local;
			var turn;
			var hit;
			var way;

			if (!(elapsed > 0) || !code) return null;

			velocity = motion ? vectors.Scale(vectors.Subtract(record.At, motion.At), 1 / (elapsed * unit)) : [0, 0, 0];
			accel = motion && !travel && !motion.Travel ? vectors.Scale(vectors.Subtract(velocity, motion.Velocity), 1 / elapsed) : [0, 0, 0];

			if (vectors.Length(accel) > 300)
				accel = [0, 0, 0];

			accel = motion ? vectors.Lerp(motion.Accel, accel, 1 - Math.exp(-elapsed * 8)) : accel;

			/*
			 * What its artificial gravity has caught up with (a second behind) is not felt: only the change of how it speeds up.
			 * Regression: the long burn of a take-off (its time hurried) carried the walker 30 m along the deck to the back wall.
			 */
			var held = motion && motion.Held ? vectors.Lerp(motion.Held, accel, 1 - Math.exp(-elapsed)) : accel;
			var sudden = vectors.Subtract(accel, held);

			turn = motion ? Math.acos(Math.max(-1, Math.min(1, vectors.Dot(ahead, motion.Ahead)))) / elapsed : 0;
			local = math.Apply(record.Back, sudden);
			hit = record.Hit || 0;
			way = record.HitWay || [0, 0, 0];
			record.Hit = hit * Math.exp(-elapsed * 5);
			record.Motion = {At: record.At.slice(), Velocity: velocity, Ahead: ahead, Accel: accel, Held: held, Travel: travel};

			/* Its coefficients: those of the graph, the Forces of the ship over them. */
			return code.Run(ship.Values.Vehicle.Forces || {}, {Time: scene.Seconds, Elapsed: elapsed, Ax: local[0], Ay: local[1], Az: local[2], Turn: turn, Hit: hit, HitX: way[0], HitZ: way[2], Warp: travel ? 1 : 0});
		}

		/* A hit on a ship in flight: felt in it (forces), as strong as its damage (a full one of 30), the way it went in its frame. */
		engine.AboardHit = function (object, way, amount) {
			var record = object ? placed[object.ID] : null;
			var local;

			if (!record || !record.Local || !way) return;

			local = math.Apply(record.Back, way);
			local[1] = 0;

			record.Hit = Math.min(1, (record.Hit || 0) + Math.max(0.15, (Number(amount) || 0) / 30));
			record.HitWay = vectors.Length(local) ? vectors.Normalize(local) : [0, 0, 0];
		};

		/* A point of an inside on the floor under it (within 2 m), else as it is: who is carried over from another frame stands, not falls. */
		function onFloor (record, point) {
			var field = record.Field;
			var lift = field ? field.Lift || 0 : 0;
			var floor;

			if (!field || !field.Stands(point[0], point[2], point[1] + lift + 2)) return point;

			floor = field.Height(point[0], point[2], point[1] + lift + 2) - lift;

			return Math.abs(floor - point[1]) < 2 ? [point[0], floor, point[2]] : point;
		}

		/* How tall one is, in metres (its model of a character). */
		function tallOf (actor) {
			var model = actor.Traits && actor.Traits.Model || {};

			return number(model.Size, number(actor.Values.Size, 1.8));
		}

		/*
		 * Out of a seat of a ship in flight: on foot in its frame, where the seat says one steps out (Exit, of its inside), shown
		 * again (SceneVehicles.Leave).
		 */
		engine.AboardLeft = function (actor, vehicle, seat) {
			var record = placed[vehicle.ID];
			if (!record || !record.Local) return;

			afoot[actor.ID] = {Vehicle: vehicle.ID, At: (seat && (seat.Exit || seat.At) || [0, 0, 0]).slice(), Rise: 0, Grounded: true};
			actor.Air = undefined;

			/* The ship goes on as it went (its autopilot holds it), till one flies it again or asks its autopilot for more. */
			if (!vehicle.Autopilot && engine.AutopilotSet)
				engine.AutopilotSet(vehicle, 'hold');
		};

		/*
		 * Out of a ship in space (EVA): G by its airlock lets one out, the airlock cycled first (Cycle seconds, hidden in it); out
		 * there one floats in a suit by the ship, in its frame: WASD along the view, Space up, C down, Shift faster; its jets
		 * speed one up, the suit stops one by the ship when none is asked for (Assist), a line holds one to the airlock (Tether);
		 * the hull stops one; one is carried in the frame of the ship as it goes. G by the airlock again lets one in. How,
		 * of the graph of the suit (blueprints/aboard/suit; Graphs['aboard/suit'] of the scene in its place; the Suit of who goes
		 * out over its parameters). The airlock of a ship: the hatch in its floor (out under its belly), else over the seat of
		 * its pilot (out over its canopy). Each step is told (event eva {Actor, Vehicle, Step: cycle, out, in; Out}).
		 */
		function airlockOf (record, tall) {
			var plan = record.Plan;
			var hull = record.Hull;
			var hatch = plan.Ramp && plan.Ramp.Hatch;
			var seat = plan.Seats.filter(function (one) {
				return one.Controls;
			})[0] || plan.Seats[0];
			var x;
			var z;
			var column;
			var inside;

			if (hatch) {
				x = (hatch.Low[0] + hatch.High[0]) / 2;
				z = (hatch.Low[2] + hatch.High[2]) / 2;
				column = hull ? interiors.columnOf(hull, x, z) : -1;

				return {Inside: [x, hatch.High[1], z], Outside: [x, (column >= 0 ? hull.Bottom[column] : hatch.Low[1]) - tall - 0.6, z], Way: 'down'};
			}

			if (!seat)
				return null;

			inside = seat.Exit || seat.At;
			column = hull ? interiors.columnOf(hull, seat.At[0], seat.At[2]) : -1;

			return {Inside: inside.slice(), Outside: [seat.At[0], (column >= 0 ? hull.Top[column] : seat.At[1] + 2) + 0.6, seat.At[2]], Way: 'up'};
		}

		function suitOf (hero, inputs) {
			var code = engine.GraphCode('', 'aboard/suit');
			if (!code)
				return {Push: 1.2, Top: 3, Damp: 0.9, Pull: 0, Cycle: 1.5, Reach: 2.5};

			return code.Run(hero.Values.Suit || {}, inputs);
		}

		function tellEva (hero, state, step) {
			self.$Emit('eva', {Actor: hero.ID, Vehicle: state.Vehicle, Step: step, Out: !!state.Out});
		}

		/* The airlock within reach of who is on foot in a ship in space, or floats by it: {Vehicle, Out (going out)}; null for none. */
		engine.AirlockNear = function (id) {
			var hero = scene.Objects[id];
			var state = hero ? afoot[id] : null;
			var record = state ? placed[state.Vehicle] : null;
			var lock;
			var reach;

			if (!record || !record.Local || state.Cycle || scene.Ground || scene.Surface) return null;

			lock = airlockOf(record, tallOf(hero));
			reach = suitOf(hero, {Boost: 0, Apart: 0}).Reach;

			if (!lock)
				return null;

			if (state.Out)
				return vectors.Length(vectors.Subtract(state.At, lock.Outside)) < reach + tallOf(hero) ? {Vehicle: state.Vehicle, Out: false} : null;

			return Math.hypot(state.At[0] - lock.Inside[0], state.At[2] - lock.Inside[2]) < reach && Math.abs(state.At[1] - lock.Inside[1]) < 1.5 ? {Vehicle: state.Vehicle, Out: true} : null;
		};

		/* Through the airlock (out, or in when one floats by it): false where none is within reach. */
		engine.Spacewalk = function (id) {
			var hero = scene.Objects[id];
			var near = engine.AirlockNear(id);
			var state = near ? afoot[id] : null;
			if (!state)
				return false;

			state.Cycle = {Out: near.Out, Left: suitOf(hero, {Boost: 0, Apart: 0}).Cycle};
			hero.Hidden = true;
			hero.Walking = 0;

			tellEva(hero, state, 'cycle');

			return true;
		};

		/* The airlock cycled: out under the belly (over the canopy), or in on its floor. */
		function cycle (hero, state, record, elapsed) {
			var lock = airlockOf(record, tallOf(hero));

			state.Cycle.Left -= elapsed;

			if (state.Cycle.Left > 0 || !lock) return;

			state.Out = state.Cycle.Out;
			state.At = (state.Out ? lock.Outside : lock.Inside).slice();
			state.Velocity = [0, 0, 0];
			state.Rise = 0;
			state.Grounded = !state.Out;
			hero.Hidden = false;

			delete state.Cycle;

			tellEva(hero, state, state.Out ? 'out' : 'in');
		}

		/* In its hull from outside (its hatch shut in flight: not the way down its ramp, as Solid has it): of its skin, else of its rooms. */
		function hullAt (record, point, radius) {
			var hull = record.Hull;
			var plan = record.Plan;

			/* Of no hull: its rooms within their walls, floors and ceilings. */
			if (!hull) {
				return plan.Rooms.some(function (room) {
					return point[0] > room.Low[0] - radius && point[0] < room.High[0] + radius && point[1] > room.Low[1] - plan.Deck.Slab - radius && point[1] < room.High[1] + plan.Deck.Slab + radius && point[2] > room.Low[2] - radius && point[2] < room.High[2] + radius;
				});
			}

			return [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius]].some(function (off) {
				var column = interiors.columnOf(hull, point[0] + off[0], point[2] + off[1]);

				return column >= 0 && point[1] >= hull.Bottom[column] - radius && point[1] <= hull.Top[column] + radius;
			});
		}

		/* Out of the ship: the jets of the suit, the line to the airlock, the hull in the way; its pose the float of its model. */
		function drift (hero, state, record, keys, elapsed) {
			var tall = tallOf(hero);
			var lock = airlockOf(record, tall);
			var yaw = scene.Drag && scene.Drag.Button === 2 ? scene.Drag.Yaw : scene.Yaw;
			var pitch = scene.Pitch;
			var forward = [-Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
			var right = [Math.cos(yaw), 0, -Math.sin(yaw)];
			var lean = engine.Leaning(keys);
			var lift = (keys.Space ? 1 : 0) - (keys.KeyC ? 1 : 0);
			var way = vectors.Add(vectors.Add(vectors.Scale(forward, lean[0]), vectors.Scale(right, lean[1])), [0, lift, 0]);
			var home = lock ? vectors.Subtract(lock.Outside, state.At) : [0, 0, 0];
			var suit = suitOf(hero, {Boost: keys.ShiftLeft || keys.ShiftRight ? 1 : 0, Apart: vectors.Length(home)});
			var velocity = state.Velocity || [0, 0, 0];
			var speed;
			var next;

			if (vectors.Length(way) > 1e-4) velocity = vectors.Add(velocity, vectors.Scale(vectors.Normalize(way), suit.Push * elapsed));
			else velocity = vectors.Scale(velocity, Math.max(0, 1 - suit.Damp * elapsed));

			/* The line: past its length it pulls one back. */
			if (suit.Pull > 0 && vectors.Length(home))
				velocity = vectors.Add(velocity, vectors.Scale(vectors.Normalize(home), suit.Pull * elapsed));

			speed = vectors.Length(velocity);

			if (speed > suit.Top && vectors.Length(way) > 1e-4)
				velocity = vectors.Scale(velocity, suit.Top / speed);

			next = vectors.Add(state.At, vectors.Scale(velocity, elapsed));

			/* The hull stops one, a little back off it. */
			if (hullAt(record, [next[0], next[1] + tall * 0.5, next[2]], tall * 0.3)) velocity = vectors.Scale(velocity, -0.2);
			else state.At = next;

			state.Velocity = velocity;
			state.Grounded = false;

			hero.Walking = 0;
			hero.Grounded = false;
			hero.Pace = 'float';

			engine.FaceView(hero, yaw, vectors.Length(way) > 1e-4, elapsed);

			/* It floats whether it goes or not: the clip of its pose, not of its walking (it walks none). */
			hero.Pose = 'float';
		}

		/* Who is on foot in a ship in flight walks; out of it (EVA) floats; in its airlock waits. */
		function move (hero, state, record, keys, elapsed, felt) {
			if (state.Cycle) cycle(hero, state, record, elapsed);
			else if (state.Out) drift(hero, state, record, keys, elapsed);
			else walk(hero, state, record, keys, elapsed, felt);
		}

		/* The walk of who is on foot in a ship in flight: as on a ground (walkHero), on the floors of its inside, its down the ship's. */
		function walk (hero, state, record, keys, elapsed, felt) {
			var field = record.Field;
			/*
			 * The heights of the field are of its model lifted to stand on 0 (FromModel: Lift); a walker goes in metres of the inside.
			 * Regression: in flight (no ramp nor legs down to 0) the walker stood by the depth of its deck under its floor, to the waist.
			 */
			var lift = field.Lift || 0;
			var tall = tallOf(hero);
			var yaw = scene.Drag && scene.Drag.Button === 2 ? scene.Drag.Yaw : scene.Yaw;
			var forward = [-Math.sin(yaw), 0, -Math.cos(yaw)];
			var right = [Math.cos(yaw), 0, -Math.sin(yaw)];
			var lean = engine.Leaning(keys);
			var running = keys.ShiftLeft || keys.ShiftRight;
			var pace = tall * (running ? 2.4 : lean[0] < 0 ? 0.8 : 1.1);
			var way = vectors.Add(vectors.Scale(forward, lean[0]), vectors.Scale(right, lean[1]));
			/* What it feels carries it along the deck (forces), only while it stands on it. */
			var push = felt && state.Grounded ? [felt.PushX || 0, 0, felt.PushZ || 0] : [0, 0, 0];
			var going;
			var x = state.At[0];
			var y = state.At[1];
			var z = state.At[2];
			var rise = state.Rise || 0;
			var moved = false;
			var steps;
			var floor;
			var i;

			/* Its hull and its walls (of its plan) at a point of the floor. */
			function solid (atX, atZ) {
				return interiors.Solid(record.Plan, record.Hull, [atX, y + 0.6, atZ], 0.25) || interiors.Solid(record.Plan, record.Hull, [atX, y + 1.5, atZ], 0.25);
			}

			/* What already stands in a wall (out of a seat by a console) may always leave it. */
			var stuck = solid(x, z);

			/* Where it may step: the walls of the inside push it out, its hull and its walls stop it. */
			function step (nextX, nextZ) {
				var out = field.Push(nextX, nextZ, y + lift, tall * 0.15, Math.max(0.5, tall * 0.22), tall * 0.9);
				if (!field.Stands(out[0], out[1], y + lift + 0.6) || !stuck && solid(out[0], out[1])) return;

				x = out[0];
				z = out[1];
				moved = true;
			}

			going = vectors.Add(vectors.Length(way) ? vectors.Scale(vectors.Normalize(way), pace) : [0, 0, 0], push);

			if (vectors.Length(going) > 1e-4) {
				steps = Math.ceil(vectors.Length(going) * elapsed / 0.15) || 1;

				for (i = 0; i < steps; i++)
					step(x + going[0] * elapsed / steps, z + going[2] * elapsed / steps);
			}

			moved = moved && vectors.Length(way) > 0;

			floor = field.Stands(x, z, y + lift + 0.6) ? field.Height(x, z, y + lift + 0.6) - lift : y;

			if (keys.Space && state.Grounded)
				rise = tall * 3;

			y += rise * elapsed;
			rise -= 18 * elapsed;

			if (rise <= 0 && (y <= floor + 0.02 || state.Grounded && !keys.Space && y - floor < tall * 0.3)) {
				state.Grounded = true;
				rise = 0;
				y = Math.abs(y - floor) > 0.02 ? y + (floor - y) * Math.min(1, elapsed * 16) : floor;
			}
			else {
				state.Grounded = false;
			}

			state.At = [x, y, z];
			state.Rise = rise;

			hero.Walking = moved ? pace : 0;
			hero.Back = lean[0] < 0;
			hero.Grounded = state.Grounded;

			if (!state.Grounded && rise > 0) hero.Pace = 'jump';
			else if (!lean[0] && lean[1]) hero.Pace = 'strafe-' + (lean[1] < 0 ? 'left' : 'right') + (running ? '-run' : '');
			else hero.Pace = running ? 'run' : 'walk';

			engine.FaceView(hero, yaw, moved || !state.Grounded || self.Person === 'first', elapsed);
		}

		/* Who is on foot in a ship in flight where the ship is now: its place, its turn (the ship's and its own), its size there. */
		function stand (hero, state, record) {
			var heading = hero.Heading || [0, 0, 1];

			hero.World = worldOf(record, state.At);
			hero.Position = hero.World;
			hero.Turn = math.Multiply(record.Turn, math.Rotation([0, 1, 0], Math.atan2(heading[0], heading[2])));
			hero.Size = tallOf(hero) * record.Unit;
		}

		/*
		 * The view round who is on foot in a ship in flight, of its frame: behind it (the mouse turns it as on a ground), kept
		 * inside the walls of the inside, up the ship's up; or in its eyes (Person first). The world outside turns as the ship does.
		 */
		function view (hero, state, record, elapsed, felt) {
			var camera = scene.Camera;
			var tall = tallOf(hero);
			var head = [state.At[0], state.At[1] + tall * 0.85, state.At[2]];
			/* Shaken by what is felt (forces): its turn, its tilt, its roll. */
			var yaw = scene.Yaw + (felt && felt.ShakeYaw || 0);
			var pitch = scene.Pitch + (felt && felt.ShakePitch || 0);
			var roll = felt && felt.ShakeRoll || 0;
			var round = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
			var wanted = state.Far || 3.2;
			var free = 0.3;
			var eye;
			var look;

			engine.EasePerson(elapsed);

			/* As far behind as the walls let it, a little short of them. */
			while (free < wanted && !interiors.Solid(record.Plan, record.Hull, vectors.Add(head, vectors.Scale(round, free + 0.25)), 0.22))
				free += 0.1;

			eye = vectors.Add(head, vectors.Scale(round, Math.min(wanted, free)));
			look = head;

			/* No room behind it in a narrow room: it fades away (dithered) rather than fill the view. */
			scene.HeroFade = scene.Inside < 0.5 ? Math.max(0, Math.min(1, (tall * 0.5 - Math.min(wanted, free)) / (tall * 0.3))) : 0;

			/* In its eyes: its head cut away round them (a model of its own; else the walker faded). */
			if (scene.Inside > 0.5) {
				/* As on a ground: over its neck, brought forward out of its head. */
				eye = [state.At[0] - Math.sin(yaw) * tall * 0.15, state.At[1] + tall * 1.0, state.At[2] - Math.cos(yaw) * tall * 0.15];
				look = vectors.Subtract(eye, round);
				scene.CutAt = worldOf(record, [state.At[0], state.At[1] + tall * 0.98, state.At[2]]);
				scene.HeroFade = hero.Worn ? 0 : 1;
			}

			camera.Ortho = 0;
			camera.Position = worldOf(record, eye);
			camera.Target = worldOf(record, look);
			camera.Up = vectors.Normalize(math.Apply(record.Turn, [Math.cos(yaw) * Math.sin(roll), Math.cos(roll), -Math.sin(yaw) * Math.sin(roll)]));
			camera.Near = Math.max(1e-12, 0.05 * record.Unit);
			camera.Far = Math.max(camera.Far || 0, 20000 * record.Unit);

			scene.Eye = camera.Position.slice();
			scene.Target = hero.World.slice();

			/* What the shadows of a location are laid round (aimGround makes it, which a view of a ship in its air leaves out). */
			if (scene.Ground)
				scene.Ground.Target = hero.World.slice();
		}

		/*
		 * The view of who sits at a console of a ship in flight, of its frame: in its eyes over the seat, on the screen of the
		 * console when it sat down, turned by the mouse within reach (as deskView on a ground), shaken by what is felt; in a mode
		 * of the seat (SceneTactics: a turret, the radar, the schematic) the mode has the view.
		 */
		function desk (hero, record, elapsed, felt) {
			var camera = scene.Camera;
			var seat = record.Plan.Seats.filter(function (one) {
				return hero.Aboard && one.ID === hero.Aboard.Seat;
			})[0];
			var key = seat ? record.ID + ':' + seat.ID : '';
			var eye;
			var screen;
			var way;
			var turn;
			var yaw;
			var pitch;
			var roll;

			if (!seat) return;

			eye = [seat.Console[0], seat.Console[1] + 1.2, seat.Console[2] - 1.05];
			screen = [seat.Console[0], seat.Console[1] + 1.25, seat.Console[2] - 0.085];
			way = vectors.Normalize(vectors.Subtract(screen, eye));

			if (scene.DeskOf !== key) {
				scene.DeskOf = key;
				scene.DeskYaw = Math.atan2(-way[0], -way[2]);
				scene.Yaw = scene.DeskYaw;
				scene.Pitch = Math.asin(-way[1]);

				if (self.Captured() && document.exitPointerLock)
					document.exitPointerLock();
			}

			scene.Desk = 1;

			if (scene.Tactic && engine.TacticView) {
				engine.TacticView(hero, camera, elapsed);

				camera.Up = vectors.Normalize(math.Apply(record.Turn, [0, 1, 0]));

				return;
			}

			turn = Math.atan2(Math.sin(scene.Yaw - scene.DeskYaw), Math.cos(scene.Yaw - scene.DeskYaw));
			scene.Yaw = scene.DeskYaw + Math.max(-1.4, Math.min(1.4, turn));
			scene.Pitch = Math.max(-0.9, Math.min(1, scene.Pitch));
			yaw = scene.Yaw + (felt && felt.ShakeYaw || 0);
			pitch = scene.Pitch + (felt && felt.ShakePitch || 0);
			roll = felt && felt.ShakeRoll || 0;

			camera.Ortho = 0;
			camera.Position = worldOf(record, eye);
			camera.Target = worldOf(record, vectors.Add(eye, [-Math.sin(yaw) * Math.cos(pitch) * 10, -Math.sin(pitch) * 10, -Math.cos(yaw) * Math.cos(pitch) * 10]));
			camera.Up = vectors.Normalize(math.Apply(record.Turn, [Math.cos(yaw) * Math.sin(roll), Math.cos(roll), -Math.sin(yaw) * Math.sin(roll)]));
			camera.Near = Math.max(1e-12, 0.05 * record.Unit);
			camera.Far = Math.max(camera.Far || 0, 20000 * record.Unit);

			scene.Eye = camera.Position.slice();
			scene.Target = camera.Target.slice();

			if (scene.Ground)
				scene.Ground.Target = camera.Position.slice();
		}

		/*
		 * Over the surface of a body (SceneLanding draws the ship alone there, of its own frame): the hero on foot in it or at a
		 * console of it walks, sits and looks as in space; the ship flies by itself (keys of none: its plan of a landing, or on as
		 * it went), the eye of the surface where the view of the frame of the ship is. True: the hero is in it.
		 */
		engine.AfootSurface = function (surface, keys, elapsed) {
			var hero = scene.Objects[scene.Hero];
			var state = hero ? afoot[hero.ID] : null;
			var ship = scene.Objects[surface.Ship];
			var record;
			var camera = scene.Camera;
			var felt;

			/* The near pass of the ship (Scene: drawSurface) only with the eye in it. */
			surface.ShipNear = 0;

			/* Its inside goes with it over the surface too (AboardStep does not run there), while anyone is in it. */
			if (ship && flying(ship))
				carry(ship);

			if (!hero || !ship || hero === ship || !(state && state.Vehicle === ship.ID || hero.Aboard && hero.Aboard.Vehicle === ship.ID)) return false;

			engine.LandingSurfaceStep(surface, {Pad: {X: 0, Y: 0, LookX: 0, LookY: 0, Gas: 0, Brake: 0, DX: 0, DY: 0}}, elapsed);

			record = flying(ship) ? carry(ship) : null;

			if (!record)
				return true;

			felt = forces(ship, record, elapsed);
			scene.Felt = felt;

			if (state) {
				engine.TurnKeys(keys, elapsed);

				scene.Pitch = Math.max(-1.3, Math.min(1.5, scene.Pitch));

				move(hero, state, record, keys, elapsed, felt);

				stand(hero, state, record);

				view(hero, state, record, elapsed, state.Out ? null : felt);
			}
			else {
				desk(hero, record, elapsed, felt);
			}

			/* What the surface is drawn from: the view of the frame of the ship. */
			surface.Eye = camera.Position.slice();
			surface.Look = vectors.Normalize(vectors.Subtract(camera.Target, camera.Position));
			surface.ViewUp = camera.Up.slice();
			surface.Up = vectors.Normalize(surface.Eye);
			/* The world of a near plane as far as its depth holds (10 m and more, as high as it is), the ship of centimetres in a pass of its own. */
			surface.ShipNear = Math.max(1e-9, 0.05 * record.Unit);
			surface.ShipFar = Math.max(1, (record.Hull ? record.Hull.High[2] - record.Hull.Low[2] : 300) * 4 * record.Unit);
			surface.Altitude = Math.max(0.0005, vectors.Length(surface.Eye) - surface.Field.Radius - surface.Field.Elevation(surface.Up));
			surface.Near = Math.max(0.01, surface.Altitude * 0.002);

			return true;
		};

		/* What is drawn of a ship over the surface of a body with it (Scene: drawSurfaceShip): its inside and who walks in it. */
		engine.AfootSurfaceObjects = function (id) {
			var record = placed[id];
			var hero = scene.Objects[scene.Hero];

			if (!record || !record.Local) return [];

			return [scene.Objects[id + ':inside'], scene.Objects[id + ':ceiling'], hero && afoot[hero.ID] && afoot[hero.ID].Vehicle === id ? hero : null].filter(function (one) {
				return !!one;
			});
		};

		/*
		 * The step of the hero on foot in a ship in flight, or in a seat of a console of it: the ship goes on by itself, its inside
		 * with it; on foot the hero walks in it and the view is of its frame (true: the view is made). Down (the ship landed: its
		 * inside stands on a ground) it walks on as on that ground.
		 */
		engine.AfootView = function (elapsed) {
			var hero = scene.Objects[scene.Hero];
			var state = hero ? afoot[hero.ID] : null;
			var ship = hero ? scene.Objects[state ? state.Vehicle : hero.Aboard ? hero.Aboard.Vehicle : ''] : null;
			var record = ship ? placed[ship.ID] : null;
			var keys;
			var felt;

			if (!record || !record.Local) {
				if (state) {
					hero.Values.X = hero.World[0];
					hero.Values.Y = hero.World[2];
					hero.Air = hero.World[1];
					hero.Size = tallOf(hero);
					/* The view of a walker on the ground behind it, as near as it was in the ship (not the distance of the view round the ship). */
					scene.Wanted = scene.Distance = state.Far || 3.2;

					delete afoot[hero.ID];
				}

				return false;
			}

			coast(ship, elapsed);

			frame(ship, record);

			follow(record);

			felt = forces(ship, record, elapsed);
			scene.Felt = felt;

			/* At a console of it: its screen, or the mode of the seat (SceneTactics). */
			if (!state) {
				desk(hero, record, elapsed, felt);

				return true;
			}

			keys = engine.PadKeys(scene.Ground ? scene.Ground.Keys : scene.Keys);

			engine.TurnKeys(keys, elapsed);

			scene.Pitch = Math.max(-1.3, Math.min(1.5, scene.Pitch));

			move(hero, state, record, keys, elapsed, felt);

			stand(hero, state, record);

			view(hero, state, record, elapsed, state.Out ? null : felt);

			return true;
		};

		engine.AboardStep = function () {
			var hero = scene.Objects[scene.Hero];
			var inside = '';

			scene.Order.forEach(function (object) {
				var lifted = null;

				if (standing(object)) {
					place(object);

					return;
				}

				/*
				 * Up off the ground (a take-off): who walks in its rooms is on foot in it in flight, where it stands (of the frame of
				 * its inside in flight, made now: its plan there is measured from its middle, not from the ground under it).
				 */
				if (placed[object.ID] && !placed[object.ID].Local && hero && hero.World && !hero.Aboard && !hero.Values.Vehicle && engine.InsideOf([hero.World[0], hero.World[1] + 1, hero.World[2]]) === object.ID) {
					lifted = {At: localOf(placed[object.ID], hero.World), Floor: placed[object.ID].Plan.Floor};
					afoot[hero.ID] = {Vehicle: object.ID, At: [0, 0, 0], Rise: 0, Grounded: true};
				}

				if (flying(object) && carry(object)) {
					if (lifted) {
						/*
						 * As high over its floor as it stood (the two plans are measured from other places: the ground under it, its
						 * middle). Regression: carried over by the scene it stood on a console, 1.25 m up, and fell.
						 */
						afoot[hero.ID].At = onFloor(placed[object.ID], [lifted.At[0], lifted.At[1] - lifted.Floor + placed[object.ID].Plan.Floor, lifted.At[2]]);
						hero.Air = undefined;
					}

					return;
				}

				if (lifted)
					delete afoot[hero.ID];

				if (placed[object.ID] && !(placed[object.ID].Local && scene.Surface && scene.Surface.Ship === object.ID))
					forget(object.ID);
			});

			Object.keys(placed).forEach(function (id) {
				if (!scene.Objects[id])
					forget(id);
			});

			/* The elements of its consoles may come into the page later (or go): looked for again now and then. */
			looked = (looked + 1) % 30;

			if (!looked)
				Object.keys(placed).forEach(function (id) {
					screens(placed[id]);
				});

			/* The ship the hero is in: in its seat, or within its rooms (its middle). */
			if (hero && hero.Aboard) inside = hero.Aboard.Vehicle;
			else if (hero && afoot[hero.ID]) inside = afoot[hero.ID].Out ? '' : afoot[hero.ID].Vehicle;
			else if (hero && hero.World && !hero.Values.Vehicle) inside = engine.InsideOf([hero.World[0], hero.World[1] + 1, hero.World[2]]);

			scene.InsideShip = inside;

			/*
			 * Cut away (Cutaway): the hull and the ceilings of the ship the hero is in are not drawn while it is in it; nor while the
			 * hero looks at its schematic from a seat of it (SceneTactics).
			 */
			Object.keys(placed).forEach(function (id) {
				var ship = scene.Objects[id];
				var ceiling = scene.Objects[id + ':ceiling'];
				var cut = cutaway() && id === inside || !!(engine.TacticCut && engine.TacticCut(id));
				if (!ship || cut === !!ship.CutAway) return;

				ship.CutAway = cut;
				ship.Hidden = cut;

				if (ceiling)
					ceiling.Hidden = cut;
			});
		};

		function forget (id) {
			var ship = scene.Objects[id];

			delete placed[id];
			delete hulls[id];

			['inside', 'ceiling', 'ramp'].forEach(function (part) {
				if (self.Get(id + ':' + part))
					self.Remove(id + ':' + part);
			});

			unlamp(id);

			unscreen(id);

			if (ship && ship.CutAway) {
				ship.CutAway = false;
				ship.Hidden = false;
			}
		}
	},

	/* The inside of a ship standing, or in flight (Flying: in its own frame, a metre Unit units of the scene): {Plan, Inside, Ramp, At, Yaw, Flying, Unit}; null else. */
	Interior: function (id) {
		var record = this.Scene().Interiors ? this.Scene().Interiors[id] : null;

		return record ? {Plan: record.Plan, Inside: record.Inside, Ramp: record.Ramp, At: record.At.slice(), Yaw: record.Yaw, Flying: !!record.Local, Unit: record.Unit || 1} : null;
	}
});
