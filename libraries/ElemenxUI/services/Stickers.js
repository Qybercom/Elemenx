/*
 * The sticker packs of the Application. Register({ID, Title, Icon, Items: [{ID, URL, Title, Keywords, Emoji}]}) adds a
 * pack (again with the same ID: replaces it); Icon is an icon name or the URL of an image. A sticker is any image a
 * browser draws, animated ones too (GIF, WebP, APNG, SVG). Emoji are the emoji the sticker means (a text or a list): a
 * message of one of them suggests it, ByEmoji(char) lists those stickers (the starred and the recent ones first;
 * skin tones and variation selectors do not count). Search(text) finds stickers by title, keywords and emoji. Recent() lists
 * the stickers sent last and Used(sticker) records one; Favorite(sticker) stars or unstars a sticker and Favorites()
 * lists them; both are remembered. OnChange(callback) reports the changes of the packs.
 */
Elemenx.Service('Stickers', {
	StorageKey: 'elemenx-stickers',
	Persist: true,
	Limit: 24,

	$OnCreate: function () {
		var stored = null;

		this.List = [];
		this.Listeners = [];
		this.Last = [];
		this.Stars = [];

		try {
			stored = this.Persist ? JSON.parse(window.localStorage.getItem(this.StorageKey) || 'null') : null;
		}
		catch (error) {
			stored = null;
		}

		if (stored) {
			this.Last = Array.isArray(stored.Recent) ? stored.Recent : [];
			this.Stars = Array.isArray(stored.Favorites) ? stored.Favorites : [];
		}
	},

	Register: function (pack) {
		var items = [];
		var entry;
		var i = 0;

		if (!pack || !pack.ID)
			throw new Error('Elemenx Stickers pack needs an ID');

		while (pack.Items && i < pack.Items.length) {
			items.push({ID: String(pack.Items[i].ID), Pack: String(pack.ID), URL: pack.Items[i].URL, Title: pack.Items[i].Title || '', Keywords: pack.Items[i].Keywords || '', Emoji: this.EmojiOf(pack.Items[i].Emoji)});

			i++;
		}

		entry = {ID: String(pack.ID), Title: pack.Title || String(pack.ID), Icon: pack.Icon || (items[0] ? items[0].URL : ''), Items: items};

		this.List = this.List.filter(function (old) {
			return old.ID !== entry.ID;
		}).concat([entry]);

		this.Changed();

		return entry.ID;
	},

	/* The emoji of a sticker as a list of plain emoji: a text of emoji (with or without spaces) or a list. */
	EmojiOf: function (value) {
		var self = this;
		var list = Array.isArray(value) ? value : String(value || '').split(/\s+/);
		var result = [];

		list.forEach(function (item) {
			var text = String(item || '');
			var parts = typeof Intl !== 'undefined' && Intl.Segmenter ? Array.prototype.map.call(Array.from(new Intl.Segmenter('en', {granularity: 'grapheme'}).segment(text)), function (part) {
				return part.segment;
			}) : [text];

			parts.forEach(function (part) {
				var plain = self.PlainEmoji(part);
				if (plain.trim() && result.indexOf(plain) === -1)
					result.push(plain);
			});
		});

		return result;
	},

	/* An emoji without its variation selector and skin tone. */
	PlainEmoji: function (char) {
		return String(char || '').replace(/\uFE0F/g, '').replace(/\uD83C[\uDFFB-\uDFFF]/g, '').trim();
	},

	ByEmoji: function (char, limit) {
		var self = this;
		var plain = this.PlainEmoji(char);
		var found = [];

		if (!plain)
			return found;

		this.List.forEach(function (pack) {
			pack.Items.forEach(function (item) {
				if (item.Emoji.indexOf(plain) !== -1)
					found.push(item);
			});
		});

		found.sort(function (a, b) {
			return self.Rank(a) - self.Rank(b);
		});

		return found.slice(0, limit || this.Limit);
	},

	/* The place of a sticker among the suggestions: starred, then recent, then the others in their order. */
	Rank: function (sticker) {
		var key = this.Key(sticker);
		var starred = this.Stars.indexOf(key);
		var recent = this.Last.indexOf(key);

		if (starred !== -1) return starred;

		if (recent !== -1)
			return 1000 + recent;

		return 2000;
	},

	Forget: function (id) {
		this.List = this.List.filter(function (pack) {
			return pack.ID !== String(id);
		});

		this.Changed();
	},

	Packs: function () {
		return this.List.slice();
	},

	Key: function (sticker) {
		return sticker ? sticker.Pack + '/' + sticker.ID : '';
	},

	/* The sticker of a key ('pack/id'), or null. */
	Find: function (key) {
		var parts = String(key || '').split('/');
		var pack = this.List.filter(function (entry) {
			return entry.ID === parts[0];
		})[0];

		return pack ? pack.Items.filter(function (item) {
			return item.ID === parts.slice(1).join('/');
		})[0] || null : null;
	},

	Search: function (text) {
		var words = String(text || '').toLowerCase().split(/\s+/).filter(Boolean);
		var found = [];

		this.List.forEach(function (pack) {
			pack.Items.forEach(function (item) {
				var haystack = ' ' + (item.Title + ' ' + item.Keywords + ' ' + item.Emoji.join(' ') + ' ' + pack.Title).toLowerCase();
				if (words.length && words.every(function (word) {
					return haystack.indexOf(' ' + word) !== -1;
				}))
					found.push(item);
			});
		});

		return found;
	},

	Recent: function () {
		return this.Last.map(this.Find, this).filter(Boolean);
	},

	Favorites: function () {
		return this.Stars.map(this.Find, this).filter(Boolean);
	},

	IsFavorite: function (sticker) {
		return this.Stars.indexOf(this.Key(sticker)) !== -1;
	},

	Used: function (sticker) {
		var key = this.Key(sticker);

		this.Last = [key].concat(this.Last.filter(function (old) {
			return old !== key;
		})).slice(0, this.Limit);

		this.Store();
	},

	/* Stars the sticker, or unstars a starred one; returns whether it is starred now. */
	Favorite: function (sticker) {
		var key = this.Key(sticker);
		var starred = this.Stars.indexOf(key) === -1;

		this.Stars = starred ? [key].concat(this.Stars) : this.Stars.filter(function (old) {
			return old !== key;
		});

		this.Store();
		this.Changed();

		return starred;
	},

	Store: function () {
		try {
			if (this.Persist)
				window.localStorage.setItem(this.StorageKey, JSON.stringify({Recent: this.Last, Favorites: this.Stars}));
		}
		catch (error) {
			/* Storage may be unavailable (private mode); the choices still hold on this page. */
		}
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);

		return callback;
	},

	OffChange: function (callback) {
		var index = this.Listeners.indexOf(callback);
		if (index !== -1)
			this.Listeners.splice(index, 1);
	},

	Changed: function () {
		var listeners = this.Listeners.slice();
		var i = 0;

		while (i < listeners.length) {
			try {
				listeners[i]();
			}
			catch (error) {
				window.setTimeout(function () {
					throw error;
				}, 0);
			}

			i++;
		}
	}
});
