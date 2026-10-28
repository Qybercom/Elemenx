<!-- generated -->
# Медиаколлекция

Домашняя коллекция фильмов, музыки и игр: главная страница с избранным тайтлом и полками, страница каждого вида с фильтрами и страница каждого тайтла с его треками или актёрами. Готовый проект — `examples/Tutorials/Collection`.

Чему вы научитесь: медиакомпонентам ElemenxUI (MediaHero, MediaShelf, MediaCard, FacetFilter, TrackList, CastList), параметрам маршрута, фильтрам, которые считают, сколько они оставят, и избранному, общему для всех страниц.

## 1. Маршруты

```js
Elemenx.Application('Collection', {
	$Title: 'Elemenx Collection',
	$Component: 'Layout',
	$Root: 'Collection',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/browse/:kind', Component: 'BrowsePage'},
			{Path: '/title/:id', Component: 'TitlePage'}
		]
	}
});
```

## 2. Тайтлы: один сервис

`Library` хранит тайтлы, каждый — `{ID, Kind, Title, Year, Genres, Score, Poster, Progress}`, а по виду — `Tracks` альбома, `Cast` фильма или игры, `Platforms` игры. Он превращает тайтл в элемент полки и хранит избранное в хранилище браузера:

```js
Item: function (title) {
	return {ID: title.ID, Title: title.Title, Subtitle: title.Year + ' · ' + title.Length, Image: title.Poster, Rating: title.Score, Progress: title.Progress, Tags: title.Genres, Href: '/title/' + title.ID};
},

Favorite: function (id, on) {
	this.Favorites = this.Favorites.filter(function (each) {
		return each !== id;
	}).concat(on ? [id] : []);

	this.Store.Set('favorites', this.Favorites);
}
```

Настоящая коллекция загружает тайтлы с сервера; постеры проекта рисуются в SVG, так что он не загружает ни одной картинки.

## 3. Главная страница: шапка и полки

`MediaHero` — шапка страницы: фон, постер, факты, оценка, жанры и описание, с кнопками воспроизведения и избранного. У начатого тайтла (`Progress` между 0 и 1) видно, сколько уже просмотрено, а кнопка говорит «Продолжить». Каждая `MediaShelf` рисует свои элементы карточками в ряд, который прокручивается вбок; `open` возвращает нажатый элемент, `more` — ссылку на все:

```html
<MediaHero [title]="Featured().Title" Subtitle="Featured film" [image]="Featured().Backdrop" [poster]="Featured().Poster" [facts]="[String(Featured().Year), Featured().Length]" [rating]="Featured().Score" [tags]="Featured().Genres" [description]="Featured().Description" [progress]="Featured().Progress" Favorable="true" [favorite]="Kept(Featured().ID)" (play)="PlayFeatured" (favorite)="KeepFeatured" />
<MediaShelf Title="Continue" [items]="Begun()" Ratio="2:3" Playable="true" (open)="Opened" (play)="Opened" />
<MediaShelf Title="Films" More="See all" [items]="Items('film')" Ratio="2:3" (open)="Opened" (more)="Films" />
<MediaShelf Title="Music" More="See all" [items]="Items('album')" Ratio="1:1" (open)="Opened" (more)="Music" />
<MediaShelf Title="Games" More="See all" [items]="Items('game')" Ratio="16:9" Size="large" (open)="Opened" (more)="Games" />
```

`Ratio` даёт каждому виду форму его картинки: постер, обложка, кадр игры.

## 4. Просмотр с фасетами

`FacetFilter` принимает фасеты и элементы. Фасет без вариантов берёт их из поля элементов (массив жанров считает каждый жанр), а каждый вариант показывает, сколько элементов он оставит при остальных фасетах как есть. `filter` отдаёт оставшиеся элементы:

```js
Facets: function (kind) {
	var facets = [
		{ID: 'genre', Label: 'Genre', Field: 'Genres'},
		{ID: 'year', Label: 'Year', Field: 'Year', Type: 'range', Min: 2000, Max: 2025},
		{ID: 'score', Label: 'Score', Field: 'Score', Type: 'rating', Max: 10}
	];

	if (this.Kind(kind).Kind === 'game')
		facets.splice(1, 0, {ID: 'platform', Label: 'Platform', Field: 'Platforms'});

	return facets;
}
```

```html
<FacetFilter [facets]="Facets($Params.kind)" [items]="Titles($Params.kind)" [value]="Value" (change)="Changed" (filter)="Filtered" />
<div class="collection-grid">
	<MediaCard *for="title of Left" *key="title.ID" [item]="title" [title]="title.Title" [image]="title.Poster" [ratio]="Kind($Params.kind).Ratio" [rating]="title.Score" [href]="'/title/' + title.ID" />
</div>
```

Шаблон передаёт своим методам `$Params.kind` — часть пути, которую называет маршрут: одна и та же страница показывает фильмы, музыку и игры.

## 5. Страница тайтла

Альбом показывает свои треки: нажатие включает трек, нажатие на играющий ставит его на паузу. Фильм или игра показывают своих людей, а в конце каждого тайтла — ещё тайтлы того же жанра:

```html
<TrackList *if="Title($Params.id).Tracks" [items]="Title($Params.id).Tracks" [current]="Current" [playing]="Playing" (play)="Played" (pause)="Paused" />
<CastList *if="Title($Params.id).Cast" Title="Cast" [items]="Title($Params.id).Cast" />
<MediaShelf *if="Like($Params.id).length" Title="More like this" [items]="Like($Params.id)" (open)="Opened" />
```

Треки здесь лишь меняют состояние; по-настоящему их играет сервис Audio из ElemenxUI или `MediaPlayer`.

## 6. Попробуйте

```bash
node elemenx-cli.js dev examples/Tutorials/Collection
```

Откройте «Music», отметьте Jazz, откройте альбом и нажмите его первый трек; добавьте тайтл в избранное сердечком и перезагрузите страницу — он всё ещё в избранном.
