/*
 * The numbers of a product: Items [{ID, Value, Prefix, Suffix, Label, Precision}] in a row (10 000+ users, 99.9%
 * uptime), counted up from 0 the first time they come into view (Animate, for Duration milliseconds; at once when the
 * system asks for less motion). Locale writes the numbers (the language of the page by default). Title over them.
 */
Elemenx.Component('LandingStats', {
	$TemplateURL: 'LandingStats.html',
	$StyleURL: 'LandingStats.css',
	$Meta: {
		Group: 'landing',
		Icon: 'chart',
		Description: 'The numbers of a product in a row, counted up as they come into view.',
		Props: {
			Title: 'The title over them.',
			Items: {Schema: {Value: 'number', Suffix: 'text', Label: 'text'}, Description: 'The numbers: [{ID, Value, Prefix, Suffix, Label, Precision}].'},
			Animate: 'Counts them up the first time they are seen.',
			Duration: 'How long they count, in milliseconds.',
			Locale: 'The language of the numbers.'
		},
		Sample: {Items: [{Value: 12000, Suffix: '+', Label: 'Users'}, {Value: 99.9, Suffix: '%', Label: 'Uptime', Precision: 1}]}
	},
	Title: '',
	Items: [],
	Animate: true,
	Duration: 1200,
	Locale: '',
	Progress: 0,

	$OnReady: function () {
		var self = this;
		var root = this.$Element();
		var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var own = {Frame: 0, Watcher: null};

		this.Own = function () {
			return own;
		};

		if (!(this.Animate && this.Animate !== 'false') || still || typeof IntersectionObserver === 'undefined') {
			this.Progress = 1;

			return;
		}

		own.Watcher = new IntersectionObserver(function (entries) {
			var start;

			if (!entries.some(function (entry) {
				return entry.isIntersecting;
			})) return;

			own.Watcher.disconnect();
			own.Watcher = null;

			/* Fast at first, slow at the end (an ease out). */
			(function step (time) {
				var part;

				start = start === undefined ? time : start;
				part = Math.min(1, (time - start) / Math.max(1, Number(self.Duration) || 1));
				self.Progress = 1 - Math.pow(1 - part, 3);

				if (part < 1)
					own.Frame = window.requestAnimationFrame(step);
			})(window.performance.now());
		}, {threshold: 0.3});

		own.Watcher.observe(root);
	},

	$OnDestroy: function () {
		var own = this.Own ? this.Own() : null;
		if (!own) return;

		window.cancelAnimationFrame(own.Frame);

		if (own.Watcher)
			own.Watcher.disconnect();
	},

	/* A number as it is shown at a point of its count. */
	Shown: function (item, progress) {
		var digits = item.Precision !== undefined && item.Precision !== null ? Number(item.Precision) : Number(item.Value) % 1 ? 1 : 0;
		var value = Number(item.Value) * (progress >= 1 ? 1 : progress);
		var locale = this.Locale || (Elemenx.Locale && Elemenx.Locale.Language ? Elemenx.Locale.Language() : '') || undefined;
		var text;

		try {
			text = new Intl.NumberFormat(locale, {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
		}
		catch (error) {
			text = value.toFixed(digits);
		}

		return (item.Prefix || '') + text + (item.Suffix || '');
	}
});
