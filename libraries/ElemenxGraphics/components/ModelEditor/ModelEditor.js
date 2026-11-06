/*
 * An editor of a model of the Models Service made of shapes, as a recipe of data (SceneModels.Assemble): its parts in a tree by
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
 * callback) and Scene() (the Scene) are its methods.
 * Its tab Roles (Mode roles) sets what the parts of a model are (ModelRoles): of the model of the document (its recipe keeps
 * them, Roles) or of a model of a file (RoleModel; ModelRoles keeps them). A role is added of a kind and picked in its list;
 * in the view Pick takes a piece whole or lets it go, Brush paints the triangles of a piece round the pointer (Shift wipes
 * them), Pivot sets the point it turns round; its parts show over the model, its fields are in the inspector, and Test moves
 * it as a scene does. Roles() and SetRoles(roles) are those of the model edited; Undo takes back a change of them too.
 * Its tab Parts (Mode parts) does to the pieces of the model what SceneModels edits do, over its source: a piece is picked
 * in the list or in the view (one more with Shift or Ctrl); split as it hangs together, grouped under a name, ungrouped,
 * merged, renamed, hidden or shown, duplicated, mirrored on X, removed, the origin moved to the bottom middle; taken out
 * into a model of their own, or put together with another model. The edits of the model of the document are in its recipe
 * (Edits), those of a model of a file kept for it; Undo takes them back.
 */
Elemenx.Component('ModelEditor', {
	$TemplateURL: 'ModelEditor.html',
	$StyleURL: 'ModelEditor.css',
	$Meta: {
		Group: 'game',
		Icon: 'shapes',
		Description: 'An editor of a model made of shapes: parts in pieces with tags, mirrors and variants of a seed, a gizmo, the recipe of Models and its files glb, fbx and obj.',
		Events: {
			change: 'The document changed: {Version, Name, Recipe}.',
			select: 'The selected part changed: {ID}.'
		},
		Methods: ['Document()', 'Load(document)', 'Recipe()', 'Roles()', 'SetRoles(roles)', 'Moded(mode)', 'Save()', 'Restore()', 'Export()', 'Import(text)', 'Model(format, variant)', 'Download(format)', 'Define(name)', 'Select(id)', 'Add(shape, props)', 'Remove(id)', 'Undo()', 'Redo()', 'Generate(description, callback)', 'Scene()'],
		Props: {
			Value: 'The document: {Version, Name, Recipe (a recipe of data of Models: Parts, Pieces, Group, Type, Size...)}.',
			Variant: 'The variant shown: 0, the parts as they are; the others varied by their seed.',
			Generator: 'A generator of models: function (description, callback (error, recipe)).',
			Storage: 'The key of localStorage Save keeps the document under.',
			SnapMove: 'The step of a move with Snap, in sizes of the model.',
			SnapTurn: 'The step of a turn with Snap, in degrees.',
			SnapScale: 'The step of a scale with Snap.',
			Label: 'What it shows, for screen readers.',
			Wire: 'Shows the wire of the model: each edge of its triangles.',
			Edges: 'Shows the edges of the model: where its faces meet at an angle and its rims (true).',
			Mode: {Options: ['shape', 'roles', 'parts'], Description: 'The tab shown: the parts of the recipe (shape), the roles of the parts of a model (roles) or what is done to its pieces (parts).'},
			RoleModel: 'In the tab Roles, a model of a file of SceneModels whose roles are edited (ModelRoles keeps them); empty: the one of the document (its recipe keeps them, Roles).'
		}
	},
	Value: null,
	Variant: 0,
	Generator: null,
	Storage: 'elemenx-model-editor',
	SnapMove: 0.05,
	SnapTurn: 15,
	SnapScale: 0.05,
	Label: '',
	Wire: false,
	Edges: true,

	/* The wire of the model and its edges (where its faces meet at an angle, its rims) shown or not, each in its colour. */
	WireToggled: function () {
		this.Wire = !this.Wire;

		if (this.Own().Scene)
			this.Own().Scene.Wireframe = this.Wire;
	},

	EdgesToggled: function () {
		this.Edges = !this.Edges;

		if (this.Own().Scene)
			this.Own().Scene.Edges = this.Edges;
	},

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
		{ID: 'select', Icon: 'pointer', Key: 'graphics.modelEditor.select', Hotkey: 'Q'},
		{ID: 'move', Icon: 'hand', Key: 'graphics.modelEditor.move', Hotkey: 'W'},
		{ID: 'turn', Icon: 'refresh', Key: 'graphics.modelEditor.turn', Hotkey: 'E'},
		{ID: 'scale', Icon: 'maximize', Key: 'graphics.modelEditor.scale', Hotkey: 'R'}
	],
	Modes: [{ID: 'shape', Key: 'graphics.modelEditor.shape'}, {ID: 'roles', Key: 'graphics.modelEditor.roles'}, {ID: 'parts', Key: 'graphics.modelEditor.partsMode'}],
	PartsSelected: null,
	PartsName: '',
	PartsWith: '',
	RoleTools: [
		{ID: 'pick', Icon: 'pointer', Key: 'graphics.modelEditor.pick'},
		{ID: 'brush', Icon: 'edit', Key: 'graphics.modelEditor.brush'},
		{ID: 'pivot', Icon: 'map-pin', Key: 'graphics.modelEditor.pivot'}
	],
	Mode: 'shape',
	RoleModel: '',
	RoleSelected: '',
	RoleTool: 'pick',
	RoleKind: 'door',
	RoleTest: 0,
	Brush: 0.03,
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
			throw new Error('Elemenx ModelEditor: a document of version ' + document.Version + ' is newer than 1');

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
		scene.Wireframe = this.Wire;
		scene.Edges = this.Edges;

		scene.Add('ground', {ID: 'floor', World: this.$Service('SceneWorld').Library({Size: 60, Height: 0.01, Water: 0, Ridges: 0, Scale: 300, Seed: 'object'})});
		scene.Add('sun', {ID: 'sun', Time: 10, Latitude: 40});
		scene.SetViewpoint({Target: [0, this.Shown / 2, 0], Yaw: 0.6, Pitch: 0.35, Distance: this.Shown * 2.6});

		function follow () {
			own.Frame = window.requestAnimationFrame(follow);

			self.Show();
			self.Gizmo();
			self.Marks();
		}

		if (!own.Frame)
			follow();

		this.Version++;
	},

	/* The model shown made again after a change, once a frame at most: a name of its own each time, the one before let go. */
	Show: function () {
		var own = this.Own();
		var models = this.$Service('SceneModels');
		var recipe = own.Document.Recipe;
		var variant = Math.max(0, Math.floor(Number(this.Variant) || 0));
		var name;

		if (!own.Dirty || !own.Scene) return;

		own.Dirty = false;

		if (this.RoleModel) {
			if (own.Scene.Get('model')) own.Scene.Change('model', {Model: this.RoleModel});
			else own.Scene.Add('thing', {ID: 'model', X: 0, Y: 0, Model: this.RoleModel, Size: this.Shown});

			return;
		}

		own.Built++;
		name = own.Key + '-' + own.Built;

		models.Define(name, {Group: recipe.Group || '', Type: recipe.Type || '', Size: 1, Smooth: !!recipe.Smooth, Matte: recipe.Matte !== false, Roles: recipe.Roles || [], Edits: recipe.Edits || [], Build: function (tools) {
			return models.Assemble(recipe, tools, models.Random(String(recipe.Seed) + ':' + variant), variant);
		}});

		if (own.Scene.Get('model')) own.Scene.Change('model', {Model: name});
		else own.Scene.Add('thing', {ID: 'model', X: 0, Y: 0, Model: name, Size: this.Shown});

		if (own.Name)
			this.Forget(own.Name);

		own.Name = name;
	},

	/* What was before a change made already (a stroke of the brush) kept for Undo. */
	Push: function (before) {
		var own = this.Own();

		own.Past.push(before);

		own.Future = [];

		if (own.Past.length > 100)
			own.Past.shift();

		this.Past = own.Past.length;
		this.Future = own.Future.length;
	},

	/* A model it made let go of: its recipe and what Models made of it. */
	Forget: function (name) {
		var models = this.$Service('SceneModels');

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

	/* What Undo brings back: the recipe, and the roles and the edits of the model of a file edited (if one is). */
	Kept: function () {
		return JSON.stringify({Recipe: this.Own().Document.Recipe, Model: this.RoleModel, Roles: this.RoleModel ? this.$Service('ModelRoles').Get(this.RoleModel) : null, Edits: this.RoleModel ? this.$Service('SceneModels').Edits(this.RoleModel) : null});
	},

	Back: function (text) {
		var kept = JSON.parse(text);

		this.Own().Document.Recipe = kept.Recipe;

		if (kept.Model) {
			this.$Service('ModelRoles').Set(kept.Model, kept.Roles || []);
			this.$Service('SceneModels').SetEdits(kept.Model, kept.Edits || []);
		}
	},

	/* The tab Parts: what is done to the pieces of the model (SceneModels edits, over its source; Undo takes them back). */

	/* The pieces of the model edited, as listed: {ID, Label, Selected, Hidden, Group}. */
	PartsList: function () {
		var models = this.$Service('SceneModels');
		var name = this.RoleTarget();
		var chosen = this.PartsSelected || [];

		if (!name || !models.Has(name) || !models.Ready(name)) return [];

		return models.PieceList(name).map(function (piece) {
			return {ID: piece.ID, Label: (piece.Group ? piece.Group + ' / ' : '') + piece.Name + ' · ' + piece.Triangles + (piece.Hidden ? ' ·  —' : ''), Selected: chosen.indexOf(piece.ID) >= 0, Hidden: piece.Hidden, Group: piece.Group};
		});
	},

	/* A piece picked in the list or in the view: alone, or one more with Shift or Ctrl. */
	PartPicked: function (id, event) {
		var chosen = (this.PartsSelected || []).slice();
		var at = chosen.indexOf(id);

		if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
			if (at >= 0) chosen.splice(at, 1);
			else chosen.push(id);
		}
		else {
			chosen = at >= 0 && chosen.length === 1 ? [] : [id];
		}

		this.PartsSelected = chosen;
		this.Version++;
	},

	PartsNamed: function (event) {
		this.PartsName = event.target.value;
	},

	PartsWithPicked: function (event) {
		this.PartsWith = event.target.value;
	},

	/* An edit of the model edited: in the recipe of the document, or kept for the model of a file. */
	PartsEdit: function (edit) {
		var before = this.Kept();
		var recipe = this.Own().Document.Recipe;

		if (this.RoleModel) this.$Service('SceneModels').Edit(this.RoleModel, edit);
		else recipe.Edits = (recipe.Edits || []).concat([edit]);

		this.Changed(before);

		/* The model made again with it at once: the list shows it. */
		this.Show();
	},

	PartsSplit: function () {
		var self = this;

		(this.PartsSelected || []).forEach(function (id) {
			self.PartsEdit({Op: 'split', Piece: id, By: 'connected'});
		});

		this.PartsSelected = [];
	},

	PartsGroup: function () {
		if ((this.PartsSelected || []).length)
			this.PartsEdit({Op: 'group', Pieces: this.PartsSelected.slice(), Name: this.PartsName || 'group'});
	},

	PartsUngroup: function () {
		var self = this;
		var groups = {};

		this.PartsList().forEach(function (piece) {
			if (piece.Selected && piece.Group)
				groups[piece.Group] = true;
		});

		Object.keys(groups).forEach(function (name) {
			self.PartsEdit({Op: 'ungroup', Name: name});
		});
	},

	PartsMerge: function () {
		if ((this.PartsSelected || []).length > 1) {
			this.PartsEdit({Op: 'merge', Pieces: this.PartsSelected.slice(), ID: this.PartsName || this.PartsSelected[0]});

			this.PartsSelected = [];
		}
	},

	PartsRename: function () {
		if ((this.PartsSelected || []).length === 1 && this.PartsName)
			this.PartsEdit({Op: 'rename', Piece: this.PartsSelected[0], Name: this.PartsName});
	},

	PartsRemove: function () {
		if ((this.PartsSelected || []).length) {
			this.PartsEdit({Op: 'remove', Pieces: this.PartsSelected.slice()});

			this.PartsSelected = [];
		}
	},

	PartsHide: function () {
		var hidden = this.PartsList().some(function (piece) {
			return piece.Selected && piece.Hidden;
		});

		if ((this.PartsSelected || []).length)
			this.PartsEdit({Op: 'hide', Pieces: this.PartsSelected.slice(), Hidden: !hidden});
	},

	PartsDuplicate: function () {
		var self = this;

		(this.PartsSelected || []).forEach(function (id) {
			self.PartsEdit({Op: 'duplicate', Piece: id, ID: id + '#copy', Move: [0.1, 0, 0]});
		});
	},

	PartsMirror: function () {
		if ((this.PartsSelected || []).length)
			this.PartsEdit({Op: 'mirror', Pieces: this.PartsSelected.slice(), Axis: 'x'});
	},

	PartsOrigin: function () {
		this.PartsEdit({Op: 'origin', To: 'bottom'});
	},

	/* The pieces picked taken out into a model of their own (its name the one written, else a new one). */
	PartsExtract: function () {
		var name = this.RoleTarget();
		var fresh;

		if (!(this.PartsSelected || []).length || !name) return;

		fresh = this.PartsName || name + '-part';

		this.$Service('SceneModels').Extract(name, this.PartsSelected.slice(), fresh);

		this.PartsSelected = [];
		this.Version++;

		this.$Emit('change', this.Document());
	},

	/* Another model put together with this one, beside it: a model of both (its name the one written). */
	PartsCombine: function () {
		var name = this.RoleTarget();
		if (!this.PartsWith || !name) return;

		this.$Service('SceneModels').Combine(this.PartsName || name + '+' + this.PartsWith, [{Model: name}, {Model: this.PartsWith, At: [1.2, 0, 0]}], {Size: this.$Service('SceneModels').Info(name).Size});

		this.Version++;
	},

	/* The models it may be put together with. */
	PartsModels: function () {
		return this.$Service('SceneModels').Names();
	},

	Undo: function () {
		var own = this.Own();
		if (!own.Past.length) return;

		own.Future.push(this.Kept());

		this.Back(own.Past.pop());

		this.Changed(null);
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length) return;

		own.Past.push(this.Kept());

		this.Back(own.Future.pop());

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

		this.$Service('SceneModels').Define(name, recipe);

		return name;
	},

	/* The model as a file of ModelFormats: glb and fbx an ArrayBuffer, gltf and obj a text; of a variant (Variant by default). */
	Model: function (format, variant) {
		var models = this.$Service('SceneModels');
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
			done(new Error('Elemenx ModelEditor: no Generator'));

			return;
		}

		this.Busy = true;

		this.Generator(description, function (error, recipe) {
			var before;

			self.Busy = false;

			if (error || !recipe) {
				done(error || new Error('Elemenx ModelEditor: the Generator gave no recipe'));

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
		var roled = null;

		if (!holder) return;

		holder.textContent = '';

		if (this.Mode === 'roles') {
			roled = this.RoleFields(holder);
			fields = roled.Fields || [];
		}
		else if (part) {
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

			label.className = 'elemenx-model-editor-field';
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
			else if (field[2] === 'readonly') {
				input.readOnly = true;
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

		if (roled && roled.After)
			holder.appendChild(roled.After);
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

		if (this.Mode === 'roles') {
			this.RoleEdited(field, value);

			return;
		}

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

	/*
	 * The tab Roles: what the parts of a model are (ModelRoles). The model is the one of the document (its roles in its
	 * recipe, Roles: they go where it goes) or a model of a file of SceneModels (RoleModel: its roles kept by ModelRoles). A
	 * role is picked in the list or added of a kind; its parts are set in the view: Pick takes a piece whole or lets it go,
	 * Brush paints the triangles of a piece round the pointer (Shift wipes them off: the glass of a lamp in the body), Pivot
	 * sets the point it turns round. The parts of the selected role show over the model, and Test moves it as a scene does.
	 */

	/* The tab shown: shape (the parts of the recipe) or roles. */
	Moded: function (mode) {
		var own = this.Own();

		this.Mode = mode === 'roles' || mode === 'parts' ? mode : 'shape';
		this.PartsSelected = [];

		if (this.Mode === 'shape' && this.RoleModel) {
			this.RoleModel = '';
			own.Dirty = true;
		}

		this.Fields();

		this.Version++;
	},

	/* The models of files of SceneModels: their roles are kept apart from any document. */
	FileModels: function () {
		var models = this.$Service('SceneModels');

		return models.Names().filter(function (name) {
			return !!models.Recipes[name].URL;
		});
	},

	/* The model whose roles are edited: a model of a file, or the one shown of the document. */
	RoleTarget: function () {
		return this.RoleModel || this.Own().Name;
	},

	/* The roles of the model edited. */
	Roles: function () {
		var recipe = this.Own().Document.Recipe;

		return this.RoleModel ? this.$Service('ModelRoles').Get(this.RoleModel) : JSON.parse(JSON.stringify(recipe.Roles || []));
	},

	/* The roles of the model edited set: in the recipe of the document (Undo brings them back), or kept for the model of a file. */
	SetRoles: function (roles, before) {
		var own = this.Own();
		var given = JSON.parse(JSON.stringify(roles || []));

		if (this.RoleModel) {
			if (before) {
				own.Past.push(before);

				own.Future = [];
			}

			this.$Service('ModelRoles').Set(this.RoleModel, given);

			this.Past = own.Past.length;
			this.Future = own.Future.length;
			this.Version++;

			this.Fields();

			return;
		}

		own.Document.Recipe.Roles = given;

		this.Changed(before || null);
	},

	Role: function (id) {
		return this.Roles().filter(function (role) {
			return role.ID === id;
		})[0] || null;
	},

	/* The list of the roles: their name or kind, how many parts each has. */
	RoleList: function () {
		return this.Roles().map(function (role) {
			return {ID: role.ID, Label: (role.Name || role.ID) + ' · ' + role.Kind + ' · ' + (role.Parts || []).length};
		});
	},

	/* The kinds a role is added of, by group. */
	RoleKinds: function () {
		var list = [];

		this.$Service('ModelRoles').Kinds().forEach(function (group) {
			group.Kinds.forEach(function (kind) {
				list.push({ID: kind.ID, Label: group.ID + ' · ' + kind.ID});
			});
		});

		return list;
	},

	RoleModelPicked: function (event) {
		var own = this.Own();
		var name = event.target.value;

		this.RoleModel = name;
		this.RoleSelected = '';
		own.Dirty = true;

		this.Fields();

		this.Version++;
	},

	RoleKindPicked: function (event) {
		this.RoleKind = event.target.value;
	},

	RolePicked: function (id) {
		this.RoleSelected = this.Role(id) ? id : '';
		this.RoleTest = 0;

		this.Fields();

		this.Version++;
	},

	/* A role of the kind chosen, selected at once: its parts are set next. */
	RoleAdded: function () {
		var roles = this.Roles();
		var role = this.$Service('ModelRoles').Make(this.RoleKind || 'part');

		roles.push(role);

		this.SetRoles(roles, this.Kept());
		this.RolePicked(role.ID);
	},

	RoleRemoved: function () {
		var id = this.RoleSelected;
		if (!id) return;

		this.SetRoles(this.Roles().filter(function (role) {
			return role.ID !== id;
		}).map(function (role) {
			if (role.Follow === id)
				delete role.Follow;

			return role;
		}), this.Kept());

		this.RolePicked('');
	},

	/* A role changed by a function given it, the rest as they are. */
	RoleChange: function (id, change, before) {
		this.SetRoles(this.Roles().map(function (role) {
			if (role.ID === id)
				change(role);

			return role;
		}), before);
	},

	PickRoleTool: function (tool) {
		this.RoleTool = tool;
	},

	BrushSized: function (event) {
		this.Brush = Math.max(0.002, Number(event.target.value) || 0.03);
	},

	/* The model in the view, its object, and the matrix from its own space to the world. */
	RoleView: function () {
		var scene = this.Own().Scene;
		var math = this.$Service('Math');
		var object = scene ? scene.Scene().Objects.model : null;
		var models = this.$Service('SceneModels');
		var name = this.RoleTarget();
		var made;
		var scale;
		var base;

		if (!object || !object.World || !name || !models.Has(name)) return null;

		try {
			made = models.Make(name);
		}
		catch (error) {
			made = null;
		}

		if (!made)
			return null;

		scale = object.Scaled || [object.Size || 1, object.Size || 1, object.Size || 1];
		base = math.Multiply(math.Translation(object.World[0], object.World[1], object.World[2]), math.Multiply(object.Turn || math.Identity(), math.Scaling(scale[0], scale[1], scale[2])));

		return {Model: made, Object: object, Base: base, Inverse: math.Invert(base)};
	},

	/* A corner of a piece in the space of its model. */
	Corner: function (piece, index) {
		var seen = piece.Placed || piece.Geometry;
		var p = seen.Positions;
		var at = [p[index * 3], p[index * 3 + 1], p[index * 3 + 2]];

		return piece.Rest ? this.$Service('Math').Apply(piece.Rest, at) : at;
	},

	/*
	 * What of the model is under a point of the page: the piece (its own ID, as a role names it), the point met in the space
	 * of the model, and the triangle; null where the ray meets nothing.
	 */
	RoleHit: function (clientX, clientY) {
		var self = this;
		var view = this.RoleView();
		var math = this.$Service('Math');
		var ray;
		var origin;
		var way;
		var best = null;

		if (!view)
			return null;

		ray = this.Own().Scene.Ray(clientX, clientY);
		origin = math.Apply(view.Inverse, ray.Origin);
		way = math.Apply(view.Inverse, [ray.Origin[0] + ray.Direction[0], ray.Origin[1] + ray.Direction[1], ray.Origin[2] + ray.Direction[2]]);
		way = [way[0] - origin[0], way[1] - origin[1], way[2] - origin[2]];

		view.Model.Pieces.forEach(function (piece) {
			var indices = piece.Geometry.Indices;
			var i;

			for (i = 0; i + 2 < indices.length; i += 3) {
				var a = self.Corner(piece, indices[i]);
				var b = self.Corner(piece, indices[i + 1]);
				var c = self.Corner(piece, indices[i + 2]);
				var t = self.Meet(origin, way, a, b, c);
				if (t !== null && (!best || t < best.T))
					best = {T: t, Piece: piece.Origin || piece.ID, Triangle: [indices[i], indices[i + 1], indices[i + 2]], Point: [origin[0] + way[0] * t, origin[1] + way[1] * t, origin[2] + way[2] * t]};
			}
		});

		return best;
	},

	/* Where a ray meets a triangle (Möller–Trumbore): how far along it, or null. */
	Meet: function (origin, way, a, b, c) {
		var e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
		var e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
		var p = [way[1] * e2[2] - way[2] * e2[1], way[2] * e2[0] - way[0] * e2[2], way[0] * e2[1] - way[1] * e2[0]];
		var det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
		var s;
		var u;
		var q;
		var v;
		var t;

		if (Math.abs(det) < 1e-12) return null;

		s = [origin[0] - a[0], origin[1] - a[1], origin[2] - a[2]];
		u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det;

		if (u < 0 || u > 1) return null;

		q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
		v = (way[0] * q[0] + way[1] * q[1] + way[2] * q[2]) / det;

		if (v < 0 || u + v > 1) return null;

		t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;

		return t > 0 ? t : null;
	},

	/* How tall the model is in its own space: the brush is a part of it. */
	RoleHeight: function (view) {
		var self = this;
		var low = Infinity;
		var high = -Infinity;

		view.Model.Pieces.forEach(function (piece) {
			var count = (piece.Placed || piece.Geometry).Positions.length / 3;
			var step = Math.max(1, Math.floor(count / 200));
			var i;

			for (i = 0; i < count; i += step) {
				var at = self.Corner(piece, i);

				low = Math.min(low, at[1]);
				high = Math.max(high, at[1]);
			}
		});

		return high > low ? high - low : 1;
	},

	/*
	 * What a press of a tool does to the selected role where the pointer is: Pick takes the piece whole or lets it go, Brush
	 * paints (erase: wipes) the triangles of the piece round the point met, Pivot sets the point its hinge turns round.
	 */
	RoleTouch: function (hit, erase, before) {
		var self = this;
		var roles = this.$Service('ModelRoles');
		var tool = this.RoleTool;
		var view = this.RoleView();
		var reach;
		var touched = [];

		if (!hit || !this.RoleSelected || !view) return;

		if (tool === 'pivot') {
			this.RoleChange(this.RoleSelected, function (role) {
				role.Motion = Object.assign({}, role.Motion, {Pivot: hit.Point.map(function (value) {
					return Math.round(value * 10000) / 10000;
				})});
			}, before);

			return;
		}

		if (tool === 'pick') {
			this.RoleChange(this.RoleSelected, function (role) {
				var had = (role.Parts || []).some(function (part) {
					return part.Piece === hit.Piece;
				});

				role.Parts = had ? role.Parts.filter(function (part) {
					return part.Piece !== hit.Piece;
				}) : (role.Parts || []).concat([{Piece: hit.Piece}]);
			}, before);

			return;
		}

		/* The brush: the triangle under it, and those of the piece with their middle or a corner within its reach. */
		reach = this.Brush * this.RoleHeight(view);

		view.Model.Pieces.forEach(function (piece) {
			var indices = piece.Geometry.Indices;
			var i;

			if ((piece.Origin || piece.ID) !== hit.Piece) return;

			for (i = 0; i + 2 < indices.length; i += 3) {
				var a = self.Corner(piece, indices[i]);
				var b = self.Corner(piece, indices[i + 1]);
				var c = self.Corner(piece, indices[i + 2]);
				var middle = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
				var under = indices[i] === hit.Triangle[0] && indices[i + 1] === hit.Triangle[1] && indices[i + 2] === hit.Triangle[2];
				if (under || [a, b, c, middle].some(function (point) {
					return Math.pow(point[0] - hit.Point[0], 2) + Math.pow(point[1] - hit.Point[1], 2) + Math.pow(point[2] - hit.Point[2], 2) <= reach * reach;
				}))
					touched.push(indices[i], indices[i + 1], indices[i + 2]);
			}
		});

		if (!touched.length) return;

		this.RoleChange(this.RoleSelected, function (role) {
			var parts = role.Parts || [];
			var part = parts.filter(function (each) {
				return each.Piece === hit.Piece;
			})[0];
			var count = 0;
			var have = {};
			var list = [];

			view.Model.Pieces.forEach(function (piece) {
				if ((piece.Origin || piece.ID) === hit.Piece)
					count = (piece.Placed || piece.Geometry).Positions.length / 3;
			});

			/* What it has now: the vertices of its ranges, or all of the piece. */
			if (part && !part.Vertices) {
				list = Array.apply(null, {length: count}).map(function (value, index) {
					return index;
				});
			}
			else if (part) {
				part.Vertices.forEach(function (range) {
					var i;

					for (i = range[0]; i <= range[1]; i++)
						list.push(i);
				});
			}

			list.forEach(function (index) {
				have[index] = true;
			});

			touched.forEach(function (index) {
				if (erase) delete have[index];
				else have[index] = true;
			});

			list = Object.keys(have).map(Number);

			parts = parts.filter(function (each) {
				return each.Piece !== hit.Piece;
			});

			if (list.length)
				parts.push({Piece: hit.Piece, Vertices: list.length === count ? undefined : roles.Ranges(list)});

			role.Parts = parts.map(function (each) {
				return each.Vertices === undefined ? {Piece: each.Piece} : each;
			});
		}, before);
	},

	/* The selected role tried: the model in the view moved as a scene moves it, 0 to 1. */
	RoleTried: function (value) {
		var scene = this.Own().Scene;
		var part = scene && this.RoleSelected ? scene.Part('model', this.RoleSelected) : null;

		this.RoleTest = Number(value) || 0;

		if (part)
			part.Set(this.RoleTest);
	},

	/* The roles of every model of a file, as the text of a file; read back over those kept. */
	RolesExported: function () {
		this.Saved(this.$Service('ModelRoles').Export(), 'roles.json', 'application/json');
	},

	RolesImported: function (event) {
		var self = this;
		var file = event.target.files && event.target.files[0];
		var reader;

		if (!file) return;

		reader = new FileReader();

		reader.onload = function () {
			self.$Service('ModelRoles').Import(String(reader.result));
			self.Fields();

			self.Version++;
		};

		reader.readAsText(file);
	},

	/*
	 * The parts of the selected role over the model, its pivot and its axis, made again as the view or the roles change: the
	 * triangles it takes, as many as show the shape of them (a few thousand).
	 */
	Marks: function () {
		var self = this;
		var svg = this.$Ref('Marks');
		var holder = this.$Ref('View');
		var scene = this.Own().Scene;
		var math = this.$Service('Math');
		var roles = this.$Service('ModelRoles');
		var role = this.Mode === 'roles' && this.RoleSelected ? this.Role(this.RoleSelected) : null;
		var view = role ? this.RoleView() : null;
		var box;
		var key;
		var path = [];
		var marks = [];
		var budget = 4000;
		var motion;
		var pivot;
		var end;

		if (!svg) return;

		if (!role || !view) {
			if (svg.childNodes.length)
				svg.textContent = '';

			this.Own().Marked = '';

			return;
		}

		key = JSON.stringify([role, scene.Viewpoint(), view.Model.Key, view.Object.Opens || {}, holder.clientWidth, holder.clientHeight]);

		if (this.Own().Marked === key) return;

		this.Own().Marked = key;
		box = holder.getBoundingClientRect();

		/* A point of a piece where the view shows it now: moved as its role moves it (Test). */
		function at (point, moved) {
			var spot = scene.Project(math.Apply(view.Base, moved ? math.Apply(moved, point) : point));

			return spot.Visible ? (spot.X - box.left).toFixed(1) + ' ' + (spot.Y - box.top).toFixed(1) : null;
		}

		(role.Parts || []).forEach(function (part) {
			view.Model.Pieces.forEach(function (piece) {
				var indices = piece.Geometry.Indices;
				var moved;
				var step;
				var i;

				if ((piece.Origin || piece.ID) !== part.Piece) return;

				moved = piece.Opening ? scene.Engine().OpeningMove(view.Object, piece) : null;
				step = Math.max(3, Math.ceil(indices.length / 3 / budget) * 3);

				for (i = 0; i + 2 < indices.length; i += step) {
					if (part.Vertices && !(roles.Within(part.Vertices, indices[i]) && roles.Within(part.Vertices, indices[i + 1]) && roles.Within(part.Vertices, indices[i + 2]))) continue;

					var a = at(self.Corner(piece, indices[i]), moved);
					var b = at(self.Corner(piece, indices[i + 1]), moved);
					var c = at(self.Corner(piece, indices[i + 2]), moved);
					if (a && b && c)
						path.push('M' + a + 'L' + b + 'L' + c + 'Z');
				}
			});
		});

		marks.push('<path class="elemenx-model-editor-role-part" d="' + path.join('') + '"></path>');

		motion = role.Motion || {};

		if (motion.Type === 'hinge' || motion.Type === 'spin') {
			pivot = motion.Pivot || [0, 0, 0];
			end = [pivot[0] + (motion.Axis || [0, 1, 0])[0] * 0.3, pivot[1] + (motion.Axis || [0, 1, 0])[1] * 0.3, pivot[2] + (motion.Axis || [0, 1, 0])[2] * 0.3];

			if (at(pivot) && at(end))
				marks.push('<path class="elemenx-model-editor-role-axis" d="M' + at(pivot) + 'L' + at(end) + '"></path><circle class="elemenx-model-editor-role-pivot" cx="' + at(pivot).split(' ')[0] + '" cy="' + at(pivot).split(' ')[1] + '" r="5"></circle>');
		}

		svg.innerHTML = marks.join('');
	},

	/* The fields of the selected role, or what to do with none. */
	RoleFields: function (holder) {
		var self = this;
		var role = this.Role(this.RoleSelected);
		var motion;
		var light;
		var fields;
		var test;
		var name;
		var label;
		var parts;
		var vertices = 0;

		if (!role) {
			label = document.createElement('p');
			label.className = 'elemenx-model-editor-hint';
			label.textContent = Elemenx.Locale.Text('graphics.modelEditor.roleHint');

			holder.appendChild(label);

			return [];
		}

		motion = role.Motion || {};
		light = role.Light || {};

		(role.Parts || []).forEach(function (part) {
			(part.Vertices || []).forEach(function (range) {
				vertices += range[1] - range[0] + 1;
			});
		});

		parts = (role.Parts || []).length + ' · ' + (vertices ? vertices : '—');

		fields = [
			['Role.ID', role.ID, 'text'], ['Role.Name', role.Name || '', 'text'], ['Role.Kind', role.Kind, this.RoleKinds().map(function (kind) {
				return kind.ID;
			})], ['Role.Parts', parts, 'readonly'],
			['Motion.Type', motion.Type || 'none', ['hinge', 'slide', 'spin', 'stretch', 'glow', 'emit', 'point', 'collider', 'none']]
		];

		if (motion.Type === 'hinge' || motion.Type === 'spin' || motion.Type === 'point')
			fields.push(['Motion.Pivot', motion.Pivot || [0, 0, 0], 'vector'], ['Motion.Axis', motion.Axis || [0, 1, 0], 'vector']);

		/* A shock grows along its way from its mount; an emitter gives off its effect at its point, along its way. */
		if (motion.Type === 'stretch' || motion.Type === 'emit')
			fields.push(['Motion.Pivot', motion.Pivot || [0, 0, 0], 'vector'], ['Motion.Way', motion.Way || [0, -1, 0], 'vector']);

		if (motion.Type === 'emit')
			fields.push(['Role.Effect', role.Effect || 'smoke', 'text'], ['Role.Rate', role.Rate === undefined ? 2 : role.Rate, 'number']);

		if (motion.Type === 'hinge')
			fields.push(['Motion.Angle', motion.Angle === undefined ? 90 : motion.Angle, 'number'], ['Motion.Aside', motion.Aside, 'vector'], ['Motion.AsideAngle', motion.AsideAngle === undefined ? '' : motion.AsideAngle, 'number']);

		if (motion.Type === 'slide')
			fields.push(['Motion.Way', motion.Way || [0, -1, 0], 'vector'], ['Motion.Reach', motion.Reach === undefined ? 1 : motion.Reach, 'number']);

		if (motion.Type === 'spin')
			fields.push(['Motion.Speed', motion.Speed === undefined ? 1 : motion.Speed, 'number']);

		if (motion.Type === 'glow')
			fields.push(['Light.Kind', light.Kind || 'glow', ['head', 'rear', 'brake', 'reverse', 'indicator', 'glow']], ['Light.Color', light.Color || '#ffd9a0', 'color'], ['Light.Glow', light.Glow === undefined ? '' : light.Glow, 'number'], ['Light.Power', light.Power === undefined ? '' : light.Power, 'number'], ['Light.Radius', light.Radius === undefined ? '' : light.Radius, 'number'], ['Light.Spot', light.Spot === undefined ? '' : light.Spot, 'number']);

		if (role.Kind === 'wheel' || role.Kind === 'caliper')
			fields.push(['Role.Corner', role.Corner || 'FL', ['FL', 'FR', 'RL', 'RR']], ['Role.Held', !!role.Held, 'check']);

		/* What goes with a wheel: its corner, and how long it is (the travel of the wheel in Lengths of it). */
		if (['arm', 'knuckle', 'shock', 'halfshaft'].indexOf(role.Kind) >= 0 || role.Drive === 'stroke' || role.Drive === 'wheel-steer' || role.Drive === 'roll')
			fields.push(['Role.Corner', role.Corner || 'FL', ['FL', 'FR', 'RL', 'RR']], ['Role.Length', role.Length === undefined ? 0.3 : role.Length, 'number']);

		fields.push(['Role.Drive', role.Drive || '', ['', 'steer', 'gas', 'brake', 'hand', 'gear', 'sequential', 'paddle', 'indicator', 'wipers', 'stroke', 'wheel-steer', 'roll', 'speed', 'rpm', 'pitch', 'yaw', 'roll-air', 'throttle', 'flaps', 'airborne', 'aim-yaw', 'aim-pitch', 'fire', 'wind', 'clock-hour', 'clock-minute']], ['Role.Follow', role.Follow || '', [''].concat(this.Roles().map(function (each) {
			return each.ID;
		}).filter(function (id) {
			return id !== role.ID;
		}))], ['Role.Both', !!role.Both, 'check'], ['Role.Pace', role.Pace === undefined ? '' : role.Pace, 'number'], ['Role.Open', role.Open || 0, 'number']);

		/* Test: the role moved in the view as a scene moves it. */
		label = document.createElement('label');
		name = document.createElement('span');
		test = document.createElement('input');

		label.className = 'elemenx-model-editor-field';
		name.textContent = Elemenx.Locale.Text('graphics.modelEditor.test');
		test.type = 'range';
		test.min = '0';
		test.max = '1';
		test.step = '0.01';
		test.value = String(this.RoleTest || 0);

		test.setAttribute('data-field', 'Test');

		test.addEventListener('input', function () {
			self.RoleTried(test.value);
		});

		label.appendChild(name);
		label.appendChild(test);

		return {Fields: fields, After: label};
	},

	/* A field of the selected role changed. */
	RoleEdited: function (field, value) {
		var key = field[0];
		var id = this.RoleSelected;
		var others = this.Roles();

		if (key === 'Role.ID') {
			if (!value || others.some(function (role) {
				return role.ID === value;
			})) {
				this.Fields();

				return;
			}

			this.SetRoles(others.map(function (role) {
				if (role.ID === id)
					role.ID = value;

				if (role.Follow === id)
					role.Follow = value;

				return role;
			}), this.Kept());

			this.RolePicked(value);

			return;
		}

		this.RoleChange(id, function (role) {
			var group = key.split('.')[0];
			var name = key.split('.')[1];
			var target;

			if (group === 'Role') {
				target = role;
			}
			else {
				role[group] = Object.assign({}, role[group] || {});
				target = role[group];
			}

			if (value === undefined || value === '') delete target[name];
			else target[name] = value;

			/* Another kind starts as that kind does, its parts kept. */
			if (key === 'Role.Kind')
				Object.assign(role, this.$Service('ModelRoles').Make(value, {ID: role.ID, Name: role.Name, Parts: role.Parts}));
		}.bind(this), this.Kept());
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

		/* Parts: the piece under the pointer picked (one more with Shift or Ctrl). */
		if (this.Mode === 'parts') {
			var hit = this.RoleHit(event.clientX, event.clientY);
			if (hit)
				this.PartPicked(hit.Piece, event);

			own.Drag = {Kind: 'press', X: event.clientX, Y: event.clientY};

			return;
		}

		if (this.Mode === 'roles') {
			own.Drag = {Kind: this.RoleTool === 'brush' ? 'brush' : 'press', X: event.clientX, Y: event.clientY, Before: this.Kept(), Painted: false};

			if (this.RoleTool === 'brush') {
				this.RoleTouch(this.RoleHit(event.clientX, event.clientY), event.shiftKey, null);

				own.Drag.Painted = true;
			}

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

		if (drag.Kind === 'brush') {
			this.RoleTouch(this.RoleHit(event.clientX, event.clientY), event.shiftKey, null);

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

		/* A stroke of the brush is one change to undo; a press of Pick or Pivot changes the role where it is. */
		if (drag.Kind === 'brush') {
			if (drag.Painted && drag.Before !== this.Kept())
				this.Push(drag.Before);

			return;
		}

		if (this.Mode === 'roles') {
			if (drag.Kind === 'press' && Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) < 4)
				this.RoleTouch(this.RoleHit(event.clientX, event.clientY), event.shiftKey, drag.Before);

			return;
		}

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

		if (!part || this.Tool === 'select' || this.Mode === 'roles') {
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

			parts.push('<polyline class="elemenx-model-editor-ring" data-handle="turn" points="' + ring.join(' ') + '"></polyline>');
		}
		else {
			[['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]].forEach(function (axis) {
				var end = at([middle[0] + axis[1][0] * reach, middle[1] + axis[1][1] * reach, middle[2] + axis[1][2] * reach]);
				var handle = (self.Tool === 'scale' ? 'scale-' : 'move-') + axis[0];

				parts.push('<line class="elemenx-model-editor-axis axis-' + axis[0] + '" data-handle="' + handle + '" x1="' + center.X.toFixed(1) + '" y1="' + center.Y.toFixed(1) + '" x2="' + end.X.toFixed(1) + '" y2="' + end.Y.toFixed(1) + '"></line>');
				parts.push(self.Tool === 'scale' ? '<rect class="elemenx-model-editor-tip axis-' + axis[0] + '" data-handle="' + handle + '" x="' + (end.X - 5).toFixed(1) + '" y="' + (end.Y - 5).toFixed(1) + '" width="10" height="10"></rect>' : '<circle class="elemenx-model-editor-tip axis-' + axis[0] + '" data-handle="' + handle + '" cx="' + end.X.toFixed(1) + '" cy="' + end.Y.toFixed(1) + '" r="6"></circle>');
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
