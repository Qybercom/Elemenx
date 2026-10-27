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
 * - The arrows (Home, End) change the picture when the gallery has the focus; the picture follows a finger across, or
 *   the mouse that drags it (*swipe), and a swipe goes to the next or the previous one (held back at the ends without
 *   Loop).
 */
Elemenx.Component('Gallery', {
	$TemplateURL: 'Gallery.html',
	$StyleURL: 'Gallery.css',
	$Meta: {
		Group: 'display',
		Icon: 'image',
		Description: 'A gallery: one picture at a time out of Items [{ID, Image, Thumb, Alt, Title, Description, Tags}], with buttons to the previous and the next one, dots, a counter and thumbnails.',
		Events: {
			change: 'Another picture is shown: its Index.',
			select: 'The picture was pressed: its item.'
		},
		Props: {
			Items: {Schema: {ID: 'text', Image: 'text', Title: 'text', Description: 'text'}, Description: 'The pictures: [{ID, Image, Thumb, Alt, Title, Description, Tags}].'},
			Index: 'The picture shown.',
			ShowTitle: 'Shows the title in the caption.',
			ShowDescription: 'Shows the description in the caption.',
			ShowTags: 'Shows the tags in the caption.',
			ShowArrows: 'Shows the buttons to the previous and the next picture.',
			ShowDots: 'Shows the dots.',
			ShowCounter: 'Shows the counter (2 / 4).',
			ShowThumbs: 'Shows the thumbnails.',
			Caption: {Options: ['overlay', 'below'], Description: 'overlay (over the picture) or below it.'},
			Autoplay: 'Goes on by itself every Interval.',
			Interval: 'The time of a picture in Autoplay, in milliseconds.',
			Direction: {Options: ['next', 'previous'], Description: 'The way of Autoplay: next or previous.'},
			Loop: 'Goes round at the ends.',
			Effect: {Options: ['slide', 'fade'], Description: 'slide or fade.'},
			Fit: {Options: ['cover', 'contain'], Description: 'cover or contain.'},
			Ratio: 'The shape of the picture (16 / 9).',
			Label: 'The name of the gallery for screen readers.'
		},
		Sample: {Items: [{ID: 1, Image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22%3E%3Crect width=%2216%22 height=%229%22 fill=%22%233f6c9e%22/%3E%3C/svg%3E', Title: 'Blue'}, {ID: 2, Image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22%3E%3Crect width=%2216%22 height=%229%22 fill=%22%23b4483f%22/%3E%3C/svg%3E', Title: 'Red'}], ShowThumbs: true, Label: 'Places'}
	},
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

	/* Asleep (Elemenx.Cache keeps it out of the page) it does not turn its slides. */
	$OnSleep: function () {
		window.clearInterval(this.Own().Timer);
	},

	$OnWake: function () {
		window.clearInterval(this.Own().Timer);

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

		/* The click a swipe ends with is no press on the picture. */
		if (this.Own().Swiped && Date.now() - this.Own().Swiped < 400) return;

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
		if (event && event.type === 'mouseleave' && root && root.contains((root.ownerDocument || document).activeElement)) return;

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

	/* The picture follows the finger (out of the state: a move restyles the track alone); held back at the ends. */
	Dragged: function (event) {
		var root = this.$Element();
		var dx = event.detail.DX;
		var index = this.Current(this.Items, this.Index);
		var rtl = window.getComputedStyle(root).direction === 'rtl';
		var forward = rtl ? dx > 0 : dx < 0;
		if (!this.On(this.Loop) && ((forward && index === this.Items.length - 1) || (!forward && index === 0)))
			dx = dx / 3;

		root.classList.add('dragging');
		root.style.setProperty('--elemenx-gallery-drag', Math.round(dx) + 'px');
	},

	/* The end of a swipe: the next picture the way the finger went (in the direction of the page), or back in place. */
	Swiped: function (event) {
		var rtl = window.getComputedStyle(this.$Element()).direction === 'rtl';
		var forward = (event.detail.Direction === 'left') !== rtl;

		this.Own().Swiped = Date.now();

		this.Settled();
		this.Step(forward ? 1 : -1);
	},

	Settled: function () {
		var root = this.$Element();

		root.classList.remove('dragging');
		root.style.removeProperty('--elemenx-gallery-drag');
	}
});
