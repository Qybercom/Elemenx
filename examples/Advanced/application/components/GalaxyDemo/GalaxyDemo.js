/*
 * GalaxyDemo (Graphics): Scene · Setting galaxy (SceneGalaxy, GalaxyData): a galaxy of a seed and of a kind, its black hole
 * at its middle, its stars made sector by sector as the view comes near; a star picked, its system entered and left; the
 * time slider turns it as a galaxy turns.
 */
Elemenx.Component('GalaxyDemo', {
	$TemplateURL: 'GalaxyDemo.html',
	$StyleURL: 'GalaxyDemo.css',
	$Traits: ['SceneDemo'],
	GalaxyKind: 'spiral',
	GalaxySeed: 'aurelia',
	GalaxyTime: 0,
	GalaxyStar: '',
	GalaxyEntered: '',
	GalaxyOptions: {Seed: 'aurelia', Kind: 'spiral'},
	GalaxyNote: 'A drag turns, the wheel brings it near, a right drag moves along it; near, press a star to pick it, a double press flies to it.',
	GalaxyKinds: [
		{Value: 'spiral', Label: 'Spiral'},
		{Value: 'barred', Label: 'Barred spiral'},
		{Value: 'lenticular', Label: 'Lenticular'},
		{Value: 'elliptical', Label: 'Elliptical'},
		{Value: 'irregular', Label: 'Irregular'},
		{Value: 'dwarf', Label: 'Dwarf'},
		{Value: 'ring', Label: 'Ring'}
	],
	GalaxySeeds: [
		{Value: 'aurelia', Label: 'Aurelia'},
		{Value: 'borea', Label: 'Borea'},
		{Value: 'cassia', Label: 'Cassia'}
	],

	GalaxyReady: function (scene) {
		this.GalaxyScene = function () {
			return scene;
		};
	},

	GalaxyMade: function () {
		this.GalaxyOptions = {Seed: this.GalaxySeed, Kind: this.GalaxyKind};
		this.GalaxyStar = '';
	},

	GalaxyKindChosen: function (value) {
		this.GalaxyKind = value && value.detail !== undefined ? value.detail : value;

		this.GalaxyMade();
	},

	GalaxySeedChosen: function (value) {
		this.GalaxySeed = value && value.detail !== undefined ? value.detail : value;

		this.GalaxyMade();
	},

	GalaxyPicked: function (event) {
		var star = event.Star;

		this.GalaxyStar = event.ID;

		if (star) this.GalaxyNote = star.Name + ': a star of class ' + star.Class + ', ' + star.Mass + ' Suns, ' + Math.round(star.Temperature) + ' K. Enter its system, or a double press flies to it.';
		else if (event.Centre) this.GalaxyNote = 'The supermassive black hole at its middle: ' + Math.round(this.GalaxyScene().GalaxyData().Manifest.Centre.Mass / 1e5) / 10 + ' million Suns.';
		else this.GalaxyNote = 'Come nearer (the wheel) and press a star to pick it.';
	},

	GalaxyCentre: function () {
		if (this.GalaxyScene)
			this.GalaxyScene().GalaxyFocus('');
	},

	GalaxyEnter: function () {
		if (this.GalaxyScene && this.GalaxyStar)
			this.GalaxyScene().EnterSystem(this.GalaxyStar);
	},

	GalaxyIn: function (event) {
		this.GalaxyEntered = event.ID;
		this.GalaxyNote = 'The system of ' + event.Star.Name + ', made of its seed: its sky the band of its galaxy. Back to the galaxy goes out again.';
	},

	GalaxyLeave: function () {
		if (this.GalaxyScene)
			this.GalaxyScene().LeaveSystem();
	},

	GalaxyOut: function () {
		this.GalaxyEntered = '';
		this.GalaxyNote = 'Back in the galaxy, by the star whose system it was.';
	}
});
