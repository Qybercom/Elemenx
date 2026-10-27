/*
 * The files of the project, kept in the storage of the browser: Names(), Read(name), Write(name, text), Tree() (the
 * items of a Tree: the folders and their files). A first project is there the first time.
 */
Elemenx.Service('Files', {
	$OnCreate: function () {
		this.Store = this.$Storage.Local.Namespace('studio');
		this.All = this.Store.Get('files') || {
			'src/app.js': 'Elemenx.Application(\'Hello\', {\n\t$Component: \'Greeting\',\n\t$Mount: \'body\'\n});\n',
			'src/Greeting.js': 'Elemenx.Component(\'Greeting\', {\n\t$Template: \'<h1>Hello, {{Name}}</h1>\',\n\tName: \'world\'\n});\n',
			'styles/site.css': 'body {\n\tmargin: 0;\n\tfont-family: system-ui, sans-serif;\n}\n',
			'README.md': '# Hello\n\nA project of the studio.\n'
		};
	},

	Names: function () {
		return Object.keys(this.All).sort();
	},

	Read: function (name) {
		return Object.prototype.hasOwnProperty.call(this.All, name) ? this.All[name] : '';
	},

	Write: function (name, text) {
		this.All[name] = text;

		this.Store.Set('files', this.All);
	},

	/* The language of the Syntax Service for a file, by its extension. */
	Language: function (name) {
		return {js: 'javascript', css: 'css', md: 'markdown', html: 'html', json: 'json'}[name.split('.').pop()] || 'text';
	},

	Tree: function () {
		var folders = {};
		var items = [];

		this.Names().forEach(function (name) {
			var parts = name.split('/');
			var item = {ID: name, Label: parts[parts.length - 1], Icon: 'file-code'};

			if (parts.length === 1) {
				items.push(item);

				return;
			}

			if (!folders[parts[0]]) {
				folders[parts[0]] = {ID: parts[0] + '/', Label: parts[0], Icon: 'folder', Items: []};

				items.unshift(folders[parts[0]]);
			}

			folders[parts[0]].Items.push(item);
		});

		return items;
	}
});
