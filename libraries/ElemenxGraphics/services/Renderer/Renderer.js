/*
 * Renderer: the graphics of three dimensions on WebGL2, with no library: a camera and a renderer that draws shapes
 * (of the Meshes Service) with the shaders given to it; the numbers of space are of the Math Service.
 *
 * The camera runs in Node too (it reads no page):
 * - The matrices, the vectors, the rays and the noise are of the Math Service of ElemenxCommon.
 * - Camera(options) returns a camera ({Position, Target, Up, Fov, Near, Far, Ortho: the height of a view of parallel
 *   rays, 0 for a perspective}): View(), Projection(aspect),
 *   Matrix(aspect) (both), Orbit(target, yaw, pitch, distance) (it looks at target from round it), Ray(x, y, width,
 *   height) ({Origin, Direction} through a point of the screen), Project(point, width, height) ({X, Y, Depth,
 *   Visible}: where a point of space is on the screen).
 * - CloudBlock(size): the block of noise of clouds (RGBA of size on each side, a Uint8Array for Volume), the same each
 *   time; Work() the worker that makes it off the main thread.
 *   Chunks.Lights is the light of up to 4 points on a surface, with the shadows of up to 4 balls (lighting(position,
 *   normal, view, shine, specular); the global lightShade dims its first light). Chunks.Shadow reads a shadow map
 *   (sunShadow(position, normal): 0 in the shadow, 1 in the light; uniforms uShadowMap, uShadowMatrix, uShadowBias,
 *   uShadowOn).
 *
 * Create(canvas, options) returns a renderer, or null where there is no WebGL2 (options: Alpha, Antialias, Ratio); its
 * Destroy lets go of all it made, its context kept with those let go and given back the oldest first only when the page
 * would have more than MostContexts (10) living and let go (Contexts: {Live, Released}; Release(room) gives them back):
 * giving one back waits for the card to finish all it was given.
 * - Program(vertex, fragment, behind): the shaders compiled (each one once), their uniforms found; an error of GLSL is thrown
 *   with its log. With options Patient the card does that in the background and nothing waits for it: Ready(program) tells
 *   whether it is done (one not done after options Patience ms, 10 s, is waited for then: some cards make a program only
 *   when it is used or waited for), Progress() is {Done, Total, Needed} of the programs (behind: one nothing waits for), and a Draw with
 *   one not done yet waits, as it must. A slow shader so holds no frame up. Check(vertex, fragment) asks the card at once
 *   whether two shaders compile: their logs, or null. The attributes have fixed places: aPosition, aNormal, aUV, aColor, aInstance (and aInstance2 to
 *   aInstance5, one of each copy of an instanced mesh), aMaterials, aMaterials2 and aMaterials3 (the weights of 12
 *   materials of a ground, Materials of a geometry: 12 numbers a vertex, or 8 for the first two; 0 where it has none).
 * - Mesh(geometry, mode) returns a mesh (mode: triangles, lines, line-strip, line-loop or points; triangles by default): Update(geometry), Triangles(indices) (its triangles again, its points kept: a level of detail of clusters), Instance(data, count) (data {aInstance: {Size, Data}, ...}: the
 *   copies of the mesh drawn at once), Destroy(); Lines(points, loop) and Points(positions, extra) (extra {aColor:
 *   {Size, Data}}) make meshes of lines and of points.
 * - Texture(source, options) (a canvas, a picture, or {Width, Height, Data}; options Repeat, Nearest) returns a texture (Update(picture) puts another canvas or picture in it)
 *   for a uniform sampler2D; Volume(size, data) a repeating block of size^3 RGBA bytes for a sampler3D; Cube(size) a cube of six faces for a samplerCube, which Bake(cube, program, uniforms)
 *   draws once: the program is Shaders.Quad with a fragment shader that takes the direction of each texel from
 *   cubeDirection(uFace, vQuad) (Chunks.Cube): a surface of noise computed once, sampled at every frame.
 * - Target(width, height, {Colors, Depth, DepthTexture, Float, Samples, Mipmaps}) returns textures to draw into: Textures,
 *   Depth (with DepthTexture), Begin(), End() (it resolves the samples and makes the mipmaps), Destroy();
 *   Viewport(x, y, width, height) draws in a part of it. Texture takes options Float for an array of floats, Single for
 *   one byte a texel (a mask, read as .r), Srgb for the colors of a picture, Mipmaps, and Wrap and Filter of a sampler of glTF.
 * - Shadow(size) returns a shadow map, a depth texture for a uniform sampler2DShadow (Begin(region): what is drawn till End()
 *   goes into it, region [x, y, width, height] of texels only that part of it, cleared; Raw: the same for a sampler2D, to read
 *   its depths): between its Begin() and End() the
 *   draws write only its depth, as seen from the light; Destroy().
 * - Draw(mesh, program, uniforms, settings): settings Mode (triangles, lines, line-strip, line-loop, points), Blend
 *   (alpha; add; over: its color over what is behind, the alpha of that kept; veil: the same, that alpha gone as far as it
 *   covers it; or none), Depth (test, true; lequal: what is drawn again over the same surface passes), DepthWrite (true), Cull (back, front or none), Instances (the copies).
 *   The value of a uniform is a number, an array (of a vector, a matrix or a list of them), true or false, or a texture.
 * - Counts(): what it drew since it was made, {Draws, Triangles} (the copies of an instanced mesh counted): the
 *   difference of two of them is what a frame, or a second, costs.
 * - Resize(width, height, ratio), Clear(color) ([r, g, b, a], 0 to 1), Winding(clockwise) (the front of a triangle goes round
 *   clockwise: a world drawn as a mirror shows it), Lost (the context was taken by the browser),
 *   Destroy().
 */
Elemenx.Service('Renderer', {
	$Meta: {
		Description: 'The graphics of three dimensions on WebGL2: a camera and a renderer of shapes with shaders.',
		Methods: ['Create(canvas, options)', 'Camera(options)', 'Source(names)', 'CloudBlock(size)', 'Work()']
	},

	/* The places of the attributes, the same in every program: a mesh binds its buffers to them. */
	Locations: {aPosition: 0, aNormal: 1, aUV: 2, aColor: 3, aInstance: 4, aInstance2: 5, aInstance3: 6, aInstance4: 7, aInstance5: 8, aJoints: 9, aWeights: 10, aFrames: 11, aMaterials: 12, aMaterials2: 13, aMaterials3: 14},

	Camera: function (options) {
		var math = this.$Service('Math');
		var settings = options || {};
		var camera = {
			Position: settings.Position || [0, 0, 10],
			Target: settings.Target || [0, 0, 0],
			Up: settings.Up || [0, 1, 0],
			Fov: settings.Fov || 50,
			Near: settings.Near || 0.1,
			Far: settings.Far || 1000,
			Ortho: settings.Ortho || 0
		};

		camera.View = function () {
			return math.LookAt(camera.Position, camera.Target, camera.Up);
		};

		camera.Projection = function (aspect) {
			var half = camera.Ortho / 2;
			if (half)
				return math.Orthographic(-half * (aspect || 1), half * (aspect || 1), -half, half, camera.Near, camera.Far);

			return math.Perspective(camera.Fov, aspect || 1, camera.Near, camera.Far);
		};

		camera.Matrix = function (aspect) {
			return math.Multiply(camera.Projection(aspect), camera.View());
		};

		/* Round a point: yaw about the axis Y, pitch up from its plane (radians), at a distance. */
		camera.Orbit = function (target, yaw, pitch, distance) {
			var flat = Math.cos(pitch) * distance;

			camera.Target = target.slice();
			camera.Position = [target[0] + Math.sin(yaw) * flat, target[1] + Math.sin(pitch) * distance, target[2] + Math.cos(yaw) * flat];

			return camera;
		};

		camera.Ray = function (x, y, width, height) {
			/* An eye that stands on what it looks at has no ray: the matrix of no view is the identity. */
			var inverse = math.Invert(camera.Matrix(width / Math.max(1, height))) || math.Identity();
			var nx = x / Math.max(1, width) * 2 - 1;
			var ny = 1 - y / Math.max(1, height) * 2;
			var near = math.Apply(inverse, [nx, ny, -1]);
			var far = math.Apply(inverse, [nx, ny, 1]);

			return {Origin: near, Direction: math.Vectors.Normalize(math.Vectors.Subtract(far, near))};
		};

		camera.Project = function (point, width, height) {
			var m = camera.Matrix(width / Math.max(1, height));
			var x = point[0];
			var y = point[1];
			var z = point[2];
			var w = m[3] * x + m[7] * y + m[11] * z + m[15];
			var cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
			var cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
			var cz = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;

			return {X: (cx + 1) / 2 * width, Y: (1 - cy) / 2 * height, Depth: cz, Visible: w > 0 && cz >= -1 && cz <= 1};
		};

		return camera;
	},

	/* The source of its members, for a worker (Workers): CloudBlock runs there as it does here. */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* The workers of the pictures of numbers (CloudBlock): one is enough. */
	Work: function () {
		return this.$Service('Workers').Pool('Renderer', {Renderer: ['CloudBlock']}, 1);
	},

	/*
	 * The block of noise of clouds, size on each side, RGBA in a Uint8Array (for Volume): red for the shape, Perlin eaten
	 * by Worley; green, blue and alpha Worley ever finer, for the edges. It repeats on all sides, the same each time.
	 */
	CloudBlock: function (size) {
		var data = new Uint8Array(size * size * size * 4);
		var random = 7;
		var large;
		var small;
		var x;
		var y;
		var z;

		function next () {
			random = (random * 16807) % 2147483647;

			return random / 2147483647;
		}

		function points (cells) {
			var made = new Float32Array(cells * cells * cells * 3);
			var i;

			for (i = 0; i < made.length; i++)
				made[i] = next();

			return {Cells: cells, Points: made};
		}

		function worley (field, x, y, z) {
			var cells = field.Cells;
			var at = [x * cells, y * cells, z * cells];
			var cell = [Math.floor(at[0]), Math.floor(at[1]), Math.floor(at[2])];
			var least = 9;
			var a;
			var b;
			var c;

			for (a = -1; a <= 1; a++) {
				for (b = -1; b <= 1; b++) {
					for (c = -1; c <= 1; c++) {
						var i = (((cell[0] + a) % cells + cells) % cells + ((cell[1] + b) % cells + cells) % cells * cells + ((cell[2] + c) % cells + cells) % cells * cells * cells) * 3;
						var dx = cell[0] + a + field.Points[i] - at[0];
						var dy = cell[1] + b + field.Points[i + 1] - at[1];
						var dz = cell[2] + c + field.Points[i + 2] - at[2];

						least = Math.min(least, dx * dx + dy * dy + dz * dz);
					}
				}
			}

			return Math.max(0, 1 - Math.sqrt(least));
		}

		function billow (fields, u, v, w) {
			return worley(fields[0], u, v, w) * 0.625 + worley(fields[1], u, v, w) * 0.25 + worley(fields[2], u, v, w) * 0.125;
		}

		large = [points(3), points(6), points(12)];
		small = [points(5), points(10), points(20)];

		for (z = 0; z < size; z++) {
			for (y = 0; y < size; y++) {
				for (x = 0; x < size; x++) {
					var i = (x + y * size + z * size * size) * 4;
					var u = x / size;
					var v = y / size;
					var w = z / size;
					var low = billow(large, u, v, w);
					var fine = billow(small, u, v, w);

					data[i] = Math.min(255, Math.max(0, (low * 0.75 + fine * 0.3 - 0.1) * 255));
					data[i + 1] = fine * 255;
					data[i + 2] = low * 255;
					data[i + 3] = worley(small[1], u, v, w) * 255;
				}
			}
		}

		return data;
	},

	/* The vertex shader of a quad over the whole target (Bake draws it): vQuad from -1 to 1. */
	Shaders: {
		Quad: [
			'#version 300 es',
			'precision highp float;',
			'in vec3 aPosition;',
			'out vec2 vQuad;',
			'void main() {',
			'	vQuad = aPosition.xy;',
			'	gl_Position = vec4(aPosition.xy, 0.0, 1.0);',
			'}'
		].join('\n')
	},

	/* Parts of shaders: the same noise as Noise, the light of points with the shadows of balls, the directions of a cube. */
	Chunks: {
		Cube: [
			'uniform int uFace;',
			'vec3 cubeDirection(int face, vec2 p) {',
			'	if (face == 0) return normalize(vec3(1.0, -p.y, -p.x));',
			'	if (face == 1) return normalize(vec3(-1.0, -p.y, p.x));',
			'	if (face == 2) return normalize(vec3(p.x, 1.0, p.y));',
			'	if (face == 3) return normalize(vec3(p.x, -1.0, -p.y));',
			'	if (face == 4) return normalize(vec3(p.x, -p.y, 1.0));',
			'	return normalize(vec3(-p.x, -p.y, -1.0));',
			'}'
		].join('\n'),

		Noise: [
			'uvec3 pcg3(uvec3 v) {',
			'	v = v * 1664525u + 1013904223u;',
			'	v.x += v.y * v.z;',
			'	v.y += v.z * v.x;',
			'	v.z += v.x * v.y;',
			'	v ^= v >> 16u;',
			'	v.x += v.y * v.z;',
			'	v.y += v.z * v.x;',
			'	v.z += v.x * v.y;',
			'	return v;',
			'}',
			'float hash3(vec3 p) {',
			'	uvec3 u = uvec3(ivec3(p) + ivec3(65536));',
			'	return float(pcg3(u).x & 16777215u) / 16777215.0;',
			'}',
			'float noise3(vec3 x) {',
			'	vec3 i = floor(x);',
			'	vec3 f = fract(x);',
			'	f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
			'	return mix(mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
			'		mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
			'}',
			'float fbm3(vec3 p, int octaves) {',
			'	float total = 0.0;',
			'	float amplitude = 0.5;',
			'	float weight = 0.0;',
			'	for (int i = 0; i < 8; i++) {',
			'		if (i >= octaves) break;',
			'		total += noise3(p) * amplitude;',
			'		weight += amplitude;',
			'		p = p * 2.03 + vec3(1.7, 9.2, 3.1);',
			'		amplitude *= 0.5;',
			'	}',
			'	return total / weight;',
			'}',
			'float ridge3(vec3 p, int octaves) {',
			'	float total = 0.0;',
			'	float amplitude = 0.5;',
			'	float weight = 0.0;',
			'	for (int i = 0; i < 8; i++) {',
			'		if (i >= octaves) break;',
			'		total += (1.0 - abs(noise3(p) * 2.0 - 1.0)) * amplitude;',
			'		weight += amplitude;',
			'		p = p * 2.03 + vec3(1.7, 9.2, 3.1);',
			'		amplitude *= 0.5;',
			'	}',
			'	return total / weight;',
			'}'
		].join('\n'),

		Lights: [
			'uniform vec3 uLightPositions[4];',
			'uniform vec3 uLightColors[4];',
			'uniform int uLightCount;',
			'uniform vec3 uAmbient;',
			'uniform vec4 uOccluders[4];',
			'uniform int uOccluderCount;',
			'uniform vec3 uSkyLight;',
			'uniform vec3 uFloorLight;',
			'float lightShade = 1.0;',
			'float shadow(vec3 position, vec3 light) {',
			'	float lit = 1.0;',
			'	vec3 way = light - position;',
			'	float far = length(way);',
			'	vec3 direction = way / far;',
			'	for (int i = 0; i < 4; i++) {',
			'		if (i >= uOccluderCount) break;',
			'		vec3 center = uOccluders[i].xyz - position;',
			'		float along = dot(center, direction);',
			'		if (along <= 0.0 || along >= far) continue;',
			'		float miss = length(center - direction * along);',
			'		float radius = uOccluders[i].w;',
			'		lit *= smoothstep(radius * 0.8, radius * 1.15, miss);',
			'	}',
			'	return lit;',
			'}',
			'vec3 lighting(vec3 position, vec3 normal, vec3 view, float shine, float specular) {',
			'	vec3 total = mix(uFloorLight, uSkyLight, normal.y * 0.5 + 0.5);',
			'	for (int i = 0; i < 4; i++) {',
			'		if (i >= uLightCount) break;',
			'		vec3 toLight = normalize(uLightPositions[i] - position);',
			'		float diffuse = max(dot(normal, toLight), 0.0);',
			'		if (diffuse <= 0.0) continue;',
			'		float lit = shadow(position, uLightPositions[i]) * (i == 0 ? lightShade : 1.0);',
			'		vec3 middle = normalize(toLight + view);',
			'		float gloss = pow(max(dot(normal, middle), 0.0), shine) * specular;',
			'		total += uLightColors[i] * (diffuse + gloss) * lit;',
			'	}',
			'	return total;',
			'}'
		].join('\n'),

		Shadow: [
			'uniform highp sampler2DShadow uShadowMap;',
			'uniform highp sampler2DShadow uShadowNear;',
			'uniform sampler2D uShadowRaw;',
			'uniform sampler2D uShadowNearRaw;',
			'uniform vec3 uShadowSoft;',
			'uniform sampler2D uBounce;',
			'uniform sampler2D uGlow;',
			'uniform float uGlowOn;',
			'uniform vec3 uGlowPlace;',
			'uniform vec4 uCloudShade;',
			'uniform float uSkyFloor;',
			'uniform sampler2D uCloudMap;',
			'uniform vec4 uLocal[72];',
			'uniform highp sampler2DShadow uLampShadow0;',
			'uniform highp sampler2DShadow uLampShadow1;',
			'uniform mat4 uLampMatrix0;',
			'uniform mat4 uLampMatrix1;',
			'uniform int uLocalCount;',
			'uniform mat4 uShadowMatrix;',
			'uniform mat4 uShadowNearMatrix;',
			'uniform float uShadowBias;',
			'uniform float uShadowNearBias;',
			'uniform float uShadowOn;',
			'uniform float uBounceOn;',
			/* Cascades: four views of the sun in the quarters of the map, each of a slice of the view, farther ones wider; splits: where each ends from the eye. */
			'uniform mat4 uCascades[4];',
			'uniform vec4 uCascadeSplits;',
			'uniform vec4 uCascadeSoft;',
			'uniform vec4 uCascadeBias;',
			'uniform float uCascadeOn;',
			'float shadowIn(highp sampler2DShadow map, vec3 place, float texel) {',
			'	float sum = 0.0;',
			'	for (int x = -1; x <= 1; x++) {',
			'		for (int y = -1; y <= 1; y++) {',
			'			sum += texture(map, vec3(place.xy + vec2(float(x), float(y)) * texel * 1.2, place.z));',
			'		}',
			'	}',
			'	return sum / 9.0;',
			'}',
			/*
			 * A sun is a disc, not a point: what stands near casts a hard shadow, what stands far a soft one. It looks round for
			 * what hides the place, how far off that is gives the width of the edge, and that many texels are read, each pixel
			 * turning its pattern: the frames that add up take the grain away.
			 */
			'uniform float uSteady;',
			'float softIn(highp sampler2DShadow map, sampler2D raw, vec3 place, float texel, float light) {',
			/* What moves keeps little of its frames, so their adding up takes no grain from it: there the pattern stands, and the edge stays narrow. */
			'	float turn = uSteady > 0.5 ? 0.0 : fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;',
			'	float found = 0.0;',
			'	float count = 0.0;',
			'	for (int i = 0; i < 6; i++) {',
			'		float r = sqrt((float(i) + 0.5) / 6.0) * 7.0 * texel;',
			'		float a = float(i) * 2.399963 + turn;',
			'		float depth = texture(raw, place.xy + vec2(cos(a), sin(a)) * r).r;',
			'		if (depth < place.z - 0.0002) {',
			'			found += depth;',
			'			count += 1.0;',
			'		}',
			'	}',
			'	if (count < 0.5) return 1.0;',
			'	float wide = clamp((place.z - found / count) * light, 1.1, uSteady > 0.5 ? 3.0 : 16.0) * texel;',
			'	float sum = 0.0;',
			'	for (int i = 0; i < 12; i++) {',
			'		float r = sqrt((float(i) + 0.5) / 12.0) * wide;',
			'		float a = float(i) * 2.399963 + turn;',
			'		sum += texture(map, vec3(place.xy + vec2(cos(a), sin(a)) * r, place.z));',
			'	}',
			'	return sum / 12.0;',
			'}',
			/*
			 * Where a point falls in the far map: in cascade i, its quarter, kept off its edge so its neighbour is never read; with no
			 * cascades (i -1), in all of the map. w: how much of the map is taken there (its edge fades), 0 out of it.
			 */
			'vec4 farPlace(int i, vec3 position, vec3 normal) {',
			'	int c = max(i, 0);',
			'	vec4 at = i < 0 ? uShadowMatrix * vec4(position + normal * uShadowBias, 1.0) : uCascades[c] * vec4(position + normal * uCascadeBias[c], 1.0);',
			'	float edge = max(abs(at.x), abs(at.y));',
			'	if (edge >= 1.0 || at.z >= 1.0) return vec4(0.0);',
			'	vec3 place = at.xyz * 0.5 + 0.5;',
			'	if (i >= 0) place.xy = vec2(float(c - (c / 2) * 2), float(c / 2)) * 0.5 + clamp(place.xy, 0.012, 0.988) * 0.5;',
			'	return vec4(place, i < 0 ? 1.0 - smoothstep(0.85, 1.0, edge) : 1.0);',
			'}',
			/*
			 * The far map: by the cascade the distance from the eye falls in, and into the next over the last eighth of it, so no seam
			 * shows. One place reads the map, in a loop of at most two: each read inlines a search, and every program has the chunk.
			 */
			'float farShadow(vec3 position, vec3 normal) {',
			'	int first = -1;',
			'	float blend = 0.0;',
			'	if (uCascadeOn > 0.5) {',
			'		float d = length(position);',
			'		if (d >= uCascadeSplits.w) return 1.0;',
			'		first = d < uCascadeSplits.x ? 0 : d < uCascadeSplits.y ? 1 : d < uCascadeSplits.z ? 2 : 3;',
			'		float end = uCascadeSplits[first];',
			'		float start = first == 0 ? 0.0 : uCascadeSplits[first - 1];',
			'		blend = smoothstep(end - (end - start) * 0.12, end, d);',
			'	}',
			'	float texel = 1.0 / float(textureSize(uShadowMap, 0).x);',
			'	float lit = 0.0;',
			'	for (int k = 0; k < 2; k++) {',
			'		if (k == 1 && blend <= 0.0) break;',
			'		float share = k == 0 ? 1.0 - blend : blend;',
			'		int i = first < 0 ? -1 : first + k;',
			'		if (i > 3) {',
			'			lit += share;',
			'			break;',
			'		}',
			'		vec4 place = farPlace(i, position, normal);',
			'		float one = 1.0;',
			'		if (place.w > 0.0) one = mix(1.0, uShadowSoft.z > 0.5 ? softIn(uShadowMap, uShadowRaw, place.xyz, texel, i < 0 ? uShadowSoft.x : uCascadeSoft[max(i, 0)]) : shadowIn(uShadowMap, place.xyz, texel), place.w);',
			'		lit += one * share;',
			'	}',
			'	return lit;',
			'}',
			/*
			 * The near map first (of what is near the eye, or of the hero alone with the cascades): as sharp as its texel is small;
			 * with the cascades it gives way to them over the edge of its square, so no line shows where it ends.
			 */
			'float sunShadow(vec3 position, vec3 normal) {',
			'	if (uShadowOn < 0.5) return 1.0;',
			'	float near = 1.0;',
			'	float away = 1.0;',
			'	if (uShadowOn > 1.5) {',
			'		vec4 at = uShadowNearMatrix * vec4(position + normal * uShadowNearBias, 1.0);',
			'		float inside = max(abs(at.x), abs(at.y));',
			'		if (inside < (uCascadeOn > 0.5 ? 0.97 : 0.92) && abs(at.z) < 1.0) {',
			'			float texel = 1.0 / float(textureSize(uShadowNear, 0).x);',
			'			near = uShadowSoft.z > 0.5 ? softIn(uShadowNear, uShadowNearRaw, at.xyz * 0.5 + 0.5, texel, uShadowSoft.y) : shadowIn(uShadowNear, at.xyz * 0.5 + 0.5, texel);',
			'			away = uCascadeOn > 0.5 ? smoothstep(0.75, 0.97, inside) : 0.0;',
			'		}',
			'	}',
			'	return away > 0.0 ? mix(near, farShadow(position, normal), away) : near;',
			'}',
			'vec3 sunBounce(vec3 position) {',
			'	if (uGlowOn > 0.5) return texture(uGlow, (position.xz + uGlowPlace.xy) / uGlowPlace.z + 0.5).rgb;',
			'	if (uBounceOn < 0.5) return vec3(0.0);',
			'	vec4 at = uShadowMatrix * vec4(position, 1.0);',
			'	return pow(textureLod(uBounce, at.xy * 0.5 + 0.5, 3.0).rgb, vec3(2.2)) * 0.55;',
			'}',
			/* The shadows of the clouds that are there: the map of what they hold, along the way to the sun. */
			'float sunLit(vec3 position, vec3 normal) {',
			'	float cloud = uCloudShade.w > 0.0 ? texture(uCloudMap, (position.xz + uCloudShade.xy) * uCloudShade.z + 0.5).r : 0.0;',
			'	return sunShadow(position, normal) * (1.0 - uCloudShade.w * cloud);',
			'}',
			/* Lamps, fires, what shines near: each to its radius, a spot within its cone. Their light has no shadow. */
			'float lampSeen(int index, vec3 position) {',
			'	vec4 at = (index == 0 ? uLampMatrix0 : uLampMatrix1) * vec4(position, 1.0);',
			'	vec3 place = at.xyz / at.w * 0.5 + 0.5;',
			'	if (at.w <= 0.0 || place.x < 0.0 || place.y < 0.0 || place.x > 1.0 || place.y > 1.0 || place.z > 1.0) return 1.0;',
			'	float texel = 1.0 / 1024.0;',
			'	float sum = 0.0;',
			'	for (int x = -1; x <= 1; x += 2) {',
			'		for (int y = -1; y <= 1; y += 2) {',
			'			vec3 near = vec3(place.xy + vec2(float(x), float(y)) * texel, place.z - 0.0015);',
			'			sum += index == 0 ? texture(uLampShadow0, near) : texture(uLampShadow1, near);',
			'		}',
			'	}',
			'	return sum * 0.25;',
			'}',
			'vec3 localLight(vec3 position, vec3 normal) {',
			'	vec3 total = vec3(0.0);',
			'	for (int i = 0; i < uLocalCount; i++) {',
			'		vec4 place = uLocal[i * 3];',
			'		vec4 aim = uLocal[i * 3 + 2];',
			'		vec3 to = place.xyz - position;',
			'		float far = length(to);',
			'		if (far >= place.w) continue;',
			'		vec3 way = to / max(far, 0.001);',
			'		float fall = 1.0 - far * far / (place.w * place.w);',
			'		float cone = aim.w > -1.5 ? smoothstep(aim.w, aim.w + 0.08, dot(-way, aim.xyz)) : 1.0;',
			/* The two nearest lamps look down at the world and know what stands in their light. */
			'		if (i < 2 && uLocal[i * 3 + 1].a > 0.5) cone *= lampSeen(i, position + normal * 0.06);',
			'		total += uLocal[i * 3 + 1].rgb * max(dot(normal, way) * 0.85 + 0.15, 0.0) * fall * fall / (1.0 + far * far * 0.25 * min(1.0, 400.0 / (place.w * place.w))) * cone;',
			'	}',
			'	return total;',
			'}',
			/* How much of the sky a place sees, of the light of its field. */
			'float skySeen(vec3 position) {',
			/* By night the air fills what the day leaves dark: a wood has no holes of pure black. */
			'	return uGlowOn > 0.5 ? max(texture(uGlow, (position.xz + uGlowPlace.xy) / uGlowPlace.z + 0.5).a, uSkyFloor) : 1.0;',
			'}',
			/*
			 * The light of probes (uProbeOn, of SceneProbes): what comes to each voxel round the eye from all round, worked out of
			 * its probes as far as they see it (no light through a wall), uProbeCount voxels along x, y and z, the first at
			 * uProbeBox.xyz from the eye, uProbeBox.w metres wide. In uProbe (one texture: the programs of models have no unit
			 * more free), four blocks one over the other: the spherical harmonics of the first band of red, green and blue, and
			 * how much of each voxel is free; each block the layers of y, 8 a row, each of x by z. What is read there is of the
			 * free voxels alone (divided by the free part): a wall beside gives nothing.
			 */
			'uniform float uProbeOn;',
			'uniform sampler2D uProbe;',
			'uniform vec4 uProbeBox;',
			'uniform vec3 uProbeCount;',
			/* What a surface gets round it (the mean of what comes over its side), half a voxel out along its normal; weight: 1 inside the voxels, to 0 over their last 4. */
			'vec3 probeLight(vec3 position, vec3 normal, out float weight) {',
			'	vec3 c = (position + normal * uProbeBox.w * 0.5 - uProbeBox.xyz) / uProbeBox.w;',
			'	vec3 edge = min(c, uProbeCount - c);',
			'	weight = clamp(min(min(edge.x, edge.y), edge.z) * 0.25, 0.0, 1.0);',
			'	if (weight <= 0.0) return vec3(0.0);',
			'	vec2 at = clamp(c.xz, vec2(0.5), uProbeCount.xz - 0.5);',
			'	float y = clamp(c.y - 0.5, 0.0, uProbeCount.y - 1.001);',
			'	float layer = floor(y);',
			'	float t = y - layer;',
			'	vec2 size = vec2(uProbeCount.x * 8.0, uProbeCount.z * uProbeCount.y / 2.0);',
			'	vec2 low = (at + vec2(mod(layer, 8.0) * uProbeCount.x, floor(layer / 8.0) * uProbeCount.z)) / size;',
			'	vec2 high = (at + vec2(mod(layer + 1.0, 8.0) * uProbeCount.x, floor((layer + 1.0) / 8.0) * uProbeCount.z)) / size;',
			'	vec2 block = vec2(0.0, 0.25);',
			'	float free = mix(textureLod(uProbe, low + block * 3.0, 0.0).r, textureLod(uProbe, high + block * 3.0, 0.0).r, t);',
			'	if (free < 0.02) {',
			'		weight = 0.0;',
			'		return vec3(0.0);',
			'	}',
			'	vec4 lobe = vec4(0.886227, 1.023328 * normal.y, 1.023328 * normal.z, 1.023328 * normal.x) / free;',
			'	vec3 seen = vec3(dot(mix(textureLod(uProbe, low, 0.0), textureLod(uProbe, high, 0.0), t), lobe), dot(mix(textureLod(uProbe, low + block, 0.0), textureLod(uProbe, high + block, 0.0), t), lobe), dot(mix(textureLod(uProbe, low + block * 2.0, 0.0), textureLod(uProbe, high + block * 2.0, 0.0), t), lobe));',
			'	return max(seen, vec3(0.0)) / 3.14159265;',
			'}',
			/* What a surface gets round it: of the probes where they are, else the sky it sees (sky: of its side) and the bounce of the sun. */
			'vec3 aroundLight(vec3 position, vec3 normal, vec3 sky) {',
			'	vec3 open = sky * skySeen(position) + sunBounce(position);',
			'	if (uProbeOn < 0.5) return open;',
			'	float weight;',
			'	vec3 probed = probeLight(position, normal, weight);',
			'	return mix(open, probed, weight);',
			'}',
			/* The same for what is drawn very many times (grass): one and the same now, its name kept for them. */
			'vec3 aroundSoft(vec3 position, vec3 normal, vec3 sky) {',
			'	return aroundLight(position, normal, sky);',
			'}'
		].join('\n')
	},

	/*
	 * The contexts of the page (one for all its applications, as the browser counts them): how many renderers live, and the
	 * contexts of those let go not given back yet (WEBGL_lose_context of each, the oldest first).
	 */
	Contexts: {Live: 0, Released: []},

	/* At most this many contexts in the page, living and let go (a browser keeps some 16, and loses the oldest past them). */
	MostContexts: 10,

	/* Gives back the oldest contexts let go while the page would have more than MostContexts with room more of them. */
	Release: function (room) {
		var contexts = this.Contexts;

		while (contexts.Released.length && contexts.Live + contexts.Released.length + (room || 0) > this.MostContexts)
			contexts.Released.shift().loseContext();
	},

	Create: function (canvas, options) {
		var self = this;
		var settings = options || {};
		var gl = null;
		var programs = {};
		var shaders = {};
		var meshes = [];
		var textures = [];

		/*
		 * What is let go off its list: the last in its place (the order of a list is not kept). Regression: each spliced out
		 * of its place, a renderer letting go of all of them (a scene gone) moved the rest each time, a page held up for most
		 * of a minute; and one not in it took the last.
		 */
		function forget (list, item) {
			var at = list.indexOf(item);
			if (at === -1) return;

			list[at] = list[list.length - 1];

			list.pop();
		}
		var modes;
		var gpuQuad = null;
		/* The blank textures of the samplers a draw gives none, by the type of the sampler (see blank). */
		var blanks = {};
		var patient = !!settings.Patient;
		/* How long a program not made is not waited for (ms): after that Ready waits for it once. */
		var patience = settings.Patience === undefined ? 10000 : Number(settings.Patience);
		var parallel = null;
		var current = {};
		var counts = {Draws: 0, Triangles: 0};
		/* The arrays held till the next Hold (the common ones of a frame): given again, the very same, they are what they were. */
		var held = new WeakSet();
		var bound;
		var renderer;

		/*
		 * The texture and the sampler of each unit, kept as the context keeps them: a frame binds again mostly what is bound
		 * already, thousands of times. The context's own calls keep it, so a texture bound by any code is known; once for a
		 * context (a canvas gives the same one again).
		 */
		function bindings (context) {
			var state = {Unit: 0, Units: []};
			var raw;

			if (context.ElemenxUnits)
				return context.ElemenxUnits;

			raw = {Active: context.activeTexture, Texture: context.bindTexture, Sampler: context.bindSampler, DeleteTexture: context.deleteTexture, DeleteSampler: context.deleteSampler};

			function slot (unit) {
				return state.Units[unit] || (state.Units[unit] = {Textures: {}, Sampler: undefined});
			}

			context.activeTexture = function (unit) {
				if (state.Unit === unit - context.TEXTURE0) return;

				state.Unit = unit - context.TEXTURE0;

				raw.Active.call(context, unit);
			};
			context.bindTexture = function (target, texture) {
				var at = slot(state.Unit);
				if (at.Textures[target] === texture) return;

				at.Textures[target] = texture;

				raw.Texture.call(context, target, texture);
			};
			context.bindSampler = function (unit, sampler) {
				var at = slot(unit);
				if (at.Sampler === sampler) return;

				at.Sampler = sampler;

				raw.Sampler.call(context, unit, sampler);
			};
			/* What is deleted is bound nowhere any more. */
			context.deleteTexture = function (texture) {
				state.Units.forEach(function (at) {
					Object.keys(at.Textures).forEach(function (target) {
						if (at.Textures[target] === texture)
							at.Textures[target] = null;
					});
				});

				raw.DeleteTexture.call(context, texture);
			};
			context.deleteSampler = function (sampler) {
				state.Units.forEach(function (at) {
					if (at.Sampler === sampler)
						at.Sampler = null;
				});

				raw.DeleteSampler.call(context, sampler);
			};
			context.ElemenxUnits = state;

			return state;
		}

		/* Room for one more context: the oldest let go given back first, while there are too many (Release). */
		self.Release(1);

		try {
			gl = canvas.getContext('webgl2', {alpha: !!settings.Alpha, antialias: settings.Antialias !== false, premultipliedAlpha: false, preserveDrawingBuffer: !!settings.Preserve});
		}
		catch (error) {
			gl = null;
		}

		if (!gl)
			return null;

		self.Contexts.Live++;

		bound = bindings(gl);

		/* A mesh with no weights of materials has none: 0, not the 1 of the last part of what is not given. */
		gl.vertexAttrib4f(12, 0, 0, 0, 0);
		gl.vertexAttrib4f(13, 0, 0, 0, 0);

		parallel = gl.getExtension('KHR_parallel_shader_compile');
		modes = {'triangles': gl.TRIANGLES, 'lines': gl.LINES, 'line-strip': gl.LINE_STRIP, 'line-loop': gl.LINE_LOOP, 'points': gl.POINTS};

		function compile (type, source) {
			var key = type + ':' + source;
			var shader = shaders[key];
			if (shader)
				return shader;

			shader = gl.createShader(type);

			gl.shaderSource(shader, source);
			gl.compileShader(shader);

			/* Asking waits for the card: what is patient asks when the program is done. */
			if (!patient && !gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost())
				throw new Error('Elemenx Renderer: the shader does not compile: ' + gl.getShaderInfoLog(shader));

			shaders[key] = shader;

			return shader;
		}

		/* A program the card has finished, or one that is waited for here: its log read and its uniforms found. */
		function settle (program) {
			var handle = program.Handle;
			var count;
			var i;
			var info;

			if (program.Settled) return;

			program.Settled = true;

			if (!gl.getProgramParameter(handle, gl.LINK_STATUS) && !gl.isContextLost()) {
				gl.getAttachedShaders(handle).forEach(function (shader) {
					if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
						throw new Error('Elemenx Renderer: the shader does not compile: ' + gl.getShaderInfoLog(shader));
				});

				throw new Error('Elemenx Renderer: the program does not link: ' + gl.getProgramInfoLog(handle));
			}

			count = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS) || 0;
			program.List = [];

			for (i = 0; i < count; i++) {
				info = gl.getActiveUniform(handle, i);

				program.Uniforms[info.name.replace(/\[0\]$/, '')] = {Name: info.name.replace(/\[0\]$/, ''), Location: gl.getUniformLocation(handle, info.name), Type: info.type, Size: info.size, Sampler: [gl.SAMPLER_2D, gl.SAMPLER_3D, gl.SAMPLER_CUBE, gl.SAMPLER_2D_SHADOW, gl.SAMPLER_2D_ARRAY].indexOf(info.type) !== -1};

				program.List.push(program.Uniforms[info.name.replace(/\[0\]$/, '')]);
			}
		}

		function buffer (target, data) {
			var handle = gl.createBuffer();

			gl.bindBuffer(target, handle);
			gl.bufferData(target, data, gl.STATIC_DRAW);

			return handle;
		}

		/* An attribute of a mesh: its buffer bound to its place, divisor 1 for the ones of each copy. */
		function attribute (mesh, name, size, data, divisor) {
			var location = self.Locations[name];
			var values = data instanceof Float32Array ? data : new Float32Array(data);
			if (location === undefined || !values.length) return;

			if (mesh.Buffers[name]) {
				gl.bindBuffer(gl.ARRAY_BUFFER, mesh.Buffers[name]);

				if (mesh.Sizes[name] >= values.byteLength) {
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, values);
				}
				else {
					gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);

					mesh.Sizes[name] = values.byteLength;
				}
			}
			else {
				mesh.Buffers[name] = buffer(gl.ARRAY_BUFFER, values);
				mesh.Sizes[name] = values.byteLength;
			}

			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
			gl.vertexAttribDivisor(location, divisor || 0);
		}

		/* Four numbers of each group of a vertex (stride of them), from the first of them. */
		function split (values, count, from, stride) {
			var part = new Float32Array(count * 4);
			var i;

			for (i = 0; i < count; i++) {
				part[i * 4] = values[i * stride + from];
				part[i * 4 + 1] = values[i * stride + from + 1];
				part[i * 4 + 2] = values[i * stride + from + 2];
				part[i * 4 + 3] = values[i * stride + from + 3];
			}

			return part;
		}

		function mesh (geometry, mode) {
			var made = {VAO: gl.createVertexArray(), Buffers: {}, Sizes: {}, Count: 0, Indexed: false, Mode: mode || 'triangles', Instances: 0};

			made.Update = function (shape) {
				var count = shape.Positions.length / 3;
				var indices;

				made.Vertices = count;

				gl.bindVertexArray(made.VAO);

				attribute(made, 'aPosition', 3, shape.Positions);
				attribute(made, 'aNormal', 3, shape.Normals && shape.Normals.length ? shape.Normals : new Float32Array(count * 3));
				attribute(made, 'aUV', 2, shape.UVs && shape.UVs.length ? shape.UVs : new Float32Array(count * 2));

				if (shape.Colors && shape.Colors.length) {
					attribute(made, 'aColor', shape.Colors.length / count, shape.Colors);
				}
				else {
					gl.disableVertexAttribArray(self.Locations.aColor);
					gl.vertexAttrib4f(self.Locations.aColor, 1, 1, 1, 1);
				}

				if (shape.Joints && shape.Joints.length) {
					attribute(made, 'aJoints', 4, shape.Joints);
					attribute(made, 'aWeights', 4, shape.Weights);
				}

				/* The weights of the materials of a ground: 12 a vertex (or 8), as attributes of 4; none: 0. */
				if (shape.Materials && count && (shape.Materials.length === count * 12 || shape.Materials.length === count * 8)) {
					attribute(made, 'aMaterials', 4, split(shape.Materials, count, 0, shape.Materials.length / count));
					attribute(made, 'aMaterials2', 4, split(shape.Materials, count, 4, shape.Materials.length / count));

					if (shape.Materials.length === count * 12) {
						attribute(made, 'aMaterials3', 4, split(shape.Materials, count, 8, 12));
					}
					else {
						gl.disableVertexAttribArray(self.Locations.aMaterials3);
						gl.vertexAttrib4f(self.Locations.aMaterials3, 0, 0, 0, 0);
					}
				}
				else {
					gl.disableVertexAttribArray(self.Locations.aMaterials);
					gl.disableVertexAttribArray(self.Locations.aMaterials2);
					gl.disableVertexAttribArray(self.Locations.aMaterials3);
					gl.vertexAttrib4f(self.Locations.aMaterials3, 0, 0, 0, 0);
				}

				if (shape.Indices && shape.Indices.length) {
					indices = count > 65535 ? new Uint32Array(shape.Indices) : new Uint16Array(shape.Indices);

					if (made.Index)
						gl.deleteBuffer(made.Index);

					made.Index = buffer(gl.ELEMENT_ARRAY_BUFFER, indices);
					made.IndexType = count > 65535 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
					made.Count = shape.Indices.length;
					made.Indexed = true;
				}
				else {
					made.Count = count;
					made.Indexed = false;
				}

				gl.bindVertexArray(null);

				current.VAO = null;

				return made;
			};

			/*
			 * Its triangles again (a list of indices of its points), its points as they are: what a level of detail of
			 * clusters (SceneClusters) draws of them now, the points of all its levels kept on the card.
			 */
			made.Triangles = function (indices) {
				var wide = made.Vertices > 65535;
				var data = wide ? indices instanceof Uint32Array ? indices : new Uint32Array(indices) : new Uint16Array(indices);

				gl.bindVertexArray(made.VAO);

				if (made.Index)
					gl.deleteBuffer(made.Index);

				made.Index = buffer(gl.ELEMENT_ARRAY_BUFFER, data);
				made.IndexType = wide ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
				made.Count = data.length;
				made.Indexed = true;

				gl.bindVertexArray(null);

				current.VAO = null;

				return made;
			};

			/* The attributes of each copy: {aInstance: {Size, Data}, ...}, count the copies. */
			made.Instance = function (data, count) {
				gl.bindVertexArray(made.VAO);

				Object.keys(data).forEach(function (name) {
					attribute(made, name, data[name].Size, data[name].Data, 1);
				});

				gl.bindVertexArray(null);

				current.VAO = null;

				made.Instances = count;

				return made;
			};

			made.Destroy = function () {
				Object.keys(made.Buffers).forEach(function (name) {
					gl.deleteBuffer(made.Buffers[name]);
				});

				if (made.Index)
					gl.deleteBuffer(made.Index);

				if (current.VAO === made.VAO)
					current.VAO = null;

				gl.deleteVertexArray(made.VAO);

				forget(meshes, made);
			};

			meshes.push(made);

			return made.Update(geometry);
		}

		/* A program keeps what was set in it: most of what a frame sets, for each batch again, is what stands there already. */
		/*
		 * An array held (Hold: the common ones of a frame, never changed in their place till the next) and given again, the very
		 * same, is what it was: not read again (a list of 72 lamps for each of thousands of draws took milliseconds). Another is
		 * read against what was set (one changed in its place is a change), kept in numbers of its own made once (no copy for
		 * each draw).
		 */
		function unchanged (info, value, data) {
			var last = info.Last;
			var i = 0;
			var size;

			if (!data) {
				if (last === value) return true;

				info.Last = value;

				return false;
			}

			if (data === info.Given && held.has(data)) return true;

			info.Given = data;
			size = data.length;

			if (last && info.Size === size) {
				while (i < size && last[i] === data[i])
					i++;

				if (i === size) return true;
			}
			else {
				info.Last = new Float64Array(size);
				info.Size = size;
			}

			info.Last.set(data);

			return false;
		}

		/* How many colors a fragment shader writes: its highest layout(location = n) out, plus one; 1 with none. */
		function outputsOf (fragment) {
			var most = 0;

			String(fragment).replace(/layout\s*\(\s*location\s*=\s*(\d+)\s*\)\s*out\b/g, function (all, at) {
				most = Math.max(most, Number(at) + 1);

				return all;
			});

			return most || 1;
		}

		/* The unit a sampler of a program reads: told to the program only when it is another one than the last. */
		function sampled (info, location, unit) {
			if (info.Unit === unit) return;

			info.Unit = unit;

			gl.uniform1i(location, unit);
		}

		/*
		 * The blank texture of a type of sampler: one texel of nothing (a depth of 1 that compares as lit, for a shadow), made
		 * once. A sampler given no texture reads it: left on the unit it had, it could meet a texture of another type there,
		 * and the browser drops a draw with two types of texture on one unit.
		 */
		function blank (type) {
			var handle;
			var pixel = new Uint8Array(4);
			var face;

			if (blanks[type])
				return blanks[type];

			handle = gl.createTexture();

			if (type === gl.SAMPLER_3D || type === gl.SAMPLER_2D_ARRAY) {
				gl.bindTexture(type === gl.SAMPLER_3D ? gl.TEXTURE_3D : gl.TEXTURE_2D_ARRAY, handle);
				gl.texImage3D(type === gl.SAMPLER_3D ? gl.TEXTURE_3D : gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, 1, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
			}
			else if (type === gl.SAMPLER_CUBE) {
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, handle);

				for (face = 0; face < 6; face++)
					gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
			}
			else if (type === gl.SAMPLER_2D_SHADOW) {
				gl.bindTexture(gl.TEXTURE_2D, handle);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, 1, 1, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, new Uint16Array([65535]));
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
			}
			else {
				gl.bindTexture(gl.TEXTURE_2D, handle);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
			}

			gl.texParameteri(type === gl.SAMPLER_3D ? gl.TEXTURE_3D : type === gl.SAMPLER_2D_ARRAY ? gl.TEXTURE_2D_ARRAY : type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(type === gl.SAMPLER_3D ? gl.TEXTURE_3D : type === gl.SAMPLER_2D_ARRAY ? gl.TEXTURE_2D_ARRAY : type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			blanks[type] = {Handle: handle};

			return blanks[type];
		}

		/* The value of a uniform set by its type, as the program found it. */
		function uniform (info, value, units) {
			var location = info.Location;
			var data = value && value.length !== undefined ? value : null;
			if (!info.Sampler && unchanged(info, value, data)) return;

			switch (info.Type) {
				case gl.FLOAT:
					if (data) gl.uniform1fv(location, data);
					else gl.uniform1f(location, Number(value) || 0);

					break;
				case gl.FLOAT_VEC2:
					gl.uniform2fv(location, data);

					break;
				case gl.FLOAT_VEC3:
					gl.uniform3fv(location, data);

					break;
				case gl.FLOAT_VEC4:
					gl.uniform4fv(location, data);

					break;
				case gl.INT:
				case gl.BOOL:
					if (data) gl.uniform1iv(location, data);
					else gl.uniform1i(location, value === true ? 1 : Number(value) || 0);

					break;
				case gl.FLOAT_MAT3:
					gl.uniformMatrix3fv(location, false, data);

					break;
				case gl.FLOAT_MAT4:
					gl.uniformMatrix4fv(location, false, data);

					break;
				case gl.SAMPLER_2D:
				case gl.SAMPLER_2D_SHADOW:
					gl.activeTexture(gl.TEXTURE0 + units.Next);
					gl.bindTexture(gl.TEXTURE_2D, value ? value.Handle : null);
					gl.bindSampler(units.Next, value && value.Sampler ? value.Sampler : null);

					sampled(info, location, units.Next);

					units.Next++;

					break;
				case gl.SAMPLER_3D:
					gl.activeTexture(gl.TEXTURE0 + units.Next);
					gl.bindTexture(gl.TEXTURE_3D, value ? value.Handle : null);

					sampled(info, location, units.Next);

					units.Next++;

					break;
				case gl.SAMPLER_CUBE:
					gl.activeTexture(gl.TEXTURE0 + units.Next);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, value ? value.Handle : null);

					sampled(info, location, units.Next);

					units.Next++;

					break;
				/* The layers of one texture (SceneTextures.Array: the tiles of the materials of a ground). */
				case gl.SAMPLER_2D_ARRAY:
					gl.activeTexture(gl.TEXTURE0 + units.Next);
					gl.bindTexture(gl.TEXTURE_2D_ARRAY, value ? value.Handle : null);

					sampled(info, location, units.Next);

					units.Next++;

					break;
				default:
					break;
			}
		}

		renderer = {
			GL: gl,
			Canvas: canvas,
			Width: canvas.width,
			Height: canvas.height,
			Ratio: 1,
			Lost: false,

			Program: function (vertex, fragment, behind) {
				var key = vertex + '\n--\n' + fragment;
				var program = programs[key];
				var handle;

				if (program)
					return program;

				handle = gl.createProgram();

				gl.attachShader(handle, compile(gl.VERTEX_SHADER, vertex));
				gl.attachShader(handle, compile(gl.FRAGMENT_SHADER, fragment));

				Object.keys(self.Locations).forEach(function (name) {
					gl.bindAttribLocation(handle, self.Locations[name], name);
				});

				gl.linkProgram(handle);

				/* Outputs: how many colors it writes (its last layout(location = n) out, plus one); into a target of more, the rest are left as they were. */
				program = {Handle: handle, Uniforms: {}, Settled: false, Behind: !!behind, Outputs: outputsOf(fragment), Made: Date.now()};

				if (!patient)
					settle(program);

				programs[key] = program;

				return program;
			},

			/*
			 * Whether two shaders compile, asked of the card at once (a program waited for tells it only when drawn): the logs
			 * of the ones that do not, null when both do. For what is made of a graph, checked once before it is drawn.
			 */
			Check: function (vertex, fragment) {
				var logs = [];

				[[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]].forEach(function (pair) {
					var shader = gl.createShader(pair[0]);

					gl.shaderSource(shader, pair[1]);
					gl.compileShader(shader);

					if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost())
						logs.push(gl.getShaderInfoLog(shader) || '');

					gl.deleteShader(shader);
				});

				return logs.length ? logs.join('\n') : null;
			},

			Ready: function (program) {
				if (program.Settled) return true;

				/*
				 * Not made yet: not waited for, for as long as its patience (Patience, 10 s); then waited for once. Regression:
				 * where the card makes a program only when it is used or waited for (a canvas shown nowhere), what drew it only
				 * once it was made waited for it forever (a globe never came).
				 */
				if (parallel && Date.now() - program.Made < patience && !gl.getProgramParameter(program.Handle, parallel.COMPLETION_STATUS_KHR)) return false;

				settle(program);

				return true;
			},

			/* What it drew since it was made: the draws and the triangles of them (each copy of an instanced mesh counted). */
			Counts: function () {
				return {Draws: counts.Draws, Triangles: counts.Triangles};
			},

			Progress: function () {
				var made = {Done: 0, Total: 0, Needed: 0};

				Object.keys(programs).forEach(function (key) {
					var ready = renderer.Ready(programs[key]);

					made.Total++;
					made.Done += ready ? 1 : 0;
					made.Needed += ready || programs[key].Behind ? 0 : 1;
				});

				return made;
			},

			Mesh: function (geometry, mode) {
				return mesh(geometry, mode);
			},

			Lines: function (points, loop) {
				var positions = [];

				points.forEach(function (point) {
					positions.push(point[0], point[1], point[2]);
				});

				return mesh({Positions: positions}, loop ? 'line-loop' : 'line-strip');
			},

			Points: function (positions, extra) {
				var made = mesh({Positions: positions}, 'points');

				if (extra && extra.aColor) {
					gl.bindVertexArray(made.VAO);

					attribute(made, 'aColor', extra.aColor.Size, extra.aColor.Data);

					gl.bindVertexArray(null);

					current.VAO = null;
				}

				return made;
			},

			Texture: function (source, options) {
				var settings = options || {};
				var handle = gl.createTexture();
				var texture = {Handle: handle};
				var slant = settings.Mipmaps ? gl.getExtension('EXT_texture_filter_anisotropic') : null;

				gl.bindTexture(gl.TEXTURE_2D, handle);

				/* Single: one byte a texel (a mask), read as .r; its rows are not padded to four bytes. */
				function single () {
					gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, source.Width, source.Height, 0, gl.RED, gl.UNSIGNED_BYTE, source.Data instanceof Uint8Array ? source.Data : new Uint8Array(source.Data));
					gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
				}

				if (source && source.Data && settings.Single) single();
				else if (source && source.Data && settings.Float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, source.Width, source.Height, 0, gl.RGBA, gl.FLOAT, source.Data);
				else if (source && source.Data) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.Width, source.Height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.Data instanceof Uint8Array ? source.Data : new Uint8Array(source.Data));
				else gl.texImage2D(gl.TEXTURE_2D, 0, settings.Srgb ? gl.SRGB8_ALPHA8 : gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

				if (settings.Mipmaps)
					gl.generateMipmap(gl.TEXTURE_2D);

				/* A picture seen at a slant stays sharp along its length. */
				if (settings.Mipmaps && slant)
					gl.texParameterf(gl.TEXTURE_2D, slant.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(slant.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, settings.Repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, settings.Repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings.Nearest ? gl.NEAREST : settings.Mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, settings.Nearest ? gl.NEAREST : gl.LINEAR);

				texture.Destroy = function () {
					gl.deleteTexture(handle);

					forget(textures, texture);
				};

				/* Another picture of a canvas or an image into the same texture, as a screen changes. */
				texture.Update = function (picture) {
					gl.bindTexture(gl.TEXTURE_2D, handle);
					gl.texImage2D(gl.TEXTURE_2D, 0, settings.Srgb ? gl.SRGB8_ALPHA8 : gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);

					if (settings.Mipmaps)
						gl.generateMipmap(gl.TEXTURE_2D);

					return texture;
				};

				textures.push(texture);

				return texture;
			},

			/* A block of noise for a uniform sampler3D: size^3 of RGBA bytes, repeating on all sides. */
			Volume: function (size, data) {
				var handle = gl.createTexture();
				var texture = {Handle: handle};

				gl.bindTexture(gl.TEXTURE_3D, handle);
				gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, size, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
				gl.generateMipmap(gl.TEXTURE_3D);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

				texture.Destroy = function () {
					gl.deleteTexture(handle);

					forget(textures, texture);
				};

				textures.push(texture);

				return texture;
			},

			/* A cube of six square faces, size pixels each, for a uniform samplerCube: empty until Bake draws it or Write fills it. */
			Cube: function (size) {
				var handle = gl.createTexture();
				var side = Math.max(1, Math.round(size || 256));
				var cube = {Handle: handle, Size: side, Cube: true};
				var face;

				gl.bindTexture(gl.TEXTURE_CUBE_MAP, handle);

				for (face = 0; face < 6; face++)
					gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA, side, side, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

				cube.Destroy = function () {
					gl.deleteTexture(handle);

					forget(textures, cube);
				};

				/*
				 * Texels of the CPU into a face (0 to 5, as cubeDirection has them): RGBA bytes of rows from row on, their first row
				 * the one of p.y = -1; with mipmaps, its smaller levels made again (once all is written).
				 */
				cube.Write = function (face, data, row, mipmaps) {
					var rows = Math.round(data.length / 4 / side);

					gl.bindTexture(gl.TEXTURE_CUBE_MAP, handle);
					gl.texSubImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, 0, row || 0, side, rows, gl.RGBA, gl.UNSIGNED_BYTE, data instanceof Uint8Array ? data : new Uint8Array(data.buffer || data));

					if (mipmaps)
						gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

					return cube;
				};

				textures.push(cube);

				return cube;
			},

			/*
			 * Draws the six faces of a cube once with a program: its fragment shader takes the direction of each texel
			 * from cubeDirection(uFace, vQuad) (Chunks.Cube), so a surface made of noise is computed once, not at every
			 * frame; with only, that face alone, so a large one takes six frames and stops none; with strip [row, rows], that strip of
			 * the face alone, for one that would still stop a frame. The vertex shader is Shaders.Quad (aPosition of a quad from -1 to 1, vQuad).
			 */
			Bake: function (cube, program, uniforms, only, strip) {
				var target = gl.createFramebuffer();
				var face;
				var values;

				if (!gpuQuad)
					gpuQuad = mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

				current.Target = null;

				gl.bindFramebuffer(gl.FRAMEBUFFER, target);
				gl.viewport(0, 0, cube.Size, cube.Size);

				if (strip) {
					gl.enable(gl.SCISSOR_TEST);
					gl.scissor(0, Math.floor(cube.Size * strip[0] / strip[1]), cube.Size, Math.ceil(cube.Size / strip[1]));
				}

				for (face = only === undefined ? 0 : only; face < (only === undefined ? 6 : only + 1); face++) {
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, cube.Handle, 0);

					values = Object.assign({}, uniforms || {}, {uFace: face});

					renderer.Draw(gpuQuad, program, values, {Depth: false, DepthWrite: false, Cull: 'none'});
				}

				if (strip)
					gl.disable(gl.SCISSOR_TEST);

				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.deleteFramebuffer(target);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube.Handle);

				if (only === undefined || only === 5 && (!strip || strip[0] === strip[1] - 1))
					gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

				gl.viewport(0, 0, renderer.Width, renderer.Height);

				return cube;
			},

			/* Textures to draw into: what is drawn between Begin() and End() goes to them, each output of a shader to its own. */
			Target: function (width, height, options) {
				var settings = options || {};
				var count = settings.Colors || 1;
				var frame = gl.createFramebuffer();
				var depth = settings.Depth ? gl.createRenderbuffer() : null;
				var made = {Width: width, Height: height, Textures: [], Depth: null, Count: count, Buffers: count};
				var outputs = [];
				var many = settings.Samples ? gl.createFramebuffer() : null;
				var colors = [];
				var deep = settings.Samples ? gl.createRenderbuffer() : null;
				var i;

				gl.bindFramebuffer(gl.FRAMEBUFFER, frame);

				for (i = 0; i < count; i++) {
					var handle = gl.createTexture();

					gl.bindTexture(gl.TEXTURE_2D, handle);
					gl.texImage2D(gl.TEXTURE_2D, 0, settings.Float ? gl.RGBA16F : gl.RGBA8, width, height, 0, gl.RGBA, settings.Float ? gl.FLOAT : gl.UNSIGNED_BYTE, null);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings.Mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, handle, 0);

					made.Textures.push({Handle: handle});
					outputs.push(gl.COLOR_ATTACHMENT0 + i);
				}

				gl.drawBuffers(outputs);

				if (depth) {
					gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
					gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
					gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
				}

				if (settings.DepthTexture) {
					made.Depth = {Handle: gl.createTexture()};

					gl.bindTexture(gl.TEXTURE_2D, made.Depth.Handle);
					gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, width, height);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, made.Depth.Handle, 0);
				}

				/* DepthFrom: the depth texture of another target (of DepthTexture, as large), to draw over what it holds (tested, not written). */
				if (settings.DepthFrom && settings.DepthFrom.Depth)
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, settings.DepthFrom.Depth.Handle, 0);

				/* What is drawn with samples goes to buffers of its own (one for each color), and to the textures when it ends. */
				if (many) {
					gl.bindFramebuffer(gl.FRAMEBUFFER, many);

					for (i = 0; i < count; i++) {
						colors.push(gl.createRenderbuffer());

						gl.bindRenderbuffer(gl.RENDERBUFFER, colors[i]);
						gl.renderbufferStorageMultisample(gl.RENDERBUFFER, settings.Samples, settings.Float ? gl.RGBA16F : gl.RGBA8, width, height);
						gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, colors[i]);
					}

					gl.drawBuffers(outputs);
					gl.bindRenderbuffer(gl.RENDERBUFFER, deep);
					gl.renderbufferStorageMultisample(gl.RENDERBUFFER, settings.Samples, gl.DEPTH_COMPONENT24, width, height);
					gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, deep);
				}

				gl.bindFramebuffer(gl.FRAMEBUFFER, null);

				made.Begin = function () {
					gl.bindFramebuffer(gl.FRAMEBUFFER, many || frame);
					gl.viewport(0, 0, width, height);

					current.Target = made;

					made.Outputs(count);
				};

				/* How many of its colors the draws write: the first n (the rest left as they are). */
				made.Outputs = function (n) {
					var list = [];
					var k;

					if (made.Buffers === n) return;

					for (k = 0; k < count; k++)
						list.push(k < n ? gl.COLOR_ATTACHMENT0 + k : gl.NONE);

					gl.drawBuffers(list);

					made.Buffers = n;
				};

				/* One of its colors cleared to a value (the others kept). */
				made.ClearColor = function (index, value) {
					gl.clearBufferfv(gl.COLOR, index, value);
				};

				made.End = function () {
					var k;
					var list;

					if (current.Target === made)
						current.Target = null;

					if (many) {
						gl.bindFramebuffer(gl.READ_FRAMEBUFFER, many);
						gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, frame);

						/* Each color to its texture, one at a time (a blit reads one buffer). */
						for (k = 0; k < count; k++) {
							list = [];

							for (i = 0; i < count; i++)
								list.push(i === k ? gl.COLOR_ATTACHMENT0 + k : gl.NONE);

							gl.readBuffer(gl.COLOR_ATTACHMENT0 + k);
							gl.drawBuffers(list);
							gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
						}

						gl.readBuffer(gl.COLOR_ATTACHMENT0);
						gl.drawBuffers(outputs);
						gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
						gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
						gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
					}

					if (settings.Mipmaps) {
						gl.bindTexture(gl.TEXTURE_2D, made.Textures[0].Handle);
						gl.generateMipmap(gl.TEXTURE_2D);
					}

					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					gl.viewport(0, 0, renderer.Width, renderer.Height);
				};

				made.Destroy = function () {
					made.Textures.forEach(function (texture) {
						gl.deleteTexture(texture.Handle);
					});

					if (made.Depth)
						gl.deleteTexture(made.Depth.Handle);

					if (many) {
						gl.deleteFramebuffer(many);

						colors.forEach(function (one) {
							gl.deleteRenderbuffer(one);
						});

						gl.deleteRenderbuffer(deep);
					}

					if (depth)
						gl.deleteRenderbuffer(depth);

					gl.deleteFramebuffer(frame);

					forget(textures, made);
				};

				textures.push(made);

				return made;
			},

			Viewport: function (x, y, width, height) {
				gl.viewport(x, y, width, height);
			},

			/* A depth texture seen from a light: what is drawn between Begin() and End() writes only into it. */
			Shadow: function (size) {
				var side = Math.max(1, Math.round(size || 2048));
				var handle = gl.createTexture();
				var target = gl.createFramebuffer();
				var raw = gl.createSampler();
				var map = {Handle: handle, Size: side, Raw: {Handle: handle, Sampler: raw}};

				gl.samplerParameteri(raw, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.samplerParameteri(raw, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.samplerParameteri(raw, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.samplerParameteri(raw, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.samplerParameteri(raw, gl.TEXTURE_COMPARE_MODE, gl.NONE);

				gl.bindTexture(gl.TEXTURE_2D, handle);
				gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, side, side);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
				gl.bindTexture(gl.TEXTURE_2D, null);

				gl.bindFramebuffer(gl.FRAMEBUFFER, target);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, handle, 0);
				gl.drawBuffers([gl.NONE]);
				gl.readBuffer(gl.NONE);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);

				/* Region [x, y, width, height] in texels: only that part drawn and cleared (a cascade in its quarter); all of it by default. */
				map.Begin = function (region) {
					var part = region || [0, 0, side, side];

					current.Target = null;

					gl.bindFramebuffer(gl.FRAMEBUFFER, target);
					gl.viewport(part[0], part[1], part[2], part[3]);
					gl.depthMask(true);

					current.Write = true;

					gl.enable(gl.SCISSOR_TEST);
					gl.scissor(part[0], part[1], part[2], part[3]);
					gl.clear(gl.DEPTH_BUFFER_BIT);
					gl.enable(gl.POLYGON_OFFSET_FILL);
					gl.polygonOffset(1.5, 3);
				};

				map.End = function () {
					gl.disable(gl.SCISSOR_TEST);
					gl.disable(gl.POLYGON_OFFSET_FILL);
					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					gl.viewport(0, 0, renderer.Width, renderer.Height);
				};

				map.Destroy = function () {
					gl.deleteFramebuffer(target);
					gl.deleteTexture(handle);

					forget(textures, map);
				};

				textures.push(map);

				return map;
			},

			Resize: function (width, height, ratio) {
				var scale = ratio || settings.Ratio || 1;
				var w = Math.max(1, Math.round(width * scale));
				var h = Math.max(1, Math.round(height * scale));

				if (canvas.width !== w)
					canvas.width = w;

				if (canvas.height !== h)
					canvas.height = h;

				renderer.Width = w;
				renderer.Height = h;
				renderer.Ratio = scale;

				gl.viewport(0, 0, w, h);
			},

			/* Which way the front of a triangle goes round: clockwise for a world drawn as a mirror shows it (its turn is the other way). */
			Winding: function (clockwise) {
				gl.frontFace(clockwise ? gl.CW : gl.CCW);
			},

			/*
			 * Arrays (and typed arrays) of uniforms the caller will not change in their place till the next Hold, the common ones of
			 * a frame: given again, the very same, they are not read again. Those of the Hold before are let go.
			 */
			Hold: function (values) {
				held = new WeakSet();

				(values || []).forEach(function (value) {
					if (value && typeof value === 'object' && typeof value.length === 'number')
						held.add(value);
				});
			},

			/* colorOnly: the depth kept (a target that draws over the depth of another). */
			Clear: function (color, colorOnly) {
				var value = color || [0, 0, 0, 1];
				var k;


				gl.clearColor(value[0], value[1], value[2], value[3] === undefined ? 1 : value[3]);

				if (colorOnly) {
					gl.clear(gl.COLOR_BUFFER_BIT);

					return;
				}

				gl.depthMask(true);

				current.Write = true;

				/* A target of more colors: the first takes the color, the others nought (nothing written there yet). */
				if (current.Target && current.Target.Count > 1) {
					current.Target.Outputs(1);

					gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

					current.Target.Outputs(current.Target.Count);

					for (k = 1; k < current.Target.Count; k++)
						gl.clearBufferfv(gl.COLOR, k, [0, 0, 0, 0]);

					return;
				}

				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			},

			Draw: function (made, program, uniforms, options) {
				var draw = options || {};
				var units = {Next: 0};
				var name = draw.Mode || made.Mode;
				var mode = modes.hasOwnProperty(name) ? modes[name] : gl.TRIANGLES;
				var instances = draw.Instances === undefined ? made.Instances : draw.Instances;
				var list;
				var value;
				var blend = draw.Blend === 'add' || draw.Blend === 'over' || draw.Blend === 'alpha' || draw.Blend === 'veil' ? draw.Blend : '';
				var cull = draw.Cull === 'none' || draw.Cull === false ? '' : draw.Cull === 'front' ? 'front' : 'back';
				var i;

				if (renderer.Lost) return;

				settle(program);

				/* The state of the context is set only where it differs from what the draw before left. */
				if (current.Program !== program.Handle) {
					gl.useProgram(program.Handle);

					current.Program = program.Handle;
				}

				/* Into a target of more colors: as many as the program writes, the rest left as they were. */
				if (current.Target && current.Target.Count > 1)
					current.Target.Outputs(Math.min(current.Target.Count, program.Outputs));

				/* The uniforms of the program, not all that was given: a set of them is shared by many programs. */
				list = uniforms ? program.List : [];

				for (i = 0; i < list.length; i++) {
					value = uniforms[list[i].Name];

					if (value !== undefined && value !== null) uniform(list[i], value, units);
					else if (list[i].Sampler) uniform(list[i], blank(list[i].Type), units);
				}

				if (current.Depth !== (draw.Depth !== false)) {
					current.Depth = draw.Depth !== false;

					if (current.Depth) gl.enable(gl.DEPTH_TEST);
					else gl.disable(gl.DEPTH_TEST);
				}

				/* Depth 'lequal': what is drawn again over the very same surface passes where it stands. */
				if (current.Func !== (draw.Depth === 'lequal')) {
					current.Func = draw.Depth === 'lequal';

					gl.depthFunc(current.Func ? gl.LEQUAL : gl.LESS);
				}

				if (current.Write !== (draw.DepthWrite !== false)) {
					current.Write = draw.DepthWrite !== false;

					gl.depthMask(current.Write);
				}

				/* What adds light leaves the alpha alone, and so does over: there it holds marks of what lies under. */
				if (current.Blend !== blend) {
					current.Blend = blend;

					if (blend) gl.enable(gl.BLEND);
					else gl.disable(gl.BLEND);

					if (blend === 'add') gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ZERO, gl.ONE);
					else if (blend === 'over') gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
					else if (blend === 'alpha') gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
					/* veil: its color over what is behind, and the alpha of what is behind (how glossy it is) gone as far as it covers it. */
					else if (blend === 'veil') gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
				}

				if (current.Cull !== cull) {
					current.Cull = cull;

					if (cull) gl.enable(gl.CULL_FACE);
					else gl.disable(gl.CULL_FACE);

					if (cull)
						gl.cullFace(cull === 'front' ? gl.FRONT : gl.BACK);
				}

				/* Its mesh bound only when another was: what makes or changes a mesh binds its own and lets it go (current.VAO null). */
				if (current.VAO !== made.VAO) {
					gl.bindVertexArray(made.VAO);

					current.VAO = made.VAO;
				}

				counts.Draws++;

				if (mode === gl.TRIANGLES)
					counts.Triangles += Math.floor(made.Count / 3) * (instances || 1);

				if (made.Indexed && instances) gl.drawElementsInstanced(mode, made.Count, made.IndexType, 0, instances);
				else if (made.Indexed) gl.drawElements(mode, made.Count, made.IndexType, 0);
				else if (instances) gl.drawArraysInstanced(mode, 0, made.Count, instances);
				else gl.drawArrays(mode, 0, made.Count);
			},

			Destroy: function () {
				meshes.slice().forEach(function (each) {
					each.Destroy();
				});

				textures.slice().forEach(function (each) {
					each.Destroy();
				});

				Object.keys(programs).forEach(function (key) {
					gl.deleteProgram(programs[key].Handle);
				});

				Object.keys(shaders).forEach(function (key) {
					gl.deleteShader(shaders[key]);
				});

				programs = {};
				shaders = {};

				canvas.removeEventListener('webglcontextlost', lost);
				canvas.removeEventListener('webglcontextrestored', restored);

				/*
				 * Regression: the context itself is given back, not when the canvas is collected. A browser keeps some 16 of
				 * them; a page that made and dropped many scenes (the catalogue: 30) had the browser lose the oldest, living ones,
				 * and then give no more. But not at once: giving it back waits for the card to finish all it was given (a page
				 * held up for most of a minute as scenes left the view, tests timed out letting theirs go). Kept with those let
				 * go, given back the oldest first only when the page has more than MostContexts (Release).
				 */
				var lose = gl.getExtension('WEBGL_lose_context');

				self.Contexts.Live = Math.max(0, self.Contexts.Live - 1);

				if (lose)
					self.Contexts.Released.push(lose);

				self.Release(0);
			}
		};

		function lost (event) {
			event.preventDefault();

			renderer.Lost = true;
		}

		/* A context given back has none of the old programs nor buffers: the owner makes its own again. */
		function restored () {
			programs = {};
			shaders = {};
			meshes = [];
			textures = [];
			gpuQuad = null;
			blanks = {};
			current = {};
			bound.Unit = 0;
			bound.Units = [];
			renderer.Lost = false;

			if (settings.Restored)
				settings.Restored(renderer);
		}

		canvas.addEventListener('webglcontextlost', lost);
		canvas.addEventListener('webglcontextrestored', restored);

		return renderer;
	}
});
