# An admin panel

The admin panel of a shop: a page to sign in, a dashboard of figures and a chart, and a table of users to sort, filter, page, edit and remove. The finished project is `examples/Tutorials/Admin`.

What you learn: a guard that sends a guest to the page to sign in and back, Services that hold the session and the data, a frame that follows the session, `Table`, `Chart`, `Drawer`, the dialogs and toasts of code, and a form that edits a record.

## 1. Routes behind a guard

```js
Elemenx.Application('Admin', {
	$Title: 'Shop admin',
	$Component: 'Shell',
	$Root: 'Admin',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/login', Component: 'LoginPage'},
			{Path: '/', Component: 'DashboardPage', Guard: 'SignedIn'},
			{Path: '/users', Component: 'UsersPage', Guard: 'SignedIn'}
		]
	}
});
```

The guard lets a signed-in user in; anyone else goes to `/login`, with the page they asked for in the query:

```js
Elemenx.Guard('SignedIn', function () {
	if (this.$Service('Session').SignedIn()) return true;

	return '/login?return=' + encodeURIComponent(this.$To.Path);
});
```

A path returned by a guard is a redirect. A guard can also refuse with `this.$Fail(...)` and show a component of its own, or wait for a server with `this.$Wait(...)` (see [Guards](/guide/guards)).

## 2. The session

A Service is one for the Application: every page asks the same `Session`. It keeps the user in the session storage of the tab and tells its listeners when it changes.

```js
Elemenx.Service('Session', {
	$OnCreate: function () {
		this.Store = this.$Storage.Session.Namespace('admin');
		this.Listeners = [];
	},

	User: function () {
		return this.Store.Get('user') || null;
	},

	SignedIn: function () {
		return !!this.User();
	},

	SignIn: function (email, password, callback) {
		var self = this;

		/* The server of a real panel checks them; here any password of 8 characters will do. */
		window.setTimeout(function () {
			if (String(password).length < 8) {
				callback(new Error('The email or the password is wrong.'));

				return;
			}

			self.Store.Set('user', {Email: email, Name: email.split('@')[0]});
			self.Changed();

			callback(null, self.User());
		}, 300);
	}
});
```

`SignOut`, `OnChange`, `OffChange` and `Changed` complete it (see the project). The `Api` Service holds the data the same way, and answers after a pause as a server would: a real panel makes its methods ask the server with `this.$Network().XHR(...)`, and nothing else changes.

## 3. Sign in

```html
<Form Label="Sign in" (submit)="Submitted">
	<Field Label="Email" Name="email" Required="true" Email="true"><Input Type="email" Placeholder="ada@example.com" /></Field>
	<Field Label="Password" Name="password" Required="true" MinLength="8" Hint="Any 8 characters in this example"><Input Type="password" /></Field>
	<Button Type="submit" Label="Sign in" Variant="primary" Block="true" [loading]="Busy" />
</Form>
```

```js
Submitted: function (event) {
	var self = this;

	this.Busy = true;
	this.Error = '';

	this.$Service('Session').SignIn(event.Value.email, event.Value.password, function (error) {
		self.Busy = false;

		if (error) {
			self.Error = error.message;

			return;
		}

		self.$Router().Replace(self.$Query.return || '/');
	});
}
```

`Replace` takes the place of `/login` in the history: Back does not return to it.

## 4. A frame that follows the session

`Shell`, the root, shows the sidebar and the header only to a signed-in user; it listens to the session, and lets the listener go with it.

```js
$OnCreate: function () {
	var self = this;
	var session = this.$Service('Session');

	this.Follow = function (user) {
		self.User = user;
	};

	this.Follow(session.User());

	session.OnChange(this.Follow);
},

$OnDestroy: function () {
	this.$Service('Session').OffChange(this.Follow);
}
```

```html
<aside class="admin-side" *if="User">
	<strong class="admin-name">Shop admin</strong>
	<NavList [items]="Pages" [value]="Path" Label="Pages" (select)="Opened" />
</aside>
<div class="admin-body">
	<header class="admin-header" *if="User">
		<span class="elemenx-spacer"></span>
		<ThemeSwitch Compact="true" />
		<Menu [label]="User.Name" Icon="user" Variant="ghost" [items]="UserMenu" (select)="Chosen" />
	</header>
	<main class="admin-main" *outlet="Content"></main>
</div>
<ToastHost />
<DialogHost />
```

`Path` follows the router (`this.$Router().On('NavigationEnd', ...)`), so the sidebar marks the page shown. `ToastHost` and `DialogHost` show the toasts and the dialogs the code asks for, from any page.

## 5. The dashboard

```html
<Chart Type="area" [labels]="Stats.Months" [series]="[{Name: 'Sales', Values: Stats.Sales}]" Unit=" €" Height="240" Label="Sales by month" />
```

`Chart` draws in SVG, keeps a table of its data for screen readers, and shows the values under the pointer.

## 6. The users

`Table` sorts, filters and pages by itself with `SortLocal`, `FilterLocal` and `PageLocal`; without them it tells its events and the server does it.

```js
Columns: [
	{Key: 'Name', Title: 'Name', Sortable: true, Filter: 'text'},
	{Key: 'Email', Title: 'Email', Sortable: true, Filter: 'text'},
	{Key: 'Role', Title: 'Role', Sortable: true, Filter: 'select', Options: ['admin', 'customer']},
	{Key: 'Orders', Title: 'Orders', Sortable: true, Align: 'right', Filter: 'number'},
	{Key: 'Joined', Title: 'Joined', Sortable: true}
]
```

```html
<Table *if="!Loading" Label="Users" [columns]="Columns" [rows]="Users" RowKey="ID" SortLocal="true" FilterLocal="true" PageLocal="true" PageSize="5" [pageSizes]="[5, 10, 20]" Selectable="single" Striped="true" (select)="Selected" />
<Drawer [open]="!!Editing" Title="Edit the user" (close)="Closed">
	<UserForm *if="Editing" [user]="Editing" (save)="Saved" (remove)="Removed" />
</Drawer>
```

A row pressed is selected, and its user opens in the drawer. `UserForm` is a Component of the project with events of its own, `save` and `remove`; the page does the work:

```js
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
```

The form starts with the values of the user through `Field Value`:

```html
<Form Label="The user" (submit)="Submitted">
	<Field Label="Name" Name="name" Required="true" [value]="User.Name"><Input /></Field>
	<Field Label="Email" Name="email" Required="true" Email="true" [value]="User.Email"><Input Type="email" /></Field>
	<Field Label="Role" Name="role" [value]="User.Role"><RadioGroup Variant="horizontal" [options]="Roles" /></Field>
	<div class="elemenx-container" style="gap: 8px;">
		<Button Type="submit" Label="Save" Variant="primary" />
		<span class="elemenx-spacer"></span>
		<Button Label="Remove" Variant="danger" Icon="delete" (click)="Remove" />
	</div>
</Form>
```

## Next

- [A shop](/tutorials/shop): a cart shared by the pages, and a checkout.
- [Forms](/guide/forms): the rules of the fields and the Forms Service.
- A frame of an IDE, with panels that move and resize: [an editor](/tutorials/editor).
