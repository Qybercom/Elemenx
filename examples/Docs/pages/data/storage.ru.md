<!-- generated -->
# Хранилище

`Elemenx.Storage` придаёт хранилищам браузера один вид: `Local` (`localStorage`: хранится, пока его не очистят), `Session` (`sessionStorage`: пока жива вкладка), `Cookie` (`document.cookie`: уходит на сервер с каждым запросом) и `IndexedDB` (база объектов, см. [IndexedDB](/data/indexeddb)). Пространство имён отделяет ключи одной части приложения от других, а контекст даёт нескольким частям одни и те же пространства имён и базу.

```js
var local = Elemenx.Storage.Local;

local.Set('settings', {Theme: 'dark', Size: 14});

local.Get('settings');    /* {Theme: 'dark', Size: 14} */
local.Has('settings');    /* true */
local.Remove('settings');
```

Там, где странице нельзя пользоваться хранилищами браузера (sandbox-фрейм без `allow-same-origin`, хранилище, заблокированное пользователем, Node), `Local`, `Session` и `Cookie` хранят значения в памяти, только для этой страницы: приложение всё равно загружается и работает, а сохранённое уходит вместе со страницей.

## Local и Session

| Метод | Значение |
| --- | --- |
| `Get(name)` | значение или `null`, если его нет (или его записал не Elemenx) |
| `Set(name, value)` | сохраняет любое значение, которое умеет JSON: числа, тексты, списки, объекты; возвращает хранилище |
| `Has(name)` | есть ли значение |
| `Remove(name)` | удаляет его |
| `Clear()` | удаляет все ключи пространства имён (без него — всего хранилища) |
| `Namespace(name)` | то же хранилище под префиксом `name.`: `Local.Namespace('cart').Set('items', [...])` пишет `cart.items` |

Значение хранится как `{"Value": ...}`, поэтому `Get` возвращает тот же тип, что был записан: число остаётся числом, `false` — `false`.

## Cookie

Cookie хранит текст. `Set(name, value, options)`, `Remove(name, options)` и `Clear(options)` принимают параметры cookie:

| Параметр | Значение |
| --- | --- |
| `Path` | пути, которые его получают, `'/'` — весь сайт |
| `Domain` | домен и его поддомены |
| `MaxAge` | сколько секунд он живёт |
| `Expires` | момент окончания: `Date` или текст |
| `SameSite` | `'Strict'`, `'Lax'` или `'None'` |
| `Secure` | только по HTTPS |

Cookie удаляется с теми же `Path` и `Domain`, с которыми был записан. `Get`, `Has` и `Namespace` работают как у `Local`.

## Контексты

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

`Elemenx.Storage(context)` возвращает `{Local, Session, Cookie, IndexedDB}` для контекста: пространства имён контекста и контекстов, на которых он строится (`Contexts`), соединяются по порядку, а их определения `IndexedDB` сливаются, так что `IndexedDB()` без аргументов открывает описанную ими базу (с аргументами `IndexedDB(name, definition)` открывает другую). Контекст, ссылающийся сам на себя через `Contexts`, выбрасывает `Elemenx circular Storage Context dependency`; неизвестный — `Elemenx unknown Storage Context: <name>`.

В компоненте или сервисе `this.$Storage('ShopCart')` — то же, что `Elemenx.Storage('ShopCart')`. Приложение объявляет контекст через `this.$Storage(name, definition)`.

## Пример

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
