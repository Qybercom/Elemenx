/*
 * DemoLoading: an own loading screen of a Scene, made of components of ElemenxUI (Card, Progress, Steps), put in its slot
 * named loading: <Scene ...><DemoLoading slot="loading" Title="Racing" /></Scene>. The Scene shows its slot in place of its
 * own bar while it loads; this screen hears its event loading ({Part, Stage, Stages: [{Name, Label, Done, Total}]}) and
 * shows how far it is in all and stage by stage.
 */
Elemenx.Component('DemoLoading', {
	$TemplateURL: 'DemoLoading.html',
	$StyleURL: 'DemoLoading.css',

	Title: '',
	Part: 0,
	Stage: '',
	Stages: [],
	Version: 0,
	Gone: false,

	$OnReady: function () {
		this.Find(0);
	},

	/* Its Scene: the one it is put in (it may come into its slot a little after it is made); how far it is now, then each step of it. */
	Find: function (tries) {
		var self = this;
		var root = this.$Element().closest('.elemenx-scene');
		var scene = root ? Elemenx.Instance(root) : null;
		var stages;

		if (this.Gone) return;

		if (!scene || !scene.Scene) {
			if (tries < 100)
				window.setTimeout(function () {
					self.Find(tries + 1);
				}, 50);

			return;
		}

		stages = scene.Scene().LoadingStages || [];

		this.Told({Part: scene.Loading || 0, Stage: scene.LoadingStage, Stages: stages.filter(function (one) {
			return one.Total > 0;
		})});

		scene.$On('loading', function (event) {
			if (!self.Gone)
				self.Told(event && event.detail && event.detail.Part !== undefined ? event.detail : event);
		});
	},

	$OnDestroy: function () {
		this.Gone = true;
	},

	Told: function (state) {
		this.Part = state.Part;
		this.Stage = state.Stage || '';
		this.Stages = state.Stages || [];
		this.Version++;
	},

	StageText: function () {
		var stage = this.Stages.filter(function (one) {
			return one.Name === this.Stage;
		}, this)[0];

		return stage ? stage.Label + ': ' + stage.Done + ' / ' + stage.Total : '';
	},

	StepItems: function () {
		return this.Stages.map(function (one) {
			return {ID: one.Name, Label: one.Label, Description: one.Done + ' / ' + one.Total};
		});
	},

	ActiveSteps: function () {
		return this.Stage ? [this.Stage] : [];
	},

	DoneSteps: function () {
		return this.Stages.filter(function (one) {
			return one.Done >= one.Total;
		}).map(function (one) {
			return one.Name;
		});
	}
});
