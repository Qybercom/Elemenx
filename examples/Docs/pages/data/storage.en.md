# Storage

`Elemenx.Storage` gives the storages of the browser one shape: `Local` (`localStorage`: kept until it is cleared), `Session` (`sessionStorage`: kept while the tab lives), `Cookie` (`document.cookie`: sent to the server with every request) and `IndexedDB` (a database of objects, see [IndexedDB](/data/indexeddb)). A namespace keeps the keys of one part of an Application apart from the others, and a context gives several parts the same namespaces and database.

```js
var local = Elemenx.Storage.Local;

local.Set('settings', {Theme: 'dark', Size: 14});

local.Get('settings');    /* {Theme: 'dark', Size: 14} */
local.Has('settings');    /* true */
local.Remove('settings');
```

## Local and Session

| Method | Meaning |
| --- | --- |
| `Get(name)` | the value, or `null` when there is none (or it is not a value Elemenx wrote) |
| `Set(name, value)` | stores any value JSON can hold: numbers, texts, lists, objects; returns the storage |
| `Has(name)` | whether there is a value |
| `Remove(name)` | removes it |
| `Clear()` | removes every key of the namespace (of the whole storage without one) |
| `Namespace(name)` | the same storage under the prefix `name.`: `Local.Namespace('cart').Set('items', [...])` writes `cart.items` |

A value is stored as `{"Value": ...}`, so `Get` gives back the same type it was given: a number stays a number, `false` stays `false`.

## Cookie

A cookie holds a text. `Set(name, value, options)`, `Remove(name, options)` and `Clear(options)` take the options of a cookie:

| Option | Meaning |
| --- | --- |
| `Path` | the paths that receive it, `'/'` for the whole site |
| `Domain` | the domain and its subdomains |
| `MaxAge` | seconds it lives |
| `Expires` | the moment it ends: a `Date` or a text |
| `SameSite` | `'Strict'`, `'Lax'` or `'None'` |
| `Secure` | only over HTTPS |

A cookie is removed with the `Path` and `Domain` it was set with. `Get`, `Has` and `Namespace` work as for `Local`.

## Contexts

```js
Elemenx.Storage.Context('Shop', {
	Namespace: 'shop',
	IndexedDB: {
		Name: 'Shop',
		Version: 2,
		Stores: {Orders: {KeyPath: 'ID'}, Products: {KeyPath: 'ID', Indexes: {Category: {}}}}
	}
});

Elemenx.Storage.Context('ShopCart', {Contexts: 'Shop', Namespace: 'cart'});

var storage = Elemenx.Storage('ShopCart');

storage.Local.Set('items', [7, 12]);        /* the key shop.cart.items */
storage.IndexedDB().Store('Orders');        /* the database Shop */
```

`Elemenx.Storage(context)` returns `{Local, Session, Cookie, IndexedDB}` for a context: the namespaces of the context and of the contexts it builds on (`Contexts`) are joined in order, and their `IndexedDB` definitions are merged, so `IndexedDB()` without arguments opens the database they describe (with arguments, `IndexedDB(name, definition)` opens another one). A context that names itself through its `Contexts` throws `Elemenx circular Storage Context dependency`; an unknown one throws `Elemenx unknown Storage Context: <name>`.

In a component or a service `this.$Storage('ShopCart')` is the same as `Elemenx.Storage('ShopCart')`. An Application declares a context with `this.$Storage(name, definition)`.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Note" placeholder="A note" /></span>
	<Button Label="Save" Variant="primary" (click)="Save" />
	<Button Label="Remove" Variant="ghost" (click)="Remove" />
</div>
<Properties>
	<Property Label="Local (survives a reload)" [value]="Stored.Local" />
	<Property Label="Session (this tab)" [value]="Stored.Session" />
	<Property Label="Cookie" [value]="Stored.Cookie" />
	<Property Label="Saves in this browser" [value]="Stored.Count" />
</Properties>
<script>
({
	Note: 'Remember the milk',
	Stored: {},

	$OnCreate: function () {
		this.Read();
	},

	Storage: function () {
		return {
			Local: Elemenx.Storage.Local.Namespace('docs-example'),
			Session: Elemenx.Storage.Session.Namespace('docs-example'),
			Cookie: Elemenx.Storage.Cookie.Namespace('docs-example')
		};
	},

	Read: function () {
		var storage = this.Storage();

		this.Stored = {
			Local: storage.Local.Get('note') || '—',
			Session: storage.Session.Get('note') || '—',
			Cookie: storage.Cookie.Get('note') || '—',
			Count: String(storage.Local.Get('count') || 0)
		};
	},

	Save: function () {
		var storage = this.Storage();

		storage.Local.Set('note', this.Note);
		storage.Local.Set('count', (storage.Local.Get('count') || 0) + 1);
		storage.Session.Set('note', this.Note);
		storage.Cookie.Set('note', this.Note, {Path: '/', MaxAge: 3600, SameSite: 'Lax'});

		this.Read();
	},

	Remove: function () {
		var storage = this.Storage();

		storage.Local.Remove('note');
		storage.Session.Remove('note');
		storage.Cookie.Remove('note', {Path: '/'});

		this.Read();
	}
})
</script>
```
