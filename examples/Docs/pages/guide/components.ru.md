<!-- generated -->
# Компоненты

Компонент — шаблон с его состоянием, свойствами и методами. Его поля — одновременно состояние и свойства: родитель задаёт их атрибутами тега, компонент меняет их сам, а шаблон следует за каждым изменением.

```js
Elemenx.Component('Counter', {
	$Template: '<p>{{Label}}: {{Count}} <button type="button" (click)="Add">+{{Step}}</button></p>',
	Label: 'Clicks',
	Step: 1,
	Count: 0,

	Add: function () {
		this.Count += Number(this.Step);

		this.$Emit('change', this.Count);
	}
});
```

```html
<Counter Label="Votes" Step="5" (change)="Counted" />
```

## Определение

| Ключ | Значение |
| --- | --- |
| `$Template` | сам шаблон: текст или функция, возвращающая текст (вызывается для каждого экземпляра) |
| `$TemplateID` | имя шаблона реестра или `<template id>` / `<script type="text/html" id>` страницы (имя в `$Template`, `'#cart'`, вызывает ошибку) |
| `$TemplateURL` | файл шаблона относительно скрипта определения |
| `$Style` | его CSS текстом |
| `$StyleURL` | файл его CSS; таблица стилей компонента ставится один раз, при отрисовке первого экземпляра |
| `$Title` | заголовок документа, пока он отрисован (страница маршрутизатора) |
| `$KeepAlive` | `true` или `false`: засыпает ли он вместо уничтожения (см. [Ленивая отрисовка и кэш](/guide/cache)) |
| `$OnCreate(data)`, `$OnReady()`, `$OnProps(changed)`, `$OnDestroy()`, `$OnSleep()`, `$OnWake()` | его жизнь (см. [Жизненный цикл](/guide/lifecycle)) |
| `$OnChildPending(child)`, `$OnChildReady(child)`, `$OnChildError(child)` | компоненты внутри него, которые загружаются позже |
| `$OnRouteLeave(context)` | страницу маршрутизатора спросили, можно ли её покинуть (см. [Охранники](/guide/guards)) |
| `$Events` и `$OnEvent`, `$Messaging` и `$OnMessage` | каналы, которые он слушает ([события](/data/events), [сообщения](/data/messaging)) |
| поле | значение: его первое значение для каждого экземпляра |
| функция | метод: его вызывает событие шаблона, код вызывает `this.Method()` |

Компонент объявляется один раз. Шаблон, который его называет, находит его в момент компиляции: уже объявленным или в графе приложения, которое тогда его загружает (см. [Приложения](/guide/applications)). Тег с именем, которого нет ни там, ни там, остаётся обычным элементом.

## Свойства

Тег передаёт компоненту свойства атрибутами:

- обычный атрибут — текст: `Label="Votes"`; `""` и `"true"` дают `true`, `"false"` — `false`, `"null"` — `null`, `"{{expression}}"` — значение выражения;
- привязка — значение выражения родителя, и она следует за ним: `[items]="Products"`, `[disabled]="!Valid"`;
- привязка может залезать в объект: `[options.size]="Size"`, `[columns.0.title]="'Name'"`;
- регистр имён не важен, а имя в kebab-case читается в camelCase: `[page-size]`, `[pagesize]` и `[PageSize]` задают `PageSize`.

Числа в обычных атрибутах остаются текстом (`Step="5"` — это `'5'`): используйте `[step]="5"` или `Number(this.Step)` в компоненте.

Свойство течёт вниз: когда значение у родителя меняется, ребёнок получает новое. Компонент может менять свою копию (открытое меню, набранный текст); следующее изменение значения у родителя заменит её. Родитель, которому нужно знать об изменении, слушает событие. Компонент, которому нужно действовать при изменении свойства (загрузить данные нового `ID`), задаёт `$OnProps(changed)` (см. [Жизненный цикл](/guide/lifecycle)).

`class` и `style` на теге компонента — не свойства: они попадают на корневой элемент компонента, рядом с его собственными классами и стилем, и следуют за своими `{{ }}` (`<Card class="wide {{Kind}}" style="margin: 8px">`). Шаблон из нескольких элементов держит один корневой `div`, он их и получает. Компонент со свойствами `Class` или `Style` получает их как свойства.

## События

`this.$Emit(name, data)` вызывает слушателей своего тега: `(change)="Counted"` вызывает метод родителя `Counted` с `(data, component)`. Событие элемента шаблона (`(click)`, `(input)`, `(keydown)`) вызывает метод с `(event, element)`. Значение привязки события — имя метода, и ничего больше.

Каждое `change` к тому же поднимается по DOM от корня компонента как событие `elemenx-change` со значением в `detail`: форма или любой элемент вокруг слышит каждое значение, меняющееся внутри.

`this.$On(name, callback)` слушает собственные события компонента в коде.

## Слоты

Разметка между тегами компонента попадает в его слоты: `<slot>` в его шаблоне принимает то, что без атрибута `slot`, `<slot name="footer">` — то, что с `slot="footer"`. Переданная разметка принадлежит родителю: её привязки и события используют состояние родителя.

```js
Elemenx.Component('Panel', {
	$Template: '<section class="panel"><header><slot name="title"></slot></header><slot></slot><footer><slot name="actions"></slot></footer></section>'
});
```

```html
<Panel>
	<h3 slot="title">{{Product.Title}}</h3>
	<p>{{Product.Description}}</p>
	<Button slot="actions" Label="Buy" (click)="Buy" />
</Panel>
```

## Что видит шаблон

Шаблон видит поля своего компонента, его методы, хелперы, которые компонент задаёт себе в `$OnCreate` (`this.Format = function (value) {...}`), `$T` для фраз, значения маршрута (`$Params`, `$Query`, `$Hash`, `$Path`) и глобальные объекты страницы. То, что шаблон вычисляет, вынесите в метод или хелпер:

```js
Elemenx.Component('Price', {
	$Template: '<span>{{Money(Value)}}</span>',
	Value: 0,

	Money: function (value) {
		return Number(value).toFixed(2) + ' €';
	}
});
```

Передавайте методу нужные поля аргументами: тогда шаблон явно следует за ними. Обработчик события (`(click)="Save"`, `(change)="Picked"`) — метод или функция, заданная в `$OnCreate`: его ищут по имени, когда событие приходит, и вызывают на компоненте (также из `*if` и из строки `*for`). Метод, которому нужен объект вне состояния (canvas, сокет), получает его из хелпера: `this.Socket = function () { return socket; }` в `$OnCreate`, `this.Socket().Send(...)` в методе.

## Экземпляр

| Член | Значение |
| --- | --- |
| `$Element()` | корневой элемент |
| `$Ref(name)` | элемент шаблона, отмеченный `#name` |
| `$Refs(name)` | все элементы, отмеченные `#name` (строки `*for`), в порядке страницы; `[]`, если их нет |
| `$Ref(name, true)`, `$Refs(name, true)` | экземпляр компонента, отмеченного `#name` (`null` для элемента без компонента), экземпляры компонентов среди этих элементов |
| `$Emit(name, data)`, `$On(name, callback)` | его события |
| `$Parent()` | компонент, в шаблоне которого он находится |
| `$Application()` | его приложение |
| `$Service(name)` | сервис его приложения |
| `$Router()` | маршрутизатор его приложения: `Go`, `Replace`, `Back`, `Forward`, `On`, `Current` |
| `$Batch(function (state) {...})` | несколько изменений — одно обновление (см. [Состояние и реактивность](/guide/reactivity)) |
| `$Update(values)` | задаёт несколько полей сразу |
| `$Title(text)` | заголовок документа |
| `$Network(context)`, `$Storage(context)`, `$Events()`, `$Messaging(context)`, `$WebWorker(...)`, `$ServiceWorker(...)` | ресурсы, принадлежащие ему и завершающиеся вместе с ним |
| `$Generation()`, `$StartedAt()` | версия его определения (растёт при перезагрузке), момент создания |
| `$Destroy()` | уничтожает его |

## Компонент из кода

`Elemenx.Component(name)` возвращает фабрику: `factory(data, slots, options)` создаёт экземпляр, чей `$Element()` можно поставить в любое место страницы. `options.Application` даёт ему приложение, чтобы находились компоненты его библиотеки и его сервисы.

```js
var card = Elemenx.Component('ProductCard')({Title: 'Lamp', Price: 39}, null, {Application: this.$Application()});

document.querySelector('#aside').appendChild(card.$Element());

/* Later: */
card.$Destroy();
```

## Пример

Список и его элементы: элементы — компонент со свойствами, событием и слотом.

```example
<TodoItem *for="task of Tasks" *key="task.ID" [task]="task" (toggle)="Toggled">
	<span class="elemenx-caption">#{{task.ID}}</span>
</TodoItem>
<p class="elemenx-text small muted">{{Tasks.filter(function (task) { return task.Done; }).length}} of {{Tasks.length}} done</p>
<script>
({
	Tasks: [{ID: 1, Title: 'Write the page', Done: true}, {ID: 2, Title: 'Test it', Done: false}, {ID: 3, Title: 'Ship it', Done: false}],

	$OnCreate: function () {
		if (window.ElemenxDocsTodoItem) return;

		window.ElemenxDocsTodoItem = true;

		Elemenx.Component('TodoItem', {
			$Template: '<label class="elemenx-container" style="gap: 8px;"><input type="checkbox" [checked]="Task.Done" (change)="Changed" /> <span [style.text-decoration]="Task.Done ? \'line-through\' : \'none\'">{{Task.Title}}</span> <slot></slot></label>',
			Task: null,

			Changed: function (event, input) {
				this.$Emit('toggle', {ID: this.Task.ID, Done: input.checked});
			}
		});
	},

	Toggled: function (change) {
		this.Tasks = this.Tasks.map(function (task) {
			return task.ID === change.ID ? {ID: task.ID, Title: task.Title, Done: change.Done} : task;
		});
	}
})
</script>
```
