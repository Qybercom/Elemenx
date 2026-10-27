# A landing page

A one-page site for a product: a hero, its features, its prices and a form to sign up. It has no router and no server: `elemenx build --single` makes it **one HTML file** for any static hosting. The finished project is `examples/Tutorials/Landing`.

What you learn: an Application and its Components, lists with `*for`, the components of ElemenxUI (Button, PlanPicker, Form, Field, ThemeSwitch, ToastHost), a Service from code (`Toast`), and a build for production.

## 1. The project

```bash
npx elemenx generate application Landing
```

It makes `app.js`, `index.html`, `elemenx.config.js`, `package.json` and the folder of the sources, `Landing/`. The Application uses ElemenxUI and mounts its root Component, `App`, into the body:

```js
Elemenx.Application('Landing', {
	$Title: 'Notely',
	$Component: 'App',
	$Root: 'Landing',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
```

`npm run dev` starts it at `http://localhost:4301` and reloads it as the files change.

## 2. The page

`App` is the frame: a header that stays on top, the sections, a footer, and a `ToastHost` where the toasts of the `Toast` Service show.

```html
<div class="elemenx-screen landing">
	<header class="landing-header">
		<strong class="landing-logo">Notely</strong>
		<nav class="landing-nav">
			<a class="elemenx-link" href="#features" data-target="features" (click)="Go">Features</a>
			<a class="elemenx-link" href="#pricing" data-target="pricing" (click)="Go">Pricing</a>
			<a class="elemenx-link" href="#signup" data-target="signup" (click)="Go">Sign up</a>
		</nav>
		<ThemeSwitch Compact="true" />
	</header>
	<main class="landing-main">
		<Hero />
		<Features />
		<Pricing />
		<Signup />
	</main>
	<footer class="landing-footer elemenx-text small muted">© 2026 Notely · Made with Elemenx</footer>
	<ToastHost />
</div>
```

A handler gets the event and the element: `Go` scrolls to the section the link names.

```js
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',

	Go: function (event, node) {
		var target = document.getElementById(node.getAttribute('data-target'));

		event.preventDefault();

		if (target)
			target.scrollIntoView({behavior: 'smooth'});
	}
});
```

Each Component is a folder with its `.js`, `.html` and `.css`, listed in `Landing/index.js`; `npx elemenx generate component Hero` makes one.

## 3. The hero

Its fields are its state: `{{Title}}` shows one, and a change of it changes the page. Its buttons call its methods; one of them asks the `Toast` Service for a toast.

```js
Elemenx.Component('Hero', {
	$TemplateURL: 'Hero.html',
	$StyleURL: 'Hero.css',
	Title: 'Notes that think with you',
	Text: 'Notely links your notes, finds what you forgot and works without the network.',

	Start: function () {
		document.getElementById('signup').scrollIntoView({behavior: 'smooth'});
	},

	Tour: function () {
		this.$Service('Toast').Show({Title: 'A tour is on its way', Message: 'Sign up and we send you the video.', Variant: 'info'});
	}
});
```

```html
<section class="hero">
	<div class="hero-text">
		<span class="elemenx-eyebrow">New · version 2</span>
		<h1 class="elemenx-title hero-title">{{Title}}</h1>
		<p class="elemenx-text large muted">{{Text}}</p>
		<div class="elemenx-container wrappable hero-actions">
			<Button Label="Start free" Variant="primary" Size="large" (click)="Start" />
			<Button Label="Watch the tour" Icon="play" Variant="ghost" Size="large" (click)="Tour" />
		</div>
	</div>
	<Suprematism Seed="Notely" Width="420" Height="320" Palette="theme" Title="A composition" />
</section>
```

`Suprematism` draws a picture of its seed in the colors of the theme: a placeholder until the product has its own.

## 4. The features

A list in the state, a card for each item with `*for`; `*key` keeps each card when the list changes.

```html
<section id="features" class="elemenx-column" style="gap: 24px;">
	<h2 class="elemenx-title">Everything a note needs</h2>
	<div class="elemenx-container grid" style="gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
		<article class="elemenx-card" *for="item of Items" *key="item.Title">
			<div class="elemenx-card-body">
				<Icon [name]="item.Icon" Size="28" />
				<h3 class="elemenx-card-title">{{item.Title}}</h3>
				<p class="elemenx-card-text">{{item.Text}}</p>
			</div>
		</article>
	</div>
</section>
```

`[name]="item.Icon"` binds a prop to an expression; `Size="28"` is a literal.

## 5. The prices

`PlanPicker` draws the plans, switches the monthly and the yearly prices, and tells the plan chosen:

```html
<section id="pricing" class="elemenx-column" style="gap: 24px;">
	<h2 class="elemenx-title">Simple prices</h2>
	<PlanPicker [plans]="Plans" [value]="Plan" [period]="Period" Periods="true" Discount="2 months free" Currency="EUR" (change)="Chosen" (period)="Switched" />
</section>
```

The Component keeps what was chosen: the picker shows what it is given, and its events ask for a change.

```js
Chosen: function (detail) {
	this.Plan = detail.ID;
	this.$Service('Toast').Show({Message: 'A good choice: the ' + detail.ID + ' plan.', Variant: 'success'});
},

Switched: function (detail) {
	this.Period = detail.Period;
}
```

## 6. The form

`Form` checks its `Field`s: `Required`, `Email` and the others are the rules of a field, their errors show once a field is left or the form is sent, and `submit` comes only when everything is valid, with the values by their `Name`.

```html
<Form *if="!Sent" Label="Sign up" (submit)="Submitted">
	<Field Label="Email" Name="email" Required="true" Email="true"><Input Type="email" Placeholder="ada@example.com" /></Field>
	<Field Label="Plan" Name="plan" Value="pro"><Select [options]="Plans" /></Field>
	<Field Name="terms" Required="true"><Checkbox Label="I accept the terms" /></Field>
	<Button Type="submit" Label="Create my account" Variant="primary" />
</Form>
```

```js
Submitted: function (event) {
	this.Sent = true;
	this.$Service('Toast').Show({Title: 'Welcome!', Message: 'We sent a link to ' + event.Value.email + '.', Variant: 'success'});
}
```

A real page would send `event.Value` to its server here: `this.$Network().XHR(...)` (see [XHR](/network/xhr)).

## 7. One file

```bash
npm run build
```

The `elemenx.config.js` of the project has `Single: true` (as `elemenx build --single` does): `dist/index.html` holds the framework, ElemenxUI, the Components and their styles, and runs from any static hosting or from the disk. `npm run serve` serves it as a production server would.

Without a build at all, a page can take Elemenx from a CDN and define its Components inline (see [Elemenx on the pages of a server](/tutorials/backend)); a project of folders is easier to grow.

## Next

- [A blog](/tutorials/blog): pages, routes and Markdown.
- [Themes](/guide/theming): the colors and the shapes of ElemenxUI.
- [Builds](/guide/build): a PWA, native programs, widgets.
