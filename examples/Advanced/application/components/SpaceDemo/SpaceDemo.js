/*
 * SpaceDemo (Graphics): Scene · SceneObject · Kinds: a drag turns, the wheel zooms, a click selects, a double click
 * flies to a body
 */
Elemenx.Component('SpaceDemo', {
	$TemplateURL: 'SpaceDemo.html',
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

		this.SpaceSuns();

		window.clearInterval(this.SpaceTimer);

		this.SpaceTimer = window.setInterval(function () {
			if (!space.$Element().isConnected) {
				window.clearInterval(self.SpaceTimer);

				return;
			}

			self.SpaceDay = Math.floor(space.Now());
		}, 500);
	},
	/* The suns burn as the star of the library has it (LibraryStar): their prominences rise and fall over a round, as much as Activity. */
	SpaceLiving: true,
	SpaceActivity: 1,
	SpaceLived: function (value) {
		this.SpaceLiving = !!value;

		this.SpaceSuns();
	},
	SpaceActive: function (value) {
		this.SpaceActivity = Number(value);

		this.SpaceSuns();
	},
	SpaceSuns: function () {
		var space = this.Spaced ? this.Spaced() : null;
		var look = space && this.SpaceLiving ? space.LibraryStar() : null;
		var self = this;

		if (!space) return;

		/* Each change makes the scene again: the suns of a system, not the hundreds of a cluster. */
		space.Objects().filter(function (object) {
			return object.Kind === 'star';
		}).slice(0, 12).forEach(function (star) {
			space.Change(star.ID, {Traits: {Star: {Blueprint: look, Parameters: {Activity: self.SpaceActivity, Cycle: 40}}}});
		});
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

		if (value === 'cluster')
			this.SpaceClustered(this.SpaceClusterType);

		if (value === 'nebula')
			this.SpaceNebulaChosen(this.SpaceNebulaType);
	},
	SpaceSystems: [{Value: 'sol', Label: 'The Sun'}, {Value: 'seed', Label: 'Of a seed'}, {Value: 'file', Label: 'Of a file'}, {Value: 'cluster', Label: 'A cluster'}, {Value: 'nebula', Label: 'A nebula'}],
	/* A star cluster of GalaxyData: its stars with the planets their room leaves them, the swarm of the others round its middle. */
	/* A nebula of SceneNebula, seen as a volume from outside and from within, what made it at its middle. */
	SpaceNebulaType: 'hii',
	SpaceNebulaTypes: [{Value: 'hii', Label: 'HII region'}, {Value: 'planetary', Label: 'Planetary'}, {Value: 'remnant-Ia', Label: 'Remnant Ia'}, {Value: 'remnant-II', Label: 'Remnant II'}, {Value: 'remnant-Ib', Label: 'Remnant Ib'}, {Value: 'remnant-Ic', Label: 'Remnant Ic'}, {Value: 'dark', Label: 'Dark'}],
	SpaceNebula: null,
	SpaceNebulaChosen: function (value) {
		var parts = String(value).split('-');
		var type = parts[0];
		var middle = {hii: [{ID: 'o1', Kind: 'star', Values: {Name: 'Theta 1 C'}, Traits: {Star: {Mass: 33, Temperature: 39000}, Orbit: {Distance: 9000, Unit: 'AU'}}}, {ID: 'o2', Kind: 'star', Values: {Name: 'Theta 1 A'}, Traits: {Star: {Mass: 16, Temperature: 30000}, Orbit: {Distance: 15000, Anomaly: 140, Unit: 'AU'}}}], planetary: [{ID: 'core', Kind: 'white-dwarf', Values: {Name: 'Its white dwarf'}}], remnant: parts[1] === 'Ia' ? [] : [{ID: 'core', Kind: 'pulsar', Values: {Name: 'Its pulsar'}}], dark: []}[type];

		this.SpaceNebulaType = value;
		this.SpaceNebula = {Objects: [{ID: 'nebula', Kind: 'nebula', Values: {Name: (this.SpaceNebulaTypes.filter(function (one) {
			return one.Value === value;
		})[0] || {}).Label}, Traits: {Nebula: {Type: type, Subtype: parts[1] || '', Radius: {hii: 12, planetary: 0.5, remnant: 9, dark: 6}[type], Seed: 'demo-' + value}}, Children: middle}]};
	},
	SpaceClusterType: 'globular',
	SpaceClusterTypes: [{Value: 'open', Label: 'Open'}, {Value: 'globular', Label: 'Globular'}, {Value: 'nuclear', Label: 'Nuclear'}],
	SpaceCluster: null,
	SpaceClustered: function (type) {
		var key = 'demo-cluster-' + type;

		this.$Service('SystemData').Use(key, this.$Service('GalaxyData').Cluster({Seed: 'demo-' + type, Type: type}));

		this.SpaceClusterType = type;
		this.SpaceCluster = {Data: key};
	},
	/* A system of the system format (SystemData): two suns round their barycentre, Terra of its own planet file, a black hole with a shard. */
	SpaceFile: {Data: '/data/systems/binary.system'},
	RibbonTab: 'home',
	SpaceTab: 'system',

	$OnDestroy: function () {
		window.clearInterval(this.SpaceTimer);
	}
});
