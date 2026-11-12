/*
 * SpaceDemo (Graphics): Scene · SceneObject · Kinds: a drag turns, the wheel zooms, a click selects, a double click
 * flies to a body
 */
Elemenx.Component('SpaceDemo', {
	$TemplateURL: 'SpaceDemo.html',
	$StyleURL: 'SpaceDemo.css',
	$Traits: ['SceneDemo'],
	SpaceSeed: 'kepler-186',
	SpaceDay: 0,
	SpaceArrived: function (detail) {
		this.SpaceNote = 'Arrived: ' + this.Spaced().Get(detail.ID).Name + ' at ' + this.Spaced().Get(detail.At).Name;
	},
	SpaceNote: '',
	SpaceFocused: function (detail) {
		this.SpaceNote = detail.ID ? 'Flying to ' + this.Spaced().Get(detail.ID).Name : 'The whole system';
	},
	SpaceSelected: function (detail) {
		this.SpaceNote = detail.ID ? 'Selected: ' + detail.Object.Name : 'Nothing selected';
	},
	/* The space of the game: its methods kept for the buttons, its day shown in its HUD. */
	SpaceReady: function (space) {
		var self = this;

		this.Spaced = function () {
			return space;
		};

		this.SpaceKinds = space.CosmosKinds();

		window.clearInterval(this.SpaceTimer);

		this.SpaceTimer = window.setInterval(function () {
			if (!space.$Element().isConnected) {
				window.clearInterval(self.SpaceTimer);

				return;
			}

			self.SpaceDay = Math.floor(space.Now());
		}, 500);
	},
	SpaceCosmos: {Kind: 'nebula', Seed: 'sky-1'},
	SpaceMark: {Look: 'ring', Pulse: 1.6, Cursor: 'pointer'},
	SpaceAmount: function (name, value) {
		this.SpaceAmounts = Object.assign({}, this.SpaceAmounts);
		this.SpaceAmounts[name] = Number(value);

		this.SpaceBackdrop = this.SpaceBackdrop || 'void';

		this.SpaceMake();
	},
	/* One sky of all it can hold: what a backdrop chose, as far as the sliders changed it. */
	SpaceMake: function () {
		this.SpaceCosmos = this.SpaceBackdrop ? Object.assign({Kind: this.SpaceBackdrop, Seed: 'sky-' + this.SpaceSkies}, this.SpaceAmounts) : '';
	},
	SpaceAmounts: {Gas: 1, Dust: 0.7, Stars: 0.6, Band: 0, Galaxies: 1, Clusters: 0, Pillars: 0, Beacon: 1, Bursts: 1},
	SpaceSkies: 1,
	SpaceBackdrop: 'nebula',
	SpaceSky: function () {
		this.SpaceSkies++;

		if (this.SpaceBackdrop) this.SpaceMake();
		else this.SpaceBackdropChosen('nebula');
	},
	SpaceBackdropChosen: function (value) {
		this.SpaceBackdrop = value;

		if (value && this.SpaceKinds)
			this.SpaceAmounts = Object.assign({}, this.SpaceKinds[value]);

		this.SpaceMake();
	},
	SpaceBackdrops: [{Value: '', Label: 'Stars'}, {Value: 'nebula', Label: 'Nebula'}, {Value: 'pillars', Label: 'Pillars'}, {Value: 'galaxy', Label: 'Galaxy band'}, {Value: 'galaxies', Label: 'Galaxies'}, {Value: 'cluster', Label: 'Cluster'}, {Value: 'void', Label: 'Void'}],
	SpaceSent: function () {
		var space = this.Spaced ? this.Spaced() : null;
		var fleet = space ? space.Get('first') : null;
		if (!fleet) return;

		space.Move('first', fleet.Parent === 'mars' ? 'earth' : 'mars');

		this.SpaceNote = 'First fleet: to ' + (fleet.Parent === 'mars' ? 'Earth' : 'Mars');
	},
	SpacePausedToggled: function () {
		this.SpacePaused = !this.SpacePaused;
	},
	SpacePaused: false,
	SpaceScaled: function (value) {
		this.SpaceReal = value;
	},
	SpaceReal: false,
	SpaceOrbited: function (value) {
		this.SpaceOrbits = value;
	},
	SpaceOrbits: true,
	SpaceReseeded: function () {
		this.SpaceSeed = 'seed-' + Math.floor(Math.random() * 100000);
	},
	SpaceChosen: function (value) {
		this.SpaceSystem = value;
		this.SpaceNote = '';
	},
	SpaceSystems: [{Value: 'sol', Label: 'The Sun'}, {Value: 'seed', Label: 'Of a seed'}],
	RibbonTab: 'home',
	SpaceTab: 'system',

	$OnDestroy: function () {
		window.clearInterval(this.SpaceTimer);
	}
});
