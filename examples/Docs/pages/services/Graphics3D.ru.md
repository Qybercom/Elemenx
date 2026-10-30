<!-- generated -->
# Graphics3D

Трёхмерная графика на WebGL2 без библиотек: числа пространства (матрицы, векторы, камера, луч), фигуры из треугольников и рендерер, который рисует их заданными шейдерами. Матрицы 4×4 — массивы из 16 чисел по столбцам: Identity, Multiply, Invert, Translation, Rotation, Scaling, Compose, Perspective, Orthographic, LookAt, NormalMatrix, Apply; векторы — Vectors.Add, Subtract, Scale, Dot, Cross, Length, Normalize, Lerp, Distance. Camera(options) — камера с View, Projection, Matrix, Orbit(target, yaw, pitch, distance), Ray(x, y, width, height), Project(point, width, height); Hit(ray, center, radius) — пересечение луча с шаром. Геометрия {Positions, Normals, UVs, Colors, Indices}: Sphere, Icosphere, Ring, Box, Cylinder (конус при Top 0), Torus, Plane, Lathe (линия, повёрнутая вокруг оси Y), Wedge (крыша из двух скатов); Transform, Merge, Displace, Normals, Facets (плоские грани). Noise(seed) — гладкий шум пространства (Value, Fbm), в шейдерах тот же в Chunks.Noise, а Chunks.Lights — свет до 4 точек с тенями до 4 шаров, Chunks.Shadow — чтение карты теней (Shadow(size) рендерера: Begin() и End()). Create(canvas, options) возвращает рендерер (или null без WebGL2): Program(vertex, fragment), Mesh(geometry) с Update, Instance и Destroy, Lines, Points, Texture, Draw(mesh, program, uniforms, settings) (Mode, Blend, Depth, DepthWrite, Cull, Instances), Resize, Clear, Lost, Destroy. Числа и фигуры работают и в Node.

## Методы

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
- `Normals(geometry)`
- `Noise(seed)`
- `Create(canvas, options)`

## Пример

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

## Тесты

- [puts a body on its orbit of Kepler at a time, and describes stars and planets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L55) — `tests/regression/library-scene.test.js`
- [makes the same system of the same seed: a star, planets by their distance, moons, rings and belts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L101) — `tests/regression/library-scene.test.js`
- [multiplies, inverts and projects matrices, and makes shapes of triangles](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L136) — `tests/regression/library-scene.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L167) — `tests/regression/library-scene.test.js`
- [has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L206) — `tests/regression/library-scene.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L361) — `tests/regression/library-scene.test.js`
- [has the ground of a planet whose coasts are the ones its baked surface shows, its squares turned outwards](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L920) — `tests/regression/library-scene.test.js`
