/*
 * Scatter: what fills a ground in masses, with no object of its own for each thing. A GameObject of a kind with the
 * trait Scatter (forest, grove, thicket, rocks, or one of your own) sows models over a ground by its rules: Shapes (the
 * names of models), Density (a hundred square units), Size (the smallest and the largest, in sizes of the model),
 * MinHeight, MaxHeight, MaxSlope, Cover (0 to 1: how much of the ground its patches take, 1 all of it), Patch (the size
 * of its patches), Seed, Blocks (no way through them). A GameObject of a kind with the trait Grass (grass) grows blades
 * in the vertex shader round the view: Density, Height, Color, MaxHeight, MaxSlope.
 *
 * The things live in squares of the ground, typed arrays made a few at a time, the nearest first. Each square in view
 * gives its things to the stream of their model and level: near the whole model, farther two simpler ones (Models.Levels),
 * far a picture baked from all sides that is lit as the model is (Graphics3D.Target). The streams are made again only
 * when the view moved, so a still view costs no work, and a few draws show them all.
 *
 * Methods: Sown() ({Things, Squares, Waiting, Draws, Blades}).
 */
Elemenx.Trait('Scatter', {
	ScatterStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var graphics = this.$Service('Graphics3D');
		var library = this.$Service('Models');
		var vectors = graphics.Vectors;
		var shaders = this.ScatterShaders(graphics);
		var size = 48;
		var state = {Key: '', Squares: [], Waiting: [], Streams: {}, Meshes: {}, Baked: {}, Blocked: {}, Things: 0, Moved: true, Eye: null, Look: null, Grass: null, Field: null, Programs: null};

		this.Sown = function () {
			return {Things: state.Things, Squares: state.Squares.length, Waiting: state.Waiting.length, Draws: Object.keys(state.Streams).filter(function (key) {
				return state.Streams[key].Count;
			}).length, Blades: state.Grass ? state.Grass.Blades : 0};
		};

		function programs () {
			if (!state.Programs) {
				state.Programs = {
					Many: renderer.Program(shaders.Vertex, self.Shaders(graphics).Solid),
					Depth: renderer.Program(shaders.Vertex, self.Shaders(graphics).Depth),
					Bake: renderer.Program(shaders.BakeVertex, shaders.Bake),
					Picture: renderer.Program(shaders.PictureVertex, shaders.Picture),
					Grass: renderer.Program(shaders.GrassVertex, shaders.Grass)
				};
			}

			return state.Programs;
		}

		function rules () {
			return scene.Roots.filter(function (object) {
				return object.Traits.Scatter;
			}).map(function (object) {
				return Object.assign({ID: object.ID}, object.Traits.Scatter, object.Values);
			});
		}

		/* Everything sown goes when the ground or the rules changed. */
		function prepare () {
			var ground = scene.Ground;
			var given = rules();
			var key = ground ? ground.Key + JSON.stringify(given) : '';
			var half;
			var x;
			var z;

			if (key === state.Key) return;

			state.Key = key;
			state.Squares = [];
			state.Waiting = [];
			state.Blocked = {};
			state.Things = 0;
			state.Moved = true;

			if (!ground || ground.Field.Whole || !given.length) return;

			half = ground.Field.Size / 2;

			for (z = -half; z < half; z += size) {
				for (x = -half; x < half; x += size)
					state.Waiting.push({X: x, Z: z, Lists: {}});
			}
		}

		function chance (rule, place, field, noise) {
			var cover = rule.Cover === undefined ? 1 : Number(rule.Cover);
			var height = field.Height(place[0], place[1]);
			if (height < (rule.MinHeight === undefined ? 1 : Number(rule.MinHeight))) return null;
			if (rule.MaxHeight !== undefined && height > Number(rule.MaxHeight)) return null;
			if (field.Slope(place[0], place[1]) > (rule.MaxSlope === undefined ? 0.3 : Number(rule.MaxSlope))) return null;

			if (cover < 1 && noise.Fbm(place[0] / (Number(rule.Patch) || 60), 0.5, place[1] / (Number(rule.Patch) || 60), 3) * 1.6 - 0.3 > cover) return null;

			return height;
		}

		/* The things of a square: the same ones for the same seed, in arrays of their model. */
		function sow (square, field) {
			var lists = {};

			rules().forEach(function (rule) {
				var random = library.Random(String(rule.Seed === undefined ? rule.ID : rule.Seed) + ':' + square.X + ':' + square.Z);
				var noise = graphics.Noise(String(rule.Seed === undefined ? rule.ID : rule.Seed));
				var shapes = [].concat(rule.Shapes || 'pine');
				var count = Number(rule.Density === undefined ? 4 : rule.Density) * size * size / 100;
				var scale = rule.Size || [0.8, 1.3];
				var i;

				for (i = 0; i < count; i++) {
					var place = [square.X + random(0, size), square.Z + random(0, size)];
					var name = shapes[Math.floor(random(0, shapes.length))];
					var variant = Math.floor(random(0, 16));
					var height = chance(rule, place, field, noise);
					var info = library.Info(name);
					var key;
					var made;
					var tone;

					if (height === null || !info) continue;

					key = library.Make(name, {Variant: variant}).Key;
					made = lists[key] = lists[key] || {Places: [], Extra: []};
					tone = random(0.86, 1.1);

					made.Places.push(place[0], height - 0.05, place[1], info.Size * random(Number(scale[0]), Number(scale[1])));
					made.Extra.push(random(0, Math.PI * 2), tone, tone * random(0.94, 1.04), tone * random(0.92, 1));

					if (rule.Blocks !== false && rule.Blocks !== 'false' && info.Size > 2)
						state.Blocked[Math.floor(place[0] / 2) + ':' + Math.floor(place[1] / 2)] = true;

					state.Things++;
				}
			});

			Object.keys(lists).forEach(function (key) {
				square.Lists[key] = {Places: new Float32Array(lists[key].Places), Extra: new Float32Array(lists[key].Extra), Count: lists[key].Places.length / 4};
			});

			square.Center = [square.X + size / 2, field.Height(square.X + size / 2, square.Z + size / 2), square.Z + size / 2];
		}

		/* A few squares a frame, the nearest first: the view is never held up, and what is near comes first. */
		function grow () {
			var ground = scene.Ground;
			var started = performance.now();
			var eye = scene.Eye;

			if (!state.Waiting.length) return;

			/* What is sown from files, once they came. */
			if (rules().some(function (rule) {
				return [].concat(rule.Shapes || []).some(function (name) {
					return engine.Known(name) && !library.Ready(name);
				});
			})) return;

			state.Waiting.sort(function (a, b) {
				return Math.abs(b.X - eye[0]) + Math.abs(b.Z - eye[2]) - Math.abs(a.X - eye[0]) - Math.abs(a.Z - eye[2]);
			});

			while (state.Waiting.length && performance.now() - started < 4) {
				var square = state.Waiting.pop();

				sow(square, ground.Field);

				state.Squares.push(square);

				state.Moved = true;
			}
		}

		/* The six planes of a view, each [a, b, c, d] of the side a point is in when a x + b y + c z + d > 0. */
		function planes (m) {
			return [[m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]], [m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]], [m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]], [m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]], [m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]]].map(function (plane) {
				var length = Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2]) || 1;

				return plane.map(function (value) {
					return value / length;
				});
			});
		}

		function stream (key, level) {
			var name = key + '@' + level;
			if (!state.Streams[name])
				state.Streams[name] = {Key: key, Level: level, Count: 0, Capacity: 0, Places: null, Extra: null};

			return state.Streams[name];
		}

		function append (target, list) {
			var capacity = target.Capacity;
			var places;
			var extra;

			while (target.Count + list.Count > capacity)
				capacity = Math.max(1024, capacity * 2);

			if (capacity !== target.Capacity) {
				places = new Float32Array(capacity * 4);
				extra = new Float32Array(capacity * 4);

				if (target.Places) {
					places.set(target.Places);
					extra.set(target.Extra);
				}

				target.Places = places;
				target.Extra = extra;
				target.Capacity = capacity;
			}

			target.Places.set(list.Places, target.Count * 4);
			target.Extra.set(list.Extra, target.Count * 4);

			target.Count += list.Count;
		}

		function levels (key) {
			var parts = key.split('~');

			if (!state.Meshes[key]) {
				state.Meshes[key] = library.Levels(parts[0], {Variant: Number(parts[1])}).map(function (geometry) {
					return renderer.Mesh(geometry);
				});
			}

			return state.Meshes[key];
		}

		/* The streams of what is in view now, and each its copies for the draws. */
		function gather (matrix) {
			var view = planes(matrix);
			var eye = scene.Eye;
			var reach = scene.Camera.Ortho ? 0 : 1;
			var quality = self.ScatterReach ? self.ScatterReach() : 1;
			var radius = size * 0.75 + 12;

			Object.keys(state.Streams).forEach(function (name) {
				state.Streams[name].Count = 0;
			});

			state.Squares.forEach(function (square) {
				var x = square.Center[0] - eye[0];
				var y = square.Center[1] - eye[1];
				var z = square.Center[2] - eye[2];
				var inside = view.every(function (plane) {
					return plane[0] * x + plane[1] * y + plane[2] * z + plane[3] > -radius;
				});
				var distance = reach ? Math.sqrt(x * x + y * y + z * z) : scene.Camera.Ortho;
				var level;

				if (!inside) return;

				level = distance < 70 * quality ? 0 : distance < 160 * quality ? 1 : distance < 300 * quality ? 2 : 3;

				Object.keys(square.Lists).forEach(function (key) {
					append(stream(key, level), square.Lists[key]);
				});
			});

			Object.keys(state.Streams).forEach(function (name) {
				var each = state.Streams[name];
				var mesh = each.Level === 3 ? picture(each.Key).Quad : levels(each.Key)[each.Level];

				if (!each.Count) return;

				mesh.Instance({aInstance: {Size: 4, Data: each.Places.subarray(0, each.Count * 4)}, aInstance2: {Size: 4, Data: each.Extra.subarray(0, each.Count * 4)}}, each.Count);
			});
		}

		/* A picture of a model from all sides: a grid of views of the half of a ball above it, colors and normals. */
		function picture (key) {
			var parts = key.split('~');
			var cells = 6;
			var side = 96;
			var model;
			var whole;
			var bounds;
			var target;
			var mesh;
			var column;
			var row;

			if (state.Baked[key])
				return state.Baked[key];

			model = library.Make(parts[0], {Variant: Number(parts[1])});
			whole = library.Whole(model);
			bounds = library.Bounds(whole);
			target = renderer.Target(cells * side, cells * side, {Colors: 2, Depth: true});
			mesh = renderer.Mesh(whole);

			target.Begin();

			renderer.Clear([0, 0, 0, 0]);

			for (row = 0; row < cells; row++) {
				for (column = 0; column < cells; column++) {
					var a = [(column + 0.5) / cells * 2 - 1, (row + 0.5) / cells * 2 - 1];
					var o = [(a[0] + a[1]) / 2, (a[0] - a[1]) / 2];
					var direction = vectors.Normalize([o[0], Math.max(0.02, 1 - Math.abs(o[0]) - Math.abs(o[1])), o[1]]);
					var center = [0, bounds.Middle, 0];
					var up = Math.abs(direction[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0];
					var eye = vectors.Add(center, vectors.Scale(direction, bounds.Radius * 3));
					var matrix = graphics.Multiply(graphics.Orthographic(-bounds.Radius, bounds.Radius, -bounds.Radius, bounds.Radius, 0.01, bounds.Radius * 6), graphics.LookAt(eye, center, up));

					renderer.Viewport(column * side, row * side, side, side);

					renderer.Draw(mesh, programs().Bake, {uViewProjection: matrix}, {Cull: 'none'});
				}
			}

			target.End();

			mesh.Destroy();

			state.Baked[key] = {Target: target, Quad: renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]}), Radius: bounds.Radius, Middle: bounds.Middle, Cells: cells};

			return state.Baked[key];
		}

		/* The blades of a square of the ground: at their roots, with what the vertex shader makes them of. */
		function bladesMesh (count, extent) {
			var geometry = graphics.Geometry();
			var random = library.Random('grass:' + count);
			var i;
			var row;

			for (i = 0; i < count; i++) {
				var x = random(0, extent);
				var z = random(0, extent);
				var angle = random(0, Math.PI * 2);
				var seed = random(0, 1);
				var base = geometry.Positions.length / 3;

				[[-1, 0], [1, 0], [-0.7, 0.45], [0.7, 0.45], [0, 1]].forEach(function (corner) {
					geometry.Positions.push(x, corner[1], z);
					geometry.Normals.push(corner[0], angle, seed);
					geometry.UVs.push(0, 0);
				});

				for (row = 0; row < 3; row++)
					geometry.Indices.push(base + row, base + row + 1, base + row + 2);
			}

			return renderer.Mesh(geometry);
		}

		/* What the shader of the blades reads of the ground: its height, and where it may grow; made a row at a time. */
		function fieldOf (rule) {
			var ground = scene.Ground;
			var field = ground.Field;
			var side = 384;
			var key = ground.Key + JSON.stringify(rule);
			var grass = state.Grass;
			var started = performance.now();
			var half = field.Size / 2;
			var step = field.Size / (side - 1);
			var top = rule.MaxHeight === undefined ? field.Top * 0.45 : Number(rule.MaxHeight);
			var steep = rule.MaxSlope === undefined ? 0.28 : Number(rule.MaxSlope);
			var row;
			var x;

			if (!grass || grass.Key !== key) {
				if (grass && grass.Texture)
					grass.Texture.Destroy();

				grass = state.Grass = {Key: key, Data: new Float32Array(side * side * 4), Row: 0, Side: side, Texture: null, Blades: 0, Near: bladesMesh(1300, 7), Far: bladesMesh(330, 7), Patches: null};
			}

			while (grass.Row < side && performance.now() - started < 3) {
				row = grass.Row++;

				for (x = 0; x < side; x++) {
					var px = x * step - half;
					var pz = row * step - half;
					var height = field.Height(px, pz);
					var at = (row * side + x) * 4;

					grass.Data[at] = height;
					grass.Data[at + 1] = height > 1 && height < top && field.Slope(px, pz) < steep ? 1 : 0;
				}
			}

			if (grass.Row === side && !grass.Texture)
				grass.Texture = renderer.Texture({Width: side, Height: side, Data: grass.Data}, {Float: true, Nearest: true});

			return grass;
		}

		function drawGrass (uniforms, matrix) {
			var ground = scene.Ground;
			var rule = scene.Roots.filter(function (object) {
				return object.Traits.Grass;
			}).map(function (object) {
				return Object.assign({}, object.Traits.Grass, object.Values);
			})[0];
			var grass;
			var view;
			var eye = scene.Eye;
			var target = scene.Target || eye;
			var extent = 7;
			var near = [];
			var far = [];
			var patches = 22;
			var middleX;
			var middleZ;
			var x;
			var z;

			if (!rule || !ground || ground.Field.Whole) return;

			grass = fieldOf(rule);

			if (!grass.Texture) return;

			view = planes(matrix);
			middleX = Math.round(target[0] / extent) * extent;
			middleZ = Math.round(target[2] / extent) * extent;

			for (z = -patches; z <= patches; z++) {
				for (x = -patches; x <= patches; x++) {
					var px = middleX + x * extent;
					var pz = middleZ + z * extent;
					var dx = px + extent / 2 - eye[0];
					var dy = ground.Field.Height(px, pz) - eye[1];
					var dz = pz + extent / 2 - eye[2];
					var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
					var reach = patches * extent;
					if (x * x + z * z > patches * patches || distance > reach * 2) continue;

					if (!view.every(function (plane) {
						return plane[0] * dx + plane[1] * dy + plane[2] * dz + plane[3] > -extent * 2;
					})) continue;

					(distance < reach * 0.42 ? near : far).push(px, pz, 0, 0);
				}
			}

			grass.Near.Instance({aInstance: {Size: 4, Data: new Float32Array(near)}}, near.length / 4);
			grass.Far.Instance({aInstance: {Size: 4, Data: new Float32Array(far)}}, far.length / 4);

			grass.Blades = near.length / 4 * 1300 + far.length / 4 * 330;

			[[grass.Near, near], [grass.Far, far]].forEach(function (each) {
				if (each[1].length) {
					renderer.Draw(each[0], programs().Grass, Object.assign({}, uniforms, {uOrigin: vectors.Subtract([0, 0, 0], eye), uField: grass.Texture, uFieldSize: [ground.Field.Size, grass.Side], uBlade: [Number(rule.Height) || 0.7, Number(rule.Density) || 1, each[0] === grass.Far ? 2.2 : 1, patches * extent * 0.95], uRoot: engine.Paint(rule.Root || '#2f5a22').slice(0, 3), uTip: engine.Paint(rule.Color || '#7fae4a').slice(0, 3), uSun: ground.Sun, uSunColor: ground.SunColor, uEye: target}), {Cull: 'none'});
				}
			});
		}

		/* Before anything is drawn of a frame: what came, and the streams when the view moved. */
		engine.ScatterFrame = function (matrix) {
			var eye = scene.Eye;
			var look = matrix[2] + matrix[6] * 3 + matrix[10] * 7;

			prepare();

			grow();

			if (!state.Squares.length) return;

			if (state.Moved || !state.Eye || vectors.Distance(state.Eye, eye) > 6 || Math.abs(state.Look - look) > 0.04) {
				state.Moved = false;
				state.Eye = eye.slice();
				state.Look = look;

				gather(matrix);
			}
		};

		function each (callback) {
			Object.keys(state.Streams).forEach(function (name) {
				var one = state.Streams[name];
				if (one.Count)
					callback(one);
			});
		}

		engine.ScatterShadow = function (matrix) {
			var origin = vectors.Subtract([0, 0, 0], scene.Eye);

			each(function (one) {
				if (one.Level === 3) return;

				renderer.Draw(levels(one.Key)[Math.max(1, one.Level)], programs().Depth, {uViewProjection: matrix, uOrigin: origin, uWind: scene.Seconds, uSway: 0}, {Cull: 'none'});
			});
		};

		engine.ScatterDraw = function (uniforms, matrix) {
			var origin = vectors.Subtract([0, 0, 0], scene.Eye);
			var ground = scene.Ground;
			if (!ground) return;

			each(function (one) {
				var parts = one.Key.split('~');
				var made = library.Make(parts[0], {Variant: Number(parts[1])});
				var baked;

				if (one.Level < 3) {
					renderer.Draw(levels(one.Key)[one.Level], programs().Many, Object.assign({}, uniforms, {uOrigin: origin, uWind: scene.Seconds, uSway: made.Sway, uShine: 8, uSpecular: 0.05, uRough: 0.5, uSoft: made.Sway ? 0.9 : 0}), {Cull: 'back'});

					return;
				}

				baked = picture(one.Key);

				renderer.Draw(baked.Quad, programs().Picture, Object.assign({}, uniforms, {uOrigin: origin, uColors: baked.Target.Textures[0], uNormals: baked.Target.Textures[1], uCells: baked.Cells, uRadius: baked.Radius, uMiddle: baked.Middle, uSun: ground.Sun, uSunColor: ground.SunColor, uParallel: scene.Camera.Ortho ? vectors.Normalize(vectors.Subtract(scene.Camera.Position, scene.Camera.Target)).concat([1]) : [0, 0, 0, 0]}), {Cull: 'none'});
			});

			drawGrass(uniforms, matrix);
		};

		engine.ScatterBlocked = function (x, z) {
			var cellX = Math.floor(x / 2);
			var cellZ = Math.floor(z / 2);

			return !!state.Blocked[cellX + ':' + cellZ];
		};
	},

	/* The shaders of what is sown. */
	ScatterShaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\n';

		return {
			Vertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'in vec4 aInstance;',
				'in vec4 aInstance2;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform float uWind;',
				'uniform float uSway;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vLocal;',
				'out vec3 vColor;',
				'void main() {',
				'	float c = cos(aInstance2.x);',
				'	float s = sin(aInstance2.x);',
				'	vec3 p = aPosition * aInstance.w;',
				'	vec3 world = aInstance.xyz + uOrigin + vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x);',
				'	float phase = aInstance.x * 0.13 + aInstance.z * 0.17;',
				'	float bend = uSway * aPosition.y * aPosition.y * aInstance.w * 0.035;',
				'	world.xz += vec2(sin(uWind * 1.3 + phase), cos(uWind * 0.9 + phase * 1.7)) * bend;',
				'	vWorld = world;',
				'	vNormal = vec3(c * aNormal.x + s * aNormal.z, aNormal.y, c * aNormal.z - s * aNormal.x);',
				'	vLocal = aPosition;',
				'	vColor = aColor * aInstance2.yzw;',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'}'
			].join('\n'),

			BakeVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'uniform mat4 uViewProjection;',
				'out vec3 vNormal;',
				'out vec3 vColor;',
				'void main() {',
				'	vNormal = aNormal;',
				'	vColor = aColor;',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			Bake: head + [
				'in vec3 vNormal;',
				'in vec3 vColor;',
				'layout(location = 0) out vec4 outColor;',
				'layout(location = 1) out vec4 outNormal;',
				'void main() {',
				'	outColor = vec4(min(vColor, vec3(1.0)), 1.0);',
				'	outNormal = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);',
				'}'
			].join('\n'),

			PictureVertex: head + [
				'in vec3 aPosition;',
				'in vec4 aInstance;',
				'in vec4 aInstance2;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform float uCells;',
				'uniform float uRadius;',
				'uniform float uMiddle;',
				'uniform vec4 uParallel;',
				'out vec2 vUV;',
				'out vec3 vTint;',
				'out vec3 vWorld;',
				'out vec2 vTurn;',
				'void main() {',
				'	vec3 center = aInstance.xyz + uOrigin + vec3(0.0, uMiddle * aInstance.w, 0.0);',
				'	vec3 to = uParallel.w > 0.5 ? uParallel.xyz : normalize(-center);',
				'	float c = cos(aInstance2.x);',
				'	float s = sin(aInstance2.x);',
				'	vec3 v = vec3(c * to.x - s * to.z, max(to.y, 0.02), s * to.x + c * to.z);',
				'	vec2 o = v.xz / (abs(v.x) + abs(v.y) + abs(v.z));',
				'	vec2 grid = clamp(vec2(o.x + o.y, o.x - o.y) * 0.5 + 0.5, 0.0, 0.999);',
				'	vec2 cell = floor(grid * uCells);',
				'	vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), to));',
				'	vec3 up = cross(to, right);',
				'	vec3 world = center + (right * aPosition.x + up * aPosition.y) * uRadius * aInstance.w;',
				'	vUV = (cell + aPosition.xy * 0.5 + 0.5) / uCells;',
				'	vTint = aInstance2.yzw;',
				'	vWorld = world;',
				'	vTurn = vec2(c, s);',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'}'
			].join('\n'),

			Picture: head + [
				'in vec2 vUV;',
				'in vec3 vTint;',
				'in vec3 vWorld;',
				'in vec2 vTurn;',
				'uniform sampler2D uColors;',
				'uniform sampler2D uNormals;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSkyLight;',
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				graphics.Chunks.Shadow,
				'void main() {',
				'	vec4 color = texture(uColors, vUV);',
				'	if (color.a < 0.5) discard;',
				'	vec3 n = texture(uNormals, vUV).xyz * 2.0 - 1.0;',
				'	n = normalize(vec3(vTurn.x * n.x + vTurn.y * n.z, n.y, vTurn.x * n.z - vTurn.y * n.x));',
				'	float light = max(dot(n, uSun), 0.0) * sunShadow(vWorld, n);',
				'	vec3 albedo = pow(color.rgb * vTint, vec3(2.2));',
				'	outColor = vec4(pow(albedo * (uSunColor * light * 1.35 + mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) + sunBounce(vWorld)), vec3(1.0 / 2.2)), 1.0);',
				'}'
			].join('\n'),

			GrassVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec4 aInstance;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform vec3 uEye;',
				'uniform float uWind;',
				'uniform sampler2D uField;',
				'uniform vec2 uFieldSize;',
				'uniform vec4 uBlade;',
				'out vec3 vWorld;',
				'out float vAlong;',
				'out float vTone;',
				'vec2 ground(vec2 place) {',
				'	vec2 at = (place / uFieldSize.x + 0.5) * (uFieldSize.y - 1.0);',
				'	ivec2 cell = ivec2(floor(at));',
				'	vec2 t = at - vec2(cell);',
				'	vec2 a = mix(texelFetch(uField, cell, 0).xy, texelFetch(uField, cell + ivec2(1, 0), 0).xy, t.x);',
				'	vec2 b = mix(texelFetch(uField, cell + ivec2(0, 1), 0).xy, texelFetch(uField, cell + ivec2(1, 1), 0).xy, t.x);',
				'	return mix(a, b, t.y);',
				'}',
				'void main() {',
				'	vec2 place = aInstance.xy + aPosition.xz;',
				'	vec2 land = ground(place);',
				'	float along = aPosition.y;',
				'	float seed = aNormal.z;',
				'	float fade = 1.0 - smoothstep(uBlade.w * 0.7, uBlade.w, distance(place, uEye.xz));',
				'	float tall = uBlade.x * (0.55 + seed * 0.9) * smoothstep(0.35, 0.8, land.y) * fade * step(seed, uBlade.y);',
				'	vec2 side = vec2(cos(aNormal.y), sin(aNormal.y));',
				'	vec2 lean = vec2(-side.y, side.x) * (seed - 0.5) * 0.5 + vec2(sin(uWind * 1.4 + place.x * 0.21 + seed * 2.0), cos(uWind * 1.1 + place.y * 0.17)) * 0.32;',
				'	vec3 world = vec3(place.x, land.x, place.y) + uOrigin;',
				'	world.xz += side * aNormal.x * 0.035 * uBlade.z + lean * along * along * tall;',
				'	world.y += along * tall * step(0.01, tall);',
				'	vWorld = world;',
				'	vAlong = along;',
				'	vTone = 0.85 + seed * 0.3;',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'}'
			].join('\n'),

			Grass: head + [
				'in vec3 vWorld;',
				'in float vAlong;',
				'in float vTone;',
				'uniform vec3 uRoot;',
				'uniform vec3 uTip;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSkyLight;',
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				graphics.Chunks.Shadow,
				'void main() {',
				'	float light = max(uSun.y, 0.0) * sunShadow(vWorld, vec3(0.0, 1.0, 0.0));',
				'	vec3 color = pow(mix(uRoot, uTip, vAlong) * vTone, vec3(2.2));',
				'	float through = 1.0 + vAlong * 0.6;',
				'	outColor = vec4(pow(color * (uSunColor * light * 1.35 * through + mix(uFloorLight, uSkyLight, 0.5 + vAlong * 0.5) * (0.4 + vAlong * 0.6) + sunBounce(vWorld)), vec3(1.0 / 2.2)), 1.0);',
				'}'
			].join('\n')
		};
	}
});
