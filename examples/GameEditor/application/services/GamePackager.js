/*
 * The game of the editor as an Application of its own, to download. A game is {Name, Scene (a document of SceneEditor:
 * its Scene the recipe of GameScene.Save), Models ([{ID, Document}]: documents of ObjectEditor, each model under its ID)}.
 * - Data(game): what the game carries: {Name, Models: [{ID, Recipe}], Scene}.
 * - Code(game): the Component Game (its models defined in the Models Service before its scene is made, the scene loaded,
 *   the keys given to the object marked Hero) and the Application that mounts it on the body.
 * - Html(game, callback): one HTML file that runs alone, from the disk or any server: the bundles of the framework and of
 *   ElemenxUI (Bundles: bundles/elemenx.min.js and bundles/elemenx-ui.min.js, made by npm run dist) and the game, all
 *   inline. callback(error, text).
 * - Project(game): a project of Elemenx in a zip (the Archive Service): index.html, app.js, elemenx.config.js, the
 *   Component Game under application/, and each model as models/<ID>.glb for other tools. The bytes of the zip.
 * - Save(name, data, type): gives a file to the browser to save.
 */
Elemenx.Service('GamePackager', {
	Bundles: ['bundles/elemenx.min.js', 'bundles/elemenx-ui.min.js'],

	Fetch: function (url, callback) {
		var request = new XMLHttpRequest();

		request.open('GET', url, true);

		request.onload = function () {
			if (request.status >= 200 && request.status < 300 && !/^\s*<!DOCTYPE/i.test(request.responseText)) callback(null, request.responseText);
			else callback(new Error('The bundle is not there: ' + url + ' (npm run dist makes it)'));
		};

		request.onerror = function () {
			callback(new Error('The bundle did not load: ' + url));
		};

		request.send();
	},

	/* A text in an inline <script>: its closing tags and comments of HTML cannot end it. */
	Script: function (text) {
		return String(text).replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
	},

	Data: function (game) {
		return {
			Name: game.Name || 'Game',
			Models: (game.Models || []).map(function (model) {
				return {ID: model.ID, Recipe: model.Document.Recipe};
			}),
			Scene: game.Scene && game.Scene.Scene || null
		};
	},

	Code: function (game) {
		var data = this.Data(game);

		return [
			'/* The game made in the Game editor of Elemenx: its models, its scene, its hero under the keys. */',
			'Elemenx.Component(\'Game\', {',
			'\t$Template: \'<div class="game"><GameScene Labels="false" Details="false" (ready)="Ready" /></div>\',',
			'\tData: ' + JSON.stringify(data) + ',',
			'',
			'\t$OnCreate: function () {',
			'\t\tvar models = this.$Service(\'Models\');',
			'',
			'\t\tthis.Data.Models.forEach(function (model) {',
			'\t\t\tmodels.Define(model.ID, model.Recipe);',
			'\t\t});',
			'\t},',
			'',
			'\tReady: function (scene) {',
			'\t\tvar hero;',
			'',
			'\t\tif (this.Data.Scene)',
			'\t\t\tscene.Load(this.Data.Scene);',
			'',
			'\t\thero = scene.Objects(function (object) {',
			'\t\t\treturn !!object.Values.Hero;',
			'\t\t})[0];',
			'',
			'\t\tif (hero)',
			'\t\t\tscene.Control(hero.ID);',
			'\t}',
			'});'
		].join('\n');
	},

	App: function (game, files) {
		return 'Elemenx.Application(' + JSON.stringify(this.Name(game)) + ', {\n\t$Title: ' + JSON.stringify(game.Name || 'Game') + ',\n\t$Component: \'Game\',\n' + (files ? '\t$Root: \'application\',\n' : '') + '\t$Mount: \'body\',\n\t$Use: [\'ElemenxUI\']\n});';
	},

	/* The name of the Application: its words joined, as a name of code. */
	Name: function (game) {
		var name = String(game.Name || 'Game').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ').map(function (word) {
			return word.charAt(0).toUpperCase() + word.slice(1);
		}).join('');

		return /^[A-Za-z]/.test(name) ? name : 'Game' + name;
	},

	/* The page: the game fills the window. */
	Head: function (game) {
		return '\t<meta charset="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<title>' + String(game.Name || 'Game').replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</title>\n\n\t<style>\n\t\thtml,\n\t\tbody {\n\t\t\theight: 100%;\n\t\t\tmargin: 0;\n\t\t\tbackground: #000000;\n\t\t}\n\n\t\t.game {\n\t\t\tposition: fixed;\n\t\t\tinset: 0;\n\t\t}\n\n\t\t.game .elemenx-game-scene {\n\t\t\twidth: 100%;\n\t\t\theight: 100%;\n\t\t}\n\t</style>\n';
	},

	Html: function (game, callback) {
		var self = this;
		var texts = [];
		var remaining = this.Bundles.length;
		var failed = null;

		this.Bundles.forEach(function (url, index) {
			self.Fetch(url, function (error, text) {
				failed = failed || error;
				texts[index] = text;
				remaining--;

				if (remaining) return;

				if (failed) {
					callback(failed);

					return;
				}

				callback(null, '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + self.Head(game) + '\n' + texts.map(function (bundle) {
					return '\t<script>' + self.Script(bundle) + '</script>\n';
				}).join('') + '\t<script>\n' + self.Script(self.Code(game) + '\n\n' + self.App(game, false)) + '\n\t</script>\n</head>\n<body>\n</body>\n</html>\n');
			});
		});
	},

	Project: function (game) {
		var models = this.$Service('Models');
		var formats = this.$Service('ModelFormats');
		var files = {
			'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + this.Head(game) + '\n\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>\n</head>\n<body>\n</body>\n</html>\n',
			'app.js': this.App(game, true) + '\n',
			'elemenx.config.js': 'module.exports = {\n\tApplication: \'application\',\n\tEntry: \'app.js\',\n\tIndex: \'index.html\',\n\tOutput: \'dist\'\n};\n',
			'application/index.js': '[\n\t\'components\'\n];\n',
			'application/components/index.js': '[\n\t\'Game/Game.js\'\n];\n',
			'application/components/Game/Game.js': this.Code(game) + '\n'
		};

		/* Each model as a file of glTF too, for the tools of others. */
		this.Data(game).Models.forEach(function (model) {
			var name = 'game-packager-' + model.ID;

			models.Define(name, model.Recipe);

			files['models/' + model.ID + '.glb'] = formats.Write(formats.FromModel(models.Make(name)), 'glb');

			delete models.Recipes[name];
			delete models.Made[name + '~0'];
		});

		return this.$Service('Archive').Zip(files);
	},

	Save: function (name, data, type) {
		var url = URL.createObjectURL(new Blob([data], {type: type}));
		var link = document.createElement('a');

		link.href = url;
		link.download = name;

		document.body.appendChild(link);

		link.click();

		document.body.removeChild(link);

		window.setTimeout(function () {
			URL.revokeObjectURL(url);
		}, 1000);
	}
});
