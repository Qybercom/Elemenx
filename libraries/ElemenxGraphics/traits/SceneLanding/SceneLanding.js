/*
 * Landing: a ship comes down to a body and goes up from it by itself, as what it can do (not as a state of the scene). A ship
 * has two traits for it:
 * - Entry {Mode (landing; impact is for what falls, later), Pace (how many times faster than real the way through the air
 *   goes high up: the last kilometres are in real time, 30), Cruise (how many times its Top a ship goes on its way to the
 *   body, 40), Parking (km: the low orbit it goes up to, as a station's, 400), Exit (km over the ground where a location is
 *   left for the surface going up, 0.6)}.
 * - Flight {Airspeed (m/s, 160), Climb (m/s, 30), Hover (metres over the ground it waits at before it comes down, 40),
 *   Agility (how quickly it answers, 1)}: it flies in the air of a ground as a craft that can hang still.
 * Land(ship, {Body, Latitude, Longitude} or {Marker}) takes it down: from space along one curve from where it is, as fast as
 * it goes, to the top of the air (120 km; 40 with no air) as far from the point as its glide reaches, as fast as the glide
 * goes on; then in the air over the surface of the body (in kilometres, the body as large as it is), the same ship going on:
 * a long glide high up (hot, slowing at most 0.12 km/s a second), steeper near the ground, heading for the point; never a
 * stop, never a step. Flown by hand down to the top of the air, it comes into it the same way, the player flying on (W and S
 * its throttle, R and F its nose, A and D turn it); the command Landing then takes it down from there, and a key of flight
 * takes it over from its plan at any time. Low over the point the location of it (SceneLocations of the planet of the body,
 * or one of noise for a body of no planet) is made the ground of the scene, what is of space away, and the ship goes on into
 * it as fast as it came, hangs at Hover, comes down straight and sets down. TakeOff(ship) lifts it as a craft that hangs, it
 * goes forward and up, leaves the location at Exit (flown up by hand too), and climbs through the air to its Parking orbit,
 * where it is a ship of space again, as fast as it went. In the air of a location A and D turn it, W and S its speed, C and
 * X up and down, Shift faster. The view is the one round a ship in space all the way (the mouse turns it, the wheel brings it
 * near), shaking in the heat. A point of the sea has its water at level 0: the ship sets down on it.
 * The sun of a location goes as its body turns; each marker of the command says whether it is day there now.
 * A location of a planet goes on past its outline: flown over it (not on its way down to a point), the ship is in the
 * location beside, made the ground then, the ship and the view at the very point of the planet they were (seamless);
 * through a passage of the mode passage, behind a veil (Veiled of the scene, 0 to 1); the location ahead is made before it
 * comes, and if it is not there yet the view darkens until it is (Scene: Prepare). Past the ground of a location the
 * surface it came over is drawn as its horizon (the far ground of the body).
 * The scene emits landing ({ID, Phase, Body, Latitude, Longitude, Altitude (km)}) at each phase: transfer, entry, approach,
 * hover, touchdown, landed, lift, climb, ascent, orbit, manual; and location ({ID, Location, Body}) when one is made.
 * ToOrbit(ship) takes a ship near a body to its parking orbit by one curve, and round it by itself (a key of flight lets it
 * go); TakeOff ends on it too. The command To orbit of the scene does it (ShipOrbit), with a hint nearer than 2000 km over
 * the body (ShipHint: orbit). The command Landing of the scene (a button while a ship is driven near a body it can come down on) lists the markers of
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
		/* The planet of a body as the scene has it (with its rivers once made: Scene, PlanetOptions); null for none. */
		function planetOf (body) {
			return engine.PlanetOptions(body);
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
		 * The way down over a surface: how far from the point (km of ground) a ship is at a height (km) on its glide: a long one
		 * high up (a ninth of a turn of slope), steeper near the ground (reach), and the height of a distance (heightAt); how
		 * fast it goes there (km/s, real) and how many times faster than real the way goes there.
		 */
		function reach (height) {
			return height > 12 ? height * 6.25 : 75 * Math.pow(Math.max(0, height) / 12, 1.6);
		}

		function heightAt (distance) {
			return distance > 75 ? distance / 6.25 : 12 * Math.pow(Math.max(0, distance) / 75, 1 / 1.6);
		}

		/* How steep the glide is at a distance (km of height a km). */
		function slopeAt (distance) {
			return distance > 75 ? 1 / 6.25 : 12 / 1.6 / 75 * Math.pow(Math.max(0.01, distance) / 75, 1 / 1.6 - 1);
		}

		function speedAt (height) {
			return 0.1 + 7.5 * smooth(15, 75, height) + 0.5 * Math.min(1, height / 15);
		}

		function paceAt (entry, height) {
			return 1 + (entry.Pace - 1) * Math.sqrt(smooth(0.6, 40, height));
		}

		/* Where the air of a body ends (km): a ship lower is in it, flown over its surface. */
		function topOf (body) {
			return body && body.Look && body.Look.Atmosphere[3] > 0.02 ? 120 : 40;
		}

		/* The way a direction of the body turns from a track to another about a point, signed (radians). */
		function turnBetween (point, from, to) {
			return Math.atan2(vectors.Dot(vectors.Cross(from, to), point), vectors.Dot(from, to));
		}

		/*
		 * Into the air of a body: the ship flies over its surface (in kilometres, in the frame of the body) from where it is,
		 * as fast and the way it goes, turned as it is, the view as it was: nothing jumps. Its state is Air {Point, Height
		 * (km over the sea), Track, Speed (km/s, real), Gamma (the slope of its way), Bank, Throttle}. manual: the player flies
		 * it; else its plan (down to its Target; up: to its parking orbit).
		 */
		function intoAir (hero, body, at, velocity, manual, turned, up) {
			var landing = hero.Landing;
			var entry = entryOf(hero);
			var radius = body.Radius;
			var point = vectors.Normalize(at);
			var height = vectors.Length(at) - radius;
			var radial = vectors.Dot(velocity, point);
			var level = vectors.Subtract(velocity, vectors.Scale(point, radial));
			var seen = turned || (hero.Seen ? {Right: toBody(body, hero.Seen.Right), Up: toBody(body, hero.Seen.Up), Ahead: toBody(body, hero.Seen.Ahead)} : {Right: [1, 0, 0], Up: [0, 1, 0], Ahead: [0, 0, 1]});
			var ahead = seen.Ahead;
			var track = vectors.Length(level) > 1e-6 ? vectors.Normalize(level) : vectors.Normalize(vectors.Subtract(ahead, vectors.Scale(point, vectors.Dot(ahead, point))));
			var pace = paceAt(entry, height);

			landing.Manual = !!manual;
			landing.Up = !!up;
			landing.Air = {Point: point, Height: height, Track: track, Speed: vectors.Length(velocity) / pace, Gamma: Math.atan2(radial, vectors.Length(level)), Bank: 0, Throttle: Math.min(1, vectors.Length(velocity) / pace / Math.max(0.1, speedAt(height)))};
			landing.Height = height;
			landing.Point = point;

			/* The ship and the view in the axes they had in space. */
			landing.ShipAxes = seen;
			landing.View = scene.ShipAxes && !turned ? {Right: toBody(body, scene.ShipAxes.Right), Up: toBody(body, scene.ShipAxes.Up), Ahead: toBody(body, scene.ShipAxes.Ahead)} : seen;
			landing.ShipFar = scene.ShipFar || scene.Wanted;
			landing.Zoom = scene.Wanted / Math.max(1e-12, landing.ShipFar);

			if (!scene.Surface)
				engine.Land(body.ID, {Ship: hero.ID, Up: point, Altitude: height});

			phase(hero, manual ? 'manual' : up ? 'ascent' : 'entry');
		}

		/*
		 * A step of a ship in the air over a surface. The player: W and S its throttle, R and F its nose down and up, A and D
		 * turn it. Its plan: down along the glide to its point (heading for it, as high as the glide says a little ahead, as
		 * fast as the air lets it), or up to its parking orbit. Any key of flight takes it over from its plan. Low over the
		 * ground going down, the location under it is the ground; high going up, it is in space again.
		 */
		function airStep (hero, surface, keys, elapsed) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var entry = entryOf(hero);
			var field = surface.Field;
			var radius = field.Radius;
			var air = landing.Air;
			var pad = keys.Pad || {X: 0, Y: 0, Gas: 0, Brake: 0};
			var throttle = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) + pad.Gas - pad.Brake;
			var nose = (keys.KeyF || keys.ArrowUp ? 1 : 0) - (keys.KeyR || keys.ArrowDown ? 1 : 0) - pad.Y;
			var turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - pad.X;
			var ground = Math.max(0, field.Elevation(air.Point));
			var over = air.Height - ground;
			var pace = paceAt(entry, over);
			/* Going up: its plan up, or the player's nose up. */
			var going = landing.Manual ? air.Gamma > 0 : landing.Up;
			var wanted;
			var gamma;
			var rate = 0;
			var step;
			var angle;
			var point;
			var at;
			var motion;
			var heat;
			var thick = body && body.Look ? body.Look.Atmosphere[3] : 0;

			/* A key of flight takes it over. */
			if (!landing.Manual && (Math.abs(throttle) > 0.1 || Math.abs(nose) > 0.1 || Math.abs(turn) > 0.1)) {
				landing.Manual = true;

				phase(hero, 'manual');
			}

			if (landing.Manual) {
				air.Throttle = clamp(air.Throttle + throttle * elapsed * 0.5, 0, 1);
				wanted = air.Throttle * speedAt(over) * 1.2;
				gamma = clamp(air.Gamma + nose * elapsed * 0.45, -1.2, 0.7);
				rate = turn * 0.35;
			}
			else if (going) {
				wanted = 0.15 + 7.5 * smooth(3, 200, over);
				gamma = 0.05 + 1.1 * (1 - smooth(0, entry.Parking * 0.8, over));
			}
			else {
				var distance = Math.acos(clamp(vectors.Dot(air.Point, landing.Target), -1, 1)) * radius;
				var toward = vectors.Subtract(landing.Target, vectors.Scale(air.Point, vectors.Dot(air.Point, landing.Target)));

				wanted = speedAt(over);

				/* Along the slope of the glide there, back onto it if off it (never up: below it, level until it comes). */
				gamma = clamp(-Math.atan(slopeAt(distance)) + clamp((heightAt(distance) - over) / Math.max(0.5, distance * 0.15), -0.35, 0.35), -0.9, 0);

				if (vectors.Length(toward) > 1e-9)
					rate = clamp(turnBetween(air.Point, air.Track, vectors.Normalize(toward)) * 0.8, -0.3, 0.3);

				landing.Distance = distance;
			}

			/* As fast as it is asked, its speed changing by at most 0.12 km/s each second of its way (a hard entry); as steep, never at once. */
			air.Speed += clamp(wanted - air.Speed, -0.12 * elapsed * pace, 0.12 * elapsed * pace);
			air.Gamma += (gamma - air.Gamma) * Math.min(1, elapsed * (landing.Manual ? 6 : 1.2));
			air.Bank += (clamp(-rate * 1.6, -0.7, 0.7) - air.Bank) * Math.min(1, elapsed * 2);

			/* The track turns about the point; the point goes along it over the sphere, the height along the slope. */
			if (rate)
				air.Track = vectors.Normalize(vectors.Add(vectors.Scale(air.Track, Math.cos(rate * elapsed)), vectors.Scale(vectors.Cross(air.Point, air.Track), Math.sin(rate * elapsed))));

			step = air.Speed * pace * elapsed;
			angle = step * Math.cos(air.Gamma) / (radius + air.Height);
			point = vectors.Normalize(vectors.Add(vectors.Scale(air.Point, Math.cos(angle)), vectors.Scale(air.Track, Math.sin(angle))));
			air.Track = vectors.Normalize(vectors.Subtract(vectors.Scale(air.Track, Math.cos(angle)), vectors.Scale(air.Point, Math.sin(angle))));
			air.Point = point;
			air.Height += step * Math.sin(air.Gamma);

			/* Never into the ground: over the surface down to LOW, where the location is. */
			ground = Math.max(0, field.Elevation(point));
			over = air.Height - ground;

			if (over < LOW && going)
				air.Height = ground + LOW;

			at = vectors.Scale(point, radius + air.Height);
			motion = vectors.Normalize(vectors.Add(vectors.Scale(air.Track, Math.cos(air.Gamma)), vectors.Scale(point, Math.sin(air.Gamma))));

			landing.Point = point;
			landing.Height = over;
			landing.At = at;
			landing.Motion = air.Track;
			landing.Real = air.Speed;
			landing.Speed = air.Speed * pace;
			landing.Gamma = air.Gamma;

			heat = thick * 0.6 * smooth(1.5, 6, air.Speed) * Math.exp(-Math.pow((over - 65) / 28, 2)) * (going ? 0.25 : 1);
			surface.Heat = heat;

			show(hero, surface, at, motion, landing.Manual ? 0 : 0.7 * smooth(25, 55, over) * (going ? 0 : 1), air.Bank, elapsed);

			chase(surface, landing, hero, at, heat, elapsed);

			hero.Thrust = 0.3 + air.Throttle * 0.7 + (going ? 0.6 : 0);

			if (!landing.Manual && !going)
				phase(hero, over > 12 ? 'entry' : 'approach');

			/* Down low: the location under it. */
			if (over <= LOW + 1e-6 && !going) {
				if (landing.Manual)
					landing.Target = point;

				enterLocation(hero);

				return;
			}

			/* High: in space again (a plan goes up to its parking orbit, the player out of the air). */
			if (air.Height >= (landing.Manual ? topOf(body) + 2 : entry.Parking))
				toSpace(hero);
		}

		/*
		 * The view after the ship over the surface, as round a ship in space (SceneVehicles: ShipView), in its axes eased the
		 * way the ship turns: the mouse turns it (Yaw and Pitch of the scene), the wheel brings it near or far (Wanted against
		 * what it was in space); it shakes in the heat and never goes under the ground.
		 */
		function chase (surface, landing, hero, at, heat, elapsed) {
			var field = surface.Field;
			var size = lengthOf(hero) / 1000;
			var follow = hero.Values.Vehicle.Follow || [3.2, 0.85];
			var step = Math.min(1, elapsed * 3);
			var target = surface.ShipAxes;
			var view = landing.View = landing.View ? {Right: vectors.Normalize(vectors.Lerp(landing.View.Right, target.Right, step)), Up: vectors.Normalize(vectors.Lerp(landing.View.Up, target.Up, step)), Ahead: vectors.Normalize(vectors.Lerp(landing.View.Ahead, target.Ahead, step))} : target;
			var round = [-Math.sin(scene.Yaw) * Math.cos(scene.Pitch), Math.sin(scene.Pitch), -Math.cos(scene.Yaw) * Math.cos(scene.Pitch)];
			var way = vectors.Add(vectors.Add(vectors.Scale(view.Right, round[0]), vectors.Scale(view.Up, round[1])), vectors.Scale(view.Ahead, round[2]));
			var far = size * Math.hypot(follow[0], follow[1]) * scene.Wanted / Math.max(1e-12, landing.ShipFar || scene.Wanted);
			var time = scene.Seconds;
			var shake = vectors.Scale(vectors.Add(vectors.Scale(view.Right, Math.sin(time * 47) + Math.sin(time * 23) * 0.5), vectors.Scale(view.Up, Math.sin(time * 41 + 1) + Math.sin(time * 19) * 0.5)), size * 0.04 * heat);
			var eye = vectors.Add(vectors.Add(at, vectors.Scale(way, far)), shake);
			var high = vectors.Length(eye) - field.Radius - field.Elevation(vectors.Normalize(eye));
			if (high < size * 0.3)
				eye = vectors.Scale(vectors.Normalize(eye), vectors.Length(eye) + size * 0.3 - high);

			landing.Cam = vectors.Normalize(vectors.Subtract(eye, at));
			landing.Far = far;
			landing.ViewUp = view.Up;

			surface.Eye = eye;
			surface.Up = vectors.Normalize(eye);
			surface.Altitude = Math.max(0.0005, vectors.Length(eye) - field.Radius - field.Elevation(surface.Up));
			surface.Look = vectors.Normalize(vectors.Subtract(at, eye));
			surface.Axes = axesAt(surface.Up);
			surface.ViewUp = view.Up;
			surface.Near = Math.max(0.00002, far * 0.04);

			if (landing.Fov === undefined)
				landing.Fov = scene.Camera.Fov;

			scene.Camera.Fov = landing.Fov * (1 + heat * 0.12);
		}

		/* The ship drawn where it is over the surface, turned the way it flies (eased), its nose up as it goes through the air high up. */
		function show (hero, surface, at, motion, raise, bank, elapsed) {
			var landing = hero.Landing;
			var up = vectors.Normalize(at);
			var ahead = vectors.Normalize(vectors.Add(vectors.Scale(motion, Math.cos(raise)), vectors.Scale(up, Math.sin(raise))));
			var wanted = axesOf(ahead, up, bank);
			var step = Math.min(1, elapsed * 2.5);
			var axes = landing.ShipAxes ? {Right: vectors.Normalize(vectors.Lerp(landing.ShipAxes.Right, wanted.Right, step)), Up: vectors.Normalize(vectors.Lerp(landing.ShipAxes.Up, wanted.Up, step)), Ahead: vectors.Normalize(vectors.Lerp(landing.ShipAxes.Ahead, wanted.Ahead, step))} : wanted;

			axes.Right = vectors.Normalize(vectors.Cross(axes.Up, axes.Ahead));
			axes.Up = vectors.Normalize(vectors.Cross(axes.Ahead, axes.Right));
			landing.ShipAxes = axes;

			surface.ShipAt = at;
			surface.ShipSize = lengthOf(hero) / 1000;
			surface.ShipTurn = turnOf(hero, axes.Right, axes.Up, axes.Ahead);
			surface.ShipAxes = axes;
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

			/* Disc: how large the star is seen from there (degrees), as from space; the moon its own (the nearest body round it), or none. */
			return Object.assign({Elevation: Math.asin(clamp(vectors.Dot(way, frame.Middle), -1, 1)) * 180 / Math.PI, Azimuth: (Math.atan2(vectors.Dot(way, frame.X), vectors.Dot(way, frame.North)) * 180 / Math.PI + 360) % 360, Disc: engine.StarDisc(star, body) * 2 * 180 / Math.PI}, moonOver(body, frame, way));
		}

		/*
		 * The moon of a location: the body nearest to its own of those that go round it, where it stands over the location
		 * (MoonElevation, MoonAzimuth: held there, not made of the day), how much of it is lit by the way of the star
		 * (MoonPhase: 0.5 full across the sky from it) and how large it is seen (MoonSize: 1 as the Moon from the Earth); Moon
		 * false for a body with none.
		 */
		function moonOver (body, frame, sun) {
			var moon = scene.Order.filter(function (object) {
				return object !== body && object.World && object.Radius && object.Traits && object.Traits.Body && (object.Parent === body.ID || object.Owner === body);
			}).sort(function (a, b) {
				return vectors.Distance(a.World, body.World) - vectors.Distance(b.World, body.World);
			})[0];
			var way;
			var apart;

			if (!moon)
				return {Moon: false};

			way = vectors.Normalize(toBody(body, vectors.Subtract(moon.World, body.World)));
			apart = Math.acos(clamp(vectors.Dot(way, sun), -1, 1));

			/* Its size as seen against the Moon from the Earth (1737 km at 384 400 km): of the real sizes, apart as the view lays them out. */
			var seen = moon.Radius / Math.max(1, vectors.Distance(moon.World, body.World) / body.Size * body.Radius);

			return {Moon: true, MoonElevation: Math.asin(clamp(vectors.Dot(way, frame.Middle), -1, 1)) * 180 / Math.PI, MoonAzimuth: (Math.atan2(vectors.Dot(way, frame.X), vectors.Dot(way, frame.North)) * 180 / Math.PI + 360) % 360, MoonPhase: apart / (Math.PI * 2), MoonSize: seen / (1737 / 384400)};
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

			['Moon', 'MoonElevation', 'MoonAzimuth', 'MoonPhase', 'MoonSize'].forEach(function (key) {
				if (sun[key] !== undefined)
					light.Traits.Sun[key] = sun[key];
			});
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

			scene.Location = {ID: id, Body: body.ID, Place: place, Frame: frame, Ground: ground, Sun: light, Hero: hero.ID, Planet: !!planet, Passages: location ? location.Passages : []};

			engine.SurfaceClose(true);
			engine.LabelsHidden(true);

			if (landing.Fov !== undefined)
				scene.Camera.Fov = landing.Fov;

			landing.SpaceSize = hero.Size;
			hero.Located = length;
			hero.Size = length;

			self.Add('ground', {ID: ground, World: world, Generated: true});
			self.Add('sun', {ID: light, Elevation: sun.Elevation, Azimuth: sun.Azimuth, Disc: sun.Disc, Moon: sun.Moon, MoonElevation: sun.MoonElevation, MoonAzimuth: sun.MoonAzimuth, MoonPhase: sun.MoonPhase, MoonSize: sun.MoonSize, Generated: true});

			engine.Prepare(true);

			hero.Size = length;

			/* As fast as it came and the way it went (metres a second now); the player flies on, a plan sets down at its point. */
			var speed = Math.min(flightOf(hero).Airspeed * 1.6, landing.Speed * 1000);
			var level = Math.hypot(way[0], way[1]) || 1;
			var gamma = landing.Gamma || 0;

			hero.Flying = {At: [at[0], null, at[1]], Over: LOW * 1000, Way: [way[0] / level * speed * Math.cos(gamma), speed * Math.sin(gamma), way[1] / level * speed * Math.cos(gamma)], Speed: speed, Heading: Math.atan2(-way[0], -way[1]), Landed: false, Throttle: Math.min(1, speed / flightOf(hero).Airspeed), Pitch: 0, Roll: 0, Plan: landing.Manual ? null : {Kind: 'land', To: to}};

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

			scene.Wanted = scene.Distance = landing.Far ? landing.Far * 1000 : length * 3.2;

			self.$Emit('location', {ID: id, Location: location, Body: body.ID});

			phase(hero, landing.Manual ? 'manual' : 'hover');
		}

		/*
		 * Past the outline of a location of a planet, into the cell beside: the location there becomes the ground (made of the
		 * same planet, so it goes on as it was), the ship and the view turned into its frame by the very point of the planet
		 * they are at: nothing seems to move. Through a passage of the mode passage it is gone to behind a veil.
		 */
		function crossStep (hero) {
			var located = scene.Location;
			var field = scene.Ground && scene.Ground.Field;
			var air = hero.Flying;
			var body;
			var point;
			var id;
			var through;

			/* Not on its way down to a point of this location: it may come in over the outline. */
			if (!located || !located.Planet || !air || !field || !field.Border || located.Through || air.Plan && air.Plan.Kind === 'land') return;

			prefetch(hero);

			if (field.Border.Distance(air.At[0], air.At[2]) < 30) return;

			body = scene.Objects[located.Body];
			point = latLon(located.Frame.Direction(air.At[0], air.At[2]));
			id = self.$Service('SceneLocations').At(planetOf(body), point.Latitude, point.Longitude);

			if (id === located.ID) return;

			through = located.Passages.filter(function (passage) {
				var side = located.Place.Sides && located.Place.Sides[passage.Side];
				var x;
				var z;

				if (!side || passage.Mode !== 'passage') return false;

				x = side[0] + (side[2] - side[0]) * passage.At;
				z = side[1] + (side[3] - side[1]) * passage.At;

				return Math.hypot(air.At[0] - x, air.At[2] - z) < number(passage.Width, 4) / 2 + 120;
			})[0];

			if (through) {
				located.Through = {To: id, Spent: 0, Done: false};

				return;
			}

			relocate(hero, id);
		}

		/*
		 * Near the outline and going out of it: the location it goes into made before it comes (its ground and the squares
		 * an eye where it comes in needs, Scene: PrefetchGround), once for each.
		 */
		function prefetch (hero) {
			var located = scene.Location;
			var air = hero.Flying;
			var flat = Math.hypot(air.Way[0], air.Way[2]);
			var body;
			var ahead;
			var point;
			var id;
			var location;
			var frame;
			var at;

			if (flat < 1 || scene.Ground.Field.Border.Distance(air.At[0], air.At[2]) < -600) return;

			ahead = [air.At[0] + air.Way[0] / flat * 600, air.At[2] + air.Way[2] / flat * 600];
			point = latLon(located.Frame.Direction(ahead[0], ahead[1]));
			body = scene.Objects[located.Body];
			id = self.$Service('SceneLocations').At(planetOf(body), point.Latitude, point.Longitude);

			if (id === located.ID || located.Fetched === id) return;

			located.Fetched = id;
			location = self.$Service('SceneLocations').Location(planetOf(body), id);
			frame = siteFrame(location.Place, body.Radius * 1000);
			at = frame.Local(located.Frame.Direction(air.At[0] + air.Way[0] / flat * 250, air.At[2] + air.Way[2] / flat * 250));

			engine.PrefetchGround(location.World, [at[0], air.At[1], at[1]]);
		}

		/* The veil of a passage: dark, then over to the location beside, then light again (by the time of the frames: a paused scene goes through too). */
		function veilStep (hero, elapsed) {
			var located = scene.Location;
			var through = located && located.Through;
			var spent;

			if (!through) {
				scene.Passing = 0;

				return;
			}

			through.Spent += elapsed;
			spent = through.Spent;

			scene.Passing = clamp(spent < 0.5 ? spent / 0.5 : 1 - (spent - 0.8) / 0.6, 0, 1);

			/* All dark: over to the location beside. */
			if (!through.Done && spent >= 0.5) {
				through.Done = true;

				relocate(hero, through.To);

				located = scene.Location;
				located.Through = through;
			}

			if (spent > 1.4) {
				located.Through = null;
				scene.Passing = 0;
			}
		}

		function relocate (hero, id) {
			var located = scene.Location;
			var body = scene.Objects[located.Body];
			var location = self.$Service('SceneLocations').Location(planetOf(body), id);
			var frame = siteFrame(location.Place, body.Radius * 1000);
			var old = located.Frame;
			var air = hero.Flying;
			var at;
			var ahead;
			var heading;
			var turn;
			var c;
			var s;

			function move (x, z) {
				return frame.Local(old.Direction(x, z));
			}

			at = move(air.At[0], air.At[2]);
			ahead = move(air.At[0] - Math.sin(air.Heading) * 50, air.At[2] - Math.cos(air.Heading) * 50);
			heading = Math.atan2(-(ahead[0] - at[0]), -(ahead[1] - at[1]));
			turn = wrap(heading - air.Heading);
			c = Math.cos(turn);
			s = Math.sin(turn);

			air.At = [at[0], air.At[1], at[1]];
			air.Heading = heading;
			air.Way = [air.Way[0] * c + air.Way[2] * s, air.Way[1], air.Way[2] * c - air.Way[0] * s];

			if (air.Plan && air.Plan.To)
				air.Plan.To = move(air.Plan.To[0], air.Plan.To[1]);

			/* The view where it was, turned with it. */
			[scene.Eye, scene.Camera.Position, scene.Camera.Target, scene.Target, scene.Pan, scene.From, scene.Ground && scene.Ground.Target].forEach(function (point) {
				var moved;

				if (!point || point.length < 3) return;

				moved = move(point[0], point[2]);
				point[0] = moved[0];
				point[2] = moved[1];
			});

			scene.Yaw += turn;

			scene.Location = {ID: id, Body: body.ID, Place: location.Place, Frame: frame, Ground: located.Ground, Sun: located.Sun, Hero: located.Hero, Planet: true, Passages: location.Passages, Lit: 0};

			self.Remove(located.Ground);
			self.Add('ground', {ID: located.Ground, World: location.World, Generated: true});

			/* What the view needs of it made before the game goes on: behind the veil of a passage, or darker only if it keeps waiting. */
			engine.Prepare(!located.Through);

			sunStep();

			self.$Emit('location', {ID: id, Location: location, Body: body.ID});
		}

		/*
		 * High enough over a location going up: in the air over the surface, the location let go, as fast and the way it went,
		 * the view where it was (its turn about the ship kept); a plan goes on up to its parking orbit, the player flies on.
		 */
		function leaveLocation (hero, manual) {
			var landing = hero.Landing;
			var located = scene.Location;
			var body = scene.Objects[located.Body];
			var air = hero.Flying;
			var frame = located.Frame;
			var point = frame.Direction(air.At[0], air.At[2]);

			/* A way of the location in the frame of the body: X, up (its middle), Z (to its south). */
			function out (way) {
				return [0, 1, 2].map(function (axis) {
					return way[0] * frame.X[axis] + way[1] * frame.Middle[axis] - way[2] * frame.North[axis];
				});
			}

			var seen = hero.Seen ? {Right: out(hero.Seen.Right), Up: out(hero.Seen.Up), Ahead: out(hero.Seen.Ahead)} : null;
			var cam = out(vectors.Normalize(vectors.Subtract(scene.Camera.Position, hero.World || air.At)));
			var velocity = vectors.Scale(out(air.Way), 0.001);

			scene.Location = null;
			hero.Located = 0;

			self.Remove(located.Ground);
			self.Remove(located.Sun);

			hero.Size = landing.SpaceSize || hero.Size;
			delete hero.Flying;

			/* The view round the ship as it stood: its turn and tilt in the axes of the ship, as far as before in space. */
			if (seen) {
				scene.Pitch = Math.asin(clamp(vectors.Dot(cam, seen.Up), -1, 1));
				scene.Yaw = Math.atan2(-vectors.Dot(cam, seen.Right), -vectors.Dot(cam, seen.Ahead));
			}

			scene.ShipFar = scene.ShipFar || 1;
			scene.Wanted = scene.Distance = scene.ShipFar;

			intoAir(hero, body, vectors.Scale(point, body.Radius + air.At[1] / 1000), velocity, manual, seen, true);
		}

		/*
		 * Out of the air (its plan at the parking orbit, or the player over the air): a ship of space again round the body,
		 * where it was, turned as it was and as fast, the view round it as it was.
		 */
		function toSpace (hero) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var vehicle = hero.Values.Vehicle;
			var air = landing.Air;
			var scale = body.Size / body.Radius;
			var axes = landing.ShipAxes;
			var view = landing.View || axes;
			var motion = vectors.Add(vectors.Scale(air.Track, Math.cos(air.Gamma)), vectors.Scale(air.Point, Math.sin(air.Gamma)));

			engine.SurfaceClose();
			engine.LabelsHidden(false);

			if (landing.Fov !== undefined)
				scene.Camera.Fov = landing.Fov;

			vehicle.Around = body.ID;
			hero.Ship = {At: toWorld(body, vectors.Scale(landing.At, scale)), Right: toWorld(body, axes.Right), Up: toWorld(body, axes.Up), Ahead: toWorld(body, axes.Ahead), Way: toWorld(body, vectors.Scale(motion, landing.Speed * scale)), Spin: [0, 0, 0], Throttle: landing.Manual ? air.Throttle : 0};
			hero.Clock = {};
			hero.Last = null;
			scene.ShipAxes = {Right: toWorld(body, view.Right), Up: toWorld(body, view.Up), Ahead: toWorld(body, view.Ahead)};
			scene.ShipFar = landing.ShipFar || scene.ShipFar;

			/* Up by its plan: round the parking orbit from where it came, as fast as an orbit goes there. */
			if (!landing.Manual) {
				hero.Landing = null;

				intoOrbit(hero, body, hero.Ship.At, vectors.Scale(vectors.Normalize(toWorld(body, air.Track)), orbitSpeed(body, landing.Height) * scale));

				return;
			}

			phase(hero, 'space');

			hero.Landing = null;
		}

		/*
		 * From space into the air where the way down begins (Start, at the top of the air, as far from the point as the glide
		 * reaches): one curve from where the ship is, as fast and the way it goes, to there, as fast and the way the glide
		 * goes on: it goes on into the air without a stop.
		 */
		function transferStep (hero, elapsed) {
			var landing = hero.Landing;
			var body = scene.Objects[landing.Body];
			var entry = entryOf(hero);
			var vehicle = hero.Values.Vehicle;
			var top = topOf(body);
			var scale;
			var gamma = -Math.atan(1 / 6.25);
			var start = landing.Start;
			var track;
			var goal;
			var way;
			var end;
			var span;
			var t;
			var at;
			var velocity;
			var ahead;
			var axes;
			var turned;
			var h00;
			var h10;
			var h01;
			var h11;

			if (!body || !body.World) {
				hero.Landing = null;

				return;
			}

			scale = body.Size / body.Radius;

			/* To the parking orbit (ToOrbit): its point and its way round, in the view; else to the top of the air on the glide. */
			if (landing.Orbit) {
				goal = landing.Orbit.At;
				end = landing.Orbit.Way;
			}
			else {
				track = vectors.Normalize(vectors.Subtract(landing.Target, vectors.Scale(start, vectors.Dot(start, landing.Target))));
				way = vectors.Scale(vectors.Add(vectors.Scale(track, Math.cos(gamma)), vectors.Scale(start, Math.sin(gamma))), speedAt(top) * paceAt(entry, top));
				goal = toWorld(body, vectors.Scale(start, (body.Radius + top) * scale));
				end = toWorld(body, vectors.Scale(way, scale));
			}

			if (!landing.From) {
				landing.From = vectors.Subtract(hero.World || body.World, body.World);
				landing.FromWay = hero.Ship ? hero.Ship.Way.slice() : [0, 0, 0];
				landing.FromAxes = hero.Seen || null;
				landing.Time = 0;
				landing.Length = clamp(2 * vectors.Distance(landing.From, goal) / Math.max(1e-12, vectors.Length(landing.FromWay) + vectors.Length(end)), 4, 16);
			}

			span = landing.Length;
			landing.Time += elapsed;
			t = Math.min(1, landing.Time / span);

			/* Hermite: its ends where they are, its tangents the ways (times the length of the curve in time). */
			h00 = 2 * t * t * t - 3 * t * t + 1;
			h10 = t * t * t - 2 * t * t + t;
			h01 = -2 * t * t * t + 3 * t * t;
			h11 = t * t * t - t * t;
			at = vectors.Add(vectors.Add(vectors.Scale(landing.From, h00), vectors.Scale(landing.FromWay, h10 * span)), vectors.Add(vectors.Scale(goal, h01), vectors.Scale(end, h11 * span)));
			velocity = vectors.Add(vectors.Add(vectors.Scale(landing.From, (6 * t * t - 6 * t) / span), vectors.Scale(landing.FromWay, 3 * t * t - 4 * t + 1)), vectors.Add(vectors.Scale(goal, (-6 * t * t + 6 * t) / span), vectors.Scale(end, 3 * t * t - 2 * t)));

			/* Never into the body. */
			if (vectors.Length(at) < (body.Radius + top * 0.5) * scale)
				at = vectors.Scale(vectors.Normalize(at), (body.Radius + top * 0.5) * scale);

			ahead = vectors.Length(velocity) > 1e-15 ? vectors.Normalize(velocity) : hero.Seen ? hero.Seen.Ahead : vectors.Normalize(end);
			axes = axesOf(ahead, vectors.Normalize(at), 0);

			/* It turns from how it stood to its way over the first seconds. */
			if (landing.FromAxes) {
				turned = smooth(0, Math.min(2, span * 0.3), landing.Time);
				axes = axesOf(vectors.Normalize(vectors.Lerp(landing.FromAxes.Ahead, axes.Ahead, turned)), vectors.Normalize(vectors.Lerp(landing.FromAxes.Up, axes.Up, turned)), 0);
			}

			vehicle.Around = body.ID;

			if (hero.Ship) {
				hero.Ship.At = at;
				hero.Ship.Ahead = axes.Ahead;
				hero.Ship.Right = axes.Right;
				hero.Ship.Up = axes.Up;
				hero.Ship.Way = velocity;
			}

			hero.Thrust = 1 + 1.5 * Math.sin(Math.PI * t);

			engine.PlaceShip(hero, vehicle, vectors.Add(body.World, at), axes.Right, axes.Up, axes.Ahead);

			if (t < 1) return;

			/* On the parking orbit: round it from now on. */
			if (landing.Orbit) {
				hero.Landing = null;

				intoOrbit(hero, body, goal, end);

				return;
			}

			/* At the top of the air: on along the glide, in the air. */
			intoAir(hero, body, vectors.Scale(start, body.Radius + top), way, false);
		}

		/* How fast a body is gone round at a height over it (km/s, real): of the pull of its surface (Gravity of its Info). */
		function orbitSpeed (body, height) {
			var g = body.Info && body.Info.Gravity ? body.Info.Gravity : 9.81;
			var r = (body.Radius + height) * 1000;

			return Math.sqrt(g * body.Radius * 1000 * body.Radius * 1000 / r) / 1000;
		}

		/*
		 * On a circle round a body (a place from it and a way, in the view): it goes round by itself, its nose along its way,
		 * as a station goes, until a key of flight takes it off as fast and the way it went.
		 */
		function intoOrbit (hero, body, at, way) {
			var radius = vectors.Length(at);
			var u = vectors.Normalize(at);
			var v = vectors.Subtract(way, vectors.Scale(u, vectors.Dot(way, u)));
			if (vectors.Length(v) < 1e-15)
				v = vectors.Cross(u, Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]);

			hero.Orbiting = {Body: body.ID, U: u, V: vectors.Normalize(v), Radius: radius, Angle: 0, Rate: vectors.Length(way) / radius};
			hero.Landing = {Phase: 'transfer', Body: body.ID};

			phase(hero, 'orbit');

			hero.Landing = null;
		}

		/* A step round the orbit; a key of flight lets it go. */
		function orbitStep (hero, keys, elapsed) {
			var orbit = hero.Orbiting;
			var body = scene.Objects[orbit.Body];
			var pad = keys.Pad || {X: 0, Y: 0, LookX: 0, LookY: 0, Gas: 0, Brake: 0};
			var flown = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyR', 'KeyF', 'KeyQ', 'KeyE', 'KeyC', 'KeyX', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].some(function (key) {
				return keys[key];
			}) || Math.abs(pad.X) + Math.abs(pad.Y) + Math.abs(pad.Gas) + Math.abs(pad.Brake) > 0.1;
			var at;
			var ahead;
			var up;
			var right;

			if (!body || !body.World || !hero.Ship) {
				hero.Orbiting = null;

				return false;
			}

			orbit.Angle += orbit.Rate * elapsed;
			at = vectors.Add(vectors.Scale(orbit.U, orbit.Radius * Math.cos(orbit.Angle)), vectors.Scale(orbit.V, orbit.Radius * Math.sin(orbit.Angle)));
			ahead = vectors.Normalize(vectors.Add(vectors.Scale(orbit.U, -Math.sin(orbit.Angle)), vectors.Scale(orbit.V, Math.cos(orbit.Angle))));
			up = vectors.Normalize(at);
			right = vectors.Normalize(vectors.Cross(up, ahead));

			hero.Values.Vehicle.Around = body.ID;
			hero.Ship.At = at;
			hero.Ship.Ahead = ahead;
			hero.Ship.Up = vectors.Cross(ahead, right);
			hero.Ship.Right = right;
			hero.Ship.Way = vectors.Scale(ahead, orbit.Rate * orbit.Radius);
			hero.Thrust = 0.05;

			engine.PlaceShip(hero, hero.Values.Vehicle, vectors.Add(body.World, at), right, hero.Ship.Up, ahead);

			/* Off it by hand: the ship of space as fast as it went. */
			if (flown) {
				hero.Orbiting = null;
				hero.Ship.Throttle = 0.2;
				hero.Last = null;
			}

			return true;
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

			/* L: down where it is (its plan land, under it). */
			if (keys.KeyL && !air.Landed && !(air.Plan && air.Plan.Kind === 'land')) {
				air.Plan = {Kind: 'land', To: [air.At[0] + air.Way[0] * 2, air.At[2] + air.Way[2] * 2]};

				phase(hero, 'hover');
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
				/* Flown up out of the location by hand: in the air over the surface. */
				if (scene.Location && hero.Landing && air.Way[1] > 0 && over > entry.Exit * 1000) {
					leaveLocation(hero, true);

					return;
				}

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

			crossStep(hero);
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
				else if (scene.Location && hero.Flying && !(hero.Flying.Plan && hero.Flying.Plan.Kind === 'land')) {
					can = 'land';
				}
				else if (!hero.Landing && !scene.Location && !scene.Surface && !scene.Ground) {
					body = bodyFor(hero, '');
					can = body && hero.World && vectors.Distance(body.World, hero.World) < body.Size * 30 ? 'land' : '';
				}
				else if (hero.Landing && hero.Landing.Manual && scene.Surface) {
					can = 'land';
				}
			}

			/* Near a body in space, not round it: the parking orbit; nearer than 2000 km over it, the hint to go round it. */
			var orbit = false;
			var hint = '';

			if (hero && hero.Ship && hero.Traits.Entry && !hero.Landing && !hero.Orbiting && !scene.Location && !scene.Surface && !scene.Ground) {
				body = bodyFor(hero, '');

				if (body && hero.World && body.World && vectors.Distance(body.World, hero.World) < body.Size * 30) {
					orbit = true;
					hint = (vectors.Distance(body.World, hero.World) / body.Size - 1) * body.Radius < 2000 ? 'orbit' : '';
				}
			}

			if (self.ShipOrbit !== orbit)
				self.ShipOrbit = orbit;

			if (self.ShipHint !== hint)
				self.ShipHint = hint;

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

			veilStep(hero, elapsed);

			if (scene.Ground) flight(hero, keys, elapsed);
			else if (hero.Landing && hero.Landing.Phase === 'transfer' && hero.Ship) transferStep(hero, elapsed);
			else if (!(hero.Orbiting && orbitStep(hero, keys, elapsed))) space(hero, keys, elapsed);

			if (!scene.Ground && !scene.Surface && !hero.Landing && hero.Ship)
				airborne(hero);

			offer();
		};

		/* Flown by hand down to the top of the air of a body it can come down on: in the air over its surface, the player flying on. */
		function airborne (hero) {
			var body = hero.Traits.Entry ? bodyFor(hero, '') : null;
			var scale;
			var at;
			var way;

			if (!body || !body.World || !hero.World) return;

			scale = body.Size / body.Radius;
			at = vectors.Scale(toBody(body, vectors.Subtract(hero.World, body.World)), 1 / scale);

			if (vectors.Length(at) - body.Radius > topOf(body)) return;

			way = vectors.Scale(toBody(body, hero.Ship.Way), 1 / scale);

			if (vectors.Dot(way, vectors.Normalize(at)) > 0) return;

			hero.Landing = {Phase: '', Body: body.ID, Target: vectors.Normalize(at), Rate: 1, View: {Wanted: scene.Wanted, Distance: scene.Distance}};

			intoAir(hero, body, at, way, true);
		}

		/* A step over the surface the ship flies over (Scene: surfaceStep). */
		engine.LandingSurfaceStep = function (surface, keys, elapsed) {
			var hero = scene.Objects[surface.Ship];

			if (!hero || !hero.Landing) {
				engine.SurfaceClose();

				return;
			}

			if (hero.Landing.Air)
				airStep(hero, surface, keys, elapsed);

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
				var to = options.X !== undefined ? [number(options.X, 0), number(options.Y, 0)] : latitude !== undefined ? scene.Location.Frame.Local(direction(number(latitude, 0), number(longitude, 0))) : [hero.Flying.At[0] + hero.Flying.Way[0] * 2, hero.Flying.At[2] + hero.Flying.Way[2] * 2];

				hero.Landing = hero.Landing || {Body: scene.Location.Body, Rate: 1, Steer: 0};
				hero.Flying.Plan = {Kind: 'land', To: to};
				hero.Flying.Landed = false;

				phase(hero, 'hover');

				return true;
			}

			/* In the air, flown by hand: its plan takes it down to the point from where it is. */
			if (hero.Landing && hero.Landing.Air && scene.Surface && (options.Marker !== undefined || latitude !== undefined)) {
				body = scene.Objects[hero.Landing.Body];
				marker = options.Marker !== undefined ? markersOf(body).filter(function (each) {
					return each.ID === String(options.Marker) || each.Name === options.Marker;
				})[0] : {Latitude: latitude, Longitude: longitude};

				if (!marker)
					return false;

				hero.Landing.Target = direction(number(marker.Latitude, 0), number(marker.Longitude, 0));
				hero.Landing.Manual = false;
				hero.Landing.Up = false;
				self.LandingOpen = false;

				phase(hero, 'entry');

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
			arc = reach(topOf(body)) / body.Radius;
			apart = Math.acos(clamp(vectors.Dot(target, under), -1, 1));
			axis = vectors.Cross(target, under);

			if (vectors.Length(axis) < 1e-6)
				axis = vectors.Cross(target, axesAt(target).North);

			axis = vectors.Normalize(axis);
			start = apart > arc * 0.6 && apart < arc * 1.6 ? under : vectors.Normalize(vectors.Add(vectors.Scale(target, Math.cos(arc)), vectors.Scale(vectors.Cross(axis, target), Math.sin(arc))));

			hero.Orbiting = null;
			landing = hero.Landing = {Phase: '', Body: body.ID, Target: target, Start: start, Axis: axis, Rate: 1, Point: start, Height: topOf(body), View: {Wanted: scene.Wanted, Distance: scene.Distance}};

			self.LandingOpen = false;
			scene.Picking = '';

			phase(hero, 'transfer');

			return !!landing;
		};

		/*
		 * To the parking orbit of the body near (Parking of Entry, 400 km): one curve from where the ship is, as fast as it
		 * goes, to a point of the orbit a little ahead of it, as fast as the orbit goes round, then round it.
		 */
		engine.ShipToOrbit = function (hero) {
			var body = bodyFor(hero, '');
			var scale;
			var here;
			var ahead;
			var aside;
			var point;
			var turn = 20 * Math.PI / 180;
			var radius;

			if (!body || !body.World || !hero.World || !hero.Ship || hero.Landing || scene.Ground || scene.Surface || !engine.Renderer) return false;

			scale = body.Size / body.Radius;
			radius = (body.Radius + entryOf(hero).Parking) * scale;
			here = vectors.Normalize(vectors.Subtract(hero.World, body.World));
			ahead = vectors.Length(hero.Ship.Way) > 1e-15 ? vectors.Normalize(hero.Ship.Way) : hero.Seen ? hero.Seen.Ahead : [0, 0, 1];
			aside = vectors.Subtract(ahead, vectors.Scale(here, vectors.Dot(ahead, here)));
			aside = vectors.Length(aside) > 1e-9 ? vectors.Normalize(aside) : vectors.Normalize(vectors.Cross(here, [0, 1, 0]));
			point = vectors.Add(vectors.Scale(here, Math.cos(turn)), vectors.Scale(aside, Math.sin(turn)));

			hero.Orbiting = null;
			hero.Landing = {Phase: '', Body: body.ID, Orbit: {At: vectors.Scale(point, radius), Way: vectors.Scale(vectors.Add(vectors.Scale(here, -Math.sin(turn)), vectors.Scale(aside, Math.cos(turn))), orbitSpeed(body, entryOf(hero).Parking) * scale)}, View: {Wanted: scene.Wanted, Distance: scene.Distance}};

			phase(hero, 'transfer');

			return true;
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
		var scene = this.Scene();

		/* Flying in a location: down where it is, at once. */
		if (scene.Location && scene.Hero && scene.Objects[scene.Hero] && scene.Objects[scene.Hero].Flying) {
			this.LandingOpen = false;

			this.Land(scene.Hero, {});

			return;
		}

		this.LandingMarkers = this.Engine().LandingMarkers();
		this.LandingOpen = !this.LandingOpen;
		this.Scene().Picking = '';
	},

	ShipToOrbit: function () {
		var scene = this.Scene();
		if (scene.Hero)
			this.ToOrbit(scene.Hero);
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
