/*
 * Marks over the view of a Scene on what the vehicle of the hero knows (Contacts of SceneTactics), declared inside it in
 * its slot hud (the trait SceneBehaviour): a frame on each and how far it is (the target its name too: the scene names the
 * rest), a foe red, a friend green, a place
 * a point; its target marked, and at a turret the lead (where to aim for a shot of its weapon to meet it as it moves: of
 * the Speed of the weapon; with a mass driver, SceneMissiles Driver, on its target in any mode; a ray needs none).
 * Show auto shows by the mode of the seat (radar: all, turret: the foes and
 * the target, helm: the places and the target, strategic: the foes, the places and the target, else none), all or target only those. A press on a mark makes it the
 * target of the vehicle (SetTarget). Missiles (SceneMissiles): one at the vehicle always (red, how soon it meets it), the
 * others where foes are shown; the locks of the vehicle as brackets closing on their targets, red when locked. For is
 * the vehicle (empty: the one the hero sits in); Label names it for screen readers. The frames are marks of the scene
 * (SceneMarks): each on its contact, hidden behind a body, the target at the edge of the view with an arrow when it is off it.
 */
Elemenx.Component('GameTargets', {
	$TemplateURL: 'GameTargets.html',
	$StyleURL: 'GameTargets.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'target',
		Description: 'Marks over the view on what the vehicle of the hero knows: frames, names and distances, its target and the lead of a turret.',
		Props: {
			For: 'The ID of the vehicle; empty: the one the hero sits in.',
			Show: {Options: ['auto', 'all', 'target'], Description: 'auto (by the mode of the seat), all or target.'},
			Label: 'Its name for screen readers.'
		},
		Sample: {Show: 'all'}
	},
	For: '',
	Show: 'auto',
	Label: '',
	Marks: [],
	Locks: [],
	Lead: null,
	Vehicle: '',

	SceneStep: function () {
		var scene = this.ParentScene();
		var context;
		var mode;

		if (!scene || typeof scene.Contacts !== 'function') return;

		context = scene.Context(scene.Scene().Hero);
		mode = scene.Tactic();
		this.Vehicle = this.For || (context && context.Kind === 'seat' ? context.Vehicle : '');

		this.Place(this.Vehicle ? scene.Contacts(this.Vehicle) : [], mode);
	},

	/* Whether a contact is marked, by Show and the mode of the seat. */
	Shown: function (one, mode) {
		var show = this.Show || 'auto';

		/* A missile at the vehicle always; others as the foes; flares never. */
		if (one.Kind === 'missile')
			return !!one.Incoming || show === 'all' || mode === 'radar' || mode === 'turret';

		if (one.Kind === 'flare') return false;

		if (show === 'all' || one.Target) return true;

		if (show === 'target') return false;

		if (mode === 'radar') return true;

		if (mode === 'turret') return !!one.Hostile;

		if (mode === 'strategic')
			return !!one.Hostile || one.Kind === 'place';

		return mode === 'helm' && (one.Kind === 'place' || one.Kind === 'jammer');
	},

	/* The marks where the contacts are on the view now, and the lead of the turret on the target. */
	Place: function (contacts, mode) {
		var self = this;
		var scene = this.ParentScene();
		var engine = scene.Engine();
		var marks = [];
		var locks = [];
		var lead = null;
		var soon = {};
		var arms = this.Vehicle && typeof scene.ArmsOf === 'function' ? scene.ArmsOf(this.Vehicle) : null;
		var at = {};

		(this.Vehicle && typeof scene.Incoming === 'function' ? scene.Incoming(this.Vehicle) : []).forEach(function (one) {
			soon[one.ID] = one.Seconds;
		});

		(contacts || []).forEach(function (one) {
			at[one.ID] = one.At;

			if (!self.Shown(one, mode)) return;

			/* Where each is on the view is of the marks of the scene (SceneMarks): hidden behind a body, the target at the edge. */
			if (one.Kind === 'missile') {
				marks.push({ID: one.ID, Name: one.Name, Far: one.Incoming && isFinite(soon[one.ID]) ? soon[one.ID].toFixed(1) + ' s' : '', Kind: one.Incoming ? 'incoming' : 'missile', Target: false});

				return;
			}

			marks.push({ID: one.ID, Name: one.Name, Far: Math.round(one.Distance) + ' m', Kind: one.Hostile ? 'enemy' : one.Team ? 'ally' : 'point', Target: !!one.Target});

			if (one.Target && mode === 'turret') lead = self.LeadOf(one, engine);
			else if (one.Target && arms && arms.Driver) lead = self.DriverLead(one, engine, arms.Driver.Name);
		});

		/* The locks of its missiles: a bracket on each, closing as it locks. */
		(arms ? arms.Locks : []).forEach(function (one) {
			var spot = at[one.ID] ? engine.Project(at[one.ID]) : null;
			if (!spot || !spot.Visible) return;

			locks.push({ID: one.ID, X: spot.X, Y: spot.Y, Progress: one.Progress, Locked: one.Locked});
		});

		this.Marks = marks;
		this.Locks = locks;
		this.Lead = lead;
		this.Spots = at;

		this.Marked(marks);
	},

	/*
	 * The frames as marks of the scene, each on its contact (Align center, never moved off it), hidden behind a body; the
	 * target at the edge of the view with an arrow when it is off it. Those of contacts gone are taken away.
	 */
	Marked: function (marks) {
		var self = this;
		var scene = this.ParentScene();
		var element = this.$Element();
		var was = this.MarkKeys || {};
		var now = {};

		if (!scene || typeof scene.Mark !== 'function' || !element) return;

		this.MarkSpace = this.MarkSpace || 'target:' + Math.random().toString(36).slice(2) + ':';

		marks.forEach(function (mark) {
			var button = element.querySelector('.elemenx-game-target[data-id="' + String(mark.ID).replace(/"/g, '') + '"]');
			var key = self.MarkSpace + mark.ID;

			if (!button) return;

			now[key] = true;

			scene.Mark(key, {Element: button, At: self.SpotOf(mark.ID), Align: 'center', Declutter: false, Line: false, Occlude: true, Edge: !!mark.Target, Priority: mark.Target ? 1 : 0});
		});

		Object.keys(was).forEach(function (key) {
			if (!now[key])
				scene.Unmark(key);
		});

		this.MarkKeys = now;
	},

	SpotOf: function (id) {
		var self = this;

		return function () {
			return self.Spots && self.Spots[id] || null;
		};
	},

	SceneStop: function () {
		this.Unmarked();
	},

	$OnDestroy: function () {
		this.Unmarked();
	},

	Unmarked: function () {
		var scene = this.ParentScene();
		var keys = this.MarkKeys || {};

		if (scene && typeof scene.Unmark === 'function')
			Object.keys(keys).forEach(function (key) {
				scene.Unmark(key);
			});

		this.MarkKeys = {};
	},

	/* Where to aim at a target as it moves, for a shot of the weapon of the turret (its Speed; a ray at once needs none). */
	LeadOf: function (one, engine) {
		var turret = engine.HeroTurret ? engine.HeroTurret() : null;
		var type = turret ? this.ParentScene().Scene().WeaponTypes[turret.Weapon] : null;
		var speed = type && type.Kind === 'projectile' ? Number(type.Speed) || 0 : 0;
		var time;
		var spot;

		if (!speed || !turret) return null;

		time = Math.hypot(one.At[0] - turret.From[0], one.At[1] - turret.From[1], one.At[2] - turret.From[2]) / speed;
		spot = engine.Project([one.At[0] + one.Velocity[0] * time, one.At[1] + one.Velocity[1] * time, one.At[2] + one.Velocity[2] * time]);

		return spot.Visible ? {X: spot.X, Y: spot.Y} : null;
	},

	/* Where a slug of the mass driver of the vehicle meets its target as it goes (the lead of SceneAgents), on the view. */
	DriverLead: function (one, engine, name) {
		var inner = this.ParentScene().Scene();
		var ship = inner.Objects[this.Vehicle];
		var target = inner.Objects[one.ID];
		var type = inner.WeaponTypes ? inner.WeaponTypes[name] : null;
		var spot;

		if (!ship || !target || !type || !engine.AgentLead) return null;

		spot = engine.Project(engine.AgentLead(ship, target, type).At);

		return spot.Visible ? {X: spot.X, Y: spot.Y} : null;
	},

	MarkStyle: function (mark) {
		return 'left: ' + mark.X.toFixed(1) + 'px; top: ' + mark.Y.toFixed(1) + 'px';
	},

	LockStyle: function (lock) {
		return this.MarkStyle(lock) + '; --elemenx-game-lock-close: ' + lock.Progress.toFixed(3);
	},

	/* A press on a mark: it is the target of the vehicle. */
	Pressed: function (event, node) {
		var scene = this.ParentScene();
		var id = node.getAttribute('data-id');

		if (scene && this.Vehicle && scene.SetTarget)
			scene.SetTarget(this.Vehicle, id);
	}
});
