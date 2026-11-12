/*
 * SceneDemo: what the demos of 3D scenes of the pages Graphics and Gaming share: the quality of their scenes (kept in the
 * browser between visits), the weather, the flare, the wind and the clock of their skies, the ways of the view of a
 * walker, and the Worlds of their grounds (made once for their numbers: a graph is not state).
 */
Elemenx.Trait('SceneDemo', {
	$StyleURL: 'SceneDemo.css',
	SceneQuality: 'auto',
	SceneQualities: [{Value: 'auto', Label: 'Auto'}, {Value: 'low', Label: 'Low'}, {Value: 'medium', Label: 'Medium'}, {Value: 'high', Label: 'High'}, {Value: 'ultra', Label: 'Ultra'}],
	SpaceSystem: 'sol',
	SceneWeather: 'clear',
	SceneWeathers: [{Value: 'clear', Label: 'Clear'}, {Value: 'cloudy', Label: 'Cloudy'}, {Value: 'overcast', Label: 'Overcast'}, {Value: 'rain', Label: 'Rain'}, {Value: 'storm', Label: 'Storm'}, {Value: 'snow', Label: 'Snow'}, {Value: 'fog', Label: 'Fog'}, {Value: 'changing', Label: 'Changing'}],
	SceneBokeh: 0,
	SceneFlare: 1,
	SceneWind: 1,
	PlacePersons: [{Value: 'third', Label: 'Third person'}, {Value: 'first', Label: 'First person'}, {Value: 'shoulder', Label: 'Over the shoulder'}],

	$OnCreate: function () {
		var self = this;
		var worlds = {};
		var grounds = {
			world: {Size: 320, Height: 18, Water: 0.12, Scale: 260, Ridges: 0.15, Seed: 'world'},
			meadow: {Size: 400, Height: 22, Water: 0.2, Scale: 420, Seed: 'meadow'}
		};

		/* The World of a ground (SceneWorld.Library): of its name, or of the numbers given. */
		this.WorldOf = function (name, options) {
			var given = options || grounds[name] || {};
			var key = name + JSON.stringify(given);

			worlds[key] = worlds[key] || self.$Service('SceneWorld').Library(given);

			return worlds[key];
		};

		try {
			this.SceneQuality = window.localStorage.getItem('ui-kit-quality') || 'auto';
		}
		catch (error) {
			this.SceneQuality = 'auto';
		}

		/* The quality chosen in the frame of the page (DemoFrame), one for all the demos. */
		this.QualityHeard = function (event) {
			self.SceneQuality = event.detail;
		};

		window.addEventListener('scene-demo-quality', this.QualityHeard);
	},

	$OnDestroy: function () {
		window.removeEventListener('scene-demo-quality', this.QualityHeard);
	},

	/* The quality of all the scenes: kept while the page is reopened, whatever the frames do; told to the page. */
	SceneQualityChosen: function (value) {
		this.SceneQuality = value;

		try {
			window.localStorage.setItem('ui-kit-quality', value);
		}
		catch (error) {
			value = String(value);
		}

		window.dispatchEvent(new CustomEvent('scene-demo-quality', {detail: value}));
	},

	SceneWeatherChosen: function (value) {
		this.SceneWeather = value;
	},

	SceneFlareChosen: function (value) {
		this.SceneFlare = Number(value);
	},

	SceneWindChosen: function (value) {
		this.SceneWind = Number(value);
	},

	/* The hours of a slider as a clock shows them. */
	PlaceClock: function (hours) {
		var minutes = Math.round(Number(hours) * 60);
		var part = minutes % 60;

		return (minutes < 600 ? '0' : '') + Math.floor(minutes / 60) + ':' + (part < 10 ? '0' : '') + part;
	}
});
