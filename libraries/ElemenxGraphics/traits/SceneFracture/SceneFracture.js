/*
 * SceneFracture: what breaks as a thing of its material does, a physical property of it, not a rule of a game. An object
 * with the trait Fracture ({Material, Toughness, Integrity (1), Pattern (voronoi, parts or grid), Pieces (8), Inner (the
 * color inside), Impacts (true: struck hard it is hurt too)}) holds a share of itself whole (Integrity, from 1 to 0): what
 * hits it (a shot, a blast, Damage) takes from it as much as its strength lets, its strength being the toughness of its
 * material times its size. Each blow cracks it where it struck, as its material cracks (Fractures: glass a star, stone
 * and concrete a web, wood splinters along its grain, metal dents, fabric tears), the cracks reaching farther as less of
 * it is whole; at nothing it breaks into pieces (Break of SceneDebris, by its Pattern).
 *
 * The Material is the one of the trait, else Values.Material of the object, else stone. Fractures(materials) gives the
 * table ({name: {Toughness, Pattern (radial, web, splinter, dent, tear), Inner, Light (lines lighter than it: glass)}})
 * after setting those given. Damage(id, amount, hit) ({Point, Normal, Kind: kinetic, explosive or impact}) takes from it:
 * what is left of it, 0 when it broke, null when it has no Fracture; Integrity(id) what is left. The scene tells crack
 * ({ID, Integrity, Point, Amount}) at each blow it lives through and break when it breaks. A shot of SceneWeapons and a
 * hard touch of the Physics (Impulse over 40 N s) hurt it by themselves. Health (Vitals of ElemenxGaming) is another
 * thing: a game may join them (Damage from a hit of its own, Break at a death).
 */
Elemenx.Trait('SceneFracture', {
	FractureStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var state = scene.Fracture = {Things: {}, Version: 0, Built: -1, Mesh: null, Program: null, Clock: 0};
		var kinds = {radial: 0, web: 1, splinter: 2, dent: 3, tear: 4};

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function traitOf (object) {
			return object && object.Traits && object.Traits.Fracture ? object.Traits.Fracture : null;
		}

		function rotate (matrix, v) {
			return [matrix[0] * v[0] + matrix[4] * v[1] + matrix[8] * v[2], matrix[1] * v[0] + matrix[5] * v[1] + matrix[9] * v[2], matrix[2] * v[0] + matrix[6] * v[1] + matrix[10] * v[2]];
		}

		/* What a thing is made of, and how strong it is: the toughness of its material times its size (metres, round its volume). */
		function own (object) {
			var settings = traitOf(object);
			var name = String(settings.Material || object.Values.Material || 'stone');
			var material = self.Fractures()[name] || self.Fractures().stone;
			var body = engine.BodyOf ? engine.BodyOf(object) : null;
			var size = body ? vectors.Subtract(body.Max, body.Min) : [object.Size || 1, object.Size || 1, object.Size || 1];
			var bulk = Math.max(0.5, Math.min(4, Math.pow(Math.max(1e-3, size[0] * size[1] * size[2]), 1 / 3)));

			return {Name: name, Material: material, Strength: number(settings.Toughness, material.Toughness) * 100 * bulk, Size: Math.max(size[0], size[1], size[2]), Body: body};
		}

		function thing (id) {
			var object = scene.Objects[id];
			if (!traitOf(object)) return null;

			/* Of this very object: one added again under the same ID is whole again. */
			if (!state.Things[id] || state.Things[id].Object !== object)
				state.Things[id] = {Object: object, Integrity: Math.max(0, Math.min(1, number(traitOf(object).Integrity, 1))), Cracks: []};

			return state.Things[id];
		}

		engine.Damage = function (id, amount, hit) {
			var object = scene.Objects[id];
			var held = thing(id);
			var settings = traitOf(object);
			var given = hit || {};
			var made;
			var loss;
			var point;
			var normal;
			var turn;

			if (!held)
				return null;

			if (held.Integrity <= 0) return 0;

			made = own(object);
			/* A blast shatters what is brittle more than a shot does. */
			loss = Math.max(0, number(amount, 0)) / made.Strength * (given.Kind === 'explosive' && made.Material.Toughness < 1 ? 1.5 : 1);
			held.Integrity = Math.max(0, held.Integrity - loss);
			point = given.Point || (made.Body ? vectors.Scale(vectors.Add(made.Body.Min, made.Body.Max), 0.5) : object.World || [0, 0, 0]);
			normal = given.Normal || [0, 1, 0];

			if (held.Integrity <= 0) {
				delete state.Things[id];
				state.Version++;

				self.Break(id, {Point: point, Normal: normal, Force: 1 + Math.min(3, loss), Pattern: settings.Pattern || 'voronoi', Pieces: number(settings.Pieces, 8), Inner: settings.Inner || made.Material.Inner || null});

				return 0;
			}

			/* A crack where it struck, kept in its own space so it goes with it, as large as the blow and the thing. */
			turn = object.Turn || null;

			/* Not placed yet (added this frame): kept in the world, taken into its space when it is. */
			held.Cracks.push({Local: object.World ? turn ? rotate(math.Invert(turn), vectors.Subtract(point, object.World)) : vectors.Subtract(point, object.World) : null, LocalNormal: object.World && turn ? rotate(math.Invert(turn), normal) : normal.slice(), Placed: object.World ? null : point.slice(), Size: Math.min(made.Size * 0.4, 0.3 + loss * 4) * (made.Material.Pattern === 'dent' ? 0.35 : made.Material.Pattern === 'tear' ? 0.5 : 1), Seed: Math.random(), Kind: kinds[made.Material.Pattern] || 0, Light: made.Material.Light ? 1 : 0});

			while (held.Cracks.length > 12)
				held.Cracks.shift();

			state.Version++;

			self.$Emit('crack', {ID: id, Integrity: held.Integrity, Point: point, Amount: number(amount, 0)});

			return held.Integrity;
		};

		engine.Integrity = function (id) {
			var held = thing(id);

			return held ? held.Integrity : null;
		};

		/* A shot hurts what it hit; a hard touch both things that touched. */
		self.$On('hit', function (event) {
			if (event && event.Target && traitOf(scene.Objects[event.Target]))
				engine.Damage(event.Target, event.Amount, {Point: event.Point, Normal: event.Normal, Kind: event.Type});
		});

		self.$On('touch', function (event) {
			var hurt = event ? (number(event.Impulse, 0) - 40) * 0.3 : 0;
			if (hurt <= 0) return;

			[event.ID, event.With].forEach(function (id) {
				var object = id ? scene.Objects[id] : null;
				if (traitOf(object) && traitOf(object).Impacts !== false)
					engine.Damage(id, hurt, {Point: event.At, Normal: event.Normal, Kind: 'impact'});
			});
		});

		/* The cracks: one mesh, made again when one comes or goes, or when a thing that has one moved. */
		engine.FractureDraw = function (matrix) {
			var ground = scene.Ground;
			var list = [];
			var moved = false;

			if (!renderer) return;

			Object.keys(state.Things).forEach(function (id) {
				var object = scene.Objects[id];
				var held = state.Things[id];
				var grow;

				if (!object || object !== held.Object) {
					delete state.Things[id];
					moved = true;

					return;
				}

				/* Not placed yet: its cracks wait for it. */
				if (!object.World) return;

				grow = Math.min(1, 0.35 + (1 - held.Integrity) * 0.9);

				held.Cracks.forEach(function (one) {
					var turn = object.Turn || null;
					var point;

					if (one.Placed) {
						one.Local = turn ? rotate(math.Invert(turn), vectors.Subtract(one.Placed, object.World)) : vectors.Subtract(one.Placed, object.World);
						one.LocalNormal = turn ? rotate(math.Invert(turn), one.LocalNormal) : one.LocalNormal;
						one.Placed = null;
					}

					point = vectors.Add(object.World, turn ? rotate(turn, one.Local) : one.Local);

					if (!one.Point || vectors.Distance(point, one.Point) > 0.001 || one.Grow !== grow) {
						one.Point = point;
						one.Normal = vectors.Normalize(turn ? rotate(turn, one.LocalNormal) : one.LocalNormal);
						one.Up = vectors.Normalize(turn ? rotate(turn, [0, 1, 0]) : [0, 1, 0]);
						one.Grow = grow;
						moved = true;
					}

					list.push(one);
				});
			});

			if (!list.length) return;

			if (moved || state.Built !== state.Version || !state.Mesh) {
				var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Indices: []};

				list.forEach(function (one, index) {
					var n = one.Normal;
					/* Its square turned so its y goes up the thing, as the grain of wood does (sideways where it faces up). */
					var up = Math.abs(vectors.Dot(one.Up, n)) > 0.9 ? [1, 0, 0] : one.Up;
					var a = vectors.Normalize(vectors.Cross(up, n));
					var b = vectors.Cross(n, a);
					var lift = vectors.Add(one.Point, vectors.Scale(n, 0.008 + index * 0.00002));

					[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
						var p = vectors.Add(lift, vectors.Add(vectors.Scale(a, corner[0] * one.Size), vectors.Scale(b, corner[1] * one.Size)));

						geometry.Positions.push(p[0], p[1], p[2]);
						geometry.Normals.push(n[0], n[1], n[2]);
						geometry.UVs.push(corner[0], corner[1]);
						geometry.Colors.push(one.Kind, one.Seed, one.Grow, one.Light);
					});

					geometry.Indices.push(index * 4, index * 4 + 1, index * 4 + 2, index * 4, index * 4 + 2, index * 4 + 3);
				});

				if (state.Mesh)
					state.Mesh.Destroy();

				state.Mesh = renderer.Mesh(geometry);
				state.Built = state.Version;
			}

			state.Program = state.Program || renderer.Program(self.FractureShaders().Vertex, self.FractureShaders().Crack);

			engine.DrawReady(state.Mesh, state.Program, {uViewProjection: matrix, uEye: scene.Eye || [0, 0, 0], uSun: ground ? ground.Sun : [0.3, 0.8, 0.5], uSunColor: ground ? ground.SunColor : [1, 1, 1], uSky: ground ? ground.SkyLight : [0.3, 0.3, 0.32]}, {Blend: 'over', DepthWrite: false, Depth: 'lequal', Cull: 'none'});
		};
	},

	/* The materials as they break (see the head): the table, after setting those given ({name: {Toughness, Pattern, Inner, Light}}). */
	Fractures: function (materials) {
		var scene = this.Scene();

		scene.Fractures = scene.Fractures || {
			glass: {Toughness: 0.12, Pattern: 'radial', Inner: [0.82, 0.9, 0.95], Light: true},
			ice: {Toughness: 0.3, Pattern: 'radial', Inner: [0.86, 0.93, 1], Light: true},
			ceramic: {Toughness: 0.25, Pattern: 'web', Inner: [0.94, 0.93, 0.9]},
			wood: {Toughness: 0.5, Pattern: 'splinter', Inner: [0.78, 0.62, 0.42]},
			plastic: {Toughness: 0.4, Pattern: 'web', Inner: [0.85, 0.85, 0.85]},
			brick: {Toughness: 0.9, Pattern: 'web', Inner: [0.62, 0.36, 0.26]},
			concrete: {Toughness: 1.1, Pattern: 'web', Inner: [0.66, 0.65, 0.61]},
			stone: {Toughness: 1.3, Pattern: 'web', Inner: [0.6, 0.58, 0.55]},
			metal: {Toughness: 3, Pattern: 'dent', Inner: [0.55, 0.55, 0.57]},
			fabric: {Toughness: 0.3, Pattern: 'tear', Inner: [0.5, 0.48, 0.45]}
		};

		Object.keys(materials || {}).forEach(function (name) {
			scene.Fractures[name] = Object.assign({}, scene.Fractures[name] || {Toughness: 1, Pattern: 'web'}, materials[name]);
		});

		return scene.Fractures;
	},

	/* Takes from what is whole of a thing with the trait Fracture: Damage(id, amount, {Point, Normal, Kind}). What is left, 0 broken, null none. */
	Damage: function (id, amount, hit) {
		var engine = this.Engine();

		return engine && engine.Damage ? engine.Damage(id, amount, hit) : null;
	},

	/* What is whole of a thing with the trait Fracture (1 to 0), null when it has none. */
	Integrity: function (id) {
		var engine = this.Engine();

		return engine && engine.Integrity ? engine.Integrity(id) : null;
	},

	FractureShaders: function () {
		var head = '#version 300 es\nprecision highp float;\n';

		return {
			Vertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'out vec2 vAt;',
				'out vec4 vCrack;',
				'out vec3 vNormal;',
				'void main() {',
				'	vAt = aUV;',
				'	vCrack = aColor;',
				'	vNormal = aNormal;',
				'	gl_Position = uViewProjection * vec4(aPosition - uEye, 1.0);',
				'}'
			].join('\n'),

			/*
			 * A crack of its kind, out to as far as it has grown (vCrack.z): a star of lines and a ring (radial: glass, ice);
			 * jagged lines that fork, a few chips gone (web: stone, concrete); long cracks up and down with splinters
			 * (splinter: wood, its y the grain); a dent, dark with a bright rim (metal); a hole with a ragged edge (fabric).
			 */
			Crack: head + [
				'in vec2 vAt;',
				'in vec4 vCrack;',
				'in vec3 vNormal;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSky;',
				'out vec4 outColor;',
				'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
				'float noise(float x) {',
				'	float i = floor(x);',
				'	float f = fract(x);',
				'	return mix(hash(vec2(i, 1.7)), hash(vec2(i + 1.0, 1.7)), f * f * (3.0 - 2.0 * f));',
				'}',
				/* How near a point is to a crack from start along a way, bent as it goes, out to reach. */
				'float crackLine(vec2 at, vec2 start, float angle, float reach, float bend, float seed, float width, float px) {',
				'	vec2 d = vec2(cos(angle), sin(angle));',
				'	vec2 q = at - start;',
				'	float along = dot(q, d);',
				'	float off = dot(q, vec2(-d.y, d.x)) - (noise(along * 9.0 + seed) - 0.5) * bend * along - (noise(along * 31.0 + seed * 3.0) - 0.5) * bend * 0.08;',
				'	return step(0.0, along) * (1.0 - smoothstep(reach * 0.85, reach, along)) * (1.0 - smoothstep(width * 0.5, width * 0.5 + px * 1.5, abs(off)));',
				'}',
				'void main() {',
				'	float kind = vCrack.x;',
				'	float seed = vCrack.y * 97.0;',
				'	float grow = vCrack.z;',
				/* A pixel, in the units of the square: taken here, where every pixel goes, never in a branch. */
				'	float px = length(fwidth(vAt));',
				'	float r = length(vAt);',
				'	float lines = 0.0;',
				'	float shade = 0.0;',
				'	vec3 color = mix(vec3(0.03, 0.028, 0.025), vec3(0.92, 0.96, 1.0), vCrack.w);',
				'	float alpha = 0.0;',
				'	if (kind < 0.5) {',
				'		for (int k = 0; k < 9; k++) {',
				'			float a = (float(k) + hash(vec2(seed, float(k)))) / 9.0 * 6.2832;',
				'			lines = max(lines, crackLine(vAt, vec2(0.0), a, grow * (0.6 + 0.4 * hash(vec2(float(k), seed))), 0.25, seed + float(k), 0.025, px));',
				'		}',
				/* Rings broken between the lines: an arc in some of the sectors, each at a radius of its own. */
				'		float sector = floor((atan(vAt.y, vAt.x) + 3.1416) / 6.2832 * 9.0);',
				'		float r1 = grow * (0.22 + 0.16 * hash(vec2(sector, seed)));',
				'		float r2 = grow * (0.5 + 0.2 * hash(vec2(sector, seed + 5.0)));',
				'		lines = max(lines, (1.0 - smoothstep(0.006, 0.006 + px * 1.5, abs(r - r1 - (noise(atan(vAt.y, vAt.x) * 20.0 + seed) - 0.5) * 0.03))) * step(0.35, hash(vec2(sector, seed + 2.0))) * 0.8);',
				'		lines = max(lines, (1.0 - smoothstep(0.006, 0.006 + px * 1.5, abs(r - r2 - (noise(atan(vAt.y, vAt.x) * 20.0 + seed) - 0.5) * 0.04))) * step(0.55, hash(vec2(sector, seed + 7.0))) * 0.55 * step(0.6, grow));',
				'		alpha = max(lines, 1.0 - smoothstep(0.03, 0.07, r)) * 0.85;',
				'	}',
				'	else if (kind < 1.5) {',
				'		for (int k = 0; k < 6; k++) {',
				'			float a = (float(k) + hash(vec2(seed, float(k)))) / 6.0 * 6.2832;',
				'			float l = grow * (0.55 + 0.45 * hash(vec2(float(k), seed)));',
				'			vec2 fork = vec2(cos(a), sin(a)) * l * 0.5;',
				'			lines = max(lines, crackLine(vAt, vec2(0.0), a, l, 0.9, seed + float(k), 0.035, px));',
				'			lines = max(lines, crackLine(vAt, fork, a + (hash(vec2(seed, float(k) + 9.0)) - 0.5) * 1.6, l * 0.45, 0.9, seed + float(k) * 7.0, 0.028, px));',
				'		}',
				/* Chips gone where it struck: a darker middle with a ragged edge. */
				'		shade = 1.0 - smoothstep(0.08 * grow, 0.16 * grow + noise(atan(vAt.y, vAt.x) * 4.0 + seed) * 0.08, r);',
				'		alpha = max(lines * 0.9, shade * 0.7);',
				'	}',
				'	else if (kind < 2.5) {',
				'		for (int k = 0; k < 7; k++) {',
				'			float x = (hash(vec2(seed, float(k))) - 0.5) * 0.7 * grow;',
				'			float l = grow * (0.7 + 0.6 * hash(vec2(float(k), seed)));',
				'			lines = max(lines, crackLine(vAt, vec2(x, -l * 0.5), 1.5708 + (hash(vec2(float(k), seed + 3.0)) - 0.5) * 0.15, l, 0.35, seed + float(k), 0.03, px));',
				'		}',
				/* Splinters standing out of the middle: light, along the grain. */
				'		float splinter = step(0.6, hash(vec2(floor(vAt.x * 30.0), seed))) * (1.0 - smoothstep(0.05, 0.25 * grow, abs(vAt.x))) * (1.0 - smoothstep(0.1, 0.4 * grow, abs(vAt.y)));',
				'		color = mix(color, vec3(0.8, 0.66, 0.45), splinter);',
				'		alpha = max(lines * 0.9, splinter * 0.9);',
				'	}',
				'	else if (kind < 3.5) {',
				'		float dent = 1.0 - smoothstep(0.2 * grow, 0.45 * grow, r);',
				'		float rim = smoothstep(0.3 * grow, 0.45 * grow, r) * (1.0 - smoothstep(0.45 * grow, 0.6 * grow, r));',
				'		color = mix(vec3(0.85, 0.85, 0.84), vec3(0.08, 0.08, 0.09), dent);',
				'		alpha = max(dent * 0.6, rim * 0.5);',
				'	}',
				'	else {',
				'		float edge = 0.25 * grow + (noise(atan(vAt.y, vAt.x) * 6.0 + seed) - 0.5) * 0.12 * grow;',
				'		float hole = 1.0 - smoothstep(edge - 0.01, edge + 0.01, r);',
				'		float fray = (1.0 - smoothstep(edge, edge + 0.08, r)) * step(0.5, hash(vec2(floor(atan(vAt.y, vAt.x) * 40.0), seed)));',
				'		color = mix(vec3(0.7, 0.66, 0.6), vec3(0.01), hole);',
				'		alpha = max(hole, fray * 0.7);',
				'	}',
				'	if (r > 1.0) alpha = 0.0;',
				'	if (alpha < 0.01) discard;',
				'	vec3 n = normalize(vNormal);',
				'	vec3 light = uSky * 1.2 + uSunColor * max(dot(n, normalize(uSun)), 0.0);',
				'	outColor = vec4(pow(pow(color, vec3(2.2)) * light, vec3(1.0 / 2.2)), alpha);',
				'}'
			].join('\n')
		};
	}
});
