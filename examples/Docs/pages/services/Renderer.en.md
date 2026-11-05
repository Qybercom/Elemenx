<!-- generated -->
# Renderer

Renderer: the graphics of three dimensions on WebGL2, with no library: a camera and a renderer that draws shapes (of the Meshes Service) with the shaders given to it; the numbers of space are of the Math Service.

The camera runs in Node too (it reads no page):

- The matrices, the vectors, the rays and the noise are of the Math Service of ElemenxCommon.
- Camera(options) returns a camera ({Position, Target, Up, Fov, Near, Far, Ortho: the height of a view of parallel rays, 0 for a perspective}): View(), Projection(aspect), Matrix(aspect) (both), Orbit(target, yaw, pitch, distance) (it looks at target from round it), Ray(x, y, width, height) ({Origin, Direction} through a point of the screen), Project(point, width, height) ({X, Y, Depth, Visible}: where a point of space is on the screen).
- CloudBlock(size): the block of noise of clouds (RGBA of size on each side, a Uint8Array for Volume), the same each time; Work() the worker that makes it off the main thread. Chunks.Lights is the light of up to 4 points on a surface, with the shadows of up to 4 balls (lighting(position, normal, view, shine, specular); the global lightShade dims its first light). Chunks.Shadow reads a shadow map (sunShadow(position, normal): 0 in the shadow, 1 in the light; uniforms uShadowMap, uShadowMatrix, uShadowBias, uShadowOn).

Create(canvas, options) returns a renderer, or null where there is no WebGL2 (options: Alpha, Antialias, Ratio):

- Program(vertex, fragment, behind): the shaders compiled (each one once), their uniforms found; an error of GLSL is thrown with its log. With options Patient the card does that in the background and nothing waits for it: Ready(program) tells whether it is done, Progress() is {Done, Total, Needed} of the programs (behind: one nothing waits for), and a Draw with one not done yet waits, as it must. A slow shader so holds no frame up. Check(vertex, fragment) asks the card at once whether two shaders compile: their logs, or null. The attributes have fixed places: aPosition, aNormal, aUV, aColor, aInstance (and aInstance2 to aInstance5, one of each copy of an instanced mesh).
- Mesh(geometry) returns a mesh: Update(geometry), Instance(data, count) (data {aInstance: {Size, Data}, ...}: the copies of the mesh drawn at once), Destroy(); Lines(points, loop) and Points(positions, extra) (extra {aColor: {Size, Data}}) make meshes of lines and of points.
- Texture(source, options) (a canvas, a picture, or {Width, Height, Data}; options Repeat, Nearest) returns a texture (Update(picture) puts another canvas or picture in it) for a uniform sampler2D; Volume(size, data) a repeating block of size^3 RGBA bytes for a sampler3D; Cube(size) a cube of six faces for a samplerCube, which Bake(cube, program, uniforms) draws once: the program is Shaders.Quad with a fragment shader that takes the direction of each texel from cubeDirection(uFace, vQuad) (Chunks.Cube): a surface of noise computed once, sampled at every frame.
- Target(width, height, {Colors, Depth, DepthTexture, Float, Samples, Mipmaps}) returns textures to draw into: Textures, Depth (with DepthTexture), Begin(), End() (it resolves the samples and makes the mipmaps), Destroy(); Viewport(x, y, width, height) draws in a part of it. Texture takes options Float for an array of floats, Single for one byte a texel (a mask, read as .r), Srgb for the colors of a picture, Mipmaps, and Wrap and Filter of a sampler of glTF.
- Shadow(size) returns a shadow map, a depth texture for a uniform sampler2DShadow (Raw: the same for a sampler2D, to read its depths): between its Begin() and End() the draws write only its depth, as seen from the light; Destroy().
- Draw(mesh, program, uniforms, settings): settings Mode (triangles, lines, line-strip, line-loop, points), Blend (alpha; add; over: its color over what is behind, the alpha of that kept; veil: the same, that alpha gone as far as it covers it; or none), Depth (test, true; lequal: what is drawn again over the same surface passes), DepthWrite (true), Cull (back, front or none), Instances (the copies). The value of a uniform is a number, an array (of a vector, a matrix or a list of them), true or false, or a texture.
- Counts(): what it drew since it was made, {Draws, Triangles} (the copies of an instanced mesh counted): the difference of two of them is what a frame, or a second, costs.
- Resize(width, height, ratio), Clear(color) ([r, g, b, a], 0 to 1), Winding(clockwise) (the front of a triangle goes round clockwise: a world drawn as a mirror shows it), Lost (the context was taken by the browser), Destroy().

## Methods

- `Camera(options)`
- `Work()`
- `CloudBlock(size)`
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

## Tests

- [puts a body on its orbit of Kepler at a time, and describes stars and planets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L72) — `tests/regression/library-scene.test.js`
- [makes the same system of the same seed: a star, planets by their distance, moons, rings and belts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L118) — `tests/regression/library-scene.test.js`
- [multiplies, inverts and projects matrices, and makes shapes of triangles](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L153) — `tests/regression/library-scene.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L184) — `tests/regression/library-scene.test.js`
- [has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L225) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3805) — `tests/regression/library-scene.test.js`
- [Renderer sets the state of the context only where it changes, and only the uniforms a program has](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3916) — `tests/regression/library-scene.test.js`
- [makes a texture of one byte a texel with Single, its rows as long as they are](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Renderer/Renderer.test.js#L17) — `libraries/ElemenxGraphics/services/Renderer/Renderer.test.js`
- [counts its draws and the triangles of them, each copy of an instanced mesh, and no triangle of a line](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Renderer/Renderer.test.js#L51) — `libraries/ElemenxGraphics/services/Renderer/Renderer.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of the system Libraries](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [draws its water by the water graph of the library made of blocks, or by a WaterGraph of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L301) — `tests/regression/library-material-blueprints.test.js`
- [draws its sky and its land by the graphs of the library made of blocks, or by a SkyGraph and a LandGraph of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L354) — `tests/regression/library-material-blueprints.test.js`

+26 more in the same files
