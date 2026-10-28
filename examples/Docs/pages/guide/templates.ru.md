<!-- generated -->
# Шаблоны

Шаблон — HTML с привязками Elemenx. Его выражения — JavaScript, вычисляемый в контексте полей компонента (его методов и хелперов, заданных в `$OnCreate`), и каждая привязка следует за полями, которые читает: измените поле — и изменятся ровно те тексты, атрибуты и элементы, что его используют.

| Синтаксис | Что делает |
| --- | --- |
| `{{Expression}}` | текст — в содержимом элемента или внутри атрибута: `title="Hello, {{Name}}"` |
| `[value]="Expression"` | свойство элемента (`value`, `checked`, `disabled`, `hidden`...) или свойство компонента |
| `[property.innerHTML]="Html"` | свойство элемента по имени (HTML читает его строчными буквами — находится свойство с этим именем в любом регистре) |
| `[attribute.aria-label]="Label"` | атрибут; `null` или `undefined` удаляет его |
| `[class]="['card', Kind, Active ? 'active' : '']"` | классы из списка (пустые пропускаются), добавляемые к классам, написанным в теге |
| `[class.selected]="Selected"` | один класс, пока значение истинно |
| `[style]="{'width': Width + 'px', '--accent': Color}"` | стили из объекта с именами CSS; `null` удаляет стиль |
| `[style.width]="Width + 'px'"` | один стиль; пользовательские свойства тоже: `[style.--size]` |
| `(click)="Method"` | событие: метод получает `(event, element)`; на теге компонента — `(data, component)` |
| `[(value)]="Name"` | двусторонняя привязка у `input`, `textarea` или `select`: поле следует за вводом (`input`), а элемент — за полем |
| `[(checked)]="Agreed"`, `[(selected)]="Picked"` | двусторонняя привязка у флажка, радиокнопки, варианта (по `change`) |
| `#name` | отмечает элемент для `this.$Ref('name')` (все такие элементы, строки `*for`: `this.$Refs('name')`) |
| `*if`, `*for`, `*key`... | структура: см. ниже и [Директивы](/guide/directives) |
| `{{$T('key', params)}}` | фраза на языке страницы ([Языки](/guide/locale)) |

Выражение, называющее несуществующее поле, молчит (даёт `undefined`); любая другая ошибка пишется в консоль вместе с выражением.

```example
<p title="Hello, {{Name}}">{{Name || 'Nobody'}} has {{Items.length}} items.</p>
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Name" placeholder="A name" /></span>
<label><input type="checkbox" [(checked)]="Bold" /> bold</label>
<ul [style.font-weight]="Bold ? '700' : '400'">
	<li *for="item of Items" *key="item" [class.elemenx-text]="true" [class.muted]="$index % 2 === 1">{{$index + 1}}. {{item}}</li>
</ul>
<p *if="Items.length > 2" [style.color]="'var(--elemenx-success)'">More than two.</p>
<Button Label="Add" Icon="add" (click)="Add" />
<script>
({
	Name: 'Ada',
	Bold: false,
	Items: ['pen', 'paper'],

	Add: function () {
		this.Items.push('item ' + (this.Items.length + 1));
	}
})
</script>
```

## Условия и списки

- `*if="Condition"` строит элемент (и компоненты в нём), пока условие истинно, и уничтожает, когда оно становится ложным.
- `*for="item of List"` строит элемент для каждого элемента списка (или любого итерируемого); `$index` — его место. `*for="key in Object"` перебирает ключи объекта. `*for="i = 0; i < Count; i++"` — цикл со счётчиком.
- `*key="item.ID"` даёт каждому элементу имя, так что меняющийся список сохраняет каждый элемент DOM со своим элементом данных: перемещённая строка перемещается, новая строится, удалённая уходит, и состояние их компонентов сохраняется. Без ключа элементы переиспользуются по месту.
- У хоста одна структурная директива. Для условия вокруг списка вкладывайте элементы:

```html
<section *if="Visible">
	<Card *for="item of Items" *key="item.ID" [title]="item.Title" />
</section>
```

Коллекция строит не больше 10 000 элементов: цикл, условие которого никогда не кончается, выбрасывает ошибку, а не замораживает страницу.

## Компоненты в шаблоне

Компонент — тег с его именем: `<Button Label="Save" />`. Обычные атрибуты дают тексты, привязки — значения, `(name)` слушает его события, а разметка между тегами уходит в слоты. О свойствах — в [Компонентах](/guide/components).

Тег компонента может быть самозакрывающимся (`<Icon Name="save" />`), даже если шаблон — HTML. `class`, написанный на теге компонента, остаётся на теге шаблона, а не на корне компонента: стилизуйте компонент его свойствами или через обёртку.

## События в списках

Значение привязки события — имя метода. Метод, которому надо знать, какой элемент нажали, читает его из своего элемента DOM:

```html
<li *for="product of Products" *key="product.ID">
	{{product.Title}}
	<button type="button" [attribute.data-id]="product.ID" (click)="Remove">Remove</button>
</li>
```

```js
Remove: function (event, button) {
	var id = Number(button.getAttribute('data-id'));

	this.Products = this.Products.filter(function (product) {
		return product.ID !== id;
	});
}
```

Или сделайте строку отдельным компонентом, который отправляет событие со своим элементом данных.

## Откуда берётся шаблон

Шаблон может быть:

- текстом в определении: `$Template: '<p>{{Text}}</p>'`;
- файлом рядом со скриптом: `$TemplateURL: 'Card.html'` (производственная сборка встраивает его);
- шаблоном страницы: `$TemplateID: 'cart'` берёт `<template id="cart">` или `<script type="text/html" id="cart">`;
- функцией, возвращающей текст и вызываемой для каждого нового экземпляра: `$Template: function () { return '...'; }`;
- шаблоном реестра: `Elemenx.Template('cart', '<ul>...</ul>')` регистрирует его, а `$TemplateID: 'cart'` называет.

`$Template` — это сам шаблон; имя в нём (`$Template: '#cart'`) вызывает ошибку `Elemenx $Template is the template itself, not a name: use $TemplateID: 'cart'`.

Браузер разбирает `<template>` как HTML: пишет имена тегов в нижнем регистре (`<Table>` становится `table` из HTML, и парсер выносит из неё то, чего таблица содержать не может), `<TextArea />` забирает остаток страницы как свой текст, `<Card />` вбирает идущие за ним теги. Поэтому серверы и сборки Elemenx (`elemenx dev`, `elemenx serve`, `elemenx build`, `Server.Create`) отдают каждый `<template id>` страницы как `<script type="text/html" id>`, текст которого браузер не разбирает: пишите шаблоны страницы в `<template id>`, как в файлах проекта, и они дойдут до Elemenx такими, какими написаны. Шаблон, в котором есть `</script>`, остаётся `<template>`.

Страницу, которую отдаёт другой сервер (PHP, Python, Java...), разбирает браузер. Там Elemenx находит компоненты неизвестного тега в любом регистре, но не названные как элемент HTML (`Button`, `Input`, `Select`, `Table`, `TextArea`, `Dialog`...) и не самозакрывающиеся теги: пишите такой шаблон как `<script type="text/html" id>` или пропускайте страницы сервера через `require('@qybercom/elemenx/tools/templates.js').Page(html)` (Node).

## Реестр шаблонов

| Метод | Значение |
| --- | --- |
| `Elemenx.Template(name)` | шаблон с этим именем или `null` |
| `Elemenx.Template(name, value)` | регистрирует шаблон |
| `Elemenx.Template.Has(name)`, `Elemenx.Template.Remove(name)` | |
| `Elemenx.Template.Loader(function (name, done) {...})` | источник шаблонов по имени: верните текст или вызовите `done(text)` позже |
| `Elemenx.Template.Reload(name, value)` | заменяет шаблон и перерисовывает каждый использующий его экземпляр; возвращает их число |

Элементы `<template id>` и `<script type="text/html" id>` страницы регистрируются по своему `id` по мере появления, в том числе добавленные позже. Приложение даёт тот же реестр как `$Template`.

## SVG

Шаблон может содержать SVG: его элементы сохраняют пространство имён, а привязки работают на них так же, как на HTML (`[attribute.d]="Path"`, `[attribute.fill]="Color"`).

```example
<svg width="160" height="60" viewBox="0 0 160 60">
	<rect *for="value of Values" *key="$index" [attribute.x]="$index * 32 + 4" [attribute.y]="60 - value" width="24" [attribute.height]="value" rx="3" fill="var(--elemenx-accent)"></rect>
</svg>
<Button Label="Shuffle" (click)="Shuffle" />
<script>
({
	Values: [20, 45, 30, 55, 12],

	Shuffle: function () {
		this.Values = this.Values.map(function () {
			return 8 + Math.round(Math.random() * 50);
		});
	}
})
</script>
```

## Длинная страница

`*lazy` строит часть страницы, когда она приближается к экрану или когда браузер простаивает, так что первый экран показывается сразу. Его значение держит место до тех пор: высота (`*lazy="320"`) или шаблон страницы (`*lazy="'#skeleton'"`). См. [Ленивая отрисовка и кэш](/guide/cache).
