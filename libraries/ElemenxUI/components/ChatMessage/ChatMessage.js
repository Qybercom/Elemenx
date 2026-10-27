/*
 * One message of a Chat. Text, or the default slot for rich content. Own puts the message on the reader's side.
 * Avatar is an image URL; without it the initials of Author are shown. Position places the message in a run of
 * messages from one author: single, first, middle or last. The author name shows on the first message of a run and
 * the avatar on the last (the newest) one. Status: sending (a clock), sent (a check), delivered (two checks), read
 * (two checks in the accent) or error. Edited marks a message changed after it was sent ("edited"; a text, as the
 * time of the change, is its hint). Sticker is the URL of a sticker sent as the message. Reactions: [{Emoji, Count,
 * Mine, Users: [{Name, Avatar}]}] under the bubble; a press on one emits react. React adds the button that picks an
 * emoji to react with (EmojiPicker).
 * Actions: the menu of the message ([{ID, Label, Icon, Shortcut, Disabled, Danger, Separator}], as MenuList), opened
 * by a right click (a long press on a touch screen), the Menu key or Shift+F10, or the button with three dots; a
 * choice emits action. The item of ID 'summary' opens the summary instead. On a phone the menu is a sheet from the
 * bottom of the screen.
 * The summary: who reacted with what (the Users of the Reactions) and who has seen the message (Viewers: [{Name,
 * Avatar, Time}]; Views counts them when the list is not known), in tabs. The eye with the count of views in the
 * corner of the bubble opens it too.
 * The choice of several messages: on a touch screen a tap opens the menu of the message and a long press (Hold
 * milliseconds) chooses the message; with a mouse Shift and a click choose it, and the menu item of ID 'select'
 * chooses it from the keys. While the chat is Selecting, a tap, a click or the check at the start of the message
 * turns its choice; Selected marks a chosen message. The Chat around keeps the choice (its Selection) and the bar of
 * its actions.
 * Events: react ({ID, Emoji, Mine}): Mine tells whether the reader reacts (true) or takes the reaction back (false);
 * action ({ID, Action, Item}); select ({ID, Selected}): the message asks to be chosen or let go. ID is the ID of the
 * message.
 */
Elemenx.Component('ChatMessage', {
	$TemplateURL: 'ChatMessage.html',
	$StyleURL: 'ChatMessage.css',
	$Meta: {
		Group: 'social',
		Icon: 'comment',
		Description: 'One message of a Chat.',
		Container: true,
		Events: {
			react: 'A reaction was pressed or picked: {ID, Emoji, Mine}, Mine the state it asks for.',
			select: 'The message was selected or let go: {ID, Selected}.',
			action: 'An item of its menu was chosen: {ID, Action, Item}.'
		},
		Props: {
			ID: 'The ID of the message, in its events.',
			Author: 'The name of the author.',
			Avatar: 'The URL of the picture of the author (its initials without one).',
			Text: 'The text of the message (or the default slot).',
			Time: 'The time shown in the corner.',
			Own: 'Puts the message on the side of the reader.',
			Position: {Options: ['single', 'first', 'middle', 'last'], Description: 'The place in a run of messages of one author: single, first, middle or last.'},
			Status: {Options: ['', 'sending', 'sent', 'delivered', 'read', 'error'], Description: 'sending, sent, delivered, read or error.'},
			Sticker: 'The URL of a sticker sent as the message.',
			Reactions: 'The reactions under the bubble: [{Emoji, Count, Mine, Users}].',
			React: 'Adds the button that picks an emoji to react with.',
			Edited: 'Marks the message as changed (a text: the hint of the mark).',
			Views: 'How many saw the message, when the list is not known.',
			Viewers: 'Who saw the message: [{Name, Avatar, Time}].',
			Actions: 'The items of the menu of the message, as MenuList.',
			Selecting: 'The chat is choosing messages: a tap turns the choice.',
			Selected: 'Marks the message as chosen.',
			Hold: 'How long a press chooses the message on a touch screen, in milliseconds.'
		},
		Sample: {Author: 'Grace Hopper', Text: 'The build is green again.', Time: '10:02', Position: 'first'}
	},
	ID: null,
	Author: '',
	Avatar: '',
	Text: '',
	Time: '',
	Own: false,
	Position: 'single',
	Status: '',
	Sticker: '',
	Reactions: [],
	React: false,
	Picking: false,
	Edited: false,
	Views: 0,
	Viewers: [],
	Actions: [],
	MenuOpen: false,
	MenuX: 0,
	MenuY: 0,
	Summary: false,
	SummaryTab: 'all',
	Selecting: false,
	Selected: false,
	Hold: 500,

	$OnCreate: function () {
		this.StatusIcon = function (status) {
			return {sending: 'clock', sent: 'check', delivered: 'check-double', read: 'check-double', error: 'error'}[status] || '';
		};

		/* The views of the message: Views, or the number of its Viewers. */
		this.ViewCount = function (views, viewers) {
			return Math.max(Number(views) || 0, (viewers || []).length);
		};

		/* The rows of the summary in a tab: all reactions, the reactions of one emoji, or the viewers. */
		this.SummaryRows = function (reactions, viewers, tab) {
			var rows = [];

			if (tab === 'views') {
				return (viewers || []).map(function (viewer) {
					return {Name: viewer.Name, Avatar: viewer.Avatar || '', Note: viewer.Time || ''};
				});
			}

			(reactions || []).forEach(function (reaction) {
				if (tab !== 'all' && tab !== reaction.Emoji) return;

				(reaction.Users || []).forEach(function (user) {
					rows.push({Name: user.Name, Avatar: user.Avatar || '', Emoji: reaction.Emoji});
				});
			});

			return rows;
		};

		/* The names of the users of a reaction, for its hint. */
		this.Names = function (users) {
			return (users || []).map(function (user) {
				return user.Name;
			}).join(', ');
		};

		/* All the reactions counted, for the first tab. */
		this.ReactionTotal = function (reactions) {
			return (reactions || []).reduce(function (sum, reaction) {
				return sum + (Number(reaction.Count) || 0);
			}, 0);
		};
	},

	Toggled: function (event, node) {
		var emoji = node.getAttribute('data-emoji');
		var reaction = (this.Reactions || []).filter(function (entry) {
			return entry.Emoji === emoji;
		})[0];

		this.$Emit('react', {ID: this.ID, Emoji: emoji, Mine: !(reaction && reaction.Mine)});
	},

	Pick: function () {
		this.Picking = !this.Picking;
	},

	Reacted: function (detail) {
		var mine = (this.Reactions || []).some(function (entry) {
			return entry.Emoji === detail.Emoji && entry.Mine;
		});

		this.Picking = false;

		if (!mine)
			this.$Emit('react', {ID: this.ID, Emoji: detail.Emoji, Mine: true});
	},

	Dismissed: function () {
		this.Picking = false;
	},

	/* The menu of the message at a point of the viewport. */
	ShowMenu: function (x, y) {
		var self = this;
		var root = this.$Element();
		var tries = 0;

		if (!(this.Actions || []).length) return false;

		this.MenuX = Math.round(x);
		this.MenuY = Math.round(y);
		this.MenuOpen = true;

		/*
		 * Its first item takes the focus once the menu is drawn and shown, tried again while it is open (regression: a busy
		 * page had not drawn it a task later, the menu never had the focus and Escape did not close it).
		 */
		function focus () {
			var first = root && root.querySelector('.elemenx-chat-menu-point .elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();

			/* Taken only once the panel shows: an item of a panel not shown yet takes no focus. */
			if (first && root.ownerDocument.activeElement === first) return;

			tries++;

			if (self.MenuOpen && tries < 300)
				window.setTimeout(focus, 16);
		}

		window.setTimeout(focus, 0);

		return true;
	},

	/* A long press of a touch chooses the message: the menu of the system that it would open does not show. */
	Context: function (event) {
		if (this.Touch) {
			event.preventDefault();

			return;
		}

		if (this.ShowMenu(event.clientX, event.clientY))
			event.preventDefault();
	},

	/* The start of a press: a touch held for Hold milliseconds in place chooses the message. */
	Down: function (event) {
		var self = this;

		this.Touch = event.pointerType === 'touch' || event.pointerType === 'pen';
		this.Start = {X: event.clientX, Y: event.clientY};
		this.Held = false;

		window.clearTimeout(this.Timer);

		if (!this.Touch || event.target.closest('button, a, input, textarea, select, .elemenx-popup')) return;

		this.Timer = window.setTimeout(function () {
			self.Held = true;

			self.$Emit('select', {ID: self.ID, Selected: !self.Selected});
		}, Number(this.Hold) || 500);
	},

	/* A press that moves (the list scrolls) or ends before its time chooses nothing. */
	Moved: function (event) {
		if (this.Start && Math.abs(event.clientX - this.Start.X) + Math.abs(event.clientY - this.Start.Y) > 10)
			window.clearTimeout(this.Timer);
	},

	Released: function () {
		window.clearTimeout(this.Timer);
	},

	/* A press: the choice while selecting or with Shift, the menu after a tap; a press held to choose does no more. */
	Pressed: function (event) {
		if (this.Held) {
			this.Held = false;

			return;
		}

		if (event.target.closest('button, a, input, textarea, select, .elemenx-popup, .elemenx-chat-menu-point')) return;

		if (this.Selecting || event.shiftKey) {
			event.preventDefault();

			this.$Emit('select', {ID: this.ID, Selected: !this.Selected});

			return;
		}

		if (this.Touch)
			this.ShowMenu(event.clientX, event.clientY);
	},

	/* The check at the start of a message while selecting; its press goes no further, to the message (it would turn the choice again). */
	Checked: function (event) {
		event.stopPropagation();

		this.$Emit('select', {ID: this.ID, Selected: !this.Selected});
	},

	Key: function (event) {
		var rect;

		if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;

		rect = event.target.getBoundingClientRect();

		if (this.ShowMenu(rect.left + 8, rect.bottom))
			event.preventDefault();
	},

	More: function (event, node) {
		var rect = node.getBoundingClientRect();

		this.ShowMenu(rect.left, rect.bottom + 4);
	},

	Chosen: function (item) {
		this.MenuOpen = false;

		if (item.ID === 'summary') {
			this.OpenSummary();

			return;
		}

		if (item.ID === 'select') {
			this.$Emit('select', {ID: this.ID, Selected: true});

			return;
		}

		this.$Emit('action', {ID: this.ID, Action: item.ID, Item: item});
	},

	MenuClosed: function () {
		this.MenuOpen = false;
	},

	OpenSummary: function () {
		this.SummaryTab = (this.Reactions || []).length ? 'all' : 'views';
		this.Summary = true;
	},

	SummaryClosed: function () {
		this.Summary = false;
	},

	SummaryChosen: function (event, node) {
		this.SummaryTab = node.getAttribute('data-tab');
	},

	$OnDestroy: function () {
		window.clearTimeout(this.Timer);
	}
});
