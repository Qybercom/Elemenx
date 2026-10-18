/*
 * A picker of the stickers of the Stickers Service: a tab for the stickers sent last, one for the starred ones and one
 * per pack, and a search over titles and keywords. The star of a sticker (on hover or focus) adds it to the favorites.
 * Keys: the arrows move between the stickers, Enter picks, Escape emits dismiss. Columns is the stickers in a row.
 * Events: pick ({Sticker: {ID, Pack, URL, Title}}), dismiss.
 */
Elemenx.Component('StickerPicker', {
	$TemplateURL: 'StickerPicker.html',
	$StyleURL: 'StickerPicker.css',
	Label: '',
	Placeholder: '',
	Nothing: '',
	NoRecent: '',
	NoFavorites: '',
	NoPacks: '',
	Columns: 4,
	Tab: '',
	Query: '',
	Tabs: [],
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var stickers = this.$Service('Stickers');

		/* The current tab: Tab when it exists, otherwise the recent stickers when there are any, then the first pack. */
		this.Shown = function (tab, tabs) {
			var ids = tabs.map(function (entry) {
				return entry.ID;
			});
			if (ids.indexOf(tab) !== -1) return tab;

			return stickers.Recent().length ? 'recent' : ids[2] || 'recent';
		};

		this.Items = function (tab, tabs, query) {
			var shown = self.Shown(tab, tabs);
			var pack;

			if (String(query || '').trim()) return stickers.Search(query);

			if (shown === 'recent')
				return stickers.Recent();

			if (shown === 'favorites')
				return stickers.Favorites();

			pack = stickers.Packs().filter(function (entry) {
				return entry.ID === shown;
			})[0];

			return pack ? pack.Items : [];
		};

		this.Starred = function (sticker) {
			return stickers.IsFavorite(sticker);
		};

		this.Listener = stickers.OnChange(function () {
			self.Read();
		});

		this.Read();
	},

	$OnDestroy: function () {
		this.$Service('Stickers').OffChange(this.Listener);
	},

	/* Reads the packs; the first tab is the recent stickers when there are any, otherwise the first pack. */
	Read: function () {
		var stickers = this.$Service('Stickers');
		var packs = stickers.Packs();
		var tabs = [{ID: 'recent', Key: 'ui.stickerPicker.recent', Title: 'Recently sent', Icon: 'history'}, {ID: 'favorites', Key: 'ui.stickerPicker.favorites', Title: 'Favorites', Icon: 'star'}].concat(packs.map(function (pack) {
			return {ID: pack.ID, Title: pack.Title, Icon: pack.Icon};
		}));
		var tab = this.Tab;

		this.Tabs = tabs;
		this.Version++;

		if (!tab || !tabs.some(function (entry) {
			return entry.ID === tab;
		}))
			this.Tab = stickers.Recent().length || !packs.length ? 'recent' : packs[0].ID;
	},

	Typed: function (event, node) {
		this.Query = node.value;
	},

	Clear: function () {
		var input = this.$Element().querySelector('.elemenx-picker-search input');

		this.Query = '';
		input.value = '';

		input.focus();
	},

	Choose: function (event, node) {
		this.Tab = node.getAttribute('data-tab');
	},

	Pick: function (event, node) {
		var stickers = this.$Service('Stickers');
		var sticker = stickers.Find(node.getAttribute('data-key'));
		if (!sticker) return;

		stickers.Used(sticker);

		this.Version++;

		this.$Emit('pick', {Sticker: {ID: sticker.ID, Pack: sticker.Pack, URL: sticker.URL, Title: sticker.Title}});
	},

	Star: function (event, node) {
		var stickers = this.$Service('Stickers');
		var sticker = stickers.Find(node.getAttribute('data-key'));
		if (sticker)
			stickers.Favorite(sticker);
	},

	Key: function (event) {
		var root = this.$Element();
		var items = Array.prototype.slice.call(root.querySelectorAll('.elemenx-sticker-pick'));
		var input = root.querySelector('.elemenx-picker-search input');
		var columns = Number(this.Columns) || 4;
		var index = items.indexOf(root.getRootNode().activeElement);
		var next = -1;

		if (Elemenx.Locale.Key(event) === 'Escape') {
			if (this.Query) this.Clear();
			else this.$Emit('dismiss');

			event.preventDefault();
			event.stopPropagation();

			return;
		}

		if (root.getRootNode().activeElement === input && Elemenx.Locale.Key(event) === 'ArrowDown' && items.length) next = 0;
		else if (index !== -1 && Elemenx.Locale.Key(event) === 'ArrowRight') next = Math.min(items.length - 1, index + 1);
		else if (index !== -1 && Elemenx.Locale.Key(event) === 'ArrowLeft') next = Math.max(0, index - 1);
		else if (index !== -1 && Elemenx.Locale.Key(event) === 'ArrowDown') next = Math.min(items.length - 1, index + columns);
		else if (index !== -1 && Elemenx.Locale.Key(event) === 'ArrowUp') next = index - columns;

		if (next === -1 && !(index !== -1 && Elemenx.Locale.Key(event) === 'ArrowUp')) return;

		event.preventDefault();

		if (next < 0) input.focus();
		else items[next].focus();
	}
});
