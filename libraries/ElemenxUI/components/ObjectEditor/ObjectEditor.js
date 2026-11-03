/*
 * An editor of a model of the Models Service made of shapes, as a recipe of data (Models.Assemble): its parts in a tree by
 * the piece each belongs to (the pieces a rig moves by their names: body, head, arm-l...), the shapes to add (box, wedge,
 * cylinder, ball, blob, lathe), the model in a view with a gizmo, the fields of the selected part (its piece, its tags, its
 * place, size, turn and color, a mirror on the other side of X, the chance a variant has it and how much a variant varies
 * it) or, with none, of the model (Group, Type, Size, Speed, Variants, Rig, Smooth, Matte) and of the pieces (Parent,
 * Pivot, Team). Variant shows one variant of its seed (0: the parts as they are).
 * Value is its document {Version, Name, Recipe}; change emits it after each action, select {ID}.
 * The view: the right button turns round the model, the middle one moves it aside, the wheel comes nearer; a press selects
 * the part under it; W, E and R are the gizmo to move, turn (round the up axis) and scale, Q selects; F looks at the
 * selected part, Delete removes it, Ctrl+D copies it, Ctrl+Z and Ctrl+Y undo and redo. Snap keeps to steps of SnapMove,
 * SnapTurn degrees and SnapScale.
 * Save() keeps the document in localStorage under Storage (Restore() reads it back), Export() gives its JSON text and
 * Import(text) reads one; Model(format, variant) gives the model as a file of ModelFormats (glb, gltf, fbx, obj) and
 * Download(format) saves it; Define(name) gives the recipe to the Models Service under a name, for a game.
 * Generator (a function (description, callback (error, recipe))) is where a generator of models is plugged in, a neural
 * network or an algorithm: its field asks it for a recipe, which takes the place of the one edited (Undo brings it back).
 * Load(document), Document(), Recipe(), Select(id), Add(shape, props), Remove(id), Undo(), Redo(), Generate(description,
 * callback) and Scene() (the GameScene) are its methods.
 */
Elemenx.Component('ObjectEditor', {
	$TemplateURL: 'ObjectEditor.html',
	$StyleURL: 'ObjectEditor.css',
	$Meta: {
		Group: 'game',
		Icon: 'shapes',
		Description: 'An editor of a model made of shapes: parts in pieces with tags, mirrors and variants of a seed, a gizmo, the recipe of Models and its files glb, fbx and obj.',
		Events: {
			change: 'The document changed: {Version, Name, Recipe}.',
			select: 'The selected part changed: {ID}.'
		},
		Methods: ['Document()', 'Load(document)', 'Recipe()', 'Save()', 'Restore()', 'Export()', 'Import(text)', 'Model(format, variant)', 'Download(format)', 'Define(name)', 'Select(id)', 'Add(shape, props)', 'Remove(id)', 'Undo()', 'Redo()', 'Generate(description, callback)', 'Scene()'],
		Props: {
			Value: 'The document: {Version, Name, Recipe (a recipe of data of Models: Parts, Pieces, Group, Type, Size...)}.',
			Variant: 'The variant shown: 0, the parts as they are; the others varied by their seed.',
			Generator: 'A generator of models: function (description, callback (error, recipe)).',
			Storage: 'The key of localStorage Save keeps the document under.',
			SnapMove: 'The step of a move with Snap, in sizes of the model.',
			SnapTurn: 'The step of a turn with Snap, in degrees.',
			SnapScale: 'The step of a scale with Snap.',
			Label: 'What it shows, for screen readers.'
		}
	},
	Value: null,
	Variant: 0,
	Generator: null,
	Storage: 'elemenx-object-editor',
	SnapMove: 0.05,
	SnapTurn: 15,
	SnapScale: 0.05,
	Label: '',

	/* What the template renders. */
	Tool: 'move',
	Snap: true,
	Selected: '',
	Version: 0,
	Past: 0,
	Future: 0,
	Format: 'glb',
	Description: '',
	Busy: false,
	Tools: [
		{ID: 'select', Icon: 'pointer', Key: 'ui.objectEditor.select', Hotkey: 'Q'},
		{ID: 'move', Icon: 'hand', Key: 'ui.objectEditor.move', Hotkey: 'W'},
		{ID: 'turn', Icon: 'refresh', Key: 'ui.objectEditor.turn', Hotkey: 'E'},
		{ID: 'scale', Icon: 'maximize', Key: 'ui.objectEditor.scale', Hotkey: 'R'}
	],
	Shapes: ['box', 'wedge', 'cylinder', 'ball', 'blob', 'lathe'],
	Formats: ['glb', 'gltf', 'fbx', 'obj'],
	Rigs: ['', 'Biped', 'Quadruped', 'Tracked'],

	/* How large the model stands in the view, in metres: it is about 1 tall in its own units. */
	Shown: 2,

	$OnCreate: function () {
		var own = {Scene: null, Document: null, Past: [], Future: [], Drag: null, Frame: 0, Dirty: true, Copies: 0, Built: 0, Name: '', Key: 'object-editor-' + Math.random().toString(36).slice(2, 8)};

		this.Own = function () {
			return own;
		};

		own.Document = this.Normalize(this.Value);
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Frame)
			window.cancelAnimationFrame(own.Frame);

		if (own.Name)
			this.Forget(own.Name);
	},

	$OnProps: function (changed) {
		var own = this.Own();

		/* A document without a Seed of its own keeps the one it has: it is the same document, not another every time. */
		if ('Value' in changed && this.Value) {
			var next = this.Normalize(this.Value);
			var given = typeof this.Value === 'string' ? JSON.parse(this.Value) : this.Value;
			if (!(given.Recipe && given.Recipe.Seed))
				next.Recipe.Seed = own.Document.Recipe.Seed;

			if (JSON.stringify(next) !== JSON.stringify(own.Document))
				this.Load(next);
		}

		if ('Variant' in changed)
			own.Dirty = true;
	},

	/* A document whole: a recipe with its parts and pieces; a new one is a block on the ground. */
	Normalize: function (value) {
		var document = value ? typeof value === 'string' ? JSON.parse(value) : JSON.parse(JSON.stringify(value)) : {};
		var recipe = document.Recipe || {Parts: [{ID: 'block', Shape: 'box', Piece: 'body', At: [0, 0.25, 0], Size: [0.8, 0.5, 0.8], Color: '#9aa4b2'}]};

		if (document.Version > 1)
			throw new Error('Elemenx ObjectEditor: a document of version ' + document.Version + ' is newer than 1');

		recipe.Parts = recipe.Parts || [];
		recipe.Pieces = recipe.Pieces || [];
		recipe.Size = recipe.Size || 1;
		recipe.Variants = recipe.Variants || 1;

		/* The seed of its variants, kept in the recipe: the variants it shows are the ones of a game that defines it. */
		recipe.Seed = recipe.Seed || Math.random().toString(36).slice(2, 10);

		return {Version: 1, Name: document.Name || '', Recipe: recipe};
	},

	Scene: function () {
		return this.Own().Scene;
	},

	Document: function () {
		return JSON.parse(JSON.stringify(this.Own().Document));
	},

	Recipe: function () {
		return JSON.parse(JSON.stringify(this.Own().Document.Recipe));
	},

	Load: function (document) {
		var own = this.Own();

		own.Document = this.Normalize(document);
		own.Dirty = true;

		this.Select('');

		this.Version++;
	},

	/* The scene is ready: a floor, a sun, the model on it, and the gizmo follows the view each frame. */
	SceneReady: function (scene) {
		var own = this.Own();
		var self = this;

		own.Scene = scene;

		scene.Add('ground', {ID: 'floor', Size: 60, Height: 0.01, Water: 0, Ridges: 0, Scale: 300, Seed: 'object'});
		scene.Add('sun', {ID: 'sun', Time: 10, Latitude: 40});
		scene.SetViewpoint({Target: [0, this.Shown / 2, 0], Yaw: 0.6, Pitch: 0.35, Distance: this.Shown * 2.6});

		function follow () {
			own.Frame = window.requestAnimationFrame(follow);

			self.Show();
			self.Gizmo();
		}

		if (!own.Frame)
			follow();

		this.Version++;
	},

	/* The model shown made again after a change, once a frame at most: a name of its own each time, the one before let go. */
	Show: function () {
		var own = this.Own();
		var models = this.$Service('Models');
		var recipe = own.Document.Recipe;
		var variant = Math.max(0, Math.floor(Number(this.Variant) || 0));
		var name;

		if (!own.Dirty || !own.Scene) return;

		own.Dirty = false;
		own.Built++;
		name = own.Key + '-' + own.Built;

		models.Define(name, {Group: recipe.Group || '', Type: recipe.Type || '', Size: 1, Smooth: !!recipe.Smooth, Matte: recipe.Matte !== false, Build: function (tools) {
			return models.Assemble(recipe, tools, models.Random(String(recipe.Seed) + ':' + variant), variant);
		}});

		if (own.Scene.Get('model')) own.Scene.Change('model', {Model: name});
		else own.Scene.Add('thing', {ID: 'model', X: 0, Y: 0, Model: name, Size: this.Shown});

		if (own.Name)
			this.Forget(own.Name);

		own.Name = name;
	},

	/* A model it made let go of: its recipe and what Models made of it. */
	Forget: function (name) {
		var models = this.$Service('Models');

		delete models.Recipes[name];

		Object.keys(models.Made).forEach(function (key) {
			if (key.split('~')[0] === name)
				delete models.Made[key];
		});
	},

	/* After an action: the recipe before it kept for Undo, the model made again, the document emitted. */
	Changed: function (before) {
		var own = this.Own();

		if (before) {
			own.Past.push(before);

			own.Future = [];

			if (own.Past.length > 100)
				own.Past.shift();
		}

		this.Past = own.Past.length;
		this.Future = own.Future.length;
		own.Dirty = true;

		this.Version++;

		this.Fields();
		this.$Emit('change', this.Document());
	},

	Kept: function () {
		return JSON.stringify(this.Own().Document.Recipe);
	},

	Undo: function () {
		var own = this.Own();
		if (!own.Past.length) return;

		own.Future.push(this.Kept());

		own.Document.Recipe = JSON.parse(own.Past.pop());

		this.Changed(null);
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length) return;

		own.Past.push(this.Kept());

		own.Document.Recipe = JSON.parse(own.Future.pop());

		this.Changed(null);
	},

	Save: function () {
		try {
			window.localStorage.setItem(this.Storage, this.Export());

			return true;
		}
		catch (error) {
			return false;
		}
	},

	Restore: function () {
		var text;

		try {
			text = window.localStorage.getItem(this.Storage);
		}
		catch (error) {
			text = null;
		}

		if (!text)
			return false;

		this.Import(text);

		return true;
	},

	Export: function () {
		return JSON.stringify(this.Own().Document, null, 2);
	},

	Import: function (text) {
		var before = this.Kept();

		this.Load(text);
		this.Changed(before);
	},

	Store: function () {
		this.Save();
	},

	/* Saves a file: a Blob of its data, by a link. */
	Saved: function (data, name, type) {
		var link = document.createElement('a');

		link.href = URL.createObjectURL(new Blob([data], {type: type}));
		link.download = name;

		link.click();

		window.setTimeout(function () {
			URL.revokeObjectURL(link.href);
		}, 1000);
	},

	Exported: function () {
		this.Saved(this.Export(), (this.Own().Document.Name || 'model') + '.json', 'application/json');
	},

	Imported: function (event) {
		var self = this;
		var file = event.target.files && event.target.files[0];
		var reader;

		if (!file) return;

		reader = new FileReader();
		reader.onload = function () {
			self.Import(String(reader.result));
		};

		reader.readAsText(file);

		event.target.value = '';
	},

	/* Gives the recipe to the Models Service under a name: a model of a game, its variants by their seed. */
	Define: function (name) {
		var recipe = this.Recipe();

		this.$Service('Models').Define(name, recipe);

		return name;
	},

	/* The model as a file of ModelFormats: glb and fbx an ArrayBuffer, gltf and obj a text; of a variant (Variant by default). */
	Model: function (format, variant) {
		var models = this.$Service('Models');
		var formats = this.$Service('ModelFormats');
		var name = this.Own().Key + '-export';
		var made;

		this.Define(name);

		made = models.Make(name, {Variant: variant === undefined ? Number(this.Variant) || 0 : variant});

		this.Forget(name);

		return formats.Write(formats.FromModel(made), format || 'glb');
	},

	Download: function (format) {
		var kind = format || this.Format;
		var data = this.Model(kind);

		this.Saved(data, (this.Own().Document.Name || 'model') + '.' + kind, typeof data === 'string' ? 'text/plain' : 'application/octet-stream');
	},

	FormatPicked: function (event) {
		this.Format = event.target.value;
	},

	DownloadPressed: function () {
		this.Download(this.Format);
	},

	VariantPicked: function (event) {
		this.Variant = Math.max(0, Math.floor(Number(event.target.value) || 0));
		this.Own().Dirty = true;
	},

	/* The generator plugged in: a recipe of a description, in the place of the one edited. */
	Generate: function (description, callback) {
		var self = this;
		var done = callback || function () {};

		if (typeof this.Generator !== 'function') {
			done(new Error('Elemenx ObjectEditor: no Generator'));

			return;
		}

		this.Busy = true;

		this.Generator(description, function (error, recipe) {
			var before;

			self.Busy = false;

			if (error || !recipe) {
				done(error || new Error('Elemenx ObjectEditor: the Generator gave no recipe'));

				return;
			}

			before = self.Kept();
			self.Own().Document.Recipe = self.Normalize({Recipe: recipe}).Recipe;

			self.Select('');
			self.Changed(before);

			done(null, self.Recipe());
		});
	},

	Described: function (event) {
		this.Description = event.target.value;
	},

	GeneratePressed: function () {
		this.Generate(this.Description);
	},

	/* The parts */

	Part: function (id) {
		return this.Own().Document.Recipe.Parts.filter(function (part) {
			return part.ID === id;
		})[0] || null;
	},

	/* The tree: a node for each piece, its parts in it. */
	Items: function () {
		var parts = this.Own().Document.Recipe.Parts;
		var pieces = [];

		parts.forEach(function (part) {
			var id = part.Piece || 'body';
			if (pieces.indexOf(id) === -1)
				pieces.push(id);
		});

		return pieces.map(function (id) {
			return {ID: 'piece:' + id, Label: id, Icon: 'layers', Items: parts.filter(function (part) {
				return (part.Piece || 'body') === id;
			}).map(function (part) {
				return {ID: part.ID, Label: part.ID + ' · ' + part.Shape + (part.Mirror ? ' ⇄' : ''), Icon: 'square'};
			})};
		});
	},

	Opened: function () {
		return this.Items().map(function (item) {
			return item.ID;
		});
	},

	Chosen: function (item) {
		this.Select(item && item.ID && item.ID.indexOf('piece:') !== 0 ? item.ID : '');
	},

	Select: function (id) {
		this.Selected = id && this.Part(id) ? id : '';

		this.Fields();

		this.Version++;

		this.$Emit('select', {ID: this.Selected});
	},

	/* A new part of a shape in the middle of the model, or over the selected one, selected. */
	Add: function (shape, props) {
		var own = this.Own();
		var before = this.Kept();
		var under = this.Part(this.Selected);
		var given = Object.assign({}, props || {});
		var id;

		own.Copies++;
		id = given.ID || shape + '-' + own.Copies;

		while (this.Part(id))
			id = shape + '-' + ++own.Copies;

		own.Document.Recipe.Parts.push(Object.assign({ID: id, Shape: shape, Piece: under ? under.Piece || 'body' : 'body', At: under ? [under.At[0], under.At[1] + (under.Size ? under.Size[1] : 0.5) / 2 + 0.15, under.At[2]] : [0, 0.5, 0], Size: [0.3, 0.3, 0.3], Turn: [0, 0, 0], Color: '#b9c2cf'}, given, {ID: id}));

		this.Changed(before);
		this.Select(id);

		return id;
	},

	Placed: function (shape) {
		this.Add(shape);
	},

	Remove: function (id) {
		var own = this.Own();
		var before = this.Kept();

		own.Document.Recipe.Parts = own.Document.Recipe.Parts.filter(function (part) {
			return part.ID !== id;
		});

		if (this.Selected === id)
			this.Selected = '';

		this.Changed(before);
		this.Select(this.Selected);
	},

	/* Changes of a part, kept for Undo once per action (a drag is one). */
	Change: function (id, changes, before) {
		var part = this.Part(id);
		var kept = before === undefined ? this.Kept() : before;

		if (!part) return;

		Object.keys(changes).forEach(function (key) {
			if (changes[key] === undefined || changes[key] === '') delete part[key];
			else part[key] = changes[key];
		});

		this.Own().Dirty = true;

		if (before !== false)
			this.Changed(kept);
	},

	/* Changes of the model, or of a piece of it. */
	Tune: function (changes, piece) {
		var recipe = this.Own().Document.Recipe;
		var before = this.Kept();
		var target;

		if (piece) {
			target = recipe.Pieces.filter(function (one) {
				return one.ID === piece;
			})[0];

			if (!target) {
				target = {ID: piece};

				recipe.Pieces.push(target);
			}
		}
		else {
			target = recipe;
		}

		Object.keys(changes).forEach(function (key) {
			if (changes[key] === undefined || changes[key] === '') delete target[key];
			else target[key] = changes[key];
		});

		this.Changed(before);
	},

	Step: function (value, step) {
		return this.Snap && step > 0 ? Math.round(value / step) * step : Math.round(value * 1000) / 1000;
	},

	Pick: function (tool) {
		this.Tool = tool;
	},

	Snapped: function (event) {
		this.Snap = !!event.target.checked;
	},

	/* The fields of the selected part, else of the model; and of the piece of the part. */
	Fields: function () {
		var self = this;
		var holder = this.$Ref('Fields');
		var part = this.Part(this.Selected);
		var recipe = this.Own().Document.Recipe;
		var vary;
		var piece;
		var fields;

		if (!holder) return;

		holder.textContent = '';

		if (part) {
			vary = part.Vary || {};
			piece = recipe.Pieces.filter(function (one) {
				return one.ID === (part.Piece || 'body');
			})[0] || {};
			fields = [
				['ID', part.ID, 'text'], ['Shape', part.Shape, self.Shapes], ['Piece', part.Piece || 'body', 'text'], ['Tags', (part.Tags || []).join(', '), 'list'],
				['At', part.At, 'vector'], ['Size', part.Size, 'vector'], ['Turn', part.Turn, 'vector'], ['Color', part.Color || '#c8c8c8', 'color'],
				['Mirror', !!part.Mirror, 'check'], ['Chance', part.Chance === undefined ? '' : part.Chance, 'number'],
				['Vary.At', vary.At, 'vector'], ['Vary.Size', vary.Size, 'vector'], ['Vary.Turn', vary.Turn, 'vector'], ['Vary.Color', vary.Color === undefined ? '' : vary.Color, 'number']
			];

			if (part.Shape === 'cylinder')
				fields.push(['Top', part.Top === undefined ? 1 : part.Top, 'number'], ['Segments', part.Segments || 12, 'number']);

			if (part.Shape === 'blob')
				fields.push(['Rough', part.Rough === undefined ? 0.6 : part.Rough, 'number']);

			if (part.Shape === 'lathe')
				fields.push(['Points', JSON.stringify(part.Points || [[0, 0], [0.5, 0], [0.5, 1], [0, 1]]), 'json'], ['Segments', part.Segments || 12, 'number']);

			fields.push(['Piece.Parent', piece.Parent || '', 'text'], ['Piece.Pivot', piece.Pivot, 'vector'], ['Piece.Team', !!piece.Team, 'check']);
		}
		else {
			fields = [['Name', this.Own().Document.Name, 'text'], ['Group', recipe.Group || '', 'text'], ['Type', recipe.Type || '', 'text'], ['Size', recipe.Size, 'number'], ['Speed', recipe.Speed || 0, 'number'], ['Variants', recipe.Variants, 'number'], ['Rig', recipe.Rig || '', self.Rigs], ['Smooth', !!recipe.Smooth, 'check'], ['Matte', recipe.Matte !== false, 'check']];
		}

		fields.forEach(function (field) {
			var label = document.createElement('label');
			var name = document.createElement('span');
			var input = document.createElement(Array.isArray(field[2]) ? 'select' : 'input');

			label.className = 'elemenx-object-editor-field';
			name.textContent = field[0];

			if (Array.isArray(field[2])) {
				field[2].forEach(function (option) {
					var made = document.createElement('option');

					made.value = option;
					made.textContent = option || '—';
					made.selected = option === field[1];

					input.appendChild(made);
				});
			}
			else if (field[2] === 'check') {
				input.type = 'checkbox';
				input.checked = !!field[1];
			}
			else if (field[2] === 'color') {
				input.type = 'color';
				input.value = field[1];
			}
			else {
				input.value = field[2] === 'vector' ? (field[1] || []).join(', ') : field[1] === undefined || field[1] === null ? '' : String(field[1]);
			}

			input.setAttribute('data-field', field[0]);

			input.addEventListener('change', function () {
				self.Edited(field, input);
			});

			label.appendChild(name);
			label.appendChild(input);
			holder.appendChild(label);
		});
	},

	/* A field changed: a number, a list of three, a list of words, JSON or a text; of the part, its piece or the model. */
	Edited: function (field, input) {
		var key = field[0];
		var text = input.value;
		var part = this.Part(this.Selected);
		var changes = {};
		var value;
		var vary;

		if (field[2] === 'check') value = input.checked;
		else if (field[2] === 'number') value = text === '' ? undefined : Number(text) || 0;
		else if (field[2] === 'vector') value = text.trim() === '' ? undefined : [0, 1, 2].map(function (i) {
			return Number(text.split(',')[i]) || 0;
		});
		else if (field[2] === 'list') value = text.split(',').map(function (one) {
			return one.trim();
		}).filter(Boolean);
		else if (field[2] === 'json') value = JSON.parse(text);
		else value = text;

		if (!part && key === 'Name') {
			this.Own().Document.Name = value;

			this.Changed(null);

			return;
		}

		if (!part) {
			changes[key] = value;

			this.Tune(changes);

			return;
		}

		if (key.indexOf('Piece.') === 0) {
			changes[key.slice(6)] = value;

			this.Tune(changes, part.Piece || 'body');

			return;
		}

		if (key.indexOf('Vary.') === 0) {
			vary = Object.assign({}, part.Vary || {});

			if (value === undefined) delete vary[key.slice(5)];
			else vary[key.slice(5)] = value;

			this.Change(this.Selected, {Vary: Object.keys(vary).length ? vary : undefined});

			return;
		}

		/* A part renamed keeps its selection. */
		if (key === 'ID') {
			if (!value || this.Part(value)) {
				this.Fields();

				return;
			}

			this.Change(this.Selected, {ID: value});
			this.Select(value);

			return;
		}

		changes[key] = value;

		this.Change(this.Selected, changes);
	},

	/* The view */

	Down: function (event) {
		var own = this.Own();
		var scene = own.Scene;
		var handle;
		var part;

		if (!scene) return;

		event.currentTarget.focus({preventScroll: true});

		handle = event.target.getAttribute && event.target.getAttribute('data-handle');
		part = this.Part(this.Selected);

		if (event.currentTarget.setPointerCapture)
			event.currentTarget.setPointerCapture(event.pointerId);

		event.preventDefault();

		if (event.button === 2 || event.button === 0 && event.altKey) {
			own.Drag = {Kind: 'orbit', X: event.clientX, Y: event.clientY, View: scene.Viewpoint()};

			return;
		}

		if (event.button === 1) {
			own.Drag = {Kind: 'pan', X: event.clientX, Y: event.clientY, View: scene.Viewpoint()};

			return;
		}

		if (handle && part) {
			own.Drag = {Kind: handle, X: event.clientX, Y: event.clientY, Before: this.Kept(), Part: JSON.parse(JSON.stringify(part)), Center: this.World(part.At), Moved: false};

			return;
		}

		own.Drag = {Kind: 'press', X: event.clientX, Y: event.clientY};
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var scene = own.Scene;
		var dx;
		var dy;
		var axes;
		var step;

		if (!drag || !scene) return;

		dx = event.clientX - drag.X;
		dy = event.clientY - drag.Y;

		if (drag.Kind === 'orbit') {
			scene.SetViewpoint({Target: drag.View.Target, Yaw: drag.View.Yaw - dx * 0.006, Pitch: drag.View.Pitch + dy * 0.006, Distance: drag.View.Distance});

			return;
		}

		if (drag.Kind === 'pan') {
			axes = [Math.cos(drag.View.Yaw), -Math.sin(drag.View.Yaw)];
			step = drag.View.Distance * 0.0015;

			scene.SetViewpoint({Target: [drag.View.Target[0] - axes[0] * dx * step, drag.View.Target[1] + dy * step, drag.View.Target[2] - axes[1] * dx * step], Yaw: drag.View.Yaw, Pitch: drag.View.Pitch, Distance: drag.View.Distance});

			return;
		}

		if (drag.Kind === 'press') return;

		drag.Moved = true;

		this.Handle(drag, event);
	},

	Up: function (event) {
		var own = this.Own();
		var drag = own.Drag;

		own.Drag = null;

		if (!drag || !own.Scene) return;

		/* A press that did not move selects the part under it, or nothing. */
		if (drag.Kind === 'press' && Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) < 4) {
			this.Select(this.PartAt(event.clientX, event.clientY));

			return;
		}

		if (drag.Before && drag.Moved)
			this.Changed(drag.Before);
	},

	Menu: function (event) {
		event.preventDefault();
	},

	Wheeled: function (event) {
		var scene = this.Own().Scene;
		var view;

		if (!scene) return;

		event.preventDefault();

		view = scene.Viewpoint();

		scene.SetViewpoint({Target: view.Target, Yaw: view.Yaw, Pitch: view.Pitch, Distance: Math.max(0.3, view.Distance * (event.deltaY > 0 ? 1.15 : 1 / 1.15))});
	},

	Key: function (event) {
		var part = this.Part(this.Selected);
		var tools = {KeyQ: 'select', KeyW: 'move', KeyE: 'turn', KeyR: 'scale'};
		var copy;

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ') {
			event.preventDefault();

			if (event.shiftKey) this.Redo();
			else this.Undo();

			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyY') {
			event.preventDefault();

			this.Redo();

			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyD' && part) {
			event.preventDefault();

			copy = JSON.parse(JSON.stringify(part));
			copy.ID = undefined;
			copy.At = [copy.At[0] + 0.1, copy.At[1], copy.At[2]];

			this.Add(part.Shape, copy);

			return;
		}

		if (tools[event.code] && !event.ctrlKey && !event.metaKey) {
			this.Pick(tools[event.code]);

			return;
		}

		if (event.code === 'Delete' && part) {
			this.Remove(part.ID);

			return;
		}

		if (event.code === 'KeyF' && part)
			this.Own().Scene.SetViewpoint({Target: this.World(part.At), Yaw: this.Own().Scene.Viewpoint().Yaw, Pitch: this.Own().Scene.Viewpoint().Pitch, Distance: Math.max(1, Math.max.apply(null, part.Size || [1]) * this.Shown * 4)});
	},

	/* A point of the model in the world: the model stands at the middle of the floor, Shown metres tall. */
	World: function (at) {
		var scene = this.Own().Scene;
		var model = scene ? scene.Get('model') : null;
		var base = model && model.World ? model.World : [0, 0, 0];

		return [base[0] + at[0] * this.Shown, base[1] + at[1] * this.Shown, base[2] + at[2] * this.Shown];
	},

	/* The part under a point of the page: the nearest whose ball (half its largest side) the ray of the view meets. */
	PartAt: function (clientX, clientY) {
		var self = this;
		var ray = this.Own().Scene.Ray(clientX, clientY);
		var best = '';
		var nearest = Infinity;

		this.Own().Document.Recipe.Parts.forEach(function (part) {
			var sides = [part.At].concat(part.Mirror ? [[-part.At[0], part.At[1], part.At[2]]] : []);

			sides.forEach(function (at) {
				var center = self.World(at);
				var radius = Math.max.apply(null, part.Size || [1]) * self.Shown / 2;
				var to = [center[0] - ray.Origin[0], center[1] - ray.Origin[1], center[2] - ray.Origin[2]];
				var along = to[0] * ray.Direction[0] + to[1] * ray.Direction[1] + to[2] * ray.Direction[2];
				var off = to[0] * to[0] + to[1] * to[1] + to[2] * to[2] - along * along;

				if (along > 0 && off <= radius * radius && along < nearest) {
					nearest = along;
					best = part.ID;
				}
			});
		});

		return best;
	},

	/* The gizmo of the selected part */

	Reach: function (center) {
		var eye = this.Own().Scene.Viewpoint().Eye;

		return Math.max(0.05, Math.hypot(center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]) * 0.12);
	},

	Gizmo: function () {
		var svg = this.$Ref('Gizmo');
		var view = this.$Ref('View');
		var scene = this.Own().Scene;
		var part = this.Part(this.Selected);
		var parts = [];
		var box;
		var center;
		var middle;
		var reach;
		var self = this;

		if (!svg || !scene) return;

		if (!part || this.Tool === 'select') {
			if (svg.childNodes.length)
				svg.textContent = '';

			return;
		}

		box = view.getBoundingClientRect();

		function at (point) {
			var spot = scene.Project(point);

			return {X: spot.X - box.left, Y: spot.Y - box.top, Visible: spot.Visible};
		}

		middle = this.World(part.At);
		center = at(middle);
		reach = this.Reach(middle);

		if (!center.Visible) {
			svg.textContent = '';

			return;
		}

		if (this.Tool === 'turn') {
			var ring = [];
			var i;

			for (i = 0; i <= 48; i++) {
				var p = at([middle[0] + Math.sin(i / 48 * Math.PI * 2) * reach, middle[1], middle[2] + Math.cos(i / 48 * Math.PI * 2) * reach]);

				ring.push(p.X.toFixed(1) + ',' + p.Y.toFixed(1));
			}

			parts.push('<polyline class="elemenx-object-editor-ring" data-handle="turn" points="' + ring.join(' ') + '"></polyline>');
		}
		else {
			[['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]].forEach(function (axis) {
				var end = at([middle[0] + axis[1][0] * reach, middle[1] + axis[1][1] * reach, middle[2] + axis[1][2] * reach]);
				var handle = (self.Tool === 'scale' ? 'scale-' : 'move-') + axis[0];

				parts.push('<line class="elemenx-object-editor-axis axis-' + axis[0] + '" data-handle="' + handle + '" x1="' + center.X.toFixed(1) + '" y1="' + center.Y.toFixed(1) + '" x2="' + end.X.toFixed(1) + '" y2="' + end.Y.toFixed(1) + '"></line>');
				parts.push(self.Tool === 'scale' ? '<rect class="elemenx-object-editor-tip axis-' + axis[0] + '" data-handle="' + handle + '" x="' + (end.X - 5).toFixed(1) + '" y="' + (end.Y - 5).toFixed(1) + '" width="10" height="10"></rect>' : '<circle class="elemenx-object-editor-tip axis-' + axis[0] + '" data-handle="' + handle + '" cx="' + end.X.toFixed(1) + '" cy="' + end.Y.toFixed(1) + '" r="6"></circle>');
			});
		}

		svg.innerHTML = parts.join('');
	},

	/* A drag of a handle: along its axis as it shows on the screen (its place or its size), or round the up axis. */
	Handle: function (drag, event) {
		var scene = this.Own().Scene;
		var given = drag.Part;
		var reach = this.Reach(drag.Center);
		var changes = {};
		var axis;
		var index;
		var start;
		var end;
		var along;
		var pixels;
		var amount;
		var center;
		var a;
		var b;
		var list;

		if (drag.Kind === 'turn') {
			center = scene.Project(drag.Center);
			a = Math.atan2(drag.Y - center.Y, drag.X - center.X);
			b = Math.atan2(event.clientY - center.Y, event.clientX - center.X);
			list = (given.Turn || [0, 0, 0]).slice();
			list[1] = this.Step((((list[1] || 0) - (b - a) * 180 / Math.PI) % 360 + 360) % 360, this.SnapTurn);
			changes = {Turn: list};
		}
		else {
			index = {x: 0, y: 1, z: 2}[drag.Kind.slice(-1)];
			axis = [0, 0, 0];
			axis[index] = 1;
			start = scene.Project(drag.Center);
			end = scene.Project([drag.Center[0] + axis[0] * reach, drag.Center[1] + axis[1] * reach, drag.Center[2] + axis[2] * reach]);
			along = [end.X - start.X, end.Y - start.Y];
			pixels = Math.max(1, Math.hypot(along[0], along[1]));

			/* How far along the axis the pointer went, in sizes of the model. */
			amount = ((event.clientX - drag.X) * along[0] + (event.clientY - drag.Y) * along[1]) / pixels / pixels * reach / this.Shown;

			if (drag.Kind.indexOf('scale') === 0) {
				list = (given.Size || [1, 1, 1]).slice();
				list[index] = Math.max(0.01, this.Step(list[index] + amount, this.SnapScale));
				changes = {Size: list};
			}
			else {
				list = (given.At || [0, 0, 0]).slice();
				list[index] = this.Step(list[index] + amount, this.SnapMove);
				changes = {At: list};
			}
		}

		this.Change(this.Selected, changes, false);
		this.Fields();
	}
});
