# Services

A service is one object that the components of an Application share: the session of the user, a client of an API, a cart, the settings. It is made the first time something asks for it, lives as long as its Application, and every Application of the page has an instance of its own.

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

## Using a service

`this.$Service('Cart')` in a component, a service or a guard returns the instance of its Application. Outside an Application, `Elemenx.Service('Cart')` returns an instance of the page.

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

A service is not reactive: its fields change without the templates knowing. A component keeps what it shows in its own fields, and the service tells it when to read them again (a callback, an [event](/data/events)). Report what takes time with callbacks `(error, result)` or events, never with a Promise.

## The definition

| Key | Meaning |
| --- | --- |
| a field | its first value (each instance gets its own; give lists and objects their value in `$OnCreate`, so instances do not share them) |
| a method | called on the instance: `this` is the service |
| `$OnCreate()` | the instance is made |
| `$OnDestroy()` | its Application is destroyed, or the service is declared again |
| `$Events` and `$OnEvent`, `$Messaging` and `$OnMessage` | its channels |

The instance also has `$Application()`, `$Service(name)` (another service of the same Application), `$Network(context)`, `$Storage(context)`, `$Events()`, `$Messaging(context)`, `$WebWorker(...)`, `$ServiceWorker(...)` (its resources end with it), `$Generation()` and `$StartedAt()`.

## Loading and declaring

In development, a service of the graph of an Application is loaded before the root renders. One that is asked for later (a name built at run time) is loaded then; the calls made meanwhile are queued and run once it is there.

`Elemenx.Service(name, definition)` declares a service anywhere; an Application declares one of its own with `this.$Service(name, definition)` in `$Bootstrap`. Declaring a name again replaces the definition: the instances made from the old one are destroyed (`$OnDestroy`) and the next request makes a new one. `$Destroy()` on the instance an Application holds destroys it; the next request makes another.

A build leaves out the services an Application does not use: it keeps the ones named in quotes in its code (`$Service('Cart')`). A name built at run time needs to be named somewhere, or a build with `--full`.

## ElemenxUI

The library brings services of its own: `Theme`, `Toast`, `Dialogs`, `Hotkeys`, `Clipboard`, `Format`, `Formats`, `Forms`, `Icons`, `Emoji`, `Cities`, `Countries`, `Currencies`, `Gamepad`, `Native`, `Push`, `Print`, `Syntax`, `Diff`, `RichText` and more: see the section Services.

## Example

A cart service declared by the example, and two places that use it:

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

The service belongs to the Application of this reference: leave the page and come back, and the cart still holds what was added.
