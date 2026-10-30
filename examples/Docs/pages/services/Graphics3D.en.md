<!-- generated -->
# Graphics3D

The graphics of three dimensions on WebGL2, with no library: the numbers of space (matrices, vectors, a camera, a ray), the shapes made of triangles (geometry) and a renderer that draws them with the shaders given to it.

The numbers and the shapes run in Node too (they read no page):

- Matrices of 4 by 4 are arrays of 16 numbers, column by column, as WebGL reads them: Identity(), Multiply(a, b), Invert(m), Translation(x, y, z), Rotation(axis, angle) (radians), Scaling(x, y, z), Compose(position, rotation, scale) (rotation a matrix, or null), Perspective(fov, aspect, near, far) (fov in degrees), Orthographic(left, right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m) (the 3 by 3 one of the normals), Apply(m, point) (a point [x, y, z] moved by it).
- Vectors are arrays [x, y, z]: Vectors.Add(a, b), Subtract, Scale(a, k), Dot, Cross, Length, Normalize, Lerp(a, b, t), Distance.
- Camera(options) returns a camera ({Position, Target, Up, Fov, Near, Far, Ortho: the height of a view of parallel rays, 0 for a perspective}): View(), Projection(aspect), Matrix(aspect) (both), Orbit(target, yaw, pitch, distance) (it looks at target from round it), Ray(x, y, width, height) ({Origin, Direction} through a point of the screen), Project(point, width, height) ({X, Y, Depth, Visible}: where a point of space is on the screen).
- Hit(ray, center, radius): how far along the ray it meets a ball (-1: it does not).
- Geometry is {Positions, Normals, UVs, Colors, Indices} (flat arrays: 3, 3, 2 and 3 numbers a vertex): Sphere({Radius, Segments, Rings}), Icosphere({Radius, Detail}), Ring({Inner, Outer, Segments}) (flat, round the axis Y), Box({Width, Height, Depth}), Cylinder({Radius, Top, Height, Segments, Caps}) (a cone when Top is 0), Torus({Radius, Tube, Segments, Sides}), Plane({Width, Depth, Segments}), Lathe({Points: [[radius, y]...], Segments}) (a line turned round the axis Y), Wedge({Width, Height, Depth}) (a roof of two slopes); Transform(geometry, matrix), Merge(parts) (each a geometry or {Geometry, Matrix, Color}), Displace(geometry, amount) (each vertex moved along its normal by amount(position, normal)), Normals(geometry) (made again from the faces), Facets(geometry) (each face flat, of vertices of its own), Simplify(geometry, cell) (the corners within a cell of a grid made one, for a simpler level).
- Noise(seed) returns a smooth noise of space: Value(x, y, z) (0 to 1), Fbm(x, y, z, octaves) (several of it, each finer and fainter) and Ridge (the folds of mountains). Without a seed it is the very noise of the shaders, Chunks.Noise (noise3, fbm3, ridge3), to the float: a heightmap of the CPU matches a surface the GPU baked. Chunks.Lights is the light of up to 4 points on a surface, with the shadows of up to 4 balls (lighting(position, normal, view, shine, specular); the global lightShade dims its first light). Chunks.Shadow reads a shadow map (sunShadow(position, normal): 0 in the shadow, 1 in the light; uniforms uShadowMap, uShadowMatrix, uShadowBias, uShadowOn).

Create(canvas, options) returns a renderer, or null where there is no WebGL2 (options: Alpha, Antialias, Ratio):

- Program(vertex, fragment): the shaders compiled (each one once), their uniforms found; an error of GLSL is thrown with its log. The attributes have fixed places: aPosition, aNormal, aUV, aColor, aInstance (and aInstance2 to aInstance5, one of each copy of an instanced mesh).
- Mesh(geometry) returns a mesh: Update(geometry), Instance(data, count) (data {aInstance: {Size, Data}, ...}: the copies of the mesh drawn at once), Destroy(); Lines(points, loop) and Points(positions, extra) (extra {aColor: {Size, Data}}) make meshes of lines and of points.
- Texture(source, options) (a canvas, a picture, or {Width, Height, Data}; options Repeat, Nearest) returns a texture for a uniform sampler2D; Cube(size) a cube of six faces for a samplerCube, which Bake(cube, program, uniforms) draws once: the program is Shaders.Quad with a fragment shader that takes the direction of each texel from cubeDirection(uFace, vQuad) (Chunks.Cube): a surface of noise computed once, sampled at every frame.
- Target(width, height, {Colors, Depth}) returns textures to draw into: Textures, Begin(), End(), Destroy(); Viewport(x, y, width, height) draws in a part of it. Texture takes options Float for an array of floats.
- Shadow(size) returns a shadow map, a depth texture for a uniform sampler2DShadow: between its Begin() and End() the draws write only its depth, as seen from the light; Destroy().
- Draw(mesh, program, uniforms, settings): settings Mode (triangles, lines, line-strip, line-loop, points), Blend (alpha, add or none), Depth (test, true), DepthWrite (true), Cull (back, front or none), Instances (the copies). The value of a uniform is a number, an array (of a vector, a matrix or a list of them), true or false, or a texture.
- Resize(width, height, ratio), Clear(color) ([r, g, b, a], 0 to 1), Lost (the context was taken by the browser), Destroy().

## Methods

- `Identity()`
- `Multiply(a, b)`
- `Invert(m)`
- `Translation(x, y, z)`
- `Rotation(axis, angle)`
- `Scaling(x, y, z)`
- `Compose(position, rotation, scale)`
- `Perspective(fov, aspect, near, far)`
- `Orthographic(left, right, bottom, top, near, far)`
- `LookAt(eye, target, up)`
- `NormalMatrix(m)`
- `Apply(m, point)`
- `Camera(options)`
- `Hit(ray, center, radius)`
- `Sphere(options)`
- `Icosphere(options)`
- `Ring(options)`
- `Box(options)`
- `Cylinder(options)`
- `Torus(options)`
- `Plane(options)`
- `Lathe(options)`
- `Wedge(options)`
- `Transform(geometry, matrix)`
- `Merge(parts)`
- `Displace(geometry, amount)`
- `Facets(geometry)`
- `Simplify(geometry, cell)`
- `Normals(geometry)`
- `Noise(seed)`
- `Create(canvas, options)`

## Example

```example
<canvas #Canvas style="display: block; width: 100%; height: 260px; border-radius: 8px; background: #05070c;"></canvas>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'A torus, a ball and a bar merged into one mesh, lit and turning.',

	$OnReady: function () {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var canvas = this.$Ref('Canvas');
		var renderer = graphics.Create(canvas);
		var head = '#version 300 es\nprecision highp float;\n';
		var program;
		var mesh;
		var camera = graphics.Camera({Fov: 40});
		var angle = 0;

		if (!renderer) {
			this.Note = 'This browser has no WebGL2.';

			return;
		}

		program = renderer.Program(head + [
			'in vec3 aPosition;',
			'in vec3 aNormal;',
			'in vec3 aColor;',
			'uniform mat4 uModel;',
			'uniform mat4 uViewProjection;',
			'uniform mat3 uNormalMatrix;',
			'out vec3 vNormal;',
			'out vec3 vColor;',
			'void main() {',
			'	vNormal = uNormalMatrix * aNormal;',
			'	vColor = aColor;',
			'	gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0);',
			'}'
		].join('\n'), head + [
			'in vec3 vNormal;',
			'in vec3 vColor;',
			'out vec4 outColor;',
			'void main() {',
			'	float light = max(dot(normalize(vNormal), normalize(vec3(0.6, 0.8, 0.5))), 0.0);',
			'	outColor = vec4(vColor * (0.15 + 0.85 * light), 1.0);',
			'}'
		].join('\n'));

		/* Three shapes merged into one mesh, each of its color. */
		mesh = renderer.Mesh(graphics.Merge([
			{Geometry: graphics.Torus({Radius: 1, Tube: 0.3}), Color: [0.25, 0.55, 1]},
			{Geometry: graphics.Icosphere({Radius: 0.5, Detail: 2}), Color: [1, 0.6, 0.2]},
			{Geometry: graphics.Box({Width: 0.3, Height: 2.6, Depth: 0.3}), Color: [0.9, 0.9, 0.95]}
		]));

		function frame () {
			var model = graphics.Compose([0, 0, 0], graphics.Multiply(graphics.Rotation([0, 1, 0], angle), graphics.Rotation([1, 0, 0], 0.5)), 1);

			if (!canvas.isConnected) return;

			angle += 0.01;

			renderer.Resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio || 1);
			renderer.Clear([0.02, 0.03, 0.05, 1]);

			camera.Orbit([0, 0, 0], 0, 0.3, 5);

			renderer.Draw(mesh, program, {uModel: model, uNormalMatrix: graphics.NormalMatrix(model), uViewProjection: camera.Matrix(renderer.Width / renderer.Height)});

			self.Frame = window.requestAnimationFrame(frame);
		}

		frame();
	},

	$OnDestroy: function () {
		window.cancelAnimationFrame(this.Frame);
	}
})
</script>
```

## Tests

- [puts a body on its orbit of Kepler at a time, and describes stars and planets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L55) — `tests/regression/library-scene.test.js`
- [makes the same system of the same seed: a star, planets by their distance, moons, rings and belts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L101) — `tests/regression/library-scene.test.js`
- [multiplies, inverts and projects matrices, and makes shapes of triangles](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L136) — `tests/regression/library-scene.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L167) — `tests/regression/library-scene.test.js`
- [has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L206) — `tests/regression/library-scene.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L361) — `tests/regression/library-scene.test.js`
- [has the ground of a planet whose coasts are the ones its baked surface shows, its squares turned outwards](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1188) — `tests/regression/library-scene.test.js`
