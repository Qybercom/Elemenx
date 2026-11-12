/*
 * SceneDeepSpace: what else a star system holds, each an object of its own kind that can be pointed at and picked as any
 * other (hover, select, the card of Describe), never landed on.
 *
 * - blackhole (BlackHole: Mass (Suns, 10), Disk (true), Inner and Outer (the disc, in radii of its horizon: 3 and 14), Tilt
 *   (degrees), Color ('' : the hot white-gold of a disc), Brightness): drawn as light bends round it, each ray of the view
 *   followed through its pull: the shadow, the ring of light that went round it, the disc seen over and under it at once,
 *   its near side brighter and bluer as it comes toward the eye, the sky behind it drawn out round its edge.
 * - wormhole (Wormhole: Radius (of its mouth, as of a planet: 1), Cosmos (the sky of the other side: a Kind or {Kind,
 *   Seed}), Star (the color of the star there, '' for none), Leads (what it leads to, for its card)): a ball through which
 *   the other side shows as it is, its sky and its star, drawn round its edge; the sky here bent round it. A ship that
 *   flies into it goes through (event through); To, the ID of another mouth, is where it comes out.
 * - comet (Comet: Radius (km of its nucleus, 5), Tail (1), Color (of its dust), Ion (of its gas)): on its long orbit,
 *   a coma round it and its two tails away from the star, longer the nearer it comes: the gas straight back, the dust bent
 *   along its way.
 * - quasar (Quasar: Azimuth, Elevation (degrees of its place on the sky), Color, Brightness, Jets (true)): a point far beyond
 *   all, its two jets across the sky.
 * Their Info (Describe, the card): of a black hole its horizon and its innermost orbit, of a wormhole where it leads, of a
 * comet its distance from the star.
 */
Elemenx.Trait('SceneDeepSpace', {
	DeepSpaceStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var self = this;
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var head = '#version 300 es\nprecision highp float;\n';
		var shaders = this.DeepSpaceShaders(head);
		var programs = null;
		var quad = null;
		var empty = null;

		/* A cube of nothing for a sky that is not there: a sampler of a cube must read one. */
		function blank () {
			empty = empty || renderer.Cube(4);

			return empty;
		}

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function trait (object, name) {
			return object && object.Traits ? object.Traits[name] || null : null;
		}

		function colorOf (text, fallback) {
			var hex = String(text || '').replace('#', '');

			return /^[0-9a-f]{6}$/i.test(hex) ? [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255] : fallback;
		}

		/*
		 * What flies into the mouth of a wormhole goes through: the scene tells through ({ID, Wormhole, Leads, To}); with To
		 * (the ID of the other mouth) it comes out of that one, on the same way; it goes through once till it is out again.
		 * The place it comes out at, or null.
		 */
		engine.DeepPass = function (object, at) {
			var exit = null;

			scene.Active.forEach(function (other) {
				var mouth = trait(other, 'Wormhole');
				var into;
				var far;
				var pair;

				if (!mouth || !other.World || other === object || exit) return;

				far = vectors.Distance(at, other.World);

				if (far > other.Size * 0.85) {
					if (object.InMouth === other.ID && far > other.Size * 1.5)
						object.InMouth = '';

					return;
				}

				if (object.InMouth === other.ID) return;

				pair = mouth.To ? scene.Objects[mouth.To] : null;
				into = far > 1e-6 ? vectors.Scale(vectors.Subtract(at, other.World), 1 / far) : [0, 0, 1];

				self.$Emit('through', {ID: object.ID, Wormhole: other.ID, Leads: mouth.Leads || '', To: pair ? pair.ID : ''});

				if (!pair || !pair.World) {
					object.InMouth = other.ID;

					return;
				}

				/* Out of the far side of the other mouth, as it went in on this side. */
				object.InMouth = pair.ID;
				exit = vectors.Subtract(pair.World, vectors.Scale(into, pair.Size * 1.2));
			});

			return exit;
		};

		/* A quasar stands on the sky, beyond everything: its place goes with the eye. */
		engine.DeepPlace = function () {
			var far = scene.Camera.Far * 0.5;

			scene.Active.forEach(function (object) {
				var quasar = trait(object, 'Quasar');
				var azimuth;
				var elevation;

				if (!quasar) return;

				azimuth = number(quasar.Azimuth, 40) * Math.PI / 180;
				elevation = number(quasar.Elevation, 20) * Math.PI / 180;
				object.Way = [Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.cos(azimuth)];
				object.World = vectors.Add(scene.Eye || [0, 0, 0], vectors.Scale(object.Way, far));
				object.Size = 0;
			});
		};

		/* The nearest star of an object: what its tail turns away from. */
		function starOf (object) {
			var best = null;

			scene.Active.forEach(function (other) {
				if (trait(other, 'Star') && other.World && (!best || vectors.Distance(other.World, object.World) < vectors.Distance(best.World, object.World)))
					best = other;
			});

			return best;
		}

		/* A ribbon of a tail, facing the eye, from a point along a curve. */
		function tail (geometry, points, width, color, eye) {
			var i;

			for (i = 0; i < points.length - 1; i++) {
				var a = vectors.Subtract(points[i], eye);
				var b = vectors.Subtract(points[i + 1], eye);
				var along = vectors.Subtract(b, a);
				var side = vectors.Cross(along, vectors.Add(a, vectors.Scale(along, 0.5)));
				var length = vectors.Length(side);
				var base = geometry.Positions.length / 3;
				var t0 = i / (points.length - 1);
				var t1 = (i + 1) / (points.length - 1);
				var w0 = width * (0.25 + t0 * 1.2);
				var w1 = width * (0.25 + t1 * 1.2);

				if (length < 1e-12) continue;

				side = vectors.Scale(side, 1 / length);

				[[a, -w0, t0], [a, w0, t0], [b, w1, t1], [b, -w1, t1]].forEach(function (corner) {
					var p = vectors.Add(corner[0], vectors.Scale(side, corner[1]));

					geometry.Positions.push(p[0], p[1], p[2]);
					geometry.UVs.push(corner[1] > 0 ? 1 : -1, corner[2]);
					geometry.Colors.push(color[0], color[1], color[2], 1);
				});

				geometry.Indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
			}
		}

		/*
		 * What is drawn of them, after all that stands (light bent, gas that glows): in the part of the depth the view is
		 * drawn in now (planes), each once.
		 */
		engine.DeepDraw = function (matrix, later, right, up, planes) {
			var eye = scene.Eye || [0, 0, 0];
			var cube = engine.CosmosCube ? engine.CosmosCube() : null;
			/* Nothing of these, nothing made: a scene without them compiles none of their programs. */
			var any = scene.Active.some(function (object) {
				return !!(trait(object, 'BlackHole') || trait(object, 'Wormhole') || trait(object, 'Comet') || trait(object, 'Quasar') || trait(object, 'Star'));
			});
			if (!renderer || !any) return;

			/* The lens is made behind the scene: till it is, what bends light is not drawn. */
			programs = programs || {Lens: null, Tail: renderer.Program(shaders.TailVertex, shaders.Tail), Glow: renderer.Program(shaders.LensVertex, shaders.Glow), Corona: renderer.Program(shaders.LensVertex, shaders.Corona)};
			quad = quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			/* Round each star: its corona in streamers, prominences arching over its edge, now and then a flare. */
			scene.Active.forEach(function (object) {
				var star = trait(object, 'Star');
				var far;
				var size;

				if (!star || !object.World || object.Hidden || scene.Ground) return;

				far = vectors.Distance(object.World, scene.Camera.Position);

				if (planes && (far < planes[0] * 0.9 || far > planes[1] * 1.1)) return;

				size = Math.max(object.Size, far * Math.tan(scene.Camera.Fov * Math.PI / 360) * 2 * 4 / Math.max(1, scene.Height));

				/* Only while its disc is wide enough on the screen to show them. */
				if (size / Math.max(1e-9, far * Math.tan(scene.Camera.Fov * Math.PI / 360) * 2 / Math.max(1, scene.Height)) < 24) return;

				later.push(function () {
					engine.DrawReady(quad, programs.Corona, {uViewProjection: matrix, uCenter: vectors.Subtract(object.World, eye), uRight: right, uUp: up, uReach: size * 4, uColor: colorOf(object.Color, [1, 0.9, 0.7]), uSeed: object.Seed || 0, uTime: scene.Seconds % 1000, uParts: [number(star.Corona, 1), number(star.Prominences, 1), number(star.Flares, 1), 0]}, {Blend: 'add', DepthWrite: false, Cull: 'none'});
				});
			});

			scene.Active.forEach(function (object) {
				var hole = trait(object, 'BlackHole');
				var mouth = trait(object, 'Wormhole');
				var comet = trait(object, 'Comet');
				var quasar = trait(object, 'Quasar');
				var far;

				if (!object.World || object.Hidden || !(hole || mouth || comet || quasar)) return;

				far = vectors.Distance(object.World, scene.Camera.Position);

				if (planes && !quasar && (far < planes[0] * 0.9 || far > planes[1] * 1.1)) return;

				if (quasar && planes && planes[1] < scene.Camera.Far * 0.9) return;

				later.push(function () {
					var center = vectors.Subtract(object.World, eye);
					var spin;
					var tilt;
					var other;
					var made;

					/* The lens only where there is something to bend the light: a scene of stars alone compiles none. */
					if (hole || mouth)
						programs.Lens = programs.Lens || renderer.Program(shaders.LensVertex, shaders.Lens, true);

					if ((hole || mouth) && !renderer.Ready(programs.Lens)) return;

					if (hole || mouth) {
						/* The quad is wide: the light of the sky far round it is bent too, less and less to its edge. */
						var horizon = hole ? object.Size / number(hole.Outer, 14) : object.Size;
						var reach = horizon * (hole ? 26 : 7);

						tilt = number((hole || mouth).Tilt, hole ? 12 : 0) * Math.PI / 180;
						spin = scene.Time * 40;
						other = mouth ? engine.CosmosCubeOf ? engine.CosmosCubeOf(mouth.Cosmos || 'nebula', 'mouth:' + object.ID) : null : null;

						engine.DrawReady(quad, programs.Lens, {uViewProjection: matrix, uCenter: center, uRight: right, uUp: up, uReach: reach, uHorizon: horizon, uKind: hole ? 0 : 1, uDisk: hole && hole.Disk !== false ? [number(hole.Inner, 3), number(hole.Outer, 14), number(hole.Brightness, 1), 1] : [0, 0, 0, 0], uTilt: tilt, uTime: scene.Seconds % 1000, uSpin: spin, uDiskColor: colorOf(hole && hole.Color, [1, 0.72, 0.42]), uSky: cube || blank(), uHasSky: cube ? 1 : 0, uOther: other || blank(), uHasOther: other ? 1 : 0, uStar: colorOf(mouth && mouth.Star, [0, 0, 0]), uSteps: engine.DeepSteps ? engine.DeepSteps() : 160}, {Blend: 'over', DepthWrite: false, Cull: 'none'});

						return;
					}

					if (comet) {
						var star = starOf(object);
						var away = star ? vectors.Normalize(vectors.Subtract(object.World, star.World)) : [1, 0, 0];
						/* Longer the nearer the star: of a few units far out to many near it (the heat of the star boils it). */
						var distance = star ? vectors.Distance(object.World, star.World) : 20;
						var length = number(comet.Tail, 1) * Math.min(9, 30 / Math.max(3, distance));
						var moving = object.Velocity ? vectors.Normalize(object.Velocity) : vectors.Normalize(vectors.Cross(away, [0, 1, 0]));
						var ion = [];
						var dust = [];
						var i;

						if (length < 0.05) return;

						for (i = 0; i <= 16; i++) {
							var t = i / 16;

							ion.push(vectors.Add(object.World, vectors.Scale(away, length * t)));
							dust.push(vectors.Add(object.World, vectors.Add(vectors.Scale(away, length * 0.8 * t), vectors.Scale(moving, -length * 0.35 * t * t))));
						}

						made = {Positions: [], UVs: [], Colors: [], Indices: []};

						tail(made, dust, length * 0.045, vectors.Scale(colorOf(comet.Color, [1, 0.88, 0.62]), 0.55), eye);
						tail(made, ion, length * 0.014, vectors.Scale(colorOf(comet.Ion, [0.45, 0.7, 1]), 0.7), eye);

						var mesh = renderer.Mesh(made);

						engine.DrawReady(mesh, programs.Tail, {uViewProjection: matrix}, {Blend: 'add', DepthWrite: false, Cull: 'none'});

						mesh.Destroy();

						engine.DrawReady(quad, programs.Glow, {uViewProjection: matrix, uCenter: center, uRight: right, uUp: up, uReach: Math.max(object.Size * 6, length * 0.03), uColor: [0.45, 0.6, 0.7], uJets: 0, uTime: 0, uCore: 0.4}, {Blend: 'add', DepthWrite: false, Cull: 'none'});

						return;
					}

					/* A quasar: a point of light far beyond the stars, its jets across the sky. */
					var size = vectors.Length(center) * 0.02;

					engine.DrawReady(quad, programs.Glow, {uViewProjection: matrix, uCenter: center, uRight: right, uUp: up, uReach: size, uColor: vectors.Scale(colorOf(quasar.Color, [0.75, 0.84, 1]), number(quasar.Brightness, 1)), uJets: quasar.Jets === false ? 0 : 1, uTime: scene.Seconds % 1000, uCore: 1}, {Blend: 'add', DepthWrite: false, Depth: false, Cull: 'none'});
				});
			});
		};
	},

	/* The size of each in the view, and what its card tells: true for one of these kinds (the Scene sizes the rest). */
	DeepSize: function (object, real, kilometre) {
		var number = function (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		};
		var trait = function (one, name) {
			return one && one.Traits ? one.Traits[name] || null : null;
		};

		var hole = trait(object, 'BlackHole');
		var mouth = trait(object, 'Wormhole');
		var comet = trait(object, 'Comet');
		var quasar = trait(object, 'Quasar');
		var horizon;

		if (hole) {
			/* The horizon of a mass: 2GM/c², 2.95 km a Sun. */
			horizon = 2.953 * number(hole.Mass, 10);
			object.Size = real ? horizon * kilometre * number(hole.Outer, 14) : 0.9 * Math.pow(number(hole.Mass, 10) / 10, 0.3) * 2.2;
			object.Info = {Kind: 'blackhole', Mass: number(hole.Mass, 10), Horizon: horizon, Innermost: horizon * 3, Rows: [['mass', number(hole.Mass, 10), 'M☉'], ['horizon', horizon, 'km'], ['innermost', horizon * 3, 'km']]};

			return true;
		}

		if (mouth) {
			object.Size = 0.5 * number(mouth.Radius, 1);
			object.Info = {Kind: 'wormhole', Leads: mouth.Leads || mouth.Cosmos && (mouth.Cosmos.Seed || mouth.Cosmos.Kind || mouth.Cosmos) || '', Rows: [['leads', String(mouth.Leads || (mouth.Cosmos && (mouth.Cosmos.Seed || mouth.Cosmos.Kind)) || mouth.Cosmos || '?'), '']]};

			return true;
		}

		if (comet) {
			object.Size = real ? number(comet.Radius, 5) * kilometre : 0.05;
			object.Info = {Kind: 'comet', Radius: number(comet.Radius, 5), Rows: [['nucleus', number(comet.Radius, 5), 'km']]};

			return true;
		}

		if (quasar) {
			object.Size = 0;
			object.Info = {Kind: 'quasar', Rows: [['distance', 'billions of light years', '']]};

			return true;
		}

		return false;
	},

	DeepSpaceShaders: function (head) {
		return {
			/*
			 * What burns round a star, in its radii (the quad is four of them): the corona in streamers, fading out; prominences,
			 * arches of glowing gas over its edge, each of a seed, breathing; and a flare now and then, a burst of light at its
			 * edge that comes in seconds and goes. uParts: how much of each.
			 */
			Corona: head + [
				'in vec3 vAt;',
				'in vec2 vQuad;',
				'uniform vec3 uColor;',
				'uniform float uSeed;',
				'uniform float uTime;',
				'uniform vec4 uParts;',
				'out vec4 outColor;',
				'float hash(float x) { return fract(sin(x * 91.17) * 43758.5453); }',
				'float wave(float x) {',
				'	float i = floor(x);',
				'	float f = fract(x);',
				'	return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));',
				'}',
				'void main() {',
				'	float r = length(vQuad) * 4.0;',
				'	if (r < 0.985 || r > 4.0) discard;',
				'	float angle = atan(vQuad.y, vQuad.x);',
				'	float u = r - 1.0;',
				'	float streamers = 0.55 + 0.45 * wave(angle * 3.0 + uSeed) * wave(angle * 7.0 - uSeed + uTime * 0.02);',
				'	vec3 color = uColor * exp(-u * 2.6) * streamers * 0.55 * uParts.x * (1.0 - smoothstep(2.5, 4.0, r));',
				'	vec3 red = vec3(1.0, 0.36, 0.3);',
				'	for (int i = 0; i < 5; i++) {',
				'		float k = float(i);',
				'		float at = hash(uSeed + k * 7.3) * 6.2832 - 3.1416;',
				'		float wide = 0.08 + 0.1 * hash(uSeed + k * 3.1);',
				'		float high = (0.12 + 0.3 * hash(uSeed + k * 5.7)) * (0.85 + 0.15 * sin(uTime * 0.4 + k));',
				'		float t = (mod(angle - at + 3.1416, 6.2832) - 3.1416) / wide;',
				'		if (abs(t) < 1.2) {',
				'			float arch = high * sqrt(max(0.0, 1.0 - t * t));',
				'			float d = abs(u - arch);',
				'			float strands = 0.6 + 0.4 * wave(t * 9.0 + uTime * 0.5 + k * 13.0);',
				/* A thick arch of gas, brightest along it, its inside filled and fading, torn into strands. */
				'			float body = exp(-d * 22.0) * 0.8 + exp(-d * 70.0) * 0.6 + step(u, arch) * smoothstep(0.0, arch, u) * 0.25;',
				'			color += mix(red, uColor, 0.25) * body * strands * smoothstep(1.2, 0.85, abs(t)) * 1.3 * uParts.y;',
				'		}',
				'	}',
				/* A flare: one every while, of its seed, at its own place on the edge. */
				'	float round = floor(uTime / 23.0 + uSeed);',
				'	float since = mod(uTime + uSeed * 23.0, 23.0);',
				'	float where = hash(round) * 6.2832 - 3.1416;',
				'	float off = mod(angle - where + 3.1416, 6.2832) - 3.1416;',
				'	float burst = smoothstep(0.0, 0.6, since) * exp(-since * 0.8);',
				'	color += vec3(1.0, 0.95, 0.85) * exp(-off * off * 120.0 - u * u * 18.0) * burst * 6.0 * uParts.z;',
				'	outColor = vec4(color, 1.0);',
				'}'
			].join('\n'),

			LensVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uCenter;',
				'uniform vec3 uRight;',
				'uniform vec3 uUp;',
				'uniform float uReach;',
				'out vec3 vAt;',
				'out vec2 vQuad;',
				'void main() {',
				'	vQuad = aPosition.xy;',
				'	vAt = uCenter + (uRight * aPosition.x + uUp * aPosition.y) * uReach;',
				'	gl_Position = uViewProjection * vec4(vAt, 1.0);',
				'}'
			].join('\n'),

			/*
			 * Light bent round a mass (uKind 0, a black hole) or through a mouth (1, a wormhole). Each pixel is a ray from the
			 * eye followed in steps through the pull, in units of the horizon: a = -1.5 h² p / |p|⁵ (h, its angular momentum),
			 * as light goes round a Schwarzschild mass. What it meets: the horizon (black), the disc where it crosses its plane
			 * (its heat by the radius, beamed by its speed toward the eye, reddened by the pull), or the sky it leaves for.
			 */
			Lens: head + [
				'in vec3 vAt;',
				'in vec2 vQuad;',
				'uniform vec3 uCenter;',
				'uniform float uHorizon;',
				'uniform float uReach;',
				'uniform int uKind;',
				'uniform vec4 uDisk;',
				'uniform float uTilt;',
				'uniform float uTime;',
				'uniform float uSpin;',
				'uniform vec3 uDiskColor;',
				'uniform samplerCube uSky;',
				'uniform float uHasSky;',
				'uniform samplerCube uOther;',
				'uniform float uHasOther;',
				'uniform vec3 uStar;',
				'uniform int uSteps;',
				'out vec4 outColor;',
				'float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }',
				'float noise(vec3 p) {',
				'	vec3 i = floor(p);',
				'	vec3 f = fract(p);',
				'	f = f * f * (3.0 - 2.0 * f);',
				'	return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);',
				'}',
				/* Stars of a direction, when there is no sky of the Cosmos to read: points of three sizes on a grid of the sphere. */
				'vec3 stars(vec3 d, float seed) {',
				'	vec3 color = vec3(0.004, 0.005, 0.01);',
				'	for (int k = 0; k < 3; k++) {',
				'		float scale = 60.0 + float(k) * 70.0;',
				'		vec3 q = d * scale + seed;',
				'		vec3 cell = floor(q);',
				'		float h = hash(cell);',
				'		vec3 at = cell + 0.5 + (vec3(hash(cell + 1.3), hash(cell + 2.7), hash(cell + 4.1)) - 0.5) * 0.6;',
				'		float bright = step(0.92, h) * pow(max(0.0, 1.0 - length(q - at) * 2.2), 6.0);',
				'		color += bright * mix(vec3(1.0, 0.8, 0.6), vec3(0.7, 0.8, 1.0), hash(cell + 9.0)) * (1.5 - float(k) * 0.4);',
				'	}',
				'	return color;',
				'}',
				'vec3 sky(vec3 d) {',
				'	return uHasSky > 0.5 ? texture(uSky, d).rgb : stars(d, 0.0);',
				'}',
				/* The other side of a wormhole: its sky, and its star where it stands in it. */
				'vec3 beyond(vec3 d) {',
				'	vec3 color = uHasOther > 0.5 ? texture(uOther, d).rgb : stars(d, 17.0) + vec3(0.04, 0.02, 0.06);',
				'	float sun = max(dot(d, normalize(vec3(0.3, 0.4, 0.86))), 0.0);',
				'	color += uStar * (pow(sun, 2000.0) * 40.0 + pow(sun, 60.0) * 0.6);',
				'	return color;',
				'}',
				/* The heat of a disc: white-blue where it is hottest, gold and red farther out. */
				'vec3 heat(float t) {',
				'	return mix(mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.68, 0.32), smoothstep(0.0, 0.45, t)), vec3(0.9, 0.95, 1.0), smoothstep(0.45, 1.0, t));',
				'}',
				/* The disc where a ray crossed its plane: its heat by the radius, beamed by its speed toward the eye, reddened by the pull. */
				'vec4 disc(vec3 q, vec3 v) {',
				'	float rq = length(q.xz);',
				'	if (rq < uDisk.x || rq > uDisk.y) return vec4(0.0);',
				'	float t = (rq - uDisk.x) / (uDisk.y - uDisk.x);',
				'	float speed = sqrt(0.5 / rq);',
				'	vec3 way = normalize(vec3(-q.z, 0.0, q.x));',
				'	float gamma = 1.0 / sqrt(1.0 - speed * speed);',
				'	float g = 1.0 / (gamma * (1.0 - speed * dot(way, -v))) * sqrt(max(0.0, 1.0 - 1.0 / rq));',
				'	float angle = atan(q.z, q.x);',
				'	float turn = angle - uSpin / pow(rq, 1.5);',
				'	float swirl = noise(vec3(cos(turn) * rq * 1.6, sin(turn) * rq * 1.6, rq * 3.0)) * 0.7 + noise(vec3(rq * 9.0, angle * 3.0, uTime * 0.05)) * 0.3;',
				'	float density = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.55, 1.0, t)) * (0.45 + 0.75 * swirl);',
				'	vec3 glow = heat(clamp((1.0 - t) * 0.85 * g, 0.0, 1.0)) * mix(vec3(1.0), uDiskColor * 1.4, 0.5) * pow(g, 3.0) * (2.4 / pow(rq / uDisk.x, 1.4)) * uDisk.z;',
				'	return vec4(glow / max(min(1.0, density * 1.1), 0.001) * density, min(1.0, density * 1.1));',
				'}',
				'void main() {',
				'	float edge = length(vQuad);',
				'	if (edge > 1.0) discard;',
				'	vec3 d = normalize(vAt);',
				/* Into the frame of the hole: its disc in the plane y = 0, turned by its tilt; lengths in horizons. */
				'	float c = cos(uTilt);',
				'	float s = sin(uTilt);',
				'	mat3 frame = mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);',
				'	vec3 p = frame * (-uCenter) / uHorizon;',
				'	vec3 v = frame * d;',
				'	float b = length(cross(p, v));',
				'	float start = length(p);',
				/* From far off, first straight to the sphere round it the bending is worth following in. */
				'	float bound = uReach / uHorizon;',
				'	float along = -dot(p, v);',
				'	float near = along - sqrt(max(bound * bound - b * b, 0.0));',
				'	if (start > bound && near > 0.0) p += v * near;',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 0.0;',
				'	float h2 = dot(cross(p, v), cross(p, v));',
				'	bool caught = false;',
				'	bool through = false;',
				'	vec3 first = vec3(0.0);',
				'	vec3 firstWay = vec3(0.0);',
				'	vec3 second = vec3(0.0);',
				'	vec3 secondWay = vec3(0.0);',
				'	float crossed = 0.0;',
				/* A bound the compiler cannot know: a loop it does not unroll; in it only the path and where it crosses the disc. */
				'	for (int i = 0; i < uSteps; i++) {',
				'		float r = length(p);',
				'		if (r < 1.0) { caught = uKind == 0; through = uKind == 1; break; }',
				'		if (r > bound * 1.02 && dot(p, v) > 0.0) break;',
				'		float dt = clamp(0.08 * r, 0.02, 1.5);',
				'		vec3 before = p;',
				'		v = normalize(v - (uKind == 0 ? 1.5 : 0.9) * h2 * p / pow(r, 5.0) * dt);',
				'		p += v * dt;',
				'		if (before.y * p.y < 0.0 && crossed < 1.5) {',
				'			vec3 q = mix(before, p, before.y / (before.y - p.y));',
				'			if (crossed < 0.5) { first = q; firstWay = v; } else { second = q; secondWay = v; }',
				'			crossed += 1.0;',
				'		}',
				'	}',
				'	if (uDisk.w > 0.5 && crossed > 0.5) {',
				'		vec4 near = disc(first, firstWay);',
				'		color += near.rgb * near.a;',
				'		alpha = near.a;',
				'		if (crossed > 1.5) {',
				'			vec4 far = disc(second, secondWay);',
				'			color += (1.0 - alpha) * far.rgb * far.a;',
				'			alpha += (1.0 - alpha) * far.a;',
				'		}',
				'	}',
				'	vec3 behind;',
				'	vec3 out_ = transpose(frame) * v;',
				'	if (caught) behind = vec3(0.0);',
				'	else if (through) {',
				/* The other side: the ray goes on from the far side of the mouth, turned as much as it went round inside. */
				'		vec3 inside = transpose(frame) * normalize(reflect(v, normalize(p)));',
				'		behind = beyond(normalize(mix(-inside, out_, 0.35)));',
				'	}',
				'	else behind = sky(out_);',
				/* Far to the edge the bending is small: the sky drawn behind shows through, so no seam is seen. */
				'	float own = 1.0 - smoothstep(0.55, 1.0, edge);',
				'	if (caught || through) own = 1.0;',
				'	color += (1.0 - alpha) * behind;',
				'	alpha = max(alpha, own);',
				'	outColor = vec4(pow(color, vec3(1.0 / 2.2)), alpha);',
				'}'
			].join('\n'),

			TailVertex: head + [
				'in vec3 aPosition;',
				'in vec2 aUV;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'out vec2 vAt;',
				'out vec4 vColor;',
				'void main() {',
				'	vAt = aUV;',
				'	vColor = aColor;',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			/* A tail of a comet: brightest by its head and along its middle, fading to its end. */
			Tail: head + [
				'in vec2 vAt;',
				'in vec4 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	float across = 1.0 - abs(vAt.x);',
				'	float fade = pow(1.0 - vAt.y, 1.6);',
				'	outColor = vec4(vColor.rgb * across * across * fade * 0.9, 1.0);',
				'}'
			].join('\n'),

			/* A glow: the coma of a comet, or a quasar with its jets (uJets) across it. */
			Glow: head + [
				'in vec3 vAt;',
				'in vec2 vQuad;',
				'uniform vec3 uColor;',
				'uniform float uJets;',
				'uniform float uTime;',
				'uniform float uCore;',
				'out vec4 outColor;',
				'void main() {',
				'	float r = length(vQuad);',
				'	if (r > 1.0) discard;',
				'	float glow = (exp(-r * r * 60.0) * 3.0 * uCore + exp(-r * 5.0) * 0.35) * (1.0 - smoothstep(0.7, 1.0, r));',
				'	if (uJets > 0.5) {',
				'		vec2 q = vec2(vQuad.x * 0.8 + vQuad.y * 0.6, -vQuad.x * 0.6 + vQuad.y * 0.8);',
				'		glow += exp(-abs(q.y) * 70.0 / (0.3 + abs(q.x) * 2.0)) * exp(-abs(q.x) * 2.6) * 0.8 * (0.85 + 0.15 * sin(uTime * 3.0 + abs(q.x) * 30.0));',
				'	}',
				'	outColor = vec4(uColor * glow, 1.0);',
				'}'
			].join('\n')
		};
	}
});
