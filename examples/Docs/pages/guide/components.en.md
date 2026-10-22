# Components

A component is a template with its state, its props and its methods. Its fields are its state and its props at once: a parent sets them by the attributes of its tag, the component changes them itself, and the template follows every change.

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

## The definition

| Key | Meaning |
| --- | --- |
| `$Template` | the template: a text, `'#name'` (a template of the registry or a `<template id>` / `<script type="text/html" id>` of the page), or a function that returns a text (called for every instance) |
| `$TemplateURL` | a file of the template, relative to the script of the definition |
| `$Style` | its CSS as a text |
| `$StyleURL` | a file of its CSS; the stylesheet of a component is placed once, when its first instance renders |
| `$Title` | the title of the document while it renders (a page of the router) |
| `$KeepAlive` | `true` or `false`: whether it sleeps instead of going (see [Lazy rendering and cache](/guide/cache)) |
| `$OnCreate(data)`, `$OnReady()`, `$OnDestroy()`, `$OnSleep()`, `$OnWake()` | its life (see [Lifecycle](/guide/lifecycle)) |
| `$OnChildPending(child)`, `$OnChildReady(child)`, `$OnChildError(child)` | the components inside it that load later |
| `$OnRouteLeave(context)` | a page of the router asked whether it may be left (see [Guards](/guide/guards)) |
| `$Events` and `$OnEvent`, `$Messaging` and `$OnMessage` | the channels it listens to ([events](/data/events), [messages](/data/messaging)) |
| a field | a value: its first value, for every instance |
| a function | a method: an event of the template calls it, the code calls `this.Method()` |

A component is declared once. A template that names it finds it when the template is compiled: declared already, or in the graph of the Application, which loads it then (see [Applications](/guide/applications)). A tag of a name that is neither stays a plain element.

## Props

A tag passes props to a component by its attributes:

- a plain attribute is a text: `Label="Votes"`; `""` and `"true"` give `true`, `"false"` gives `false`, `"null"` gives `null`, `"{{expression}}"` gives the value of the expression;
- a binding is the value of an expression of the parent, and follows it: `[items]="Products"`, `[disabled]="!Valid"`;
- a binding may reach into an object: `[options.size]="Size"`, `[columns.0.title]="'Name'"`;
- the names do not care about case, and a kebab-case name is read in camelCase: `[page-size]`, `[pagesize]` and `[PageSize]` set `PageSize`.

Numbers in plain attributes stay texts (`Step="5"` is `'5'`): use `[step]="5"`, or `Number(this.Step)` in the component.

A prop flows down: when the parent's value changes, the child gets the new one. A component may change its own copy (an open menu, a typed text); the next change of the parent's value replaces it. A parent that must know about a change listens to an event.

## Events

`this.$Emit(name, data)` calls the listeners of its tag: `(change)="Counted"` calls the method `Counted` of the parent with `(data, component)`. An event of an element of the template (`(click)`, `(input)`, `(keydown)`) calls a method with `(event, element)`. The value of an event binding is the name of a method, nothing else.

Every `change` also goes up the DOM from the root of the component as the event `elemenx-change`, with the value in its `detail`: a form or any element around it hears every value that changes inside it.

`this.$On(name, callback)` listens to the component's own events in code.

## Slots

The markup between the tags of a component goes to its slots: `<slot>` in its template takes what has no `slot` attribute, `<slot name="footer">` what has `slot="footer"`. Projected markup belongs to the parent: its bindings and events use the state of the parent.

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

## What a template sees

A template sees the fields of its component, the helpers the component sets on itself in `$OnCreate` (`this.Format = function (value) {...}`), `$T` for phrases, the values of the route (`$Params`, `$Query`, `$Hash`, `$Path`) and the globals of the page. It does not see the methods: they are for events and for code. Put what a template computes in a helper:

```js
Elemenx.Component('Price', {
	$Template: '<span>{{Money(Value)}}</span>',
	Value: 0,

	$OnCreate: function () {
		this.Money = function (value) {
			return Number(value).toFixed(2) + ' €';
		};
	}
});
```

A helper reads its arguments, not `this`: pass it the fields it needs, so the template follows them.

## The instance

| Member | Meaning |
| --- | --- |
| `$Element()` | the root element |
| `$Ref(name)` | the element marked `#name` in the template |
| `$Emit(name, data)`, `$On(name, callback)` | its events |
| `$Parent()` | the component whose template holds it |
| `$Application()` | its Application |
| `$Service(name)` | a service of its Application |
| `$Router()` | the router of its Application: `Go`, `Replace`, `Back`, `Forward`, `On`, `Current` |
| `$Batch(function (state) {...})` | several changes, one update (see [State and reactivity](/guide/reactivity)) |
| `$Update(values)` | sets several fields at once |
| `$Title(text)` | the title of the document |
| `$Network(context)`, `$Storage(context)`, `$Events()`, `$Messaging(context)`, `$WebWorker(...)`, `$ServiceWorker(...)` | resources that belong to it and end with it |
| `$Generation()`, `$StartedAt()` | the version of its definition (it grows on a reload), when it was created |
| `$Destroy()` | destroys it |

## A component from code

`Elemenx.Component(name)` returns a factory: `factory(data, slots, options)` makes an instance whose `$Element()` goes anywhere in the page. `options.Application` gives it an Application, so the components of its library and its services resolve.

```js
var card = Elemenx.Component('ProductCard')({Title: 'Lamp', Price: 39}, null, {Application: this.$Application()});

document.querySelector('#aside').appendChild(card.$Element());

/* Later: */
card.$Destroy();
```

## Example

A list and its items: the items are a component with props, an event and a slot.

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
