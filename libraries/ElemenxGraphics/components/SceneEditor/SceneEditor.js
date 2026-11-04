/*
 * An editor of the scene of a game (a Scene) as Unreal edits a level: the objects of the scene in a tree, the kinds to
 * add, the view with a gizmo, the fields of the selected object, the parameters of its Blueprint (an effect graph or a
 * material graph of the Blueprints Service: the values a level gives one graph) and the graph itself under the view.
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
 * axis tilts its orbit (Inclination); the ring turns its axis (Tilt), scaling changes its Radius. Time sets the day the system
 * is drawn at.
 */
Elemenx.Component('SceneEditor', {
	$TemplateURL: 'SceneEditor.html',
	$StyleURL: 'SceneEditor.css',
	$Meta: {
		Group: 'game',
		Icon: 'layers',
		Description: 'An editor of a game scene as Unreal edits a level: objects, kinds to add, the view with a gizmo, fields, blueprint parameters, Play.',
		Events: {
			change: 'The document changed: {Version, Name, Scene}.',
			select: 'The selection changed: {ID}.',
			play: 'Play or Stop: {Playing}.'
		},
		Methods: ['Document()', 'Load(document)', 'Save()', 'Restore()', 'Export()', 'Import(text)', 'Select(id)', 'Add(kind, props)', 'Remove(id)', 'Undo()', 'Redo()', 'Play()', 'Stop()', 'Scene()'],
		Props: {
			Value: 'The document: {Version, Name, Setting, Scene (the recipe of Scene.Save)}.',
			Setting: {Options: ['ground', 'space'], Description: 'What a new document is: a ground under a sun, or a star system.'},
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
	Value: null,
	Setting: 'ground',
	Kinds: ['unit', 'effect', 'glass', 'mirror', 'tree', 'rock', 'house'],
	SpaceKinds: ['star', 'planet', 'moon', 'belt', 'ring', 'station', 'outpost', 'craft', 'fleet'],
	Models: [],
	Storage: 'elemenx-scene-editor',
	SnapMove: 0.5,
	SnapTurn: 15,
	SnapScale: 0.1,
	Label: '',

	/* What the template renders. */
	Tool: 'move',
	Told: 0,
	Snap: true,
	Selected: '',
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
		{Kind: 'line', Key: 'graphics.sceneEditor.kinds.line', Types: ['ridge', 'valley', 'canyon', 'river', 'road', 'cliff', 'row', 'fence', 'hedge', 'wall', 'powerline', 'street', 'citywall', 'triggerline']},
		{Kind: 'area', Key: 'graphics.sceneEditor.kinds.area', Types: ['plateau', 'basin', 'lake', 'terraces', 'swamp', 'beach', 'floodplain', 'dunes', 'erosion', 'biome', 'mask', 'forest', 'meadow', 'clearing', 'bushes', 'thicket', 'jungle', 'sequoia', 'fields', 'orchard', 'settlement', 'square', 'district', 'trigger', 'zone']},
		{Kind: 'circle', Key: 'graphics.sceneEditor.kinds.circle', Types: ['mountain', 'crater', 'stamp', 'marker', 'landmark', 'triggerpoint']}
	],

	/* The fields of each type of item of a sketch, with their first values. */
	SketchFields: {
		raise: {Radius: 8, Amount: 3}, lower: {Radius: 8, Amount: 3}, flatten: {Radius: 8, Height: 2}, smooth: {Radius: 10},
		ridge: {Width: 20, Height: 15, Sharp: 0.3}, valley: {Width: 20, Depth: 8}, canyon: {Width: 30, Depth: 25}, river: {Width: 6, Depth: 2, Bank: 6, Flow: 0}, road: {Width: 6, Shoulder: 4}, cliff: {Width: 3, Height: 8, Reach: 30},
		plateau: {Height: 20, Edge: 10}, basin: {Depth: 6, Edge: 10}, lake: {Level: -1.5, Depth: 3, Edge: 10}, terraces: {Step: 3, Edge: 6}, swamp: {Level: 0.15, Edge: 8}, beach: {Edge: 8}, floodplain: {Level: 1, Edge: 10}, dunes: {Height: 3, Length: 25, Way: 70, Edge: 10}, erosion: {Amount: 4, Edge: 10}, biome: {Biome: 'forest', Edge: 4}, mask: {Edge: 2},
		mountain: {Radius: 60, Height: 60, Ridged: 0.5}, crater: {Radius: 25, Depth: 8, Rim: 3}, stamp: {Radius: 25, Height: 20, Turn: 0},
		forest: {Density: 2.5, Passability: 0.6}, meadow: {Density: 0.25}, clearing: {}, bushes: {Density: 4, Passability: 0.7}, thicket: {Density: 10, Passability: 0.1}, jungle: {Density: 5, Passability: 0.3}, sequoia: {Density: 0.35, Passability: 0.8}, fields: {Spacing: 1, Gap: 1.4, Way: 0, Shapes: 'wheat'}, orchard: {Spacing: 6, Gap: 6, Way: 0, Shapes: 'oak'},
		row: {Shapes: 'fence', Spacing: 4}, fence: {Spacing: 2}, hedge: {Spacing: 1.8}, wall: {Spacing: 1.9}, powerline: {Spacing: 40},
		marker: {Radius: 2, Role: 'spawn', Team: '', Name: ''},
		settlement: {Kind: 'village', Density: 0.85, Lit: 0, Edge: 15}, street: {Width: 8}, square: {Edge: 4}, district: {Kind: 'residential'}, citywall: {}, landmark: {Radius: 2, Model: 'temple', Name: ''},
		trigger: {Height: 0, Team: '', Kinds: '', Once: 'false', Achievement: '', Name: ''}, triggerpoint: {Radius: 4, Height: 0, Team: '', Kinds: '', Once: 'false', Achievement: '', Name: ''}, triggerline: {Width: 4, Height: 0, Team: '', Kinds: '', Once: 'false', Achievement: '', Name: ''},
		zone: {Tags: 'safe', Team: '', Name: ''}
	},

	$OnCreate: function () {
		var own = {Scene: null, Document: null, Past: [], Future: [], Drag: null, Keys: {}, Played: null, Frame: 0, Copies: 0};

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

		/* A new document: a ground under a sun at the end of the morning, looked at from above its middle; or a star and a planet. */
		if (own.Document.Scene) {
			scene.Load(own.Document.Scene);
		}
		else if (own.Document.Setting === 'space') {
			scene.Add('star', {ID: 'star', Name: 'Star'});
			scene.Add('planet', {ID: 'planet', Name: 'Planet', Parent: 'star', Distance: 1, Anomaly: 30});
			scene.SetViewpoint({Target: [0, 0, 0], Yaw: 0.4, Pitch: 0.9, Distance: 60});
		}
		else {
			scene.Add('ground', {ID: 'ground', Size: 400, Height: 12, Water: 0.15, Seed: 'editor'});
			scene.Add('sun', {ID: 'sun', Time: 11, Latitude: 45});
			scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0.6, Pitch: 0.55, Distance: 40});
		}

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
	Timed: function (event) {
		var own = this.Own();
		var before = own.Scene.Save();

		own.Scene.SetTime(Number(event.target.value) || 0);

		this.Changed(before);
	},

	Load: function (document) {
		var own = this.Own();

		own.Document = this.Normalize(document);

		if (own.Scene && own.Document.Scene)
			own.Scene.Load(own.Document.Scene);

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
		own.Scene.Load(own.Past.pop());

		this.Changed(null);
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length || this.Playing) return;

		own.Past.push(own.Scene.Save());
		own.Scene.Load(own.Future.pop());

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

	/* The objects */

	Items: function () {
		var scene = this.Own().Scene;
		if (!scene) return [];

		return scene.Objects().filter(function (object) {
			return !object.Owner;
		}).map(function (object) {
			return {ID: object.ID, Label: (object.Values.Name || object.ID) + (object.Kind ? ' · ' + object.Kind : ''), Icon: object.Kind === 'effect' ? 'star' : 'square'};
		});
	},

	Chosen: function (item) {
		this.Select(item && item.ID || '');
	},

	Select: function (id) {
		this.Selected = id || '';
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
		var kind = {unit: 'unit', animal: 'unit', vehicle: 'unit', building: 'house', plant: 'tree', rock: 'rock'}[info.Type] || 'thing';

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
		var round = {planet: 'star', belt: 'star', moon: 'body', ring: 'body', station: 'body', outpost: 'body', craft: 'body', fleet: 'body'}[kind];
		var parent = null;
		var count;

		if (!round) return {};

		if (round === 'star') parent = selected && selected.Traits.Star ? selected : stars[0];
		else parent = selected && selected.Traits.Body ? selected : bodies[0] || stars[0];

		if (!parent) return {};

		count = objects.filter(function (object) {
			return object.Parent === parent.ID && object.Kind === kind;
		}).length;

		if (kind === 'planet')
			return {Parent: parent.ID, Name: 'Planet ' + (count + 1), Distance: Math.round(0.4 * Math.pow(1.7, count) * 100) / 100, Anomaly: count * 137 % 360};

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

	/* The fields of the selected object: where it stands, its turn, its size, then the fields of its kind. */
	Fields: function () {
		var self = this;
		var holder = this.$Ref('Fields');
		var object = this.Found(this.Selected);
		var fields;

		if (!holder) return;

		holder.textContent = '';

		if (!object) return;

		/* In space a body is where its orbit takes it: its fields are those of its traits. */
		fields = this.Space() ? [['Name', object.Values.Name || '']] : [['Name', object.Values.Name || ''], ['X', object.Values.X || 0], ['Y', object.Values.Y || 0], ['Lift', object.Values.Lift || 0], ['Facing', object.Values.Facing || 0], ['Size', object.Size || 1]];

		Object.keys(object.Traits || {}).forEach(function (name) {
			Object.keys(object.Traits[name] || {}).forEach(function (key) {
				var value = object.Traits[name][key];
				if (key === 'Blueprint' || key === 'Parameters' || value && typeof value === 'object' && !Array.isArray(value)) return;

				fields.push([key, value, name]);
			});
		});

		fields.forEach(function (field) {
			var label = document.createElement('label');
			var name = document.createElement('span');
			var input = document.createElement('input');

			label.className = 'elemenx-scene-editor-field';
			name.textContent = field[2] ? field[2] + ' · ' + field[0] : field[0];
			input.value = field[1] == null ? '' : Array.isArray(field[1]) ? field[1].join(', ') : String(field[1]);

			input.setAttribute('data-field', field[0]);

			if (typeof field[1] === 'boolean') {
				input.type = 'checkbox';
				input.checked = field[1];
			}

			input.addEventListener('change', function () {
				var changes = {};
				var value = input.type === 'checkbox' ? input.checked : input.value;

				if (typeof field[1] === 'number' || /^(X|Y|Lift|Facing|Size)$/.test(field[0])) value = value === '' ? undefined : Number(value) || 0;
				else if (Array.isArray(field[1])) value = String(value).split(',').map(Number);

				/* A field of a trait by the trait's name with it: Radius of a Body is not the Radius of a Ring. */
				changes[field[2] ? field[2] + field[0] : field[0]] = value;

				self.Change(self.Selected, changes);
			});

			label.appendChild(name);
			label.appendChild(input);
			holder.appendChild(label);
		});

		this.RoadFields(holder, object);

	},

	/* Roads */

	/* The types of roads of SceneRoads, for the tool. */
	RoadTypesOf: function () {
		return this.$Service('SceneRoads').Types();
	},

	RoadTyped: function (event) {
		this.RoadType = event.target.value;
	},

	RoadParted: function (event) {
		this.RoadPart = event.target.value;
	},

	RoadRadiused: function (event) {
		this.RoadRadius = Math.max(0, Number(event.target.value) || 0);
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

	/* The radius of the corner at the point chosen of the road selected: an arc between its two straight parts. */
	RoadFields: function (holder, object) {
		var self = this;
		var index = this.Own().RoadPoint;
		var road = object && object.Traits && object.Traits.Road ? this.RoadOf() : null;
		var label = document.createElement('label');
		var name = document.createElement('span');
		var input = document.createElement('input');

		if (!road || index === null || index === undefined || index >= road.Points.length) return;

		label.className = 'elemenx-scene-editor-field';
		name.textContent = Elemenx.Locale.Text('graphics.sceneEditor.pointRadius', {point: index + 1});
		input.type = 'number';
		input.min = '0';
		input.value = String(road.Radii[index] || 0);

		input.setAttribute('data-field', 'PointRadius');

		input.addEventListener('change', function () {
			road.Radii[index] = Math.max(0, Number(input.value) || 0);

			self.Change(self.Selected, {Radii: road.Radii});
		});

		label.appendChild(name);
		label.appendChild(input);
		holder.appendChild(label);
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

	Graph: function () {
		var owner = this.Owner();

		return owner ? typeof owner.Blueprint === 'string' ? JSON.parse(owner.Blueprint) : owner.Blueprint : null;
	},

	/* The parameters of its Blueprint with the values the object gives them: what a level sets of one graph. */
	Exposed: function () {
		var owner = this.Owner();
		var graph = this.Graph();
		var values = owner && owner.Parameters || {};

		return (graph && graph.parameters || []).map(function (parameter) {
			var value = Object.prototype.hasOwnProperty.call(values, parameter.key) ? values[parameter.key] : parameter.value;

			return {key: parameter.key, type: parameter.type, Shown: Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)};
		});
	},

	Tuned: function (event) {
		var owner = this.Owner();
		var key = event.target.getAttribute('data-parameter');
		var text = event.target.value;
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
		this.Change(this.Selected, {Blueprint: JSON.parse(JSON.stringify(graph))});
	},

	Pick: function (tool) {
		this.Tool = tool;
		this.Own().Draft = null;

		this.SketchItems();
	},

	Snapped: function (event) {
		this.Snap = !!event.target.checked;
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

		own.Drag = null;

		if (!drag || !scene) return;

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

	Menu: function (event) {
		event.preventDefault();
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

			/* In space the copy goes round the same body, a little farther on its orbit. */
			if (this.Space()) this.Add(object.Kind, {Parent: object.Parent, Name: object.Values.Name, Traits: this.Copied(object.Traits)});
			else this.Add(object.Kind, Object.assign({}, object.Values, {ID: undefined, X: (Number(object.Values.X) || 0) + 1}));

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
			own.Scene.SetViewpoint({Target: object.World.slice(), Yaw: own.Scene.Viewpoint().Yaw, Pitch: Math.max(0.2, own.Scene.Viewpoint().Pitch), Distance: Math.max(3, (object.Size || 1) * 6)});

			return;
		}

		if (event.code === 'End' && object && !this.Space())
			this.Change(this.Selected, {Lift: 0});
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

	/* A copy of the sketch of the ground, with a layer at least. */
	SketchOf: function () {
		var ground = this.Ground();
		var sketch = ground && ground.Traits.Terrain.Sketch ? JSON.parse(JSON.stringify(ground.Traits.Terrain.Sketch)) : {Layers: []};
		if (!sketch.Layers.length)
			sketch.Layers.push({ID: 'base', Name: 'Base', Visible: true, Strength: 1, Items: []});

		return sketch;
	},

	SaveSketch: function (sketch) {
		var ground = this.Ground();
		if (!ground) return;

		this.Change(ground.ID, {Sketch: sketch});
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

	SketchPicked: function (event) {
		this.SketchType = event.target.value;
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

	/* The items of the layer in hand, each with its fields and a button that takes it away. */
	SketchItems: function () {
		var self = this;
		var holder = this.$Ref('Items');
		var sketch;
		var layer;

		if (!holder) return;

		holder.textContent = '';

		if (this.Tool !== 'sketch' || !this.Ground()) return;

		sketch = this.SketchOf();
		layer = this.Layer(sketch);

		layer.Items.forEach(function (item, index) {
			var box = document.createElement('div');
			var head = document.createElement('div');
			var remove = document.createElement('button');

			box.className = 'elemenx-scene-editor-item';

			box.setAttribute('data-item', item.ID);

			head.className = 'elemenx-scene-editor-item-head';
			head.textContent = item.ID;
			remove.type = 'button';
			remove.textContent = '×';

			remove.setAttribute('data-remove', item.ID);

			remove.addEventListener('click', function () {
				var copy = self.SketchOf();

				self.Layer(copy).Items.splice(index, 1);
				self.SaveSketch(copy);
			});

			head.appendChild(remove);
			box.appendChild(head);

			Object.keys(Object.assign({Strength: 1}, self.SketchFields[item.Type] || {})).forEach(function (key) {
				var label = document.createElement('label');
				var name = document.createElement('span');
				var input = document.createElement('input');

				label.className = 'elemenx-scene-editor-field';
				name.textContent = key;
				input.value = item[key] === undefined ? key === 'Strength' ? 1 : '' : String(item[key]);

				input.setAttribute('data-field', key);

				input.addEventListener('change', function () {
					var copy = self.SketchOf();
					var target = self.Layer(copy).Items[index];

					/* Texts stay texts (a biome, a role, a team, names of shapes by commas), the rest are numbers. */
					if (key === 'Shapes') target[key] = input.value.split(',').map(function (name) {
						return name.trim();
					}).filter(Boolean);
					else target[key] = typeof (self.SketchFields[item.Type] || {})[key] === 'string' ? input.value : Number(input.value) || 0;

					if (key === 'Biome' && self.$Service('SceneBiomes').Has(input.value))
						target.Palette = self.$Service('SceneBiomes').Get(input.value).Ground;

					self.SaveSketch(copy);
				});

				label.appendChild(name);
				label.appendChild(input);
				box.appendChild(label);
			});

			holder.appendChild(box);
		});
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
