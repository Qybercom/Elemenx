/*
 * The pages to read: Items is [{Title, URL, Added}], the newest first. In an extension they are kept in
 * chrome.storage.sync (the browsers the user signs in to share it) and the page saved is the one of the active tab; on a
 * page of a site, as in elemenx dev, the storage of the page and the page itself stand in. Load(callback), Save(callback),
 * Remove(url), Open(url), OnChange(callback), OffChange(callback).
 */
Elemenx.Service('ReadingList', {
	$OnCreate: function () {
		var self = this;

		this.Items = [];
		this.Listeners = [];
		this.Extension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
		this.Local = this.$Storage.Local.Namespace('reading');

		/* Another window of the extension, or another browser of the user, changed the list. */
		if (this.Extension) {
			chrome.storage.onChanged.addListener(function (changes, area) {
				if (area === 'sync' && changes.items)
					self.Take(changes.items.newValue || []);
			});
		}
	},

	Load: function (callback) {
		var self = this;

		if (this.Extension) {
			chrome.storage.sync.get({items: []}, function (value) {
				self.Take(value.items);

				if (callback)
					callback();
			});

			return;
		}

		this.Take(this.Local.Get('items') || []);

		if (callback)
			callback();
	},

	Keep: function (items) {
		if (this.Extension) chrome.storage.sync.set({items: items});
		else this.Local.Set('items', items);

		this.Take(items);
	},

	Take: function (items) {
		this.Items = items;

		this.Listeners.slice().forEach(function (callback) {
			callback(items);
		});
	},

	/* The page of the active tab (activeTab gives its title and URL once the button is pressed). */
	Current: function (callback) {
		if (this.Extension && chrome.tabs) {
			chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
				callback(tabs[0] ? {Title: tabs[0].title || tabs[0].url, URL: tabs[0].url} : null);
			});

			return;
		}

		callback({Title: document.title, URL: location.href});
	},

	/* Saves the page of the tab, once: saved again, it goes back to the top. */
	Save: function (callback) {
		var self = this;

		this.Current(function (page) {
			if (!page) return;

			self.Keep([{Title: page.Title, URL: page.URL, Added: Date.now()}].concat(self.Items.filter(function (item) {
				return item.URL !== page.URL;
			})));

			if (callback)
				callback(page);
		});
	},

	Remove: function (url) {
		this.Keep(this.Items.filter(function (item) {
			return item.URL !== url;
		}));
	},

	/* A popup closes when it loses the focus: the page opens in a tab of its own. */
	Open: function (url) {
		if (this.Extension && chrome.tabs) chrome.tabs.create({url: url});
		else window.open(url, '_blank', 'noopener');
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
