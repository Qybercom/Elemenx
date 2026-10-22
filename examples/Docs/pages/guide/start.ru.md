<!-- generated -->
# Начало работы

Elemenx — фреймворк для приложений в браузере. Это один файл, `elemenx.js`, написанный на ES5 без зависимостей: компоненты с реактивным состоянием и шаблонами, маршрутизатор, сервисы, сетевой слой (запросы, потоки, сокеты, WebRTC, передачи), хранилище, обмен сообщениями между вкладками, фреймами и воркерами, языки. Его библиотека, ElemenxUI, приносит около 130 компонентов, 36 сервисов и 13 директив с темами. Командная строка создаёт проекты, обслуживает их во время разработки и собирает в сайт, один файл, виджет, расширение браузера или нативные программы.

Через всё проходят несколько правил:

- **Имена.** Компоненты, сервисы, охранники и члены их определений пишутся в PascalCase: `Elemenx.Component('UserCard', {Name: '', Save: function () {...}})`. Все имена, начинающиеся с `$`, принадлежат Elemenx: `$Template`, `$OnCreate`, `this.$Emit(...)`.
- **Без Promise.** То, что занимает время, сообщает о результате через обратные вызовы `(error, result)` или события. Код приложения остаётся простым ES5 и работает в любом браузере.
- **Состояние — простые данные.** Поле компонента — его состояние: присвойте его, добавьте элемент в его список — и шаблон последует. Объявлять ничего не нужно.

## Страница с фреймворком

Без сборки и без шага на сервере страница может загрузить фреймворк и ElemenxUI из файлов дистрибутива (их делает `npm run dist`; `elemenx.all.min.js` содержит и то, и другое):

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<script src="elemenx.all.min.js"></script>
</head>
<body>
	<div id="app"></div>
	<script>
		Elemenx.Component('Hello', {
			$Template: '<h1>Hello, {{Name}}</h1><Button Label="Again" Variant="primary" (click)="Again" />',
			Name: 'world',

			Again: function () {
				this.Name = this.Name + '!';
			}
		});

		Elemenx.Application('HelloApp', {$Use: ['ElemenxUI'], $Component: 'Hello', $Mount: '#app'});
	</script>
</body>
</html>
```

Тот же компонент работает здесь; его код — под ним, как в каждом примере этой справки:

```example
<h3>Hello, {{Name}}</h3>
<Button Label="Again" Variant="primary" (click)="Again" />
<script>
({
	Name: 'world',

	Again: function () {
		this.Name = this.Name + '!';
	}
})
</script>
```

## Проект

Проект держит каждый компонент в своих файлах, которые страница загружает, когда шаблон впервые называет компонент. Пакет `@qybercom/elemenx` содержит фреймворк, ElemenxUI и командную строку:

```bash
npm install @qybercom/elemenx
npx elemenx generate application Shop
npx elemenx dev
```

`generate application` создаёт проект: `index.html`, `app.js` (объявление приложения), `elemenx.config.js`, `package.json` и папку исходников `Shop/` с её графом: `Shop/index.js` перечисляет файлы и папки исходников, и корневой компонент `App` (`Shop/App/App.js` и `App.html`). `elemenx dev` обслуживает его на `http://127.0.0.1:4173` как есть, с фреймворком из пакета: перезагрузка страницы показывает каждое изменение.

Разросшийся проект может выглядеть так (папки выбираете вы: `index.js` в папке перечисляет её содержимое):

```text
Shop/
├── index.html
├── app.js
├── elemenx.config.js
├── package.json
└── Shop/
    ├── index.js              ['components', 'services']
    ├── components/
    │   ├── index.js          ['Layout/Layout.js', 'HomePage/HomePage.js']
    │   ├── Layout/
    │   │   ├── Layout.js
    │   │   ├── Layout.html
    │   │   └── Layout.css
    │   └── HomePage/...
    └── services/
        ├── index.js          ['Cart.js']
        └── Cart.js
```

```js
/* app.js */
Elemenx.Application('Shop', {
	$Title: 'Shop',
	$Root: 'Shop',
	$Component: 'Layout',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/product/:id', Component: 'ProductPage'}
		]
	}
});
```

```js
/* Shop/components/HomePage/HomePage.js */
Elemenx.Component('HomePage', {
	$TemplateURL: 'HomePage.html',
	$StyleURL: 'HomePage.css',
	Products: [],

	$OnReady: function () {
		var self = this;

		this.$Network().XHR({URL: '/api/products', ResponseType: 'json'})
			.On('Transport.Success', function (event) {
				self.Products = event.Data.Response;
			})
			.Execute();
	}
});
```

Новые части тоже создаёт командная строка: `npx elemenx g component components/ProductPage`, `npx elemenx g service services/Cart`, `npx elemenx g guard SignedIn`, `npx elemenx g directive Tooltip` записывают свои файлы под корнем исходников и добавляют их в ближайший `index.js` (см. [CLI](/guide/cli)).

`npx elemenx build` собирает сайт в `dist/`: шаблоны и стили встроены, взяты только компоненты и части фреймворка, которые использует приложение. Об одном файле, виджетах, расширениях и нативных программах — в [Сборках](/guide/build).

## Что читать дальше

1. [Приложения](/guide/applications), [Компоненты](/guide/components) и [Шаблоны](/guide/templates): основа каждой страницы.
2. [Состояние и реактивность](/guide/reactivity) и [Жизненный цикл](/guide/lifecycle): как страница следует за данными и когда выполняется код.
3. [Директивы](/guide/directives), [Сервисы](/guide/services), [Маршрутизатор](/guide/router) и его [охранники](/guide/guards).
4. [Сеть](/network/overview) и [Данные и обмен](/data/storage): связь с серверами, хранение данных, другие вкладки и воркеры.
5. [ElemenxUI](/guide/library), [Темы](/guide/theming) и страницы каждого компонента, сервиса и директивы в разделах ниже.
