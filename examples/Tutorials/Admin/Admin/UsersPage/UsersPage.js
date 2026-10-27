/*
 * The users: a Table that sorts, filters and pages by itself (SortLocal, FilterLocal, PageLocal), a row pressed
 * opens the user in a Drawer to edit, and a removal asks first (the Dialogs Service).
 */
Elemenx.Component('UsersPage', {
	$TemplateURL: 'UsersPage.html',
	$Title: 'Users · Shop admin',
	Users: [],
	Loading: true,
	Editing: null,
	Columns: [
		{Key: 'Name', Title: 'Name', Sortable: true, Filter: 'text'},
		{Key: 'Email', Title: 'Email', Sortable: true, Filter: 'text'},
		{Key: 'Role', Title: 'Role', Sortable: true, Filter: 'select', Options: ['admin', 'customer']},
		{Key: 'Orders', Title: 'Orders', Sortable: true, Align: 'right', Filter: 'number'},
		{Key: 'Joined', Title: 'Joined', Sortable: true}
	],

	$OnCreate: function () {
		this.Load();
	},

	Load: function () {
		var self = this;

		this.$Service('Api').Users(function (error, users) {
			self.Loading = false;
			self.Users = users;
		});
	},

	/* A row selected: its user opens in the drawer. */
	Selected: function (keys) {
		this.Editing = this.Users.filter(function (user) {
			return user.ID === keys[0];
		})[0] || null;
	},

	Closed: function () {
		this.Editing = null;
	},

	Saved: function (user) {
		var self = this;

		this.$Service('Api').Save(user, function () {
			self.$Service('Toast').Show({Message: user.Name + ' is saved.', Variant: 'success'});

			self.Editing = null;

			self.Load();
		});
	},

	Removed: function (user) {
		var self = this;

		this.$Service('Dialogs').Confirm({Title: 'Remove ' + user.Name + '?', Message: 'Their orders stay; the account goes for good.', Variant: 'danger'}, function (action) {
			if (action !== 'ok') return;

			self.$Service('Api').Remove(user.ID, function () {
				self.$Service('Toast').Show({Message: user.Name + ' is removed.'});

				self.Editing = null;

				self.Load();
			});
		});
	}
});
