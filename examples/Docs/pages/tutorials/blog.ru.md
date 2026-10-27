<!-- generated -->
# Блог

Блог с постами в Markdown: список постов, посты одного тега, пост и комментарии под ним. Посты — это файлы, поэтому блог может отдавать любой статический хостинг. Готовый проект — `examples/Tutorials/Blog`.

Чему вы научитесь: маршрутизатор (маршруты, параметры, ссылки, страница «не найдено»), сервис, который загружает данные, компонент `Markdown`, хранилище браузера и заголовок вкладки.

## 1. Маршруты

```bash
npx elemenx generate application Blog
```

Приложение описывает свой маршрутизатор: путь каждого маршрута и его компонент. `:tag` и `:id` — параметры; путь, которого нет ни у одного маршрута, показывает `NotFound`.

```js
Elemenx.Application('Blog', {
	$Title: 'Field notes',
	$Component: 'Layout',
	$Root: 'Blog',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		NotFound: 'NotFound',
		Routes: [
			{Path: '/', Component: 'PostList'},
			{Path: '/tag/:tag', Component: 'PostList'},
			{Path: '/post/:id', Component: 'PostPage'}
		]
	}
});
```

Корневой компонент — каркас каждой страницы; `*outlet="Content"` — место, куда маршрутизатор ставит страницу маршрута:

```html
<div class="elemenx-screen blog">
	<header class="blog-header">
		<a class="blog-name" href="/">Field notes</a>
		<span class="elemenx-text muted">A blog of small experiments</span>
		<span class="elemenx-spacer"></span>
		<ThemeSwitch Compact="true" />
	</header>
	<main class="blog-main" *outlet="Content"></main>
</div>
```

Ссылки — обычные `<a href>`: маршрутизатор перехватывает щелчок по ссылке страницы, а также «Назад» и «Вперёд» браузера.

## 2. Данные

Посты — файлы в `data/`, которые попадают в сборку как есть: список в `data/posts.json`, каждый пост в `data/posts/<id>.md`.

```json
[
	{"ID": "grid-in-five-lines", "Title": "A grid in five lines of CSS", "Date": "2026-10-20", "Tags": ["css"], "ReadTime": 3, "Excerpt": "auto-fit and minmax do what a framework of grids did."}
]
```

Их загружает сервис: один экземпляр на всё приложение, поэтому то, что он загрузил однажды, доступно каждой странице. Его методы принимают колбэк `(error, result)`.

```js
Elemenx.Service('Posts', {
	$OnCreate: function () {
		this.Loaded = null;
		this.Texts = {};
	},

	/* A file of data/ as a text. */
	Load: function (url, callback) {
		var request = this.$Network().XHR({URL: url, ResponseType: 'text'});

		request.On('Transport.Success', function (event) {
			if (event.Data.Status === 200) callback(null, event.Data.Response);
			else callback(new Error('Not found: ' + url));
		});

		request.On('Transport.Error', function () {
			callback(new Error('The network failed: ' + url));
		});

		request.Execute();
	},

	List: function (callback) {
		var self = this;

		if (this.Loaded) {
			callback(null, this.Loaded);

			return;
		}

		this.Load('/data/posts.json', function (error, text) {
			if (error) {
				callback(error);

				return;
			}

			self.Loaded = JSON.parse(text);

			callback(null, self.Loaded);
		});
	}
});
```

`Text(id, callback)` так же загружает пост (см. проект).

## 3. Список

`PostList` — компонент двух маршрутов: `/` и `/tag/:tag`. Маршрутизатор даёт ему параметры маршрута в `$Params`, которые читает шаблон; функция `Shown` получает их аргументом, поэтому список следует за маршрутом, когда меняется тег.

```js
Elemenx.Component('PostList', {
	$TemplateURL: 'PostList.html',
	$Title: 'Field notes',
	Posts: [],
	Loading: true,
	Failed: '',

	$OnCreate: function () {
		var self = this;

		this.Shown = function (posts, params) {
			return posts.filter(function (post) {
				return !params.tag || post.Tags.indexOf(params.tag) !== -1;
			});
		};

		this.$Service('Posts').List(function (error, posts) {
			self.Loading = false;
			self.Failed = error ? error.message : '';
			self.Posts = posts || [];
		});
	}
});
```

```html
<h1 class="elemenx-title" style="margin: 0;">{{$Params.tag ? '#' + $Params.tag : 'All posts'}}</h1>
<Spinner *if="Loading" />
<div class="elemenx-callout danger" *if="Failed">{{Failed}}</div>
<PostCard *for="post of Shown(Posts, $Params)" *key="post.ID" Layout="horizontal" [title]="post.Title" [excerpt]="post.Excerpt" [tags]="post.Tags" [date]="post.Date" [readTime]="post.ReadTime" [href]="'/post/' + post.ID" />
```

Функция, которую вызывает шаблон, — метод или хелпер, заданный в `$OnCreate` (`this.Shown = function ...`), как здесь; обработчики событий находятся теми же двумя путями.

## 4. Пост

Маршрутизатор сохраняет `PostPage` при переходе от одного поста к другому (ссылка из поста на следующий): компонент загружает пост маршрута, когда он готов, и снова, когда навигация заканчивается на другом посте.

```js
Elemenx.Component('PostPage', {
	$TemplateURL: 'PostPage.html',
	ID: '',
	Text: '',
	Failed: '',

	$OnReady: function () {
		var self = this;

		this.Open();

		this.$Router().On('NavigationEnd', function () {
			if (self.$Params.id !== self.ID)
				self.Open();
		});
	},

	Open: function () {
		var self = this;
		var id = this.$Params.id;

		this.ID = id;
		this.Text = '';
		this.Failed = '';

		this.$Service('Posts').Text(id, function (error, text) {
			if (id !== self.ID) return;

			if (error) {
				self.Failed = 'This post does not exist.';

				return;
			}

			self.Text = text;
			self.$Title((/^# (.+)$/m.exec(text) || ['', id])[1] + ' · Field notes');
		});
	}
});
```

```html
<article class="elemenx-column" style="gap: 24px;">
	<a class="elemenx-link" href="/">← All posts</a>
	<div class="elemenx-callout danger" *if="Failed">{{Failed}}</div>
	<Skeleton *if="!Text && !Failed" Lines="6" />
	<Markdown *if="Text" [value]="Text" />
	<Comments *if="Text" [post]="ID" />
</article>
```

`Markdown` показывает текст как HTML с таблицами и подсвеченным кодом и ничего из него не выполняет: пост не может вставить скрипт в страницу. `$Title` задаёт заголовок вкладки браузера.

## 5. Комментарии

Комментарии живут в хранилище браузера, в собственном пространстве имён (настоящий блог отправлял бы их на свой сервер):

```js
$OnCreate: function () {
	var store = this.$Storage.Local.Namespace('blog-comments');

	this.Store = function () {
		return store;
	};

	this.Items = store.Get(this.Post) || [];
},

Add: function () {
	var text = this.Draft.trim();

	if (!text) return;

	this.Items = this.Items.concat([{ID: Date.now(), Author: 'You', Text: text, Time: new Date().toISOString()}]);
	this.Draft = '';

	this.Store().Set(this.Post, this.Items);
}
```

Новый список заменяет старый (`concat`), поэтому шаблон видит изменение. Хранилище остаётся вне состояния: `Store()` отдаёт его методам, а `Add`, обработчик кнопки, — метод определения.

## 6. Сборка

```bash
npm run build
```

В `dist/` — страницы, фреймворк и посты. Маршрутизатор использует пути URL (`/post/grid-in-five-lines`): сервер отвечает на любой путь `index.html`, как это делает `elemenx serve`. На хостинге, который так не умеет, режим `hash` маршрутизатора держит маршрут после `#` (см. [Маршрутизатор](/guide/router)).

## Дальше

- [Админка](/tutorials/admin): охранники, таблицы и формы.
- [Языки](/guide/locale): блог на нескольких языках.
