/*
 * The game: the land, the gems on it, the HUD over it and the menu. A right press on the land sends the hero there
 * (GameStrategy orders it, the Scene finds its way round the water and the slopes); a trigger round each gem tells when
 * the hero comes to it. The last gem unlocks an achievement. Escape pauses.
 */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',
	Menu: true,
	Started: false,
	Found: 0,
	Target: '',
	Gems: [],
	/* The World of the land: a graph of its steps (SceneWorld), made in $OnCreate. */
	World: null,
	Start: [
		{ID: 'g1', X: -60, Y: 30},
		{ID: 'g2', X: 40, Y: -50},
		{ID: 'g3', X: 70, Y: 60},
		{ID: 'g4', X: -30, Y: -70},
		{ID: 'g5', X: 10, Y: 80}
	],

	$OnCreate: function () {
		var self = this;
		/* The scene, once it is ready: its methods (Change, SetViewpoint...). It stays out of the state. */
		var scene = null;

		/* Low hills round a lake: the usual World of these numbers, its steps edited as a graph like any other. */
		this.World = this.$Service('SceneWorld').Library({Size: 300, Height: 22, Water: 0.15, Scale: 260, Ridges: 0.1, Seed: 'gems'});

		this.Items = function (started) {
			return started ? [{ID: 'resume', Label: 'Resume'}, {ID: 'restart', Label: 'Start again'}] : [{ID: 'start', Label: 'Start', Hint: 'Find the five gems'}];
		};

		/* The scene for the methods: a function, so the scene is not state. */
		this.Land = function (instance) {
			if (instance)
				scene = instance;

			return scene;
		};

		/* Escape pauses the game, and goes on with it. */
		this.Key = function (event) {
			if (event.key === 'Escape' && self.Started)
				self.Menu = !self.Menu;
		};

		document.addEventListener('keydown', this.Key);

		/* The achievement of the game: data of the Achievements Service; the AchievementHost shows it as it is unlocked. */
		if (!this.$Service('Achievements').State('gem-hunter'))
			this.$Service('Achievements').Define({ID: 'gem-hunter', Title: 'Gem hunter', Text: 'All five gems found.', Rarity: 'epic', Points: 50});
	},

	$OnDestroy: function () {
		document.removeEventListener('keydown', this.Key);
	},

	/* The handlers of the events are methods of the definition: the template binds them as it renders. */
	Ready: function (scene) {
		this.Land(scene);

		scene.SetViewpoint({Target: [-20, 4, 10], Yaw: 0.6, Pitch: 0.75, Distance: 70});
	},

	Chosen: function (detail) {
		if (detail.ID === 'start' || detail.ID === 'restart') {
			this.Gems = this.Start.slice();
			this.Found = 0;
			this.Target = '';
			this.Started = true;

			this.$Service('Achievements').Reset('gem-hunter');

			if (this.Land())
				this.Land().Change('hero', {X: 0, Y: 0});
		}

		this.Menu = false;
	},

	/* Where the hero was sent. */
	Ordered: function (detail) {
		if (detail.Kind === 'move')
			this.Target = Math.round(detail.X) + ', ' + Math.round(detail.Z);
	},

	/* The hero came into the trigger round a gem: the gem is found. */
	Entered: function (detail) {
		var id = detail.Trigger.ID.replace(/^at-/, '');
		var found = this.Gems.filter(function (gem) {
			return gem.ID === id;
		})[0];
		if (!found || detail.ID !== 'hero') return;

		this.Gems = this.Gems.filter(function (gem) {
			return gem !== found;
		});
		this.Found++;

		if (!this.Gems.length) {
			this.$Service('Achievements').Unlock('gem-hunter');

			this.Started = false;
			this.Menu = true;
		}
	}
});
