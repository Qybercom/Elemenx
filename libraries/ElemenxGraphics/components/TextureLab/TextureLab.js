/*
 * TextureLab: a bench for the textures of SceneTextures, to see one as sharp as the ground will have it and turn its params.
 * Texture is its name; View tile (the tile Repeat times across, to find a seam or a grid) or ground (a plane under the eye at
 * Height metres, looking down by Pitch degrees: what a walker sees of it, near and far); Mode lit, color, normal or height;
 * Sun its elevation in degrees, Turn its azimuth. The panel beside picks them and a slider for each param of the recipe;
 * change emits {Texture, Params} as they change. Methods: Draw(), Bake() (the tile again), Picture() (PNG as a data URL).
 */
Elemenx.Component('TextureLab', {
	$TemplateURL: 'TextureLab.html',
	$StyleURL: 'TextureLab.css',
	$Meta: {
		Group: 'game',
		Icon: 'palette',
		Description: 'A bench for the textures of SceneTextures: a tile and a ground under the sun, sharp near and far, its params on sliders.',
		Events: {
			change: 'A texture or a param changed: {Texture, Params}.'
		},
		Methods: ['Draw()', 'Bake()', 'Picture()'],
		Props: {
			Texture: 'The name of the texture (SceneTextures).',
			View: {Options: ['ground', 'tile'], Description: 'A ground under the eye, or the tile Repeat times across.'},
			Mode: {Options: ['lit', 'color', 'normal', 'height'], Description: 'What is shown: lit, its color, its normal or its height.'},
			Params: 'The params of the recipe ({Name: value}); the others as the recipe has them.',
			Sun: 'The elevation of the sun, degrees.',
			Turn: 'The azimuth of the sun, degrees.',
			Repeat: 'Tiles across the height of the view tile (below 1: nearer than a tile, as a photograph of it).',
			Height: 'The eye over the ground in the view ground, metres.',
			Pitch: 'How far the eye looks down in the view ground, degrees.',
			Label: 'What it shows, for screen readers.'
		}
	},
	Texture: 'lawn',
	View: 'ground',
	Mode: 'lit',
	Params: null,
	Sun: 40,
	Turn: 30,
	Repeat: 2,
	Height: 1.7,
	Pitch: 30,
	Label: '',

	/* What the template renders. */
	Version: 0,
	Views: [{ID: 'ground', Key: 'graphics.textureLab.views.ground'}, {ID: 'tile', Key: 'graphics.textureLab.views.tile'}],
	Modes: [
		{ID: 'lit', Key: 'graphics.textureLab.modes.lit'},
		{ID: 'color', Key: 'graphics.textureLab.modes.color'},
		{ID: 'normal', Key: 'graphics.textureLab.modes.normal'},
		{ID: 'height', Key: 'graphics.textureLab.modes.height'}
	],

	/* What the drawing keeps, out of the state of the component. */
	$OnCreate: function () {
		var own = {Renderer: null, Frame: 0, Quad: null, Program: null, Sizer: null};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Renderer = this.$Service('Renderer').Create(this.$Ref('Canvas'), {Antialias: true});
		own.Sizer = new ResizeObserver(function () {
			self.Draw();
		});

		own.Sizer.observe(this.$Ref('View'));

		this.Draw();
	},

	$OnProps: function () {
		this.Draw();
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Sizer)
			own.Sizer.disconnect();

		if (own.Renderer && own.Renderer.Destroy)
			own.Renderer.Destroy();

		window.cancelAnimationFrame(own.Frame);
	},

	/* The recipe of the texture and the value of each param: as given, else as the recipe has it. */
	Recipe: function () {
		return this.$Service('SceneTextures').Get(this.Texture);
	},

	Values: function () {
		var recipe = this.Recipe();
		var given = this.Params || {};
		var values = {};

		Object.keys(recipe ? recipe.Params || {} : {}).forEach(function (key) {
			values[key] = given[key] !== undefined && given[key] !== null && given[key] !== '' ? Number(given[key]) : recipe.Params[key].Value;
		});

		return values;
	},

	/* The sliders of the panel: one a param. */
	Sliders: function () {
		var recipe = this.Recipe();
		var values = this.Values();

		return Object.keys(recipe ? recipe.Params || {} : {}).map(function (key) {
			var param = recipe.Params[key];

			return {Key: key, Title: param.Title || key, Min: param.Min, Max: param.Max, Step: (param.Max - param.Min) / 100, Value: values[key]};
		});
	},

	Names: function () {
		return this.$Service('SceneTextures').Names();
	},

	Picked: function (event) {
		this.Texture = event.target.value;
		this.Params = null;
		this.Version++;

		this.$Emit('change', {Texture: this.Texture, Params: this.Values()});

		this.Draw();
	},

	Viewed: function (event) {
		this.View = event.target.value;

		this.Draw();
	},

	Moded: function (event) {
		this.Mode = event.target.value;

		this.Draw();
	},

	Slid: function (event) {
		var params = Object.assign({}, this.Params || {});

		params[event.target.getAttribute('data-key')] = Number(event.target.value);

		this.Params = params;

		this.$Emit('change', {Texture: this.Texture, Params: this.Values()});

		this.Draw();
	},

	Sunned: function (event) {
		this[event.target.getAttribute('data-key')] = Number(event.target.value);

		this.Draw();
	},

	Bake: function () {
		var own = this.Own();
		if (!own.Renderer) return null;

		return this.$Service('SceneTextures').Bake(own.Renderer, this.Texture, this.Values());
	},

	/* Once a frame at most: the view as its props have it. */
	Draw: function () {
		var self = this;
		var own = this.Own();
		if (!own.Renderer || own.Frame) return;

		own.Frame = window.requestAnimationFrame(function () {
			own.Frame = 0;

			self.Paint();
		});
	},

	Paint: function () {
		var own = this.Own();
		var renderer = own.Renderer;
		var view = this.$Ref('View');
		var made;
		var width;
		var height;

		if (!renderer || !view) return;

		width = Math.max(1, view.clientWidth);
		height = Math.max(1, view.clientHeight);

		renderer.Resize(width, height, Math.min(2, window.devicePixelRatio || 1));

		made = this.Bake();

		if (!made) return;

		own.Quad = own.Quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		own.Program = own.Program || renderer.Program(this.$Service('Renderer').Shaders.Quad, this.Shader());

		var sun = Number(this.Sun) * Math.PI / 180;
		var turn = Number(this.Turn) * Math.PI / 180;

		renderer.Draw(own.Quad, own.Program, {
			uColor: made.Color,
			uSurface: made.Surface,
			uMetres: made.Metres,
			uRepeat: Math.max(0.05, Number(this.Repeat) || 2),
			uAspect: width / height,
			uView: this.View === 'tile' ? 1 : 0,
			uMode: Math.max(0, ['lit', 'color', 'normal', 'height'].indexOf(this.Mode)),
			uSun: [Math.cos(sun) * Math.sin(turn), Math.sin(sun), Math.cos(sun) * Math.cos(turn)],
			uEye: Math.max(0.05, Number(this.Height) || 1.7),
			uPitch: (Number(this.Pitch) || 30) * Math.PI / 180,
			uFov: 55 * Math.PI / 180
		}, {Depth: false, DepthWrite: false, Cull: 'none'});
	},

	/* The picture of the view: PNG as a data URL (drawn at once, so the canvas holds it). */
	Picture: function () {
		this.Paint();

		return this.$Ref('Canvas').toDataURL('image/png');
	},

	/* The shader of the view: the tile repeated, or a ground under the eye, lit by the sun and the sky. */
	Shader: function () {
		return [
			'#version 300 es',
			'precision highp float;',
			'in vec2 vQuad;',
			'uniform sampler2D uColor;',
			'uniform sampler2D uSurface;',
			'uniform float uMetres;',
			'uniform float uRepeat;',
			'uniform float uAspect;',
			'uniform int uView;',
			'uniform int uMode;',
			'uniform vec3 uSun;',
			'uniform float uEye;',
			'uniform float uPitch;',
			'uniform float uFov;',
			'out vec4 outColor;',
			this.$Service('SceneTextures').Chunk(),
			'vec3 sky(vec3 d) {',
			'	return mix(vec3(0.75, 0.83, 0.92), vec3(0.32, 0.5, 0.85), pow(max(d.y, 0.0), 0.5));',
			'}',
			'vec3 shade(vec3 albedo, float rough, vec3 n, float light, vec3 v) {',
			'	vec3 l = normalize(uSun);',
			'	vec3 hv = normalize(l + v);',
			'	float nl = max(dot(n, l), 0.0);',
			'	float a = max(rough * rough, 0.02);',
			'	float nh = max(dot(n, hv), 0.0);',
			'	float dd = nh * nh * (a * a - 1.0) + 1.0;',
			'	float spec = a * a / (3.14159 * dd * dd) * 0.04 * nl;',
			'	vec3 sun = vec3(1.0, 0.96, 0.88) * 3.0;',
			'	vec3 ambient = vec3(0.42, 0.5, 0.62) * 0.55 * light * (0.6 + 0.4 * n.z);',
			'	return albedo * (sun * nl / 3.14159 * 3.14159 * 0.32 + ambient) + sun * spec;',
			'}',
			'vec3 tone(vec3 x) {',
			'	x = x * 0.9;',
			'	return pow(clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0), vec3(1.0 / 2.2));',
			'}',
			'void main() {',
			'	vec3 albedo;',
			'	float rough;',
			'	vec3 n;',
			'	float h;',
			'	float light;',
			'	vec3 v = vec3(0.0, 0.0, 1.0);',
			'	if (uView == 1) {',
			'		vec2 uv = (vQuad * 0.5 + 0.5) * vec2(uAspect, 1.0) * uRepeat;',
			'		vec4 c = texture(uColor, uv);',
			'		vec4 s = texture(uSurface, uv);',
			'		albedo = pow(c.rgb, vec3(2.2));',
			'		rough = c.a;',
			'		vec2 t = s.xy * 2.0 - 1.0;',
			'		n = normalize(vec3(t, sqrt(max(0.0, 1.0 - dot(t, t)))));',
			'		h = s.b;',
			'		light = s.a;',
			'	}',
			'	else {',
			/* A ray of the eye: the ground where it falls, the sky where it does not. */
			'		vec3 dir = normalize(vec3(vQuad.x * uAspect * tan(uFov * 0.5), vQuad.y * tan(uFov * 0.5), -1.0));',
			'		float cp = cos(uPitch);',
			'		float sp = sin(uPitch);',
			'		dir = vec3(dir.x, dir.y * cp + dir.z * sp, -dir.y * sp + dir.z * cp);',
			'		if (dir.y > -0.0005) {',
			'			outColor = vec4(tone(sky(vec3(dir.x, -dir.y, dir.z)) * 1.4), 1.0);',
			'			return;',
			'		}',
			'		float t = uEye / -dir.y;',
			'		vec2 place = vec2(dir.x, dir.z) * t;',
			'		tex_sample(uColor, uSurface, place, uMetres, 1.0, albedo, rough, n, h, light);',
			/* The tangent of the ground: x along x, y along z; up is y. */
			'		n = normalize(vec3(n.x, n.z, n.y));',
			'		v = normalize(-dir);',
			'		vec3 lit = shade(albedo, rough, n, light, v);',
			'		float fog = 1.0 - exp(-t * 0.004);',
			'		outColor = vec4(tone(mix(lit, sky(vec3(0.0, 0.1, 1.0)), fog)), 1.0);',
			'		if (uMode == 1) outColor = vec4(pow(albedo, vec3(1.0 / 2.2)), 1.0);',
			'		if (uMode == 2) outColor = vec4(n * 0.5 + 0.5, 1.0);',
			'		if (uMode == 3) outColor = vec4(vec3(h), 1.0);',
			'		return;',
			'	}',
			'	n = normalize(vec3(n.x, n.z, n.y));',
			'	vec3 lit = shade(albedo, rough, n, light, vec3(0.0, 1.0, 0.0));',
			'	outColor = vec4(tone(lit), 1.0);',
			'	if (uMode == 1) outColor = vec4(pow(albedo, vec3(1.0 / 2.2)), 1.0);',
			'	if (uMode == 2) outColor = vec4(n * 0.5 + 0.5, 1.0);',
			'	if (uMode == 3) outColor = vec4(vec3(h), 1.0);',
			'}'
		].join('\n');
	}
});
