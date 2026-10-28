import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('RefsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function texts (list) {
	return list.map(function (node) {
		return node.textContent;
	});
}

/* this.$Refs(name): every element of a Component marked #name, the rows of a *for among them. */
describe('Contract: $Refs', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('gives the rows of a *for in the order of the page, and follows the list', async function () {
		var host = mount('<ul><li #Title>title</li><li *for="item of Items" *key="item" #Row>{{item}}</li></ul>', {Items: ['b', 'a', 'c']});

		await tick();

		expect(texts(host.$Refs('Row'))).toEqual(['b', 'a', 'c']);
		expect(host.$Ref('Row').textContent).toBe('b');

		host.Items = ['c', 'd'];

		await tick();

		expect(texts(host.$Refs('row'))).toEqual(['c', 'd']);
		expect(host.$Refs('Row')).not.toBe(host.$Refs('Row'));
		expect(texts(host.$Refs('Title'))).toEqual(['title']);
		expect(host.$Refs('Nothing')).toEqual([]);
	});

	it('takes the content of an *if once shown and of a *for inside it, and leaves out the references of a child Component', async function () {
		var child = unique('RefsChild');
		var host;

		Elemenx.Component(child, {$Template: '<span #Cell>inner</span>'});

		host = mount('<div><b #Cell>own</b><section *if="Shown"><i *for="n of Numbers" #Cell>{{n}}</i></section><' + child + ' /></div>', {Shown: false, Numbers: [1, 2]});

		await tick();

		expect(texts(host.$Refs('Cell'))).toEqual(['own']);

		host.Shown = true;

		await tick();

		expect(texts(host.$Refs('Cell'))).toEqual(['own', '1', '2']);

		host.Shown = false;

		await tick();

		expect(texts(host.$Refs('Cell'))).toEqual(['own']);
	});

	/* A bug: #name on a Component tag named nothing ($Ref gave null), the tag gone; it names the root of the instance. */
	it('names the root of a Component by the #name of its tag, in a *for too', async function () {
		var child = unique('RefsKid');
		var host;

		Elemenx.Component(child, {$Template: '<b class="kid">{{Label}}</b>', Label: ''});

		host = mount('<div><' + child + ' #Kid Label="one" /><i *for="n of Numbers"><' + child + ' #Row [label]="n" /></i></div>', {Numbers: ['a', 'b']});

		await tick();

		expect(host.$Ref('Kid').className).toBe('kid');
		expect(host.$Ref('Kid').textContent).toBe('one');
		expect(texts(host.$Refs('Row'))).toEqual(['a', 'b']);
	});

	it('is there on a Component that is not loaded yet, empty until it is', async function () {
		var name = unique('RefsRemote');
		var factory = Elemenx.Component(name, {
			$TemplateURL: '/tests/public/refs/Refs.html'
		});
		var component = factory();

		owned.push(component);

		expect(component.$Refs('Item')).toEqual([]);

		document.getElementById('mount').appendChild(component.$Element());

		expect(await waitFor(function () {
			return component.$Refs('Item').length === 2;
		}, 5000)).toBe(true);
		expect(texts(component.$Refs('Item'))).toEqual(['one', 'two']);
	});
});
