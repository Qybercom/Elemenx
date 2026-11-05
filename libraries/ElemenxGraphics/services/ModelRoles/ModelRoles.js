/*
 * ModelRoles: what the parts of a model are, by name: its wheels, its steering wheel and pedals, its doors, its lamps, the
 * door of a house, a lever, a hatch, a fan. A role is set on parts of a model picked in an editor (ModelEditor, its tab
 * Roles): pieces of it (a node, a mesh, a material of a file) and, of a piece, the triangles a brush painted. A Scene
 * moves them as their role says, on any object that has the model, and lights its lamps.
 * - A role is {ID, Kind, Name, Parts: [{Piece (the ID of a piece of the model), Vertices ([[from, to]...]: of the piece,
 *   only the triangles all of whose corners are in them; none: all of it)}], Both (it stands on both sides of the model,
 *   mirrored on x: a pair of doors), Motion: {Type (hinge, slide, spin, glow or none), Pivot ([x, y, z] of the model, the
 *   hinge), Axis, Angle (degrees at 1), Aside and AsideAngle (a second axis: a gear lever), Way and Reach (a slide), Speed
 *   (turns a second at 1: a spin)}, Drive (what a driver moves: steer, gas, brake, hand, gear, sequential, paddle,
 *   indicator, wipers), Sign, Pace (how fast it comes, a second), Open (where it stands, 0 to 1), Follow (the ID of the role
 *   it is carried by: a paddle on the steering wheel, the glass of a door), Light ({Kind (head, rear, brake, reverse,
 *   indicator; glow: lit as far as it is set), Color, Glow, Power, Radius, Spot, Aim, At}), Corner (of a wheel: FL, FR, RL,
 *   RR) and Held (a wheel's: what stops it, which steers and rides with it but does not spin)}.
 * - Kinds() lists the kinds of roles by group, each with what a new role of it starts as; Kind(id) is one: {ID, Group,
 *   Icon, Motion, Drive, Light, Corner, Held, Pace}. Make(kind, props) is a new role of a kind.
 * - The roles of a model: Get(model) (those kept for it, else those of its recipe in SceneModels, Roles), Set(model,
 *   roles), Remove(model), Models() (the names of those kept); they are kept in the storage of the browser (StorageKey).
 *   Export() is all of them as the text of a file, Import(text) reads one in (over what is kept, model by model).
 * - Rig(roles) is what a Scene takes of them, as the settings of a vehicle name them: {Openings (what moves: hinge, slide,
 *   spin), Lamps (what glows), Wheels ([{Parts, Corner, Held}])}; each opening named role:<ID>.
 * - Ranges(indices) packs a list of vertices into ranges, Within(ranges, index) tells whether one is in them.
 * - Version() changes with every change; OnChange(listener) and OffChange(listener).
 * The same functions run in Node: they read no page (with no storage nothing is kept).
 */
Elemenx.Service('ModelRoles', {
	$Meta: {
		Description: 'What the parts of a model are: wheels, steering, pedals, doors, lamps, levers, hatches; kept for each model, moved by a Scene.',
		Methods: ['Kinds()', 'Kind(id)', 'Make(kind, props)', 'Get(model)', 'Set(model, roles)', 'Remove(model)', 'Models()', 'Export()', 'Import(text)', 'Rig(roles)', 'Ranges(indices)', 'Within(ranges, index)', 'Version()', 'OnChange(listener)', 'OffChange(listener)']
	},

	StorageKey: 'elemenx-model-roles',

	/* The kinds of roles, by group, and what a new one starts as. */
	Catalogue: [
		{ID: 'door', Group: 'opens', Icon: 'door', Motion: {Type: 'hinge', Axis: [0, 1, 0], Angle: 70}, Pace: 0.6},
		{ID: 'trunk', Group: 'opens', Icon: 'box', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 60}, Pace: 0.6},
		{ID: 'hood', Group: 'opens', Icon: 'box', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: -55}, Pace: 0.6},
		{ID: 'hatch', Group: 'opens', Icon: 'square', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 90}, Pace: 0.6},
		{ID: 'window', Group: 'opens', Icon: 'square', Motion: {Type: 'slide', Way: [0, -1, 0], Reach: 0.4}, Pace: 0.4},
		{ID: 'lever', Group: 'opens', Icon: 'sliders', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 40}, Pace: 1},
		{ID: 'part', Group: 'opens', Icon: 'move', Motion: {Type: 'hinge', Axis: [0, 1, 0], Angle: 90}, Pace: 0.6},
		{ID: 'fan', Group: 'turns', Icon: 'refresh', Motion: {Type: 'spin', Axis: [0, 1, 0], Speed: 2}, Open: 1},
		{ID: 'wheel', Group: 'drives', Icon: 'circle', Motion: {Type: 'none'}, Corner: 'FL'},
		{ID: 'caliper', Group: 'drives', Icon: 'circle', Motion: {Type: 'none'}, Corner: 'FL', Held: true},
		{ID: 'steering', Group: 'drives', Icon: 'steering', Motion: {Type: 'hinge', Axis: [0, 0, 1], Angle: 120}, Drive: 'steer'},
		{ID: 'pedal-gas', Group: 'drives', Icon: 'chevron-down', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 15}, Drive: 'gas'},
		{ID: 'pedal-brake', Group: 'drives', Icon: 'chevron-down', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 15}, Drive: 'brake'},
		{ID: 'handbrake', Group: 'drives', Icon: 'chevron-up', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 25}, Drive: 'hand'},
		{ID: 'gear', Group: 'drives', Icon: 'sliders', Motion: {Type: 'hinge', Axis: [1, 0, 0], Angle: 12, Aside: [0, 0, 1], AsideAngle: 10}, Drive: 'gear'},
		{ID: 'paddle', Group: 'drives', Icon: 'chevron-right', Motion: {Type: 'hinge', Axis: [0, 1, 0], Angle: 8}, Drive: 'paddle'},
		{ID: 'stalk', Group: 'drives', Icon: 'chevron-up', Motion: {Type: 'hinge', Axis: [0, 0, 1], Angle: 10}, Drive: 'indicator'},
		{ID: 'wiper', Group: 'drives', Icon: 'refresh', Motion: {Type: 'hinge', Axis: [0, 0, 1], Angle: 90}, Drive: 'wipers'},
		{ID: 'lamp-head', Group: 'lights', Icon: 'sun', Motion: {Type: 'glow'}, Light: {Kind: 'head'}},
		{ID: 'lamp-rear', Group: 'lights', Icon: 'sun', Motion: {Type: 'glow'}, Light: {Kind: 'rear'}},
		{ID: 'lamp-brake', Group: 'lights', Icon: 'sun', Motion: {Type: 'glow'}, Light: {Kind: 'brake'}},
		{ID: 'lamp-reverse', Group: 'lights', Icon: 'sun', Motion: {Type: 'glow'}, Light: {Kind: 'reverse'}},
		{ID: 'lamp-indicator', Group: 'lights', Icon: 'sun', Motion: {Type: 'glow'}, Light: {Kind: 'indicator'}},
		{ID: 'light', Group: 'lights', Icon: 'sun', Motion: {Type: 'glow'}, Light: {Kind: 'glow', Color: '#ffd9a0', Power: 1, Radius: 8}}
	],

	$OnCreate: function () {
		var self = this;
		var listeners = [];
		var version = 0;
		var kept = {};

		try {
			kept = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(this.StorageKey) || '{}') || {} : {};
		}
		catch (error) {
			kept = {};
		}

		/* The roles kept, by model, and the listeners: not state of a page. */
		this.Own = function () {
			return {Kept: kept, Listeners: listeners};
		};

		this.Version = function () {
			return version;
		};

		/* Into the storage of the browser; false where there is none, or it is full. */
		function keep () {
			try {
				localStorage.setItem(self.StorageKey, JSON.stringify(kept));

				return true;
			}
			catch (error) {
				return false;
			}
		}

		/* Kept again and told: every change of the roles of a model. */
		this.Changed = function (model) {
			var library = self.$Service ? self.$Service('SceneModels') : null;

			version++;

			if (typeof localStorage !== 'undefined')
				keep();

			/* Its pieces are cut by the roles once: the model is made again (a file read anew) for the new ones. */
			if (library && library.Remake)
				(model ? [model] : Object.keys(kept)).forEach(library.Remake.bind(library));

			listeners.slice().forEach(function (listener) {
				listener(model);
			});
		};
	},

	Kinds: function () {
		var groups = [];

		this.Catalogue.forEach(function (kind) {
			var group = groups.filter(function (each) {
				return each.ID === kind.Group;
			})[0];

			if (!group) {
				group = {ID: kind.Group, Kinds: []};

				groups.push(group);
			}

			group.Kinds.push(JSON.parse(JSON.stringify(kind)));
		});

		return groups;
	},

	Kind: function (id) {
		var kind = this.Catalogue.filter(function (each) {
			return each.ID === id;
		})[0];

		return kind ? JSON.parse(JSON.stringify(kind)) : null;
	},

	/* A new role of a kind: what the kind starts as, under what is given. */
	Make: function (kind, props) {
		var base = this.Kind(kind) || this.Kind('part');
		var given = props || {};
		var role = {ID: given.ID || base.ID + '-' + Math.random().toString(36).slice(2, 7), Kind: base.ID, Name: given.Name || '', Parts: [], Both: false, Motion: base.Motion, Open: base.Open || 0};

		['Drive', 'Light', 'Corner', 'Held', 'Pace'].forEach(function (key) {
			if (base[key] !== undefined)
				role[key] = base[key];
		});

		return Object.assign(role, JSON.parse(JSON.stringify(given)));
	},

	Get: function (model) {
		var kept = this.Own().Kept[model];
		var library = this.$Service ? this.$Service('SceneModels') : null;
		var recipe = library && library.Recipes ? library.Recipes[model] : null;

		return JSON.parse(JSON.stringify(kept || recipe && recipe.Roles || []));
	},

	Set: function (model, roles) {
		if (!model) return;

		this.Own().Kept[model] = JSON.parse(JSON.stringify(roles || []));

		this.Changed(model);
	},

	Remove: function (model) {
		if (!this.Own().Kept[model]) return;

		delete this.Own().Kept[model];

		this.Changed(model);
	},

	Models: function () {
		return Object.keys(this.Own().Kept).sort();
	},

	Export: function () {
		return JSON.stringify({Version: 1, Roles: this.Own().Kept}, null, 2);
	},

	/* Roles of a file, over those kept, model by model; false when the text is not one. */
	Import: function (text) {
		var self = this;
		var read;

		try {
			read = JSON.parse(text);
		}
		catch (error) {
			return false;
		}

		if (!read || typeof read.Roles !== 'object' || Array.isArray(read.Roles)) return false;

		Object.keys(read.Roles).forEach(function (model) {
			if (Array.isArray(read.Roles[model]))
				self.Own().Kept[model] = read.Roles[model];
		});

		this.Changed('');

		return true;
	},

	/* What a Scene takes of the roles: the openings, the lamps and the wheels a vehicle names, each of its parts. */
	Rig: function (roles) {
		var rig = {Openings: [], Lamps: [], Wheels: []};

		(roles || []).forEach(function (role) {
			var motion = role.Motion || {};
			var name = 'role:' + role.ID;
			var opening;

			if (!role.Parts || !role.Parts.length) return;

			if (role.Kind === 'wheel' || role.Kind === 'caliper' || role.Corner && motion.Type === 'none') {
				rig.Wheels.push({Parts: role.Parts, Corner: role.Corner || 'FL', Held: !!role.Held});

				return;
			}

			if (motion.Type === 'glow') {
				rig.Lamps.push(Object.assign({Role: role.ID, Parts: role.Parts, Both: !!role.Both}, role.Light || {Kind: 'glow'}));

				return;
			}

			if (motion.Type !== 'hinge' && motion.Type !== 'slide' && motion.Type !== 'spin') return;

			opening = {Name: name, Role: role.ID, Parts: role.Parts, Both: !!role.Both, Open: Number(role.Open) || 0};

			if (motion.Type === 'slide') {
				opening.Way = motion.Way || [0, -1, 0];
				opening.Reach = motion.Reach === undefined ? 1 : Number(motion.Reach);
			}
			else {
				opening.Hinge = motion.Pivot || [0, 0, 0];
				opening.Axis = motion.Axis || [0, 1, 0];
				opening.Angle = motion.Type === 'spin' ? 360 : motion.Angle === undefined ? 90 : Number(motion.Angle);

				if (motion.Aside) {
					opening.Aside = motion.Aside;
					opening.AsideAngle = motion.AsideAngle;
				}

				if (motion.Type === 'spin')
					opening.Spin = motion.Speed === undefined ? 1 : Number(motion.Speed);
			}

			['Drive', 'Sign', 'Pace'].forEach(function (key) {
				if (role[key] !== undefined && role[key] !== '')
					opening[key] = role[key];
			});

			if (role.Follow)
				opening.Follow = 'role:' + role.Follow;

			rig.Openings.push(opening);
		});

		return rig;
	},

	/* A list of vertices as ranges [[from, to]...] (both in): what a brush painted, short to keep. */
	Ranges: function (indices) {
		var sorted = (indices || []).slice().sort(function (a, b) {
			return a - b;
		});
		var ranges = [];

		sorted.forEach(function (index) {
			var last = ranges[ranges.length - 1];

			if (last && index <= last[1] + 1) last[1] = Math.max(last[1], index);
			else ranges.push([index, index]);
		});

		return ranges;
	},

	/* Whether a vertex is in ranges (sorted, as Ranges makes them). */
	Within: function (ranges, index) {
		var low = 0;
		var high = ranges.length - 1;
		var middle;

		while (low <= high) {
			middle = (low + high) >> 1;

			if (index < ranges[middle][0]) high = middle - 1;
			else if (index > ranges[middle][1]) low = middle + 1;
			else return true;
		}

		return false;
	},

	OnChange: function (listener) {
		this.Own().Listeners.push(listener);
	},

	OffChange: function (listener) {
		var list = this.Own().Listeners;
		var at = list.indexOf(listener);
		if (at !== -1)
			list.splice(at, 1);
	}
});
