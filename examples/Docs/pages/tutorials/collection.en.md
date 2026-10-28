# A media collection

A home collection of films, music and games: a home page with a featured title and shelves, a page for each kind with filters, and a page for each title with its tracks or its cast. The finished project is `examples/Tutorials/Collection`.

What you learn: the media components of ElemenxUI (MediaHero, MediaShelf, MediaCard, FacetFilter, TrackList, CastList), the parameters of a route, filters that count what they would leave, and favorites shared by the pages.

## 1. The routes

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

## 2. The titles: one Service

`Library` holds the titles, each `{ID, Kind, Title, Year, Genres, Score, Poster, Progress}` and, by its kind, the `Tracks` of an album, the `Cast` of a film or a game, the `Platforms` of a game. It turns a title into an item of a shelf, and keeps the favorites in the storage of the browser:

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

A real collection loads its titles from a server; the posters of the project are drawn as SVG, so it fetches no picture.

## 3. The home page: a hero and shelves

`MediaHero` is the head of the page: the backdrop, the poster, the facts, the score, the genres and the story, with the buttons to play and to keep. A title begun (`Progress` between 0 and 1) shows how much of it was seen, and its button says Resume. Each `MediaShelf` draws its items as cards in a row that scrolls across; `open` gives back the item pressed, `more` the link to all of them:

```html
<MediaHero [title]="Featured().Title" Subtitle="Featured film" [image]="Featured().Backdrop" [poster]="Featured().Poster" [facts]="[String(Featured().Year), Featured().Length]" [rating]="Featured().Score" [tags]="Featured().Genres" [description]="Featured().Description" [progress]="Featured().Progress" Favorable="true" [favorite]="Kept(Featured().ID)" (play)="PlayFeatured" (favorite)="KeepFeatured" />
<MediaShelf Title="Continue" [items]="Begun()" Ratio="2:3" Playable="true" (open)="Opened" (play)="Opened" />
<MediaShelf Title="Films" More="See all" [items]="Items('film')" Ratio="2:3" (open)="Opened" (more)="Films" />
<MediaShelf Title="Music" More="See all" [items]="Items('album')" Ratio="1:1" (open)="Opened" (more)="Music" />
<MediaShelf Title="Games" More="See all" [items]="Items('game')" Ratio="16:9" Size="large" (open)="Opened" (more)="Games" />
```

`Ratio` gives each kind the shape of its picture: a poster, a cover, a frame of a game.

## 4. Browsing with facets

`FacetFilter` takes the facets and the items. A facet without options takes them from the field of the items (an array of genres counts each genre), and each option tells how many items it would leave with the other facets as they are. `filter` gives the items left:

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

The template gives its methods `$Params.kind`, the part of the path the route names: the same page shows films, music and games.

## 5. The page of a title

An album lists its tracks: a press plays one, a press on the one playing pauses it. A film or a game lists its people, and every title ends with more of the same genre:

```html
<TrackList *if="Title($Params.id).Tracks" [items]="Title($Params.id).Tracks" [current]="Current" [playing]="Playing" (play)="Played" (pause)="Paused" />
<CastList *if="Title($Params.id).Cast" Title="Cast" [items]="Title($Params.id).Cast" />
<MediaShelf *if="Like($Params.id).length" Title="More like this" [items]="Like($Params.id)" (open)="Opened" />
```

The tracks here only change a state; the Audio Service of ElemenxUI, or a `MediaPlayer`, plays them for real.

## 6. Try it

```bash
node elemenx-cli.js dev examples/Tutorials/Collection
```

Open Music, check Jazz, open an album and press its first track; keep a title with the heart and reload the page: it is still kept.
