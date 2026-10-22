<!-- generated -->
# Маршрутизатор

Маршрутизатор приложения ставит компонент маршрута в outlet своего макета, следует за ссылками страницы и шагами истории браузера, спрашивает [охранников](/guide/guards), показывает компонент ожидания, пока маршрут загружается, и сообщает о каждом шаге навигации событием.

```js
Elemenx.Application('Shop', {
	$Component: 'Layout',
	$Mount: 'body',
	$Router: {
		Mode: 'history',
		Waiting: 'PageLoading',
		NotFound: 'PageNotFound',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/product/:id', Component: 'ProductPage'},
			{Path: '/account', Component: 'AccountLayout', Guard: 'SignedIn', GuardFailed: 'SignIn', Routes: [
				{Path: 'orders', Component: 'OrdersPage'},
				{Path: 'orders/:order', Component: 'OrderPage', Outlet: 'Detail'}
			]}
		]
	}
});
```

```html
<!-- Layout -->
<nav><a href="/">Home</a> <a href="/product/7?tab=photos#reviews">A lamp</a> <a href="/account/orders">Orders</a></nav>
<main *outlet="Content"></main>
```

## Настройки

| Настройка | Значение |
| --- | --- |
| `Routes` | маршруты по порядку: побеждает первый подходящий |
| `Mode` | где живёт маршрут: `'history'`, `'hash'` или `'memory'` (ниже) |
| `Outlet` | имя outlet корня для маршрутов первого уровня, `'Content'` |
| `Waiting` | компонент, показываемый, пока маршрут загружается или охранник ждёт |
| `WaitingOutlet` | где показывается компонент ожидания, по умолчанию outlet маршрута |
| `NotFound` | компонент для пути, которому не подходит ни один маршрут |

`Elemenx.Router({Root: component, Routes: [...]})` создаёт маршрутизатор для любого компонента вне объявления приложения; `Start()` запускает его.

## Маршрут

| Ключ | Значение |
| --- | --- |
| `Path` | `/product/:id`: часть, начинающаяся с `:`, — параметр. Завершающий слеш и отсутствие начального не важны. Путь ребёнка продолжает путь родителя |
| `Component` | компонент маршрута: имя или фабрика |
| `Routes` | дети: их компонент попадает в outlet шаблона этого компонента |
| `Outlet` | outlet родителя, куда он попадает, по умолчанию `'Content'` (несколько outlet показывают нескольких детей) |
| `Guard`, `Guards` | охранник или их список, по имени или функциями (см. [Охранники](/guide/guards)) |
| `GuardFailed` | что показать, когда охранник отказал: компонент или `{GuardName: component, Default: component}` |
| `Waiting` | компонент ожидания этого маршрута вместо компонента маршрутизатора |

## Компонент маршрута

Компонент, который отрисовывает маршрутизатор, получает значения своего маршрута; их читает и его шаблон:

| Значение | Для `/product/7?tab=photos#reviews` |
| --- | --- |
| `$Path` | `'/product/7'` |
| `$Params` | `{id: '7'}` |
| `$Query` | `{tab: 'photos'}` (ключ без `=` — `''`) |
| `$Hash` | `'reviews'` |

Они есть начиная с `$OnReady`. Навигация на тот же маршрут с другими параметрами, запросом или якорем сохраняет компонент и меняет эти значения: шаблон, который их читает, следует за ними, а код, загружающий по ним данные, читает их в хелпере или следит за ними через события маршрутизатора. Навигация сохраняет компоненты, общие у старого и нового маршрутов (общий макет вложенных маршрутов).

Компонент, содержащий outlet (`*outlet="Content"`), — макет: outlet его шаблона получают детей его маршрута.

## Навигация

- **Ссылки**: щелчок по `<a href>` того же источника проходит через маршрутизатор (кроме ссылки с `target` или `download`, щелчка с Ctrl, Shift, Alt, Command или другой кнопкой мыши, щелчка, действие которого отменил слушатель, и пути без маршрута, когда нет `NotFound`: им браузер следует сам).
- **Код**: `this.$Router()` в компоненте возвращает маршрутизатор: `Go(url)` (новая запись истории), `Replace(url)` (та же запись), `Back()`, `Forward()`, `Current()` (текущие маршруты, от внешнего к внутреннему), `On(event, callback)`. `Go` и `Replace` никогда не выбрасывают: неудачная навигация — это событие.
- **История**: кнопки «Назад» и «Вперёд» браузера проходят через маршрутизатор и его охранников.

## Режимы

- `'history'`: маршрут — путь URL, через History API. По умолчанию для страницы, обслуживаемой по http. Сервер отвечает на каждый путь приложения его `index.html` (команды `elemenx dev` и `serve` так и делают).
- `'hash'`: маршрут после `#` (`index.html#/orders/5?tab=2#comments`); ссылка на `#/path` ведёт к маршруту, а ссылка на `#name` задаёт якорь текущего маршрута.
- `'memory'`: маршрут живёт в записях истории браузера, а URL страницы не меняется. По умолчанию для страницы, которая обслуживается не по http (файл, расширение браузера, окно Electron); её первый маршрут — `/`.

Вне режима `history` относительная ссылка или `Go('details')` читаются относительно текущего маршрута.

## События

`this.$Router().On(name, callback)` слышит навигацию (слушатель компонента уходит вместе с ним; на самом маршрутизаторе `router.Owner(owner).On(name, callback)` привязывает слушателя к владельцу, а `router.OffOwner(owner)` снимает их) как `callback(context)`: `context.$From` и `context.$To` — `{Path, Params, Query, Hash}`, `context.$Route` — маршрут, `context.$Guard` — охранник.

| Событие | Когда |
| --- | --- |
| `NavigationStart` | навигация начинается |
| `GuardStart`, `GuardWait`, `GuardEnd`, `GuardFailed` | охранника спросили, он ждёт, ответил, отказал |
| `NavigationWaiting` | показан компонент ожидания |
| `NavigationCommit` | URL стал новым |
| `NavigationEnd` | компоненты маршрута и загружаемые позже компоненты внутри них отрисованы |
| `NavigationCancel` | её заменила более новая навигация или охранник отказал |
| `NavigationError` | компонент маршрута не удалось загрузить или отрисовать (`context.$Error`); URL возвращается |

## Заголовки

Компонент с `$Title` задаёт заголовок документа при отрисовке: страница маршрутизатора называет вкладку. `this.$Title(text)` меняет его позже (страница, загрузившая свои данные).

## Пример

Маршрутизатор этой справки, управляемый из примера. Пример — не страница маршрутизатора, поэтому он добирается до маршрутизатора через своё приложение:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Go to Guards" (click)="Guards" />
	<Button Label="Back" Variant="ghost" (click)="Back" />
</div>
<p class="elemenx-text small muted">The routes of now: {{Routes}}</p>
<ol class="elemenx-ol"><li *for="line of Log" *key="$index">{{line}}</li></ol>
<script>
({
	Routes: '',
	Log: [],

	$OnCreate: function () {
		var self = this;
		var router = this.$Application().$Router();

		this.Routes = router.Current().map(function (route) {
			return route.Path;
		}).join(' › ');

		['NavigationStart', 'NavigationCommit', 'NavigationEnd'].forEach(function (name) {
			router.Owner(self).On(name, function (context) {
				self.Log = self.Log.concat([name + ': ' + context.$From.Path + ' → ' + context.$To.Path]);
			});
		});
	},

	$OnDestroy: function () {
		this.$Application().$Router().OffOwner(this);
	},

	Guards: function () {
		this.$Application().$Router().Go('/guide/guards');
	},

	Back: function () {
		this.$Application().$Router().Back();
	}
})
</script>
```

Пример уничтожается, когда меняется страница маршрута: его слушатели сообщают о начале и фиксации, и показывается следующая страница. Вернитесь кнопкой «Назад».
