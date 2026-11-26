/*
 * SceneGalaxy: a galaxy as a setting of a scene (Setting galaxy; GalaxyData, docs/SPACE-FORMAT.md). Galaxy is what it shows:
 * a key of GalaxyData.Use, the URL of its file, its data, or options of GalaxyData.Make ({Seed, Kind, Radius, Arms...}).
 *
 * Its light and its dust are drawn along the ray of each pixel through its shape (GalaxyShapeShader, GalaxyVolumeShader: its
 * thin and thick discs, its arms with clouds of young stars and pink knots on their ridges, beginning at the edge of its
 * bulge or the ends of its bar, its halo; its dust in lanes and threads dimming what lies behind it; each octave of its
 * noise only as fine as a pixel makes out there), with points of its stars and its knots of young ones over it; round the
 * eye its stars one by one (GalaxyFieldShader: cubes of points laid round the eye, as bright as its light there) where its
 * light would be a mist; from inside its disc, the band of it across the sky (a sky of SceneCosmos round its pole, its bulge
 * towards its middle, made again as the eye goes far, in place of its rays: CosmosCubeOf). The eye takes its light as bright as it is (read
 * back from the card a frame later; state Exposure fixes it). It is drawn coarse while the view moves, fine in a few rounds
 * when it stops, then not at all till the view changes (the card rests). As the
 * view comes near the stars of the sectors round it come one by one, each as bright as it is to the eye there: these are
 * its real stars, made of its seed, each with its own system; a press picks the one seen under the pointer. The star picked
 * is marked with its name, its ID and where it is; kept to a star (GalaxyFocus) the view comes as near as its system: the
 * star itself, the bodies of its system marked where they are (a press picks one, two go into its system), and nearer the
 * scene goes into its system by itself. Its black hole too ('centre', GalaxyFocus('')): the view keeps to it, the young stars
 * that go round it close are marked, and its system (GalaxyData.System 'centre') comes as of a star.
 * GalaxyTime (millions of years) turns it as a galaxy turns: the inner stars round sooner than the outer ones (a flat curve).
 *
 * A drag turns the view round where it looks, a right drag (or with Shift) moves it along the plane of the galaxy, the
 * wheel brings it near or far, a press on a star picks it (event galaxy: {ID, Star}; empty ID: the black hole or none),
 * a double press flies to it; fingers as ever (tap, double tap, pan, pinch). Enter goes into the system of the star picked.
 *
 * - GalaxyData(): the data shown (null till it came). GalaxyView(): {Target (ly, where it looks), Yaw, Pitch, Distance
 *   (ly)}; SetGalaxyView(view) puts it there. GalaxyFocus(id): the view flies to a star (or the centre: '').
 * - GalaxyStars(): the stars near the view as they are drawn now (each {ID, Name, Place (where it is at GalaxyTime), Mass,
 *   Class, Color...}). GalaxyPicked(): the ID of the star picked.
 * - EnterSystem(id, callback, options): the view flies into the star (options {Now: at once, as a ship jumped there}) and the scene shows its system (Setting space: its System of
 *   GalaxyData.System, its Cosmos of where it is in the galaxy); event enter {ID, Star, Key}. LeaveSystem(callback): out to
 *   the galaxy again, the view drawing back from the star till the galaxy is seen whole round it; event leave {ID}. GalaxyEntered(): the ID of the star whose
 *   system is shown ('' in none).
 */
Elemenx.Trait('SceneGalaxy', {
	Galaxy: '',
	GalaxyTime: 0,

	GalaxyStart: function () {
		var self = this;
		var engine = this.Engine();
		var scene = this.Scene();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var galaxies = this.$Service('GalaxyData');
		var shaders = this.GalaxyShaders('#version 300 es\nprecision highp float;\n');
		var state = {Key: null, Data: null, Loading: '', Glow: null, GlowCount: 0, Near: null, NearKey: '', Stars: [], Marks: null, Picked: '', Entered: '', Target: [0, 0, 0], Yaw: 0.6, Pitch: 0.75, Distance: 120000, Flight: null, Press: null, Touch: null, Programs: null};

		engine.Galaxy = state;

		/* Its graph of arms given anew (Scene: engine.Regraph): its galaxy made again of it, its programs too. */
		engine.Regraphs = engine.Regraphs || [];

		engine.Regraphs.push(function () {
			state.Programs = null;
			state.Key = null;
			state.NearKey = '';
		});

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/* The galaxy the prop tells: a key, a URL (read once), data, or options of Make. */
		function wanted () {
			var given = self.Galaxy;
			var key = typeof given === 'string' ? given : given ? JSON.stringify(given.Manifest ? given.Manifest.ID : given) : '';
			var parsed;

			if (key === state.Key) return;

			state.Key = key;
			state.Data = null;
			state.NearKey = '';
			state.Picked = '';

			if (!given) return;

			if (typeof given === 'string' && galaxies.DataOf(given)) {
				shown(galaxies.DataOf(given));

				return;
			}

			if (typeof given === 'string' && /^\s*\{/.test(given)) {
				try {
					parsed = JSON.parse(given);
				}
				catch (error) {
					parsed = {Seed: given};
				}

				shown(parsed.Manifest ? parsed : galaxies.Make(parsed));

				return;
			}

			if (typeof given === 'string' && /[\/.]/.test(given)) {
				state.Loading = given;

				galaxies.Open(given, function (error, data) {
					if (state.Loading !== given || state.Key !== key) return;

					state.Loading = '';

					if (error) self.$Emit('error', {Reason: 'galaxy', Error: error});
					else shown(data);
				});

				return;
			}

			shown(given.Manifest ? given : galaxies.Make(typeof given === 'string' ? {Seed: given} : given));
		}

		/* A galaxy that came: the view of all of it from above at a slant. */
		function shown (data) {
			state.Data = data;

			/* The arms of the graph of the scene (GalaxyData.Spiral), not written with it. */
			Object.defineProperty(data, 'Graph', {value: self.GalaxySpiral ? self.GalaxySpiral() : null, writable: true, configurable: true, enumerable: false});

			if (state.Glow) {
				state.Glow.Destroy();
				state.Glow = null;
			}

			if (!state.Flight && !state.Entered) {
				state.Target = [0, 0, 0];
				state.Distance = data.Manifest.Radius * 2.6;
			}

			self.$Emit('galaxyready', {ID: data.Manifest.ID, Data: data});
		}

		/* How many points of glow its quality draws. */
		function glowCount () {
			return self.Graphics().Galaxy.Glow;
		}

		/* Points in thousands of light-years: what a float holds well across all of it. */
		function pointsOf (list) {
			return list.Positions.length ? renderer.Points(list.Positions.map(function (value) {
				return value / 1000;
			}), {aColor: {Size: 4, Data: list.Colors}}) : null;
		}

		/* The light of it from far: its glow, its knots, its dust and its middle, made again when the quality changes. */
		function glowMesh () {
			var count = glowCount();
			var glow;

			if (state.Glow && state.GlowCount === count) return state.Glow;

			['Glow', 'Knots'].forEach(function (name) {
				if (state[name])
					state[name].Destroy();
			});

			glow = galaxies.Glow(state.Data, count);

			state.Glow = pointsOf(glow);
			state.Knots = pointsOf(glow.Knots);
			state.GlowCount = count;

			return state.Glow;
		}

		/*
		 * Its nebulae and clusters (GalaxyData.Objects) as points as wide as they are (a few pixels at the least): the bright
		 * ones (the light of clouds where stars are born, of shells and remnants, of clusters) and the dark clouds apart, these
		 * to dim the picture; made again when its edits change.
		 */
		function objectsMesh () {
			var key = JSON.stringify(state.Data.Edits.Removed || []) + [state.Data.Manifest.Seed, state.Data.Manifest.Kind, state.Data.Manifest.Radius, state.Data.Manifest.Arms].join(':');
			var colors = {hii: [1, 0.36, 0.52], planetary: [0.42, 0.9, 1], remnant: [1, 0.62, 0.5], open: [0.72, 0.84, 1], globular: [1, 0.88, 0.66], dark: [0.035, 0.025, 0.02]};
			var made = {Bright: [[], []], Dark: [[], []]};

			if (state.ObjectsKey === key) return state.Objects;

			if (state.Objects) {
				['Bright', 'Dark'].forEach(function (name) {
					if (state.Objects[name])
						state.Objects[name].Destroy();
				});
			}

			state.List = galaxies.Objects(state.Data);

			state.List.forEach(function (one) {
				var into = made[one.Type === 'dark' ? 'Dark' : 'Bright'];
				var color = colors[one.Type] || [1, 1, 1];

				into[0].push(one.Place[0] / 1000, one.Place[1] / 1000, one.Place[2] / 1000);
				into[1].push(color[0], color[1], color[2], one.Radius / 1000);
			});

			state.Objects = {Bright: made.Bright[0].length ? renderer.Points(made.Bright[0], {aColor: {Size: 4, Data: made.Bright[1]}}) : null, Dark: made.Dark[0].length ? renderer.Points(made.Dark[0], {aColor: {Size: 4, Data: made.Dark[1]}}) : null};
			state.ObjectsKey = key;

			return state.Objects;
		}

		/* The points of what was put in by hand, where each is now. */
		function added () {
			var list = galaxies.Added(state.Data, number(self.GalaxyTime, 0));

			if (state.AddedMesh)
				state.AddedMesh.Destroy();

			state.AddedMesh = list.length ? renderer.Points([].concat.apply([], list.map(function (body) {
				return [body.Place[0] / 1000, body.Place[1] / 1000, body.Place[2] / 1000];
			})), {aColor: {Size: 4, Data: [].concat.apply([], list.map(function (body) {
				return body.Star ? [1, 0.92, 0.8, 1] : [0.45, 0.95, 1, 1];
			}))}}) : null;
		}

		/*
		 * The grids of its knots (GalaxyData.Knots) as textures its picture reads, made again for another galaxy: each knot it
		 * draws is one of its nebulae.
		 */
		function knotsOf () {
			var made;

			if (state.KnotTextures && state.KnotTextures.Key === state.Key) return state.KnotTextures;

			if (state.KnotTextures) {
				state.KnotTextures.A.Destroy();
				state.KnotTextures.B.Destroy();
			}

			made = galaxies.Knots(state.Data).Grids;

			state.KnotTextures = {
				Key: state.Key,
				A: renderer.Texture({Width: made[0].Count, Height: made[0].Count, Data: made[0].Data}, {Float: true, Nearest: true}),
				B: renderer.Texture({Width: made[1].Count, Height: made[1].Count, Data: made[1].Data}, {Float: true, Nearest: true}),
				InfoA: [made[0].Cell, made[0].Count, made[0].Half],
				InfoB: [made[1].Cell, made[1].Count, made[1].Half]
			};

			return state.KnotTextures;
		}

		/* The uniforms of the shape of the galaxy (GalaxyShapeShader), in thousands of light-years. */
		function shapeOf () {
			var m = state.Data.Manifest;
			var shape = galaxies.Shape(m);
			var kinds = {elliptical: 1, dwarf: 2, irregular: 3, ring: 4};
			var bulge = galaxies.BulgeOf(m);
			var knots = knotsOf();

			return {
				uKnotsA: knots.A,
				uKnotsB: knots.B,
				uKnotGridA: knots.InfoA,
				uKnotGridB: knots.InfoB,
				uKind: kinds[m.Kind] || 0,
				uRadius: m.Radius / 1000,
				uScale: shape.Disc / 1000,
				uHeight: shape.Height / 1000 * 0.35,
				uBulge: Math.max(bulge.Radius, 1) / 1000,
				uFlat: bulge.Flat,
				uBulgeBright: bulge.Bright,
				uArms: m.Kind === 'lenticular' ? 0 : m.Arms,
				uPitch: m.Pitch * Math.PI / 180,
				uPhase: m.Phase * Math.PI / 180,
				uBar: m.Kind === 'barred' ? shape.Bar / 1000 : 0,
				uRing: shape.Ring / 1000,
				uWidth: shape.Width / 1000,
				uShape: [m.Shape[0], m.Shape[2], m.Shape[1]],
				uSeed: galaxies.SeedNumber(m)
			};
		}

		/*
		 * The picture of its plane (GalaxyPlaneShader): what of it lies in its plane, made once for its shape and the quality,
		 * a few rows at each frame (the card never busy long), read by its rays. Regression: computed again at each step of
		 * each ray, a round of its fine light took the card for 400 ms and more, and the computer stuck while it stopped.
		 * True when it is whole.
		 */
		function plane () {
			var size = self.Graphics().Galaxy.Plane;
			var shape = shapeOf();
			var key = JSON.stringify(shape) + '|' + size;
			var low = Math.log(0.02 / Math.max(shape.uScale, 1e-3));
			var high = Math.log(shape.uRadius * 1.4 / Math.max(shape.uScale, 1e-3));
			var rows = Math.max(8, Math.round(262144 / size));
			var gl = renderer.GL;
			var drawn;

			if (state.PlaneKey !== key) {
				['PlaneA', 'PlaneB'].forEach(function (name) {
					if (state[name])
						state[name].Destroy();

					state[name] = renderer.Target(size, size, {Float: true, Mipmaps: true});

					/* Round its angle without a seam. */
					gl.bindTexture(gl.TEXTURE_2D, state[name].Textures[0].Handle);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				});

				state.PlaneKey = key;
				state.PlaneRow = 0;
				state.PlaneSize = size;
				state.PlaneMap = [low, 1 / (high - low), size];
			}

			if (state.PlaneRow >= size) return true;

			rows = Math.min(rows, size - state.PlaneRow);

			/*
			 * Its rows counted only when drawn. Regression: DrawReady skips a draw while the card makes its program, the rows
			 * were counted all the same, and its plane was left empty (no arms, no dust, no knots: a bare glow).
			 */
			drawn = [state.PlaneA, state.PlaneB].map(function (target, part) {
				var done;

				target.Begin();

				renderer.Viewport(0, state.PlaneRow, size, rows);

				done = engine.DrawReady(state.Quad, programs().Plane, Object.assign(shapeOf(), {uPlaneMap: state.PlaneMap, uSize: [size, size], uPart: part}), {Depth: false, DepthWrite: false, Blend: 'none', Cull: 'none'});

				target.End();

				return done !== false;
			});

			if (drawn.indexOf(false) !== -1) return false;

			state.PlaneRow += rows;

			return state.PlaneRow >= size;
		}

		/* How bright its light is drawn (of its size: a small galaxy as bright to the eye as a big one at its scale). */
		function brightOf () {
			return number(state.VolumeLight, 1.2) / (state.Data.Manifest.Radius / 50000);
		}

		/*
		 * The cubes of the stars round the eye (kly): as wide as the view is near, of powers of two so that they do not swim
		 * as the view comes near (the next one fades in); Near, how far from the eye the light of the galaxy begins.
		 */
		function cells () {
			var level = Math.min(3, Math.log(Math.max(state.Distance / 1000 * 0.8, 0.02)) / Math.LN2);
			var low = Math.pow(2, Math.floor(level));
			var fade = level - Math.floor(level);

			return {Low: low, High: low * 2, Fade: fade, Near: (low + (low * 2 - low) * fade) * 0.5, Inside: Math.max(0, Math.min(1, (2.5 - level) / 1.5))};
		}

		/* A target of a size, made again when the size changed. */
		function sized (name, width, height) {
			if (!state[name] || state[name].Width !== width || state[name].Height !== height) {
				if (state[name])
					state[name].Destroy();

				state[name] = renderer.Target(width, height, {Float: true});
			}

			return state[name];
		}

		/*
		 * The light of the galaxy along the rays: coarse while the view moves (a part of the screen, fewer steps); when it
		 * stops, fine (all of the screen at high and ultra), a few times over, each with its steps begun elsewhere, added up
		 * (no grain); kept till the view changes. Volume: what is shown.
		 *
		 * A fine round is drawn a band of rows at a frame, as many as the card does in a few milliseconds, and added up when
		 * whole. Regression: a whole fine round at a frame, 6 rounds, the card busy for a second and more at each stop of the
		 * view, and the computer stuck meanwhile.
		 */
		function volume (view, fine) {
			var set = self.Graphics().Galaxy;
			var part = fine ? set.FinePart : set.Part;
			var steps = fine ? set.FineSteps : set.Steps;
			var width = Math.max(1, Math.round(renderer.Width * part));
			var height = Math.max(1, Math.round(renderer.Height * part));
			var rows = fine ? Math.max(8, Math.round(number(state.StepBudget, 3e6) / (width * steps))) : height;

			var count = fine ? state.Fine || 0 : 0;
			var fresh = sized(fine ? 'Fresh' : 'Coarse', width, height);
			var old;
			var made;
			var drew;

			if (!fine || !state.Band || state.Band >= height)
				state.Band = 0;

			rows = Math.min(rows, height - state.Band);

			fresh.Begin();

			if (!fine)
				renderer.Clear([0, 0, 0, 1]);

			renderer.Viewport(0, state.Band, width, rows);

			drew = engine.DrawReady(state.Quad, programs().Volume, Object.assign(shapeOf(), {
				uInverse: math.Invert(view.Matrix),
				uEye: view.Eye,
				uBright: brightOf(),
				uDust: number(state.DustDepth, 1),
				uSteps: steps,
				uTime: number(self.GalaxyTime, 0),
				uNear: cells().Near,
				uNearKeep: number(state.NearGlow, 0.7),
				uOuter: Math.max(cells().Near, cells().High * 8 * cells().Inside),
				uKeep: 1 - 0.65 * cells().Inside,
				uPixel: 2 * Math.tan(25 * Math.PI / 180) / height,
				uRound: count * 0.618034,
				uGrain: fine ? 1 : 0,
				uView: [width, height],
				uPlaneA: state.PlaneA.Textures[0],
				uPlaneB: state.PlaneB.Textures[0],
				uPlaneMap: state.PlaneMap,
				uBaked: 1
			}), {Depth: false, DepthWrite: false, Blend: 'none', Cull: 'none'});

			fresh.End();

			state.VolumeSteps = steps;

			/*
			 * Not drawn (the card still makes its program): nothing counted, all of it again at the next frame. Regression: its
			 * fine rounds were counted all the same, six of them done of nothing, and the galaxy stayed black till the view moved.
			 */
			if (drew === false) {
				state.Volume = state.Volume || fresh;
				state.Drawn = '';

				/* The view changed: the fine rounds of the one before count no more. */
				if (!fine)
					state.Fine = 0;

				return;
			}

			if (!fine) {
				state.Volume = fresh;
				state.Fine = 0;

				return;
			}

			/* The rest of the round at the next frames. */
			state.Band += rows;

			if (state.Band < height) return;

			state.Band = 0;

			/* The rounds of the fine light added up: the mean of all so far. */
			old = count ? state.Volume : fresh;
			made = sized(state.Volume === state.AddA ? 'AddB' : 'AddA', width, height);

			made.Begin();

			drew = engine.DrawReady(state.Quad, programs().Mean, {uOld: old.Textures[0], uNew: fresh.Textures[0], uWeight: 1 / (count + 1)}, {Depth: false, DepthWrite: false, Blend: 'none', Cull: 'none'});

			made.End();

			if (drew === false) {
				state.Drawn = '';

				return;
			}

			state.Volume = made;
			state.Fine = count + 1;
		}

		/* The points of the cube of the stars round the eye, made again when the quality changes: where each is in it, a tint and a seed. */
		function fieldMesh () {
			var count = self.Graphics().Galaxy.Field;
			var random;
			var positions = [];
			var colors = [];
			var i;
			var warm;

			if (state.Field && state.FieldCount === count) return state.Field;

			if (state.Field)
				state.Field.Destroy();

			random = self.$Service('Random').Sequence('galaxy-field');

			for (i = 0; i < count; i++) {
				warm = random();

				positions.push(random(), random(), random());
				colors.push(warm < 0.6 ? 1 : 0.75 + warm * 0.2, warm < 0.6 ? 0.8 + warm * 0.25 : 0.88, warm < 0.6 ? 0.55 + warm * 0.4 : 1, random());
			}

			state.Field = renderer.Points(positions, {aColor: {Size: 4, Data: colors}});
			state.FieldCount = count;

			return state.Field;
		}

		/*
		 * The stars round the eye: the two cubes of its nearness, each as much as it stands for (its share of the light of the
		 * galaxy); near, the two cubes its light leaves out (before its dust), else the two wider ones.
		 */
		function field (view, near) {
			var cell = cells();
			var mesh = fieldMesh();
			var pixel = 2 * Math.tan(25 * Math.PI / 180) / Math.max(1, renderer.Height);

			/*
			 * The two cubes round the eye (the part of its light not left as glow there, NearGlow), then two wider ones whose
			 * brightest stars stand over its light (the middle of a galaxy seen from inside is not a mist: its stars by the thousand
			 * over its glow).
			 */
			[[cell.Low, 1 - cell.Fade, 0, 1 - number(state.NearGlow, 0.7)], [cell.High, cell.Fade, 0, 1 - number(state.NearGlow, 0.7)], [cell.High * 4, cell.Inside, cell.High * 0.5, 0.65], [cell.High * 16, cell.Inside, cell.High * 2, 0.65]].forEach(function (pair, index) {
				/* Inside its disc the band across the sky stands for the wider ones, and those round the eye are fainter over it. */
				var inside = state.Inside || 0;
				var weight = pair[1] * (index < 2 ? 1 - 0.5 * inside : 1 - inside);
				if (weight < 0.01 || near !== index < 2) return;

				engine.DrawReady(mesh, programs().Field, Object.assign(shapeOf(), {
					uViewProjection: view.Matrix,
					uEye: view.Eye,
					uTime: number(self.GalaxyTime, 0),
					uRatio: renderer.Ratio,
					uCell: pair[0],
					uLight: brightOf() * pair[0] * pair[0] * pair[0] / state.FieldCount / (pixel * pixel) * number(state.FieldLight, 1) * pair[3],
					uWeight: weight,
					uInner: pair[2],
					uShift: [(Math.log(pair[0]) * 0.6180339) % 1 + 1, (Math.log(pair[0]) * 0.7548776) % 1 + 1, (Math.log(pair[0]) * 0.5698403) % 1 + 1]
				}), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});
			});
		}

		/*
		 * How bright the eye takes the picture (as an eye or a camera does): of the light of a few pixels over the screen, read
		 * back a frame later (no wait), the bright part of the picture brought to the top of what the screen shows. State
		 * Exposure fixes it.
		 */
		function exposure (elapsed) {
			var gl = renderer.GL;
			var data;
			var values;
			var bright;
			var wanted;
			var i;

			if (state.Exposure !== undefined && state.Exposure !== null && state.Exposure !== '') return number(state.Exposure, 0.6);

			state.Taken = state.Taken || 0.6;

			if (!gl || !gl.fenceSync) return state.Taken;

			if (state.MeterFence && gl.clientWaitSync(state.MeterFence, 0, 0) !== gl.TIMEOUT_EXPIRED) {
				data = new Float32Array(16 * 16 * 4);

				gl.bindBuffer(gl.PIXEL_PACK_BUFFER, state.MeterBuffer);
				gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
				gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
				gl.deleteSync(state.MeterFence);

				state.MeterFence = null;
				values = [];

				for (i = 0; i < 256; i++) {
					if (data[i * 4] > 1e-5)
						values.push(data[i * 4]);
				}

				values.sort(function (a, b) {
					return a - b;
				});

				/* The bright part of what is lit (the 90th part of a hundred of it), shown a little under white. */
				bright = values.length > 6 ? values[Math.floor(values.length * 0.9)] : 0;
				state.Aim = bright > 0 ? Math.max(0.01, Math.min(60, number(state.ExposureKey, 0.6) / bright)) : state.Aim || 0.6;
			}

			/* Measured again only when the picture changed: a still view asks the card for nothing. */
			if (!state.MeterFence && state.MeterOf !== state.Drawn + ':' + state.Fine) {
				state.MeterOf = state.Drawn + ':' + state.Fine;
				state.Meter = state.Meter || renderer.Target(16, 16, {Float: true});
				state.MeterBuffer = state.MeterBuffer || gl.createBuffer();

				state.Meter.Begin();

				engine.DrawReady(state.Quad, programs().Meter, {uPicture: state.Light.Textures[0], uVolume: state.Volume.Textures[0]}, {Depth: false, DepthWrite: false, Blend: 'none', Cull: 'none'});

				gl.bindBuffer(gl.PIXEL_PACK_BUFFER, state.MeterBuffer);
				gl.bufferData(gl.PIXEL_PACK_BUFFER, 16 * 16 * 16, gl.STREAM_READ);
				gl.readPixels(0, 0, 16, 16, gl.RGBA, gl.FLOAT, 0);
				gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

				state.Meter.End();

				state.MeterFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
			}

			wanted = state.Aim || state.Taken;

			/* As an eye takes to the dark: in a second or so, by how many times, not by how much. */
			state.Taken = Math.exp(Math.log(state.Taken) + (Math.log(wanted) - Math.log(state.Taken)) * Math.min(1, (elapsed || 0.016) * 3));

			return state.Taken;
		}

		/* A light-year of an astronomical unit, and of the radius of the Sun. */
		var AU = 1.5813e-5;
		var SUN = 7.354e-8;

		/*
		 * The bodies of the system of a star round it (light-years from it), for the marks near it: those round its star or
		 * its barycentre, where their orbits put them at the start; Extent, the farthest of them.
		 */
		function bodiesOf (star) {
			var cache = state.Bodies || (state.Bodies = {});
			var objects;
			var roots = {};
			var list = [];
			var extent = 0;

			if (cache[star.ID])
				return cache[star.ID];

			objects = self.$Service('SystemData').Objects(galaxies.System(state.Data, star.ID), 'galaxy-marks');

			objects.forEach(function (spec) {
				if (!spec.Parent && (spec.Kind === 'star' || spec.Kind === 'barycentre' || spec.Kind === 'blackhole'))
					roots[spec.ID] = true;
			});

			objects.forEach(function (spec) {
				var orbit = spec.Traits && spec.Traits.Orbit;
				var far;
				var angle;

				if (!orbit || !roots[spec.Parent] || orbit.Unit === 'radii' || !(Number(orbit.Distance) > 0)) return;

				far = Number(orbit.Distance) * AU;
				angle = (orbit.Anomaly === undefined || orbit.Anomaly === null || orbit.Anomaly === '' ? (spec.ID.length * 47) % 360 : Number(orbit.Anomaly)) * Math.PI / 180;
				extent = Math.max(extent, far);

				list.push({ID: spec.ID, Name: spec.Values && spec.Values.Name || spec.ID, Kind: spec.Kind, Offset: [Math.cos(angle) * far, 0, -Math.sin(angle) * far]});
			});

			cache[star.ID] = {List: list, Extent: extent};

			return cache[star.ID];
		}

		/* The marks over the galaxy (DOM: as sharp as text is, and of numbers of double precision however near): the star picked, its name, its ID and where it is; near a star, the bodies of its system. */
		function labels (view) {
			var root = self.$Element();
			var box = state.Labels;
			var wanted = [];
			var star = state.Picked && state.Picked !== 'centre' ? starOf(state.Picked) : null;
			var near = state.Follow ? starOf(state.Follow) : null;
			var seen = {};
			var place;

			/* Laid out by the marks of the scene (SceneMarks) each frame, by this view: off each other, a line to a body moved. */
			state.MarkView = view;
			state.MarkPlaces = state.MarkPlaces || {};

			if (!box && root) {
				box = state.Labels = document.createElement('div');
				box.className = 'elemenx-scene-galaxy-marks';

				root.appendChild(box);
			}

			if (!box) return;

			box.hidden = self.Setting !== 'galaxy';

			if (box.hidden) return;

			if (star) {
				place = now(star.Place);

				wanted.push({Key: 'star:' + star.ID, Place: place, Kind: 'star', Text: (star.Name.indexOf(star.ID) === -1 ? star.Name + ' · ' + star.ID : star.Name) + ' · ' + Math.round(place[0]) + ', ' + Math.round(place[1]) + ', ' + Math.round(place[2]) + ' ly'});
			}
			else if (state.Picked === 'centre') {
				wanted.push({Key: 'centre', Place: [0, 0, 0], Kind: 'star', Text: (state.Data.Manifest.Centre.Name || 'Centre') + ' · ' + Math.round(state.Data.Manifest.Centre.Mass / 1e5) / 10 + 'M Suns'});
			}

			/* Near a star, once its system opens on the screen: its planets, its black holes, its wormholes where they are. */
			if (near && state.Distance < Math.max(1e-3, bodiesOf(near).Extent * 25)) {
				bodiesOf(near).List.forEach(function (body) {
					var centre = now(near.Place);

					wanted.push({Key: 'body:' + body.ID, ID: body.ID, Star: near.ID, Place: [centre[0] + body.Offset[0], centre[1] + body.Offset[1], centre[2] + body.Offset[2]], Kind: 'body', Text: body.Name});
				});
			}

			wanted.forEach(function (mark) {
				var element = box.querySelector('[data-key="' + mark.Key.replace(/"/g, '') + '"]');

				seen[mark.Key] = true;
				state.MarkPlaces[mark.Key] = mark.Place;

				if (!element) {
					element = document.createElement('div');
					element.className = 'elemenx-scene-galaxy-mark ' + mark.Kind;

					element.setAttribute('data-key', mark.Key);

					element.innerHTML = '<span class="elemenx-scene-galaxy-mark-dot"></span><span class="elemenx-scene-galaxy-mark-label"></span>';

					if (mark.Kind === 'body') {
						element.addEventListener('click', function () {
							self.$Emit('galaxy', {ID: mark.Star, Centre: false, Star: starOf(mark.Star), Body: mark.ID});
						});
						/* Regression: the wheel over the marks of a system did not reach the scene, and the view could come no nearer. */
						element.addEventListener('wheel', function (event) {
							self.Wheel(event);
						});
						element.addEventListener('dblclick', function () {
							self.EnterSystem(mark.Star, function (error) {
								if (!error && self.FocusOn)
									self.FocusOn(mark.ID);
							});
						});
					}

					box.appendChild(element);

					/*
					 * Regression: a body too near its star on the screen showed its dot alone, and two bodies near each other lay
					 * their names over each other: now moved off each other, a line to each.
					 */
					if (engine.MarkSet)
						engine.MarkSet('galaxy:' + mark.Key, {Element: element, Screen: markScreen(mark.Key), Align: 'left', Shift: [-4, 0], Declutter: mark.Kind === 'body', Occlude: false, Priority: mark.Kind === 'star' ? 1 : 0, Shown: function () {
							return !box.hidden;
						}});
				}

				element.lastChild.textContent = mark.Text;
			});

			Array.prototype.slice.call(box.children).forEach(function (element) {
				var key = element.getAttribute('data-key');
				if (seen[key]) return;

				if (engine.MarkDrop)
					engine.MarkDrop('galaxy:' + key);

				delete state.MarkPlaces[key];

				element.remove();
			});
		}

		/* Where a mark of the map is on the screen, by the view of the map now: [x, y], or null. */
		function markScreen (key) {
			return function () {
				var place = state.MarkPlaces && state.MarkPlaces[key];

				return place && state.MarkView ? screenOf(state.MarkView.Matrix, place) : null;
			};
		}

		/* The star the view is near: itself, as large as it is or a few pixels, its corona round it (of numbers about the eye: sharp however near). */
		function nearStar (view, common) {
			var star = state.Follow ? starOf(state.Follow) : null;
			var place;
			var eye;
			var way;
			var far;
			var size;
			var hex;

			if (!star || state.Distance > (star.Kind === 'blackhole' ? 5 : 0.3)) return;

			place = now(star.Place);
			eye = [view.Eye[0] * 1000, view.Eye[1] * 1000, view.Eye[2] * 1000];
			way = [place[0] - eye[0], place[1] - eye[1], place[2] - eye[2]];
			far = Math.max(Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]), 1e-9);
			/* A black hole: as wide as its disc (eighteen times its horizon, 2.95 km a Sun), else the star as wide as it is. */
			size = 2 * (star.Kind === 'blackhole' ? 18 * 2.95 * star.Mass / 9.461e12 : Math.pow(star.Mass, 0.8) * SUN) / far * (1 / Math.tan(25 * Math.PI / 180)) * renderer.Height * 0.5;

			state.NearStar = state.NearStar || renderer.Points([0, 0, 0], {aColor: {Size: 4, Data: [1, 1, 1, 1]}});

			hex = String(star.Color || '#ffffff').replace('#', '');

			engine.DrawReady(state.NearStar, programs().Sun, Object.assign({}, common, {uTurn: view.Turn, uWay: [way[0] / far, way[1] / far, way[2] / far], uSize: Math.min(1024, Math.max(18 * renderer.Ratio, size * 3)), uDisc: Math.min(1, size / Math.max(18 * renderer.Ratio, size * 3)), uColor: [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255], uHole: star.Kind === 'blackhole' ? 1 : 0, uFade: star.Kind === 'blackhole' ? 1 - Math.min(1, Math.max(0, (state.Distance - 2) / 3)) : 1 - Math.min(1, Math.max(0, (state.Distance - 0.1) / 0.2))}), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});
		}

		/* The view near enough to a star it keeps to: its system comes (the scene goes into it), as a ship coming near a star would see it. */
		function handoff () {
			var star = state.Follow ? starOf(state.Follow) : null;
			if (!star || state.Flight || state.Entering || self.Setting !== 'galaxy') return;

			if (state.Distance < Math.max(2e-4, bodiesOf(star).Extent * 3)) {
				state.Entering = true;

				self.EnterSystem(star.ID, function () {
					state.Entering = false;
				});
			}
		}

		/* The stars far behind it, all round: the sky it is seen against. */
		function skyMesh () {
			var random = self.$Service('Random').Sequence('galaxy-sky');
			var positions = [];
			var colors = [];
			var i;
			var u;
			var a;
			var w;
			var warm;

			if (state.Sky)
				return state.Sky;

			for (i = 0; i < 6000; i++) {
				u = random() * 2 - 1;
				a = random() * Math.PI * 2;
				w = Math.sqrt(1 - u * u);
				warm = random();

				positions.push(w * Math.cos(a), u, w * Math.sin(a));
				colors.push(warm < 0.3 ? 1 : 0.8 + warm * 0.2, warm < 0.3 ? 0.82 : 0.88, warm < 0.3 ? 0.6 : 1, Math.pow(random(), 7) * 2.5 + 0.03);
			}

			state.Sky = renderer.Points(positions, {aColor: {Size: 4, Data: colors}});

			return state.Sky;
		}

		/* Where a place at time 0 is now (ly). */
		function now (place) {
			return galaxies.Position(state.Data, place, number(self.GalaxyTime, 0));
		}

		/* Where a place now was at time 0 (ly): the turn taken back. */
		function then (place) {
			return galaxies.Position(state.Data, place, -number(self.GalaxyTime, 0));
		}

		/*
		 * The stars of the sectors round where the view looks (when it is near): an even draw of each sector, as many as a
		 * frame may hold; the mesh made again only when the view went into another sector.
		 */
		/*
		 * The stars of the sectors round where the view looks: worked out in the step of the scene, drawn or not
		 * (regression: a scene that drew no frame, with no WebGL left under load, had none, nor its galaxy, nor its flights).
		 */
		function nearList () {
			var m = state.Data.Manifest;
			var size = m.Sector;
			var at = then(state.Target);
			var cx = Math.floor(at[0] / size);
			var cy = Math.floor(at[1] / size);
			var cz = Math.floor(at[2] / size);
			var key = cx + '.' + cy + '.' + cz;
			var reach = 2;
			var each = self.Graphics().Galaxy.Near;
			var stars = [];
			var x;
			var y;
			var z;

			if (state.NearKey === key) return;

			for (x = cx - reach; x <= cx + reach; x++) {
				for (y = cy - reach; y <= cy + reach; y++) {
					for (z = cz - reach; z <= cz + reach; z++) {
						galaxies.Sector(state.Data, x, y, z, each).Stars.forEach(function (star) {
							stars.push(star);
						});
					}
				}
			}

			state.NearKey = key;
			state.Stars = stars;
			/* Regression: the stars of the sectors round the view stood as a box (their cube seen from out of it): a ball of them now, fading to its edge. */
			state.NearCentre = [(cx + 0.5) * size / 1000, (cy + 0.5) * size / 1000, (cz + 0.5) * size / 1000];
			state.NearReach = (reach + 0.5) * size / 1000;
		}

		/* Their points for the card, made again when the stars round the view changed. */
		function nearStars () {
			var positions = [];
			var colors = [];

			nearList();

			if (state.NearMade === state.NearKey && state.Near) return;

			state.Stars.forEach(function (star) {
				var hex = String(star.Color || '#ffffff').replace('#', '');

				positions.push(star.Place[0] / 1000, star.Place[1] / 1000, star.Place[2] / 1000);
				colors.push(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255, star.Luminosity);
			});

			if (state.Near)
				state.Near.Destroy();

			state.Near = positions.length ? renderer.Points(positions, {aColor: {Size: 4, Data: colors}}) : null;
			state.NearMade = state.NearKey;
		}

		function programs () {
			var noise;

			if (state.Programs)
				return state.Programs;

			noise = [self.$Service('Renderer').Chunks.Noise, self.$Service('Noise').GLSLChunk(['enx_gradient3']), galaxies.Spiral({Graph: self.GalaxySpiral ? self.GalaxySpiral() : null}).GLSL].join('\n');

			state.Programs = {
				Glow: renderer.Program(shaders.GlowVertex, shaders.Glow),
				Near: renderer.Program(shaders.NearVertex, shaders.Star),
				Mark: renderer.Program(shaders.MarkVertex, shaders.Mark),
				Picture: renderer.Program(self.$Service('Renderer').Shaders.Quad, shaders.Picture),
				Sky: renderer.Program(shaders.SkyVertex, shaders.Star),
				Knot: renderer.Program(shaders.KnotVertex, shaders.Star),
				Object: renderer.Program(shaders.ObjectVertex, shaders.Object),
				Sun: renderer.Program(shaders.SunVertex, shaders.Sun),
				Meter: renderer.Program(self.$Service('Renderer').Shaders.Quad, shaders.Meter),
				Band: renderer.Program(self.$Service('Renderer').Shaders.Quad, shaders.Band),
				Mean: renderer.Program(self.$Service('Renderer').Shaders.Quad, shaders.Mean),
				Field: renderer.Program(self.GalaxyFieldShader('#version 300 es\nprecision highp float;\n', noise), shaders.Star),
				Volume: renderer.Program(self.$Service('Renderer').Shaders.Quad, self.GalaxyVolumeShader('#version 300 es\nprecision highp float;\n', noise)),
				Plane: renderer.Program(self.$Service('Renderer').Shaders.Quad, self.GalaxyPlaneShader('#version 300 es\nprecision highp float;\n', noise))
			};

			return state.Programs;
		}

		/* The eye (kly) of the view: round where it looks, at its distance. */
		function eye () {
			var d = state.Distance / 1000;
			var t = state.Target;

			return [t[0] / 1000 + d * Math.cos(state.Pitch) * Math.sin(state.Yaw), t[1] / 1000 + d * Math.sin(state.Pitch), t[2] / 1000 + d * Math.cos(state.Pitch) * Math.cos(state.Yaw)];
		}

		function matrices () {
			var d = state.Distance / 1000;
			var from = eye();
			var to = [state.Target[0] / 1000, state.Target[1] / 1000, state.Target[2] / 1000];
			var aspect = renderer.Width / Math.max(1, renderer.Height);
			var projection = math.Perspective(50, aspect, Math.max(1e-6, d * 0.01), d * 4 + state.Data.Manifest.Radius / 250);
			var look = math.LookAt(from, to, [0, 1, 0]);

			return {Eye: from, Matrix: math.Multiply(projection, look), Turn: math.Multiply(math.Perspective(50, aspect, 0.1, 10), math.LookAt([0, 0, 0], [to[0] - from[0], to[1] - from[1], to[2] - from[2]], [0, 1, 0])), Right: [look[0], look[4], look[8]], Up: [look[1], look[5], look[9]]};
		}

		/* The screen (css px) of a place (ly), or null behind the eye. */
		function screenOf (matrix, place) {
			var p = [place[0] / 1000, place[1] / 1000, place[2] / 1000];
			var x = matrix[0] * p[0] + matrix[4] * p[1] + matrix[8] * p[2] + matrix[12];
			var y = matrix[1] * p[0] + matrix[5] * p[1] + matrix[9] * p[2] + matrix[13];
			var w = matrix[3] * p[0] + matrix[7] * p[1] + matrix[11] * p[2] + matrix[15];
			if (w <= 0)
				return null;

			return [(x / w * 0.5 + 0.5) * scene.Width, (0.5 - y / w * 0.5) * scene.Height];
		}

		/* How near the view is for the stars one by one (1: all of them, 0: the glow alone). */
		function nearness () {
			return 1 - Math.min(1, Math.max(0, (state.Distance - 100) / 300));
		}

		/*
		 * How far the eye is inside its disc (1 within a few of its heights of its plane, 0 above it or out past its edge; 0
		 * for a galaxy of no disc). Inside, its light is not drawn along the rays but as the band of it across the sky
		 * (bandSky): seen edgewise from within, its rays crossed its thin layers in long steps and drew a flat cut with
		 * streaks down it. Regression: a hard bright line and stripes, not the Milky Way.
		 */
		function insideOf (view, wide) {
			var m = state.Data.Manifest;
			var height = galaxies.Shape(m).Height / 1000 * (wide || 1);
			var e = view.Eye;
			var radius = Math.sqrt(e[0] * e[0] + e[2] * e[2]);

			if (m.Kind === 'elliptical' || m.Kind === 'dwarf') return 0;

			return (1 - smooth(height * 1.2, height * 2.2, Math.abs(e[1]))) * (1 - smooth(m.Radius / 1000, m.Radius / 1000 * 1.2, radius));
		}

		function smooth (from, to, x) {
			var t = Math.max(0, Math.min(1, (x - from) / (to - from)));

			return t * t * (3 - 2 * t);
		}

		/*
		 * The band of the galaxy across the sky of where the eye is (SceneCosmos, as a system sees it): a ray from the eye
		 * through this very galaxy (its arms, its dust, its bulge: Galaxy and Place of the Cosmos), its north the pole of the
		 * sky. Made again only when the eye went far enough to see it otherwise (300 ly); the one before stays till then. Null
		 * till the first is made.
		 */
		function bandSky (view) {
			var m = state.Data.Manifest;
			var e = view.Eye;
			var place = [Math.round(e[0] / 0.3) * 300, Math.round(e[1] / 0.03) * 30, Math.round(e[2] / 0.3) * 300];
			var out = Math.max(Math.sqrt(place[0] * place[0] + place[2] * place[2]), 1e-6);

			if (!engine.CosmosCubeOf) return null;

			if (state.FarKey !== m.ID) {
				state.FarKey = m.ID;
				state.Far = self.UniverseSky ? self.UniverseSky(m.ID) : null;
			}

			/* The galaxies round it seen too, as they are, when it is one of a universe shown (SceneUniverse). */
			return engine.CosmosCubeOf(Object.assign({Kind: 'galaxy', Seed: m.Seed + ':band', Pole: [0, 1, 0], Middle: [-place[0] / out, 0, -place[2] / out], Galaxy: galaxies.Cosmos(state.Data, 'centre').Galaxy, Place: place, Band: 1, Stars: 0.12, Galaxies: 0}, state.Far ? {Far: state.Far} : {}), 'galaxy-band', 512);
		}

		/* What is under a point of the screen: a star near, the black hole ('centre'), or ''. */
		/* How bright a star is drawn from the eye (as its points are: its light over the square of how far it is, the edge of the ball of the near ones), 0 to 1. */
		function brightness (star, place, eye) {
			var dx = place[0] / 1000 - eye[0];
			var dy = place[1] / 1000 - eye[1];
			var dz = place[2] / 1000 - eye[2];
			var far = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz) * 1000, 0.01);
			var seen = Math.log(Math.max(star.Luminosity / (far * far), 1e-12)) / Math.LN10;
			var centre = state.NearCentre || [0, 0, 0];
			var edge = state.NearReach ? Math.sqrt(Math.pow(star.Place[0] / 1000 - centre[0], 2) + Math.pow(star.Place[1] / 1000 - centre[1], 2) + Math.pow(star.Place[2] / 1000 - centre[2], 2)) / state.NearReach : 0;

			return Math.max(0, Math.min(1, (seen + 6.5) / 5.5)) * (1 - Math.max(0, Math.min(1, (edge - 0.55) / 0.43))) * nearness();
		}

		function pick (x, y) {
			var view;
			var best = '';
			var least = 14 * 14;
			var score = Infinity;
			var hole;

			if (!state.Data) return '';

			view = matrices();

			/*
			 * Regression: the nearest of all the stars of the sectors round was picked, the faint ones not drawn too, and a press
			 * on a star took another. Now only what is seen, by how bright it is drawn there: the brighter the farther it reaches.
			 */
			/*
			 * A nebula or a cluster under the pointer, as wide as it is drawn: one seen wide (14 pixels and more) with the pointer
			 * in its middle is picked before the stars in it; one seen small, when no star is nearer.
			 */
			var large = '';

			(state.List || []).forEach(function (one) {
				var place = now(one.Place);
				var at = screenOf(view.Matrix, place);
				var far;
				var wide;

				if (!at) return;

				far = Math.sqrt(Math.pow(place[0] / 1000 - view.Eye[0], 2) + Math.pow(place[1] / 1000 - view.Eye[1], 2) + Math.pow(place[2] / 1000 - view.Eye[2], 2));
				wide = Math.max(8, Math.min(80, one.Radius / 1000 / Math.max(far, 1e-4) / Math.tan(25 * Math.PI / 180) * scene.Height * 0.5));
				far = ((at[0] - x) * (at[0] - x) + (at[1] - y) * (at[1] - y)) / (wide * wide);

				if (far < 1 && far < score) {
					score = far;
					best = one.ID;
					large = wide >= 14 && far < 0.36 ? one.ID : '';
				}
			});

			if (large)
				return large;

			score = best ? 1 : Infinity;

			if (nearness() > 0.05) {
				state.Stars.forEach(function (star) {
					var place = now(star.Place);
					var at = screenOf(view.Matrix, place);
					var seen = brightness(star, place, view.Eye);
					var reach;
					var far;

					if (!at || seen < 0.08) return;

					reach = 4 + seen * 10;
					far = ((at[0] - x) * (at[0] - x) + (at[1] - y) * (at[1] - y)) / (reach * reach);

					if (far < 1 && far < score) {
						score = far;
						best = star.ID;
					}
				});
			}

			/* What was put in by hand (a star, a body of no system) is picked before the stars round it. */
			galaxies.Added(state.Data, number(self.GalaxyTime, 0)).forEach(function (body) {
				var at = screenOf(view.Matrix, body.Place);
				var far;

				if (!at) return;

				far = (at[0] - x) * (at[0] - x) + (at[1] - y) * (at[1] - y);

				if (far < 12 * 12 && far < least) {
					least = far;
					best = body.ID;
				}
			});

			hole = screenOf(view.Matrix, [0, 0, 0]);

			if (!best && hole && (hole[0] - x) * (hole[0] - x) + (hole[1] - y) * (hole[1] - y) < 10 * 10)
				best = 'centre';

			/* Regression: from far no star could be picked (none is drawn one by one there): the brightest of the sector under the pointer. */
			return best || farStar(view.Matrix, x, y);
		}

		/* The brightest star of the sector where the pointer meets the plane of the galaxy (or comes nearest its middle), or ''. */
		function farStar (matrix, x, y) {
			var m = state.Data.Manifest;
			var inverse = math.Invert(matrix);
			var nx = x / Math.max(1, scene.Width) * 2 - 1;
			var ny = 1 - y / Math.max(1, scene.Height) * 2;
			var from;
			var to;
			var way;
			var t;
			var at;
			var back;
			var found;

			if (!inverse) return '';

			from = unproject(inverse, nx, ny, -1);
			to = unproject(inverse, nx, ny, 1);
			way = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
			t = Math.abs(way[1]) > 1e-9 ? -from[1] / way[1] : -1;

			if (t < 0 || t > 1)
				t = Math.max(0, -(from[0] * way[0] + from[1] * way[1] + from[2] * way[2]) / Math.max(1e-12, way[0] * way[0] + way[1] * way[1] + way[2] * way[2]));

			at = [(from[0] + way[0] * t) * 1000, (from[1] + way[1] * t) * 1000, (from[2] + way[2] * t) * 1000];

			if (Math.sqrt(at[0] * at[0] + at[2] * at[2]) > m.Radius * 1.2) return '';

			back = then(at);
			found = galaxies.Sector(state.Data, Math.floor(back[0] / m.Sector), Math.floor(back[1] / m.Sector), Math.floor(back[2] / m.Sector), 400).Stars.reduce(function (most, star) {
				return !most || star.Luminosity > most.Luminosity ? star : most;
			}, null);

			return found ? found.ID : '';
		}

		/* A point of the screen (-1 to 1) at a depth (-1 near, 1 far) back in the world (kly). */
		function unproject (inverse, x, y, z) {
			var w = inverse[3] * x + inverse[7] * y + inverse[11] * z + inverse[15];

			return [(inverse[0] * x + inverse[4] * y + inverse[8] * z + inverse[12]) / w, (inverse[1] * x + inverse[5] * y + inverse[9] * z + inverse[13]) / w, (inverse[2] * x + inverse[6] * y + inverse[10] * z + inverse[14]) / w];
		}

		function starOf (id) {
			var found = state.Stars.filter(function (star) {
				return star.ID === id;
			})[0];

			return found || (id && state.Data ? galaxies.Star(state.Data, id) : null);
		}

		function picked (id) {
			state.Picked = id === 'centre' ? 'centre' : id || '';

			self.$Emit('galaxy', {ID: state.Picked === 'centre' ? '' : state.Picked, Centre: state.Picked === 'centre', Star: state.Picked && state.Picked !== 'centre' ? starOf(state.Picked) : null});
		}

		/* The view flies (seconds) to where it looks and its distance; done when it is there. */
		function fly (target, distance, seconds, done) {
			state.Flight = {From: state.Target.slice(), To: target, Near: state.Distance, Far: distance, Seconds: seconds, Spent: 0, Done: done || null};
		}

		function flightStep (elapsed) {
			var flight = state.Flight;
			var k;
			var e;
			var done;

			if (!flight) return;

			flight.Spent += elapsed;
			k = Math.min(1, flight.Spent / Math.max(1e-3, flight.Seconds));
			e = k * k * (3 - 2 * k);

			state.Target = [flight.From[0] + (flight.To[0] - flight.From[0]) * e, flight.From[1] + (flight.To[1] - flight.From[1]) * e, flight.From[2] + (flight.To[2] - flight.From[2]) * e];
			state.Distance = Math.exp(Math.log(flight.Near) + (Math.log(flight.Far) - Math.log(flight.Near)) * e);

			if (k < 1) return;

			done = flight.Done;
			state.Flight = null;

			if (done)
				done();
		}

		/* A star the view keeps to as the galaxy turns. */
		function follow () {
			var star = state.Picked && state.Picked !== 'centre' && !state.Flight ? starOf(state.Picked) : null;
			if (star && state.Follow === star.ID)
				state.Target = now(star.Place);
		}

		/*
		 * What the picture is of: the view, the time, the size, the quality, the galaxy and its edits, what is picked. The same
		 * as at the frame before: the view stood still.
		 */
		function signature (view) {
			var edits = state.Data.Edits || {};

			return [view.Matrix.join(','), number(self.GalaxyTime, 0), renderer.Width, renderer.Height, renderer.Ratio, self.Graphics ? self.Graphics().Level : '', state.Key, (edits.Added || []).length, (edits.Removed || []).length, Object.keys(edits.Overrides || {}).length, state.Picked, state.Follow, state.NearKey].join('|');
		}

		/* Asked for when the scene starts (engine.Warm): all its programs, waited for with the rest. */
		(engine.Warms = engine.Warms || []).push(function (setting) {
			if (setting === 'galaxy' && renderer)
				programs();
		});

		/* The picture of its plane till it is whole: a stage of the loading (a few rows a frame). */
		(engine.Bakes = engine.Bakes || []).push(function () {
			if (self.Setting !== 'galaxy' || !state.Data) return null;

			return {Name: 'galaxy', Done: state.PlaneSize ? Math.min(state.PlaneRow, state.PlaneSize) : 0, Total: state.PlaneSize || 1};
		});

		engine.GalaxyFrame = function (elapsed) {
			var view;
			var programsOf;
			var near;
			var time = number(self.GalaxyTime, 0);
			var hole;
			var star;
			var common;
			var drawn;
			var still;
			var seen;
			var inside;
			var sky;

			if (!state.Data) {
				renderer.Clear([0, 0, 0, 1]);

				state.Drawn = '';

				return;
			}

			state.Quad = state.Quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			/*
			 * The picture of its plane first, a few rows a frame (what was on the screen stays till it is whole); its bulge
			 * known before (regression: known after, its shape changed and its plane was made twice).
			 */
			glowMesh();

			if (!plane()) {
				state.Drawn = '';

				return;
			}

			view = matrices();
			programsOf = programs();
			near = nearness();

			/* Inside its disc, the band of it across the sky (once it is made: its light along the rays till then). */
			/*
			 * Made already while the eye is still a few times higher (its program is slow to make): ready when the eye comes
			 * into its disc. Regression: made only then, its flat cut was seen for seconds first.
			 */
			sky = insideOf(view, 4) > 0.001 ? bandSky(view) : null;

			if (insideOf(view, 4) > 0.001 && engine.CosmosBake)
				engine.CosmosBake();

			inside = sky ? insideOf(view) : 0;

			if (sky !== state.SkyCube || inside !== state.Inside) {
				state.SkyCube = sky;
				state.Inside = inside;
				state.Drawn = '';
			}

			drawn = signature(view);
			still = drawn === state.Drawn;

			/*
			 * Regression: all of it was drawn again at every frame, its rays too, and the card was busy all the time however
			 * still the view stood. Now nothing is drawn while nothing changes (the picture on the screen stays): once fine
			 * when the view stops, then only while the eye takes to its light.
			 */
			if (still && state.Fine >= number(state.Rounds, 6) && !renderer.Lost && Math.abs(Math.log(exposure(elapsed) / (state.Shown || 1))) < 0.004) {
				labels(view);

				return;
			}

			state.Drawn = drawn;

			/* Its light added up in floats (the core is many times brighter than the arms), then brought to the screen as an eye sees it. */
			if (!state.Light || state.Light.Width !== renderer.Width || state.Light.Height !== renderer.Height) {
				['Light', 'Front'].forEach(function (name) {
					if (state[name])
						state[name].Destroy();

					state[name] = renderer.Target(renderer.Width, renderer.Height, {Float: true});
				});

				still = false;
			}

			state.Quad = state.Quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			common = {uViewProjection: view.Matrix, uEye: view.Eye, uTime: time, uRatio: renderer.Ratio, uHeight: renderer.Height, uFocal: 1 / Math.tan(25 * Math.PI / 180)};

			/* The points (its sparkle, its knots, the stars round the eye, its stars near) and its rays: again only when the view changed. */
			if (!still) {
				state.Light.Begin();

				renderer.Clear([0, 0, 0, 0]);

				/* The stars far behind it, turning with the view alone. */
				engine.DrawReady(skyMesh(), programsOf.Sky, Object.assign({uTurn: view.Turn}, common), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});

				glowMesh();

				/* The sparkle of its stars over its light (the light itself is of the volume, below), fainter as the stars one by one come. */
				engine.DrawReady(state.Glow, programsOf.Glow, Object.assign({uSize: state.Data.Manifest.Radius / 1000 / 40, uGain: 0.42 * 90000 / state.GlowCount * number(state.Sparkle, 0.25), uFade: (1 - near * 0.85) * (1 - inside)}, common), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});

				/* The brightest stars of the wider cubes round the eye, over its glow and behind its dust as it is. */
				field(view, false);

				/* What was put in by hand, seen at any distance: a star warm white, a body of no system cyan. */
				added();

				if (state.AddedMesh)
					engine.DrawReady(state.AddedMesh, programsOf.Knot, Object.assign({uFade: 4, uClose: 0}, common), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});

				/* Its nebulae and clusters that shine, as wide as they are. */
				if (objectsMesh().Bright)
					engine.DrawReady(state.Objects.Bright, programsOf.Object, Object.assign({uDark: 0, uFade: 1 - 0.55 * inside}, common), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});

				/* Its knots of young stars: sharp points, never wider than a few pixels. */
				if (state.Knots)
					engine.DrawReady(state.Knots, programsOf.Knot, Object.assign({uFade: (1 - near * 0.85) * number(state.KnotLight, 0.35) * (1 - inside), uClose: 1}, common), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});

				state.Light.End();

				/*
				 * What is nearer the eye than its light and its dust begin, in a picture of its own laid over them, not dimmed by
				 * all the dust of the ray. Regression: dimmed so, seen from inside its disc the stars round the eye were gone
				 * below its plane, a black floor.
				 */
				state.Front.Begin();

				renderer.Clear([0, 0, 0, 0]);

				field(view, true);

				nearStar(view, common);

				if (near > 0.01) {
					nearStars();

					if (state.Near)
						engine.DrawReady(state.Near, programsOf.Near, Object.assign({uFade: near, uCentre: state.NearCentre, uReach: state.NearReach}, common), {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'});
				}

				state.Front.End();
			}

			/*
			 * Its light and its dust along the ray of each pixel (GalaxyVolumeShader): coarse while the view moves, fine when it
			 * stops. Regression: it was of soft spots of points, blurred near and too thin edgewise, its dust a black disc.
			 */
			if ((!still || state.Fine < number(state.Rounds, 6)) && (inside < 0.999 || !state.Volume)) volume(view, still);
			else if (inside >= 0.999) state.Fine = number(state.Rounds, 6);

			seen = exposure(elapsed);
			state.Shown = seen;

			renderer.Clear([0, 0, 0, 1]);

			/* A picture with something left out (a program not made yet) is drawn again at the next frame, not kept as it is. */
			if (engine.DrawReady(state.Quad, programsOf.Picture, {uPicture: state.Light.Textures[0], uFront: state.Front.Textures[0], uVolume: state.Volume.Textures[0], uExposure: seen, uInside: inside}, {Depth: false, DepthWrite: false, Blend: 'none', Cull: 'none'}) === false || renderer.Progress && renderer.Progress().Needed)
				state.Drawn = '';

			/* The band of it across the sky, seen from inside its disc. */
			if (sky && inside > 0.001 && engine.DrawReady(state.Quad, programsOf.Band, {uInverse: math.Invert(view.Turn), uCube: sky, uStrength: inside * number(state.BandLight, 2)}, {Depth: false, DepthWrite: false, Blend: 'add', Cull: 'none'}) === false)
				state.Drawn = '';

			/* Its dark clouds over the picture: they hide the light behind them. */
			if (state.Objects && state.Objects.Dark)
				engine.DrawReady(state.Objects.Dark, programsOf.Object, Object.assign({uDark: 1, uFade: 1}, common), {Depth: false, DepthWrite: false, Blend: 'alpha', Mode: 'points'});

			/* The star picked (or its black hole): a ring. */
			hole = [];
			star = state.Picked ? starOf(state.Picked) : null;

			if (star)
				hole.push({At: now(star.Place), Color: [0.5, 0.85, 1, 1], Size: 22, Dark: 0});

			if (state.Marks)
				state.Marks.Destroy();

			state.Marks = null;

			labels(view);

			if (!hole.length) return;

			state.Marks = renderer.Points([].concat.apply([], hole.map(function (mark) {
				return [mark.At[0] / 1000, mark.At[1] / 1000, mark.At[2] / 1000];
			})), {aColor: {Size: 4, Data: [].concat.apply([], hole.map(function (mark) {
				return [mark.Color[0], mark.Color[1], mark.Color[2], mark.Size + mark.Dark * 1000];
			}))}});

			engine.DrawReady(state.Marks, programsOf.Mark, common, {Depth: false, DepthWrite: false, Blend: 'alpha', Mode: 'points'});
		};

		/* The pointer, the wheel and the fingers while the galaxy is shown. */
		this.AddBehaviour({
			Step: function (elapsed) {
				var into = state.Into;

				/* What the galaxy does, drawn or not: the galaxy it shows, the flight of the view, the stars round it. */
				if (self.Setting === 'galaxy') {
					wanted();

					flightStep(elapsed);

					if (state.Data) {
						follow();

						if (nearness() > 0.01)
							nearList();

						handoff();
					}
				}
				else if (state.Labels) {
					state.Labels.hidden = true;
				}

				/* Into a system: its view comes from far as the scene shows it. */
				if (into && self.Setting !== 'galaxy') {
					into.Frames++;

					if (into.Frames === 2 && scene.Wanted) {
						scene.Distance = scene.Wanted * 40;
						state.Into = null;
					}
				}
			},

			Pointer: function (kind, event) {
				var point;
				var press = state.Press;
				var dx;
				var dy;
				var id;

				if (self.Setting !== 'galaxy') return false;

				point = engine.Local(event);

				if (kind === 'down') {
					state.Press = {X: point.X, Y: point.Y, Yaw: state.Yaw, Pitch: state.Pitch, Target: state.Target.slice(), Pan: event.button === 2 || event.shiftKey, Moved: false};

					if (event.preventDefault)
						event.preventDefault();

					return true;
				}

				if (kind === 'move' && press) {
					dx = point.X - press.X;
					dy = point.Y - press.Y;
					press.Moved = press.Moved || Math.abs(dx) + Math.abs(dy) > 4;

					if (press.Pan) pan(press, dx, dy);
					else turn(press, dx, dy);

					return true;
				}

				if (kind === 'move') return true;

				if (kind === 'up') {
					state.Press = null;

					if (press && !press.Moved) {
						id = pick(point.X, point.Y);

						picked(id);
					}

					return true;
				}

				if (kind === 'wheel') {
					if (event.preventDefault)
						event.preventDefault();

					zoom(state.Distance * Math.exp((event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY) * 0.0012));

					return true;
				}

				if (kind === 'double') {
					id = pick(point.X, point.Y);

					if (id)
						self.GalaxyFocus(id === 'centre' ? '' : id);

					return true;
				}

				return false;
			},

			Gesture: function (gesture) {
				var point;
				var id;

				if (self.Setting !== 'galaxy') return false;

				point = engine.Local({clientX: gesture.X, clientY: gesture.Y});

				if (gesture.Phase === 'start' || !state.Touch)
					state.Touch = {Yaw: state.Yaw, Pitch: state.Pitch, Target: state.Target.slice(), Distance: state.Distance};

				id = gesture.Type === 'tap' || gesture.Type === 'doubletap' ? pick(point.X, point.Y) : '';

				if (gesture.Type === 'tap') picked(id);
				else if (gesture.Type === 'doubletap' && id) self.GalaxyFocus(id === 'centre' ? '' : id);
				else if (gesture.Type === 'pan' && gesture.Pointers === 1) turn(state.Touch, gesture.DX, gesture.DY);
				else if (gesture.Type === 'pan' && gesture.Pointers === 2) pan(state.Touch, gesture.DX, gesture.DY);
				else if (gesture.Type === 'pinch') zoom(state.Touch.Distance / Math.max(0.05, gesture.Scale));

				return true;
			},

			Key: function (event) {
				if (self.Setting !== 'galaxy' || event.key !== 'Enter' || !state.Picked) return false;

				self.EnterSystem(state.Picked);

				return true;
			}
		});

		function turn (from, dx, dy) {
			state.Yaw = from.Yaw - dx * 0.006;
			state.Pitch = Math.max(-1.45, Math.min(1.45, from.Pitch + dy * 0.006));
		}

		/* Along the plane of the galaxy, as far as the view is from where it looks. */
		function pan (from, dx, dy) {
			var scale = state.Distance * 1.6 / Math.max(1, scene.Height);
			var right = [Math.cos(state.Yaw), 0, -Math.sin(state.Yaw)];
			var ahead = [-Math.sin(state.Yaw), 0, -Math.cos(state.Yaw)];

			state.Follow = '';
			state.Flight = null;
			state.Target = [from.Target[0] - (right[0] * dx - ahead[0] * dy) * scale, from.Target[1], from.Target[2] - (right[2] * dx - ahead[2] * dy) * scale];
		}

		function zoom (distance) {
			var most = state.Data ? state.Data.Manifest.Radius * 5 : 300000;

			state.Flight = null;
			/* Kept to a star, the view comes as near as its system (it goes into it there); else no nearer than half a light-year. */
			state.Distance = Math.max(state.Follow ? 5e-5 : 0.5, Math.min(most, distance));
		}

		state.Fly = fly;
		state.Wanted = wanted;
		state.NearList = nearList;
		state.Nearness = nearness;
		state.Brightness = brightness;
		state.ScreenOf = screenOf;
		state.Matrices = matrices;
		state.StarOf = starOf;
		state.Now = now;
		state.Pick = pick;
	},

	/*
	 * The shape of a galaxy for its shaders (in thousands of light-years): its old stars of its discs (a thin one, a thick
	 * one), the young ones on the ridges of its arms in clouds and the pink knots where they are born, its bulge (its arms
	 * begin at its edge, or at the ends of its bar), its halo; its dust in thin lanes on the inner side of its arms, torn in
	 * threads. sampleAt(p, light, dust): the light (rgb) and the dust at a place as it was at time 0.
	 */
	GalaxyShapeShader: function (noise) {
		return [
			'uniform float uKind;',
			'uniform float uRadius;',
			'uniform float uScale;',
			'uniform float uHeight;',
			'uniform float uBulge;',
			'uniform float uFlat;',
			'uniform float uBulgeBright;',
			'uniform float uArms;',
			'uniform float uPitch;',
			'uniform float uPhase;',
			'uniform float uBar;',
			'uniform float uRing;',
			'uniform float uWidth;',
			'uniform vec3 uShape;',
			'uniform float uSeed;',
			noise,
			this.$Service('GalaxyData').StructureGLSL,
			/* The arms at a place: the wave of the log spiral (bent by a noise), 0 to 1, shifted inward for the dust. */
			'float waveAt(vec3 p, float bend, float shift) {',
			'	float r = max(length(p.xz), 0.05);',
			'	float a = atan(p.z, p.x) - log(r) / tan(uPitch) - uPhase - shift + bend;',
			'	return 0.5 + 0.5 * cos(uArms * a);',
			'}',
			/*
			 * An octave of its noise as fine as the eye there makes out: its mean (0.5) where it would be finer than a pixel
			 * (foot: how wide a pixel is there, kly), so that far it is smooth and near it is as sharp as near.
			 */
			/*
			 * Regression: its noise was of values on a grid, and its clouds stood in squares (blocks seen from far): a noise of
			 * gradients now, turned off the axes of the grid (enx_gradient3: of the Noise Service, type gradient, the same in the page).
			 */
			'float octave(vec3 p, float size, float foot, float seed) {',
			'	float seen = smoothstep(foot * 0.7, foot * 2.0, size);',
			'	if (seen <= 0.0) return 0.5;',
			'	return mix(0.5, enx_gradient3(p / size + seed), seen);',
			'}',
			/*
			 * Noise along its spiral: of its phase round it (periodic: a circle of `across` cells a turn) and of the log of its
			 * radius (`along` cells a step of e): a cell is r / across round and r / (along sin(pitch)) along its arm, threads
			 * that follow its arms, as its dust and its arms are drawn.
			 */
			/* The way of the ray (the stars of a cell and its knots are where the ray crosses its plane: not smeared through its thickness). */
			'vec3 gRay = vec3(0.0, 1.0, 0.0);',
			/* How much of the grain of its stars is drawn (0 while the view moves: the rays are fewer than the pixels). */
			'float gGrain = 1.0;',
			'vec2 onPlane(vec3 p) {',
			'	return abs(gRay.y) > 0.5 ? p.xz - gRay.xz * (p.y / gRay.y) : p.xz;',
			'}',
			'float spiralNoise(float phase, float lr, float across, float along, float seed) {',
			'	return enx_gradient3(vec3(cos(phase) * across, sin(phase) * across, lr * along) + seed);',
			'}',
			/* A star of each cell of the plane as wide as a pixel there: 1 on the mean, most dark, a few bright (the grain of its stars). */
			'float speckle(vec2 at, float y, float foot) {',
			'	float size = exp2(floor(log2(max(foot * 0.9, 1e-5))));',
			/* Seen low over its plane: cells of space (a cell of the plane would stand as a column, streaks). */
			/* Cells of space, as tall as a part of its disc is thick but at most 3 times as tall as wide (regression: needles, streaks down the picture seen from near). */
			'	float tall = min(max(size, uHeight * 0.5), size * 3.0);',
			'	float h = hash3(vec3(floor(at / size), floor(y / tall) + 7.0 + uSeed));',
			'	return pow(h, 16.0) * 17.0;',
			'}',
			/*
			 * Its knots where stars are born: clumps on a grid of the plane, each cell at most one, where it is, how large and
			 * whether it is lit as GalaxyData.Knots worked them out (grid: x, z, size kly, weight a texel; uKnotGrid: its cell kly,
			 * its count, its half): each knot drawn is one of its nebulae. A few pink blobs round a blue core; 0 where none.
			 * Regression: drawn of a hash of the shader of their own, its nebulae stood elsewhere.
			 */
			'uniform sampler2D uKnotsA;',
			'uniform sampler2D uKnotsB;',
			'uniform vec3 uKnotGridA;',
			'uniform vec3 uKnotGridB;',
			'vec4 knots(sampler2D grid, vec3 info, vec2 at) {',
			'	vec2 base = floor(at / info.x) + info.z;',
			'	vec4 sum = vec4(0.0);',
			'	for (int i = -1; i <= 1; i++) {',
			'		for (int j = -1; j <= 1; j++) {',
			'			vec2 c = base + vec2(float(i), float(j));',
			'			if (c.x < 0.0 || c.y < 0.0 || c.x >= info.y || c.y >= info.y) continue;',
			'			vec4 v = texelFetch(grid, ivec2(c), 0);',
			'			if (v.w <= 0.0) continue;',
			'			vec2 site = v.xy;',
			'			float size = v.z;',
			'			float a = hash3(vec3(c, 3.0));',
			'			float b = hash3(vec3(c, 4.0));',
			'			float d = length(at - site);',
			'			float blob = exp(-d * d / (size * size));',
			'			float lobes = exp(-pow(length(at - site - vec2(a - 0.5, b - 0.5) * size * 1.6), 2.0) / (size * size * 0.3));',
			'			sum += vec4(vec3(1.0, 0.36, 0.45) * (blob * 0.8 + lobes * 0.9) + vec3(0.55, 0.7, 1.0) * exp(-d * d / (size * size * 0.06)) * 1.5, blob) * v.w;',
			'		}',
			'	}',
			'	return sum;',
			'}',
			/*
			 * What of it lies in its plane, at a place of its plane (foot: how wide what is made out there is, kly): a its arms (the
			 * light of its old stars), its ridges (its young ones), its lanes of dust and its threads of dust; b its knots (rgb) and
			 * the height of the middle of its layer of dust. Its volume reads them from a picture of its plane made once (planeAt
			 * is the most of its cost: computed again at each step of each ray, its card was busy for seconds).
			 */
			'void planeAt(vec3 p, float foot, out vec4 a, out vec4 b) {',
			'	float r = length(p.xz);',
			'	float start = uBar > 0.0 ? uBar * 1.05 : uBulge * 0.6;',
			'	float on = smoothstep(start, start * (uBar > 0.0 ? 1.3 : 2.5), r);',
			'	float arms = 1.0;',
			'	float ridge = 0.0;',
			'	float lane = 0.0;',
			'	float lr = log(max(r, 0.02) / max(uScale, 1e-3));',
			'	vec4 spiral = galaxy_spiral(p.xz, uScale, uRadius, uPitch, uPhase, uArms, uSeed, 0.0);',
			'	float phase = spiral.x;',
			'	if (uArms > 0.5) {',
			/* Its arms: the wave of its spiral, torn in pieces along it and with more arms between (flocculent), not two smooth bands. */
			'		float bend = spiral.y;',
			'		float w = spiral.z;',
			'		float pieces = spiralNoise(phase + bend, lr, 3.0, 0.8, uSeed);',
			'		float more = spiralNoise(phase + bend, lr, 7.0, 1.5, uSeed * 1.3);',
			'		float wave = pow(w, 2.0) * (0.45 + 1.1 * pieces) + pow(max(more - 0.45, 0.0) / 0.55, 1.5) * 0.9;',
			'		ridge = clamp(wave, 0.0, 1.6) * on;',
			'		arms = mix(1.0, 0.35 + 1.2 * wave, on);',
			/* Its dust on the inner side of its arms and all over its inner disc. */
			'		lane = (0.35 + 0.9 * pow(0.5 + 0.5 * cos(uArms * (phase + bend) + 0.9), 3.0)) * smoothstep(uBulge * 0.06, uBulge * 0.45, r);',
			'	}',
			'	if (uKind > 3.5) {',
			'		float ring = exp(-pow((r - uRing) / uWidth, 2.0));',
			'		arms = 0.25 + ring * 3.0;',
			'		ridge = ring;',
			'		lane = ring * 0.6 + 0.2;',
			'	}',
			'	if (uKind > 2.5 && uKind < 3.5) {',
			'		arms = pow(enx_gradient3(p / (uRadius / 4.0) + uSeed), 2.0) * 3.5;',
			'		ridge = arms * 0.3;',
			'		lane = arms * 0.2 + 0.2;',
			'	}',
			'	if (uKind < 0.5 && uArms < 0.5) lane = 0.25;',
			/*
			 * Its threads of dust as in the pictures (a flocculent spiral): thin, many, bent by a noise a thread apart and more,
			 * so that they wander, cross and branch; a noise sets how thick a thread is along it: it thins to nothing and breaks
			 * with sharp ends. Regression: smooth whole bands round it (a swirl); then blots cut out of a noise; then its threads
			 * cut in pieces by a noise (short blots, spots).
			 */
			/* How far apart its threads stand across them: a turn of its phase is 2 pi r tan(pitch) of radius (regression: taken as 2 pi r, its threads seen when finer than a pixel, a grainy mush, and as tall as wide many times: a fence, drips seen low). */
			'	float apart = max(r, 0.05) * 6.283 * tan(uPitch);',
			'	float seen1 = smoothstep(foot * 0.7, foot * 2.0, apart / 22.0 * 0.25);',
			'	float seen2 = smoothstep(foot * 0.7, foot * 2.0, apart / 55.0 * 0.25);',
			'	float seen3 = smoothstep(foot * 0.7, foot * 2.0, apart / 120.0 * 0.25);',
			/* Its threads bent a little, slowly along them (regression: bent fast, they zigzagged out from its middle: streaks seen from inside). */
			'	float wig = phase + (spiralNoise(phase, lr, 6.0, 1.5, uSeed * 1.9) - 0.5) * 0.35;',
			'	vec3 level = vec3(p.x, 0.0, p.z);',
			'	float bent = wig + (octave(level, uRadius / 40.0, foot, uSeed * 2.9) - 0.5) * 0.5 + (octave(level, uRadius / 110.0, foot, uSeed * 3.3) - 0.5) * 0.25;',
			'	float fray = (octave(level, uRadius / 600.0, foot, uSeed * 8.3) - 0.5) * 0.3;',
			'	float t1 = 1.0 - abs(2.0 * spiralNoise(bent, lr, 22.0, 7.0, uSeed * 2.1) - 1.0) + fray;',
			'	float t2 = 1.0 - abs(2.0 * spiralNoise(bent, lr, 55.0, 14.0, uSeed * 3.7) - 1.0) + fray;',
			'	float t3 = 1.0 - abs(2.0 * spiralNoise(bent, lr, 120.0, 26.0, uSeed * 4.1) - 1.0) + fray;',
			'	float w1 = 0.5 * smoothstep(0.4, 0.72, octave(level, uRadius / 90.0, foot, uSeed * 6.3) + (octave(level, uRadius / 240.0, foot, uSeed * 7.7) - 0.5) * 0.6);',
			'	float w2 = 0.4 * smoothstep(0.4, 0.72, octave(level, uRadius / 160.0, foot, uSeed * 5.3) + (octave(level, uRadius / 420.0, foot, uSeed * 4.9) - 0.5) * 0.6);',
			'	float th1 = clamp((t1 - 1.0 + w1) / max(w1 * 0.5, 0.01), 0.0, 1.0);',
			'	float th2 = clamp((t2 - 1.0 + w2) / max(w2 * 0.5, 0.01), 0.0, 1.0);',
			'	float th3 = clamp((t3 - 1.0 + w2 * 0.8) / max(w2 * 0.4, 0.01), 0.0, 1.0);',
			'	float broken = smoothstep(0.3, 0.6, spiralNoise(phase, lr, 11.0, 6.0, uSeed * 0.7));',
			/* Where its threads are finer than what is made out, their mean as torn as they are (regression: an even mean, smooth dark rings round it). */
			'	float threads = mix(0.12, th1 * (0.4 + broken) * 1.3, seen1) + mix(0.2 * w2 * (0.3 + broken), th2 * (0.3 + broken) * 0.9, seen2) + mix(0.1 * w2, th3 * 0.6, seen3);',
			/* Its knots where stars are born: pink clumps with blue cores along its arms. */
			'	vec4 k = vec4(0.0);',
			'	if (uKnotGridA.y > 0.5)',
			'		k = knots(uKnotsA, uKnotGridA, p.xz) + knots(uKnotsB, uKnotGridB, p.xz);',
			/* The middle of its layer of dust up and down a little, so that its threads stand at their own heights. */
			'	float middle = (octave(level, uRadius / 70.0, foot, uSeed * 1.7) + octave(level, uRadius / 200.0, foot, uSeed * 2.3) - 1.0) * uHeight * 0.6;',
			'	a = vec4(arms, ridge, lane, threads);',
			'	b = vec4(k.rgb, middle);',
			'}',
			/*
			 * The picture of its plane (made once, planeAt): u its angle round, v the log of its radius (its threads, along its
			 * spiral, run nearly along u; across them it is fine everywhere, finer in its middle). uPlaneMap: the log of the
			 * radius at v 0, 1 / the span of v in it, texels of v. uBaked 0: planeAt computed at each place (few places).
			 */
			'uniform sampler2D uPlaneA;',
			'uniform sampler2D uPlaneB;',
			'uniform vec3 uPlaneMap;',
			'uniform float uBaked;',
			/*
			 * Its picture read smoothly where a texel of it is wider than a pixel (a cubic B-spline of four reads): seen from near, a
			 * texel is tens of light-years. Regression: read as it is, the edges of its texels stood across the sky as straight bands
			 * and along its plane as streaks.
			 */
			'vec4 smoothRead(sampler2D map, vec2 uv) {',
			'	vec2 size = vec2(textureSize(map, 0));',
			'	vec2 p = uv * size - 0.5;',
			'	vec2 i = floor(p);',
			'	vec2 f = p - i;',
			'	vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0;',
			'	vec2 w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0;',
			'	vec2 w3 = f * f * f / 6.0;',
			'	vec2 w2 = 1.0 - w0 - w1 - w3;',
			'	vec2 g0 = w0 + w1;',
			'	vec2 g1 = w2 + w3;',
			'	vec2 h0 = (i - 0.5 + w1 / g0) / size;',
			'	vec2 h1 = (i + 1.5 + w3 / g1) / size;',
			'	return g0.y * (g0.x * textureLod(map, vec2(h0.x, h0.y), 0.0) + g1.x * textureLod(map, vec2(h1.x, h0.y), 0.0)) + g1.y * (g0.x * textureLod(map, vec2(h0.x, h1.y), 0.0) + g1.x * textureLod(map, vec2(h1.x, h1.y), 0.0));',
			'}',
			'void sampleAt(vec3 p, float foot, out vec3 light, out float dust) {',
			'	float r = length(p.xz);',
			'	float z = abs(p.y);',
			'	float edge = 1.0 - smoothstep(uRadius * 0.95, uRadius * 1.35, r);',
			'	light = vec3(0.0);',
			'	dust = 0.0;',
			'	if (uKind > 0.5 && uKind < 1.5) {',
			'		float q = length(p / uShape) / (uRadius * 0.22);',
			'		light = lightBulge * exp(-7.67 * (pow(max(q, 1e-3), 0.25) - 1.0)) * 0.02;',
			'		return;',
			'	}',
			'	if (uKind > 1.5 && uKind < 2.5) {',
			'		float q = length(p) / (uRadius * 0.25);',
			'		light = vec3(1.0, 0.86, 0.7) * pow(1.0 + q * q, -2.5) * 0.6;',
			'		return;',
			'	}',
			/* Its disc: old stars warm in its middle, bluer outward; its thick disc and its halo faint. */
			'	float thin = galaxy_thin(r, z, uScale, uHeight) * edge;',
			'	float thick = galaxy_thick(r, z, uScale, uHeight) * edge;',
			'	float halo = galaxy_halo(p, uRadius);',
			'	vec3 old = galaxy_old(r, uRadius);',
			/* Its bulge small and warm, its nucleus a bright point in it, its bar. */
			'	float bulge = galaxy_bulge(p, uBulge, uFlat, uBulgeBright, uBar, uPhase);',
			/*
			 * Its threads jostled across by a noise of space as fine as they are wide: ragged tubes, not sheets through its layer.
			 * Regression: a pattern of its plane through its whole layer, each edge a wall, and seen low near the walls stood
			 * down the picture as drips.
			 */
			'	float apart = max(r, 0.05) * 6.283 * tan(uPitch);',
			'	float shift = exp((octave(p, apart / 55.0 * 0.6, foot, uSeed * 6.7) - 0.5) * 0.7 * 6.283 * tan(uPitch) / 55.0);',
			'	vec3 q = vec3(p.x * shift, 0.0, p.z * shift);',
			'	vec4 a;',
			'	vec4 b;',
			'	if (uBaked > 0.5) {',
			'		float lr = log(max(r * shift, 0.02) / max(uScale, 1e-3));',
			'		vec2 uv = vec2(atan(q.z, q.x) / 6.28319 + 0.5, (lr - uPlaneMap.x) * uPlaneMap.y);',
			'		float lod = log2(max(foot * uPlaneMap.y * uPlaneMap.z / max(r, 0.02), 1.0));',
			'		if (lod < 1.0) {',
			'			a = mix(smoothRead(uPlaneA, uv), textureLod(uPlaneA, uv, 1.0), lod);',
			'			b = mix(smoothRead(uPlaneB, uv), textureLod(uPlaneB, uv, 1.0), lod);',
			'		} else {',
			'			a = textureLod(uPlaneA, uv, lod);',
			'			b = textureLod(uPlaneB, uv, lod);',
			'		}',
			'	} else planeAt(q, foot, a, b);',
			/* Its threads round in cut, each at its own height, and frayed by a noise of space (no walls). */
			'	float dy = p.y - b.w;',
			'	float tube = clamp(apart / 40.0 * 0.25, 1e-4, uHeight * 0.35);',
			'	float threads = a.w * exp(-dy * dy / (tube * tube)) * (0.4 + 1.2 * smoothstep(0.3, 0.7, octave(p, uRadius / 700.0, foot, uSeed * 9.1)));',
			/* The grain of its stars: a star of each pixel-wide cell, brighter where its arms are. */
			'	bool plane = z < uHeight * 8.0;',
			'	float grain = plane && gGrain > 0.0 ? mix(1.0, speckle(p.xz, p.y, foot), gGrain) : 1.0;',
			'	float young = exp(-r / uScale - z / (uHeight * 0.45)) * edge * a.y;',
			'	light = old * (thin * (0.25 + 0.45 * a.x) * (0.75 + 0.25 * grain) + thick) + lightYoung * young * 2.6 * (0.6 + 0.4 * grain) + lightBulge * bulge + vec3(0.9, 0.85, 0.8) * halo;',
			/* Its knots of young stars near its plane. */
			'	light += b.rgb * exp(-z / (uHeight * 0.3) - r / uScale) * edge * 4.0;',
			/*
			 * Its dust in a thin layer whose edge falls fast (regression: falling as exp(-z), its tail so dense that each patch,
			 * seen low, stood as a column hanging under it).
			 */
			'	dust = exp(-r / (uScale * 1.4) - pow(z / (uHeight * 0.45), 2.0)) * edge * a.z * threads * 6.5;',
			'}',
			/* A place now back to where it was at time 0 (Myr): the inner stars round sooner (a flat curve). */
			'vec3 backAt(vec3 p, float time) {',
			'	float spin = time * 0.734 / max(length(p.xz), 0.5);',
			'	return vec3(p.x * cos(spin) - p.z * sin(spin), p.y, p.x * sin(spin) + p.z * cos(spin));',
			'}'
		].join('\n');
	},

	/*
	 * The light of a galaxy and its dust along the ray of each pixel: its light (rgb) and how much of what lies behind passes
	 * (a). A ray takes more steps where it goes through the plane of the galaxy; what is nearer the eye than uNear is not of
	 * it (the stars round the eye are drawn one by one there, GalaxyFieldShader).
	 */
	GalaxyVolumeShader: function (head, noise) {
		return head + [
			'uniform vec2 uView;',
			'uniform mat4 uInverse;',
			'uniform vec3 uEye;',
			'uniform float uBright;',
			'uniform float uDust;',
			'uniform float uSteps;',
			'uniform float uTime;',
			'uniform float uNear;',
			'uniform float uNearKeep;',
			'uniform float uOuter;',
			'uniform float uKeep;',
			'uniform float uPixel;',
			'uniform float uRound;',
			'uniform float uGrain;',
			'out vec4 outColor;',
			this.GalaxyShapeShader(noise),
			'void main() {',
			/* Of where the pixel is on the screen, not of the quad (a band of rows is drawn at a time). */
			'	vec2 screen = gl_FragCoord.xy / uView * 2.0 - 1.0;',
			'	vec4 near = uInverse * vec4(screen, -1.0, 1.0);',
			'	vec4 far = uInverse * vec4(screen, 1.0, 1.0);',
			'	vec3 d = normalize(far.xyz / far.w - near.xyz / near.w);',
			'	vec3 o = uEye;',
			'	float bound = uRadius * 1.45;',
			'	float b = dot(o, d);',
			'	float c = dot(o, o) - bound * bound;',
			'	float h = b * b - c;',
			'	if (h < 0.0) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
			'	h = sqrt(h);',
			/* Its dust from the eye on (its light near the eye is of the stars drawn one by one): no edge where they begin. */
			'	float t0 = max(-b - h, 0.0);',
			'	float t1 = -b + h;',
			'	if (t1 <= t0) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
			/* The stretch round where the ray goes through the plane takes most of the steps. */
			/* Regression: the stretch was as thick as three of its bulge, the steps through its disc too long for its grain. */
			'	float slab = max(uHeight * 7.0, uBulge * uFlat * 2.0);',
			'	float a = t0;',
			'	float z = t1;',
			/*
			 * And the thin layer of its dust and young stars (a few of its heights) round its plane takes most of those.
			 * Regression: seen low from near, a step was as long as a patch of its dust, and its patches ran down the picture as drips.
			 */
			'	float ca = a;',
			'	float cb = a;',
			'	if (abs(d.y) > 1e-4) {',
			'		float t = -o.y / d.y;',
			'		float wide = slab / abs(d.y);',
			'		a = clamp(t - wide, t0, t1);',
			'		z = clamp(t + wide, t0, t1);',
			'		float core = uHeight * 1.2 / abs(d.y);',
			'		ca = clamp(t - core, a, z);',
			'		cb = clamp(t + core, a, z);',
			'	}',
			'	vec3 sum = vec3(0.0);',
			'	float pass = 1.0;',
			'	vec3 tint = vec3(1.0);',
			'	float spare = max(4.0, uSteps * 0.2);',
			/*
			 * Where its steps begin along the ray: of the cell of its plane the ray crosses, as wide as a pixel there (of the
			 * way of the ray when it crosses none). Regression: of the pixel of the screen, the grain of its stars stayed on the
			 * screen while the view went round, muddy spots over its arms.
			 * While the view moves (uGrain 0), the same place of each step for all rays and no grain: a smooth picture of the
			 * same mean. Regression: each ray its own, the noise of a third of the pixels stretched over the screen, soft spots.
			 */
			'	float meet = abs(d.y) > 1e-4 ? -o.y / d.y : -1.0;',
			'	vec3 cell = d / max(uPixel, 1e-7);',
			'	if (meet > 0.0) {',
			'		vec3 at = backAt(o + d * meet, uTime);',
			'		float size = exp2(floor(log2(max(meet * uPixel, 1e-6))));',
			'		cell = vec3(floor(at.xz / size), log2(size));',
			'	}',
			'	float jitter = fract(hash3(mod(floor(cell), 4096.0) + 0.5) + uRound);',
			'	gGrain = uGrain;',
			'	jitter = mix(0.5, jitter, uGrain);',
			'	float count = min(160.0, uSteps * (abs(o.y) < slab ? 2.0 : 1.0));',
			'	float share = cb > ca ? 0.6 : 0.0;',
			'	float rest = max(z - a - (cb - ca), 1e-6);',
			/* Its five stretches, front to back, and the steps of each (none where it is empty). */
			'	float n0 = a > t0 ? spare : 0.0;',
			'	float n1 = ca > a ? ceil(count * (1.0 - share) * (ca - a) / rest) : 0.0;',
			'	float n2 = cb > ca ? count * share : 0.0;',
			'	float n3 = z > cb ? ceil(count * (1.0 - share) * (z - cb) / rest) : 0.0;',
			'	float n4 = t1 > z ? spare : 0.0;',
			'	float e1 = n0 + n1;',
			'	float e2 = e1 + n2;',
			'	float e3 = e2 + n3;',
			'	float total = e3 + n4;',
			/*
			 * One loop over all its steps, its stretch picked by the number of the step: its light added as what is before it
			 * lets it through. Regression: a loop a stretch, and its shape inlined in each, took a minute to compile.
			 */
			'	for (int i = 0; i < 260; i++) {',
			'		float g = float(i);',
			'		if (g >= total || pass < 0.003) break;',
			'		float lo = t0;',
			'		float hi = a;',
			'		float n = n0;',
			'		float base = 0.0;',
			'		if (g >= e3) { lo = z; hi = t1; n = n4; base = e3; }',
			'		else if (g >= e2) { lo = cb; hi = z; n = n3; base = e2; }',
			'		else if (g >= e1) { lo = ca; hi = cb; n = n2; base = e1; }',
			'		else if (g >= n0) { lo = a; hi = ca; n = n1; base = n0; }',
			'		float ds = (hi - lo) / n;',
			'		float t = lo + (g - base + jitter) * ds;',
			'		vec3 light;',
			'		float dust;',
			'		gRay = d;',
			'		sampleAt(backAt(o + d * t, uTime), t * uPixel, light, dust);',
			/* Its dust reddens what lies behind it: brown threads, as in the pictures (regression: grey). */
			'		vec3 through = exp(-dust * uDust * ds * vec3(0.62, 0.8, 1.0) * 40.0);',
			/*
			 * Nearer than uNear a part of its light (uNearKeep) is glow and the rest its stars drawn one by one; out to uOuter its
			 * brightest ones (uKeep of its light left as glow). Regression: nearer than uNear all of it was stars one by one, and
			 * seen from inside its disc, its plane below the eye was black between them.
			 */
			'		float own = mix(uNearKeep, 1.0, smoothstep(uNear * 0.7, uNear, t)) * mix(uKeep, 1.0, smoothstep(uOuter * 0.7, uOuter, t));',
			'		sum += light * tint * ds * uBright * own;',
			'		tint *= through;',
			'		pass = dot(tint, vec3(0.3333));',
			'	}',
			'	outColor = vec4(sum, pass);',
			'}'
		].join('\n');
	},

	/*
	 * The picture of the plane of a galaxy (planeAt at each texel, made once, read by GalaxyVolumeShader): u its angle round,
	 * v the log of its radius; uPart 0 its arms, ridges, lanes and threads, 1 its knots and the middle of its dust.
	 */
	GalaxyPlaneShader: function (head, noise) {
		return head + [
			'uniform vec2 uSize;',
			'uniform float uPart;',
			'out vec4 outColor;',
			this.GalaxyShapeShader(noise),
			'void main() {',
			'	vec2 uv = gl_FragCoord.xy / uSize;',
			'	float r = max(uScale, 1e-3) * exp(uPlaneMap.x + uv.y / uPlaneMap.y);',
			'	float angle = (uv.x - 0.5) * 6.28319;',
			'	vec4 a;',
			'	vec4 b;',
			/* As fine as a texel across its threads (its mipmaps take it on far). */
			'	planeAt(vec3(r * cos(angle), 0.0, r * sin(angle)), r / (uPlaneMap.y * uPlaneMap.z), a, b);',
			'	outColor = uPart > 0.5 ? b : a;',
			'}'
		].join('\n');
	},

	/*
	 * The stars round the eye one by one, where the light of the galaxy would be a mist (GalaxyVolumeShader leaves them out):
	 * points of a cube of uCell (kly) laid over and over round the eye, each where it is in the galaxy however the eye moves,
	 * as bright as the light of the galaxy there (its old stars, its young ones, its bulge) over the square of how far it is.
	 */
	GalaxyFieldShader: function (head, noise) {
		return head + [
			'in vec3 aPosition;',
			'in vec4 aColor;',
			'uniform mat4 uViewProjection;',
			'uniform vec3 uEye;',
			'uniform float uTime;',
			'uniform float uRatio;',
			'uniform float uCell;',
			'uniform float uLight;',
			'uniform float uWeight;',
			'uniform float uInner;',
			'uniform vec3 uShift;',
			'out vec4 vColor;',
			this.GalaxyShapeShader(noise),
			'void main() {',
			/* Each cube of its own draw of the points (the same points scaled lay on rays from where they began: streaks). */
			'	vec3 own = fract(aPosition + uShift);',
			'	vec3 off = own * uCell - uEye;',
			'	off -= uCell * floor(off / uCell + 0.5);',
			'	vec3 at = uEye + off;',
			'	float far = length(off);',
			'	float edge = (1.0 - smoothstep(0.35, 0.5, far / uCell)) * smoothstep(uInner * 0.7, uInner, far);',
			'	vec3 tile = floor((own * uCell - off - uEye) / uCell + 0.5);',
			/* The sine of the hash of the very argument it had (its brightness has a long tail: a hash of a sine of too large an argument made too many bright ones). */
			'	float h = enx_white3(vec3(tile.xy, tile.z + aColor.w * 437.1 / 37.719));',
			'	vec3 light;',
			'	float dust;',
			'	sampleAt(backAt(at, uTime), uCell * 0.5, light, dust);',
			'	float lum = pow(1.0 - h * 0.99, -0.8) / 3.04;',
			'	float flux = dot(light, vec3(0.3333)) * lum * uLight * edge * uWeight / max(far * far, 1e-10);',
			'	if (flux < 0.0005 || edge <= 0.0) {',
			'		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);',
			'		gl_PointSize = 0.0;',
			'		vColor = vec4(0.0);',
			'		return;',
			'	}',
			'	float size = clamp(1.4 + log2(1.0 + flux) * 0.55, 1.4, 4.0);',
			'	vec3 tint = mix(light / max(max(light.r, max(light.g, light.b)), 1e-6), aColor.rgb, 0.45);',
			'	gl_Position = uViewProjection * vec4(at, 1.0);',
			'	gl_PointSize = size * uRatio;',
			'	vColor = vec4(tint, flux / (0.245 * size * size * uRatio * uRatio));',
			'}'
		].join('\n');
	},

	/* The shaders of a galaxy. */
	GalaxyShaders: function (head) {
		return {
			/* A point of glow: as big as the stars it stands for are wide, never less than a pixel (fainter then). */
			GlowVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform float uTime;',
				'uniform float uHeight;',
				'uniform float uFocal;',
				'uniform float uSize;',
				'uniform float uGain;',
				'uniform float uFade;',
				'out vec4 vColor;',
				'vec3 turned(vec3 p) {',
				'	float a = -uTime * 0.734 / max(length(p.xz), 0.5);',
				'	float c = cos(a);',
				'	float s = sin(a);',
				'	return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);',
				'}',
				'void main() {',
				'	vec3 at = turned(aPosition);',
				'	float far = max(length(at - uEye), 1e-5);',
				/* Regression: its points were soft spots up to a hundred pixels wide, a mist over its arms: sharp now, a pixel or two. */
				'	float size = uSize / far * uFocal * uHeight * 0.5 * 0.05;',
				'	gl_Position = uViewProjection * vec4(at, 1.0);',
				'	gl_PointSize = clamp(size, 1.2, 2.5);',
				'	float spread = min(1.0, size * size / (gl_PointSize * gl_PointSize) + 0.25);',
				'	float close = smoothstep(0.8, 2.5, far);',
				'	vColor = vec4(aColor.rgb, aColor.a * uGain * uFade * spread * close);',
				'}'
			].join('\n'),

			/* A star one by one: as bright as it is to the eye there (its light over the square of how far it is). */
			NearVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform float uTime;',
				'uniform float uRatio;',
				'uniform float uFade;',
				'uniform vec3 uCentre;',
				'uniform float uReach;',
				'out vec4 vColor;',
				'vec3 turned(vec3 p) {',
				'	float a = -uTime * 0.734 / max(length(p.xz), 0.5);',
				'	float c = cos(a);',
				'	float s = sin(a);',
				'	return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);',
				'}',
				'void main() {',
				'	vec3 at = turned(aPosition);',
				'	float far = max(length(at - uEye) * 1000.0, 0.01);',
				'	float edge = 1.0 - smoothstep(0.55, 0.98, length(aPosition - uCentre) / uReach);',
				'	float seen = log(max(aColor.a / (far * far), 1e-12)) / 2.302585;',
				'	float bright = clamp((seen + 6.5) / 5.5, 0.0, 1.0);',
				'	gl_Position = uViewProjection * vec4(at, 1.0);',
				'	gl_PointSize = (2.0 + bright * 7.0) * uRatio;',
				'	vColor = vec4(mix(vec3(1.0), aColor.rgb, 0.8), (0.12 + bright * 0.88) * uFade * edge);',
				'}'
			].join('\n'),

			Glow: head + [
				'in vec4 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 d = gl_PointCoord - vec2(0.5);',
				'	float r = dot(d, d) * 4.0;',
				'	outColor = vec4(vColor.rgb * vColor.a * exp(-r * 5.0) * step(r, 1.0), 1.0);',
				'}'
			].join('\n'),

			/* A star seen one by one: a sharp point in a soft halo. */
			Star: head + [
				'in vec4 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 d = gl_PointCoord - vec2(0.5);',
				'	float r = dot(d, d) * 4.0;',
				'	outColor = vec4(vColor.rgb * vColor.a * (exp(-r * 14.0) * 3.0 + exp(-r * 4.0) * 0.4) * step(r, 1.0), 1.0);',
				'}'
			].join('\n'),

			/* The stars far behind it: on a sphere round the eye, turned with the view alone. */
			SkyVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uTurn;',
				'uniform float uRatio;',
				'out vec4 vColor;',
				'void main() {',
				'	gl_Position = uTurn * vec4(aPosition * 5.0, 1.0);',
				'	gl_PointSize = (1.5 + min(aColor.a, 1.0) * 3.0) * uRatio;',
				'	vColor = vec4(aColor.rgb, aColor.a * 0.5);',
				'}'
			].join('\n'),

			/*
			 * A nebula or a cluster: a soft point as wide as it is (aColor.a, its radius in thousands of light years) where it is
			 * now, two pixels at the least, gone when it fills the view; a dark cloud drawn to hide (uDark).
			 */
			ObjectVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform float uTime;',
				'uniform float uRatio;',
				'uniform float uHeight;',
				'uniform float uFocal;',
				'uniform float uDark;',
				'out vec4 vColor;',
				'out float vSeed;',
				'vec3 turned(vec3 p) {',
				'	float a = -uTime * 0.734 / max(length(p.xz), 0.5);',
				'	float c = cos(a);',
				'	float s = sin(a);',
				'	return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);',
				'}',
				this.$Service('Noise').GLSLChunk(['enx_white3']),
				'void main() {',
				'	vec3 at = turned(aPosition);',
				'	float far = max(length(at - uEye), 1e-4);',
				'	float wide = aColor.a / far * uFocal * uHeight * 0.5;',
				'	gl_Position = uViewProjection * vec4(at, 1.0);',
				'	gl_PointSize = clamp(wide * 2.0, 2.0, 160.0) * uRatio;',
				'	vColor = vec4(aColor.rgb, clamp(wide / 4.0, mix(0.35, 0.08, uDark), 1.0) * (1.0 - smoothstep(60.0, 80.0, wide)));',
				'	vSeed = enx_white3(aPosition);',
				'}'
			].join('\n'),

			Object: head + [
				'in vec4 vColor;',
				'in float vSeed;',
				'uniform float uDark;',
				'uniform float uFade;',
				'out vec4 outColor;',
				this.$Service('Noise').GLSLChunk(['enx_white2']),
				'float hash2(vec2 p) {',
				'	return enx_white2(p);',
				'}',
				'float noise2(vec2 p) {',
				'	vec2 i = floor(p);',
				'	vec2 f = fract(p);',
				'	f = f * f * (3.0 - 2.0 * f);',
				'	return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);',
				'}',
				'void main() {',
				'	vec2 q = gl_PointCoord * 2.0 - 1.0;',
				/* A cloud, not a disc: ragged lobes of its own, turned its own way. Regression: round pink spots across the sky. */
				'	float a = vSeed * 6.28318;',
				'	vec2 p = mat2(cos(a), -sin(a), sin(a), cos(a)) * q;',
				'	float n = noise2(p * 2.5 + vSeed * 17.0) * 0.6 + noise2(p * 5.5 + vSeed * 31.0) * 0.4;',
				'	float d = dot(q, q);',
				'	float soft = exp(-d * (2.2 + 3.0 * (1.0 - n))) * (1.0 - smoothstep(0.6, 1.0, d)) * (0.35 + 0.9 * n * n);',
				'	outColor = vec4(vColor.rgb, soft * vColor.a * mix(1.0, 0.9, uDark) * uFade);',
				'}'
			].join('\n'),

			/* A knot of young stars: a sharp point as bright as it is, a few pixels wide however near. */
			KnotVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform float uTime;',
				'uniform float uRatio;',
				'uniform float uFade;',
				'uniform float uClose;',
				'out vec4 vColor;',
				'vec3 turned(vec3 p) {',
				'	float a = -uTime * 0.734 / max(length(p.xz), 0.5);',
				'	float c = cos(a);',
				'	float s = sin(a);',
				'	return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);',
				'}',
				'void main() {',
				'	vec3 at = turned(aPosition);',
				'	float far = max(length(at - uEye), 1e-4);',
				'	gl_Position = uViewProjection * vec4(at, 1.0);',
				'	gl_PointSize = clamp(2.0 + 60.0 / far, 2.0, 7.0) * uRatio;',
				'	vColor = vec4(aColor.rgb, aColor.a * uFade * mix(1.0, smoothstep(0.8, 2.5, far), uClose) * 1.2);',
				'}'
			].join('\n'),

			/* The star the view is near: in the direction of it from the eye, as large as it is (a few pixels at least). */
			SunVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uTurn;',
				'uniform vec3 uWay;',
				'uniform float uSize;',
				'void main() {',
				'	gl_Position = uTurn * vec4(uWay * 5.0, 1.0);',
				'	gl_PointSize = uSize;',
				'}'
			].join('\n'),

			Sun: head + [
				'uniform vec3 uColor;',
				'uniform float uDisc;',
				'uniform float uFade;',
				'uniform float uHole;',
				'out vec4 outColor;',
				'void main() {',
				'	float r = length(gl_PointCoord - vec2(0.5)) * 2.0;',
				'	float disc = smoothstep(uDisc * 0.5 + 0.02, uDisc * 0.5 - 0.02, r);',
				'	float corona = exp(-r * 4.0) * (1.0 - uDisc * 0.6) + exp(-r * 14.0) * 2.0 * (1.0 - uHole);',
				/* A black hole: dark in the middle, the bright ring of the light bent round it, the glow of its disc. */
				'	float ring = exp(-pow((r - max(uDisc, 0.08) * 0.5) / max(uDisc * 0.08, 0.025), 2.0));',
				'	vec3 lit = mix(uColor, vec3(1.0), 0.45) * (disc * 6.0 * (1.0 - uHole) + ring * uHole * 5.0 + corona * 2.5);',
				'	outColor = vec4(lit * (1.0 - disc * uHole) * uFade, 1.0);',
				'}'
			].join('\n'),

			/* The light added up, as an eye sees it: soft at its brightest, its faint arms kept. */
			Picture: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uPicture;',
				'uniform sampler2D uFront;',
				'uniform sampler2D uVolume;',
				'uniform float uExposure;',
				'uniform float uInside;',
				'out vec4 outColor;',
				'void main() {',
				/* Its rays a little smoothed (the steps of each pixel begin at a different place: a fine grain, not lines). */
				'	vec2 texel = 1.0 / vec2(textureSize(uVolume, 0));',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 lit = texture(uVolume, uv) * 0.36 + (texture(uVolume, uv + vec2(texel.x, 0.0)) + texture(uVolume, uv - vec2(texel.x, 0.0)) + texture(uVolume, uv + vec2(0.0, texel.y)) + texture(uVolume, uv - vec2(0.0, texel.y))) * 0.16;',
				/* Inside its disc its light is the band across the sky (Band), not of its rays. */
				'	lit = vec4(lit.rgb * (1.0 - uInside), mix(lit.a, 1.0, uInside));',
				'	vec3 light = (texture(uPicture, uv).rgb * lit.a + lit.rgb + texture(uFront, uv).rgb) * uExposure;',
				'	float bright = max(max(light.r, light.g), light.b);',
				'	vec3 seen = light / max(bright, 1e-6) * (1.0 - exp(-bright));',
				'	seen = mix(seen, vec3(1.0 - exp(-bright)), smoothstep(1.5, 8.0, bright) * 0.6);',
				'	outColor = vec4(pow(seen, vec3(0.85)), 1.0);',
				'}'
			].join('\n'),

			/* The band of the galaxy across the sky from inside its disc (a cube of SceneCosmos), added over the picture. */
			Band: head + [
				'in vec2 vQuad;',
				'uniform mat4 uInverse;',
				'uniform samplerCube uCube;',
				'uniform float uStrength;',
				'out vec4 outColor;',
				'void main() {',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(vQuad, -1.0, 1.0);',
				'	vec3 ray = normalize(far.xyz / far.w - close.xyz / close.w);',
				'	outColor = vec4(texture(uCube, ray).rgb * uStrength, 1.0);',
				'}'
			].join('\n'),

			/* The mean of the rounds of its fine light so far. */
			Mean: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uOld;',
				'uniform sampler2D uNew;',
				'uniform float uWeight;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = mix(texture(uOld, vQuad * 0.5 + 0.5), texture(uNew, vQuad * 0.5 + 0.5), uWeight);',
				'}'
			].join('\n'),

			/* The light of a few pixels of the picture, for how bright the eye takes it. */
			Meter: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uPicture;',
				'uniform sampler2D uVolume;',
				'out vec4 outColor;',
				'void main() {',
				/* The light of a sixteenth of the screen: a grid of its pixels over it, the stars over the glow as they are (not those round the eye: points that would darken all of it). */
				'	vec3 sum = vec3(0.0);',
				'	for (int i = 0; i < 6; i++) {',
				'		for (int j = 0; j < 6; j++) {',
				'			vec2 at = vQuad * 0.5 + 0.5 + (vec2(float(i), float(j)) - 2.5) / (16.0 * 6.0);',
				'			vec4 lit = texture(uVolume, at);',
				'			sum += texture(uPicture, at).rgb * lit.a + lit.rgb;',
				'		}',
				'	}',
				'	outColor = vec4(dot(sum / 36.0, vec3(0.2126, 0.7152, 0.0722)), 0.0, 0.0, 1.0);',
				'}'
			].join('\n'),

			/* A ring of a mark: its size in its alpha (a dark middle over a thousand: the black hole). */
			MarkVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform float uRatio;',
				'out vec4 vColor;',
				'out float vDark;',
				'void main() {',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'	vDark = step(999.0, aColor.a);',
				'	gl_PointSize = mod(aColor.a, 1000.0) * uRatio;',
				'	vColor = vec4(aColor.rgb, 1.0);',
				'}'
			].join('\n'),

			Mark: head + [
				'in vec4 vColor;',
				'in float vDark;',
				'out vec4 outColor;',
				'void main() {',
				'	float r = length(gl_PointCoord - vec2(0.5)) * 2.0;',
				'	float ring = smoothstep(0.62, 0.74, r) * smoothstep(1.0, 0.86, r);',
				'	float core = vDark * smoothstep(0.66, 0.5, r);',
				'	if (ring + core < 0.01) discard;',
				'	outColor = vec4(vColor.rgb * ring, max(ring, core * 0.92));',
				'}'
			].join('\n')
		};
	},

	GalaxyData: function () {
		return this.Engine && this.Engine().Galaxy ? this.Engine().Galaxy.Data : null;
	},

	GalaxyView: function () {
		var state = this.Engine().Galaxy;

		return {Target: state.Target.slice(), Yaw: state.Yaw, Pitch: state.Pitch, Distance: state.Distance};
	},

	SetGalaxyView: function (view) {
		var state = this.Engine().Galaxy;
		var given = view || {};

		/* Regression (load): a galaxy that came after the view was set put the view back over all of it; it comes first now. */
		state.Wanted();

		state.Flight = null;
		state.Follow = '';

		if (given.Target)
			state.Target = given.Target.slice();

		if (given.Yaw !== undefined)
			state.Yaw = Number(given.Yaw);

		if (given.Pitch !== undefined)
			state.Pitch = Number(given.Pitch);

		if (given.Distance !== undefined)
			state.Distance = Math.max(5e-5, Number(given.Distance));
	},

	GalaxyStars: function () {
		var state = this.Engine().Galaxy;

		state.Wanted();

		if (state.Data && state.Nearness() > 0.01)
			state.NearList();

		return state.Stars.map(function (star) {
			return Object.assign({}, star, {Place: state.Now(star.Place)});
		});
	},

	GalaxyPicked: function () {
		var picked = this.Engine().Galaxy.Picked;

		return picked === 'centre' ? '' : picked;
	},

	GalaxyEntered: function () {
		return this.Engine().Galaxy.Entered;
	},

	GalaxyFocus: function (id) {
		var state = this.Engine().Galaxy;
		var star = id && id !== 'centre' ? state.StarOf(id) : null;

		if (!state.Data) return;

		/* Its black hole (no ID, or 'centre'): the view flies to it and keeps to it as to a star (its system near it). */
		if (!star) {
			state.Picked = 'centre';

			state.Fly([0, 0, 0], Math.min(state.Distance, 60), 1.4, function () {
				state.Follow = 'centre';
			});

			return;
		}

		state.Picked = star.ID;

		/* A nebula or a cluster: seen whole, from a few of its widths. */
		state.Fly(state.Now(star.Place), star.Radius ? Math.max(star.Radius * 4, 60) : Math.min(state.Distance, 60), 1.4, function () {
			state.Follow = star.ID;
		});
	},

	EnterSystem: function (id, callback, options) {
		var self = this;
		var state = this.Engine().Galaxy;
		var galaxies = this.$Service('GalaxyData');
		var done = typeof callback === 'function' ? callback : function () {};
		var star = id ? state.StarOf(id) : null;
		var now = !!(options && options.Now);

		if (!state.Data || !star) {
			done(new Error('SceneGalaxy: no star ' + id));

			return;
		}

		state.Picked = star.ID;

		/* The galaxies round this one in its sky, as they are, when it is one of a universe shown (SceneUniverse). */
		function farOf () {
			var far = self.UniverseSky ? self.UniverseSky(state.Data.Manifest.ID) : null;

			return far ? {Far: far} : {};
		}

		/* Near it already (the view came to it): into its system at once, no flight back out. */
		function into () {
			var key = 'galaxy:' + state.Data.Manifest.ID + ':' + star.ID;

			self.$Service('SystemData').Use(key, galaxies.System(state.Data, star.ID));

			state.Entered = star.ID;
			state.Follow = star.ID;
			state.Into = {Frames: 0};

			self.Cosmos = Object.assign(galaxies.Cosmos(state.Data, star.ID), farOf());
			self.System = {Data: key};
			self.Setting = 'space';

			/* The scene made of its new System now, not at the next drawing of its template. */
			if (self.Engine().Props)
				self.Engine().Props();

			self.$Emit('enter', {ID: star.ID, Star: star, Key: key});

			done(null, key);
		}

		/* At once (Now: a ship that jumped there): the view of the map not flown (it flies only while the map is drawn). */
		if (now) {
			state.Target = state.Now(star.Place);
			state.Distance = Math.min(state.Distance, 0.8);

			into();

			return;
		}

		state.Fly(state.Now(star.Place), Math.min(state.Distance, 0.8), state.Follow === star.ID && state.Distance <= 0.8 ? 0 : 1.6, into);
	},

	/*
	 * The stars near the system it is in (its star entered), the nearest first: [{ID, Name, Class, Way (in the sky of the
	 * system: SceneCosmos), Distance (ly)}]; radius ly (30), limit (12). None out of a system.
	 */
	GalaxyNear: function (radius, limit) {
		var state = this.Engine().Galaxy;
		var galaxies = this.$Service('GalaxyData');
		var engine = this.Engine();
		var star = state.Entered ? state.StarOf(state.Entered) : null;
		var key;

		if (!state.Data || !star || !engine.GalaxySky) return [];

		key = [state.Entered, radius || 30, limit || 12, JSON.stringify(this.Cosmos || null)].join('|');

		if (state.NearKey2 !== key) {
			state.NearKey2 = key;
			state.Near2 = (galaxies.Search(state.Data, {Centre: star.Place, Radius: radius || 30, Type: 'star', Limit: (limit || 12) + 1}).Items || []).filter(function (one) {
				return one.ID !== star.ID;
			}).slice(0, limit || 12).map(function (one) {
				var way = [one.Place[0] - star.Place[0], one.Place[1] - star.Place[1], one.Place[2] - star.Place[2]];
				var far = Math.hypot(way[0], way[1], way[2]);

				return {ID: one.ID, Name: one.Name, Class: one.Class, Way: engine.GalaxySky([way[0] / far, way[1] / far, way[2] / far]), Distance: far};
			}).filter(function (one) {
				return !!one.Way;
			});
		}

		return state.Near2;
	},

	LeaveSystem: function (callback) {
		var state = this.Engine().Galaxy;
		var done = typeof callback === 'function' ? callback : function () {};
		var id = state.Entered;
		var star = id ? state.StarOf(id) : null;

		this.Setting = 'galaxy';
		state.Entered = '';

		/*
		 * Out from the star as far as the galaxy is seen whole round it (its radius and a fifth), the star in the middle.
		 * Regression: the view stopped 40 light years out, the stars near round it all that was seen of the galaxy.
		 */
		if (star) {
			state.Target = state.Now(star.Place);
			state.Distance = 0.8;

			state.Fly(state.Target, state.Data.Manifest.Radius * 1.2, 2.4);
		}

		this.$Emit('leave', {ID: id});

		done(null);
	}
});
