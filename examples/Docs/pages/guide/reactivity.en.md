# State and reactivity

The state of a component is its fields. Elemenx watches them: every text, attribute, condition and list of the template remembers which fields it read, and when one of them changes, those parts, and only those, are updated. There is no `setState`, no list of dependencies and no comparison of trees.

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

## What is watched

- **Fields** of the component: assigning one (`this.Name = 'Ada'`) updates what reads it. Assigning the same value again does nothing.
- **Plain objects and lists inside them, at any depth**: `this.User.Address.City = 'Riga'`, `this.Items.push(item)`, `this.Items.splice(0, 1)`, `this.Items[2] = item`, `delete this.Filters.Color`. A list that changes its length, and an object that gains or loses a key, update the `*for` over them.
- **Not watched**: the inside of other objects (a `Date`, a `Map`, an instance of a class, a DOM node, a resource of the network). Replace them to update: `this.Since = new Date(...)`.

The changes are synchronous: once the assignment is done, the DOM shows it. A method of a list (`push`, `splice`, `sort`...) counts as one change, however many items it moves.

## Several changes at once

`this.$Batch(function (state) {...})` makes several changes and updates the template once, at the end. `state` is the state itself:

```js
this.$Batch(function (state) {
	state.Loading = false;
	state.Items = response.Items;
	state.Total = response.Total;
});
```

`this.$Update({Loading: false, Items: items})` sets several fields in one batch; a `$` name there throws `Elemenx component value uses reserved $ namespace`.

## Helpers and computed values

A template expression is computed again when the fields it reads change. A computed value that several places use belongs in a helper, set in `$OnCreate`, that takes the fields as arguments:

```js
$OnCreate: function () {
	this.Visible = function (items, filter) {
		return items.filter(function (item) {
			return !filter || item.Tags.indexOf(filter) !== -1;
		});
	};
}
```

```html
<li *for="item of Visible(Items, Filter)" *key="item.ID">{{item.Title}}</li>
```

A helper only computes: one that assigns a field the template reads makes the template compute it again, without end (`Maximum call stack size exceeded`).

The helper reads `items` and `filter` through the arguments, so the list follows both. A helper that reads `this.Items` inside works too, as long as the template calls it, but naming what it depends on keeps it clear.

## Outside the component

- **Services** are not reactive: a component copies what it shows into its own fields, and the service tells it when to (`OnChange(callback)`), or the component reads the service in a helper whose argument changes.
- **Callbacks** of the network, timers and events of other objects run outside the template: they only assign fields, and the template follows.
- The hooks (`$OnCreate`, `$OnReady`, `$OnDestroy`, `$OnSleep`, `$OnWake`) run untracked: what they read does not tie the component that created them to it.

## Example

The state of this example is an object with a list inside; every button changes it in another way, and the template follows:

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
