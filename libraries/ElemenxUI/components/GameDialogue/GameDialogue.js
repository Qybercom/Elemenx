/*
 * The line of a character in a dialogue: Speaker, Portrait (an image URL) and Text, typed out at Speed characters a
 * second (0 shows it at once). A press, Enter or Space shows the rest of a line being typed. Then the Choices
 * ([{ID, Text, Disabled}]) show as buttons (digits 1-9 choose too) and emit choose ({ID, Choice}); a line without
 * choices emits next on a press of its continue button. A new Text starts typing again. Screen readers get the whole
 * line at once. The keys it takes do not reach the shortcuts of the page.
 */
Elemenx.Component('GameDialogue', {
	$TemplateURL: 'GameDialogue.html',
	$StyleURL: 'GameDialogue.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The line of a character in a dialogue: Speaker, Portrait (an image URL) and Text, typed out at Speed characters a second (0 shows it at once).',
		Events: {
			next: 'The line without choices was read on (its continue button).',
			choose: 'A choice was made: {ID, Choice}.'
		},
		Props: {
			Speaker: 'The name of the one who speaks.',
			Portrait: 'The URL of the portrait.',
			Text: 'The line, typed out.',
			Choices: 'The answers: [{ID, Text, Disabled}].',
			Speed: 'Characters a second (0 shows the line at once).'
		},
		Sample: {Speed: 60}
	},
	Speaker: '',
	Portrait: '',
	Text: '',
	Choices: [],
	Speed: 40,
	Shown: '',
	Done: false,

	$OnCreate: function () {
		var self = this;
		var own = {Timer: 0, Started: 0, Text: null};
		var last;
		var sync;

		this.Own = function () {
			return own;
		};

		/* The function *mount calls when Text changes: the line is typed again. */
		this.Sync = function (text) {
			if (text !== last) {
				last = text;
				sync = function () {
					self.Start();
				};
			}

			return sync;
		};
	},

	$OnDestroy: function () {
		window.clearInterval(this.Own().Timer);
	},

	Start: function () {
		var self = this;
		var own = this.Own();
		var text = String(this.Text || '');
		var speed = Number(this.Speed) || 0;

		window.clearInterval(own.Timer);

		own.Text = text;

		if (speed <= 0 || !text) {
			this.Finish();

			return;
		}

		this.Done = false;
		this.Shown = '';
		own.Started = Date.now();

		own.Timer = window.setInterval(function () {
			var count = Math.floor((Date.now() - own.Started) / 1000 * speed);

			if (count >= text.length) {
				self.Finish();

				return;
			}

			self.Shown = text.substring(0, count);
		}, 30);
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) the line is written whole: no timer types it out of sight. */
	$OnSleep: function () {
		if (!this.Done)
			this.Finish();
	},

	/* The whole line, and the focus on the first choice or on the continue button. */
	Finish: function () {
		var self = this;

		window.clearInterval(this.Own().Timer);

		this.Shown = String(this.Text || '');

		if (this.Done) return;

		this.Done = true;

		window.setTimeout(function () {
			var root = self.$Element();
			var target = root && root.querySelector('.elemenx-game-dialogue-choice:not([disabled]), .elemenx-game-dialogue-next');
			if (target && root.contains(root.getRootNode().activeElement))
				target.focus();
		}, 0);
	},

	Pressed: function () {
		if (!this.Done)
			this.Finish();
	},

	Next: function () {
		this.$Emit('next');
	},

	Chosen: function (event, node) {
		var choice = (this.Choices || [])[Number(node.getAttribute('data-index'))];
		if (choice && !choice.Disabled)
			this.$Emit('choose', {ID: choice.ID, Choice: choice});
	},

	Key: function (event) {
		var digit = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
		var choice;

		/* A key the dialogue takes goes no further: a shortcut of the game on the same key does not run. */
		if (!this.Done && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			event.stopPropagation();

			this.Finish();

			return;
		}

		choice = (this.Choices || [])[digit];

		if (this.Done && choice && !choice.Disabled) {
			event.preventDefault();
			event.stopPropagation();

			this.$Emit('choose', {ID: choice.ID, Choice: choice});
		}
	}
});
