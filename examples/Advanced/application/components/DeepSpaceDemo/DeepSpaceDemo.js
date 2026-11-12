/*
 * DeepSpaceDemo (Graphics): Scene · SceneDeepSpace: a black hole with its disc, light bent round it; a wormhole to
 * another sky; a comet; a quasar; a planetoid to land on. Point at them, press them
 */
Elemenx.Component('DeepSpaceDemo', {
	$TemplateURL: 'DeepSpaceDemo.html',
	$Traits: ['SceneDemo'],
	DeepSelected: function (event) {
		if (event.ID)
			this.DeepNote = 'Selected ' + (event.Object && event.Object.Name || event.ID) + '.';
	},
	DeepNote: 'Point at a black hole, a wormhole, a comet, the quasar: the pointer finds them and the scene tells hover; press one for its card.',
	DeepHovered: function (event) {
		this.DeepNote = event.ID ? 'Over ' + (event.Object && event.Object.Name || event.ID) + (event.Info && event.Info.Kind ? ' (' + event.Info.Kind + ')' : '') + ': press it for its card.' : 'Point at a black hole, a wormhole, a comet, the quasar.';
	},
	/* The cinema demo: Aria and Bram walk, the camera shot follows Aria, the screens stand behind them. */
	DeepReady: function (scene) {
		this.DeepScene = function () {
			return scene;
		};

		this.DeepFly({detail: this.DeepPlace});
	},
	DeepPlace: 'gargantua',
	DeepFly: function (value) {
		var scene = this.DeepScene ? this.DeepScene() : null;

		this.DeepPlace = value && value.detail !== undefined ? value.detail : value;

		if (!scene || this.DeepPlace === 'beacon') return;

		scene.FocusOn(this.DeepPlace);

		/* A comet is small: its tails are what is seen, from farther off. */
		if (this.DeepPlace === 'halley')
			scene.Scene().Wanted = 6;
	},
	SpaceMark: {Look: 'ring', Pulse: 1.6, Cursor: 'pointer'},
	DeepTakeOff: function () {
		var scene = this.DeepScene ? this.DeepScene() : null;
		if (scene)
			scene.TakeOff();
	},
	DeepLand: function () {
		var scene = this.DeepScene ? this.DeepScene() : null;
		if (scene)
			scene.Land('pebble', {Latitude: 10, Longitude: 210});
	},
	/* Deep space: where the view flies, what the pointer is over. */
	DeepPlaces: [
		{Value: 'gargantua', Label: 'Black hole Gargantua'},
		{Value: 'gate', Label: 'Wormhole'},
		{Value: 'halley', Label: 'Comet'},
		{Value: 'pebble', Label: 'Planetoid'},
		{Value: 'beacon', Label: 'Quasar'},
		{Value: 'vega', Label: 'The star'}
	]
});
