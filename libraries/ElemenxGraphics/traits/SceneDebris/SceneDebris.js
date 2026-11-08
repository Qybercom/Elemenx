/*
 * SceneDebris: what breaks, and what is beamed away. Break(id, options) breaks a thing with a model into pieces that fly from where it was hit
 * (options Point, Normal, Force (1), Pieces (how many across: 3; of Pattern voronoi how many in all: 8), Pattern (grid, the
 * default: cells of a grid over it; voronoi: solid pieces of the cells of points scattered in it, smaller near the hit,
 * closed by the faces they broke along, of the color Inner (else of the thing, paler); parts: each piece of its model),
 * Seed (the same pieces for the same seed)), tumble, fall, bounce on the ground and stay a while
 * (Values.DebrisSeconds of the thing, 8) before they sink and go; its glass breaks into shards. The thing is gone (Remove)
 * and the scene tells break ({ID, Pieces, Point}). The Vitals of ElemenxGaming break what dies with Health.Death break.
 *
 * Teleport(id, place, options, callback) beams a thing with a model to a place ([x, y, z]; on a ground y is found): it
 * breaks up into sparkling grains from the top, glowing in the light of the beam, in a column of motes; then it gathers again
 * at the place the same way (options Seconds of each half, 1.4; Color of the beam). The event teleport tells each half
 * ({ID, Phase: out or in, From, To}); callback(error, {ID, At}) when it stands there.
 */
Elemenx.Trait('SceneDebris', {
	DebrisStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var head = '#version 300 es\nprecision highp float;\n';
		var shaders = this.DebrisShaders(head);
		var state = scene.Debris = {Pieces: [], Clock: 0, Beams: []};
		var program = null;

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/* A triangle cut into four, again while its sides are longer than so much: the shards of a glass. */
		function shards (a, b, c, longest, into) {
			var ab = vectors.Lerp(a, b, 0.5);
			var bc = vectors.Lerp(b, c, 0.5);
			var ca = vectors.Lerp(c, a, 0.5);

			if (into.length > 600 || Math.max(vectors.Distance(a, b), vectors.Distance(b, c), vectors.Distance(c, a)) <= longest) {
				into.push([a, b, c]);

				return;
			}

			/* Not quite in the middle: shards are never even. */
			ab = vectors.Lerp(ab, c, (Math.random() - 0.5) * 0.2);
			bc = vectors.Lerp(bc, a, (Math.random() - 0.5) * 0.2);
			ca = vectors.Lerp(ca, b, (Math.random() - 0.5) * 0.2);

			shards(a, ab, ca, longest, into);
			shards(ab, b, bc, longest, into);
			shards(ca, bc, c, longest, into);
			shards(ab, bc, ca, longest, into);
		}

		/* A piece: its triangles about its middle, how it flies and turns. */
		function piece (triangles, glass, hit, force, lasts) {
			var middle = [0, 0, 0];
			var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Indices: []};
			var reach = 0;
			var away;
			var spin;

			triangles.forEach(function (one) {
				middle = vectors.Add(middle, vectors.Scale(vectors.Add(one.Points[0], vectors.Add(one.Points[1], one.Points[2])), 1 / 3));
			});

			middle = vectors.Scale(middle, 1 / triangles.length);

			triangles.forEach(function (one) {
				var normal = vectors.Normalize(vectors.Cross(vectors.Subtract(one.Points[1], one.Points[0]), vectors.Subtract(one.Points[2], one.Points[0])));
				var base = geometry.Positions.length / 3;

				one.Points.forEach(function (p) {
					var q = vectors.Subtract(p, middle);

					reach = Math.max(reach, vectors.Length(q));

					geometry.Positions.push(q[0], q[1], q[2]);
					geometry.Normals.push(normal[0], normal[1], normal[2]);
					geometry.UVs.push(0, 0);
					geometry.Colors.push(one.Color[0], one.Color[1], one.Color[2], glass ? 0.32 : 1);
				});

				geometry.Indices.push(base, base + 1, base + 2);
			});

			away = vectors.Subtract(middle, hit);
			away = vectors.Length(away) > 1e-4 ? vectors.Normalize(away) : [0, 1, 0];
			spin = vectors.Normalize([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);

			return {Mesh: renderer ? renderer.Mesh(geometry) : null, At: middle, Turn: math.Identity(), Velocity: vectors.Add(vectors.Scale(away, (1.5 + Math.random() * 3.5) * force * (glass ? 1.4 : 1)), [0, (1 + Math.random() * 2.5) * force, 0]), Spin: spin, Rate: (2 + Math.random() * 8) * (glass ? 1.5 : 1), Reach: reach, Glass: glass, Born: state.Clock, Lasts: lasts + Math.random() * 1.5, Rest: false};
		}

		engine.Break = function (id, options) {
			var object = scene.Objects[id];
			var settings = options || {};
			var body = object ? engine.BodyOf(object) : null;
			var mesh;
			var size;
			var cells;
			var groups = {};
			var glassy = [];
			var hit;
			var made = [];
			var force = number(settings.Force, 1);
			var lasts = number(object && object.Values.DebrisSeconds, 8);
			var count;
			var i;

			if (!body)
				return false;

			mesh = body.Mesh;
			count = mesh.Pieces.length;
			size = vectors.Subtract(body.Max, body.Min);
			cells = Math.max(1, number(settings.Pieces, 3));
			hit = settings.Point || [(body.Min[0] + body.Max[0]) / 2, body.Min[1] + size[1] * 0.4, (body.Min[2] + body.Max[2]) / 2];

			/* Each triangle in the world, in the cell of the grid over the thing its middle is in; glass to its shards. */
			for (i = 0; i < count; i++) {
				var p = mesh.Points;
				var o = i * 9;
				var points = [0, 3, 6].map(function (k) {
					return vectors.Add(object.World, math.Apply(body.Base, [p[o + k], p[o + k + 1], p[o + k + 2]]));
				});
				var color = [mesh.Colors[i * 3], mesh.Colors[i * 3 + 1], mesh.Colors[i * 3 + 2]];
				var center = vectors.Scale(vectors.Add(points[0], vectors.Add(points[1], points[2])), 1 / 3);
				var key;

				if (mesh.Glass[i] || object.Values.Material === 'glass') {
					glassy.push({Points: points, Color: color});

					continue;
				}

				key = [0, 1, 2].map(function (axis) {
					return Math.min(cells - 1, Math.floor((center[axis] - body.Min[axis]) / Math.max(1e-6, size[axis]) * cells));
				}).join(':');

				groups[key] = groups[key] || [];

				groups[key].push({Points: points, Color: color});
			}

			/*
			 * Voronoi (Pattern voronoi): solid pieces, smaller near the hit, each closed by the faces it broke along, of the raw
			 * color inside (Inner); parts (Pattern parts): each piece of its model on its own, as it was made.
			 */
			if (settings.Pattern === 'voronoi') {
				var cutter = self.$Service('SceneShards');
				var surface = [];
				var inner = settings.Inner || null;

				Object.keys(groups).forEach(function (key) {
					surface = surface.concat(groups[key]);
				});

				groups = {};

				cutter.Pieces(surface, cutter.Seeds(body.Min, body.Max, Math.max(2, number(settings.Pieces, 8)), hit, {Seed: settings.Seed})).forEach(function (one, index) {
					var middle = [0, 0, 0];
					var raw = inner;

					one.Corners.forEach(function (p) {
						middle = vectors.Add(middle, p);
					});

					middle = vectors.Scale(middle, 1 / one.Corners.length);

					/* What is inside, of no color told: the color of the thing, paler and duller. */
					if (!raw) {
						raw = [0, 0, 0];

						one.Surface.forEach(function (face) {
							raw = vectors.Add(raw, vectors.Scale(face.Color, 1 / one.Surface.length));
						});

						raw = [raw[0] * 0.8 + 0.12, raw[1] * 0.8 + 0.11, raw[2] * 0.8 + 0.1];
					}

					/* The faces it broke along: its hull a little inside its faces, so only what has none shows it. */
					groups['v' + index] = one.Surface.concat(cutter.Hull(one.Corners).map(function (face) {
						return {Points: face.map(function (p) {
							return vectors.Lerp(middle, p, 0.985);
						}), Color: raw};
					}));
				});
			}
			else if (settings.Pattern === 'parts') {
				var owners = [];

				groups = {};

				for (i = 0; i < count; i++) {
					var at = i * 9;
					var corners = [0, 3, 6].map(function (k) {
						return vectors.Add(object.World, math.Apply(body.Base, [mesh.Points[at + k], mesh.Points[at + k + 1], mesh.Points[at + k + 2]]));
					});

					if (mesh.Glass[i] || object.Values.Material === 'glass') continue;

					if (owners.indexOf(mesh.Pieces[i]) === -1)
						owners.push(mesh.Pieces[i]);

					groups['p' + owners.indexOf(mesh.Pieces[i])] = groups['p' + owners.indexOf(mesh.Pieces[i])] || [];

					groups['p' + owners.indexOf(mesh.Pieces[i])].push({Points: corners, Color: [mesh.Colors[i * 3], mesh.Colors[i * 3 + 1], mesh.Colors[i * 3 + 2]]});
				}
			}

			Object.keys(groups).forEach(function (key) {
				made.push(piece(groups[key], false, hit, force, lasts));
			});

			glassy.forEach(function (one) {
				var cut = [];

				shards(one.Points[0], one.Points[1], one.Points[2], Math.max(0.05, Math.max(size[0], size[1], size[2]) / 8), cut);

				cut.forEach(function (shard) {
					made.push(piece([{Points: shard, Color: one.Color}], true, hit, force, lasts * 0.6));
				});
			});

			state.Pieces = state.Pieces.concat(made);

			if (self.Burst)
				self.Burst(glassy.length ? 'hit-glass' : 'hit-dust', hit, {Size: Math.max(1, Math.max(size[0], size[1], size[2]))});

			self.Remove(id);

			self.$Emit('break', {ID: id, Pieces: made.length, Point: hit});

			return made.length;
		};

		self.Effects({
			transporter: {Lamp: {Color: '#a8dcff', Power: 0.9, Radius: 9, Flicker: 0.25}, Once: true, Lasts: 1.6, Layers: [
				{Kind: 'beam', Life: 1.6, Speed: [2.4, 2.4], Size: [0.75, 0.75], Hollow: 0.55, Soft: 2, Color: [0.35, 0.65, 1], Hot: [0.9, 0.97, 1], Blend: 'add'},
				{Kind: 'mote', Count: 140, Life: 1.5, Speed: [0.2, 1.4], Spread: 0.5, Rise: 1.2, Drag: 0.6, Size: [0.035, 0.008], Wander: 1.4, Color: [0.75, 0.9, 1], Blend: 'add', Base: 4},
				{Kind: 'spark', Count: 50, Life: 0.9, Speed: [0.3, 1.6], Spread: 1.2, Rise: 1.5, Drag: 1.2, Size: [0.01, 0.004], Stretch: 0.02, Wander: 0.8, Color: [1, 0.92, 0.7], Blend: 'add'}
			]}
		});

		function colorOf (text) {
			var hex = String(text || '').replace('#', '');

			return /^[0-9a-f]{6}$/i.test(hex) ? [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255] : [0.62, 0.86, 1];
		}

		/* A beaming: away from where it stands, then to the place. */
		engine.Teleport = function (id, place, options, callback) {
			var object = scene.Objects[id];
			var settings = options || {};
			var body = object ? engine.BodyOf(object) : null;
			var field = scene.Ground ? scene.Ground.Field : null;
			var to;

			if (!object || !object.World || !Array.isArray(place)) {
				if (callback)
					callback(new Error('Elemenx Scene: nothing to teleport'));

				return false;
			}

			to = [Number(place[0]) || 0, place[1] === undefined || place[1] === null ? field ? Math.max(0, field.Height(place[0], place[2])) : 0 : Number(place[1]), Number(place[2]) || 0];

			state.Beams = state.Beams.filter(function (one) {
				return one.ID !== id;
			});

			state.Beams.push({ID: id, Phase: 'out', Start: state.Clock, Seconds: Math.max(0.2, number(settings.Seconds, 1.4)), From: object.World.slice(), To: to, Height: body ? body.Max[1] - body.Min[1] : Math.max(1, object.Size || 1), Color: colorOf(settings.Color), Seed: Math.random() * 100, Callback: callback || null});

			if (self.Burst)
				self.Burst('transporter', object.World.slice(), {Size: body ? Math.max(0.6, (body.Max[1] - body.Min[1]) / 1.8) : 1});

			self.$Emit('teleport', {ID: id, Phase: 'out', From: object.World.slice(), To: to});

			return true;
		};

		function beam () {
			state.Beams = state.Beams.filter(function (one) {
				var object = scene.Objects[one.ID];
				var t = (state.Clock - one.Start) / one.Seconds;
				var space;

				if (!object)
					return false;

				if (one.Phase === 'out' && t >= 1) {
					/* Gone from here: it stands at the place, still dissolved, and gathers. */
					space = scene.Ways || {};
					delete space[one.ID];

					object.World = one.To.slice();

					if (object.Values.X !== undefined || scene.Ground) {
						object.Values.X = one.To[0];
						object.Values.Y = one.To[2];
					}

					one.Phase = 'in';
					one.Start = state.Clock;
					t = 0;

					if (self.Burst)
						self.Burst('transporter', one.To.slice(), {Size: Math.max(0.6, one.Height / 1.8)});

					self.$Emit('teleport', {ID: one.ID, Phase: 'in', From: one.From, To: one.To});
				}

				if (one.Phase === 'in' && t >= 1) {
					delete object.Dissolve;

					if (one.Callback)
						one.Callback(null, {ID: one.ID, At: object.World.slice()});

					return false;
				}

				object.Dissolve = {Amount: one.Phase === 'out' ? Math.min(1, t) : Math.max(0.001, 1 - t), Base: object.World[1], Height: one.Height, Color: one.Color, Seed: one.Seed + state.Clock * 4};

				return true;
			});
		}

		/* The pieces fly, turn and fall; on the ground they bounce, slide and come to rest. */
		engine.DebrisStep = function (elapsed) {
			var field = scene.Ground ? scene.Ground.Field : null;

			state.Clock += elapsed;

			beam();

			state.Pieces = state.Pieces.filter(function (one) {
				var floor;

				if (state.Clock - one.Born > one.Lasts) {
					if (one.Mesh)
						one.Mesh.Destroy();

					return false;
				}

				if (one.Rest) return true;

				one.Velocity[1] -= 9.81 * elapsed;
				one.At = vectors.Add(one.At, vectors.Scale(one.Velocity, elapsed));
				one.Turn = math.Multiply(math.Rotation(one.Spin, one.Rate * elapsed), one.Turn);

				floor = field ? Math.max(field.Height(one.At[0], one.At[2]), field.Water ? -2 : -1e9) : -1e9;

				if (one.At[1] - one.Reach * 0.35 < floor) {
					one.At[1] = floor + one.Reach * 0.35;
					one.Velocity = [one.Velocity[0] * 0.55, Math.abs(one.Velocity[1]) * 0.28, one.Velocity[2] * 0.55];
					one.Rate *= 0.6;

					if (Math.abs(one.Velocity[1]) < 0.4 && Math.hypot(one.Velocity[0], one.Velocity[2]) < 0.3)
						one.Rest = true;
				}

				return true;
			});
		};

		engine.DebrisDraw = function (matrix) {
			var eye = scene.Eye || [0, 0, 0];
			var ground = scene.Ground;

			if (!renderer || !state.Pieces.length) return;

			program = program || renderer.Program(shaders.DebrisVertex, shaders.Debris);

			/* The solid pieces first, then the glass over them. */
			[false, true].forEach(function (glass) {
				state.Pieces.forEach(function (one) {
					var age = state.Clock - one.Born;
					var sink = Math.max(0, age - (one.Lasts - 1.2)) / 1.2;
					var model;

					if (one.Glass !== glass || !one.Mesh) return;

					model = math.Multiply(math.Translation(one.At[0] - eye[0], one.At[1] - eye[1] - sink * one.Reach, one.At[2] - eye[2]), math.Multiply(one.Turn, math.Scaling(1 - sink * 0.6, 1 - sink * 0.6, 1 - sink * 0.6)));

					renderer.Draw(one.Mesh, program, {uViewProjection: matrix, uModel: model, uSun: ground ? ground.Sun : [0.3, 0.8, 0.5], uSunColor: ground ? ground.SunColor : [1, 1, 1], uSky: ground ? ground.SkyLight : [0.3, 0.3, 0.32], uGlass: glass ? 1 : 0}, glass ? {Blend: 'over', DepthWrite: false, Cull: 'none'} : {Cull: 'none'});
				});
			});
		};
	},

	/* Breaks a thing with a model into pieces that fly from the point hit: Break(id, {Point, Normal, Force, Pieces, Pattern, Inner, Seed}). How many pieces, or false. */
	Break: function (id, options) {
		var engine = this.Engine();

		return engine && engine.Break ? engine.Break(id, options) : false;
	},

	/* Beams a thing to a place: Teleport(id, [x, y, z], {Seconds, Color}, callback); false when there is nothing to beam. */
	Teleport: function (id, place, options, callback) {
		var engine = this.Engine();

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		return !!(engine && engine.Teleport && engine.Teleport(id, place, options, callback));
	},

	/* The pieces of what broke that are still there. */
	Debris: function () {
		var state = this.Scene().Debris;

		return state ? state.Pieces.length : 0;
	},

	DebrisShaders: function (head) {
		return {
			DebrisVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform mat4 uModel;',
				'out vec3 vNormal;',
				'out vec4 vColor;',
				'out vec3 vAt;',
				'void main() {',
				'	vec4 world = uModel * vec4(aPosition, 1.0);',
				'	vNormal = mat3(uModel) * aNormal;',
				'	vColor = aColor;',
				'	vAt = world.xyz;',
				'	gl_Position = uViewProjection * world;',
				'}'
			].join('\n'),

			/* A piece, lit by the sun and the sky on both its sides; glass with a gleam where it faces the sun from the eye. */
			Debris: head + [
				'in vec3 vNormal;',
				'in vec4 vColor;',
				'in vec3 vAt;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSky;',
				'uniform float uGlass;',
				'out vec4 outColor;',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(-vAt);',
				'	if (dot(n, v) < 0.0) n = -n;',
				'	vec3 sun = normalize(uSun);',
				'	vec3 color = pow(min(vColor.rgb, vec3(1.0)), vec3(2.2));',
				'	vec3 light = uSky * (0.6 + 0.4 * n.y) + uSunColor * max(dot(n, sun), 0.0);',
				'	if (uGlass > 0.5) {',
				'		float gleam = pow(max(dot(reflect(-sun, n), v), 0.0), 60.0);',
				'		outColor = vec4(pow(color * light * 0.6 + uSunColor * gleam * 4.0, vec3(1.0 / 2.2)), vColor.a + gleam * 0.5);',
				'		return;',
				'	}',
				/* The picture of the scene keeps its colors as the eye sees them (gamma), and what moves has no alpha. */
				'	outColor = vec4(pow(color * light, vec3(1.0 / 2.2)), 0.0);',
				'}'
			].join('\n')
		};
	}
});
