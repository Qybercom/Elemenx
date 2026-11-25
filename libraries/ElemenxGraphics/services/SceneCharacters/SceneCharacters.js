/*
 * SceneCharacters: the walkers of a game as data, each a character a game keeps as a file of its own (or many of them in
 * one catalogue): what it is made of, how it moves, what it holds. Of it the model of a unit is made (SceneModels), and
 * Scene.Add('unit', ...) takes what Unit gives to have it walk.
 *
 * A character: {Name, Model (a file of a model, glb, gltf or fbx; or the name of a model of code: mannequin), Size (how
 * tall it stands, metres: 1.8), Bones ({role: the name of a node}: the bones of a skeleton whose names tell nothing,
 * SceneModels Bones), Clips ({clip: a file of a clip of another skeleton, or {URL, Stride, Held}}: SceneModels Motions; or
 * the name of a set of them, Sets), Hold ({Model (a file or the name of a model), Bone, Aim, At, Turn, Size}: what it
 * holds in a hand, Hold of a unit of a Scene)}. A file is read from the folder of the file of the character (Base) when
 * its path is not absolute.
 *
 * - Sets(name, clips) keeps a set of clips by its name, for many characters (those of Mixamo of a game); Sets(name) gives
 *   it back.
 * - Define(name, character, base) makes the models of a character ('character-<name>' and what it holds,
 *   'character-<name>-hold'), defined once: {Name, Label, Model, Hold, Size, File (the file of its model; '' for one of
 *   code)}.
 * - Load(url, callback(error, names)) reads a character ({Name, Model...}: its name the name of its file) or a catalogue
 *   ({Sets: {name: clips}, Characters: {name: character}}) and defines each; its files from the folder of url.
 * - Get(name) is what Define made, Names() the names of all in the order they came, Unit(name, more) what Scene.Add('unit',
 *   ...) takes ({Model, Hold, Size} over more), its models asked for.
 *
 * Regression: the characters of the demos, their clips and the grip of a rifle were written in a demo, each demo a copy.
 */
Elemenx.Service('SceneCharacters', {
	$Meta: {
		Description: 'The walkers of a game as data: a character a file of its own (its model, its bones, its clips or a set of them, what it holds), made a unit of a Scene.',
		Methods: ['Sets(name, clips)', 'Define(name, character, base)', 'Load(url, callback)', 'Get(name)', 'Names()', 'Unit(name, more)']
	},

	$OnCreate: function () {
		this.Kept = {};
		this.Order = [];
		this.Clips = {};
	},

	Sets: function (name, clips) {
		if (clips !== undefined)
			this.Clips[name] = clips;

		return this.Clips[name] || null;
	},

	/* A path of a file: as it is when absolute (/, a scheme), else from the folder given. */
	Path: function (path, base) {
		var given = String(path || '');
		if (!base || /^(\/|[a-z][a-z0-9+.-]*:)/i.test(given)) return given;

		return String(base).replace(/[^/]*$/, '') + given;
	},

	Define: function (name, character, base) {
		var models = this.$Service('SceneModels');
		var given = character || {};
		var model = String(given.Model || '');
		var file = /\.(glb|gltf|fbx|obj)(\?|$)/i.test(model);
		var clips = typeof given.Clips === 'string' ? this.Sets(given.Clips) : given.Clips;
		var hold = given.Hold || null;
		var made;

		if (!name || !model)
			throw new Error('Elemenx SceneCharacters: Define expects (name, {Model})');

		made = {Name: String(name), Label: given.Name || String(name), Model: file ? 'character-' + name : model, Hold: undefined, Size: Number(given.Size) || 1.8, File: file ? this.Path(model, base) : ''};

		/* Its model of a file, a unit of its clips of other files and its bones. */
		if (file && !models.Has(made.Model))
			models.Define(made.Model, Object.assign({URL: made.File, Type: 'unit'}, given.Bones ? {Bones: given.Bones} : {}, clips ? {Motions: this.Motions(clips, base)} : {}));

		/* What it holds: a model of a file of its own, or one named. */
		if (hold && hold.Model) {
			made.Hold = Object.assign({}, hold);

			if (/\.(glb|gltf|fbx|obj)(\?|$)/i.test(String(hold.Model))) {
				made.Hold.Model = made.Model + '-hold';

				if (!models.Has(made.Hold.Model))
					models.Define(made.Hold.Model, {URL: this.Path(hold.Model, base), Type: 'prop'});
			}
		}

		if (!this.Kept[made.Name])
			this.Order.push(made.Name);

		this.Kept[made.Name] = made;

		return made;
	},

	/* The clips of a set, their files from the folder given. */
	Motions: function (clips, base) {
		var self = this;
		var made = {};

		Object.keys(clips || {}).forEach(function (clip) {
			var one = clips[clip];

			made[clip] = typeof one === 'string' ? self.Path(one, base) : Object.assign({}, one, {URL: self.Path(one.URL, base)});
		});

		return made;
	},

	Load: function (url, callback) {
		var self = this;
		var request = new XMLHttpRequest();
		var done = callback || function () {};

		request.open('GET', url);

		request.onload = function () {
			var data;
			var names = [];

			if (request.status !== 200) {
				done(new Error('Elemenx SceneCharacters: ' + url + ' gave ' + request.status), null);

				return;
			}

			try {
				data = JSON.parse(request.responseText);

				/* A catalogue: its sets first, then its characters in their order; one character: named after its file. */
				if (data.Characters) {
					Object.keys(data.Sets || {}).forEach(function (name) {
						self.Sets(name, data.Sets[name]);
					});

					Object.keys(data.Characters).forEach(function (name) {
						self.Define(name, data.Characters[name], url);

						names.push(name);
					});
				}
				else {
					names.push(String(url).replace(/^.*\//, '').replace(/\.json(\?.*)?$/i, ''));

					self.Define(names[0], data, url);
				}
			}
			catch (error) {
				done(error, null);

				return;
			}

			done(null, names);
		};

		request.onerror = function () {
			done(new Error('Elemenx SceneCharacters: ' + url + ' could not be read'), null);
		};

		request.send();
	},

	Get: function (name) {
		return this.Kept[name] || null;
	},

	Names: function () {
		return this.Order.slice();
	},

	Unit: function (name, more) {
		var made = this.Get(name);
		if (!made)
			return null;

		this.$Service('SceneModels').Load(made.Model);

		if (made.Hold)
			this.$Service('SceneModels').Load(made.Hold.Model);

		return Object.assign({}, more || {}, {Model: made.Model, Hold: made.Hold, Size: (more && more.Size) || made.Size});
	}
});
