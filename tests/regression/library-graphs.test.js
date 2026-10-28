import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component('GraphsHost' + Math.random().toString(36).slice(2), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function key (target, name) {
	target.dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true, cancelable: true}));
}

/*
 * A history: main with a feature branch merged into it, and a hotfix merged too, newest first as git log gives it.
 *   m2 (main) = merge of m1 and h1
 *   h1 (hotfix)        -> m1
 *   m1 = merge of c3 and f2
 *   f2 (feature)       -> f1
 *   c3                 -> c2
 *   f1                 -> c2
 *   c2                 -> c1
 *   c1
 */
var History = [
	{ID: 'm2', Parents: ['m1', 'h1'], Message: 'Merge hotfix', Author: 'Ada', Date: '2026-10-27', Refs: [{Name: 'main', Kind: 'branch'}, {Name: 'HEAD', Kind: 'head'}]},
	{ID: 'h1', Parents: ['m1'], Message: 'Fix the total', Author: 'Grace', Date: '2026-10-26', Refs: [{Name: 'hotfix', Kind: 'branch'}]},
	{ID: 'm1', Parents: ['c3', 'f2'], Message: 'Merge feature', Author: 'Ada', Date: '2026-10-25'},
	{ID: 'f2', Parents: ['f1'], Message: 'Remember the user', Author: 'Grace', Date: '2026-10-24', Refs: [{Name: 'feature', Kind: 'branch'}]},
	{ID: 'c3', Parents: ['c2'], Message: 'The footer', Author: 'Ada', Date: '2026-10-23'},
	{ID: 'f1', Parents: ['c2'], Message: 'The login form', Author: 'Grace', Date: '2026-10-22'},
	{ID: 'c2', Parents: ['c1'], Message: 'The page', Author: 'Ada', Date: '2026-10-21', Refs: [{Name: 'v1.0', Kind: 'tag'}]},
	{ID: 'c1', Parents: [], Message: 'First commit', Author: 'Ada', Date: '2026-10-20'}
];

describe('Contract: the graphs of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['CommitGraph']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('CommitGraph lays its lanes out as git log --graph: a branch leaves a lane, a merge joins it, a lane goes on from row to row', async function () {
		var host = mount('<div><CommitGraph #Graph [commits]="Commits" Height="auto" /></div>', {Commits: History});
		var graph;
		var rows;

		await tick();

		graph = host.$Element().querySelector('.elemenx-commit-graph');
		rows = Array.prototype.map.call(graph.querySelectorAll('.elemenx-commit-graph-row'), function (row) {
			return [row.getAttribute('data-id'), row.querySelector('.elemenx-commit-graph-message').textContent, row.querySelectorAll('.elemenx-commit-graph-line').length];
		});

		expect(rows.map(function (row) {
			return row[0];
		})).toEqual(['m2', 'h1', 'm1', 'f2', 'c3', 'f1', 'c2', 'c1']);

		/* The lanes as the component lays them out: the merges take a lane for their second parent, the branches end into it. */
		var layout = owned[0].$Element().querySelector('.elemenx-commit-graph');
		var lanes = Array.prototype.map.call(layout.querySelectorAll('.elemenx-commit-graph-dot'), function (dot) {
			return Number(dot.getAttribute('cx'));
		});

		expect(lanes).toEqual([7, 21, 7, 21, 7, 21, 7, 7]);

		/* A merge is a ring; a tag and a branch are refs of their own kinds. */
		expect(Array.prototype.map.call(layout.querySelectorAll('.elemenx-commit-graph-dot.merge'), function (dot) {
			return dot.closest('.elemenx-commit-graph-row').getAttribute('data-id');
		})).toEqual(['m2', 'm1']);
		expect(Array.prototype.map.call(layout.querySelectorAll('.elemenx-commit-graph-ref'), function (ref) {
			return ref.textContent + ' ' + ref.className.replace('elemenx-commit-graph-ref', '').trim();
		})).toEqual(['main branch', 'HEAD head', 'hotfix branch', 'feature branch', 'v1.0 tag']);

		/* Every row draws its part: the first commit has no line out of it, the others have. */
		expect(rows[7][2]).toBe(1);
		expect(rows[0][2]).toBeGreaterThanOrEqual(2);
	});

	it('CommitGraph chooses with a press and its keys, opens with Enter and a double press, and shows only the rows in view of a long history', async function () {
		var chosen = [];
		var opened = [];
		var long = [];
		var i;
		var host;
		var body;

		for (i = 0; i < 400; i++) long.push({ID: 'c' + i, Parents: i < 399 ? ['c' + (i + 1)] : [], Message: 'Commit ' + i, Author: 'Ada', Date: '2026-01-01'});

		host = mount('<div><CommitGraph [commits]="Commits" [selected]="Selected" Height="140" Columns="message,id" (select)="Chosen" (open)="Opened" /></div>', {
			Commits: long,
			Selected: null,
			Chosen: function (commit) {
				chosen.push(commit.ID);

				this.Selected = commit.ID;
			},
			Opened: function (commit) {
				opened.push(commit.ID);
			}
		});

		await tick();

		body = host.$Element().querySelector('.elemenx-commit-graph-body');

		/* 400 commits, a few dozen rows in the page; the space keeps the height of all of them. */
		expect(body.querySelectorAll('.elemenx-commit-graph-row').length).toBeLessThan(40);
		expect(body.querySelector('.elemenx-commit-graph-space').style.height).toBe(400 * 28 + 'px');
		expect(body.querySelector('.elemenx-commit-graph-author')).toBe(null);

		body.querySelector('[data-id="c1"]').click();

		key(body, 'ArrowDown');
		key(body, 'End');

		await tick(50);

		expect(chosen).toEqual(['c1', 'c2', 'c399']);
		expect(body.scrollTop).toBeGreaterThan(400 * 28 - 200);
		expect(body.querySelector('[data-id="c399"]').getAttribute('aria-selected')).toBe('true');
		expect(body.getAttribute('aria-activedescendant')).toBe('elemenx-commit-c399');

		key(body, 'Enter');

		body.querySelector('[data-id="c398"]').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		expect(opened).toEqual(['c399', 'c398']);
	});

	it('CommitGraph as a list is as wide as its place, also in a column that does not stretch its items', async function () {
		var host = mount('<div style="display: flex; flex-direction: column; align-items: flex-start; width: 480px"><CommitGraph [commits]="Commits" Height="200" /></div>', {Commits: History});
		var graph = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-commit-graph-message') ? host.$Element().querySelector('.elemenx-commit-graph') : null;
		});

		expect(graph.getBoundingClientRect().width).toBe(480);
		expect(graph.querySelector('.elemenx-commit-graph-message').getBoundingClientRect().width).toBeGreaterThan(40);
	});

	it('CommitGraph as a scheme scrolls inside its place: it does not widen a column of a grid (a phone)', async function () {
		var host = mount('<div style="display: grid; grid-template-columns: 1fr; width: 200px"><div style="display: flex; flex-direction: column; align-items: flex-start"><CommitGraph [commits]="Commits" Layout="scheme" /></div></div>', {Commits: History});
		var scheme = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-commit-graph-scheme svg') ? host.$Element().querySelector('.elemenx-commit-graph-scheme') : null;
		});

		expect(host.$Element().firstElementChild.firstElementChild.getBoundingClientRect().width).toBe(200);
		expect(scheme.scrollWidth).toBeGreaterThan(200);
	});

	it('CommitGraph as a scheme: oldest on the left, a lane for each branch named by its tip, its refs over the dots', async function () {
		var host = mount('<div><CommitGraph Layout="scheme" ShowMessages="true" [commits]="Commits" /></div>', {Commits: History});
		var scheme;
		var dots;

		await tick();

		scheme = host.$Element().querySelector('.elemenx-commit-graph-scheme');
		dots = Array.prototype.map.call(scheme.querySelectorAll('.elemenx-commit-graph-scheme-commit'), function (commit) {
			var dot = commit.querySelector('circle');

			return {ID: commit.getAttribute('data-id'), X: Number(dot.getAttribute('cx')), Y: Number(dot.getAttribute('cy'))};
		});

		/* The first commit leftmost, the last rightmost; main in the first lane, the branches under it. */
		dots.sort(function (a, b) {
			return a.X - b.X;
		});

		expect(dots[0].ID).toBe('c1');
		expect(dots[dots.length - 1].ID).toBe('m2');
		expect(dots.filter(function (dot) {
			return dot.ID === 'f1' || dot.ID === 'f2';
		})[0].Y).toBeGreaterThan(dots[0].Y);
		expect(Array.prototype.map.call(scheme.querySelectorAll('.elemenx-commit-graph-scheme-name'), function (name) {
			return name.textContent;
		}).filter(Boolean)).toEqual(['main', 'hotfix', 'feature']);
		expect(scheme.querySelectorAll('.elemenx-commit-graph-scheme-message').length).toBe(8);
		/* An edge for each parent of each commit. */
		expect(scheme.querySelectorAll('.elemenx-commit-graph-line').length).toBe(9);
	});
});
