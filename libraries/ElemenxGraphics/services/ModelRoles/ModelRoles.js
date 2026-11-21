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
 *   spin, stretch), Lamps (what glows), Wheels ([{Parts, Corner, Held}]), Sockets ([{Name, Parts, At, Axis}]: where a thing is
 *   held), Emitters ([{Parts, At, Way, Effect, Rate, Drive}]: what gives off an effect), Colliders ([{Parts}]: the outline of
 *   its parts stops what comes to it)}; each opening named role:<ID>.
 * - Besides doors, wheels and lamps: the chassis of a car (arm and shock with the travel of their wheel, Corner and Length;
 *   knuckle with its steering; halfshaft with its roll; the gauges of speed and rpm; exhaust), what flies (aileron, elevator,
 *   rudder, flap, propeller, gear-leg up while it flies), arms (turret and barrel by the Aim of the object {Yaw, Pitch}
 *   degrees, recoil when it Fired), mechanisms (drawer, lid, button, valve, turbine by the wind, the hands of a clock by the
 *   time of day, radar, boom, platform), points (socket, emitter, collider).
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

	/*
	 * The kinds of roles, by group, and what a new one starts as (resources/models/roles): doors and hatches that open, what
	 * drives a car (wheels, steering, pedals...), lamps, its chassis, what flies, arms, mechanisms, points. Regression: written
	 * here, a role more needed a change of the code.
	 */
	Catalogue: [],


	$OnCreate: function () {
		var self = this;
		var listeners = [];

		this.Catalogue = (typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Data', 'ElemenxGraphics/models/roles') : null) || [];

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

		['Drive', 'Light', 'Corner', 'Held', 'Pace', 'Length', 'Effect', 'Rate'].forEach(function (key) {
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
		var rig = {Openings: [], Lamps: [], Wheels: [], Sockets: [], Emitters: [], Colliders: []};

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

			/* Points: a socket where a thing is held, an emitter of an effect, a collider of the outline of its parts. */
			if (motion.Type === 'point') {
				rig.Sockets.push({Role: role.ID, Name: role.Name || role.ID, Parts: role.Parts, At: motion.Pivot || null, Axis: motion.Axis || [0, 1, 0]});

				return;
			}

			if (motion.Type === 'emit') {
				rig.Emitters.push({Role: role.ID, Parts: role.Parts, At: motion.Pivot || null, Way: motion.Way || [0, 1, 0], Effect: role.Effect || 'smoke', Rate: Number(role.Rate) || 2, Drive: role.Drive || ''});

				return;
			}

			if (motion.Type === 'collider') {
				rig.Colliders.push({Role: role.ID, Parts: role.Parts});

				return;
			}

			if (motion.Type !== 'hinge' && motion.Type !== 'slide' && motion.Type !== 'spin' && motion.Type !== 'stretch') return;

			opening = {Name: name, Role: role.ID, Parts: role.Parts, Both: !!role.Both, Open: Number(role.Open) || 0};

			if (motion.Type === 'slide') {
				opening.Way = motion.Way || [0, -1, 0];
				opening.Reach = motion.Reach === undefined ? 1 : Number(motion.Reach);
			}
			else if (motion.Type === 'stretch') {
				/* A shock: it grows along Way from its Pivot (its mount) as its wheel hangs lower. */
				opening.Stretch = {Pivot: motion.Pivot || [0, 0, 0], Way: motion.Way || [0, -1, 0]};
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

			['Drive', 'Sign', 'Pace', 'Corner', 'Length'].forEach(function (key) {
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
