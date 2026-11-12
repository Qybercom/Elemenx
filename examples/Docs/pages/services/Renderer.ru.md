<!-- generated -->
# Renderer

Трёхмерная графика на WebGL2 без библиотек: камера и рендерер, который рисует фигуры (сервис Meshes) заданными шейдерами; матрицы, векторы и шум — в сервисе Math. Camera(options) — камера (Ortho — высота вида в параллельных лучах) с View, Projection, Matrix, Orbit(target, yaw, pitch, distance), Ray(x, y, width, height), Project(point, width, height). Chunks.Noise — шум Math в шейдерах, Chunks.Lights — свет до 4 точек с тенями до 4 шаров, Chunks.Shadow — чтение карты теней (Shadow(size) рендерера: Begin() и End()), Target(width, height, {Colors, Depth, DepthTexture, Float, Samples, Mipmaps}) — текстуры, в которые рисуют (несколько цветов работают и с Samples: каждый приходит в свою текстуру; программа пишет столько цветов, сколько выходов layout(location = n) объявила, остальные остаются как были; Clear даёт первому цвет, остальным ноль; DepthFrom — текстура глубины другой цели того же размера, чтобы рисовать поверх того, что в ней, а Clear(color, true) очищает только цвет), Viewport(x, y, width, height), Texture с Float для массива чисел. Create(canvas, options) возвращает рендерер (или null без WebGL2; с Patient программы собираются видеокартой в фоне и ничего их не ждёт: Ready(program) говорит, готова ли, Progress() — {Done, Total, Needed}; программа, не готовая дольше Patience мс (по умолчанию 10 с), один раз дожидается — некоторые видеокарты собирают программу, только когда её используют или ждут): Program(vertex, fragment), Mesh(geometry) с Update, Instance и Destroy, Lines, Points, Texture, Draw(mesh, program, uniforms, settings) (Mode, Blend, Depth, DepthWrite, Cull, Instances), Cube(size) — куб из шести граней для samplerCube: Bake рисует его шейдером, cube.Write(face, data, row, mipmaps) заливает в грань байты RGBA с процессора, полосами строк; Hold(values) — массивы униформ, которые вызывающий не меняет на месте до следующего Hold (общие для кадра): тот же массив, переданный снова, не перечитывается (список из 72 ламп на тысячи вызовов стоил миллисекунды), а массив не из Hold, изменённый на месте, по-прежнему отправляется заново; сетка привязывается только когда меняется; Counts() (сколько нарисовано с создания: {Draws, Triangles}, копии инстансной сетки считаются; разница двух замеров — цена кадра или секунды), Resize, Clear, Lost, Destroy (удаляет сетки, текстуры и программы и сразу отдаёт браузеру сам контекст: браузер держит около 16 контекстов, и страница, создавшая и убравшая много сцен, иначе заставляла его гасить старые живые и потом не давать новых). Камера работает и в Node.

Атрибуты aMaterials, aMaterials2 и aMaterials3 — веса 12 материалов земли (Materials геометрии: 12 чисел на вершину или 8 для первых двух). Где их нет, они равны 0.

Destroy рендерера освобождает всё, что он сделал, но контекст WebGL отдаёт браузеру не сразу: возврат контекста ждёт, пока видеокарта доделает всё, что ей дали (страница замирала на десятки секунд, когда сцены уходили из вида). Контекст встаёт в очередь отпущенных (Contexts: {Live, Released}), и самые старые из них отдаются, только когда живых и отпущенных на странице больше MostContexts (10; браузер держит около 16 и сам теряет самые старые, живые, сверх этого). Release(room) отдаёт лишние с местом ещё для room.

## Методы

- `Camera(options)`
- `Work()`
- `CloudBlock(size)`
- `Release(room)`
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
		var graphics = this.$Service('Renderer');
		var meshes = this.$Service('Meshes');
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
		mesh = renderer.Mesh(meshes.Merge([
			{Geometry: meshes.Torus({Radius: 1, Tube: 0.3}), Color: [0.25, 0.55, 1]},
			{Geometry: meshes.Icosphere({Radius: 0.5, Detail: 2}), Color: [1, 0.6, 0.2]},
			{Geometry: meshes.Box({Width: 0.3, Height: 2.6, Depth: 0.3}), Color: [0.9, 0.9, 0.95]}
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

- [puts a body on its orbit of Kepler at a time, and describes stars and planets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L73) — `tests/regression/library-scene.test.js`
- [makes the same system of the same seed: a star, planets by their distance, moons, rings and belts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L119) — `tests/regression/library-scene.test.js`
- [multiplies, inverts and projects matrices, and makes shapes of triangles](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L154) — `tests/regression/library-scene.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L185) — `tests/regression/library-scene.test.js`
- [has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L226) — `tests/regression/library-scene.test.js`
- [Renderer waits for a program not made after its Patience, once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4429) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4462) — `tests/regression/library-scene.test.js`
- [Renderer sets the state of the context only where it changes, and only the uniforms a program has](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4573) — `tests/regression/library-scene.test.js`
- [lets go of all its meshes with it, one let go twice taking no other off its list](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Renderer/Renderer.test.js#L21) — `libraries/ElemenxGraphics/services/Renderer/Renderer.test.js`
- [gives the contexts of renderers let go back only past MostContexts of the page, the oldest first](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Renderer/Renderer.test.js#L54) — `libraries/ElemenxGraphics/services/Renderer/Renderer.test.js`
- [makes a texture of one byte a texel with Single, its rows as long as they are](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Renderer/Renderer.test.js#L100) — `libraries/ElemenxGraphics/services/Renderer/Renderer.test.js`
- [counts its draws and the triangles of them, each copy of an instanced mesh, and no triangle of a line](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Renderer/Renderer.test.js#L134) — `libraries/ElemenxGraphics/services/Renderer/Renderer.test.js`

+42 ещё в тех же файлах
