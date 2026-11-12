/*
 * TerrainDemo (Graphics): Scene · a ground of the Terrain Service: a drag turns, the wheel zooms, WASD moves, a click
 * selects a unit, a right click sends it
 */
Elemenx.Component('TerrainDemo', {
	$TemplateURL: 'TerrainDemo.html',
	$Traits: ['SceneDemo'],
	/* The grass of a biome, for the meadow whose clumps and spread the sliders set. */
	TerrainGrass: function (name) {
		var biome = this.$Service('SceneBiomes').Get(name);

		return biome ? biome.Grass : null;
	},
	TerrainHouses: [
		{ID: 'hall', Name: 'Hall', X: 40, Y: 40},
		{ID: 'mill', Name: 'Mill', X: 58, Y: 32},
		{ID: 'forge', Name: 'Forge', X: 48, Y: 60}
	],
	TerrainUnits: [
		{ID: 'scout', Name: 'Scout', X: 0, Y: 10},
		{ID: 'builder', Name: 'Builder', X: 6, Y: 14},
		{ID: 'ranger', Name: 'Ranger', X: -6, Y: 16}
	],
	/* The World of the valley: its relief of a noise (or its hills of Scale and Ridges), one biome or all by their climate. */
	TerrainWorld: function (biome, relief) {
		return this.WorldOf('valley', {Size: 900, Height: 55, Water: 0.32, Seed: 'valley', Noise: this.TerrainNoise(relief) || undefined, Biomes: biome === 'climate' ? this.TerrainClimateLands : [biome]});
	},
	/* The lands of the valley by its climate: each where its height, moisture and warmth are those of it. */
	TerrainClimateLands: ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp'],
	/* A boat on the sea, the nearest deep water to the middle: W, A, S and D drive it; again, the view is free. */
	/* The relief of the valley of a noise of the Noise Service (null: its hills of Scale and Ridges, as ever). */
	TerrainNoise: function (relief) {
		return this.TerrainNoises[relief] || null;
	},
	TerrainNoises: {
		dunes: {Type: 'worley', Seed: 'valley', Scale: 140, Fractal: 'fbm', Octaves: 3, Cell: {Return: 'f1'}, Invert: true, Power: 1.6},
		ridges: {Type: 'perlin', Seed: 'valley', Scale: 260, Fractal: 'ridged', Octaves: 6, Power: 1.8},
		billows: {Type: 'simplex', Seed: 'valley', Scale: 220, Fractal: 'billow', Octaves: 5},
		terraces: {Type: 'perlin', Seed: 'valley', Scale: 240, Fractal: 'fbm', Octaves: 5, Warp: {Amount: 0.6, Scale: 0.5}, Terrace: {Steps: 7, Sharp: 0.6}}
	},
	TerrainArrived: function (detail) {
		this.TerrainNote = this.Terrained().Get(detail.ID).Name + ' arrived at ' + detail.At.map(Math.round).join(', ');
	},
	TerrainNote: '',
	TerrainSelected: function (detail) {
		this.TerrainNote = detail.ID ? 'Selected: ' + detail.Object.Name + (detail.Object.Traits.Walker ? ' (a right click sends it)' : '') : 'Nothing selected';
	},
	TerrainReady: function (scene) {
		var self = this;

		this.Terrained = function () {
			return scene;
		};

		/* How far one sees, read twice a second while the scene is there (Visibility: the weather and the light). */
		window.clearInterval(this.TerrainSeeingClock);

		this.TerrainSeeingClock = window.setInterval(function () {
			var seen;

			if (!scene.$Element().isConnected) {
				window.clearInterval(self.TerrainSeeingClock);

				return;
			}

			seen = scene.Visibility();
			self.TerrainSeeing = 'Visibility ' + (seen.Distance >= 1000 ? (seen.Distance / 1000).toFixed(1) + ' km' : Math.round(seen.Distance) + ' m') + ' · light ' + Math.round(seen.Light * 100) + '% · a sight of 60 m reaches ' + Math.round(scene.SightOf(60)) + ' m';

			/* What the season does now (SeasonState): the leaves, the flowers, the burnt grass, the snow. */
			var year = scene.SeasonState();
			var percent = function (part) {
				return Math.round(part * 100) + '%';
			};

			self.TerrainYear = year ? 'Warmth ' + year.Warmth.toFixed(2) + ' · leaves fallen ' + percent(year.Bare) + ' · turned ' + percent(year.Turn) + ' · blossom ' + percent(year.Blossom) + ' · dry ' + percent(year.Dry) + ' · snow ' + percent(year.Snow) : '';
		}, 500);

		scene.FocusOn('scout');
	},
	TerrainYear: '',
	TerrainSeeing: '',
	/* The northern lights as the Scene takes them: by themselves (none), none, or as strong. */
	TerrainAuroraOf: function (choice) {
		return choice === 'off' ? 0 : choice === 'on' || choice === 'fantasy' ? 1 : null;
	},
	/* What a press selects is for the game to say (SelectCheck): here the walkers alone, never a tree or a house. */
	TerrainSelectable: function (object) {
		return !!(object && object.Traits && object.Traits.Walker);
	},
	TerrainLatitude: 45,
	TerrainDay: 172,
	/* A season chosen: the day turns to its middle too, so the sky and the light go with it; the view to the trees. */
	TerrainSeasonChosen: function (value) {
		var season = value && value.detail !== undefined ? value.detail : value;
		var days = {spring: 100, summer: 190, autumn: 290, winter: 15};

		this.TerrainSeason = season;

		if (days[season]) {
			this.TerrainDay = this.TerrainLatitude < 0 ? (days[season] + 182) % 365 : days[season];
			this.TerrainAurora = 'auto';
			this.SceneWeather = 'clear';

			this.TerrainTimed(14);
			this.TerrainLook(Math.PI / 2, 0.05);
		}
	},
	/* The view of the valley turned from the sun by an angle (0: toward it, PI: away), lifted up by pitch radians. */
	TerrainLook: function (from, up) {
		var scene = this.Terrained ? this.Terrained() : null;
		var ground = scene ? scene.Scene().Ground : null;
		var view;

		if (!ground || !ground.Sky) return;

		view = scene.Viewpoint();
		scene.Scene().Wanted = Math.min(view.Distance, 30);

		scene.SetViewpoint({Target: view.Target, Yaw: Math.atan2(ground.Sky[0], ground.Sky[2]) + Math.PI + from, Pitch: -up, Distance: Math.min(view.Distance, 30)});
	},
	TerrainTimed: function (value) {
		this.TerrainHour = Number(value);
	},
	TerrainHour: 16,
	TerrainAurora: 'auto',
	TerrainSeason: '',
	/* The year of the valley: a season fixed, or that of the day of the year at the latitude. */
	TerrainSeasons: [
		{Value: '', Label: 'Of the date'},
		{Value: 'spring', Label: 'Spring'},
		{Value: 'summer', Label: 'Summer'},
		{Value: 'autumn', Label: 'Autumn'},
		{Value: 'winter', Label: 'Winter'}
	],
	TerrainSummer: function () {
		this.TerrainAurora = 'auto';
		this.SceneWeather = 'clear';
		this.TerrainSeason = '';

		this.TerrainSky(45, 172);
		this.TerrainTimed(16);
	},
	/* The sun of the valley: its latitude and its day of the year. */
	TerrainSky: function (latitude, day) {
		this.TerrainLatitude = latitude;
		this.TerrainDay = day;
	},
	/* Far north on a winter night: the northern lights come by themselves. */
	TerrainPolarNight: function () {
		this.TerrainAurora = 'auto';
		this.SceneWeather = 'clear';
		this.TerrainSeason = '';

		this.TerrainSky(68, 355);
		this.TerrainTimed(23);
		this.TerrainLook(0, 0.4);
	},
	/* A storm over the valley, the view toward it: a flash inside the clouds, then a bolt to the land. */
	TerrainLightning: function () {
		var scene = this.Terrained ? this.Terrained() : null;
		if (!scene) return;

		this.SceneWeather = 'storm';

		this.TerrainLook(Math.PI / 2, 0.25);

		scene.Lightning('sheet');

		window.setTimeout(function () {
			scene.Lightning('strike');
		}, 1600);
	},
	TerrainAuroraChosen: function (value) {
		this.TerrainAurora = value && value.detail !== undefined ? value.detail : value;

		if (this.TerrainAurora !== 'auto' && this.TerrainAurora !== 'off' && this.TerrainHour > 5 && this.TerrainHour < 19) {
			this.TerrainTimed(23);
			this.TerrainLook(0, 0.4);
		}
	},
	TerrainAuroras: [
		{Value: 'auto', Label: 'By themselves (latitude, night)'},
		{Value: 'off', Label: 'None'},
		{Value: 'on', Label: 'On, anywhere at night'},
		{Value: 'fantasy', Label: 'Fantasy colors'}
	],
	/*
	 * A rainbow as it comes: a rain that ends with the clouds opening, the sun low; the view turned away from the sun and
	 * up a little, where the bow stands.
	 */
	TerrainRainbow: function () {
		var self = this;

		this.TerrainSky(45, 172);
		this.TerrainTimed(18.4);

		this.SceneWeather = 'rain';

		this.TerrainLook(Math.PI, 0.3);

		window.setTimeout(function () {
			self.SceneWeather = 'clear';

			self.TerrainLook(Math.PI, 0.3);
		}, 4000);
	},
	TerrainLoad: function () {
		this.Terrained().Load(this.TerrainSaved);

		this.TerrainNote = 'Loaded';
	},
	TerrainSaved: null,
	TerrainSave: function () {
		var saved = this.TerrainSaved = this.Terrained().Save();

		/* A recipe: what the methods changed over what the template declares. */
		this.TerrainNote = 'Saved: ' + (saved.Added.length + saved.Removed.length + Object.keys(saved.Overrides).length) + ' changes, ' + JSON.stringify(saved).length + ' bytes';
	},
	TerrainVillage: function () {
		var scene = this.Terrained ? this.Terrained() : null;
		if (!scene) return;

		this.TerrainNote = ['scout', 'builder', 'ranger'].filter(function (id, index) {
			return scene.Move(id, [30 + index * 6, 48 + index * 4]);
		}).length + ' going to the village';
	},
	TerrainBoat: function () {
		var scene = this.Terrained ? this.Terrained() : null;
		var field;
		var best = null;
		var x;
		var y;

		if (!scene) return;

		if (scene.Scene().Hero === 'boat') {
			scene.Control('');

			this.TerrainNote = 'Off the boat';

			return;
		}

		field = scene.Scene().Ground.Field;

		if (!scene.Scene().Objects.boat) {
			for (x = -400; x <= 400; x += 8) {
				for (y = -400; y <= 400; y += 8) {
					if (field.Height(x, y) < -6 && (!best || x * x + y * y < best[0] * best[0] + best[1] * best[1]))
						best = [x, y];
				}
			}

			if (!best) {
				this.TerrainNote = 'No sea deep enough for a boat';

				return;
			}

			scene.Add('unit', {ID: 'boat', Name: 'Boat', Model: 'boat', Size: 5.5, X: best[0], Y: best[1], Vehicle: {Kind: 'boat', Heading: Math.atan2(-best[0], -best[1]) + Math.PI}});
		}

		scene.Control('boat');

		this.TerrainNote = 'Boat: W the motor, S astern, A and D the rudder, Space stops it';
	},
	TerrainLake: function () {
		var scene = this.Terrained ? this.Terrained() : null;
		var terrain = this.$Service('SceneTerrainGenerator').Flat({Size: 900, Height: 55, Water: 0.32, Seed: 'valley'});
		var best = null;
		var x;
		var y;

		if (!scene) return;

		/* The nearest shore: dry ground beside the water, round the scout. */
		for (x = -200; x <= 200; x += 8) {
			for (y = -200; y <= 200; y += 8) {
				if (terrain.Height(x, y) > 0.5 && terrain.Height(x, y) < 2 && terrain.Slope(x, y) < 0.3 && (!best || Math.abs(x) + Math.abs(y) < Math.abs(best[0]) + Math.abs(best[1])))
					best = [x, y];
			}
		}

		this.TerrainNote = best && scene.Move('scout', best) ? 'Scout: to the lake at ' + best.join(', ') : 'No way to the lake';
	},
	/* How wild the sea of the Terrain demo is (Swell of its ground). */
	TerrainSwell: 0.35,
	TerrainRelief: 'classic',
	TerrainReliefs: [{Value: 'classic', Label: 'Classic hills'}, {Value: 'dunes', Label: 'Worley dunes'}, {Value: 'ridges', Label: 'Perlin ridges'}, {Value: 'billows', Label: 'Simplex billows'}, {Value: 'terraces', Label: 'Warped terraces'}],
	TerrainFrost: 0,
	TerrainGlass: true,
	TerrainMirrorBlur: 0,
	TerrainMirror: true,
	TerrainSpread: 0.45,
	TerrainClumps: 0.5,
	TerrainBiomed: function (value) {
		this.TerrainBiome = value;
	},
	TerrainBiome: 'temperate',
	TerrainBiomes: [{Value: 'temperate', Label: 'Temperate'}, {Value: 'taiga', Label: 'Taiga'}, {Value: 'tundra', Label: 'Tundra'}, {Value: 'desert', Label: 'Desert'}, {Value: 'savanna', Label: 'Savanna'}, {Value: 'swamp', Label: 'Swamp'}, {Value: 'alien', Label: 'Alien'}, {Value: 'climate', Label: 'All, by climate'}],

	$OnDestroy: function () {
		window.clearInterval(this.TerrainSeeingClock);
	}
});
