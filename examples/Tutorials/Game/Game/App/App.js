/*
 * The game: the world, the gems on it, the HUD over it and the menu. A press on a cell sends the hero there (GameWorld
 * finds the way); a gem under the hero when it arrives is found. Escape pauses.
 */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',
	Menu: true,
	Started: false,
	Found: 0,
	Target: '',
	Gems: [],
	Rows: [
		'..........~~........',
		'..TT......~~....^^..',
		'..TT......=~........',
		'..........~~...##...',
		'....##....~~...##...',
		'....##..............',
		'..........~~....TT..',
		'..........~~....TT..'
	],
	Start: [
		{ID: 'g1', X: 3, Y: 6},
		{ID: 'g2', X: 8, Y: 1},
		{ID: 'g3', X: 13, Y: 2},
		{ID: 'g4', X: 18, Y: 4},
		{ID: 'g5', X: 15, Y: 7}
	],

	$OnCreate: function () {
		var self = this;
		/* The world, once it is ready: its methods (Order, Change, CenterOn...). It stays out of the state. */
		var world = null;

		this.Items = function (started) {
			return started ? [{ID: 'resume', Label: 'Resume'}, {ID: 'restart', Label: 'Start again'}] : [{ID: 'start', Label: 'Start', Hint: 'Find the five gems'}];
		};

		/* The world for the methods: a function, so the world is not state. */
		this.World = function (instance) {
			if (instance)
				world = instance;

			return world;
		};

		/* Escape pauses the game, and goes on with it. */
		this.Key = function (event) {
			if (event.key === 'Escape' && self.Started)
				self.Menu = !self.Menu;
		};

		document.addEventListener('keydown', this.Key);
	},

	$OnDestroy: function () {
		document.removeEventListener('keydown', this.Key);
	},

	/* The handlers of the events are methods of the definition: the template binds them as it renders. */
	Ready: function (world) {
		this.World(world);
	},

	Chosen: function (detail) {
		if (detail.ID === 'start' || detail.ID === 'restart') {
			this.Gems = this.Start.slice();
			this.Found = 0;
			this.Started = true;

			if (this.World())
				this.World().Change('hero', {X: 1, Y: 1});
		}

		this.Menu = false;
	},

	/* A cell pressed: the hero goes there, round what blocks the way. */
	Pressed: function (detail) {
		if (this.Menu || !this.World()) return;

		this.Target = detail.X + ', ' + detail.Y;

		this.World().Order(['hero'], {X: detail.X, Y: detail.Y});
	},

	Arrived: function (detail) {
		var found = this.Gems.filter(function (gem) {
			return gem.X === detail.X && gem.Y === detail.Y;
		})[0];
		if (!found) return;

		this.Gems = this.Gems.filter(function (gem) {
			return gem !== found;
		});
		this.Found++;

		if (!this.Gems.length) {
			this.$Service('Achievements').Show({Title: 'Gem hunter', Text: 'All five gems found.', Rarity: 'epic', Points: 50, Icon: 'trophy'});

			this.Started = false;
			this.Menu = true;
		}
	}
});
