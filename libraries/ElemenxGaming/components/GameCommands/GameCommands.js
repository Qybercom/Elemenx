/*
 * The commands of a ship, declared inside a Scene (the trait SceneBehaviour): what ShipCommands of the scene gives of For (an
 * ID; empty: the hero if it is a ship, else the ship the hero sits in or walks in) each Every seconds (0.25): Land (at the
 * site chosen of the markers of the body, else under the ship), Take off, To orbit (with the hint nearer than 2000 km over
 * the body). A press gives the command (ShipCommand of the scene); the event command tells it ({ID, Done}). None while the
 * ship has none. Put it on the screen of the console of a pilot (in GameConsole it is) and in the instruments over the view
 * (GameFlight with Commands). Size small, medium or large; Label names it for screen readers.
 */
Elemenx.Component('GameCommands', {
	$TemplateURL: 'GameCommands.html',
	$StyleURL: 'GameCommands.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'send',
		Description: 'The commands of a ship now: land (at a site of the body or under it), take off, go to orbit; a press gives the command.',
		Props: {
			For: 'The ID of the ship; empty: the hero, or the ship the hero sits in or walks in.',
			Every: 'How often it reads, in seconds.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'Its name for screen readers.'
		},
		Events: {
			command: 'A command was given: {ID (land, takeoff, orbit), Done (false where the ship could not)}.'
		},
		Sample: {}
	},
	For: '',
	Every: 0.25,
	Size: 'medium',
	Label: '',
	Commands: [],
	Sites: [],
	Site: '',
	Hint: false,

	$OnCreate: function () {
		this.CommandsClock = Infinity;
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();

		this.CommandsClock += elapsed;

		if (this.CommandsClock < Number(this.Every || 0) || !scene || typeof scene.ShipCommands !== 'function') return;

		this.CommandsClock = 0;

		this.Show(scene.ShipCommands(this.For));
	},

	/* The commands there are (ShipCommands of a Scene: [{ID, Markers, Hint}]), as it shows them. */
	Show: function (list) {
		var given = list || [];
		var ids = given.map(function (one) {
			return one.ID;
		});
		var land = given.filter(function (one) {
			return one.ID === 'land';
		})[0];
		var orbit = given.filter(function (one) {
			return one.ID === 'orbit';
		})[0];
		var sites = land && land.Markers && land.Markers.length ? [{Value: '', Label: Elemenx.Locale.Text('gaming.commands.under')}].concat(land.Markers.map(function (marker) {
			return {Value: String(marker.ID), Label: marker.Name + (marker.Day === undefined ? '' : ' · ' + (marker.Day ? Elemenx.Locale.Text('gaming.commands.day') : Elemenx.Locale.Text('gaming.commands.night')))};
		})) : [];
		var site = this.Site;
		var known = sites.some(function (one) {
			return one.Value === site;
		});

		if (ids.join('|') !== this.Commands.join('|'))
			this.Commands = ids;

		if (JSON.stringify(sites) !== JSON.stringify(this.Sites))
			this.Sites = sites;

		if (!known)
			this.Site = '';

		this.Hint = !!orbit && orbit.Hint === 'orbit';
	},

	SiteChosen: function (value) {
		this.Site = String(value && value.detail !== undefined ? value.detail : value || '');
	},

	/* A command given (ShipCommand of the scene): land at the site chosen, else under the ship. */
	Command: function (id) {
		var scene = this.ParentScene();
		var done = !!scene && typeof scene.ShipCommand === 'function' && scene.ShipCommand(this.For, id, id === 'land' && this.Site ? {Marker: this.Site} : {});

		this.$Emit('command', {ID: id, Done: done});

		/* Read again at the next step: what it can do now changed. */
		this.CommandsClock = Infinity;
	}
});
