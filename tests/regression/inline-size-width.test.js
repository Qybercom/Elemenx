import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component('InlineSizeHost' + Math.random().toString(36).slice(2), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/*
 * A Component whose width comes from its place (contain: inline-size, so a long line scrolls inside it on a phone)
 * takes all of its place: in a column whose items keep their own widths (align-items: flex-start, as the catalogue
 * lays them out) it is not as wide as nothing.
 */
describe('Regression: the Components whose width comes from their place fill it', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['CastList', 'DiffView', 'MediaHero', 'MediaShelf', 'VideoTimeline']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		owned.splice(0).forEach(function (component) {
			component.$Destroy();
		});
	});

	it('CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start', async function () {
		var host = mount('<div style="display: flex; flex-direction: column; align-items: flex-start; width: 400px">' +
			'<CastList Title="Cast" [items]="Cast" />' +
			'<DiffView Title="a.js" Before="var a = 1;" After="var a = 2;" />' +
			'<MediaHero Title="The Long Light" Subtitle="A film" />' +
			'<MediaShelf Title="Films" [items]="Films" />' +
			'<VideoTimeline [tracks]="Tracks" />' +
			'</div>', {
			Cast: [{ID: 'a', Name: 'Ada Lovelace', Role: 'Captain'}],
			Films: [{ID: 'a', Title: 'North', Subtitle: '2023'}],
			Tracks: [{ID: 'v1', Kind: 'video', Name: 'Video 1', Clips: [{ID: 'a', Name: 'Intro', Start: 0, Duration: 6}]}]
		});
		var selectors = ['.elemenx-cast', '.elemenx-diff-view', '.elemenx-media-hero', '.elemenx-media-shelf', '.elemenx-video-timeline'];

		expect(await waitFor(function () {
			return selectors.every(function (selector) {
				return !!host.$Element().querySelector(selector);
			});
		})).toBe(true);

		expect(selectors.map(function (selector) {
			return selector + ' ' + Math.round(host.$Element().querySelector(selector).getBoundingClientRect().width);
		})).toEqual(selectors.map(function (selector) {
			return selector + ' 400';
		}));
	});
});
