# A blog

A blog of posts written in Markdown: the list of the posts, the posts of a tag, a post, and comments under it. The posts are files, so any static hosting serves the blog. The finished project is `examples/Tutorials/Blog`.

What you learn: the router (routes, parameters, links, a page not found), a Service that loads data, the `Markdown` component, the storage of the browser, and the title of the tab.

## 1. The routes

```bash
npx elemenx generate application Blog
```

The Application declares its router: a path of each route and its component. `:tag` and `:id` are parameters; a path no route has shows `NotFound`.

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

The root Component is the frame of every page; `*outlet="Content"` is where the router puts the page of the route:

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

The links are plain `<a href>`: the router takes a click on a link of the page, and the Back and Forward of the browser.

## 2. The data

The posts are files of `data/`, copied into the build as they are: the list in `data/posts.json`, each post in `data/posts/<id>.md`.

```json
[
	{"ID": "grid-in-five-lines", "Title": "A grid in five lines of CSS", "Date": "2026-10-20", "Tags": ["css"], "ReadTime": 3, "Excerpt": "auto-fit and minmax do what a framework of grids did."}
]
```

A Service loads them: one instance for the whole Application, so what it loaded once is there for every page. Its methods take a callback `(error, result)`.

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

`Text(id, callback)` loads a post the same way (see the project).

## 3. The list

`PostList` is the component of two routes: `/` and `/tag/:tag`. The router gives it the parameters of its route as `$Params`, which its template reads; the function `Shown` takes them as an argument, so the list follows the route when the tag changes.

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

A function a template calls is set in `$OnCreate` (`this.Shown = function ...`); the methods of the definition are the handlers of the events.

## 4. A post

The router keeps `PostPage` from one post to another (a link from a post to the next one): the component loads the post of the route when it is ready, and again when a navigation ends on another post.

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

`Markdown` shows the text as HTML with its tables and its highlighted code, and runs nothing of it: a post cannot put a script into the page. `$Title` names the tab of the browser.

## 5. Comments

The comments live in the storage of the browser, under a namespace of their own (a real blog sends them to its server):

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

A new list replaces the old one (`concat`), so the template sees the change. The storage stays out of the state: `Store()` gives it to the methods, and `Add`, the handler of the button, is a method of the definition.

## 6. Build

```bash
npm run build
```

`dist/` holds the pages, the framework and the posts. The router uses the paths of the URL (`/post/grid-in-five-lines`): the server answers every path with `index.html`, as `elemenx serve` does. On a hosting that cannot, the `hash` mode of the router keeps the route after `#` (see [Router](/guide/router)).

## Next

- [An admin panel](/tutorials/admin): guards, tables and forms.
- [Languages](/guide/locale): a blog in several languages.
