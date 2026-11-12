/*
 * CinemaDemo (Graphics): Scene · SceneCamera, SceneScreens, SceneCinema: lenses of real cameras, rigs, screens of a
 * camera, a canvas and live HTML, cutscenes and their video
 */
Elemenx.Component('CinemaDemo', {
	$TemplateURL: 'CinemaDemo.html',
	$StyleURL: 'CinemaDemo.css',
	$Traits: ['SceneDemo'],
	CinemaLampToggled: function (value) {
		var scene = this.CinemaScene ? this.CinemaScene() : null;

		this.CinemaLamp = value && value.detail !== undefined ? !!value.detail : !!value;

		if (scene && scene.Get('lamp'))
			scene.Change('lamp', {Power: this.CinemaLamp ? 1.6 : 0});
	},
	CinemaLamp: true,
	CinemaPresses: 0,
	CinemaPressed: function () {
		this.CinemaPresses++;
	},
	/* A cue of the film: the lamp turns. */
	CinemaCued: function (event) {
		var detail = event && event.detail ? event.detail : event;
		if (detail && detail.Name === 'lamp')
			this.CinemaLampToggled(!this.CinemaLamp);
	},
	/* Aria walks to and fro between two points. */
	CinemaArrived: function (event) {
		var detail = event && event.detail ? event.detail : event;
		var scene = this.CinemaScene ? this.CinemaScene() : null;
		if (!scene || !detail || detail.ID !== 'aria') return;

		this.CinemaGoal = -this.CinemaGoal;

		this.CinemaWalk();
	},
	/* Aria sent to her next point; asked again a moment later while the ground cannot lead her yet. */
	CinemaWalk: function () {
		var self = this;
		var scene = this.CinemaScene ? this.CinemaScene() : null;
		if (!scene || !scene.$Element().isConnected) return;

		if (!scene.Move('aria', [this.CinemaGoal, 0]))
			window.setTimeout(function () {
				self.CinemaWalk();
			}, 1000);
	},
	CinemaGoal: 8,
	CinemaReady: function (scene) {
		var self = this;

		this.CinemaScene = function () {
			return scene;
		};

		this.$Service('SceneModels').Load('mannequin', function () {
			if (!scene.$Element().isConnected) return;

			scene.Add('unit', {ID: 'aria', Name: 'Aria', Model: 'mannequin', X: -8, Y: 0, Size: 1.7, Facing: 90, Speed: 1.4});
			scene.Add('unit', {ID: 'bram', Name: 'Bram', Model: 'mannequin', X: 4, Y: 3, Size: 1.85, Clip: 'idle', Facing: 250});
			scene.Add('camera', {ID: 'shot', Follow: 'aria', At: [1.6, 1.6, 5.5], Target: 'aria'});
			scene.Add('camera', {ID: 'cctv', X: 10, Y: 12, Lift: 4.5, Target: 'aria', Focal: 24});
			scene.Add('camera', {ID: 'orbiter', X: 0, Y: -10, Lift: 2, Target: 'aria', Focal: 40, Aperture: 2.8});
			scene.Add('light', {ID: 'lamp', X: 1.5, Y: 8.5, Height: 3, Color: '#ffc27a', Power: 1.6, Radius: 12});
			scene.Add('screen', {ID: 'tv', X: -2.2, Y: 10, Lift: 1.5, Width: 1.6, Height: 0.9, Yaw: 180, Camera: 'cctv', Pixels: [512, 288]});
			scene.Add('screen', {ID: 'panel', X: 0, Y: 10, Lift: 1.5, Width: 1.6, Height: 0.9, Yaw: 180, Element: 'cinema-panel'});
			scene.Add('screen', {ID: 'hud', X: 2.2, Y: 10, Lift: 2.1, Width: 1.6, Height: 0.48, Yaw: 180, Element: 'cinema-hud'});

			self.CinemaGoal = 8;

			self.CinemaWalk();
			self.CinemaApply();
		});

		scene.Scene().Wanted = 6;
		scene.Scene().Pitch = 0.06;

		scene.SetViewpoint({Target: [0, 1.6, 10], Yaw: Math.PI, Pitch: 0.06, Distance: 6});
	},
	/* The lens and the rig chosen, on the camera shot (or the view, or the CCTV camera); a night lens takes the sun down. */
	CinemaApply: function () {
		var scene = this.CinemaScene ? this.CinemaScene() : null;
		var plain = {Focal: 50, Aperture: '', ISO: '', Shutter: '', ND: 0, Temperature: 6500, Saturation: 1, Contrast: 1, Distortion: 0, Aberration: 0, Grain: '', Vignette: '', Polarizer: 0};
		var lenses = {
			normal: {Focal: 50, Aperture: 2.8},
			portrait: {Focal: 85, Aperture: 1.4},
			wide: {Focal: 14, Aperture: 8, Distortion: -0.6, Aberration: 0.7},
			film: {Focal: 35, Aperture: 2, ISO: 200, Shutter: 1 / 48, ND: 4, Temperature: 7600, Saturation: 1.1, Contrast: 1.12},
			night: {Focal: 35, Aperture: 1.8, ISO: 6400, Shutter: 1 / 30}
		};

		if (!scene || !scene.Get('shot')) return;

		scene.Change('evening', {Time: this.CinemaLens === 'night' ? 23 : 17.5});
		scene.Change('shot', Object.assign({}, plain, lenses[this.CinemaLens] || {}, {Rig: this.CinemaRig}));
		scene.Cinema(this.CinemaLens === 'film' ? {Letterbox: 1, Ratio: 2.39} : null);

		/* The view of the scene looks at the screens, near enough to read them. */
		if (this.CinemaLens === 'view') {
			var ground = scene.Scene().Ground;
			var height = ground && ground.Field ? ground.Field.Height(0, 10) : 0;

			scene.Scene().Wanted = 5;

			scene.SetViewpoint({Target: [0, height + 1.6, 10], Yaw: Math.PI, Pitch: 0.05, Distance: 5});
		}

		scene.UseCamera(this.CinemaLens === 'view' ? '' : this.CinemaLens === 'cctv' ? 'cctv' : 'shot', {Fly: 1.2});
	},
	CinemaRig: 'handheld',
	CinemaLens: 'portrait',
	CinemaNote: 'The camera shot follows Aria as she walks; behind her stand three screens: what the CCTV camera sees, a live panel of this page (press its button and its toggle there, in the world) and a HUD of no background. Cutscene plays a short film: cuts, an orbit, a title typed out, a subtitle, a cue that turns the lamp.',
	/* The film played as a video, saved as a file when it ends. */
	CinemaRecord: function () {
		var self = this;
		var scene = this.CinemaScene ? this.CinemaScene() : null;
		if (!scene) return;

		this.CinemaRecording = true;

		scene.PlayCutscene(Object.assign(this.CinemaFilm(), {Record: {Fps: 30}}), function (error, result) {
			var link;

			self.CinemaRecording = false;

			if (error || !result || !result.Video) return;

			link = document.createElement('a');
			link.href = URL.createObjectURL(result.Video);
			link.download = 'elemenx-cinema.webm';

			link.click();

			window.setTimeout(function () {
				URL.revokeObjectURL(link.href);
			}, 10000);
		});
	},
	/* The short film of the demo. */
	CinemaFilm: function () {
		return {Name: 'demo', Restore: true, Skip: true, Tracks: [
			{Type: 'fade', Keys: [{At: 0, Value: 1}, {At: 1.2, Value: 0}, {At: 12, Value: 0}, {At: 13, Value: 1}]},
			{Type: 'letterbox', Keys: [{At: 0, Value: 1, Ratio: 2.39}]},
			{Type: 'camera', Keys: [{At: 0, Camera: 'cctv'}, {At: 4, Camera: 'orbiter'}, {At: 9, Camera: 'shot', Fly: 1.5}]},
			{Type: 'orbit', ID: 'orbiter', At: 4, Length: 5, Around: 'aria', Radius: 6, Height: 1.6, From: 200, To: 330},
			{Type: 'title', Items: [{At: 0.8, Length: 3, Text: 'Camera and cinema', Kind: 'chapter', Typing: 16}]},
			{Type: 'subtitle', Items: [{At: 5, Length: 3.5, Text: 'A camera, a lens, a light, and a story.', Speaker: 'Aria'}]},
			{Type: 'cue', Items: [{At: 7, Name: 'lamp'}]},
			{Type: 'title', Items: [{At: 10, Length: 2.5, Text: 'Elemenx', Kind: 'title', Place: 'bottom', In: 0.6, Out: 0.8}]}
		]};
	},
	CinemaRecording: false,
	CinemaPlay: function () {
		var scene = this.CinemaScene ? this.CinemaScene() : null;
		if (scene)
			scene.PlayCutscene(this.CinemaFilm());
	},
	CinemaRigChosen: function (value) {
		this.CinemaRig = value && value.detail !== undefined ? value.detail : value;

		this.CinemaApply();
	},
	CinemaRigs: [
		{Value: 'tripod', Label: 'Tripod'},
		{Value: 'handheld', Label: 'Handheld'},
		{Value: 'gimbal', Label: 'Gimbal'},
		{Value: 'steadicam', Label: 'Steadicam'},
		{Value: 'drone', Label: 'Drone'}
	],
	CinemaLensChosen: function (value) {
		this.CinemaLens = value && value.detail !== undefined ? value.detail : value;

		this.CinemaApply();
	},
	/* The cinema demo (SceneCamera, SceneScreens, SceneCinema): its lenses and rigs, what its live panel holds. */
	CinemaLenses: [
		{Value: 'view', Label: 'The view of the scene (no camera)'},
		{Value: 'normal', Label: '50 mm f/2.8'},
		{Value: 'portrait', Label: 'Portrait 85 mm f/1.4'},
		{Value: 'wide', Label: 'Wide 14 mm, barrel and fringes'},
		{Value: 'film', Label: 'Film 35 mm, 1/48 s, warm, bars'},
		{Value: 'night', Label: 'Night, ISO 6400, 1/30 s, grain'},
		{Value: 'cctv', Label: 'The CCTV camera on its pole'}
	]
});
