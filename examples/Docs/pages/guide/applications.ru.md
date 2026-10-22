<!-- generated -->
# Приложения

Приложение — корень страницы, сделанной на Elemenx: его корневой компонент и место отрисовки, папка исходников, используемые библиотеки, маршруты, языки и сервисы, которыми оно владеет. На странице может быть несколько приложений — каждое в своём элементе, со своими сервисами и маршрутизатором.

```js
Elemenx.Application('Shop', {
	$Title: 'Shop',
	$Component: 'Layout',
	$Mount: '#app',
	$Root: 'application',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']},
	$Pending: '<p class="loading">Loading the shop...</p>',
	$Error: '#shop-error',
	$State: {Region: 'EU'},
	$Router: {
		Waiting: 'PageLoading',
		NotFound: 'PageNotFound',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/product/:id', Component: 'ProductPage'}
		]
	},

	$Bootstrap: function () {
		this.$Network('API', {Protocol: 'JSON'});
	},

	$OnReady: function () {
		console.log('The shop is on the page');
	},

	$OnError: function (error) {
		console.error('The shop could not start', error);
	}
});
```

## Определение

| Ключ | Значение |
| --- | --- |
| `$Component` | имя корневого компонента |
| `$Mount` | где он отрисовывается: селектор (`'#app'`, `'body'`) или элемент |
| `$Root` | папка исходников относительно скрипта определения; её `index.js` начинает граф файлов, из которого Elemenx загружает сущности (см. ниже) |
| `$Use` | библиотека или их список: `'ElemenxUI'` или библиотеки, объявленные через `Elemenx.Library` (см. [Библиотеки](/guide/library)) |
| `$Locales` | словари его фраз: `'locales/{language}.json'` или `{URL, Languages}` (см. [Языки](/guide/locale)); корень отрисовывается, когда словари языка загружены |
| `$Router` | его маршруты (см. [Маршрутизатор](/guide/router)); маршрутизатор принадлежит корневому компоненту, в шаблоне которого есть outlet |
| `$Title` | заголовок документа |
| `$State` | первые значения состояния корневого компонента |
| `$Shadow` | `true`, `'open'` или `'closed'`: корень отрисовывается в shadow root элемента монтирования (см. [Стили и shadow DOM](/guide/styles)) |
| `$Pending` | что показывает элемент монтирования, пока приложение загружается: HTML или `'#name'` зарегистрированного шаблона либо `<template id>` страницы |
| `$Error` | что он показывает, если приложение не может запуститься, — в тех же формах |
| `$Bootstrap()` | вызывается первым, `this` — приложение: место объявить его контексты, сервисы и воркеры |
| `$OnPending()`, `$OnReady()`, `$OnError(error)` | запуск начался, закончился или не удался (нет компонента, шаблон не загружается) |
| `$Events`, `$OnEvent`, `$Messaging`, `$OnMessage` | его каналы [событий](/data/events) и [сообщений](/data/messaging) |

Определение читается один раз: `Elemenx.Application(name, definition)` создаёт приложение и запускает его, как только позволяют страница и граф; `Elemenx.Application(name)` возвращает созданное.

## Объект приложения

| Член | Значение |
| --- | --- |
| `$Name()`, `$Root()`, `$Mount()` | его имя, папка исходников, элемент монтирования |
| `$Component()` | корневой компонент после отрисовки |
| `$Router()` | его маршрутизатор |
| `$Service(name)` | его экземпляр сервиса: у каждого приложения свой (см. [Сервисы](/guide/services)); `$Service(name, definition)` объявляет сервис |
| `$Template(name, value)` | реестр шаблонов (`Elemenx.Template`) |
| `$Network(context)`, `$Storage(context)`, `$Messaging(context)` | фасады, принадлежащие ему; с двумя аргументами `(name, definition)` они объявляют контекст |
| `$Events()` | принадлежащий ему сокет [событий](/data/events) |
| `$WebWorker(name, definition)`, `$ServiceWorker(name, definition)` | воркеры, общие для его компонентов |
| `$Libraries()` | библиотеки, которые он использует |
| `$Reload(type, name, callback)` | заново загружает `'Component'` или `'Service'` и обновляет их живые экземпляры без перезагрузки страницы (для инструментов, подменяющих изменённый файл) |
| `$Title(text)` | задаёт заголовок документа |
| `$StartedAt()` | когда оно создано |
| `$Destroy()` | убирает его со страницы: его маршрутизатор, компоненты, сервисы и всё, чем они владеют, завершаются |

Компонент добирается до своего приложения через `this.$Application()`, а через него — до маршрутизатора, сервисов и общих воркеров.

## Граф исходников

При разработке Elemenx загружает файлы приложения, когда они впервые нужны: компонент — когда шаблон впервые его называет, сервис — когда его впервые запрашивают. `$Root` называет папку; её `index.js` — список того, что в ней: папки (со своим `index.js`) и файлы:

```js
/* application/index.js */
['components', 'services', 'guards', 'directives'];

/* application/components/index.js */
['Layout/Layout.js', 'HomePage/HomePage.js', 'cart'];

/* application/components/cart/index.js */
['CartPage/CartPage.js', 'CartLine/CartLine.js', 'cart.css'];
```

Файл объявляет свою сущность, а пути компонента (`$TemplateURL`, `$StyleURL`) читаются рядом с его скриптом. `.css` в `index.js` подключается к странице один раз. Сервисы, охранники и директивы графа загружаются до запуска корня; компоненты ждут первого использования. Производственная сборка кладёт весь граф в один бандл, и ничего не загружается по одному (см. [Ресурсы и бандлы](/guide/resources)).

## Несколько приложений

У каждого приложения свой корень, маршрутизатор, сервисы, языки собственных фраз и shadow root; фреймворк, его реестры компонентов и шаблоны — общие. Одно приложение может монтироваться внутрь элемента другого: внешнее сохраняет внутренний элемент монтирования на месте, когда перерисовывается.

```js
Elemenx.Application('Store', {$Component: 'StoreRoot', $Root: 'Store', $Mount: '#store'});
Elemenx.Application('Chat', {$Component: 'ChatRoot', $Root: 'Chat', $Mount: '#chat', $Shadow: true});
```

`elemenx generate application Chat` добавляет второе приложение рядом с первым, а сборка упаковывает все найденные графы (см. [Сборки](/guide/build)).

## Пример

Приложение, созданное в примере: оно монтируется в элемент этой страницы и уничтожается вместе с примером.

```example
<div class="docs-inner-mount"></div>
<Button Label="Mount the application" Variant="primary" [disabled]="Mounted" (click)="Mount" />
<Button Label="Destroy it" Variant="ghost" [disabled]="!Mounted" (click)="Destroy" />
<p class="elemenx-text small muted">{{Status}}</p>
<script>
({
	Mounted: false,
	Status: 'No application yet.',

	$OnCreate: function () {
		if (!window.ElemenxDocsInner) {
			window.ElemenxDocsInner = true;

			Elemenx.Component('DocsInnerRoot', {
				$Template: '<div class="elemenx-callout success">The application {{Name}} renders here, with its own state: {{Count}} <button type="button" (click)="Add">+1</button></div>',
				Name: '',
				Count: 0,

				Add: function () {
					this.Count++;
				}
			});
		}
	},

	Mount: function () {
		var self = this;

		this.Application = Elemenx.Application('DocsInner' + Date.now(), {
			$Component: 'DocsInnerRoot',
			$Mount: this.$Element().querySelector('.docs-inner-mount'),
			$State: {Name: 'Inner', Count: 10},

			$OnReady: function () {
				self.Status = 'Ready: ' + this.$Name();
			}
		});

		this.Mounted = true;
	},

	Destroy: function () {
		this.Application.$Destroy();
		this.Mounted = false;
		this.Status = 'Destroyed.';
	},

	$OnDestroy: function () {
		if (this.Application)
			this.Application.$Destroy();
	}
})
</script>
```
