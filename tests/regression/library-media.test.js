import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('MediaHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function key (target, name) {
	target.dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true, cancelable: true}));
}

var Films = [
	{ID: 'north', Title: 'North', Genres: ['Drama', 'Mystery'], Year: 2019, Score: 8.1, Subtitles: true},
	{ID: 'harbor', Title: 'Harbor', Genres: ['Drama'], Year: 2021, Score: 6.4, Subtitles: false},
	{ID: 'ember', Title: 'Ember', Genres: ['Comedy'], Year: 2024, Score: 7.2, Subtitles: true},
	{ID: 'tide', Title: 'Tide', Genres: ['Mystery', 'Comedy'], Year: 2015, Score: 4.9, Subtitles: true}
];

/* The Components of a media collection: MediaCard, MediaShelf, FacetFilter, MediaHero, TrackList and CastList. */
describe('Contract: the media collection of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['MediaCard', 'MediaShelf', 'FacetFilter', 'MediaHero', 'TrackList', 'CastList']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('MediaCard shows its poster, score, progress and kind, and opens, plays and keeps it', async function () {
		var events = [];
		var host = mount('<div><MediaCard [item]="Film" Title="North" Subtitle="2019" Kind="Film" Rating="8.1" Progress="0.25" Playable="true" Favorable="true" [tags]="[\'Drama\', \'Mystery\']" (open)="Opened" (play)="Played" (favorite)="Kept" /><MediaCard Title="Cover" Ratio="1:1" Rating="3.5" Max="5" /></div>', {
			Film: Films[0],
			Opened: function (item) {
				events.push('open ' + item.ID);
			},
			Played: function (item) {
				events.push('play ' + item.ID);
			},
			Kept: function (value) {
				events.push('favorite ' + value.Favorite);
			}
		});
		var cards = host.$Element().querySelectorAll('.elemenx-media-card');
		var card = cards[0];

		expect(card.getAttribute('aria-label')).toBe('North, 2019');
		expect(card.querySelector('.elemenx-media-card-kind').textContent).toBe('Film');
		expect(card.querySelector('.elemenx-media-card-score').textContent).toBe('8.1');
		expect(card.querySelector('.elemenx-media-card-score').classList.contains('high')).toBe(true);
		expect(card.querySelector('.elemenx-media-card-progress').getAttribute('aria-valuenow')).toBe('25');
		expect(card.querySelector('.elemenx-media-card-progress span').style.width).toBe('25%');
		expect(card.querySelector('.elemenx-media-card-tags').textContent).toBe('Drama · Mystery');
		expect(card.querySelector('.elemenx-media-card-blank').textContent).toBe('N');
		expect(card.querySelector('.elemenx-media-card-poster').getAttribute('style')).toContain('aspect-ratio: 2 / 3');

		/* Out of 5: stars, not a number. */
		expect(cards[1].querySelector('.elemenx-media-card-score')).toBe(null);
		expect(cards[1].querySelector('.elemenx-rating')).not.toBe(null);

		card.click();
		card.querySelector('.elemenx-media-card-play').click();
		card.querySelector('.elemenx-media-card-favorite').click();

		key(card, 'Enter');

		await tick();

		expect(events).toEqual(['open north', 'play north', 'favorite true', 'open north']);
		expect(card.querySelector('.elemenx-media-card-favorite').getAttribute('aria-pressed')).toBe('true');
	});

	it('MediaShelf draws its items as cards, gives back the item pressed, turns by its arrows and goes from card to card by the keys', async function () {
		var events = [];
		var host = mount('<div style="width: 360px"><MediaShelf Title="Films" More="See all" [items]="Items" (open)="Opened" (more)="Wanted" /></div>', {
			Items: Films.concat(Films.map(function (film) {
				return Object.assign({}, film, {ID: film.ID + '-2'});
			})),
			Opened: function (item) {
				events.push(item);
			},
			Wanted: function () {
				events.push('more');
			}
		});
		var root = host.$Element();
		var cards;
		var arrows;
		var track;

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-media-card').length === 8;
		});

		cards = root.querySelectorAll('.elemenx-media-card');
		track = root.querySelector('.elemenx-media-shelf-track');
		arrows = root.querySelectorAll('.elemenx-media-shelf-arrows button');

		expect(root.querySelector('.elemenx-media-shelf-title').textContent).toBe('Films');

		/* At the start: back is off, forward on. */
		await waitFor(function () {
			return arrows[0].disabled && !arrows[1].disabled;
		});

		cards[1].click();
		root.querySelector('.elemenx-media-shelf-more').click();

		await tick();

		/* The item itself, as Items has it. */
		expect(events[0]).toBe(host.Items[1]);
		expect(events[1]).toBe('more');

		cards[0].focus();

		key(cards[0], 'ArrowRight');

		expect(document.activeElement).toBe(cards[1]);

		key(cards[1], 'End');

		expect(document.activeElement).toBe(cards[7]);

		track.scrollLeft = track.scrollWidth;

		track.dispatchEvent(new Event('scroll'));

		await waitFor(function () {
			return !arrows[0].disabled && arrows[1].disabled;
		});
	});

	it('FacetFilter counts each option with the other facets as they are, filters by options, a range, a rating and a toggle, and takes them back by chips', async function () {
		var changes = [];
		var lefts = [];
		var host = mount('<div><FacetFilter [facets]="Facets" [items]="Items" [value]="Value" (change)="Changed" (filter)="Filtered" /></div>', {
			Facets: [
				{ID: 'genre', Label: 'Genre', Field: 'Genres'},
				{ID: 'year', Label: 'Year', Field: 'Year', Type: 'range', Min: 2000, Max: 2025},
				{ID: 'score', Label: 'Score', Field: 'Score', Type: 'rating', Max: 10},
				{ID: 'subtitles', Label: 'Subtitles', Field: 'Subtitles', Type: 'toggle'}
			],
			Items: Films,
			Value: {},
			Changed: function (value) {
				changes.push(value);

				this.Value = value;
			},
			Filtered: function (items) {
				lefts.push(items.map(function (item) {
					return item.ID;
				}).join(','));
			}
		});
		var root = host.$Element();
		var options = function () {
			return Array.prototype.map.call(root.querySelectorAll('[data-facet="genre"] .elemenx-facet-option'), function (node) {
				return node.querySelector('.elemenx-facet-option-label').textContent + ' ' + node.querySelector('.elemenx-facet-count').textContent;
			});
		};
		var check = function (facet, value) {
			var input = root.querySelector('[data-facet="' + facet + '"] [data-value="' + value + '"] input');

			input.checked = !input.checked;

			input.dispatchEvent(new Event('change', {bubbles: true}));
		};

		await waitFor(function () {
			return lefts.length;
		});

		/* The options come from the items, in the order they first come; the filter event tells all of them first. */
		expect(options()).toEqual(['Drama 2', 'Mystery 2', 'Comedy 2']);
		expect(lefts[0]).toBe('north,harbor,ember,tide');

		check('genre', 'Mystery');

		await tick();

		expect(changes[0]).toEqual({genre: ['Mystery']});
		expect(lefts[lefts.length - 1]).toBe('north,tide');

		/* From 2016: the counts of the genres follow the other facet, not their own. */
		var from = root.querySelector('[data-facet="year"] input[data-bound="from"]');

		from.value = '2016';

		from.dispatchEvent(new Event('change', {bubbles: true}));

		await tick();

		expect(host.Value).toEqual({genre: ['Mystery'], year: [2016, null]});
		expect(lefts[lefts.length - 1]).toBe('north');
		expect(options()).toEqual(['Drama 2', 'Mystery 1', 'Comedy 1']);

		check('genre', 'Comedy');

		await tick();

		expect(lefts[lefts.length - 1]).toBe('north,ember');

		/* 8 and more: the rating; with subtitles: the toggle. */
		check('score', '8');

		await tick();

		expect(lefts[lefts.length - 1]).toBe('north');

		check('score', '');

		/* The toggle has no options: its one input is the one of the facet. */
		var toggle = root.querySelector('[data-facet="subtitles"] input');

		toggle.checked = true;

		toggle.dispatchEvent(new Event('change', {bubbles: true}));

		await tick();

		expect(host.Value.score).toBe(undefined);
		expect(lefts[lefts.length - 1]).toBe('north,ember');

		var chips = function () {
			return Array.prototype.map.call(root.querySelectorAll('.elemenx-facet-filter-chip'), function (node) {
				return node.textContent;
			});
		};

		expect(chips()).toEqual(['Genre: Mystery', 'Genre: Comedy', 'Year: 2016 – …', 'Subtitles']);

		root.querySelector('.elemenx-facet-filter-chip .elemenx-facet-filter-remove').click();

		await tick();

		expect(host.Value).toEqual({genre: ['Comedy'], year: [2016, null], subtitles: true});

		root.querySelector('.elemenx-facet-filter-clear').click();

		await tick();

		expect(host.Value).toEqual({});
		expect(lefts[lefts.length - 1]).toBe('north,harbor,ember,tide');

		/* The facet folds; Filter gives the items a Value leaves. */
		root.querySelector('[data-facet="genre"] .elemenx-facet-header').click();

		await tick();

		expect(root.querySelector('[data-facet="genre"] .elemenx-facet-body')).toBe(null);
		expect(Elemenx.Instance(root.querySelector('.elemenx-facet-filter')).Filter(Films).length).toBe(4);
	});

	it('FacetFilter: a toggle, a choice, Show all and the search of a long facet', async function () {
		var genres = [];
		var host;
		var root;
		var i;

		for (i = 0; i < 15; i++) genres.push({Value: 'g' + i, Label: 'Genre ' + i});

		host = mount('<div><FacetFilter [facets]="Facets" [items]="Items" [value]="Value" Limit="4" (change)="Changed" /></div>', {
			Facets: [
				{ID: 'subtitles', Label: 'Subtitles', Field: 'Subtitles', Type: 'toggle'},
				{ID: 'decade', Label: 'Decade', Field: 'Decade', Type: 'choice', Options: [{Value: 2010, Label: '2010s'}, {Value: 2020, Label: '2020s'}]},
				{ID: 'many', Label: 'Many', Options: genres}
			],
			Items: Films,
			Value: {},
			Changed: function (value) {
				this.Value = value;
			}
		});
		root = host.$Element();

		var toggle = root.querySelector('[data-facet="subtitles"] input');

		toggle.checked = true;

		toggle.dispatchEvent(new Event('change', {bubbles: true}));

		await tick();

		expect(host.Value).toEqual({subtitles: true});

		var radio = root.querySelector('[data-facet="decade"] [data-value="2020"] input');

		radio.checked = true;

		radio.dispatchEvent(new Event('change', {bubbles: true}));

		await tick();

		/* A number stays a number. */
		expect(host.Value).toEqual({subtitles: true, decade: 2020});

		expect(root.querySelectorAll('[data-facet="many"] .elemenx-facet-option').length).toBe(4);
		expect(root.querySelector('[data-facet="many"] .elemenx-facet-more').textContent).toBe('Show all (11)');

		var search = root.querySelector('[data-facet="many"] .elemenx-facet-search');

		search.value = 'genre 1';

		search.dispatchEvent(new Event('input', {bubbles: true}));

		await tick();

		expect(root.querySelectorAll('[data-facet="many"] .elemenx-facet-option').length).toBe(6);

		search.value = '';

		search.dispatchEvent(new Event('input', {bubbles: true}));

		await tick();

		root.querySelector('[data-facet="many"] .elemenx-facet-more').click();

		await tick();

		expect(root.querySelectorAll('[data-facet="many"] .elemenx-facet-option').length).toBe(15);
	});

	it('MediaHero: its facts, score and genres, Resume once some of it was seen, play and the heart', async function () {
		var events = [];
		var host = mount('<div><MediaHero Title="North" Subtitle="A film" [facts]="[\'2019\', \'2 h\']" Rating="8.14" [tags]="[\'Drama\']" Description="A story." Progress="0.4" Favorable="true" (play)="Played" (favorite)="Kept"><button class="extra" type="button">Trailer</button></MediaHero></div>', {
			Played: function () {
				events.push('play');
			},
			Kept: function (value) {
				events.push('favorite ' + value.Favorite);
			}
		});
		var root = host.$Element();
		var buttons;

		expect(root.querySelector('.elemenx-media-hero-title').textContent).toBe('North');
		expect(root.querySelector('.elemenx-media-hero-score').textContent).toBe('8.1/10');
		expect(Array.prototype.map.call(root.querySelectorAll('.elemenx-media-hero-fact'), function (node) {
			return node.textContent;
		})).toEqual(['2019', '2 h']);
		expect(root.querySelector('.elemenx-media-hero-progress').getAttribute('aria-valuenow')).toBe('40');
		expect(root.querySelector('.elemenx-media-hero-actions .extra')).not.toBe(null);

		buttons = root.querySelectorAll('.elemenx-media-hero-actions .elemenx-button');

		expect(buttons[0].textContent.trim()).toBe('Resume');

		buttons[0].click();
		buttons[1].click();

		await tick();

		expect(events).toEqual(['play', 'favorite true']);
	});

	it('TrackList: numbers, lengths and the total; a press plays a track, and the one playing pauses; the keys go from row to row', async function () {
		var events = [];
		var host = mount('<div><TrackList [items]="Items" [current]="Current" [playing]="Playing" Columns="album" (play)="Played" (pause)="Paused" /></div>', {
			Items: [
				{ID: 1, Title: 'Morning Tide', Artist: 'Quartet', Album: 'Tides', Duration: 214},
				{ID: 2, Title: 'Lantern', Artist: 'Quartet', Album: 'Tides', Duration: 187, Explicit: true},
				{ID: 3, Title: 'Long Night', Artist: 'Quartet', Album: 'Tides', Duration: 3725},
				{ID: 4, Title: 'Gone', Duration: 60, Disabled: true}
			],
			Current: 2,
			Playing: true,
			Played: function (track) {
				events.push('play ' + track.ID);

				this.Current = track.ID;
			},
			Paused: function (track) {
				events.push('pause ' + track.ID);

				this.Playing = false;
			}
		});
		var root = host.$Element();
		var rows = root.querySelectorAll('.elemenx-track');

		expect(Array.prototype.map.call(rows, function (row) {
			return row.querySelector('.elemenx-track-duration').textContent;
		})).toEqual(['3:34', '3:07', '1:02:05', '1:00']);
		expect(rows[1].classList.contains('playing')).toBe(true);

		/* A row at rest shows its number alone: the play button waits for the pointer or the focus, the bars for the one playing. */
		expect(getComputedStyle(rows[0].querySelector('.elemenx-track-action')).display).toBe('none');
		expect(getComputedStyle(rows[0].querySelector('.elemenx-track-index')).display).not.toBe('none');
		expect(getComputedStyle(rows[1].querySelector('.elemenx-track-bars')).display).not.toBe('none');
		expect(rows[1].getAttribute('aria-current')).toBe('true');
		expect(rows[1].querySelector('.elemenx-track-explicit')).not.toBe(null);
		expect(rows[0].querySelectorAll('.elemenx-track-column').length).toBe(1);
		expect(root.querySelector('.elemenx-track-list-total').textContent).toBe('4 tracks · 1:09:46');

		rows[1].click();
		rows[3].click();
		rows[0].click();

		await tick();

		expect(events).toEqual(['pause 2', 'play 1']);

		rows = root.querySelectorAll('.elemenx-track');

		rows[0].focus();

		key(rows[0], 'ArrowDown');

		expect(document.activeElement).toBe(rows[1]);

		key(rows[1], 'Enter');

		expect(events).toEqual(['pause 2', 'play 1', 'play 2']);
	});

	it('CastList: photos or avatars of the names, their roles, in a row, a grid or a list; a press opens a person', async function () {
		var opened = [];
		var host = mount('<div><CastList Title="Cast" [items]="People" [layout]="Layout" (open)="Opened" /></div>', {
			People: [{ID: 'a', Name: 'Ada Lovelace', Role: 'Captain'}, {ID: 'b', Name: 'Alan Turing', Role: 'Engineer', Href: '#alan'}],
			Layout: 'row',
			Opened: function (person) {
				opened.push(person.ID);
			}
		});
		var root = host.$Element();
		var people = root.querySelectorAll('.elemenx-cast-person');

		expect(root.querySelector('.elemenx-cast').classList.contains('row')).toBe(true);
		expect(people[0].getAttribute('aria-label')).toBe('Ada Lovelace, Captain');
		expect(people[0].querySelector('.elemenx-avatar')).not.toBe(null);
		expect(people[1].querySelector('a.elemenx-cast-name').getAttribute('href')).toBe('#alan');

		people[0].click();
		people[0].focus();

		key(people[0], 'ArrowRight');

		expect(document.activeElement).toBe(people[1]);

		key(people[1], 'Enter');

		host.Layout = 'grid';

		await tick();

		expect(root.querySelector('.elemenx-cast').classList.contains('grid')).toBe(true);
		expect(opened).toEqual(['a', 'b']);
	});
});
