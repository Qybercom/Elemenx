<!-- generated -->
# Админка

Панель управления магазином: страница входа, сводка с цифрами и графиком и таблица пользователей, которую можно сортировать, фильтровать, листать, редактировать и чистить. Готовый проект — `examples/Tutorials/Admin`.

Чему вы научитесь: охранник, который отправляет гостя на страницу входа и обратно, сервисы для сессии и данных, каркас, который следует за сессией, `Table`, `Chart`, `Drawer`, диалоги и уведомления из кода и форма, которая редактирует запись.

## 1. Маршруты за охранником

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

Охранник пропускает вошедшего пользователя; всех остальных отправляет на `/login`, а запрошенную страницу передаёт в query:

```js
Elemenx.Guard('SignedIn', function () {
	if (this.$Service('Session').SignedIn()) return true;

	return '/login?return=' + encodeURIComponent(this.$To.Path);
});
```

Путь, который возвращает охранник, — это перенаправление. Охранник может и отказать через `this.$Fail(...)` и показать свой компонент, или дождаться сервера через `this.$Wait(...)` (см. [Охранники маршрутов](/guide/guards)).

## 2. Сессия

Сервис один на приложение: каждая страница обращается к одному и тому же `Session`. Он хранит пользователя в сессионном хранилище вкладки и сообщает слушателям, когда тот меняется.

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

`SignOut`, `OnChange`, `OffChange` и `Changed` дополняют его (см. проект). Сервис `Api` так же хранит данные и отвечает с паузой, как сервер: в настоящей админке его методы обращаются к серверу через `this.$Network().XHR(...)`, и больше ничего не меняется.

## 3. Вход

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

`Replace` встаёт на место `/login` в истории: «Назад» к нему не вернёт.

## 4. Каркас, который следует за сессией

`Shell`, корневой компонент, показывает боковую панель и шапку только вошедшему пользователю; он слушает сессию и снимает слушателя вместе с собой.

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

`Path` следует за маршрутизатором (`this.$Router().On('NavigationEnd', ...)`), поэтому боковая панель отмечает показанную страницу. `ToastHost` и `DialogHost` показывают уведомления и диалоги, которые просит код с любой страницы.

## 5. Сводка

```html
<Chart Type="area" [labels]="Stats.Months" [series]="[{Name: 'Sales', Values: Stats.Sales}]" Unit=" €" Height="240" Label="Sales by month" />
```

`Chart` рисует в SVG, хранит таблицу своих данных для экранных дикторов и показывает значения под указателем.

## 6. Пользователи

`Table` сама сортирует, фильтрует и листает с `SortLocal`, `FilterLocal` и `PageLocal`; без них она сообщает события, а работу делает сервер.

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

Нажатая строка выделяется, и её пользователь открывается в выдвижной панели. `UserForm` — компонент проекта со своими событиями `save` и `remove`; работу делает страница:

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

Форма начинает со значений пользователя через `Field Value`:

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

## Дальше

- [Магазин](/tutorials/shop): корзина, общая для страниц, и оформление заказа.
- [Формы](/guide/forms): правила полей и сервис Forms.
- Каркас IDE с панелями, которые двигаются и меняют размер: [редактор](/tutorials/editor).
