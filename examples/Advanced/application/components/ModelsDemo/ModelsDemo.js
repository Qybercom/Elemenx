/*
 * ModelsDemo (Graphics): Scene · the Models Service: units, animals, plants, buildings of fantasy and sci-fi made of
 * code, with their clips, the shadows of the sun and the wind
 */
Elemenx.Component('ModelsDemo', {
	$TemplateURL: 'ModelsDemo.html',
	$Traits: ['SceneDemo'],
	ModelsList: [],
	/* The ground of the game: its scene kept for the buttons; trees where the ground is dry and gentle. */
	ModelsReady: function (scene) {
		var library = this.$Service('SceneModels');
		var rows = [['unit', -34], ['animal', -22], ['vehicle', -22], ['plant', -2], ['rock', -2], ['building', 26]];
		var list = [];
		var teams = ['red', 'blue', 'green'];
		var x = -80;
		var last = '';

		this.ModelsScene = function () {
			return scene;
		};

		rows.forEach(function (row) {
			if (row[1] !== last)
				x = -80;

			last = row[1];

			/*
			 * The models of the library itself: not those other demos of the page define in it (each building of the Showcase
			 * world, showcase-*), a row of them running far off the ground into the sea; nor the realistic plants a scene makes
			 * of its species (flora-*: a pine of the row is drawn as one in the realistic style anyway).
			 */
			library.Names({Type: row[0]}).filter(function (name) {
				return name.indexOf('showcase-') !== 0 && name.indexOf('flora-') !== 0;
			}).forEach(function (name, index) {
				/* At the edge of the ground (400 metres) the row goes on at its left end, free of models still. */
				var size = library.Info(name).Size;
				if (x + size * 1.4 + 6 > 185)
					x = -195;

				x += size * 0.7 + 3;

				list.push({ID: 'model-' + name, Kind: name, X: Math.round(x), Y: row[1], Team: teams[index % teams.length]});

				x += size * 0.7 + 3;
			});
		});

		this.ModelsList = list;

		scene.Scene().Wanted = 90;
		scene.Scene().Pitch = 0.55;

		this.ModelsFromFiles(scene);
	},
	/* The models kept out of git: shown when they are in data/models of this copy (a file nobody has only answers 404). */
	ModelsFromFiles: function (scene) {
		var self = this;

		[{ID: 'file-nyx', Name: 'nyx', File: 'nyx_common.glb', X: -84}, {ID: 'file-elf', Name: 'elf', File: 'rigged_elf_woman.glb', X: -76}].forEach(function (model) {
			var request = new XMLHttpRequest();
			var address = '/data/models/' + model.File;

			request.open('HEAD', address);

			request.onload = function () {
				if (request.status !== 200) return;

				scene.Add('unit', {ID: model.ID, Name: model.Name, Model: address, Size: 5, X: model.X, Y: -40});

				self.ModelsFiles = self.ModelsFiles.concat([model.ID]);
			};

			request.send();
		});
	},
	ModelsFiles: [],
	ModelsToFiles: function () {
		var scene = this.ModelsScene ? this.ModelsScene() : null;
		if (!scene) return;

		scene.FocusOn(this.ModelsFiles[0]);

		scene.ZoomTo(11);
	},
	ModelsShadowed: function (value) {
		this.ModelsShadows = value;
	},
	ModelsShadows: true,
	ModelsMarch: function () {
		var scene = this.ModelsScene ? this.ModelsScene() : null;
		if (!scene) return;

		this.ModelsNote = this.ModelsList.filter(function (model) {
			return scene.Get(model.ID).Traits.Walker && scene.Move(model.ID, [model.X, model.Y - 18]);
		}).length + ' marching';
	},
	ModelsNote: '',
	ModelsPlay: function (clip) {
		var scene = this.ModelsScene ? this.ModelsScene() : null;
		if (!scene) return;

		this.ModelsNote = this.ModelsList.filter(function (model) {
			return scene.Play(model.ID, clip);
		}).length + ' playing ' + clip;
	}
});
