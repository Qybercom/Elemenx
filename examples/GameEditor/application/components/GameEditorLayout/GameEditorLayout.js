/*
 * The Game editor: a game of a scene and its models. The tab Scene edits the scene (SceneEditor), the models of the game
 * in its palette to place; the tab Models edits them one by one (ModelEditor), each a model of the Models Service under
 * its ID. The game is kept in the browser after each change (Storage), exported and imported as JSON, and downloaded to
 * run: one HTML file, or a project of Elemenx in a zip (GamePackager).
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
	Views: [{ID: 'scene', Key: 'gameEditor.scene'}, {ID: 'models', Key: 'gameEditor.models'}, {ID: 'planet', Key: 'gameEditor.planet'}],

	$OnCreate: function () {
		var text = null;

		try {
			text = window.localStorage.getItem(this.Storage);
		}
		catch (error) {
			text = null;
		}

		this.Game = text ? this.Normalize(JSON.parse(text)) : this.Fresh('ground');
		this.Current = this.Game.Models.length ? this.Game.Models[0].ID : '';

		this.Define();
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

		return {Version: 1, Name: game.Name || 'Game', Scene: game.Scene, Models: (game.Models || []).filter(function (model) {
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

	Keep: function () {
		try {
			window.localStorage.setItem(this.Storage, JSON.stringify(this.Game));
		}
		catch (error) {
			this.Status = Elemenx.Locale.Text('gameEditor.notKept');
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

	Renamed: function (event) {
		this.Game.Name = event.target.value || 'Game';

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

		this.Game.Location = opened.ID;
		this.Game.Scene = {Version: 1, Name: opened.ID, Setting: 'ground', Scene: {Version: 1, Seed: '', Cosmos: '', Weather: 'clear', Time: 0, Travels: [], Removed: [], Overrides: {}, Added: [
			{ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {World: opened.Location.World}}, Parts: []},
			{ID: 'sun', Kind: 'sun', Values: {}, Traits: {Sun: {Time: 11, Latitude: Math.round(place.Latitude * 100) / 100}}, Parts: []}
		]}};
		this.View = 'scene';

		this.Keep();
	},

	SceneChanged: function (document) {
		this.Game.Scene = document;

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

	Imported: function (event) {
		var self = this;
		var file = event.target.files && event.target.files[0];
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

		event.target.value = '';
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

	DownloadProject: function () {
		var packager = this.$Service('GamePackager');

		packager.Save(this.File() + '.zip', packager.Project(this.Game), 'application/zip');
	}
});
