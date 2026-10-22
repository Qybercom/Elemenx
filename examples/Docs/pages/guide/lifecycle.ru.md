<!-- generated -->
# Жизненный цикл

Компонент создаётся, отрисовывается, возможно, засыпает и просыпается, и уничтожается; приложение запускается и становится готовым или терпит неудачу. В каждый из этих моментов вызываются хуки определения, где `this` — компонент (или приложение).

## Компонент

| Хук | Когда | Для чего |
| --- | --- | --- |
| `$OnCreate(data)` | у состояния есть первые значения (значения по умолчанию, затем свойства тега в `data`), до первой отрисовки | хелперы шаблона, значения, вычисленные из свойств, слушатели сервисов |
| `$OnReady()` | шаблон отрисован и находится в элементе компонента; значения маршрута на месте | измерение DOM, фокус на поле, запуск запроса, таймера |
| `$OnSleep()` | компонент покидает страницу, но сохраняется (см. [Ленивая отрисовка и кэш](/guide/cache)) | пауза таймеров, медиа, сокетов |
| `$OnWake()` | он возвращается таким, каким был | их возобновление |
| `$OnDestroy()` | он уходит насовсем | удаление того, что он добавил вне себя: слушателей `window` и сервисов, таймеров |

```js
Elemenx.Component('Clock', {
	$Template: '<time>{{Now}}</time>',
	Now: '',

	$OnCreate: function () {
		this.Tick = this.Tick.bind(this);
	},

	$OnReady: function () {
		this.Tick();
		this.Timer = setInterval(this.Tick, 1000);
	},

	$OnSleep: function () {
		clearInterval(this.Timer);
	},

	$OnWake: function () {
		this.$OnReady();
	},

	$OnDestroy: function () {
		clearInterval(this.Timer);
	},

	Tick: function () {
		this.Now = new Date().toLocaleTimeString();
	}
});
```

То, чем компонент владеет, завершается вместе с ним без всяких хуков: его запросы и сокеты (`$Network`), сокеты событий и сообщений (`$Events`, `$Messaging`), воркеры (`$WebWorker`), слушатели его шаблона, директивы и компоненты шаблона. `$OnDestroy` вызывается до уничтожения детей, пока элемент ещё на странице.

Слушатели его тега и его `$Parent()` уже на месте перед `$OnCreate`: событие, отправленное из `$OnCreate` или `$OnReady`, доходит до владельца.

`$OnCreate`, `$OnReady`, `$OnDestroy`, `$OnSleep` и `$OnWake` выполняются без отслеживания: то, что они читают, не делает шаблон родителя, создающего компонент (строку `*for`), зависимым от этого.

## Компоненты, которые загружаются позже

При разработке компонент, названный шаблоном, может быть ещё не загружен: его тег держит место, пока приходят файлы. Компонент вокруг него узнаёт об этом:

| Хук | Когда |
| --- | --- |
| `$OnChildPending(child)` | компонент внутри начал загружаться |
| `$OnChildReady(child)` | он отрисован |
| `$OnChildError(child)` | он не смог загрузиться (`child.Error`) |

`child` — это `{Name, $Element, Error}`. Без хуков тег может показать собственный статус: `*pending` — разметку на время загрузки, `*error` — при неудаче; каждый — шаблон страницы (`'#id'`) или текст:

```html
<Chart *pending="#chart-loading" *error="#chart-failed" [data]="Sales" />
```

Компонент, который не загрузился и никто об этом не услышал, пишет ошибку в консоль. Корень приложения сообщает приложению.

## Приложение

| Хук | Когда |
| --- | --- |
| `$Bootstrap()` | первым, до любой загрузки |
| `$OnPending()` | корень начал загружаться (элемент монтирования показывает `$Pending`) |
| `$OnReady()` | корень отрисован |
| `$OnError(error)` | корень или нужный для запуска компонент не удался (элемент монтирования показывает `$Error`) |

Маршрутизатор приложения стартует вместе с его корнем: страница первого маршрута отрисовывается после `$OnReady` корня, а пока показывается компонент ожидания (см. [Маршрутизатор](/guide/router)).

## Порядок

Для компонента с детьми в шаблоне: `$OnCreate` родителя, затем его отрисовка, создающая каждого ребёнка (у каждого свои `$OnCreate`, отрисовка и `$OnReady`), затем `$OnReady` родителя. Уничтожение идёт наоборот: `$OnDestroy` родителя, затем его дети.

## Пример

Ребёнок записывает свои хуки в журнал. `*if` уничтожает его; с `*keep` он вместо этого засыпает и просыпается:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Toggle Label="Shown" [checked]="Shown" (change)="Show" />
	<Toggle Label="*keep" [checked]="Keep" (change)="Kept" />
</div>
<div class="elemenx-panel" *if="Shown && !Keep"><LifeProbe Name="plain" (life)="Logged" /></div>
<div class="elemenx-panel" *if="Shown && Keep" *keep><LifeProbe Name="kept" (life)="Logged" /></div>
<ol class="elemenx-ol"><li *for="line of Log" *key="$index">{{line}}</li></ol>
<script>
({
	Shown: true,
	Keep: false,
	Log: [],

	$OnCreate: function () {
		if (window.ElemenxDocsLifeProbe) return;

		window.ElemenxDocsLifeProbe = true;

		Elemenx.Component('LifeProbe', {
			$Template: '<p>The {{Name}} child, created at {{Created}}</p>',
			Name: '',
			Created: '',

			$OnCreate: function () {
				this.Created = new Date().toLocaleTimeString();
				this.$Emit('life', this.Name + ': $OnCreate');
			},

			$OnReady: function () {
				this.$Emit('life', this.Name + ': $OnReady');
			},

			$OnSleep: function () {
				this.$Emit('life', this.Name + ': $OnSleep');
			},

			$OnWake: function () {
				this.$Emit('life', this.Name + ': $OnWake');
			},

			$OnDestroy: function () {
				this.$Emit('life', this.Name + ': $OnDestroy');
			}
		});
	},

	Show: function (value) {
		this.Shown = value;
	},

	Kept: function (value) {
		this.Keep = value;
	},

	Logged: function (line) {
		this.Log = this.Log.concat([line]).slice(-8);
	}
})
</script>
```

Сохранённый ребёнок засыпает, только когда кэш сохраняет экземпляры: эта справка задаёт `Elemenx.Cache({Instances: {Scope: 'marked'}})`, поэтому `*keep` здесь работает (см. [Ленивая отрисовка и кэш](/guide/cache)).
