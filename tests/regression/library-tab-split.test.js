import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('TabSplitHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function labels (root) {
	return Array.prototype.map.call(root.querySelectorAll('.elemenx-tab-group-tab'), function (tab) {
		return tab.textContent.trim();
	});
}

function groups (root) {
	return Array.prototype.map.call(root.querySelectorAll('.elemenx-tab-split-group'), function (group) {
		return labels(group).join(',') + (group.querySelector('.elemenx-tab-panel.active') ? '=' + group.querySelector('.elemenx-tab-panel.active').textContent.trim() : '');
	});
}

/* TabGroup and TabSplit: groups of tabs with their menu, pinned tabs, a layout declared or given, split and joined. */
describe('Contract: TabGroup and TabSplit', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['TabGroup', 'TabSplit', 'TabRow', 'TabColumn', 'Tab']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('a TabGroup shows its declared tabs, the pinned ones first and without a cross, and its menu closes the others but the pinned', async function () {
		var closed = [];
		var host = mount('<div style="height: 200px"><TabGroup Closable="true" (close)="Closed"><Tab *for="tab of Open" *key="tab" [id]="tab" [label]="tab" [pinned]="tab === \'c\'">Body {{tab}}</Tab></TabGroup></div>', {
			Open: ['a', 'b', 'c', 'd'],
			Closed: function (id) {
				closed.push(id);

				this.Open = this.Open.filter(function (each) {
					return each !== id;
				});
			}
		});
		var group;

		await waitFor(function () {
			return labels(host.$Element()).length === 4;
		});

		group = Elemenx.Instance(host.$Element().querySelector('.elemenx-tab-group'));

		expect(labels(host.$Element())).toEqual(['c', 'a', 'b', 'd']);
		expect(host.$Element().querySelector('.elemenx-tab-group-tab.pinned .elemenx-tab-group-close')).toBe(null);
		expect(host.$Element().querySelector('.elemenx-tab-panel.active').textContent.trim()).toBe('Body c');

		host.$Element().querySelectorAll('.elemenx-tab-group-tab')[2].click();

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-tab-panel.active').textContent.trim()).toBe('Body b');

		group.Menu(null, host.$Element().querySelectorAll('.elemenx-tab-group-tab')[2]);
		group.MenuPicked({Item: {ID: 'others'}});

		await waitFor(function () {
			return labels(host.$Element()).length === 2;
		});

		expect(closed).toEqual(['a', 'd']);
		expect(labels(host.$Element())).toEqual(['c', 'b']);

		group.MenuPicked({Item: {ID: 'all'}});

		await waitFor(function () {
			return labels(host.$Element()).length === 1;
		});

		expect(labels(host.$Element())).toEqual(['c']);
	});

	it('a TabSplit lays out the groups it declares side by side, each with its tabs, and splits a group to a side with a tab', async function () {
		var changes = [];
		var host = mount('<div style="width: 800px; height: 400px"><TabSplit (change)="Changed"><TabRow Sizes="25,75"><TabGroup Group="side"><Tab ID="files" Label="Files">The files</Tab></TabGroup><TabGroup Group="main"><Tab ID="one" Label="one.js">One</Tab><Tab ID="two" Label="two.js">Two</Tab></TabGroup></TabRow></TabSplit></div>', {
			Changed: function (layout) {
				changes.push(layout);
			}
		});
		var split;
		var boxes;

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group').length === 2 && host.$Element().querySelectorAll('.elemenx-tab-split-group .elemenx-tab-panel.active').length === 2;
		});

		split = Elemenx.Instance(host.$Element().querySelector('.elemenx-tab-split'));
		boxes = Array.prototype.map.call(host.$Element().querySelectorAll('.elemenx-tab-split-group'), function (group) {
			return Math.round(group.getBoundingClientRect().width);
		});

		expect(groups(host.$Element())).toEqual(['Files=The files', 'one.js,two.js=One']);
		expect(boxes).toEqual([200, 600]);
		expect(split.Model()).toEqual({Split: 'row', Sizes: [25, 75], Children: [{Group: 'side', Tabs: ['files'], Active: 'files', Pinned: []}, {Group: 'main', Tabs: ['one', 'two'], Active: 'one', Pinned: []}]});

		/* The menu of two.js: Split down. The group of one tab splits nothing. */
		split.Split('two', 'bottom');

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group').length === 3;
		});

		expect(groups(host.$Element())).toEqual(['Files=The files', 'one.js=One', 'two.js=Two']);
		expect(changes[changes.length - 1].Children[1]).toMatchObject({Split: 'column', Sizes: [50, 50]});

		split.Split('files', 'right');

		await tick(20);

		expect(host.$Element().querySelectorAll('.elemenx-tab-split-group').length).toBe(3);
	});

	it('a tab dropped in the middle of another group goes into it, and a group left without a tab goes', async function () {
		var host = mount('<div style="width: 800px; height: 400px"><TabSplit><TabRow><TabGroup Group="left"><Tab ID="a" Label="A">Alpha</Tab></TabGroup><TabGroup Group="right"><Tab ID="b" Label="B">Beta</Tab></TabGroup></TabRow></TabSplit></div>');
		var split;
		var alpha;

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group .elemenx-tab-panel.active').length === 2;
		});

		split = Elemenx.Instance(host.$Element().querySelector('.elemenx-tab-split'));
		alpha = host.$Element().querySelector('.elemenx-tab-panel[data-id="a"]');

		split.Dropped({ID: 'a', From: 'left', Side: 'center', Group: 'right'});

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group').length === 1;
		});

		/* The panel moved, not made again: its content is the same element. */
		expect(groups(host.$Element())).toEqual(['B,A=Alpha']);
		expect(host.$Element().querySelector('.elemenx-tab-panel[data-id="a"]')).toBe(alpha);
		expect(split.Model()).toEqual({Group: 'right', Tabs: ['b', 'a'], Active: 'a', Pinned: []});

		split.Dropped({ID: 'a', From: 'right', Side: 'top', Group: 'right'});

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group').length === 2;
		});

		expect(split.Model()).toMatchObject({Split: 'column', Children: [{Tabs: ['a']}, {Tabs: ['b']}]});
	});

	it('takes the layout of Layout, closes a tab for its owner, and moves a divider by its keys', async function () {
		var closed = [];
		var changes = [];
		var host = mount('<div style="width: 800px; height: 400px"><TabSplit [layout]="Saved" (close)="Closed" (change)="Changed"><Tab *for="tab of Open" *key="tab" [id]="tab" [label]="tab">{{tab}}</Tab></TabSplit></div>', {
			Open: ['x', 'y', 'z'],
			Saved: {Split: 'column', Sizes: [30, 70], Children: [{Group: 'top', Tabs: ['x'], Active: 'x'}, {Group: 'bottom', Tabs: ['y', 'z'], Active: 'z'}]},
			Closed: function (id) {
				closed.push(id);

				this.Open = this.Open.filter(function (each) {
					return each !== id;
				});
			},
			Changed: function (layout) {
				changes.push(layout);
			}
		});
		var split;
		var divider;

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group .elemenx-tab-panel.active').length === 2;
		});

		split = Elemenx.Instance(host.$Element().querySelector('.elemenx-tab-split'));

		expect(groups(host.$Element())).toEqual(['x=x', 'y,z=z']);

		divider = host.$Element().querySelector('.elemenx-tab-split-divider');

		divider.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, cancelable: true}));

		await tick(20);

		expect(changes[changes.length - 1].Sizes).toEqual([35, 65]);

		split.Close('x');

		await waitFor(function () {
			return host.$Element().querySelectorAll('.elemenx-tab-split-group').length === 1;
		});

		expect(closed).toEqual(['x']);
		expect(split.Model()).toEqual({Group: 'bottom', Tabs: ['y', 'z'], Active: 'z', Pinned: []});

		/* A tab declared later opens in the group of the focus, current. */
		host.Open = host.Open.concat(['w']);

		await waitFor(function () {
			return labels(host.$Element()).length === 3;
		});

		expect(groups(host.$Element())).toEqual(['y,z,w=w']);
	});
});
