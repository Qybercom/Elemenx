import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('FragmentHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* The tags of the element children of a node, and of the elemenx-fragment ones among its descendants (none should stay). */
function tags (node) {
	return Array.prototype.map.call(node.children, function (child) {
		return child.tagName.toLowerCase() + (child.className ? '.' + child.className : '');
	});
}

/*
 * <Fragment> groups nodes with no element of its own: a *for or an *if over several of them (two rows of a table for
 * each item), several of them for one slot, the root of a template. Its nodes stand in the parent itself.
 */
describe('Contract: <Fragment>, nodes grouped without an element of their own', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('repeats several elements for each item of a *for, right in the list, in order as the items change', async function () {
		var host = mount('<ul><li class="head">People</li><Fragment *for="item of Items" *key="item.ID"><li class="name">{{item.Name}}</li><li class="role">{{item.Role}}</li></Fragment><li class="foot">End</li></ul>', {
			Items: [{ID: 'a', Name: 'Ada', Role: 'Captain'}, {ID: 'b', Name: 'Bob', Role: 'Pilot'}]
		});
		var list = host.$Element();

		await tick(20);

		expect(tags(list)).toEqual(['li.head', 'li.name', 'li.role', 'li.name', 'li.role', 'li.foot']);
		expect(list.textContent).toBe('PeopleAdaCaptainBobPilotEnd');
		expect(list.querySelector('elemenx-fragment')).toBe(null);

		/* Moved, added, taken away: the pairs stay whole and in the order of the items. */
		host.Items = [{ID: 'c', Name: 'Cyd', Role: 'Cook'}, {ID: 'b', Name: 'Bob', Role: 'Pilot'}, {ID: 'a', Name: 'Ada', Role: 'Admiral'}];

		await tick(20);

		expect(list.textContent).toBe('PeopleCydCookBobPilotAdaAdmiralEnd');

		host.Items = [{ID: 'a', Name: 'Ada', Role: 'Admiral'}];

		await tick(20);

		expect(tags(list)).toEqual(['li.head', 'li.name', 'li.role', 'li.foot']);
		expect(list.textContent).toBe('PeopleAdaAdmiralEnd');
	});

	it('repeats two rows of a table for each item: the parser keeps it in the table', async function () {
		var host = mount('<table><tbody><Fragment *for="row of Rows" *key="row.ID"><tr class="main"><td>{{row.Name}}</td></tr><tr class="detail"><td>{{row.Note}}</td></tr></Fragment></tbody></table>', {
			Rows: [{ID: 1, Name: 'One', Note: 'First'}, {ID: 2, Name: 'Two', Note: 'Second'}]
		});
		var body = host.$Element().querySelector('tbody');

		await tick(20);

		expect(tags(body)).toEqual(['tr.main', 'tr.detail', 'tr.main', 'tr.detail']);
		expect(body.rows[3].textContent).toBe('Second');
	});

	it('shows and hides several nodes with an *if, a text among them, and leaves a plain Fragment as its nodes', async function () {
		var host = mount('<p class="line">Start <Fragment *if="Shown">shown <b>bold</b> <i>italic</i></Fragment> <Fragment>plain <u>under</u></Fragment> end</p>', {Shown: false});
		var line = host.$Element();

		await tick(20);

		expect(line.textContent.replace(/\s+/g, ' ')).toBe('Start plain under end');
		expect(tags(line)).toEqual(['u']);

		host.Shown = true;

		await tick(20);

		expect(line.textContent.replace(/\s+/g, ' ')).toBe('Start shown bold italic plain under end');
		expect(tags(line)).toEqual(['b', 'i', 'u']);

		host.Shown = false;

		await tick(20);

		expect(tags(line)).toEqual(['u']);
	});

	it('gives several nodes, a text among them, to one named slot, and makes the root of a template of several nodes', async function () {
		var card = unique('FragmentCard');
		var pair = unique('FragmentPair');
		var host;
		var footer;

		Elemenx.Component(card, {$Template: '<article><div class="body"><slot></slot></div><footer class="foot"><slot name="footer"></slot></footer></article>'});
		Elemenx.Component(pair, {$Template: '<Fragment><h4 class="title">{{Title}}</h4><p class="text">Text</p></Fragment>', Title: 'Pair'});

		host = mount('<div><' + card + '><p>Body</p><Fragment slot="footer">Sent by <b>{{Who}}</b></Fragment></' + card + '><' + pair + ' /></div>', {Who: 'Ada'});

		await tick(20);

		footer = host.$Element().querySelector('.foot');

		expect(footer.textContent.replace(/\s+/g, ' ').trim()).toBe('Sent by Ada');
		expect(host.$Element().querySelector('.body').textContent).toBe('Body');
		expect(host.$Element().querySelector('elemenx-fragment')).toBe(null);

		/* The root of several nodes: an element that takes no room holds them. */
		var root = host.$Element().querySelector('.title').parentNode;

		expect(root.style.display).toBe('contents');
		expect(tags(root)).toEqual(['h4.title', 'p.text']);

		host.Who = 'Bob';

		await tick(20);

		expect(footer.textContent.replace(/\s+/g, ' ').trim()).toBe('Sent by Bob');
	});
});
