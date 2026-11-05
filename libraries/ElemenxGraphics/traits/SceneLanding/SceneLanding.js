/*
 * Landing: a ship comes down to a body and goes up from it by itself, as what it can do (not as a state of the scene). A ship
 * has two traits for it:
 * - Entry {Mode (landing; impact is for what falls, later), Pace (how many times faster than real the way through the air
 *   goes high up: the last kilometres are in real time, 30), Cruise (how many times its Top a ship goes on its way to the
 *   body, 40), Parking (km: the low orbit it goes up to, as a station's, 400), Exit (km over the ground where a location is
 *   left for the surface going up, 0.6)}.
 * - Flight {Airspeed (m/s, 160), Climb (m/s, 30), Hover (metres over the ground it waits at before it comes down, 40),
 *   Agility (how quickly it answers, 1)}: it flies in the air of a ground as a craft that can hang still.
 * Land(ship, {Body, Latitude, Longitude} or {Marker}) takes it down: from space it goes to where its way down begins (fast,
 * Cruise), then over the surface of the body (in kilometres, the body as large as it is) along a great circle to the point:
 * from its orbit a long arc through the air, hot, slowing (an orbital entry); from low an inclined approach, steeper near
 * the ground. Over the point the location of it (SceneLocations of the planet of the body, or one of noise for a body of no
 * planet) is made the ground of the scene, what is of space away, and the ship hangs at Hover, comes down straight and sets
 * down. TakeOff(ship) lifts it as a craft that hangs, it goes forward and up, leaves the location at Exit, and climbs over
 * the surface to its Parking orbit, where it is a ship of space again. A press of a key of flight takes it over at any time
 * in the air of a location (A and D turn it, W and S its speed, C and X up and down, Shift faster); over the surface W and S
 * make the way down faster or slower, A and D move the point aside. The view goes after it in the axes of the ship (as round
 * a ship in space), lagging and shaking in the heat. A point of the sea has its water at level 0: the ship sets down on it.
 * The sun of a location goes as its body turns; each marker of the command says whether it is day there now.
 * The scene emits landing ({ID, Phase, Body, Latitude, Longitude, Altitude (km)}) at each phase: transfer, entry, approach,
 * hover, touchdown, landed, lift, climb, ascent, orbit, manual; and location ({ID, Location, Body}) when one is made.
 * The command Landing of the scene (a button while a ship is driven near a body it can come down on) lists the markers of
 * the body (Markers of its Surface or of its Planet: [{ID, Name, Latitude, Longitude}]) and lets a point of it be picked.
 */
Elemenx.Trait('SceneLanding', {
	LandingStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var space = scene.Vehicles.ship;

		/* Where it changes from the surface to a location coming down (km over the ground). */
		var LOW = 0.6;

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function smooth (from, to, value) {
			var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

			return t * t * (3 - 2 * t);
		}

		function clamp (value, low, high) {
			return Math.max(low, Math.min(high, value));
		}

		/* An angle brought to -pi..pi. */
		function wrap (angle) {
			return Math.atan2(Math.sin(angle), Math.cos(angle));
		}

		function entryOf (hero) {
			var given = hero.Traits && hero.Traits.Entry || {};

			return {Pace: number(given.Pace, 30), Cruise: number(given.Cruise, 40), Parking: number(given.Parking, 400), Exit: number(given.Exit, 0.6)};
		}

		function flightOf (hero) {
			var given = hero.Traits && hero.Traits.Flight || {};

			return {Airspeed: number(given.Airspeed, 160), Climb: number(given.Climb, 30), Hover: number(given.Hover, 40), Agility: number(given.Agility, 1)};
		}

		/* How long a ship is, in metres (Length of its Vehicle, 40). */
		function lengthOf (hero) {
			return number(hero.Values.Vehicle && hero.Values.Vehicle.Length, 40);
		}

		function direction (latitude, longitude) {
			var lat = latitude * Math.PI / 180;
			var lon = longitude * Math.PI / 180;

			return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)];
		}

		function latLon (way) {
			return {Latitude: Math.asin(clamp(way[1], -1, 1)) * 180 / Math.PI, Longitude: Math.atan2(-way[2], way[0]) * 180 / Math.PI};
		}

		/* The axes of the ground under a direction: up, east, north (east is Y crossed with up, as SceneTerrainGenerator.Site has it). */
		function axesAt (up) {
			var east = Math.abs(up[1]) > 0.9999 ? [0, 0, -1] : vectors.Normalize([up[2], 0, -up[0]]);

			return {Up: up, East: east, North: vectors.Cross(up, east)};
		}

		/* A way in the frame of a body (its own turn taken away) and back. */
		function toBody (body, way) {
			return math.Apply(math.Invert(body.Turn || math.Identity()) || math.Identity(), way);
		}

		function toWorld (body, way) {
			return math.Apply(body.Turn || math.Identity(), way);
		}

		/* The turn of a ship of its axes, its model turned by Yaw of its Vehicle. */
		function turnOf (hero, right, up, ahead) {
			return math.Multiply([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, ahead[0], ahead[1], ahead[2], 0, 0, 0, 0, 1], math.Rotation([0, 1, 0], number(hero.Values.Vehicle.Yaw, 0) * Math.PI / 180));
		}

		/* Its axes of where it looks, the way up of its place and a bank round where it looks. */
		function axesOf (ahead, up, bank) {
			var right = vectors.Normalize(vectors.Cross(up, ahead));
			var over = vectors.Cross(ahead, right);

			return {Right: vectors.Add(vectors.Scale(right, Math.cos(bank)), vectors.Scale(over, Math.sin(bank))), Up: vectors.Add(vectors.Scale(over, Math.cos(bank)), vectors.Scale(right, -Math.sin(bank))), Ahead: ahead};
		}

		function landable (body) {
			var surface = body && body.Traits ? body.Traits.Surface : null;
			var type = surface ? surface.Type : 'rocky';

			return !!(body && body.Traits && body.Traits.Body && body.Radius && type !== 'gas' && type !== 'ice-giant');
		}

		/* The planet of a body (Surface: Planet, the options of ScenePlanet) at its radius; null for a body of no planet. */
		function planetOf (body) {
			var surface = body.Traits.Surface || {};
			var planet = surface.Planet;
			if (!planet)
				return null;

			return Object.assign({}, typeof planet === 'string' ? JSON.parse(planet) : planet, {Radius: body.Radius});
		}

		/* The places a body has for coming down: Markers of its planet, of its Surface and of its own. */
		function markersOf (body) {
			var planet = planetOf(body);
			var surface = body.Traits.Surface || {};

			return [].concat(planet && planet.Markers || [], surface.Markers || [], body.Values.Markers || []).map(function (marker, index) {
				return {ID: String(marker.ID || marker.Name || 'marker-' + index), Name: marker.Name || marker.ID || '#' + (index + 1), Latitude: number(marker.Latitude, 0), Longitude: number(marker.Longitude, 0)};
			});
		}

		/* The body a ship would come down on: the one told, the one it goes by, or the nearest it can. */
		function bodyFor (hero, told) {
			var vehicle = hero.Values.Vehicle;
			var found = scene.Objects[told || vehicle.Around || ''];
			if (landable(found)) return found;

			return scene.Order.filter(function (object) {
				return landable(object) && object.World && hero.World;
			}).sort(function (a, b) {
				return vectors.Distance(a.World, hero.World) / a.Size - vectors.Distance(b.World, hero.World) / b.Size;
			})[0] || null;
		}

		function phase (hero, name) {
			var landing = hero.Landing;
			var body = landing ? scene.Objects[landing.Body] : null;
			var place = landing && landing.Point ? latLon(landing.Point) : {Latitude: null, Longitude: null};

			if (!landing || landing.Phase === name) return;

			landing.Phase = name;

			self.$Emit('landing', {ID: hero.ID, Phase: name, Body: body ? body.ID : '', Latitude: place.Latitude, Longitude: place.Longitude, Altitude: landing.Height === undefined ? null : landing.Height});
		}

		/*
		 * The way down over a surface: how far from the point (km of ground) a ship is at a height (km): a long glide high up
		 * (a ninth of a turn of slope), steeper near the ground; and how fast it goes (km/s, real) and how many times faster
		 * than real the way goes there.
		 */
		function reach (height) {
			return height > 12 ? height * 6.25 : 75 * Math.pow(Math.max(0, height) / 12, 1.6);
		}

		function reachSlope (height) {
			return height > 12 ? 6.25 : 10 * Math.pow(Math.max(0.001, height) / 12, 0.6);
		}

		function speedAt (height) {
			return 0.1 + 7.5 * smooth(15, 75, height) + 0.5 * Math.min(1, height / 15);
		}

		function paceAt (entry, height) {
			return 1 + (entry.Pace - 1) * Math.pow(smooth(0.6, 40, height), 0.25);
		}

		/* A point of the way down: from the point back along its great circle by a distance (km). */
		function along (landing, distance, radius) {
			var angle = distance / radius;
			var side = vectors.Cross(landing.Axis, landing.Target);

			return vectors.Normalize(vectors.Add(vectors.Scale(landing.Target, Math.cos(angle)), vectors.Scale(side, Math.sin(angle))));
		}

		/* How far it is still to go at a height, as the way it was set on says (Extra: what its start had more than the glide). */
		function distanceAt (landing, height) {
			var share = landing.Top > LOW ? clamp((height - LOW) / (landing.Top - LOW), 0, 1) : 0;

			return Math.max(0, reach(height) + landing.Extra * share);
		}

		/* The way set from where a ship is (a direction of the body) to its point, at its height. */
		function aimFrom (landing, from, height, radius) {
			var axis = vectors.Cross(landing.Target, from);
			var apart = Math.acos(clamp(vectors.Dot(landing.Target, from), -1, 1));

			if (vectors.Length(axis) < 1e-9)
				axis = vectors.Cross(landing.Target, axesAt(landing.Target).North);

			landing.Axis = vectors.Normalize(axis);
			landing.Top = Math.max(height, LOW + 0.01);
			landing.Extra = apart * radius - reach(height);
		}

		/*
		 * The view after the ship over the surface: behind it and over it in the axes of the ship, as round a ship in space (the
		 * horizon leans as the ship does, the view never comes under its belly as it goes nose up through the air), the way
		 * the mouse turns it (Yaw and Pitch of the surface); it lags where the ship turns, and shakes in the heat.
		 */
		function chase (surface, landing, at, length, heat, elapsed) {
			var field = surface.Field;
			var axes = surface.ShipAxes;
			var up = axes.Up;
			var flat = axes.Ahead;
			var side = axes.Right;
			var way;
			var far = length * (3.2 + heat * 1.2);
			var time = scene.Seconds;
			var shake;
			var eye;
			var high;

			/* A drag down raises the view, as it does round a ship in space and over a ground (Pitch of the surface goes the other way). */
			var pitch = clamp(0.44 - surface.Pitch, -1.2, 1.45);

			way = vectors.Normalize(vectors.Add(vectors.Add(vectors.Scale(flat, -Math.cos(pitch) * Math.cos(surface.Yaw)), vectors.Scale(side, Math.cos(pitch) * Math.sin(surface.Yaw))), vectors.Scale(up, Math.sin(pitch))));

			landing.Cam = landing.Cam ? vectors.Normalize(vectors.Lerp(landing.Cam, way, 1 - Math.exp(-elapsed * 2.5))) : way;
			landing.Far = landing.Far ? landing.Far + (far - landing.Far) * (1 - Math.exp(-elapsed * 2)) : far;

			shake = vectors.Scale(vectors.Add(vectors.Scale(side, Math.sin(time * 47) + Math.sin(time * 23) * 0.5), vectors.Scale(up, Math.sin(time * 41 + 1) + Math.sin(time * 19) * 0.5)), length * 0.04 * heat);
			eye = vectors.Add(vectors.Add(at, vectors.Scale(landing.Cam, landing.Far)), shake);

			/* Never under the ground. */
			high = vectors.Length(eye) - field.Radius - field.Elevation(vectors.Normalize(eye));

			if (high < length * 0.3)
				eye = vectors.Scale(vectors.Normalize(eye), vectors.Length(eye) + length * 0.3 - high);

			surface.Eye = eye;
			surface.Up = vectors.Normalize(eye);
			surface.Altitude = Math.max(0.0005, vectors.Length(eye) - field.Radius - field.Elevation(surface.Up));
			surface.Look = vectors.Normalize(vectors.Subtract(vectors.Add(at, vectors.Scale(up, length * 0.25)), eye));
			surface.Axes = axesAt(surface.Up);
			landing.ViewUp = landing.ViewUp ? vectors.Normalize(vectors.Lerp(landing.ViewUp, up, 1 - Math.exp(-elapsed * 2.5))) : up;
			surface.ViewUp = landing.ViewUp;
			surface.Near = Math.max(0.00005, landing.Far * 0.04);

			if (landing.Fov === undefined)
				landing.Fov = scene.Camera.Fov;

			scene.Camera.Fov = landing.Fov * (1 + heat * 0.12);
		}

		/* The ship drawn where it is over the surface, turned the way it flies, its nose up as it goes through the air high up. */
		function show (hero, surface, at, motion, raise, bank) {
			var up = vectors.Normalize(at);
			var ahead = vectors.Normalize(vectors.Add(vectors.Scale(motion, Math.cos(raise)), vectors.Scale(up, Math.sin(raise))));
			var axes = axesOf(ahead, up, bank);

			surface.ShipAt = at;
			surface.ShipSize = lengthOf(hero) / 1000;
			surface.ShipTurn = turnOf(hero, axes.Right, axes.Up, axes.Ahead);
			surface.ShipAxes = axes;
		}

		/* What the keys do over the surface: W and S make the way faster or slower, A and D move the point aside. */
		function steer (landing, keys, elapsed) {
			var pad = keys.Pad || {X: 0, Gas: 0, Brake: 0};
			var faster = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) + pad.Gas - pad.Brake;
			var aside = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + pad.X;

			landing.Rate = clamp(landing.Rate * (1 + faster * elapsed), 0.25, 4);
			landing.Steer += (clamp(aside, -1, 1) - landing.Steer) * Math.min(1, elapsed * 2);
		}

		/* A step of the way down over the surface, in kilometres. */
		function entryStep (hero, surface, keys, elapsed) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var entry = entryOf(hero);
			var field = surface.Field;
			var radius = field.Radius;
			var height = landing.Height;
			var real = speedAt(height);
			var pace = paceAt(entry, height) * landing.Rate;
			var slope = reachSlope(height) + (landing.Top > LOW ? landing.Extra / (landing.Top - LOW) : 0);
			var going = real * pace * elapsed;
			var point;
			var at;
			var motion;
			var heat;
			var air = body && body.Look ? body.Look.Atmosphere[3] : 0;

			steer(landing, keys, elapsed);

			/* Aside: the point moves across the way, and the way is set again from where the ship is. */
			if (Math.abs(landing.Steer) > 0.02 && landing.Point) {
				var across = vectors.Normalize(vectors.Cross(landing.Motion || axesAt(landing.Point).North, landing.Point));

				landing.Target = vectors.Normalize(vectors.Add(landing.Target, vectors.Scale(across, -landing.Steer * elapsed * 0.15 * Math.max(1, landing.Distance) / radius)));

				aimFrom(landing, landing.Point, height, radius);

				landing.Top = Math.max(landing.Top, height);
			}

			height = Math.max(LOW, height - going / Math.sqrt(1 + slope * slope));
			landing.Height = height;
			landing.Distance = distanceAt(landing, height);
			landing.Speed = real * pace;
			landing.Real = real;

			point = along(landing, landing.Distance, radius);
			at = vectors.Scale(point, radius + field.Elevation(point) + height);
			motion = landing.At && vectors.Distance(at, landing.At) > 1e-9 ? vectors.Normalize(vectors.Subtract(at, landing.At)) : landing.Motion || axesAt(point).North;

			landing.Motion = vectors.Normalize(vectors.Lerp(landing.Motion || motion, motion, Math.min(1, elapsed * 4)));
			landing.Point = point;
			landing.At = at;

			heat = air * 0.6 * smooth(1.5, 6, real) * Math.exp(-Math.pow((height - 65) / 28, 2));
			surface.Heat = heat;

			show(hero, surface, at, landing.Motion, 0.7 * smooth(25, 55, height), -landing.Steer * 0.5);

			chase(surface, landing, at, lengthOf(hero) / 1000, heat, elapsed);

			phase(hero, height > 12 ? 'entry' : 'approach');

			if (height <= LOW + 1e-6)
				enterLocation(hero);
		}

		/* A step of the way up over the surface to the parking orbit: the nose comes down from steep to level as it climbs. */
		function ascentStep (hero, surface, keys, elapsed) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var entry = entryOf(hero);
			var field = surface.Field;
			var radius = field.Radius;
			var height = landing.Height;
			var real = 0.15 + 7.5 * smooth(3, 200, height);
			var pace = paceAt(entry, height) * landing.Rate;
			var climb = 0.05 + 1.1 * (1 - smooth(0, entry.Parking * 0.8, height));
			var going = real * pace * elapsed;
			var angle = going * Math.cos(climb) / radius;
			var point = landing.Point;
			var track = landing.Track;
			var at;
			var motion;
			var air = body && body.Look ? body.Look.Atmosphere[3] : 0;

			steer(landing, keys, elapsed);

			landing.Point = point = vectors.Normalize(vectors.Add(vectors.Scale(point, Math.cos(angle)), vectors.Scale(track, Math.sin(angle))));
			track = vectors.Subtract(track, vectors.Scale(point, vectors.Dot(track, point)));
			landing.Track = track = vectors.Normalize(vectors.Add(track, vectors.Scale(vectors.Cross(point, track), -landing.Steer * elapsed * 0.3)));
			landing.Height = height = height + going * Math.sin(climb);
			landing.Speed = real * pace;
			landing.Real = real;

			at = vectors.Scale(point, radius + field.Elevation(point) + height);
			motion = vectors.Normalize(vectors.Add(vectors.Scale(track, Math.cos(climb)), vectors.Scale(point, Math.sin(climb))));
			landing.Motion = motion;
			landing.At = at;

			surface.Heat = air * 0.15 * smooth(1, 4, real) * Math.exp(-Math.pow((height - 60) / 30, 2));

			show(hero, surface, at, motion, 0, -landing.Steer * 0.4);

			chase(surface, landing, at, lengthOf(hero) / 1000, surface.Heat, elapsed);

			if (height >= entry.Parking)
				toSpace(hero);
		}

		/*
		 * The frame of a location: its tangent plane at the middle of its cell, turned by its Turn (X east, Z south before the
		 * turn), as SceneTerrainGenerator.Site has it: a direction of the body to metres of it and back, and its axes.
		 */
		function siteFrame (place, radius) {
			var middle = direction(number(place.Latitude, 0), number(place.Longitude, 0));
			var axes = axesAt(middle);
			var turn = number(place.Turn, 0) * Math.PI / 180;
			var c = Math.cos(turn);
			var s = Math.sin(turn);

			function plane (u, v) {
				return [u * c + v * s, u * s - v * c];
			}

			return {
				Middle: middle,
				/* The axes of the location in the frame of the body: +X and -Z (its north). */
				X: vectors.Add(vectors.Scale(axes.East, c), vectors.Scale(axes.North, s)),
				North: vectors.Add(vectors.Scale(axes.East, -s), vectors.Scale(axes.North, c)),
				Local: function (way) {
					var point = vectors.Scale(way, radius / Math.max(1e-9, vectors.Dot(way, middle)));

					return plane(vectors.Dot(point, axes.East), vectors.Dot(point, axes.North));
				},
				Way: function (way) {
					return plane(vectors.Dot(way, axes.East), vectors.Dot(way, axes.North));
				},
				Direction: function (x, z) {
					var u = x * c + z * s;
					var v = -z * c + x * s;

					return vectors.Normalize(vectors.Add(vectors.Scale(middle, radius), vectors.Add(vectors.Scale(axes.East, u), vectors.Scale(axes.North, v))));
				}
			};
		}

		/* Where the star of a body stands over a location (degrees), as the body turns now. */
		function sunOver (body, frame) {
			var star = scene.Order.filter(function (object) {
				return object.Traits && object.Traits.Star && object.World;
			})[0];
			var way = star ? vectors.Normalize(toBody(body, vectors.Normalize(vectors.Subtract(star.World, body.World)))) : [0, 1, 0];

			return {Elevation: Math.asin(clamp(vectors.Dot(way, frame.Middle), -1, 1)) * 180 / Math.PI, Azimuth: (Math.atan2(vectors.Dot(way, frame.X), vectors.Dot(way, frame.North)) * 180 / Math.PI + 360) % 360};
		}

		/* The sun of a location goes on as its body turns (a few times a second). */
		function sunStep () {
			var located = scene.Location;
			var light = located ? scene.Objects[located.Sun] : null;
			var body = located ? scene.Objects[located.Body] : null;
			var sun;

			if (!light || !body || !body.Turn || scene.Seconds - (located.Lit || 0) < 0.25) return;

			located.Lit = scene.Seconds;
			sun = sunOver(body, located.Frame);
			light.Traits.Sun.Elevation = sun.Elevation;
			light.Traits.Sun.Azimuth = sun.Azimuth;
		}

		/*
		 * Over the point, low: the location there becomes the ground of the scene (its World and a sun where the star stands
		 * over it), what is of space goes away, and the ship flies on in it in metres, to hang over the point and set down.
		 */
		function enterLocation (hero) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var planet = planetOf(body);
			var target = latLon(landing.Target);
			var locations = self.$Service('SceneLocations');
			var location = null;
			var place;
			var world;
			var id;
			var frame;
			var at;
			var to;
			var way;
			var ground = hero.ID + '-location';
			var light = hero.ID + '-sun';
			var length = lengthOf(hero);
			var sun;

			if (planet) {
				id = locations.At(planet, target.Latitude, target.Longitude);
				location = locations.Location(planet, id);
				place = location.Place;
				world = location.World;
			}
			else {
				id = body.ID + ':' + target.Latitude.toFixed(4) + ':' + target.Longitude.toFixed(4);
				place = {Latitude: target.Latitude, Longitude: target.Longitude, Turn: 0, Size: 4000};
				world = self.$Service('SceneWorld').Library({Size: 4000, Height: 60, Water: 0, Seed: body.ID + ':' + id});
			}

			frame = siteFrame(place, body.Radius * 1000);
			at = frame.Local(landing.Point);
			to = frame.Local(landing.Target);
			way = frame.Way(landing.Motion);
			sun = sunOver(body, frame);

			scene.Location = {ID: id, Body: body.ID, Place: place, Frame: frame, Ground: ground, Sun: light, Hero: hero.ID};
			landing.Speed = Math.min(flightOf(hero).Airspeed, landing.Speed * 1000);

			engine.SurfaceClose();
			engine.LabelsHidden(true);

			if (landing.Fov !== undefined)
				scene.Camera.Fov = landing.Fov;

			landing.SpaceSize = hero.Size;
			hero.Located = length;
			hero.Size = length;

			self.Add('ground', {ID: ground, World: world, Generated: true});
			self.Add('sun', {ID: light, Elevation: sun.Elevation, Azimuth: sun.Azimuth, Generated: true});

			hero.Size = length;
			hero.Flying = {At: [at[0], null, at[1]], Over: LOW * 1000, Way: [0, 0, 0], Speed: landing.Speed, Heading: Math.atan2(-way[0], -way[1]), Landed: false, Throttle: 0.5, Pitch: 0, Roll: 0, Plan: {Kind: 'land', To: to}};

			/* The view of the ground goes on from where it stood over the surface. */
			if (landing.Cam) {
				var seen = frame.Way(landing.Cam);

				scene.Yaw = Math.atan2(seen[0], seen[1]);
				scene.Pitch = clamp(Math.asin(clamp(vectors.Dot(landing.Cam, frame.Middle), -1, 1)), 0, 0.6);
			}
			else {
				scene.Yaw = hero.Flying.Heading;
				scene.Pitch = 0.3;
			}

			scene.Wanted = scene.Distance = length * 3.2;

			self.$Emit('location', {ID: id, Location: location, Body: body.ID});

			phase(hero, 'hover');
		}

		/* High enough over a location going up: back over the surface, the location let go, on its way to the parking orbit. */
		function leaveLocation (hero) {
			var landing = hero.Landing;
			var located = scene.Location;
			var body = scene.Objects[located.Body];
			var air = hero.Flying;
			var field = scene.Ground.Field;
			var frame = located.Frame;
			var point = frame.Direction(air.At[0], air.At[2]);
			var ahead = [-Math.sin(air.Heading), -Math.cos(air.Heading)];
			var track = vectors.Add(vectors.Scale(frame.X, ahead[0]), vectors.Scale(frame.North, -ahead[1]));

			track = vectors.Normalize(vectors.Subtract(track, vectors.Scale(point, vectors.Dot(track, point))));

			scene.Location = null;
			hero.Located = 0;

			self.Remove(located.Ground);
			self.Remove(located.Sun);

			hero.Size = landing.SpaceSize || hero.Size;
			delete hero.Flying;

			landing.Point = point;
			landing.Track = track;
			landing.Height = Math.max(0.05, (air.At[1] - field.Height(air.At[0], air.At[2])) / 1000);
			landing.Cam = vectors.Normalize(vectors.Subtract(scene.Camera.Position, hero.World || air.At));
			landing.Cam = vectors.Normalize(vectors.Add(vectors.Add(vectors.Scale(frame.X, landing.Cam[0]), vectors.Scale(frame.North, -landing.Cam[2])), vectors.Scale(frame.Middle, landing.Cam[1])));
			landing.Far = 0;
			landing.ViewUp = null;

			engine.Land(body.ID, {Ship: hero.ID, Up: point, Altitude: landing.Height});

			phase(hero, 'ascent');
		}

		/* At the parking orbit: a ship of space again, round the body, turned along its way. */
		function toSpace (hero) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var vehicle = hero.Values.Vehicle;
			var up = vectors.Normalize(toWorld(body, landing.Point));
			var ahead = vectors.Normalize(toWorld(body, landing.Track));
			var right = vectors.Normalize(vectors.Cross(up, ahead));
			var high = body.Size * (body.Radius + landing.Height) / body.Radius;

			engine.SurfaceClose();
			engine.LabelsHidden(false);

			if (landing.Fov !== undefined)
				scene.Camera.Fov = landing.Fov;

			vehicle.Around = body.ID;
			hero.Ship = {At: vectors.Scale(up, high), Right: right, Up: vectors.Cross(ahead, right), Ahead: ahead, Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0};
			hero.Clock = {};
			hero.Last = null;
			scene.ShipAxes = null;
			scene.Yaw = 0;
			scene.Pitch = 0.16;

			/* The view of space as it was before the ship went down. */
			if (landing.View) {
				scene.Wanted = landing.View.Wanted;
				scene.Distance = landing.View.Distance;
			}

			phase(hero, 'orbit');

			hero.Landing = null;
		}

		/* From space to where the way down begins, high over the body: fast, along a curve that keeps out of it. */
		function transferStep (hero, elapsed) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var entry = entryOf(hero);
			var vehicle = hero.Values.Vehicle;
			var high;
			var goal;
			var track;
			var t;
			var e;
			var apart;
			var at;
			var next;
			var ahead;
			var axes;

			if (!body || !body.World) {
				hero.Landing = null;

				return;
			}

			high = body.Size * (body.Radius + entry.Parking) / body.Radius;
			goal = vectors.Scale(vectors.Normalize(toWorld(body, landing.Start)), high);
			track = vectors.Normalize(toWorld(body, vectors.Scale(vectors.Cross(landing.Axis, landing.Start), -1)));

			if (!landing.From) {
				landing.From = vectors.Subtract(hero.World || body.World, body.World);
				landing.FromAhead = hero.Seen ? hero.Seen.Ahead : track;
				landing.Time = 0;
				landing.Length = clamp(vectors.Distance(landing.From, goal) / Math.max(1e-9, number(vehicle.Top, 1) * entry.Cruise), 5, 14);
			}

			apart = vectors.Distance(landing.From, goal);

			function point (part) {
				var h00 = 2 * part * part * part - 3 * part * part + 1;
				var h10 = part * part * part - 2 * part * part + part;
				var h01 = -2 * part * part * part + 3 * part * part;
				var h11 = part * part * part - part * part;
				var made = vectors.Add(vectors.Add(vectors.Scale(landing.From, h00), vectors.Scale(landing.FromAhead, h10 * apart * 0.6)), vectors.Add(vectors.Scale(goal, h01), vectors.Scale(track, h11 * apart * 0.6)));

				/* Never into the body, nor under the orbit it ends at once near it. */
				return vectors.Length(made) < high ? vectors.Scale(vectors.Normalize(made), high) : made;
			}

			landing.Time += elapsed;
			t = Math.min(1, landing.Time / landing.Length);
			e = t * t * (3 - 2 * t);
			at = point(e);
			next = point(Math.min(1, e + 0.01));
			ahead = vectors.Distance(next, at) > 1e-12 ? vectors.Normalize(vectors.Subtract(next, at)) : track;
			axes = axesOf(ahead, vectors.Normalize(at), 0);

			vehicle.Around = body.ID;

			if (hero.Ship) {
				hero.Ship.At = at;
				hero.Ship.Ahead = axes.Ahead;
				hero.Ship.Right = axes.Right;
				hero.Ship.Up = axes.Up;
				hero.Ship.Way = [0, 0, 0];
			}

			hero.Thrust = 1 + 1.5 * Math.sin(Math.PI * t);

			engine.PlaceShip(hero, vehicle, vectors.Add(body.World, at), axes.Right, axes.Up, axes.Ahead);

			if (t < 1) return;

			/* Over the surface now: the way down begins high, at the parking orbit. */
			landing.Height = entry.Parking;
			landing.Point = landing.Start;
			landing.At = null;

			aimFrom(landing, landing.Start, entry.Parking, body.Radius);

			landing.Motion = vectors.Normalize(vectors.Scale(vectors.Cross(landing.Axis, landing.Start), -1));

			/* The view goes on from where it stood in space, and eases behind the ship from there. */
			if (hero.World && vectors.Distance(scene.Camera.Position, hero.World) > 0)
				landing.Cam = vectors.Normalize(toBody(body, vectors.Normalize(vectors.Subtract(scene.Camera.Position, hero.World))));

			landing.ViewUp = vectors.Normalize(toBody(body, scene.Camera.Up));

			engine.Land(body.ID, {Ship: hero.ID, Up: landing.Start, Altitude: entry.Parking});

			phase(hero, 'entry');
		}

		/*
		 * A ship in the air of a ground (Flight): it hangs still, turns, goes forward and climbs as its keys say, or as its
		 * plan: land (at To, [x, z]: over it, then down to set on the ground) or lift (up, forward and away). Its tilt shows how
		 * it speeds up, and it banks as it turns.
		 */
		function flight (hero, keys, elapsed) {
			var field = scene.Ground.Field;
			var vehicle = hero.Values.Vehicle;
			var settings = flightOf(hero);
			var entry = entryOf(hero);
			var length = lengthOf(hero);
			var gear = length * 0.15;
			var pad = keys.Pad || {X: 0, Y: 0, LookY: 0, Gas: 0, Brake: 0};
			var forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + pad.Gas - pad.Brake;
			var turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - pad.X;
			var lift = (keys.KeyC ? 1 : 0) - (keys.KeyX ? 1 : 0) + pad.LookY;
			var boost = keys.ShiftLeft || keys.ShiftRight;
			var air = hero.Flying;
			var top = settings.Airspeed * (boost ? 1.6 : 1);
			var wanted = [0, 0, 0];
			var yawRate = 0;
			var floor;
			var over;
			var plan;
			var heading;
			var dir;
			var flat;
			var speedUp;
			var axes;
			var pitch;

			/* Over a sea its floor is the water: it hangs over it and sets down on it, not on the bed. */
			function floorAt (x, z) {
				return (field.Water ? Math.max(0, field.Height(x, z)) : field.Height(x, z)) + gear;
			}

			if (!air) {
				var start = hero.World && !hero.Values.Vehicle.Around ? hero.World : [number(hero.Values.X, 0), null, number(hero.Values.Y, 0)];

				air = hero.Flying = {At: [start[0], start[1], start[2]], Over: 0, Way: [0, 0, 0], Heading: number(vehicle.Heading, 0) * Math.PI / 180, Landed: true, Throttle: 0, Pitch: 0, Roll: 0, Plan: null};
			}

			/* Come into a location: over its ground as high as it was over the surface, the view on it at once. */
			if (air.At[1] === null) {
				air.At[1] = floorAt(air.At[0], air.At[2]) + air.Over;
				scene.Ground.Target = air.At.slice();
			}

			/* A key of flight takes it over from its plan. */
			if (air.Plan && (Math.abs(forward) > 0.1 || Math.abs(turn) > 0.1 || Math.abs(lift) > 0.1)) {
				air.Plan = null;
				air.Throttle = Math.min(1, Math.hypot(air.Way[0], air.Way[2]) / settings.Airspeed);

				phase(hero, 'manual');
			}

			floor = floorAt(air.At[0], air.At[2]);
			over = air.At[1] - floor;
			plan = air.Plan;
			heading = air.Heading;
			dir = [-Math.sin(heading), 0, -Math.cos(heading)];

			if (plan && plan.Kind === 'land') {
				var dx = plan.To[0] - air.At[0];
				var dz = plan.To[1] - air.At[2];
				var apart = Math.hypot(dx, dz);
				var speed = Math.min(top, Math.sqrt(2 * 3.5 * Math.max(0, apart - 0.5)), apart * 0.9);
				var flying = Math.hypot(air.Way[0], air.Way[2]);

				if (apart > 0.3)
					wanted = [dx / apart * speed, 0, dz / apart * speed];

				if (apart > 25)
					yawRate = clamp(wrap(Math.atan2(-dx, -dz) - heading) * 1.2, -0.8, 0.8);

				/* Over the point and slow: straight down, slower near the ground; else at Hover, or lower as it comes. */
				if (apart < 3 && flying < 1.5) {
					wanted[1] = -clamp(over * 0.3, 0.6, 6);

					phase(hero, 'touchdown');
				}
				else {
					wanted[1] = clamp((floor + Math.max(settings.Hover, Math.min(over, apart * 0.6)) - air.At[1]) * 0.5, -settings.Climb, settings.Climb);
				}
			}
			else if (plan && plan.Kind === 'lift') {
				if (over < settings.Hover * 1.5 && !plan.Forward) {
					wanted[1] = Math.min(8, 2 + over * 0.3);
				}
				else {
					plan.Forward = true;
					wanted = vectors.Scale(dir, top * smooth(0, 1, (over - settings.Hover) / (settings.Hover * 4)));
					wanted[1] = Math.max(settings.Climb, Math.hypot(air.Way[0], air.Way[2]) * 0.45);

					phase(hero, 'climb');
				}

				if (scene.Location && over > entry.Exit * 1000) {
					leaveLocation(hero);

					return;
				}
			}
			else {
				air.Throttle = clamp(air.Throttle + forward * elapsed * 0.6, -0.3, 1);

				if (keys.Space)
					air.Throttle *= 1 - Math.min(1, elapsed * 2);

				wanted = vectors.Scale(dir, air.Throttle * top);
				wanted[1] = lift * settings.Climb;
				yawRate = turn * 0.9 * settings.Agility * (1 - 0.5 * Math.min(1, Math.hypot(air.Way[0], air.Way[2]) / settings.Airspeed));
			}

			air.Heading = heading = heading + yawRate * elapsed;
			dir = [-Math.sin(heading), 0, -Math.cos(heading)];

			var before = air.Way.slice();
			var rate = Math.min(1, elapsed * 0.9 * settings.Agility);

			air.Way = [air.Way[0] + (wanted[0] - air.Way[0]) * rate, air.Way[1] + (wanted[1] - air.Way[1]) * Math.min(1, elapsed * 1.8 * settings.Agility), air.Way[2] + (wanted[2] - air.Way[2]) * rate];
			speedUp = elapsed > 0 ? vectors.Dot(vectors.Subtract(air.Way, before), dir) / elapsed : 0;

			if (!air.Landed)
				air.At = vectors.Add(air.At, vectors.Scale(air.Way, elapsed));

			floor = floorAt(air.At[0], air.At[2]);
			flat = Math.hypot(air.Way[0], air.Way[2]);

			/* On the ground: it stands there until it is told up. */
			if (air.At[1] <= floor) {
				air.At[1] = floor;

				if (air.Way[1] < 0)
					air.Way[1] = 0;

				if (flat < 4 && wanted[1] <= 0 && !air.Landed) {
					air.Landed = true;
					air.Way = [0, 0, 0];
					air.Plan = null;
					air.Throttle = 0;

					phase(hero, 'landed');
				}
			}

			if (air.Landed && wanted[1] > 0.1)
				air.Landed = false;

			if (air.Landed)
				air.At[1] = floor;

			/* Its tilt: nose down as it speeds up, along its way when fast; banked as it turns. */
			pitch = clamp(-speedUp / 9.8 * 0.8, -0.35, 0.35) + Math.atan2(air.Way[1], Math.max(1, flat)) * smooth(30, 120, flat);
			air.Pitch += (pitch - air.Pitch) * Math.min(1, elapsed * 3);
			air.Roll += (clamp(yawRate * Math.min(1, flat / 40) * 0.9, -0.6, 0.6) - air.Roll) * Math.min(1, elapsed * 3);

			axes = axesOf(vectors.Normalize([dir[0] * Math.cos(air.Pitch), Math.sin(air.Pitch), dir[2] * Math.cos(air.Pitch)]), [0, 1, 0], air.Roll);

			engine.PlaceShip(hero, vehicle, air.At.slice(), axes.Right, axes.Up, axes.Ahead);

			hero.Thrust = air.Landed ? 0 : 0.35 + Math.min(1.6, vectors.Length(vectors.Subtract(wanted, air.Way)) / 10 + flat / top);

			/* The view goes round behind it as it goes, and on its plan comes down to a little over it. */
			if (!scene.Drag && flat > 3)
				scene.Yaw += wrap(heading - scene.Yaw) * Math.min(1, elapsed * 1.5);

			if (!scene.Drag && air.Plan)
				scene.Pitch += (0.3 - scene.Pitch) * Math.min(1, elapsed * 0.6);

			scene.Wanted = length * (2.8 + flat / settings.Airspeed * 1.5);
		}

		/* What the command of the scene offers now: land (a ship near a body it can come down on), takeoff (down in a location), or nothing. */
		function offer () {
			var hero = scene.Hero ? scene.Objects[scene.Hero] : null;
			var can = '';
			var body;

			if (hero && hero.Values.Vehicle && hero.Values.Vehicle.Kind === 'ship' && hero.Traits.Entry) {
				if (scene.Location && hero.Flying && hero.Flying.Landed) {
					can = 'takeoff';
				}
				else if (!hero.Landing && !scene.Location && !scene.Surface && !scene.Ground) {
					body = bodyFor(hero, '');
					can = body && hero.World && vectors.Distance(body.World, hero.World) < body.Size * 30 ? 'land' : '';
				}
			}

			if (self.ShipCan !== can) {
				self.ShipCan = can;

				if (can !== 'land') {
					self.LandingOpen = false;
					scene.Picking = '';
				}
			}
		}

		scene.Vehicles.ship = function (hero, keys, elapsed) {
			sunStep();

			if (scene.Ground) flight(hero, keys, elapsed);
			else if (hero.Landing && hero.Landing.Phase === 'transfer' && hero.Ship) transferStep(hero, elapsed);
			else space(hero, keys, elapsed);

			offer();
		};

		/* A step over the surface the ship flies over (Scene: surfaceStep). */
		engine.LandingSurfaceStep = function (surface, keys, elapsed) {
			var hero = scene.Objects[surface.Ship];

			if (!hero || !hero.Landing) {
				engine.SurfaceClose();

				return;
			}

			if (hero.Landing.Phase === 'ascent') ascentStep(hero, surface, keys, elapsed);
			else entryStep(hero, surface, keys, elapsed);

			offer();
		};

		engine.LandShip = function (hero, options) {
			var body;
			var marker;
			var latitude = options.Latitude;
			var longitude = options.Longitude;
			var under;
			var target;
			var landing;
			var start;
			var arc;
			var apart;
			var axis;

			/* In a location: a point of it (X and Y in metres, or a latitude and a longitude in it) to come down at. */
			if (scene.Location && scene.Location.Hero === hero.ID && hero.Flying) {
				var to = options.X !== undefined ? [number(options.X, 0), number(options.Y, 0)] : latitude !== undefined ? scene.Location.Frame.Local(direction(number(latitude, 0), number(longitude, 0))) : [hero.Flying.At[0], hero.Flying.At[2]];

				hero.Landing = hero.Landing || {Body: scene.Location.Body, Rate: 1, Steer: 0};
				hero.Flying.Plan = {Kind: 'land', To: to};
				hero.Flying.Landed = false;

				phase(hero, 'hover');

				return true;
			}

			if (hero.Landing || scene.Surface || scene.Ground || !engine.Renderer) return false;

			body = bodyFor(hero, options.Body);

			if (!body || !landable(body)) return false;

			if (options.Marker !== undefined) {
				marker = markersOf(body).filter(function (each) {
					return each.ID === String(options.Marker) || each.Name === options.Marker;
				})[0];

				if (!marker)
					return false;

				latitude = marker.Latitude;
				longitude = marker.Longitude;
			}

			if (scene.Hero !== hero.ID)
				engine.Control(hero.ID);

			under = vectors.Normalize(toBody(body, vectors.Normalize(vectors.Subtract(hero.World || vectors.Add(body.World, [0, 0, body.Size * 2]), body.World))));
			target = latitude !== undefined && latitude !== null ? direction(number(latitude, 0), number(longitude, 0)) : under;

			/* Where the way down begins: the long arc of an entry back from the point, toward where the ship is now. */
			arc = reach(entryOf(hero).Parking) / body.Radius;
			apart = Math.acos(clamp(vectors.Dot(target, under), -1, 1));
			axis = vectors.Cross(target, under);

			if (vectors.Length(axis) < 1e-6)
				axis = vectors.Cross(target, axesAt(target).North);

			axis = vectors.Normalize(axis);
			start = apart > arc * 0.6 && apart < arc * 1.6 ? under : vectors.Normalize(vectors.Add(vectors.Scale(target, Math.cos(arc)), vectors.Scale(vectors.Cross(axis, target), Math.sin(arc))));

			landing = hero.Landing = {Phase: '', Body: body.ID, Target: target, Start: start, Axis: axis, Rate: 1, Steer: 0, Point: start, Height: entryOf(hero).Parking, View: {Wanted: scene.Wanted, Distance: scene.Distance}};

			self.LandingOpen = false;
			scene.Picking = '';

			phase(hero, 'transfer');

			return !!landing;
		};

		engine.ShipTakeOff = function (hero) {
			if (!hero.Flying || !scene.Ground || hero.Flying.Plan && hero.Flying.Plan.Kind === 'lift') return false;

			hero.Landing = hero.Landing || {Body: scene.Location ? scene.Location.Body : '', Rate: 1, Steer: 0};
			hero.Landing.View = hero.Landing.View || {Wanted: scene.ShipFar || scene.Wanted, Distance: scene.ShipFar || scene.Wanted};
			hero.Flying.Plan = {Kind: 'lift', Forward: false};
			hero.Flying.Landed = false;

			phase(hero, 'lift');

			return true;
		};

		/* A point of the canvas picked: where the ray meets the body, a latitude and a longitude of it to come down at. */
		engine.LandingPick = function (x, y) {
			var hero = scene.Objects[scene.Hero];
			var body = hero ? bodyFor(hero, '') : null;
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var t = body ? math.Hit(ray, body.World, body.Size) : -1;
			var place;

			scene.Picking = '';
			self.LandingOpen = false;

			if (!body || t < 0) return false;

			place = latLon(vectors.Normalize(toBody(body, vectors.Normalize(vectors.Subtract(vectors.Add(ray.Origin, vectors.Scale(ray.Direction, t)), body.World)))));

			return engine.LandShip(hero, {Body: body.ID, Latitude: place.Latitude, Longitude: place.Longitude});
		};

		engine.LandingMarkers = function () {
			var hero = scene.Objects[scene.Hero];
			var body = hero ? bodyFor(hero, '') : null;

			var radius = body ? body.Radius * 1000 : 1;

			/* Each with whether it is day there now. */
			return body ? markersOf(body).map(function (marker) {
				return Object.assign(marker, {Day: sunOver(body, siteFrame({Latitude: marker.Latitude, Longitude: marker.Longitude, Turn: 0}, radius)).Elevation > 0});
			}) : [];
		};
	},

	/* The command Landing: the list of the markers of the body, and picking a point of it. */
	LandingOpened: function () {
		this.LandingMarkers = this.Engine().LandingMarkers();
		this.LandingOpen = !this.LandingOpen;
		this.Scene().Picking = '';
	},

	MarkerPicked: function (id) {
		var scene = this.Scene();

		this.LandingOpen = false;

		if (scene.Hero)
			this.Land(scene.Hero, {Marker: id});
	},

	/* The next click on the body is the point to come down at. */
	PointPicking: function () {
		this.LandingOpen = false;
		this.Scene().Picking = 'landing';
	},

	ShipTakeOff: function () {
		var scene = this.Scene();
		if (scene.Hero)
			this.TakeOff(scene.Hero);
	}
});
