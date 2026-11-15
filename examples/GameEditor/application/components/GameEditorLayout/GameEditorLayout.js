/*
 * The Game editor: a game of a scene and its models. The tab Scene edits the scene (SceneEditor), the models of the game
 * in its palette to place; the tab Models edits them one by one (ModelEditor), each a model of the Models Service under
 * its ID; the tab Planet its planet (PlanetEditor), each location of it a scene of its own (Locations). The game is kept
 * in the browser by its parts after each change (PlanetData.Browser: the game, each model, each location; what changed
 * alone written), exported and imported as JSON, and downloaded to run: one HTML file, or a project of Elemenx in a zip
 * (GamePackager). Its world is downloaded as one file of the planet format (its planet baked whole, its edits, its
 * locations as its objects) and opened from one.
 */
Elemenx.Component('GameEditorLayout', {
	$TemplateURL: 'GameEditorLayout.html',
	$StyleURL: 'GameEditorLayout.css',

	Storage: 'elemenx-game-editor',
	View: 'scene',
	Game: null,
	Current: '',
	Version: 0,
	Status: '',
	/* The world baked and packed (DownloadWorld): no second one meanwhile. */
	Packing: false,
	Views: [{ID: 'scene', Key: 'gameEditor.scene'}, {ID: 'models', Key: 'gameEditor.models'}, {ID: 'planet', Key: 'gameEditor.planet'}],

	$OnCreate: function () {
		var text = null;

		try {
			text = window.localStorage.getItem(this.Storage);
		}
		catch (error) {
			text = null;
		}

		/* A game of the localStorage of before, till the one kept by parts comes (then kept so). */
		this.Game = text ? this.Normalize(JSON.parse(text)) : this.Fresh('ground');
		this.Current = this.Game.Models.length ? this.Game.Models[0].ID : '';
		this.Written = {};

		this.Define();
		this.Restore(!!text);
	},

	/* The store of the game in the browser: its parts in IndexedDB. */
	Store: function () {
		this.Kept = this.Kept || this.$Service('PlanetData').Browser(this.Storage);

		return this.Kept;
	},

	/* The parts of the game: itself (its name, scene, planet, which models and locations), each model, each location. */
	GameParts: function () {
		var game = this.Game;
		var parts = [{Part: {Kind: 'game'}, Value: {Version: 1, Name: game.Name, Scene: game.Scene, Location: game.Location || '', Planet: game.Planet || null, Models: game.Models.map(function (model) {
			return model.ID;
		}), Locations: Object.keys(game.Locations || {})}}];

		game.Models.forEach(function (model) {
			parts.push({Part: {Kind: 'model', ID: model.ID}, Value: model.Document});
		});

		Object.keys(game.Locations || {}).forEach(function (id) {
			parts.push({Part: {Kind: 'objects', ID: id}, Value: game.Locations[id]});
		});

		return parts;
	},

	/* The game kept by its parts, read back: none there yet, the one of before is written there (legacy: it had one). */
	Restore: function (legacy) {
		var self = this;
		var store = this.Store();

		function json (bytes) {
			return bytes ? JSON.parse(typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes)) : null;
		}

		store.Read({Kind: 'game'}, function (error, bytes) {
			var game;
			var left;

			if (error || !bytes) {
				if (legacy)
					self.Keep();

				return;
			}

			game = json(bytes);
			left = game.Models.length + game.Locations.length;
			game.Models = game.Models.map(function (id) {
				return {ID: id, Document: null};
			});
			game.Locations = game.Locations.reduce(function (all, id) {
				all[id] = null;

				return all;
			}, {});

			function done () {
				if (left--) return;

				self.Game = self.Normalize(game);
				self.Current = self.Game.Models.length ? self.Game.Models[0].ID : '';
				self.Written = {};

				self.GameParts().forEach(function (one) {
					self.Written[self.$Service('PlanetData').Key(one.Part)] = JSON.stringify(one.Value);
				});

				self.Define();

				self.Version++;
			}

			game.Models.forEach(function (model) {
				store.Read({Kind: 'model', ID: model.ID}, function (wrong, made) {
					model.Document = wrong ? null : json(made);

					done();
				});
			});

			Object.keys(game.Locations).forEach(function (id) {
				store.Read({Kind: 'objects', ID: id}, function (wrong, made) {
					game.Locations[id] = wrong ? null : json(made);

					done();
				});
			});

			done();
		});
	},

	/* A new game: a ground under a sun, or a star system, and one model to start from. */
	Fresh: function (setting) {
		return {Version: 1, Name: 'Game', Scene: {Version: 1, Name: '', Setting: setting, Scene: null}, Models: [this.Model('model-1')]};
	},

	Model: function (id) {
		return {ID: id, Document: {Version: 1, Name: id, Recipe: {Type: 'building', Size: 4, Variants: 1, Seed: id, Pieces: [], Parts: [{ID: 'block', Shape: 'box', Piece: 'body', At: [0, 0.25, 0], Size: [0.8, 0.5, 0.8], Color: '#9aa4b2'}]}}};
	},

	Normalize: function (game) {
		if (!game || game.Version > 1 || !game.Scene)
			throw new Error('Not a game of the Game editor');

		/* Its planet, the location open and the scenes of its locations kept too (Regression: a reload lost its planet). */
		var locations = {};

		Object.keys(game.Locations || {}).forEach(function (id) {
			if (game.Locations[id])
				locations[id] = game.Locations[id];
		});

		return {Version: 1, Name: game.Name || 'Game', Scene: game.Scene, Planet: game.Planet || null, Location: game.Location || '', Locations: locations, Models: (game.Models || []).filter(function (model) {
			return model && model.ID && model.Document && model.Document.Recipe;
		})};
	},

	/* Each model of the game in the Models Service under its ID, for the scene to place and to draw. */
	Define: function () {
		var models = this.$Service('SceneModels');

		this.Game.Models.forEach(function (model) {
			models.Define(model.ID, model.Document.Recipe);
		});
	},

	/* The parts of the game that changed written to its store, those gone taken away. */
	Keep: function () {
		var self = this;
		var data = this.$Service('PlanetData');
		var written = this.Written || (this.Written = {});
		var now = {};
		var store;

		function failed (error) {
			if (error)
				self.Status = Elemenx.Locale.Text('gameEditor.notKept');
		}

		try {
			store = this.Store();

			this.GameParts().forEach(function (one) {
				var key = data.Key(one.Part);
				var text = JSON.stringify(one.Value);

				now[key] = true;

				if (written[key] === text) return;

				written[key] = text;

				store.Write(one.Part, new TextEncoder().encode(text), failed);
			});

			Object.keys(written).forEach(function (key) {
				var at = key.indexOf(':');

				if (now[key]) return;

				delete written[key];

				if (store.Remove)
					store.Remove({Kind: key.slice(0, at), ID: key.slice(at + 1)}, failed);
			});
		}
		catch (error) {
			failed(error);
		}

		this.Version++;
	},

	Names: function () {
		return this.Game.Models.map(function (model) {
			return model.ID;
		});
	},

	Entry: function (id) {
		return this.Game.Models.filter(function (model) {
			return model.ID === id;
		})[0] || null;
	},

	Document: function () {
		var entry = this.Entry(this.Current);

		return entry ? entry.Document : null;
	},

	Show: function (view) {
		this.View = view;
	},

	/* Its views as tabs (Tabs). */
	ViewTabs: function () {
		return this.Views.map(function (view) {
			return {ID: view.ID, Label: Elemenx.Locale.Text(view.Key)};
		});
	},

	Renamed: function (value) {
		this.Game.Name = (value && value.target ? value.target.value : value) || 'Game';

		this.Keep();
	},

	/* The planet of the game (ScenePlanet options), drawn on its globe. */
	PlanetChanged: function (planet) {
		this.Game.Planet = planet;

		this.Keep();
	},

	/*
	 * A location of the planet opened (PlanetEditor): its scene in the editor, its ground the World of the planet there
	 * (SceneLocations), its sun at its latitude; the game keeps which location it is.
	 */
	LocationOpened: function (opened) {
		var place = opened.Location.Place;
		var locations = this.Game.Locations = this.Game.Locations || {};

		/* The scene of the location open kept; the one opened as it was left (Regression: its objects were lost). */
		if (this.Game.Location)
			locations[this.Game.Location] = this.Game.Scene;

		this.Game.Location = opened.ID;

		if (locations[opened.ID]) {
			this.Game.Scene = locations[opened.ID];
			this.View = 'scene';

			this.Keep();

			return;
		}

		this.Game.Scene = {Version: 1, Name: opened.ID, Setting: 'ground', Scene: {Version: 1, Seed: '', Cosmos: '', Weather: 'clear', Time: 0, Travels: [], Removed: [], Overrides: {}, Added: [
			{ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {World: opened.Location.World}}, Parts: []},
			{ID: 'sun', Kind: 'sun', Values: {}, Traits: {Sun: {Time: 11, Latitude: Math.round(place.Latitude * 100) / 100}}, Parts: []}
		]}};
		this.View = 'scene';

		this.Keep();
	},

	SceneChanged: function (document) {
		var self = this;

		this.Game.Scene = document;

		if (this.Game.Location)
			(this.Game.Locations = this.Game.Locations || {})[this.Game.Location] = document;

		this.Keep();

		/* A location of the planet edited: kept in the planet and baked into its globe, once the edits rest a little. */
		if (this.Game.Location && this.Game.Planet) {
			window.clearTimeout(this.Baking);

			this.Baking = window.setTimeout(function () {
				self.Located();
			}, 800);
		}
	},

	/* The World of the ground of the location open, told in the planet and baked into it (SceneLocations.Bake) when it changed. */
	Located: function () {
		var editor = this.$Ref('Scene', true);
		var scene = editor ? editor.Scene() : null;
		var inner = scene && scene.Scene ? scene.Scene() : null;
		var locations = this.$Service('SceneLocations');
		var id = this.Game.Location;
		var ground = inner ? inner.Roots.filter(function (object) {
			return object.Traits.Terrain && object.Traits.Terrain.World;
		})[0] : null;
		var world;

		if (!ground || !id || !this.Game.Planet) return;

		world = ground.Traits.Terrain.World;

		if (JSON.stringify(world) === JSON.stringify(locations.Location(this.Game.Planet, id).World)) return;

		this.Game.Planet = locations.Bake(locations.Tell(this.Game.Planet, id, {World: world}), id, 64);

		this.Keep();
	},

	/* A model changed: made again for the scene, which draws it anew where it stands. */
	ModelChanged: function (document) {
		var entry = this.Entry(this.Current);
		var scene = this.$Ref('Scene', true);

		if (!entry) return;

		entry.Document = document;

		this.$Service('SceneModels').Define(entry.ID, document.Recipe);

		if (scene && scene.Scene())
			this.Redraw(scene.Scene(), entry.ID);

		this.Keep();
	},

	/* The objects of a model in the scene take it again: their model was made anew under the same name. */
	Redraw: function (scene, id) {
		scene.Objects(function (object) {
			return object.Values.Model === id;
		}).forEach(function (object) {
			scene.Change(object.ID, {Model: id});
		});
	},

	AddModel: function () {
		var count = this.Game.Models.length + 1;
		var id = 'model-' + count;

		while (this.Entry(id))
			id = 'model-' + ++count;

		this.Game.Models.push(this.Model(id));

		this.Current = id;

		this.Define();
		this.Keep();
	},

	RemoveModel: function (id) {
		this.Game.Models = this.Game.Models.filter(function (model) {
			return model.ID !== id;
		});

		if (this.Current === id)
			this.Current = this.Game.Models.length ? this.Game.Models[0].ID : '';

		this.Keep();
	},

	PickModel: function (id) {
		this.Current = id;
	},

	Label: function (model) {
		return model.Document.Name || model.ID;
	},

	/* A new game in the place of this one, when the page is told so. */
	New: function (setting) {
		if (!window.confirm(Elemenx.Locale.Text('gameEditor.replace'))) return;

		this.Game = this.Fresh(setting);
		this.Current = this.Game.Models[0].ID;
		this.View = 'scene';

		this.Define();
		this.Keep();
	},

	NewGround: function () {
		this.New('ground');
	},

	NewSpace: function () {
		this.New('space');
	},

	/*
	 * A new game of the showcase world (SceneShowcase): every primitive of the generation, district by district. Its objects
	 * go into the scene of the editor as one change, and the game keeps the recipe the editor makes of them.
	 */
	NewShowcase: function () {
		var editor = this.$Ref('Scene', true);
		var world = this.$Service('SceneShowcase').World();
		var scene = editor ? editor.Scene() : null;
		if (!scene || !window.confirm(Elemenx.Locale.Text('gameEditor.replace'))) return;

		/* No seed of a scene: it would make a star system round the world (its ground has a seed of its own). */
		scene.Load({Version: 1, Seed: '', Time: 0, Travels: [], Added: [], Removed: [], Overrides: {}});
		scene.Add(world.Objects);

		if (world.Route.length)
			scene.SetViewpoint(world.Route[0]);

		this.Game = this.Fresh('ground');
		this.Game.Name = world.Name;
		this.Game.Scene = Object.assign(editor.Document(), {Name: world.Name});
		this.Current = this.Game.Models[0].ID;
		this.View = 'scene';

		this.Define();
		this.Keep();
	},

	/* The name of its files: its words joined by dashes. */
	File: function () {
		return String(this.Game.Name || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
	},

	Exported: function () {
		this.$Service('GamePackager').Save(this.File() + '.game.json', JSON.stringify(this.Game, null, 2), 'application/json');
	},

	/* The files a FileUpload told: the first is read. */
	Imported: function (files) {
		var self = this;
		var file = files && files.target ? files.target.files[0] : files && files[0];
		var reader;

		if (!file) return;

		reader = new FileReader();
		reader.onload = function () {
			try {
				self.Game = self.Normalize(JSON.parse(String(reader.result)));
				self.Current = self.Game.Models.length ? self.Game.Models[0].ID : '';
				self.Status = '';

				self.Define();
				self.Keep();
			}
			catch (error) {
				self.Status = self.$T('gameEditor.notGame');
			}
		};

		reader.readAsText(file);

		if (files && files.target)
			files.target.value = '';
	},

	DownloadPage: function () {
		var self = this;
		var packager = this.$Service('GamePackager');

		this.Status = Elemenx.Locale.Text('gameEditor.packing');

		packager.Html(this.Game, function (error, text) {
			self.Status = error ? error.message : '';

			if (!error)
				packager.Save(self.File() + '.html', text, 'text/html');
		});
	},

	/*
	 * Its world as one file of the planet format: its planet baked whole (heights, lands, climate, plates, rivers,
	 * settlements and highways), its edits, and the scene of each of its locations as its objects.
	 */
	DownloadWorld: function () {
		var self = this;
		var data = this.$Service('PlanetData');
		var locations = Object.assign({}, this.Game.Locations || {});

		if (this.Packing) return;

		if (this.Game.Location)
			locations[this.Game.Location] = this.Game.Scene;

		this.Packing = true;
		this.Status = Elemenx.Locale.Text('gameEditor.baking', {done: 0});

		/* The planet the tab Planet shows: the one of the game, or the first one till it was edited. */
		data.Bake(this.Game.Planet || {Seed: 'planet'}, {ID: this.File(), Name: this.Game.Name, Depth: 3, Size: 65, Biomes: 2, Vectors: true, Progress: function (done, total) {
			self.Status = Elemenx.Locale.Text('gameEditor.baking', {done: Math.round(done / total * 100)});
		}}, function (error, made) {
			if (error) {
				self.Packing = false;
				self.Status = error.message;

				return;
			}

			Object.keys(locations).forEach(function (id) {
				data.SetObjects(made, id, locations[id]);
			});

			data.Pack(made, function (failed, bytes) {
				self.Packing = false;
				self.Status = failed ? failed.message : '';

				if (!failed)
					self.$Service('GamePackager').Save(self.File() + '.planet', bytes, 'application/zip');
			});
		});
	},

	/* A world of one file of the planet format: its planet (the options it was made of, its edits) and its locations. */
	OpenedWorld: function (files) {
		var self = this;
		var file = files && files.target ? files.target.files[0] : files && files[0];
		if (!file) return;

		this.$Service('PlanetData').Open(file, function (error, made) {
			if (error || !made.Manifest.Origin || made.Manifest.Origin.Kind !== 'generated') {
				self.Status = self.$T('gameEditor.notWorld');

				return;
			}

			self.Game.Planet = Object.assign({}, made.Manifest.Origin.Options, made.Edits ? {Edits: made.Edits.Edits || [], Baked: made.Edits.Baked || {}} : {});
			self.Game.Locations = made.Objects || {};
			self.Game.Location = '';
			self.View = 'planet';
			self.Status = '';

			self.Keep();
		});

		if (files && files.target)
			files.target.value = '';
	},

	DownloadProject: function () {
		var packager = this.$Service('GamePackager');

		packager.Save(this.File() + '.zip', packager.Project(this.Game), 'application/zip');
	}
});
