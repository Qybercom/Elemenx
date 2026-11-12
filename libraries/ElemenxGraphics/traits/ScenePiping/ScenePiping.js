/*
 * ScenePiping: the pipes of a Scene. An object of kind pipe (the trait Pipe: Points [[x, z] or [x, z, y]...], Radius,
 * Wall, Laid (above, ground or buried), Lift, Depth, Bend, Ends, Flanges, Spacing, Color, Inside, Metal, Fluid ({Type,
 * Fill, Flow, Pressure}) and Leaks; see ScenePipes) is drawn as its model, made again when it changes or the ground under it does;
 * a buried one cuts the ground (Carves): all of one a man may go in, the open ends of a smaller one. Pipes() gives them
 * laid out ([{ID, Radius, Wall, Laid, Ends, Fluid, Leaks, Points}]). A walker and the hero stand on the bottom of a pipe they are in and
 * on the top of one they are on, and go through no wall of one but in and out at its open ends; the Physics hold what is
 * solid (trait Rigid) in a pipe or out of it (a tube of its World). A buried one is the ground's: its floor is the ground's.
 *
 * What flows in a pipe comes out of it as it is: a liquid (water, sewage, mud, oil, fuel) as a fluid of particles of the
 * Physics, as heavy and as thick as it is, out of its open end as fast and as much as its Flow and Fill make (ScenePipes.Mouth)
 * and out of each hole of its wall under the level of it as fast as its Pressure drives (Leaks, ScenePipes.Spurt); it falls,
 * runs over the ground, gathers in its hollows and soaks away (water in 12 s, sewage 20, fuel 15, oil and mud in a minute).
 * A gas or steam is no fluid: a plume rises from the hole (steam white, a gas only a shimmer). A crack of a pipe of the trait
 * Fracture is a hole where it struck, as large as the blow; a pipe that breaks spills what was in it there. 400 particles at
 * most in a scene, the oldest go first; those of a pipe farther than 200 m from the eye wait. Fluids() gives them now.
 */
Elemenx.Trait('ScenePiping', {
	PipingStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var pipes = this.$Service('ScenePipes');
		var models = this.$Service('SceneModels');
		var physics = this.$Service('Physics');
		var vectors = this.$Service('Math').Vectors;
		var state = scene.Piping = {Laid: [], Keys: {}, Names: {}, Carves: [], CarvesKey: '', Made: 0, Flows: {}, Holes: {}, Plumes: {}, Program: null, Meshes: {}};
		var lives = {water: 12, sewage: 20, fuel: 15, oil: 60, mud: 60};
		var budget = 400;

		function ground () {
			var field = scene.Ground && scene.Ground.Field;

			return field ? function (x, z) {
				return Math.max(field.Water ? -1e9 : 0, field.Height(x, z));
			} : null;
		}

		/* The pipes of the scene, each laid out and its model made again only when it or the ground under its points changed; what flows in them, on. */
		engine.PipingStep = function (elapsed) {
			var height = ground();
			var found = Object.keys(scene.Objects).map(function (id) {
				return scene.Objects[id];
			}).filter(function (object) {
				return object.Traits && object.Traits.Pipe && (object.Traits.Pipe.Points || []).length > 1;
			});
			var laid = [];

			found.forEach(function (object) {
				var spec = Object.assign({ID: object.ID}, object.Traits.Pipe);
				var text = JSON.stringify(spec);
				var held = state.Keys[object.ID];
				var land = scene.Ground ? scene.Ground.Key : '';
				var heights;
				var key;
				var name;
				var made;

				/*
				 * Regression: the heights of the ground under each point of each pipe were asked each frame (a field of a sketch
				 * is slow to ask: 18 ms a frame in a world of a few pipes). They are asked again only when the pipe or the ground
				 * changed.
				 */
				if (held && held.Text === text && held.Land === land) {
					key = held.Key;
				}
				else {
					heights = height ? spec.Points.map(function (point) {
						return Math.round(height(point[0], point[1]) * 100);
					}) : [];
					key = JSON.stringify([spec, heights]);
				}

				if (held && held.Key === key) {
					held.Text = text;
					held.Land = land;

					laid.push(state.Keys[object.ID].Laid);

					object.Shape = state.Names[object.ID];

					return;
				}

				made = pipes.Lay(spec, height);
				/* A name of its own for each make: a model of the same name would be the one made before. */
				state.Made++;
				name = 'pipe:' + object.ID + ':' + state.Made;

				models.Define(name, {URL: name, Asset: pipes.Asset([made], {Height: height}), Fit: false, Type: 'prop'});

				state.Keys[object.ID] = {Key: key, Laid: made, Text: text, Land: land};
				state.Names[object.ID] = name;
				object.Shape = name;
				scene.StillLists = null;

				laid.push(made);
			});

			state.Laid = laid;

			flowing(Math.min(0.1, Math.max(0, Number(elapsed) || 0)));
		};

		/* The fluid of a pipe: a fluid of the Physics of its kind, its particles as large as half its bore (8 to 30 cm). */
		function flowOf (pipe) {
			var kind = pipes.Fluids()[pipe.Fluid.Type];
			var held = state.Flows[pipe.ID];
			var size = Math.max(0.08, Math.min(0.3, (pipe.Radius - pipe.Wall) * 0.5));

			var heights = new Map();

			if (held && held.Type === pipe.Fluid.Type) return held;

			/*
			 * The ground under it by cells of half a metre, each asked of the field once: the height of a field with a volume
			 * is sought down through it, too slow for each drop at each step (the ground under them does not change).
			 */
			held = state.Flows[pipe.ID] = {Type: pipe.Fluid.Type, Kind: kind, Size: size, Owed: 0, Sim: physics.Fluid({Radius: size, Density: kind.Density, Viscosity: 1 + kind.Viscosity * 0.5, Min: [-1e6, -1e6, -1e6], Max: [1e6, 1e6, 1e6], Step: 1 / 60, MaxSpeed: 22, Ground: function (x, z) {
				var field = scene.Ground && scene.Ground.Field;
				var cell = Math.round(x * 2) * 100003 + Math.round(z * 2);
				var height = heights.get(cell);

				if (height === undefined) {
					height = field ? field.Height(Math.round(x * 2) / 2, Math.round(z * 2) / 2) : 0;

					heights.set(cell, height);
				}

				return height;
			}})};

			return held;
		}

		/* Particles of a fluid out of a place: a stream as wide as across, so much a second (cubic metres), on its way at speed. */
		function pour (held, at, way, across, rate, speed, elapsed) {
			var volume = Math.pow(held.Size / 2, 3);
			var side = Math.abs(way[1]) > 0.9 ? [1, 0, 0] : [way[2], 0, -way[0]];
			var length = Math.hypot(side[0], side[1], side[2]) || 1;
			var count;

			side = [side[0] / length, side[1] / length, side[2] / length];
			held.Owed += rate * elapsed / volume;
			count = Math.min(12, Math.floor(held.Owed));
			held.Owed -= Math.floor(held.Owed);

			while (count-- > 0) {
				var spread = (Math.random() - 0.5) * 2 * across;
				var lift = (Math.random() - 0.5) * across;

				held.Sim.Add([at[0] + side[0] * spread, at[1] + lift, at[2] + side[2] * spread], [way[0] * speed + (Math.random() - 0.5) * 0.3, way[1] * speed + (Math.random() - 0.5) * 0.3, way[2] * speed + (Math.random() - 0.5) * 0.3]);
			}
		}

		/* A plume of a gas or of steam out of a place: an effect of the scene, once. */
		function plume (key, pipe, at, way) {
			var field = scene.Ground && scene.Ground.Field;

			if (state.Plumes[key]) return;

			state.Plumes[key] = 'plume-' + key;

			self.Add('effect', {ID: state.Plumes[key], X: at[0], Y: at[2], Lift: at[1] - Math.max(0, field ? field.Height(at[0], at[2]) : 0), Type: 'steam', Size: pipe.Fluid.Type === 'steam' ? Math.min(3, 0.8 + pipe.Fluid.Pressure * 0.25) : 0.5, Power: pipe.Fluid.Type === 'steam' ? Math.min(2, 0.6 + pipe.Fluid.Pressure * 0.15) : 0.15, Aim: way, Light: false});
		}

		/* What flows in each pipe out of its mouth and its holes; each fluid on; what soaked away, ran into the sea or is too many, gone. */
		function flowing (elapsed) {
			var eye = scene.Eye || [0, 0, 0];
			var total = 0;

			if (!elapsed || !scene.Ground || !scene.Ground.Field) return;

			state.Laid.forEach(function (pipe) {
				var kind = pipes.Fluids()[pipe.Fluid.Type];
				var mouth = pipes.Mouth(pipe);
				var near = vectors.Distance(eye, [pipe.Points[0].X, pipe.Points[0].Y, pipe.Points[0].Z]) < 200 + pipe.Points[pipe.Points.length - 1].Along;

				pipe.Leaks.concat(state.Holes[pipe.ID] || []).forEach(function (leak, index) {
					var hole = pipes.Hole(pipe, leak.Along, leak.Angle);
					var spurt;

					if (!hole.Wet) return;

					if (kind.Kind === 'gas') {
						plume(pipe.ID + '-' + index, pipe, hole.At, hole.Normal);

						return;
					}

					if (!near) return;

					spurt = pipes.Spurt(pipe, leak.Size);

					pour(flowOf(pipe), hole.At, hole.Normal, leak.Size, spurt.Rate, spurt.Speed, elapsed);
				});

				if (!mouth) return;

				if (kind.Kind === 'gas') {
					plume(pipe.ID + '-mouth', pipe, mouth.At, mouth.Way);

					return;
				}

				if (near)
					pour(flowOf(pipe), mouth.At, mouth.Way, mouth.Across * 0.6, mouth.Rate, Math.abs(pipe.Fluid.Flow), elapsed);
			});

			Object.keys(state.Flows).forEach(function (id) {
				var held = state.Flows[id];
				var life = lives[held.Type] || 20;
				var water = scene.Ground.Field.Water;

				held.Sim.Step(elapsed);
				held.Sim.Keep(function (p) {
					return p.Age < life && !(water && p.At[1] < -0.2) && p.At[1] > -200;
				});

				total += held.Sim.Count();
			});

			/* Too many: the oldest of each go first, each as many as its part of what is over. */
			if (total > budget) {
				Object.keys(state.Flows).forEach(function (id) {
					var held = state.Flows[id];
					var over = Math.ceil((total - budget) * held.Sim.Count() / total);
					var ages = held.Sim.Particles().map(function (p) {
						return p.Age;
					}).sort(function (a, b) {
						return b - a;
					});
					var cut = ages[over - 1];

					if (over > 0) {
						held.Sim.Keep(function (p) {
							return p.Age < cut;
						});
					}
				});
			}
		}

		/* The pipe laid out of an ID, or none. */
		function pipeOf (id) {
			return state.Laid.filter(function (one) {
				return one.ID === id;
			})[0] || null;
		}

		/* A crack of a pipe (trait Fracture) is a hole where it struck, as large as the blow. */
		self.$On('crack', function (event) {
			var pipe = pipeOf(event.ID);
			var near;
			var best = null;
			var angle;

			if (!pipe || !event.Point) return;

			near = pipes.Near(pipe, event.Point);

			/* Its angle round the pipe: of the holes every 10 degrees, the nearest to the point. */
			for (angle = -180; angle < 180; angle += 10) {
				var hole = pipes.Hole(pipe, near.Along, angle);
				var far = vectors.Distance(hole.At, event.Point);
				if (!best || far < best.Far)
					best = {Angle: angle, Far: far};
			}

			(state.Holes[pipe.ID] = state.Holes[pipe.ID] || []).push({Along: near.Along, Angle: best.Angle, Size: Math.min(0.1, 0.01 + (Number(event.Amount) || 0) * 0.0005)});
		});

		/* A pipe broken spills what was in it where it broke (as much as six metres of it hold). */
		self.$On('break', function (event) {
			var pipe = pipeOf(event.ID);
			var kind = pipe ? pipes.Fluids()[pipe.Fluid.Type] : null;
			var inner;

			if (!pipe || kind.Kind !== 'liquid' || pipe.Fluid.Fill <= 0) return;

			inner = pipe.Radius - pipe.Wall;

			pour(flowOf(pipe), event.Point || [pipe.Points[0].X, pipe.Points[0].Y, pipe.Points[0].Z], [0, 0.3, 0], inner, Math.PI * inner * inner * Math.min(6, pipe.Points[pipe.Points.length - 1].Along) * pipe.Fluid.Fill * 10, 2, 0.1);
		});

		engine.Fluids = function () {
			return Object.keys(state.Flows).map(function (id) {
				return {Pipe: id, Type: state.Flows[id].Type, Particles: state.Flows[id].Sim.Particles()};
			});
		};

		/* The fluids drawn: drops of their color, as clear as they are, lit as round as they are; a draw for each pipe. */
		engine.PipingDraw = function (matrix) {
			var ground = scene.Ground;
			var eye = scene.Eye || [0, 0, 0];
			var focal;
			var light;

			if (!renderer || !ground) return;

			focal = renderer.Height / (2 * Math.tan((scene.Camera.Fov || 45) * Math.PI / 360));
			light = [0, 1, 2].map(function (i) {
				return ground.SunColor[i] * Math.max(0.2, ground.Sun[1]) * 1.2 + ground.SkyLight[i];
			});

			Object.keys(state.Flows).forEach(function (id) {
				var held = state.Flows[id];
				var particles = held.Sim.Particles();
				var list = [];
				var positions;
				var mesh = state.Meshes[id];

				if (!particles.length) return;

				/* A drop that flies fast leaves a trail of three behind it along its way: a jet is a stream, not drops apart. */
				particles.forEach(function (p) {
					var fast = Math.hypot(p.Way[0], p.Way[1], p.Way[2]) > 3;
					var k;

					for (k = 0; k < (fast ? 4 : 1); k++)
						list.push(p.At[0] - p.Way[0] * k * 0.012 - eye[0], p.At[1] - p.Way[1] * k * 0.012 - eye[1], p.At[2] - p.Way[2] * k * 0.012 - eye[2]);
				});

				positions = new Float32Array(list);

				if (mesh) mesh.Update({Positions: positions, Indices: []});
				else mesh = state.Meshes[id] = renderer.Mesh({Positions: positions, Indices: []}, 'points');

				state.Program = state.Program || renderer.Program(self.PipingShaders().Vertex, self.PipingShaders().Drop);

				engine.DrawReady(mesh, state.Program, {uViewProjection: matrix, uSize: held.Size * 2.6 * focal, uColor: held.Kind.Color, uOpacity: Math.max(0.35, held.Kind.Opacity), uLight: light}, held.Kind.Opacity < 0.95 ? {Blend: 'over', DepthWrite: false} : {});
			});
		};

		/* What the buried pipes cut out of the ground; the same list while they do not change, so the ground is not made again. */
		engine.PipingCarves = function () {
			var made = pipes.Carves(state.Laid);
			var key = JSON.stringify(made);

			if (key !== state.CarvesKey) {
				state.CarvesKey = key;
				state.Carves = made;
			}

			return state.Carves;
		};

		engine.Pipes = function () {
			return state.Laid;
		};

		/* What stands in or on a pipe stands on it (the bottom in it, the top of it); a body goes into no wall of one. */
		engine.PipeFloor = function (x, z, y) {
			return state.Laid.length ? pipes.Floor(state.Laid.filter(function (pipe) {
				return pipe.Laid !== 'buried';
			}), x, z, y) : -Infinity;
		};

		engine.PipeBlocks = function (x, z, y, round, heights) {
			return state.Laid.length ? pipes.Blocks(state.Laid.filter(function (pipe) {
				return pipe.Laid !== 'buried';
			}), x, z, y, round, heights) : false;
		};
	},

	PipingShaders: function () {
		var head = '#version 300 es\nprecision highp float;\n';

		return {
			Vertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform float uSize;',
				'void main() {',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'	gl_PointSize = clamp(uSize / max(gl_Position.w, 0.01), 1.0, 128.0);',
				'}'
			].join('\n'),

			/* A drop: round, lit from over it and by the sky, a glint on it, its edge softer. */
			Drop: head + [
				'uniform vec3 uColor;',
				'uniform float uOpacity;',
				'uniform vec3 uLight;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 c = gl_PointCoord * 2.0 - 1.0;',
				'	float r = dot(c, c);',
				'	if (r > 1.0) discard;',
				'	vec3 n = normalize(vec3(c.x * 0.6, -c.y * 0.6, sqrt(1.0 - r)));',
				'	float lit = 0.45 + 0.55 * max(dot(n, normalize(vec3(0.2, 0.7, 0.6))), 0.0);',
				'	float glint = pow(max(dot(n, normalize(vec3(0.35, 0.55, 0.75))), 0.0), 40.0);',
				'	vec3 color = uColor * uLight * lit + vec3(glint * 0.8);',
				/* Its edge fades as a bell: drops near each other run into one body of it, not balls side by side. */
				'	outColor = vec4(color, uOpacity * exp(-r * 3.0));',
				'}'
			].join('\n')
		};
	},

	/* The fluids of the pipes now: [{Pipe, Type, Particles: [{At, Way, Density, Age}]}]. */
	Fluids: function () {
		var engine = this.Engine();

		return engine && engine.Fluids ? engine.Fluids() : [];
	},

	/* The pipes of the scene, laid out: [{ID, Radius, Wall, Laid, Ends, Fluid, Leaks, Points}]. */
	Pipes: function () {
		var engine = this.Engine();

		return engine && engine.Pipes ? engine.Pipes() : [];
	}
});
