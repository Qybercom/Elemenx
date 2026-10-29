# Templates

A template is HTML with the bindings of Elemenx. Its expressions are JavaScript, read against the fields of the component (its methods, and the helpers it set in `$OnCreate`), and every binding follows the fields it reads: change a field, and exactly the texts, attributes and elements that use it change.

| Syntax | What it does |
| --- | --- |
| `{{Expression}}` | text, in the content of an element or inside an attribute: `title="Hello, {{Name}}"` |
| `[value]="Expression"` | a property of an element (`value`, `checked`, `disabled`, `hidden`...), or a prop of a component |
| `[property.innerHTML]="Html"` | a property of the element by its name (HTML reads it in small letters: the property with that name in any case is found) |
| `[attribute.aria-label]="Label"` | an attribute; `null` or `undefined` removes it |
| `[class]="['card', Kind, Active ? 'active' : '']"` | classes from a list (empty items are skipped), added to the classes written in the tag |
| `[class.selected]="Selected"` | one class, while the value is true |
| `[style]="{'width': Width + 'px', '--accent': Color}"` | styles from an object of CSS names; `null` removes one |
| `[style.width]="Width + 'px'"` | one style; custom properties too: `[style.--size]` |
| `(click)="Method"` | an event: the method gets `(event, element)`; on a component tag, `(data, component)` |
| `(click)="Pick(item, $event)"`, `(click)="Open = !Open"` | an expression run on the event: `$event` is the event (on a component tag, what it told), `$node` the element (the component) |
| `\{{` | a `{{` of the template itself, not an expression |
| `[(value)]="Name"` | two-way, on an `input`, `textarea` or `select`: the field follows what is typed (`input`), and the element follows the field |
| `[(checked)]="Agreed"`, `[(selected)]="Picked"` | two-way, on a check box, a radio, an option (on `change`) |
| `#name` | marks an element for `this.$Ref('name')` (all of them, the rows of a `*for`: `this.$Refs('name')`) |
| `*if`, `*for`, `*key`... | structure: see below and [Directives](/guide/directives) |
| `{{$T('key', params)}}` | a phrase in the language of the page ([Languages](/guide/locale)) |

An expression that names a field that does not exist is quiet (it gives `undefined`); any other error is written to the console with the expression.

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

## Conditions and lists

- `*if="Condition"` builds the element (and the components in it) while the condition is true, and destroys it when it turns false.
- `*for="item of List"` builds the element for every item of a list (or of any iterable); `$index` is its place. `*for="key in Object"` goes over the keys of an object. `*for="i = 0; i < Count; i++"` is a counted loop.
- `*key="item.ID"` names each item, so a list that changes keeps every element with its item: a moved row moves, a new one is built, a removed one goes, and the state of their components stays. Without a key, the elements are reused by their place.
- A host has one structural directive. For a condition around a list, nest them:

```html
<section *if="Visible">
	<Card *for="item of Items" *key="item.ID" [title]="item.Title" />
</section>
```

A collection builds at most 10 000 items: a loop whose condition never ends throws instead of freezing the page.

## Components in a template

A component is a tag of its name: `<Button Label="Save" />`. Plain attributes give texts, bindings give values, `(name)` listens to its events, and markup between its tags goes to its slots. See [Components](/guide/components) for the props.

A component tag may be self-closed (`<Icon Name="save" />`), even when the template is HTML. A `class` written on a component tag stays on the tag of the template, not on the root of the component: style a component through its props, or through a wrapper element.

## Events in lists

The value of an event binding is the name of a method, or an expression run when the event comes. In a list, an expression gives the method the item that was pressed:

```html
<li *for="product of Products" *key="product.ID" [class.selected]="product === Selected">
	<button type="button" (click)="Selected = product">{{product.Title}}</button>
	<button type="button" (click)="Remove(product)">Remove</button>
</li>
```

```js
Remove: function (product) {
	this.Products = this.Products.filter(function (each) {
		return each !== product;
	});
}
```

An assignment goes to the component: `Selected = product` in a row sets the `Selected` of the component, while a name of the row (`product`, `$index`) stays the row's. `$event` is the event and `$node` its element: `(input)="Query = $event.target.value"`. A plain name, `(click)="Remove"`, calls the method with `(event, element)` as always.

## Where a template comes from

A template may be:

- a text in the definition: `$Template: '<p>{{Text}}</p>'`;
- a file next to the script: `$TemplateURL: 'Card.html'` (a production build inlines it);
- a template of the page: `$TemplateID: 'cart'` takes `<template id="cart">` or `<script type="text/html" id="cart">`;
- a function that returns a text, called for every new instance: `$Template: function () { return '...'; }`;
- a template of the registry: `Elemenx.Template('cart', '<ul>...</ul>')` registers one, and `$TemplateID: 'cart'` names it.

`$Template` is the template itself; a name in it (`$Template: '#cart'`) throws `Elemenx $Template is the template itself, not a name: use $TemplateID: 'cart'`.

The browser parses a `<template>` as HTML: it writes the names of its tags in lower case (`<Table>` becomes the `table` of HTML, and the parser moves out of it what a table may not hold), `<TextArea />` takes the rest of the page as its text, `<Card />` holds the tags after it. So the servers and the builds of Elemenx (`elemenx dev`, `elemenx serve`, `elemenx build`, `Server.Create`) send every `<template id>` of a page as a `<script type="text/html" id>`, whose text the browser does not parse: write the templates of a page in `<template id>`, as the files of a project, and they reach Elemenx as they are written. A template that holds a `</script>` stays a `<template>`.

A page that another server sends (PHP, Python, Java...) gets its `<template id>` parsed by the browser. There Elemenx finds the components of an unknown tag in any case, but not the ones named as an element of HTML (`Button`, `Input`, `Select`, `Table`, `TextArea`, `Dialog`...), nor a self-closing tag: write such a template as `<script type="text/html" id>`, or let the server pass its pages through `require('@qybercom/elemenx/tools/templates.js').Page(html)` (Node).

## The registry of templates

| Method | Meaning |
| --- | --- |
| `Elemenx.Template(name)` | the template of a name, or `null` |
| `Elemenx.Template(name, value)` | registers a template |
| `Elemenx.Template.Has(name)`, `Elemenx.Template.Remove(name)` | |
| `Elemenx.Template.Loader(function (name, done) {...})` | a source of templates by name: return the text, or call `done(text)` later |
| `Elemenx.Template.Reload(name, value)` | replaces a template and renders again every instance that uses it; returns how many |

The `<template id>` and `<script type="text/html" id>` elements of the page are registered by their `id` as they appear, including the ones added later. An Application exposes the same registry as `$Template`.

## SVG

A template may hold SVG: its elements keep their namespace, and bindings work on them as on HTML (`[attribute.d]="Path"`, `[attribute.fill]="Color"`).

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

## A long page

`*lazy` builds a part of the page when it comes near the screen or when the browser is idle, so the first screen shows at once. Its value holds the place meanwhile: a height (`*lazy="320"`) or a template of the page (`*lazy="'#skeleton'"`). See [Lazy rendering and cache](/guide/cache).
