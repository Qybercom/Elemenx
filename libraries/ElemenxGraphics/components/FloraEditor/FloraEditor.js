/*
 * FloraEditor: a species of plant of a picture of it (SceneFlora): a photograph of a plant on white or clear is read for
 * its bare trunk, the profile of its crown and the colors of its leaves and of its bark (FromPicture, its outline drawn
 * over it), and the plant grown of that seen at once in 3D, each of its numbers on a slider, its colors picked, its own
 * pictures of bark and leaves loaded; Define makes it a model of SceneModels under Name, as the scenes sow it.
 * Species: the preset it starts of (a species of SceneFlora: pine, oak, willow, apple...); Preset: one given instead (an object or its
 * JSON); Variant: which plant of the species the view shows; Name: the model Define makes. Events: change {Preset} as it
 * changes, define {Name}. Methods: Current() (the preset as it is now), Analyse(picture) ({Width, Height, Data}: the
 * preset of a picture, null when it holds no plant), Grow() (the view again), Define(name).
 */
Elemenx.Component('FloraEditor', {
	$TemplateURL: 'FloraEditor.html',
	$StyleURL: 'FloraEditor.css',
	$Meta: {
		Group: 'game',
		Icon: 'tree',
		Description: 'A species of plant of a photograph of it: its trunk, crown and colors read from the picture, grown at once in 3D, each number on a slider, defined as a model.',
		Events: {
			change: 'The preset changed: {Preset}.',
			define: 'Define made it a model of SceneModels: {Name}.'
		},
		Methods: ['Current()', 'Analyse(picture)', 'Grow()', 'Define(name)'],
		Props: {
			Species: {Options: ['pine', 'spruce', 'oak', 'birch', 'palm', 'bush', 'aspen', 'sequoia', 'willow', 'poplar', 'chestnut', 'alder', 'linden', 'acacia', 'apple', 'peach', 'apricot', 'cherry', 'sweet-cherry', 'hazel', 'juniper', 'lilac', 'fern', 'bamboo', 'reed', 'bulrush', 'wheat', 'sunflower', 'burdock'], Description: 'The preset it starts of.'},
			Preset: 'A preset of SceneFlora given instead (an object or its JSON).',
			Variant: 'Which plant of the species the view shows (0 and up).',
			Name: 'The name of the model Define makes.',
			Label: 'What it shows, for screen readers.'
		}
	},
	Species: 'oak',
	Preset: null,
	Variant: 0,
	Name: 'flora-custom',
	Label: '',

	/* What the template renders. */
	Version: 0,
	Shown: '',
	Size: 10,
	Busy: false,
	HasPicture: false,
	Told: '',
	Grows: ['colonize', 'whorls', 'palm', 'stalks'],
	Kinds: ['broad', 'needles', 'frond', 'compound', 'blade', 'single'],
	Heads: ['none', 'ear', 'panicle', 'cob', 'disc', 'burrs'],
	Patterns: ['plates', 'birch', 'ridges', 'rings', 'smooth', 'fibrous', 'bands', 'diamonds'],

	/* The numbers of a preset on sliders: [path, min, max, step]. */
	Numbers: [
		['Trunk.Bare', 0, 0.9, 0.01],
		['Trunk.Radius', 0.005, 0.05, 0.001],
		['Trunk.Lean', 0, 0.4, 0.01],
		['Trunk.Wander', 0, 0.6, 0.01],
		['Trunk.Stems', 1, 8, 1],
		['Trunk.Stubs', 0, 1, 0.01],
		['Crown.Width', 0.05, 0.8, 0.01],
		['Crown.Clumps', 0, 0.9, 0.01],
		['Crown.Hollow', 0.2, 1, 0.01],
		['Crown.Lean', 0, 0.6, 0.01],
		['Crown.Points', 100, 2500, 50],
		['Growth.Up', 0, 0.5, 0.01],
		['Growth.Droop', 0, 0.6, 0.01],
		['Growth.Step', 0.01, 0.04, 0.001],
		['Leaves.Size', 0.2, 5, 0.05],
		['Leaves.Each', 0, 40, 1],
		['Leaves.Base', 0, 30, 1],
		['Leaves.Hang', 0, 1, 0.01],
		['Leaves.Narrow', 0, 1, 0.01],
		['Leaves.Bloom', 0, 1, 0.01],
		['Leaves.Fruit', 0, 1, 0.01],
		['Leaves.FruitSize', 0.01, 0.06, 0.002],
		['Head.Size', 0.02, 1, 0.01],
		['Head.Share', 0, 1, 0.01]
	],

	/* Its colors picked: [path]. */
	Colors: ['Leaves.Shade', 'Leaves.Color', 'Leaves.Light', 'Leaves.BloomColor', 'Leaves.FruitColor', 'Head.Color', 'Bark.Low', 'Bark.High'],

	$OnCreate: function () {
		var own = {Preset: null, Picture: null, Found: null, Space: null, Timer: 0, Grown: 0};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		this.Start();
	},

	$OnProps: function (changed) {
		if (changed && (changed.Species || changed.Preset)) {
			this.Own().Preset = null;

			this.Start();
		}
		else if (changed && changed.Variant) {
			this.Grow();
		}
	},

	$OnDestroy: function () {
		window.clearTimeout(this.Own().Timer);
	},

	/* The preset it starts of: the one given, else its species. */
	Start: function () {
		var own = this.Own();
		var given = this.Preset;
		var flora = this.$Service('SceneFlora');

		if (typeof given === 'string' && given.trim())
			given = JSON.parse(given);

		own.Preset = flora.Preset(given && typeof given === 'object' ? given : this.Species || 'oak');
		this.Version++;

		this.Grow();
	},

	Current: function () {
		var own = this.Own();
		if (!own.Preset)
			own.Preset = this.$Service('SceneFlora').Preset(this.Species || 'oak');

		return this.$Service('SceneFlora').Preset(own.Preset);
	},

	/* The ground the plant stands on: a meadow, flat, made once (SceneWorld). */
	World: function () {
		var own = this.Own();

		own.World = own.World || this.$Service('SceneWorld').Library({Size: 120, Height: 0.6, Water: 0, Scale: 200, Seed: 'flora'});

		return own.World;
	},

	/* The species it may start of. */
	Names: function () {
		return this.$Service('SceneFlora').Species();
	},

	/* A value of the preset at a path (Crown.Width). */
	Read: function (path) {
		var parts = path.split('.');
		var at = this.Own().Preset || this.Current();

		return parts.reduce(function (value, part) {
			return value === undefined || value === null ? value : value[part];
		}, at);
	},

	Write: function (path, value) {
		var own = this.Own();
		var parts = path.split('.');
		var at = own.Preset || (own.Preset = this.Current());

		parts.slice(0, -1).forEach(function (part) {
			at[part] = at[part] || {};
			at = at[part];
		});

		at[parts[parts.length - 1]] = value;
	},

	/* The sliders of the panel (Title: the key of its words). */
	Sliders: function () {
		var self = this;

		return this.Numbers.map(function (number) {
			return {Key: number[0], Title: 'graphics.floraEditor.numbers.' + number[0].replace('.', '_'), Min: number[1], Max: number[2], Step: number[3], Value: Number(self.Read(number[0])) || 0};
		});
	},

	/* The colors of the panel, each as #rrggbb (Title: the key of its words). */
	Swatches: function () {
		var self = this;

		return this.Colors.map(function (path) {
			/* A color the species has none of (its flowers): white. */
			var color = self.Read(path) || [1, 1, 1];

			return {Key: path, Title: 'graphics.floraEditor.colors.' + path.replace('.', '_'), Value: '#' + color.map(function (part) {
				var hex = Math.round(Math.max(0, Math.min(1, part)) * 255).toString(16);

				return hex.length < 2 ? '0' + hex : hex;
			}).join('')};
		});
	},

	/* How tall it is, metres (both ends of its Height). */
	Tall: function () {
		var height = this.Read('Height') || [10, 10];

		return Math.round((height[0] + height[1]) / 2 * 10) / 10;
	},

	Changed: function () {
		this.Version++;

		this.$Emit('change', {Preset: this.Current()});

		this.Grow();
	},

	Slid: function (event) {
		this.Write(event.target.getAttribute('data-key'), Number(event.target.value));

		this.Changed();
	},

	Heighted: function (event) {
		var tall = Number(event.target.value);

		this.Write('Height', [Math.round(tall * 0.85 * 10) / 10, Math.round(tall * 1.15 * 10) / 10]);

		this.Changed();
	},

	Picked: function (event) {
		var hex = event.target.value;

		this.Write(event.target.getAttribute('data-key'), [1, 3, 5].map(function (at) {
			return Math.round(parseInt(hex.slice(at, at + 2), 16) / 255 * 1000) / 1000;
		}));

		this.Changed();
	},

	Chose: function (event) {
		this.Write(event.target.getAttribute('data-key'), event.target.value);

		this.Changed();
	},

	Specied: function (event) {
		this.Species = event.target.value;
		this.Own().Preset = null;
		this.Own().Found = null;

		this.Start();

		this.$Emit('change', {Preset: this.Current()});
	},

	Varied: function (event) {
		this.Variant = Math.max(0, (Number(this.Variant) || 0) + Number(event.currentTarget.getAttribute('data-step')));
		this.Version++;

		this.Grow();
	},

	Named: function (event) {
		this.Name = event.target.value;
	},

	/* A picture of a file: its pixels ({Width, Height, Data}, at most 400 a side for the reading), callback(picture). */
	Pixels: function (file, most, callback) {
		var reader = new FileReader();

		reader.onload = function () {
			var image = new Image();

			image.onload = function () {
				var scale = Math.min(1, most / Math.max(image.width, image.height));
				var canvas = document.createElement('canvas');
				var context;

				canvas.width = Math.max(1, Math.round(image.width * scale));
				canvas.height = Math.max(1, Math.round(image.height * scale));
				context = canvas.getContext('2d');

				context.drawImage(image, 0, 0, canvas.width, canvas.height);

				callback({Width: canvas.width, Height: canvas.height, Data: new Uint8Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer)}, image);
			};

			image.src = reader.result;
		};

		reader.readAsDataURL(file);
	},

	/* The reference: read, its outline drawn over it, the preset of it. */
	Loaded: function (event) {
		var self = this;
		var file = event.target.files && event.target.files[0];
		if (!file) return;

		this.Pixels(file, 400, function (picture, image) {
			self.Own().Picture = image;

			if (!self.Analyse(picture)) {
				self.Told = 'graphics.floraEditor.none';
				self.Version++;
			}
		});
	},

	/* Its own picture of bark or of leaves (an atlas as SceneFlora draws it: four clusters above, the same in shade below). */
	Textured: function (event) {
		var self = this;
		var file = event.target.files && event.target.files[0];
		var part = event.target.getAttribute('data-key');

		if (!file) return;

		this.Pixels(file, 1024, function (picture) {
			self.Write(part + '.Image', picture);

			self.Changed();
		});
	},

	Analyse: function (picture) {
		var made = this.$Service('SceneFlora').FromPicture(picture, this.Own().Preset || this.Species || 'oak');
		var own = this.Own();

		if (!made)
			return null;

		/* What the picture does not tell stays as it was: how it grows, its height, its leaves' kind. */
		own.Preset = made.Preset;
		own.Found = Object.assign({Width: picture.Width, Height: picture.Height}, made.Found);
		this.HasPicture = true;
		this.Told = '';

		this.Changed();
		this.Outline();

		return this.Current();
	},

	/* The reference and over it what was read of it: the rows of its crown, where its crown begins, its trunk. */
	Outline: function () {
		var own = this.Own();
		var canvas = this.$Ref('Reference');
		var found = own.Found;
		var context;
		var scale;

		if (!canvas || !found) return;

		canvas.width = found.Width;
		canvas.height = found.Height;
		context = canvas.getContext('2d');
		scale = 1;

		context.clearRect(0, 0, canvas.width, canvas.height);

		if (own.Picture)
			context.drawImage(own.Picture, 0, 0, canvas.width, canvas.height);

		context.lineWidth = 1;
		context.strokeStyle = 'rgba(220, 40, 40, 0.8)';

		found.Rows.forEach(function (row) {
			context.beginPath();
			context.moveTo(row[1] * scale, row[0] * scale);
			context.lineTo(row[2] * scale, row[0] * scale);
			context.stroke();
		});

		context.lineWidth = 2;
		context.strokeStyle = 'rgba(40, 90, 230, 0.9)';

		context.beginPath();
		context.moveTo(found.Box[0], found.Foot);
		context.lineTo(found.Box[2], found.Foot);
		context.stroke();

		context.strokeStyle = 'rgba(230, 190, 20, 0.9)';

		context.beginPath();
		context.moveTo(found.Trunk, found.Box[1]);
		context.lineTo(found.Trunk, found.Box[3]);
		context.stroke();
	},

	SceneReady: function (space) {
		this.Own().Space = space;

		this.Frame();
		this.Grow();
	},

	/* The eye on the whole plant. */
	Frame: function () {
		var space = this.Own().Space;
		var tall = this.Tall();

		if (space && space.SetViewpoint)
			space.SetViewpoint({Target: [0, tall * 0.5, 0], Yaw: 0.5, Pitch: 0.12, Distance: tall * 2.1 + 3});
	},

	/*
	 * The view grown again, a little after the last change: its model (not kept in the browser: a preview) under a name of
	 * its own, the scene asked to take it anew.
	 */
	Grow: function () {
		var self = this;
		var own = this.Own();

		window.clearTimeout(own.Timer);

		own.Timer = window.setTimeout(function () {
			var flora = self.$Service('SceneFlora');
			var models = self.$Service('SceneModels');
			var preset = self.Current();
			var name = 'flora-editor-' + (own.Name = own.Name || Math.random().toString(36).slice(2, 8));
			var grown = ++own.Grown;

			/* The plant of its Variant: of a seed of its own (one plant made, not as many as its number). */
			preset.Name = preset.Name + '~' + (Number(self.Variant) || 0);

			self.Busy = true;

			flora.Define(name, preset, {Variants: 1, Keep: false});

			models.Load(name, function (error) {
				var space = own.Space;

				if (grown !== own.Grown) return;

				self.Busy = false;
				self.Told = error ? 'graphics.floraEditor.failed' : '';

				if (!space) return;

				/* The scene takes it anew: what it asked for before is no more. */
				delete space.Scene().Asked[name];
				self.Shown = name;
				self.Size = self.Tall();
				self.Version++;
				space.Scene().Version++;

				self.Frame();
			});
		}, 350);
	},

	Define: function (name) {
		var given = name || this.Name || 'flora-custom';

		this.$Service('SceneFlora').Define(given, this.Current());

		this.$Emit('define', {Name: given});

		return given;
	},

	Defined: function () {
		this.Define(this.Name);
	}
});
