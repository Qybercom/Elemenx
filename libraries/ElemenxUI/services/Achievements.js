/*
 * The achievements of an Application (a game, a course, a profile...), shown one after another by an AchievementHost
 * (place one in the layout of the Application, as a ToastHost).
 * Show(options) queues one and returns its ID. Options: Title, Text, Icon or Image (a trophy by default), Rarity
 * (common... legendary: the color of the badge), Points, Overline (the line above the title: "Achievement unlocked" by
 * default), Duration (6000 milliseconds, the time it shows, its coming and going included; 0 keeps it until it is
 * dismissed). Dismiss(id) closes it (or takes it out of the queue), Clear()
 * closes all; Current() is the one shown, Queue() the ones waiting. OnChange(callback)/OffChange(callback) report
 * {Current, Queue}.
 */
Elemenx.Service('Achievements', {
	$Meta: {
		Description: 'The achievements of an Application (a game, a course, a profile...), shown one after another by an AchievementHost (place one in the layout of the Application, as a ToastHost).',
		Methods: ['Show(options)', 'Dismiss(id)', 'Clear()', 'Current()', 'Queue()', 'OnChange(callback)', 'OffChange(callback)']
	},
	Duration: 6000,

	$OnCreate: function () {
		this.Shown = null;
		this.Waiting = [];
		this.Listeners = this.$Service('ElemenxHelpers').Listeners();
		this.Timer = null;
		this.Sequence = 0;
	},

	$OnDestroy: function () {
		window.clearTimeout(this.Timer);

		this.Listeners.Clear();
	},

	Show: function (options) {
		var item;

		options = typeof options === 'string' ? {Title: options} : options || {};

		this.Sequence++;

		item = {
			ID: 'achievement-' + this.Sequence,
			Title: options.Title || '',
			Text: options.Text || '',
			Icon: options.Icon || (options.Image ? '' : 'trophy'),
			Image: options.Image || '',
			Rarity: options.Rarity || 'common',
			Points: options.Points == null ? null : options.Points,
			Overline: options.Overline || '',
			Duration: options.Duration == null ? this.Duration : Number(options.Duration)
		};

		this.Waiting.push(item);

		if (!this.Shown) this.Next();
		else this.Changed();

		return item.ID;
	},

	/* Shows the next one of the queue, for its Duration. */
	Next: function () {
		var self = this;

		window.clearTimeout(this.Timer);

		this.Shown = this.Waiting.shift() || null;
		this.Timer = null;

		if (this.Shown && this.Shown.Duration > 0) {
			this.Timer = window.setTimeout(function () {
				self.Next();
			}, this.Shown.Duration);
		}

		this.Changed();
	},

	Dismiss: function (id) {
		if (this.Shown && this.Shown.ID === id) {
			this.Next();

			return;
		}

		this.Waiting = this.Waiting.filter(function (item) {
			return item.ID !== id;
		});

		this.Changed();
	},

	Clear: function () {
		this.Waiting = [];

		this.Next();
	},

	Current: function () {
		return this.Shown;
	},

	Queue: function () {
		return this.Waiting.slice();
	},

	OnChange: function (callback) {
		return this.Listeners.On(callback);
	},

	OffChange: function (callback) {
		this.Listeners.Off(callback);
	},

	Changed: function () {
		this.Listeners.Tell({Current: this.Shown, Queue: this.Waiting.slice()});
	}
});
