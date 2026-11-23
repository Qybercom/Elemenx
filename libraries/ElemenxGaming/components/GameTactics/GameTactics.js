/*
 * The modes of the seat the hero sits in, declared inside a Scene (the trait SceneBehaviour): a button for each of its
 * Tactics (SceneTactics: its seat, helm, turret, radar, schematic, strategic), the one it is in marked; a press goes to it (Tactic
 * of the scene). None while the hero sits nowhere or has no mode but its seat. It reads each Every seconds (0.25). Size
 * small, medium or large; Label names it for screen readers. Put it on the screen of a console (in GameConsole it is) and
 * over the view (a GameHud), to come back from a mode as well.
 */
Elemenx.Component('GameTactics', {
	$TemplateURL: 'GameTactics.html',
	$StyleURL: 'GameTactics.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'crosshair',
		Description: 'The modes of the seat the hero sits in (its seat, helm, turret, radar, schematic): a button for each, the one it is in marked.',
		Props: {
			Every: 'How often it reads, in seconds.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'Its name for screen readers.'
		},
		Sample: {}
	},
	Every: 0.25,
	Size: 'medium',
	Label: '',
	Modes: [],
	Current: '',

	$OnCreate: function () {
		this.TacticsClock = Infinity;
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();

		this.TacticsClock += elapsed;

		if (this.TacticsClock < Number(this.Every || 0) || !scene || typeof scene.Tactics !== 'function') return;

		this.TacticsClock = 0;

		this.Show(scene.Tactics(), scene.Tactic());
	},

	/* The modes there are ('' the seat first) and the one the hero is in. */
	Show: function (modes, current) {
		var list = modes && modes.length > 1 ? modes.slice() : [];
		if (list.join('|') !== this.Modes.join('|'))
			this.Modes = list;

		this.Current = current || '';
	},

	IconOf: function (mode) {
		return {'': 'monitor', helm: 'steering', turret: 'crosshair', radar: 'compass', schematic: 'layers', strategic: 'map'}[mode] || 'grid';
	},

	NameOf: function (mode) {
		var key = 'gaming.tactics.modes.' + (mode || 'seat');

		return Elemenx.Locale.Has(key) ? Elemenx.Locale.Text(key) : mode;
	},

	/* The hero goes to a mode of its seat. */
	Choose: function (mode) {
		var scene = this.ParentScene();
		if (scene && scene.Tactic)
			this.Current = scene.Tactic(mode);
	}
});
