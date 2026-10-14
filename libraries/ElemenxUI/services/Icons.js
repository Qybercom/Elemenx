/*
 * The icon sets of the page. The library sprite (index.svg) is the set without a name: <Icon Name="save" />. Another
 * set is named before the icon name: <Icon Name="weather:rain" />. The library sets 'brands', 'files', 'music' and
 * 'weather' are known already; Register(name, source) adds a set from a sprite file (a URL, relative to the page) or
 * from the markup of a sprite ('<svg>...</svg>'). A set is a sprite of <symbol id> elements; a symbol keeps its own fill and stroke
 * attributes, so a filled or a colored set draws as it is made.
 * A set loads once, when an icon first needs it (or by Load). Its symbols are copied into the hidden
 * <svg id="elemenx-icons"> of the page: elemenx-icon-<name> for the library sprite, elemenx-icon-<set>-<name> for a set.
 * Every Icon draws the shapes of its symbol itself (*glyph), so a set needs the same origin or CORS.
 * Override('save', 'brand:disk') makes every icon named save draw another symbol; Override('save') restores it.
 * Load(set, callback) calls back (error, names). Names(set) lists the names of a loaded set. Href(name) is the reference
 * an Icon draws. OnChange(callback) reports {Set} when a set loads and {Override: name} when an override changes.
 * The state is kept on the hidden <svg>, so every Application of the page shares the sets.
 */
Elemenx.Service('Icons', {
	Library: 'ElemenxUI',
	Builtin: {brands: 'icons/brands.svg', files: 'icons/files.svg', music: 'icons/music.svg', weather: 'icons/weather.svg'},
	Formats: [
		'js', 'jsx', 'ts', 'tsx', 'php', 'cpp', 'hpp', 'c', 'h', 'css', 'html', 'py', 'java', 'kt', 'cbl',
		'rs', 'go', 'exe', 'lib', 'a', 'o', 'dll', 'jpg', 'png', 'svg', 'webp', 'ico', 'gif', 'tiff', 'psd', 'ai', 'pdf',
		'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'json', 'jsonl', 'csv', 'xml', 'yaml', 'ini',
		'properties', 'htaccess', 'conf', 'lnk', 'dockerfile', 'zip', 'rar', 'ar', 'tar', 'tar-gz', 'jar', '3mf', 'mp3',
		'aac', 'ac3', 'mp4', 'webm', 'avi', 'rb', 'swift', 'scala', 'dart', 'lua', 'pl', 'r', 'sql', 'sh', 'bat', 'ps1',
		'cs', 'vb', 'fs', 'm', 'vue', 'svelte', 'scss', 'sass', 'less', 'erl', 'ex', 'hs', 'clj', 'zig', 'asm', 'wasm',
		'toml', 'env', 'lock', 'log', 'gradle', 'makefile', 'cmake', 'proto', 'graphql', 'editorconfig', 'gitignore', '7z',
		'bz2', 'xz', 'gz', 'apk', 'ipa', 'dmg', 'iso', 'deb', 'rpm', 'msi', 'bin', 'img', 'so', 'dylib', 'class', 'odt',
		'ods', 'odp', 'rtf', 'epub', 'pages', 'numbers', 'key', 'tex', 'ics', 'vcf', 'eml', 'jpeg', 'heic', 'avif', 'bmp',
		'raw', 'eps', 'fig', 'sketch', 'xd', 'blend', 'fbx', 'obj', 'stl', 'glb', 'gltf', 'ttf', 'otf', 'woff', 'woff2',
		'flac', 'wav', 'ogg', 'm4a', 'opus', 'mid', 'mkv', 'mov', 'wmv', 'flv', 'srt', 'vtt', 'tsv', 'parquet', 'db',
		'sqlite', 'ipynb', 'xlsm', 'xsd', 'pem', 'crt', 'p12', 'pub', 'ino'
	],
	Aliases: {
		tif: 'tiff', jpe: 'jpeg', midi: 'mid', pfx: 'p12', cer: 'crt', mjs: 'js', cjs: 'js', mts: 'ts', cts: 'ts',
		bash: 'sh', zsh: 'sh', cmd: 'bat', psm1: 'ps1', mm: 'm', exs: 'ex', hrl: 'erl', cljs: 'clj', s: 'asm',
		tgz: 'tar-gz', db3: 'sqlite', yml: 'yaml', htm: 'html', cc: 'cpp', cxx: 'cpp', hh: 'hpp', hxx: 'hpp',
		markdown: 'md', cob: 'cbl', cobol: 'cbl', kts: 'kt', cfg: 'conf', pde: 'ino'
	},

	$OnCreate: function () {
		var library = Elemenx.Library(this.Library);
		var root = String(library && library.$Root || '').replace(/\/$/, '');
		var name;

		this.Shared = this.Copy();

		if (!this.Shared) return;

		if (!this.Shared.Sets[''])
			this.Shared.Sets[''] = this.Entry('', root + '/index.svg', '');

		for (name in this.Builtin) {
			if (this.Builtin.hasOwnProperty(name) && !this.Shared.Sets[name])
				this.Shared.Sets[name] = this.Entry(name, root + '/' + this.Builtin[name], '');
		}
	},

	/*
	 * The hidden <svg id="elemenx-icons"> of the page with the shared state: Sets (name -> entry), Overrides
	 * (name -> name) and Listeners. Made once per page; null without a document.
	 */
	Copy: function () {
		var copy = typeof document !== 'undefined' ? document.getElementById('elemenx-icons') : null;
		if (copy && copy.ElemenxIcons) return copy.ElemenxIcons;

		if (!copy) {
			if (typeof document === 'undefined' || !document.body) return null;

			copy = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

			copy.setAttribute('id', 'elemenx-icons');
			copy.setAttribute('aria-hidden', 'true');
			copy.setAttribute('data-ready', 'false');
			copy.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');

			document.body.insertBefore(copy, document.body.firstChild);
		}

		copy.ElemenxIcons = {Element: copy, Sets: {}, Overrides: {}, Listeners: {}, Count: 0};

		return copy.ElemenxIcons;
	},

	Entry: function (name, url, markup) {
		return {Name: name, URL: url, Markup: markup, State: 'idle', Names: [], Callbacks: []};
	},

	/* Adds the set name from a sprite URL or the markup of a sprite. A set that is registered again is loaded again. */
	Register: function (name, source) {
		var markup;

		name = String(name || '');

		if (!name || /[:\s]/.test(name))
			throw new Error('Elemenx Icons set name must be a word: ' + name);

		if (!this.Shared) return name;

		this.Forget(name);

		markup = /^\s*</.test(String(source || '')) ? String(source) : '';

		this.Shared.Sets[name] = this.Entry(name, markup ? '' : String(source || ''), markup);

		if (markup)
			this.Load(name);

		return name;
	},

	/* Removes the symbols of a set from the page; its icons draw nothing until it is registered again. */
	Forget: function (name) {
		var set = this.Shared && this.Shared.Sets[name];
		var symbols;
		var i = 0;

		if (!set || name === '') return;

		symbols = this.Shared.Element.querySelectorAll('symbol[data-set="' + name + '"]');

		while (i < symbols.length) {
			symbols[i].parentNode.removeChild(symbols[i]);

			i++;
		}

		delete this.Shared.Sets[name];

		this.Changed({Set: name});
	},

	/* The set and the symbol name of an icon name: 'weather:rain' -> ['weather', 'rain'], after overrides. */
	Parse: function (name) {
		var value = String(name || '');
		var seen = 0;
		var index;

		while (this.Shared && this.Shared.Overrides.hasOwnProperty(value) && seen < 8) {
			value = this.Shared.Overrides[value];

			seen++;
		}

		index = value.indexOf(':');

		return index === -1 ? ['', value] : [value.substring(0, index), value.substring(index + 1)];
	},

	Set: function (name) {
		return this.Parse(name)[0];
	},

	Id: function (set, name) {
		return 'elemenx-icon-' + (set ? set + '-' : '') + name;
	},

	/*
	 * The reference an Icon draws for a name: the symbol of the page once its set is loaded ('#elemenx-icon-...'), the
	 * symbol of the file while it loads ('index.svg#add'), '' for an unknown set. Starts the load of the set.
	 */
	Href: function (name) {
		var parts = this.Parse(name);
		var set = this.Shared && this.Shared.Sets[parts[0]];
		if (!parts[1] || !set) return '';

		if (set.State === 'ready')
			return '#' + this.Id(parts[0], parts[1]);

		this.Load(parts[0]);

		if (set.State === 'ready')
			return '#' + this.Id(parts[0], parts[1]);

		return set.URL ? set.URL + '#' + parts[1] : '';
	},

	Ready: function (name) {
		var set = this.Shared && this.Shared.Sets[name || ''];

		return !!set && set.State === 'ready';
	},

	/* The names of a loaded set, in the order of the sprite; [] while it is not loaded. */
	Names: function (name) {
		var set = this.Shared && this.Shared.Sets[name || ''];

		return set ? set.Names.slice() : [];
	},

	/*
	 * The icon of a file name in the files set: 'report.pdf' -> 'files:pdf', 'archive.tar.gz' -> 'files:tar-gz',
	 * 'Dockerfile' -> 'files:dockerfile'; an unknown format -> 'file', the plain sheet. Formats lists the formats of the
	 * set, Aliases the other extensions of a format (yml -> yaml).
	 */
	File: function (name) {
		var file = String(name || '').toLowerCase().split(/[\\/]/).pop();
		var extension;

		if (file === 'dockerfile' || file.indexOf('dockerfile.') === 0) return 'files:dockerfile';
		if (file === 'makefile' || file === 'gnumakefile') return 'files:makefile';
		if (file === 'cmakelists.txt') return 'files:cmake';
		if (file === '.env' || file.indexOf('.env.') === 0) return 'files:env';
		if (file === '.htaccess' || file === '.gitignore' || file === '.editorconfig') return 'files:' + file.substring(1);
		if (/\.tar\.gz$/.test(file)) return 'files:tar-gz';
		if (/\.lock$/.test(file) || file === 'package-lock.json') return 'files:lock';

		extension = file.indexOf('.') === -1 ? '' : file.substring(file.lastIndexOf('.') + 1);
		extension = this.Aliases[extension] || extension;

		return this.Formats.indexOf(extension) === -1 ? 'file' : 'files:' + extension;
	},

	/* The names of the known sets: '' (the library sprite), 'brands', 'files', 'music', 'weather' and the registered ones. */
	Sets: function () {
		var list = [];
		var name;

		if (!this.Shared) return list;

		for (name in this.Shared.Sets) {
			if (this.Shared.Sets.hasOwnProperty(name))
				list.push(name);
		}

		return list;
	},

	/* Loads the set name once and calls back (error, names); a loaded set calls back at once. */
	Load: function (name, callback) {
		var self = this;
		var set = this.Shared && this.Shared.Sets[name || ''];

		if (!set) {
			if (callback)
				callback(new Error('Elemenx Icons set is not registered: ' + name));

			return;
		}

		if (set.State === 'ready') {
			if (callback)
				callback(null, set.Names.slice());

			return;
		}

		if (callback)
			set.Callbacks.push(callback);

		if (set.State === 'loading') return;

		set.State = 'loading';

		if (set.Markup) {
			this.Loaded(set, set.Markup);

			return;
		}

		if (typeof DOMParser === 'undefined') {
			this.Failed(set, new Error('Elemenx Icons cannot load a set here: ' + set.URL));

			return;
		}

		/* A bundle may carry the sprite (Elemenx.Resource); otherwise it is fetched. */
		Elemenx.Resource.Load(set.URL, function (error, markup) {
			if (self.Shared.Sets[set.Name] !== set) return;

			if (error) {
				self.Failed(set, new Error('Elemenx Icons set ' + (set.Name || 'icons') + ' failed to load: ' + set.URL));

				return;
			}

			self.Loaded(set, markup);
		});
	},

	Loaded: function (set, markup) {
		var source = new DOMParser().parseFromString(markup, 'image/svg+xml');
		var symbols = source.querySelectorAll('symbol[id]');
		var element = this.Shared.Element;
		var names = [];
		var symbol;
		var old;
		var i = 0;

		if (source.getElementsByTagName('parsererror').length) {
			this.Failed(set, new Error('Elemenx Icons set ' + (set.Name || 'icons') + ' is not valid SVG'));

			return;
		}

		while (i < symbols.length) {
			symbol = symbols[i];

			names.push(symbol.getAttribute('id'));

			old = document.getElementById(this.Id(set.Name, symbol.getAttribute('id')));

			if (old)
				old.parentNode.removeChild(old);

			symbol.setAttribute('id', this.Id(set.Name, symbol.getAttribute('id')));

			if (set.Name)
				symbol.setAttribute('data-set', set.Name);

			element.appendChild(document.importNode(symbol, true));

			i++;
		}

		set.Names = names;
		set.State = 'ready';

		if (!set.Name)
			element.setAttribute('data-ready', 'true');

		this.Settle(set, null);
		this.Changed({Set: set.Name});
	},

	Failed: function (set, error) {
		set.State = 'error';

		this.Settle(set, error);
	},

	Settle: function (set, error) {
		var callbacks = set.Callbacks;
		var i = 0;

		set.Callbacks = [];

		while (i < callbacks.length) {
			this.Notify(callbacks[i], error, error ? undefined : set.Names.slice());

			i++;
		}
	},

	/* Every icon named name draws target instead ('brand:disk', 'weather:sun'); without a target, its own symbol again. */
	Override: function (name, target) {
		if (!this.Shared) return;

		if (target) this.Shared.Overrides[name] = String(target);
		else delete this.Shared.Overrides[name];

		this.Changed({Override: name});
	},

	/* Listeners are kept by a key, so the thousands of icons of a long tree come and go at no cost. */
	OnChange: function (callback) {
		if (!this.Shared) return callback;

		callback.ElemenxIconsKey = 'listener-' + (++this.Shared.Count);

		this.Shared.Listeners[callback.ElemenxIconsKey] = callback;

		return callback;
	},

	OffChange: function (callback) {
		if (this.Shared && callback && callback.ElemenxIconsKey)
			delete this.Shared.Listeners[callback.ElemenxIconsKey];
	},

	Changed: function (state) {
		var listeners = [];
		var key;
		var i = 0;

		for (key in this.Shared.Listeners) {
			if (this.Shared.Listeners.hasOwnProperty(key))
				listeners.push(this.Shared.Listeners[key]);
		}

		while (i < listeners.length) {
			this.Notify(listeners[i], state);

			i++;
		}
	},

	/* Like a DOM listener: an exception is reported and the other listeners still run. */
	Notify: function (listener, first, second) {
		try {
			listener(first, second);
		}
		catch (error) {
			if (typeof window.reportError === 'function') {
				window.reportError(error);
			}
			else {
				window.setTimeout(function () {
					throw error;
				}, 0);
			}
		}
	}
});
