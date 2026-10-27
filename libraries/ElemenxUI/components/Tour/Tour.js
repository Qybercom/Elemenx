/*
 * A guided tour: the page is shaded except the element of the current step, and a card next to it explains it.
 * Steps: [{Target (a CSS selector or an element), Title, Text, Placement (bottom, top, right, left; the side with room
 * wins)}]. Open shows it at Step. Back, Next and Done move; Skip, Done and Escape close it. A step whose target is
 * missing shows its card in the middle. The page behind does not take presses while the tour is open.
 * Events: change (the new Step), close (the reason: 'skip', 'escape' or 'done'), finish (after the last step).
 */
Elemenx.Component('Tour', {
	$TemplateURL: 'Tour.html',
	$StyleURL: 'Tour.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'help',
		Description: 'A guided tour: the page is shaded except the element of the current step, and a card next to it explains it.',
		Events: {
			change: 'Another step is shown: Step.',
			finish: 'Done was pressed on the last step.',
			close: 'It closed: the reason, skip, escape or done.'
		},
		Props: {
			Steps: 'The steps: [{Target, Title, Text, Placement}].',
			Open: 'Shows the tour.',
			Step: 'The current step, from 0.',
			Padding: 'The room around the element of a step, in pixels.',
			BackLabel: 'The text of the Back button.',
			NextLabel: 'The text of the Next button.',
			DoneLabel: 'The text of the Done button.',
			SkipLabel: 'The text of the Skip button.'
		}
	},
	Steps: [],
	Open: false,
	Step: 0,
	Padding: 6,
	BackLabel: '',
	NextLabel: '',
	DoneLabel: '',
	SkipLabel: '',
	Hole: null,
	CardX: 0,
	CardY: 0,
	Placed: '',

	$OnCreate: function () {
		var self = this;

		this.Placer = function () {
			self.Place();
		};

		/* Follows Open and Step: a new step is measured once it is drawn. Returns the step for the binding. */
		this.Track = function (open, step) {
			var key = open ? String(step) : '';

			if (key !== self.Placed) {
				self.Placed = key;

				self.Listen(!!open);

				if (open)
					window.setTimeout(function () {
						self.Place(true);
					}, 0);
			}

			return step;
		};

		this.Current = function (steps, step) {
			return (steps || [])[Number(step)] || null;
		};
	},

	$OnDestroy: function () {
		this.Listen(false);
	},

	Listen: function (on) {
		var method = on ? 'addEventListener' : 'removeEventListener';

		if (on === !!this.Listening) return;

		this.Listening = on;

		window[method]('resize', this.Placer);
		window[method]('scroll', this.Placer, true);
	},

	Target: function (step) {
		var target = step && step.Target;
		if (!target)
			return null;

		return typeof target === 'string' ? document.querySelector(target) : target;
	},

	/* Measures the target and puts the hole and the card; scroll: brings the target into view first. */
	Place: function (scroll) {
		var self = this;
		var root = this.$Element();
		var step = this.Current(this.Steps, this.Step);
		var target = this.Target(step);
		var card = root && root.querySelector('.elemenx-tour-card');
		var padding = Number(this.Padding) || 0;
		var margin = 12;
		var rect;
		var width;
		var height;
		var sides;
		var spot;

		if (!this.Open || !card) return;

		if (scroll && target && target.scrollIntoView) {
			target.scrollIntoView({block: 'center', inline: 'nearest'});

			window.requestAnimationFrame(function () {
				self.Place(false);
			});

			return;
		}

		width = card.offsetWidth;
		height = card.offsetHeight;

		if (!target) {
			this.Hole = null;
			this.CardX = Math.round((window.innerWidth - width) / 2);
			this.CardY = Math.round((window.innerHeight - height) / 2);

			this.Focus(card);

			return;
		}

		rect = target.getBoundingClientRect();

		this.Hole = {X: rect.left - padding, Y: rect.top - padding, Width: rect.width + padding * 2, Height: rect.height + padding * 2};

		sides = {
			bottom: {X: rect.left, Y: rect.bottom + padding + margin, Fits: rect.bottom + padding + margin + height <= window.innerHeight},
			top: {X: rect.left, Y: rect.top - padding - margin - height, Fits: rect.top - padding - margin - height >= 0},
			right: {X: rect.right + padding + margin, Y: rect.top, Fits: rect.right + padding + margin + width <= window.innerWidth},
			left: {X: rect.left - padding - margin - width, Y: rect.top, Fits: rect.left - padding - margin - width >= 0}
		};

		spot = sides[step.Placement] && sides[step.Placement].Fits ? sides[step.Placement] : sides.bottom.Fits ? sides.bottom : sides.top.Fits ? sides.top : sides.right.Fits ? sides.right : sides.left.Fits ? sides.left : sides.bottom;

		this.CardX = Math.round(Math.max(margin, Math.min(spot.X, window.innerWidth - width - margin)));
		this.CardY = Math.round(Math.max(margin, Math.min(spot.Y, window.innerHeight - height - margin)));

		this.Focus(card);
	},

	/* The card takes the focus once per step, on its main button. */
	Focus: function (card) {
		var button;

		if (card.contains(card.getRootNode().activeElement)) return;

		button = card.querySelectorAll('.elemenx-tour-footer button');
		button = button[button.length - 1];

		if (button && button.focus)
			button.focus();
	},

	Go: function (step) {
		this.Step = step;

		this.$Emit('change', step);
	},

	Next: function () {
		if (Number(this.Step) >= this.Steps.length - 1) {
			this.Finish();

			return;
		}

		this.Go(Number(this.Step) + 1);
	},

	Back: function () {
		if (Number(this.Step) > 0)
			this.Go(Number(this.Step) - 1);
	},

	Finish: function () {
		this.Open = false;

		this.$Emit('finish');
		this.$Emit('close', 'done');
	},

	Skip: function () {
		this.Open = false;

		this.$Emit('close', 'skip');
	},

	Key: function (event) {
		if (Elemenx.Locale.Key(event) === 'Escape') {
			event.preventDefault();

			this.Open = false;

			this.$Emit('close', 'escape');
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowRight' && !event.target.closest('input, textarea')) {
			this.Next();
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft' && !event.target.closest('input, textarea')) {
			this.Back();
		}
	}
});
