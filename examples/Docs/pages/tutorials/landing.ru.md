<!-- generated -->
# Лендинг

Одностраничный сайт продукта: первый экран, возможности, цены и форма регистрации. У него нет маршрутизатора и сервера: `elemenx build --single` собирает его в **один HTML-файл** для любого статического хостинга. Готовый проект — `examples/Tutorials/Landing`.

Чему вы научитесь: приложение и его компоненты, списки через `*for`, компоненты ElemenxUI (Button, PlanPicker, Form, Field, ThemeSwitch, ToastHost), сервис из кода (`Toast`) и сборка для продакшена.

## 1. Проект

```bash
npx elemenx generate application Landing
```

Команда создаёт `app.js`, `index.html`, `elemenx.config.js`, `package.json` и папку исходников `Landing/`. Приложение использует ElemenxUI и монтирует свой корневой компонент `App` в body:

```js
Elemenx.Application('Landing', {
	$Title: 'Notely',
	$Component: 'App',
	$Root: 'Landing',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
```

`npm run dev` запускает его на `http://localhost:4301` и перезагружает при изменении файлов.

## 2. Страница

`App` — каркас: шапка, которая остаётся наверху, секции, подвал и `ToastHost`, где показываются уведомления сервиса `Toast`.

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

Обработчик получает событие и элемент: `Go` прокручивает страницу к секции, на которую указывает ссылка.

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

Каждый компонент — папка со своими `.js`, `.html` и `.css`, перечисленная в `Landing/index.js`; `npx elemenx generate component Hero` создаёт такую.

## 3. Первый экран

Поля компонента — его состояние: `{{Title}}` показывает поле, и его изменение меняет страницу. Кнопки вызывают методы компонента; один из них просит у сервиса `Toast` уведомление.

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

`Suprematism` рисует картинку по своему зерну в цветах темы — заглушка, пока у продукта нет своей.

## 4. Возможности

Список в состоянии и карточка на каждый элемент через `*for`; `*key` сохраняет каждую карточку, когда список меняется.

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

`[name]="item.Icon"` привязывает свойство к выражению; `Size="28"` — литерал.

## 5. Цены

`PlanPicker` рисует тарифы, переключает месячные и годовые цены и сообщает выбранный тариф:

```html
<section id="pricing" class="elemenx-column" style="gap: 24px;">
	<h2 class="elemenx-title">Simple prices</h2>
	<PlanPicker [plans]="Plans" [value]="Plan" [period]="Period" Periods="true" Discount="2 months free" Currency="EUR" (change)="Chosen" (period)="Switched" />
</section>
```

Выбор хранит компонент: пикер показывает то, что ему дали, а его события просят изменить это.

```js
Chosen: function (detail) {
	this.Plan = detail.ID;
	this.$Service('Toast').Show({Message: 'A good choice: the ' + detail.ID + ' plan.', Variant: 'success'});
},

Switched: function (detail) {
	this.Period = detail.Period;
}
```

## 6. Форма

`Form` проверяет свои `Field`: `Required`, `Email` и другие — правила поля, их ошибки показываются, когда поле покинуто или форма отправлена, а `submit` приходит, только когда всё верно, со значениями по их `Name`.

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

Настоящая страница отправила бы здесь `event.Value` на свой сервер: `this.$Network().XHR(...)` (см. [XHR](/network/xhr)).

## 7. Один файл

```bash
npm run build
```

В `elemenx.config.js` проекта стоит `Single: true` (как делает `elemenx build --single`): `dist/index.html` содержит фреймворк, ElemenxUI, компоненты и их стили и работает с любого статического хостинга или прямо с диска. `npm run serve` отдаёт его так, как это сделал бы продакшен-сервер.

Совсем без сборки страница может взять Elemenx с CDN и описать компоненты прямо в себе (см. [Elemenx на страницах сервера](/tutorials/backend)); проект из папок проще растить.

## Дальше

- [Блог](/tutorials/blog): страницы, маршруты и Markdown.
- [Темы](/guide/theming): цвета и формы ElemenxUI.
- [Сборки](/guide/build): PWA, нативные программы, виджеты.
