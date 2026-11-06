/*
 * SceneCamera: the cameras of a scene, each an object of kind camera (the trait Camera) with a lens of a real one. The
 * property Camera of the scene (an ID; empty: the view of the scene, as before) or UseCamera(id, {Fly}) says which one
 * shows the world: at once (a cut) or flying to it in Fly seconds; Cameras() lists them.
 * - Where it stands: X and Y on the map, Lift over the ground (1.6) or Z (a height of its own), turned by Yaw (degrees,
 *   0 looks along +Z as a facing does), Pitch (up) and Roll; Target (an ID) turns it to an object, the middle of its body;
 *   Follow (an ID) carries it with an object, At [x, up, ahead] metres from it, turned with it (a camera on a car; one that
 *   pitches and rolls, its Turn, takes the camera with it). Rig: tripod, handheld, gimbal, steadicam or drone (see rigged).
 * - Its lens: Focal (mm, 35) on a sensor Sensor mm wide (36: full frame) gives the angle of the view; Aperture (the f-number,
 *   2.8; empty: all sharp) blurs what is out of focus as a lens of that focal length does, Focus (metres; empty: the Target, or
 *   what the middle of the view shows, followed slowly).
 * - Its exposure: with Aperture, ISO and Shutter (seconds: 0.008 is 1/125) all given it is theirs alone, no eye that opens
 *   and shuts (f/16, 1/100 s, ISO 100 under the noon sun shows it as the eye does; ND, stops of a grey filter, darkens it);
 *   else the eye of the scene as before. Compensation (stops) adds to either. A Shutter blurs the picture by how the camera
 *   moved while it was open (only the camera: what moves before it stays sharp); ISO over 100 brings the grain of it.
 * - Its filters and its look: Polarizer (0 to 1: takes the reflections off water, glass and what is wet, deepens the sky),
 *   Filter (a color over the lens), Temperature (the white balance, K: 6500 is daylight; lower makes the picture bluer) and Tint
 *   (-1 green to 1 magenta), Saturation and Contrast (1), LUT (the URL of a strip of a table of colors, its slices side by
 *   side, N*N wide and N tall), Aberration (0 to 1: the colors part at the edges), Distortion (-1 a barrel to 1 a pincushion),
 *   Vignette (0 to 1; empty: as a lens that open darkens its corners), Grain (0 to 1; empty: of its ISO).
 * Lens() of the engine gives what the passes of the picture use of the camera that shows the world: {Fov, Exposure (a number
 * when it is its own, else null), Compensation, Coc ({Focal, Scale}: how big the circle of a blur is, null for none), Focus,
 * Shutter, Balance [r, g, b], Saturation, Contrast, Grain, Vignette, Aberration, Distortion, Polarizer, LUT, Cut}.
 */
Elemenx.Trait('SceneCamera', {
	CameraStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var state = {Active: '', From: null, Fly: 0, Flown: 0, Fov: 0, Cut: 0, Focus: 0, Was: null, Rigs: {}, Poses: {}};

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function given (value) {
			return value !== undefined && value !== null && value !== '' && !isNaN(Number(value)) && Number(value) > 0;
		}

		function radians (degrees) {
			return number(degrees, 0) * Math.PI / 180;
		}

		/* The color of a light of a temperature (K), near enough to a body that glows (Tanner Helland's fit). */
		function kelvin (k) {
			var t = Math.max(1000, Math.min(40000, k)) / 100;
			var r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
			var g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
			var b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;

			return [r, g, b].map(function (value) {
				return Math.pow(Math.max(1, Math.min(255, value)) / 255, 2.2);
			});
		}

		/* What the white balance of K does: the light of K made white, as daylight was; the brightness kept. */
		function balance (k, tint, filter) {
			var day = kelvin(6500);
			var light = kelvin(k);
			var made = [day[0] / light[0], day[1] / light[1], day[2] / light[2]];
			var mean = made[0] * 0.2126 + made[1] * 0.7152 + made[2] * 0.0722;
			var color = colorOf(filter);

			made = made.map(function (value) {
				return value / mean;
			});

			made[0] *= 1 + tint * 0.08;
			made[1] *= 1 - tint * 0.16;
			made[2] *= 1 + tint * 0.08;

			return [made[0] * color[0], made[1] * color[1], made[2] * color[2]];
		}

		/* A color of #rrggbb, linear; white when it is none. */
		function colorOf (value) {
			var text = String(value || '').replace('#', '');
			if (!/^[0-9a-fA-F]{6}$/.test(text)) return [1, 1, 1];

			return [0, 2, 4].map(function (at) {
				return Math.pow(parseInt(text.slice(at, at + 2), 16) / 255, 2.2);
			});
		}

		function normal (a) {
			var size = Math.hypot(a[0], a[1], a[2]) || 1;

			return [a[0] / size, a[1] / size, a[2] / size];
		}

		/* The values of a camera: those of its trait, then those of the object (its place). */
		function valuesOf (object) {
			return Object.assign({}, object.Values, object.Traits && object.Traits.Camera || {});
		}

		/* The middle of the body of an object, where a camera looks at it. */
		function middle (object) {
			var size = object.Size || number(object.Values.Size, 1);

			return [object.World[0], object.World[1] + size * 0.6, object.World[2]];
		}

		function groundAt (x, z) {
			var field = scene.Ground ? scene.Ground.Field : null;

			return field ? field.Height(x, z) : 0;
		}

		/* Where a camera stands and where it looks: {Position, Target, Up}. */
		function poseOf (object) {
			var values = valuesOf(object);
			var follow = values.Follow ? scene.Objects[values.Follow] : null;
			var yaw = radians(values.Yaw);
			var pitch = radians(values.Pitch);
			var roll = radians(values.Roll);
			var target = values.Target ? scene.Objects[values.Target] : null;
			var position;
			var ahead;
			var right;
			var up;
			var look;
			var level = [0, 1, 0];

			if (follow && follow.World && follow.Turn && follow.Turn.length === 16) {
				/* A carrier turned in full (a vehicle that pitches and rolls): the camera is fixed to it, its way and its up turned with it. */
				var mount = values.At || [0, 1.5, 0];
				var m = follow.Turn;
				var turn = function (v) {
					return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]];
				};
				var offset = turn([number(mount[0], 0), number(mount[1], 0), number(mount[2], 0)]);

				position = [follow.World[0] + offset[0], follow.World[1] + offset[1], follow.World[2] + offset[2]];
				ahead = normal(turn([Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]));
				level = normal(turn([0, 1, 0]));
				look = [position[0] + ahead[0] * 10, position[1] + ahead[1] * 10, position[2] + ahead[2] * 10];
			}
			else if (follow && follow.World) {
				var at = values.At || [0, 1.5, 0];
				var facing = follow.Facing || 0;
				var side = [Math.cos(facing), 0, -Math.sin(facing)];
				var forth = [Math.sin(facing), 0, Math.cos(facing)];

				position = [follow.World[0] + side[0] * number(at[0], 0) + forth[0] * number(at[2], 0), follow.World[1] + number(at[1], 0), follow.World[2] + side[2] * number(at[0], 0) + forth[2] * number(at[2], 0)];
				yaw += facing;
			}
			else {
				var x = number(values.X, 0);
				var z = number(values.Y, 0);

				position = [x, values.Z !== undefined && values.Z !== null && values.Z !== '' ? number(values.Z, 0) : groundAt(x, z) + number(values.Lift, 1.6), z];
			}

			if (target && target.World && target !== object) {
				look = middle(target);
				ahead = normal([look[0] - position[0], look[1] - position[1], look[2] - position[2]]);
			}

			if (!ahead) {
				ahead = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
				look = [position[0] + ahead[0] * 10, position[1] + ahead[1] * 10, position[2] + ahead[2] * 10];
			}

			/* The roll turns the up of the view round the way it looks; the up of a carrier turned in full is its own. */
			right = normal(Math.abs(ahead[0] * level[0] + ahead[1] * level[1] + ahead[2] * level[2]) > 0.999 ? [1, 0, 0] : cross(ahead, level));
			up = cross(right, ahead);
			up = [up[0] * Math.cos(roll) + right[0] * Math.sin(roll), up[1] * Math.cos(roll) + right[1] * Math.sin(roll), up[2] * Math.cos(roll) + right[2] * Math.sin(roll)];

			return {Position: position, Target: look, Up: up, Looked: target && target.World ? Math.hypot(look[0] - position[0], look[1] - position[1], look[2] - position[2]) : 0, Carrier: follow && follow.World ? follow.World.slice() : null};
		}

		/* SceneCamera: rigs */

		/* A slow wandering of -1 to 1 of its own for each seed: sines whose times never meet. */
		function wander (time, seed, rate) {
			return (Math.sin(time * rate * 6.2832 + seed * 1.7) * 0.5 + Math.sin(time * rate * 6.2832 * 2.31 + seed * 4.3) * 0.3 + Math.sin(time * rate * 6.2832 * 5.17 + seed * 9.1) * 0.2);
		}

		function angle (from, to) {
			var d = to - from;

			while (d > Math.PI) d -= Math.PI * 2;

			while (d < -Math.PI) d += Math.PI * 2;

			return d;
		}

		/* The angles of a pose: its yaw and pitch, and its roll from the level of the world. */
		function anglesOf (pose) {
			var ahead = normal([pose.Target[0] - pose.Position[0], pose.Target[1] - pose.Position[1], pose.Target[2] - pose.Position[2]]);
			var right = normal(Math.abs(ahead[1]) > 0.999 ? [1, 0, 0] : cross(ahead, [0, 1, 0]));
			var up = cross(right, ahead);

			return {Yaw: Math.atan2(ahead[0], ahead[2]), Pitch: Math.asin(Math.max(-1, Math.min(1, ahead[1]))), Roll: Math.atan2(pose.Up[0] * right[0] + pose.Up[1] * right[1] + pose.Up[2] * right[2], pose.Up[0] * up[0] + pose.Up[1] * up[1] + pose.Up[2] * up[2])};
		}

		/* A pose of a place and its angles. */
		function poseFrom (position, yaw, pitch, roll) {
			var ahead = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
			var right = normal(Math.abs(ahead[1]) > 0.999 ? [1, 0, 0] : cross(ahead, [0, 1, 0]));
			var up = cross(right, ahead);

			return {Position: position, Target: [position[0] + ahead[0] * 10, position[1] + ahead[1] * 10, position[2] + ahead[2] * 10], Up: [up[0] * Math.cos(roll) + right[0] * Math.sin(roll), up[1] * Math.cos(roll) + right[1] * Math.sin(roll), up[2] * Math.cos(roll) + right[2] * Math.sin(roll)]};
		}

		/*
		 * What the rig of a camera makes of where it is put (Rig: tripod, as it is; handheld: the breath and the tremor of hands,
		 * the turn a little late, the steps of who carries it; gimbal: the horizon held, the turns smoothed, its pitch within
		 * PitchMin and PitchMax; steadicam: it floats after its place on a spring, level; drone: its weight, leaning into how it
		 * speeds up, hovering with a drift). Shake scales what shakes, Smooth (seconds) how late it turns, Lag (seconds) how late it
		 * follows, Tilt how much of the lean of a drone its camera keeps.
		 */
		function rigged (object, raw, elapsed) {
			var v = valuesOf(object);
			var rig = String(v.Rig || 'tripod');
			var kept = state.Rigs[object.ID];
			var dt = Math.max(0, Math.min(0.1, elapsed));
			var wanted = anglesOf(raw);
			var seed = object.ID.length * 3.1 + object.ID.charCodeAt(0) * 0.37;
			var shake = number(v.Shake, {handheld: 0.5, steadicam: 0.2, gimbal: 0.05, drone: 0.15}[rig] || 0);
			var smooth = Math.max(0.001, number(v.Smooth, {handheld: 0.12, gimbal: 0.3, steadicam: 0.25, drone: 0.35}[rig] || 0.001));
			var lag = Math.max(0.05, number(v.Lag, {steadicam: 0.6, drone: 0.9}[rig] || 0.05));
			var time;
			var ease;
			var position;
			var roll;
			var pitch;

			if (rig === 'tripod' || !rig) {
				state.Rigs[object.ID] = null;

				return raw;
			}

			if (!kept || kept.Rig !== rig || elapsed > 0.5) {
				kept = state.Rigs[object.ID] = {Rig: rig, Time: 0, Place: raw.Position.slice(), Speed: [0, 0, 0], Yaw: wanted.Yaw, Pitch: wanted.Pitch, Roll: rig === 'handheld' ? wanted.Roll : 0, Carrier: raw.Carrier, Walked: 0, Lean: [0, 0]};
			}

			kept.Time += dt;
			time = kept.Time;
			ease = 1 - Math.exp(-dt / smooth);

			/* The turns: late by Smooth; a gimbal levels its horizon and keeps its pitch within its stops. */
			kept.Yaw += angle(kept.Yaw, wanted.Yaw) * ease;
			pitch = wanted.Pitch;

			if (rig === 'gimbal' || rig === 'drone')
				pitch = Math.max(radians(number(v.PitchMin, -90)), Math.min(radians(number(v.PitchMax, 30)), pitch));

			kept.Pitch += (pitch - kept.Pitch) * ease;
			kept.Roll += ((rig === 'handheld' ? wanted.Roll : 0) - kept.Roll) * ease;

			/* The place: as it is put (in the hands, on a gimbal), or after it on a spring (a steadicam, a drone). */
			if (rig === 'steadicam' || rig === 'drone') {
				var spring = Math.PI * 2 / lag;
				var damping = rig === 'drone' ? 0.85 : 0.7;
				var steps = Math.max(1, Math.ceil(dt / 0.01));
				var before = kept.Speed.slice();
				var k;
				var axis;

				for (k = 0; k < steps; k++) {
					for (axis = 0; axis < 3; axis++) {
						kept.Speed[axis] += ((raw.Position[axis] - kept.Place[axis]) * spring * spring - kept.Speed[axis] * 2 * damping * spring) * dt / steps;
						kept.Place[axis] += kept.Speed[axis] * dt / steps;
					}
				}

				/* A drone leans into how it speeds up, its camera keeping Tilt of it. */
				if (rig === 'drone' && dt > 0) {
					var push = [(kept.Speed[0] - before[0]) / dt, (kept.Speed[2] - before[2]) / dt];
					var forth = [Math.sin(kept.Yaw), Math.cos(kept.Yaw)];
					var lean = [Math.max(-0.4, Math.min(0.4, -(push[0] * forth[0] + push[1] * forth[1]) * 0.05)), Math.max(-0.4, Math.min(0.4, (push[0] * forth[1] - push[1] * forth[0]) * 0.05))];

					kept.Lean[0] += (lean[0] - kept.Lean[0]) * (1 - Math.exp(-dt / 0.2));
					kept.Lean[1] += (lean[1] - kept.Lean[1]) * (1 - Math.exp(-dt / 0.2));
				}

				position = kept.Place.slice();
			}
			else {
				position = raw.Position.slice();
			}

			roll = kept.Roll;
			pitch = kept.Pitch;

			var yaw = kept.Yaw;

			if (rig === 'drone') {
				var tilt = number(v.Tilt, 0.3);

				pitch += kept.Lean[0] * tilt;
				roll += kept.Lean[1] * tilt;

				/* Hovering: a drift of a few centimetres, and the shiver of its rotors. */
				position[0] += wander(time, seed, 0.21) * 0.05 * shake / 0.15;
				position[1] += wander(time, seed + 2, 0.17) * 0.04 * shake / 0.15;
				position[2] += wander(time, seed + 5, 0.19) * 0.05 * shake / 0.15;
				pitch += wander(time, seed + 7, 23) * 0.0006 * shake / 0.15;
			}
			else {
				/* The breath of who holds it, the tremor of hands, a slow sway: all by Shake. */
				pitch += (wander(time, seed, 0.27) * 0.007 + wander(time, seed + 1, 7.3) * 0.0016) * shake * 2;
				yaw += (wander(time, seed + 3, 0.19) * 0.009 + wander(time, seed + 4, 6.1) * 0.0014) * shake * 2;
				roll += wander(time, seed + 6, 0.23) * 0.012 * shake * 2;
				position[1] += wander(time, seed + 8, 0.27) * 0.004 * shake * 2;
			}

			/* The steps of who carries it in the hands: a bob and a sway at the pace of the walk. */
			if (rig === 'handheld' && raw.Carrier && kept.Carrier && dt > 0) {
				var walk = Math.hypot(raw.Carrier[0] - kept.Carrier[0], raw.Carrier[2] - kept.Carrier[2]) / dt;

				kept.Walked += dt * (1.6 + Math.min(walk, 6) * 0.35) * Math.min(1, walk / 0.5);

				var stride = Math.min(1, walk / 2) * shake * 2;

				position[1] += Math.abs(Math.sin(kept.Walked * Math.PI)) * 0.025 * stride;
				roll += Math.sin(kept.Walked * Math.PI) * 0.012 * stride;
			}

			kept.Carrier = raw.Carrier;

			var made = poseFrom(position, yaw, pitch, roll);

			made.Looked = raw.Looked;

			return made;
		}

		/* Each camera where its rig has it now, once a frame: what shows the world, and the screens of what they see. */
		function rigAll (elapsed) {
			self.Objects('camera').forEach(function (object) {
				state.Poses[object.ID] = rigged(object, poseOf(object), elapsed);
			});
		}

		function cross (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		}

		function lerp (a, b, t) {
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
		}

		/* The angle of the view up and down (degrees) of a focal length on a sensor, for a picture of that aspect. */
		function fovOf (values, aspect) {
			var focal = Math.max(1, number(values.Focal, 35));
			var sensor = Math.max(1, number(values.Sensor, 36));
			var across = 2 * Math.atan(sensor / (2 * focal));

			return 2 * Math.atan(Math.tan(across / 2) / Math.max(0.1, aspect)) * 180 / Math.PI;
		}

		function active () {
			var id = state.Active;
			var object = id ? scene.Objects[id] : null;

			return object && (object.Kind === 'camera' || object.Traits && object.Traits.Camera) ? object : null;
		}

		/* The camera shows the world: after the view of the scene was aimed, it takes the place of it (flying, or at once). */
		engine.CameraStep = function (elapsed) {
			var wanted = self.Camera || '';
			var camera = scene.Camera;
			var object;
			var pose;
			var t;

			if (wanted !== state.Active) {
				state.From = {Position: camera.Position.slice(), Target: camera.Target.slice(), Up: (camera.Up || [0, 1, 0]).slice(), Fov: camera.Fov};
				state.Fly = state.Next && state.Next.ID === wanted ? Math.max(0, number(state.Next.Fly, 0)) : 0;
				state.Flown = 0;
				state.Next = null;
				state.Active = wanted;
				state.Cut++;

				if (!state.Fov && wanted)
					state.Fov = camera.Fov;
			}

			rigAll(elapsed);

			object = active();
			state.Flown += elapsed;
			t = state.Fly > 0 ? Math.min(1, state.Flown / state.Fly) : 1;
			t = t * t * (3 - 2 * t);

			if (object) {
				pose = Object.assign({}, state.Poses[object.ID] || poseOf(object));
				pose.Fov = fovOf(valuesOf(object), scene.Width / Math.max(1, scene.Height));
				state.Focus = pose.Looked;
			}
			else {
				/* Back to the view of the scene: it was aimed as ever, the camera goes to it. */
				if (state.Fov) {
					pose = {Position: camera.Position.slice(), Target: camera.Target.slice(), Up: [0, 1, 0], Fov: state.Fov};

					if (t >= 1)
						state.Fov = 0;
				}

				state.Focus = 0;
			}

			if (!pose) return;

			if (state.From && t < 1) {
				pose.Position = lerp(state.From.Position, pose.Position, t);
				pose.Target = lerp(state.From.Target, pose.Target, t);
				pose.Up = lerp(state.From.Up, pose.Up, t);
				pose.Fov = state.From.Fov + (pose.Fov - state.From.Fov) * t;
			}

			camera.Position = pose.Position;
			camera.Target = pose.Target;
			camera.Up = pose.Up;
			camera.Fov = pose.Fov;

			if (object) {
				camera.Near = Math.max(0.03, number(valuesOf(object).Near, 0.1));
				camera.Far = Math.max(camera.Far || 1000, scene.Ground && scene.Ground.Field ? scene.Ground.Field.Size * 3 : 1000);
			}

			scene.Eye = camera.Position.slice();
		};

		/* The lens of the camera that shows the world, for the passes of the picture; null for the view of the scene. */
		engine.Lens = function () {
			var object = active();
			var v;
			var aperture;
			var iso;
			var shutter;
			var aspect;
			var focal;

			if (!object)
				return null;

			v = valuesOf(object);
			aperture = given(v.Aperture) ? Number(v.Aperture) : 0;
			iso = given(v.ISO) ? Number(v.ISO) : 0;
			shutter = given(v.Shutter) ? Number(v.Shutter) : 0;
			aspect = scene.Width / Math.max(1, scene.Height);
			focal = Math.max(1, number(v.Focal, 35)) / 1000;

			return {
				Fov: fovOf(v, aspect),
				Exposure: aperture && iso && shutter ? 25600 * shutter * iso / (100 * aperture * aperture) * Math.pow(2, -Math.max(0, number(v.ND, 0))) : null,
				Compensation: Math.pow(2, number(v.Compensation, 0)),
				/* How big the circle of the blur of a point is, a part of the height of the picture: Scale * |d - focus| / (d (focus - Focal)). */
				Coc: aperture ? {Focal: focal, Scale: focal * focal / (aperture * Math.max(1, number(v.Sensor, 36)) / 1000 / aspect)} : null,
				Focus: given(v.Focus) ? Number(v.Focus) : state.Focus,
				Shutter: shutter,
				Balance: balance(number(v.Temperature, 6500), Math.max(-1, Math.min(1, number(v.Tint, 0))), v.Filter),
				Saturation: Math.max(0, number(v.Saturation, 1)),
				Contrast: Math.max(0, number(v.Contrast, 1)),
				Grain: v.Grain !== undefined && v.Grain !== null && v.Grain !== '' ? Math.max(0, Math.min(1, number(v.Grain, 0))) : iso > 100 ? Math.min(1, Math.log(iso / 100) / Math.LN2 / 6) : 0,
				Vignette: v.Vignette !== undefined && v.Vignette !== null && v.Vignette !== '' ? Math.max(0, Math.min(1, number(v.Vignette, 0))) : aperture ? Math.min(0.5, 1.2 / aperture) : 0,
				Aberration: Math.max(0, Math.min(1, number(v.Aberration, 0))),
				Distortion: Math.max(-1, Math.min(1, number(v.Distortion, 0))),
				Polarizer: Math.max(0, Math.min(1, number(v.Polarizer, 0))),
				LUT: v.LUT || '',
				Cut: state.Cut
			};
		};

		/* Where any camera stands and looks, its angle for a picture of that aspect: {Position, Target, Up, Fov}; null for none. */
		engine.CameraPose = function (id, aspect) {
			var object = scene.Objects[id];
			var pose;

			if (!object || !(object.Kind === 'camera' || object.Traits && object.Traits.Camera)) return null;

			pose = Object.assign({}, state.Poses[id] || poseOf(object));
			pose.Fov = fovOf(valuesOf(object), aspect || 1);

			return pose;
		};

		/* A camera chosen by a call: flying to it in Fly seconds. */
		engine.UseCamera = function (id, options) {
			state.Next = {ID: id || '', Fly: options && options.Fly};
		};
	},

	/* The camera that shows the world (an ID; '' for the view of the scene), at once or flying to it in Fly seconds. */
	UseCamera: function (id, options) {
		var engine = this.Engine();
		if (engine && engine.UseCamera)
			engine.UseCamera(id || '', options || {});

		this.Camera = id || '';
	},

	/* The cameras of the scene: [{ID, Name, Active}]. */
	Cameras: function () {
		var self = this;

		return this.Objects('camera').map(function (object) {
			return {ID: object.ID, Name: object.Name || object.ID, Active: object.ID === self.Camera};
		});
	}
});
