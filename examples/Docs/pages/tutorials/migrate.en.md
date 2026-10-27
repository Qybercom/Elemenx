# For those who know Vue, React or Angular

The ideas are the same: components with state, templates that follow it, services, a router. This page puts the words of Elemenx next to the ones you know, then shows one component written four ways.

## The same component

A counter with a step, its total shown, a reset that the parent hears.

```js
Elemenx.Component('Counter', {
	$Template: '<div><button (click)="Add">+{{Step}}</button> <b>{{Count}}</b> <button (click)="Reset">Reset</button></div>',
	Step: 1,
	Count: 0,

	Add: function () {
		this.Count += Number(this.Step);
	},

	Reset: function () {
		this.Count = 0;
		this.$Emit('reset', null);
	}
});
```

```html
<Counter Step="5" (reset)="Cleared" />
```

The fields of the definition are its state and its props at once: a parent sets them by attributes (`Step="5"`) or bindings (`[step]="Size"`), and a change of a field renders what reads it. There is no `setState`, no `ref()`, no signal to call: `this.Count += 1` is the change.

## Words

| Vue | React | Angular | Elemenx |
| --- | --- | --- | --- |
| `data()`, `props` | `useState`, props | fields, `@Input()` | the fields of the definition |
| `{{ value }}` | `{value}` | `{{ value }}` | `{{Value}}` |
| `:title="x"` | `title={x}` | `[title]="x"` | `[title]="X"` |
| `@click="go"` | `onClick={go}` | `(click)="go()"` | `(click)="Go"` |
| `v-model="name"` | `value` and `onChange` | `[(ngModel)]="name"` | `[(value)]="Name"` on a native field; `[value]` and `(change)` on a component |
| `v-if` / `v-for` | `&&` / `.map()` | `*ngIf` / `*ngFor` | `*if` / `*for` (with `*key`) |
| `ref="box"` | `useRef` | `#box`, `@ViewChild` | `#Box` and `this.$Ref('Box')` |
| `$emit('reset')` | a callback prop | `@Output()` | `this.$Emit('reset', data)` |
| `computed` | `useMemo` | a getter, `computed()` | a function the template calls with what it reads: `{{Total(Items)}}` |
| `mounted` | `useEffect(..., [])` | `ngOnInit`, `ngAfterViewInit` | `$OnCreate` (before the first rendering), `$OnReady` (rendered) |
| `unmounted` | the cleanup of `useEffect` | `ngOnDestroy` | `$OnDestroy` |
| `provide` / `inject`, Pinia | context, a store | services, DI | `Elemenx.Service` and `this.$Service('Name')`: one per Application |
| Vue Router | React Router | the Router | `$Router` of the Application, `*outlet`, guards |
| `<slot>` | `children` | `<ng-content>` | `<slot>` and `slot="name"` |
| `<style scoped>` | CSS modules | the styles of a component | `$StyleURL`, `$Style`, or a shadow root |

## What is different

- **No build is needed.** A page with one `<script>` runs Elemenx; the CLI adds a development server, generators and a build when the project grows. The code is ES5 that every browser runs as it is.
- **A function of a template is a method.** `Total: function (items) {...}` in the definition, and `{{Total(Items)}}` in the template: the template passes what it reads, so it follows it. The handlers of the events are methods too (or functions `$OnCreate` sets).
- **No Promise in the API.** A Service or a request answers with a callback `(error, result)` or with events; a guard waits with `this.$Wait(function (done) {...})`.
- **The Library is part of it.** ElemenxUI (`$Use: ['ElemenxUI']`) has the components of an application, from a button to a calendar, a code editor and a game world, with themes, languages and the keys of a keyboard and a gamepad.
- **One file of a framework.** `elemenx.js` holds the router, the network (XHR, WebSocket, SSE, WebRTC...), the storage, the messaging between tabs and workers, and the service worker of a PWA; a build leaves out what the Application does not use.

## Start

- [Getting started](/guide/start), then [Components](/guide/components) and [Templates](/guide/templates).
- A first project: [a landing page](/tutorials/landing), or [a blog](/tutorials/blog) with a router.
