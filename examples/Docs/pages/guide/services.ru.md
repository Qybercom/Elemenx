<!-- generated -->
# Сервисы

Сервис — один объект, общий для компонентов приложения: сессия пользователя, клиент API, корзина, настройки. Он создаётся, когда его впервые запрашивают, живёт столько же, сколько его приложение, и у каждого приложения страницы свой экземпляр.

```js
Elemenx.Service('Cart', {
	Items: [],
	Listeners: null,

	$OnCreate: function () {
		this.Items = [];
		this.Listeners = [];
	},

	$OnDestroy: function () {
		this.Listeners = [];
	},

	Add: function (product) {
		this.Items.push({ID: product.ID, Title: product.Title, Price: product.Price});
		this.Changed();
	},

	Count: function () {
		return this.Items.length;
	},

	OnChange: function (listener) {
		this.Listeners.push(listener);
	},

	OffChange: function (listener) {
		this.Listeners = this.Listeners.filter(function (item) {
			return item !== listener;
		});
	},

	Changed: function () {
		var self = this;

		this.Listeners.slice().forEach(function (listener) {
			listener(self);
		});
	}
});
```

## Использование сервиса

`this.$Service('Cart')` в компоненте, сервисе или охраннике возвращает экземпляр его приложения. Вне приложения `Elemenx.Service('Cart')` возвращает экземпляр страницы.

```js
Elemenx.Component('CartBadge', {
	$Template: '<span class="badge">{{Count}}</span>',
	Count: 0,

	$OnCreate: function () {
		var self = this;

		this.Update = function () {
			self.Count = self.$Service('Cart').Count();
		};

		this.$Service('Cart').OnChange(this.Update);
		this.Update();
	},

	$OnDestroy: function () {
		this.$Service('Cart').OffChange(this.Update);
	}
});
```

Сервис не реактивен: его поля меняются без ведома шаблонов. Компонент хранит показываемое в своих полях, а сервис сообщает ему, когда перечитать (обратный вызов, [событие](/data/events)). О том, что занимает время, сообщайте обратными вызовами `(error, result)` или событиями, а не Promise.

## Определение

| Ключ | Значение |
| --- | --- |
| поле | его первое значение (у каждого экземпляра своё; спискам и объектам задавайте значение в `$OnCreate`, чтобы экземпляры их не делили) |
| метод | вызывается у экземпляра: `this` — сервис |
| `$OnCreate()` | экземпляр создан |
| `$OnDestroy()` | его приложение уничтожено или сервис объявлен заново |
| `$Events` и `$OnEvent`, `$Messaging` и `$OnMessage` | его каналы |

У экземпляра есть также `$Application()`, `$Service(name)` (другой сервис того же приложения), `$Network(context)`, `$Storage(context)`, `$Events()`, `$Messaging(context)`, `$WebWorker(...)`, `$ServiceWorker(...)` (его ресурсы завершаются вместе с ним), `$Generation()` и `$StartedAt()`.

## Загрузка и объявление

При разработке сервис из графа приложения загружается до отрисовки корня. Сервис, запрошенный позже (по имени, собранному во время выполнения), загружается тогда; вызовы, сделанные тем временем, ставятся в очередь и выполняются, когда он появится.

`Elemenx.Service(name, definition)` объявляет сервис где угодно; приложение объявляет свой через `this.$Service(name, definition)` в `$Bootstrap`. Повторное объявление имени заменяет определение: экземпляры старого уничтожаются (`$OnDestroy`), а следующий запрос создаёт новый. `$Destroy()` у экземпляра, который держит приложение, уничтожает его; следующий запрос создаёт другой.

Сборка опускает сервисы, которые приложение не использует: она сохраняет названные в коде в кавычках (`$Service('Cart')`). Имя, собранное во время выполнения, нужно где-то назвать или собирать с `--full`.

## ElemenxUI

Библиотека приносит свои сервисы: `Theme`, `Toast`, `Dialogs`, `Hotkeys`, `Clipboard`, `Format`, `Formats`, `Forms`, `Icons`, `Emoji`, `Cities`, `Countries`, `Currencies`, `Gamepad`, `Platform`, `Push`, `Print`, `Syntax`, `Diff`, `RichText` и другие: см. раздел «Сервисы».

## Пример

Сервис корзины, объявленный примером, и два места, которые его используют:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Add tea" (click)="AddTea" />
	<Button Label="Add milk" (click)="AddMilk" />
	<Button Label="Empty" Variant="ghost" (click)="Empty" />
</div>
<p>In the cart: {{Count}} · {{Titles}}</p>
<script>
({
	Count: 0,
	Titles: '',

	$OnCreate: function () {
		var self = this;

		if (!window.ElemenxDocsCart) {
			window.ElemenxDocsCart = true;

			Elemenx.Service('DocsCart', {
				$OnCreate: function () {
					this.Items = [];
					this.Listeners = [];
				},

				Add: function (title) {
					this.Items.push(title);
					this.Changed();
				},

				Empty: function () {
					this.Items = [];
					this.Changed();
				},

				OnChange: function (listener) {
					this.Listeners.push(listener);
				},

				OffChange: function (listener) {
					this.Listeners = this.Listeners.filter(function (item) {
						return item !== listener;
					});
				},

				Changed: function () {
					var items = this.Items.slice();

					this.Listeners.forEach(function (listener) {
						listener(items);
					});
				}
			});
		}

		this.Show = function (items) {
			self.Count = items.length;
			self.Titles = items.join(', ') || 'nothing';
		};

		this.$Service('DocsCart').OnChange(this.Show);
		this.Show(this.$Service('DocsCart').Items);
	},

	$OnDestroy: function () {
		this.$Service('DocsCart').OffChange(this.Show);
	},

	AddTea: function () {
		this.$Service('DocsCart').Add('tea');
	},

	AddMilk: function () {
		this.$Service('DocsCart').Add('milk');
	},

	Empty: function () {
		this.$Service('DocsCart').Empty();
	}
})
</script>
```

Сервис принадлежит приложению этой справки: уйдите со страницы и вернитесь — в корзине останется то, что было добавлено.
