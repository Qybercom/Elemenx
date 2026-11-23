/*
 * Marks over the view of a Scene on what the vehicle of the hero knows (Contacts of SceneTactics), declared inside it in
 * its slot hud (the trait SceneBehaviour): a frame on each and how far it is (the target its name too: the scene names the
 * rest), a foe red, a friend green, a place
 * a point; its target marked, and at a turret the lead (where to aim for a shot of its weapon to meet it as it moves: of
 * the Speed of the weapon; a ray needs none). Show auto shows by the mode of the seat (radar: all, turret: the foes and
 * the target, helm: the places and the target, strategic: the foes, the places and the target, else none), all or target only those. A press on a mark makes it the
 * target of the vehicle (SetTarget). For is the vehicle (empty: the one the hero sits in); Label names it for screen readers.
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
		var lead = null;

		(contacts || []).forEach(function (one) {
			var spot;

			if (!self.Shown(one, mode)) return;

			spot = engine.Project(one.At);

			if (!spot.Visible || spot.X < 0 || spot.Y < 0 || spot.X > scene.Scene().Width || spot.Y > scene.Scene().Height) return;

			marks.push({ID: one.ID, X: spot.X, Y: spot.Y, Name: one.Name, Far: Math.round(one.Distance) + ' m', Kind: one.Hostile ? 'enemy' : one.Team ? 'ally' : 'point', Target: !!one.Target});

			if (one.Target && mode === 'turret')
				lead = self.LeadOf(one, engine);
		});

		this.Marks = marks;
		this.Lead = lead;
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

	MarkStyle: function (mark) {
		return 'left: ' + mark.X.toFixed(1) + 'px; top: ' + mark.Y.toFixed(1) + 'px';
	},

	/* A press on a mark: it is the target of the vehicle. */
	Pressed: function (event, node) {
		var scene = this.ParentScene();
		var id = node.getAttribute('data-id');

		if (scene && this.Vehicle && scene.SetTarget)
			scene.SetTarget(this.Vehicle, id);
	}
});
