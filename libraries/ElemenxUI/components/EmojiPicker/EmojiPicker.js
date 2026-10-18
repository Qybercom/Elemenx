/*
 * A picker of the emoji of Unicode (the Emoji Service): a search over names and keywords, the groups with a tab each,
 * the emoji used last first, a skin tone for the emoji that take one, and the name of the emoji under the pointer.
 * Emoji that the system cannot draw as one picture are left out. Keys: typing searches, Down goes from the search to
 * the emoji, the arrows move between them, Enter picks, Escape emits dismiss. Columns is the emoji in a row.
 * Events: pick ({Emoji, Name, Base}), dismiss.
 */
Elemenx.Component('EmojiPicker', {
	$TemplateURL: 'EmojiPicker.html',
	$StyleURL: 'EmojiPicker.css',
	Label: '',
	Placeholder: '',
	Nothing: '',
	Columns: 9,
	Tones: true,
	Recent: true,
	Autofocus: true,
	Query: '',
	Tone: 0,
	ToneOpen: false,
	ToneList: [0, 1, 2, 3, 4, 5],
	ToneNames: [],
	Sections: [],
	Active: '',
	Preview: null,
	Loading: true,
	Failed: '',

	$OnCreate: function () {
		var self = this;
		var emoji = this.$Service('Emoji');

		this.Tone = emoji.Tone();

		/* The raised hand in a tone: it takes every tone, so it needs no data (the menu shows before the data loads). */
		this.ToneSample = function (tone) {
			return '✋' + (emoji.Tones[Number(tone)] || '');
		};

		emoji.Load(function (error) {
			self.Loading = false;

			if (error) {
				self.Failed = error.message;

				return;
			}

			self.Refresh();
		});
	},

	$OnReady: function () {
		var self = this;

		if (!this.Autofocus || this.Autofocus === 'false') return;

		window.setTimeout(function () {
			var input = self.$Element() && self.$Element().querySelector('.elemenx-picker-search input');
			if (input && input.getClientRects().length)
				input.focus();
		}, 0);
	},

	Item: function (emoji) {
		var service = this.$Service('Emoji');
		var name = service.Name(emoji);

		return {Char: emoji.Char, Show: service.Toned(emoji.Char, this.Tone), Label: name.charAt(0).toUpperCase() + name.substring(1)};
	},

	Items: function (list) {
		var service = this.$Service('Emoji');
		var items = [];
		var i = 0;

		while (i < list.length) {
			if (service.Supported(list[i].Char))
				items.push(this.Item(list[i]));

			i++;
		}

		return items;
	},

	/* The sections shown: the search results, or the emoji used last and every group. */
	Refresh: function () {
		var service = this.$Service('Emoji');
		var groups = service.Groups();
		var sections = [];
		var recent;
		var items;
		var i = 0;

		if (this.Loading || this.Failed) return;

		if (String(this.Query).trim()) {
			items = this.Items(service.Search(this.Query, 200));

			this.Sections = items.length ? [{ID: 'search', Label: 'Search results', Icon: 'search', Emoji: items}] : [];

			return;
		}

		recent = this.Recent && this.Recent !== 'false' ? this.Items(service.Recent()) : [];

		if (recent.length)
			sections.push({ID: 'recent', Label: 'Recently used', Icon: 'history', Emoji: recent});

		while (i < groups.length) {
			items = this.Items(groups[i].Emoji);

			if (items.length)
				sections.push({ID: groups[i].ID, Label: groups[i].Label, Icon: groups[i].Icon, Emoji: items});

			i++;
		}

		this.Sections = sections;

		if (!this.Active || !sections.some(function (section) {
			return section.ID === this.Active;
		}, this))
			this.Active = sections.length ? sections[0].ID : '';
	},

	Typed: function (event, node) {
		this.Query = node.value;

		this.Refresh();

		this.$Element().querySelector('.elemenx-emoji-body').scrollTop = 0;
	},

	Clear: function () {
		var input = this.$Element().querySelector('.elemenx-picker-search input');

		this.Query = '';
		input.value = '';

		this.Refresh();

		input.focus();
	},

	Jump: function (event, node) {
		var id = node.getAttribute('data-group');
		var body = this.$Element().querySelector('.elemenx-emoji-body');
		var section = body.querySelector('.elemenx-emoji-group[data-group="' + id + '"]');

		this.Active = id;

		/* By the boxes on the screen: offsetTop counts from the nearest positioned ancestor, which depends on the page. */
		if (section)
			body.scrollTop += section.getBoundingClientRect().top - body.getBoundingClientRect().top;
	},

	/* The tab of the group at the top of the list follows the scrolling. */
	Scrolled: function (event, node) {
		var sections = node.querySelectorAll('.elemenx-emoji-group');
		var top = node.getBoundingClientRect().top + 8;
		var active = '';
		var i = 0;

		while (i < sections.length && sections[i].getBoundingClientRect().top <= top) {
			active = sections[i].getAttribute('data-group');

			i++;
		}

		if (active && active !== this.Active)
			this.Active = active;
	},

	Hover: function (event, node) {
		var char = node.getAttribute('data-char');
		var emoji = this.$Service('Emoji').Find(char);
		if (emoji && (!this.Preview || this.Preview.Char !== emoji.Char))
			this.Preview = this.Item(emoji);
	},

	Pick: function (event, node) {
		this.Choose(node.getAttribute('data-char'));
	},

	Choose: function (char) {
		var service = this.$Service('Emoji');
		var emoji = service.Find(char);
		var body = this.$Element().querySelector('.elemenx-emoji-body');
		var height = body.scrollHeight;

		if (!emoji) return;

		service.Used(emoji.Char);

		/* The emoji used last show at once; the list keeps what it shows when the recent ones grow above it. */
		if (!String(this.Query).trim()) {
			this.Refresh();

			window.setTimeout(function () {
				if (body.scrollTop > 0)
					body.scrollTop += body.scrollHeight - height;
			}, 0);
		}

		this.$Emit('pick', {Emoji: service.Toned(emoji.Char, this.Tone), Name: this.Item(emoji).Label, Base: emoji.Char});
	},

	ToneMenu: function () {
		var root = this.$Element();

		this.ToneOpen = !this.ToneOpen;

		if (!this.ToneOpen) return;

		window.setTimeout(function () {
			var selected = root.querySelector('.elemenx-emoji-tones .selected');
			if (selected)
				selected.focus();
		}, 0);
	},

	ToneChosen: function (event, node) {
		this.Tone = this.$Service('Emoji').Tone(Number(node.getAttribute('data-tone')));
		this.ToneOpen = false;

		this.Refresh();

		this.$Element().querySelector('.elemenx-emoji-tone').focus();
	},

	ToneClosed: function () {
		this.ToneOpen = false;
	},

	/* Moves the focus over the grid of the emoji: the arrows by one and by a row, Home and End. */
	Key: function (event) {
		var root = this.$Element();
		var items = Array.prototype.slice.call(root.querySelectorAll('.elemenx-emoji-body .elemenx-emoji-item'));
		var input = root.querySelector('.elemenx-picker-search input');
		var columns = Number(this.Columns) || 9;
		var index = items.indexOf(root.getRootNode().activeElement);
		var next = -1;

		if (Elemenx.Locale.Key(event) === 'Escape' && !this.ToneOpen) {
			if (this.Query) this.Clear();
			else this.$Emit('dismiss');

			event.preventDefault();
			event.stopPropagation();

			return;
		}

		if (root.getRootNode().activeElement === input) {
			if (Elemenx.Locale.Key(event) === 'ArrowDown' && items.length)
				next = 0;

			if (Elemenx.Locale.Key(event) === 'Enter' && items.length) {
				event.preventDefault();

				this.Choose(items[0].getAttribute('data-char'));

				return;
			}
		}
		else if (index !== -1) {
			if (Elemenx.Locale.Key(event) === 'ArrowRight') next = Math.min(items.length - 1, index + 1);
			else if (Elemenx.Locale.Key(event) === 'ArrowLeft') next = Math.max(0, index - 1);
			else if (Elemenx.Locale.Key(event) === 'ArrowDown') next = Math.min(items.length - 1, index + columns);
			else if (Elemenx.Locale.Key(event) === 'ArrowUp' && index < columns) next = -2;
			else if (Elemenx.Locale.Key(event) === 'ArrowUp') next = index - columns;
			else if (Elemenx.Locale.Key(event) === 'Home') next = 0;
			else if (Elemenx.Locale.Key(event) === 'End') next = items.length - 1;
		}

		if (next === -1) return;

		event.preventDefault();

		if (next === -2) {
			input.focus();

			return;
		}

		items[next].focus();
		items[next].scrollIntoView({block: 'nearest'});
	}
});
