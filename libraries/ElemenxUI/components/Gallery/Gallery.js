/*
 * A gallery: one picture at a time out of Items [{ID, Image, Thumb, Alt, Title, Description, Tags}], with buttons to
 * the previous and the next one, dots, a counter and thumbnails. Index is the picture shown; change emits the new one,
 * select the item of a press on the picture.
 * - What shows: ShowTitle, ShowDescription, ShowTags (the caption: Caption 'overlay' over the picture, the default,
 *   or 'below' it), ShowArrows, ShowDots, ShowCounter, ShowThumbs. A caption with nothing to show is left out.
 * - Autoplay goes to the next picture (Direction 'next') or the previous one ('previous') every Interval
 *   milliseconds; it waits while the pointer or the focus is on the gallery and while the page is hidden, and a button
 *   pauses and plays it. Loop (true) goes round at the ends.
 * - Effect: slide (the default) or fade. Fit: cover (the default) or contain. Ratio: the shape of the picture
 *   ('16 / 9').
 * - The arrows (Home, End) change the picture when the gallery has the focus, and a swipe does on a touch screen.
 */
Elemenx.Component('Gallery', {
	$TemplateURL: 'Gallery.html',
	$StyleURL: 'Gallery.css',
	Items: [],
	Index: 0,
	ShowTitle: true,
	ShowDescription: true,
	ShowTags: true,
	ShowArrows: true,
	ShowDots: true,
	ShowCounter: true,
	ShowThumbs: false,
	Caption: 'overlay',
	Autoplay: false,
	Interval: 5000,
	Direction: 'next',
	Loop: true,
	Effect: 'slide',
	Fit: 'cover',
	Ratio: '16 / 9',
	Label: '',
	Playing: true,
	Held: false,

	$OnCreate: function () {
		var self = this;
		var own = {Timer: 0, Since: Date.now(), Start: null};

		/* An option that may come as a text from the markup: Show*="false". */
		this.On = function (value) {
			return value !== false && value !== 'false';
		};

		/* The index shown, kept within the items. */
		this.Current = function (items, index) {
			var count = (items || []).length;

			return count ? Math.max(0, Math.min(count - 1, Number(index) || 0)) : 0;
		};

		/* Whether an item has a caption to show with the options of the gallery. */
		this.Captioned = function (item) {
			return !!item && (self.On(self.ShowTitle) && !!item.Title || self.On(self.ShowDescription) && !!item.Description || self.On(self.ShowTags) && !!(item.Tags && item.Tags.length));
		};

		this.Own = function () {
			return own;
		};

		/* The autoplay: a picture stays Interval while it plays and nothing holds it; the clock waits otherwise. */
		this.Tick = function () {
			var now = Date.now();

			if (!self.On(self.Autoplay) || !self.Playing || self.Held || document.visibilityState === 'hidden' || (self.Items || []).length < 2) {
				own.Since = now;

				return;
			}

			if (now - own.Since >= Math.max(1000, Number(self.Interval) || 5000))
				self.Step(self.Direction === 'previous' ? -1 : 1);
		};
	},

	$OnReady: function () {
		this.Own().Timer = window.setInterval(this.Tick, 250);
	},

	$OnDestroy: function () {
		window.clearInterval(this.Own().Timer);
	},

	/* The picture shown starts its time again. */
	Schedule: function () {
		this.Own().Since = Date.now();
	},

	/* Shows the picture at an index (round the ends with Loop). */
	Go: function (index) {
		var count = (this.Items || []).length;
		var target;

		if (!count) return;

		target = Number(index);

		if (this.On(this.Loop)) target = (target % count + count) % count;
		else target = Math.max(0, Math.min(count - 1, target));

		if (target !== this.Current(this.Items, this.Index)) {
			this.Index = target;

			this.$Emit('change', target);
		}

		this.Schedule();
	},

	Step: function (step) {
		this.Go(this.Current(this.Items, this.Index) + step);
	},

	Previous: function () {
		this.Step(-1);
	},

	Next: function () {
		this.Step(1);
	},

	Picked: function (event, node) {
		this.Go(Number(node.getAttribute('data-index')));
	},

	Selected: function () {
		var item = (this.Items || [])[this.Current(this.Items, this.Index)];
		if (item)
			this.$Emit('select', item);
	},

	Toggle: function () {
		this.Playing = !this.Playing;

		this.Schedule();
	},

	Hold: function () {
		this.Held = true;

		this.Schedule();
	},

	Release: function (event) {
		var root = this.$Element();
		if (event && event.type === 'focusout' && root && root.contains(event.relatedTarget)) return;
		if (event && event.type === 'mouseleave' && root && root.contains(document.activeElement)) return;

		this.Held = false;

		this.Schedule();
	},

	Key: function (event) {
		var keys = {ArrowLeft: -1, ArrowRight: 1};
		var rtl = getComputedStyle(this.$Element()).direction === 'rtl';

		if (event.target.closest('input, textarea')) return;

		if (keys[event.key]) {
			event.preventDefault();

			this.Step(rtl ? -keys[event.key] : keys[event.key]);
		}
		else if (event.key === 'Home') {
			event.preventDefault();

			this.Go(0);
		}
		else if (event.key === 'End') {
			event.preventDefault();

			this.Go((this.Items || []).length - 1);
		}
	},

	/* A swipe on a touch screen: across, by more than 40 pixels. */
	Down: function (event) {
		if (event.pointerType === 'mouse') return;

		this.Own().Start = {X: event.clientX, Y: event.clientY};
	},

	Up: function (event) {
		var start = this.Own().Start;
		var dx;

		this.Own().Start = null;

		if (!start) return;

		dx = event.clientX - start.X;

		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - start.Y))
			this.Step(dx < 0 ? 1 : -1);
	}
});
