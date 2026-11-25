/*
 * The radar of a vehicle, declared inside a Scene (the trait SceneBehaviour): what it knows round it (Contacts of the
 * scene: SceneTactics) within Range metres, its nose up. Shape plan is a map seen from over it (GameMinimap: a mark for
 * each, rings of a third of its range); bubble is the space round it seen from behind and over it, a disc of its rings at
 * its height, each contact over or under it on a stalk. What is of another team is marked as a foe, of its own as a
 * friend, a place (NavPoint) and a blocker of warp as points; its target ringed; missiles (SceneMissiles) small, one at
 * the vehicle red (incoming), flares as sparks. A press on a mark makes it the target of
 * the vehicle (SetTarget): the event target ({Vehicle, Target}). For is the vehicle (empty: the one the hero sits in, or
 * is in); it reads each Every seconds (0.2). Size is its width in pixels; Zoomable adds + and - (the range halved or
 * doubled); Label names it for screen readers.
 */
Elemenx.Component('GameRadar', {
	$TemplateURL: 'GameRadar.html',
	$StyleURL: 'GameRadar.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'compass',
		Description: 'The radar of a vehicle: what it knows round it, as a map from over it (plan) or the space round it (bubble); a press makes a contact its target.',
		Events: {
			target: 'A contact was pressed and made the target: {Vehicle, Target}.'
		},
		Props: {
			For: 'The ID of the vehicle; empty: the one the hero sits in, or is in.',
			Shape: {Options: ['plan', 'bubble'], Description: 'plan (a map from over it) or bubble (the space round it).'},
			Range: 'How far it shows, in metres.',
			Every: 'How often it reads, in seconds.',
			Size: 'Its width in pixels.',
			Zoomable: 'Adds the + and - buttons.',
			Label: 'Its name for screen readers.'
		},
		Sample: {Shape: 'bubble'}
	},
	For: '',
	Shape: 'plan',
	Range: 150,
	Every: 0.2,
	Size: 180,
	Zoomable: false,
	Label: '',
	Vehicle: '',
	Contacts: [],
	Markers: [],

	$OnCreate: function () {
		this.RadarClock = Infinity;
		this.Dots = [];
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();
		var context;

		this.RadarClock += elapsed;

		if (this.RadarClock < Number(this.Every || 0) || !scene || typeof scene.Contacts !== 'function') return;

		this.RadarClock = 0;

		context = scene.Context(scene.Scene().Hero);
		this.Vehicle = this.For || (context && context.Kind === 'seat' ? context.Vehicle : scene.Scene().InsideShip || '');

		this.Show(this.Vehicle ? scene.Contacts(this.Vehicle) : []);
	},

	/* What it knows ([{ID, Name, Kind, Hostile, Team, Distance, Bearing, Elevation, Target}], as Contacts gives them), shown. */
	Show: function (contacts) {
		var self = this;
		var range = Math.max(1, Number(this.Range) || 150);

		this.Contacts = contacts || [];

		this.Markers = this.Contacts.map(function (one) {
			var flat = Math.min(1, one.Distance * Math.cos(one.Elevation * Math.PI / 180) / range) * 0.5;
			var turn = one.Bearing * Math.PI / 180;

			return {ID: one.ID, X: 0.5 + Math.sin(turn) * flat, Y: 0.5 - Math.cos(turn) * flat, Kind: self.KindOf(one), Icon: one.Target ? 'target' : '', Label: one.Name + ' · ' + Math.round(one.Distance) + ' m'};
		});

		if (this.Shape === 'bubble')
			this.Draw();
	},

	/* The kind of a mark: a missile at the vehicle, another missile, a flare; a foe, a friend, a point. */
	KindOf: function (one) {
		if (one.Kind === 'missile')
			return one.Incoming ? 'incoming' : 'missile';

		if (one.Kind === 'flare') return 'flare';

		if (one.Hostile) return 'enemy';

		return one.Team ? 'ally' : 'point';
	},

	RangeText: function () {
		return Math.round(Number(this.Range) || 0) + ' m';
	},

	/* The bubble: its disc and rings, each contact on its stalk, seen from behind and over it. */
	Draw: function () {
		var self = this;
		var canvas = this.$Element().querySelector('.elemenx-game-radar-bubble');
		var context = canvas ? canvas.getContext('2d') : null;
		var range = Math.max(1, Number(this.Range) || 150);
		var style;
		var width;
		var height;
		var colors;

		if (!context) return;

		width = canvas.width = Math.max(60, Number(this.Size) || 180);
		height = canvas.height = Math.round(width * 0.72);
		style = getComputedStyle(canvas);
		colors = {enemy: style.getPropertyValue('--elemenx-game-bad').trim() || '#e5484d', ally: style.getPropertyValue('--elemenx-game-good').trim() || '#46a758', point: style.getPropertyValue('--elemenx-game-accent').trim() || '#3e9bff', line: style.getPropertyValue('--elemenx-game-text').trim() || '#ccd'};
		colors.incoming = colors.enemy;
		colors.missile = style.getPropertyValue('--elemenx-game-legendary').trim() || '#d98a1e';
		colors.flare = '#ffb15a';

		/* A point round the vehicle (right, ahead, up; of its range) on the canvas. */
		function spot (right, ahead, up) {
			return [width / 2 + right * width * 0.44, height * 0.55 - ahead * height * 0.3 - up * height * 0.38];
		}

		context.clearRect(0, 0, width, height);

		context.strokeStyle = colors.line;
		context.globalAlpha = 0.35;
		context.lineWidth = 1;

		[1, 2 / 3, 1 / 3].forEach(function (ring) {
			context.beginPath();
			context.ellipse(width / 2, height * 0.55, width * 0.44 * ring, height * 0.3 * ring, 0, 0, Math.PI * 2);
			context.stroke();
		});

		context.beginPath();
		context.moveTo(width / 2, height * 0.55);
		context.lineTo(width / 2, height * 0.25);
		context.stroke();

		context.globalAlpha = 1;

		this.Dots = this.Contacts.map(function (one) {
			var part = Math.min(1, one.Distance / range);
			var rise = one.Elevation * Math.PI / 180;
			var turn = one.Bearing * Math.PI / 180;
			var flat = part * Math.cos(rise);
			var foot = spot(Math.sin(turn) * flat, Math.cos(turn) * flat, 0);
			var at = spot(Math.sin(turn) * flat, Math.cos(turn) * flat, part * Math.sin(rise));
			var color = colors[self.KindOf(one)];

			context.strokeStyle = color;
			context.fillStyle = color;
			context.globalAlpha = 0.7;

			context.beginPath();
			context.moveTo(foot[0], foot[1]);
			context.lineTo(at[0], at[1]);
			context.stroke();

			context.globalAlpha = 1;

			/* A missile: a small triangle (one at it larger); a flare: a spark; else a square. */
			if (one.Kind === 'missile') {
				var size = one.Incoming ? 5 : 3.5;

				context.beginPath();
				context.moveTo(at[0], at[1] - size);
				context.lineTo(at[0] + size, at[1] + size * 0.8);
				context.lineTo(at[0] - size, at[1] + size * 0.8);
				context.closePath();
				context.fill();
			}
			else if (one.Kind === 'flare') {
				context.fillRect(at[0] - 1, at[1] - 1, 2, 2);
			}
			else {
				context.fillRect(at[0] - 2.5, at[1] - 2.5, 5, 5);
			}

			if (one.Target) {
				context.beginPath();
				context.arc(at[0], at[1], 7, 0, Math.PI * 2);
				context.stroke();
			}

			return {ID: one.ID, X: at[0], Y: at[1]};
		});
	},

	/* A press on the bubble: the contact nearest it (within 14 pixels) is the target. */
	BubblePressed: function (event) {
		var canvas = this.$Element().querySelector('.elemenx-game-radar-bubble');
		var box = canvas.getBoundingClientRect();
		var x = (event.clientX - box.left) * canvas.width / Math.max(1, box.width);
		var y = (event.clientY - box.top) * canvas.height / Math.max(1, box.height);
		var best = null;
		var near = 14;

		this.Dots.forEach(function (dot) {
			var apart = Math.hypot(dot.X - x, dot.Y - y);

			if (apart < near) {
				near = apart;
				best = dot;
			}
		});

		if (best)
			this.Choose(best.ID);
	},

	MarkerPressed: function (marker) {
		if (marker)
			this.Choose(marker.ID);
	},

	/* A contact made the target of the vehicle, for all its seats. */
	Choose: function (id) {
		var scene = this.ParentScene();
		if (!scene || !this.Vehicle || !scene.SetTarget) return;

		this.$Emit('target', {Vehicle: this.Vehicle, Target: scene.SetTarget(this.Vehicle, id)});
	},

	/* Nearer (1: half the range) or farther (-1: twice). */
	Zoomed: function (sign) {
		this.Range = Math.max(10, Math.min(100000, (Number(this.Range) || 150) * (sign > 0 ? 0.5 : 2)));
	},

	ZoomIn: function () {
		this.Zoomed(1);
	},

	ZoomOut: function () {
		this.Zoomed(-1);
	}
});
