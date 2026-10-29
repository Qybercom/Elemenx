/*
 * The windows of the page (the Window component): their order and the active one. Front(window) puts a window over
 * the others and makes it active; Active() is the active window, List() the open ones from the back to the front;
 * Place() gives the next place of a new window without a place of its own (they go down and right in a cascade).
 * OnChange(callback) / OffChange(callback) report a new order. The geometry of a window with Persist is remembered in
 * localStorage under StorageKey.
 */
Elemenx.Service('Windows', {
	$Meta: {
		Description: 'The windows of the page (the Window component): their order and the active one.',
		Methods: ['Front(entry)', 'Active()', 'List()', 'Place()', 'OnChange(callback)', 'OffChange(callback)']
	},
	Base: 100,
	Step: 28,
	StorageKey: 'elemenx-windows',

	$OnCreate: function () {
		this.Stack = [];
		this.Listeners = this.$Service('ElemenxHelpers').Listeners();
		this.Cascade = 0;
		this.Current = null;
	},

	Register: function (entry) {
		if (this.Stack.indexOf(entry) === -1)
			this.Stack.push(entry);

		return this.Base + this.Stack.length;
	},

	Unregister: function (entry) {
		this.Stack = this.Stack.filter(function (item) {
			return item !== entry;
		});

		if (this.Current === entry)
			this.Current = this.Stack[this.Stack.length - 1] || null;

		this.Changed();
	},

	Front: function (entry) {
		var self = this;

		this.Stack = this.Stack.filter(function (item) {
			return item !== entry;
		}).concat([entry]);

		if (this.Current === entry && this.Stack[this.Stack.length - 1] === entry && entry.Z === this.Base + this.Stack.length) return;

		this.Current = entry;

		this.Stack.forEach(function (item, index) {
			item.Z = self.Base + index + 1;
		});

		this.Changed();
	},

	Active: function () {
		return this.Current;
	},

	List: function () {
		return this.Stack.slice();
	},

	Place: function () {
		var offset = this.Cascade % 8 * this.Step;

		this.Cascade++;

		return {X: 24 + offset, Y: 24 + offset};
	},

	/* The remembered geometry of a window, or null. */
	Load: function (key) {
		var stored;

		try {
			stored = JSON.parse(window.localStorage.getItem(this.StorageKey) || '{}');
		}
		catch (error) {
			stored = {};
		}

		return stored && stored[key] || null;
	},

	Save: function (key, geometry) {
		var stored;

		try {
			stored = JSON.parse(window.localStorage.getItem(this.StorageKey) || '{}') || {};
			stored[key] = geometry;

			window.localStorage.setItem(this.StorageKey, JSON.stringify(stored));
		}
		catch (error) {
			/* Storage may be unavailable (private mode): the window keeps its place on this page only. */
		}
	},

	OnChange: function (callback) {
		return this.Listeners.On(callback);
	},

	OffChange: function (callback) {
		this.Listeners.Off(callback);
	},

	Changed: function () {
		this.Listeners.Tell();
	}
});
