/*
 * SceneMark: what it holds (any components: a card, a bar, a chart of Chart or Sparkline, a Meter) over a place of the
 * Scene it is declared in, in its slot hud: <Scene> <SceneMark slot="hud" For="ship" Line="true"> <Card>...</Card>
 * </SceneMark> </Scene>. Each frame the scene lays it out with its other marks (SceneMarks, the names of the objects
 * among them): For an object (Part: a socket of its model, Up: its sizes over its middle) or Point [x, y, z] of the world,
 * Offset [x, y, z], Shift [x, y] pixels, Align (bottom, top, center); Line (true, auto, false), Occlude, Edge (at the edge
 * of the view with an arrow when its place is off it), Declutter, Cluster and ClusterRadius, Near and Far (faded out by
 * how far it is, in metres), Priority. Key names it among the marks (its own one else).
 */
Elemenx.Component('SceneMark', {
	$TemplateURL: 'SceneMark.html',
	$StyleURL: 'SceneMark.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'map-pin',
		Description: 'What it holds over a place of the scene, laid out each frame with the other marks: off each other, hidden behind bodies, at the edge with an arrow.',
		Props: {
			Key: 'Its name among the marks (its own one else).',
			For: 'The ID of the object it stands over.',
			Part: 'A socket of the model of that object (by Name or ID).',
			Point: 'A point of the world [x, y, z] (with no For).',
			Up: 'How many sizes of the object over its middle (1.15).',
			Offset: 'Added to the point, [x, y, z].',
			Shift: 'Moved on the screen, [x, y] pixels.',
			Align: {Options: ['bottom', 'top', 'center'], Description: 'What of it stands on the point.'},
			Line: {Options: ['auto', 'true', 'false'], Description: 'A line from the point to it: always, when it was moved (auto) or never.'},
			Occlude: 'Hidden behind bodies and the ground (true for an object).',
			Edge: 'At the edge of the view with an arrow when its place is off it.',
			Declutter: 'Moved off the marks before it (true).',
			Cluster: 'A name: marks of it near each other show as one with a badge +N.',
			ClusterRadius: 'How near, in pixels (36).',
			Near: 'Fully seen nearer than this, in metres.',
			Far: 'Gone this far, in metres (0: never).',
			Priority: 'Laid out before those of less (0).'
		},
		Sample: {For: 'ship', Line: 'true'}
	},
	Key: '',
	For: '',
	Part: '',
	Point: null,
	Up: 1.15,
	Offset: null,
	Shift: null,
	Align: 'bottom',
	Line: 'auto',
	Occlude: '',
	Edge: false,
	Declutter: true,
	Cluster: '',
	ClusterRadius: 36,
	Near: '',
	Far: 0,
	Priority: 0,

	$OnCreate: function () {
		this.MarkKey = 'mark:' + Math.random().toString(36).slice(2);
	},

	SceneStart: function () {
		this.Marked();
	},

	$OnProps: function () {
		this.Marked();
	},

	SceneStop: function () {
		this.Unmarked();
	},

	$OnDestroy: function () {
		this.Unmarked();
	},

	/* Told to the scene again as its props are now. */
	Marked: function () {
		var scene = this.ParentScene();
		var yes = function (value) {
			return value === true || value === 'true';
		};
		var key;

		if (!scene || typeof scene.Mark !== 'function') return;

		key = this.Key || this.MarkKey;

		if (this.Shown && this.Shown !== key)
			scene.Unmark(this.Shown);

		this.Shown = scene.Mark(key, {
			Element: this.$Element(),
			Object: this.For || '',
			Part: this.Part || '',
			Point: this.For ? null : this.Point,
			Up: this.Up,
			Offset: this.Offset,
			Shift: this.Shift,
			Align: this.Align || 'bottom',
			Line: this.Line === 'auto' || this.Line === '' ? 'auto' : yes(this.Line),
			Occlude: this.Occlude === '' ? undefined : yes(this.Occlude),
			Edge: yes(this.Edge),
			Declutter: this.Declutter !== false && this.Declutter !== 'false',
			Cluster: this.Cluster || '',
			ClusterRadius: Number(this.ClusterRadius) || 36,
			Near: this.Near === '' ? undefined : Number(this.Near),
			Far: Number(this.Far) || 0,
			Priority: Number(this.Priority) || 0
		});
	},

	Unmarked: function () {
		var scene = this.ParentScene();
		if (scene && this.Shown && typeof scene.Unmark === 'function')
			scene.Unmark(this.Shown);

		this.Shown = '';
	}
});
