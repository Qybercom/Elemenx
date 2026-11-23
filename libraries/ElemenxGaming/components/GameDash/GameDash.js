/*
 * The instruments of a game over a Scene, declared inside it (the trait SceneBehaviour): what Readout of the scene reads of
 * For (an ID; empty: the hero, as the hero changes: in a car its dial of speed, its gear, its revolutions, its indicators
 * and its lights; on foot its health and its pace), each Every seconds (0.1). Size small, medium or large; Label names it
 * for screen readers. Regression: each demo read its car itself, and showed the car still once the driver had left it.
 */
Elemenx.Component('GameDash', {
	$TemplateURL: 'GameDash.html',
	$StyleURL: 'GameDash.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The instruments of a game over a Scene: of a vehicle its speed, gear, revolutions, indicators and lights; of a character on foot its health and pace.',
		Props: {
			For: 'The ID of what it reads; empty: the hero, as it changes.',
			Every: 'How often it reads, in seconds.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'Its name for screen readers.'
		},
		Sample: {Size: 'medium'}
	},
	For: '',
	Every: 0.1,
	Size: 'medium',
	Label: '',
	Kind: '',
	Speed: 0,
	TopSpeed: 300,
	Gear: 'N',
	Rpm: 0,
	Left: false,
	Right: false,
	Lights: false,
	Health: 100,

	$OnCreate: function () {
		this.DashClock = 0;
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();

		this.DashClock += elapsed;

		if (this.DashClock < Number(this.Every || 0) || !scene || typeof scene.Readout !== 'function') return;

		this.DashClock = 0;

		this.Show(scene.Readout(this.For || undefined));
	},

	/* What a readout says, as it shows: a dial and figures of a vehicle (Kind car, boat, ship), of a character on foot (walk). */
	Show: function (read) {
		if (!read) {
			this.Kind = '';

			return;
		}

		this.Kind = read.Kind;
		this.Speed = Math.round(read.Speed || 0);
		this.TopSpeed = Math.max(60, Math.round(read.TopSpeed || 300));
		this.Gear = this.GearOf(read.Gear);
		this.Rpm = Math.round((read.RpmPart || 0) * 100);
		this.Left = !!read.Left;
		this.Right = !!read.Right;
		this.Lights = !!read.Lights;
		this.Health = Math.round((read.HealthPart === undefined ? 1 : read.HealthPart) * 100);
	},

	/* A gear as a gearbox shows it: R, N, 1, 2... */
	GearOf: function (gear) {
		var number = Number(gear) || 0;

		return number < 0 ? 'R' : number === 0 ? 'N' : String(number);
	}
});
