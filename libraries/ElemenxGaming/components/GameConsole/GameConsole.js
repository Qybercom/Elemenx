/*
 * The screen of a console of a ship, declared inside a Scene (the trait SceneBehaviour): put in its slot screens as a
 * data-screen named console:<seat>, console:<role> or console, it is shown on the screens of the consoles of a ship standing
 * (SceneAboard), pressed there with the mouse or a finger. It reads, each Every seconds (0.25), where the hero is (Context
 * of the scene): the ship For (an ID; empty: the one the hero sits in, or is in) and the Role of the console (pilot,
 * copilot, captain, engineer, tactical, gunner, sensors, commander; empty: the one of the seat the hero sits in). It shows
 * the role and the ship, its instruments (GameFlight: the hands of an engineer at the console of one, more of the places it knows at the
 * console of sensors), its radar beside them with Radar (GameRadar, a map of RadarRange metres, RadarSize pixels wide)
 * and, while the hero sits there, the modes of its seat (GameTactics) and a button to stand up (Leave of the scene). Size
 * small, medium or large; Label names it for screen readers; its default slot holds buttons of its own.
 */
Elemenx.Component('GameConsole', {
	$TemplateURL: 'GameConsole.html',
	$StyleURL: 'GameConsole.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'monitor',
		Description: 'The screen of a console of a ship, shown on the consoles inside it: its role, the ship, its instruments, and a button to stand up from the seat.',
		Container: true,
		Props: {
			For: 'The ID of the ship; empty: the one the hero sits in.',
			Role: {Options: ['', 'pilot', 'copilot', 'captain', 'engineer', 'tactical', 'gunner', 'sensors', 'commander'], Description: 'The role of the console; empty: the one of the seat the hero sits in.'},
			Every: 'How often it reads, in seconds.',
			Radar: 'Shows the radar of the ship beside its instruments.',
			RadarRange: 'How far its radar shows, in metres.',
			RadarSize: 'The width of its radar, in pixels.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'Its name for screen readers.'
		},
		Sample: {Role: 'engineer'}
	},
	For: '',
	Role: '',
	Every: 0.25,
	Radar: false,
	RadarRange: 200,
	RadarSize: 150,
	Size: 'medium',
	Label: '',
	Ship: '',
	Name: '',
	Current: '',
	Seated: false,

	$OnCreate: function () {
		this.ConsoleClock = Infinity;
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();

		this.ConsoleClock += elapsed;

		if (this.ConsoleClock < Number(this.Every || 0) || !scene || typeof scene.Context !== 'function') return;

		this.ConsoleClock = 0;

		this.Show(scene.Context(scene.Scene().Hero));
	},

	/* Where the hero is (Context of a Scene: {Kind walk | seat, Vehicle, Seat, Role, Controls}), as the console shows it. */
	Show: function (context) {
		var scene = this.ParentScene();
		var seated = !!context && context.Kind === 'seat';
		var ship = this.For || (seated ? context.Vehicle : scene && scene.Scene().InsideShip || '');
		var object = ship && scene && scene.Get ? scene.Get(ship) : null;

		this.Seated = seated && (!this.For || context.Vehicle === this.For) && (!this.Role || context.Role === this.Role);
		this.Ship = ship;
		this.Name = object && object.Name || ship;
		this.Current = this.Role || (seated ? context.Role : '');
	},

	/* The name of its role (a role of no name of its own: as it is written; none: Console). */
	RoleName: function () {
		var key = 'gaming.console.roles.' + this.Current;

		if (!this.Current)
			return Elemenx.Locale.Text('gaming.console.label');

		return Elemenx.Locale.Has(key) ? Elemenx.Locale.Text(key) : this.Current;
	},

	/* The hero stands up from the seat (beside it). */
	Stand: function () {
		var scene = this.ParentScene();
		if (scene && scene.Leave)
			scene.Leave(scene.Scene().Hero);
	}
});
