import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];
var layouts;

function mount (template, state) {
	var component = Elemenx.Component(unique('LayoutsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* The places of a result as short texts: ID row,column wxh (bento) or ID x,y wxh. */
function cells (result) {
	return result.Items.map(function (spot) {
		return spot.ID + ' ' + spot.Row + ',' + spot.Column + ' ' + spot.Width + 'x' + spot.Height;
	});
}

describe('Contract: the Layouts Service and Mosaic', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Mosaic', 'MosaicItem']);

		layouts = Elemenx.Service('Layouts');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('packs a grid of cells without holes, keeping the items in their places', function () {
		var result = layouts.Pack([
			{ID: 'wide', Width: 2},
			{ID: 'kept', Row: 0, Column: 3, Height: 2},
			{ID: 'tall', Height: 2},
			{ID: 'one'},
			{ID: 'huge', Width: 9}
		], {Columns: 4});

		expect(cells(result)).toEqual(['wide 0,0 2x1', 'kept 0,3 1x2', 'tall 0,2 1x2', 'one 1,0 1x1', 'huge 2,0 4x1']);
		expect(result.Rows).toBe(3);

		/* Not dense: never before the place of the one before. */
		expect(cells(layouts.Pack([{ID: 'a', Width: 3}, {ID: 'b', Width: 2}, {ID: 'c'}], {Columns: 4, Dense: false}))).toEqual(['a 0,0 3x1', 'b 1,0 2x1', 'c 1,2 1x1']);
		expect(cells(layouts.Pack([{ID: 'a', Width: 3}, {ID: 'b', Width: 2}, {ID: 'c'}], {Columns: 4}))).toEqual(['a 0,0 3x1', 'b 1,0 2x1', 'c 0,3 1x1']);
	});

	it('lays masonry into the shortest column, a picture by its ratio, an item over several columns', function () {
		var result = layouts.Masonry([
			{ID: 'a', Height: 100},
			{ID: 'b', Height: 50},
			{ID: 'c', Ratio: 2},
			{ID: 'd', Height: 30, Span: 2}
		], {Width: 320, Columns: 2, Gap: 20});

		expect(result.ColumnWidth).toBe(150);
		expect(result.Items.map(function (spot) {
			return [spot.ID, spot.Column, spot.X, spot.Y, spot.Width, spot.Height];
		})).toEqual([['a', 0, 0, 0, 150, 100], ['b', 1, 170, 0, 150, 50], ['c', 1, 170, 70, 150, 75], ['d', 0, 0, 165, 320, 30]]);
		expect(result.Height).toBe(195);

		/* Without Columns: as many as fit ColumnWidth. */
		expect(layouts.Masonry([], {Width: 1000, ColumnWidth: 240, Gap: 16}).Columns).toBe(3);
	});

	it('fills justified rows of one height, each picture keeping its shape, the last one at the wanted height', function () {
		var result = layouts.Justified([
			{ID: 'a', Ratio: 1.5},
			{ID: 'b', Ratio: 1},
			{ID: 'c', Ratio: 1.5},
			{ID: 'd', Ratio: 1}
		], {Width: 400, RowHeight: 150, Gap: 10});
		var first = result.Items.filter(function (spot) {
			return spot.Row === 0;
		});

		/* The first row ends where the box does, its pictures at their ratios. */
		expect(first.map(function (spot) {
			return spot.ID;
		})).toEqual(['a', 'b']);
		expect(first[1].X + first[1].Width).toBeCloseTo(400, 5);
		expect(first[0].Width / first[0].Height).toBeCloseTo(1.5, 5);
		expect(result.Rows[1]).toMatchObject({Count: 2});
		expect(result.Items[2].Height).toBe(150);
	});

	it('makes a treemap of areas by value, children inside their parent, the parents first', function () {
		var result = layouts.Treemap([
			{ID: 'big', Value: 6},
			{ID: 'group', Children: [{ID: 'x', Value: 2}, {ID: 'y', Value: 2}]},
			{ID: 'small', Value: 2}
		], {Width: 400, Height: 300, Gap: 0, Padding: 0});
		var byID = {};
		var area = function (spot) {
			return spot.Width * spot.Height;
		};

		result.Items.forEach(function (spot) {
			byID[spot.ID] = spot;
		});

		expect(result.Items.map(function (spot) {
			return spot.ID;
		})).toEqual(['big', 'group', 'x', 'y', 'small']);
		expect(area(byID.big) / (400 * 300)).toBeCloseTo(0.5, 5);
		expect(byID.group.Value).toBe(4);
		expect(byID.group.Leaf).toBe(false);
		expect(byID.x.Parent).toBe('group');
		expect(area(byID.x) + area(byID.y)).toBeCloseTo(area(byID.group), 5);
		expect(byID.x.X).toBeGreaterThanOrEqual(byID.group.X - 1e-9);
	});

	it('draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter', async function () {
		var chosen = [];
		var host = mount('<div style="width: 432px"><Mosaic Layout="bento" ColumnWidth="100" Gap="8" Selectable="true" [items]="Items" (select)="Chosen"><MosaicItem ID="declared" Title="Declared" Width="2"><b class="mine">Mine</b></MosaicItem></Mosaic></div>', {
			Items: [{ID: 'given', Title: 'Given', Text: 'A text'}],
			Chosen: function (item) {
				chosen.push(item.ID);
			}
		});
		var box;

		expect(await waitFor(function () {
			var item = host.$Element().querySelector('[data-id="declared"]');

			return host.$Element().querySelectorAll('.elemenx-mosaic-item').length === 2 && !!item && item.style.width === '212px';
		}, 3000)).toBe(true);

		box = host.$Element().querySelector('.elemenx-mosaic');

		/* Four columns of 102 pixels in 432: the declared item two of them wide, beside the given one. */
		var declared = box.querySelector('[data-id="declared"]');
		var given = box.querySelector('[data-id="given"]');

		expect(declared.style.width).toBe('212px');
		expect(given.style.transform).toBe('translate(0px, 0px)');
		expect(declared.style.transform).toBe('translate(110px, 0px)');
		expect(declared.querySelector('.mine').textContent).toBe('Mine');
		expect(given.querySelector('.elemenx-mosaic-title').textContent).toBe('Given');

		given.click();

		declared.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

		expect(chosen).toEqual(['given', 'declared']);

		/* Narrower: two columns of 104 pixels, the declared item on a row of its own. */
		host.$Element().style.width = '216px';

		expect(await waitFor(function () {
			return declared.style.transform === 'translate(0px, 112px)';
		}, 3000)).toBe(true);

		await tick(10);

		expect(host.Items.length).toBe(1);
	});
});
