/*
 * SceneUniverse: a universe as a setting of a scene (Setting universe; UniverseData, docs/UNIVERSE-FORMAT.md). Universe is
 * what it shows: a key of UniverseData.Use, the URL of its file, its data, or options of UniverseData.Make ({Seed,
 * Galaxies, Home...}).
 *
 * Its galaxies round where the view looks are drawn as they are (the far galaxies of a backdrop: CosmosGalaxyGLSL of
 * SceneCosmos, each of its kind, its north and its seed), as large as they are and as far: a few pixels far off, a disc
 * of arms near; their light falls off as far as their size does (a galaxy smaller than a pixel is a faint point). Their
 * places are megaparsecs (Mpc) from the cube round the view, so the numbers stay small however far it is. A drag turns
 * the view round where it looks, a right drag (or with Shift) moves it, the wheel brings it near or far, a press picks a
 * galaxy (event universe: {ID, Galaxy}), a double press flies to it; fingers as ever. Enter, or coming as near as a few of
 * its radii to the galaxy the view keeps to, goes into it: the scene shows it (Setting galaxy, its Galaxy the data of it,
 * UniverseData.Galaxy), and the systems of its stars see the galaxies round it in their skies (UniverseSky: Far of
 * SceneCosmos). The picked one is marked with its name, its kind and how far it is.
 *
 * - UniverseData(): the data shown (null till it came). UniverseView(): {Target [x, y, z] (Mpc), Yaw, Pitch, Distance
 *   (Mpc)}; SetUniverseView(view). UniverseFocus(id): the view flies to a galaxy. UniversePicked(): the ID picked.
 * - UniverseGalaxies(): the galaxies round the view as they are drawn ({ID, Name, Kind, Radius, Place, Distance}).
 * - EnterGalaxy(id, callback, options): into a galaxy (options {Now: at once}); event entergalaxy {ID, Galaxy, Key}.
 *   LeaveGalaxy(callback): out to the universe again, the view drawing back from the galaxy; event leavegalaxy {ID}.
 *   UniverseEntered(): the ID of the galaxy shown ('' in none).
 * - UniverseSky(id): the far galaxies seen from a galaxy of the universe, as a backdrop has them (UniverseData.Sky), or
 *   null when it is not one of the universe shown.
 * - UniversePlace(): where the scene lies in its universe (Mpc): the galaxy entered, the place between galaxies it stands
 *   in, where the map looks; null with no universe. UniverseDeparture(toward): where a jump between galaxies leaves from
 *   toward a place: the edge of the galaxy entered on that side, or the place between galaxies.
 * - EnterUniverseGalaxy(id, from, callback): into a galaxy at its edge, in the system of the star there nearest the way
 *   from a place (Mpc; what a jump between galaxies arrives at: SceneVehicles), callback(error, star ID); UniverseEdge(id,
 *   from): that star.
 * - EnterVoid(place, callback): the scene stands between galaxies at a place (Mpc): empty space, no system, the galaxies
 *   round it in its sky as they are seen from there (UniverseData.SkyFrom), its own galaxy a great disc near it; event
 *   entervoid {Place}. UniverseVoid(): that place (null in a galaxy).
 */
Elemenx.Trait('SceneUniverse', {
	Universe: '',

	UniverseStart: function () {
		var self = this;
		var engine = this.Engine();
		var scene = this.Scene();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var universes = this.$Service('UniverseData');
		var state = {Key: null, Data: null, Loading: '', List: [], ListKey: '', Points: null, Origin: [0, 0, 0], Picked: '', Entered: '', Follow: '', Target: [0, 0, 0], Yaw: 0.6, Pitch: 0.45, Distance: 6, Flight: null, Press: null, Touch: null, Programs: null, Drawn: ''};

		engine.Universe = state;

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/* The universe the prop tells: a key, a URL (read once), data, or options of Make. */
		function wanted () {
			var given = self.Universe;
			var key = typeof given === 'string' ? given : given ? JSON.stringify(given.Manifest ? given.Manifest.ID : given) : '';
			var parsed;

			if (key === state.Key) return;

			state.Key = key;
			state.Data = null;
			state.ListKey = '';
			state.Picked = '';

			if (!given) return;

			if (typeof given === 'string' && universes.DataOf(given)) {
				shown(universes.DataOf(given));

				return;
			}

			if (typeof given === 'string' && /^\s*\{/.test(given)) {
				try {
					parsed = JSON.parse(given);
				}
				catch (error) {
					parsed = {Seed: given};
				}

				shown(parsed.Manifest ? parsed : universes.Make(parsed));

				return;
			}

			if (typeof given === 'string' && /[\/.]/.test(given)) {
				state.Loading = given;

				universes.Open(given, function (error, data) {
					if (state.Loading !== given || state.Key !== key) return;

					state.Loading = '';

					if (error) self.$Emit('error', {Reason: 'universe', Error: error});
					else shown(data);
				});

				return;
			}

			shown(given.Manifest ? given : universes.Make(typeof given === 'string' ? {Seed: given} : given));
		}

		/* A universe that came: the view of its home galaxy and those round it. */
		function shown (data) {
			var home = universes.Home(data);

			state.Data = data;

			if (!state.Flight && !state.Entered) {
				state.Target = home ? home.Place.slice(0, 3) : [0, 0, 0];
				state.Distance = 6;
			}

			self.$Emit('universeready', {ID: data.Manifest.ID, Data: data, Home: home});
		}

		/* How far round the view its galaxies are listed (Mpc): a few times as far as it is, 2 to 30. */
		function reach () {
			return Math.max(2, Math.min(30, state.Distance * 3));
		}

		/*
		 * The galaxies round the view, listed again when it moved a cube or its reach changed twice over: their places from
		 * the corner of the cube of the view (Origin), so the numbers drawn are small.
		 */
		function listed () {
			var cube = universes.CubeOf(state.Data, state.Target);
			var far = Math.pow(2, Math.ceil(Math.log(reach()) / Math.LN2));
			var key = cube.join('.') + ':' + far + ':' + JSON.stringify(state.Data.Edits);
			var size = state.Data.Manifest.Cube;
			var positions = [];
			var looks = [];

			if (key === state.ListKey) return state.List;

			state.ListKey = key;
			state.Origin = [cube[0] * size, cube[1] * size, cube[2] * size];
			state.List = universes.Near(state.Data, [state.Origin[0] + size / 2, state.Origin[1] + size / 2, state.Origin[2] + size / 2], far + size, 40000);

			state.List.forEach(function (one) {
				var pole = universes.Pole(one);
				var shape = universes.Shape(one);

				one.Look = [pole[0] * (1 + shape), pole[1] * (1 + shape), pole[2] * (1 + shape), one.Radius / universes.Units.ly];

				positions.push(one.Place[0] - state.Origin[0], one.Place[1] - state.Origin[1], one.Place[2] - state.Origin[2]);
				looks.push(one.Look[0], one.Look[1], one.Look[2], one.Look[3]);
			});

			if (state.Points)
				state.Points.Destroy();

			state.Points = positions.length ? renderer.Points(positions, {aColor: {Size: 4, Data: looks}}) : null;
			state.Drawn = '';

			return state.List;
		}

		function programs () {
			var shaders;

			if (state.Programs)
				return state.Programs;

			shaders = self.UniverseShaders();

			state.Programs = {
				Points: renderer.Program(shaders.PointVertex, shaders.Point),
				Near: renderer.Program(shaders.NearVertex, shaders.Near)
			};

			return state.Programs;
		}

		/* The eye (Mpc from Origin) of the view: round where it looks, at its distance. */
		function eye () {
			var d = state.Distance;
			var t = local(state.Target);

			return [t[0] + d * Math.cos(state.Pitch) * Math.sin(state.Yaw), t[1] + d * Math.sin(state.Pitch), t[2] + d * Math.cos(state.Pitch) * Math.cos(state.Yaw)];
		}

		function local (place) {
			return [place[0] - state.Origin[0], place[1] - state.Origin[1], place[2] - state.Origin[2]];
		}

		function matrices () {
			var from = eye();
			var to = local(state.Target);
			var aspect = renderer.Width / Math.max(1, renderer.Height);
			var projection = math.Perspective(50, aspect, Math.max(1e-6, state.Distance * 0.002), state.Distance * 4 + reach() * 4);
			var look = math.LookAt(from, to, [0, 1, 0]);

			return {Eye: from, Matrix: math.Multiply(projection, look), Right: [look[0], look[4], look[8]], Up: [look[1], look[5], look[9]], Focal: renderer.Height / 2 / Math.tan(25 * Math.PI / 180)};
		}

		/* The screen (css px) of a place (Mpc), or null behind the eye. */
		function screenOf (matrix, place) {
			var p = local(place);
			var x = matrix[0] * p[0] + matrix[4] * p[1] + matrix[8] * p[2] + matrix[12];
			var y = matrix[1] * p[0] + matrix[5] * p[1] + matrix[9] * p[2] + matrix[13];
			var w = matrix[3] * p[0] + matrix[7] * p[1] + matrix[11] * p[2] + matrix[15];
			if (w <= 0)
				return null;

			return [(x / w * 0.5 + 0.5) * scene.Width, (0.5 - y / w * 0.5) * scene.Height];
		}

		/* The galaxy under a point of the screen (its disc, or a few pixels round a small one), the nearest to the eye first. */
		function pick (x, y) {
			var view = matrices();
			var ratio = scene.Height / Math.max(1, renderer.Height);
			var best = null;

			state.List.forEach(function (one) {
				var at = screenOf(view.Matrix, one.Place);
				var far = math.Vectors.Distance(view.Eye, local(one.Place));
				var wide = Math.max(10, one.Look[3] / Math.max(far, 1e-9) * view.Focal * ratio * 1.2);
				var off = at ? Math.hypot(at[0] - x, at[1] - y) : Infinity;
				if (off > wide) return;

				if (!best || far < best.Far)
					best = {ID: one.ID, Far: far};
			});

			return best ? best.ID : '';
		}

		function galaxyOf (id) {
			return state.List.filter(function (one) {
				return one.ID === id;
			})[0] || (state.Data ? universes.Find(state.Data, id) : null);
		}

		function picked (id) {
			state.Picked = id;
			state.Follow = id;
			state.Drawn = '';

			self.$Emit('universe', {ID: id, Galaxy: id ? galaxyOf(id) : null});
		}

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

		/* Kept to a galaxy and come within a few of its radii of it: into it. */
		function handoff () {
			var galaxy = state.Follow && !state.Flight ? galaxyOf(state.Follow) : null;
			if (!galaxy || state.Distance > galaxy.Radius / universes.Units.ly * 3) return;

			self.EnterGalaxy(galaxy.ID, null, {Now: true});
		}

		/* The name of the galaxy picked, its kind and how far it is from the home one. */
		function labels (view) {
			var root = self.$Element();
			var box = state.Labels;
			var galaxy = state.Picked ? galaxyOf(state.Picked) : null;
			var home = universes.Home(state.Data);
			var wanted = [];
			var seen = {};

			if (!box && root) {
				box = state.Labels = document.createElement('div');
				box.className = 'elemenx-scene-galaxy-marks';

				root.appendChild(box);
			}

			if (!box) return;

			box.hidden = self.Setting !== 'universe';

			if (box.hidden) return;

			if (galaxy)
				wanted.push({Key: 'galaxy:' + galaxy.ID, Place: galaxy.Place, Text: galaxy.Name + ' · ' + galaxy.Kind + (home && home.ID !== galaxy.ID ? ' · ' + Math.round(universes.Distance(home.Place, galaxy.Place) * universes.Units.ly / 1e5) / 10 + ' Mly' : '')});

			if (home && (!galaxy || galaxy.ID !== home.ID))
				wanted.push({Key: 'home', Place: home.Place, Text: home.Name});

			wanted.forEach(function (mark) {
				var at = screenOf(view.Matrix, mark.Place);
				var element = box.querySelector('[data-key="' + mark.Key.replace(/"/g, '') + '"]');

				seen[mark.Key] = true;

				if (!element) {
					element = document.createElement('div');
					element.className = 'elemenx-scene-galaxy-mark star';

					element.setAttribute('data-key', mark.Key);

					element.innerHTML = '<span class="elemenx-scene-galaxy-mark-dot"></span><span class="elemenx-scene-galaxy-mark-label"></span>';

					box.appendChild(element);
				}

				element.lastChild.textContent = mark.Text;
				element.hidden = !at;

				if (at)
					element.style.transform = 'translate(' + Math.round(at[0]) + 'px, ' + Math.round(at[1]) + 'px)';
			});

			Array.prototype.slice.call(box.children).forEach(function (element) {
				if (!seen[element.getAttribute('data-key')])
					element.remove();
			});
		}

		engine.UniverseFrame = function () {
			var view;
			var made;
			var drawn;
			var common;

			if (!state.Data) {
				renderer.Clear([0, 0, 0, 1]);

				state.Drawn = '';

				return;
			}

			listed();

			view = matrices();
			made = programs();
			drawn = JSON.stringify([state.Target, state.Yaw, state.Pitch, state.Distance, renderer.Width, renderer.Height, state.ListKey, state.Picked]);

			/* Nothing is drawn while nothing changes: the picture on the screen stays. */
			if (drawn === state.Drawn && !renderer.Lost) {
				labels(view);

				return;
			}

			renderer.Clear([0, 0, 0, 1]);

			common = {uViewProjection: view.Matrix, uEye: view.Eye, uRight: view.Right, uUp: view.Up, uFocal: view.Focal, uMost: 48, uFloor: 0.6};

			state.Quad = state.Quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			/* The far ones as points (those wider than a point are left out of them), the near ones each on a square of its own. */
			if (state.Points && !engine.DrawReady(state.Points, made.Points, common, {Depth: false, DepthWrite: false, Blend: 'add', Mode: 'points'})) return;

			state.List.forEach(function (one) {
				var at = local(one.Place);
				var far = math.Vectors.Distance(view.Eye, at);
				if (one.Look[3] / Math.max(far, 1e-9) * 2 * 1.9 * view.Focal <= 48) return;

				engine.DrawReady(state.Quad, made.Near, Object.assign({uCenter: at, uLook: one.Look}, common), {Depth: false, DepthWrite: false, Blend: 'add', Cull: 'none'});
			});

			state.Drawn = drawn;

			labels(view);
		};

		/* The pointer, the wheel and the fingers while the universe is shown. */
		this.AddBehaviour({
			Step: function (elapsed) {
				/* The universe told, whatever is shown: a game in a galaxy of it has its skies of it (UniverseSky) and jumps between them. */
				wanted();

				if (self.Setting === 'universe') {
					flightStep(elapsed);

					if (state.Data)
						handoff();
				}
				else if (state.Labels) {
					state.Labels.hidden = true;
				}
			},

			Pointer: function (kind, event) {
				var point;
				var press = state.Press;
				var dx;
				var dy;
				var id;

				if (self.Setting !== 'universe') return false;

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

					if (press && !press.Moved)
						picked(pick(point.X, point.Y));

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
						self.UniverseFocus(id);

					return true;
				}

				return false;
			},

			Gesture: function (gesture) {
				var point;
				var id;

				if (self.Setting !== 'universe') return false;

				point = engine.Local({clientX: gesture.X, clientY: gesture.Y});

				if (gesture.Phase === 'start' || !state.Touch)
					state.Touch = {Yaw: state.Yaw, Pitch: state.Pitch, Target: state.Target.slice(), Distance: state.Distance};

				id = gesture.Type === 'tap' || gesture.Type === 'doubletap' ? pick(point.X, point.Y) : '';

				if (gesture.Type === 'tap') picked(id);
				else if (gesture.Type === 'doubletap' && id) self.UniverseFocus(id);
				else if (gesture.Type === 'pan' && gesture.Pointers === 1) turn(state.Touch, gesture.DX, gesture.DY);
				else if (gesture.Type === 'pan' && gesture.Pointers === 2) pan(state.Touch, gesture.DX, gesture.DY);
				else if (gesture.Type === 'pinch') zoom(state.Touch.Distance / Math.max(0.05, gesture.Scale));

				return true;
			},

			Key: function (event) {
				if (self.Setting !== 'universe' || event.key !== 'Enter' || !state.Picked) return false;

				self.EnterGalaxy(state.Picked);

				return true;
			}
		});

		function turn (from, dx, dy) {
			state.Yaw = from.Yaw - dx * 0.006;
			state.Pitch = Math.max(-1.45, Math.min(1.45, from.Pitch + dy * 0.006));
		}

		/* Across the view, as far as the view is from where it looks. */
		function pan (from, dx, dy) {
			var scale = state.Distance * 1.6 / Math.max(1, scene.Height);
			var right = [Math.cos(state.Yaw), 0, -Math.sin(state.Yaw)];
			var ahead = [-Math.sin(state.Yaw), 0, -Math.cos(state.Yaw)];

			state.Follow = '';
			state.Flight = null;
			state.Target = [from.Target[0] - (right[0] * dx - ahead[0] * dy) * scale, from.Target[1], from.Target[2] - (right[2] * dx - ahead[2] * dy) * scale];
		}

		/* Kept to a galaxy, as near as goes into it; else no nearer than a tenth of a megaparsec, no farther than 40. */
		function zoom (distance) {
			state.Flight = null;
			state.Distance = Math.max(state.Follow ? 0.005 : 0.1, Math.min(40, distance));
		}

		state.Fly = fly;
		state.Wanted = wanted;
		state.GalaxyOf = galaxyOf;
		state.Listed = listed;
		state.Matrices = matrices;
		state.ScreenOf = screenOf;
		state.Pick = pick;
		state.Number = number;
	},

	UniverseShaders: function () {
		var head = '#version 300 es\nprecision highp float;\n';
		var graphics = this.$Service('Renderer');
		var noise = [graphics.Chunks.Noise, this.$Service('Noise').GLSLChunk(['enx_gradient3']), this.$Service('SceneBlueprints').Galaxy(this.GalaxySpiral ? this.GalaxySpiral() : null).GLSL, 'float hash(vec3 p) {', '	return enx_white3(p);', '}', this.CosmosGalaxyGLSL()].join('\n');

		/*
		 * The light of a galaxy along a way d: its look (CosmosGalaxyGLSL) as wide as it is seen, at least a few pixels (its
		 * light spread over them then, as bright in all, but not fainter than uFloor of it: a map shows each), brought to the
		 * screen as an eye sees it.
		 */
		var seen = [
			'uniform float uFloor;',
			'vec4 seen(vec3 d, vec3 at, float wide, vec4 look, float pixel) {',
			'	float shown = max(wide, pixel * 1.5);',
			'	float l = length(look.xyz);',
			'	vec3 c = galaxy(d, vec4(at, shown), vec4(look.xyz / l, l - 1.0)) * max(wide * wide / (shown * shown), uFloor) * 1.6;',
			'	return vec4(c / (1.0 + c), 1.0);',
			'}'
		].join('\n');

		return {
			/* A far galaxy as a point as wide as it is seen, none wider than uMost pixels (those go on squares of their own). */
			PointVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform float uFocal;',
				'uniform float uMost;',
				'out vec3 vAt;',
				'out float vWide;',
				'out float vSize;',
				'out vec4 vLook;',
				'void main() {',
				'	vec3 to = aPosition - uEye;',
				'	float far = max(length(to), 1e-9);',
				'	vAt = to / far;',
				'	vWide = aColor.w / far;',
				'	vLook = aColor;',
				'	float size = vWide * 2.0 * 1.9 * uFocal;',
				'	vSize = clamp(size, 3.0, uMost);',
				'	gl_PointSize = vSize;',
				'	gl_Position = size > uMost ? vec4(2.0, 2.0, 2.0, 1.0) : uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			Point: head + [
				'in vec3 vAt;',
				'in float vWide;',
				'in float vSize;',
				'in vec4 vLook;',
				'uniform vec3 uRight;',
				'uniform vec3 uUp;',
				'uniform float uFocal;',
				'out vec4 outColor;',
				noise,
				seen,
				'void main() {',
				'	vec2 q = (gl_PointCoord - 0.5) * vec2(1.0, -1.0) * vSize / uFocal;',
				'	vec3 d = normalize(vAt + uRight * q.x + uUp * q.y);',
				'	outColor = seen(d, vAt, vWide, vLook, 1.0 / uFocal);',
				'}'
			].join('\n'),

			/* A near galaxy on a square round it facing the eye, each pixel its way from the eye. */
			NearVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uCenter;',
				'uniform vec4 uLook;',
				'uniform vec3 uRight;',
				'uniform vec3 uUp;',
				'out vec3 vWorld;',
				'void main() {',
				'	vWorld = uCenter + (uRight * aPosition.x + uUp * aPosition.y) * uLook.w * 2.0;',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			Near: head + [
				'in vec3 vWorld;',
				'uniform vec3 uEye;',
				'uniform vec3 uCenter;',
				'uniform vec4 uLook;',
				'uniform float uFocal;',
				'out vec4 outColor;',
				noise,
				seen,
				'void main() {',
				'	vec3 to = uCenter - uEye;',
				'	float far = length(to);',
				'	outColor = seen(normalize(vWorld - uEye), to / far, uLook.w / far, uLook, 1.0 / uFocal);',
				'}'
			].join('\n')
		};
	},

	UniverseData: function () {
		return this.Engine().Universe ? this.Engine().Universe.Data : null;
	},

	UniverseView: function () {
		var state = this.Engine().Universe;

		return {Target: state.Target.slice(), Yaw: state.Yaw, Pitch: state.Pitch, Distance: state.Distance};
	},

	SetUniverseView: function (view) {
		var state = this.Engine().Universe;
		var given = view || {};

		state.Flight = null;

		if (given.Target)
			state.Target = given.Target.slice(0, 3).map(Number);

		if (given.Yaw !== undefined)
			state.Yaw = Number(given.Yaw);

		if (given.Pitch !== undefined)
			state.Pitch = Math.max(-1.45, Math.min(1.45, Number(given.Pitch)));

		if (given.Distance !== undefined)
			state.Distance = Math.max(0.005, Math.min(40, Number(given.Distance)));

		state.Drawn = '';
	},

	UniverseGalaxies: function () {
		var state = this.Engine().Universe;
		if (!state.Data) return [];

		return state.Listed().map(function (one) {
			return {ID: one.ID, Name: one.Name, Kind: one.Kind, Radius: one.Radius, Place: one.Place.slice(0, 3), Distance: one.Distance};
		});
	},

	UniversePicked: function () {
		return this.Engine().Universe.Picked;
	},

	UniverseEntered: function () {
		return this.Engine().Universe.Entered;
	},

	/* The view flies to a galaxy, a few of its radii off it (as near again goes into it). */
	UniverseFocus: function (id) {
		var state = this.Engine().Universe;
		var galaxy = state.Data ? state.GalaxyOf(id) : null;
		if (!galaxy)
			return false;

		state.Picked = galaxy.ID;
		state.Follow = '';

		state.Fly(galaxy.Place.slice(0, 3), Math.max(0.05, galaxy.Radius / this.$Service('UniverseData').Units.ly * 8), 1.8, function () {
			state.Follow = galaxy.ID;
		});

		this.$Emit('universe', {ID: galaxy.ID, Galaxy: galaxy});

		return true;
	},

	EnterGalaxy: function (id, callback, options) {
		var self = this;
		var state = this.Engine().Universe;
		var universes = this.$Service('UniverseData');
		var done = typeof callback === 'function' ? callback : function () {};
		var galaxy = state.Data ? state.GalaxyOf(id) : null;
		var now = !!(options && options.Now);

		if (!galaxy) {
			done(new Error('SceneUniverse: no galaxy ' + id));

			return;
		}

		state.Picked = galaxy.ID;

		function into () {
			var key = 'universe:' + state.Data.Manifest.ID + ':' + galaxy.ID;

			self.$Service('GalaxyData').Use(key, universes.Galaxy(state.Data, galaxy.ID));

			state.Entered = galaxy.ID;
			state.Follow = '';
			state.Void = null;

			self.Galaxy = key;
			self.Setting = 'galaxy';

			if (self.Engine().Props)
				self.Engine().Props();

			self.$Emit('entergalaxy', {ID: galaxy.ID, Galaxy: galaxy, Key: key});

			done(null, key);
		}

		if (now) {
			state.Target = galaxy.Place.slice(0, 3);

			into();

			return;
		}

		state.Fly(galaxy.Place.slice(0, 3), Math.max(0.005, galaxy.Radius / universes.Units.ly * 2.5), 1.6, into);
	},

	LeaveGalaxy: function (callback) {
		var state = this.Engine().Universe;
		var done = typeof callback === 'function' ? callback : function () {};
		var id = state.Entered;
		var galaxy = id ? state.GalaxyOf(id) : null;

		if (this.GalaxyEntered && this.GalaxyEntered())
			this.LeaveSystem();

		this.Setting = 'universe';
		state.Entered = '';
		state.Void = null;
		state.Follow = '';
		state.Drawn = '';

		/* Out from the galaxy as far as those round it are seen. */
		if (galaxy) {
			state.Target = galaxy.Place.slice(0, 3);
			state.Distance = galaxy.Radius / this.$Service('UniverseData').Units.ly * 4;

			state.Fly(state.Target, 6, 2.4);
		}

		this.$Emit('leavegalaxy', {ID: id});

		done(null);
	},

	UniversePlace: function () {
		var state = this.Engine().Universe;
		var galaxy;

		if (!state || !state.Data) return null;

		if (state.Void)
			return state.Void.slice();

		galaxy = state.Entered ? state.GalaxyOf(state.Entered) : null;

		return galaxy ? galaxy.Place.slice(0, 3) : state.Target.slice();
	},

	/*
	 * Where a jump between galaxies leaves from toward a place (Mpc): the edge of the galaxy it is in on that side, or the
	 * place between galaxies it stands in; null with no universe.
	 */
	UniverseDeparture: function (toward) {
		var state = this.Engine().Universe;
		var galaxy = state && state.Data && !state.Void && state.Entered ? state.GalaxyOf(state.Entered) : null;
		var way;
		var far;

		if (!galaxy)
			return this.UniversePlace();

		way = [toward[0] - galaxy.Place[0], toward[1] - galaxy.Place[1], toward[2] - galaxy.Place[2]];
		far = Math.max(1e-9, Math.hypot(way[0], way[1], way[2]));

		return [0, 1, 2].map(function (axis) {
			return galaxy.Place[axis] + way[axis] / far * galaxy.Radius / this.$Service('UniverseData').Units.ly;
		}, this);
	},

	UniverseVoid: function () {
		var state = this.Engine().Universe;

		return state && state.Void ? state.Void.slice() : null;
	},

	/* The star at the edge of a galaxy nearest the way from a place: in its plane, a little in from its radius. */
	UniverseEdge: function (id, from) {
		var state = this.Engine().Universe;
		var universes = this.$Service('UniverseData');
		var galaxies = this.$Service('GalaxyData');
		var galaxy = state && state.Data ? state.GalaxyOf(id) : null;
		var data = galaxy ? universes.Galaxy(state.Data, galaxy.ID) : null;
		var radius;
		var way;
		var flat;
		var found;
		var i;

		if (!data)
			return '';

		radius = data.Manifest.Radius;
		way = universes.Into(universes.Frame(galaxy), this.$Service('Math').Vectors.Normalize([from[0] - galaxy.Place[0], from[1] - galaxy.Place[1], from[2] - galaxy.Place[2]]));
		flat = Math.hypot(way[0], way[2]) > 1e-6 ? [way[0] / Math.hypot(way[0], way[2]), 0, way[2] / Math.hypot(way[0], way[2])] : [1, 0, 0];

		for (i = 0; i < 4; i++) {
			found = galaxies.Search(data, {Centre: [flat[0] * radius * (0.85 - i * 0.12), 0, flat[2] * radius * (0.85 - i * 0.12)], Radius: 200, Type: 'star', Limit: 1, Budget: 40000}).Items[0];

			if (found)
				return found.ID;
		}

		return '';
	},

	EnterUniverseGalaxy: function (id, from, callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};
		var star = this.UniverseEdge(id, from);

		if (!star) {
			done(new Error('SceneUniverse: no star at the edge of ' + id));

			return;
		}

		this.EnterGalaxy(id, function (error) {
			if (error) {
				done(error);

				return;
			}

			/* The galaxy at once (it is made of its key now, not at the next step), then the system of the star. */
			self.Engine().Galaxy.Wanted();

			self.EnterSystem(star, function (failed) {
				done(failed || null, star);
			}, {Now: true});
		}, {Now: true});
	},

	EnterVoid: function (place, callback) {
		var state = this.Engine().Universe;
		var done = typeof callback === 'function' ? callback : function () {};
		var at;

		if (!state || !state.Data) {
			done(new Error('SceneUniverse: no universe'));

			return;
		}

		at = place.slice(0, 3).map(Number);

		state.Void = at;
		state.Entered = '';
		state.Target = at.slice();

		if (this.Engine().Galaxy)
			this.Engine().Galaxy.Entered = '';

		this.Cosmos = {Kind: 'void', Seed: 'void:' + at.map(function (value) {
			return Math.round(value * 1000);
		}).join(':'), Band: 0, Gas: 0, Dust: 0, Pillars: 0, Clusters: 0, Bursts: 0, Galaxies: 0, Stars: 0.04, Far: this.$Service('UniverseData').SkyFrom(state.Data, at)};
		this.System = {Objects: []};
		this.Setting = 'space';

		if (this.Engine().Props)
			this.Engine().Props();

		this.$Emit('entervoid', {Place: at.slice()});

		done(null, at.slice());
	},

	UniverseSky: function (id) {
		var state = this.Engine().Universe;
		if (!state || !state.Data || !this.$Service('UniverseData').Find(state.Data, id)) return null;

		return this.$Service('UniverseData').Sky(state.Data, id);
	}
});
