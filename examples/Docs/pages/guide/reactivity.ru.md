<!-- generated -->
# Состояние и реактивность

Состояние компонента — его поля. Elemenx следит за ними: каждый текст, атрибут, условие и список шаблона помнит, какие поля прочитал, и когда одно из них меняется, обновляются эти части — и только они. Нет ни `setState`, ни списков зависимостей, ни сравнения деревьев.

```js
Elemenx.Component('Cart', {
	$Template: '<p>{{Items.length}} items, {{Total(Items)}} €</p>',
	Items: [],

	$OnCreate: function () {
		this.Total = function (items) {
			return items.reduce(function (sum, item) {
				return sum + item.Price * item.Count;
			}, 0);
		};
	},

	Add: function (product) {
		this.Items.push({ID: product.ID, Price: product.Price, Count: 1});
	},

	More: function (index) {
		this.Items[index].Count++;
	}
});
```

## За чем следят

- **Поля** компонента: присваивание (`this.Name = 'Ada'`) обновляет то, что его читает. Повторное присваивание того же значения ничего не делает.
- **Простые объекты и списки внутри них, на любой глубине**: `this.User.Address.City = 'Riga'`, `this.Items.push(item)`, `this.Items.splice(0, 1)`, `this.Items[2] = item`, `delete this.Filters.Color`. Список, меняющий длину, и объект, получивший или потерявший ключ, обновляют `*for` по ним.
- **Не отслеживается**: содержимое других объектов (`Date`, `Map`, экземпляр класса, узел DOM, сетевой ресурс). Чтобы обновить, замените их: `this.Since = new Date(...)`.

Изменения синхронны: как только присваивание выполнено, DOM это показывает. Метод списка (`push`, `splice`, `sort`...) считается одним изменением, сколько бы элементов он ни передвинул.

## Несколько изменений сразу

`this.$Batch(function (state) {...})` делает несколько изменений и обновляет шаблон один раз, в конце. `state` — само состояние:

```js
this.$Batch(function (state) {
	state.Loading = false;
	state.Items = response.Items;
	state.Total = response.Total;
});
```

`this.$Update({Loading: false, Items: items})` задаёт несколько полей одним пакетом; имя с `$` выбрасывает `Elemenx component value uses reserved $ namespace`.

## Хелперы и вычисляемые значения

Выражение шаблона вычисляется заново, когда меняются поля, которые оно читает. Вычисляемое значение, нужное в нескольких местах, выносите в метод, который принимает поля аргументами:

```js
Visible: function (items, filter) {
	return items.filter(function (item) {
		return !filter || item.Tags.indexOf(filter) !== -1;
	});
}
```

```html
<li *for="item of Visible(Items, Filter)" *key="item.ID">{{item.Title}}</li>
```

Хелпер только вычисляет: если он присваивает поле, которое читает шаблон, шаблон вычисляет его снова, без конца (`Maximum call stack size exceeded`).

Хелпер читает `items` и `filter` через аргументы, поэтому список следует за обоими. Хелпер, который внутри читает `this.Items`, тоже работает, пока его вызывает шаблон, но явно названные зависимости понятнее.

## Вне компонента

- **Сервисы** не реактивны: компонент копирует показываемое в свои поля, а сервис говорит ему, когда (`OnChange(callback)`), или компонент читает сервис в хелпере с меняющимся аргументом.
- **Обратные вызовы** сети, таймеров и событий других объектов выполняются вне шаблона: они просто присваивают поля, и шаблон следует.
- Хуки (`$OnCreate`, `$OnReady`, `$OnDestroy`, `$OnSleep`, `$OnWake`) выполняются без отслеживания: то, что они читают, не связывает с этим компонент, который их создал.

## Пример

Состояние этого примера — объект со списком внутри; каждая кнопка меняет его по-своему, а шаблон следует:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Push" (click)="Push" />
	<Button Label="Change the first" (click)="ChangeFirst" />
	<Button Label="Remove the last" (click)="RemoveLast" />
	<Button Label="Sort" (click)="Sort" />
	<Button Label="Batch of three" Variant="primary" (click)="Three" />
</div>
<p>{{Basket.Owner}}: {{Basket.Items.length}} items, {{Sum(Basket.Items)}} in total</p>
<ul class="elemenx-ul">
	<li *for="item of Basket.Items" *key="item.ID">{{item.Title}} × {{item.Count}}</li>
</ul>
<script>
({
	Basket: {Owner: 'Ada', Items: [{ID: 1, Title: 'Tea', Count: 2}, {ID: 2, Title: 'Milk', Count: 1}]},
	Next: 3,

	$OnCreate: function () {
		this.Sum = function (items) {
			return items.reduce(function (sum, item) {
				return sum + item.Count;
			}, 0);
		};
	},

	Push: function () {
		this.Basket.Items.push({ID: this.Next, Title: 'Item ' + this.Next, Count: 1});
		this.Next++;
	},

	ChangeFirst: function () {
		if (this.Basket.Items.length)
			this.Basket.Items[0].Count++;
	},

	RemoveLast: function () {
		this.Basket.Items.pop();
	},

	Sort: function () {
		this.Basket.Items.sort(function (a, b) {
			return b.Count - a.Count;
		});
	},

	Three: function () {
		var self = this;

		this.$Batch(function (state) {
			state.Basket.Items.push({ID: self.Next, Title: 'Batched', Count: 3});
			state.Basket.Items[0].Count += 10;
			state.Basket.Owner = 'Grace';
			self.Next++;
		});
	}
})
</script>
```
