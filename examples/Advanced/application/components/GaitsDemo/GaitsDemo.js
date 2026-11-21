/*
 * GaitsDemo (Graphics): Scene · SceneMannequin: the gaits of the mannequin, each a graph of the library
 * (blueprints/animation/<clip>): its legs of the path of the feet (they do not slide), the rest keyed. Beside it X Bot plays
 * the clip of Mixamo the gait was compared with, when its files are in data/models of this copy (they are kept out of git).
 * Open graph shows the graph of the clip; a change of it is seen on the mannequin at once.
 */
Elemenx.Component('GaitsDemo', {
	$TemplateURL: 'GaitsDemo.html',
	$Traits: ['SceneDemo'],
	GaitsClip: 'walk',
	GaitsNote: '',
	GaitsGraph: null,
	GaitsMade: 0,
	GaitsClips: function () {
		var mannequin = this.$Service('SceneMannequin');

		/* The gaits, then the poses (no clip of Mixamo beside these: X Bot stands). */
		return mannequin.Gaits.concat(mannequin.Poses).map(function (name) {
			return {Value: name, Label: name};
		});
	},
	/* The clips of Mixamo for X Bot, of the files of data/models: what each gait was compared with. */
	GaitsReference: {
		idle: 'elf_anim/idle',
		walk: 'elf_anim/walking',
		jog: 'Slow Run',
		sprint: 'Fast Run',
		'walk-back': 'riffle_anim/walk backward',
		'run-back': 'riffle_anim/run backward',
		'strafe-left': 'elf_anim/left strafe walk',
		'strafe-right': 'elf_anim/right strafe walk',
		'strafe-left-run': 'elf_anim/left strafe',
		'strafe-right-run': 'elf_anim/right strafe',
		crouch: 'riffle_anim/idle crouching',
		'crouch-walk': 'riffle_anim/walk crouching forward',
		jump: 'elf_anim/jump',
		'jump-forward': 'elf_anim/jump'
	},
	GaitsViews: [{Value: 'side', Label: 'Side'}, {Value: 'front', Label: 'Front'}, {Value: 'back', Label: 'Back'}],
	GaitsView: 'side',
	GaitsReady: function (scene) {
		var self = this;
		var models = this.$Service('SceneModels');
		var request = new XMLHttpRequest();

		this.GaitsScene = function () {
			return scene;
		};

		models.Load('mannequin', function () {
			if (!scene.$Element().isConnected) return;

			scene.Add('unit', {ID: 'man', Name: 'Mannequin', Model: 'mannequin', X: 0, Y: 0, Size: 1.78, Facing: 90, Clip: self.GaitsClip});

			self.GaitsCamera();
			self.GaitsPlay();
		});

		/* X Bot beside it, of the files of Mixamo, when this copy has them. */
		request.open('HEAD', '/data/models/elf_anim/X Bot.fbx');

		request.onload = function () {
			var motions = {};

			if (request.status !== 200 || !scene.$Element().isConnected) return;

			Object.keys(self.GaitsReference).forEach(function (clip) {
				motions[clip] = {URL: '/data/models/' + self.GaitsReference[clip] + '.fbx', Stride: 1};
			});

			if (!models.Has('gaits-xbot'))
				models.Define('gaits-xbot', {URL: '/data/models/elf_anim/X Bot.fbx', Type: 'unit', Motions: motions});

			models.Load('gaits-xbot', function () {
				if (!scene.$Element().isConnected) return;

				scene.Add('unit', {ID: 'xbot', Name: 'X Bot', Model: 'gaits-xbot', X: 2.2, Y: 0, Size: 1.8, Facing: 90, Clip: self.GaitsClip});

				self.GaitsPlay();
			});
		};

		request.send();
	},
	/* The camera at the side of them (or ahead, or behind), at the height of the hips. */
	GaitsCamera: function () {
		var scene = this.GaitsScene ? this.GaitsScene() : null;
		var at = {side: [1.1, -6.5], front: [7.5, 0.4], back: [-6.5, 0.4]}[this.GaitsView];

		if (!scene) return;

		if (scene.Get('view'))
			scene.Remove('view');

		scene.Add('camera', {ID: 'view', X: at[0], Y: at[1], Lift: 1, Target: 'man', Focal: 35});
		scene.UseCamera('view');
	},
	GaitsViewChosen: function (value) {
		this.GaitsView = String(value && value.detail !== undefined ? value.detail : value);

		this.GaitsCamera();
	},
	GaitsChosen: function (value) {
		this.GaitsClip = String(value && value.detail !== undefined ? value.detail : value);

		if (this.GaitsGraph)
			this.GaitsGraphOpened();

		this.GaitsPlay();
	},
	/* Both play the clip in place; its numbers told. */
	GaitsPlay: function () {
		var scene = this.GaitsScene ? this.GaitsScene() : null;
		var mannequin = this.$Service('SceneMannequin');
		var clip;

		if (!scene) return;

		clip = mannequin.Gait(mannequin.Skeleton({}), this.GaitsClip);

		/* Its own clip from now on (what it plays when nothing else is asked), begun at once. */
		scene.Change('man', {Clip: this.GaitsClip});
		scene.Play('man', this.GaitsClip);

		if (scene.Get('xbot')) {
			scene.Change('xbot', {Clip: this.GaitsClip});
			scene.Play('xbot', this.GaitsClip);
		}

		this.GaitsNote = clip.Name + ': a cycle of ' + clip.Length.toFixed(2) + ' s' + (clip.Stride ? ', a stride of ' + (clip.Stride * 1.78).toFixed(2) + ' m, ' + (clip.Stride * 1.78 / clip.Length).toFixed(2) + ' m/s' : '') + (scene.Get('xbot') ? ' · X Bot: the clip of Mixamo' : '');
	},
	GaitsGraphOpened: function () {
		this.GaitsGraph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + this.GaitsClip)));
	},
	GaitsGraphClosed: function () {
		this.GaitsGraph = null;
	},
	/* The graph changed: the library's of that name in its place, the mannequin made again of it. */
	GaitsGraphChanged: function (value) {
		var graph = value && value.detail !== undefined ? value.detail : value;
		var scene = this.GaitsScene ? this.GaitsScene() : null;
		var self = this;
		var name;

		if (!graph || !scene) return;

		Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + this.GaitsClip, typeof graph === 'string' ? JSON.parse(graph) : graph);

		this.GaitsMade++;
		name = this.$Service('SceneMannequin').Define('gaits-mannequin-' + this.GaitsMade, {});

		this.$Service('SceneModels').Load(name, function () {
			if (!scene.$Element().isConnected) return;

			scene.Remove('man');
			scene.Add('unit', {ID: 'man', Name: 'Mannequin', Model: name, X: 0, Y: 0, Size: 1.78, Facing: 90, Clip: self.GaitsClip});

			self.GaitsPlay();
		});
	}
});
