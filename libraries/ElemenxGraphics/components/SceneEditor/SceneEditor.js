/*
 * An editor of the scene of a game (a Scene) as Unreal edits a level: the objects of the scene in a tree, the kinds to
 * add, the view with a gizmo, the fields of the selected object, the parameters of its Blueprint (an effect graph or a
 * material graph of the Blueprints Service: the values a level gives one graph) and the graph itself under the view.
 * Under the view too, as tabs: the relief of a ground (Relief, a generator graph; From the library starts it as the
 * ground is) and the rule of a Scatter (Graph); the inspector tells what the lands by climate of a ground (Biomes) leave
 * bare (SceneBiomes.Check).
 * Value is its document {Version, Scene (the recipe of Scene.Save), Name}; change emits it after each action, select
 * {ID}, play {Playing}. A document with no Scene starts as a ground under a sun. Kinds lists the kinds to add (by default those of objects that stand on a ground).
 * The view (as Unreal): the right button held looks round, with W A S D going and Q E going down and up (Shift faster);
 * Alt with the left button turns round what it looks at; the middle button moves it aside; the wheel comes nearer. A press
 * selects (any object, not only units); W, E and R are the gizmo to move, turn and scale, Q selects; F looks at the
 * selected object, End sets it on the ground, Delete removes it, Ctrl+D copies it, Ctrl+Z and Ctrl+Y undo and redo.
 * The gizmo moves along an axis (the red X and the blue Z over the ground, the green one up: its Lift) or over the ground
 * (its middle square), turns round the up axis (its Facing) and scales (its Size); Snap keeps to steps of SnapMove metres,
 * SnapTurn degrees and SnapScale. Play runs the scene as it is (its time, its hero, if one object has Hero); Stop brings
 * back what it was before.
 * Save() keeps the document in localStorage under Storage (Restore() reads it back), Export() gives its JSON text and
 * Import(text) reads one; Load(document), Document(), Select(id), Selected, Add(kind, props), Remove(id), Undo(),
 * Redo(), Play(), Stop() and Scene() (the Scene) are its methods.
 *
 * Space: a document of Setting space (the prop, for a new one) starts as a star with a planet, and a scene with no ground is
 * edited as a star system. SpaceKinds are the kinds to add there, each round the selected body or the one that fits (a planet
 * round the star, a moon round a planet, a station round a body), on an orbit of its own farther out. Moving a body moves it on
 * its orbit: the middle square carries it in the plane of its parent (its Distance and Anomaly, Scene.OrbitAt), the green
 * axis tilts its orbit (Inclination), the points q and Q on its line draw out its nearest and farthest distances (in AU, the
 * fields of the same name with them; kept as Distance and Eccentricity); the ring turns its axis (Tilt), scaling changes its
 * Radius; on a long orbit the square carries it along its ellipse. Time sets the day the system
 * is drawn at. A system is a tree of orbits to any depth: stars round a barycentre (a star added with one selected), planets,
 * planetoids, belts, black holes and wormholes round a star, a barycentre or a black hole, moons and rings round a body, what
 * is made round anything natural; its list of objects is that tree. Its system is saved as a file of the system format
 * (System(): SystemData of its scene; the button System downloads it) and one is opened (OpenSystem(source, callback), the
 * field Open a system), the planets of its bodies kept with it.
 */
Elemenx.Component('SceneEditor', {
	$TemplateURL: 'SceneEditor.html',
	$StyleURL: 'SceneEditor.css',
	$Traits: ['EditorPanes'],
	$Meta: {
		Group: 'game',
		Icon: 'layers',
		Description: 'An editor of a game scene as Unreal edits a level: objects, kinds to add, the view with a gizmo, fields, blueprint parameters, Play.',
		Events: {
			change: 'The document changed: {Version, Name, Scene}.',
			select: 'The selection changed: {ID}.',
			play: 'Play or Stop: {Playing}.'
		},
		Methods: ['Document()', 'Load(document)', 'Save()', 'Restore()', 'Export()', 'Import(text)', 'System()', 'OpenSystem(source, callback)', 'Select(id)', 'Add(kind, props)', 'Remove(id)', 'Undo()', 'Redo()', 'Play()', 'Stop()', 'Scene()'],
		Props: {
			Value: 'The document: {Version, Name, Setting, Scene (the recipe of Scene.Save)}.',
			Setting: {Options: ['ground', 'space'], Description: 'What a new document is: a ground under a sun, or a star system.'},
			Scale: 'How real the sizes and distances of a star system are: 0 readable (large bodies, nothing crowded) to 1 real, a slider over the view.',
			Kinds: 'The kinds of objects to add on a ground.',
			SpaceKinds: 'The kinds of objects to add in a star system.',
			Models: 'Models of the Models Service to place on a ground (an ModelEditor\'s), each as the kind its Type fits: a unit, a house, a tree, a rock or a thing.',
			Storage: 'The key of localStorage Save keeps the document under.',
			SnapMove: 'The step of a move with Snap, in metres.',
			SnapTurn: 'The step of a turn with Snap, in degrees.',
			SnapScale: 'The step of a scale with Snap.',
			Label: 'What it shows, for screen readers.'
		}
	},
	PanesKey: 'scene-editor',
	Value: null,
	Setting: 'ground',
	Kinds: ['unit', 'effect', 'glass', 'mirror', 'camera', 'screen', 'tree', 'rock', 'house'],
	CutscenesOpen: false,
	SpaceKinds: ['star', 'giant', 'supergiant', 'white-dwarf', 'brown-dwarf', 'neutron-star', 'pulsar', 'magnetar', 'barycentre', 'cluster', 'nebula', 'planet', 'planetoid', 'moon', 'belt', 'ring', 'blackhole', 'wormhole', 'station', 'outpost', 'craft', 'fleet'],
	Models: [],
	Storage: 'elemenx-scene-editor',
	SnapMove: 0.5,
	SnapTurn: 15,
	SnapScale: 0.1,
	Label: '',

	/* What the template renders. */
	Tool: 'move',
	Told: 0,
	/* The graph open under the view: Blueprint (its look), Relief (of a ground), Graph (the rule of a Scatter); '' the first it has. */
	GraphKind: '',
	/* The block of the World whose graph is open in the tab of its step. */
	GraphStep: '',
	/* The phrase of the tab of each step of a World that has a graph of its own. */
	StepKeys: {Relief: {Key: 'graphics.sceneEditor.graphs.relief'}, Scatter: {Key: 'graphics.sceneEditor.graphs.rule'}},
	/* The phrase of each type of what SceneBiomes.Check finds amiss with lands by climate. */
	LandPhrases: [{Type: 'range', Key: 'graphics.sceneEditor.land.range'}, {Type: 'gap', Key: 'graphics.sceneEditor.land.gap'}, {Type: 'unreachable', Key: 'graphics.sceneEditor.land.unreachable'}, {Type: 'unused', Key: 'graphics.sceneEditor.land.unused'}, {Type: 'uncovered', Key: 'graphics.sceneEditor.land.uncovered'}],
	Snap: true,
	/* One finger moves the camera too (ViewActions), not only two. */
	Hand: false,
	Scale: 0,
	Selected: '',
	Picks: [],
	TreeItems: [],
	/* The fields of the inspector (Fields) and the items of the sketch in hand with theirs (SketchItems). */
	FieldList: [],
	ItemList: [],
	Playing: false,
	Version: 0,
	Past: 0,
	Future: 0,
	Tools: [
		{ID: 'select', Icon: 'pointer', Key: 'graphics.sceneEditor.select', Hotkey: 'Q'},
		{ID: 'move', Icon: 'hand', Key: 'graphics.sceneEditor.move', Hotkey: 'W'},
		{ID: 'turn', Icon: 'refresh', Key: 'graphics.sceneEditor.turn', Hotkey: 'E'},
		{ID: 'scale', Icon: 'maximize', Key: 'graphics.sceneEditor.scale', Hotkey: 'R'},
		{ID: 'sketch', Icon: 'freehand', Key: 'graphics.sceneEditor.sketch', Hotkey: 'B'},
		{ID: 'road', Icon: 'map', Key: 'graphics.sceneEditor.road', Hotkey: 'T'}
	],
	RoadType: 'road',
	RoadPart: 'curve',
	RoadRadius: 0,
	RoadParts: [{ID: 'line', Key: 'graphics.sceneEditor.parts.line'}, {ID: 'arc', Key: 'graphics.sceneEditor.parts.arc'}, {ID: 'curve', Key: 'graphics.sceneEditor.parts.curve'}],
	SketchType: 'raise',
	SketchLayer: '',
	SketchGroups: [
		{Kind: 'stroke', Key: 'graphics.sceneEditor.kinds.stroke', Types: ['raise', 'lower', 'flatten', 'smooth']},
		{Kind: 'line', Key: 'graphics.sceneEditor.kinds.line', Types: ['ridge', 'valley', 'canyon', 'cave', 'river', 'road', 'cliff', 'row', 'fence', 'hedge', 'wall', 'powerline', 'street', 'citywall', 'triggerline']},
		{Kind: 'area', Key: 'graphics.sceneEditor.kinds.area', Types: ['plateau', 'basin', 'lake', 'terraces', 'swamp', 'beach', 'floodplain', 'dunes', 'erosion', 'biome', 'mask', 'forest', 'meadow', 'clearing', 'bushes', 'thicket', 'jungle', 'sequoia', 'fields', 'orchard', 'settlement', 'square', 'district', 'trigger', 'zone', 'collider']},
		{Kind: 'circle', Key: 'graphics.sceneEditor.kinds.circle', Types: ['mountain', 'crater', 'stamp', 'hall', 'overhang', 'marker', 'landmark', 'triggerpoint']}
	],

	/*
	 * The fields of each type of item of a sketch, with their first values: the Defaults of its type of the ground
	 * (SketchTable of SceneTerrainGenerator); of cave, hall and overhang those of its carves (Carves.Sketch). Set as it is made.
	 */
	SketchFields: {},

	$OnCreate: function () {
		var own = {Scene: null, Document: null, Past: [], Future: [], Drag: null, Keys: {}, Played: null, Frame: 0, Copies: 0};
		var terrain = this.$Service('SceneTerrainGenerator');
		var carved = terrain.Carves.Sketch;
		var fields = {};

		Object.keys(terrain.SketchTable).forEach(function (type) {
			if (type !== '*')
				fields[type] = Object.assign({}, terrain.SketchTable[type].Defaults);
		});

		this.SketchFields = Object.assign(fields, {cave: Object.assign({}, carved.cave), hall: Object.assign({}, carved.hall), overhang: Object.assign({}, carved.overhang)});

		/* A context menu opens only with items: the ones of its list are made again as it opens (TreeOpened). Regression: it had none at first, and never opened. */
		this.TreeItems = [{ID: 'add', Label: Elemenx.Locale.Text('graphics.sceneEditor.addKind'), Icon: 'add'}];

		this.Own = function () {
			return own;
		};

		own.Document = this.Normalize(this.Value);
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Frame)
			window.cancelAnimationFrame(own.Frame);
	},

	$OnProps: function (changed) {
		var own = this.Own();
		if ('Value' in changed && this.Value && JSON.stringify(this.Value) !== JSON.stringify(own.Document) && own.Scene)
			this.Load(this.Value);
	},

	Normalize: function (value) {
		var document = value ? typeof value === 'string' ? JSON.parse(value) : JSON.parse(JSON.stringify(value)) : {};
		if (document.Version > 1)
			throw new Error('Elemenx SceneEditor: a document of version ' + document.Version + ' is newer than 1');

		return {Version: 1, Name: document.Name || '', Setting: document.Setting || this.Setting || 'ground', Scene: document.Scene || null};
	},

	/* The scene is ready: the document in it, and the gizmo follows the view each frame. */
	SceneReady: function (scene) {
		var own = this.Own();
		var self = this;

		own.Scene = scene;

		if (own.Document.Scene) scene.Load(own.Document.Scene);
		else this.Fresh(scene);

		function follow () {
			own.Frame = window.requestAnimationFrame(follow);

			self.Fly();
			self.Gizmo();
		}

		if (!own.Frame)
			follow();

		this.Version++;
	},

	Scene: function () {
		return this.Own().Scene;
	},

	Document: function () {
		var own = this.Own();

		return {Version: 1, Name: own.Document.Name, Setting: this.Space() ? 'space' : 'ground', Scene: own.Scene ? own.Scene.Save() : own.Document.Scene};
	},

	/* A scene with no ground is a star system. */
	Space: function () {
		var own = this.Own();

		return own.Scene ? !this.Ground() : own.Document.Setting === 'space';
	},

	/* What the template offers by the setting: the kinds to add, the tools (no sketch in space). */
	Palette: function () {
		return this.Space() ? this.SpaceKinds : this.Kinds;
	},

	ToolsOf: function () {
		var space = this.Space();

		return this.Tools.filter(function (tool) {
			return !space || tool.ID !== 'sketch';
		});
	},

	Day: function () {
		var scene = this.Own().Scene;

		return scene ? Math.round(scene.Now() * 100) / 100 : 0;
	},

	/* The day the system is drawn at, kept for Undo. */
	Timed: function (value) {
		var own = this.Own();
		var before = own.Scene.Save();

		own.Scene.SetTime(Number(value && value.target ? value.target.value : value) || 0);

		this.Changed(before);
	},

	/*
	 * A new document in a scene: emptied, then a ground under a sun at the end of the morning, looked at from above its
	 * middle; or a star and a planet.
	 */
	Fresh: function (scene) {
		var own = this.Own();

		scene.Cutscenes = null;

		scene.Load({Version: 1, Seed: '', Time: 0, Travels: [], Added: [], Removed: [], Overrides: {}});

		if (own.Document.Setting === 'space') {
			scene.Add('star', {ID: 'star', Name: 'Star'});
			scene.Add('planet', {ID: 'planet', Name: 'Planet', Parent: 'star', Distance: 1, Anomaly: 30});
			scene.SetViewpoint({Target: [0, 0, 0], Yaw: 0.4, Pitch: 0.9, Distance: 60});
		}
		else {
			scene.Add('ground', {ID: 'ground', World: this.$Service('SceneWorld').Library({Size: 400, Height: 12, Water: 0.15, Seed: 'editor'})});
			scene.Add('sun', {ID: 'sun', Time: 11, Latitude: 45});
			scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0.6, Pitch: 0.55, Distance: 40});
		}
	},

	Load: function (document) {
		var own = this.Own();

		own.Document = this.Normalize(document);
		/* A document of no system: the planets of the one opened before are not its own (OpenSystem sets them after). */
		own.System = null;

		/* Regression: a new document (no Scene) left the scene of the one before. */
		if (own.Scene && own.Document.Scene) this.Recall(own.Document.Scene);
		else if (own.Scene) this.Fresh(own.Scene);

		this.Select('');

		this.Version++;
	},

	/* After an action: the state before it kept for Undo, the document emitted. */
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
		own.Document = this.Document();

		this.Version++;

		this.Fields();
		this.$Emit('change', own.Document);
	},

	Undo: function () {
		var own = this.Own();
		if (!own.Past.length || this.Playing) return;

		own.Future.push(own.Scene.Save());

		this.Recall(own.Past.pop());

		this.Changed(null);
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length || this.Playing) return;

		own.Past.push(own.Scene.Save());

		this.Recall(own.Future.pop());

		this.Changed(null);
	},

	/* A state of the scene back as it was: its cutscenes too, none when it had none (Load leaves the ones a scene has). */
	Recall: function (saved) {
		var own = this.Own();

		own.Scene.Cutscenes = null;

		own.Scene.Load(saved);
	},

	/* The cutscenes of the scene, edited under the view (CutsceneEditor). */
	CutscenesToggled: function () {
		this.CutscenesOpen = !this.CutscenesOpen;
	},

	CutscenesOf: function () {
		var own = this.Own();

		return own.Scene && own.Scene.Cutscenes ? own.Scene.Cutscenes : {};
	},

	SceneOf: function () {
		return this.Own().Scene || null;
	},

	CutscenesChanged: function (event) {
		var own = this.Own();
		var value = event && event.detail !== undefined ? event.detail : event;
		var before = own.Scene.Save();

		own.Scene.Cutscenes = value && Object.keys(value).length ? JSON.parse(JSON.stringify(value)) : null;

		this.Changed(before);
	},

	/* A camera where the view is, asked by the cutscenes. */
	CameraAsked: function (event) {
		var detail = event && event.detail ? event.detail : event;

		this.Add('camera', detail && detail.Props ? detail.Props : {});
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
		return JSON.stringify(this.Document(), null, 2);
	},

	Import: function (text) {
		var before = this.Own().Scene ? this.Own().Scene.Save() : null;

		this.Load(text);
		this.Changed(before);
	},

	Store: function () {
		this.Save();
	},

	Exported: function () {
		var link = document.createElement('a');

		link.href = URL.createObjectURL(new Blob([this.Export()], {type: 'application/json'}));
		link.download = (this.Own().Document.Name || 'scene') + '.json';

		link.click();

		window.setTimeout(function () {
			URL.revokeObjectURL(link.href);
		}, 1000);
	},

	/* A file of a scene picked (the files a FileUpload told, or the event of a field of the page). */
	Imported: function (files) {
		var self = this;
		var list = files && files.target ? files.target.files : files;
		var file = list && list[0];
		var reader;

		if (!file) return;

		reader = new FileReader();
		reader.onload = function () {
			self.Import(String(reader.result));
		};

		reader.readAsText(file);

		if (files && files.target)
			files.target.value = '';
	},

	/*
	 * Its star system as data (SystemData, docs/SPACE-FORMAT.md): of its scene (its seed, what was added, taken away and
	 * changed), the planets of the bodies of the system it was opened of kept with it.
	 */
	System: function () {
		var own = this.Own();
		var systems = this.$Service('SystemData');
		var name = own.Document.Name || 'system';
		var data = systems.FromRecipe(own.Scene.Save(), {ID: own.System ? own.System.Manifest.ID : String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'system', Name: name});

		/* Its planets as they came: their URLs, or their parts (their data, read from the system it was opened of). */
		if (own.System) {
			data.Manifest.Bodies = JSON.parse(JSON.stringify(own.System.Manifest.Bodies || {}));
			data.Bodies = own.System.Bodies || {};
			data.Source = own.System.Source;
		}

		return data;
	},

	/* The file of its system (a zip of the system format: .system), downloaded; its planets kept in it read first. */
	ExportedSystem: function () {
		var self = this;
		var systems = this.$Service('SystemData');
		var data = this.System();
		var ids = Object.keys(data.Manifest.Bodies).filter(function (id) {
			return data.Manifest.Bodies[id].Part;
		});
		var left = ids.length;

		function packed () {
			systems.Pack(data, function (error, bytes) {
				var link;

				if (error) {
					self.$Emit('error', error);

					return;
				}

				link = document.createElement('a');
				link.href = URL.createObjectURL(new Blob([bytes], {type: 'application/zip'}));
				link.download = (self.Own().Document.Name || 'system') + '.system';

				link.click();

				window.setTimeout(function () {
					URL.revokeObjectURL(link.href);
				}, 1000);
			});
		}

		if (!left) {
			packed();

			return;
		}

		ids.forEach(function (id) {
			systems.Body(data, id, function () {
				if (!--left)
					packed();
			});
		});
	},

	/*
	 * A file of a system opened (SystemData): its scene of it (its seed, its edits, its cosmos, time and cutscenes), the
	 * planets of its bodies given to the scene first; one step to undo.
	 */
	OpenSystem: function (source, callback) {
		var self = this;
		var systems = this.$Service('SystemData');
		var done = typeof callback === 'function' ? callback : function () {};

		systems.Open(source, function (error, data) {
			var key;

			if (error) {
				self.$Emit('error', error);

				done(error);

				return;
			}

			key = 'editor:' + data.Manifest.ID;

			systems.Use(key, data);
			systems.UseBodies(key, data, function () {
				var before = self.Own().Scene ? self.Own().Scene.Save() : null;

				self.Load({Version: 1, Name: data.Manifest.Name, Setting: 'space', Scene: systems.Recipe(data, key)});

				self.Own().System = data;

				self.Changed(before);

				done(null, data);
			});
		});
	},

	ImportedSystem: function (files) {
		var list = files && files.target ? files.target.files : files;
		var file = list && list[0];
		if (file)
			this.OpenSystem(file);

		if (files && files.target)
			files.target.value = '';
	},

	/* The objects */

	/* Its objects as a tree: each under what it goes round or stands on (its Parent), to any depth (a station of a moon of a planet). */
	Items: function () {
		var self = this;
		var scene = this.Own().Scene;
		var objects;
		var items = {};
		var roots = [];

		if (!scene) return [];

		objects = scene.Objects().filter(function (object) {
			return !object.Owner;
		});

		objects.forEach(function (object) {
			items[object.ID] = {ID: object.ID, Label: (object.Values.Name || object.ID) + (object.Kind ? ' · ' + object.Kind : '') + (object.Values.Generated ? ' · ' + Elemenx.Locale.Text('graphics.sceneEditor.generated') : ''), Icon: object.Values.Generated ? 'layers' : self.KindIcon(object.Kind)};
		});

		objects.forEach(function (object) {
			var parent = object.Parent && items[object.Parent];

			if (parent) (parent.Items = parent.Items || []).push(items[object.ID]);
			else roots.push(items[object.ID]);
		});

		return roots;
	},

	/* The items of its tree that hold others, open. */
	Opened: function () {
		var open = [];

		function walk (list) {
			list.forEach(function (item) {
				if (!item.Items) return;

				open.push(item.ID);

				walk(item.Items);
			});
		}

		walk(this.Items());

		return open;
	},

	/*
	 * The icon of a kind in its list of objects. Regression: every object had a square there, which looked as a check box
	 * that did nothing.
	 */
	KindIcon: function (kind) {
		return {star: 'sun', sun: 'sun', giant: 'sun', supergiant: 'sun', 'white-dwarf': 'circle-dot', 'brown-dwarf': 'moon', 'neutron-star': 'target', pulsar: 'orbit', magnetar: 'zap', barycentre: 'barycentre', cluster: 'sparkles', nebula: 'cloud', planet: 'planet', planetoid: 'asteroid', moon: 'moon', belt: 'asteroid', ring: 'ring', blackhole: 'black-hole', wormhole: 'wormhole', station: 'station', outpost: 'outpost', craft: 'science:rocket', fleet: 'fleet', comet: 'science:comet', quasar: 'quasar', unit: 'user', effect: 'sparkles', glass: 'window-maximize', mirror: 'mirror', camera: 'camera', screen: 'monitor', tree: 'pine', rock: 'rock', house: 'home', building: 'home', ground: 'map', road: 'road', trigger: 'zap', zone: 'zone', marker: 'map-pin', lamp: 'lightbulb', light: 'lightbulb', water: 'water', vehicle: 'racing:sports-car', car: 'racing:sports-car'}[kind] || 'circle';
	},

	/* How real the sizes and distances of a star system are shown: 0 readable (nothing crowded) to 1 real (Scene Scale). */
	Scaled: function (value) {
		this.Scale = Math.max(0, Math.min(1, Number(value && value.detail !== undefined ? value.detail : value) || 0));
	},

	Chosen: function (item) {
		this.Select(item && item.ID || '');
	},

	/* Many objects chosen in its list (Ctrl, Shift): the first is the selected one (its fields, its gizmo), all are marked. */
	ManyChosen: function (ids) {
		var list = (ids || []).slice();

		this.Select(list[0] || '');

		this.Picks = list;

		if (this.Own().Scene)
			this.Own().Scene.Select(list);
	},

	/* An object dragged in its list onto another: into it (it goes round it, stands on it), or beside it (the same parent). */
	TreeMoved: function (event) {
		var moved = this.Found(event.ID);
		var target = this.Found(event.Target);
		var parent;

		if (!moved || !target || this.Playing) return;

		parent = event.Position === 'inside' ? target.ID : target.Parent || '';

		if (parent === moved.ID || (moved.Parent || '') === parent) return;

		this.Change(moved.ID, {Parent: parent});

		this.Version++;
	},

	/* The context menu of its list: of the object under it (chosen first if it was not), or of the list itself. */
	TreeOpened: function (event) {
		var row = event.Target && event.Target.closest ? event.Target.closest('[data-id]') : null;
		var id = row ? row.getAttribute('data-id') : '';
		var self = this;
		var kinds = this.Space() ? this.SpaceKinds : this.Kinds;
		var many;

		if (id && this.Picks.indexOf(id) === -1)
			this.Select(id);

		many = this.Picks.length > 1;

		this.TreeItems = !id ? [{ID: 'add', Label: Elemenx.Locale.Text('graphics.sceneEditor.addKind'), Icon: 'add', Items: kinds.map(function (kind) {
			return {ID: 'add:' + kind, Label: kind, Icon: self.KindIcon(kind)};
		})}] : [
			{ID: 'focus', Label: Elemenx.Locale.Text('graphics.sceneEditor.flyTo'), Icon: 'target', Disabled: many},
			{ID: 'rename', Label: Elemenx.Locale.Text('graphics.sceneEditor.rename'), Icon: 'edit', Disabled: many},
			{ID: 'duplicate', Label: Elemenx.Locale.Text('graphics.viewActions.duplicate'), Icon: 'copy', Disabled: many},
			{ID: 'child', Label: Elemenx.Locale.Text('graphics.sceneEditor.addChild'), Icon: 'add', Disabled: many, Items: kinds.map(function (kind) {
				return {ID: 'child:' + kind, Label: kind, Icon: self.KindIcon(kind)};
			})},
			{Separator: true},
			{ID: 'delete', Label: Elemenx.Locale.Text('graphics.viewActions.delete'), Icon: 'delete', Danger: true}
		];
	},

	TreePicked: function (event) {
		var id = String(event && event.Item ? event.Item.ID : '');
		var self = this;
		var field;

		if (id.indexOf('add:') === 0) {
			this.Select('');
			this.Add(id.slice(4));
		}
		else if (id.indexOf('child:') === 0) {
			this.Add(id.slice(6));
		}
		else if (id === 'focus' && this.Selected) {
			this.Own().Scene.FocusOn(this.Selected);
		}
		else if (id === 'rename') {
			field = this.$Element().querySelector('.elemenx-scene-editor-panel [data-key="Name"] input');

			if (field) {
				field.focus();
				field.select();
			}
		}
		else if (id === 'duplicate') {
			this.Duplicate();
		}
		else if (id === 'delete') {
			this.Picks.slice().forEach(function (one) {
				self.Remove(one);
			});
		}
	},

	Select: function (id) {
		this.Picks = id ? [id] : [];

		if (this.Own().Scene && this.Own().Scene.Select)
			this.Own().Scene.Select(id || '');

		this.Selected = id || '';
		this.GraphStep = '';
		this.Own().RoadPoint = null;

		this.Fields();

		this.Version++;

		this.$Emit('select', {ID: this.Selected});
	},

	Found: function (id) {
		var scene = this.Own().Scene;

		return scene && id ? scene.Get(id) : null;
	},

	/* A new object of a kind where the view looks (on the ground), selected. */
	Add: function (kind, props) {
		var own = this.Own();
		var view = own.Scene.Viewpoint();
		var before = own.Scene.Save();
		var id;
		var given = Object.assign({}, props || {});

		own.Copies++;
		id = given.ID || kind + '-' + Date.now().toString(36) + own.Copies;

		given.ID = id;

		if (this.Space())
			given = Object.assign(this.Orbiting(kind), given);

		if (given.X === undefined && !this.Space())
			given.X = this.Step(view.Target[0], this.SnapMove);

		if (given.Y === undefined && !this.Space())
			given.Y = this.Step(view.Target[2], this.SnapMove);

		own.Scene.Add(kind, given);

		this.Changed(before);
		this.Select(id);

		return id;
	},

	Placed: function (kind) {
		this.Add(kind);
	},

	/* The models it places: none in space, only those the Models Service has. */
	Placeable: function () {
		var models = this.$Service('SceneModels');

		return this.Space() ? [] : (this.Models || []).filter(function (name) {
			return models.Has(name);
		});
	},

	/* A model placed as the kind its Type fits, as large as it is in a game. */
	PlacedModel: function (name) {
		var info = this.$Service('SceneModels').Info(name);
		var kind = this.$Service('SceneModels').KindOf(info.Type) || 'thing';

		return this.Add(kind, {Model: name, Size: info.Size, Name: name});
	},

	/*
	 * Where a new object of a star system goes: round the selected body when it can go round it, else round the one that fits
	 * (a planet, a belt round the star; a moon, a ring, a station, a fleet round a planet), one orbit farther out than the others
	 * of its kind there, at an angle of its own.
	 */
	Orbiting: function (kind) {
		var scene = this.Own().Scene;
		var selected = this.Found(this.Selected);
		var objects = scene.Objects();
		var stars = objects.filter(function (object) {
			return object.Traits.Star;
		});
		var bodies = objects.filter(function (object) {
			return object.Traits.Body && !object.Owner;
		});
		var groups = objects.filter(function (object) {
			return object.Traits.Barycentre;
		});
		/*
		 * What each goes round: a middle of a system (a star, a barycentre, a black hole: planets, belts, black holes and
		 * wormholes), a group (a star round a barycentre), a body (moons, rings), anything natural (what is made).
		 */
		var round = {planet: 'middle', belt: 'middle', blackhole: 'middle', wormhole: 'middle', planetoid: 'middle', star: 'group', moon: 'body', ring: 'body', station: 'natural', outpost: 'natural', craft: 'natural', fleet: 'natural'}[kind];
		var middle = selected && (selected.Traits.Star || selected.Traits.Barycentre || selected.Traits.BlackHole);
		var natural = selected && (selected.Traits.Body || selected.Traits.Star || selected.Traits.BlackHole);
		var parent = null;
		var count;

		/* A giant, a dwarf, what is left of a star: where a star goes, named as its kind is. */
		if (['giant', 'supergiant', 'white-dwarf', 'brown-dwarf', 'neutron-star', 'pulsar', 'magnetar'].indexOf(kind) !== -1)
			return Object.assign(this.Orbiting('star'), {Name: Elemenx.Locale.Text('graphics.scene.kinds.' + kind) + ' ' + (objects.filter(function (object) {
				return object.Kind === kind;
			}).length + 1)});

		/* A cluster: an old ball of stars as a swarm round its middle, its stars added round it one by one. */
		if (kind === 'cluster')
			return {Name: 'Cluster ' + (objects.filter(function (object) {
				return object.Kind === 'cluster';
			}).length + 1), Traits: {Cluster: {Type: 'globular', Radius: 30, Count: 4000, Seed: 'cluster-' + objects.length}}};

		if (!round) return {};

		if (round === 'middle') parent = middle ? selected : groups[0] || stars[0];
		else if (round === 'group') parent = selected && selected.Traits.Barycentre ? selected : null;
		else if (round === 'natural') parent = natural ? selected : bodies[0] || stars[0];
		else parent = selected && selected.Traits.Body ? selected : bodies[0] || stars[0];

		if (!parent) return {};

		count = objects.filter(function (object) {
			return object.Parent === parent.ID && object.Kind === kind;
		}).length;

		if (kind === 'planet' || kind === 'planetoid')
			return {Parent: parent.ID, Name: (kind === 'planet' ? 'Planet ' : 'Planetoid ') + (count + 1), Distance: Math.round(0.4 * Math.pow(1.7, count) * 100) / 100, Anomaly: count * 137 % 360};

		/* A star of a cluster: somewhere inside it, light-years out, on a long tilted orbit of its own. */
		if (kind === 'star' && parent.Traits.Cluster)
			return {Parent: parent.ID, Name: 'Star ' + (count + 1), Traits: {Orbit: {Distance: Math.round((Number(parent.Traits.Cluster.Radius) || 6) * this.$Service('Astronomy').Units.ly * (0.1 + count * 0.618 % 1 * 0.4)), Eccentricity: 0.3, Inclination: count * 67 % 180, Anomaly: count * 137 % 360, Unit: 'AU'}}};

		/* A star of a group: round its barycentre, opposite the one before (a star has no orbit of its kind: told it). */
		if (kind === 'star')
			return {Parent: parent.ID, Name: 'Star ' + (count + 1), Traits: {Orbit: {Distance: Math.round(0.3 * (1 + count * 0.4) * 100) / 100, Anomaly: count * 180 % 360, Unit: 'AU'}}};

		if (kind === 'blackhole' || kind === 'wormhole')
			return {Parent: parent.ID, Distance: Math.round(3 * Math.pow(1.5, count) * 100) / 100, Anomaly: (count * 137 + 60) % 360};

		if (kind === 'moon')
			return {Parent: parent.ID, Name: 'Moon ' + (count + 1), Distance: Math.round(0.0026 * (1 + count * 1.5) * 100000) / 100000, Anomaly: count * 137 % 360};

		if (kind === 'station' || kind === 'outpost' || kind === 'craft')
			return {Parent: parent.ID, Distance: 1.8 + count * 0.6, Anomaly: count * 137 % 360};

		return {Parent: parent.ID};
	},

	Remove: function (id) {
		var own = this.Own();
		var before = own.Scene.Save();

		own.Scene.Remove(id);

		if (this.Selected === id)
			this.Selected = '';

		this.Changed(before);
		this.Select(this.Selected);
	},

	/* Changes of an object, kept for Undo once per action (a drag is one). */
	Change: function (id, changes, before) {
		var own = this.Own();
		var kept = before === undefined ? own.Scene.Save() : before;

		own.Scene.Change(id, changes);

		if (before !== false)
			this.Changed(kept);
	},

	Step: function (value, step) {
		return this.Snap && step > 0 ? Math.round(value / step) * step : Math.round(value * 1000) / 1000;
	},

	/*
	 * The fields of the selected object: where it stands, its turn, its size, then the fields of its kind, and the radius
	 * of the corner of its road chosen: the list the inspector shows (FieldList), each an Input or a Checkbox of ElemenxUI.
	 */
	Fields: function () {
		var object = this.Found(this.Selected);
		var fields;
		var list = [];
		var options;

		if (!object) {
			this.FieldList = [];

			return;
		}

		/* In space a body is where its orbit takes it: its fields are those of its traits. */
		fields = this.Space() ? [['Name', object.Values.Name || '']] : [['Name', object.Values.Name || ''], ['X', object.Values.X || 0], ['Y', object.Values.Y || 0], ['Lift', object.Values.Lift || 0], ['Facing', object.Values.Facing || 0], ['Size', object.Size || 1]];

		Object.keys(object.Traits || {}).forEach(function (name) {
			Object.keys(object.Traits[name] || {}).forEach(function (key) {
				/* What is no text (a graph, a list of records) is edited elsewhere. */
				var value = object.Traits[name][key];
				if (key === 'Blueprint' || key === 'Parameters' || value && typeof value === 'object' && !Array.isArray(value)) return;

				if (Array.isArray(value) && value.some(function (part) {
					return part && typeof part === 'object';
				})) return;

				fields.push([key, value, name]);
			});
		});

		/* A field of a few values (the Type of a nebula, of a star, of a cluster: engine.Options of the scene) is chosen of a list. */
		options = this.Own().Scene && this.Own().Scene.Engine ? this.Own().Scene.Engine().Options || {} : {};

		fields.forEach(function (field) {
			var choices = options[(field[2] || '') + ':' + field[0]];

			list.push({ID: (field[2] || '') + ':' + field[0], Key: field[0], Trait: field[2] || '', Title: field[2] ? field[2] + ' · ' + field[0] : field[0], Value: field[1], Shown: field[1] == null ? '' : Array.isArray(field[1]) ? field[1].join(', ') : String(field[1]), Bool: typeof field[1] === 'boolean', Options: choices ? choices.map(function (one) {
				return {Value: one, Label: one || '—'};
			}) : null});
		});

		this.FieldList = this.ShapeFields(object, list).concat(this.RoadFields(object));
	},

	/*
	 * The shape of an orbit in AU among the fields: its nearest (q, the periapsis) and farthest (Q, the apoapsis) distances
	 * after its Distance, kept as Distance and Eccentricity; Eccentricity and the angle of the periapsis there even when not
	 * given (a new orbit is a circle). An orbit in radii of its parent stays a circle.
	 */
	ShapeFields: function (object, list) {
		var orbit = object.Traits.Orbit;
		var at;
		var shape;

		if (!this.Space() || !orbit || orbit.Unit === 'radii') return list;

		[['Eccentricity', 0], ['Periapsis', 0]].forEach(function (pair) {
			if (orbit[pair[0]] === undefined)
				list.push({ID: 'Orbit:' + pair[0], Key: pair[0], Trait: 'Orbit', Missing: true, Title: 'Orbit · ' + pair[0], Value: pair[1], Shown: String(pair[1]), Bool: false});
		});

		shape = this.ShapeOf(orbit);
		at = list.map(function (field) {
			return field.ID;
		}).indexOf('Orbit:Distance') + 1 || list.length;

		list.splice(at, 0, {ID: 'Orbit:Nearest', Key: 'Nearest', Trait: 'Orbit', Shape: true, Title: Elemenx.Locale.Text('graphics.sceneEditor.nearest'), Value: shape.Nearest, Shown: String(Number(shape.Nearest.toPrecision(4))), Bool: false}, {ID: 'Orbit:Farthest', Key: 'Farthest', Trait: 'Orbit', Shape: true, Title: Elemenx.Locale.Text('graphics.sceneEditor.farthest'), Value: shape.Farthest, Shown: String(Number(shape.Farthest.toPrecision(4))), Bool: false});

		return list;
	},

	/* The nearest and the farthest distances of an orbit (AU) of its Distance (the half of its long axis) and Eccentricity. */
	ShapeOf: function (orbit) {
		var a = this.$Service('Astronomy').Length(orbit.Distance);
		var e = Math.min(0.99, Math.max(0, Number(orbit.Eccentricity) || 0));

		return {Nearest: a * (1 - e), Farthest: a * (1 + e)};
	},

	/*
	 * An orbit of a new nearest (q) or farthest (Q) distance, the other kept: its Distance (q + Q) / 2 and Eccentricity
	 * (Q - q) / (Q + q); q never beyond Q (a circle at the most), the eccentricity below 0.99 (the farthest held back).
	 */
	Reshaped: function (orbit, key, value) {
		var shape = this.ShapeOf(orbit);
		var near = shape.Nearest;
		var far = shape.Farthest;
		var e;

		if (!(value > 0)) return null;

		if (key === 'Nearest') near = Math.min(value, far);
		else far = Math.max(value, near);

		e = (far - near) / (far + near);

		if (e > 0.99) {
			e = 0.99;
			far = near * 1.99 / 0.01;
		}

		return {Traits: {Orbit: {Distance: Number(((near + far) / 2).toPrecision(6)), Eccentricity: Math.round(e * 1e6) / 1e6}}};
	},

	/* A field of the inspector changed (FieldList): its value as its kind is, by the trait's name with it. */
	FieldChanged: function (field, given) {
		var changes = {};
		var road;
		var value = given;

		if (field.Key === 'PointRadius') {
			road = this.RoadOf();

			if (!road) return;

			road.Radii[field.Index] = Math.max(0, Number(given) || 0);

			this.Change(this.Selected, {Radii: road.Radii});

			return;
		}

		if (field.Shape) {
			changes = this.Reshaped(this.Found(this.Selected).Traits.Orbit, field.Key, Number(given));

			if (changes)
				this.Change(this.Selected, changes);

			this.Fields();

			return;
		}

		if (field.Bool) value = !!given;
		else if (typeof field.Value === 'number' || /^(X|Y|Lift|Facing|Size)$/.test(field.Key)) value = given === '' || given === null || given === undefined ? undefined : Number(given) || 0;
		else if (Array.isArray(field.Value)) value = String(given).split(',').map(Number);

		/* A field of a trait by the trait's name with it: Radius of a Body is not the Radius of a Ring; one its kind has not, in the trait. */
		if (field.Missing) {
			changes.Traits = {};
			changes.Traits[field.Trait] = {};
			changes.Traits[field.Trait][field.Key] = value;
		}
		else {
			changes[field.Trait ? field.Trait + field.Key : field.Key] = value;
		}

		this.Change(this.Selected, changes);
	},

	/* Roads */

	/* The types of roads of SceneRoads, for the tool. */
	RoadTypesOf: function () {
		return this.$Service('SceneRoads').Types();
	},

	RoadTyped: function (value) {
		this.RoadType = (value && value.target ? value.target.value : value);
	},

	RoadParted: function (value) {
		this.RoadPart = (value && value.target ? value.target.value : value);
	},

	RoadRadiused: function (value) {
		this.RoadRadius = Math.max(0, Number((value && value.target ? value.target.value : value)) || 0);
	},

	/* The choices of its lists (Select): the types of the sketch by their groups, the types and parts of roads. */
	SketchOptions: function () {
		var options = [];

		this.SketchGroups.forEach(function (group) {
			group.Types.forEach(function (type) {
				options.push({Value: type, Label: type, Group: Elemenx.Locale.Text(group.Key)});
			});
		});

		return options;
	},

	RoadTypeOptions: function () {
		return this.RoadTypesOf().map(function (type) {
			return {Value: type, Label: type};
		});
	},

	RoadPartOptions: function () {
		return this.RoadParts.map(function (part) {
			return {Value: part.ID, Label: Elemenx.Locale.Text(part.Key)};
		});
	},

	/* The road selected: its object, and its points, parts and radii as its spec has them (parts and radii as many as it needs). */
	RoadOf: function () {
		var object = this.Found(this.Selected);
		var given = object && object.Traits && object.Traits.Road;
		var points;
		var count;

		if (!given || !given.Points) return null;

		points = given.Points.map(function (point) {
			return point.slice();
		});
		count = given.Closed === true || given.Closed === 'true' ? points.length : points.length - 1;

		return {
			Object: object,
			Closed: count === points.length,
			Points: points,
			Parts: points.slice(0, count).map(function (point, index) {
				var part = given.Segments ? given.Segments[index] : null;

				return part && typeof part === 'object' ? Object.assign({}, part) : {Kind: part || 'curve', Bulge: 0};
			}),
			Radii: points.map(function (point, index) {
				return given.Radii ? Number(given.Radii[index]) || 0 : 0;
			})
		};
	},

	RoadDown: function (event, handle) {
		var own = this.Own();
		var road = this.RoadOf();
		var match = /^road-(point|mid)-(\d+)$/.exec(handle || '');

		if (match && road) {
			own.Drag = {Kind: 'road-' + match[1], Index: Number(match[2]), X: event.clientX, Y: event.clientY, Before: own.Scene.Save(), Moved: false};

			if (match[1] === 'point')
				this.RoadPick(Number(match[2]));

			return;
		}

		own.Drag = {Kind: 'road-press', X: event.clientX, Y: event.clientY};
	},

	/* A point of the road selected chosen: its corner radius among the fields, Delete takes it away. */
	RoadPick: function (index) {
		this.Own().RoadPoint = index;

		this.Fields();
		this.Gizmo();
	},

	RoadMove: function (drag, event) {
		var road;
		var point;
		var a;
		var b;
		var chord;
		var part;

		if (drag.Kind === 'road-press' || Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) < 4 && !drag.Moved) return;

		road = this.RoadOf();
		point = this.SketchPoint(event);

		if (!road || !point) return;

		drag.Moved = true;

		if (drag.Kind === 'road-point') {
			road.Points[drag.Index] = [point[0], point[1]].concat(road.Points[drag.Index].length > 2 ? [road.Points[drag.Index][2]] : []);

			this.Change(this.Selected, {Points: road.Points}, false);

			return;
		}

		/* The middle of an arc bends it: how far the pointer stands off the straight line, to its left above 0. */
		part = road.Parts[drag.Index];
		a = road.Points[drag.Index];
		b = road.Points[(drag.Index + 1) % road.Points.length];

		if (part.Kind === 'arc') {
			chord = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
			part.Bulge = this.Step(((point[1] - a[1]) * (b[0] - a[0]) - (point[0] - a[0]) * (b[1] - a[1])) / chord, this.SnapMove);

			this.Change(this.Selected, {Segments: road.Parts}, false);

			return;
		}

		/* The middle of a straight or smooth part: a new point there, dragged on as a point. */
		road.Points.splice(drag.Index + 1, 0, [point[0], point[1]]);
		road.Parts.splice(drag.Index + 1, 0, Object.assign({}, part));
		road.Radii.splice(drag.Index + 1, 0, 0);

		this.Change(this.Selected, {Points: road.Points, Segments: road.Parts, Radii: road.Radii}, false);

		drag.Kind = 'road-point';
		drag.Index++;

		this.RoadPick(drag.Index);
	},

	RoadUp: function (drag, event) {
		var own = this.Own();
		var road;
		var part;
		var point;
		var last;
		var next;

		if (drag.Moved) {
			this.Changed(drag.Before);

			return;
		}

		/* A press on the middle of a part: straight, then an arc, then smooth, then straight again. */
		if (drag.Kind === 'road-mid') {
			road = this.RoadOf();

			if (!road) return;

			part = road.Parts[drag.Index];
			next = {line: 'arc', arc: 'curve', curve: 'line'}[part.Kind] || 'line';

			road.Parts[drag.Index] = {Kind: next, Bulge: next === 'arc' ? this.RoadBulge(road, drag.Index) : 0};

			this.Change(this.Selected, {Segments: road.Parts});

			return;
		}

		if (drag.Kind !== 'road-press') return;

		point = this.SketchPoint(event);

		if (!point) return;

		/* A press on the last point of the road drawn ends it; any other adds one. */
		own.Road = own.Road || {Type: this.RoadType, Points: []};
		last = own.Road.Points[own.Road.Points.length - 1];

		if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < Math.max(1.5, this.SnapMove)) {
			this.RoadEnd();

			return;
		}

		own.Road.Points.push(point);

		this.Gizmo();
	},

	/* How far an arc made of a part bends at first: a sixth of its length, to the left. */
	RoadBulge: function (road, index) {
		var a = road.Points[index];
		var b = road.Points[(index + 1) % road.Points.length];

		return Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6 * 100) / 100;
	},

	/* The road drawn made an object of the scene: its type, its parts of the kind of the tool, its corners of its radius. */
	RoadEnd: function () {
		var own = this.Own();
		var drawn = own.Road;
		var scene = own.Scene;
		var before;
		var id;
		var part = this.RoadPart;
		var radius = this.RoadRadius;
		var self = this;

		own.Road = null;

		if (!drawn || drawn.Points.length < 2 || !scene) {
			this.Gizmo();

			return;
		}

		before = scene.Save();
		id = this.RoadName();

		scene.Add('road', {ID: id, Type: drawn.Type, Points: drawn.Points, Segments: drawn.Points.slice(1).map(function (point, index) {
			return {Kind: part, Bulge: part === 'arc' ? self.RoadBulge(drawn, index) : 0};
		}), Radii: drawn.Points.map(function (point, index) {
			return index && index < drawn.Points.length - 1 ? radius : 0;
		})});

		this.Changed(before);
		this.Select(id);
	},

	/* A name of a road not taken yet: road-1, road-2... */
	RoadName: function () {
		var scene = this.Own().Scene;
		var number = 1;

		while (scene.Get('road-' + number))
			number++;

		return 'road-' + number;
	},

	RoadKey: function (event) {
		var own = this.Own();
		var road;
		var index = own.RoadPoint;

		if (own.Road && (event.code === 'Enter' || event.code === 'Escape')) {
			if (event.code === 'Enter') this.RoadEnd();
			else own.Road = null;

			this.Gizmo();

			return true;
		}

		if ((event.code === 'Delete' || event.code === 'Backspace') && index !== null && index !== undefined) {
			road = this.RoadOf();

			/* A road keeps two points at least. */
			if (!road || road.Points.length < 3 || index >= road.Points.length) return true;

			road.Points.splice(index, 1);
			road.Parts.splice(Math.min(index, road.Parts.length - 1), 1);
			road.Radii.splice(index, 1);

			own.RoadPoint = null;

			this.Change(this.Selected, {Points: road.Points, Segments: road.Parts, Radii: road.Radii});

			return true;
		}

		return false;
	},

	/* The radius of the corner at the point chosen of the road selected: an arc between its two straight parts (a field of FieldList). */
	RoadFields: function (object) {
		var index = this.Own().RoadPoint;
		var road = object && object.Traits && object.Traits.Road ? this.RoadOf() : null;
		if (!road || index === null || index === undefined || index >= road.Points.length) return [];

		return [{ID: 'road:' + index, Key: 'PointRadius', Index: index, Trait: '', Title: Elemenx.Locale.Text('graphics.sceneEditor.pointRadius', {point: index + 1}), Value: road.Radii[index] || 0, Shown: String(road.Radii[index] || 0), Bool: false, Number: true}];
	},

	/* The road selected over the view, its points and the middles of its parts to drag; and the road being drawn. */
	RoadDrawing: function (at) {
		var self = this;
		var own = this.Own();
		var road = this.RoadOf();
		var made = road ? (own.Scene.Roads() || []).filter(function (one) {
			return one.ID === self.Selected;
		})[0] : null;
		var parts = [];

		function spot (x, z, y) {
			return at([x, (y === undefined ? self.Height(x, z) : y) + 0.3, z]);
		}

		function line (points, kind) {
			return '<polyline class="elemenx-scene-editor-sketch-shape ' + kind + '" points="' + points.map(function (point) {
				return point.X.toFixed(1) + ',' + point.Y.toFixed(1);
			}).join(' ') + '"></polyline>';
		}

		if (made)
			parts.push(line(made.Points.map(function (point) {
				return spot(point.X, point.Z, point.Y);
			}), 'current'));

		if (road) {
			road.Parts.forEach(function (part, index) {
				var a = road.Points[index];
				var b = road.Points[(index + 1) % road.Points.length];
				var chord = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
				var bend = part.Kind === 'arc' ? part.Bulge : 0;
				var middle = spot((a[0] + b[0]) / 2 - (b[1] - a[1]) / chord * bend, (a[1] + b[1]) / 2 + (b[0] - a[0]) / chord * bend);

				parts.push('<rect class="elemenx-scene-editor-road-mid ' + part.Kind + '" data-handle="road-mid-' + index + '" x="' + (middle.X - 5).toFixed(1) + '" y="' + (middle.Y - 5).toFixed(1) + '" width="10" height="10"></rect>');
			});

			road.Points.forEach(function (point, index) {
				var place = spot(point[0], point[1]);

				parts.push('<circle class="elemenx-scene-editor-road-point' + (own.RoadPoint === index ? ' chosen' : '') + '" data-handle="road-point-' + index + '" cx="' + place.X.toFixed(1) + '" cy="' + place.Y.toFixed(1) + '" r="7"></circle>');
			});
		}

		if (own.Road && own.Road.Points.length) {
			parts.push(line(own.Road.Points.map(function (point) {
				return spot(point[0], point[1]);
			}), 'draft'));

			own.Road.Points.forEach(function (point) {
				var place = spot(point[0], point[1]);

				parts.push('<circle class="elemenx-scene-editor-road-point draft" cx="' + place.X.toFixed(1) + '" cy="' + place.Y.toFixed(1) + '" r="5"></circle>');
			});
		}

		return parts.join('');
	},

	/* The trait of the selected object that has a Blueprint: an effect's, or a ground's. */
	Owner: function () {
		var object = this.Found(this.Selected);
		var found = null;

		Object.keys(object && object.Traits || {}).forEach(function (name) {
			if (!found && object.Traits[name] && object.Traits[name].Blueprint)
				found = object.Traits[name];
		});

		return found;
	},

	/*
	 * The graphs the selected object has to edit under the view: the look of its Blueprint, the World of a ground and the graph
	 * of its step picked in it (the relief of Relief, the rule of Scatter), the rule of a Scatter of its own.
	 */
	/* The kinds of graphs as tabs (Tabs). */
	GraphTabs: function () {
		return this.GraphKinds().map(function (kind) {
			return {ID: kind.ID, Label: Elemenx.Locale.Text(kind.Key)};
		});
	},

	GraphKinds: function () {
		var object = this.Found(this.Selected);
		var step = this.WorldStep();
		var kinds = [];

		if (!object)
			return kinds;

		if (this.Owner()) kinds.push({ID: 'Blueprint', Key: 'graphics.sceneEditor.graphs.look'});
		else if (object.Traits.Star) kinds.push({ID: 'Star', Key: 'graphics.sceneEditor.graphs.look'});
		else if (object.Traits.Nebula) kinds.push({ID: 'Nebula', Key: 'graphics.sceneEditor.graphs.look'});

		if (object.Traits.Terrain)
			kinds.push({ID: 'World', Key: 'graphics.sceneEditor.graphs.world'});

		if (step)
			kinds.push({ID: 'Step', Key: this.StepKeys[step.type].Key});

		if (object.Traits.Scatter && !object.Values.Generated)
			kinds.push({ID: 'Graph', Key: 'graphics.sceneEditor.graphs.rule'});

		return kinds;
	},

	/* The World of the selected ground, a copy of it; null for any other object. */
	World: function () {
		var object = this.Found(this.Selected);
		var graph = object && object.Traits.Terrain ? object.Traits.Terrain.World : null;

		return graph ? JSON.parse(typeof graph === 'string' ? graph : JSON.stringify(graph)) : null;
	},

	/* The step of the World picked in it whose graph is open (StepPicked): a block of Relief or of Scatter of the copy given. */
	WorldStep: function (world) {
		var self = this;
		var graph = world || this.World();

		return graph && this.GraphStep ? graph.blocks.filter(function (block) {
			return block.id === self.GraphStep && (block.type === 'Relief' || block.type === 'Scatter');
		})[0] || null : null;
	},

	/* A block of the World picked: a step that has a graph of its own opens it in a tab. */
	StepPicked: function (event) {
		var world = this.GraphKindOf() === 'World' ? this.World() : null;
		var block = world && event && event.Block ? world.blocks.filter(function (one) {
			return one.id === event.Block;
		})[0] : null;
		if (block && (block.type === 'Relief' || block.type === 'Scatter'))
			this.GraphStep = block.id;
	},

	/* A property of a block of a graph, and one set. */
	Property: function (block, key, value) {
		var found = (block.properties || []).filter(function (property) {
			return property.key === key;
		})[0];

		if (arguments.length < 3)
			return found ? found.value : undefined;

		if (found) found.value = value;
		else block.properties.push({key: key, value: value});
	},

	/* The World of the selected ground with the graph of its open step set (null: none), given to it. */
	StepGraph: function (graph, before) {
		var world = this.World();
		var step = this.WorldStep(world);
		if (!step) return;

		this.Property(step, 'Graph', graph);
		this.Change(this.Selected, {World: world}, before);
	},

	/* The kind of the graph open: the one picked when the object has it, else its first. */
	GraphKindOf: function () {
		var self = this;
		var kinds = this.GraphKinds();
		var found = kinds.filter(function (kind) {
			return kind.ID === self.GraphKind;
		})[0] || kinds[0];

		return found ? found.ID : '';
	},

	GraphPicked: function (kind) {
		this.GraphKind = kind;
	},

	/* The graph open: of its Blueprint, the World of a ground or the graph of its step, or the rule of a Scatter; null when it has none. */
	Graph: function () {
		var kind = this.GraphKindOf();
		var owner = kind === 'Blueprint' ? this.Owner() : null;
		var object = this.Found(this.Selected);
		var step = kind === 'Step' ? this.WorldStep() : null;
		var value;

		if (owner)
			return typeof owner.Blueprint === 'string' ? JSON.parse(owner.Blueprint) : owner.Blueprint;

		if (kind === 'World') value = object.Traits.Terrain.World;
		else if (step) value = this.Property(step, 'Graph');
		else if (kind === 'Graph') value = object.Traits.Scatter.Graph;

		return value ? typeof value === 'string' ? JSON.parse(value) : value : null;
	},

	/*
	 * A graph of the library for what is open: a usual World; the relief of a step of Relief as its land makes it; the rule of
	 * a Scatter as it sows with none (a step of the World its Seed set, when it has none, to its own id); the look of a star.
	 */
	GraphMade: function () {
		var kind = this.GraphKindOf();
		var object = this.Found(this.Selected);
		var world;
		var step;
		var rule;

		if (!object || kind === 'Blueprint') return;

		/* A star: the look of the library (its prominences rising and falling over a round), its parameters to tune. */
		if (kind === 'Star') {
			this.Change(this.Selected, {Traits: {Star: {Blueprint: this.Own().Scene.LibraryStar(), Parameters: {}}}});

			return;
		}

		/* A nebula: the look of the library (it breathes and turns), its parameters to tune. */
		if (kind === 'Nebula') {
			this.Change(this.Selected, {Traits: {Nebula: {Blueprint: this.Own().Scene.LibraryNebula(), Parameters: {}}}});

			return;
		}

		if (kind === 'World') {
			this.Change(this.Selected, {World: this.$Service('SceneWorld').Library({})});

			return;
		}

		if (kind === 'Graph') {
			this.Change(this.Selected, {Graph: this.$Service('SceneSower').LibraryScatter(Object.assign({ID: object.ID}, object.Traits.Scatter, object.Values))});

			return;
		}

		world = this.World();
		step = this.WorldStep(world);

		if (!step) return;

		if (step.type === 'Relief') {
			this.Property(step, 'Graph', this.$Service('SceneTerrainGenerator').LibraryRelief(this.$Service('SceneWorld').Make(object.Traits.Terrain.World).Ground || {}));
		}
		else {
			if (!this.Property(step, 'Seed'))
				this.Property(step, 'Seed', step.id);

			rule = {};

			(step.properties || []).forEach(function (property) {
				if (property.value !== '' && property.value !== null && property.value !== undefined)
					rule[property.key] = property.value;
			});

			this.Property(step, 'Graph', this.$Service('SceneSower').LibraryScatter(rule));
		}

		this.Change(this.Selected, {World: world});
	},

	GraphCleared: function () {
		var kind = this.GraphKindOf();

		if (kind === 'Step') this.StepGraph(null);
		else if (kind === 'Graph') this.Change(this.Selected, {Graph: null});
	},

	/* What is amiss with the lands by their climate of the selected ground (SceneBiomes.Check), made again with the scene. */
	Lands: function () {
		var own = this.Own();
		var object = this.Found(this.Selected);
		var ground = own.Scene && own.Scene.Scene().Ground;
		var key = this.Selected + ':' + this.Version;
		var biomes = object && object.Traits.Terrain && ground && ground.Field && ground.Field.Options ? ground.Field.Options.Biomes : null;
		var phrases = this.LandPhrases;

		/* What a message of a problem says, its numbers as text. */
		function words (problem) {
			function range (pair) {
				return pair ? pair[0].toFixed(2) + '–' + pair[1].toFixed(2) : '';
			}

			return {biome: problem.Biome || '', key: problem.Of || '', from: problem.Heights ? problem.Heights[0].toFixed(2) : '', to: problem.Heights ? problem.Heights[1].toFixed(2) : '', wet: range(problem.Moisture), warm: range(problem.Temperature), part: problem.Part === undefined ? '' : String(problem.Part)};
		}

		if (!Array.isArray(biomes) || !biomes.length || !ground || !ground.Field || ground.Field.Whole) return [];

		if (own.Lands && own.Lands.Key === key) return own.Lands.List;

		own.Lands = {Key: key, List: this.$Service('SceneBiomes').Check(biomes, ground.Field).Problems.map(function (problem, index) {
			return Object.assign({Key: problem.Type + ':' + index, Phrase: phrases.filter(function (phrase) {
				return phrase.Type === problem.Type;
			})[0].Key, Words: words(problem)}, problem);
		})};

		return own.Lands.List;
	},

	/* The parameters of its Blueprint with the values the object gives them: what a level sets of one graph. */
	Exposed: function () {
		var owner = this.GraphKindOf() === 'Blueprint' ? this.Owner() : null;
		var graph = owner ? this.Graph() : null;
		var values = owner && owner.Parameters || {};

		return (graph && graph.parameters || []).map(function (parameter) {
			var value = Object.prototype.hasOwnProperty.call(values, parameter.key) ? values[parameter.key] : parameter.value;

			return {key: parameter.key, type: parameter.type, Shown: Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)};
		});
	},

	Tuned: function (key, value) {
		var owner = this.Owner();
		var text = String(value === undefined || value === null ? '' : value);
		var parameters = Object.assign({}, owner && owner.Parameters || {});

		parameters[key] = /^#/.test(text) ? text : text.indexOf(',') !== -1 ? text.split(',').map(Number) : text === 'true' || text === 'false' ? text === 'true' : isNaN(Number(text)) ? text : Number(text);

		this.Change(this.Selected, {Parameters: parameters});
	},

	/* The graph edited: a copy of it given to the object, so what was made of the one before is not taken for it. */
	/* What the scene told of a graph that did not compile: kept by its owner, shown on the blocks of the graph open. */
	ShaderTold: function (event) {
		var own = this.Own();

		own.Errors = own.Errors || {};
		own.Errors[event.Owner] = event.Errors;

		this.Told++;
	},

	/* The errors of the graph open: of the object selected, or of the graph by its name (one graph for many). */
	GraphErrors: function () {
		var own = this.Own();
		var graph = this.Graph();
		var errors = own.Errors || {};

		return errors[this.Selected] || graph && graph.name && errors[graph.name] || null;
	},

	Drawn: function (graph) {
		var before = this.Graph();
		var changes = {};
		var laid;

		/* A graph as it is, its places left out. */
		function shape (one) {
			return JSON.stringify(one, function (key, value) {
				return ['x', 'y', 'x1', 'y1', 'x2', 'y2'].indexOf(key) === -1 ? value : undefined;
			});
		}

		/* Laid out by the editor of the graph as it opened (its blocks all at 0, 0): no change of the user, nothing to undo. */
		laid = !!before && before.blocks.length > 1 && before.blocks.every(function (block) {
			return !block.x && !block.y;
		}) && shape(before) === shape(graph);

		if (this.GraphKindOf() === 'Step') {
			this.StepGraph(JSON.parse(JSON.stringify(graph)), laid ? false : undefined);

			return;
		}

		changes[this.GraphKindOf() || 'Blueprint'] = JSON.parse(JSON.stringify(graph));

		this.Change(this.Selected, changes, laid ? false : undefined);
	},

	Pick: function (tool) {
		this.Tool = tool;
		this.Own().Draft = null;

		this.SketchItems();
	},

	Snapped: function (checked) {
		this.Snap = !!(checked && checked.target ? checked.target.checked : checked);
	},

	/* Play */

	Toggled: function () {
		if (this.Playing) this.Stop();
		else this.Play();
	},

	Play: function () {
		var own = this.Own();
		var hero;

		if (this.Playing || !own.Scene) return;

		own.Played = own.Scene.Save();
		hero = own.Scene.Objects(function (object) {
			return !!object.Values.Hero;
		})[0];

		this.Playing = true;
		own.Scene.Paused = false;

		if (hero)
			own.Scene.Control(hero.ID);

		this.$Emit('play', {Playing: true});
	},

	Stop: function () {
		var own = this.Own();

		if (!this.Playing) return;

		own.Scene.Paused = true;

		own.Scene.Control('');
		own.Scene.Load(own.Played);

		this.Playing = false;
		this.Version++;

		this.$Emit('play', {Playing: false});
	},

	/* The view, as Unreal flies it */

	Local: function (event) {
		var box = this.$Ref('View').getBoundingClientRect();

		return {X: event.clientX - box.left, Y: event.clientY - box.top};
	},

	Down: function (event) {
		var own = this.Own();
		var scene = own.Scene;
		var view;
		var handle;
		var object;

		if (!scene) return;

		event.currentTarget.focus({preventScroll: true});

		view = scene.Viewpoint();
		handle = event.target.getAttribute && event.target.getAttribute('data-handle');

		if (event.currentTarget.setPointerCapture)
			event.currentTarget.setPointerCapture(event.pointerId);

		event.preventDefault();

		if (event.button === 2) {
			own.Drag = {Kind: 'look', X: event.clientX, Y: event.clientY, View: view};

			return;
		}

		if (event.button === 1) {
			own.Drag = {Kind: 'pan', X: event.clientX, Y: event.clientY, View: view};

			return;
		}

		if (event.altKey) {
			own.Drag = {Kind: 'orbit', X: event.clientX, Y: event.clientY, View: view};

			return;
		}

		object = this.Found(this.Selected);

		/* The roads: a handle of the road selected, or a press that adds a point to the one drawn. */
		if (this.Tool === 'road') {
			this.RoadDown(event, handle);

			return;
		}

		if (handle && object) {
			own.Drag = {Kind: handle, X: event.clientX, Y: event.clientY, Before: scene.Save(), Values: {X: Number(object.Values.X) || 0, Y: Number(object.Values.Y) || 0, Lift: Number(object.Values.Lift) || 0, Facing: Number(object.Values.Facing) || 0, Size: object.Size || 1, Inclination: Number((object.Traits.Orbit || {}).Inclination) || 0, Tilt: Number((object.Traits.Body || {}).Tilt) || 0, Radius: Number((object.Traits.Body || {}).Radius) || 0}, World: (object.World || [0, 0, 0]).slice(), Moved: false};

			return;
		}

		/* The sketch draws with the left button. */
		if (this.Tool === 'sketch') {
			own.Drag = {Kind: 'sketch', X: event.clientX, Y: event.clientY};

			this.SketchDown(event);

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
		var under;

		/* With no drag, what is under the pointer is outlined (Hovered of the scene), a few times a second at most. */
		if (!drag && scene && this.Tool === 'select' && Date.now() - (own.Hovering || 0) > 80) {
			own.Hovering = Date.now();
			under = scene.Pick(event.clientX, event.clientY, true);
			scene.Hovered = under && scene.Selection().indexOf(under) === -1 ? under : '';
		}

		if (!drag || !scene) return;

		dx = event.clientX - drag.X;
		dy = event.clientY - drag.Y;

		if (drag.Kind === 'look') {
			this.Look(drag.View, dx, dy);

			return;
		}

		if (drag.Kind === 'orbit') {
			scene.SetViewpoint({Target: drag.View.Target, Yaw: drag.View.Yaw - dx * 0.006, Pitch: drag.View.Pitch + dy * 0.006, Distance: drag.View.Distance});

			return;
		}

		if (drag.Kind === 'pan') {
			this.Pan(drag.View, dx, dy);

			return;
		}

		if (drag.Kind === 'sketch') {
			this.SketchMove(event);

			return;
		}

		if (drag.Kind.indexOf('road') === 0) {
			this.RoadMove(drag, event);

			return;
		}

		if (drag.Kind === 'press') return;

		drag.Moved = true;

		this.Handle(drag, event);
	},

	Up: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var scene = own.Scene;
		var menu;

		own.Drag = null;

		if (!drag || !scene) return;

		/* The right button that did not look round: the context menu at it. */
		if (drag.Kind === 'look' && Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) < 4) {
			menu = this.$Ref('Context', true);

			if (menu)
				menu.Show(event.target, event.clientX, event.clientY);

			return;
		}

		if (drag.Kind === 'sketch') {
			this.SketchUp(event);

			return;
		}

		if (drag.Kind.indexOf('road') === 0) {
			this.RoadUp(drag, event);

			return;
		}

		/* A press that did not move selects what it is on (any object), or nothing. */
		if (drag.Kind === 'press' && Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) < 4) {
			this.Select(scene.Pick(event.clientX, event.clientY, true));

			return;
		}

		if (drag.Before && drag.Moved)
			this.Changed(drag.Before);
	},

	/*
	 * The right button opens the context menu as Unreal does: when it did not look round (the menu of the system is never
	 * the scene's; a long press of a finger opens it by ContextMenu).
	 */
	Menu: function (event) {
		event.preventDefault();
		event.stopPropagation();
	},

	/* The fingers on the view (ViewTouch): one edits, two move the camera; Hand gives one finger to the camera too. */
	Fingers: function () {
		var own = this.Own();
		var self = this;

		if (!own.Touch) {
			own.Touch = this.$Service('ViewTouch').Make({
				Edit: {Down: function (event) {
					self.Down(event);
				}, Move: function (event) {
					self.Move(event);
				}, Up: function (event) {
					self.Up(event);
				}},
				Camera: function (gesture) {
					if (own.Scene)
						self.$Service('ViewTouch').Orbit(own.Scene, gesture);
				},
				Abort: function () {
					self.Abort();
				},
				OneFinger: function () {
					return !!self.Hand;
				}
			});
		}

		return own.Touch;
	},

	TouchDown: function (event) {
		this.Fingers().Down(event);
	},

	TouchMove: function (event) {
		this.Fingers().Move(event);
	},

	TouchUp: function (event) {
		this.Fingers().Up(event);
	},

	/* What a press began, let go as it was (a second finger came to it): a move of the gizmo undone, a sketch just begun dropped. */
	Abort: function () {
		var own = this.Own();
		var drag = own.Drag;
		var draft = own.Draft;
		var kind = draft ? this.SketchKind(draft.Type) : '';

		own.Drag = null;

		if (!drag || !own.Scene) return;

		if (drag.Kind === 'sketch' && kind === 'stroke') own.Draft = null;
		else if (drag.Kind === 'sketch' && kind === 'circle') own.Draft = draft.Source ? {Type: draft.Type, Source: draft.Source, Radius: draft.Radius} : null;

		if (drag.Before && drag.Moved)
			this.Recall(drag.Before);

		this.Fields();
		this.Gizmo();
	},

	Handed: function (event) {
		this.Hand = !!event.Hand;
	},

	/* The actions of the view: in the bar over it (ViewActions) and in its context menu. */
	Actions: function () {
		var object = this.Found(this.Selected);
		var list = [];

		if (this.Tool === 'sketch' || this.Tool === 'road') {
			list.push({ID: 'done', Icon: 'check', Label: Elemenx.Locale.Text('graphics.viewActions.done')});
			list.push({ID: 'cancel', Icon: 'close', Label: Elemenx.Locale.Text('graphics.viewActions.cancel')});
		}

		list.push({ID: 'frame', Icon: 'maximize', Label: Elemenx.Locale.Text('graphics.viewActions.frame'), Disabled: !object || !object.World});

		if (!this.Space())
			list.push({ID: 'drop', Icon: 'arrow-down', Label: Elemenx.Locale.Text('graphics.viewActions.drop'), Disabled: !object});

		list.push({ID: 'duplicate', Icon: 'copy', Label: Elemenx.Locale.Text('graphics.viewActions.duplicate'), Disabled: !object});
		list.push({ID: 'delete', Icon: 'delete', Label: Elemenx.Locale.Text('graphics.viewActions.delete'), Disabled: !object, Danger: true});

		return list;
	},

	Acted: function (event) {
		var own = this.Own();
		var id = event.ID || event;

		if (id === 'done' && this.Tool === 'road') this.RoadKey({code: 'Enter'});
		else if (id === 'cancel' && this.Tool === 'road') this.RoadKey({code: 'Escape'});
		else if (id === 'done') this.SketchEnd();
		else if (id === 'cancel') own.Draft = null;
		else if (id === 'frame') this.Frame();
		else if (id === 'drop') this.Drop();
		else if (id === 'duplicate') this.Duplicate();
		else if (id === 'delete' && this.Selected) this.TreePicked({Item: {ID: 'delete'}});

		this.Gizmo();
	},

	/* A context menu opens on what is under it: that is selected first. */
	MenuOpened: function (event) {
		var scene = this.Own().Scene;
		if (scene && event.Target && event.Target.getAttribute && !event.Target.getAttribute('data-handle'))
			this.Select(scene.Pick(event.X, event.Y, true));
	},

	MenuPicked: function (event) {
		this.Acted({ID: event.Item.ID});
	},

	/* The view looks at the selected object. */
	Frame: function () {
		var scene = this.Own().Scene;
		var object = this.Found(this.Selected);
		if (!scene || !object || !object.World) return;

		scene.SetViewpoint({Target: object.World.slice(), Yaw: scene.Viewpoint().Yaw, Pitch: Math.max(0.2, scene.Viewpoint().Pitch), Distance: Math.max(3, (object.Size || 1) * 6)});
	},

	/* The selected object down on the ground. */
	Drop: function () {
		if (this.Found(this.Selected) && !this.Space())
			this.Change(this.Selected, {Lift: 0});
	},

	/* A copy of the selected object beside it; in space round the same body, a little farther on its orbit. */
	Duplicate: function () {
		var object = this.Found(this.Selected);
		if (!object) return;

		if (this.Space()) this.Add(object.Kind, {Parent: object.Parent, Name: object.Values.Name, Traits: this.Copied(object.Traits)});
		else this.Add(object.Kind, Object.assign({}, object.Values, {ID: undefined, X: (Number(object.Values.X) || 0) + 1}));
	},

	/* The axes of the view over the ground: ahead, to the right, from its yaw (the eye looks along -Z at yaw 0). */
	Axes: function (view) {
		return {Ahead: [-Math.sin(view.Yaw) * Math.cos(view.Pitch), -Math.sin(view.Pitch), -Math.cos(view.Yaw) * Math.cos(view.Pitch)], Right: [Math.cos(view.Yaw), 0, -Math.sin(view.Yaw)]};
	},

	/* Looks round from where the eye stands: what it looks at goes round it. */
	Look: function (from, dx, dy) {
		var scene = this.Own().Scene;
		var yaw = from.Yaw - dx * 0.005;
		var pitch = Math.max(-1.5, Math.min(1.5, from.Pitch + dy * 0.005));
		var ahead = this.Axes({Yaw: yaw, Pitch: pitch}).Ahead;
		var eye = from.Eye;

		scene.SetViewpoint({Target: [eye[0] + ahead[0] * from.Distance, eye[1] + ahead[1] * from.Distance, eye[2] + ahead[2] * from.Distance], Yaw: yaw, Pitch: pitch, Distance: from.Distance});
	},

	Pan: function (from, dx, dy) {
		var scene = this.Own().Scene;
		var axes = this.Axes(from);
		var step = from.Distance * 0.0015;

		scene.SetViewpoint({Target: [from.Target[0] - axes.Right[0] * dx * step, from.Target[1] + dy * step, from.Target[2] - axes.Right[2] * dx * step], Yaw: from.Yaw, Pitch: from.Pitch, Distance: from.Distance});
	},

	Wheeled: function (event) {
		var scene = this.Own().Scene;
		var view;

		if (!scene) return;

		event.preventDefault();

		view = scene.Viewpoint();

		scene.SetViewpoint({Target: view.Target, Yaw: view.Yaw, Pitch: view.Pitch, Distance: view.Distance * (event.deltaY > 0 ? 1.15 : 1 / 1.15)});
	},

	/* While the right button is held W A S D Q E fly the view, a step a frame. */
	Fly: function () {
		var own = this.Own();
		var keys = own.Keys;
		var scene = own.Scene;
		var view;
		var axes;
		var step;
		var move = [0, 0, 0];

		if (!scene || !own.Drag || own.Drag.Kind !== 'look') return;
		if (!keys.KeyW && !keys.KeyS && !keys.KeyA && !keys.KeyD && !keys.KeyQ && !keys.KeyE) return;

		view = scene.Viewpoint();
		axes = this.Axes(view);
		step = Math.max(0.05, view.Distance * 0.02) * (keys.ShiftLeft || keys.ShiftRight ? 3 : 1);

		if (keys.KeyW)
			move = [move[0] + axes.Ahead[0], move[1] + axes.Ahead[1], move[2] + axes.Ahead[2]];

		if (keys.KeyS)
			move = [move[0] - axes.Ahead[0], move[1] - axes.Ahead[1], move[2] - axes.Ahead[2]];

		if (keys.KeyD)
			move = [move[0] + axes.Right[0], move[1], move[2] + axes.Right[2]];

		if (keys.KeyA)
			move = [move[0] - axes.Right[0], move[1], move[2] - axes.Right[2]];

		if (keys.KeyE)
			move[1] += 1;

		if (keys.KeyQ)
			move[1] -= 1;

		scene.SetViewpoint({Target: [view.Target[0] + move[0] * step, view.Target[1] + move[1] * step, view.Target[2] + move[2] * step], Yaw: view.Yaw, Pitch: view.Pitch, Distance: view.Distance});

		/* The look goes on from where the eye has come to, at the angles it started from. */
		own.Drag.View = Object.assign({}, own.Drag.View, {Eye: scene.Viewpoint().Eye});
	},

	Key: function (event) {
		var own = this.Own();
		var flying = own.Drag && own.Drag.Kind === 'look';
		var object = this.Found(this.Selected);
		var tools = {KeyQ: 'select', KeyW: 'move', KeyE: 'turn', KeyR: 'scale', KeyB: 'sketch', KeyT: 'road'};

		own.Keys[event.code] = true;

		/* A road being drawn: Enter ends it, Escape lets it go; Delete takes the point chosen of the road selected away. */
		if (this.Tool === 'road' && this.RoadKey(event)) return;

		/* A line or an area being drawn: Enter ends it, Escape lets it go. */
		if (this.Tool === 'sketch' && own.Draft && (event.code === 'Enter' || event.code === 'Escape')) {
			if (event.code === 'Enter') this.SketchEnd();
			else own.Draft = null;

			return;
		}

		if (flying) {
			event.preventDefault();

			return;
		}

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

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyD' && object) {
			event.preventDefault();

			this.Duplicate();

			return;
		}

		if (tools[event.code] && !event.ctrlKey && !event.metaKey) {
			this.Pick(tools[event.code]);

			return;
		}

		if (event.code === 'Delete' && this.Selected) {
			this.Remove(this.Selected);

			return;
		}

		if (event.code === 'KeyF' && object && object.World) {
			this.Frame();

			return;
		}

		if (event.code === 'End' && object)
			this.Drop();
	},

	Copied: function (traits) {
		var copy = JSON.parse(JSON.stringify(traits || {}));
		if (copy.Orbit)
			copy.Orbit.Anomaly = ((Number(copy.Orbit.Anomaly) || 0) + 40) % 360;

		return copy;
	},

	KeyUp: function (event) {
		delete this.Own().Keys[event.code];
	},

	Blurred: function () {
		this.Own().Keys = {};
	},

	/* The sketch: on the ground of the scene (its Terrain trait), in layers; each item drawn by the tool of its type. */

	Ground: function () {
		var scene = this.Own().Scene;

		return scene ? scene.Objects(function (object) {
			return !!(object.Traits && object.Traits.Terrain);
		})[0] || null : null;
	},

	/*
	 * The step Sketch of a World (a copy of a graph): the first that runs; with none and make, the one turned off of its
	 * template turned on (Regression: a second one was put beside it, and the first Sketch of the graph stayed empty), else
	 * one put before its end.
	 */
	SketchStep: function (world, make) {
		var blueprints = this.$Service('Blueprints');
		var found = world.blocks.filter(function (block) {
			return block.type === 'Sketch' && block.enabled !== false;
		})[0];
		var off = world.blocks.filter(function (block) {
			return block.type === 'Sketch' && block.enabled === false;
		})[0];
		var end;
		var into;

		if (found || !make)
			return found || null;

		if (off) {
			off.enabled = true;

			return off;
		}

		end = world.blocks.filter(function (block) {
			return block.type === 'Terrain';
		})[0];

		if (!end)
			return null;

		found = blueprints.Add(world, 'Sketch', {x: end.x, y: end.y + 180});
		into = world.links.filter(function (link) {
			var pin = blueprints.PinById(world, link.p2);

			return pin && pin.Block.id === end.id && pin.Pin.key === 'Land';
		})[0];

		/* What came to the end comes to the sketch, and the sketch to the end. */
		if (into) {
			world.links.splice(world.links.indexOf(into), 1);

			blueprints.Link(world, into.p1, [found.id, 'Land']);
		}

		blueprints.Link(world, [found.id, 'Land'], [end.id, 'Land']);

		return found;
	},

	/* A copy of the sketch of the ground (of the step Sketch of its World), with a layer at least. */
	SketchOf: function () {
		var ground = this.Ground();
		var graph = ground && ground.Traits.Terrain.World;
		var world = graph ? JSON.parse(typeof graph === 'string' ? graph : JSON.stringify(graph)) : null;
		var step = world ? this.SketchStep(world, false) : null;
		var sketch = step && this.Property(step, 'Sketch') ? JSON.parse(JSON.stringify(this.Property(step, 'Sketch'))) : {Layers: []};
		if (!sketch.Layers.length)
			sketch.Layers.push({ID: 'base', Name: 'Base', Visible: true, Strength: 1, Items: []});

		return sketch;
	},

	SaveSketch: function (sketch) {
		var ground = this.Ground();
		var graph = ground && ground.Traits.Terrain.World;
		var world = graph ? JSON.parse(typeof graph === 'string' ? graph : JSON.stringify(graph)) : null;
		var step = world ? this.SketchStep(world, true) : null;
		if (!step) return;

		this.Property(step, 'Sketch', sketch);
		this.Change(ground.ID, {World: world});
		this.SketchItems();
	},

	Layers: function () {
		return this.Ground() ? this.SketchOf().Layers : [];
	},

	/* The layer new items go into: the one picked, else the last. */
	Layer: function (sketch) {
		var self = this;

		return sketch.Layers.filter(function (layer) {
			return layer.ID === self.SketchLayer;
		})[0] || sketch.Layers[sketch.Layers.length - 1];
	},

	AddLayer: function () {
		var sketch = this.SketchOf();
		var id = 'layer-' + (sketch.Layers.length + 1);

		sketch.Layers.push({ID: id, Name: 'Layer ' + (sketch.Layers.length + 1), Visible: true, Strength: 1, Items: []});

		this.SketchLayer = id;

		this.SaveSketch(sketch);
	},

	LayerPicked: function (id) {
		this.SketchLayer = id;

		this.SketchItems();
	},

	LayerShown: function (id) {
		var sketch = this.SketchOf();

		sketch.Layers.forEach(function (layer) {
			if (layer.ID === id)
				layer.Visible = layer.Visible === false;
		});

		this.SaveSketch(sketch);
	},

	SketchPicked: function (value) {
		this.SketchType = (value && value.target ? value.target.value : value);
		this.Own().Draft = null;
	},

	/* The kind of a type: stroke, line, area or circle. */
	SketchKind: function (type) {
		var groups = this.SketchGroups;
		var i;

		for (i = 0; i < groups.length; i++) {
			if (groups[i].Types.indexOf(type) !== -1) return groups[i].Kind;
		}

		return 'stroke';
	},

	/* The point of the ground under the pointer: [x, z], to the grid with Snap. */
	SketchPoint: function (event) {
		var at = this.Own().Scene.GroundAt(event.clientX, event.clientY);

		return at ? [this.Step(at[0], this.SnapMove), this.Step(at[2], this.SnapMove)] : null;
	},

	Height: function (x, z) {
		var scene = this.Own().Scene;
		var ground = scene && scene.Scene().Ground;

		return ground ? Math.max(0, ground.Field.Height(x, z)) : 0;
	},

	/* An item of the type in hand, with its first values, into the layer: what a mask holds frozen, what a stamp carries. */
	AddItem: function (item) {
		var sketch = this.SketchOf();
		var layer = this.Layer(sketch);
		var self = this;
		var biomes = this.$Service('SceneBiomes');
		var count = 0;
		var made = Object.assign({}, this.SketchFields[item.Type] || {}, item);

		sketch.Layers.forEach(function (one) {
			count += one.Items.length;
		});

		made.ID = made.ID || made.Type + '-' + (count + 1);

		/* A mountain drawn small is a hill, not a column: its height after its radius, as the first values have them. */
		if (made.Type === 'mountain' && item.Height === undefined)
			made.Height = Math.round(made.Radius * this.SketchFields.mountain.Height / this.SketchFields.mountain.Radius * 0.6 * 10) / 10;

		if (made.Type === 'biome' && biomes.Has(made.Biome))
			made.Palette = biomes.Get(made.Biome).Ground;

		/* A mask keeps the heights it covers as they are now. */
		if (made.Type === 'mask') {
			var low = [Infinity, Infinity];
			var high = [-Infinity, -Infinity];
			var side = 48;
			var data = [];
			var row;
			var column;

			made.Points.forEach(function (point) {
				low = [Math.min(low[0], point[0]), Math.min(low[1], point[1])];
				high = [Math.max(high[0], point[0]), Math.max(high[1], point[1])];
			});

			for (row = 0; row < side; row++) {
				for (column = 0; column < side; column++)
					data.push(Math.round(self.Own().Scene.Scene().Ground.Field.Height(low[0] + (high[0] - low[0]) * column / (side - 1), low[1] + (high[1] - low[1]) * row / (side - 1)) * 1000) / 1000);
			}

			made.Heights = {Bounds: [low[0], low[1], high[0], high[1]], Side: side, Data: data};
		}

		layer.Items.push(made);

		this.SaveSketch(sketch);

		return made;
	},

	/* A stamp carries the heights round its source, from 0 at their lowest to 1 at their highest; its Height their span. */
	StampOf: function (at, radius) {
		var field = this.Own().Scene.Scene().Ground.Field;
		var side = 32;
		var heights = [];
		var low = Infinity;
		var high = -Infinity;
		var row;
		var column;

		for (row = 0; row < side; row++) {
			for (column = 0; column < side; column++) {
				var h = field.Height(at[0] - radius + radius * 2 * column / (side - 1), at[1] - radius + radius * 2 * row / (side - 1));

				heights.push(h);

				low = Math.min(low, h);
				high = Math.max(high, h);
			}
		}

		return {Height: Math.round((high - low) * 1000) / 1000, Data: {Side: side, Heights: heights.map(function (h) {
			return Math.round((h - low) / Math.max(1e-6, high - low) * 1000) / 1000;
		})}};
	},

	SketchDown: function (event) {
		var own = this.Own();
		var point = this.SketchPoint(event);
		var kind = this.SketchKind(this.SketchType);

		if (!point) return;

		if (kind === 'stroke') own.Draft = {Type: this.SketchType, Points: [point]};
		else if (kind === 'circle') own.Draft = {Type: this.SketchType, At: point, Radius: this.SketchFields[this.SketchType].Radius, Source: own.Draft && own.Draft.Source};
	},

	SketchMove: function (event) {
		var own = this.Own();
		var draft = own.Draft;
		var point;
		var last;

		if (!draft) return;

		point = this.SketchPoint(event);

		if (!point) return;

		if (draft.Points && this.SketchKind(draft.Type) === 'stroke') {
			last = draft.Points[draft.Points.length - 1];

			if (Math.hypot(point[0] - last[0], point[1] - last[1]) >= Math.max(0.5, (this.SketchFields[draft.Type].Radius || 8) * 0.4))
				draft.Points.push(point);
		}
		else if (draft.At) {
			draft.Radius = Math.max(2, this.Step(Math.hypot(point[0] - draft.At[0], point[1] - draft.At[1]), this.SnapMove));
			draft.Dragged = true;
		}
	},

	SketchUp: function (event) {
		var own = this.Own();
		var draft = own.Draft;
		var kind = this.SketchKind(this.SketchType);
		var point = this.SketchPoint(event);

		if (kind === 'stroke' && draft && draft.Points) {
			own.Draft = null;

			this.AddItem({Type: draft.Type, Points: draft.Points});

			return;
		}

		/* A stamp: its first press takes the ground there, its second sets it down. */
		if (kind === 'circle' && draft && draft.At) {
			if (draft.Type === 'stamp' && !draft.Source) {
				own.Draft = {Type: 'stamp', Source: this.StampOf(draft.At, draft.Radius), Radius: draft.Radius};

				return;
			}

			own.Draft = null;

			this.AddItem(Object.assign({Type: draft.Type, At: draft.At, Radius: draft.Radius}, draft.Source || {}));

			return;
		}

		if (!point || kind === 'stroke' || kind === 'circle') return;

		/* A line or an area: a point a press, and a press again on its last point ends it. */
		if (!draft || !draft.Points || draft.Type !== this.SketchType)
			draft = own.Draft = {Type: this.SketchType, Points: []};

		var last = draft.Points[draft.Points.length - 1];

		if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < Math.max(1.5, this.SnapMove)) {
			this.SketchEnd();

			return;
		}

		draft.Points.push(point);
	},

	SketchEnd: function () {
		var own = this.Own();
		var draft = own.Draft;
		var kind = draft ? this.SketchKind(draft.Type) : '';

		own.Draft = null;

		if (!draft || !draft.Points) return;
		if (kind === 'line' && draft.Points.length < 2) return;
		if (kind === 'area' && draft.Points.length < 3) return;

		this.AddItem({Type: draft.Type, Points: draft.Points});
	},

	/* The items of the layer in hand, each with its fields and a button that takes it away: the list the inspector shows (ItemList). */
	SketchItems: function () {
		var self = this;
		var layer;

		if (this.Tool !== 'sketch' || !this.Ground()) {
			this.ItemList = [];

			return;
		}

		layer = this.Layer(this.SketchOf());

		this.ItemList = layer.Items.map(function (item, index) {
			return {ID: item.ID, Index: index, Fields: Object.keys(Object.assign({Strength: 1}, self.SketchFields[item.Type] || {})).map(function (key) {
				return {Key: key, Shown: item[key] === undefined ? key === 'Strength' ? '1' : '' : String(item[key])};
			})};
		});
	},

	/* An item of the sketch taken away. */
	ItemRemoved: function (index) {
		var copy = this.SketchOf();

		this.Layer(copy).Items.splice(index, 1);
		this.SaveSketch(copy);
	},

	/* A field of an item of the sketch changed: texts stay texts (a biome, a role, a team, names of shapes by commas), the rest are numbers. */
	ItemChanged: function (index, key, given) {
		var copy = this.SketchOf();
		var target = this.Layer(copy).Items[index];
		var item = this.Layer(this.SketchOf()).Items[index];
		var text = String(given === undefined || given === null ? '' : given);

		if (!target) return;

		if (key === 'Shapes') target[key] = text.split(',').map(function (name) {
			return name.trim();
		}).filter(Boolean);
		else target[key] = typeof (this.SketchFields[item.Type] || {})[key] === 'string' ? text : Number(text) || 0;

		if (key === 'Biome' && this.$Service('SceneBiomes').Has(text))
			target.Palette = this.$Service('SceneBiomes').Get(text).Ground;

		this.SaveSketch(copy);
	},

	/* The sketch drawn over the view, on the ground: lines and strokes, areas closed, circles, and what is being drawn. */
	SketchDrawing: function (at) {
		var self = this;
		var sketch = this.Ground() ? this.SketchOf() : {Layers: []};
		var parts = [];
		var draft = this.Own().Draft;

		function ground (x, z) {
			return at([x, self.Height(x, z) + 0.2, z]);
		}

		function path (points, closed) {
			var made = [];
			var i;
			var j;
			var count = closed ? points.length : points.length - 1;

			for (i = 0; i < count; i++) {
				var a = points[i];
				var b = points[(i + 1) % points.length];

				for (j = 0; j < 8; j++) {
					var p = ground(a[0] + (b[0] - a[0]) * j / 8, a[1] + (b[1] - a[1]) * j / 8);

					made.push(p.X.toFixed(1) + ',' + p.Y.toFixed(1));
				}
			}

			if (points.length) {
				var end = ground(points[closed ? 0 : points.length - 1][0], points[closed ? 0 : points.length - 1][1]);

				made.push(end.X.toFixed(1) + ',' + end.Y.toFixed(1));
			}

			return made.join(' ');
		}

		function circle (center, radius) {
			var points = [];
			var i;

			for (i = 0; i < 32; i++)
				points.push([center[0] + Math.sin(i / 32 * Math.PI * 2) * radius, center[1] + Math.cos(i / 32 * Math.PI * 2) * radius]);

			return path(points, true);
		}

		function shape (item, kind, extra) {
			var points = item.Points || [];

			if (kind === 'circle' && item.At)
				return '<polyline class="elemenx-scene-editor-sketch-shape area ' + extra + '" points="' + circle(item.At, item.Radius || 10) + '"></polyline>';

			if (kind === 'area' && points.length > 1)
				return '<polyline class="elemenx-scene-editor-sketch-shape area ' + extra + '" points="' + path(points, points.length > 2) + '"></polyline>';

			if (points.length > 1)
				return '<polyline class="elemenx-scene-editor-sketch-shape ' + kind + ' ' + extra + '" points="' + path(points, false) + '"></polyline>';

			if (points.length === 1)
				return '<polyline class="elemenx-scene-editor-sketch-shape ' + kind + ' ' + extra + '" points="' + circle(points[0], item.Radius || 2) + '"></polyline>';

			return '';
		}

		sketch.Layers.forEach(function (layer) {
			if (layer.Visible === false) return;

			layer.Items.forEach(function (item) {
				parts.push(shape(item, self.SketchKind(item.Type), 'type-' + item.Type + (layer.ID === self.SketchLayer ? ' current' : '')));
			});
		});

		if (draft)
			parts.push(shape(draft, this.SketchKind(draft.Type), 'draft'));

		return parts.join('');
	},

	/* The gizmo */

	/* How long an axis of the gizmo is in metres: about a ninth of the view across. */
	Reach: function (object) {
		var view = this.Own().Scene.Viewpoint();
		var eye = view.Eye;
		var at = object.World;

		return Math.max(0.2, Math.hypot(at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]) * 0.12);
	},

	Gizmo: function () {
		var svg = this.$Ref('Gizmo');
		var own = this.Own();
		var object = this.Found(this.Selected);
		var view = this.$Ref('View');
		var box;
		var scene = own.Scene;
		var parts = [];
		var center;
		var reach;
		var self = this;

		if (!svg) return;

		if (this.Tool === 'road' && !this.Playing) {
			box = view.getBoundingClientRect();
			svg.innerHTML = this.RoadDrawing(function (point) {
				var spot = scene.Project(point);

				return {X: spot.X - box.left, Y: spot.Y - box.top, Visible: spot.Visible};
			});

			return;
		}

		if (this.Tool === 'sketch' && !this.Playing) {
			box = view.getBoundingClientRect();
			svg.innerHTML = this.SketchDrawing(function (point) {
				var spot = scene.Project(point);

				return {X: spot.X - box.left, Y: spot.Y - box.top, Visible: spot.Visible};
			});

			return;
		}

		if (!object || !object.World || this.Tool === 'select' || this.Playing) {
			if (svg.childNodes.length)
				svg.textContent = '';

			return;
		}

		box = view.getBoundingClientRect();

		function at (point) {
			var spot = scene.Project(point);

			return {X: spot.X - box.left, Y: spot.Y - box.top, Visible: spot.Visible};
		}

		center = at(object.World);
		reach = this.Reach(object);

		if (!center.Visible) {
			svg.textContent = '';

			return;
		}

		/* In space the move is on its orbit: a line from its parent, the square that carries it, the axis that tilts its orbit. */
		if (this.Space() && this.Tool === 'move') {
			var parent = object.Parent ? this.Found(object.Parent) : null;
			var from;
			var up;
			var apses;

			if (!object.Traits.Orbit || !parent || !parent.World) {
				svg.textContent = '';

				return;
			}

			from = at(parent.World);
			up = at([object.World[0], object.World[1] + reach, object.World[2]]);

			parts.push('<line class="elemenx-scene-editor-orbit" x1="' + from.X.toFixed(1) + '" y1="' + from.Y.toFixed(1) + '" x2="' + center.X.toFixed(1) + '" y2="' + center.Y.toFixed(1) + '"></line>');
			parts.push('<line class="elemenx-scene-editor-axis axis-y" data-handle="move-tilt" x1="' + center.X.toFixed(1) + '" y1="' + center.Y.toFixed(1) + '" x2="' + up.X.toFixed(1) + '" y2="' + up.Y.toFixed(1) + '"></line>');
			parts.push('<circle class="elemenx-scene-editor-tip axis-y" data-handle="move-tilt" cx="' + up.X.toFixed(1) + '" cy="' + up.Y.toFixed(1) + '" r="6"></circle>');
			parts.push('<rect class="elemenx-scene-editor-plane" data-handle="move-orbit" x="' + (center.X - 7).toFixed(1) + '" y="' + (center.Y - 7).toFixed(1) + '" width="14" height="14"></rect>');

			/* The nearest (q) and the farthest (Q) points of its orbit: drawn apart, the shape of the orbit changes. */
			apses = this.Own().Scene.Engine().Apses(this.Selected);

			if (apses) {
				[['Periapsis', 'near', 'q'], ['Apoapsis', 'far', 'Q']].forEach(function (apse) {
					var spot = at(apses[apse[0]].World);
					if (!spot.Visible) return;

					parts.push('<circle class="elemenx-scene-editor-apse ' + apse[1] + '" data-handle="move-' + apse[1] + '" cx="' + spot.X.toFixed(1) + '" cy="' + spot.Y.toFixed(1) + '" r="6"></circle>');
					parts.push('<text class="elemenx-scene-editor-apse-label" x="' + (spot.X + 9).toFixed(1) + '" y="' + (spot.Y - 8).toFixed(1) + '">' + apse[2] + '</text>');
				});
			}

			svg.innerHTML = parts.join('');

			return;
		}

		if (this.Tool === 'turn') {
			var ring = [];
			var i;

			for (i = 0; i <= 48; i++) {
				var p = at([object.World[0] + Math.sin(i / 48 * Math.PI * 2) * reach, object.World[1], object.World[2] + Math.cos(i / 48 * Math.PI * 2) * reach]);

				ring.push(p.X.toFixed(1) + ',' + p.Y.toFixed(1));
			}

			parts.push('<polyline class="elemenx-scene-editor-ring" data-handle="turn" points="' + ring.join(' ') + '"></polyline>');
		}
		else {
			[['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]].forEach(function (axis) {
				var end = at([object.World[0] + axis[1][0] * reach, object.World[1] + axis[1][1] * reach, object.World[2] + axis[1][2] * reach]);
				var handle = (self.Tool === 'scale' ? 'scale-' : 'move-') + axis[0];

				parts.push('<line class="elemenx-scene-editor-axis axis-' + axis[0] + '" data-handle="' + handle + '" x1="' + center.X.toFixed(1) + '" y1="' + center.Y.toFixed(1) + '" x2="' + end.X.toFixed(1) + '" y2="' + end.Y.toFixed(1) + '"></line>');
				parts.push(self.Tool === 'scale' ? '<rect class="elemenx-scene-editor-tip axis-' + axis[0] + '" data-handle="' + handle + '" x="' + (end.X - 5).toFixed(1) + '" y="' + (end.Y - 5).toFixed(1) + '" width="10" height="10"></rect>' : '<circle class="elemenx-scene-editor-tip axis-' + axis[0] + '" data-handle="' + handle + '" cx="' + end.X.toFixed(1) + '" cy="' + end.Y.toFixed(1) + '" r="6"></circle>');
			});

			if (this.Tool === 'move')
				parts.push('<rect class="elemenx-scene-editor-plane" data-handle="move-ground" x="' + (center.X - 7).toFixed(1) + '" y="' + (center.Y - 7).toFixed(1) + '" width="14" height="14"></rect>');
		}

		svg.innerHTML = parts.join('');
	},

	/* A drag of a handle of the gizmo: along its axis as it shows on the screen, over the ground, round the up axis, or bigger. */
	Handle: function (drag, event) {
		var own = this.Own();
		var scene = own.Scene;
		var object = this.Found(this.Selected);
		var values = drag.Values;
		var reach;
		var axis;
		var start;
		var end;
		var along;
		var pixels;
		var amount;
		var ground;
		var changes = {};
		var center;
		var box;
		var a;
		var b;

		if (!object) return;

		reach = this.Reach({World: drag.World});

		/* On its orbit: where the pointer is in the plane of its parent; in AU to three figures, in radii to a tenth. */
		if (drag.Kind === 'move-orbit') {
			ground = scene.OrbitAt(this.Selected, event.clientX, event.clientY);

			if (!ground) return;

			changes = {OrbitDistance: !this.Snap ? ground.Distance : object.Traits.Orbit.Unit === 'radii' ? Math.max(0.1, this.Step(ground.Distance, 0.1)) : Number(ground.Distance.toPrecision(3)), OrbitAnomaly: this.Step(ground.Anomaly, 1)};
		}
		/* The nearest or the farthest point of its orbit drawn along its line from the middle: the other stays (q, Q in AU). */
		else if (drag.Kind === 'move-near' || drag.Kind === 'move-far') {
			box = scene.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();
			ground = scene.Engine().ApseAt(this.Selected, drag.Kind === 'move-near' ? 'Periapsis' : 'Apoapsis', event.clientX - box.left, event.clientY - box.top);

			if (!ground) return;

			changes = this.Reshaped(object.Traits.Orbit, drag.Kind === 'move-near' ? 'Nearest' : 'Farthest', this.Snap ? Number(ground.Distance.toPrecision(3)) : ground.Distance);

			if (!changes) return;
		}
		else if (drag.Kind === 'move-tilt') {
			start = scene.Project(drag.World);
			end = scene.Project([drag.World[0], drag.World[1] + reach, drag.World[2]]);
			along = [end.X - start.X, end.Y - start.Y];
			pixels = Math.max(1, Math.hypot(along[0], along[1]));
			amount = ((event.clientX - drag.X) * along[0] + (event.clientY - drag.Y) * along[1]) / pixels / pixels;
			changes = {OrbitInclination: Math.max(-90, Math.min(90, this.Step(values.Inclination + amount * 30, 1)))};
		}
		else if (drag.Kind === 'turn' && this.Space()) {
			center = scene.Project(drag.World);
			a = Math.atan2(drag.Y - center.Y, drag.X - center.X);
			b = Math.atan2(event.clientY - center.Y, event.clientX - center.X);
			changes = {BodyTilt: this.Step(((values.Tilt + (b - a) * 180 / Math.PI) % 360 + 360) % 360, this.SnapTurn)};
		}
		else if (drag.Kind === 'move-ground') {
			ground = scene.GroundAt(event.clientX, event.clientY);

			if (!ground) return;

			changes = {X: this.Step(ground[0], this.SnapMove), Y: this.Step(ground[2], this.SnapMove)};
		}
		else if (drag.Kind === 'turn') {
			center = scene.Project(drag.World);
			a = Math.atan2(drag.Y - center.Y, drag.X - center.X);
			b = Math.atan2(event.clientY - center.Y, event.clientX - center.X);
			changes = {Facing: this.Step(((values.Facing - (b - a) * 180 / Math.PI) % 360 + 360) % 360, this.SnapTurn)};
		}
		else {
			axis = {x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1]}[drag.Kind.slice(-1)] || [1, 0, 0];
			start = scene.Project(drag.World);
			end = scene.Project([drag.World[0] + axis[0] * reach, drag.World[1] + axis[1] * reach, drag.World[2] + axis[2] * reach]);
			along = [end.X - start.X, end.Y - start.Y];
			pixels = Math.max(1, Math.hypot(along[0], along[1]));
			amount = ((event.clientX - drag.X) * along[0] + (event.clientY - drag.Y) * along[1]) / pixels / pixels * reach;

			if (drag.Kind.indexOf('scale') === 0 && this.Space() && object.Traits.Body) {
				changes = {BodyRadius: Math.max(1, Math.round(values.Radius * Math.max(0.05, 1 + amount / reach)))};
			}
			else if (drag.Kind.indexOf('scale') === 0) {
				changes = {Size: Math.max(0.01, this.Step(values.Size * Math.max(0.05, 1 + amount / reach), this.SnapScale))};
			}
			else if (axis[1]) {
				changes = {Lift: this.Step(values.Lift + amount, this.SnapMove)};
			}
			else {
				changes = axis[0] ? {X: this.Step(values.X + amount, this.SnapMove)} : {Y: this.Step(values.Y + amount, this.SnapMove)};
			}
		}

		this.Change(this.Selected, changes, false);
		this.Fields();
	}
});
