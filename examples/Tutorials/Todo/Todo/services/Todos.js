/*
 * The tasks, kept in the storage of the browser: List(filter) (all, active or done), Add(text), Toggle(id),
 * Remove(id), ClearDone(), Left() the count of the tasks not done. OnChange(callback) tells each change. It holds the
 * logic of the application without a page: the unit tests try it alone.
 */
Elemenx.Service('Todos', {
	StorageKey: 'tasks',

	$OnCreate: function () {
		this.Store = this.$Storage.Local.Namespace('todo');
		this.Items = this.Store.Get(this.StorageKey) || [];
		this.Listeners = [];
	},

	List: function (filter) {
		return this.Items.filter(function (item) {
			if (filter === 'active') return !item.Done;
			if (filter === 'done') return item.Done;

			return true;
		});
	},

	Add: function (text) {
		var title = String(text || '').trim();
		if (!title)
			throw new Error('A task needs a title');

		this.Save(this.Items.concat([{ID: Date.now() + '-' + this.Items.length, Title: title, Done: false}]));
	},

	Toggle: function (id) {
		this.Save(this.Items.map(function (item) {
			return item.ID === id ? {ID: item.ID, Title: item.Title, Done: !item.Done} : item;
		}));
	},

	Remove: function (id) {
		this.Save(this.Items.filter(function (item) {
			return item.ID !== id;
		}));
	},

	ClearDone: function () {
		this.Save(this.List('active'));
	},

	Left: function () {
		return this.List('active').length;
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	},

	Save: function (items) {
		this.Items = items;

		this.Store.Set(this.StorageKey, items);

		this.Listeners.slice().forEach(function (callback) {
			callback(items);
		});
	}
});
